// usePostsQuery.ts - React Query로 게시물 로딩 (캐싱 + 성능 최적화)
import { useQuery } from '@tanstack/react-query';
import postService from '../../../services/api/postService';
import myDayService from '../../../services/api/myDayService';
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

        // 병렬 요청
        const promises: Promise<any>[] = [
          postService.getPosts({ page: 1, limit: 15, sort_by: 'latest', ...(timestamp && { _t: timestamp } as any) }),
          myDayService.getPosts({ page: 1, limit: 20, ...(timestamp && { _t: timestamp } as any) }).catch(() => ({ data: { posts: [] } }))
        ];

        if (isAuthenticated) {
          promises.push(
            bookmarkService.getBookmarks({ postType: 'my_day' }).catch(() => ({ status: 'error', data: { bookmarks: [] } }))
          );
        }

        const responses = await Promise.all(promises);
        const [postsResponse, myDayResponse, bookmarksResponse] = responses;

        devLog('✅ API 응답 받음:', {
          postsStatus: postsResponse.data?.status,
          myDayStatus: myDayResponse?.data?.status,
          bookmarksStatus: bookmarksResponse?.status
        });

        // 북마크 처리
        let bookmarkedPostIds = new Set<number>();
        if (isAuthenticated && bookmarksResponse?.status === 'success') {
          const bookmarks = bookmarksResponse.data?.bookmarks || [];
          bookmarkedPostIds = new Set(
            bookmarks.filter((b: any) => b.post !== null).map((b: any) => b.post.post_id)
          );
        }

        // 게시물 파싱 (기존 loadPosts 로직 사용)
        let apiPosts: any[] = [];
        let myDayPosts: any[] = [];

        // 일반 게시물 처리
        if (postsResponse.data?.status === 'success') {
          if (postsResponse.data.data?.posts) {
            apiPosts = postsResponse.data.data.posts;
          } else if (postsResponse.data.data) {
            const singlePost = postsResponse.data.data;
            if (singlePost.post_id) {
              apiPosts = [singlePost];
            }
          }
        }
        // {posts: [...]} 구조 응답 (현재 백엔드 방식)
        else if (postsResponse.data && postsResponse.data.posts && Array.isArray(postsResponse.data.posts)) {
          apiPosts = postsResponse.data.posts;
        }
        // 직접 배열 응답
        else if (Array.isArray(postsResponse.data)) {
          apiPosts = postsResponse.data;
        }

        // MyDay 게시물 처리
        if (myDayResponse?.data?.status === 'success') {
          if (myDayResponse.data.data?.posts) {
            myDayPosts = myDayResponse.data.data.posts;
          } else if (myDayResponse.data.data) {
            myDayPosts = Array.isArray(myDayResponse.data.data) ? myDayResponse.data.data : [myDayResponse.data.data];
          }
        }
        else if (myDayResponse?.data?.posts && Array.isArray(myDayResponse.data.posts)) {
          myDayPosts = myDayResponse.data.posts;
        }
        else if (Array.isArray(myDayResponse?.data)) {
          myDayPosts = myDayResponse.data;
        }

        devLog('📋 파싱된 게시물:', {
          apiPosts: apiPosts.length,
          myDayPosts: myDayPosts.length
        });

        // 중복 제거
        const existingIds = new Set(apiPosts.map((p: any) => p.post_id));
        const uniqueMyDay = myDayPosts.filter((p: any) => !existingIds.has(p.post_id));

        // 변환
        const convertedMyDay = uniqueMyDay.map((p: any) => ({
          ...p,
          authorName: p.is_anonymous ? '익명' : (p.user?.nickname || '사용자'),
          image_url: p.image_url ? sanitizeUrl(p.image_url) : undefined,
          emotions: p.emotions || [],
        }));

        // 합치고 정렬
        const allPosts = [
          ...apiPosts.map((p: any) => ({ ...p, authorName: p.is_anonymous ? '익명' : (p.user?.nickname || '사용자') })),
          ...convertedMyDay
        ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        // 댓글 처리
        const displayPosts = await Promise.all(
          allPosts.map(async (post): Promise<any> => {
            try {
              let comments: any[] = [];
              try {
                const commentsResponse = await myDayService.getComments(post.post_id);
                if (commentsResponse?.status === 'success' && commentsResponse?.data?.comments) {
                  comments = commentsResponse.data.comments;
                } else if (Array.isArray(commentsResponse.data)) {
                  comments = commentsResponse.data;
                }
              } catch {}

              const processedComments = await processComments(post.post_id, comments);

              return {
                ...post,
                comments: processedComments,
                emotions: post.emotions || [],
                image_url: post.image_url ? sanitizeUrl(post.image_url) : undefined,
              };
            } catch {
              return null;
            }
          })
        );

        const validPosts = displayPosts.filter((p): p is any => p !== null);

        devLog('✅ usePostsQuery 완료:', {
          totalPosts: validPosts.length,
          bookmarks: bookmarkedPostIds.size
        });

        return {
          posts: validPosts,
          bookmarkedPostIds,
        };
      } catch (error: any) {
        devLog('게시물 로드 오류:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2, // 실패 시 2번 재시도
    retryDelay: 1000, // 재시도 간 1초 대기
  });
};
