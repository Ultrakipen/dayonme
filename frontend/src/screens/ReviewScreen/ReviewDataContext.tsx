/**
 * ReviewDataContext - 리뷰 화면 데이터 중앙 관리
 * 모든 섹션 컴포넌트가 이 Context에서 데이터를 공유하여 API 호출 최소화
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import reviewService from '../../services/api/reviewService';
import apiClient from '../../services/api/client';
import { useAuth } from '../../contexts/AuthContext';

// 캐시 설정
const CACHE_KEY = '@review_batch_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5분

// 타입 정의
export interface ReviewBatchData {
  // 기본 요약
  summary: {
    posts?: Array<any>;
    emotionStats?: Array<{ name: string; count: number; color: string; icon: string }>;
    heatmapData?: Array<{ date: string; count: number; level: number }>;
    insights?: {
      topEmotion: string;
      totalPosts: number;
      totalLikes: number;
      totalComments: number;
      consecutiveDays: number;
      completedChallenges: number;
      positiveRatio: number;
      mostActiveHour: number;
      mostActiveDay: string;
    };
    highlights?: Array<any>;
    userStats?: {
      my_day_post_count: number;
      my_day_like_received_count: number;
    };
    intentions?: {
      week: string;
      month: string;
      year: string;
    };
    todayActivities?: {
      posted_today: boolean;
      gave_like_today: boolean;
      wrote_comment_today: boolean;
    };
    period?: string;
    timestamp?: string;
  } | null;

  // 스트릭
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastPostDate: string | null;
  } | null;

  // 실시간 통계
  realTimeStats: {
    activeUsers: number;
  } | null;

  // AI 분석
  aiAnalysis: {
    summary: string;
    emotionTrend: 'improving' | 'stable' | 'declining';
    suggestion: string;
    keywords: string[];
    confidence: number;
  } | null;

  // 주간 목표
  weeklyGoal: {
    id?: number;
    goal: string;
    targetCount: number;
    currentCount: number;
    startDate: string;
    endDate: string;
    completed: boolean;
  } | null;

  // 일일 챌린지
  dailyChallenges: Array<{
    id: number;
    title: string;
    completed: boolean;
    progress: number;
    goal: number;
  }>;

  // 익명 Q&A 미리보기
  anonymousQA: {
    questions: Array<{
      id: number;
      question: string;
      answerCount: number;
      likeCount: number;
      isLiked?: boolean;
      isMine?: boolean;
      topAnswer?: { content: string; likeCount: number };
    }>;
    totalCount: number;
  } | null;
}

interface ReviewDataContextType {
  data: ReviewBatchData;
  loading: boolean;
  error: string | null;
  period: 'week' | 'month' | 'year';
  setPeriod: (period: 'week' | 'month' | 'year') => void;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  updateWeeklyGoal: (goal: ReviewBatchData['weeklyGoal']) => void;
  updateQALike: (questionId: number, isLiked: boolean, likeCount: number) => void;
}

const defaultData: ReviewBatchData = {
  summary: null,
  streak: null,
  realTimeStats: null,
  aiAnalysis: null,
  weeklyGoal: null,
  dailyChallenges: [
    { id: 1, title: '오늘의 감정 기록하기', completed: false, progress: 0, goal: 1 },
    { id: 2, title: '다른 사람에게 위로 보내기', completed: false, progress: 0, goal: 1 },
    { id: 3, title: '긍정적인 감정 표현하기', completed: false, progress: 0, goal: 1 },
  ],
  anonymousQA: null,
};

const ReviewDataContext = createContext<ReviewDataContextType | undefined>(undefined);

export const ReviewDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ReviewBatchData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const isFetching = useRef(false);

  // 캐시 로드
  const loadFromCache = useCallback(async (periodKey: string): Promise<ReviewBatchData | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${periodKey}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return cachedData;
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('리뷰 캐시 로드 실패:', err);
    }
    return null;
  }, []);

  // 캐시 저장
  const saveToCache = useCallback(async (periodKey: string, batchData: ReviewBatchData) => {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY}_${periodKey}`, JSON.stringify({
        data: batchData,
        timestamp: Date.now()
      }));
    } catch (err) {
      if (__DEV__) console.warn('리뷰 캐시 저장 실패:', err);
    }
  }, []);

  // 배치 데이터 로드 (모든 API를 병렬로 호출)
  const loadBatchData = useCallback(async (forceRefresh = false) => {
    if (isFetching.current) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    isFetching.current = true;

    try {
      if (!forceRefresh) {
        setLoading(true);
      }

      // 캐시 확인 (강제 새로고침이 아닌 경우)
      if (!forceRefresh) {
        const cachedData = await loadFromCache(period);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          isFetching.current = false;
          return;
        }
      }

      // 모든 API 병렬 호출
      const [
        summaryRes,
        streakRes,
        realTimeRes,
        aiAnalysisRes,
        weeklyGoalRes,
        dailyChallengesRes,
        anonymousQARes,
      ] = await Promise.allSettled([
        reviewService.getSummary(period),
        reviewService.getUserStreak(),
        reviewService.getRealTimeStats(),
        apiClient.get(`/review/ai-analysis?period=${period}`),
        apiClient.get('/review/weekly-goal'),
        apiClient.get('/review/daily-challenges'),
        apiClient.get('/review/anonymous-qa?limit=3&sort=popular'),
      ]);

      // 결과 파싱
      const newData: ReviewBatchData = { ...defaultData };

      // summary
      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
        newData.summary = summaryRes.value.data;
      }

      // streak
      if (streakRes.status === 'fulfilled' && streakRes.value?.data) {
        newData.streak = streakRes.value.data;
      }

      // realTimeStats
      if (realTimeRes.status === 'fulfilled' && realTimeRes.value?.data) {
        newData.realTimeStats = {
          activeUsers: realTimeRes.value.data.activeUsers || 0
        };
      }

      // aiAnalysis
      if (aiAnalysisRes.status === 'fulfilled' && aiAnalysisRes.value?.data?.status === 'success') {
        newData.aiAnalysis = aiAnalysisRes.value.data.data;
      }

      // weeklyGoal
      if (weeklyGoalRes.status === 'fulfilled' && weeklyGoalRes.value?.data?.status === 'success') {
        const raw = weeklyGoalRes.value.data.data;
        console.log('📊 [ReviewDataContext] weeklyGoal raw 응답:', raw);
        if (raw) {
          newData.weeklyGoal = {
            id: raw.id,
            goal: raw.goal,
            targetCount: raw.targetCount ?? raw.target_count ?? 5,
            currentCount: raw.currentCount ?? raw.current_count ?? 0,
            startDate: raw.startDate ?? raw.start_date ?? '',
            endDate: raw.endDate ?? raw.end_date ?? '',
            completed: raw.completed ?? false,
          };
          console.log('✅ [ReviewDataContext] weeklyGoal 파싱 결과:', newData.weeklyGoal);
        }
      }

      // dailyChallenges
      if (dailyChallengesRes.status === 'fulfilled' && dailyChallengesRes.value?.data?.status === 'success') {
        const challenges = dailyChallengesRes.value.data.data?.challenges;
        if (challenges && Array.isArray(challenges)) {
          newData.dailyChallenges = challenges;
        }
      }

      // anonymousQA
      if (anonymousQARes.status === 'fulfilled' && anonymousQARes.value?.data?.status === 'success') {
        newData.anonymousQA = anonymousQARes.value.data.data;
      }

      setData(newData);
      await saveToCache(period, newData);
      setError(null);
    } catch (err) {
      if (__DEV__) console.error('배치 데이터 로드 실패:', err);
      setError('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [period, isAuthenticated, loadFromCache, saveToCache]);

  // 주간 목표 업데이트 (로컬 + 캐시)
  const updateWeeklyGoal = useCallback((goal: ReviewBatchData['weeklyGoal']) => {
    setData(prev => {
      const newData = { ...prev, weeklyGoal: goal };
      saveToCache(period, newData);
      return newData;
    });
  }, [period, saveToCache]);

  // Q&A 좋아요 업데이트 (낙관적)
  const updateQALike = useCallback((questionId: number, isLiked: boolean, likeCount: number) => {
    setData(prev => {
      if (!prev.anonymousQA) return prev;
      const newQuestions = prev.anonymousQA.questions.map(q =>
        q.id === questionId ? { ...q, isLiked, likeCount } : q
      );
      return {
        ...prev,
        anonymousQA: { ...prev.anonymousQA, questions: newQuestions }
      };
    });
  }, []);

  // 기간 변경 또는 인증 상태 변경 시 데이터 로드
  useEffect(() => {
    loadBatchData();
  }, [loadBatchData]);

  const contextValue = useMemo(() => ({
    data,
    loading,
    error,
    period,
    setPeriod,
    refresh: loadBatchData,
    updateWeeklyGoal,
    updateQALike,
  }), [data, loading, error, period, loadBatchData, updateWeeklyGoal, updateQALike]);

  return (
    <ReviewDataContext.Provider value={contextValue}>
      {children}
    </ReviewDataContext.Provider>
  );
};

// Hook
export const useReviewData = () => {
  const context = useContext(ReviewDataContext);
  if (!context) {
    throw new Error('useReviewData must be used within ReviewDataProvider');
  }
  return context;
};

export default ReviewDataContext;
