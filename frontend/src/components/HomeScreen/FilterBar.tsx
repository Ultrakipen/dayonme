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
    cardBackground: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
    text: isDark ? '#f3f4f6' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb',
    primary: isDark ? '#8B5CF6' : '#8B5CF6',
  };

  return (
    <Box style={{ marginBottom: 2, marginTop: 2 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 2 }}
      >
        <HStack style={{ gap: 6 }}>
          {localEmotions.map(emotion => (
            <Pressable
              key={emotion.label}
              onPress={() => onEmotionChange(selectedEmotion === emotion.label ? '' : emotion.label)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: selectedEmotion === emotion.label
                  ? (isDark ? emotion.color + '25' : emotion.color + '15')
                  : colors.cardBackground,
                borderWidth: selectedEmotion === emotion.label ? 1 : 1,
                borderColor: selectedEmotion === emotion.label ? emotion.color : colors.border,
                minHeight: 32,
                shadowColor: selectedEmotion === emotion.label ? emotion.color : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: selectedEmotion === emotion.label ? 0.25 : 0,
                shadowRadius: 4,
                elevation: selectedEmotion === emotion.label ? 2 : 0,
              }}
            >
              <Text style={{
                color: selectedEmotion === emotion.label
                  ? (isDark ? emotion.color : emotion.color)
                  : colors.text,
                fontWeight: selectedEmotion === emotion.label ? '700' : '600',
                fontSize: 13
              }}>
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
