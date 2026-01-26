import { useInfiniteQuery } from '@tanstack/react-query';
import comfortWallService from '../../../services/api/comfortWallService';

interface UseInfiniteComfortPostsQueryOptions {
  selectedFilter: 'latest' | 'best';
  searchQuery?: string;
  selectedTag?: string;
  enabled?: boolean;
}

const INITIAL_PAGE_SIZE = 10;
const PAGE_SIZE = 20;

export const useInfiniteComfortPostsQuery = ({
  selectedFilter,
  searchQuery,
  selectedTag,
  enabled = true,
}: UseInfiniteComfortPostsQueryOptions) => {
  return useInfiniteQuery({
    queryKey: ['comfort-posts', selectedFilter, searchQuery, selectedTag],
    queryFn: async ({ pageParam = 1 }) => {
      const isFirstPage = pageParam === 1;

      const response = await comfortWallService.getPosts({
        page: pageParam,
        limit: isFirstPage ? INITIAL_PAGE_SIZE : PAGE_SIZE,
        sort_by: selectedFilter === 'latest' ? 'latest' : selectedFilter === 'best' ? 'popular' : 'latest',
        search: searchQuery || undefined,
        tag: selectedTag || undefined,
      });

      const posts = response.data?.data?.posts || [];

      return {
        posts,
        nextPage: posts.length === (isFirstPage ? INITIAL_PAGE_SIZE : PAGE_SIZE) ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 30 * 1000,      // 30초
    gcTime: 5 * 60 * 1000,     // 5분
    refetchOnMount: false,
    refetchOnWindowFocus: false,  // 화면 포커스 시 자동 refetch 방지
    refetchOnReconnect: false,    // 네트워크 재연결 시 자동 refetch 방지
    structuralSharing: true,      // 구조적 공유로 데이터 참조 안정성 보장 (깜빡임 방지)
    notifyOnChangeProps: ['data', 'error', 'isLoading'], // 실제 변경된 prop만 알림
    enabled,
  });
};
