import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';
import {
  uploadProfileImage,
  processProfileImage,
  handleUploadError
} from '../middleware/uploadMiddleware';
import { authLimiter, registerLimiter } from '../middleware/rateLimitMiddleware';
import { AuthRequest } from '../types/express';

const router = express.Router();

// 회원가입 유효성 검사 규칙
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('사용자명은 3-20자 사이여야 합니다.')
    .matches(/^[가-힣a-zA-Z0-9_]+$/)
    .withMessage('사용자명은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.'),
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력하세요.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 8자 이상이어야 합니다.')
    .matches(/^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('비밀번호는 소문자, 숫자, 특수문자를 포함해야 합니다.'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('닉네임은 20자 이하여야 합니다.')
];

// 로그인 유효성 검사 규칙
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력하세요.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력하세요.')
];

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ===== 인증 관련 라우트 =====

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 description: 사용자명 (한글, 영문, 숫자, 언더스코어만)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 이메일 주소
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: 비밀번호 (대소문자, 숫자, 특수문자 포함)
 *               nickname:
 *                 type: string
 *                 maxLength: 20
 *                 description: 닉네임 (선택사항)
 *               profile_image:
 *                 type: string
 *                 format: binary
 *                 description: 프로필 이미지 (선택사항, 5MB 이하)
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       400:
 *         description: 입력값 오류
 *       409:
 *         description: 중복된 사용자
 */
router.post('/register',
  registerLimiter, 
  (req: Request, res: Response, next: NextFunction) => {
    uploadProfileImage(req, res, (err: any) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  },
  processProfileImage,
  registerValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 프로필 이미지가 업로드되었다면 URL을 body에 추가
      const processedImage = (req as any).processedImage;
      if (processedImage) {
        req.body.profile_image_url = processedImage.url;
      }
      
      await authController.register(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 이메일 주소
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 인증 실패
 */
router.post('/login', authLimiter, loginValidation, authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 현재 사용자 정보 조회
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *       401:
 *         description: 인증 필요
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: 비밀번호 재설정 요청
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 가입된 이메일 주소
 *     responses:
 *       200:
 *         description: 재설정 이메일 발송 성공
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력하세요.')
    .normalizeEmail()
], authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: 비밀번호 재설정 (토큰 검증 및 변경)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: 이메일로 받은 재설정 토큰
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: 새 비밀번호
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 *       400:
 *         description: 유효하지 않거나 만료된 토큰
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('토큰이 필요합니다.'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('비밀번호는 최소 6자 이상이어야 합니다.')
], authController.resetPassword);

/**
 * @swagger
 * /api/auth/check-reset-token:
 *   post:
 *     summary: 비밀번호 재설정 토큰 유효성 확인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 확인할 재설정 토큰
 *     responses:
 *       200:
 *         description: 유효한 토큰
 *       400:
 *         description: 유효하지 않거나 만료된 토큰
 */
router.post('/check-reset-token', [
  body('token')
    .notEmpty()
    .withMessage('토큰이 필요합니다.')
], authController.checkResetToken);

// ===== 이메일 인증 라우트 =====

/**
 * @swagger
 * /api/auth/send-verification-code:
 *   post:
 *     summary: 이메일 인증 코드 전송
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 인증할 이메일 주소
 *     responses:
 *       200:
 *         description: 인증 코드 전송 성공
 *       400:
 *         description: 잘못된 이메일 형식
 *       500:
 *         description: 이메일 발송 실패
 */
router.post('/send-verification-code', [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력하세요.')
    .normalizeEmail()
], authController.sendVerificationCode);

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: 이메일 인증 코드 검증
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 인증할 이메일 주소
 *               code:
 *                 type: string
 *                 description: 6자리 인증 코드
 *     responses:
 *       200:
 *         description: 인증 성공
 *       400:
 *         description: 잘못된 인증 코드 또는 만료됨
 */
router.post('/verify-code', [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력하세요.')
    .normalizeEmail(),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('인증 코드는 6자리여야 합니다.')
    .isNumeric()
    .withMessage('인증 코드는 숫자만 포함해야 합니다.')
], authController.verifyCode);

// ===== 소셜 로그인 라우트 =====

/**
 * @swagger
 * /api/auth/kakao:
 *   post:
 *     summary: 카카오 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: 카카오에서 발급받은 액세스 토큰
 *     responses:
 *       200:
 *         description: 카카오 로그인 성공
 *       401:
 *         description: 카카오 인증 실패
 */
router.post('/kakao', authController.kakaoLogin);

/**
 * @swagger
 * /api/auth/naver:
 *   post:
 *     summary: 네이버 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: 네이버에서 발급받은 액세스 토큰
 *     responses:
 *       200:
 *         description: 네이버 로그인 성공
 *       401:
 *         description: 네이버 인증 실패
 */
router.post('/naver', authController.naverLogin);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: 구글 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_token
 *             properties:
 *               id_token:
 *                 type: string
 *                 description: 구글에서 발급받은 ID 토큰
 *     responses:
 *       200:
 *         description: 구글 로그인 성공
 *       401:
 *         description: 구글 인증 실패
 */
router.post('/google', authController.googleLogin);

// ===== 토큰 유효성 검사 =====

/**
 * @swagger
 * /api/auth/validate:
 *   get:
 *     summary: 토큰 유효성 검사
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 토큰이 유효함
 *       401:
 *         description: 토큰이 유효하지 않음
 */
router.get('/validate', authMiddleware, (req: AuthRequest, res: express.Response) => {
  res.json({
    status: 'success',
    message: '토큰이 유효합니다.',
    data: {
      user: req.user,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Refresh 토큰
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *       401:
 *         description: Refresh 토큰이 유효하지 않거나 만료됨
 */
router.post('/refresh', authController.refreshToken);

export default router;