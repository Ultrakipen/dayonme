// 감정 아이콘 수정 패치
// 영어 아이콘 이름을 MaterialCommunityIcons로 변환하는 유틸리티

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import React from 'react';

// 감정 아이콘 매핑 (기존 영어 이름 -> 올바른 아이콘 이름)
const emotionIconMap: { [key: string]: string } = {
  'heart': 'heart',
  'emoticon-frown': 'emoticon-frown',
  'emoticon-outline': 'emoticon-outline',
  'emoticon-happy': 'emoticon-happy',
  'emoticon-excited': 'emoticon-excited',
  'emoticon-angry': 'emoticon-angry',
  'emoticon-confused': 'emoticon-confused',
  'emoticon-sad': 'emoticon-sad',
  'heart-multiple': 'heart-multiple',
  'emoticon-neutral': 'emoticon-neutral',
  'emoticon-dead': 'emoticon-dead',
  'emoticon-devil': 'emoticon-devil',
  'emoticon-cry': 'emoticon-cry',
  'emoticon-cool': 'emoticon-cool',
  'emoticon-kiss': 'emoticon-kiss',
  'emoticon-wink': 'emoticon-wink',
  'emoticon-tongue': 'emoticon-tongue',
  'medical-bag': 'medical-bag',
  'star': 'star',
  // 추가 매핑이 필요한 경우 여기에 추가
};

// 감정 아이콘 컴포넌트
export const EmotionIcon: React.FC<{
  name: string;
  size: number;
  color: string;
}> = ({ name, size, color }) => {
  const iconName = emotionIconMap[name] || name;

  return (
    <MaterialCommunityIcons
      name={iconName as any}
      size={size}
      color={color}
    />
  );
};

// 감정 이름이 올바른 아이콘 이름인지 확인
export const isValidEmotionIcon = (iconName: string): boolean => {
  return iconName in emotionIconMap;
};

// 아이콘 이름 정규화
export const normalizeEmotionIcon = (iconName: string): string => {
  return emotionIconMap[iconName] || iconName;
};

export default {
  EmotionIcon,
  isValidEmotionIcon,
  normalizeEmotionIcon,
  emotionIconMap
};