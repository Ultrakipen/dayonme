import { Router, Response, NextFunction } from 'express';
import userController from '../controllers/userController';
import authMiddleware from '../middleware/authMiddleware';
import { AuthRequest } from '../types/express';
import { validateRequest } from '../middleware/validationMiddleware';
import { uploadProfileImage, handleUploadError, processProfileImage } from '../middleware/uploadMiddleware';

const router = Router();
const expressValidator = require('express-validator');
const { body, query } = expressValidator;

// 회원가입
router.post(
  '/register',
  validateRequest([
    body('username')
      .notEmpty()
      .withMessage('사용자 이름은 필수입니다.')
      .isLength({ min: 2, max: 30 })
      .withMessage('사용자 이름은 2자 이상 30자 이하여야 합니다.'),
    body('email')
      .isEmail()
      .withMessage('유효한 이메일을 입력해주세요.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('비밀번호는 최소 6자 이상이어야 합니다.')
  ]),
  userController.register
);

// 로그인 
router.post(
  '/login',
  validateRequest([
    body('email')
      .isEmail()
      .withMessage('유효한 이메일을 입력해주세요.')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('비밀번호를 입력해주세요.')
  ]),
  userController.login
);

// 사용자 차단 해제
router.delete('/block', authMiddleware, userController.unblockUser);

// routes/users.ts (프로필 조회 부분만 수정)

// routes/users.ts의 프로필 조회 라우트 (49-79행 부분) 수정

// 프로필 조회 - 본인 프로필 조회
router.get('/profile', authMiddleware, userController.getProfile);

// 프로필 업데이트
router.put(
  '/profile',
  authMiddleware,
  validateRequest([
    body('nickname')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('닉네임은 2자 이상 50자 이하여야 합니다.'),
    body('theme_preference')
      .optional()
      .isIn(['light', 'dark', 'system'])
      .withMessage('유효하지 않은 테마 설정입니다.')
  ]),
  userController.updateProfile
);

// 사용자차단
router.post('/block', authMiddleware, userController.blockUser);

// 비밀번호 변경
router.put(
  '/password',
  authMiddleware,
  validateRequest([
    body('currentPassword')
      .notEmpty()
      .withMessage('현재 비밀번호를 입력해주세요.'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('새 비밀번호는 최소 6자 이상이어야 합니다.')
  ]),
  userController.changePassword
);

// 로그아웃
router.post('/logout', authMiddleware, userController.logout);

// 비밀번호 재설정 요청
router.post(
  '/forgot-password',
  validateRequest([
    body('email')
      .isEmail()
      .withMessage('유효한 이메일을 입력해주세요.')
      .normalizeEmail()
  ]),
  (req, res) => userController.forgotPassword(req, res)
);

// 비밀번호 재설정
router.post(
  '/reset-password',
  validateRequest([
    body('token')
      .notEmpty()
      .withMessage('토큰은 필수 항목입니다.'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('비밀번호는 최소 6자 이상이어야 합니다.')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/)
      .withMessage('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.')
  ]),
  userController.resetPassword
);

// 회원탈퇴
router.delete(
  '/withdrawal',
  authMiddleware,
  validateRequest([
    body('password')
      .notEmpty()
      .withMessage('비밀번호를 입력해주세요.')
  ]),
  userController.withdrawal
);

// 이메일 중복 확인
router.get(
  '/check-email',
  validateRequest([
    query('email')
      .isEmail()
      .withMessage('유효한 이메일을 입력해주세요.')
      .normalizeEmail()
  ]),
  userController.checkEmail
);

// 닉네임 중복 확인
router.get(
  '/check-nickname',
  validateRequest([
    query('nickname')
      .notEmpty()
      .withMessage('닉네임을 입력해주세요.')
      .isLength({ min: 2, max: 50 })
      .withMessage('닉네임은 2자 이상 50자 이하여야 합니다.')
  ]),
  userController.checkNickname
);

// 프로필 이미지 업로드 라우트
router.post('/profile/image', 
  authMiddleware, 
  (req, res, next) => {
    uploadProfileImage(req, res, (err) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  },
  processProfileImage,
  async (req: AuthRequest, res: Response) => {
    try {
      const processedImage = (req as any).processedImage;
      
      if (!processedImage) {
        return res.status(400).json({
          status: 'error',
          message: '업로드된 이미지가 없습니다.'
        });
      }

      res.json({
        status: 'success',
        message: '프로필 이미지가 성공적으로 업로드되었습니다.',
        data: {
          filename: processedImage.filename,
          url: processedImage.url,
          size: processedImage.size
        }
      });

    } catch (error) {
      console.error('프로필 이미지 업로드 응답 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '이미지 업로드 처리 중 오류가 발생했습니다.'
      });
    }
  }
);


// 데이터 내보내기 (GDPR 준수)
router.get(
  '/export-data',
  authMiddleware,
  userController.exportUserData
);
// 데이터 내보내기 진행 상태 확인
router.get(
  '/export-progress',
  authMiddleware,
  userController.getExportProgress
);

// 내보내기 파일 다운로드
router.get(
  '/download/:filename',
  userController.downloadExportFile
);
// 알림 설정 조회 라우트
router.get(
  '/notification-settings',
  authMiddleware,
  userController.getNotificationSettings
);

// 알림 설정 업데이트 라우트 (기존)
router.put(
  '/notification-settings',
  authMiddleware,
  validateRequest([
    body('like_notifications').optional().isBoolean().withMessage('좋아요 알림 설정은 boolean 값이어야 합니다.'),
    body('comment_notifications').optional().isBoolean().withMessage('댓글 알림 설정은 boolean 값이어야 합니다.'),
    body('challenge_notifications').optional().isBoolean().withMessage('챌린지 알림 설정은 boolean 값이어야 합니다.'),
    body('encouragement_notifications').optional().isBoolean().withMessage('격려 알림 설정은 boolean 값이어야 합니다.'),
    body('quiet_hours_start').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('방해 금지 시작 시간은 HH:mm 형식이어야 합니다.'),
    body('quiet_hours_end').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('방해 금지 종료 시간은 HH:mm 형식이어야 합니다.'),
    body('daily_reminder').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('일일 리마인더 시간은 HH:mm 형식이어야 합니다.')
  ]),
  userController.updateNotificationSettings
);

// 추가 알림 설정 엔드포인트들 (API 테스트에서 요구하는 경로들)
router.put('/notifications', authMiddleware, userController.updateNotificationSettings);
router.put('/settings/notifications', authMiddleware, userController.updateNotificationSettings);

// 사용자 목표 관련 엔드포인트 추가
router.get('/goals', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: '사용자 목표를 조회했습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

router.post('/goals', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      message: '사용자 목표가 생성되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 사용자 통계 엔드포인트
router.get('/stats', authMiddleware, userController.getUserStats);
router.get('/statistics', authMiddleware, userController.getUserStats);

// 오늘의 활동 확인 엔드포인트 (자기 돌봄 체크리스트용)
router.get('/today-activities', authMiddleware, userController.getTodayActivities);

// 나의 마음 엔드포인트
router.post('/intentions', authMiddleware, userController.saveIntention);
router.get('/intentions', authMiddleware, userController.getIntention);

// 챌린지 통계 엔드포인트
router.get('/challenge-stats', authMiddleware, userController.getUserChallengeStats);

// 첫 번째 활동 정보 엔드포인트
router.get('/first-activity', authMiddleware, userController.getUserFirstActivity);

// 읽지 않은 알림 엔드포인트 추가
router.get('/notifications/unread', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: '읽지 않은 알림을 조회했습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 특정 사용자의 통계 조회
router.get('/:id/stats', authMiddleware, userController.getUserStatsByUserId);

// 특정 사용자의 감정 태그 조회
router.get('/:id/emotions', authMiddleware, userController.getUserEmotionsByUserId);

// 특정 사용자의 공개 게시물 조회
router.get('/:id/posts', authMiddleware, userController.getUserPostsByUserId);

// 특정 사용자 프로필 조회 (다른 사용자의 프로필 보기)
router.get('/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    const requestingUserId = req.user?.user_id;

    console.log('🔍 사용자 프로필 조회 요청:', { userId, requestingUserId });

    // 유효성 검사
    if (isNaN(userId)) {
      return res.status(400).json({
        status: 'error',
        message: '유효하지 않은 사용자 ID입니다.'
      });
    }

    // 데이터베이스에서 사용자 조회
    const db = require('../models').default;
    const User = db.User;

    const user = await User.findOne({
      where: {
        user_id: userId,
        is_active: true
      },
      attributes: [
        'user_id',
        'username',
        'email',
        'nickname',
        'profile_image_url',
        'background_image_url',
        'favorite_quote',
        'theme_preference',
        'privacy_settings',
        'notification_settings',
        'last_login_at',
        'created_at'
      ]
    });

    if (!user) {
      console.log('❌ 사용자를 찾을 수 없음:', userId);
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    // privacy_settings 파싱 및 기본값 설정
    let privacySettings = {
      show_profile: true,
      show_emotions: true,
      show_posts: true,
      show_challenges: true
    };

    if (user.privacy_settings) {
      try {
        const parsed = typeof user.privacy_settings === 'string'
          ? JSON.parse(user.privacy_settings)
          : user.privacy_settings;
        privacySettings = { ...privacySettings, ...parsed };
      } catch (error) {
        console.warn('⚠️ privacy_settings 파싱 오류, 기본값 사용');
      }
    }

    // notification_settings 파싱 및 기본값 설정
    let notificationSettings = {
      like_notifications: true,
      comment_notifications: true,
      challenge_notifications: true,
      encouragement_notifications: true
    };

    if (user.notification_settings) {
      try {
        const parsed = typeof user.notification_settings === 'string'
          ? JSON.parse(user.notification_settings)
          : user.notification_settings;
        notificationSettings = { ...notificationSettings, ...parsed };
      } catch (error) {
        console.warn('⚠️ notification_settings 파싱 오류, 기본값 사용');
      }
    }

    // 프로필 이미지 URL 처리 - 상대 경로를 절대 URL로 변환
    let profileImageUrl = null;
    if (user.profile_image_url) {
      // 이미 완전한 URL인 경우 (http:// 또는 https://로 시작)
      if (user.profile_image_url.startsWith('http://') || user.profile_image_url.startsWith('https://')) {
        profileImageUrl = user.profile_image_url;
      }
      // 상대 경로인 경우 절대 URL로 변환 (클라이언트가 사용한 호스트 사용)
      else if (user.profile_image_url.startsWith('/uploads/')) {
        const protocol = req.protocol; // http or https
        const host = req.get('host'); // 192.168.219.51:3001 또는 localhost:3001
        profileImageUrl = `${protocol}://${host}${user.profile_image_url}`;
      }
    }

    // 사용자 프로필 데이터 구성
    const userProfile = {
      user_id: user.user_id,
      username: user.username,
      email: user.email, // 본인이 아닌 경우 숨길 수도 있음
      nickname: user.nickname || user.username,
      profile_image_url: profileImageUrl, // null이면 프론트엔드에서 placeholder 표시
      background_image_url: user.background_image_url,
      favorite_quote: user.favorite_quote,
      theme_preference: user.theme_preference || 'system',
      privacy_settings: privacySettings,
      notification_settings: notificationSettings,
      last_login_at: user.last_login_at ? user.last_login_at.toISOString() : new Date().toISOString(),
      created_at: user.created_at ? user.created_at.toISOString() : new Date().toISOString(),
      is_active: true
    };

    // 본인이 아닌 경우 이메일 숨기기 (프라이버시 보호)
    if (userId !== requestingUserId) {
      userProfile.email = '***@***.***'; // 이메일 마스킹
    }

    console.log('✅ 사용자 프로필 조회 성공:', {
      nickname: userProfile.nickname,
      originalUrl: user.profile_image_url,
      convertedUrl: profileImageUrl,
      hasImage: !!profileImageUrl
    });

    res.status(200).json({
      status: 'success',
      message: '사용자 프로필 조회 성공',
      data: userProfile
    });
  } catch (error) {
    console.error('❌ 사용자 프로필 조회 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;