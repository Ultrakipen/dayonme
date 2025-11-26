import Redis from 'ioredis';

// Redis 활성화 여부 확인
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

// Redis 클라이언트 (비활성화 시 null)
let redis: Redis | null = null;
let isConnected = false;

if (REDIS_ENABLED) {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('⚠️ Redis 연결 재시도 중단 - 캐싱 없이 진행');
        return null; // 재시도 중단
      }
      return Math.min(times * 100, 2000);
    },
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  redis.on('connect', () => {
    isConnected = true;
    console.log('✅ Redis 연결 성공');
  });

  redis.on('error', (err) => {
    isConnected = false;
    console.warn('⚠️ Redis 오류 (캐싱 비활성화):', err.message);
  });

  redis.on('close', () => {
    isConnected = false;
  });

  // 연결 시도 (실패해도 서버 계속 실행)
  redis.connect().catch((err) => {
    console.warn('⚠️ Redis 연결 실패 - 캐싱 없이 진행:', err.message);
  });
} else {
  console.log('ℹ️ Redis 비활성화됨 (REDIS_ENABLED=false)');
}

// 캐시 헬퍼 함수 (Redis 없이도 동작)
export const cacheHelper = {
  // 캐시 가져오기
  async get<T>(key: string): Promise<T | null> {
    if (!redis || !isConnected) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  },

  // 캐시 저장 (TTL: 초 단위)
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!redis || !isConnected) return;
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      // 무시 - 캐싱 실패해도 계속 진행
    }
  },

  // 캐시 삭제
  async del(key: string): Promise<void> {
    if (!redis || !isConnected) return;
    try {
      await redis.del(key);
    } catch (error) {
      // 무시
    }
  },

  // 패턴으로 캐시 삭제 (예: challenges:*)
  async delPattern(pattern: string): Promise<void> {
    if (!redis || !isConnected) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      // 무시
    }
  },

  // 캐시 존재 확인
  async exists(key: string): Promise<boolean> {
    if (!redis || !isConnected) return false;
    try {
      return (await redis.exists(key)) === 1;
    } catch (error) {
      return false;
    }
  },

  // 연결 상태 확인
  isAvailable(): boolean {
    return REDIS_ENABLED && isConnected;
  }
};

export default redis;
