import { useInfiniteQuery } from '@tanstack/react-query';
import challengeService from '../../services/api/challengeService';

interface UseInfiniteChallengesParams {
  sort_by?: string;
  status?: string;
  search?: string;
  weeklyHot?: boolean;
}

export const useInfiniteChallenges = (params: UseInfiniteChallengesParams = {}) => {
  return useInfiniteQuery({
    queryKey: ['challenges', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await challengeService.getChallenges({
        page: pageParam,
        limit: 20,
        ...params,
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.pagination || {};
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
  });
};
