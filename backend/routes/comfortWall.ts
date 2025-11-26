import { Router, Response, RequestHandler, NextFunction } from 'express';
import ComfortWallController, { comfortWallController } from '../controllers/comfortWallController';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { AuthRequest, AuthRequestGeneric } from '../types/express';
import { comfortWallCache } from '../middleware/cache';

const expressValidator = require('express-validator');

const { check } = expressValidator;
const body = check;
const param = check;
const query = check;

interface ComfortWallPost {
 title: string;
 content: string;
 is_anonymous?: boolean;
}

interface ComfortWallQuery {
 page?: string;
 limit?: string;
 sort_by?: 'latest' | 'popular' | 'best';
 search?: string;
 tag?: string;
}

// 테스트용 메서드 추가
// 원래 컨트롤러에 직접 setTestData 메서드 추가
ComfortWallController.setTestData = (user1: any, postId: number) => {
  console.log('ComfortWall 테스트 데이터 설정:', { user1Id: user1?.user_id, postId });
  // 여기서 실제로 필요한 테스트 데이터 설정 작업 수행
};

// Controller 객체를 export
export { ComfortWallController as comfortWallController };

const router = Router();

router.get('/best',
  comfortWallCache,  // 캐싱 적용
  optionalAuthMiddleware,  // 비로그인 사용자도 베스트 게시물 조회 가능
  validateRequest([
    query('period')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('조회 기간은 daily, weekly, monthly 중 하나여야 합니다.')
  ]),
  (req, res) => ComfortWallController.getBestPosts(req as any, res)
);

// 나의 최근 게시물 3개 조회
router.get('/my-recent',
  authMiddleware,
  (req, res) => ComfortWallController.getMyRecentPosts(req as any, res)
);

// 나의 모든 위로와 공감 게시물 조회
router.get('/me',
  authMiddleware,
  validateRequest([
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('페이지는 1 이상이어야 합니다.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('한 페이지당 1~50개의 게시물을 조회할 수 있습니다.'),
    query('sort_by')
      .optional()
      .isIn(['latest', 'popular'])
      .withMessage('정렬 기준은 latest, popular 중 하나여야 합니다.')
  ]),
  (req, res) => ComfortWallController.getMyPosts(req as any, res)
);

router.post('/',
  authMiddleware,
  validateRequest([
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('제목은 5자 이상 100자 이하여야 합니다.'),
    body('content')
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('내용은 20자 이상 2000자 이하여야 합니다.'),
    body('is_anonymous')
      .optional()
      .isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.createComfortWallPost(req as any, res).catch(next);
  }
);

router.get('/',
 optionalAuthMiddleware,  // 비로그인 사용자도 위로와 공감 게시물 조회 가능
 validateRequest([
   query('page')
     .optional()
     .isInt({ min: 1 })
     .withMessage('페이지는 1 이상이어야 합니다.'),
   query('limit')
     .optional()
     .isInt({ min: 1, max: 50 })
     .withMessage('한 페이지당 1~50개의 게시물을 조회할 수 있습니다.'),
   query('sort_by')
     .optional()
     .isIn(['latest', 'popular', 'best'])
     .withMessage('정렬 기준은 latest, popular, best 중 하나여야 합니다.'),
   query('search')
     .optional()
     .isLength({ max: 100 })
     .withMessage('검색어는 100자 이하여야 합니다.'),
   query('tag')
     .optional()
     .isLength({ max: 50 })
     .withMessage('태그는 50자 이하여야 합니다.')
 ]),
 (req: AuthRequest, res: Response, next) => {
   const typedReq = req as unknown as AuthRequestGeneric<{}, ComfortWallQuery>;
   return ComfortWallController.getComfortWallPosts(typedReq as AuthRequestGeneric<never, ComfortWallQuery>, res).catch(next);
 }
);

// 태그 관련 라우터
router.get('/tags/popular',
  authMiddleware,
  validateRequest([
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('제한 수는 1~50 사이여야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.getPopularTags(req as any, res).catch(next);
  }
);

router.get('/tags/search',
  authMiddleware,
  validateRequest([
    query('q')
      .isLength({ min: 1, max: 50 })
      .withMessage('검색어는 1자 이상 50자 이하여야 합니다.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('제한 수는 1~50 사이여야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.searchTags(req as any, res).catch(next);
  }
);

router.get('/tags/stats',
  authMiddleware,
  validateRequest([
    query('period')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('조회 기간은 daily, weekly, monthly 중 하나여야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.getTagStats(req as any, res).catch(next);
  }
);

// 게시물 상세 조회 (댓글 포함)
router.get('/:id',
  optionalAuthMiddleware,  // 비로그인 사용자도 상세 게시물 조회 가능
  validateRequest([
    param('id')
      .isInt()
      .withMessage('ID는 정수여야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.getPostWithComments(req as any, res).catch(next);
  }
);

// 댓글 조회
router.get('/:id/comments',
  optionalAuthMiddleware,  // 비로그인 사용자도 댓글 조회 가능
  validateRequest([
    param('id')
      .isInt()
      .withMessage('ID는 정수여야 합니다.'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('페이지는 1 이상이어야 합니다.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('한 페이지당 1~100개의 댓글을 조회할 수 있습니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.getComments(req as any, res).catch(next);
  }
);

// 댓글 작성
router.post('/:id/comments',
  authMiddleware,
  validateRequest([
    param('id')
      .isInt()
      .withMessage('ID는 정수여야 합니다.'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('댓글 내용은 1자 이상 500자 이하여야 합니다.'),
    body('is_anonymous')
      .optional()
      .isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.'),
    body('parent_comment_id')
      .optional()
      .isInt()
      .withMessage('부모 댓글 ID는 정수여야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.addComment(req as any, res).catch(next);
  }
);

// 댓글 추천
router.post('/comments/:commentId/like',
  authMiddleware,
  validateRequest([
    param('commentId')
      .isInt()
      .withMessage('댓글 ID는 정수여야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.likeComment(req as any, res).catch(next);
  }
);

// 댓글 수정
router.put('/comments/:commentId',
  authMiddleware,
  validateRequest([
    param('commentId')
      .isInt()
      .withMessage('댓글 ID는 정수여야 합니다.'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('댓글 내용은 1자 이상 500자 이하여야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.updateComment(req as any, res).catch(next);
  }
);

// 댓글 삭제
router.delete('/comments/:commentId',
  authMiddleware,
  validateRequest([
    param('commentId')
      .isInt()
      .withMessage('댓글 ID는 정수여야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.deleteComment(req as any, res).catch(next);
  }
);

// 게시물 좋아요/좋아요 취소
router.post('/:id/like',
  authMiddleware,
  validateRequest([
    param('id')
      .isInt()
      .withMessage('ID는 정수여야 합니다.')
  ]),
  (req, res, next) => {
    return ComfortWallController.likePost(req as any, res).catch(next);
  }
);

router.post('/:id/message',
 authMiddleware,
 validateRequest([
   param('id')
     .isInt()
     .withMessage('ID는 정수여야 합니다.'),
   body('message')
     .trim()
     .isLength({ min: 1, max: 500 })
     .withMessage('메시지는 1자 이상 500자 이하여야 합니다.'),
   body('is_anonymous')
     .optional()
     .isBoolean()
     .withMessage('익명 여부는 boolean 값이어야 합니다.')
 ]),
 (req, res, next) => {
   const typedReq = req as unknown as AuthRequestGeneric<{ message: string; is_anonymous?: boolean }, never, { id: string }>;
   return ComfortWallController.createComfortMessage(typedReq, res).catch(next);
 }
);

// 게시물 수정
router.put('/:id',
 authMiddleware,
 validateRequest([
   param('id')
     .isInt()
     .withMessage('ID는 정수여야 합니다.'),
   body('title')
     .trim()
     .isLength({ min: 5, max: 100 })
     .withMessage('제목은 5자 이상 100자 이하여야 합니다.'),
   body('content')
     .trim()
     .isLength({ min: 20, max: 2000 })
     .withMessage('내용은 20자 이상 2000자 이하여야 합니다.'),
   body('is_anonymous')
     .optional()
     .isBoolean()
     .withMessage('익명 여부는 boolean 값이어야 합니다.')
 ]),
 (req, res, next) => {
   return ComfortWallController.updateComfortWallPost(req as any, res).catch(next);
 }
);

// 게시물 삭제
router.delete('/:id',
 authMiddleware,
 validateRequest([
   param('id')
     .isInt()
     .withMessage('ID는 정수여야 합니다.')
 ]),
 (req, res, next) => {
   return ComfortWallController.deleteComfortWallPost(req as any, res).catch(next);
 }
);

export default router;