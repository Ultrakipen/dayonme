import { useQuery } from '@tanstack/react-query';
import comfortWallService from '../../../services/api/comfortWallService';

export const useBestComfortPostsQuery = () => {
  return useQuery({
    queryKey: ['comfort-best-posts'],
    queryFn: async () => {
      const response = await comfortWallService.getBestPosts({ period: 'weekly' });
      return response.data?.data?.posts || [];
    },
    staleTime: 60 * 1000,      // 베스트 게시물은 1분 캐싱
    gcTime: 10 * 60 * 1000,    // 10분
    refetchOnMount: false,
    refetchOnWindowFocus: false,  // 화면 포커스 시 자동 refetch 방지
    refetchOnReconnect: false,    // 네트워크 재연결 시 자동 refetch 방지
  });
};
