import { useInfiniteQuery } from '@tanstack/react-query';
import challengeService from '../../../services/api/challengeService';

interface SearchFilter {
  query: string;
  category: string;
  sortBy: string;
  showCompleted: boolean;
  tags?: string[];
}

interface UseInfiniteChallengesQueryOptions {
  activeTab: 'hot' | 'all' | 'my';
  allStatusFilter?: 'active' | 'completed';
  searchFilter: SearchFilter;
  enabled?: boolean;
}

const INITIAL_PAGE_SIZE = 10;
const PAGE_SIZE = 20;

export const useInfiniteChallengesQuery = ({
  activeTab,
  allStatusFilter = 'active',
  searchFilter,
  enabled = true,
}: UseInfiniteChallengesQueryOptions) => {
  return useInfiniteQuery({
    queryKey: ['challenges', activeTab, allStatusFilter, searchFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const isFirstPage = pageParam === 1;

      // 백엔드 API 파라미터 매핑
      const requestParams: any = {
        page: pageParam,
        limit: isFirstPage ? INITIAL_PAGE_SIZE : PAGE_SIZE,
        query: searchFilter.query,
        category: searchFilter.category,
        status: activeTab === 'all'
          ? allStatusFilter
          : (activeTab === 'hot' ? 'active' : undefined),
        sort_by: (searchFilter.sortBy === 'latest' ? 'created_at' :
                 searchFilter.sortBy === 'popular' ? 'popular' :
                 searchFilter.sortBy === 'recommended' ? 'like_count' :
                 searchFilter.sortBy === 'ending_soon' ? 'ending_soon' : 'created_at'),
        order: searchFilter.sortBy === 'ending_soon' ? 'asc' : 'desc',
        tags: searchFilter.tags
      };

      // undefined 값 제거
      Object.keys(requestParams).forEach(key => {
        if (requestParams[key] === undefined) {
          delete requestParams[key];
        }
      });

      const response = await challengeService.getChallenges(requestParams);
      const responseData = response.data;
      const challenges = Array.isArray(responseData) ? responseData : (responseData.data || []);

      return {
        challenges,
        nextPage: challenges.length === (isFirstPage ? INITIAL_PAGE_SIZE : PAGE_SIZE) ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 30 * 1000,      // 30초 - 백엔드 캐싱과 동기화
    gcTime: 5 * 60 * 1000,     // 5분
    refetchOnMount: false,
    enabled,
  });
};
