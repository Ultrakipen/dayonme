// src/services/api/notificationService.ts
import apiClient from './client';
import { AxiosError } from 'axios';
import { requestDeduplicator } from './requestQueue';

export interface Notification {
  notification_id: number;
  user_id: number;
  notification_type: 'encouragement' | 'comment' | 'reply' | 'reaction' | 'challenge';
  related_id?: number;
  post_id?: number;
  post_type?: string;
  sender_id?: number;
  sender_nickname?: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationResponse {
  status: 'success' | 'error';
  message?: string;
  data: {
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface NotificationCountResponse {
  status: 'success' | 'error';
  data: {
    count: number;
  };
}

const notificationService = {
  getNotifications: async (params?: { 
    page?: number; 
    limit?: number;
    unread_only?: boolean; 
  }): Promise<NotificationResponse> => {
    try {
      const response = await apiClient.get<NotificationResponse>('/notifications', { params });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (__DEV__) console.error('❌ API 응답 오류:', axiosError.response?.data || axiosError.message);
      throw new Error('알림을 가져오는데 실패했습니다.');
    }
  },
  
  markAsRead: async (notificationId: number) => {
    try {
      const response = await apiClient.post(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (__DEV__) console.error('❌ 알림 읽음 처리 오류:', axiosError.response?.data || axiosError.message);
      throw new Error('알림 읽음 처리에 실패했습니다.');
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.post('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (__DEV__) console.error('❌ 전체 알림 읽음 처리 오류:', axiosError.response?.data || axiosError.message);
      throw new Error('전체 알림 읽음 처리에 실패했습니다.');
    }
  },

  getUnreadCount: async (): Promise<number> => {
    // 중복 요청 방지
    return requestDeduplicator.dedupe('GET:/notifications/unread/count', async () => {
      try {
        if (__DEV__) console.log('🔔 [notificationService] getUnreadCount API 호출 시작');
        const response = await apiClient.get<NotificationCountResponse>('/notifications/unread/count');
        if (__DEV__) console.log('🔔 [notificationService] API 응답:', response.data);
        const count = response.data?.data?.count || 0;
        if (__DEV__) console.log('🔔 [notificationService] 추출한 알림 개수:', count);
        return count;
      } catch (error) {
        const axiosError = error as AxiosError;
        if (__DEV__) console.error('❌ [notificationService] 읽지 않은 알림 개수 조회 오류:', axiosError.response?.data || axiosError.message);
        return 0;
      }
    });
  },
  
  deleteNotification: async (notificationId: number) => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (__DEV__) console.error('❌ 알림 삭제 오류:', axiosError.response?.data || axiosError.message);
      throw new Error('알림 삭제에 실패했습니다.');
    }
  },
  
  updateNotificationSettings: async (settings: {
    like_notifications?: boolean;
    comment_notifications?: boolean;
    challenge_notifications?: boolean;
    encouragement_notifications?: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    daily_reminder?: string;
  }) => {
    try {
      if (__DEV__) console.log('🔔 [notificationService] updateNotificationSettings 호출:', settings);
      const response = await apiClient.put('/users/notification-settings', settings);
      if (__DEV__) console.log('✅ [notificationService] 알림 설정 업데이트 성공:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (__DEV__) console.error('❌ 알림 설정 업데이트 오류:', axiosError.response?.data || axiosError.message);
      throw new Error('알림 설정 업데이트에 실패했습니다.');
    }
  },
  
  getNotificationSettings: async () => {
    try {
      const response = await apiClient.get('/users/notification-settings');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (__DEV__) console.error('❌ 알림 설정 조회 오류:', axiosError.response?.data || axiosError.message);
      throw new Error('알림 설정 조회에 실패했습니다.');
    }
  }
};

export default notificationService;