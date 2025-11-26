import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS } from '../../../constants/challenge';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  isDarkMode?: boolean;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  message = '오류가 발생했습니다',
  onRetry,
  isDarkMode = false
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={64}
        color={isDarkMode ? CHALLENGE_COLORS.darkTextSecondary : CHALLENGE_COLORS.textSecondary}
      />
      <Text style={[
        styles.message,
        { color: isDarkMode ? CHALLENGE_COLORS.darkText : CHALLENGE_COLORS.text }
      ]}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: CHALLENGE_COLORS.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
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
    marginBottom: 24,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
