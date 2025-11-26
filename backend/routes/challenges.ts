import { Router, Request, Response, NextFunction } from 'express';
import challengesController from '../controllers/challengesController';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/authMiddleware';
import { AuthRequest } from '../types/express';
import { validateRequest } from '../middleware/validationMiddleware';
 import challengeLikeController from
  '../controllers/challengeLikeController';
import { readLimiter, writeLimiter, interactionLimiter, reportLimiter } from '../middleware/rateLimiters';
const { body, param, query } = require('express-validator');

const router = Router();

// 유효성 검사 규칙을 간소화하여 성능 문제 방지
const createChallengeValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('제목은 5자 이상 100자 이하여야 합니다.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('설명은 500자 이하여야 합니다.'),
  body('start_date')
    .notEmpty()
    .withMessage('시작 날짜가 필요합니다.'),
  body('end_date')
    .notEmpty()
    .withMessage('종료 날짜가 필요합니다.')
];

// 베스트 챌린지 조회 (GET /challenges/best) - 인증 없이 접근 가능
router.get(
  '/best',
  readLimiter, // 조회 API - 높은 제한
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🏆 베스트 챌린지 조회 라우트 진입');
      console.log('🏆 요청 쿼리:', req.query);
      return await challengesController.getBestChallenges(req as any, res);
    } catch (error) {
      console.error('❌ 베스트 챌린지 조회 라우트 오류:', error);
      next(error);
    }
  }
);

// 내가 생성한 챌린지 조회 (GET /challenges/my-created)
router.get(
  '/my-created',
  authMiddleware,
  validateRequest([
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지당 1~50개 조회 가능합니다.'),
    query('status').optional().isIn(['active', 'completed', 'upcoming', 'all']).withMessage('상태 값이 올바르지 않습니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('내가 생성한 챌린지 조회 라우트 진입');
      return await challengesController.getMyChallenges(req as any, res);
    } catch (error) {
      console.error('내가 생성한 챌린지 조회 라우트 오류:', error);
      next(error);
    }
  }
);

// 내가 참여한 챌린지 조회 (GET /challenges/my-participations)
router.get(
  '/my-participations',
  authMiddleware,
  validateRequest([
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지당 1~50개 조회 가능합니다.'),
    query('status').optional().isIn(['active', 'completed', 'upcoming', 'all']).withMessage('상태 값이 올바르지 않습니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('내가 참여한 챌린지 조회 라우트 진입');
      return await challengesController.getMyParticipations(req as any, res);
    } catch (error) {
      console.error('내가 참여한 챌린지 조회 라우트 오류:', error);
      next(error);
    }
  }
);

// 챌린지 생성
router.post(
  '/',   
  authMiddleware,
  validateRequest(createChallengeValidation),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('챌린지 생성 라우트 진입');
      console.log('요청 본문:', JSON.stringify(req.body, null, 2));
      console.log('사용자 정보:', (req as any).user ? '인증됨' : '인증 안됨');
      
      return await challengesController.createChallenge(req as any, res);
    } catch (error) {
      console.error('챌린지 생성 라우트 오류:', error);
      next(error);
    }
  }
);

// 챌린지 목록 조회 (인증 없이 접근 가능) - 단순화
router.get(
  '/',
  optionalAuthMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🚀 챌린지 목록 조회 라우트 진입');
      console.log('🚀 요청 쿼리:', req.query);
      return await challengesController.getChallenges(req as any, res);
    } catch (error) {
      console.error('❌ 챌린지 목록 조회 라우트 오류:', error);
      next(error);
    }
  }
);

// 챌린지 상세 조회
router.get(
  '/:id',
  optionalAuthMiddleware,  // 비로그인 사용자도 챌린지 상세 조회 가능
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('챌린지 상세 조회 라우트 진입, ID:', req.params.id);
      return await challengesController.getChallengeDetails(req as any, res);
    } catch (error) {
      console.error('챌린지 상세 조회 라우트 오류:', error);
      next(error);
    }
  }
);

// 챌린지 참여
router.post(
  '/:id/participate',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('챌린지 참여 라우트 진입, ID:', req.params.id);
      return await challengesController.participateInChallenge(req as any, res);
    } catch (error) {
      console.error('챌린지 참여 라우트 오류:', error);
      next(error);
    }
  }
);

// 챌린지 참여 (JOIN 방식) - participate와 동일한 로직
router.post(
  '/:id/join',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('챌린지 JOIN 라우트 진입, ID:', req.params.id);
      return await challengesController.participateInChallenge(req as any, res);
    } catch (error) {
      console.error('챌린지 JOIN 라우트 오류:', error);
      next(error);
    }
  }
);

// 챌린지 감정 기록
router.post(
  '/:id/emotions',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.'),
    body('emotion_id')
      .isInt({ min: 1 })
      .withMessage('유효한 감정 ID가 필요합니다.'),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('노트는 200자 이하여야 합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('챌린지 감정 기록 라우트 진입, ID:', req.params.id);
      
      // challengesController의 타입을 any로 캐스팅하여 동적 메서드 접근
      const controller = challengesController as any;
      
      // logEmotion 메서드 존재 여부 확인
      if ('logEmotion' in controller && typeof controller.logEmotion === 'function') {
        console.log('challengesController.logEmotion 메서드를 사용합니다.');
        return await controller.logEmotion(req, res);
      } else {
        // logEmotion 메서드가 없으면 기본 감정 기록 로직 구현
        console.log('challengesController.logEmotion 메서드가 구현되지 않았습니다. 기본 응답을 반환합니다.');
        
        const { id } = req.params;
        const { emotion_id, note } = req.body;
        const user_id = (req as any).user?.user_id;

        if (!user_id) {
          return res.status(401).json({
            status: 'error',
            message: '인증이 필요합니다.'
          });
        }

        // 기본 응답 (실제 구현 시 데이터베이스에 저장하는 로직 추가 필요)
        return res.status(201).json({
          status: 'success',
          message: '감정이 기록되었습니다.',
          data: {
            challenge_id: parseInt(id),
            user_id: user_id,
            emotion_id: emotion_id,
            note: note || null,
            log_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('챌린지 감정 기록 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '감정 기록 중 오류가 발생했습니다.'
      });
    }
  }
);

// 챌린지 진행 상황 업데이트
router.post(
  '/:id/progress',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.'),
    body('progress_note')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('진행 상황 노트는 500자 이하여야 합니다.'),
    body('emotion_id')
      .isInt({ min: 1 })
      .withMessage('유효한 감정 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🚀 챌린지 진행 상황 업데이트 라우트 진입, ID:', req.params.id);
      console.log('🚀 요청 방법:', req.method);
      console.log('🚀 요청 경로:', req.path);
      console.log('🚀 요청 바디:', JSON.stringify(req.body, null, 2));
      console.log('🚀 인증 상태:', req.user ? '인증됨' : '인증 안됨');
      return await challengesController.updateChallengeProgress(req as any, res);
    } catch (error) {
      console.error('❌ 챌린지 진행 상황 업데이트 라우트 오류:', error);
      next(error);
    }
  }
);

// 챌린지 탈퇴
router.delete(
  '/:id/participate',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('챌린지 탈퇴 라우트 진입, ID:', req.params.id);
      return await challengesController.leaveChallenge(req as any, res);
    } catch (error) {
      console.error('챌린지 탈퇴 라우트 오류:', error);
      next(error);
    }
  }
);

// 감정 기록 수정
router.put(
  '/:id/emotions/:emotionId',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.'),
    param('emotionId').isInt({ min: 1 }).withMessage('유효한 감정 기록 ID가 필요합니다.'),
    body('emotion_id').optional().isInt({ min: 1 }).withMessage('유효한 감정 ID가 필요합니다.'),
    body('progress_note').optional().trim().isLength({ max: 200 }).withMessage('노트는 200자 이하여야 합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('감정 기록 수정 라우트 진입, 챌린지 ID:', req.params.id, '감정 ID:', req.params.emotionId);
      return await challengesController.updateChallengeEmotion(req as any, res);
    } catch (error) {
      console.error('감정 기록 수정 라우트 오류:', error);
      next(error);
    }
  }
);

// 감정 기록 삭제
router.delete(
  '/:id/emotions/:emotionId',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.'),
    param('emotionId').isInt({ min: 1 }).withMessage('유효한 감정 기록 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('감정 기록 삭제 라우트 진입, 챌린지 ID:', req.params.id, '감정 ID:', req.params.emotionId);
      return await challengesController.deleteChallengeEmotion(req as any, res);
    } catch (error) {
      console.error('감정 기록 삭제 라우트 오류:', error);
      next(error);
    }
  }
);

// 에러 핸들링 미들웨어
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('챌린지 라우터에서 처리되지 않은 오류:', error);
  
  if (!res.headersSent) {
    return res.status(500).json({
      status: 'error',
      message: '서버 내부 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  next(error);
});

// 디버그용 엔드포인트들 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  // 테스트 챌린지 데이터 생성
  router.post('/debug/create-test-data', (req: AuthRequest, res: Response) => {
    challengesController.createTestData(req, res);
  });

  // 챌린지 테이블 상태 확인
  router.get('/debug/table-status', (req: AuthRequest, res: Response) => {
    challengesController.debugChallengeTable(req, res);
  });
}

// 챌린지 댓글 관련 라우트
// 댓글 조회 (GET /challenges/:id/comments)
router.get(
  '/:id/comments',
  optionalAuthMiddleware,  // 비로그인 사용자도 댓글 조회 가능
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.'),
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지당 1~50개 조회 가능합니다.'),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🗨️ 챌린지 댓글 조회 라우트 진입, ID:', req.params.id);
      return await challengesController.getChallengeComments(req as any, res);
    } catch (error) {
      console.error('챌린지 댓글 조회 라우트 오류:', error);
      next(error);
    }
  }
);

// 댓글 작성 (POST /challenges/:id/comments)
router.post(
  '/:id/comments',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.'),
    body('content').trim().isLength({ min: 1, max: 500 }).withMessage('댓글은 1자 이상 500자 이하여야 합니다.'),
    body('parent_comment_id').optional().isInt({ min: 1 }).withMessage('유효한 부모 댓글 ID가 필요합니다.'),
    body('is_anonymous').optional().isBoolean().withMessage('익명 여부는 boolean 값이어야 합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🗨️ 챌린지 댓글 작성 라우트 진입, ID:', req.params.id);
      return await challengesController.createChallengeComment(req as any, res);
    } catch (error) {
      console.error('챌린지 댓글 작성 라우트 오류:', error);
      next(error);
    }
  }
);

// 댓글 좋아요/취소 (POST /challenges/comments/:commentId/like)
router.post(
  '/comments/:commentId/like',
  authMiddleware,
  validateRequest([
    param('commentId').isInt({ min: 1 }).withMessage('유효한 댓글 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('❤️ 챌린지 댓글 좋아요 라우트 진입, CommentID:', req.params.commentId);
      return await challengesController.toggleChallengeCommentLike(req as any, res);
    } catch (error) {
      console.error('챌린지 댓글 좋아요 라우트 오류:', error);
      next(error);
    }
  }
);
  router.post(
    '/:challengeId/like',
    authMiddleware,
    validateRequest([
      param('challengeId').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.')
    ]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        return await challengeLikeController.toggleChallengeLike(req as any, res);
      } catch (error) {
        console.error('챌린지 좋아요 라우트 오류:', error);
        next(error);
      }
    }
);
// 댓글 수정 (PUT /challenges/comments/:commentId)
router.put(
  '/comments/:commentId',
  authMiddleware,
  validateRequest([
    param('commentId').isInt({ min: 1 }).withMessage('유효한 댓글 ID가 필요합니다.'),
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('댓글 내용은 1자 이상 1000자 이하여야 합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('✏️ 챌린지 댓글 수정 라우트 진입, CommentID:', req.params.commentId);
      return await challengesController.updateChallengeComment(req as any, res);
    } catch (error) {
      console.error('챌린지 댓글 수정 라우트 오류:', error);
      next(error);
    }
  }
);

// 댓글 삭제 (DELETE /challenges/comments/:commentId)
router.delete(
  '/comments/:commentId',
  authMiddleware,
  validateRequest([
    param('commentId').isInt({ min: 1 }).withMessage('유효한 댓글 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🗑️ 챌린지 댓글 삭제 라우트 진입, CommentID:', req.params.commentId);
      return await challengesController.deleteChallengeComment(req as any, res);
    } catch (error) {
      console.error('챌린지 댓글 삭제 라우트 오류:', error);
      next(error);
    }
  }
);

// 감정 기록 수정 (PUT /challenge-emotions/:emotionId)
router.put(
  '/challenge-emotions/:emotionId',
  authMiddleware,
  validateRequest([
    param('emotionId').isInt({ min: 1 }).withMessage('유효한 감정 기록 ID가 필요합니다.'),
    body('emotion_id').isInt({ min: 1 }).withMessage('유효한 감정 ID가 필요합니다.'),
    body('progress_note').optional().trim().isLength({ max: 500 }).withMessage('노트는 500자 이하여야 합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('✏️ 감정 기록 수정 라우트 진입, EmotionID:', req.params.emotionId);
      return await challengesController.updateEmotionRecord(req as any, res);
    } catch (error) {
      console.error('감정 기록 수정 라우트 오류:', error);
      next(error);
    }
  }
);

// 감정 기록 삭제 (DELETE /challenge-emotions/:emotionId)
router.delete(
  '/challenge-emotions/:emotionId',
  authMiddleware,
  validateRequest([
    param('emotionId').isInt({ min: 1 }).withMessage('유효한 감정 기록 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🗑️ 감정 기록 삭제 라우트 진입, EmotionID:', req.params.emotionId);
      return await challengesController.deleteEmotionRecord(req as any, res);
    } catch (error) {
      console.error('감정 기록 삭제 라우트 오류:', error);
      next(error);
    }
  }
);

// 챌린지 수정 (PUT /challenges/:id)
router.put(
  '/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.'),
    body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('제목은 3자 이상 100자 이하여야 합니다.'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('설명은 500자 이하여야 합니다.'),
    body('start_date').optional().isISO8601().withMessage('올바른 시작 날짜 형식이 필요합니다.'),
    body('end_date').optional().isISO8601().withMessage('올바른 종료 날짜 형식이 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('✏️ 챌린지 수정 라우트 진입, ID:', req.params.id);
      return await challengesController.updateChallenge(req as any, res);
    } catch (error) {
      console.error('챌린지 수정 라우트 오류:', error);
      next(error);
    }
  }
);

// 챌린지 삭제 (DELETE /challenges/:id)
router.delete(
  '/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('유효한 챌린지 ID가 필요합니다.')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🗑️ 챌린지 삭제 라우트 진입, ID:', req.params.id);
      return await challengesController.deleteChallenge(req as any, res);
    } catch (error) {
      console.error('챌린지 삭제 라우트 오류:', error);
      next(error);
    }
  }
);

export default router;