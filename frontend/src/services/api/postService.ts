// src/services/api/postService.ts

import apiClient from './client';
import { Emotion } from './emotionService';

export interface CreatePostData {
  content: string;
  emotion_ids: number[];
  is_anonymous?: boolean;
  image_url?: string;
}

export interface UpdatePostData {
  content?: string;
  emotion_ids?: number[];
  is_anonymous?: boolean;
}

export interface Post {
  post_id: number;
  content: string;
  is_anonymous: boolean;
  user_id: number;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  emotions?: Emotion[];
}

export interface Comment {
  comment_id: number;
  content: string;
  is_anonymous: boolean;
  user_id: number;
  post_id: number;
  like_count: number;
  created_at: string;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
}

const postService = {
  // 게시물 생성
  createPost: async (data: CreatePostData) => {
    try {
      const response = await apiClient.post('/posts', data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('게시물 생성 오류:', error);
      throw error;
    }
  },

  // 게시물 목록 조회
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    emotion_id?: number;
    is_anonymous?: boolean;
    search?: string;
    sort_by?: 'latest' | 'popular';
  }) => {
    try {
      const response = await apiClient.get('/posts', { params });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('게시물 목록 조회 오류:', error);
      throw error;
    }
  },

  // 내 게시물 목록 조회
  getMyPosts: async (params?: {
    page?: number;
    limit?: number;
    sort_by?: 'latest' | 'popular';
  }) => {
    try {
      const response = await apiClient.get('/posts/me', { params });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('내 게시물 조회 오류:', error);
      throw error;
    }
  },

  // 게시물 단일 조회 (MyDay 엔드포인트 사용)
  getPostById: async (postId: number) => {
    try {
      const response = await apiClient.get(`/my-day/posts/${postId}`);
      return response; // PostDetail과 호환을 위해 response 전체 반환
    } catch (error: unknown) {
      if (__DEV__) console.error('게시물 조회 오류:', error);
      throw error;
    }
  },

  // 게시물 수정
  updatePost: async (postId: number, data: UpdatePostData) => {
    try {
      const response = await apiClient.put(`/posts/${postId}`, data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('게시물 수정 오류:', error);
      throw error;
    }
  },

  // 게시물 삭제
  deletePost: async (postId: number) => {
    try {
      const response = await apiClient.delete(`/posts/${postId}`);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('게시물 삭제 오류:', error);
      throw error;
    }
  },

  // 게시물 좋아요
  likePost: async (postId: number) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('게시물 좋아요 오류:', error);
      throw error;
    }
  },

  // 게시물 좋아요 취소 (토글 방식 - 같은 엔드포인트 사용)
  unlikePost: async (postId: number) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('게시물 좋아요 취소 오류:', error);
      throw error;
    }
  },

  // 댓글 목록 조회
  getComments: async (postId: number, params?: {
    page?: number;
    limit?: number;
    sort_by?: 'created_at' | 'like_count';
    order?: 'asc' | 'desc';
  }) => {
    try {
      const response = await apiClient.get(`/posts/${postId}/comments`, { params });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 조회 오류:', error);
      throw error;
    }
  },

  // 댓글 작성 (기존 함수)
  addComment: async (postId: number, data: {
    content: string;
    is_anonymous?: boolean;
    parent_comment_id?: number;
  }) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 작성 오류:', error);
      throw error;
    }
  },

  // 댓글 작성 (alias - createComment)
  createComment: async (postId: number, data: {
    content: string;
    is_anonymous?: boolean;
    parent_comment_id?: number;
  }) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 작성 오류:', error);
      throw error;
    }
  },

  // 댓글 수정
  updateComment: async (commentId: number, data: {
    content: string;
  }) => {
    try {
      const response = await apiClient.put(`/comments/${commentId}`, data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 수정 오류:', error);
      throw error;
    }
  },

  // 댓글 삭제
  deleteComment: async (commentId: number) => {
    try {
      const response = await apiClient.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 삭제 오류:', error);
      throw error;
    }
  },

  // 댓글 좋아요
  likeComment: async (commentId: number) => {
    try {
      const response = await apiClient.post(`/comments/${commentId}/like`);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 좋아요 오류:', error);
      throw error;
    }
  },

  // 댓글 좋아요 취소
  unlikeComment: async (commentId: number) => {
    try {
      const response = await apiClient.delete(`/comments/${commentId}/like`);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 좋아요 취소 오류:', error);
      throw error;
    }
  },

  // 게시물 신고
  reportPost: async (postId: number, data: {
    report_type: 'spam' | 'inappropriate' | 'harassment' | 'other';
    description?: string;
  }) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/report`, data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('게시물 신고 오류:', error);
      throw error;
    }
  },

  // 베스트 게시물 조회
  getBestPosts: async (params?: {
    category?: 'weekly' | 'monthly';
    limit?: number;
  }) => {
    try {
      const response = await apiClient.get('/posts/best', { params });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('베스트 게시물 조회 오류:', error);
      throw error;
    }
  },

  // 추천 게시물 조회
  getRecommendedPosts: async (params?: {
    limit?: number;
    exclude_own?: boolean;
  }) => {
    try {
      const response = await apiClient.get('/posts/recommended', { params });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('추천 게시물 조회 오류:', error);
      throw error;
    }
  },

  // 모든 게시물 조회 (alias for getPosts)
  getAllPosts: async (params?: {
    page?: number;
    limit?: number;
    emotion_id?: number;
    is_anonymous?: boolean;
    search?: string;
    sort_by?: 'latest' | 'popular';
  }) => {
    try {
      const response = await apiClient.get('/posts', { params });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('모든 게시물 조회 오류:', error);
      throw error;
    }
  }
};

export default postService;