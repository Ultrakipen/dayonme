import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import myDayService from '../services/api/myDayService';
import comfortWallService from '../services/api/comfortWallService';
import postService from '../services/api/postService';

// 쿼리 키
export const queryKeys = {
  myPosts: (tab: 'all' | 'myDay' | 'comfort') => ['myPosts', tab] as const,
  homePosts: ['homePosts'] as const,
  weeklyEmotions: (userId?: number) => ['weeklyEmotions', userId] as const,
  unreadCount: (userId?: number) => ['unreadCount', userId] as const,
};

// 나의 게시물 조회 (MyPostsScreen)
export const useMyPosts = (tab: 'all' | 'myDay' | 'comfort', userId?: number) => {
  return useQuery({
    queryKey: queryKeys.myPosts(tab),
    queryFn: async () => {
      if (!userId) throw new Error('로그인이 필요합니다.');

      const results = await Promise.allSettled([
        tab === 'all' || tab === 'myDay' ? myDayService.getMyPosts() : Promise.resolve(null),
        tab === 'all' || tab === 'comfort' ? comfortWallService.getMyPosts() : Promise.resolve(null),
      ]);

      const myDayData = results[0].status === 'fulfilled' && results[0].value
        ? results[0].value?.data?.data?.posts || results[0].value?.data?.posts || results[0].value?.data || []
        : [];

      const comfortData = results[1].status === 'fulfilled' && results[1].value
        ? results[1].value?.data?.data?.posts || results[1].value?.data?.posts || results[1].value?.data || []
        : [];

      return {
        myDayPosts: Array.isArray(myDayData) ? myDayData : [],
        comfortPosts: Array.isArray(comfortData) ? comfortData : [],
      };
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// 홈 게시물 조회 (HomeScreen)
export const useHomePosts = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.homePosts,
    queryFn: async () => {
      const [postsResponse, myDayResponse] = await Promise.allSettled([
        postService.getPosts({ page: 1, limit: 15, sort_by: 'latest' }),
        myDayService.getPosts({ page: 1, limit: 20 }),
      ]);

      const posts = postsResponse.status === 'fulfilled'
        ? postsResponse.value?.data?.posts || postsResponse.value?.data?.data?.posts || []
        : [];

      const myDayPosts = myDayResponse.status === 'fulfilled'
        ? myDayResponse.value?.data?.posts || myDayResponse.value?.data?.data?.posts || []
        : [];

      return { posts, myDayPosts };
    },
    enabled,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// 게시물 삭제
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, type }: { postId: number; type: 'myDay' | 'comfort' }) => {
      if (type === 'myDay') {
        return await myDayService.deletePost(postId);
      } else {
        return await comfortWallService.deletePost(postId);
      }
    },
    onSuccess: () => {
      // 모든 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['homePosts'] });
    },
  });
};

// 캐시 수동 무효화
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateMyPosts: (tab?: 'all' | 'myDay' | 'comfort') => {
      if (tab) {
        queryClient.invalidateQueries({ queryKey: queryKeys.myPosts(tab) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      }
    },
    invalidateHomePosts: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homePosts });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
};
