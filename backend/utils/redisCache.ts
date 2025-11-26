// utils/redisCache.ts - Redis 캐싱 유틸리티
import Redis from 'ioredis';

const NODE_ENV = process.env.NODE_ENV || 'development';
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

// Redis 클라이언트 설정
const redis = REDIS_ENABLED ? new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
}) : null;

// Redis 연결 초기화
export const initRedis = async () => {
  if (!REDIS_ENABLED || !redis) {
    console.log('⚠️  Redis 비활성화 - 캐싱 건너뜀');
    return;
  }

  try {
    await redis.connect();
    console.log('✅ Redis 연결 성공');

    redis.on('error', (error) => {
      console.error('❌ Redis 오류:', error.message);
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Redis 재연결 중...');
    });
  } catch (error: any) {
    console.error('❌ Redis 연결 실패:', error.message);
  }
};

// 캐시 키 생성 유틸리티
export const cacheKeys = {
  user: (userId: number) => `user:${userId}`,
  userProfile: (userId: number) => `user_profile:${userId}`,
  userStats: (userId: number) => `user_stats:${userId}`,

  post: (postId: number, type: string) => `post:${type}:${postId}`,
  postList: (userId: number, page: number, type: string) => `post_list:${userId}:${type}:${page}`,

  bookmark: (userId: number, postId: number, postType: string) => `bookmark:${userId}:${postType}:${postId}`,
  bookmarkCount: (userId: number) => `bookmark_count:${userId}`,
  bookmarkList: (userId: number, page: number, postType?: string) =>
    postType ? `bookmark_list:${userId}:${postType}:${page}` : `bookmark_list:${userId}:all:${page}`,

  notification: (userId: number) => `notification:${userId}`,
  notificationCount: (userId: number) => `notification_count:${userId}`,

  feed: (userId: number, page: number) => `feed:${userId}:${page}`,
  trending: (page: number) => `trending:${page}`,

  apiCache: (route: string, userId?: number) =>
    userId ? `api_cache:${route}:${userId}` : `api_cache:${route}:guest`,
};

// 캐시 TTL 설정 (초 단위)
export const cacheTTL = {
  veryShort: 30,      // 30초
  short: 60,          // 1분
  medium: 300,        // 5분
  long: 1800,         // 30분
  veryLong: 3600,     // 1시간
  day: 86400,         // 24시간
};

// 캐시 유틸리티 함수들
export const cacheUtils = {
  /**
   * 캐시 가져오기
   */
  async get<T>(key: string): Promise<T | null> {
    if (!REDIS_ENABLED || !redis) return null;

    try {
      const cached = await redis.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as T;
    } catch (error: any) {
      console.error(`캐시 조회 오류 [${key}]:`, error.message);
      return null;
    }
  },

  /**
   * 캐시 저장
   */
  async set(key: string, value: any, ttl: number = cacheTTL.medium): Promise<boolean> {
    if (!REDIS_ENABLED || !redis) return false;

    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error: any) {
      console.error(`캐시 저장 오류 [${key}]:`, error.message);
      return false;
    }
  },

  /**
   * 캐시 삭제
   */
  async del(key: string | string[]): Promise<boolean> {
    if (!REDIS_ENABLED || !redis) return false;

    try {
      if (Array.isArray(key)) {
        if (key.length === 0) return true;
        await redis.del(...key);
      } else {
        await redis.del(key);
      }
      return true;
    } catch (error: any) {
      console.error(`캐시 삭제 오류:`, error.message);
      return false;
    }
  },

  /**
   * 패턴으로 캐시 삭제
   */
  async delPattern(pattern: string): Promise<number> {
    if (!REDIS_ENABLED || !redis) return 0;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;

      await redis.del(...keys);
      return keys.length;
    } catch (error: any) {
      console.error(`패턴 캐시 삭제 오류 [${pattern}]:`, error.message);
      return 0;
    }
  },

  /**
   * 캐시 존재 확인
   */
  async exists(key: string): Promise<boolean> {
    if (!REDIS_ENABLED || !redis) return false;

    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error: any) {
      console.error(`캐시 확인 오류 [${key}]:`, error.message);
      return false;
    }
  },

  /**
   * TTL 조회
   */
  async ttl(key: string): Promise<number> {
    if (!REDIS_ENABLED || !redis) return -1;

    try {
      return await redis.ttl(key);
    } catch (error: any) {
      console.error(`TTL 조회 오류 [${key}]:`, error.message);
      return -1;
    }
  },

  /**
   * 캐시 갱신 (TTL만 업데이트)
   */
  async refresh(key: string, ttl: number): Promise<boolean> {
    if (!REDIS_ENABLED || !redis) return false;

    try {
      await redis.expire(key, ttl);
      return true;
    } catch (error: any) {
      console.error(`캐시 갱신 오류 [${key}]:`, error.message);
      return false;
    }
  },
};

// 캐시 무효화 헬퍼
export const invalidateCache = {
  /**
   * 사용자 관련 캐시 무효화
   */
  async user(userId: number): Promise<void> {
    await cacheUtils.delPattern(`user*:${userId}*`);
    await cacheUtils.delPattern(`bookmark*:${userId}*`);
    await cacheUtils.delPattern(`feed:${userId}*`);
  },

  /**
   * 게시물 관련 캐시 무효화
   */
  async post(postId: number, postType: string): Promise<void> {
    await cacheUtils.del(cacheKeys.post(postId, postType));
    await cacheUtils.delPattern(`post_list*`);
    await cacheUtils.delPattern(`feed:*`);
  },

  /**
   * 북마크 관련 캐시 무효화
   */
  async bookmark(userId: number): Promise<void> {
    await cacheUtils.delPattern(`bookmark*:${userId}*`);
  },

  /**
   * 알림 관련 캐시 무효화
   */
  async notification(userId: number): Promise<void> {
    await cacheUtils.delPattern(`notification*:${userId}*`);
  },

  /**
   * 모든 캐시 무효화 (주의!)
   */
  async all(): Promise<void> {
    if (!REDIS_ENABLED || !redis) return;
    console.warn('⚠️  모든 캐시 삭제 중...');
    await redis.flushall();
  },
};

// Redis 상태 확인
export const getRedisStatus = async () => {
  if (!REDIS_ENABLED || !redis) {
    return { enabled: false, connected: false };
  }

  try {
    const info = await redis.info('server');
    return {
      enabled: true,
      connected: redis.status === 'ready',
      info: info,
    };
  } catch (error) {
    return {
      enabled: true,
      connected: false,
      error: error,
    };
  }
};

export default redis;
