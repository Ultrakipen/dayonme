import { useQuery } from '@tanstack/react-query';
import comfortWallService from '../../../services/api/comfortWallService';

interface UseMyComfortPostsQueryOptions {
  enabled?: boolean;
}

export const useMyComfortPostsQuery = ({ enabled = true }: UseMyComfortPostsQueryOptions = {}) => {
  return useQuery({
    queryKey: ['comfort-my-posts'],
    queryFn: async () => {
      const response = await comfortWallService.getMyRecentPosts();
      return response.data?.data?.posts || [];
    },
    enabled,
    staleTime: 30 * 1000,      // 30초
    gcTime: 5 * 60 * 1000,     // 5분
    refetchOnMount: false,
    refetchOnWindowFocus: false,  // 화면 포커스 시 자동 refetch 방지
    refetchOnReconnect: false,    // 네트워크 재연결 시 자동 refetch 방지
  });
};
