import { useCallback } from 'react';
import { useCache } from './useCache';
import { ApiResponse } from '../types/api';

interface ApiQueryOptions {
  /** 캐시 유효 시간 (밀리초) */
  ttl?: number;
  /** 자동 로딩 여부 */
  autoLoad?: boolean;
  /** 에러 핸들링 함수 */
  onError?: (error: Error) => void;
  /** 성공 핸들링 함수 */
  onSuccess?: <T>(data: T) => void;
}

/**
 * API 요청을 캐싱하는 훅
 * @param endpoint API 엔드포인트
 * @param params API 파라미터 객체
 * @param options 캐시 옵션
 */
export function useCachedApiQuery<T = any, P = Record<string, any>>(
  endpoint: string,
  params?: P,
  options: ApiQueryOptions = {}
) {
  const { ttl, autoLoad = true, onError, onSuccess } = options;
  
  // API 요청 함수
  const fetchData = useCallback(async (): Promise<T> => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}` 
      : '';
    const response = await fetch(`${endpoint}${queryString}`);
    
    if (!response.ok) {
      throw new Error(`API 요청 오류: ${response.status}`);
    }
    
    const result = await response.json() as ApiResponse<T>;
    
    if (!result.success) {
      throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
    }
    
    // 성공 콜백
    if (onSuccess && result.data) {
      onSuccess(result.data);
    }
    
    // data가 없는 경우에 대한 처리 추가
    if (result.data === undefined) {
      throw new Error('API 응답에 데이터가 없습니다.');
    }
    
    return result.data;
  }, [endpoint, params, onSuccess]);
  
  // 캐시 키 생성
  const cacheKey = `api:${endpoint}:${JSON.stringify(params || {})}`;
  
  const { 
    data, 
    loading, 
    error, 
    refetch, 
    invalidateCache 
  } = useCache<T>(cacheKey, fetchData, { ttl, autoLoad });
  
  // 에러 핸들링
  if (error && onError) {
    onError(error);
  }
  
  return { 
    data, 
    loading, 
    error, 
    refetch, 
    invalidateCache 
  };
}