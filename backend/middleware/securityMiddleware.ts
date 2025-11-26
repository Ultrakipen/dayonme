import { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import config from '../config/config';
const xss = require('xss-clean');
const hpp = require('hpp');

export const configSecurity = (app: Application): void => {
  // 기본 보안 헤더 설정
  app.use(helmet());
  
  // CSP 설정
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    })
  );

  // XSS 공격 방지
  app.use(xss());

  // HTTP Parameter Pollution 방지
  app.use(hpp());

  // CORS 설정
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && config.cors.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    } else if (origin) {
      return res.status(403).json({ message: 'CORS 정책에 의해 차단되었습니다.' });
    }
    next();
  });

  // 보안 헤더 설정
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // 에러 핸들러
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.'
      });
    }
    next(err);
  });
};