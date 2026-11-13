// 날짜 포맷팅 유틸리티 함수
import logger from '../../../utils/logger';
import { formatTimeAgo } from '../../../utils/dateUtils';

/**
 * 날짜 포맷팅 - 상대 시간 표시
 */
export const formatDate = (dateString: string | undefined | null): string => {
  try {
    if (!dateString) {
      logger.warn('📅 Date formatting: dateString is undefined or null');
      return '방금 전';
    }

    return formatTimeAgo(dateString);
  } catch (error) {
    logger.error('📅 Date formatting error:', error, 'for string:', dateString);
    return '방금 전';
  }
};

/**
 * 댓글용 시간 포맷팅 - 상대 시간 표시
 */
export const formatCommentTime = (dateString: string | undefined | null): string => {
  try {
    if (!dateString) {
      return '방금 전';
    }

    return formatTimeAgo(dateString);
  } catch (error) {
    logger.error('📅 Comment time formatting error:', error, 'for string:', dateString);
    return '방금 전';
  }
};
