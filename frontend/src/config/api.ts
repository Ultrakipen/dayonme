// src/config/api.ts
import { Platform } from 'react-native';

/**
 * API 설정
 * 환경별 URL 직접 설정
 */

// API URL (환경별 분리)
const PRODUCTION_API_URL = 'https://dayonme.com/api';
// 백엔드는 실제 서버에서 실행 중이므로 개발 환경에서도 프로덕션 URL 사용
const DEVELOPMENT_API_URL = 'https://dayonme.com/api';

// 개발/프로덕션 환경별 Base URL
const getBaseURL = (): string => {
  return __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;
};

// 프로덕션 설정 검증
export const validateApiConfig = (): boolean => {
  if (!PRODUCTION_API_URL) {
    if (__DEV__) console.error('🚨 API URL이 설정되지 않았습니다');
    return false;
  }
  return true;
};

// Base URL export (이미지 URL 변환용)
export const API_BASE_URL = getBaseURL().replace('/api', '');

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 30000,

  ENDPOINTS: {
    // 인증 관련
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',

    // 감정 관련
    EMOTIONS: '/emotions',
    LOG_EMOTION: '/emotions/log',

    // 게시물 관련
    MY_DAY_POSTS: '/posts/my-day',
    SOMEONE_DAY_POSTS: '/posts/someone-day',
    POST_COMMENTS: '/posts/comments',
    POST_LIKES: '/posts/likes',

    // 사용자 관련
    USER_PROFILE: '/users/profile',
    USER_STATS: '/users/stats',

    // 챌린지 관련
    CHALLENGES: '/challenges',
    CHALLENGE_PARTICIPATE: '/challenges/participate',
  }
};

// API 요청 헤더 설정
export const getApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};
