// src/services/api/naverAuth.ts - 네이버 로그인 (웹 기반)
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

// 네이버 OAuth 설정
const NAVER_CLIENT_ID = 'sdlZLc5BdOEm6UuMuGnH';
const NAVER_CLIENT_SECRET = 'TpnwOsEK61';
const NAVER_REDIRECT_URI = 'http://localhost:3001/auth/callback';

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
 * 네이버 OAuth 인증 URL 생성
 */
export const getNaverAuthUrl = (): string => {
  const state = Math.random().toString(36).substring(7); // CSRF 방지용 state
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NAVER_CLIENT_ID,
    redirect_uri: NAVER_REDIRECT_URI,
    state: state,
  });
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
};

/**
 * 네이버 로그인 처리
 * @param accessToken 네이버 액세스 토큰
 */
export const naverLogin = async (accessToken: string): Promise<NaverAuthResponse> => {
  try {
    const response = await apiClient.post<NaverAuthResponse>('/auth/naver', {
      access_token: accessToken,
    });

    if (response.data.status === 'success' && response.data.data) {
      const { token, user } = response.data.data;

      // 토큰과 사용자 정보 저장
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['user', JSON.stringify(user)],
      ]);

      console.log('✅ 네이버 로그인 성공:', user.email);
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ 네이버 로그인 실패:', error);
    throw error;
  }
};

/**
 * 네이버 로그인 시작 (네이티브 SDK 기반)
 */
export const startNaverLogin = async (navigation?: any): Promise<void> => {
  try {
    console.log('🔐 네이버 네이티브 로그인 시작...');

    // 네이티브 SDK를 동적으로 import
    const { naverNativeLogin } = await import('./naverNativeLogin');
    await naverNativeLogin();
  } catch (error: any) {
    console.error('❌ 네이버 로그인 시작 실패:', error.message);
  }
};

export default {
  getNaverAuthUrl,
  naverLogin,
  startNaverLogin,
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
};
