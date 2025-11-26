// middleware/corsMiddleware.ts
import cors from 'cors';
import { NextFunction, Request, Response } from 'express';

// 허용된 오리진 목록
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.0.2.2:3000',    // Android 에뮬레이터
  'http://localhost:8081',    // React Native Metro
  'http://127.0.0.1:8081',
  'http://192.168.0.1:8081',  // 로컬 네트워크 (필요시 수정)
];

// 개발 환경에서는 추가 오리진 허용
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push(
    'http://localhost:19006',  // Expo 웹
    'exp://192.168.0.1:19000', // Expo 앱
    'exp://localhost:19000'
  );
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // 개발 환경: 로컬 네트워크만 허용
    if (process.env.NODE_ENV === 'development') {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)/.test(origin)) {
        return callback(null, true);
      }
    }

    // 테스트 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }

    // origin이 없는 경우 프로덕션에서는 차단
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS 정책에 의해 차단된 요청입니다'));
      }
      return callback(null, true);
    }
    
    // 허용된 origin인지 확인
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // 와일드카드 서브도메인 체크 (선택사항)
    const isAllowedWildcard = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return false;
    });
    
    if (isAllowedWildcard) {
      return callback(null, true);
    }
    
    console.warn(`CORS 차단된 요청: ${origin}`);
    return callback(new Error('CORS 정책에 의해 차단된 요청입니다'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-access-token',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: [
    'Content-Range', 
    'X-Content-Range', 
    'x-access-token',
    'Authorization'
  ],
  maxAge: 86400, // 24시간
  preflightContinue: false,
  optionsSuccessStatus: 204
});

// CORS 에러 핸들러
export const corsErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'CORS 정책에 의해 차단된 요청입니다') {
    return res.status(403).json({
      status: 'error',
      message: 'CORS 정책에 의해 차단된 요청입니다',
      code: 'CORS_ERROR'
    });
  }
  
  // 다른 에러는 다음 미들웨어로 전달
  next(err);
};