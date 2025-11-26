// routes/socialAuth.ts - 소셜 로그인 라우터
import express from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import db from '../models';
import { config } from '../config/env';

const router = express.Router();
const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRATION = config.jwt.expiresIn;

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

// 유효성 검사 미들웨어
const kakaoLoginValidation = [
  body('access_token')
    .notEmpty()
    .withMessage('카카오 액세스 토큰이 필요합니다.')
];

const naverLoginValidation = [
  body('access_token')
    .notEmpty()
    .withMessage('네이버 액세스 토큰이 필요합니다.')
];

const googleLoginValidation = [
  body('id_token')
    .notEmpty()
    .withMessage('구글 ID 토큰이 필요합니다.')
];

// 유효성 검사 결과 처리
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: '입력 정보가 올바르지 않습니다.',
      errors: errors.array()
    });
  }
  
  next();
};

// 공통 사용자 생성/로그인 처리 함수
const handleSocialLogin = async (
  provider: string,
  socialId: string,
  email: string,
  nickname?: string,
  profileImageUrl?: string
) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // 기존 사용자 찾기
    let user = await db.User.findOne({
      where: { email: email.toLowerCase() },
      transaction
    });

    if (user) {
      // 기존 사용자 로그인
      if (!user.get('is_active')) {
        await transaction.rollback();
        throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
      }

      // 마지막 로그인 시간 업데이트
      await user.update({ last_login_at: new Date() }, { transaction });
    } else {
      // 새 사용자 생성
      const username = `${provider}_${socialId}`;
      const tempPassword = await bcrypt.hash(Math.random().toString(36), 10);

      user = await db.User.create({
        username,
        email: email.toLowerCase(),
        password_hash: tempPassword,
        nickname: nickname || `${provider}유저`,
        profile_image_url: profileImageUrl,
        theme_preference: 'system',
        is_active: true,
        is_email_verified: true,
      }, { transaction });

      // 사용자 통계 초기화
      await db.UserStats.create({
        user_id: user.get('user_id'),
        my_day_post_count: 0,
        someone_day_post_count: 0,
        my_day_like_received_count: 0,
        someone_day_like_received_count: 0,
        my_day_comment_received_count: 0,
        someone_day_comment_received_count: 0,
        challenge_count: 0
      }, { transaction });

      console.log(`✅ 새 ${provider} 사용자 생성:`, {
        user_id: user.get('user_id'),
        email: email.toLowerCase()
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { user_id: user.get('user_id') },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION } as jwt.SignOptions
    );

    await transaction.commit();

    return {
      token,
      user: {
        user_id: user.get('user_id'),
        username: user.get('username'),
        email: user.get('email'),
        nickname: user.get('nickname'),
        profile_image_url: user.get('profile_image_url'),
        theme_preference: user.get('theme_preference')
      }
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// 카카오 로그인
router.post('/kakao', kakaoLoginValidation, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { access_token } = req.body;

    console.log('🔄 카카오 로그인 시도');

    // 카카오 API로 사용자 정보 가져오기
    const kakaoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    if (!kakaoResponse.ok) {
      console.error('카카오 API 응답 오류:', kakaoResponse.status);
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
    const nickname = kakao_account.profile?.nickname;
    const profileImageUrl = kakao_account.profile?.profile_image_url;

    const loginResult = await handleSocialLogin(
      'kakao',
      kakao_id.toString(),
      email,
      nickname,
      profileImageUrl
    );

    console.log('✅ 카카오 로그인 성공:', email);

    res.json({
      status: 'success',
      message: '카카오 로그인이 완료되었습니다.',
      data: loginResult
    });

  } catch (error: any) {
    console.error('❌ 카카오 로그인 오류:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || '카카오 로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 네이버 로그인
router.post('/naver', naverLoginValidation, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { access_token } = req.body;

    console.log('🔄 네이버 로그인 시도');

    // 네이버 API로 사용자 정보 가져오기
    const naverResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!naverResponse.ok) {
      console.error('네이버 API 응답 오류:', naverResponse.status);
      return res.status(401).json({
        status: 'error',
        message: '네이버 인증에 실패했습니다.'
      });
    }

    const naverUser = await naverResponse.json() as NaverUser;

    if (naverUser.resultcode !== '00') {
      return res.status(401).json({
        status: 'error',
        message: '네이버 사용자 정보 조회에 실패했습니다.'
      });
    }

    const { id: naver_id, email, nickname, profile_image } = naverUser.response;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: '이메일 정보가 필요합니다.'
      });
    }

    const loginResult = await handleSocialLogin(
      'naver',
      naver_id,
      email,
      nickname,
      profile_image
    );

    console.log('✅ 네이버 로그인 성공:', email);

    res.json({
      status: 'success',
      message: '네이버 로그인이 완료되었습니다.',
      data: loginResult
    });

  } catch (error: any) {
    console.error('❌ 네이버 로그인 오류:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || '네이버 로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 구글 로그인
router.post('/google', googleLoginValidation, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { id_token } = req.body;

    console.log('🔄 구글 로그인 시도');

    // 구글 ID 토큰 검증
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);

    if (!googleResponse.ok) {
      console.error('구글 토큰 검증 오류:', googleResponse.status);
      return res.status(401).json({
        status: 'error',
        message: '구글 인증에 실패했습니다.'
      });
    }

    const googleUser = await googleResponse.json() as GoogleUser;

    // 토큰 유효성 확인
    if (googleUser.error) {
      return res.status(401).json({
        status: 'error',
        message: '유효하지 않은 구글 토큰입니다.'
      });
    }

    const { sub: google_id, email, name, picture } = googleUser;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: '이메일 정보가 필요합니다.'
      });
    }

    const loginResult = await handleSocialLogin(
      'google',
      google_id,
      email,
      name,
      picture
    );

    console.log('✅ 구글 로그인 성공:', email);

    res.json({
      status: 'success',
      message: '구글 로그인이 완료되었습니다.',
      data: loginResult
    });

  } catch (error: any) {
    console.error('❌ 구글 로그인 오류:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || '구글 로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

export default router;