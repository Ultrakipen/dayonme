// components/HomeScreen/FilterBar.tsx
import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Text, Pressable, HStack } from '../ui';
import { localEmotions } from '../../constants/homeEmotions';
import { useModernTheme } from '../../contexts/ModernThemeContext';

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
  const { theme } = useModernTheme();
  const colors = theme.colors;

  return (
    <Box className="mb-1">
      {/* 감정 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 2 }}
      >
        <HStack style={{ gap: 10 }}>
          <Pressable
            onPress={() => onEmotionChange('전체')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: selectedEmotion === '전체' ? colors.accent : colors.card,
              borderWidth: 1,
              borderColor: selectedEmotion === '전체' ? colors.accent : colors.border,
              minHeight: 36,
            }}
          >
            <Text style={{ color: selectedEmotion === '전체' ? colors.onAccent : colors.text.primary, fontWeight: '600', fontSize: 14 }}>
              전체
            </Text>
          </Pressable>
          {localEmotions.map(emotion => (
            <Pressable
              key={emotion.label}
              onPress={() => onEmotionChange(emotion.label)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedEmotion === emotion.label ? colors.tint : colors.card,
                borderWidth: selectedEmotion === emotion.label ? 2 : 1,
                borderColor: selectedEmotion === emotion.label ? colors.accent : colors.border,
                minHeight: 36,
              }}
            >
              <Text style={{ color: colors.text.primary, fontWeight: selectedEmotion === emotion.label ? '700' : '600', fontSize: 14 }}>
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
