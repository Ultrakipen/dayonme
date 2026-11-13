// src/services/api/apiClient.ts
import axios, { AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config/api';
import { authEvents, AUTH_EVENTS } from '../../utils/authEvents';
import logger from '../../utils/logger';
import { requestDeduplicator } from './requestQueue';

// API 클라이언트 기본 설정
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.TIMEOUT,
});

// 요청 인터셉터 설정 (인증 토큰 추가)
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      logger.debug(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    } catch (error) {
      logger.error('API 인터셉터 오류:', error);
      return config;
    }
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정 (에러 처리 개선)
apiClient.interceptors.response.use(
  (response: any) => {
    logger.debug(`API 성공: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url;

    // 보안: 에러 메시지만 로깅 (민감 정보 노출 방지)
    const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류';
    logger.error(`API 오류: ${originalRequest?.method?.toUpperCase()} ${url} - ${status}`, errorMessage);

    // 401 에러 처리 (토큰 만료 등)
    if (status === 401) {
      logger.warn('401 오류: 인증 실패');

      // 특정 엔드포인트는 401이 정상적인 응답인 경우 (로그인, 회원가입, 비밀번호 변경 등)
      const authEndpoints = ['/auth/login', '/auth/register', '/auth/validate', '/users/password'];
      const isAuthEndpoint = authEndpoints.some(endpoint => url?.includes(endpoint));

      if (!isAuthEndpoint) {
        // 토큰이 있는 경우에만 토큰 만료로 처리 (비로그인 사용자의 401은 무시)
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          // 인증이 필요한 엔드포인트에서 401 발생 시 AuthContext에 이벤트 전송
          // AsyncStorage 클리어는 AuthContext에서 처리하여 타이밍 이슈 방지
          logger.warn('401 에러 - AuthContext에 토큰 만료 이벤트 전송');
          authEvents.emit(AUTH_EVENTS.TOKEN_EXPIRED);
        } else {
          logger.debug('비로그인 사용자의 401 오류 (정상)');
        }
      }
    }

    // 다른 오류들 처리 (개발 환경에서만 상세 로깅)
    if (status >= 500) {
      logger.error('서버 오류:', errorMessage);
    } else if (status >= 400) {
      logger.warn('클라이언트 오류:', errorMessage);
    }

    return Promise.reject(error);
  }
);

/**
 * 중복 요청이 제거된 GET 요청
 * 동일한 URL로 진행 중인 요청이 있으면 기존 Promise 반환
 */
export const dedupeGet = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const key = `GET:${url}${config?.params ? JSON.stringify(config.params) : ''}`;
  return requestDeduplicator.dedupe(key, () => apiClient.get<T>(url, config).then(res => res.data));
};

/**
 * 캐시 무효화 헬퍼
 */
export const invalidateCache = (pattern: string): void => {
  requestDeduplicator.invalidatePattern(pattern);
};

export default apiClient;