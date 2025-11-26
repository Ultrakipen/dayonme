// routes/encouragement.ts
import { Router } from 'express';
import encouragementController from '../controllers/encouragementController';
import authMiddleware from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';

const router = Router();
const { body, param } = require('express-validator');

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// 익명 격려 메시지 전송
router.post(
  '/send',
  validateRequest([
    body('to_user_id')
      .isInt({ min: 1 })
      .withMessage('유효한 사용자 ID를 입력해주세요.'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('메시지를 입력해주세요.')
      .isLength({ max: 100 })
      .withMessage('메시지는 100자 이내로 작성해주세요.')
  ]),
  encouragementController.sendEncouragement
);

// 받은 익명 격려 메시지 조회
router.get('/received', encouragementController.getReceivedEncouragements);

// 격려 메시지 읽음 처리
router.patch(
  '/:id/read',
  validateRequest([
    param('id')
      .isInt({ min: 1 })
      .withMessage('유효한 메시지 ID를 입력해주세요.')
  ]),
  encouragementController.markAsRead
);

// 전체 읽음 처리
router.patch('/read-all', encouragementController.markAllAsRead);

// 오늘 남은 전송 가능 횟수 조회
router.get('/remaining', encouragementController.getRemainingCount);

// 카드 템플릿 목록 조회
router.get('/card-templates', encouragementController.getCardTemplates);

// 템플릿 기반 익명 카드 전송
router.post(
  '/send-card',
  validateRequest([
    body('template_id')
      .isInt({ min: 1 })
      .withMessage('유효한 템플릿 ID를 입력해주세요.'),
    body('custom_message')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('메시지는 100자 이내로 작성해주세요.')
  ]),
  encouragementController.sendTemplateCard
);

export default router;
