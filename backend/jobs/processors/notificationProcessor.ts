/**
 * 알림 작업 프로세서
 * Bull 큐에서 알림 작업을 처리
 */

import db from '../../models';
import { NotificationJobData, setFallbackHandler } from '../queue';

/**
 * 알림 생성 처리
 */
export const processNotification = async (data: NotificationJobData): Promise<void> => {
  try {
    console.log('🔔 [NotificationProcessor] 알림 생성 시작:', data.title);

    const notificationData = {
      user_id: data.userId,
      notification_type: data.notificationType,
      related_id: data.relatedId,
      post_id: data.postId,
      post_type: data.postType,
      sender_id: data.senderId,
      sender_nickname: data.senderNickname,
      title: data.title,
      message: data.message,
      is_read: false,
      created_at: new Date()
    };

    await db.Notification.create(notificationData);

    console.log(`✅ [NotificationProcessor] 알림 생성 완료: ${data.title} → 사용자 ${data.userId}`);
  } catch (error) {
    console.error('❌ [NotificationProcessor] 알림 생성 실패:', error);
    throw error; // Bull이 재시도할 수 있도록 예외 전파
  }
};

/**
 * 대량 알림 전송 (예: 공지사항)
 */
export const processBulkNotification = async (
  userIds: number[],
  notification: Omit<NotificationJobData, 'userId'>
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      await processNotification({ ...notification, userId });
      success++;
    } catch (error) {
      failed++;
      console.error(`❌ 사용자 ${userId} 알림 실패:`, error);
    }
  }

  console.log(`📊 대량 알림 완료: 성공 ${success}, 실패 ${failed}`);
  return { success, failed };
};

// 폴백 핸들러 등록 (Bull 비활성화 시 사용)
setFallbackHandler('notification', processNotification);

export default processNotification;
