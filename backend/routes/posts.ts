import { Router, Response, NextFunction } from 'express';
import postController from '../controllers/postController';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/authMiddleware';
import { validateRequest, commonValidations } from '../middleware/validationMiddleware';
import { AuthRequest, AuthRequestGeneric } from '../types/express';
import { postListCache, postDetailCache } from '../middleware/cache';
import { postCreationLimiter } from '../middleware/rateLimiter';
const expressValidator = require('express-validator');
const { body, query, param } = expressValidator;
export interface PostQuery {
  page?: string;
  limit?: string;
  sort_by?: 'latest' | 'popular';
  emotion?: string;
  start_date?: string;
  end_date?: string;
}
const router = Router();

router.post('/',
  postCreationLimiter,  // Rate Limiting 적용
  authMiddleware,
  validateRequest([
    body('content')
      .isLength({ min: 10, max: 1000 })
      .withMessage('게시물 내용은 10자 이상 1000자 이하여야 합니다.'),
    body('emotion_ids')
      .optional()
      .isArray()
      .withMessage('감정 ID 배열이 올바르지 않습니다.'),
    body('emotion_ids.*')
      .optional()
      .isInt()
      .withMessage('감정 ID는 정수여야 합니다.'),
    body('emotion_summary')
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage('감정 요약은 100자를 초과할 수 없습니다.'),
    body('image_url')
      .optional()
      .custom((value: string) => {
        if (!value) return true; // optional이므로 빈 값은 허용
        
        // 절대 URL인 경우 (http:// 또는 https://)
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return true;
        }
        
        // 내부 업로드 경로인 경우 (/api/uploads/... 또는 /uploads/...)
        if (value.startsWith('/api/uploads/') || value.startsWith('/uploads/')) {
          return true;
        }
        
        // 그 외의 경우는 유효하지 않음
        throw new Error('유효한 이미지 URL이 아닙니다.');
      }),
    body('is_anonymous')
      .optional()
      .isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.')
  ]),
  postController.createPost
);

router.get('/',
  postListCache,  // 캐싱 적용
  optionalAuthMiddleware,  // 비로그인 사용자도 게시물 조회 가능
  validateRequest([
    ...commonValidations.pagination,
    query('sort_by')
      .optional()
      .isIn(['latest', 'popular'])
      .withMessage('정렬 기준이 올바르지 않습니다.'),
    query('emotion')
      .optional()
      .isString()
      .withMessage('감정 필터가 올바르지 않습니다.'),
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('시작 날짜 형식이 올바르지 않습니다.'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('종료 날짜 형식이 올바르지 않습니다.')
  ]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as unknown as AuthRequestGeneric<never, PostQuery>;
    return postController.getPosts(typedReq, res);
  }
);

router.get('/me', 
  authMiddleware,
  validateRequest([...commonValidations.pagination]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as unknown as AuthRequestGeneric<never, PostQuery>;
    return postController.getMyPosts(typedReq, res);
  }
);

// 특정 게시물 조회 (ID 기반)
router.get('/:id',
  postDetailCache,  // 캐싱 적용
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.')
  ]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as AuthRequestGeneric<never, never, { id: string }>;
    // postController에 getPostById 메서드가 있다면 사용, 없으면 getPosts 메서드 재사용
    if (typeof postController.getPostById === 'function') {
      return postController.getPostById(typedReq, res);
    } else {
      // 기본적으로 단일 게시물 조회 기능 제공
      return res.status(404).json({
        status: 'error',
        message: '게시물 조회 기능이 구현되지 않았습니다.'
      });
    }
  }
);

// 게시물 업데이트 (PUT & PATCH 둘 다 지원)
router.put('/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.'),
    body('content')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('게시물 내용은 10자 이상 1000자 이하여야 합니다.'),
    body('emotion_ids')
      .optional()
      .isArray()
      .withMessage('감정 ID 배열이 올바르지 않습니다.'),
    body('emotion_summary')
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage('감정 요약은 100자를 초과할 수 없습니다.'),
    body('image_url')
      .optional()
      .custom((value: string) => {
        if (!value) return true; // optional이므로 빈 값은 허용
        
        // 절대 URL인 경우 (http:// 또는 https://)
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return true;
        }
        
        // 내부 업로드 경로인 경우 (/api/uploads/... 또는 /uploads/...)
        if (value.startsWith('/api/uploads/') || value.startsWith('/uploads/')) {
          return true;
        }
        
        // 그 외의 경우는 유효하지 않음
        throw new Error('유효한 이미지 URL이 아닙니다.');
      }),
    body('is_anonymous')
      .optional()
      .isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.')
  ]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as AuthRequestGeneric<{
      content?: string;
      emotion_ids?: number[];
      emotion_summary?: string;
      image_url?: string;
      is_anonymous?: boolean;
    }, never, { id: string }>;
    
    // postController에 updatePost 메서드가 있다면 사용, 없으면 404 반환
    if (typeof postController.updatePost === 'function') {
      return postController.updatePost(typedReq, res);
    } else {
      return res.status(404).json({
        status: 'error',
        message: '게시물 업데이트 기능이 구현되지 않았습니다.'
      });
    }
  }
);

router.patch('/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.'),
    body('content')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('게시물 내용은 10자 이상 1000자 이하여야 합니다.'),
    body('emotion_ids')
      .optional()
      .isArray()
      .withMessage('감정 ID 배열이 올바르지 않습니다.'),
    body('emotion_summary')
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage('감정 요약은 100자를 초과할 수 없습니다.'),
    body('image_url')
      .optional()
      .custom((value: string) => {
        if (!value) return true; // optional이므로 빈 값은 허용
        
        // 절대 URL인 경우 (http:// 또는 https://)
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return true;
        }
        
        // 내부 업로드 경로인 경우 (/api/uploads/... 또는 /uploads/...)
        if (value.startsWith('/api/uploads/') || value.startsWith('/uploads/')) {
          return true;
        }
        
        // 그 외의 경우는 유효하지 않음
        throw new Error('유효한 이미지 URL이 아닙니다.');
      }),
    body('is_anonymous')
      .optional()
      .isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.')
  ]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as AuthRequestGeneric<{
      content?: string;
      emotion_ids?: number[];
      emotion_summary?: string;
      image_url?: string;
      is_anonymous?: boolean;
    }, never, { id: string }>;
    
    // postController에 updatePost 메서드가 있다면 사용, 없으면 404 반환
    if (typeof postController.updatePost === 'function') {
      return postController.updatePost(typedReq, res);
    } else {
      return res.status(404).json({
        status: 'error',
        message: '게시물 업데이트 기능이 구현되지 않았습니다.'
      });
    }
  }
);

// 게시물 삭제 (DELETE)
router.delete('/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.')
  ]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as AuthRequestGeneric<never, never, { id: string }>;
    return postController.deletePost(typedReq, res);
  }
);

router.get('/:id/comments',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.'),
    ...commonValidations.pagination
  ]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as unknown as AuthRequestGeneric<never, PostQuery, { id: string }>;
    return postController.getComments(typedReq, res);
  }
);

router.post('/:id/comments',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.'),
    body('content')
      .isLength({ min: 1, max: 300 })
      .withMessage('댓글 내용은 1자 이상 300자 이하여야 합니다.'),
    body('is_anonymous')
      .optional()
      .isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.'),
    body('parent_comment_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('부모 댓글 ID는 양의 정수여야 합니다.')
  ]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as AuthRequestGeneric<{
      content: string;
      is_anonymous?: boolean;
      parent_comment_id?: number;
    }, never, { id: string }>;
    return postController.createComment(typedReq, res);
  }
);

router.post('/:id/like',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('올바른 게시물 ID가 아닙니다.')
  ]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as AuthRequestGeneric<never, never, { id: string }>;
    return postController.likePost(typedReq, res);
  }
);

// 댓글 좋아요 라우트 추가
router.post('/comments/:commentId/like',
  authMiddleware,
  validateRequest([
    param('commentId').isInt().withMessage('올바른 댓글 ID가 아닙니다.')
  ]),
  (req: AuthRequest, res: Response) => {
    const typedReq = req as AuthRequestGeneric<never, never, { commentId: string }>;
    return postController.likeComment(typedReq, res);
  }
);

export default router;