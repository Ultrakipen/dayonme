/**
 * ReviewScreen용 React Query 훅
 * 대규모 사용자 대비 최적화: 캐싱, 배치 호출, 에러 처리
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import reviewService from '../services/api/reviewService';

// 쿼리 키 상수
export const REVIEW_QUERY_KEYS = {
  batch: (period: string) => ['review', 'batch', period],
  summary: (period: string) => ['review', 'summary', period],
  communityTemperature: ['review', 'communityTemperature'],
  personalTemperature: (period: string) => ['review', 'personalTemperature', period],
  streak: ['review', 'streak'],
  badges: ['review', 'badges'],
  realTimeStats: ['review', 'realTimeStats'],
  glimmeringMoments: ['review', 'glimmeringMoments'],
  nightFragments: ['review', 'nightFragments'],
  dailyComfortQuote: ['review', 'dailyComfortQuote'],
  emotionEcho: ['review', 'emotionEcho'],
  emotionColorPalette: ['review', 'emotionColorPalette'],
};

/**
 * 배치 데이터 조회 (권장 - 트래픽 최적화)
 * 모든 섹션 데이터를 한 번에 가져옴
 */
export const useReviewBatchData = (period: 'week' | 'month' | 'year' = 'week') => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.batch(period),
    queryFn: () => reviewService.getBatchData(period),
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * 요약 데이터 조회
 */
export const useReviewSummary = (period: 'week' | 'month' | 'year' = 'week') => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.summary(period),
    queryFn: () => reviewService.getSummary(period),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * 커뮤니티 온도 조회
 */
export const useCommunityTemperature = () => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.communityTemperature,
    queryFn: () => reviewService.getCommunityTemperature(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
  });
};

/**
 * 개인 온도 조회
 */
export const usePersonalTemperature = (period: 'week' | 'month' | 'year' = 'week') => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.personalTemperature(period),
    queryFn: () => reviewService.getPersonalTemperature(period),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * 스트릭 조회
 */
export const useUserStreak = () => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.streak,
    queryFn: () => reviewService.getUserStreak(),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * 배지 조회
 */
export const useUserBadges = () => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.badges,
    queryFn: () => reviewService.getUserBadges(),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * 실시간 통계 조회
 */
export const useRealTimeStats = () => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.realTimeStats,
    queryFn: () => reviewService.getRealTimeStats(),
    staleTime: 1 * 60 * 1000, // 1분
    refetchOnWindowFocus: false,
    refetchInterval: 1 * 60 * 1000, // 1분마다 갱신
  });
};

/**
 * 밤의 조각들 조회
 */
export const useNightFragments = (limit: number = 5) => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.nightFragments,
    queryFn: () => reviewService.getNightFragments(limit),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * 위로의 한 줄 조회
 */
export const useDailyComfortQuote = () => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.dailyComfortQuote,
    queryFn: () => reviewService.getDailyComfortQuote(),
    staleTime: 30 * 60 * 1000, // 30분
    refetchOnWindowFocus: false,
  });
};

/**
 * 감정 공명 조회
 */
export const useEmotionEcho = () => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.emotionEcho,
    queryFn: () => reviewService.getEmotionEcho(),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * 감정 색상 팔레트 조회
 */
export const useEmotionColorPalette = () => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.emotionColorPalette,
    queryFn: () => reviewService.getEmotionColorPalette(),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * 캐시 무효화 훅
 */
export const useInvalidateReviewData = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['review'] });
  };

  const invalidateBatch = (period: string) => {
    queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEYS.batch(period) });
  };

  const invalidateSummary = (period: string) => {
    queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEYS.summary(period) });
  };

  return { invalidateAll, invalidateBatch, invalidateSummary };
};
