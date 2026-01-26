// services/api/emotionFeatureService.ts
// 감정 챌린지 3대 기능 API 서비스

import apiClient from './client';

const api = apiClient;

const BASE_URL = '/emotion-features';

// ============================================
// 타입 정의
// ============================================
export interface CompletionCard {
  completion_id: number;
  challenge_title: string;
  completion_type: '7day' | '21day' | '30day' | 'custom';
  completed_days: number;
  total_emotions_logged: number;
  top_emotions: Array<{
    emotion_id: number;
    name: string;
    icon: string;
    count: number;
  }>;
  encouragements_received: number;
  encouragements_given: number;
  completed_at: string;
}

export interface Encouragement {
  encouragement_id: number;
  message: string;
  emotion_type?: string;
  is_read: boolean;
  sent_at: string;
  challenge?: {
    challenge_id: number;
    title: string;
  };
}

export interface EmotionReport {
  report_id: number;
  report_type: 'weekly' | 'monthly';
  report_period: string;
  total_logs: number;
  active_days: number;
  challenge_participations: number;
  challenges_completed: number;
  emotion_distribution: Array<{
    emotion_id: number;
    emotion_name: string;
    icon: string;
    count: number;
    percentage: number;
  }>;
  top_emotions: string[];
  emotion_trend: 'increasing' | 'stable' | 'decreasing';
  weekly_pattern: Array<{
    day: number;
    day_name: string;
    count: number;
  }>;
  encouragements_sent: number;
  encouragements_received: number;
  ai_insight?: string;
  ai_recommendations?: string[];
  generated_at: string;
  is_viewed: boolean;
}

export interface ParticipantStats {
  totalEmotions: number;
  completedDays: number;
  topEmotions: Array<{
    emotion_id: number;
    name: string;
    icon: string;
    count: number;
  }>;
  encouragementsReceived: number;
  encouragementsGiven: number;
}

export interface DailyEncouragementStatus {
  sent: number;
  received: number;
  limit: number;
  remaining: number;
}

// ============================================
// 1. 바이럴 포인트 (감정 성장 카드) API
// ============================================
export const viralApi = {
  // 완주 기록 생성
  createCompletion: async (challengeId: number, completionType: '7day' | '21day' | '30day' | 'custom') => {
    const response = await api.post(`${BASE_URL}/viral/completions`, {
      challengeId,
      completionType
    });
    return response.data;
  },

  // 내 완주 목록 조회
  getMyCompletions: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`${BASE_URL}/viral/completions`, {
      params: { page, limit }
    });
    return response.data;
  },

  // 완주 카드 데이터 조회
  getCompletionCard: async (completionId: number): Promise<{ success: boolean; data: CompletionCard }> => {
    const response = await api.get(`${BASE_URL}/viral/completions/${completionId}/card`);
    return response.data;
  },

  // 카드 공유 횟수 증가
  shareCard: async (completionId: number) => {
    const response = await api.post(`${BASE_URL}/viral/completions/${completionId}/share`);
    return response.data;
  },

  // 참여자 통계 조회
  getParticipantStats: async (challengeId: number): Promise<{ success: boolean; data: ParticipantStats }> => {
    const response = await api.get(`${BASE_URL}/viral/challenges/${challengeId}/stats`);
    return response.data;
  }
};

// ============================================
// 2. 익명 응원 시스템 API
// ============================================
export const encouragementApi = {
  // 응원 보내기
  sendEncouragement: async (
    challengeId: number,
    receiverId: number,
    message: string,
    emotionType?: string
  ) => {
    const response = await api.post(`${BASE_URL}/encouragements`, {
      challengeId,
      receiverId,
      message,
      emotionType
    });
    return response.data;
  },

  // 받은 응원 목록 조회
  getReceivedEncouragements: async (
    challengeId?: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data: { encouragements: Encouragement[]; total: number; unreadCount: number } }> => {
    const response = await api.get(`${BASE_URL}/encouragements/received`, {
      params: { challengeId, page, limit }
    });
    return response.data;
  },

  // 응원 읽음 처리
  markAsRead: async (encouragementId: number) => {
    const response = await api.patch(`${BASE_URL}/encouragements/${encouragementId}/read`);
    return response.data;
  },

  // 모든 응원 읽음 처리
  markAllAsRead: async (challengeId?: number) => {
    const response = await api.patch(`${BASE_URL}/encouragements/read-all`, null, {
      params: { challengeId }
    });
    return response.data;
  },

  // 응원 대상 추천
  getEncouragementTargets: async (challengeId: number, limit: number = 5) => {
    const response = await api.get(`${BASE_URL}/encouragements/challenges/${challengeId}/targets`, {
      params: { limit }
    });
    return response.data;
  },

  // 일일 응원 현황
  getDailyStatus: async (challengeId: number): Promise<{ success: boolean; data: DailyEncouragementStatus }> => {
    const response = await api.get(`${BASE_URL}/encouragements/challenges/${challengeId}/daily-status`);
    return response.data;
  }
};

// ============================================
// 3. 감정 리포트 API
// ============================================
export const reportApi = {
  // 현재 월 리포트 조회
  getCurrentMonthReport: async (): Promise<{ success: boolean; data: EmotionReport }> => {
    const response = await api.get(`${BASE_URL}/reports/current`);
    return response.data;
  },

  // 특정 월 리포트 조회
  getMonthlyReport: async (year: number, month: number): Promise<{ success: boolean; data: EmotionReport }> => {
    const response = await api.get(`${BASE_URL}/reports/${year}/${month}`);
    return response.data;
  },

  // 리포트 목록 조회
  getReportList: async (limit: number = 6) => {
    const response = await api.get(`${BASE_URL}/reports`, {
      params: { limit }
    });
    return response.data;
  }
};

// ============================================
// 4. 참여자 수 API
// ============================================
export const participantApi = {
  // 참여자 수 조회
  getParticipantCount: async (challengeId: number) => {
    const response = await api.get(`${BASE_URL}/participants/${challengeId}/count`);
    return response.data;
  }
};

export default {
  viralApi,
  encouragementApi,
  reportApi,
  participantApi
};
