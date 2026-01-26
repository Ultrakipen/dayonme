// src/services/api/commentService.ts
import apiClient from './client';

export interface CommentLikeResponse {
  status: string;
  message: string;
  data?: {
    is_liked: boolean;
    like_count: number;
  };
}

export interface CommentReportResponse {
  status: string;
  message: string;
}

class CommentService {
  // MyDay 댓글 조회
  async getComments(params: { type: 'my_day' | 'comfort_wall' | 'challenge', post_id: number }): Promise<any> {
    try {
      if (params.type === 'my_day') {
        const response = await apiClient.get(`/my-day/posts/${params.post_id}/comments`);
        return response.data;
      } else if (params.type === 'challenge') {
        const response = await apiClient.get(`/challenges/${params.post_id}/comments`);
        return response.data;
      } else {
        // comfort_wall 댓글 조회 로직은 추후 구현
        throw new Error('Comfort wall comments not implemented yet');
      }
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 조회 오류:', error);
      throw error.response?.data || { status: 'error', message: '댓글 조회 중 오류가 발생했습니다.' };
    }
  }

  // MyDay 댓글 작성
  async createComment(params: {
    type: 'my_day' | 'comfort_wall' | 'challenge',
    post_id: number,
    content: string,
    parent_comment_id?: number,
    is_anonymous?: boolean
  }): Promise<any> {
    try {
      if (params.type === 'my_day') {
        const response = await apiClient.post(`/my-day/posts/${params.post_id}/comments`, {
          content: params.content,
          parent_comment_id: params.parent_comment_id,
          is_anonymous: params.is_anonymous
        });
        return response.data;
      } else if (params.type === 'challenge') {
        const response = await apiClient.post(`/challenges/${params.post_id}/comments`, {
          content: params.content,
          parent_comment_id: params.parent_comment_id,
          is_anonymous: params.is_anonymous
        });
        return response.data;
      } else {
        // comfort_wall 댓글 작성 로직은 추후 구현
        throw new Error('Comfort wall comments not implemented yet');
      }
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 작성 오류:', error);
      throw error.response?.data || { status: 'error', message: '댓글 작성 중 오류가 발생했습니다.' };
    }
  }

  // MyDay 댓글 좋아요/좋아요 취소
  async likeComment(commentId: number, type: 'my_day' | 'comfort_wall' | 'challenge' = 'comfort_wall'): Promise<CommentLikeResponse> {
    try {
      let response;
      if (type === 'my_day') {
        response = await apiClient.post(`/my-day/comments/${commentId}/like`);
      } else if (type === 'challenge') {
        response = await apiClient.post(`/challenges/comments/${commentId}/like`);
      } else {
        response = await apiClient.post(`/comfort-wall/comments/${commentId}/like`);
      }
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 좋아요 오류:', error);
      throw error.response?.data || { status: 'error', message: '댓글 좋아요 처리 중 오류가 발생했습니다.' };
    }
  }

  // 기존 comfort-wall 댓글 좋아요 (하위 호환성)
  async likeComfortComment(commentId: number): Promise<CommentLikeResponse> {
    return this.likeComment(commentId, 'comfort_wall');
  }

  // 댓글 신고
  async reportComment(commentId: number, reason: string): Promise<CommentReportResponse> {
    try {
      const response = await apiClient.post(`/comfort-wall/comments/${commentId}/report`, {
        reason
      });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 신고 오류:', error);
      throw error.response?.data || { status: 'error', message: '댓글 신고 중 오류가 발생했습니다.' };
    }
  }

  // 댓글 삭제 (타입별로 구분)
  async deleteComment(commentId: number, type: 'comfort-wall' | 'challenge' = 'comfort-wall'): Promise<CommentReportResponse> {
    try {
      let endpoint = `/comfort-wall/comments/${commentId}`;
      if (type === 'challenge') {
        endpoint = `/challenges/comments/${commentId}`;
      }

      const response = await apiClient.delete(endpoint);
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 삭제 오류:', error);
      throw error.response?.data || { status: 'error', message: '댓글 삭제 중 오류가 발생했습니다.' };
    }
  }

  // 댓글 수정 (타입별로 구분)
  async editComment(commentId: number, content: string, type: 'comfort-wall' | 'challenge' = 'comfort-wall'): Promise<any> {
    try {
      let endpoint = `/comfort-wall/comments/${commentId}`;
      if (type === 'challenge') {
        endpoint = `/challenges/comments/${commentId}`;
      }

      const response = await apiClient.put(endpoint, {
        content: content.normalize('NFC')
      });
      return response.data;
    } catch (error: unknown) {
      if (__DEV__) console.error('댓글 수정 오류:', error);
      throw error.response?.data || { status: 'error', message: '댓글 수정 중 오류가 발생했습니다.' };
    }
  }
}

export default new CommentService();