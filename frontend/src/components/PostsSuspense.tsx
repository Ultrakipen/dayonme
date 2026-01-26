// PostsSuspense.tsx - 게시물 로딩을 위한 Suspense 대체 컴포넌트
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from './ui';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalize, hp } from '../utils/responsive';
import SkeletonPostCard from './SkeletonPostCard';

interface PostsSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PostsSuspenseFallback: React.FC = () => {
  const { theme, isDark } = useModernTheme();

  return (
    <View style={styles.container}>
      {/* 스켈레톤 카드 3개 표시 */}
      <SkeletonPostCard />
      <SkeletonPostCard />
      <SkeletonPostCard />
    </View>
  );
};

const PostsLoadingIndicator: React.FC = () => {
  const { theme, isDark } = useModernTheme();

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator
        size="large"
        color={isDark ? '#a78bfa' : '#667eea'}
      />
      <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
        게시물을 불러오는 중...
      </Text>
    </View>
  );
};

// React Native는 Suspense를 완전히 지원하지 않으므로 조건부 렌더링 사용
export const PostsSuspense: React.FC<PostsSuspenseProps> = ({
  children,
  fallback = <PostsSuspenseFallback />
}) => {
  // React Native에서는 Suspense 대신 조건부 렌더링 사용
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: normalize(16),
    paddingTop: normalize(8),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(20),
  },
  loadingText: {
    marginTop: normalize(12),
    fontSize: normalize(14),
  },
});
