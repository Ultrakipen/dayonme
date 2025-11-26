// src/components/common/EmptyState.tsx
// 데이터가 없을 때 표시하는 빈 상태 UI 컴포넌트
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../../contexts/ModernThemeContext';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
  style?: ViewStyle;
  iconSize?: number;
  iconColor?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title,
  description,
  actionButton,
  style,
  iconSize = 64,
  iconColor,
}) => {
  const { colors, isDark } = useModernTheme();

  const defaultIconColor = iconColor || (isDark ? '#6B7280' : '#9CA3AF');

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${description || ''}`}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={defaultIconColor}
        />
      </View>

      <Text
        style={[
          styles.title,
          { color: isDark ? '#F3F4F6' : '#1F2937' }
        ]}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={[
            styles.description,
            { color: isDark ? '#9CA3AF' : '#6B7280' }
          ]}
        >
          {description}
        </Text>
      )}

      {actionButton && (
        <View style={styles.actionContainer}>
          {actionButton}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
  },
  iconContainer: {
    marginBottom: 16,
    opacity: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: 20,
  },
});

// 프리셋 타입 정의
export type EmptyStatePreset =
  | 'posts'
  | 'comments'
  | 'notifications'
  | 'search'
  | 'bookmarks'
  | 'challenges'
  | 'messages'
  | 'network';

// 프리셋 설정
const presets: Record<EmptyStatePreset, { icon: string; title: string; description: string }> = {
  posts: {
    icon: 'post-outline',
    title: '게시물이 없습니다',
    description: '아직 작성된 게시물이 없어요. 첫 번째 게시물을 작성해 보세요!',
  },
  comments: {
    icon: 'comment-outline',
    title: '댓글이 없습니다',
    description: '아직 댓글이 없어요. 첫 번째 댓글을 남겨보세요!',
  },
  notifications: {
    icon: 'bell-outline',
    title: '알림이 없습니다',
    description: '새로운 알림이 도착하면 여기에 표시됩니다.',
  },
  search: {
    icon: 'magnify',
    title: '검색 결과가 없습니다',
    description: '다른 키워드로 검색해 보세요.',
  },
  bookmarks: {
    icon: 'bookmark-outline',
    title: '저장된 항목이 없습니다',
    description: '마음에 드는 게시물을 저장해 보세요.',
  },
  challenges: {
    icon: 'trophy-outline',
    title: '참여 중인 챌린지가 없습니다',
    description: '새로운 챌린지에 참여해 보세요!',
  },
  messages: {
    icon: 'message-outline',
    title: '메시지가 없습니다',
    description: '받은 메시지가 여기에 표시됩니다.',
  },
  network: {
    icon: 'wifi-off',
    title: '네트워크 연결 없음',
    description: '인터넷 연결을 확인해 주세요.',
  },
};

// 프리셋 기반 EmptyState 컴포넌트
interface PresetEmptyStateProps {
  preset: EmptyStatePreset;
  actionButton?: React.ReactNode;
  style?: ViewStyle;
}

export const PresetEmptyState: React.FC<PresetEmptyStateProps> = ({
  preset,
  actionButton,
  style,
}) => {
  const config = presets[preset];

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      actionButton={actionButton}
      style={style}
    />
  );
};

export default EmptyState;
