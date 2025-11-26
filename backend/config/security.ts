import { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import { FilterXSS } from 'xss';

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const xssFilter = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
});

export const configSecurity = (app: Application): void => {
  // Helmet 보안 헤더 설정
  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    } : false,
    crossOriginEmbedderPolicy: isProduction,
    crossOriginOpenerPolicy: isProduction ? { policy: 'same-origin' } : false,
    crossOriginResourcePolicy: isProduction ? { policy: 'same-origin' } : false,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: isProduction ? {
      maxAge: 31536000, // 1년
      includeSubDomains: true,
      preload: true,
    } : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  }));

  // HTTP Parameter Pollution 방지
  app.use(hpp({
    whitelist: ['tags', 'emotions', 'categories'] // 배열 허용 파라미터
  }));

  // 쿠키 파서 (보안 설정)
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // XSS 방어 강화
  app.use((req: Request, res: Response, next: NextFunction) => {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') return xssFilter.process(obj);
      if (Array.isArray(obj)) return obj.map(sanitize);
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    next();
  });

  // 추가 보안 헤더
  app.use((req: Request, res: Response, next: NextFunction) => {
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options (클릭재킹 방지)
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection (구형 브라우저용)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Permissions-Policy (기능 제한)
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Cache-Control (API 응답 캐싱 방지)
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  });

  // 요청 크기 제한 (DoS 방지)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxSize) {
      return res.status(413).json({
        status: 'error',
        message: '요청 크기가 너무 큽니다.'
      });
    }
    next();
  });

  // 인증 에러 핸들러
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.'
      });
    }

    // JWT 만료 에러
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: '토큰이 만료되었습니다.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // JSON 파싱 에러
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        status: 'error',
        message: '잘못된 JSON 형식입니다.'
      });
    }

    next(err);
  });
};

// 민감한 데이터 로깅 방지
export const sanitizeLogData = (data: any): any => {
  if (!data) return data;

  const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'cookie'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};
