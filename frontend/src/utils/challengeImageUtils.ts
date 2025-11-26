// 챌린지 이미지 업로드 및 처리 유틸리티

export interface ImagePickerResult {
  uri: string;
  type: string;
  name: string;
  size: number;
}

// 기본 챌린지 이미지 템플릿
export const defaultChallengeImages = [
  {
    id: 1,
    name: '목표 달성',
    gradient: ['#667eea', '#764ba2'],
    icon: 'trophy',
    category: '목표달성'
  },
  {
    id: 2,
    name: '건강 챌린지',
    gradient: ['#11998e', '#38ef7d'],
    icon: 'heart-pulse',
    category: '건강'
  },
  {
    id: 3,
    name: '학습 챌린지',
    gradient: ['#fc466b', '#3f5efb'],
    icon: 'book-open-variant',
    category: '학습'
  },
  {
    id: 4,
    name: '감정 관리',
    gradient: ['#fa709a', '#fee140'],
    icon: 'emoticon-happy',
    category: '감정관리'
  },
  {
    id: 5,
    name: '습관 형성',
    gradient: ['#a8edea', '#fed6e3'],
    icon: 'repeat',
    category: '습관'
  },
  {
    id: 6,
    name: '창작 활동',
    gradient: ['#ff9a9e', '#fecfef'],
    icon: 'palette',
    category: '취미'
  },
  {
    id: 7,
    name: '운동 챌린지',
    gradient: ['#667eea', '#764ba2'],
    icon: 'run',
    category: '운동'
  },
  {
    id: 8,
    name: '독서 챌린지',
    gradient: ['#fc4a1a', '#f7b733'],
    icon: 'book-open',
    category: '독서'
  },
  {
    id: 9,
    name: '명상 챌린지',
    gradient: ['#b2fefa', '#0ed2f7'],
    icon: 'meditation',
    category: '명상'
  },
  {
    id: 10,
    name: '소셜 챌린지',
    gradient: ['#f093fb', '#f5576c'],
    icon: 'account-group',
    category: '소셜'
  },
];

// 카테고리별 색상 매핑
export const getCategoryColor = (category: string): string[] => {
  const colorMap: { [key: string]: string[] } = {
    '감정관리': ['#fa709a', '#fee140'],
    '건강': ['#11998e', '#38ef7d'],
    '학습': ['#fc466b', '#3f5efb'],
    '습관': ['#a8edea', '#fed6e3'],
    '취미': ['#ff9a9e', '#fecfef'],
    '운동': ['#667eea', '#764ba2'],
    '독서': ['#fc4a1a', '#f7b733'],
    '명상': ['#b2fefa', '#0ed2f7'],
    '소셜': ['#f093fb', '#f5576c'],
    '목표달성': ['#4facfe', '#00f2fe'],
  };

  return colorMap[category] || ['#667eea', '#764ba2'];
};

// 카테고리별 아이콘 매핑
export const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    '감정관리': 'emoticon-happy',
    '건강': 'heart-pulse',
    '학습': 'book-open-variant',
    '습관': 'repeat',
    '취미': 'palette',
    '운동': 'run',
    '독서': 'book-open',
    '명상': 'meditation',
    '소셜': 'account-group',
    '목표달성': 'trophy',
  };

  return iconMap[category] || 'trophy';
};

// 이미지 타입별 처리
export interface ChallengeImageData {
  type: 'template' | 'custom';
  templateId?: number;
  customUri?: string;
  gradient?: string[];
  icon?: string;
  category?: string;
}

// 템플릿 이미지 선택
export const selectTemplateImage = (templateId: number): ChallengeImageData | null => {
  const template = defaultChallengeImages.find(img => img.id === templateId);
  if (!template) return null;

  return {
    type: 'template',
    templateId: template.id,
    gradient: template.gradient,
    icon: template.icon,
    category: template.category,
  };
};

// 카테고리별 추천 템플릿 가져오기
export const getRecommendedTemplates = (category: string) => {
  return defaultChallengeImages.filter(template =>
    template.category === category ||
    template.name.toLowerCase().includes(category.toLowerCase())
  );
};

// 이미지 데이터를 서버 전송용 형태로 변환
export const prepareImageDataForUpload = (imageData: ChallengeImageData) => {
  if (imageData.type === 'template') {
    return {
      image_type: 'template',
      template_id: imageData.templateId,
      category: imageData.category,
    };
  } else {
    return {
      image_type: 'custom',
      image_uri: imageData.customUri,
    };
  }
};

export default {
  defaultChallengeImages,
  getCategoryColor,
  getCategoryIcon,
  selectTemplateImage,
  getRecommendedTemplates,
  prepareImageDataForUpload,
};