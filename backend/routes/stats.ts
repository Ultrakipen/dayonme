import { Router, Response, NextFunction, RequestHandler } from 'express';
import statsController from '../controllers/statsController';
import authMiddleware from '../middleware/authMiddleware';
import { AuthRequest } from '../types/express';

const router = Router();

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: 사용자 통계 조회
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authMiddleware, statsController.getUserStats as unknown as RequestHandler);

/**
 * @swagger
 * /stats:
 *   post:
 *     summary: 사용자 통계 업데이트
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 */
router.get('/trends', authMiddleware, statsController.getEmotionTrends as unknown as RequestHandler);

/**
 * @swagger
 * /stats/weekly:
 *   get:
 *     summary: 주간 감정 트렌드 조회
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 */
router.get('/weekly', authMiddleware, (req: AuthRequest, res: Response, next: NextFunction) => {
    req.query.type = 'weekly';
    return statsController.getEmotionTrends(req as any, res).catch(next);
  });
  
  /**
 * @swagger
 * /stats/monthly:
 *   get:
 *     summary: 월간 감정 트렌드 조회
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 */
router.get('/monthly', authMiddleware, (req: AuthRequest, res: Response, next: NextFunction) => {
    req.query.type = 'monthly';
    return statsController.getEmotionTrends(req as any, res).catch(next);
  });
  
// 감정 통계 엔드포인트 추가
router.get('/emotions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {},
      message: '감정 통계를 조회했습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 활동 통계 엔드포인트 추가
router.get('/activities', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {},
      message: '활동 통계를 조회했습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 감정 분석 엔드포인트 추가
router.get('/emotions/analysis', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {},
      message: '감정 분석을 조회했습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

export default router;