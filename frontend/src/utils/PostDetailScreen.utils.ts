// src/utils/PostDetailScreen.utils.ts
import { EMOTION_CHARACTERS, EMOTION_KEYWORDS, EMOTION_EMOJI_MAP, BEST_COMMENT_LIKE_THRESHOLD, MAX_BEST_COMMENTS } from '../constants/PostDetailScreen.constants';
import { Comment, EmotionCharacter } from '../types/PostDetailScreen.types';

// 사용자별 랜덤 감정 생성
export const getRandomEmotion = (userId: number, postId: number, commentId: number): EmotionCharacter => {
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const commentSeed = commentId || 0;

  const seed1 = (userSeed * 17 + postSeed * 37 + commentSeed * 7) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41 + commentSeed * 11) % 500;
  const seed3 = (userSeed + postSeed + commentSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_CHARACTERS.length;

  console.log(`🎭 PostDetail 감정 할당:`, {
    userId, postId, commentId, finalSeed,
    selectedEmotion: EMOTION_CHARACTERS[finalSeed]?.label
  });

  return EMOTION_CHARACTERS[finalSeed];
};

// 익명 감정 시스템
export const getAnonymousEmotion = (
  userId?: number,
  postId?: number,
  commentId?: number,
  postEmotion?: string
): EmotionCharacter => {
  if (postEmotion) {
    console.log('🔍 PostDetail getAnonymousEmotion:', { userId, postId, commentId, postEmotion });

    try {
      for (const [keyword, emotionLabel] of Object.entries(EMOTION_KEYWORDS)) {
        const isMatch = postEmotion && keyword && (postEmotion.includes(keyword) || keyword.includes(postEmotion));

        if (isMatch) {
          console.log('🎯 PostDetail 키워드 매치:', { postEmotion, keyword, emotionLabel });

          const matchedEmotion = EMOTION_CHARACTERS.find(e => e && e.label === emotionLabel);
          if (matchedEmotion) {
            console.log(`🎭 PostDetail 감정 매칭 성공: ${postEmotion} -> ${emotionLabel}`);
            return { ...matchedEmotion, label: matchedEmotion.label };
          }
        }
      }
      console.log('❌ PostDetail 매칭되는 키워드 없음');
    } catch (error) {
      console.warn('🚨 PostDetail 감정 매칭 중 오류:', error);
    }
  }

  return getRandomEmotion(userId || 1, postId || 1, commentId || 0);
};

// 베스트 댓글 추출
export const extractBestComments = (comments: Comment[]): Comment[] => {
  if ((comments as any).best_comments) {
    return (comments as any).best_comments;
  }

  const bestComments = comments
    .filter(comment => !comment.parent_comment_id && (comment.like_count || 0) >= BEST_COMMENT_LIKE_THRESHOLD)
    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
    .slice(0, MAX_BEST_COMMENTS);

  return bestComments;
};

// 댓글 찾기 (재귀)
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

// 날짜 포맷팅
export const formatDate = (dateString: string | undefined | null): string => {
  try {
    if (!dateString) {
      console.warn('📅 Date formatting: dateString is undefined or null');
      return '방금 전';
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.warn('📅 Invalid date string:', dateString);
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
    console.error('📅 Date formatting error:', error, 'for string:', dateString);
    return '방금 전';
  }
};

// 댓글용 시간 포맷팅
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
    console.error('📅 Comment time formatting error:', error, 'for string:', dateString);
    return '방금 전';
  }
};

// 전체 댓글 수 계산 (재귀)
export const calculateTotalCommentCount = (comments: Comment[]): number => {
  return comments.reduce((total: number, comment: Comment) => {
    const repliesCount = comment.replies ? calculateTotalCommentCount(comment.replies) : 0;
    return total + 1 + repliesCount;
  }, 0);
};

// 감정 이모지 가져오기
export const getEmotionEmoji = (emotionName: string): string => {
  for (const [key, emoji] of Object.entries(EMOTION_EMOJI_MAP)) {
    if (emotionName.includes(key) || key.includes(emotionName)) {
      return emoji;
    }
  }
  return '😊';
};
