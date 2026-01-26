// src/services/api/searchService.ts

import apiClient from './client';
import { 
  SearchParams, 
  SearchResponse, 
  SearchAutoComplete,
  AdvancedSearchFilters,
  SearchHistory 
} from '../../types/search';

const searchService = {
  // 통합 검색
  search: async (params: SearchParams): Promise<SearchResponse> => {
    try {
      const response = await apiClient.get('/search', { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('통합 검색 오류:', error);
      throw error;
    }
  },

  // 게시물 검색
  searchPosts: async (params: SearchParams): Promise<SearchResponse> => {
    try {
      const response = await apiClient.get('/search/posts', { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('게시물 검색 오류:', error);
      throw error;
    }
  },

  // 사용자 검색
  searchUsers: async (params: SearchParams): Promise<SearchResponse> => {
    try {
      const response = await apiClient.get('/search/users', { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('사용자 검색 오류:', error);
      throw error;
    }
  },

  // 태그 검색
  searchTags: async (params: SearchParams): Promise<SearchResponse> => {
    try {
      const response = await apiClient.get('/search/tags', { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('태그 검색 오류:', error);
      throw error;
    }
  },

  // 자동완성
  getAutoComplete: async (query: string, type?: 'posts' | 'users' | 'tags'): Promise<SearchAutoComplete> => {
    try {
      const params = { q: query, type };
      const response = await apiClient.get('/search/autocomplete', { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('자동완성 검색 오류:', error);
      throw error;
    }
  },

  // 고급 검색
  advancedSearch: async (
    query: string, 
    filters: AdvancedSearchFilters
  ): Promise<SearchResponse> => {
    try {
      const params = { q: query, ...filters };
      const response = await apiClient.get('/search/advanced', { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('고급 검색 오류:', error);
      throw error;
    }
  },

  // 인기 검색어
  getPopularQueries: async (limit: number = 10): Promise<string[]> => {
    try {
      const response = await apiClient.get('/search/popular', { 
        params: { limit } 
      });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('인기 검색어 조회 오류:', error);
      throw error;
    }
  },

  // 최근 검색어 (AsyncStorage 기반 - React Native 호환)
  getRecentSearches: async (): Promise<string[]> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const recent = await AsyncStorage.getItem('recent_searches');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      if (__DEV__) console.error('최근 검색어 조회 오류:', error);
      return [];
    }
  },

  // 최근 검색어 저장
  saveRecentSearch: async (query: string): Promise<void> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const recent = await searchService.getRecentSearches();
      const filtered = recent.filter(item => item !== query);
      const updated = [query, ...filtered].slice(0, 10); // 최대 10개
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (error) {
      if (__DEV__) console.error('최근 검색어 저장 오류:', error);
    }
  },

  // 최근 검색어 삭제
  removeRecentSearch: async (query: string): Promise<void> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const recent = await searchService.getRecentSearches();
      const filtered = recent.filter(item => item !== query);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(filtered));
    } catch (error) {
      if (__DEV__) console.error('최근 검색어 삭제 오류:', error);
    }
  },

  // 최근 검색어 전체 삭제
  clearRecentSearches: async (): Promise<void> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('recent_searches');
    } catch (error) {
      if (__DEV__) console.error('최근 검색어 전체 삭제 오류:', error);
    }
  },

  // 검색 결과 저장 (즐겨찾기)
  saveSearchResult: async (query: string, filters?: any): Promise<void> => {
    try {
      const data = { query, filters };
      await apiClient.post('/search/saved', data);
    } catch (error) {
      if (__DEV__) console.error('검색 결과 저장 오류:', error);
      throw error;
    }
  },

  // 저장된 검색 결과 조회
  getSavedSearches: async (): Promise<SearchHistory[]> => {
    try {
      const response = await apiClient.get('/search/saved');
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('저장된 검색 조회 오류:', error);
      throw error;
    }
  },

  // 저장된 검색 삭제
  removeSavedSearch: async (searchId: string): Promise<void> => {
    try {
      await apiClient.delete(`/search/saved/${searchId}`);
    } catch (error) {
      if (__DEV__) console.error('저장된 검색 삭제 오류:', error);
      throw error;
    }
  },

  // 검색 통계
  getSearchStats: async (): Promise<{
    total_searches: number;
    popular_queries: string[];
    trending_tags: string[];
    search_trends: Array<{ date: string; count: number }>;
  }> => {
    try {
      const response = await apiClient.get('/search/stats');
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('검색 통계 조회 오류:', error);
      throw error;
    }
  }
};

export default searchService;