// src/services/api/reactionService.ts
import apiClient from './client';

export interface ReactionType {
  reaction_type_id: number;
  name: string;
  icon: string;
  emoji: string;
  color: string;
}

export interface ReactionStats {
  reaction_type_id: number;
  name: string;
  icon: string;
  emoji: string;
  color: string;
  count: number;
  userReacted: boolean;
}

export interface PostReactions {
  post_id: number;
  total_reactions: number;
  reactions: ReactionStats[];
}

const reactionService = {
  // 리액션 타입 목록 조회
  getReactionTypes: async () => {
    try {
      console.log('🎭 리액션 타입 목록 조회 요청');
      const response = await apiClient.get('/reactions/types');
      console.log('🎭 리액션 타입 목록 조회 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 리액션 타입 목록 조회 오류:', error);
      console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // My Day 게시물에 리액션 추가/제거 (토글)
  toggleMyDayReaction: async (postId: number, reactionTypeId: number) => {
    try {
      console.log('👍 MyDay 리액션 토글 요청:', { postId, reactionTypeId });
      const response = await apiClient.post(`/reactions/my-day/${postId}`, {
        reaction_type_id: reactionTypeId
      });
      console.log('👍 MyDay 리액션 토글 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ MyDay 리액션 토글 오류:', error);
      console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // My Day 게시물의 리액션 통계 조회
  getMyDayReactions: async (postId: number) => {
    try {
      console.log('📊 MyDay 리액션 통계 조회 요청:', postId);
      const response = await apiClient.get(`/reactions/my-day/${postId}`);
      console.log('📊 MyDay 리액션 통계 조회 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ MyDay 리액션 통계 조회 오류:', error);
      console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // Someone Day 게시물에 리액션 추가/제거 (토글)
  toggleSomeoneDayReaction: async (postId: number, reactionTypeId: number) => {
    try {
      console.log('👍 SomeoneDay 리액션 토글 요청:', { postId, reactionTypeId });
      const response = await apiClient.post(`/reactions/someone-day/${postId}`, {
        reaction_type_id: reactionTypeId
      });
      console.log('👍 SomeoneDay 리액션 토글 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ SomeoneDay 리액션 토글 오류:', error);
      console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // Someone Day 게시물의 리액션 통계 조회
  getSomeoneDayReactions: async (postId: number) => {
    try {
      console.log('📊 SomeoneDay 리액션 통계 조회 요청:', postId);
      const response = await apiClient.get(`/reactions/someone-day/${postId}`);
      console.log('📊 SomeoneDay 리액션 통계 조회 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ SomeoneDay 리액션 통계 조회 오류:', error);
      console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  }
};

export default reactionService;
