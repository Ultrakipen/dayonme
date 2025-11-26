// src/utils/infiniteScroll.ts

import { useCallback, useEffect, useRef, useState } from 'react';

export interface InfiniteScrollConfig {
  threshold?: number;
  initialPage?: number;
  pageSize?: number;
  hasMore?: boolean;
  loading?: boolean;
}

export interface InfiniteScrollResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  loadMore: () => void;
  refresh: () => void;
  reset: () => void;
}

export function useInfiniteScroll<T>(
  fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  config: InfiniteScrollConfig = {}
): InfiniteScrollResult<T> {
  const {
    threshold = 0.1,
    initialPage = 1,
    pageSize = 20,
  } = config;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [refreshing, setRefreshing] = useState(false);

const isLoadingRef = useRef<boolean>(false);
const hasMoreRef = useRef<boolean>(true);

  const loadData = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (isLoadingRef.current || (!hasMoreRef.current && !reset)) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const result = await fetchFunction(pageNum, pageSize);
      
      setData(prevData => reset ? result.data : [...prevData, ...result.data]);
      setHasMore(result.hasMore);
      hasMoreRef.current = result.hasMore;
      
      if (!reset) {
        setPage(prevPage => prevPage + 1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('무한 스크롤 데이터 로드 오류:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  }, [fetchFunction, pageSize]);

  const loadMore = useCallback(() => {
    if (!isLoadingRef.current && hasMoreRef.current) {
      loadData(page);
    }
  }, [loadData, page]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setPage(initialPage);
    hasMoreRef.current = true;
    await loadData(initialPage, true);
  }, [loadData, initialPage]);

  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setHasMore(true);
    setPage(initialPage);
    hasMoreRef.current = true;
  }, [initialPage]);

  // 초기 데이터 로드
  useEffect(() => {
    loadData(initialPage, true);
  }, [loadData, initialPage]);

  return {
    data,
    loading: loading || refreshing,
    error,
    hasMore,
    page,
    loadMore,
    refresh,
    reset,
  };
}

// FlatList에서 사용할 수 있는 무한 스크롤 이벤트 핸들러
export const createInfiniteScrollHandlers = <T>(
  infiniteScrollResult: InfiniteScrollResult<T>
) => {
  const { loadMore, refresh, loading, hasMore } = infiniteScrollResult;

  return {
    onEndReached: () => {
      if (!loading && hasMore) {
        loadMore();
      }
    },
    onEndReachedThreshold: 0.1,
    onRefresh: refresh,
    refreshing: loading,
  };
};

// 스크롤 위치 기반 무한 스크롤 (ScrollView용)
export const useScrollBasedInfiniteScroll = <T>(
  fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  config: InfiniteScrollConfig = {}
) => {
  const infiniteScroll = useInfiniteScroll(fetchFunction, config);
  
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 20;
    
    const isCloseToBottom = 
      contentOffset.y + layoutMeasurement.height >= 
      contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && infiniteScroll.hasMore && !infiniteScroll.loading) {
      infiniteScroll.loadMore();
    }
  }, [infiniteScroll]);

  return {
    ...infiniteScroll,
    handleScroll,
  };
};

// 성능 최적화를 위한 디바운스된 무한 스크롤
export const useDebouncedInfiniteScroll = <T>(
  fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  config: InfiniteScrollConfig = {},
  debounceMs: number = 300
) => {
  const infiniteScroll = useInfiniteScroll(fetchFunction, config);
const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedLoadMore = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      infiniteScroll.loadMore();
    }, debounceMs);
  }, [infiniteScroll.loadMore, debounceMs]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    ...infiniteScroll,
    loadMore: debouncedLoadMore,
  };
};

// 데이터 캐싱을 위한 무한 스크롤
export const useCachedInfiniteScroll = <T extends { id?: number | string }>(
  fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  cacheKey: string,
  config: InfiniteScrollConfig = {}
) => {
  const [cache, setCache] = useState<Map<string, T[]>>(new Map());
  
  const cachedFetchFunction = useCallback(async (page: number, limit: number) => {
    const key = `${cacheKey}_${page}_${limit}`;
    
    if (cache.has(key)) {
      return {
        data: cache.get(key) || [],
        hasMore: true, // 캐시된 데이터의 경우 hasMore는 별도 관리 필요
      };
    }
    
    const result = await fetchFunction(page, limit);
    
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.set(key, result.data);
      return newCache;
    });
    
    return result;
  }, [fetchFunction, cacheKey, cache]);

  const infiniteScroll = useInfiniteScroll(cachedFetchFunction, config);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    ...infiniteScroll,
    clearCache,
  };
};