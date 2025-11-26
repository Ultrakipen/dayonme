// 알림 관련 유틸리티 함수 모음

// NotificationContext에서 정의된 타입 사용
interface Notification {
    id: number;
    user_id: number;
    content: string;
    notification_type: 'like' | 'comment' | 'challenge' | 'system';
    related_id?: number;
    is_read: boolean;
    created_at: string;
  }
  
  /**
   * 알림을 유형별로 그룹화
   */
  export const groupNotificationsByType = (notifications: Notification[]) => {
    return notifications.reduce((groups, notification) => {
      const type = notification.notification_type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(notification);
      return groups;
    }, {} as Record<string, Notification[]>);
  };
  
  /**
   * 알림을 날짜별로 그룹화 (오늘, 어제, 이번 주, 이전)
   */
  export const groupNotificationsByDate = (notifications: Notification[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return notifications.reduce((groups, notification) => {
      const notifDate = new Date(notification.created_at);
      
      if (notifDate >= today) {
        if (!groups.today) groups.today = [];
        groups.today.push(notification);
      } else if (notifDate >= yesterday) {
        if (!groups.yesterday) groups.yesterday = [];
        groups.yesterday.push(notification);
      } else if (notifDate >= oneWeekAgo) {
        if (!groups.thisWeek) groups.thisWeek = [];
        groups.thisWeek.push(notification);
      } else {
        if (!groups.earlier) groups.earlier = [];
        groups.earlier.push(notification);
      }
      
      return groups;
    }, {} as Record<'today' | 'yesterday' | 'thisWeek' | 'earlier', Notification[]>);
  };
  
  /**
   * 특정 유형의 알림만 필터링
   */
  export const filterNotificationsByType = (
    notifications: Notification[], 
    types: ('like' | 'comment' | 'challenge' | 'system')[]
  ) => {
    return notifications.filter(notification => 
      types.includes(notification.notification_type)
    );
  };
  
  /**
   * 알림 읽음 상태로 필터링
   */
  export const filterNotificationsByReadStatus = (
    notifications: Notification[],
    isRead: boolean
  ) => {
    return notifications.filter(notification => notification.is_read === isRead);
  };
  
  /**
   * 알림 목록에서 중복 제거 (ID 기준)
   */
  export const removeDuplicateNotifications = (notifications: Notification[]) => {
    const seen = new Set();
    return notifications.filter(notification => {
      if (seen.has(notification.id)) {
        return false;
      }
      seen.add(notification.id);
      return true;
    });
  };
  
  /**
   * 알림 시간 포맷 (상대적 시간)
   */
  export const formatNotificationTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    
    // 분 단위 차이 계산
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    
    // 시간 단위 차이 계산
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    // 일 단위 차이 계산
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}일 전`;
    
    // 주 단위 차이 계산
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}주 전`;
    
    // 월 단위 차이 계산
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}개월 전`;
    
    // 년 단위 차이 계산
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}년 전`;
  };