// hooks/usePostSwipe.ts
// 게시물 스와이프 네비게이션을 위한 커스텀 훅
import { useState, useCallback, useRef, useEffect } from 'react';
import { getCache, setCache } from '../utils/cache';
import logger from '../utils/logger';
import postService from '../services/api/postService';
import comfortWallService from '../services/api/comfortWallService';
import myDayService from '../services/api/myDayService';
import { performanceMonitor } from '../utils/performanceMonitor';
import { logPostView, logPostLoadTime } from '../utils/analytics';
import { networkOptimizer } from '../utils/networkOptimizer';

interface Post {
  post_id: number;
  user_id: number;
  content: string;
  title?: string;
  is_anonymous: boolean;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  emotions?: Array<{
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  }>;
  tags?: Array<{
    tag_id: number;
    name: string;
  }>;
  is_liked?: boolean;
}

interface UsePostSwipeOptions {
  initialPostId: number;
  postType: 'post' | 'comfort' | 'myday';
  sourceScreen?: 'home' | 'comfort';
  filterOptions?: {
    emotion?: string;
    sortOrder?: 'recent' | 'popular';
  };
}

interface UsePostSwipeReturn {
  posts: Post[];
  currentIndex: number;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loadPrevious: () => Promise<void>;
  refreshCurrentPost: () => Promise<void>;
}

// 네트워크 상태에 따라 동적 조정
const getCacheTTL = () => Math.floor(networkOptimizer.getOptimalCacheTTL() / 1000);
const getPrefetchThreshold = () => networkOptimizer.getOptimalPrefetchCount();
const getPageSize = () => networkOptimizer.getOptimalBatchSize();

const CACHE_TTL = 300; // 기본 5분 (fallback)
const PREFETCH_THRESHOLD = 2; // 기본 2개 (fallback)
const PAGE_SIZE = 10; // 기본 10개 (fallback)

export const usePostSwipe = (options: UsePostSwipeOptions): UsePostSwipeReturn => {
  const { initialPostId, postType, sourceScreen, filterOptions } = options;

  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasPrevious, setHasPrevious] = useState(false);

  const loadingRef = useRef(false);
  const currentPageRef = useRef(1);
  const previousPageRef = useRef(0);

  // API 서비스 선택
  const getService = useCallback(() => {
    switch (postType) {
      case 'comfort':
        return comfortWallService;
      case 'myday':
        return myDayService;
      default:
        return postService;
    }
  }, [postType]);

  // 캐시 키 생성
  const getCacheKey = useCallback((page: number) => {
    const filter = filterOptions
      ? `_${filterOptions.emotion}_${filterOptions.sortOrder}`
      : '';
    return `posts_${postType}_${sourceScreen}${filter}_page${page}`;
  }, [postType, sourceScreen, filterOptions]);

  // 초기 게시물 로드
  const loadInitialPost = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);

    // 성능 측정 시작
    performanceMonitor.start('PostSwipe_InitialLoad', { postId: initialPostId });

    try {
      logger.log('📍 [usePostSwipe] 초기 게시물 로드 시작:', initialPostId);

      // 현재 게시물 로드
      const service = getService();
      const currentPost = await service.getPostById(initialPostId);

      if (!currentPost) {
        throw new Error('게시물을 찾을 수 없습니다');
      }

      // 캐시에서 주변 게시물 확인
      const cacheKey = getCacheKey(1);
      let cachedPosts = getCache<Post[]>(cacheKey);

      if (!cachedPosts || cachedPosts.length === 0) {
        // 캐시 없으면 API 호출
        logger.log('📡 [usePostSwipe] API에서 게시물 목록 로드');
        const response = await service.getPosts({
          page: 1,
          limit: PAGE_SIZE,
          emotion: filterOptions?.emotion,
          sortBy: filterOptions?.sortOrder,
        });

        cachedPosts = response.data || [];
        const ttl = getCacheTTL();
        setCache(cacheKey, cachedPosts, ttl);
        logger.log(`💾 [usePostSwipe] 캐시 저장 (TTL: ${ttl}초)`);
      } else {
        logger.log('✅ [usePostSwipe] 캐시에서 게시물 목록 로드');
      }

      // 현재 게시물의 인덱스 찾기
      const currentIdx = cachedPosts.findIndex((p: Post) => p.post_id === initialPostId);

      if (currentIdx >= 0) {
        setPosts(cachedPosts);
        setCurrentIndex(currentIdx);
      } else {
        // 목록에 없으면 맨 앞에 추가
        setPosts([currentPost, ...(cachedPosts || [])]);
        setCurrentIndex(0);
      }

      setHasMore(cachedPosts.length >= PAGE_SIZE);

      // 성능 측정 종료
      const duration = performanceMonitor.end('PostSwipe_InitialLoad');

      // 애널리틱스 이벤트
      if (duration) {
        logPostLoadTime(initialPostId, duration);
      }
      logPostView(initialPostId, postType, sourceScreen || 'unknown');

    } catch (error) {
      logger.error('❌ [usePostSwipe] 초기 게시물 로드 실패:', error);
      performanceMonitor.end('PostSwipe_InitialLoad');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [initialPostId, getService, getCacheKey, filterOptions, postType, sourceScreen]);

  // 다음 게시물 로드 (스와이프 다운)
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    // Prefetch 트리거: 마지막에서 2개 남았을 때
    if (posts.length - currentIndex > PREFETCH_THRESHOLD) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const nextPage = currentPageRef.current + 1;
      logger.log('📡 [usePostSwipe] 다음 페이지 로드:', nextPage);

      const cacheKey = getCacheKey(nextPage);
      let newPosts = getCache<Post[]>(cacheKey);

      if (!newPosts) {
        const service = getService();
        const response = await service.getPosts({
          page: nextPage,
          limit: PAGE_SIZE,
          emotion: filterOptions?.emotion,
          sortBy: filterOptions?.sortOrder,
        });

        newPosts = response.data || [];
        setCache(cacheKey, newPosts, CACHE_TTL);
      }

      if (newPosts.length > 0) {
        setPosts(prev => [...prev, ...newPosts]);
        currentPageRef.current = nextPage;
        setHasMore(newPosts.length >= PAGE_SIZE);
      } else {
        setHasMore(false);
      }

    } catch (error) {
      logger.error('❌ [usePostSwipe] 다음 페이지 로드 실패:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [posts.length, currentIndex, hasMore, getService, getCacheKey, filterOptions]);

  // 이전 게시물 로드 (스와이프 업)
  const loadPrevious = useCallback(async () => {
    if (loadingRef.current || previousPageRef.current <= 0) return;

    // 맨 위에서 2개 남았을 때만 prefetch
    if (currentIndex > PREFETCH_THRESHOLD) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const prevPage = previousPageRef.current;
      logger.log('📡 [usePostSwipe] 이전 페이지 로드:', prevPage);

      const cacheKey = getCacheKey(prevPage);
      let prevPosts = getCache<Post[]>(cacheKey);

      if (!prevPosts) {
        const service = getService();
        const response = await service.getPosts({
          page: prevPage,
          limit: PAGE_SIZE,
          emotion: filterOptions?.emotion,
          sortBy: filterOptions?.sortOrder,
        });

        prevPosts = response.data || [];
        setCache(cacheKey, prevPosts, CACHE_TTL);
      }

      if (prevPosts.length > 0) {
        setPosts(prev => [...prevPosts, ...prev]);
        setCurrentIndex(prev => prev + prevPosts.length);
        previousPageRef.current = prevPage - 1;
        setHasPrevious(prevPage > 1);
      }

    } catch (error) {
      logger.error('❌ [usePostSwipe] 이전 페이지 로드 실패:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [currentIndex, getService, getCacheKey, filterOptions]);

  // 현재 게시물 새로고침
  const refreshCurrentPost = useCallback(async () => {
    if (posts.length === 0 || currentIndex >= posts.length) return;

    try {
      const currentPostId = posts[currentIndex].post_id;
      logger.log('🔄 [usePostSwipe] 현재 게시물 새로고침:', currentPostId);

      const service = getService();
      const updatedPost = await service.getPostById(currentPostId);

      if (updatedPost) {
        setPosts(prev => {
          const newPosts = [...prev];
          newPosts[currentIndex] = updatedPost;
          return newPosts;
        });
      }
    } catch (error) {
      logger.error('❌ [usePostSwipe] 게시물 새로고침 실패:', error);
    }
  }, [posts, currentIndex, getService]);

  // 초기 로드
  useEffect(() => {
    loadInitialPost();
  }, [loadInitialPost]);

  return {
    posts,
    currentIndex,
    isLoading,
    hasMore,
    loadMore,
    loadPrevious,
    refreshCurrentPost,
  };
};
