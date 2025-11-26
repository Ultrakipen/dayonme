# 📊 실제 서비스 & 사용자 증가 대비 최적화 가이드

## 🎯 현재 구현 상태 (2025년 1월 기준)

### ✅ 구현 완료
1. **데이터베이스 인덱스 최적화**
   - ✅ Bookmark 모델: user_id, post_id, post_type 복합 인덱스
   - ✅ 개별 필드 인덱스 설정 완료

2. **쿼리 최적화**
   - ✅ N+1 쿼리 문제 해결 (bookmarkController)
   - ✅ Map 자료구조로 O(1) 조회
   - ✅ 페이지네이션 최대 50개 제한

3. **백엔드 미들웨어**
   - ✅ Compression (gzip 압축)
   - ✅ Helmet (보안 헤더)
   - ✅ Rate Limiting
   - ✅ CORS 설정

4. **프론트엔드 최적화**
   - ✅ React Query 캐싱 (5분 staleTime, 30분 gcTime)
   - ✅ FastImage 이미지 캐싱
   - ✅ 오프라인 우선 전략
   - ✅ 요청 중복 제거

---

## 🚀 사용자 증가 단계별 대응 전략

### 📈 **Phase 1: 1,000명 → 10,000명**

#### 1. 데이터베이스 최적화
```sql
-- 🔍 추가 인덱스 권장사항

-- MyDayPost 테이블
CREATE INDEX idx_my_day_created_at ON my_day_posts(created_at DESC);
CREATE INDEX idx_my_day_user_created ON my_day_posts(user_id, created_at DESC);
CREATE INDEX idx_my_day_like_count ON my_day_posts(like_count DESC);

-- SomeoneDayPost 테이블
CREATE INDEX idx_comfort_created_at ON someone_day_posts(created_at DESC);
CREATE INDEX idx_comfort_user_created ON someone_day_posts(user_id, created_at DESC);

-- User 테이블
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Notification 테이블
CREATE INDEX idx_notification_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notification_is_read ON notifications(user_id, is_read);
```

#### 2. Redis 캐싱 구현 (필수)
```typescript
// backend/utils/redisCache.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

export const cacheKeys = {
  user: (userId: number) => `user:${userId}`,
  userStats: (userId: number) => `user_stats:${userId}`,
  post: (postId: number, type: string) => `post:${type}:${postId}`,
  bookmarkCount: (userId: number) => `bookmark_count:${userId}`,
  feedPage: (userId: number, page: number) => `feed:${userId}:page:${page}`,
};

// 캐시 TTL 설정
export const cacheTTL = {
  short: 60,        // 1분
  medium: 300,      // 5분
  long: 1800,       // 30분
  veryLong: 3600,   // 1시간
};

export default redis;
```

**적용 예시 - 북마크 개수 캐싱:**
```typescript
// bookmarkController.ts
async getBookmarkCount(req: AuthRequest, res: Response) {
  const user_id = req.user?.user_id;
  if (!user_id) return res.status(401).json({...});

  // Redis 캐시 확인
  const cacheKey = cacheKeys.bookmarkCount(user_id);
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.status(200).json({
      status: 'success',
      data: { count: parseInt(cached) }
    });
  }

  // DB 조회
  const count = await db.Bookmark.count({ where: { user_id } });

  // 캐시 저장 (5분)
  await redis.setex(cacheKey, cacheTTL.medium, count.toString());

  return res.status(200).json({
    status: 'success',
    data: { count }
  });
}
```

#### 3. API 응답 캐싱
```typescript
// middleware/apiCache.ts
import { Request, Response, NextFunction } from 'express';
import redis from '../utils/redisCache';

export const apiCache = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const key = `api_cache:${req.originalUrl}:${req.user?.user_id || 'guest'}`;
    const cached = await redis.get(key);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 원본 res.json을 래핑
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      redis.setex(key, duration, JSON.stringify(body));
      return originalJson(body);
    };

    next();
  };
};
```

**사용:**
```typescript
// routes/bookmarks.ts
router.get('/bookmarks',
  authenticate,
  apiCache(300), // 5분 캐싱
  bookmarkController.getBookmarks
);
```

---

### 📈 **Phase 2: 10,000명 → 100,000명**

#### 1. 데이터베이스 파티셔닝
```sql
-- 날짜 기준 파티셔닝 (MySQL 8.0+)
ALTER TABLE my_day_posts
PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

#### 2. Read Replica 구성
```typescript
// config/database.ts
const sequelize = new Sequelize({
  replication: {
    read: [
      { host: process.env.DB_READ_HOST_1, port: 3306 },
      { host: process.env.DB_READ_HOST_2, port: 3306 },
    ],
    write: {
      host: process.env.DB_WRITE_HOST,
      port: 3306
    }
  },
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  }
});
```

#### 3. CDN 적용 (이미지/정적 파일)
```typescript
// config/cdn.ts
export const CDN_CONFIG = {
  enabled: process.env.CDN_ENABLED === 'true',
  baseUrl: process.env.CDN_BASE_URL || '',

  getImageUrl: (path: string, options?: {
    width?: number;
    quality?: number;
  }) => {
    if (!CDN_CONFIG.enabled) return path;

    const params = new URLSearchParams();
    if (options?.width) params.append('w', options.width.toString());
    if (options?.quality) params.append('q', options.quality.toString());

    return `${CDN_CONFIG.baseUrl}${path}?${params.toString()}`;
  }
};
```

#### 4. 백그라운드 작업 큐 (Bull)
```typescript
// queues/notificationQueue.ts
import Bull from 'bull';
import redis from '../utils/redisCache';

export const notificationQueue = new Bull('notifications', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  }
});

// 알림 처리
notificationQueue.process(async (job) => {
  const { userId, type, data } = job.data;

  // 알림 생성 로직
  await db.Notification.create({
    user_id: userId,
    type,
    data,
  });

  // 푸시 알림 전송
  await sendPushNotification(userId, data);
});

// 사용
export const queueNotification = async (userId: number, type: string, data: any) => {
  await notificationQueue.add({ userId, type, data }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
};
```

---

### 📈 **Phase 3: 100,000명 이상**

#### 1. 마이크로서비스 분리
```
서비스 분리 권장:
- Auth Service (인증/권한)
- User Service (사용자 관리)
- Post Service (게시물)
- Notification Service (알림)
- Media Service (이미지/파일)
```

#### 2. 메시지 큐 (RabbitMQ/Kafka)
```typescript
// 이벤트 기반 아키텍처
events.on('bookmark.created', async (data) => {
  await publishEvent('bookmark.created', data);
});

// 다른 서비스에서 구독
consumeEvent('bookmark.created', async (data) => {
  // 통계 업데이트
  await updateUserStats(data.userId);
});
```

#### 3. 로드 밸런싱 (Nginx)
```nginx
# nginx.conf
upstream backend {
  least_conn;
  server backend1:3001;
  server backend2:3001;
  server backend3:3001;
}

server {
  listen 80;
  location /api {
    proxy_pass http://backend;
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
  }
}
```

---

## 🔍 모니터링 & 로깅

### 1. 성능 모니터링 미들웨어
```typescript
// middleware/performanceMonitor.ts
import { Request, Response, NextFunction } from 'express';

export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    if (duration > 1000) { // 1초 이상 걸린 요청 로깅
      console.warn(`⚠️ Slow API: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Metrics 수집 (예: Prometheus)
    collectMetric('http_request_duration_ms', duration, {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    });
  });

  next();
};
```

### 2. 에러 추적 (Sentry 권장)
```typescript
// utils/errorTracking.ts
import * as Sentry from '@sentry/node';

export const initErrorTracking = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% 샘플링
    });
  }
};

export const captureError = (error: Error, context?: any) => {
  console.error('Error:', error);
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context });
  }
};
```

### 3. 데이터베이스 쿼리 로깅
```typescript
// config/database.ts
const sequelize = new Sequelize({
  //...
  logging: (sql, timing) => {
    if (timing && timing > 100) { // 100ms 이상 느린 쿼리
      console.warn(`🐌 Slow Query (${timing}ms): ${sql}`);
    }
  },
  benchmark: true,
});
```

---

## ⚡ 성능 체크리스트

### 백엔드
- [x] N+1 쿼리 제거
- [x] 데이터베이스 인덱스 설정
- [ ] Redis 캐싱 구현
- [ ] API 응답 캐싱
- [x] Gzip 압축
- [x] Rate Limiting
- [ ] Connection Pooling 최적화
- [ ] 백그라운드 작업 큐

### 프론트엔드
- [x] React Query 캐싱
- [x] 이미지 최적화 (FastImage)
- [x] 오프라인 우선 전략
- [ ] Code Splitting
- [ ] Lazy Loading
- [ ] Virtual Scrolling (긴 리스트)

### 인프라
- [ ] CDN 설정
- [ ] Load Balancer
- [ ] Auto Scaling
- [ ] Database Read Replica
- [ ] 백업 자동화
- [ ] 모니터링 대시보드

---

## 📊 예상 성능 지표

### 현재 구현 (Phase 1 완료)
| 지표 | 예상 값 | 설명 |
|------|---------|------|
| 동시 접속자 | ~500명 | 안정적 처리 가능 |
| API 응답 시간 | 100-300ms | 평균 응답 시간 |
| DB 쿼리 시간 | 10-50ms | 인덱스 활용 시 |
| 이미지 로딩 | 2-3배 빠름 | FastImage 캐싱 |
| 트래픽 절감 | 60-70% | 압축 + 캐싱 |

### Redis 적용 후 (Phase 2)
| 지표 | 예상 값 | 개선 |
|------|---------|------|
| 동시 접속자 | ~5,000명 | 10배 ↑ |
| API 응답 시간 | 20-100ms | 3배 ↑ |
| DB 부하 | 70% 감소 | 캐시 히트율 |
| 서버 비용 | 30% 절감 | 효율성 증가 |

---

## 🎯 우선순위 작업

### 즉시 (1주일 내)
1. ✅ N+1 쿼리 해결
2. ⚠️ **Redis 캐싱 구현** (가장 중요)
3. ⚠️ 데이터베이스 인덱스 추가
4. ⚠️ 성능 모니터링 설정

### 단기 (1개월 내)
1. API 응답 캐싱
2. CDN 설정 (이미지)
3. 백그라운드 작업 큐
4. 로드 테스트

### 중기 (3개월 내)
1. Read Replica 구성
2. 마이크로서비스 검토
3. Auto Scaling 설정
4. 종합 성능 최적화

---

## 🔧 환경 변수 설정

```env
# .env.production

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Database
DB_WRITE_HOST=your-write-db-host
DB_READ_HOST_1=your-read-db-host-1
DB_READ_HOST_2=your-read-db-host-2

# CDN
CDN_ENABLED=true
CDN_BASE_URL=https://cdn.yourdomain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Performance
MAX_REQUESTS_PER_MINUTE=60
MAX_CONNECTIONS_POOL=20
```

---

## 📝 최종 권장사항

### 1. **Redis 캐싱 즉시 구현** (최우선)
   - 예상 성능 향상: 3-5배
   - 비용 대비 효과: 최고
   - 구현 난이도: 중하

### 2. **데이터베이스 인덱스 추가**
   - 예상 성능 향상: 2-3배
   - 비용 대비 효과: 높음
   - 구현 난이도: 하

### 3. **CDN 도입**
   - 예상 성능 향상: 2-3배 (이미지)
   - 비용 대비 효과: 높음
   - 구현 난이도: 중

### 4. **모니터링 강화**
   - 문제 조기 발견
   - 데이터 기반 최적화
   - 구현 난이도: 중

---

**✅ 결론: 현재 앱은 Phase 1 수준으로 구현되어 있으며, Redis 캐싱만 추가하면 1만명 규모까지 안정적으로 서비스 가능합니다.**
