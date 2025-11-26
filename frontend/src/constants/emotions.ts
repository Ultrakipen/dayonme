export const EMOTION_AVATARS = [
  { label: '기쁨이', emoji: '😊', color: '#FFD700' },
  { label: '행복이', emoji: '😄', color: '#FFA500' },
  { label: '슬픔이', emoji: '😢', color: '#4682B4' },
  { label: '우울이', emoji: '😞', color: '#708090' },
  { label: '지루미', emoji: '😑', color: '#A9A9A9' },
  { label: '버럭이', emoji: '😠', color: '#FF4500' },
  { label: '불안이', emoji: '😰', color: '#DDA0DD' },
  { label: '걱정이', emoji: '😟', color: '#FFA07A' },
  { label: '감동이', emoji: '🥺', color: '#FF6347' },
  { label: '황당이', emoji: '🤨', color: '#20B2AA' },
  { label: '당황이', emoji: '😲', color: '#FF8C00' },
  { label: '짜증이', emoji: '😤', color: '#DC143C' },
  { label: '무섭이', emoji: '😨', color: '#9370DB' },
  { label: '추억이', emoji: '🥰', color: '#87CEEB' },
  { label: '설렘이', emoji: '🤗', color: '#FF69B4' },
  { label: '편안이', emoji: '😌', color: '#98FB98' },
  { label: '궁금이', emoji: '🤔', color: '#DAA520' },
  { label: '사랑이', emoji: '❤️', color: '#E91E63' },
  { label: '아픔이', emoji: '🤕', color: '#8B4513' },
  { label: '욕심이', emoji: '🤑', color: '#32CD32' }
];

export const getRandomEmotion = (seed1: number, seed2: number = 0, seed3: number = 0) => {
  const combinedSeed = (seed1 * 17 + seed2 * 37 + seed3 * 7) % 1000;
  const finalSeed = (combinedSeed + seed1 * 23 + seed2 * 41 + seed3 * 11) % EMOTION_AVATARS.length;
  return EMOTION_AVATARS[finalSeed];
};
