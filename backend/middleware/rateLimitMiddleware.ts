// rateLimitMiddleware.ts
// 강화된 Rate Limiting - Redis 기반 분산 환경 지원
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { cacheHelper } from '../config/redis';

const isProd = process.env.NODE_ENV === 'production';

// Rate limit 통계 (모니터링용)
const rateLimitStats = {
  blocked: 0,
  total: 0,
  getBlockRate: () => {
    return rateLimitStats.total > 0
      ? ((rateLimitStats.blocked / rateLimitStats.total) * 100).toFixed(2)
      : '0.00';
  }
};

export const getRateLimitStats = () => ({ ...rateLimitStats });

// 사용자 식별 키 생성 (IP + User ID)
const keyGenerator = (req: Request): string => {
  const userId = (req as any).user?.user_id || 'anonymous';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `ratelimit:${userId}:${ip}`;
};

// Redis 기반 Rate Limiter (분산 환경용)
export const createRedisRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix?: string;
}) => {
  const { windowMs, max, message, keyPrefix = 'rl' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    rateLimitStats.total++;

    // Redis 미사용 시 기본 통과
    if (!cacheHelper.isAvailable()) {
      return next();
    }

    const key = `${keyPrefix}:${keyGenerator(req)}`;
    const windowStart = Math.floor(Date.now() / windowMs);
    const fullKey = `${key}:${windowStart}`;

    try {
      const current = await cacheHelper.get<number>(fullKey);
      const count = (current || 0) + 1;

      if (count > max) {
        rateLimitStats.blocked++;
        const retryAfter = Math.ceil(windowMs / 1000);
        res.set('Retry-After', String(retryAfter));
        res.set('X-RateLimit-Limit', String(max));
        res.set('X-RateLimit-Remaining', '0');
        return res.status(429).json({ status: 'error', message });
      }

      await cacheHelper.set(fullKey, count, Math.ceil(windowMs / 1000));
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(Math.max(0, max - count)));
      next();
    } catch (error) {
      // Redis 오류 시 통과 (가용성 우선)
      next();
    }
  };
};

// 기본 API Rate Limiter (메모리 기반 - 폴백)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: isProd ? 200 : 1000, // 프로덕션: 200회, 개발: 1000회
  message: { status: 'error', message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req: Request, res: Response) => {
    rateLimitStats.blocked++;
    res.status(429).json({ status: 'error', message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

// 인증 Rate Limiter (엄격함 - 브루트포스 방지)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 50,
  message: { status: 'error', message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.' },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip || 'unknown'
});

// 회원가입 Rate Limiter
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: isProd ? 3 : 20,
  message: { status: 'error', message: '회원가입 시도 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.' },
  keyGenerator: (req) => req.ip || 'unknown'
});

// 업로드 Rate Limiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 100,
  message: { status: 'error', message: '파일 업로드 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
  keyGenerator
});

// 검색 Rate Limiter (검색 남용 방지)
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: isProd ? 30 : 100,
  message: { status: 'error', message: '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  keyGenerator
});

// 게시물 작성 Rate Limiter (스팸 방지)
export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: isProd ? 20 : 100,
  message: { status: 'error', message: '게시물 작성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
  keyGenerator
});

// 댓글 작성 Rate Limiter
export const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: isProd ? 30 : 100,
  message: { status: 'error', message: '댓글 작성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
  keyGenerator
});