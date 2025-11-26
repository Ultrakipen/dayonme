import { useState, useMemo } from 'react';
import { Challenge } from '../../types/challengeTypes';

interface ChallengeFilters {
  query: string;
  category: string;
  sortBy: string;
  showCompleted: boolean;
  tags?: string[];
}

interface UseChallengeFiltersReturn {
  filters: ChallengeFilters;
  setFilters: React.Dispatch<React.SetStateAction<ChallengeFilters>>;
  filteredChallenges: Challenge[];
  updateFilter: (key: keyof ChallengeFilters, value: any) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: ChallengeFilters = {
  query: '',
  category: 'all',
  sortBy: 'latest',
  showCompleted: false,
  tags: undefined,
};

export const useChallengeFilters = (challenges: Challenge[]): UseChallengeFiltersReturn => {
  const [filters, setFilters] = useState<ChallengeFilters>(DEFAULT_FILTERS);

  const filteredChallenges = useMemo(() => {
    let result = [...challenges];

    // 검색어 필터
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }

    // 카테고리 필터
    if (filters.category !== 'all') {
      result = result.filter(c => c.category === filters.category);
    }

    // 완료 상태 필터
    if (!filters.showCompleted) {
      result = result.filter(c => c.status === 'active');
    }

    // 태그 필터
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(c =>
        c.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    // 정렬
    switch (filters.sortBy) {
      case 'latest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'popular':
        result.sort((a, b) => b.participant_count - a.participant_count);
        break;
      case 'ending_soon':
        result.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
        break;
    }

    return result;
  }, [challenges, filters]);

  const updateFilter = (key: keyof ChallengeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return {
    filters,
    setFilters,
    filteredChallenges,
    updateFilter,
    resetFilters,
  };
};
