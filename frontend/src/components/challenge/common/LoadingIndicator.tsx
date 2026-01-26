import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { CHALLENGE_COLORS } from '../../../constants/challenge';

interface LoadingIndicatorProps {
  message?: string;
  isDarkMode?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = '로딩 중...',
  isDarkMode = false
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={CHALLENGE_COLORS.primary} />
      {message && (
        <Text style={[
          styles.message,
          { color: isDarkMode ? CHALLENGE_COLORS.darkTextSecondary : CHALLENGE_COLORS.textSecondary }
        ]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
  },
});
