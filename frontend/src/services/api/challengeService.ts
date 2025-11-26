// src/services/api/challengeService.ts

import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 향상된 메모리 캐시 구현 (인스타그램 수준)
const cache = new Map<string, { data: any; timestamp: number; ttl: number; hits: number }>();

// 캐시 TTL 전략 (데이터 타입별 차등 적용)
const CACHE_TTL = {
  LIST: 2 * 60 * 1000,        // 목록: 2분 (자주 변경)
  DETAIL: 5 * 60 * 1000,      // 상세: 5분 (중간 변경)
  STATIC: 30 * 60 * 1000,     // 정적: 30분 (거의 변경 안됨)
  USER: 10 * 60 * 1000,       // 사용자: 10분 (가끔 변경)
};

const getCachedData = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    // 캐시 히트 카운트 증가
    cached.hits++;
    console.log(`📋 캐시 히트 (${cached.hits}회): ${key}`);
    return cached.data;
  }
  if (cached) {
    // TTL 만료된 캐시 삭제
    cache.delete(key);
    console.log(`⏰ 캐시 만료: ${key}`);
  }
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = CACHE_TTL.LIST): void => {
  cache.set(key, { data, timestamp: Date.now(), ttl, hits: 0 });
  console.log(`💾 캐시 저장 (TTL: ${ttl / 1000}초): ${key}`);

  // 캐시 크기 제한 (최대 100개)
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
    console.log(`🗑️ 캐시 LRU 삭제: ${firstKey}`);
  }
};

const clearCacheByPattern = (pattern: string): void => {
  const keysToDelete: string[] = [];
  cache.forEach((_, key) => {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`🗑️ 캐시 패턴 클리어: ${keysToDelete.length}개 항목 삭제 (${pattern})`);
};

// 캐시 통계 조회
const getCacheStats = () => {
  let totalHits = 0;
  cache.forEach(item => {
    totalHits += item.hits;
  });
  return {
    size: cache.size,
    totalHits,
    keys: Array.from(cache.keys())
  };
};


export interface ChallengeCreateData {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_public?: boolean;
  max_participants?: number;
  tags?: string[];
  image_urls?: string[];
}

export interface ChallengeProgressData {
  emotion_id: number;
  progress_note?: string;
}

export interface UpdateChallengeEmotionData {
  emotion_id?: number;
  progress_note?: string;
}

export interface ChallengeUpdateData {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
  max_participants?: number;
  tags?: string[];
  image_urls?: string[];
}

// 개선된 재시도 로직
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 API 시도 ${attempt}/${maxRetries} - 시작 시간: ${new Date().toLocaleTimeString()}`);
      const result = await fn();
      
      if (attempt > 1) {
        console.log(`✨ API 성공 (${attempt}번째 시도에서)`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // 더 상세한 오류 분류 및 로깅
      const isRetryableError = error.code === 'NETWORK_ERROR' || 
                              error.code === 'ECONNABORTED' ||
                              error.message?.toLowerCase().includes('network') ||
                              error.message?.toLowerCase().includes('timeout') ||
                              (error.response?.status >= 500 && error.response?.status < 600);
                              
      const errorInfo = {
        attempt,
        maxRetries,
        code: error.code,
        message: error.message,
        hasResponse: !!error.response,
        status: error.response?.status,
        isRetryable: isRetryableError,
        timestamp: new Date().toISOString()
      };
      
      console.log('🌐 네트워크 오류 상세:', errorInfo);
      
      // 재시도 불가능한 오류인 경우 즉시 실패
      if (!isRetryableError && error.response) {
        console.log('❌ 재시도 불가능한 오류 (즉시 실패):', error.response.status);
        throw error;
      }
      
      if (attempt === maxRetries) {
        // 마지막 시도에서 실패하면 오프라인 데이터 제공
        const isNetworkError = !error.response || 
                              error.code === 'NETWORK_ERROR' || 
                              error.code === 'ECONNABORTED' ||
                              error.message?.toLowerCase().includes('network') ||
                              error.message?.toLowerCase().includes('timeout');
        
        if (isNetworkError) {
          console.log('📱 오프라인 모드로 전환');
          throw { ...error, isOffline: true };
        }
      } else {
        // 재시도 전 대기 (점진적 증가)
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`🔄 재시도 ${attempt}/${maxRetries} (${delay}ms 후)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// 향상된 오프라인 데이터 생성
const createOfflineData = (type: 'challenges' | 'best' | 'participations') => {
  const baseResponse = {
    data: {
      status: 'success',
      data: [],
      message: '오프라인 모드입니다. 백엔드 서버를 확인하고 새로고침하세요.'
    },
    status: 200,
    isOffline: true
  };
  
  if (type === 'challenges') {
    baseResponse.data.data = [
      {
        challenge_id: -1,
        title: '📵 30일 감정 기록 챌린지',
        description: '매일 내 감정을 기록하고 성찰하는 30일 여정입니다. 네트워크 연결 후 실제 챌린지를 확인하세요.',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        participant_count: 42,
        status: 'active',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['감정관리', '마음챙김', '성장'],
        is_public: true,
      },
      {
        challenge_id: -2,
        title: '🌱 긍정적 사고 7일 챌린지',
        description: '하루에 하나씩 긍정적인 생각을 기록하고 실천해보세요.',
        start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        participant_count: 28,
        status: 'upcoming',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['긍정', '성장', '습관'],
        is_public: true,
      }
    ];
  } else if (type === 'best') {
    baseResponse.data.data = [
      {
        challenge_id: -1,
        title: '📵 30일 감정 기록 챌린지',
        description: '가장 인기 있는 챌린지입니다.',
        participant_count: 42,
        ranking: 1
      }
    ];
  }
  
  return baseResponse;
};

const challengeService = {
  createChallenge: async (data: ChallengeCreateData) => {
    return await withRetry(() => apiClient.post('/challenges', data));
  },
  
  getChallenges: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'upcoming';
    sort_by?: 'start_date' | 'participant_count' | 'created_at' | 'latest' | 'popular' | 'ending_soon';
    sortBy?: 'latest' | 'popular' | 'ending_soon';
    order?: 'asc' | 'desc';
    query?: string;
    category?: string;
    showCompleted?: boolean;
    tags?: string[];
    weeklyHot?: boolean;
  }) => {
    // 검색어 트림 처리 (URLSearchParams가 자동으로 인코딩 처리)
    const processedParams = { ...params };
    if (processedParams.query) {
      processedParams.query = processedParams.query.trim();
      console.log('🔍 검색어 트림 후:', processedParams.query);
    }

    const cacheKey = `challenges_${JSON.stringify(processedParams || {})}`;

    // 캐시된 데이터 확인
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      console.log('🔍 최종 API 요청 파라미터:', processedParams);

      // URLSearchParams를 사용하여 한글 인코딩 확실히 처리
      const searchParams = new URLSearchParams();
      Object.entries(processedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // tags 배열은 여러 번 추가
          if (key === 'tags' && Array.isArray(value)) {
            value.forEach(tag => searchParams.append('tags', String(tag)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });

      const urlWithParams = `/challenges?${searchParams.toString()}`;
      console.log('🔍 생성된 URL:', urlWithParams);

      const result = await withRetry(() => apiClient.get(urlWithParams));
      // 성공시 캐시에 저장 (목록은 2분 TTL)
      setCachedData(cacheKey, result, CACHE_TTL.LIST);
      return result;
    } catch (error: any) {
      if (error.isOffline) {
        console.log('📱 오프라인 모드: 챌린지 샘플 데이터 반환');
        const offlineData = createOfflineData('challenges');
        // 오프라인 데이터도 캐시에 저장 (LIST TTL)
        setCachedData(cacheKey, offlineData, CACHE_TTL.LIST);
        return offlineData;
      }
      throw error;
    }
  },
  
  // 베스트 챌린지 조회 추가
  getBestChallenges: async (params?: { limit?: number }) => {
    try {
      return await withRetry(() => apiClient.get('/challenges/best', { params }));
    } catch (error: any) {
      if (error.isOffline) {
        console.log('📱 오프라인 모드: 베스트 챌린지 빈 데이터 반환');
        return createOfflineData('best');
      }
      throw error;
    }
  },
  
  // 내가 생성한 챌린지 조회 추가
  getMyChallenges: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'upcoming';
  }) => {
    try {
      // 비로그인 사용자 체크
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        if (__DEV__) console.log('⚠️ 비로그인 사용자 - getMyChallenges API 호출 차단');
        return { data: [] };
      }

      return await withRetry(() => apiClient.get('/challenges/my-created', { params }));
    } catch (error: any) {
      if (error.isOffline) {
        console.log('📱 오프라인 모드: 내 챌린지 빈 데이터 반환');
        return createOfflineData('challenges');
      }
      throw error;
    }
  },
  
  // 내가 참여한 챌린지 조회 추가
  getMyParticipations: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'upcoming';
  }) => {
    try {
      // 비로그인 사용자 체크
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        if (__DEV__) console.log('⚠️ 비로그인 사용자 - getMyParticipations API 호출 차단');
        return { data: [] };
      }

      return await withRetry(() => apiClient.get('/challenges/my-participations', { params }));
    } catch (error: any) {
      if (error.isOffline) {
        console.log('📱 오프라인 모드: 참여 챌린지 빈 데이터 반환');
        return createOfflineData('participations');
      }
      throw error;
    }
  },
  
  getChallengeDetails: async (challengeId: number) => {
    const cacheKey = `challenge_detail_${challengeId}`;

    // 캐시 확인
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const result = await withRetry(() => apiClient.get(`/challenges/${challengeId}`));
      // 상세 정보는 5분 TTL
      setCachedData(cacheKey, result, CACHE_TTL.DETAIL);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  // 챌린지 수정 추가
  updateChallenge: async (challengeId: number, data: ChallengeUpdateData) => {
    return await apiClient.put(`/challenges/${challengeId}`, data);
  },
  
  // 챌린지 삭제 추가
  deleteChallenge: async (challengeId: number) => {
    return await apiClient.delete(`/challenges/${challengeId}`);
  },
  
  participateInChallenge: async (challengeId: number) => {
    return await withRetry(() => apiClient.post(`/challenges/${challengeId}/participate`));
  },
  
  leaveChallenge: async (challengeId: number) => {
    return await withRetry(() => apiClient.delete(`/challenges/${challengeId}/participate`));
  },
  
  updateChallengeProgress: async (challengeId: number, data: ChallengeProgressData) => {
    return await withRetry(() => apiClient.post(`/challenges/${challengeId}/progress`, data));
  },
  
  // 챌린지 통계 조회 추가
  getChallengeStats: async (challengeId: number) => {
    return await apiClient.get(`/challenges/${challengeId}/stats`);
  },
  
  // 감정 기록 조회 추가
  getEmotionLogs: async (challengeId: number, params?: {
    start_date?: string;
    end_date?: string;
    user_id?: number;
  }) => {
    return await apiClient.get(`/challenges/${challengeId}/emotions`, { params });
  },
  // 감정 기록 수정
  updateEmotionRecord: async (emotionRecordId: number, data: { emotion_id: number; progress_note?: string }) => {
    return await withRetry(() => apiClient.put(`/challenges/challenge-emotions/${emotionRecordId}`, data));
  },

  // 감정 기록 삭제
  deleteEmotionRecord: async (emotionRecordId: number) => {
    console.log('🗑️ 감정 기록 삭제 요청:', emotionRecordId);
    console.log('🗑️ 요청 URL:', `/challenges/challenge-emotions/${emotionRecordId}`);

    try {
      const response = await withRetry(() => apiClient.delete(`/challenges/challenge-emotions/${emotionRecordId}`));
      console.log('✅ 감정 기록 삭제 성공:', response);
      return response;
    } catch (error: any) {
      console.error('❌ 감정 기록 삭제 실패:', error);
      console.error('❌ 응답 데이터:', error.response?.data);
      console.error('❌ 응답 상태:', error.response?.status);
      throw error;
    }
  },

// 캐시 관리 함수들
clearCache: () => {
  cache.clear();
  console.log('🗑️ 챌린지 캐시가 모두 삭제되었습니다');
},

clearCacheByPattern: (pattern: string) => {
  const keysToDelete = Array.from(cache.keys()).filter(key => key.includes(pattern));
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`🗑️ 패턴 "${pattern}"과 일치하는 캐시 ${keysToDelete.length}개가 삭제되었습니다`);
},

// 네트워크 상태 체크 함수
checkNetworkStatus: async (): Promise<boolean> => {
  try {
    await withRetry(() => apiClient.get('/challenges?limit=1'), 1);
    return true;
  } catch (error) {
    console.log('🌐 네트워크 상태 확인: 오프라인');
    return false;
  }
},

// 챌린지 좋아요 토글
toggleChallengeLike: async (challengeId: number) => {
  return await withRetry(() => apiClient.post(`/challenges/${challengeId}/like`));
},

  clearCache: () => {
    cache.clear();
    console.log('🗑️ 전체 캐시 클리어');
  },
  clearCacheByPattern,
  getCacheStats,

};
export default challengeService;