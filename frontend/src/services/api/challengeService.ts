// src/services/api/challengeService.ts
// 상업용 앱 수준 최적화 - 사용자 증가 대비 캐시/재시도, API 완성

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
  EMOTIONS: 3 * 60 * 1000,    // 감정: 3분 (자주 변경)
};

// 최대 캐시 크기 (사용자 증가 대비)
const MAX_CACHE_SIZE = 150;

const getCachedData = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    // 캐시 히트 카운트 증가
    cached.hits++;
    if (__DEV__) console.log(`📋 캐시 히트 (${cached.hits}회): ${key}`);
    return cached.data;
  }
  if (cached) {
    // TTL 만료된 캐시 삭제
    cache.delete(key);
    if (__DEV__) console.log(`⏰ 캐시 만료: ${key}`);
  }
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = CACHE_TTL.LIST): void => {
  cache.set(key, { data, timestamp: Date.now(), ttl, hits: 0 });
  if (__DEV__) console.log(`💾 캐시 저장 (TTL: ${ttl / 1000}초): ${key}`);

  // 캐시 크기 제한 (LRU 정책)
  if (cache.size > MAX_CACHE_SIZE) {
    // 가장 오래되고 적게 사용된 항목 삭제
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let lowestHits = Infinity;

    cache.forEach((value, key) => {
      if (value.timestamp < oldestTime ||
          (value.timestamp === oldestTime && value.hits < lowestHits)) {
        oldestTime = value.timestamp;
        lowestHits = value.hits;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      cache.delete(oldestKey);
      if (__DEV__) console.log(`🗑️ 캐시 LRU 삭제: ${oldestKey}`);
    }
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
  if (__DEV__) console.log(`🗑️ 캐시 패턴 클리어: ${keysToDelete.length}개 항목 삭제 (${pattern})`);
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

// 개선된 재시도 로직 (사용자 증가 대비 최적화)
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (__DEV__) console.log(`🔄 API 시도 ${attempt}/${maxRetries}`);
      const result = await fn();

      if (attempt > 1 && __DEV__) {
        console.log(`✨ API 성공 (${attempt}번째 시도에서)`);
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // 더 상세한 오류 분류
      const isRetryableError = error.code === 'NETWORK_ERROR' ||
                              error.code === 'ECONNABORTED' ||
                              error.message?.toLowerCase().includes('network') ||
                              error.message?.toLowerCase().includes('timeout') ||
                              (error.response?.status >= 500 && error.response?.status < 600);

      if (__DEV__) {
        console.log('🌐 네트워크 오류:', {
          attempt,
          code: error.code,
          status: error.response?.status,
          isRetryable: isRetryableError
        });
      }

      // 재시도 불가능한 오류인 경우 즉시 실패
      if (!isRetryableError && error.response) {
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
          if (__DEV__) console.log('📱 오프라인 모드로 전환');
          throw { ...error, isOffline: true };
        }
      } else {
        // 재시도 전 대기 (지수 백오프 + 지터)
        const baseDelay = 1000 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 500;
        const delay = baseDelay + jitter;
        if (__DEV__) console.log(`🔄 재시도 ${attempt}/${maxRetries} (${Math.round(delay)}ms 후)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// 향상된 오프라인 데이터 생성
const createOfflineData = (type: 'challenges' | 'best' | 'participations' | 'emotions') => {
  const baseResponse = {
    data: {
      status: 'success',
      data: [],
      message: '오프라인 모드입니다. 네트워크 연결을 확인하세요.'
    },
    status: 200,
    isOffline: true
  };

  if (type === 'challenges') {
    baseResponse.data.data = [
      {
        challenge_id: -1,
        title: '📵 30일 감정 기록 챌린지',
        description: '매일 내 감정을 기록하고 성찰하는 30일 여정입니다.',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        participant_count: 42,
        status: 'active',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['감정관리', '마음챙김', '성장'],
        is_public: true,
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
    // 검색어 트림 처리
    const processedParams = { ...params };
    if (processedParams.query) {
      processedParams.query = processedParams.query.trim();
    }

    const cacheKey = `challenges_${JSON.stringify(processedParams || {})}`;

    // 캐시된 데이터 확인
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      // URLSearchParams를 사용하여 한글 인코딩 처리
      const searchParams = new URLSearchParams();
      Object.entries(processedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'tags' && Array.isArray(value)) {
            value.forEach(tag => searchParams.append('tags', String(tag)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });

      const urlWithParams = `/challenges?${searchParams.toString()}`;
      const result = await withRetry(() => apiClient.get(urlWithParams));
      setCachedData(cacheKey, result, CACHE_TTL.LIST);
      return result;
    } catch (error: any) {
      if (error.isOffline) {
        const offlineData = createOfflineData('challenges');
        setCachedData(cacheKey, offlineData, CACHE_TTL.LIST);
        return offlineData;
      }
      throw error;
    }
  },

  // 베스트 챌린지 조회
  getBestChallenges: async (params?: { limit?: number }) => {
    try {
      return await withRetry(() => apiClient.get('/challenges/best', { params }));
    } catch (error: any) {
      if (error.isOffline) {
        return createOfflineData('best');
      }
      throw error;
    }
  },

  // 내가 생성한 챌린지 조회
  getMyChallenges: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'upcoming';
  }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return { data: [] };
      }
      return await withRetry(() => apiClient.get('/challenges/my-created', { params }));
    } catch (error: any) {
      if (error.isOffline) {
        return createOfflineData('challenges');
      }
      throw error;
    }
  },

  // 내가 참여한 챌린지 조회
  getMyParticipations: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'upcoming';
  }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return { data: [] };
      }
      return await withRetry(() => apiClient.get('/challenges/my-participations', { params }));
    } catch (error: any) {
      if (error.isOffline) {
        return createOfflineData('participations');
      }
      throw error;
    }
  },

  getChallengeDetails: async (challengeId: number, forceRefresh: boolean = false) => {
    const cacheKey = `challenge_detail_${challengeId}`;

    if (!forceRefresh) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    } else {
      clearCacheByPattern(cacheKey);
    }

    try {
      const result = await withRetry(() => apiClient.get(`/challenges/${challengeId}`));
      setCachedData(cacheKey, result, CACHE_TTL.DETAIL);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // 챌린지 수정
  updateChallenge: async (challengeId: number, data: ChallengeUpdateData) => {
    const result = await apiClient.put(`/challenges/${challengeId}`, data);
    clearCacheByPattern(`challenge_detail_${challengeId}`);
    return result;
  },

  // 챌린지 삭제
  deleteChallenge: async (challengeId: number) => {
    const result = await apiClient.delete(`/challenges/${challengeId}`);
    clearCacheByPattern('challenges');
    return result;
  },

  participateInChallenge: async (challengeId: number) => {
    const result = await withRetry(() => apiClient.post(`/challenges/${challengeId}/participate`));
    clearCacheByPattern(`challenge_detail_${challengeId}`);
    return result;
  },

  leaveChallenge: async (challengeId: number) => {
    const result = await withRetry(() => apiClient.delete(`/challenges/${challengeId}/participate`));
    clearCacheByPattern(`challenge_detail_${challengeId}`);
    return result;
  },

  updateChallengeProgress: async (challengeId: number, data: ChallengeProgressData) => {
    return await withRetry(() => apiClient.post(`/challenges/${challengeId}/progress`, data));
  },

  // 챌린지 통계 조회
  getChallengeStats: async (challengeId: number) => {
    return await apiClient.get(`/challenges/${challengeId}/stats`);
  },

  // 감정 기록 조회 (기존)
  getEmotionLogs: async (challengeId: number, params?: {
    start_date?: string;
    end_date?: string;
    user_id?: number;
  }) => {
    return await apiClient.get(`/challenges/${challengeId}/emotions`, { params });
  },

  // 챌린지 감정 캘린더용 API (신규 추가)
  getChallengeEmotions: async (challengeId: number, params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const cacheKey = `challenge_emotions_${challengeId}_${JSON.stringify(params || {})}`;

    // 캐시 확인
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const result = await withRetry(() =>
        apiClient.get(`/challenges/${challengeId}/calendar-emotions`, { params })
      );
      setCachedData(cacheKey, result, CACHE_TTL.EMOTIONS);
      return result;
    } catch (error: any) {
      if (error.isOffline || error.response?.status === 404) {
        // API 미구현 또는 오프라인 시 빈 데이터 반환
        return createOfflineData('emotions');
      }
      throw error;
    }
  },

  // 감정 기록 수정
  updateEmotionRecord: async (emotionRecordId: number, data: { emotion_id: number; progress_note?: string }) => {
    return await withRetry(() => apiClient.put(`/challenges/challenge-emotions/${emotionRecordId}`, data));
  },

  // 감정 기록 삭제
  deleteEmotionRecord: async (emotionRecordId: number) => {
    try {
      const response = await withRetry(() => apiClient.delete(`/challenges/challenge-emotions/${emotionRecordId}`));
      return response;
    } catch (error: any) {
      if (__DEV__) console.error('❌ 감정 기록 삭제 실패:', error.response?.data);
      throw error;
    }
  },

  // 챌린지 좋아요 토글
  toggleChallengeLike: async (challengeId: number) => {
    return await withRetry(() => apiClient.post(`/challenges/${challengeId}/like`));
  },

  // 캐시 전체 클리어
  clearCache: () => {
    cache.clear();
    if (__DEV__) console.log('🗑️ 챌린지 캐시 전체 클리어');
  },

  // 패턴별 캐시 클리어
  clearCacheByPattern,

  // 캐시 통계
  getCacheStats,

  // 네트워크 상태 체크
  checkNetworkStatus: async (): Promise<boolean> => {
    try {
      await withRetry(() => apiClient.get('/challenges?limit=1'), 1);
      return true;
    } catch (error) {
      return false;
    }
  },
};

export default challengeService;
