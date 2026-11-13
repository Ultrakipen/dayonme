// usePostsQuery.ts - React Query로 게시물 로딩 (캐싱 + 성능 최적화)
import { useQuery } from '@tanstack/react-query';
import postService from '../../../services/api/postService';
import bookmarkService from '../../../services/api/bookmarkService';
import { sanitizeUrl } from '../../../utils/validation';
import { devLog } from '../../../utils/security';

interface FetchPostsParams {
  isAuthenticated: boolean;
  processComments: (postId: number, comments: any[]) => Promise<any[]>;
}

export const usePostsQuery = ({ isAuthenticated, processComments }: FetchPostsParams) => {
  return useQuery({
    queryKey: ['posts', isAuthenticated],
    queryFn: async () => {
      try {
        const timestamp = Date.now();

        // 병렬 요청 (/posts API만 사용 - /my-day/posts와 같은 테이블이므로 중복 방지)
        const promises: Promise<any>[] = [
          postService.getPosts({ page: 1, limit: 20, sort_by: 'latest', ...(timestamp && { _t: timestamp } as any) }),
        ];

        if (isAuthenticated) {
          promises.push(
            bookmarkService.getBookmarks({ postType: 'my_day' }).catch((err) => {
              console.warn('⚠️ 북마크 조회 실패 (무시하고 계속):', err.message);
              return { status: 'success', data: { bookmarks: [] } };
            })
          );
        }

        const responses = await Promise.all(promises);
        const [postsResponse, bookmarksResponse] = responses;

        devLog('✅ API 응답 받음:', { postsStatus: postsResponse?.status });

        // 북마크 처리
        let bookmarkedPostIds = new Set<number>();
        if (isAuthenticated && bookmarksResponse?.status === 'success') {
          const bookmarks = bookmarksResponse.data?.bookmarks || [];
          bookmarkedPostIds = new Set(
            bookmarks.filter((b: any) => b.post !== null).map((b: any) => b.post.post_id)
          );
        }

        // 게시물 파싱
        let apiPosts: any[] = [];

        if (postsResponse?.status === 'success' && Array.isArray(postsResponse.data?.posts)) {
          apiPosts = postsResponse.data.posts;
        } else if (Array.isArray(postsResponse?.data)) {
          apiPosts = postsResponse.data;
        }

        devLog('📋 파싱된 게시물:', { apiPosts: apiPosts.length });

        // 변환 및 정렬
        const allPosts = apiPosts
          .map((p: any) => ({
            ...p,
            authorName: p.is_anonymous ? '익명' : (p.user?.nickname || '사용자'),
            image_url: p.image_url ? sanitizeUrl(p.image_url) : undefined,
            emotions: p.emotions || [],
          }))
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        // 댓글은 게시물 클릭 시 로드 (초기 로딩 성능 최적화)
        const displayPosts = allPosts.map((post): any => {
          return {
            ...post,
            comments: [], // 댓글은 상세 화면에서 로드
            emotions: post.emotions || [],
            image_url: post.image_url ? sanitizeUrl(post.image_url) : undefined,
          };
        });

        devLog('✅ usePostsQuery 완료:', {
          totalPosts: displayPosts.length,
          bookmarks: bookmarkedPostIds.size
        });

        return {
          posts: displayPosts,
          bookmarkedPostIds,
        };
      } catch (error: any) {
        devLog('게시물 로드 오류:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30초간 fresh 유지 (불필요한 재로딩 방지)
    gcTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
    refetchOnMount: false, // 마운트 시 재로딩 방지
    retry: 1, // 실패 시 1번만 재시도
    retryDelay: 500, // 재시도 간 0.5초 대기
  });
};
