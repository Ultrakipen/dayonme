// src/utils/searchDebounce.ts

import { useCallback, useEffect, useRef, useState } from 'react';

export interface DebouncedSearchConfig {
  delay?: number;
  minLength?: number;
  immediate?: boolean;
}

export interface DebouncedSearchResult<T> {
  query: string;
  debouncedQuery: string;
  results: T[];
  loading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  clearResults: () => void;
  search: (query: string) => Promise<void>;
}

// 기본 디바운스 훅
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// 검색 전용 디바운스 훅
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  config: DebouncedSearchConfig = {}
): DebouncedSearchResult<T> {
  const {
    delay = 300,
    minLength = 2,
    immediate = false,
  } = config;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, delay);
const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const abortControllerRef = useRef<AbortController | null>(null);

// cleanup 함수 수정
useEffect(() => {
  return () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minLength) {
      setResults([]);
      setError(null);
      return;
    }

    try {
      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      setError(null);

      const searchResults = await searchFunction(searchQuery);
      
      // 요청이 취소되지 않았다면 결과 설정
      if (!abortControllerRef.current.signal.aborted) {
        setResults(searchResults);
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.';
        setError(errorMessage);
        setResults([]);
        if (__DEV__) console.error('검색 오류:', err);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [searchFunction, minLength]);

  const manualSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    await performSearch(searchQuery);
  }, [performSearch]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setQuery('');
  }, []);

  // 디바운스된 쿼리 변경 시 검색 실행
  useEffect(() => {
    if (debouncedQuery || immediate) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery, performSearch, immediate]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    debouncedQuery,
    results,
    loading,
    error,
    setQuery,
    clearResults,
    search: manualSearch,
  };
}

// 자동완성 전용 디바운스 훅
export function useDebouncedAutoComplete<T>(
  autoCompleteFunction: (query: string) => Promise<T[]>,
  config: DebouncedSearchConfig & { maxSuggestions?: number } = {}
) {
  const {
    delay = 150,
    minLength = 1,
    maxSuggestions = 10,
  } = config;

  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchResult = useDebouncedSearch(autoCompleteFunction, {
    delay,
    minLength,
    immediate: false,
  });

  useEffect(() => {
    const limitedSuggestions = searchResult.results.slice(0, maxSuggestions);
    setSuggestions(limitedSuggestions);
    setShowSuggestions(searchResult.query.length >= minLength && limitedSuggestions.length > 0);
  }, [searchResult.results, searchResult.query, minLength, maxSuggestions]);

  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  const selectSuggestion = useCallback((suggestion: T) => {
    hideSuggestions();
    // 선택된 제안을 쿼리로 설정하는 로직은 사용하는 곳에서 구현
  }, [hideSuggestions]);

  return {
    ...searchResult,
    suggestions,
    showSuggestions,
    hideSuggestions,
    selectSuggestion,
  };
}

// 검색 히스토리 관리 훅
export function useSearchHistory(maxHistoryCount: number = 10) {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      const updated = [query, ...filtered];
      return updated.slice(0, maxHistoryCount);
    });
  }, [maxHistoryCount]);

  const removeFromHistory = useCallback((query: string) => {
    setSearchHistory(prev => prev.filter(item => item !== query));
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}

// 고급 검색 필터 디바운스 훅
export function useDebouncedFilters<T extends Record<string, any>>(
  initialFilters: T,
  delay: number = 500
) {
  const [filters, setFilters] = useState<T>(initialFilters);
  const debouncedFilters = useDebounce(filters, delay);

  const updateFilter = useCallback((key: keyof T, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    debouncedFilters,
    updateFilter,
    updateFilters,
    resetFilters,
  };
}

// 텍스트 하이라이팅 유틸리티
export function highlightSearchText(text: string, searchQuery: string): string {
  if (!searchQuery.trim()) return text;

  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// 검색 결과 정렬 유틸리티
export function sortSearchResults<T>(
  results: T[],
  query: string,
  getSearchableText: (item: T) => string,
  sortBy: 'relevance' | 'date' | 'popularity' = 'relevance'
): T[] {
  if (sortBy === 'relevance') {
    return results.sort((a, b) => {
      const aText = getSearchableText(a).toLowerCase();
      const bText = getSearchableText(b).toLowerCase();
      const queryLower = query.toLowerCase();

      // 정확한 매치가 우선
      const aExact = aText.includes(queryLower) ? 1 : 0;
      const bExact = bText.includes(queryLower) ? 1 : 0;
      
      if (aExact !== bExact) {
        return bExact - aExact;
      }

      // 시작 부분 매치가 그 다음 우선
      const aStartsWith = aText.startsWith(queryLower) ? 1 : 0;
      const bStartsWith = bText.startsWith(queryLower) ? 1 : 0;
      
      return bStartsWith - aStartsWith;
    });
  }

  // 다른 정렬 방식은 사용하는 곳에서 구현
  return results;
}