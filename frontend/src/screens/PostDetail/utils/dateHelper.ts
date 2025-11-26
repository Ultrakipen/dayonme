// 날짜 포맷팅 유틸리티 함수
import logger from '../../../utils/logger';

/**
 * 날짜 포맷팅 - 상대 시간 표시
 */
export const formatDate = (dateString: string | undefined | null): string => {
  try {
    if (!dateString) {
      logger.warn('📅 Date formatting: dateString is undefined or null');
      return '방금 전';
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      logger.warn('📅 Invalid date string:', dateString);
      return '방금 전';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    logger.error('📅 Date formatting error:', error, 'for string:', dateString);
    return '방금 전';
  }
};

/**
 * 댓글용 시간 포맷팅 (월,일,시:분:초)
 */
export const formatCommentTime = (dateString: string | undefined | null): string => {
  try {
    if (!dateString) {
      return '방금 전';
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return '방금 전';
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return `${month}월 ${day}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    logger.error('📅 Comment time formatting error:', error, 'for string:', dateString);
    return '방금 전';
  }
};
