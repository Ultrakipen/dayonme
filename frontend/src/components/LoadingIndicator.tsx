// src/components/LoadingIndicator.tsx
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Text, Center } from './ui';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  testID?: string;
  accessibilityLabel?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  color = '#4A90E2',
  text = '로딩 중...',
  testID = 'loading-indicator',
  accessibilityLabel = '콘텐츠 로딩 중입니다'
}) => {
  return (
    <Center
      className="flex-1 p-5"
      testID={testID}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator
        size={size}
        color={color}
        accessibilityElementsHidden={true}
      />
      {text && (
        <Text
          className="mt-2 text-base text-gray-600"
          accessibilityElementsHidden={true}
        >
          {text}
        </Text>
      )}
    </Center>
  );
};

export default LoadingIndicator;