import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import notificationService from '../services/api/notificationService';

interface Notification {
  id: number;
  user_id: number;
  content: string;
  notification_type: 'like' | 'comment' | 'challenge' | 'system';
  related_id?: number;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationService.getNotifications();
      if (response && response.data) {
        // 명시적 타입 지정
        const notificationsData: Notification[] = Array.isArray(response.data) 
        ? response.data.map((item: { id: any; user_id: any; content: any; notification_type: any; related_id: any; is_read: any; created_at: any; }) => ({
            id: item.id,
            user_id: item.user_id,
            content: item.content,
            notification_type: item.notification_type,
            related_id: item.related_id,
            is_read: !!item.is_read,
            created_at: item.created_at
          }))
        : [];
        setNotifications(notificationsData);
        // 타입 안전한 방식으로 필터링
        const unreadItems = notificationsData.filter(function(item) {
          return item.is_read === false;
        });
        setUnreadCount(unreadItems.length);
      }
    } catch (err) {
      setError('알림을 불러오는데 실패했습니다.');
      console.error('알림 불러오기 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await notificationService.markAsRead(notificationId);
      await fetchNotifications();
    } catch (err) {
      setError('알림을 읽음 처리하는데 실패했습니다.');
      console.error('알림 읽음 처리 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await notificationService.markAllAsRead();
      await fetchNotifications();
    } catch (err) {
      setError('모든 알림을 읽음 처리하는데 실패했습니다.');
      console.error('모든 알림 읽음 처리 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      await fetchNotifications();
    } catch (err) {
      setError('알림을 삭제하는데 실패했습니다.');
      console.error('알림 삭제 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 초기 fetch
    fetchNotifications();
    
    // 주기적으로 알림 업데이트 (예: 30초마다)
    // 테스트 환경에서는 interval 생성 방지
    if (process.env.NODE_ENV !== 'test') {
      intervalRef.current = setInterval(() => {
        fetchNotifications();
      }, 30000);
    }
    
    // 컴포넌트 언마운트 시 interval 정리
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};