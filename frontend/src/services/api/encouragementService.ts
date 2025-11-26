// src/services/api/encouragementService.ts
import apiClient from './client';

export interface AnonymousEncouragement {
  encouragement_id: number;
  message: string;
  sent_at: string;
  is_read: boolean;
}

export interface SendEncouragementData {
  to_user_id: number;
  message: string;
}

export interface EncouragementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}

const encouragementService = {
  // 익명 격려 메시지 전송
  sendEncouragement: async (data: SendEncouragementData) => {
    try {
      console.log('💌 익명 격려 메시지 전송 요청:', data);
      const response = await apiClient.post('/encouragement/send', data);
      console.log('💌 익명 격려 메시지 전송 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 익명 격려 메시지 전송 오류:', error);
      console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // 받은 익명 격려 메시지 조회
  getReceivedEncouragements: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    try {
      console.log('💌 받은 격려 메시지 조회 요청:', params);
      const response = await apiClient.get('/encouragement/received', { params });
      console.log('💌 받은 격려 메시지 조회 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 받은 격려 메시지 조회 오류:', error);
      console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // 격려 메시지 읽음 처리
  markAsRead: async (encouragementId: number) => {
    try {
      console.log('✅ 격려 메시지 읽음 처리 요청:', encouragementId);
      const response = await apiClient.patch(`/encouragement/${encouragementId}/read`);
      console.log('✅ 격려 메시지 읽음 처리 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 격려 메시지 읽음 처리 오류:', error);
      console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // 전체 읽음 처리
  markAllAsRead: async () => {
    try {
      console.log('✅ 전체 격려 메시지 읽음 처리 요청');
      const response = await apiClient.patch('/encouragement/read-all');
      console.log('✅ 전체 격려 메시지 읽음 처리 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 전체 격려 메시지 읽음 처리 오류:', error);
      console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  getRemainingCount: async () => {
    const response = await apiClient.get('/encouragement/remaining');
    return response.data;
  },

  getCardTemplates: async () => {
    const response = await apiClient.get('/encouragement/card-templates');
    return response.data;
  },

  sendTemplateCard: async (data: { template_id: number; custom_message?: string }) => {
    const response = await apiClient.post('/encouragement/send-card', data);
    return response.data;
  }
};

export default encouragementService;
