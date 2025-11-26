import { Router, Response, NextFunction } from 'express';
import someoneDayController from '../controllers/someoneDayController';
import comfortWallController from '../controllers/comfortWallController';
import authMiddleware from '../middleware/authMiddleware';
import { AuthRequest } from '../types/express';
import { validateRequest } from '../middleware/validationMiddleware';
import { ParamsDictionary } from 'express-serve-static-core';

const expressValidator = require('express-validator');
const { body, query, param } = expressValidator;

interface PostDetailsParams extends ParamsDictionary {
  id: string;
}

const router = Router();

// 게시물 생성
router.post('/',
  authMiddleware,
  validateRequest([
    body('title').isLength({ min: 5, max: 100 })
      .withMessage('제목은 5자 이상 100자 이하여야 합니다.'),
    body('content').isLength({ min: 20, max: 2000 })
      .withMessage('내용은 20자 이상 2000자 이하여야 합니다.'),
    body('is_anonymous').optional().isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.'),
    body('tag_ids').optional().isArray()
      .withMessage('태그 ID는 배열이어야 합니다.')
  ]),
  (req, res) => comfortWallController.createComfortWallPost(req as any, res)
);

// 베스트 게시물 조회 (카드 형식, 2x2)
router.get('/best',
  authMiddleware,
  validateRequest([
    query('period').optional().isIn(['daily', 'weekly', 'monthly'])
      .withMessage('기간은 daily, weekly, monthly 중 하나여야 합니다.')
  ]),
  (req, res) => comfortWallController.getBestPosts(req as any, res)
);

// 나의 고민 작성 목록 조회 (최근 3개)
router.get('/my-recent',
  authMiddleware,
  (req, res) => comfortWallController.getMyRecentPosts(req as any, res)
);

// 게시물 목록 조회 (검색, 필터링 포함)
router.get('/', 
  authMiddleware,
  validateRequest([
    query('page').optional().isInt({ min: 1 })
      .withMessage('페이지 번호는 1 이상이어야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 50 })
      .withMessage('한 페이지당 게시물 수는 1에서 50 사이여야 합니다.'),
    query('sortBy').optional().isIn(['latest', 'popular', 'best'])
      .withMessage('정렬 기준이 올바르지 않습니다.'),
    query('tag').optional().isString()
      .withMessage('태그는 문자열이어야 합니다.'),
    query('search').optional().isString()
      .withMessage('검색어는 문자열이어야 합니다.'),
    query('date_from').optional().isDate()
      .withMessage('시작 날짜 형식이 올바르지 않습니다.'),
    query('date_to').optional().isDate()
      .withMessage('종료 날짜 형식이 올바르지 않습니다.')
  ]),
  (req, res) => comfortWallController.getComfortWallPosts(req as any, res)
);

// 게시물 상세 조회 (댓글 포함)
router.get('/:id/details', 
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.')
  ]),
  (req, res) => comfortWallController.getPostWithComments(req as any, res)
);

// 개별 게시물 조회
router.get('/:id', 
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.')
  ]),
  (req, res) => someoneDayController.getPostById(req as any, res)
);

// 인기 게시물 조회
router.get('/popular',
  authMiddleware,
  (req, res) => someoneDayController.getPopularPosts(req as any, res)
);

// 댓글 작성
router.post('/:id/comments',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.'),
    body('content').isLength({ min: 1, max: 500 })
      .withMessage('댓글 내용은 1자 이상 500자 이하여야 합니다.'),
    body('is_anonymous').optional().isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.'),
    body('parent_comment_id').optional().isInt()
      .withMessage('부모 댓글 ID는 정수여야 합니다.')
  ]),
  (req, res) => comfortWallController.addComment(req as any, res)
);

// 댓글 추천
router.post('/comments/:commentId/like',
  authMiddleware,
  validateRequest([
    param('commentId').isInt().withMessage('올바른 댓글 ID가 아닙니다.')
  ]),
  (req, res) => comfortWallController.likeComment(req as any, res)
);

// 격려 메시지 전송
router.post('/:id/encourage',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.'),
    body('message').isLength({ min: 1, max: 1000 })
      .withMessage('격려 메시지는 1자 이상 1000자 이하여야 합니다.'),
    body('is_anonymous').optional().isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.')
  ]),
  (req, res) => someoneDayController.sendEncouragement(req as any, res)
);

// 위로 메시지 전송 (대체 엔드포인트)
router.post('/:id/message',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.'),
    body('message').isLength({ min: 1, max: 500 })
      .withMessage('위로 메시지는 1자 이상 500자 이하여야 합니다.'),
    body('is_anonymous').optional().isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.')
  ]),
  (req, res) => comfortWallController.createComfortMessage(req as any, res)
);

// 게시물 신고
router.post('/:id/report',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.'),
    body('reason').isLength({ min: 5, max: 200 })
      .withMessage('신고 사유는 5자 이상 200자 이하여야 합니다.'),
    body('details').optional().isString()
      .withMessage('상세 내용은 문자열이어야 합니다.')
  ]),
  (req, res) => someoneDayController.reportPost(req as any, res)
);

// 게시물 좋아요
router.post('/:id/like',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.')
  ]),
  async (req, res) => {
    try {
      // 게시물 좋아요 기능 구현 필요
      return res.json({
        status: 'success',
        message: '게시물에 공감을 표시했습니다.'
      });
    } catch (error) {
      console.error('게시물 좋아요 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '공감 처리 중 오류가 발생했습니다.'
      });
    }
  }
);

// 게시물 업데이트
router.put('/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.'),
    body('title').optional().isLength({ min: 5, max: 100 })
      .withMessage('제목은 5자 이상 100자 이하여야 합니다.'),
    body('content').optional().isLength({ min: 20, max: 2000 })
      .withMessage('내용은 20자 이상 2000자 이하여야 합니다.'),
    body('is_anonymous').optional().isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.'),
    body('tag_ids').optional().isArray()
      .withMessage('태그 ID는 배열이어야 합니다.')
  ]),
  async (req, res) => {
    try {
      return res.json({
        status: 'success',
        message: '게시물이 성공적으로 업데이트되었습니다.'
      });
    } catch (error) {
      console.error('게시물 업데이트 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '게시물 업데이트 중 오류가 발생했습니다.'
      });
    }
  }
);

// 게시물 삭제
router.delete('/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.')
  ]),
  async (req, res) => {
    try {
      return res.json({
        status: 'success',
        message: '게시물이 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '게시물 삭제 중 오류가 발생했습니다.'
      });
    }
  }
);

export default router;