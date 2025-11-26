// 감정 캐릭터 배열 - 실제 이모지 사용
export const EMOTION_CHARACTERS = [
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

// 사용자별 랜덤 감정 생성 함수
export const getRandomEmotion = (userId: number, postId: number, commentId: number) => {
  // 더 복잡한 시드 생성으로 다양성 확보
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const commentSeed = commentId || 0;

  // 다양한 수학적 연산으로 시드 생성
  const seed1 = (userSeed * 17 + postSeed * 37 + commentSeed * 7) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41 + commentSeed * 11) % 500;
  const seed3 = (userSeed + postSeed + commentSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_CHARACTERS.length;

  if (__DEV__) {
    console.log(`🎭 PostDetail 감정 할당 디버그:`, {
      userId,
      postId,
      commentId,
      userSeed,
      postSeed,
      commentSeed,
      finalSeed,
      totalEmotions: EMOTION_CHARACTERS.length,
      selectedEmotion: EMOTION_CHARACTERS[finalSeed]?.label
    });
  }

  return EMOTION_CHARACTERS[finalSeed];
};

// 익명 감정 시스템
const emotionKeywords = {
  // 기쁨 계열 확장
  '기쁨': '기쁨이', '즐거움': '기쁨이', '신남': '행복이', '좋음': '행복이', '재미': '기쁨이', '흥미': '기쁨이',
  '행복': '행복이', '만족': '행복이', '기뻐': '기쁨이', '즐거워': '기쁨이', '신나': '행복이',

  // 감동 계열 확장
  '감동': '감동이', '뭉클': '감동이', '눈물': '감동이', '벅참': '감동이', '울컥': '감동이', '고마움': '감동이',

  // 슬픔 계열 확장
  '슬픔': '슬픔이', '우울': '우울이', '외로움': '슬픔이', '서글픔': '슬픔이', '울적': '우울이', '허전': '슬픔이',
  '아쉬움': '슬픔이', '그리움': '추억이', '그립': '추억이',

  // 무서움 계열 확장
  '무섭': '무섭이', '무서움': '무섭이', '두려움': '무섭이', '공포': '무섭이', '무서워': '무섭이', '두려워': '무섭이',

  // 화남 계열 확장
  '화남': '버럭이', '분노': '버럭이', '열받음': '버럭이', '빡침': '짜증이', '화가': '버럭이', '열받': '버럭이',
  '짜증': '짜증이', '심술': '짜증이', '화나': '버럭이', '짜증나': '짜증이',

  // 불안 걱정 계열 확장
  '불안': '불안이', '걱정': '걱정이', '근심': '걱정이', '염려': '걱정이', '불안해': '불안이', '걱정돼': '걱정이',

  // 지루함 계열 확장
  '지루함': '지루미', '지겨움': '지루미', '따분': '지루미', '지루해': '지루미', '지겨워': '지루미',

  // 황당 당황 계열 확장
  '황당': '황당이', '당황': '당황이', '어이없': '황당이', '헛웃음': '황당이', '멘붕': '당황이',

  // 설렘 계열 확장
  '설렘': '설렘이', '두근': '설렘이', '떨림': '설렘이', '설레': '설렘이', '두근거림': '설렘이',

  // 편안함 계열 확장
  '편안': '편안이', '평온': '편안이', '여유': '편안이', '차분': '편안이', '안정': '편안이',

  // 궁금함 계열 확장
  '궁금': '궁금이', '의문': '궁금이', '호기심': '궁금이', '궁금해': '궁금이',

  // 사랑 계열 확장
  '사랑': '사랑이', '애정': '사랑이', '좋아': '사랑이', '마음': '사랑이',

  // 아픔 계열 확장
  '아픔': '아픔이', '고통': '아픔이', '힘듦': '아픔이', '괴로움': '아픔이', '아파': '아픔이',

  // 욕심 계열 확장
  '욕심': '욕심이', '탐욕': '욕심이', '욕망': '욕심이'
};

export const getAnonymousEmotion = (userId?: number, postId?: number, commentId?: number, postEmotion?: string) => {
  // 실제 게시물 감정이 있으면 해당 감정에 맞는 아바타 사용
  if (postEmotion) {
    if (__DEV__) {
      console.log('🔍 PostDetail getAnonymousEmotion 디버그:', {
        userId,
        postId,
        commentId,
        postEmotion,
        postEmotionType: typeof postEmotion
      });
    }

    try {
      for (const [keyword, emotionLabel] of Object.entries(emotionKeywords)) {
        const isMatch = postEmotion && keyword && (postEmotion.includes(keyword) || keyword.includes(postEmotion));

        if (isMatch) {
          if (__DEV__) {
            console.log('🎯 PostDetail 키워드 매치 발견:', {
              postEmotion,
              keyword,
              emotionLabel,
              matchType: postEmotion.includes(keyword) ? 'postEmotion.includes(keyword)' : 'keyword.includes(postEmotion)'
            });
          }

          const matchedEmotion = EMOTION_CHARACTERS.find(e => e && e.label === emotionLabel);
          if (matchedEmotion) {
            if (__DEV__) {
              console.log(`🎭 PostDetail 감정 매칭 성공: ${postEmotion} -> ${emotionLabel} (${matchedEmotion.emoji})`);
            }
            return {
              ...matchedEmotion,
              label: matchedEmotion.label // 기존 레이블 그대로 유지
            };
          } else {
            if (__DEV__) {
              console.warn('⚠️ PostDetail EMOTION_CHARACTERS에서 찾을 수 없음:', emotionLabel);
            }
          }
        }
      }

      if (__DEV__) {
        console.log('❌ PostDetail 매칭되는 키워드 없음:', {
          postEmotion,
          willUseFallback: true
        });
      }

    } catch (error) {
      if (__DEV__) {
        console.warn('🚨 PostDetail 감정 매칭 중 오류 발생:', error);
      }
    }
  }

  // 실제 감정이 없거나 매칭되지 않으면 랜덤 할당 (통일된 방식 사용)
  return getRandomEmotion(userId || 1, postId || 1, commentId || 0);
};
