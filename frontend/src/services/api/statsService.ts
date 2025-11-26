// services/api/statsService.ts
import client from './client';
import { AxiosInstance, AxiosResponse } from 'axios';

interface StatsServiceType {
  client: AxiosInstance;
  getUserStats: () => Promise<AxiosResponse<any>>;
  getEmotionTrends: (options?: {
    start_date?: string;
    end_date?: string;
    type?: 'daily' | 'weekly' | 'monthly';
  }) => Promise<AxiosResponse<any>>;
  getWeeklyTrends: (options?: {
    start_date?: string;
    end_date?: string;
  }) => Promise<AxiosResponse<any>>;
  getMonthlyTrends: (options?: {
    start_date?: string;
    end_date?: string;
  }) => Promise<AxiosResponse<any>>;
  getEmotionStats: (emotionId: number, period?: 'week' | 'month' | 'year') => Promise<AxiosResponse<any>>;
  getActivitySummary: (period?: 'week' | 'month' | 'year') => Promise<AxiosResponse<any>>;
}

/**
 * 사용자 통계 API 서비스
 */
const statsService: StatsServiceType = {
  client, // 테스트를 위해 client 객체 노출

  /**
   * 사용자 통계 조회
   * @returns 사용자 통계 정보
   */
  getUserStats: async () => {
    try {
      const response = await statsService.client.get('/stats');
      return response;
    } catch (error) {
      if (error instanceof Error && error.message === '통계 정보 조회에 실패했습니다') {
        throw error;
      }
      throw new Error('통계 정보 조회에 실패했습니다');
    }
  },

  /**
   * 감정 트렌드 조회
   * @param options 옵션 (시작날짜, 종료날짜, 트렌드 타입)
   * @returns 감정 트렌드 데이터
   */
  getEmotionTrends: async (options?: {
    start_date?: string;
    end_date?: string;
    type?: 'daily' | 'weekly' | 'monthly';
  }) => {
    try {
      const params = new URLSearchParams();
      
      if (options?.start_date) {
        params.append('start_date', options.start_date);
      }
      
      if (options?.end_date) {
        params.append('end_date', options.end_date);
      }
      
      if (options?.type) {
        params.append('type', options.type);
      }
      
      const response = await statsService.client.get('/stats/trends', { params });
      return response;
    } catch (error) {
      throw new Error('감정 트렌드 조회에 실패했습니다');
    }
  },

  /**
   * 주간 감정 트렌드 조회
   * @param options 옵션 (시작날짜, 종료날짜)
   * @returns 주간 감정 트렌드 데이터
   */
  getWeeklyTrends: async (options?: {
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      
      if (options?.start_date) {
        params.append('start_date', options.start_date);
      }
      
      if (options?.end_date) {
        params.append('end_date', options.end_date);
      }
      
      const response = await statsService.client.get('/stats/weekly', { params });
      return response;
    } catch (error) {
      throw new Error('주간 트렌드 조회에 실패했습니다');
    }
  },

  /**
   * 월간 감정 트렌드 조회
   * @param options 옵션 (시작날짜, 종료날짜)
   * @returns 월간 감정 트렌드 데이터
   */
  getMonthlyTrends: async (options?: {
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      
      if (options?.start_date) {
        params.append('start_date', options.start_date);
      }
      
      if (options?.end_date) {
        params.append('end_date', options.end_date);
      }
      
      const response = await statsService.client.get('/stats/monthly', { params });
      return response;
    } catch (error) {
      throw new Error('월간 트렌드 조회에 실패했습니다');
    }
  },
  
  /**
   * 감정별 통계 조회
   * @param emotionId 감정 ID
   * @param period 기간 (주간, 월간, 연간)
   * @returns 감정별 통계 데이터
   */
  getEmotionStats: async (emotionId: number, period: 'week' | 'month' | 'year' = 'month') => {
    try {
      const response = await statsService.client.get(`/stats/emotions/${emotionId}`, {
        params: { period }
      });
      return response;
    } catch (error) {
      throw new Error('감정별 통계 조회에 실패했습니다');
    }
  },
  
  /**
   * 활동 요약 통계 조회
   * @param period 기간 (주간, 월간, 연간)
   * @returns 활동 요약 통계 데이터
   */
  getActivitySummary: async (period: 'week' | 'month' | 'year' = 'month') => {
    try {
      const response = await statsService.client.get('/stats/activity', {
        params: { period }
      });
      return response;
    } catch (error) {
      throw new Error('활동 요약 조회에 실패했습니다');
    }
  }
};

export default statsService;