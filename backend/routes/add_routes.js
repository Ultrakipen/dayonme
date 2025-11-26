const fs = require('fs');
const content = fs.readFileSync('auth.ts', 'utf8');

const marker = `], authController.checkResetToken);

// ===== 소셜 로그인 라우트 =====`;

const newRoutes = `], authController.checkResetToken);

// ===== 이메일 인증 라우트 =====

/**
 * @swagger
 * /api/auth/send-verification-code:
 *   post:
 *     summary: 이메일 인증 코드 발송
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
 *                 description: 인증받을 이메일 주소
 *     responses:
 *       200:
 *         description: 인증 코드 발송 성공
 *       400:
 *         description: 이메일 형식 오류 또는 중복
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
 *     summary: 이메일 인증 코드 확인
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
 *                 description: 인증받을 이메일 주소
 *               code:
 *                 type: string
 *                 description: 6자리 인증 코드
 *     responses:
 *       200:
 *         description: 인증 성공
 *       400:
 *         description: 잘못된 코드 또는 만료됨
 */
router.post('/verify-code', [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력하세요.')
    .normalizeEmail(),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('인증 코드는 6자리여야 합니다.')
], authController.verifyCode);

// ===== 소셜 로그인 라우트 =====`;

const newContent = content.replace(marker, newRoutes);
fs.writeFileSync('auth.ts', newContent, 'utf8');
console.log('auth.ts 수정 완료');
