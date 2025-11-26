// src/config/api.ts
import { Platform } from 'react-native';

/**
 * API 설정
 * 환경별 URL 직접 설정
 */

// 프로덕션 API URL (배포 시 변경)
const PRODUCTION_API_URL = 'https://your-production-api.com/api';

// 개발/프로덕션 환경별 Base URL
const getBaseURL = (): string => {
  if (__DEV__) {
    // 기본 개발 URL
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001/api'; // Android 에뮬레이터
    }
    return 'http://localhost:3001/api'; // iOS 시뮬레이터
  }

  // 프로덕션 환경
  return PRODUCTION_API_URL;
};

// 프로덕션 설정 검증
export const validateApiConfig = (): boolean => {
  if (!__DEV__) {
    if (!PRODUCTION_API_URL || PRODUCTION_API_URL === 'https://your-production-api.com/api') {
      console.error('🚨 프로덕션 API URL이 설정되지 않았습니다');
      return false;
    }
    if (!PRODUCTION_API_URL.startsWith('https://')) {
      console.error('🚨 프로덕션 API는 HTTPS를 사용해야 합니다');
      return false;
    }
  }
  return true;
};

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
