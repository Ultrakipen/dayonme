// hooks/useNotification.ts
// 알림 관리를 위한 커스텀 훅

import { useState, useCallback } from 'react';
import { useNotification as useNotificationContext } from '../contexts/NotificationContext';
import notificationService from '../services/api/notificationService';

// 이 훅은 기존 useNotification과 구분하기 위해 다른 이름으로 export
export const useNotificationManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 컨텍스트에서 제공하는 기존 useNotification 훅을 사용
  const {
    notifications,
    unreadCount,
    fetchNotifications: contextFetchNotifications
  } = useNotificationContext();
  
  // 페이지네이션이 필요한 경우의 확장된 fetchNotifications
  const fetchNotifications = useCallback(async (page?: number, limit?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // 옵셔널 파라미터로 변경하여 notificationService가 기본값을 처리하도록 함
      const response = await notificationService.getNotifications({ page, limit });
      await contextFetchNotifications(); // 컨텍스트의 알림 업데이트
      
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errorMsg = err instanceof Error ? err.message : '알림을 불러오는 중 오류가 발생했습니다.';
      setError(errorMsg);
      throw err;
    }
  }, [contextFetchNotifications]);
  
  // 컨텍스트의 기능과 로컬 상태를 함께 반환
  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    // 컨텍스트에서 제공하는 기능들
    markAsRead: useNotificationContext().markAsRead,
    markAllAsRead: useNotificationContext().markAllAsRead,
    deleteNotification: useNotificationContext().deleteNotification
  };
};

// 기존 useNotification은 컨텍스트에서 export된 것을 그대로 재export
export { useNotification } from '../contexts/NotificationContext';

// 기본 export는 확장된 버전
export default useNotificationManager;