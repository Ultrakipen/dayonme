// useHomeData.ts - 게시물 데이터 로딩 및 상태 관리
import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import postService, { type Post as ApiPost } from '../../../services/api/postService';
import myDayService, { type MyDayPost as ApiMyDayPost } from '../../../services/api/myDayService';
import bookmarkService from '../../../services/api/bookmarkService';
import { sanitizeUrl } from '../../../utils/validation';
import { devLog } from '../../../utils/security';
import { resetEmotionUsage } from '../../../components/CompactPostCard';
import { type DisplayPost, type AnonymousUser } from '../types';

const CACHE_DURATION = 5000; // 5초

interface UseHomeDataProps {
  isAuthenticated: boolean;
  isConnected: boolean;
  processCommentsWithAnonymous: (postId: number, comments: any[]) => Promise<any[]>;
}

export const useHomeData = ({ isAuthenticated, isConnected, processCommentsWithAnonymous }: UseHomeDataProps) => {
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [anonymousUsers, setAnonymousUsers] = useState<{ [postId: number]: { [userId: number]: AnonymousUser } }>({});
  const [clientSideParentMap, setClientSideParentMap] = useState<{ [commentId: number]: number }>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  const lastLoadTime = useRef<number>(0);

  const loadPosts = useCallback(async (forceRefresh: boolean = false) => {
    try {
      if (!isConnected) {
        Alert.alert('오프라인', '인터넷 연결을 확인해주세요.\n네트워크에 연결된 후 다시 시도해주세요.', [{ text: '확인' }]);
        setIsRefreshing(false);
        setLoadingPosts(false);
        return;
      }

      const now = Date.now();
      if (!forceRefresh && (now - lastLoadTime.current) < CACHE_DURATION) {
        return;
      }

      setIsRefreshing(true);
      setLoadingPosts(true);
      lastLoadTime.current = now;

      if (forceRefresh) {
        resetEmotionUsage();
        try {
          await AsyncStorage.removeItem('commentParentMap');
          setClientSideParentMap({});
          setExpandedReplies(new Set());
        } catch (error) {
          devLog('캐시 초기화 오류:', error);
        }
      }

      const timestamp = forceRefresh ? Date.now() : undefined;
      const promises: Promise<any>[] = [
        postService.getPosts({ page: 1, limit: 15, sort_by: 'latest', ...(timestamp && { _t: timestamp }) }),
        myDayService.getPosts({ page: 1, limit: 20, ...(timestamp && { _t: timestamp }) }).catch(() => ({ data: { posts: [] } }))
      ];

      if (isAuthenticated) {
        promises.push(
          bookmarkService.getBookmarks({ postType: 'my_day' }).catch(() => ({ status: 'error', data: { bookmarks: [] } }))
        );
      }

      const responses = await Promise.all(promises);
      const [postsResponse, myDayResponse, bookmarksResponse] = responses;

      // 북마크 처리
      if (isAuthenticated && bookmarksResponse?.status === 'success') {
        const bookmarks = bookmarksResponse.data?.bookmarks || [];
        const bookmarkedPostIds = new Set(bookmarks.filter((b: any) => b.post !== null).map((b: any) => b.post.post_id));
        setBookmarkedPosts(bookmarkedPostIds);
      } else if (!isAuthenticated) {
        setBookmarkedPosts(new Set());
      }

      // 게시물 데이터 파싱
      let apiPosts: ApiPost[] = [];
      let myDayPosts: ApiMyDayPost[] = [];

      if (postsResponse.data?.status === 'success') {
        apiPosts = postsResponse.data.data?.posts || (postsResponse.data.data?.post_id ? [postsResponse.data.data] : []);
      } else if (postsResponse.data?.posts && Array.isArray(postsResponse.data.posts)) {
        apiPosts = postsResponse.data.posts;
      } else if (Array.isArray(postsResponse.data)) {
        apiPosts = postsResponse.data;
      }

      if (myDayResponse?.data?.status === 'success') {
        myDayPosts = myDayResponse.data.data?.posts || (Array.isArray(myDayResponse.data.data) ? myDayResponse.data.data : [myDayResponse.data.data]);
      } else if (myDayResponse?.data?.posts && Array.isArray(myDayResponse.data.posts)) {
        myDayPosts = myDayResponse.data.posts;
      } else if (Array.isArray(myDayResponse?.data)) {
        myDayPosts = myDayResponse.data;
      }

      // 중복 제거
      const existingPostIds = new Set(apiPosts.map(post => post.post_id));
      const uniqueMyDayPosts = myDayPosts.filter(myDayPost => !existingPostIds.has(myDayPost.post_id));

      // MyDay를 일반 게시물로 변환
      const convertedMyDayPosts = uniqueMyDayPosts.map((myDayPost) => ({
        post_id: myDayPost.post_id,
        authorName: myDayPost.is_anonymous ? '익명' : (myDayPost.user?.nickname || '사용자'),
        user_id: myDayPost.user_id,
        content: myDayPost.content,
        image_url: myDayPost.image_url ? sanitizeUrl(myDayPost.image_url) : undefined,
        like_count: myDayPost.like_count || 0,
        comment_count: myDayPost.comment_count || 0,
        created_at: myDayPost.created_at,
        updated_at: myDayPost.updated_at,
        is_anonymous: myDayPost.is_anonymous,
        user: myDayPost.user,
        emotions: myDayPost.emotions || (myDayPost.emotion_id ? [{
          emotion_id: myDayPost.emotion_id,
          name: typeof myDayPost.emotion_name === 'string' ? myDayPost.emotion_name : '알 수 없음',
          icon: myDayPost.emotion_icon || '😐',
          color: myDayPost.emotion_color || '#6366f1'
        }] : []),
        comments: []
      }));

      // 합치고 정렬
      const allApiPosts = [
        ...apiPosts.map(post => ({ ...post, authorName: post.is_anonymous ? '익명' : (post.user?.nickname || '사용자') })),
        ...convertedMyDayPosts
      ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      // DisplayPost로 변환
      const displayPosts: (DisplayPost | null)[] = await Promise.all(
        allApiPosts.map(async (apiPost): Promise<DisplayPost | null> => {
          try {
            let comments: any[] = [];
            try {
              const commentsResponse = await myDayService.getComments(apiPost.post_id);
              if (commentsResponse?.status === 'success' && commentsResponse?.data?.comments) {
                comments = commentsResponse.data.comments;
              } else if (commentsResponse.data?.status === 'success' && commentsResponse.data?.data?.comments) {
                comments = commentsResponse.data.data.comments;
              } else if (Array.isArray(commentsResponse.data)) {
                comments = commentsResponse.data;
              } else if (Array.isArray(commentsResponse)) {
                comments = commentsResponse;
              }
            } catch (error) {
              comments = [];
            }

            const processedComments = await processCommentsWithAnonymous(apiPost.post_id, comments);

            return {
              ...apiPost,
              comments: processedComments,
              emotions: apiPost.emotions || [],
              image_url: apiPost.image_url ? sanitizeUrl(apiPost.image_url) : undefined,
            } as DisplayPost;
          } catch (error) {
            devLog('게시물 변환 오류:', error);
            return null;
          }
        })
      );

      const validPosts = displayPosts.filter((post): post is DisplayPost => post !== null);
      setPosts(validPosts);
    } catch (error: any) {
      devLog('게시물 로드 오류:', error);
      Alert.alert('오류', '게시물을 불러오는 중 문제가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
      setLoadingPosts(false);
    }
  }, [isAuthenticated, isConnected, processCommentsWithAnonymous]);

  return {
    posts,
    setPosts,
    isRefreshing,
    loadingPosts,
    bookmarkedPosts,
    setBookmarkedPosts,
    likedPosts,
    setLikedPosts,
    anonymousUsers,
    setAnonymousUsers,
    clientSideParentMap,
    setClientSideParentMap,
    expandedReplies,
    setExpandedReplies,
    loadPosts,
  };
};
