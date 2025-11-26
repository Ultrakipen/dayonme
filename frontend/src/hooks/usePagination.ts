// 무한 스크롤 페이지네이션 훅
import { useState, useCallback } from 'react';

interface UsePaginationProps<T> {
  initialData?: T[];
  pageSize?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  hasMore: boolean;
  paginatedData: T[];
  loadMore: () => void;
  reset: () => void;
  setAllData: (data: T[]) => void;
}

export function usePagination<T>({
  initialData = [],
  pageSize = 10,
}: UsePaginationProps<T> = {}): UsePaginationReturn<T> {
  const [allData, setAllData] = useState<T[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = allData.slice(0, currentPage * pageSize);
  const hasMore = paginatedData.length < allData.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    hasMore,
    paginatedData,
    loadMore,
    reset,
    setAllData,
  };
}
