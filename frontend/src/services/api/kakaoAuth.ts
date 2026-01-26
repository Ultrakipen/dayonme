// 카카오 로그인 서비스
import { Linking } from 'react-native';
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KAKAO_CONFIG } from '../../config/secrets';

// 카카오 설정 (secrets.ts에서 가져옴)
const KAKAO_REST_API_KEY = KAKAO_CONFIG.REST_API_KEY;
const KAKAO_NATIVE_APP_KEY = KAKAO_CONFIG.NATIVE_APP_KEY;
const KAKAO_REDIRECT_URI = KAKAO_CONFIG.REDIRECT_URI;

export interface KakaoAuthResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    token: string;
    user: any;
  };
}

/**
 * 카카오 OAuth 로그인 URL 생성
 */
export const getKakaoAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: KAKAO_REDIRECT_URI,
    response_type: 'code',
  });

  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
};

/**
 * 카카오 인가 코드로 액세스 토큰 요청
 */
export const getKakaoAccessToken = async (code: string): Promise<string> => {
  try {
    const response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      }).toString(),
    });

    const data = await response.json();

    if (data.access_token) {
      return data.access_token;
    } else {
      throw new Error('액세스 토큰을 받지 못했습니다.');
    }
  } catch (error) {
    if (__DEV__) console.error('카카오 액세스 토큰 요청 실패:', error);
    throw error;
  }
};

/**
 * 백엔드에 카카오 액세스 토큰 전송하여 JWT 토큰 받기
 */
export const kakaoLogin = async (accessToken: string): Promise<KakaoAuthResponse> => {
  try {
    if (__DEV__) console.log('🔄 카카오 로그인 시도');
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

      if (__DEV__) console.log('✅ 카카오 로그인 성공:', user.email);
    }

    return response.data;
  } catch (error: unknown) {
    if (__DEV__) console.error('❌ 카카오 로그인 오류:', error);
    throw error.response?.data || {
      status: 'error',
      message: '카카오 로그인에 실패했습니다.',
    };
  }
};

/**
 * 웹 브라우저에서 카카오 로그인 시작
 * (React Native에서는 WebView나 Linking 사용)
 */
export const startKakaoLogin = async (): Promise<void> => {
  try {
    const authUrl = getKakaoAuthUrl();
    if (__DEV__) console.log('🔐 카카오 로그인 시작...' , authUrl);
    await Linking.openURL(authUrl);
    if (__DEV__) console.log('✅ 카카오 로그인 페이지 열림');
  } catch (error: unknown) {
    if (__DEV__) console.error('❌ 카카오 로그인 시작 실패:', error.message);
  }
};

export default {
  getKakaoAuthUrl,
  getKakaoAccessToken,
  kakaoLogin,
  startKakaoLogin,
};
