// 챌린지 관련 헬퍼 함수

import { anonymousEmotions, emotionEmojiMap } from '../constants/challengeEmotions';
import { anonymousManager } from './anonymousNickname';
import { AnonymousUserInfo } from '../types/ChallengeDetailScreen.types';

// 익명 이름 생성기
export const getAnonymousName = async (challengeId: number, userId: number): Promise<AnonymousUserInfo> => {
  try {
    const anonymousUser = await anonymousManager.getOrCreateAnonymousUser(challengeId, userId);

    // 기존 anonymousEmotions에서 해당하는 감정 찾기
    const matchingEmotion = anonymousEmotions.find(emotion => emotion.label === anonymousUser.anonymousNickname?.split('_')[0]);

    return {
      name: anonymousUser.anonymousNickname,
      emotion: matchingEmotion || anonymousEmotions[0],
      icon: anonymousUser.anonymousIcon,
      color: anonymousUser.anonymousColor
    };
  } catch (error) {
    if (__DEV__) console.error('익명 이름 생성 오류:', error);
    // 폴백: 기존 방식
    const emotionIndex = userId % anonymousEmotions.length;
    const emotion = anonymousEmotions[emotionIndex];
    return {
      name: emotion.label,
      emotion,
      icon: emotion.icon,
      color: emotion.color
    };
  }
};

// 감정 이모지 가져오기
export const getEmotionEmoji = (emotionName: string): string => {
  const result = emotionEmojiMap[emotionName]?.emoji || '😊';
  if (__DEV__) console.log(`🎭 감정 이모지 조회: "${emotionName}" -> ${result}`);
  return result;
};

// 감정 색상 가져오기
export const getEmotionColor = (emotionName: string): string => {
  const result = emotionEmojiMap[emotionName]?.color || '#FFD700';
  if (__DEV__) console.log(`🎨 감정 색상 조회: "${emotionName}" -> ${result}`);
  return result;
};
