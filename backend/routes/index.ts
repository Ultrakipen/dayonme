// routes/index.ts
import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import db from '../models';

// 개별 라우터 imports
import authRoutes from './auth';
import challengeRoutes from './challenges';
import comfortWallRoutes, { comfortWallController } from './comfortWall';
import emotionRoutes from './emotions';
import goalsRoutes from './goals';
import myDayRoutes from './myDay';
import notificationRoutes from './notifications';
import postRoutes from './posts';
import searchRoutes from './search';
import someoneDayRoutes from './someoneDay';
import statsRoutes from './stats';
import tagRoutes from './tags';
import uploadsRoutes from './uploads';
import userRoutes from './users';
import encouragementRoutes from './encouragement';
import reactionRoutes from './reactions';
import reportRoutes from './reports';
import reviewRoutes from './review';
import bookmarkRoutes from './bookmarks';
import healthRoutes from './health';
import imageRoutes from './images';

const router = Router();

// comfortWallController export
export { comfortWallController };

// 루트 경로 응답 (API 상태 확인)
router.all('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API 상태 확인 엔드포인트
router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 보호된 라우트 (테스트용) - 인증 필요
router.get('/protected-route', authMiddleware, (req: any, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Token is valid',
    user: {
      user_id: req.user?.user_id,
      email: req.user?.email,
      nickname: req.user?.nickname
    }
  });
});

// 추가 테스트용 보호된 라우트들
router.post('/protected-route', authMiddleware, (req: any, res: Response) => {
  res.json({
    status: 'success',
    message: 'Protected POST endpoint accessed successfully',
    user: req.user
  });
});

router.put('/protected-route', authMiddleware, (req: any, res: Response) => {
  res.json({
    status: 'success',
    message: 'Protected PUT endpoint accessed successfully',
    user: req.user
  });
});

router.delete('/protected-route', authMiddleware, (req: any, res: Response) => {
  res.json({
    status: 'success',
    message: 'Protected DELETE endpoint accessed successfully',
    user: req.user
  });
});

// 기본 Goals 라우트는 제거 - 개별 라우터 등록에서 처리

// 테스트용 알림 트리거 엔드포인트
router.post('/test/notifications', authMiddleware, async (req, res) => {
  try {
    const user_id = (req as any).user?.user_id;
    
    if (!user_id) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.'
      });
    }

    // 테스트용 알림 생성 (새로운 스키마 사용)
    const testNotification = await db.Notification.create({
      user_id: user_id,
      notification_type: 'challenge',
      title: '테스트 알림',
      message: '테스트 알림입니다.',
      is_read: false,
      created_at: new Date()
    });

    res.json({
      success: true,
      data: testNotification,
      message: '테스트 알림이 생성되었습니다.'
    });
  } catch (error) {
    console.error('테스트 알림 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '테스트 알림 생성 중 오류가 발생했습니다.'
    });
  }
});

// 개별 라우트 등록 (특정 경로들을 먼저 등록)
router.use('/', healthRoutes); // Health check 엔드포인트
router.use('/images', imageRoutes); // 이미지 리사이징 API
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/emotions', emotionRoutes);
router.use('/goals', goalsRoutes);
router.use('/my-day', myDayRoutes);
router.use('/someone-day', someoneDayRoutes);
router.use('/comfort-wall', comfortWallRoutes);
router.use('/challenges', challengeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/posts', postRoutes);
router.use('/stats', statsRoutes);
router.use('/tags', tagRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/search', searchRoutes);
router.use('/encouragement', encouragementRoutes);
router.use('/reactions', reactionRoutes);
router.use('/reports', reportRoutes);
router.use('/review', reviewRoutes);
router.use('/bookmarks', bookmarkRoutes);

export default router;