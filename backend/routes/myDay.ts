import { Router, Request, Response, NextFunction } from 'express';
import myDayController from '../controllers/myDayController';
import { AuthMiddleware } from '../middleware/auth';
import { body, query, param } from 'express-validator';
import { AuthRequestGeneric } from '../types/express';
import { MyDayComment, PostParams } from '../types/myDay';
import { readLimiter, writeLimiter, interactionLimiter, reportLimiter } from '../middleware/rateLimiters';

const router = Router();

/**
 * @swagger
 * /api/myday/posts:
 *   post:
 *     summary: MyDay 게시물 작성
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: 게시물 내용
 *               emotion_id:
 *                 type: integer
 *                 description: 감정 ID
 *               image_url:
 *                 type: string
 *                 description: 이미지 URL
 *               is_anonymous:
 *                 type: boolean
 *                 description: 익명 작성 여부
 *     responses:
 *       201:
 *         description: 게시물 작성 성공
 *       400:
 *         description: 입력값 오류
 *       401:
 *         description: 인증 필요
 */
router.post('/posts',
  writeLimiter,
  AuthMiddleware.requireAuth,
  [
    body('content')
      .isLength({ min: 10, max: 1000 })
      .withMessage('내용은 10자 이상 1000자 이하여야 합니다.'),
    body('emotion_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('올바른 감정 ID를 입력해주세요.'),
    body('image_url')
      .optional()
      .custom((value) => {
        if (!value) return true; // 선택사항이므로 빈 값 허용
        
        if (typeof value !== 'string') {
          throw new Error('이미지 URL은 문자열이어야 합니다.');
        }
        
        // 상대 경로 허용 (/api/uploads/images/...)
        if (value.startsWith('/api/uploads/')) {
          return true;
        }
        
        // 절대 URL 허용 (http://, https://)
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return true;
        }
        
        // 모바일 앱의 로컬 파일 경로 허용 (file://)
        if (value.startsWith('file://')) {
          return true;
        }
        
        // Base64 이미지 데이터 허용 (data:image/...)
        if (value.startsWith('data:image/')) {
          return true;
        }
        
        throw new Error('올바른 이미지 URL을 입력해주세요. (서버 경로, HTTP URL, 로컬 파일 경로, 또는 Base64 데이터 가능)');
      }),
    body('is_anonymous')
      .optional()
      .isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.')
  ],
  myDayController.createPost
);

/**
 * @swagger
 * /api/myday/posts/me:
 *   get:
 *     summary: 내 MyDay 게시물 목록 조회
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [latest, popular]
 *         description: 정렬 방식
 *     responses:
 *       200:
 *         description: 게시물 목록 조회 성공
 *       401:
 *         description: 인증 필요
 */
router.get('/posts/me',
  AuthMiddleware.requireAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page는 1 이상의 정수여야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit는 1에서 100 사이의 정수여야 합니다.'),
    query('sort_by').optional().isIn(['latest', 'popular']).withMessage('정렬 방식이 올바르지 않습니다.')
  ],
  myDayController.getMyPosts
);

// 오늘 작성한 MyDay 게시물 조회 - MUST be before /posts/:id route
router.get('/posts/today',
  AuthMiddleware.requireAuth,
  myDayController.getTodayPost
);

/**
 * @swagger
 * /api/myday/posts/{id}:
 *   get:
 *     summary: MyDay 게시물 단일 조회 (편집용)
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *     responses:
 *       200:
 *         description: 게시물 조회 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.get('/posts/:id',
  AuthMiddleware.optionalAuth,  // 비로그인 사용자도 게시물 상세 조회 가능
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.')
  ],
  myDayController.getPostForView
);

// 편집용 게시물 조회 (권한 체크 포함)
router.get('/posts/:id/edit',
  AuthMiddleware.requireAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.')
  ],
  myDayController.getPostById
);

/**
 * @swagger
 * /api/myday/posts/{id}:
 *   put:
 *     summary: MyDay 게시물 수정
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: 게시물 내용
 *               emotion_id:
 *                 type: integer
 *                 description: 감정 ID
 *               image_url:
 *                 type: string
 *                 description: 이미지 URL
 *               is_anonymous:
 *                 type: boolean
 *                 description: 익명 작성 여부
 *     responses:
 *       200:
 *         description: 게시물 수정 성공
 *       400:
 *         description: 입력값 오류
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 수정 권한 없음
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.put('/posts/:id',
  AuthMiddleware.requireAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.'),
    body('content')
      .isLength({ min: 10, max: 500 })
      .withMessage('내용은 10자 이상 500자 이하여야 합니다.'),
    body('emotion_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('올바른 감정 ID를 입력해주세요.'),
    body('image_url')
      .optional()
      .custom((value) => {
        if (!value) return true;
        
        if (typeof value === 'string' && value.startsWith('/api/uploads/')) {
          return true;
        }
        
        if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
          return true;
        }
        
        throw new Error('올바른 이미지 URL을 입력해주세요.');
      }),
    body('is_anonymous')
      .optional()
      .isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.')
  ],
  myDayController.updatePost
);

/**
 * @swagger
 * /api/myday/posts:
 *   get:
 *     summary: MyDay 게시물 목록 조회 (전체)
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 게시물 목록 조회 성공
 *       401:
 *         description: 인증 필요
 */
router.get('/posts',
  AuthMiddleware.optionalAuth,  // 비로그인 사용자도 게시물 조회 가능
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page는 1 이상의 정수여야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit는 1에서 100 사이의 정수여야 합니다.')
  ],
  myDayController.getPosts
);

/**
 * @swagger
 * /api/myday/posts/{id}/comments:
 *   post:
 *     summary: MyDay 게시물 댓글 작성
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 300
 *                 description: 댓글 내용
 *               is_anonymous:
 *                 type: boolean
 *                 description: 익명 작성 여부
 *     responses:
 *       201:
 *         description: 댓글 작성 성공
 *       400:
 *         description: 입력값 오류
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.post('/posts/:id/comments',
  interactionLimiter,
  AuthMiddleware.requireAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.'),
    body('content').isLength({ min: 1, max: 300 })
      .withMessage('댓글은 1자 이상 300자 이하여야 합니다.'),
    body('is_anonymous').optional().isBoolean()
      .withMessage('익명 여부는 boolean 값이어야 합니다.')
  ],
  (req: Request, res: Response, next: NextFunction) => {
    const typedReq = req as unknown as AuthRequestGeneric<MyDayComment, never, PostParams>;
    myDayController.createComment(typedReq, res).catch(next);
  }
);

/**
 * @swagger
 * /api/myday/posts/{id}/like:
 *   post:
 *     summary: MyDay 게시물 좋아요/좋아요 취소
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *     responses:
 *       200:
 *         description: 좋아요 처리 성공
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.post('/posts/:id/like',
  interactionLimiter,
  AuthMiddleware.requireAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.')
  ],
  (req: Request, res: Response, next: NextFunction) => {
    const typedReq = req as unknown as AuthRequestGeneric<never, never, PostParams>;
    myDayController.likePost(typedReq, res).catch(next);
  }
);

/**
 * @swagger
 * /api/myday/posts/{id}:
 *   delete:
 *     summary: MyDay 게시물 삭제
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *     responses:
 *       200:
 *         description: 게시물 삭제 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 삭제 권한 없음
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.delete('/posts/:id',
  AuthMiddleware.requireAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.')
  ],
  myDayController.deletePost
);

/**
 * @swagger
 * /api/myday/posts/{id}/comments:
 *   get:
 *     summary: MyDay 게시물 댓글 목록 조회
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *     responses:
 *       200:
 *         description: 댓글 목록 조회 성공
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.get('/posts/:id/comments',
  AuthMiddleware.optionalAuth,  // 비로그인 사용자도 댓글 조회 가능
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.')
  ],
  myDayController.getComments
);

/**
 * @swagger
 * /api/myday/posts/{id}/comments/{commentId}:
 *   put:
 *     summary: MyDay 댓글 수정
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 댓글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 300
 *                 description: 댓글 내용
 *     responses:
 *       200:
 *         description: 댓글 수정 성공
 *       400:
 *         description: 입력값 오류
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 수정 권한 없음
 *       404:
 *         description: 댓글을 찾을 수 없음
 */
router.put('/posts/:id/comments/:commentId',
  AuthMiddleware.requireAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.'),
    param('commentId').isInt({ min: 1 }).withMessage('유효한 댓글 ID가 아닙니다.'),
    body('content').isLength({ min: 1, max: 300 })
      .withMessage('댓글은 1자 이상 300자 이하여야 합니다.')
  ],
  myDayController.updateComment
);

/**
 * @swagger
 * /api/myday/posts/{id}/comments/{commentId}:
 *   delete:
 *     summary: MyDay 댓글 삭제
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시물 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 댓글 ID
 *     responses:
 *       200:
 *         description: 댓글 삭제 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 삭제 권한 없음
 *       404:
 *         description: 댓글을 찾을 수 없음
 */
router.delete('/posts/:id/comments/:commentId',
  AuthMiddleware.requireAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.'),
    param('commentId').isInt({ min: 1 }).withMessage('유효한 댓글 ID가 아닙니다.')
  ],
  myDayController.deleteComment
);

// 댓글 좋아요
router.post('/comments/:commentId/like',
  interactionLimiter,
  AuthMiddleware.requireAuth,
  [
    param('commentId').isInt({ min: 1 }).withMessage('유효한 댓글 ID가 아닙니다.')
  ],
  myDayController.likeComment
);

// 댓글 신고
router.post('/comments/:commentId/report',
  reportLimiter,
  AuthMiddleware.requireAuth,
  [
    param('commentId').isInt({ min: 1 }).withMessage('유효한 댓글 ID가 아닙니다.'),
    body('reason').notEmpty().withMessage('신고 사유를 입력해주세요.'),
    body('description').optional().isString().withMessage('신고 상세 내용은 문자열이어야 합니다.')
  ],
  myDayController.reportComment
);

// 게시물 신고
router.post('/posts/:id/report',
  reportLimiter,
  AuthMiddleware.requireAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('유효한 게시물 ID가 아닙니다.'),
    body('reason').notEmpty().withMessage('신고 사유를 입력해주세요.'),
    body('description').optional().isString().withMessage('신고 상세 내용은 문자열이어야 합니다.')
  ],
  myDayController.reportPost
);

/**
 * @swagger
 * /api/my-day/posts/today:
 *   get:
 *     summary: 오늘 작성한 MyDay 게시물 조회
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 오늘 게시물 조회 성공 (null이면 작성한 글 없음)
 *       401:
 *         description: 인증 필요
 */
router.get('/posts/today',
  AuthMiddleware.requireAuth,
  myDayController.getTodayPost
);

/**
 * @swagger
 * /api/my-day/emotions/stats:
 *   get:
 *     summary: 사용자 감정 통계 조회
 *     tags: [MyDay]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 감정 통계 조회 성공
 *       401:
 *         description: 인증 필요
 */
router.get('/emotions/stats',
  AuthMiddleware.requireAuth,
  myDayController.getUserEmotionStats
);

export default router;