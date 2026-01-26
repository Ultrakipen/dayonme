// components/HomeScreen/FilterBar.tsx
import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Text, Pressable, HStack } from '../ui';
import { localEmotions } from '../../constants/homeEmotions';

interface FilterBarProps {
  selectedEmotion: string;
  onEmotionChange: (emotion: string) => void;
  isDark: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedEmotion,
  onEmotionChange,
  isDark
}) => {
  const colors = {
    background: isDark ? '#1a1a1a' : '#f8fafc',
    cardBackground: isDark ? '#2d2d2d' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#b0b0b0' : '#4b5563',
    border: isDark ? '#404040' : '#e5e7eb',
    primary: isDark ? '#60a5fa' : '#2563eb',
  };

  return (
    <Box style={{ marginBottom: 2 }}>
      {/* 감정 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 1 }}
      >
        <HStack style={{ gap: 6 }}>
          <Pressable
            onPress={() => onEmotionChange('전체')}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: selectedEmotion === '전체' ? colors.primary : colors.cardBackground,
              borderWidth: 1,
              borderColor: selectedEmotion === '전체' ? colors.primary : colors.border,
              minHeight: 30,
            }}
          >
            <Text style={{ color: selectedEmotion === '전체' ? '#fff' : colors.text, fontFamily: 'Pretendard-SemiBold', fontSize: 13 }}>
              전체
            </Text>
          </Pressable>
          {localEmotions.map(emotion => (
            <Pressable
              key={emotion.label}
              onPress={() => onEmotionChange(emotion.label)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                backgroundColor: selectedEmotion === emotion.label ? emotion.color + '20' : colors.cardBackground,
                borderWidth: 1,
                borderColor: selectedEmotion === emotion.label ? emotion.color : colors.border,
                minHeight: 30,
              }}
            >
              <Text style={{ color: selectedEmotion === emotion.label ? emotion.color : colors.text, fontFamily: 'Pretendard-SemiBold', fontSize: 13 }}>
                {emotion.label}
              </Text>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
    </Box>
  );
};

export default React.memo(FilterBar);
