// middleware/authMiddleware.ts - 타입 오류 수정
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../models';
import { AuthRequest } from '../types/express';

import { config } from '../config/environment';

const JWT_SECRET = config.security.jwtSecret;

// 테스트 사용자 저장소
const testUsers = new Map();

// 테스트 사용자 등록 함수
export const registerTestUser = (userId: number, userData: any) => {
  if (process.env.NODE_ENV === 'test') {
    testUsers.set(userId, userData);
  }
};

// Rate limiting을 위한 저장소
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 authMiddleware 진입:', req.method, req.path);
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ Authorization header 없음');
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.'
      });
    }

    console.log('✅ Authorization header 존재');
    const [bearer, token] = authHeader.split(' ');
    console.log('🔑 Bearer:', bearer);
    console.log('🔑 Token (first 20 chars):', token ? token.substring(0, 20) : 'null');
    
    if (bearer !== 'Bearer' || !token) {
      console.log('❌ Bearer 토큰 형식 오류');
      return res.status(401).json({
        status: 'error',
        message: '유효하지 않은 인증 토큰 형식입니다.'
      });
    }

    try {
      // 토큰 검증
      const decoded = jwt.verify(token, JWT_SECRET) as { user_id: number; iat?: number; exp?: number };
      const userId = decoded.user_id;

      // 테스트 환경에서 특별한 처리
      if (process.env.NODE_ENV === 'test') {
        const testUser = testUsers.get(userId);
        
        if (testUser) {
          req.user = {
            user_id: userId,
            username: testUser.username || `test${userId}`,
            email: testUser.email,
            nickname: testUser.nickname,
            is_active: true
          };
        } else {
          req.user = {
            user_id: userId,
            username: `test${userId}`,
            email: `test${userId}@example.com`,
            nickname: `TestUser${userId}`,
            is_active: true
          };
        }
        return next();
      }

      // 프로덕션/개발 환경에서는 실제 DB 조회
      const user = await db.User.findByPk(userId);
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }
      
      if (!user.get('is_active')) {
        return res.status(403).json({
          status: 'error', 
          message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
        });
      }

      // 마지막 로그인 시간 업데이트 (선택사항)
      if (process.env.UPDATE_LAST_LOGIN === 'true') {
        try {
          await user.update({ last_login_at: new Date() });
        } catch (updateError) {
          // 업데이트 실패해도 계속 진행
        }
      }

      // req.user에 타입 안전하게 할당
      req.user = {
        user_id: user.get('user_id') as number,
        username: user.get('username') as string,
        email: user.get('email') as string,
        nickname: user.get('nickname') as string,
        is_active: user.get('is_active') as boolean
      };
      
      console.log('✅ authMiddleware 완료, 다음 미들웨어로 진행');
      next();

    } catch (tokenError: any) {
      console.error('토큰 검증 오류:', tokenError.message);
      
      // 토큰 만료
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      // 토큰 형식 오류
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: '유효하지 않은 인증 토큰입니다.',
          code: 'INVALID_TOKEN'
        });
      }
      
      // 기타 토큰 오류
      return res.status(401).json({
        status: 'error',
        message: '토큰 검증에 실패했습니다.',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
    }

  } catch (error: any) {
    console.error('인증 미들웨어 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '인증 처리 중 서버 오류가 발생했습니다.'
    });
  }
};

// 선택적 인증 미들웨어 (토큰이 있으면 검증, 없어도 통과)
export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // 토큰이 없어도 계속 진행
    }

    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      return next(); // 잘못된 형식이어도 계속 진행
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { user_id: number };
      const userId = decoded.user_id;

      if (process.env.NODE_ENV === 'test') {
        const testUser = testUsers.get(userId);
        if (testUser) {
          req.user = {
            user_id: userId,
            username: testUser.username || `test${userId}`,
            email: testUser.email,
            nickname: testUser.nickname,
            is_active: true
          };
        }
        return next();
      }

      const user = await db.User.findByPk(userId);
      
      if (user && user.get('is_active')) {
        req.user = {
          user_id: user.get('user_id') as number,
          username: user.get('username') as string,
          email: user.get('email') as string,
          nickname: user.get('nickname') as string,
          is_active: user.get('is_active') as boolean
        };
      }

    } catch (tokenError) {
      // 선택적 인증이므로 토큰 오류가 있어도 계속 진행
      console.warn('선택적 인증 토큰 오류:', tokenError);
    }

    next();

  } catch (error: any) {
    console.error('선택적 인증 미들웨어 오류:', error);
    next(); // 오류가 있어도 계속 진행
  }
};

// 로그인 시도 제한 미들웨어
export const rateLimitLogin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next(); // 테스트 환경에서는 rate limiting 비활성화
  }

  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15분

  const attempts = loginAttempts.get(clientIp);

  if (attempts) {
    // 시간 윈도우가 지났으면 초기화
    if (now - attempts.lastAttempt > windowMs) {
      loginAttempts.delete(clientIp);
    } else if (attempts.count >= maxAttempts) {
      return res.status(429).json({
        status: 'error',
        message: '너무 많은 로그인 시도입니다. 15분 후 다시 시도해주세요.',
        code: 'TOO_MANY_ATTEMPTS'
      });
    }
  }

  // 실패한 로그인 시도만 카운트하도록 나중에 체크
  const originalJson = res.json;
  res.json = function(data: any) {
    if (data.status === 'error' && req.route?.path === '/login') {
      // 로그인 실패 시에만 카운트 증가
      const currentAttempts = attempts ? attempts.count + 1 : 1;
      loginAttempts.set(clientIp, {
        count: currentAttempts,
        lastAttempt: now
      });
    } else if (data.status === 'success' && req.route?.path === '/login') {
      // 로그인 성공 시 카운트 초기화
      loginAttempts.delete(clientIp);
    }
    
    return originalJson.call(this, data);
  };

  next();
};

// 관리자 권한 확인 미들웨어
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.'
      });
    }

    // 관리자 이메일 목록 (환경변수 + 기본 관리자)
    const adminEmails = [
      'admin@iexist.co.kr',  // 기본 관리자
      'test@example.com',     // 추가 관리자
      ...(process.env.ADMIN_EMAILS?.split(',') || [])
    ].filter(Boolean);
    
    const isAdmin = adminEmails.includes(req.user.email) || 
                   req.user.user_id === 1; // 첫 번째 사용자도 관리자로 인정

    if (!isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: '관리자 권한이 필요합니다.'
      });
    }

    console.log('✅ 관리자 인증 성공:', req.user.email);
    next();

  } catch (error: any) {
    console.error('관리자 권한 확인 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '권한 확인 중 오류가 발생했습니다.'
    });
  }
};

// 사용자 소유권 확인 미들웨어
export const checkOwnership = (resourceUserIdField: string = 'user_id') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const resourceUserId = req.body[resourceUserIdField] || 
                           req.params[resourceUserIdField] || 
                           req.query[resourceUserIdField];
      
      if (resourceUserId && parseInt(resourceUserId) !== req.user.user_id) {
        return res.status(403).json({
          status: 'error',
          message: '해당 리소스에 대한 권한이 없습니다.'
        });
      }

      next();

    } catch (error: any) {
      console.error('소유권 확인 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '권한 확인 중 오류가 발생했습니다.'
      });
    }
  };
};

export default authMiddleware;