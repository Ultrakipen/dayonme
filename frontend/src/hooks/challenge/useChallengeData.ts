import { useState, useCallback } from 'react';
import challengeService from '../../services/api/challengeService';
import { Challenge } from '../../types/challengeTypes';

interface UseChallengeDataReturn {
  challenges: Challenge[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadChallenges: (page?: number, isRefresh?: boolean) => Promise<void>;
  refresh: () => void;
}

export const useChallengeData = (): UseChallengeDataReturn => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChallenges = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (page === 1 && !isRefresh) {
        setLoading(true);
      }
      if (isRefresh) {
        setRefreshing(true);
      }

      const response = await challengeService.getChallenges({ page, limit: 10 });

      if (response?.data) {
        const newChallenges = Array.isArray(response.data) ? response.data : (response.data.data || []);

        if (page === 1) {
          setChallenges(newChallenges);
        } else {
          setChallenges(prev => [...prev, ...newChallenges]);
        }
      }

      setError(null);
    } catch (err) {
      if (__DEV__) console.error('챌린지 로드 실패:', err);
      setError('챌린지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    loadChallenges(1, true);
  }, [loadChallenges]);

  return {
    challenges,
    loading,
    refreshing,
    error,
    loadChallenges,
    refresh,
  };
};
