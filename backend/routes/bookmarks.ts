// routes/bookmarks.ts
import { Router } from 'express';
import bookmarkController from '../controllers/bookmarkController';
import authMiddleware from '../middleware/authMiddleware';
import { validateRequest, commonValidations } from '../middleware/validationMiddleware';
const expressValidator = require('express-validator');
const { param, query } = expressValidator;

const router = Router();

/**
 * @swagger
 * /api/bookmarks/{postType}/{postId}:
 *   post:
 *     summary: 북마크 토글 (추가/제거)
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [my_day, comfort_wall]
 *         description: 게시물 타입
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *     responses:
 *       200:
 *         description: 북마크 해제 성공
 *       201:
 *         description: 북마크 추가 성공
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.post('/:postType/:postId',
  authMiddleware,
  validateRequest([
    param('postType')
      .isIn(['my_day', 'comfort_wall'])
      .withMessage('유효한 게시물 타입이 아닙니다.'),
    param('postId')
      .isInt({ min: 1 })
      .withMessage('유효한 게시물 ID가 아닙니다.')
  ]),
  bookmarkController.toggleBookmark
);

/**
 * @swagger
 * /api/bookmarks:
 *   get:
 *     summary: 북마크 목록 조회
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: postType
 *         schema:
 *           type: string
 *           enum: [my_day, comfort_wall]
 *         description: 게시물 타입 필터 (선택)
 *     responses:
 *       200:
 *         description: 북마크 목록 조회 성공
 *       401:
 *         description: 인증 필요
 */
router.get('/',
  authMiddleware,
  validateRequest([
    ...commonValidations.pagination,
    query('postType')
      .optional()
      .isIn(['my_day', 'comfort_wall'])
      .withMessage('유효한 게시물 타입이 아닙니다.')
  ]),
  bookmarkController.getBookmarks
);

/**
 * @swagger
 * /api/bookmarks/{postType}/{postId}/status:
 *   get:
 *     summary: 북마크 상태 확인
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [my_day, comfort_wall]
 *         description: 게시물 타입
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *     responses:
 *       200:
 *         description: 북마크 상태 확인 성공
 *       401:
 *         description: 인증 필요
 */
router.get('/:postType/:postId/status',
  authMiddleware,
  validateRequest([
    param('postType')
      .isIn(['my_day', 'comfort_wall'])
      .withMessage('유효한 게시물 타입이 아닙니다.'),
    param('postId')
      .isInt({ min: 1 })
      .withMessage('유효한 게시물 ID가 아닙니다.')
  ]),
  bookmarkController.checkBookmarkStatus
);

/**
 * @swagger
 * /api/bookmarks/count:
 *   get:
 *     summary: 북마크 개수 조회
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 북마크 개수 조회 성공
 *       401:
 *         description: 인증 필요
 */
router.get('/count',
  authMiddleware,
  bookmarkController.getBookmarkCount
);

export default router;
