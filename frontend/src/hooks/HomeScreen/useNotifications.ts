// src/hooks/HomeScreen/useNotifications.ts
import { useState, useEffect } from 'react';
import notificationService from '../../services/api/notificationService';
import { devLog } from '../../utils/security';

/**
 * 알림 관리 hook
 */
export const useNotifications = (userId?: number) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 읽지 않은 알림 개수 로드
  const loadUnreadCount = async () => {
    if (!userId) return;

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count || 0);
    } catch (error) {
      devLog('알림 개수 로드 실패:', error);
      setUnreadCount(0);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadUnreadCount();
    } catch (error) {
      devLog('알림 읽음 처리 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
    } catch (error) {
      devLog('모든 알림 읽음 처리 실패:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadUnreadCount();
    }
  }, [userId]);

  return {
    unreadCount,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotifications;
