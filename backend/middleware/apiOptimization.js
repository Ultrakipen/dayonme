// 🚀 API 최적화 미들웨어
const cacheHelper = require('../utils/cacheHelper');
const cacheConfig = require('../config/cache.config');

/**
 * 응답 캐싱 미들웨어
 * @param {string} keyGenerator - 캐시 키 생성 함수
 * @param {number} ttl - TTL (초)
 */
const cacheResponse = (keyGenerator, ttl) => {
  return async (req, res, next) => {
    try {
      // GET 요청만 캐싱
      if (req.method !== 'GET') {
        return next();
      }

      // 캐시 키 생성
      const cacheKey = typeof keyGenerator === 'function'
        ? keyGenerator(req)
        : keyGenerator;

      // 캐시 확인
      const cached = await cacheHelper.get(cacheKey);
      if (cached) {
        console.log(`💾 캐시 적중: ${cacheKey}`);
        return res.json(cached);
      }

      // 원본 res.json 저장
      const originalJson = res.json.bind(res);

      // res.json 오버라이드
      res.json = function(data) {
        // 성공 응답만 캐싱 (status 200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheHelper.set(cacheKey, data, ttl).catch(err => {
            console.error('캐시 저장 실패:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('캐시 미들웨어 오류:', error);
      next();
    }
  };
};

/**
 * 페이지네이션 검증 미들웨어
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // 최대 limit 제한
  const MAX_LIMIT = 100;
  const validatedLimit = Math.min(limit, MAX_LIMIT);

  // 페이지 범위 검증
  if (page < 1) {
    return res.status(400).json({
      status: 'error',
      message: 'page는 1 이상이어야 합니다.'
    });
  }

  if (validatedLimit < 1) {
    return res.status(400).json({
      status: 'error',
      message: 'limit는 1 이상이어야 합니다.'
    });
  }

  // 검증된 값으로 덮어쓰기
  req.query.page = page;
  req.query.limit = validatedLimit;
  req.pagination = {
    page,
    limit: validatedLimit,
    offset: (page - 1) * validatedLimit
  };

  next();
};

/**
 * 쿼리 최적화 헬퍼
 */
const optimizeQuery = {
  /**
   * SELECT 컬럼 최적화
   */
  selectColumns: (model, columns) => {
    return {
      attributes: columns,
      raw: false,
    };
  },

  /**
   * 관계 include 최적화
   */
  includeOptimized: (model, as, attributes, separate = true) => {
    return {
      model,
      as,
      attributes,
      separate, // 별도 쿼리로 N+1 방지
    };
  },

  /**
   * 페이지네이션 옵션
   */
  paginate: (page, limit) => {
    return {
      limit,
      offset: (page - 1) * limit,
    };
  },
};

/**
 * 응답 압축 (대용량 데이터)
 */
const compressResponse = (threshold = 1024) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      const json = JSON.stringify(data);

      // 임계값 이상인 경우 압축 권장 로깅
      if (json.length > threshold) {
        console.warn(`⚠️ 대용량 응답 (${json.length} bytes): ${req.originalUrl}`);
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  cacheResponse,
  validatePagination,
  optimizeQuery,
  compressResponse,
};
