// src/services/api/myDayService.ts
import apiClient from './client';
import { requestDeduplicator } from './requestQueue';

export interface CreateMyDayPostData {
  content: string;
  emotion_id?: number;
  image_url?: string;
  is_anonymous?: boolean;
}

export interface MyDayPost {
  post_id: number;
  content: string;
  emotion_id?: number;
  emotion_name?: string;
  emotion_color?: string;
  emotion_icon?: string;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
  user_id: number;
  is_liked?: boolean;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  emotions?: Array<{
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  }>;
  likes?: Array<{
    user_id: number;
  }>;
}

export interface UserEmotionStats {
  emotion_id: number;
  emotion_name: string;
  emotion_color?: string;
  emotion_icon?: string;
  count: number;
}

export interface MyDayComment {
  comment_id: number;
  post_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  parent_comment_id?: number; // 답글 관계를 위한 필드 추가
  created_at: string;
  updated_at: string;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
}

export interface CreateCommentData {
  content: string;
  is_anonymous?: boolean;
  parent_comment_id?: number;
}

const myDayService = {
  // MyDay 게시물 작성
  createPost: async (data: CreateMyDayPostData) => {
    try {
      const response = await apiClient.post('/my-day/posts', data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('MyDay 게시물 작성 오류:', error);
      throw error;
    }
  },

  // 내 MyDay 게시물 목록 조회
  getMyPosts: async (params?: {
    page?: number;
    limit?: number;
    sort_by?: 'latest' | 'popular';
  }) => {
    try {
      const response = await apiClient.get('/my-day/posts/me', { params });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('내 MyDay 게시물 조회 오류:', error);
      throw error;
    }
  },

  // MyDay 게시물 목록 조회 (전체)
  getPosts: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await apiClient.get('/my-day/posts', { params });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('MyDay 게시물 목록 조회 오류:', error);
      throw error;
    }
  },

  // MyDay 게시물 단일 조회 (만약 필요한 경우)
  getPostById: async (postId: number) => {
    try {
      const response = await apiClient.get(`/my-day/posts/${postId}`);
      return response; // PostDetail과 호환을 위해 response 전체 반환
    } catch (error: unknown) {
      if (__DEV__) console.error('MyDay 게시물 단일 조회 오류:', error);
      throw error;
    }
  },

  // MyDay 게시물 수정 (만약 필요한 경우)
  updatePost: async (postId: number, data: Partial<CreateMyDayPostData>) => {
    try {
      const response = await apiClient.put(`/my-day/posts/${postId}`, data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('MyDay 게시물 수정 오류:', error);
      throw error;
    }
  },

  // MyDay 게시물 삭제 (만약 필요한 경우)
  deletePost: async (postId: number) => {
    try {
      const response = await apiClient.delete(`/my-day/posts/${postId}`);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('MyDay 게시물 삭제 오류:', error);
      throw error;
    }
  },

  // MyDay 게시물 댓글 작성
  addComment: async (postId: number, data: CreateCommentData) => {
    try {
      if (__DEV__) console.log('💬 MyDay 댓글 작성 요청:', { postId, data });
      const response = await apiClient.post(`/my-day/posts/${postId}/comments`, data);
      if (__DEV__) console.log('💬 MyDay 댓글 작성 응답:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ MyDay 댓글 작성 오류:', error);
      if (__DEV__) console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // MyDay 게시물 댓글 목록 조회
  getComments: async (postId: number, params?: { limit?: number; page?: number }) => {
    try {
      const response = await apiClient.get(`/my-day/posts/${postId}/comments`, { params });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ MyDay 댓글 목록 조회 오류:', error);
      if (__DEV__) console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // MyDay 게시물 댓글 수정
  updateComment: async (commentId: number, data: { content: string }, postId?: number) => {
    try {
      if (__DEV__) console.log('💬 MyDay 댓글 수정 요청:', { commentId, postId, data });
      // Try different possible endpoint patterns
      let response;
      try {
        // Try the nested endpoint first
        if (postId) {
          response = await apiClient.put(`/my-day/posts/${postId}/comments/${commentId}`, data);
        } else {
          throw new Error('PostId required for nested endpoint');
        }
      } catch (error: unknown) {
        if (error.response?.status === 404) {
          // Fallback to flat endpoint
          if (__DEV__) console.log('💬 Trying flat endpoint...');
          response = await apiClient.put(`/my-day/comments/${commentId}`, data);
        } else {
          throw error;
        }
      }
      if (__DEV__) console.log('💬 MyDay 댓글 수정 응답:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ MyDay 댓글 수정 오류:', error);
      if (__DEV__) console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // MyDay 게시물 댓글 삭제
  deleteComment: async (commentId: number, postId?: number) => {
    try {
      if (__DEV__) console.log('💬 MyDay 댓글 삭제 요청:', { commentId, postId });
      // Try different possible endpoint patterns
      let response;
      try {
        // Try the nested endpoint first
        if (postId) {
          response = await apiClient.delete(`/my-day/posts/${postId}/comments/${commentId}`);
        } else {
          throw new Error('PostId required for nested endpoint');
        }
      } catch (error: unknown) {
        if (error.response?.status === 404) {
          // Fallback to flat endpoint
          if (__DEV__) console.log('💬 Trying flat endpoint...');
          response = await apiClient.delete(`/my-day/comments/${commentId}`);
        } else {
          throw error;
        }
      }
      if (__DEV__) console.log('💬 MyDay 댓글 삭제 응답:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ MyDay 댓글 삭제 오류:', error);
      if (__DEV__) console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // MyDay 게시물 좋아요/좋아요 취소
  likePost: async (postId: number) => {
    try {
      if (__DEV__) console.log('❤️ MyDay 좋아요 요청:', { postId });
      const response = await apiClient.post(`/my-day/posts/${postId}/like`);
      if (__DEV__) console.log('❤️ MyDay 좋아요 응답:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ MyDay 좋아요 처리 오류:', error);
      if (__DEV__) console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // MyDay 댓글 좋아요/좋아요 취소
  likeComment: async (commentId: number) => {
    try {
      if (__DEV__) console.log('❤️ MyDay 댓글 좋아요 요청:', { commentId });
      const response = await apiClient.post(`/my-day/comments/${commentId}/like`);
      if (__DEV__) console.log('❤️ MyDay 댓글 좋아요 응답:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ MyDay 댓글 좋아요 처리 오류:', error);
      if (__DEV__) console.error('❌ API 응답 오류 [' + (error.response?.status || 'UNKNOWN') + ']:', error.response?.data);
      throw error;
    }
  },

  // 오늘 작성한 MyDay 글 확인 (새로운 백엔드 API 사용)
  getTodayPost: async () => {
    // 중복 요청 방지
    return requestDeduplicator.dedupe('GET:/my-day/posts/today', async () => {
      try {
        if (__DEV__) console.log('📅 오늘 작성한 MyDay 글 조회 (새로운 API 사용)');

        // 새로운 전용 API 엔드포인트 사용
        const response = await apiClient.get('/my-day/posts/today');

        if (__DEV__) console.log('📅 오늘 글 조회 API 응답:', JSON.stringify(response.data, null, 2));

        if (response.data?.status === 'success') {
          const todayPost = response.data.data;

          if (todayPost) {
            if (__DEV__) console.log('✅ 오늘 작성한 글 발견 (새 API):', {
              postId: todayPost.post_id,
              createdAt: todayPost.created_at,
              content: todayPost.content?.substring(0, 50) + '...'
            });
            return todayPost;
          } else {
            if (__DEV__) console.log('📅 오늘 작성한 글이 없습니다 (새 API)');
            return null;
          }
        }

        if (__DEV__) console.warn('📅 예상치 못한 응답 구조:', response.data);
        return null;

      } catch (error: unknown) {
        if (__DEV__) console.error('❌ 오늘 MyDay 글 조회 오류 (새 API):', error);
        if (__DEV__) console.error('❌ 에러 상세:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        // 404나 다른 에러 시에도 null 반환 (작성 제한 해제)
        return null;
      }
    });
  },

  // 사용자의 MyDay 게시물 감정 통계 조회
  getUserEmotionStats: async (): Promise<{ status: string; data: UserEmotionStats[]; message?: string }> => {
    try {
      if (__DEV__) console.log('📊 사용자 감정 통계 조회 요청');

      // 백엔드 API 엔드포인트 (향후 구현될 예정)
      const response = await apiClient.get('/my-day/emotions/stats');

      if (__DEV__) console.log('📊 감정 통계 조회 응답:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ 감정 통계 조회 오류:', error);

      // API가 구현되기 전까지 임시로 사용자의 실제 게시물을 분석
      try {
        if (__DEV__) console.log('📊 임시: 실제 게시물에서 감정 통계 생성');
        const myPostsResponse = await myDayService.getMyPosts({ page: 1, limit: 100 });

        if (myPostsResponse.status === 'success' && myPostsResponse.data) {
          const posts = Array.isArray(myPostsResponse.data) ? myPostsResponse.data : myPostsResponse.data.posts || [];

          // 감정별 카운트 집계
          const emotionCounts: { [key: string]: UserEmotionStats } = {};

          posts.forEach((post: MyDayPost) => {
            if (post.emotion_name && post.emotion_id) {
              const key = post.emotion_name;
              if (!emotionCounts[key]) {
                emotionCounts[key] = {
                  emotion_id: post.emotion_id,
                  emotion_name: post.emotion_name,
                  emotion_color: post.emotion_color,
                  emotion_icon: post.emotion_icon,
                  count: 0
                };
              }
              emotionCounts[key].count++;
            }
          });

          // 카운트 순으로 정렬하여 반환
          const sortedStats = Object.values(emotionCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // 상위 10개만

          if (__DEV__) console.log('📊 실제 감정 통계 생성 완료:', sortedStats);

          return {
            status: 'success',
            data: sortedStats,
            message: '실제 게시물 데이터로 생성된 통계'
          };
        }
      } catch (fallbackError) {
        if (__DEV__) console.error('❌ 임시 감정 통계 생성도 실패:', fallbackError);
      }

      // 모든 방법이 실패할 경우 빈 배열 반환
      return {
        status: 'success',
        data: [],
        message: '감정 통계 데이터가 없습니다'
      };
    }
  }
};

export default myDayService;