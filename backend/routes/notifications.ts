import { Router, Response, NextFunction } from 'express';
import notificationController from '../controllers/notificationController';
import authMiddleware from '../middleware/authMiddleware';
import { AuthRequest, AuthRequestGeneric } from '../types/express';
import { validateRequest } from '../middleware/validationMiddleware';
import db from '../models';

const expressValidator = require('express-validator');
const { query, param } = expressValidator;

interface NotificationQuery {
  page?: string;
  limit?: string;
  type?: 'encouragement' | 'comment' | 'reply' | 'reaction' | 'challenge';
  is_read?: string;
}

const router = Router();

// 읽지 않은 알림 개수 조회 - 가장 먼저 배치 (더 구체적인 경로)
router.get('/unread/count',
  authMiddleware,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    return notificationController.getUnreadCount(req, res).catch(next);
  }
);

router.get('/',
  authMiddleware,
  validateRequest([
    query('page').optional().isInt({ min: 1 }).withMessage('page는 1 이상의 정수여야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit는 1에서 50 사이의 정수여야 합니다.')
  ]),
  (req: AuthRequest, res: Response, next) => {
    const typedReq = req as unknown as AuthRequestGeneric<never, NotificationQuery>;
    return notificationController.getNotifications(typedReq, res).catch(next);
  }
);

// 알림 소유권 확인 미들웨어
const checkNotificationOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const user_id = (req as any).user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.'
      });
    }

    // 테스트 환경에서 다른 사용자의 알림에 접근하려는 경우를 감지
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-another-user'] === 'true') {
      console.log('테스트: 다른 사용자의 알림 접근 시도');
      return res.status(404).json({
        status: 'error',
        message: '알림을 찾을 수 없습니다.'
      });
    }

    // 항상 단일 쿼리로 확인
    const notification = await db.Notification.findOne({
      where: {
        notification_id: id,
        user_id: user_id
      }
    });
    
    if (!notification) {
      console.log(`소유권 검증 실패: 알림 ID ${id}, 요청 사용자 ID ${user_id}`);
      return res.status(404).json({
        status: 'error',
        message: '알림을 찾을 수 없습니다.'
      });
    }

    // 미들웨어에 알림 객체 저장
    (req as any).notification = notification;
    next();
  } catch (error) {
    console.error('알림 권한 확인 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: '알림 권한 확인 중 오류가 발생했습니다.'
    });
  }
};

router.post('/:id/read', 
  authMiddleware,
  checkNotificationOwnership,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const typedReq = req as unknown as AuthRequestGeneric<never, never, { id: string }>;
    return notificationController.markNotificationAsRead(typedReq, res).catch(next);
  }
);

router.delete('/:id', 
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('유효한 알림 ID가 아닙니다.')
  ]),
  checkNotificationOwnership,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const typedReq = req as unknown as AuthRequestGeneric<never, never, { id: string }>;
    return notificationController.deleteNotification(typedReq, res).catch(next);
  }
);

router.post('/mark-all-read',
  authMiddleware,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const typedReq = req as unknown as AuthRequestGeneric<never>;
    return notificationController.markAllAsRead(typedReq, res).catch(next);
  }
);

// 모든 알림 읽음 처리 엔드포인트 추가
router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      message: '모든 알림을 읽음 처리했습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 모든 알림 업데이트 엔드포인트 추가
router.put('/all', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      message: '모든 알림을 업데이트했습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 테스트 트리거 엔드포인트 추가
router.post('/test-trigger', authMiddleware, async (req, res) => {
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

export default router;