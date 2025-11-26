// src/hooks/HomeScreen/useWeeklyEmotions.ts
import { useState, useEffect, useCallback } from 'react';
import emotionService from '../../services/api/emotionService';
import { devLog } from '../../utils/security';

type WeeklyEmotion = {
  date: string;
  emotions: Array<{
    name: string;
    icon: string;
    color: string;
    count: number;
  }>;
};

/**
 * 주간 감정 데이터 관리 hook (단순 버전)
 *
 * Note: hasPostedToday, todayPost, checkTodayPost는 HomeScreen에서 별도 관리
 * (복잡한 캐싱 로직 때문에 hook 분리 불가)
 */
export const useWeeklyEmotions = (userId?: number) => {
  const [weeklyEmotions, setWeeklyEmotions] = useState<WeeklyEmotion[]>([]);

  // 주간 감정 데이터 로드
  const loadWeeklyEmotions = useCallback(async () => {
    if (!userId) return;

    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await emotionService.getEmotionStats({
        start_date: weekAgo.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0]
      });

      setWeeklyEmotions(response?.data?.data || []);
    } catch (error) {
      devLog('주간 감정 로드 실패:', error);
      setWeeklyEmotions([]);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadWeeklyEmotions();
    }
  }, [userId]);

  return {
    weeklyEmotions,
    loadWeeklyEmotions,
  };
};

export default useWeeklyEmotions;
