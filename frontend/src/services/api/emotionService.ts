// src/services/api/emotionService.ts
import apiClient from './client';
import { requestDeduplicator } from './requestQueue';

export interface Emotion {
  emotion_id: number;
  name: string;
  icon: string;
  color: string;
}

export interface EmotionCreateDTO {
  emotion_ids: number[];
  note?: string;
  source?: 'post' | 'quick_check';
}

export interface EmotionLog {
  log_id: number;
  user_id: number;
  emotion_id: number;
  note?: string;
  log_date: string;
  created_at: string;
  emotion?: Emotion;
}

const emotionService = {
  // 모든 감정 목록 조회 (백엔드 /api/emotions) - 중복 방지 추가
  getAllEmotions: async () => {
    const cacheKey = 'GET:/emotions';
    return requestDeduplicator.dedupe(cacheKey, async () => {
      try {
        if (__DEV__) console.log('🔄 감정 목록 조회 중...');
        const response = await apiClient.get<{ status: string; data: Emotion[] }>('/emotions');

        if (response.data.status === 'success') {
          if (__DEV__) console.log(`✅ 감정 목록 조회 성공: ${response.data.data.length}개`);
        }

        return response;
      } catch (error) {
        if (__DEV__) console.error('❌ 감정 목록 조회 오류:', error);
        throw error;
      }
    });
  },
  
 
// 감정 기록 (복수 감정 지원) - 응답 처리 수정
recordEmotions: async (data: EmotionCreateDTO) => {
  try {
    if (__DEV__) console.log('🔄 감정 기록 중:', data);
    const response = await apiClient.post('/emotions', data);
    
    // 201 상태코드면 성공으로 처리 (백엔드 응답 구조와 관계없이)
    if (response.status === 201 || response.status === 200) {
      if (__DEV__) console.log('✅ 감정 기록 성공');
      return response;
    }
    
    // status 필드가 있는 경우도 처리
    if (response.data && response.data.status === 'success') {
      if (__DEV__) console.log('✅ 감정 기록 성공');
      return response;
    }
    
    // 기본적으로 성공으로 처리 (HTTP 상태코드가 2xx인 경우)
    if (__DEV__) console.log('✅ 감정 기록 성공 (기본 처리)');
    return response;
    
  } catch (error) {
    if (__DEV__) console.error('❌ 감정 기록 오류:', error);
    throw error;
  }
},
  
  // 단일 감정 로그 기록 (백엔드 /api/emotions/log)
logEmotion: async (emotionId: number, note?: string, logDate?: string) => {
  try {
    if (__DEV__) console.log('🔄 단일 감정 로그 저장 중:', { emotionId, note });
    
    // /emotions/log 대신 /emotions 엔드포인트 사용
    const response = await apiClient.post('/emotions', {
      emotion_ids: [emotionId],
      note: note
    });
    
    if (response.data.status === 'success') {
      if (__DEV__) console.log('✅ 단일 감정 로그 저장 성공');
    }
    
    return response;
  } catch (error) {
    if (__DEV__) console.error('❌ 단일 감정 로그 저장 오류:', error);
    throw error;
  }
},
  
  // 감정 통계 조회 (source 필터 지원)
  getEmotionStats: async (params?: { start_date?: string; end_date?: string; source?: 'post' | 'quick_check' }) => {
    // 중복 요청 방지 (파라미터로 캐시 키 생성)
    const cacheKey = `GET:/emotions/stats?${JSON.stringify(params || {})}`;
    return requestDeduplicator.dedupe(cacheKey, async () => {
      try {
        if (__DEV__) console.log('🔄 감정 통계 조회 중...', params);
        const response = await apiClient.get('/emotions/stats', { params });

        if (response.data.status === 'success') {
          if (__DEV__) console.log('✅ 감정 통계 조회 성공');
        }

        return response;
      } catch (error) {
        if (__DEV__) console.error('❌ 감정 통계 조회 오류:', error);
        throw error;
      }
    });
  },
  
  // 감정 트렌드 조회 (백엔드 /api/stats/trends)
  getEmotionTrends: async (params?: { 
    start_date?: string; 
    end_date?: string; 
    type?: 'day' | 'week' | 'month' | 'monthly' 
  }) => {
    try {
      if (__DEV__) console.log('🔄 감정 트렌드 조회 중...', params);
      const response = await apiClient.get('/stats/trends', { params });
      
      if (response.data.status === 'success') {
        if (__DEV__) console.log('✅ 감정 트렌드 조회 성공');
      }
      
      return response;
    } catch (error) {
      if (__DEV__) console.error('❌ 감정 트렌드 조회 오류:', error);
      throw error;
    }
  },
  
  // 일일 감정 체크
  getDailyEmotionCheck: async () => {
    try {
      if (__DEV__) console.log('🔄 일일 감정 체크 조회 중...');
      const response = await apiClient.get('/emotions/daily-check');
      
      if (response.data.status === 'success') {
        if (__DEV__) console.log('✅ 일일 감정 체크 조회 성공');
      }
      
      return response;
    } catch (error) {
      if (__DEV__) console.error('❌ 일일 감정 체크 조회 오류:', error);
      throw error;
    }
  },

  // 감정 로그 목록 조회 (백엔드 /api/emotions/logs)
  getEmotionLogs: async (
    startDate?: string,
    endDate?: string,
    limit: number = 50
  ) => {
    try {
      if (__DEV__) console.log('🔄 감정 로그 목록 조회 중...');
      
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('limit', limit.toString());
      
      const response = await apiClient.get(`/emotions/logs?${params}`);
      
      if (response.data.status === 'success') {
        if (__DEV__) console.log(`✅ 감정 로그 조회 성공: ${response.data.data?.length || 0}개`);
      }
      
      return response;
    } catch (error) {
      if (__DEV__) console.error('❌ 감정 로그 조회 오류:', error);
      throw error;
    }
  },

  // 오늘의 감정 로그 조회
  getTodayEmotions: async () => {
    const today = new Date().toISOString().split('T')[0];
    return emotionService.getEmotionLogs(today, today);
  },

  // 백엔드 API와 매칭하는 통계 조회 (백엔드 /api/stats/emotions)
  getStats: async (period: 'week' | 'month' | 'year' = 'week') => {
    try {
      if (__DEV__) console.log(`🔄 감정 통계 조회 중 (${period})...`);
      const response = await apiClient.get(`/stats/emotions?period=${period}`);
      
      if (response.data.status === 'success') {
        if (__DEV__) console.log(`✅ 감정 통계 조회 성공`);
      }
      
      return response;
    } catch (error) {
      if (__DEV__) console.error('❌ 감정 통계 조회 오류:', error);
      throw error;
    }
  },

  // 특정 날짜의 감정 기록 삭제 (백엔드 /api/emotions/logs)
  deleteEmotionLogsByDate: async (date: string) => {
    try {
      if (__DEV__) console.log('🗑️ 감정 기록 삭제 중:', date);
      const response = await apiClient.delete(`/emotions/logs?date=${date}`);
      
      if (response.data.status === 'success' || response.status === 200 || response.status === 204) {
        if (__DEV__) console.log('✅ 감정 기록 삭제 성공:', date);
      }
      
      return response;
    } catch (error) {
      if (__DEV__) console.error('❌ 감정 기록 삭제 오류:', error);
      throw error;
    }
  },

  // 오늘의 감정 기록 삭제
  deleteTodayEmotions: async () => {
    const today = new Date().toISOString().split('T')[0];
    return emotionService.deleteEmotionLogsByDate(today);
  },

  // 감정 기록 완전 동기화 (기존 기록 삭제 후 게시물 기반으로 재구성)
  syncEmotionsWithPosts: async () => {
    try {
      if (__DEV__) console.log('🔄 감정 기록 동기화 시작...');
      const response = await apiClient.post('/emotions/sync');
      
      if (response.data.status === 'success') {
        if (__DEV__) console.log('✅ 감정 기록 동기화 성공');
      }
      
      return response;
    } catch (error) {
      if (__DEV__) console.error('❌ 감정 기록 동기화 오류:', error);
      throw error;
    }
  }
};

export default emotionService;