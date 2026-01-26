import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useModernTheme } from '../../hooks/useModernTheme';
import { FONT_SIZES } from '../../constants';
import { getScale } from '../../utils/responsive';

interface SectionErrorProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

interface SectionLoadingProps {
  size?: 'small' | 'large';
  message?: string;
}

// 섹션 에러 컴포넌트
export const SectionError: React.FC<SectionErrorProps> = React.memo(({
  message = '데이터를 불러오는데 실패했습니다',
  onRetry,
  showRetry = true,
}) => {
  const { colors } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);

  return (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorIcon, { fontSize: 32 * scale }]}>⚠️</Text>
      <Text style={[styles.errorText, { color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }]}>
        {message}
      </Text>
      {showRetry && onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryButton, { borderColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="다시 시도"
        >
          <Text style={[styles.retryText, { color: colors.primary, fontSize: FONT_SIZES.body * scale }]}>
            다시 시도
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// 섹션 로딩 컴포넌트
export const SectionLoading: React.FC<SectionLoadingProps> = React.memo(({
  size = 'small',
  message,
}) => {
  const { colors } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
          {message}
        </Text>
      )}
    </View>
  );
});

// 빈 상태 컴포넌트
interface SectionEmptyProps {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionEmpty: React.FC<SectionEmptyProps> = React.memo(({
  icon = '📭',
  title = '데이터가 없습니다',
  message,
  actionLabel,
  onAction,
}) => {
  const { colors } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { fontSize: 40 * scale }]}>{icon}</Text>
      <Text style={[styles.emptyTitle, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>
        {title}
      </Text>
      {message && (
        <Text style={[styles.emptyMessage, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={[styles.actionText, { fontSize: FONT_SIZES.body * scale }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 4,
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },
});
