// 댓글 관련 유틸리티 함수
import { Comment, CommentsResponse } from '../types/postDetail.types';

// 타입 재export (하위 호환성)
export type { Comment } from '../types/postDetail.types';

/**
 * 베스트 댓글 추출 (타입 안전성 개선)
 */
export const extractBestComments = (
  comments: Comment[] | CommentsResponse
): Comment[] => {
  // CommentsResponse 형태인 경우 best_comments 우선 사용
  if ('best_comments' in comments && Array.isArray(comments.best_comments)) {
    return comments.best_comments;
  }

  // 배열 형태인 경우
  const commentArray = Array.isArray(comments) ? comments : [];

  // 프론트엔드에서 필터링 (1개 이상 좋아요받은 루트 댓글)
  const bestComments = commentArray
    .filter(comment => !comment.parent_comment_id && (comment.like_count || 0) >= 1)
    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
    .slice(0, 5);

  return bestComments;
};

/**
 * 댓글을 찾는 헬퍼 함수 (재귀적으로 검색)
 * @param comments - 검색할 댓글 배열
 * @param commentId - 찾을 댓글 ID
 * @returns 찾은 댓글 또는 null
 */
export const findCommentById = (comments: Comment[], commentId: number): Comment | null => {
  for (const comment of comments) {
    if (comment.comment_id === commentId) {
      return comment;
    }
    if (comment.replies && comment.replies.length > 0) {
      const found = findCommentById(comment.replies, commentId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 전체 댓글 수 계산 (재귀적으로 모든 답글 포함)
 */
export const calculateTotalCommentCount = (comments: Comment[]): number => {
  return comments.reduce((total: number, comment: Comment) => {
    const repliesCount = comment.replies ? calculateTotalCommentCount(comment.replies) : 0;
    return total + 1 + repliesCount;
  }, 0);
};
