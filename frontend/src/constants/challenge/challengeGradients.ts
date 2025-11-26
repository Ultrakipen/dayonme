// 챌린지 그라디언트 팔레트
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
] as const;

export const getGradientColors = (challengeId: number): string[] => {
  const index = challengeId % GRADIENT_PALETTES.length;
  return [...GRADIENT_PALETTES[index]];
};
