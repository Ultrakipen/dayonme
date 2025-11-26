import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    user_id: number;
    username: string;
    email: string;
    nickname?: string;
    is_active: boolean;
  };
}

export interface JWTPayload {
  user_id: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class AuthMiddleware {
  // JWT 토큰 생성
  static generateToken(user: any): string {
    const payload: JWTPayload = {
      user_id: user.user_id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, config.security.jwtSecret as string, {
      expiresIn: config.security.jwtExpiresIn
    } as any);
  }

  // 리프레시 토큰 생성
  static generateRefreshToken(user: any): string {
    const payload: JWTPayload = {
      user_id: user.user_id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, config.security.jwtSecret as string, {
      expiresIn: config.security.refreshTokenExpiresIn
    } as any);
  }

  // JWT 토큰 검증
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.security.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('유효하지 않은 토큰입니다.');
    }
  }

  // 인증 필수 미들웨어
  static requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: '인증 토큰이 필요합니다.',
          error: 'NO_TOKEN'
        });
        return;
      }

      const token = authHeader.substring(7);
      const decoded = AuthMiddleware.verifyToken(token);

      // 사용자 정보 조회
      const user = await User.findByPk(decoded.user_id, {
        attributes: ['user_id', 'username', 'email', 'nickname', 'is_active']
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: '존재하지 않는 사용자입니다.',
          error: 'USER_NOT_FOUND'
        });
        return;
      }

      if (!user.is_active) {
        res.status(401).json({
          success: false,
          message: '비활성화된 계정입니다.',
          error: 'ACCOUNT_DISABLED'
        });
        return;
      }

      req.user = user.toJSON();
      next();
    } catch (error) {
      console.error('인증 오류:', error);
      
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: '토큰이 만료되었습니다.',
          error: 'TOKEN_EXPIRED'
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
        error: 'INVALID_TOKEN'
      });
    }
  };

  // 선택적 인증 미들웨어 (토큰이 있으면 인증, 없어도 통과)
  static optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.substring(7);
      const decoded = AuthMiddleware.verifyToken(token);

      const user = await User.findByPk(decoded.user_id, {
        attributes: ['user_id', 'username', 'email', 'nickname', 'is_active']
      });

      if (user && user.is_active) {
        req.user = user.toJSON();
      }

      next();
    } catch (error) {
      // 토큰이 유효하지 않아도 계속 진행
      next();
    }
  };

  // 관리자 권한 확인 미들웨어
  static requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '인증이 필요합니다.',
          error: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // 관리자 계정 확인 (이메일 기반)
      const adminEmails = config.security.adminEmails;
      if (!adminEmails.includes(req.user.email)) {
        res.status(403).json({
          success: false,
          message: '관리자 권한이 필요합니다.',
          error: 'ADMIN_REQUIRED'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('관리자 권한 확인 오류:', error);
      res.status(500).json({
        success: false,
        message: '권한 확인 중 오류가 발생했습니다.',
        error: 'PERMISSION_CHECK_FAILED'
      });
    }
  };
}

// Export the middleware function directly for convenience
export const authMiddleware = AuthMiddleware.requireAuth;