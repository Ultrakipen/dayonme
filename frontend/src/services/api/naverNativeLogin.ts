// src/services/api/naverNativeLogin.ts - 네이버 네이티브 SDK 로그인
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import { authEvents, AUTH_EVENTS } from '../../utils/authEvents';
import { showAlert } from '../../contexts/AlertContext';

// 네이버 Native App 설정
const NAVER_CLIENT_ID = 'sdlZLc5BdOEm6UuMuGnH';
const NAVER_CLIENT_SECRET = 'TpnwOsEK61';
const NAVER_APP_NAME = 'Dayonme';

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
  console.log('네이버 로그인 SDK가 설치되지 않았습니다.');
}

/**
 * 네이버 SDK 초기화
 */
export const initNaverSDK = async (): Promise<boolean> => {
  if (!NaverLogin) {
    console.warn('네이버 로그인 SDK가 설치되지 않았습니다.');
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
    console.log('✅ 네이버 SDK 초기화 완료');
    return true;
  } catch (error) {
    console.error('❌ 네이버 SDK 초기화 실패:', error);
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
    const result = await NaverLogin.default.login();

    if (!result.isSuccess) {
      // 사용자가 취소한 경우 조용히 리턴
      const errorMessage = result.failureResponse?.message || '';
      if (
        errorMessage.includes('user_cancel') ||
        errorMessage.includes('CANCELED') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('canceled')
      ) {
        console.log('ℹ️ 사용자가 네이버 로그인을 취소했습니다.');
        return;
      }
      throw new Error(errorMessage || '로그인 실패');
    }

    const accessToken = result.successResponse?.accessToken;

    if (!accessToken) {
      throw new Error('액세스 토큰을 받지 못했습니다.');
    }

    console.log('✅ 네이버 로그인 성공, 액세스 토큰:', accessToken.substring(0, 20) + '...');

    // 백엔드로 액세스 토큰 전송하여 JWT 받기
    const response = await apiClient.post<NaverAuthResponse>('/auth/naver', {
      access_token: accessToken,
    });

    if (response.data.status === 'success' && response.data.data) {
      const { token, user } = response.data.data;

      // JWT 토큰과 사용자 정보 저장
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['user', JSON.stringify(user)],
      ]);

      console.log('✅ 네이버 로그인 완료 - 인증 상태 업데이트 이벤트 발생');

      // 로그인 이벤트 발생 -> AuthContext가 자동으로 상태 업데이트
      authEvents.emit(AUTH_EVENTS.LOGIN);

      showAlert.success('로그인 성공', `${user.nickname || user.username}님 환영합니다!`);
    } else {
      throw new Error(response.data.message || '로그인 처리 중 오류가 발생했습니다.');
    }
  } catch (error: any) {
    // 사용자가 취소한 경우 조용히 리턴 (최종 안전망)
    const errorMessage = error?.message || error?.toString() || '';
    if (
      errorMessage.includes('user_cancel') ||
      errorMessage.includes('CANCELED') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('canceled')
    ) {
      console.log('ℹ️ 사용자가 네이버 로그인을 취소했습니다.');
      return;
    }

    console.error('❌ 네이버 로그인 실패:', error);
    showAlert.error(
      '로그인 실패',
      error.message || '네이버 로그인 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 네이버 로그아웃
 */
export const naverLogout = async (): Promise<void> => {
  if (!NaverLogin) {
    console.warn('네이버 로그인 SDK가 설치되지 않았습니다.');
    return;
  }

  try {
    await NaverLogin.default.logout();
    console.log('✅ 네이버 로그아웃 완료');
  } catch (error) {
    console.error('❌ 네이버 로그아웃 실패:', error);
  }
};

/**
 * 네이버 계정 연결 해제
 */
export const naverDeleteToken = async (): Promise<void> => {
  if (!NaverLogin) {
    console.warn('네이버 로그인 SDK가 설치되지 않았습니다.');
    return;
  }

  try {
    await NaverLogin.default.deleteToken();
    console.log('✅ 네이버 토큰 삭제 완료');
  } catch (error) {
    console.error('❌ 네이버 토큰 삭제 실패:', error);
  }
};

/**
 * 네이버 사용자 프로필 정보 가져오기
 */
export const getNaverProfile = async (): Promise<any> => {
  if (!NaverLogin) {
    console.warn('네이버 로그인 SDK가 설치되지 않았습니다.');
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
    console.error('❌ 네이버 프로필 조회 실패:', error);
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
 *          <string>naversdlZLc5BdOEm6UuMuGnH</string>
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
 *        NAVER_CLIENT_ID: "sdlZLc5BdOEm6UuMuGnH",
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
