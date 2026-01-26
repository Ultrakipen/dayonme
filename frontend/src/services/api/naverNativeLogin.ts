// src/services/api/naverNativeLogin.ts - 네이버 네이티브 SDK 로그인
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import Config from 'react-native-config';
import apiClient from './client';
import { authEvents, AUTH_EVENTS } from '../../utils/authEvents';
import { showAlert } from '../../contexts/AlertContext';

// 네이버 Native App 설정 (.env에서 로드, 없으면 하드코딩 값 사용)
const NAVER_CLIENT_ID = Config.NAVER_CLIENT_ID || 'lX6cDQ4s3ZncTBOWQZzu';
const NAVER_CLIENT_SECRET = Config.NAVER_CLIENT_SECRET || '0zHQPwjoB5';
const NAVER_APP_NAME = Config.NAVER_CLIENT_NAME || 'Dayonme';

export interface NaverAuthResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      nickname?: string;
      profileImage?: string;
    };
  };
}

/**
 * 네이버 SDK 동적 import (설치되지 않았을 경우 대비)
 */
let NaverLogin: any = null;
try {
  NaverLogin = require('@react-native-seoul/naver-login');
} catch (e) {
  if (__DEV__) console.log('네이버 로그인 SDK가 설치되지 않았습니다.');
}

/**
 * 네이버 SDK 초기화
 */
export const initNaverSDK = async (): Promise<boolean> => {
  if (!NaverLogin) {
    if (__DEV__) console.warn('네이버 로그인 SDK가 설치되지 않았습니다.');
    return false;
  }

  try {
    await NaverLogin.default.initialize({
      appName: NAVER_APP_NAME,
      consumerKey: NAVER_CLIENT_ID,
      consumerSecret: NAVER_CLIENT_SECRET,
      serviceUrlScheme: `naver${NAVER_CLIENT_ID}`, // iOS용
      disableNaverAppAuthIOS: true, // iOS에서 네이버 앱 미설치 시 웹뷰 사용
    });
    if (__DEV__) console.log('✅ 네이버 SDK 초기화 완료');
    return true;
  } catch (error) {
    if (__DEV__) console.error('❌ 네이버 SDK 초기화 실패:', error);
    return false;
  }
};

/**
 * 네이버 네이티브 로그인
 */
export const naverNativeLogin = async (): Promise<void> => {
  if (!NaverLogin) {
    showAlert.error(
      '네이버 로그인',
      '네이버 로그인 SDK가 설치되지 않았습니다.\n\n' +
      '설치 방법:\n' +
      'npm install @react-native-seoul/naver-login\n\n' +
      '웹 기반 로그인을 사용해주세요.'
    );
    return;
  }

  try {
    // SDK 초기화
    const initialized = await initNaverSDK();
    if (!initialized) {
      throw new Error('네이버 SDK 초기화 실패');
    }

    // 네이버 로그인 실행
    if (__DEV__) console.log('🔄 네이버 로그인 시도 중...');
    const result = await NaverLogin.default.login();

    // result 객체 유효성 검사
    if (!result) {
      if (__DEV__) console.log('⚠️ 네이버 로그인 결과가 없습니다.');
      return;
    }

    // 디버그: 전체 결과 로그
    if (__DEV__) console.log('📋 네이버 로그인 결과:', JSON.stringify(result, null, 2));

    if (!result.isSuccess) {
      // 사용자가 취소한 경우 조용히 리턴
      const errorMessage = result.failureResponse?.message || result.failureResponse?.lastErrorCode || '';
      const errorCode = result.failureResponse?.lastErrorCode || '';

      if (__DEV__) console.log('❌ 네이버 로그인 실패 상세:', {
        isSuccess: result.isSuccess,
        failureResponse: result.failureResponse,
        errorMessage,
        errorCode
      });

      if (
        errorMessage.includes('user_cancel') ||
        errorMessage.includes('CANCELED') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('canceled') ||
        errorMessage.includes('consent_cancelled') ||
        errorMessage.includes('동의 취소') ||
        errorCode === 'user_cancel' ||
        errorCode === 'consent_cancelled'
      ) {
        if (__DEV__) console.log('ℹ️ 사용자가 네이버 로그인을 취소했습니다.');
        return;
      }
      throw new Error(errorMessage || `로그인 실패 (코드: ${errorCode || 'unknown'})`);
    }

    const accessToken = result.successResponse?.accessToken;

    if (!accessToken) {
      if (__DEV__) console.log('⚠️ 액세스 토큰을 받지 못했습니다.');
      showAlert.error('로그인 실패', '네이버 인증에 실패했습니다.\n필수 정보 제공에 동의해주세요.');
      return;
    }

    if (__DEV__) console.log('✅ 네이버 로그인 성공, 액세스 토큰:', accessToken.substring(0, 20) + '...');

    // 백엔드로 액세스 토큰 전송하여 JWT 받기
    const response = await apiClient.post<NaverAuthResponse>('/auth/naver', {
      access_token: accessToken,
    });

    if (response.data.status === 'success' && response.data.data) {
      const { token, user } = response.data.data;

      // JWT 토큰과 사용자 정보 저장 (토큰은 암호화 저장소, 사용자 정보는 일반 저장소)
      await Promise.all([
        EncryptedStorage.setItem('authToken', token),
        AsyncStorage.setItem('user', JSON.stringify(user)),
      ]);

      if (__DEV__) console.log('✅ 네이버 로그인 완료 - 인증 상태 업데이트 이벤트 발생');

      // 로그인 이벤트 발생 -> AuthContext가 자동으로 상태 업데이트
      authEvents.emit(AUTH_EVENTS.LOGIN);

      // 닉네임이 naver_/kakao_로 시작하면 닉네임 생략
      const displayName = (user.nickname && !user.nickname.startsWith('naver_') && !user.nickname.startsWith('kakao_'))
        ? `${user.nickname}님 `
        : '';
      showAlert.success('로그인 성공', `${displayName}환영합니다!`);
    } else {
      throw new Error(response.data.message || '로그인 처리 중 오류가 발생했습니다.');
    }
  } catch (error: unknown) {
    // 사용자가 취소한 경우 조용히 리턴 (최종 안전망)
    const errorMessage = error?.message || error?.toString() || '';
    if (__DEV__) console.log('🔍 최종 에러 핸들러:', errorMessage);

    if (
      errorMessage.includes('user_cancel') ||
      errorMessage.includes('CANCELED') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('canceled') ||
      errorMessage.includes('consent_cancelled') ||
      errorMessage.includes('동의 취소')
    ) {
      if (__DEV__) console.log('ℹ️ 사용자가 네이버 로그인을 취소했습니다.');
      return;
    }

    if (__DEV__) console.error('❌ 네이버 로그인 실패:', error);

    // 사용자 친화적인 에러 메시지 변환
    let userMessage = '네이버 로그인 중 오류가 발생했습니다.';
    const errMsg = error?.message || error?.toString() || '';

    if (errMsg.includes('401') || errMsg.includes('status code 401')) {
      userMessage = '네이버 인증에 실패했습니다.\n잠시 후 다시 시도해주세요.';
    } else if (errMsg.includes('Network') || errMsg.includes('network')) {
      userMessage = '네트워크 연결을 확인해주세요.';
    } else if (errMsg.includes('timeout')) {
      userMessage = '요청 시간이 초과되었습니다.\n잠시 후 다시 시도해주세요.';
    } else if (errMsg.includes('액세스 토큰')) {
      // 이미 사용자 메시지가 표시되었으므로 중복 표시하지 않음
      return;
    }

    showAlert.error('로그인 실패', userMessage);
  }
};

/**
 * 네이버 로그아웃
 */
export const naverLogout = async (): Promise<void> => {
  if (!NaverLogin) {
    if (__DEV__) console.warn('네이버 로그인 SDK가 설치되지 않았습니다.');
    return;
  }

  try {
    await NaverLogin.default.logout();
    if (__DEV__) console.log('✅ 네이버 로그아웃 완료');
  } catch (error) {
    if (__DEV__) console.error('❌ 네이버 로그아웃 실패:', error);
  }
};

/**
 * 네이버 계정 연결 해제
 */
export const naverDeleteToken = async (): Promise<void> => {
  if (!NaverLogin) {
    if (__DEV__) console.warn('네이버 로그인 SDK가 설치되지 않았습니다.');
    return;
  }

  try {
    await NaverLogin.default.deleteToken();
    if (__DEV__) console.log('✅ 네이버 토큰 삭제 완료');
  } catch (error) {
    if (__DEV__) console.error('❌ 네이버 토큰 삭제 실패:', error);
  }
};

/**
 * 네이버 사용자 프로필 정보 가져오기
 */
export const getNaverProfile = async (): Promise<any> => {
  if (!NaverLogin) {
    if (__DEV__) console.warn('네이버 로그인 SDK가 설치되지 않았습니다.');
    return null;
  }

  try {
    const profileResult = await NaverLogin.default.getProfile(
      (await NaverLogin.default.login()).successResponse?.accessToken
    );

    if (profileResult.resultcode === '00') {
      return profileResult.response;
    } else {
      throw new Error('프로필 조회 실패');
    }
  } catch (error) {
    if (__DEV__) console.error('❌ 네이버 프로필 조회 실패:', error);
    return null;
  }
};

export default {
  initNaverSDK,
  naverNativeLogin,
  naverLogout,
  naverDeleteToken,
  getNaverProfile,
};

/**
 * ========================================
 * 네이버 네이티브 로그인 설정 가이드
 * ========================================
 *
 * 1. 라이브러리 설치
 *    npm install @react-native-seoul/naver-login
 *    cd ios && pod install && cd ..
 *
 * 2. iOS 설정
 *    파일: ios/IExist/Info.plist
 *
 *    <key>CFBundleURLTypes</key>
 *    <array>
 *      <dict>
 *        <key>CFBundleTypeRole</key>
 *        <string>Editor</string>
 *        <key>CFBundleURLSchemes</key>
 *        <array>
 *          <string>naverlX6cDQ4s3ZncTBOWQZzu</string>
 *        </array>
 *      </dict>
 *    </array>
 *
 *    <key>LSApplicationQueriesSchemes</key>
 *    <array>
 *      <string>naversearchapp</string>
 *      <string>naversearchthirdlogin</string>
 *    </array>
 *
 * 3. Android 설정
 *    파일: android/app/build.gradle
 *
 *    defaultConfig {
 *      manifestPlaceholders = [
 *        NAVER_CLIENT_ID: "lX6cDQ4s3ZncTBOWQZzu",
 *        NAVER_CLIENT_SECRET: "TpnwOsEK61",
 *        NAVER_CLIENT_NAME: "IExist"
 *      ]
 *    }
 *
 *    파일: android/app/src/main/AndroidManifest.xml
 *
 *    <application>
 *      <meta-data
 *        android:name="com.naver.sdk.ClientId"
 *        android:value="${NAVER_CLIENT_ID}" />
 *      <meta-data
 *        android:name="com.naver.sdk.ClientSecret"
 *        android:value="${NAVER_CLIENT_SECRET}" />
 *      <meta-data
 *        android:name="com.naver.sdk.ClientName"
 *        android:value="${NAVER_CLIENT_NAME}" />
 *    </application>
 *
 * 4. 사용 방법
 *    LoginScreen/RegisterScreen에서:
 *
 *    import { naverNativeLogin } from '../services/api/naverNativeLogin';
 *
 *    <TouchableWithoutFeedback onPress={naverNativeLogin}>
 *      네이버 로그인 버튼
 *    </TouchableWithoutFeedback>
 */
