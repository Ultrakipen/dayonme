// components/HomeScreen/EmptyState.tsx
import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text, VStack, Center } from '../ui';

interface EmptyStateProps {
  isDark: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isDark }) => {
  const colors = {
    textSecondary: isDark ? '#b0b0b0' : '#4b5563',
    textTertiary: isDark ? '#8a8a8a' : '#6b7280',
  };

  return (
    <Center className="py-20">
      <VStack className="items-center space-y-4">
        <MaterialCommunityIcons
          name="emoticon-sad-outline"
          size={80}
          color={colors.textTertiary}
        />
        <Text
          className="text-center"
          style={{ color: colors.textSecondary, fontSize: 16, fontFamily: 'Pretendard-SemiBold' }}
        >
          아직 게시물이 없습니다
        </Text>
        <Text
          className="text-center px-4"
          style={{ color: colors.textTertiary, fontSize: 14 }}
        >
          첫 번째 게시물을 작성해보세요!
        </Text>
      </VStack>
    </Center>
  );
};

export default React.memo(EmptyState);
