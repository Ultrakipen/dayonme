import { useState, useEffect, useCallback } from 'react';
import { globalCache, MemoryCache } from '../utils/cache';

interface UseCacheOptions {
  /** 캐시 유효 시간 (밀리초) */
  ttl?: number;
  /** 자동 로딩 여부 */
  autoLoad?: boolean;
  /** 특정 캐시 인스턴스 사용 (기본값: globalCache) */
  cacheInstance?: MemoryCache;
}

/**
 * 데이터 캐싱 및 불러오기를 위한 훅
 * @param key 캐시 키
 * @param fetchFn 데이터 불러오는 함수
 * @param options 캐시 옵션
 */
export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    ttl,
    autoLoad = true,
    cacheInstance = globalCache
  } = options;

  const [data, setData] = useState<T | undefined>(cacheInstance.get<T>(key));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // 데이터 불러오기 함수
  const fetchData = useCallback(async (force = false) => {
    // 캐시에 있고 강제 갱신이 아니면 캐시 데이터 사용
    if (!force && cacheInstance.get<T>(key)) {
      setData(cacheInstance.get<T>(key));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      cacheInstance.set(key, result, ttl);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(undefined);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl, cacheInstance]);

  // 캐시 강제 갱신
  const invalidateCache = useCallback(() => {
    cacheInstance.delete(key);
    fetchData(true);
  }, [key, fetchData, cacheInstance]);

  // 컴포넌트 마운트 시 자동 로딩
  useEffect(() => {
    if (autoLoad) {
      fetchData();
    }
  }, [autoLoad, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidateCache
  };
}