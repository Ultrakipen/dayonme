import { EmotionTreeStage } from '../types/ReviewScreen.types';

export const getEmotionIcon = (emotion: string): string => {
  const emotionMap: { [key: string]: string } = {
    // 새로운 친근한 감정들
    '기쁨이': '😊',
    '행복이': '😄',
    '슬픔이': '😢',
    '우울이': '😞',
    '지루미': '😑',
    '버럭이': '😠',
    '불안이': '😰',
    '걱정이': '😟',
    '감동이': '🥺',
    '황당이': '🤨',
    '당황이': '😲',
    '짜증이': '😤',
    '무섭이': '😨',
    '추억이': '🥰',
    '설렘이': '🤗',
    '편안이': '😌',
    '궁금이': '🤔',
    '사랑이': '❤️',
    '아픔이': '🤕',
    '욕심이': '🤑',
    // 기존 감정명도 호환
    '기쁨': '😊',
    '행복': '😄',
    '슬픔': '😢',
    '우울': '😞',
    '지루': '😑',
    '화남': '😠',
    '분노': '😠',
    '불안': '😰',
    '걱정': '😟',
    '감동': '🥺',
    '황당': '🤨',
    '당황': '😲',
    '짜증': '😤',
    '무서': '😨',
    '추억': '🥰',
    '설렘': '🤗',
    '편안': '😌',
    '궁금': '🤔',
    '사랑': '❤️',
    '아픔': '🤕',
    '욕심': '🤑',
  };
  return emotionMap[emotion] || '📝';
};

export const getEmotionColor = (emotion: string): string => {
  const colorMap: { [key: string]: string } = {
    '행복': '#FFD700',
    '기쁨': '#FF69B4',
    '슬픔': '#4682B4',
    '우울': '#708090',
    '분노': '#FF4500',
    '불안': '#9370DB',
    '평온': '#87CEEB',
    '설렘': '#FF1493',
    '감사': '#32CD32',
    '후회': '#A9A9A9',
    '외로움': '#778899',
    '피곤': '#696969',
    '스트레스': '#DC143C',
    '만족': '#FFD700',
    '사랑': '#FF69B4',
    '뿌듯함': '#4CAF50',
    '편안함': '#81C784',
    '신남': '#FFA726',
  };
  return colorMap[emotion] || '#0095F6';
};

export const getEmotionMaterialIcon = (emotion: string): string => {
  const iconMap: { [key: string]: string } = {
    '행복': 'emoticon-happy-outline',
    '기쁨': 'emoticon-excited-outline',
    '슬픔': 'emoticon-sad-outline',
    '우울': 'emoticon-cry-outline',
    '분노': 'emoticon-angry-outline',
    '불안': 'emoticon-confused-outline',
    '평온': 'emoticon-neutral-outline',
    '설렘': 'heart-flash',
    '감사': 'hand-heart',
    '후회': 'emoticon-frown-outline',
    '외로움': 'emoticon-sad-outline',
    '피곤': 'sleep',
    '스트레스': 'head-alert-outline',
    '만족': 'emoticon-happy-outline',
    '사랑': 'heart-outline',
    '뿌듯함': 'arm-flex-outline',
    '편안함': 'emoticon-outline',
    '신남': 'party-popper',
  };
  return iconMap[emotion] || 'emoticon-outline';
};

export const getEmotionWeather = (emotion: string) => {
  const weatherMap: {[key: string]: {icon: string, temp: number, desc: string}} = {
    '행복': { icon: '☀️', temp: 28, desc: '화창' },
    '기쁨': { icon: '🌤️', temp: 25, desc: '맑음' },
    '평온': { icon: '⛅', temp: 20, desc: '구름조금' },
    '설렘': { icon: '🌈', temp: 26, desc: '무지개' },
    '감사': { icon: '🌟', temp: 24, desc: '빛남' },
    '만족': { icon: '☀️', temp: 23, desc: '쾌청' },
    '사랑': { icon: '💫', temp: 27, desc: '찬란' },
    '뿌듯함': { icon: '✨', temp: 25, desc: '반짝' },
    '편안함': { icon: '🌤️', temp: 22, desc: '포근' },
    '신남': { icon: '⚡', temp: 29, desc: '활력' },
    '불안': { icon: '🌧️', temp: 15, desc: '비' },
    '슬픔': { icon: '☁️', temp: 12, desc: '흐림' },
    '우울': { icon: '🌫️', temp: 10, desc: '안개' },
    '분노': { icon: '⛈️', temp: 8, desc: '폭우' },
    '후회': { icon: '🌧️', temp: 13, desc: '이슬비' },
    '외로움': { icon: '🌑', temp: 11, desc: '어두움' },
    '피곤': { icon: '☁️', temp: 14, desc: '잔뜩흐림' },
    '스트레스': { icon: '⛈️', temp: 9, desc: '천둥번개' },
  };
  return weatherMap[emotion] || { icon: '⛅', temp: 20, desc: '평온' };
};

export const getAverageEmotionTemp = (emotions: any[]) => {
  if (emotions.length === 0) return 18;
  const totalTemp = emotions.reduce((sum, item) => {
    const weather = getEmotionWeather(item.emotion);
    return sum + weather.temp;
  }, 0);
  return Math.round(totalTemp / emotions.length);
};

export const getTempMessage = (temp: number, period: 'week' | 'month' | 'year' = 'week') => {
  const periodText = period === 'week' ? '한 주' : period === 'month' ? '한 달' : '한 해';

  if (temp >= 25) return `따뜻하고 행복한 ${periodText}였어요 ☀️`;
  if (temp >= 20) return `적당히 포근한 ${periodText}였어요 🌤️`;
  if (temp >= 15) return `약간 서늘한 ${periodText}였네요 ⛅`;
  if (temp >= 10) return `쌀쌀한 ${periodText}였어요 ☁️`;
  return `힘든 ${periodText}였네요. 응원합니다 🌧️`;
};

export const getEmotionTreeStage = (consecutiveDays: number): EmotionTreeStage => {
  const treeStages: EmotionTreeStage[] = [
    {
      stage: 1,
      name: '씨앗',
      emoji: '🌱',
      description: '당신의 감정 씨앗이 싹트고 있어요',
      minDays: 0
    },
    {
      stage: 2,
      name: '새싹',
      emoji: '🌿',
      description: '감정을 표현하는 용기가 자라나고 있어요',
      minDays: 7
    },
    {
      stage: 3,
      name: '나무',
      emoji: '🌳',
      description: '당신의 감정이 단단한 나무가 되었어요',
      minDays: 30
    },
    {
      stage: 4,
      name: '꽃피는 나무',
      emoji: '🌸',
      description: '이제 당신의 감정이 다른 사람에게도 위로가 되고 있어요',
      minDays: 90
    },
    {
      stage: 5,
      name: '숲',
      emoji: '🌲',
      description: '당신은 다른 사람들에게 쉼터가 되어주고 있어요',
      minDays: 180
    }
  ];

  // 역순으로 체크 (가장 높은 단계부터)
  for (let i = treeStages.length - 1; i >= 0; i--) {
    if (consecutiveDays >= treeStages[i].minDays) {
      return treeStages[i];
    }
  }

  return treeStages[0];
};

export const checkEmotionBadges = (data: {
  emotionCount: number;
  consecutiveDays: number;
  totalPosts: number;
  hasComplexEmotion: boolean;
}) => {
  const badges: Array<{name: string, icon: string, desc: string}> = [];

  if (data.emotionCount >= 5) {
    badges.push({
      name: '감정 탐험가',
      icon: '🏆',
      desc: `${data.emotionCount}가지 감정 기록`
    });
  }

  if (data.consecutiveDays >= 5) {
    badges.push({
      name: '꾸준한 기록자',
      icon: '⭐',
      desc: `${data.consecutiveDays}일 연속 기록`
    });
  }

  if (data.totalPosts >= 10) {
    badges.push({
      name: '열정적 작가',
      icon: '📝',
      desc: `${data.totalPosts}개 게시물 작성`
    });
  }

  if (data.hasComplexEmotion) {
    badges.push({
      name: '자기성찰가',
      icon: '🎯',
      desc: '복합적 감정 표현'
    });
  }

  return badges;
};
