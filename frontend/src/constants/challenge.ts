// 챌린지 관련 상수 정의

// 위로와 공감 페이지와 통일된 컬러 팔레트
export const CHALLENGE_COLORS = {
  primary: '#6366F1', // 위로와 공감 페이지와 동일
  secondary: '#EC4899', // 위로와 공감 페이지와 동일
  accent: '#10B981',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#FAFBFC',
  darkBackground: '#0D0D1E',
  surface: '#FFFFFF',
  darkSurface: '#1A1D29',
  text: '#1E293B',
  darkText: '#F8FAFC',
  textSecondary: '#64748B',
  darkTextSecondary: '#94A3B8',
  border: '#E2E8F0',
  darkBorder: '#334155',
  glass: 'rgba(255, 255, 255, 0.15)',
  darkGlass: 'rgba(15, 15, 30, 0.4)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  darkGlassBorder: 'rgba(255, 255, 255, 0.1)',
  gradientStart: '#667EEA',
  gradientEnd: '#764BA2',
  shadowColor: 'rgba(99, 102, 241, 0.35)'
};

// 챌린지 ID 기반 그라디언트 색상 팔레트
export const GRADIENT_PALETTES = [
  ['#667EEA', '#764BA2'], // 보라-핑크
  ['#F093FB', '#F5576C'], // 핑크-레드
  ['#4FACFE', '#00F2FE'], // 파랑-하늘
  ['#43E97B', '#38F9D7'], // 초록-민트
  ['#FA709A', '#FEE140'], // 핑크-노랑
  ['#30CFD0', '#330867'], // 민트-보라
  ['#A8EDEA', '#FED6E3'], // 민트-핑크
  ['#FF9A9E', '#FECFEF'], // 코랄-핑크
  ['#FFECD2', '#FCB69F'], // 피치-오렌지
  ['#C471F5', '#FA71CD'], // 보라-핑크
  ['#48C6EF', '#6F86D6'], // 하늘-보라
  ['#FEAC5E', '#C779D0'], // 오렌지-보라
];

/**
 * 챌린지 ID를 기반으로 그라디언트 색상 반환
 * @param challengeId - 챌린지 ID
 * @returns 그라디언트 색상 배열 [시작색, 끝색]
 */
export const getGradientColors = (challengeId: number): string[] => {
  const index = challengeId % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
};
