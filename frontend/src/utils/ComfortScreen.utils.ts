// ComfortScreen 유틸리티 함수
import { EMOTION_AVATARS } from '../constants/ComfortScreen.constants';
import type { EmotionAvatar } from '../types/ComfortScreen.types';

// 랜덤 감정 아바타 선택 함수
export const getRandomEmotion = (userId: number, postId: number, commentId: number = 0): EmotionAvatar => {
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const commentSeed = commentId || 0;

  const seed1 = (userSeed * 17 + postSeed * 37 + commentSeed * 7) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41 + commentSeed * 11) % 500;
  const seed3 = (userSeed + postSeed + commentSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_AVATARS.length;

  return EMOTION_AVATARS[finalSeed];
};

// 인스타그램 스타일 시간 표시 함수
export const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  } else if (diffInSeconds < 2419200) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}주 전`;
  } else {
    return postDate.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    });
  }
};

// 텍스트 길이 최적화 함수 - 단어 단위로 자르기
export const optimizeTextLength = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
};

// 7줄 제한을 위한 텍스트 자르기 함수
export const truncateToSevenLines = (text: string): string => {
  if (!text) return '';

  const maxChars = 266;

  if (text.length <= maxChars) {
    return text;
  }

  const truncated = text.substring(0, maxChars - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxChars * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
};

// 검색어 유효성 검사 함수
export const isValidSearchQuery = (query: string): boolean => {
  if (!query || query.trim().length === 0) return false;

  const trimmed = query.trim();

  if (trimmed.length >= 1) {
    if (__DEV__) console.log('✅ 검색어 유효:', trimmed);
    return true;
  }

  if (__DEV__) console.log('❌ 검색어 무효:', trimmed);
  return false;
};

// 개발 환경 로거
export const logger = {
  log: (...args: any[]) => __DEV__ && console.log(...args),
  error: (...args: any[]) => __DEV__ && console.error(...args),
  warn: (...args: any[]) => __DEV__ && console.warn(...args),
};
