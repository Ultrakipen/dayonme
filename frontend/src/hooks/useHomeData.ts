// hooks/useHomeData.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import postService, { type Post as ApiPost } from '../services/api/postService';
import myDayService, { type MyDayPost as ApiMyDayPost } from '../services/api/myDayService';
import { DisplayPost, ExtendedComment } from '../types/HomeScreen.types';
import { resetEmotionUsage } from '../components/CompactPostCard';
import { anonymousManager, AnonymousUser } from '../utils/anonymousNickname';

const CACHE_DURATION = 5000;

interface UseHomeDataReturn {
  posts: DisplayPost[];
  myRecentPosts: DisplayPost[];
  isRefreshing: boolean;
  loadingPosts: boolean;
  isLoadingMyPosts: boolean;
  loadPosts: (forceRefresh?: boolean) => Promise<void>;
  loadMyRecentPosts: () => Promise<void>;
  onRefresh: () => Promise<void>;
  setPosts: React.Dispatch<React.SetStateAction<DisplayPost[]>>;
  setMyRecentPosts: React.Dispatch<React.SetStateAction<DisplayPost[]>>;
}

export const useHomeData = (userId?: number): UseHomeDataReturn => {
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [myRecentPosts, setMyRecentPosts] = useState<DisplayPost[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isLoadingMyPosts, setIsLoadingMyPosts] = useState(false);
  const lastLoadTime = useRef<number>(0);

  const loadPosts = useCallback(async (forceRefresh: boolean = false) => {
    try {
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
        } catch (error) {
          if (__DEV__) console.error('AsyncStorage 초기화 오류:', error);
        }
      }

      const timestamp = forceRefresh ? Date.now() : undefined;

      const [postsResponse, myDayResponse] = await Promise.all([
        postService.getPosts({
          page: 1,
          limit: 15,
          sort_by: 'latest',
          ...(timestamp && { _t: timestamp })
        }),
        myDayService.getPosts({
          page: 1,
          limit: 20,
          ...(timestamp && { _t: timestamp })
        }).catch(() => ({ data: { posts: [] } }))
      ]);

      let apiPosts: ApiPost[] = [];
      let myDayPosts: ApiMyDayPost[] = [];

      // 응답 구조 처리
      if (postsResponse.data?.status === 'success') {
        if (postsResponse.data.data?.posts) {
          apiPosts = postsResponse.data.data.posts;
        }
      } else if (postsResponse.data?.posts && Array.isArray(postsResponse.data.posts)) {
        apiPosts = postsResponse.data.posts;
      } else if (Array.isArray(postsResponse.data)) {
        apiPosts = postsResponse.data;
      }

      if (myDayResponse?.data?.status === 'success') {
        if (myDayResponse.data.data?.posts) {
          myDayPosts = myDayResponse.data.data.posts;
        }
      } else if (myDayResponse?.data?.posts && Array.isArray(myDayResponse.data.posts)) {
        myDayPosts = myDayResponse.data.posts;
      } else if (Array.isArray(myDayResponse?.data)) {
        myDayPosts = myDayResponse.data;
      }

      const existingPostIds = new Set(apiPosts.map(post => post.post_id));
      const uniqueMyDayPosts = myDayPosts.filter(myDayPost => !existingPostIds.has(myDayPost.post_id));

      const convertedMyDayPosts = uniqueMyDayPosts.map((myDayPost) => ({
        post_id: myDayPost.post_id,
        authorName: myDayPost.is_anonymous ? '익명' : (myDayPost.user?.nickname || '사용자'),
        user_id: myDayPost.user_id,
        content: myDayPost.content,
        image_url: myDayPost.image_url,
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

      const allApiPosts = [
        ...apiPosts.map(post => ({ ...post, authorName: post.is_anonymous ? '익명' : (post.user?.nickname || '사용자') })),
        ...convertedMyDayPosts
      ].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

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
            } catch {
              comments = [];
            }

            return {
              post_id: apiPost.post_id,
              authorName: apiPost.authorName || '사용자',
              user_id: apiPost.user_id,
              content: apiPost.content,
              emotions: apiPost.emotions || [],
              image_url: apiPost.image_url,
              like_count: apiPost.like_count || 0,
              comment_count: comments.length,
              created_at: apiPost.created_at || new Date().toISOString(),
              updated_at: apiPost.updated_at || new Date().toISOString(),
              is_anonymous: apiPost.is_anonymous || false,
              user: apiPost.user,
              isLiked: false,
              comments: comments
            };
          } catch (error) {
            if (__DEV__) console.error(`게시물 ${apiPost.post_id} 변환 실패:`, error);
            return null;
          }
        })
      );

      const validPosts = displayPosts.filter((post): post is DisplayPost => post !== null);
      setPosts(validPosts);

    } catch (error) {
      if (__DEV__) console.error('게시물 로드 오류:', error);
    } finally {
      setIsRefreshing(false);
      setLoadingPosts(false);
    }
  }, []);

  const loadMyRecentPosts = useCallback(async () => {
    if (!userId) return;

    setIsLoadingMyPosts(true);
    try {
      const response = await myDayService.getUserPosts(userId, {
        page: 1,
        limit: 3,
        sort_by: 'latest'
      });

      let userPosts: ApiMyDayPost[] = [];

      if (response.data?.status === 'success' && response.data.data?.posts) {
        userPosts = response.data.data.posts;
      } else if (response.data?.posts && Array.isArray(response.data.posts)) {
        userPosts = response.data.posts;
      } else if (Array.isArray(response.data)) {
        userPosts = response.data;
      }

      const displayPosts: DisplayPost[] = userPosts.map((post) => ({
        post_id: post.post_id,
        authorName: post.is_anonymous ? '익명' : (post.user?.nickname || '사용자'),
        user_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        created_at: post.created_at,
        updated_at: post.updated_at,
        is_anonymous: post.is_anonymous,
        user: post.user,
        emotions: post.emotions || [],
        comments: [],
        isLiked: false
      }));

      setMyRecentPosts(displayPosts);
    } catch (error) {
      if (__DEV__) console.error('내 최근 게시물 로드 오류:', error);
    } finally {
      setIsLoadingMyPosts(false);
    }
  }, [userId]);

  const onRefresh = useCallback(async () => {
    await loadPosts(true);
    await loadMyRecentPosts();
  }, [loadPosts, loadMyRecentPosts]);

  return {
    posts,
    myRecentPosts,
    isRefreshing,
    loadingPosts,
    isLoadingMyPosts,
    loadPosts,
    loadMyRecentPosts,
    onRefresh,
    setPosts,
    setMyRecentPosts
  };
};
