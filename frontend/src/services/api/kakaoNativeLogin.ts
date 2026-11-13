/**
 * 카카오 네이티브 로그인 (React Native)
 *
 * @react-native-seoul/kakao-login 라이브러리 사용
 *
 * 설치 방법:
 * npm install @react-native-seoul/kakao-login
 *
 * iOS 설정:
 * 1. ios/Podfile에 추가:
 *    pod 'KakaoSDKCommon'
 *    pod 'KakaoSDKAuth'
 *    pod 'KakaoSDKUser'
 *
 * 2. ios/IExist/Info.plist에 추가:
 *    <key>CFBundleURLTypes</key>
 *    <array>
 *      <dict>
 *        <key>CFBundleTypeRole</key>
 *        <string>Editor</string>
 *        <key>CFBundleURLSchemes</key>
 *        <array>
 *          <string>kakao{NATIVE_APP_KEY}</string>
 *        </array>
 *      </dict>
 *    </array>
 *
 *    <key>KAKAO_APP_KEY</key>
 *    <string>{NATIVE_APP_KEY}</string>
 *
 *    <key>LSApplicationQueriesSchemes</key>
 *    <array>
 *      <string>kakaokompassauth</string>
 *      <string>kakaolink</string>
 *    </array>
 *
 * Android 설정:
 * 1. android/app/build.gradle에 추가:
 *    defaultConfig {
 *      manifestPlaceholders = [KAKAO_APP_KEY: "{NATIVE_APP_KEY}"]
 *    }
 *
 * 2. android/app/src/main/AndroidManifest.xml에 추가:
 *    <activity
 *      android:name="com.kakao.sdk.auth.AuthCodeHandlerActivity"
 *      android:exported="true">
 *      <intent-filter>
 *        <action android:name="android.intent.action.VIEW" />
 *        <category android:name="android.intent.category.DEFAULT" />
 *        <category android:name="android.intent.category.BROWSABLE" />
 *        <data
 *          android:host="oauth"
 *          android:scheme="kakao${KAKAO_APP_KEY}" />
 *      </intent-filter>
 *    </activity>
 */

 import { Alert } from 'react-native';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import apiClient from './client';
  import { authEvents, AUTH_EVENTS } from '../../utils/authEvents';
  import { showAlert } from '../../contexts/AlertContext';
  // Named imports 사용 - 패키지가 default export를 제공하지 않음
  import * as KakaoLogin from '@react-native-seoul/kakao-login';

  // 카카오 네이티브 앱 키
  const KAKAO_NATIVE_APP_KEY = '184257b4534e3e26b4d70dde7b44d91e';



export interface KakaoAuthResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    token: string;
    user: any;
  };
}


export const kakaoNativeLogin = async (): Promise<void> => {
  if (!KakaoLogin) {
    showAlert.error(
      '라이브러리 설치 필요',
      '카카오 로그인을 사용하려면 다음 라이브러리를 설치해야 합니다:\n\nnpm install @react-native-seoul/kakao-login\n\n설치 후 앱을 다시 빌드해주세요.'
    );
    return;
  }

  try {
    console.log('🔄 카카오 로그인 시작');

    // 카카오톡으로 로그인 시도 (앱이 설치된 경우)
    let result;
    try {
      result = await KakaoLogin.login();
    } catch (error: any) {
      // 사용자가 취소한 경우 조용히 리턴
      const errorMessage = error?.message || error?.toString() || '';
      if (
        errorMessage.includes('User denied access') ||
        errorMessage.includes('CANCELED') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('canceled')
      ) {
        console.log('ℹ️ 사용자가 카카오 로그인을 취소했습니다.');
        return;
      }

      // 카카오톡 앱이 없으면 웹 로그인으로 fallback
      console.log('⚠️ 카카오톡 앱 로그인 실패, 웹 로그인 시도');
      try {
        result = await KakaoLogin.loginWithKakaoAccount();
      } catch (webError: any) {
        // 웹 로그인에서도 사용자가 취소한 경우
        const webErrorMessage = webError?.message || webError?.toString() || '';
        if (
          webErrorMessage.includes('User denied access') ||
          webErrorMessage.includes('CANCELED') ||
          webErrorMessage.includes('cancelled') ||
          webErrorMessage.includes('canceled')
        ) {
          console.log('ℹ️ 사용자가 카카오 로그인을 취소했습니다.');
          return;
        }
        throw webError;
      }
    }

    console.log('✅ 카카오 인증 성공:', result);

    // 액세스 토큰 가져오기
    const accessToken = result.accessToken;

    if (!accessToken) {
      throw new Error('액세스 토큰을 받지 못했습니다.');
    }

    // 백엔드로 액세스 토큰 전송하여 JWT 받기
    console.log('🔄 백엔드 인증 시작');
    const response = await apiClient.post<KakaoAuthResponse>('/auth/kakao', {
      access_token: accessToken,
    });

    if (response.data.status === 'success' && response.data.data) {
      const { token, user } = response.data.data;

      // JWT 토큰과 사용자 정보 저장
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['user', JSON.stringify(user)],
      ]);

      console.log('✅ 카카오 로그인 완료:', user.email);

      // 로그인 이벤트 발생 -> AuthContext가 자동으로 상태 업데이트
      authEvents.emit(AUTH_EVENTS.LOGIN);

      showAlert.success('로그인 성공', `${user.nickname || user.username}님 환영합니다!`);
    } else {
      throw new Error(response.data.message || '로그인에 실패했습니다.');
    }
  } catch (error: any) {
    // 사용자가 취소한 경우 조용히 리턴 (최종 안전망)
    const errorMessage = error?.message || error?.toString() || '';
    if (
      errorMessage.includes('User denied access') ||
      errorMessage.includes('CANCELED') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('canceled')
    ) {
      console.log('ℹ️ 사용자가 카카오 로그인을 취소했습니다.');
      return;
    }

    console.error('❌ 카카오 로그인 오류:', error);
    showAlert.error(
      '로그인 실패',
      error.message || '카카오 로그인 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 카카오 로그아웃
 */
export const kakaoLogout = async (): Promise<void> => {
  if (!KakaoLogin) {
    console.warn('⚠️ 카카오 로그인 라이브러리가 없습니다.');
    return;
  }

  try {
    await KakaoLogin.logout();
    console.log('✅ 카카오 로그아웃 완료');
  } catch (error) {
    console.error('❌ 카카오 로그아웃 오류:', error);
  }
};

/**
 * 카카오 연결 해제 (회원탈퇴 시 사용)
 */
export const kakaoUnlink = async (): Promise<void> => {
  if (!KakaoLogin) {
    console.warn('⚠️ 카카오 로그인 라이브러리가 없습니다.');
    return;
  }

  try {
    await KakaoLogin.unlink();
    console.log('✅ 카카오 연결 해제 완료');
  } catch (error) {
    console.error('❌ 카카오 연결 해제 오류:', error);
  }
};

/**
 * 카카오 사용자 정보 가져오기
 */
export const getKakaoProfile = async (): Promise<any> => {
  if (!KakaoLogin) {
    throw new Error('카카오 로그인 라이브러리가 없습니다.');
  }

  try {
    const profile = await KakaoLogin.getProfile();
    console.log('✅ 카카오 프로필 조회 완료:', profile);
    return profile;
  } catch (error) {
    console.error('❌ 카카오 프로필 조회 오류:', error);
    throw error;
  }
};

export default {
    kakaoNativeLogin,
    kakaoLogout,
    kakaoUnlink,
    getKakaoProfile,
    KAKAO_NATIVE_APP_KEY,
  };
