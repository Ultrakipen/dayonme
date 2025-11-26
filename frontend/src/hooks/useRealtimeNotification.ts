// hooks/useRealtimeNotification.ts
import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import { useNotification } from '../contexts/NotificationContext';

interface Notification {
  id: number;
  content: string;
  notification_type: 'like' | 'comment' | 'challenge' | 'system';
  related_id?: number;
  is_read: boolean;
  created_at: string;
}

interface UseRealtimeNotificationProps {
  autoConnect?: boolean;
  onNewNotification?: (notification: Notification) => void;
}

/**
 * 실시간 알림을 관리하는 훅
 */
export const useRealtimeNotification = ({
  autoConnect = true,
  onNewNotification
}: UseRealtimeNotificationProps = {}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // NotificationContext에서 기존 알림 관련 함수 가져오기
  const notificationContext = useNotification();
  const { fetchNotifications } = notificationContext;
  
  // 소켓 연결
  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await socketService.init();
      setIsConnected(socketService.isConnected());
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '연결 중 오류가 발생했습니다.');
      setIsLoading(false);
      console.error('Socket connection error:', err);
    }
  }, []);

  // 연결 해제
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  // 새 알림 이벤트 핸들러
  const handleNewNotification = useCallback((notification: Notification) => {
    // 새 알림 수신 시 컨텍스트 업데이트
    fetchNotifications();
    
    // 커스텀 핸들러가 있으면 호출
    if (onNewNotification) {
      onNewNotification(notification);
    }
  }, [fetchNotifications, onNewNotification]);

  // 읽지 않은 알림 수 업데이트 핸들러
  const handleUnreadCountUpdate = useCallback((data: { count: number }) => {
    if (notificationContext && 'setUnreadCount' in notificationContext) {
      // setUnreadCount가 존재하는 경우에만 사용
      (notificationContext as any).setUnreadCount(data.count);
    }
  }, [notificationContext]);

  // 알림 읽음 처리
  const markAsRead = useCallback((notificationId: number) => {
    if (isConnected) {
      socketService.emit('mark_notification_read', { notification_id: notificationId });
    }
  }, [isConnected]);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    if (isConnected) {
      socketService.emit('mark_all_notifications_read');
    }
  }, [isConnected]);

  // 컴포넌트 마운트/언마운트 시 이벤트 리스너 설정
  useEffect(() => {
    // 소켓 이벤트 리스너 등록
    socketService.on('connect', () => setIsConnected(true));
    socketService.on('disconnect', () => setIsConnected(false));
    socketService.on('new_notification', handleNewNotification);
    socketService.on('unread_notifications_count', handleUnreadCountUpdate);
    
    // 자동 연결 설정이 있으면 연결
    if (autoConnect && !socketService.isConnected()) {
      connect();
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      socketService.off('connect');
      socketService.off('disconnect');
      socketService.off('new_notification', handleNewNotification);
      socketService.off('unread_notifications_count', handleUnreadCountUpdate);
    };
  }, [autoConnect, connect, handleNewNotification, handleUnreadCountUpdate]);

  return {
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead
  };
};

export default useRealtimeNotification;