// Twemoji CDN URL 생성 함수 (고해상도 이모지 이미지)
export const getTwemojiUrl = (emojiCode: string): string =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${emojiCode}.png`;

// 통합 감정 아바타 배열 (앱 전체에서 사용)
export const EMOTION_AVATARS = [
  { id: 1, label: '기쁨이', shortName: '기쁨', emoji: '😊', emojiCode: '1f60a', color: '#FFD700' },
  { id: 2, label: '행복이', shortName: '행복', emoji: '😄', emojiCode: '1f604', color: '#FFA500' },
  { id: 3, label: '슬픔이', shortName: '슬픔', emoji: '😢', emojiCode: '1f622', color: '#4682B4' },
  { id: 4, label: '우울이', shortName: '우울', emoji: '😞', emojiCode: '1f61e', color: '#708090' },
  { id: 5, label: '불안이', shortName: '불안', emoji: '😰', emojiCode: '1f630', color: '#DDA0DD' },
  { id: 6, label: '걱정이', shortName: '걱정', emoji: '😟', emojiCode: '1f61f', color: '#FFA07A' },
  { id: 7, label: '버럭이', shortName: '화남', emoji: '😠', emojiCode: '1f620', color: '#FF4500' },
  { id: 8, label: '짜증이', shortName: '짜증', emoji: '😤', emojiCode: '1f624', color: '#DC143C' },
  { id: 9, label: '감동이', shortName: '감동', emoji: '🥺', emojiCode: '1f97a', color: '#FF6347' },
  { id: 10, label: '황당이', shortName: '황당', emoji: '🤨', emojiCode: '1f928', color: '#20B2AA' },
  { id: 11, label: '당황이', shortName: '당황', emoji: '😲', emojiCode: '1f632', color: '#FF8C00' },
  { id: 12, label: '무섭이', shortName: '무섭', emoji: '😨', emojiCode: '1f628', color: '#9370DB' },
  { id: 13, label: '편안이', shortName: '편안', emoji: '😌', emojiCode: '1f60c', color: '#98FB98' },
  { id: 14, label: '추억이', shortName: '추억', emoji: '🥰', emojiCode: '1f970', color: '#87CEEB' },
  { id: 15, label: '설렘이', shortName: '설렘', emoji: '🤗', emojiCode: '1f917', color: '#FF69B4' },
  { id: 16, label: '지루미', shortName: '지루', emoji: '😑', emojiCode: '1f611', color: '#A9A9A9' },
  { id: 17, label: '궁금이', shortName: '궁금', emoji: '🤔', emojiCode: '1f914', color: '#DAA520' },
  { id: 18, label: '사랑이', shortName: '사랑', emoji: '❤️', emojiCode: '2764', color: '#E91E63' },
  { id: 19, label: '아픔이', shortName: '아픔', emoji: '🤕', emojiCode: '1f915', color: '#8B4513' },
  { id: 20, label: '욕심이', shortName: '욕심', emoji: '🤑', emojiCode: '1f911', color: '#32CD32' },
];

// 키워드 → 감정 레이블 매핑 (다양한 표현 지원)
export const EMOTION_KEYWORDS: Record<string, string> = {
  // 기쁨 계열
  '기쁨': '기쁨이', '즐거움': '기쁨이', '신남': '행복이', '좋음': '행복이',
  '재미': '기쁨이', '흥미': '기쁨이', '기뻐': '기쁨이', '즐거워': '기쁨이',
  '행복': '행복이', '만족': '행복이', '신나': '행복이',
  // 감동 계열
  '감동': '감동이', '뭉클': '감동이', '눈물': '감동이', '벅참': '감동이',
  '울컥': '감동이', '고마움': '감동이', '감사': '감동이', '위로': '감동이',
  // 슬픔 계열
  '슬픔': '슬픔이', '우울': '우울이', '외로움': '슬픔이', '서글픔': '슬픔이',
  '울적': '우울이', '허전': '슬픔이', '아쉬움': '슬픔이', '고독': '슬픔이',
  '그리움': '추억이', '그립': '추억이',
  // 무서움 계열
  '무섭': '무섭이', '무서움': '무섭이', '두려움': '무섭이', '공포': '무섭이',
  '무서워': '무섭이', '두려워': '무섭이', '충격': '무섭이',
  // 화남 계열
  '화남': '버럭이', '분노': '버럭이', '열받음': '버럭이', '빡침': '짜증이',
  '화가': '버럭이', '열받': '버럭이', '짜증': '짜증이', '심술': '짜증이',
  '화나': '버럭이', '짜증나': '짜증이', '버럭': '버럭이',
  // 불안/걱정 계열
  '불안': '불안이', '걱정': '걱정이', '근심': '걱정이', '염려': '걱정이',
  '불안해': '불안이', '걱정돼': '걱정이',
  // 지루함 계열
  '지루함': '지루미', '지겨움': '지루미', '따분': '지루미',
  '지루해': '지루미', '지겨워': '지루미', '지루': '지루미', '지침': '지루미',
  // 황당/당황 계열
  '황당': '황당이', '당황': '당황이', '어이없': '황당이',
  '헛웃음': '황당이', '멘붕': '당황이',
  // 설렘 계열
  '설렘': '설렘이', '두근': '설렘이', '떨림': '설렘이',
  '설레': '설렘이', '두근거림': '설렘이',
  // 편안함 계열
  '편안': '편안이', '평온': '편안이', '여유': '편안이',
  '차분': '편안이', '안정': '편안이', '편함': '편안이',
  // 궁금함 계열
  '궁금': '궁금이', '의문': '궁금이', '호기심': '궁금이', '궁금해': '궁금이',
  // 사랑 계열
  '사랑': '사랑이', '애정': '사랑이', '좋아': '사랑이', '마음': '사랑이',
  // 아픔 계열
  '아픔': '아픔이', '고통': '아픔이', '힘듦': '아픔이',
  '괴로움': '아픔이', '아파': '아픔이',
  // 욕심 계열
  '욕심': '욕심이', '탐욕': '욕심이', '욕망': '욕심이',
  // 추억 계열
  '추억': '추억이',
};

// 감정 이름으로 이모지 가져오기 (긴 이름/짧은 이름 모두 지원)
export const getEmotionEmoji = (emotionName: string): string => {
  if (!emotionName) return '😊';

  // 정확한 레이블 매칭
  const exactMatch = EMOTION_AVATARS.find(e => e.label === emotionName);
  if (exactMatch) return exactMatch.emoji;

  // 짧은 이름 매칭
  const shortMatch = EMOTION_AVATARS.find(e => e.shortName === emotionName);
  if (shortMatch) return shortMatch.emoji;

  // 키워드 매칭
  const keywordMatch = EMOTION_KEYWORDS[emotionName];
  if (keywordMatch) {
    const emotion = EMOTION_AVATARS.find(e => e.label === keywordMatch);
    if (emotion) return emotion.emoji;
  }

  // 부분 매칭
  for (const emotion of EMOTION_AVATARS) {
    if (emotionName.includes(emotion.shortName) || emotion.label.includes(emotionName)) {
      return emotion.emoji;
    }
  }

  return '😊';
};

// 감정 이름으로 전체 데이터 가져오기
export const getEmotionByName = (emotionName: string): typeof EMOTION_AVATARS[0] | null => {
  if (!emotionName) return null;

  // 정확한 레이블 매칭
  const exactMatch = EMOTION_AVATARS.find(e => e.label === emotionName);
  if (exactMatch) return exactMatch;

  // 짧은 이름 매칭
  const shortMatch = EMOTION_AVATARS.find(e => e.shortName === emotionName);
  if (shortMatch) return shortMatch;

  // 키워드 매칭
  const keywordMatch = EMOTION_KEYWORDS[emotionName];
  if (keywordMatch) {
    const emotion = EMOTION_AVATARS.find(e => e.label === keywordMatch);
    if (emotion) return emotion;
  }

  // 부분 매칭
  for (const emotion of EMOTION_AVATARS) {
    if (emotionName.includes(emotion.shortName) || emotion.label.includes(emotionName)) {
      return emotion;
    }
  }

  return null;
};

// 감정 ID로 데이터 가져오기
export const getEmotionById = (emotionId: number): typeof EMOTION_AVATARS[0] | null => {
  return EMOTION_AVATARS.find(e => e.id === emotionId) || null;
};

// 일관된 익명 감정 (게시물 목록과 상세 화면에서 동일한 감정 표시)
export const getConsistentEmotion = (
  postEmotion?: string | null,
  userId?: number,
  postId?: number
): typeof EMOTION_AVATARS[0] => {
  // 1. 게시물에 감정이 있으면 해당 감정 사용 (랜덤 아님!)
  if (postEmotion) {
    const matched = getEmotionByName(postEmotion);
    if (matched) return matched;
  }

  // 2. 감정이 없을 때만 seed 기반 일관된 감정 할당
  const seed = ((userId || 1) * 17 + (postId || 1) * 37) % EMOTION_AVATARS.length;
  return EMOTION_AVATARS[seed];
};

// 기존 getRandomEmotion 함수 (하위 호환성 유지)
export const getRandomEmotion = (seed1: number, seed2: number = 0, seed3: number = 0) => {
  const combinedSeed = (seed1 * 17 + seed2 * 37 + seed3 * 7) % 1000;
  const finalSeed = (combinedSeed + seed1 * 23 + seed2 * 41 + seed3 * 11) % EMOTION_AVATARS.length;
  return EMOTION_AVATARS[finalSeed];
};
