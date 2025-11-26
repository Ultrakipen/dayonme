// middleware/rateLimiter.ts
// API Rate Limiting 미들웨어 (DDoS 방어, 서버 부하 감소)
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Redis 클라이언트 (있으면 사용, 없으면 메모리 스토어)
let redisClient: any = null;
let RedisStore: any = null;

try {
  redisClient = require('../config/redis').default;
  // Redis가 있으면 RedisStore도 로드 시도
  if (redisClient) {
    try {
      RedisStore = require('rate-limit-redis').default;
    } catch (e) {
      console.warn('⚠️ rate-limit-redis not installed, using memory store');
    }
  }
} catch (error) {
  console.warn('⚠️ Redis not configured, using memory store for rate limiting');
}

/**
 * Rate Limit 에러 핸들러
 */
const rateLimitHandler = (req: Request, res: Response) => {
  console.warn(`🚨 [Rate Limit] ${req.ip} - ${req.method} ${req.path}`);

  res.status(429).json({
    status: 'error',
    message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

/**
 * 일반 API Rate Limiter
 * - 분당 100 요청
 * - 모든 API 엔드포인트에 적용
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 100, // 최대 100 요청
  message: {
    status: 'error',
    message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true, // RateLimit-* 헤더 반환
  legacyHeaders: false,  // X-RateLimit-* 헤더 비활성화
  handler: rateLimitHandler,
  // Redis 사용 (여러 서버 간 공유)
  ...(redisClient && RedisStore && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:general:',
    }),
  }),
  // IP 기반 제한
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  // 제한 초과 시 스킵 (성공한 요청만 카운트)
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * 게시물 작성 Rate Limiter
 * - 분당 5 요청
 * - 스팸 방지
 */
export const postCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 5, // 최대 5 요청
  message: {
    status: 'error',
    message: '게시물 작성 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  ...(redisClient && RedisStore && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:post:',
    }),
  }),
  keyGenerator: (req: Request) => {
    // 인증된 사용자는 userId 기반, 아니면 IP
    const userId = (req as any).user?.user_id;
    return userId ? `user:${userId}` : `ip:${req.ip}`;
  },
});

/**
 * 댓글 작성 Rate Limiter
 * - 분당 10 요청
 */
export const commentCreationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    status: 'error',
    message: '댓글 작성 한도를 초과했습니다.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  ...(redisClient && RedisStore && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:comment:',
    }),
  }),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.user_id;
    return userId ? `user:${userId}` : `ip:${req.ip}`;
  },
});

/**
 * 로그인 Rate Limiter
 * - 분당 5 요청
 * - 브루트 포스 공격 방지
 */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    message: '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  ...(redisClient && RedisStore && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:login:',
    }),
  }),
  keyGenerator: (req: Request) => {
    // 이메일 기반 제한
    const email = req.body?.email;
    return email ? `email:${email}` : `ip:${req.ip}`;
  },
  // 실패한 요청만 카운트
  skipSuccessfulRequests: true,
});

/**
 * 이미지 업로드 Rate Limiter
 * - 분당 20 요청
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    status: 'error',
    message: '이미지 업로드 한도를 초과했습니다.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  ...(redisClient && RedisStore && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:upload:',
    }),
  }),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.user_id;
    return userId ? `user:${userId}` : `ip:${req.ip}`;
  },
});

/**
 * 검색 Rate Limiter
 * - 분당 30 요청
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    status: 'error',
    message: '검색 한도를 초과했습니다.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  ...(redisClient && RedisStore && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:search:',
    }),
  }),
});

/**
 * 관리자 API Rate Limiter
 * - 분당 200 요청 (더 높은 한도)
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: {
    status: 'error',
    message: 'API 한도를 초과했습니다.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  ...(redisClient && RedisStore && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:admin:',
    }),
  }),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.user_id;
    return userId ? `admin:${userId}` : `ip:${req.ip}`;
  },
});

export default {
  generalLimiter,
  postCreationLimiter,
  commentCreationLimiter,
  loginLimiter,
  uploadLimiter,
  searchLimiter,
  adminLimiter,
};
