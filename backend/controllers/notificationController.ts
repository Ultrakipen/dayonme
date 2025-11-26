// controllers/notificationController.ts
import { Response } from 'express';
import db from '../models';
import { AuthRequest, AuthRequestGeneric } from '../types/express';
import { Op } from 'sequelize';
import { getCursorPaginationOptions, encodeCursor } from '../utils/utils';

interface NotificationQuery {
  page?: string;
  limit?: string;
  type?: 'encouragement' | 'comment' | 'reply' | 'reaction' | 'challenge';
  is_read?: string;
  // 커서 기반 페이지네이션
  cursor?: string;
  direction?: 'next' | 'prev';
}

// 알림 생성 헬퍼 함수
export const createNotification = async (params: {
  userId: number;
  notificationType: 'encouragement' | 'comment' | 'reply' | 'reaction' | 'challenge';
  relatedId?: number;
  postId?: number;
  postType?: string;
  senderId?: number;
  senderNickname?: string;
  title: string;
  message: string;
}) => {
  try {
    console.log('🔔 [createNotification] 시작');
    console.log('   Input params:', JSON.stringify(params, null, 2));

    const notificationData = {
      user_id: params.userId,
      notification_type: params.notificationType,
      related_id: params.relatedId,
      post_id: params.postId,
      post_type: params.postType,
      sender_id: params.senderId,
      sender_nickname: params.senderNickname,
      title: params.title,
      message: params.message,
      is_read: false,
      created_at: new Date()
    };

    console.log('   DB insert data:', JSON.stringify(notificationData, null, 2));

    const notification = await db.Notification.create(notificationData);

    console.log(`✅ [createNotification] 성공: ${params.title} → 사용자 ${params.userId}`);
    console.log(`   생성된 알림 ID: ${notification.get('notification_id')}`);
    return notification;
  } catch (error) {
    console.error('❌ [createNotification] 오류 발생:');
    console.error('   Error type:', error?.constructor?.name);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('   Full error object:', error);
    return null;
  }
};

const notificationController = {
  // 알림 목록 조회
  getNotifications: async (req: AuthRequestGeneric<never, NotificationQuery>, res: Response) => {
    try {
      if (!req.user?.user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { cursor, direction = 'next' } = req.query;
      const page = parseInt(req.query.page || '1');
      const limit = parseInt(req.query.limit || '20');
      const offset = (page - 1) * limit;

      // 커서 기반 vs 오프셋 기반 페이지네이션 선택
      const useCursorPagination = !!cursor;

      // 쿼리 조건 설정
      const whereCondition: any = {
        user_id: req.user.user_id
      };

      if (req.query.type) {
        whereCondition.notification_type = req.query.type;
      }

      if (req.query.is_read !== undefined) {
        whereCondition.is_read = req.query.is_read === 'true';
      }

      // 커서 기반 페이지네이션 적용
      let cursorOptions: any = null;
      if (useCursorPagination) {
        cursorOptions = getCursorPaginationOptions({
          cursor,
          limit,
          direction,
          sortField: 'created_at',
          sortOrder: 'DESC',
          primaryKey: 'notification_id'
        });
        // 커서 조건을 where 절에 병합
        if (cursorOptions.where[Op.or]) {
          if (!whereCondition[Op.and]) whereCondition[Op.and] = [];
          whereCondition[Op.and].push({ [Op.or]: cursorOptions.where[Op.or] });
        }
      }

      const { count, rows: notifications } = await db.Notification.findAndCountAll({
        where: whereCondition,
        order: useCursorPagination && cursorOptions ? cursorOptions.order : [['created_at', 'DESC']],
        limit: useCursorPagination ? cursorOptions.limit : limit,
        offset: useCursorPagination ? 0 : offset,
        attributes: ['notification_id', 'title', 'message', 'notification_type', 'related_id', 'post_id', 'post_type', 'sender_id', 'sender_nickname', 'is_read', 'read_at', 'created_at']
      });

      const totalPages = Math.ceil(count / limit);

      console.log(`✅ [getNotifications] 알림 목록 조회 완료: ${notifications.length}개`);

      return res.json({
        status: 'success',
        data: {
          notifications: notifications,
          pagination: useCursorPagination
            ? (() => {
                // 커서 기반 페이지네이션 응답
                const actualLimit = cursorOptions.limit - 1;
                const hasNextPage = notifications.length > actualLimit;
                const actualNotifications = hasNextPage ? notifications.slice(0, actualLimit) : notifications;
                const firstNotification = actualNotifications[0]?.get() as any;
                const lastNotification = actualNotifications[actualNotifications.length - 1]?.get() as any;
                return {
                  type: 'cursor',
                  has_next: hasNextPage,
                  has_prev: !!cursor,
                  start_cursor: firstNotification ? encodeCursor(firstNotification.notification_id, firstNotification.created_at) : null,
                  end_cursor: lastNotification ? encodeCursor(lastNotification.notification_id, lastNotification.created_at) : null,
                  total_count: count
                };
              })()
            : {
                // 오프셋 기반 페이지네이션 응답 (하위 호환성)
                type: 'offset',
                page,
                limit,
                total: count,
                totalPages
              }
        },
        message: '알림 목록을 조회했습니다.'
      });
    } catch (error) {
      console.error('알림 목록 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '알림 목록 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 특정 알림 읽음 처리
  markNotificationAsRead: async (req: AuthRequestGeneric<never, never, { id: string }>, res: Response) => {
    const transaction = await db.sequelize.transaction();
    try {
      if (!req.user?.user_id) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { id } = req.params;

      const notification = await db.Notification.findOne({
        where: {
          notification_id: id,
          user_id: req.user.user_id
        },
        transaction
      });

      if (!notification) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '알림을 찾을 수 없습니다.'
        });
      }

      await notification.update({ is_read: true }, { transaction });

      await transaction.commit();
      return res.json({
        status: 'success',
        message: '알림이 읽음 처리되었습니다.'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('알림 읽음 처리 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '알림 읽음 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 특정 알림 삭제
  deleteNotification: async (req: AuthRequestGeneric<never, never, { id: string }>, res: Response) => {
    const transaction = await db.sequelize.transaction();
    try {
      if (!req.user?.user_id) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { id } = req.params;

      const notification = await db.Notification.findOne({
        where: {
          notification_id: id,
          user_id: req.user.user_id
        },
        transaction
      });
      
      if (!notification) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '알림을 찾을 수 없습니다.'
        });
      }
      
      await db.Notification.destroy({
        where: {
          notification_id: id,
          user_id: req.user.user_id
        },
        transaction
      });

      await transaction.commit();
      return res.json({
        status: 'success',
        message: '알림이 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('알림 삭제 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '알림 삭제 중 오류가 발생했습니다.'
      });
    }
  },

  // 모든 알림 읽음 처리
  markAllAsRead: async (req: AuthRequestGeneric<never>, res: Response) => {
    const transaction = await db.sequelize.transaction();
    try {
      if (!req.user?.user_id) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      await db.Notification.update(
        { is_read: true },
        {
          where: {
            user_id: req.user.user_id,
            is_read: false
          },
          transaction
        }
      );

      await transaction.commit();
      return res.json({
        status: 'success',
        message: '모든 알림이 읽음 처리되었습니다.'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('전체 알림 읽음 처리 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '전체 알림 읽음 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 읽지 않은 알림 개수 조회
  getUnreadCount: async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔔 [getUnreadCount] API 호출됨, user_id:', req.user?.user_id);

      if (!req.user?.user_id) {
        console.log('❌ [getUnreadCount] 인증 실패: user_id 없음');
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      console.log('🔔 [getUnreadCount] 알림 개수 조회 쿼리 실행 중...');
      const count = await db.Notification.count({
        where: {
          user_id: req.user.user_id,
          is_read: false
        }
      });

      console.log('✅ [getUnreadCount] 조회 완료, 읽지 않은 알림 개수:', count);

      return res.json({
        status: 'success',
        data: {
          count
        }
      });
    } catch (error) {
      console.error('❌ [getUnreadCount] 읽지 않은 알림 개수 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '읽지 않은 알림 개수 조회 중 오류가 발생했습니다.',
        data: {
          count: 0
        }
      });
    }
  }
};

export default notificationController;