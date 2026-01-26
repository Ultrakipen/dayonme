// src/services/api/comfortWallService.ts

import apiClient from './client';

export interface ComfortWallPostData {
  title: string;
  content: string;
  is_anonymous?: boolean;
  anonymous_emotion_id?: number | null; // 익명 게시물용 감정 ID (1-20)
  tag_ids?: number[];
  tags?: string[];
  images?: string[];
}

export interface ComfortMessageData {
  message: string;
  is_anonymous?: boolean;
}

const comfortWallService = {
  createPost: async (data: ComfortWallPostData) => {
    try {
      // 이미지가 있는 경우도 JSON 방식으로 전송 (FormData 문제 회피)
      if (__DEV__) console.log('📤 JSON 방식으로 전송 중:', {
        title: `"${data.title}" (길이: ${data.title.length})`,
        content: `"${data.content}" (길이: ${data.content.length})`,
        is_anonymous: data.is_anonymous,
        tags: data.tags,
        images: data.images?.length
      });
      
      // 모든 경우에 JSON 전송 (이미지 포함)
      return await apiClient.post('/comfort-wall', data);
    } catch (error) {
      if (__DEV__) console.error('createPost 에러:', error);
      throw error;
    }
  },
  
  getPosts: async (params?: { 
    page?: number; 
    limit?: number; 
    sort_by?: 'latest' | 'popular' | 'best';
    tag?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    author_only?: boolean;
    include?: string; // 댓글 정보 포함 요청
  }) => {
    if (__DEV__) console.log('🚀 comfort-wall API 호출:', params);
    return await apiClient.get('/comfort-wall', { params });
  },

  // 게시물 검색
  searchPosts: async (params: {
    search: string;
    page?: string;
    limit?: string;
    tag?: string;
    sort_by?: 'latest' | 'popular' | 'best';
  }) => {
    return await apiClient.get('/comfort-wall', { params });
  },

  // 게시물 상세 조회
  getPostDetail: async (postId: number) => {
    return await apiClient.get(`/comfort-wall/${postId}`);
  },

  // 게시물 ID로 조회 (usePostSwipe 훅과 호환)
  getPostById: async (postId: number) => {
    try {
      const response = await apiClient.get(`/comfort-wall/${postId}`);
      // 응답 데이터 정규화 (post_id 필드 보장)
      const postData = response.data?.data || response.data;
      if (postData && !postData.post_id && postData.id) {
        postData.post_id = postData.id;
      }
      return postData;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ Comfort Wall 게시물 조회 오류:', error);
      throw error;
    }
  },

  // 댓글 작성
  addComment: async (postId: number, data: {
    content: string;
    is_anonymous?: boolean;
    parent_comment_id?: number;
  }) => {
    if (__DEV__) console.log('🎯 comfortWallService.addComment 호출:', {
      postId,
      dataReceived: data,
      dataStringified: JSON.stringify(data),
      contentLength: data.content?.length,
      contentPreview: data.content?.substring(0, 30)
    });
    return await apiClient.post(`/comfort-wall/${postId}/comments`, data);
  },

  // 댓글 좋아요
  likeComment: async (commentId: number) => {
    return await apiClient.post(`/comfort-wall/comments/${commentId}/like`);
  },
  
  getBestPosts: async (params?: { period?: 'daily' | 'weekly' | 'monthly' }) => {
    return await apiClient.get('/comfort-wall/best', { params });
  },

  // 나의 최근 게시물 3개 조회
  getMyRecentPosts: async () => {
    return await apiClient.get('/comfort-wall/my-recent');
  },

  // 나의 모든 게시물 조회
  getMyPosts: async (params?: {
    page?: number;
    limit?: number;
    sort_by?: 'latest' | 'popular';
  }) => {
    try {
      if (__DEV__) console.log('🚀 내 위로와 공감 게시물 조회:', params);
      const response = await apiClient.get('/comfort-wall/me', { params });
      if (__DEV__) console.log('✅ 내 위로와 공감 게시물 조회 성공:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ 내 위로와 공감 게시물 조회 오류:', error);
      throw error;
    }
  },
  
  sendMessage: async (postId: number, data: ComfortMessageData) => {
    return await apiClient.post(`/comfort-wall/${postId}/message`, data);
  },
  
  // 댓글 조회
  getComments: async (postId: number, params?: { limit?: number; page?: number }) => {
    return await apiClient.get(`/comfort-wall/${postId}/comments`, { params });
  },

  // 댓글 수정
  updateComment: async (commentId: number, data: { content: string }) => {
    try {
      if (__DEV__) console.log('💬 Comfort Wall 댓글 수정 요청:', { commentId, data });
      const response = await apiClient.put(`/comfort-wall/comments/${commentId}`, data);
      if (__DEV__) console.log('💬 Comfort Wall 댓글 수정 응답:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ Comfort Wall 댓글 수정 오류:', error);
      throw error;
    }
  },

  // 댓글 삭제
  deleteComment: async (commentId: number) => {
    try {
      if (__DEV__) console.log('💬 Comfort Wall 댓글 삭제 요청:', { commentId });
      const response = await apiClient.delete(`/comfort-wall/comments/${commentId}`);
      if (__DEV__) console.log('💬 Comfort Wall 댓글 삭제 응답:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ Comfort Wall 댓글 삭제 오류:', error);
      throw error;
    }
  },
  
  // 좋아요 기능 추가
  likePost: async (postId: number) => {
    return await apiClient.post(`/comfort-wall/${postId}/like`);
  },

  // 게시물 수정
  updatePost: async (postId: number, data: Partial<ComfortWallPostData>) => {
    try {
      if (__DEV__) console.log('📝 위로와 공감 게시물 수정 요청:', { postId, data });
      const response = await apiClient.put(`/comfort-wall/${postId}`, data);
      if (__DEV__) console.log('✅ 위로와 공감 게시물 수정 성공:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ 위로와 공감 게시물 수정 오류:', error);
      throw error;
    }
  },

  // 게시물 삭제
  deletePost: async (postId: number) => {
    try {
      if (__DEV__) console.log('🗑️ 위로와 공감 게시물 삭제 요청:', { postId });
      const response = await apiClient.delete(`/comfort-wall/${postId}`);
      if (__DEV__) console.log('✅ 위로와 공감 게시물 삭제 성공:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ 위로와 공감 게시물 삭제 오류:', error);
      throw error;
    }
  }
};

export default comfortWallService;