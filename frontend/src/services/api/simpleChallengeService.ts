// 완전히 새로운 Simple Challenge API 서비스
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ENV } from '../../config/env';

// 기본 설정
const BASE_URL = `${ENV.API_BASE_URL}/api/simple-challenges`;
const TIMEOUT = ENV.API_TIMEOUT; // 10초 타임아웃 (모바일 네트워크 고려)

// 간단한 HTTP 클라이언트
class SimpleHttpClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch {
      return null;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log(`🌐 Simple Challenge API 요청: ${config.method} ${endpoint}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const statusMessages: {[key: number]: string} = {
          400: '잘못된 요청입니다.',
          401: '인증이 필요합니다.',
          403: '접근 권한이 없습니다.',
          404: '요청하신 정보를 찾을 수 없습니다.',
          500: '서버 오류가 발생했습니다.',
          503: '서비스를 일시적으로 사용할 수 없습니다.',
        };
        const message = statusMessages[response.status] || `네트워크 오류 (${response.status})`;
        throw new Error(message);
      }

      const data = await response.json();
      console.log(`✅ Simple Challenge API 응답 성공`);
      return data;

    } catch (error: any) {
      console.error(`❌ Simple Challenge API 오류:`, error.message);
      
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다.');
      }
      
      throw error;
    }
  }

  async get(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

const client = new SimpleHttpClient();

// 인터페이스 정의
export interface SimpleChallenge {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  creator_id: number;
  status: 'active' | 'completed' | 'cancelled';
  participant_count: number;
  max_participants?: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  creator?: {
    user_id: number;
    nickname: string;
  };
}

export interface CreateChallengeData {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  max_participants?: number;
  is_public?: boolean;
}

export interface ChallengeParticipation {
  challenge_id: number;
  user_id: number;
  joined_at: string;
  status: 'active' | 'completed' | 'quit';
  progress_count: number;
  challenge?: SimpleChallenge;
}

// 오프라인 데이터 생성
const createOfflineData = (type: 'challenges' | 'best' | 'participations') => {
  const sampleChallenges: SimpleChallenge[] = [
    {
      id: -1,
      title: '📱 오프라인 모드 - 30일 감정 기록',
      description: '매일 감정을 기록하는 챌린지입니다. 네트워크 연결 후 실제 데이터를 확인하세요.',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      creator_id: 0,
      status: 'active',
      participant_count: 15,
      max_participants: 100,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: {
        user_id: 0,
        nickname: '익명'
      }
    },
    {
      id: -2,
      title: '🌟 오프라인 모드 - 긍정 마인드 7일',
      description: '7일간 긍정적인 생각을 기록하고 실천하는 챌린지입니다.',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      creator_id: 0,
      status: 'active',
      participant_count: 8,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: {
        user_id: 0,
        nickname: '익명'
      }
    }
  ];

  return {
    status: 'success',
    data: type === 'challenges' ? {
      challenges: sampleChallenges,
      totalCount: sampleChallenges.length,
      currentPage: 1,
      totalPages: 1
    } : sampleChallenges,
    isOffline: true,
    message: '오프라인 모드입니다. 네트워크 연결을 확인해주세요.'
  };
};

// Simple Challenge Service
export const simpleChallengeService = {
  // 모든 챌린지 조회
  async getChallenges(params?: { page?: number; limit?: number; status?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      
      const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await client.get(endpoint);
    } catch (error) {
      console.log('📱 오프라인 모드로 전환 - 챌린지 목록');
      return createOfflineData('challenges');
    }
  },

  // 베스트 챌린지 조회
  async getBestChallenges(limit: number = 10) {
    try {
      return await client.get(`/best?limit=${limit}`);
    } catch (error) {
      console.log('📱 오프라인 모드로 전환 - 베스트 챌린지');
      return createOfflineData('best');
    }
  },

  // 내가 참여한 챌린지 조회
  async getMyParticipations() {
    try {
      return await client.get('/my-participations');
    } catch (error) {
      console.log('📱 오프라인 모드로 전환 - 내 참여 챌린지');
      return createOfflineData('participations');
    }
  },

  // 챌린지 생성
  async createChallenge(data: CreateChallengeData) {
    try {
      return await client.post('', data);
    } catch (error) {
      throw new Error('챌린지 생성에 실패했습니다. 네트워크 연결을 확인해주세요.');
    }
  },

  // 챌린지 참여
  async joinChallenge(challengeId: number) {
    try {
      return await client.post(`/${challengeId}/join`, {});
    } catch (error) {
      throw new Error('챌린지 참여에 실패했습니다. 네트워크 연결을 확인해주세요.');
    }
  },

  // 챌린지 상세 조회
  async getChallengeDetail(challengeId: number) {
    try {
      return await client.get(`/${challengeId}`);
    } catch (error) {
      throw new Error('챌린지 정보를 불러올 수 없습니다.');
    }
  },

  // 감정 기록 추가
  async addEmotionLog(challengeId: number, data: { emotion_id: number; note?: string; log_date?: string }) {
    try {
      return await client.post(`/${challengeId}/emotions`, data);
    } catch (error) {
      throw new Error('감정 기록에 실패했습니다.');
    }
  },

  // 네트워크 상태 확인
  async checkNetworkStatus(): Promise<boolean> {
    try {
      await client.get('?limit=1');
      return true;
    } catch {
      return false;
    }
  }
};

export default simpleChallengeService;