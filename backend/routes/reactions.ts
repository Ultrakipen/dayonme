// routes/reactions.ts
import { Router } from 'express';
import reactionController from '../controllers/reactionController';
import authMiddleware from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';

const router = Router();
const { body, param } = require('express-validator');

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// 리액션 타입 목록 조회
router.get('/types', reactionController.getReactionTypes);

// My Day 게시물 리액션
router.post(
  '/my-day/:postId',
  validateRequest([
    param('postId')
      .isInt({ min: 1 })
      .withMessage('유효한 게시물 ID를 입력해주세요.'),
    body('reaction_type_id')
      .isInt({ min: 1 })
      .withMessage('유효한 리액션 타입 ID를 입력해주세요.')
  ]),
  reactionController.toggleMyDayReaction
);

router.get(
  '/my-day/:postId',
  validateRequest([
    param('postId')
      .isInt({ min: 1 })
      .withMessage('유효한 게시물 ID를 입력해주세요.')
  ]),
  reactionController.getMyDayReactions
);

// Someone Day 게시물 리액션
router.post(
  '/someone-day/:postId',
  validateRequest([
    param('postId')
      .isInt({ min: 1 })
      .withMessage('유효한 게시물 ID를 입력해주세요.'),
    body('reaction_type_id')
      .isInt({ min: 1 })
      .withMessage('유효한 리액션 타입 ID를 입력해주세요.')
  ]),
  reactionController.toggleSomeoneDayReaction
);

router.get(
  '/someone-day/:postId',
  validateRequest([
    param('postId')
      .isInt({ min: 1 })
      .withMessage('유효한 게시물 ID를 입력해주세요.')
  ]),
  reactionController.getSomeoneDayReactions
);

export default router;
