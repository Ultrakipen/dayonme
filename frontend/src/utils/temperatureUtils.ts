/**
 * 감정 온도 관련 유틸 함수
 * PersonalTemperature, CommunityTemperature 등에서 공통으로 사용
 */

/**
 * 개인 감정 온도 색상
 */
export const getPersonalTempColor = (temp: number): string => {
  if (temp >= 37.2) return '#FF6B6B'; // 매우 따뜻함 (미열)
  if (temp >= 36.8) return '#FFA500'; // 따뜻함
  if (temp >= 36.3) return '#52C41A'; // 정상 (36.5 기준)
  if (temp >= 35.8) return '#87CEEB'; // 조금 낮음
  return '#6B7280'; // 낮음 (저체온)
};

/**
 * 개인 감정 온도 텍스트
 */
export const getPersonalTempText = (temp: number): string => {
  if (temp >= 37.2) return '매우 따뜻함';
  if (temp >= 36.8) return '따뜻함';
  if (temp >= 36.3) return '정상';
  if (temp >= 35.8) return '조금 낮음';
  return '낮음';
};

/**
 * 개인 감정 온도 아이콘
 */
export const getPersonalTempIcon = (temp: number): string => {
  if (temp >= 37.2) return '🔥';
  if (temp >= 36.8) return '😊';
  if (temp >= 36.3) return '😌';
  if (temp >= 35.8) return '😐';
  return '😔';
};

/**
 * 커뮤니티 감정 온도 색상
 */
export const getCommunityTempColor = (temp: number): string => {
  if (temp >= 38.5) return '#FF6B6B'; // 뜨거움
  if (temp >= 37.5) return '#FFA500'; // 따뜻함
  if (temp >= 36.5) return '#52C41A'; // 정상
  if (temp >= 35.0) return '#87CEEB'; // 조금 낮음
  return '#4682B4'; // 차가움
};

/**
 * 커뮤니티 감정 온도 텍스트
 */
export const getCommunityTempText = (temp: number): string => {
  if (temp >= 38.5) return '뜨거움';
  if (temp >= 37.5) return '따뜻함';
  if (temp >= 36.5) return '정상';
  if (temp >= 35.0) return '조금 낮음';
  return '차가움';
};

/**
 * 커뮤니티 감정 온도 아이콘
 */
export const getCommunityTempIcon = (temp: number): string => {
  if (temp >= 38.5) return '☀️';
  if (temp >= 37.5) return '🌤️';
  if (temp >= 36.5) return '☁️';
  if (temp >= 35.0) return '🌥️';
  return '🌧️';
};
