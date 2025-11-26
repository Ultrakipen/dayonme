import rateLimit from 'express-rate-limit';

// 엔드포인트별 차등 Rate Limiting (사용자 증가 대비)

// 1. 조회 API - 높은 제한 (300/15분)
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_READ_MAX || '300', 10),
  message: {
    status: 'error',
    message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // IP 기반 제한
  keyGenerator: (req) => req.ip || 'unknown',
});

// 2. 생성/수정 API - 중간 제한 (20/15분)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_WRITE_MAX || '20', 10),
  message: {
    status: 'error',
    message: '너무 빠르게 생성/수정 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. 인증 API - 낮은 제한 (5/15분)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),
  message: {
    status: 'error',
    message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 성공한 요청은 카운트 제외
});

// 4. 파일 업로드 - 매우 낮은 제한 (10/15분)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || '10', 10),
  message: {
    status: 'error',
    message: '파일 업로드 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. 댓글/좋아요 - 중간 제한 (50/15분)
export const interactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_INTERACTION_MAX || '50', 10),
  message: {
    status: 'error',
    message: '너무 많은 상호작용 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 6. 신고 API - 매우 낮은 제한 (3/시간)
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: parseInt(process.env.RATE_LIMIT_REPORT_MAX || '3', 10),
  message: {
    status: 'error',
    message: '신고 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
