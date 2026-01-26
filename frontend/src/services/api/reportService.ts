// src/services/api/reportService.ts

import apiClient from './client';
import { 
  ReportData, 
  Report, 
  ReportStats, 
  ReportFilters,
  BlockData,
  BlockedUser,
  ModerationAction,
  ReportResponse 
} from '../../types/report';
import { PaginatedResponse } from '../../types/comfortWall';

const reportService = {
  // 신고 제출
  submitReport: async (reportData: ReportData): Promise<ReportResponse> => {
    try {
      const response = await apiClient.post('/reports', reportData);
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('신고 제출 오류:', error);
      throw error;
    }
  },

  // 게시물 신고
  reportPost: async (
    postId: number, 
    reportType: ReportData['report_type'], 
    reason: string, 
    details?: string
  ): Promise<ReportResponse> => {
    try {
      const reportData: ReportData = {
        item_type: 'post',
        item_id: postId,
        report_type: reportType,
        reason,
        details,
      };
      return await reportService.submitReport(reportData);
    } catch (error) {
      if (__DEV__) console.error('게시물 신고 오류:', error);
      throw error;
    }
  },

  // 댓글 신고
  reportComment: async (
    commentId: number,
    reportType: ReportData['report_type'],
    reason: string,
    details?: string
  ): Promise<ReportResponse> => {
    try {
      const reportData: ReportData = {
        item_type: 'comment',
        item_id: commentId,
        report_type: reportType,
        reason,
        details,
      };
      return await reportService.submitReport(reportData);
    } catch (error) {
      if (__DEV__) console.error('댓글 신고 오류:', error);
      throw error;
    }
  },

  // 사용자 신고
  reportUser: async (
    userId: number,
    reportType: ReportData['report_type'],
    reason: string,
    details?: string
  ): Promise<ReportResponse> => {
    try {
      const reportData: ReportData = {
        item_type: 'user',
        item_id: userId,
        report_type: reportType,
        reason,
        details,
      };
      return await reportService.submitReport(reportData);
    } catch (error) {
      if (__DEV__) console.error('사용자 신고 오류:', error);
      throw error;
    }
  },

  // 신고 목록 조회 (관리자용)
  getReports: async (filters?: ReportFilters): Promise<PaginatedResponse<Report>> => {
    try {
      const response = await apiClient.get('/reports', { params: filters });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('신고 목록 조회 오류:', error);
      throw error;
    }
  },

  // 내가 제출한 신고 조회
  getMyReports: async (filters?: ReportFilters): Promise<PaginatedResponse<Report>> => {
    try {
      const response = await apiClient.get('/reports/my', { params: filters });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('내 신고 목록 조회 오류:', error);
      throw error;
    }
  },

  // 신고 상세 조회
  getReportById: async (reportId: number): Promise<Report> => {
    try {
      const response = await apiClient.get(`/reports/${reportId}`);
      return response.data.data || response.data;
    } catch (error) {
      if (__DEV__) console.error('신고 상세 조회 오류:', error);
      throw error;
    }
  },

  // 신고 처리 (관리자용)
  reviewReport: async (
    reportId: number,
    status: 'reviewed' | 'resolved' | 'dismissed' | 'escalated',
    resolutionNote?: string
  ): Promise<void> => {
    try {
      const data = { status, resolution_note: resolutionNote };
      await apiClient.patch(`/reports/${reportId}/review`, data);
    } catch (error) {
      if (__DEV__) console.error('신고 처리 오류:', error);
      throw error;
    }
  },

  // 신고 통계 조회
  getReportStats: async (): Promise<ReportStats> => {
    try {
      const response = await apiClient.get('/reports/stats');
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('신고 통계 조회 오류:', error);
      throw error;
    }
  },

  // 사용자 차단
  blockUser: async (blockData: BlockData): Promise<void> => {
    try {
      await apiClient.post('/users/block', blockData);
    } catch (error) {
      if (__DEV__) console.error('사용자 차단 오류:', error);
      throw error;
    }
  },

  // 사용자 차단 해제
  unblockUser: async (userId: number): Promise<void> => {
    try {
      await apiClient.delete(`/users/block/${userId}`);
    } catch (error) {
      if (__DEV__) console.error('사용자 차단 해제 오류:', error);
      throw error;
    }
  },

  // 차단된 사용자 목록 조회
  getBlockedUsers: async (): Promise<BlockedUser[]> => {
    try {
      const response = await apiClient.get('/users/blocked');
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('차단된 사용자 목록 조회 오류:', error);
      throw error;
    }
  },

  // 특정 사용자가 차단되었는지 확인
  isUserBlocked: async (userId: number): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/users/block/${userId}/status`);
      return response.data.is_blocked;
    } catch (error) {
      if (__DEV__) console.error('사용자 차단 상태 확인 오류:', error);
      return false;
    }
  },

  // 모더레이션 액션 조회 (관리자용)
  getModerationActions: async (
    targetType?: 'post' | 'comment' | 'user',
    targetId?: number
  ): Promise<ModerationAction[]> => {
    try {
      const params = { target_type: targetType, target_id: targetId };
      const response = await apiClient.get('/moderation/actions', { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('모더레이션 액션 조회 오류:', error);
      throw error;
    }
  },

  // 콘텐츠 숨기기 (임시 조치)
  hideContent: async (
    contentType: 'post' | 'comment',
    contentId: number,
    reason: string
  ): Promise<void> => {
    try {
      const data = {
        action_type: 'content_removal',
        target_type: contentType,
        target_id: contentId,
        reason,
      };
      await apiClient.post('/moderation/actions', data);
    } catch (error) {
      if (__DEV__) console.error('콘텐츠 숨기기 오류:', error);
      throw error;
    }
  },

  // 사용자 경고
  warnUser: async (userId: number, reason: string, details?: string): Promise<void> => {
    try {
      const data = {
        action_type: 'warning',
        target_type: 'user',
        target_id: userId,
        reason,
        details,
      };
      await apiClient.post('/moderation/actions', data);
    } catch (error) {
      if (__DEV__) console.error('사용자 경고 오류:', error);
      throw error;
    }
  },

  // 임시 정지
  suspendUser: async (
    userId: number,
    reason: string,
    durationDays: number,
    details?: string
  ): Promise<void> => {
    try {
      const data = {
        action_type: 'temporary_ban',
        target_type: 'user',
        target_id: userId,
        reason,
        details,
        duration_days: durationDays,
      };
      await apiClient.post('/moderation/actions', data);
    } catch (error) {
      if (__DEV__) console.error('사용자 임시 정지 오류:', error);
      throw error;
    }
  },

  // 영구 정지
  banUser: async (userId: number, reason: string, details?: string): Promise<void> => {
    try {
      const data = {
        action_type: 'permanent_ban',
        target_type: 'user',
        target_id: userId,
        reason,
        details,
      };
      await apiClient.post('/moderation/actions', data);
    } catch (error) {
      if (__DEV__) console.error('사용자 영구 정지 오류:', error);
      throw error;
    }
  },

  // 신고 사유 템플릿 조회
  getReportReasons: async (itemType: 'post' | 'comment' | 'user'): Promise<Array<{
    type: string;
    label: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>> => {
    try {
      const response = await apiClient.get(`/reports/reasons/${itemType}`);
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('신고 사유 템플릿 조회 오류:', error);
      // 기본 신고 사유 반환
      return [
        {
          type: 'spam',
          label: '스팸/도배',
          description: '반복적이거나 무의미한 내용',
          severity: 'medium',
        },
        {
          type: 'inappropriate',
          label: '부적절한 내용',
          description: '커뮤니티 가이드라인에 위반되는 내용',
          severity: 'medium',
        },
        {
          type: 'harassment',
          label: '괴롭힘/욕설',
          description: '다른 사용자를 괴롭히거나 모욕하는 내용',
          severity: 'high',
        },
        {
          type: 'violence',
          label: '폭력적 내용',
          description: '폭력을 조장하거나 묘사하는 내용',
          severity: 'critical',
        },
        {
          type: 'misinformation',
          label: '잘못된 정보',
          description: '거짓이거나 오해를 불러일으키는 정보',
          severity: 'medium',
        },
        {
          type: 'other',
          label: '기타',
          description: '위에 해당하지 않는 기타 사유',
          severity: 'low',
        },
      ];
    }
  },

  // 신고 접수 확인
  acknowledgeReport: async (reportId: number): Promise<void> => {
    try {
      await apiClient.patch(`/reports/${reportId}/acknowledge`);
    } catch (error) {
      if (__DEV__) console.error('신고 접수 확인 오류:', error);
      throw error;
    }
  },
};

export default reportService;