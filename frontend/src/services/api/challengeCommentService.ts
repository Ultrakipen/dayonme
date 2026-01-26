// 챌린지 댓글 API 서비스
import apiClient from './apiClient';
import { ChallengeComment } from '../../components/ChallengeCommentSystem';

export interface ChallengeCommentCreateData {
  challenge_id: number;
  content: string;
  parent_comment_id?: number;
  challenge_emotion_id?: number;
  is_anonymous?: boolean;
}

export interface ChallengeCommentUpdateData {
  content: string;
}

export interface ChallengeCommentResponse {
  status: number;
  data: ChallengeComment[];
  message?: string;
}

export interface SingleChallengeCommentResponse {
  status: number;
  data: ChallengeComment;
  message?: string;
}

class ChallengeCommentService {
  // 챌린지 댓글 목록 조회
  async getChallengeComments(challengeId: number, challengeEmotionId?: number): Promise<ChallengeCommentResponse> {
    try {
      const url = challengeEmotionId
        ? `/challenges/${challengeId}/comments?challenge_emotion_id=${challengeEmotionId}`
        : `/challenges/${challengeId}/comments`;

      const response = await apiClient.get(url);
      return {
        status: response.status,
        data: response.data.data?.comments || response.data?.comments || [],
        message: response.data.message
      };
    } catch (error: unknown) {
      if (__DEV__) console.error('챌린지 댓글 조회 오류:', error);
      return {
        status: error.response?.status || 500,
        data: [],
        message: error.response?.data?.message || '댓글을 불러오는 중 오류가 발생했습니다.'
      };
    }
  }

  // 챌린지 댓글 작성
  async createChallengeComment(data: ChallengeCommentCreateData): Promise<SingleChallengeCommentResponse> {
    try {
      const response = await apiClient.post(`/challenges/${data.challenge_id}/comments`, data);
      return {
        status: response.status,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error: unknown) {
      if (__DEV__) console.error('챌린지 댓글 작성 오류:', error);
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || '댓글 작성 중 오류가 발생했습니다.'
      };
    }
  }

  // 챌린지 댓글 수정
  async updateChallengeComment(
    challengeId: number,
    commentId: number,
    data: ChallengeCommentUpdateData
  ): Promise<SingleChallengeCommentResponse> {
    try {
      const response = await apiClient.put(
        `/challenges/comments/${commentId}`,
        data
      );
      return {
        status: response.status,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error: unknown) {
      if (__DEV__) console.error('챌린지 댓글 수정 오류:', error);
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || '댓글 수정 중 오류가 발생했습니다.'
      };
    }
  }

  // 챌린지 댓글 삭제
  async deleteChallengeComment(challengeId: number, commentId: number): Promise<{ status: number; message?: string }> {
    try {
      const response = await apiClient.delete(`/challenges/comments/${commentId}`);
      return {
        status: response.status,
        message: response.data.message
      };
    } catch (error: unknown) {
      if (__DEV__) console.error('챌린지 댓글 삭제 오류:', error);
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || '댓글 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  // 챌린지 댓글 좋아요/취소
  async toggleChallengeCommentLike(
    challengeId: number,
    commentId: number
  ): Promise<{ status: number; is_liked: boolean; like_count: number }> {
    try {
      const response = await apiClient.post(`/challenges/comments/${commentId}/like`);
      return {
        status: response.status,
        is_liked: response.data.is_liked,
        like_count: response.data.like_count
      };
    } catch (error: unknown) {
      if (__DEV__) console.error('챌린지 댓글 좋아요 토글 오류:', error);
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || '좋아요 처리 중 오류가 발생했습니다.'
      };
    }
  }

  // 댓글 신고 (추후 구현용)
  async reportChallengeComment(
    challengeId: number,
    commentId: number,
    reason: string
  ): Promise<{ status: number; message?: string }> {
    try {
      const response = await apiClient.post(`/challenges/comments/${commentId}/report`, {
        reason
      });
      return {
        status: response.status,
        message: response.data.message
      };
    } catch (error: unknown) {
      if (__DEV__) console.error('챌린지 댓글 신고 오류:', error);
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || '신고 처리 중 오류가 발생했습니다.'
      };
    }
  }
}

const challengeCommentService = new ChallengeCommentService();
export default challengeCommentService;