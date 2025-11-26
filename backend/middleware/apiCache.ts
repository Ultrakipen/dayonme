// middleware/apiCache.ts - API 응답 캐싱 미들웨어
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { cacheUtils, cacheKeys, cacheTTL } from '../utils/redisCache';

/**
 * API 응답 캐싱 미들웨어
 * GET 요청만 캐싱하며, 사용자별로 분리
 *
 * @param duration - 캐시 TTL (초)
 * @param keyGenerator - 커스텀 캐시 키 생성 함수
 */
export const apiCache = (
  duration: number = cacheTTL.medium,
  keyGenerator?: (req: AuthRequest) => string
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // GET 요청만 캐싱
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // 캐시 키 생성
      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : cacheKeys.apiCache(
            `${req.route?.path || req.path}${JSON.stringify(req.query)}`,
            req.user?.user_id
          );

      // 캐시 확인
      const cached = await cacheUtils.get<any>(cacheKey);

      if (cached) {
        // 캐시 히트
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }

      // 캐시 미스 - 원본 res.json 래핑
      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        // 성공 응답만 캐싱
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheUtils.set(cacheKey, body, duration).catch((error) => {
            console.error('캐시 저장 실패:', error);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('캐시 미들웨어 오류:', error);
      next();
    }
  };
};

/**
 * 조건부 캐싱 미들웨어
 * 특정 조건에서만 캐싱
 */
export const conditionalCache = (
  condition: (req: AuthRequest) => boolean,
  duration: number = cacheTTL.medium
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return apiCache(duration)(req, res, next);
    }
    next();
  };
};

/**
 * 사용자별 캐시 무효화 미들웨어
 * POST, PUT, DELETE 요청 후 관련 캐시 삭제
 */
export const invalidateUserCache = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.user_id;

  if (!userId) {
    return next();
  }

  // 응답 후 캐시 무효화
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        // 사용자 관련 API 캐시만 삭제
        const pattern = cacheKeys.apiCache('*', userId);
        await cacheUtils.delPattern(pattern.replace(':guest', ':*'));
      } catch (error) {
        console.error('캐시 무효화 오류:', error);
      }
    }
  });

  next();
};
