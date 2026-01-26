// screens/ErrorScreen.tsx
// 네트워크/서버 오류 시 표시되는 사용자 친화적인 에러 화면
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { scale, verticalScale, moderateScale } from '../constants/responsive';
import { FONT_FAMILY } from '../constants/typography';

interface ErrorScreenProps {
  type: 'network' | 'server' | 'unknown';
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({
  type,
  message,
  onRetry,
  onGoHome,
}) => {
  const { isDark } = useModernTheme();

  const getErrorContent = () => {
    switch (type) {
      case 'network':
        return {
          title: '인터넷 연결을 확인해주세요',
          description: '네트워크 연결이 불안정합니다.\nWi-Fi나 데이터 연결을 확인해주세요.',
          emoji: '📡',
        };
      case 'server':
        return {
          title: '서버에 연결할 수 없습니다',
          description: '일시적인 서버 오류입니다.\n잠시 후 다시 시도해주세요.',
          emoji: '🔧',
        };
      default:
        return {
          title: '알 수 없는 오류가 발생했습니다',
          description: message || '잠시 후 다시 시도해주세요.',
          emoji: '⚠️',
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
      <View style={styles.content}>
        {/* 에러 아이콘 */}
        <Text style={styles.emoji}>{errorContent.emoji}</Text>

        {/* 에러 제목 */}
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          {errorContent.title}
        </Text>

        {/* 에러 설명 */}
        <Text style={[styles.description, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          {errorContent.description}
        </Text>

        {/* 액션 버튼들 */}
        <View style={styles.actions}>
          {onRetry && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          )}

          {onGoHome && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, {
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }]}
              onPress={onGoHome}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, {
                color: isDark ? '#ffffff' : '#000000'
              }]}>
                홈으로 가기
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  content: {
    alignItems: 'center',
    maxWidth: scale(400),
  },
  emoji: {
    fontSize: moderateScale(64),
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: moderateScale(20),
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  description: {
    fontSize: moderateScale(15),
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(32),
  },
  actions: {
    width: '100%',
    gap: verticalScale(12),
  },
  button: {
    width: '100%',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(24),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#405DE6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(16),
    fontFamily: FONT_FAMILY.semiBold,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: moderateScale(16),
    fontFamily: FONT_FAMILY.semiBold,
  },
});

export default ErrorScreen;
