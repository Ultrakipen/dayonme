// 텍스트 길이 최적화 함수 - 단어 단위로 자르기
export const optimizeTextLength = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  // 단어 단위로 자르기
  const truncated = text.substring(0, maxLength - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  // 공백을 찾았고, 전체 길이의 80% 이상이면 단어 단위로 자르기
  if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  // 그렇지 않으면 기존 방식
  return truncated + '...';
};

// 7줄 제한을 위한 텍스트 자르기 함수
export const truncateToSevenLines = (text: string) => {
  if (!text) return '';

  // 폰트 크기 16px, 라인 높이 24px에 맞게 조정
  // 한 줄당 35-40자 정도로 계산 (더 큰 폰트 고려)
  // 7줄 * 38자 = 266자로 제한
  const maxChars = 266;

  if (text.length <= maxChars) {
    return text;
  }

  // 266자에서 자르고 마지막 단어 경계 찾기
  const truncated = text.substring(0, maxChars - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  // 단어 경계에서 자르기
  if (lastSpaceIndex > maxChars * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
};
