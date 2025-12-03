// 공통 감정 상수에서 import (앱 전체 통일)
import {
  EMOTION_AVATARS,
  getRandomEmotion as baseGetRandomEmotion
} from '../../../constants/emotions';

// 하위 호환성을 위해 EMOTION_CHARACTERS로 재export
export const EMOTION_CHARACTERS = EMOTION_AVATARS;

// 사용자별 랜덤 감정 생성 함수 (공통 함수 래퍼)
export const getRandomEmotion = (userId: number, postId: number, commentId: number) => {
  const result = baseGetRandomEmotion(userId, postId, commentId);

  if (__DEV__) {
    console.log(`🎭 PostDetail 감정 할당:`, {
      userId,
      postId,
      commentId,
      selectedEmotion: result?.label
    });
  }

  return result;
};

// 익명 감정 시스템 (공통 함수 사용 - 목록과 상세에서 동일한 감정 표시)
export const getAnonymousEmotion = (
  userId?: number,
  postId?: number,
  commentId?: number,
  postEmotion?: string,
  anonymousEmotionId?: number | null
) => {
  // 저장된 익명 감정 ID가 있으면 우선 사용
  if (anonymousEmotionId && anonymousEmotionId >= 1 && anonymousEmotionId <= 20) {
    const emotion = EMOTION_AVATARS.find(e => e.id === anonymousEmotionId);
    if (emotion) {
      if (__DEV__) {
        console.log('🎭 PostDetail getAnonymousEmotion (ID 사용):', {
          anonymousEmotionId,
          matchedEmotion: emotion.label
        });
      }
      return emotion;
    }
  }

  // 2. postEmotion이 있으면 해당 감정 사용
  if (postEmotion) {
    const matched = EMOTION_AVATARS.find(
      e => e.label === postEmotion || e.shortName === postEmotion
    );
    if (matched) {
      if (__DEV__) {
        console.log('🎭 PostDetail getAnonymousEmotion (감정명 매칭):', {
          postEmotion,
          matchedEmotion: matched.label
        });
      }
      return matched;
    }
  }

  // 3. 시드 기반 일관된 감정 할당
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const seed1 = (userSeed * 17 + postSeed * 37) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41) % 500;
  const seed3 = (userSeed + postSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_AVATARS.length;
  const emotion = EMOTION_AVATARS[finalSeed];

  if (__DEV__) {
    console.log('🎭 PostDetail getAnonymousEmotion:', {
      userId,
      postId,
      commentId,
      postEmotion,
      matchedEmotion: emotion.label,
      emoji: emotion.emoji
    });
  }

  return emotion;
};
