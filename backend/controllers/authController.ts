// controllers/authController.ts - 실제 서비스용 인증 컨트롤러
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import db from '../models';
import { AuthRequestGeneric } from '../types/express';
import { config } from '../config/environment';
import { CryptoUtils } from '../utils/crypto';
import { Op } from 'sequelize';
import emailService from '../utils/emailService';
import logger from '../utils/logger';

// Global 타입 확장 (이메일 인증용)
declare global {
  var verificationCodes: { [email: string]: { code: string; expires: Date } } | undefined;
  var verifiedEmails: { [email: string]: number } | undefined;
}

// JWT Payload 타입 정의
interface JWTPayload {
  user_id: number;
  username?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

// 소셜 로그인 API 응답 타입 정의
interface KakaoUser {
  id: number;
  kakao_account: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

interface NaverUser {
  resultcode: string;
  response: {
    id: string;
    email?: string;
    nickname?: string;
    profile_image?: string;
  };
}

interface GoogleUser {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  error?: string;
}

// 요청 타입 정의
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
  profile_image_url?: string;
}

interface SocialLoginRequest {
  email: string;
  username: string;
  provider: 'kakao' | 'naver' | 'google';
  social_id: string;
  nickname?: string;
  profile_image_url?: string;
}

// JWT 토큰 생성 함수 - user_id 사용
const generateToken = (userId: number): string => {
  const payload = { user_id: userId };
  const secret = config.security.jwtSecret as string;
  
  return jwt.sign(payload, secret, { 
    expiresIn: config.security.jwtExpiresIn 
  } as any);
};

// 리프레시 토큰 생성 함수
const generateRefreshToken = (userId: number): string => {
  const payload = { user_id: userId };
  const secret = config.security.jwtSecret as string;
  
  return jwt.sign(payload, secret, { 
    expiresIn: config.security.refreshTokenExpiresIn 
  } as any);
};

// 사용자 정보 정리 함수
const sanitizeUser = (user: any) => {
  const userObj = user.get ? user.get() : user;
  const { password_hash, ...sanitizedUser } = userObj;

  // 관리자 권한 확인
  const adminEmails = [
    'admin@iexist.co.kr',
    'test@example.com',
    ...(process.env.ADMIN_EMAILS?.split(',') || [])
  ].filter(Boolean);

  const isAdmin = adminEmails.includes(userObj.email) || userObj.user_id === 1;

  return {
    ...sanitizedUser,
    is_admin: isAdmin
  };
};

export const authController = {
  // 일반 로그인
  login: async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    try {
      logger.debug('로그인 요청', { email: req.body.email });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.debug('유효성 검사 실패', errors.array());
        return res.status(400).json({
          status: 'error',
          message: '입력 정보가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        logger.debug('필수 필드 누락', { email: !!email, password: !!password });
        return res.status(400).json({
          status: 'error',
          message: '이메일과 비밀번호를 모두 입력해주세요.'
        });
      }

      logger.debug('사용자 검색', { email: email.toLowerCase() });

      // 데이터베이스 연결 상태 확인
      if (!db || !db.User) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ 데이터베이스 모델이 초기화되지 않음');
        }
        return res.status(500).json({
          status: 'error',
          message: '데이터베이스 연결 오류가 발생했습니다.'
        });
      }

      // 이메일로 사용자 찾기
      const user = await db.User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // 비밀번호 확인
      if (!CryptoUtils || typeof CryptoUtils.verifyPassword !== 'function') {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ CryptoUtils가 초기화되지 않음');
        }
        return res.status(500).json({
          status: 'error',
          message: '암호화 유틸리티 오류가 발생했습니다.'
        });
      }

      const isPasswordValid = await CryptoUtils.verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // 계정 활성화 상태 확인
      if (!user.is_active) {
        return res.status(403).json({
          status: 'error',
          message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
        });
      }

      // JWT 토큰 생성
      const token = generateToken(user.user_id);

      // Refresh 토큰 생성
      const refreshToken = generateRefreshToken(user.user_id);

      // 마지막 로그인 시간 업데이트
      try {
        await user.update({ last_login_at: new Date() });
      } catch (updateError) {
        // 업데이트 실패해도 로그인은 진행
      }

      // 사용자 정보 정리 (비밀번호 제외)
      const sanitizedUser = sanitizeUser(user);

      res.json({
        status: 'success',
        message: '로그인이 완료되었습니다.',
        data: {
          token,
          refresh_token: refreshToken,
          user: sanitizedUser
        }
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 로그인 오류:', error.message);
      }

      res.status(500).json({
        status: 'error',
        message: '로그인 처리 중 오류가 발생했습니다.',
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            message: error.message,
            stack: error.stack
          }
        })
      });
    }
  },

  // 회원가입
  register: async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 회원가입 요청:', req.body.email);
      }

      // 유효성 검사
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: '입력 정보가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { username, email, password, nickname, profile_image_url } = req.body;

      // 이메일 중복 확인
      const existingUserByEmail = await db.User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingUserByEmail) {
        return res.status(409).json({
          status: 'error',
          message: '이미 사용 중인 이메일입니다.'
        });
      }

      // 사용자명 중복 확인
      const existingUserByUsername = await db.User.findOne({
        where: { username }
      });

      if (existingUserByUsername) {
        return res.status(409).json({
          status: 'error',
          message: '이미 사용 중인 사용자명입니다.'
        });
      }

      // 비밀번호 해싱
      const password_hash = await CryptoUtils.hashPassword(password);

      // 새 사용자 생성
      const newUser = await db.User.create({
        username,
        email: email.toLowerCase(),
        password_hash,
        nickname: nickname || username,
        profile_image_url: profile_image_url || undefined,
        theme_preference: 'system',
        is_active: true,
        is_email_verified: true
      });

      // 사용자 통계 초기화
      await db.UserStats.create({
        user_id: newUser.user_id,
        my_day_post_count: 0,
        someone_day_post_count: 0,
        my_day_like_received_count: 0,
        someone_day_like_received_count: 0,
        my_day_comment_received_count: 0,
        someone_day_comment_received_count: 0,
        challenge_count: 0
      });

      // JWT 토큰 생성
      const token = generateToken(newUser.user_id);

      // 사용자 정보 정리
      const sanitizedUser = sanitizeUser(newUser);

      res.status(201).json({
        status: 'success',
        message: '회원가입이 완료되었습니다.',
        data: {
          token,
          user: sanitizedUser
        }
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 회원가입 오류:', error.message);
      }
      res.status(500).json({
        status: 'error',
        message: '회원가입 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 카카오 로그인
  kakaoLogin: async (req: Request<{}, {}, { access_token: string }>, res: Response) => {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        return res.status(400).json({
          status: 'error',
          message: '카카오 액세스 토큰이 필요합니다.'
        });
      }

      // 카카오 API로 사용자 정보 가져오기
      const kakaoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });

      if (!kakaoResponse.ok) {
        return res.status(401).json({
          status: 'error',
          message: '카카오 인증에 실패했습니다.'
        });
      }

      const kakaoUser = await kakaoResponse.json() as KakaoUser;
      const { id: kakao_id, kakao_account } = kakaoUser;

      if (!kakao_account?.email) {
        return res.status(400).json({
          status: 'error',
          message: '이메일 정보가 필요합니다. 카카오 계정에서 이메일 제공에 동의해주세요.'
        });
      }

      const email = kakao_account.email;
      const nickname = kakao_account.profile?.nickname || `kakao_${kakao_id}`;
      const profile_image_url = kakao_account.profile?.profile_image_url;

      // 기존 사용자 찾기
      let user = await db.User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (user) {
        // 기존 사용자 로그인
        await user.update({ last_login_at: new Date() });
      } else {
        // 새 사용자 생성
        user = await db.User.create({
          username: `kakao_${kakao_id}`,
          email: email.toLowerCase(),
          password_hash: await bcrypt.hash(Math.random().toString(36), 12), // 임시 패스워드
          nickname,
          profile_image_url,
          theme_preference: 'system',
          is_active: true,
          is_email_verified: true
        });

        // 사용자 통계 초기화
        await db.UserStats.create({
          user_id: user.user_id,
          my_day_post_count: 0,
          someone_day_post_count: 0,
          my_day_like_received_count: 0,
          someone_day_like_received_count: 0,
          my_day_comment_received_count: 0,
          someone_day_comment_received_count: 0,
          challenge_count: 0
        });
      }

      const token = generateToken(user.user_id);
      const refreshToken = generateRefreshToken(user.user_id);
      const sanitizedUser = sanitizeUser(user);

      res.json({
        status: 'success',
        message: '카카오 로그인이 완료되었습니다.',
        data: {
          token,
          refresh_token: refreshToken,
          user: sanitizedUser
        }
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 카카오 로그인 오류:', error.message);
      }
      res.status(500).json({
        status: 'error',
        message: '카카오 로그인 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 네이버 로그인
  naverLogin: async (req: Request<{}, {}, { access_token: string }>, res: Response) => {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        return res.status(400).json({
          status: 'error',
          message: '네이버 액세스 토큰이 필요합니다.'
        });
      }

      // 네이버 API로 사용자 정보 가져오기
      const naverResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });

      if (!naverResponse.ok) {
        return res.status(401).json({
          status: 'error',
          message: '네이버 인증에 실패했습니다.'
        });
      }

      const naverUser = await naverResponse.json() as NaverUser;
      const { id: naver_id, email, nickname, profile_image } = naverUser.response;

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: '이메일 정보가 필요합니다.'
        });
      }

      // 기존 사용자 찾기 또는 생성
      let user = await db.User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (user) {
        await user.update({ last_login_at: new Date() });
      } else {
        user = await db.User.create({
          username: `naver_${naver_id}`,
          email: email.toLowerCase(),
          password_hash: await bcrypt.hash(Math.random().toString(36), 12),
          nickname: nickname || `naver_${naver_id}`,
          profile_image_url: profile_image,
          theme_preference: 'system',
          is_active: true,
          is_email_verified: true
        });

        await db.UserStats.create({
          user_id: user.user_id,
          my_day_post_count: 0,
          someone_day_post_count: 0,
          my_day_like_received_count: 0,
          someone_day_like_received_count: 0,
          my_day_comment_received_count: 0,
          someone_day_comment_received_count: 0,
          challenge_count: 0
        });
      }

      const token = generateToken(user.user_id);
      const refreshToken = generateRefreshToken(user.user_id);
      const sanitizedUser = sanitizeUser(user);

      res.json({
        status: 'success',
        message: '네이버 로그인이 완료되었습니다.',
        data: {
          token,
          refresh_token: refreshToken,
          user: sanitizedUser
        }
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 네이버 로그인 오류:', error.message);
      }
      res.status(500).json({
        status: 'error',
        message: '네이버 로그인 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 구글 로그인
  googleLogin: async (req: Request<{}, {}, { id_token: string }>, res: Response) => {
    try {
      const { id_token } = req.body;

      if (!id_token) {
        return res.status(400).json({
          status: 'error',
          message: '구글 ID 토큰이 필요합니다.'
        });
      }

      // 구글 ID 토큰 검증 (간단한 방법 - 실제로는 google-auth-library 사용 권장)
      const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
      
      if (!googleResponse.ok) {
        return res.status(401).json({
          status: 'error',
          message: '구글 인증에 실패했습니다.'
        });
      }

      const googleUser = await googleResponse.json() as GoogleUser;
      const { sub: google_id, email, name, picture } = googleUser;

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: '이메일 정보가 필요합니다.'
        });
      }

      // 기존 사용자 찾기 또는 생성
      let user = await db.User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (user) {
        await user.update({ last_login_at: new Date() });
      } else {
        user = await db.User.create({
          username: `google_${google_id}`,
          email: email.toLowerCase(),
          password_hash: await bcrypt.hash(Math.random().toString(36), 12),
          nickname: name || `google_${google_id}`,
          profile_image_url: picture,
          theme_preference: 'system',
          is_active: true,
          is_email_verified: true
        });

        await db.UserStats.create({
          user_id: user.user_id,
          my_day_post_count: 0,
          someone_day_post_count: 0,
          my_day_like_received_count: 0,
          someone_day_like_received_count: 0,
          my_day_comment_received_count: 0,
          someone_day_comment_received_count: 0,
          challenge_count: 0
        });
      }

      const token = generateToken(user.user_id);
      const refreshToken = generateRefreshToken(user.user_id);
      const sanitizedUser = sanitizeUser(user);

      res.json({
        status: 'success',
        message: '구글 로그인이 완료되었습니다.',
        data: {
          token,
          refresh_token: refreshToken,
          user: sanitizedUser
        }
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 구글 로그인 오류:', error);
      }
      res.status(500).json({
        status: 'error',
        message: '구글 로그인 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async (req: AuthRequestGeneric<any>, res: Response) => {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const user = await db.User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      const sanitizedUser = sanitizeUser(user);

      res.json({
        status: 'success',
        data: {
          user: sanitizedUser
        }
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 사용자 정보 조회 오류:', error);
      }
      res.status(500).json({
        status: 'error',
        message: '사용자 정보 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 로그아웃 (토큰 무효화는 클라이언트에서 처리)
  logout: async (req: AuthRequestGeneric<any>, res: Response) => {
    try {
      // 실제로는 토큰 블랙리스트나 Redis를 사용하여 토큰 무효화 처리
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 로그아웃 요청:', req.user?.user_id);
      }

      res.json({
        status: 'success',
        message: '로그아웃이 완료되었습니다.'
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 로그아웃 오류:', error);
      }
      res.status(500).json({
        status: 'error',
        message: '로그아웃 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 토큰 갱신
  refreshToken: async (req: Request<{}, {}, { refresh_token: string }>, res: Response) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(401).json({
          status: 'error',
          message: 'Refresh 토큰이 필요합니다.'
        });
      }

      // Refresh 토큰 검증
      let decoded: JWTPayload;
      try {
        decoded = jwt.verify(refresh_token, config.security.jwtSecret as string) as JWTPayload;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Refresh 토큰 검증 실패:', error);
        }
        return res.status(401).json({
          status: 'error',
          message: 'Refresh 토큰이 유효하지 않거나 만료되었습니다.',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      const userId = decoded.user_id;

      // 사용자 정보 재확인
      const user = await db.User.findByPk(userId);

      if (!user || !user.is_active) {
        return res.status(401).json({
          status: 'error',
          message: '사용자를 찾을 수 없거나 비활성화된 계정입니다.'
        });
      }

      // 새로운 토큰 생성
      const newToken = generateToken(userId);
      const newRefreshToken = generateRefreshToken(userId);

      // 마지막 로그인 시간 업데이트
      await user.update({ last_login_at: new Date() });

      // 사용자 정보 정리
      const sanitizedUser = sanitizeUser(user);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 토큰 갱신 성공:', user.email);
      }

      res.json({
        status: 'success',
        message: '토큰이 갱신되었습니다.',
        data: {
          token: newToken,
          refresh_token: newRefreshToken,
          user: sanitizedUser
        }
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 토큰 갱신 오류:', error);
      }
      res.status(500).json({
        status: 'error',
        message: '토큰 갱신 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 비밀번호 재설정 요청
  forgotPassword: async (req: Request<{}, {}, { email: string }>, res: Response) => {
    try {
      const { email } = req.body;

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 비밀번호 재설정 요청:', email);
      }

      const user = await db.User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // 보안상 실제 존재 여부는 알리지 않음
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ 존재하지 않는 이메일이지만 성공 응답 반환');
        }
        return res.json({
          status: 'success',
          message: '이메일이 존재하는 경우 재설정 링크를 전송했습니다.'
        });
      }

      // 랜덤 토큰 생성 (32바이트 = 64자 hex 문자열)
      const resetToken = crypto.randomBytes(32).toString('hex');

      // 토큰 만료 시간 설정 (1시간 후)
      const resetTokenExpires = new Date();
      resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 재설정 토큰 생성:', {
          token: resetToken.substring(0, 10) + '...',
          expires: resetTokenExpires
        });
      }

      // 토큰을 데이터베이스에 저장
      await user.update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires
      });

      // 재설정 URL 생성 (프론트엔드 URL)
      // 개발 환경: exp://192.168.x.x:8081 또는 http://localhost:8081
      // 프로덕션: 실제 앱 딥링크 또는 웹 URL
      const resetUrl = `exp://localhost:8081/reset-password?token=${resetToken}`;

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 이메일 전송 시작');
      }

      // 이메일 전송
      const emailResult = await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        resetUrl
      );

      if (process.env.NODE_ENV === 'development') {
        if (emailResult.success) {
          console.log('✅ 비밀번호 재설정 이메일 전송 성공');
          if (emailResult.previewUrl) {
            console.log('📧 이메일 미리보기:', emailResult.previewUrl);
            console.log('ℹ️  개발 중에는 위 URL에서 전송된 이메일을 확인할 수 있습니다.');
          }
        } else {
          console.error('❌ 이메일 전송 실패:', emailResult.error);
        }
      }

      res.json({
        status: 'success',
        message: '비밀번호 재설정 링크를 이메일로 전송했습니다.',
        ...(process.env.NODE_ENV === 'development' && emailResult.previewUrl && {
          debug: {
            previewUrl: emailResult.previewUrl,
            message: '개발 모드: 위 URL에서 이메일을 확인할 수 있습니다.'
          }
        })
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 비밀번호 재설정 요청 오류:', error);
      }
      res.status(500).json({
        status: 'error',
        message: '비밀번호 재설정 요청 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 비밀번호 재설정 (토큰 검증 및 비밀번호 변경)
  resetPassword: async (req: Request<{}, {}, { token: string; newPassword: string }>, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 비밀번호 재설정 시도:', { token: token?.substring(0, 10) + '...' });
      }

      if (!token || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: '토큰과 새 비밀번호를 모두 입력해주세요.'
        });
      }

      // 비밀번호 길이 검증
      if (newPassword.length < 6) {
        return res.status(400).json({
          status: 'error',
          message: '비밀번호는 최소 6자 이상이어야 합니다.'
        });
      }

      // 토큰으로 사용자 찾기
      const user = await db.User.findOne({
        where: {
          reset_token: token,
          reset_token_expires: {
            [Op.gt]: new Date() // 토큰이 만료되지 않았는지 확인
          }
        }
      });

      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ 유효하지 않거나 만료된 토큰');
        }
        return res.status(400).json({
          status: 'error',
          message: '유효하지 않거나 만료된 재설정 링크입니다.'
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 유효한 토큰 확인:', user.email);
      }

      // 새 비밀번호 해싱
      const newPasswordHash = await CryptoUtils.hashPassword(newPassword);

      // 비밀번호 업데이트 및 토큰 제거
      await user.update({
        password_hash: newPasswordHash,
        reset_token: undefined,
        reset_token_expires: undefined
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 비밀번호 재설정 완료:', user.email);
      }

      res.json({
        status: 'success',
        message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.'
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 비밀번호 재설정 오류:', error);
      }
      res.status(500).json({
        status: 'error',
        message: '비밀번호 재설정 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 재설정 토큰 유효성 확인 (선택사항 - 프론트엔드에서 토큰 유효성 미리 확인용)
  checkResetToken: async (req: Request<{}, {}, { token: string }>, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          status: 'error',
          message: '토큰이 필요합니다.'
        });
      }

      const user = await db.User.findOne({
        where: {
          reset_token: token,
          reset_token_expires: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!user) {
        return res.status(400).json({
          status: 'error',
          message: '유효하지 않거나 만료된 토큰입니다.',
          valid: false
        });
      }

      res.json({
        status: 'success',
        message: '유효한 토큰입니다.',
        valid: true,
        data: {
          email: user.email // 사용자에게 어떤 계정인지 표시용
        }
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 토큰 확인 오류:', error);
      }
      res.status(500).json({
        status: 'error',
        message: '토큰 확인 중 오류가 발생했습니다.'
      });
    }
  }
,

  // 이메일 인증 코드 전송
  sendVerificationCode: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: '이메일 주소가 필요합니다.'
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 인증 코드 전송 요청:', email);
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 'error',
          message: '올바른 이메일 형식이 아닙니다.'
        });
      }

      // 6자리 랜덤 인증 코드 생성
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료

      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 생성된 인증 코드:', verificationCode);
      }

      // 전역 변수에 저장 (임시 솔루션)
      if (!global.verificationCodes) {
        global.verificationCodes = {};
      }
      global.verificationCodes[email.toLowerCase()] = {
        code: verificationCode,
        expires: expiresAt
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('💾 인증 코드 저장 완료');
        console.log('📧 이메일 발송 시작');
      }
      const result = await emailService.sendVerificationCode(email, verificationCode);

      if (result.success) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 인증 코드 전송 성공:', email);
        }
        res.json({
          status: 'success',
          message: '인증 코드가 이메일로 전송되었습니다.',
          ...(process.env.NODE_ENV === 'development' && result.previewUrl && {
            debug: {
              previewUrl: result.previewUrl,
              message: '개발 모드: 위 URL에서 이메일을 확인할 수 있습니다.'
            }
          })
        });
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ 이메일 발송 실패:', result.error);
        }
        res.status(500).json({
          status: 'error',
          message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'
        });
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 인증 코드 전송 오류:', error);
      }
      res.status(500).json({
        status: 'error',
        message: '인증 코드 전송 중 오류가 발생했습니다.'
      });
    }
  },

  // 인증 코드 검증
  verifyCode: async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          status: 'error',
          message: '이메일과 인증 코드가 필요합니다.'
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 인증 코드 검증 요청:', email, code);
      }

      const verification = global.verificationCodes?.[email.toLowerCase()];

      if (!verification) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ 인증 코드를 찾을 수 없음:', email);
        }
        return res.status(400).json({
          status: 'error',
          message: '인증 코드를 찾을 수 없습니다. 다시 요청해주세요.'
        });
      }

      // 만료 시간 확인
      if (verification.expires < new Date()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ 인증 코드 만료:', email);
        }
        if (global.verificationCodes) {
          delete global.verificationCodes![email.toLowerCase()];
        }
        return res.status(400).json({
          status: 'error',
          message: '인증 코드가 만료되었습니다. 다시 요청해주세요.'
        });
      }

      // 코드 일치 여부 확인
      if (verification.code !== code) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ 잘못된 인증 코드:', { expected: verification.code, received: code });
        }
        return res.status(400).json({
          status: 'error',
          message: '잘못된 인증 코드입니다.'
        });
      }

      // 인증 성공 - 저장된 코드 삭제
      if (global.verificationCodes) {
        delete global.verificationCodes![email.toLowerCase()];
      }

      // 인증된 이메일 목록에 추가 (5분간 유효)
      if (!global.verifiedEmails) {
        global.verifiedEmails = {};
      }
      global.verifiedEmails[email.toLowerCase()] = Date.now();

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 이메일 인증 성공:', email);
      }

      res.json({
        status: 'success',
        message: '이메일 인증이 완료되었습니다.'
      });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 인증 코드 검증 오류:', error);
      }
      res.status(500).json({
        status: 'error',
        message: '인증 코드 검증 중 오류가 발생했습니다.'
      });
    }
  }
};

export default authController;