// middleware/cache.ts
// API 응답 캐싱 미들웨어 (트래픽 감소, 응답 속도 향상)
import { Request, Response, NextFunction } from 'express';
import { cacheHelper } from '../config/redis';

// 캐시 통계 (모니터링용)
const cacheStats = {
  hits: 0,
  misses: 0,
  memoryHits: 0,
  errors: 0,
  getHitRate: () => {
    const total = cacheStats.hits + cacheStats.misses;
    return total > 0 ? ((cacheStats.hits / total) * 100).toFixed(2) : '0.00';
  },
  reset: () => {
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.memoryHits = 0;
    cacheStats.errors = 0;
  }
};

// L1 메모리 캐시 (핫 데이터용)
const memoryCache = new Map<string, { data: any; expires: number }>();
const MEMORY_CACHE_MAX_SIZE = 100;
const MEMORY_CACHE_TTL = 30 * 1000; // 30초

const getFromMemory = (key: string): any | null => {
  const cached = memoryCache.get(key);
  if (cached && cached.expires > Date.now()) {
    cacheStats.memoryHits++;
    return cached.data;
  }
  if (cached) memoryCache.delete(key);
  return null;
};

const setToMemory = (key: string, data: any): void => {
  // LRU 간단 구현: 최대 크기 초과 시 가장 오래된 항목 삭제
  if (memoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { data, expires: Date.now() + MEMORY_CACHE_TTL });
};

// 캐시 통계 조회 API용
export const getCacheStats = () => ({ ...cacheStats, memorySize: memoryCache.size });

interface CacheOptions {
  ttl?: number; // 캐시 유효 시간 (초)
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  useMemoryCache?: boolean; // L1 메모리 캐시 사용 여부
  staleWhileRevalidate?: boolean; // SWR 패턴 사용
}

/**
 * API 응답 캐싱 미들웨어
 * GET 요청만 캐싱하며, Redis 없이도 정상 동작
 * L1(메모리) + L2(Redis) 2단계 캐싱 지원
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 기본 5분
    keyGenerator = (req: Request) => `cache:${req.originalUrl}`,
    condition = () => true,
    useMemoryCache = true, // 기본적으로 메모리 캐시 사용
    staleWhileRevalidate = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // GET 요청만 캐싱
    if (req.method !== 'GET') {
      return next();
    }

    // 조건 확인
    if (!condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // L1: 메모리 캐시 확인 (가장 빠름)
      if (useMemoryCache) {
        const memoryCached = getFromMemory(cacheKey);
        if (memoryCached) {
          cacheStats.hits++;
          return res.json(memoryCached);
        }
      }

      // L2: Redis 캐시 확인
      if (cacheHelper.isAvailable()) {
        const cached = await cacheHelper.get(cacheKey);
        if (cached) {
          cacheStats.hits++;
          // L1에도 저장 (다음 요청 가속화)
          if (useMemoryCache) setToMemory(cacheKey, cached);
          return res.json(cached);
        }
      }

      cacheStats.misses++;

      // 원본 res.json 백업
      const originalJson = res.json.bind(res);

      // res.json 오버라이드
      res.json = (data: any) => {
        // 성공 응답만 캐싱 (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // L1 저장 (동기)
          if (useMemoryCache) setToMemory(cacheKey, data);
          // L2 저장 (비동기)
          if (cacheHelper.isAvailable()) {
            cacheHelper.set(cacheKey, data, ttl).catch((err) => {
              cacheStats.errors++;
            });
          }
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      cacheStats.errors++;
      next();
    }
  };
};

/**
 * 메모리 캐시 패턴 삭제 (정규식 매칭)
 */
const clearMemoryPattern = (pattern: string): number => {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  let deleted = 0;
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
      deleted++;
    }
  }
  return deleted;
};

/**
 * 특정 패턴의 캐시 무효화 (L1 + L2)
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    // L1: 메모리 캐시 삭제
    clearMemoryPattern(pattern);
    // L2: Redis 캐시 삭제
    await cacheHelper.delPattern(pattern);
  } catch (error) {
    // 무시 - 캐싱 실패해도 앱 동작에 지장 없음
  }
};

/**
 * 특정 키의 캐시 무효화 (L1 + L2)
 */
export const invalidateCacheKey = async (key: string): Promise<void> => {
  try {
    // L1: 메모리 캐시 삭제
    memoryCache.delete(key);
    // L2: Redis 캐시 삭제
    await cacheHelper.del(key);
  } catch (error) {
    // 무시
  }
};

/**
 * 사용자별 캐시 키 생성
 */
export const userCacheKey = (req: Request, suffix: string): string => {
  const userId = (req as any).user?.user_id || 'anonymous';
  return `cache:user:${userId}:${suffix}`;
};

/**
 * 게시물 목록 캐싱 (1분)
 */
export const postListCache = cacheMiddleware({
  ttl: 60,
  keyGenerator: (req: Request) => {
    const { page = 1, limit = 10, sortBy = 'recent', emotion } = req.query;
    return `cache:posts:${page}:${limit}:${sortBy}:${emotion || 'all'}`;
  },
});

/**
 * 게시물 상세 캐싱 (5분)
 */
export const postDetailCache = cacheMiddleware({
  ttl: 300,
  keyGenerator: (req: Request) => `cache:post:${req.params.id}`,
});

/**
 * 댓글 목록 캐싱 (2분)
 */
export const commentListCache = cacheMiddleware({
  ttl: 120,
  keyGenerator: (req: Request) => {
    const { postId } = req.params;
    const { page = 1 } = req.query;
    return `cache:comments:${postId}:${page}`;
  },
});

/**
 * 사용자 프로필 캐싱 (5분)
 */
export const userProfileCache = cacheMiddleware({
  ttl: 300,
  keyGenerator: (req: Request) => `cache:profile:${req.params.userId}`,
});

/**
 * 검색 결과 캐싱 (3분)
 */
export const searchCache = cacheMiddleware({
  ttl: 180,
  keyGenerator: (req: Request) => {
    const { q, type, page = 1 } = req.query;
    return `cache:search:${type}:${q}:${page}`;
  },
});

/**
 * 위안의 벽 캐싱 (30초) - 자주 업데이트됨
 */
export const comfortWallCache = cacheMiddleware({
  ttl: 30,
  keyGenerator: (req: Request) => {
    const { page = 1, emotion } = req.query;
    return `cache:comfort:${page}:${emotion || 'all'}`;
  },
});

/**
 * 캐시 무효화 헬퍼 - POST/PUT/DELETE 후 호출
 */
export const invalidatePostCaches = async (postId?: number): Promise<void> => {
  if (postId) {
    await invalidateCacheKey(`cache:post:${postId}`);
  }
  // 게시물 목록 캐시 모두 삭제
  await invalidateCache('cache:posts:*');
  await invalidateCache('cache:comfort:*');
};

export const invalidateCommentCaches = async (postId: number): Promise<void> => {
  await invalidateCache(`cache:comments:${postId}:*`);
  await invalidateCacheKey(`cache:post:${postId}`); // 댓글 수 변경됨
};

export const invalidateUserCaches = async (userId: number): Promise<void> => {
  await invalidateCacheKey(`cache:profile:${userId}`);
  await invalidateCache(`cache:user:${userId}:*`);
};

export default {
  cacheMiddleware,
  getCacheStats,
  postListCache,
  postDetailCache,
  commentListCache,
  userProfileCache,
  searchCache,
  comfortWallCache,
  invalidateCache,
  invalidateCacheKey,
  invalidatePostCaches,
  invalidateCommentCaches,
  invalidateUserCaches,
};
