// useInfinitePostsQuery.ts - 무한 스크롤을 위한 React Query (성능 최적화)
import { useInfiniteQuery } from '@tanstack/react-query';
import postService from '../../../services/api/postService';
import myDayService from '../../../services/api/myDayService';
import bookmarkService from '../../../services/api/bookmarkService';
import { sanitizeUrl } from '../../../utils/validation';
import { devLog } from '../../../utils/security';

interface FetchPostsParams {
  isAuthenticated: boolean;
  processComments: (postId: number, comments: any[]) => Promise<any[]>;
}

const INITIAL_PAGE_SIZE = 5; // 초기 5개만 로드
const PAGE_SIZE = 10; // 이후 10개씩 로드

export const useInfinitePostsQuery = ({ isAuthenticated, processComments }: FetchPostsParams) => {
  return useInfiniteQuery({
    queryKey: ['infinite-posts', isAuthenticated],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const timestamp = Date.now();
        const limit = pageParam === 1 ? INITIAL_PAGE_SIZE : PAGE_SIZE;

        devLog('📄 페이지 로드:', { page: pageParam, limit });

        // 병렬 요청
        const promises: Promise<any>[] = [
          postService.getPosts({ page: pageParam, limit, sort_by: 'latest', ...(timestamp && { _t: timestamp } as any) }),
          myDayService.getPosts({ page: pageParam, limit, ...(timestamp && { _t: timestamp } as any) }).catch(() => ({ data: { posts: [] } }))
        ];

        // 첫 페이지에서만 북마크 로드
        if (pageParam === 1 && isAuthenticated) {
          promises.push(
            bookmarkService.getBookmarks({ postType: 'my_day' }).catch(() => ({ status: 'error', data: { bookmarks: [] } }))
          );
        }

        const responses = await Promise.all(promises);
        const [postsResponse, myDayResponse, bookmarksResponse] = responses;

        // 북마크 처리 (첫 페이지만)
        let bookmarkedPostIds = new Set<number>();
        if (pageParam === 1 && isAuthenticated && bookmarksResponse?.status === 'success') {
          const bookmarks = bookmarksResponse.data?.bookmarks || [];
          bookmarkedPostIds = new Set(
            bookmarks.filter((b: any) => b.post !== null).map((b: any) => b.post.post_id)
          );
        }

        // 게시물 파싱
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
        } else if (postsResponse.data && postsResponse.data.posts && Array.isArray(postsResponse.data.posts)) {
          apiPosts = postsResponse.data.posts;
        } else if (Array.isArray(postsResponse.data)) {
          apiPosts = postsResponse.data;
        }

        // MyDay 게시물 처리
        if (myDayResponse?.data?.status === 'success') {
          if (myDayResponse.data.data?.posts) {
            myDayPosts = myDayResponse.data.data.posts;
          } else if (myDayResponse.data.data) {
            myDayPosts = Array.isArray(myDayResponse.data.data) ? myDayResponse.data.data : [myDayResponse.data.data];
          }
        } else if (myDayResponse?.data?.posts && Array.isArray(myDayResponse.data.posts)) {
          myDayPosts = myDayResponse.data.posts;
        } else if (Array.isArray(myDayResponse?.data)) {
          myDayPosts = myDayResponse.data;
        }

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

        // 댓글 처리 - 백엔드에서 이미 댓글 포함
        const displayPosts = await Promise.all(
          allPosts.map(async (post): Promise<any> => {
            try {
              const comments = post.comments || [];
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

        devLog('✅ useInfinitePostsQuery 페이지 완료:', {
          page: pageParam,
          posts: validPosts.length,
          bookmarks: bookmarkedPostIds.size
        });

        // 페이지네이션 정보
        const pagination = postsResponse.data?.data?.pagination || myDayResponse?.data?.data?.pagination;
        const hasMore = pagination?.has_next !== false && validPosts.length >= limit;

        return {
          posts: validPosts,
          bookmarkedPostIds: pageParam === 1 ? bookmarkedPostIds : new Set<number>(),
          nextPage: hasMore ? pageParam + 1 : undefined,
          hasMore,
        };
      } catch (error: unknown) {
        devLog('게시물 로드 오류:', error);
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 500,
  });
};
