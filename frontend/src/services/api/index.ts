// src/services/api/index.ts
// API 서비스들을 통합하여 export

// 클라이언트
export { default as apiClient } from './client';
export { dedupeGet, invalidateCache } from './apiClient';

// 요청 큐 및 중복 요청 제거
export { requestQueue, requestDeduplicator } from './requestQueue';

// 타입 정의
export * from './types';

// 감정 서비스 (실제 존재하는 서비스만 export)
export { default as emotionService } from './emotionService';
export type { 
  Emotion, 
  EmotionCreateDTO 
} from './emotionService';

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VALIDATE: '/protected-route',
  },
  USERS: {
    PROFILE: '/users/profile',
    STATS: '/stats/user',
    BLOCK: '/users/block',
    NOTIFICATION_SETTINGS: '/users/notification-settings',
  },
  EMOTIONS: {
    LIST: '/emotions',
    LOG: '/emotions/log',
    LOGS: '/emotions/logs',
    STATS: '/stats/emotions',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    READ: '/notifications/read',
    READ_ALL: '/notifications/read-all',
    UNREAD_COUNT: '/notifications/unread-count',
  },
};

// 공통 응답 타입
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 에러 타입
export interface ApiError {
  status: 'error';
  message: string;
  code?: string;
  details?: any;
}