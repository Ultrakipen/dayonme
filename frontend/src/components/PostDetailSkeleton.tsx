// components/PostDetailSkeleton.tsx
// 게시물 상세 로딩 Skeleton UI
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalize, normalizeSpace, normalizeIcon } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostDetailSkeletonProps {
  showComments?: boolean;
}

const PostDetailSkeleton: React.FC<PostDetailSkeletonProps> = ({ showComments = true }) => {
  const { theme: modernTheme, isDark } = useModernTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    skeleton: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    shimmer: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    background: modernTheme.bg.primary,
    card: modernTheme.bg.card,
  };

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* 프로필 영역 */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.avatar,
              { backgroundColor: colors.skeleton },
              shimmerStyle,
            ]}
          />
          <View style={styles.headerText}>
            <Animated.View
              style={[
                styles.nameSkeleton,
                { backgroundColor: colors.skeleton },
                shimmerStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.dateSkeleton,
                { backgroundColor: colors.skeleton },
                shimmerStyle,
              ]}
            />
          </View>
        </View>

        {/* 제목 Skeleton */}
        <Animated.View
          style={[
            styles.titleSkeleton,
            { backgroundColor: colors.skeleton },
            shimmerStyle,
          ]}
        />

        {/* 본문 Skeleton */}
        <View style={styles.contentContainer}>
          <Animated.View
            style={[
              styles.contentLine,
              { backgroundColor: colors.skeleton, width: '100%' },
              shimmerStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.contentLine,
              { backgroundColor: colors.skeleton, width: '95%' },
              shimmerStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.contentLine,
              { backgroundColor: colors.skeleton, width: '88%' },
              shimmerStyle,
            ]}
          />
        </View>

        {/* 이미지 Skeleton */}
        <Animated.View
          style={[
            styles.imageSkeleton,
            { backgroundColor: colors.skeleton },
            shimmerStyle,
          ]}
        />

        {/* 액션 버튼 Skeleton */}
        <View style={styles.actions}>
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: colors.skeleton },
              shimmerStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: colors.skeleton },
              shimmerStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: colors.skeleton },
              shimmerStyle,
            ]}
          />
        </View>

        {/* 좋아요/댓글 수 Skeleton */}
        <View style={styles.stats}>
          <Animated.View
            style={[
              styles.statSkeleton,
              { backgroundColor: colors.skeleton },
              shimmerStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.statSkeleton,
              { backgroundColor: colors.skeleton },
              shimmerStyle,
            ]}
          />
        </View>
      </View>

      {/* 댓글 Skeleton */}
      {showComments && (
        <View style={[styles.commentsContainer, { backgroundColor: colors.card }]}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.commentItem}>
              <Animated.View
                style={[
                  styles.commentAvatar,
                  { backgroundColor: colors.skeleton },
                  shimmerStyle,
                ]}
              />
              <View style={styles.commentContent}>
                <Animated.View
                  style={[
                    styles.commentName,
                    { backgroundColor: colors.skeleton },
                    shimmerStyle,
                  ]}
                />
                <Animated.View
                  style={[
                    styles.commentText,
                    { backgroundColor: colors.skeleton },
                    shimmerStyle,
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: normalizeSpace(8),
  },
  card: {
    margin: normalizeSpace(16),
    borderRadius: normalizeSpace(16),
    padding: normalizeSpace(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalizeSpace(16),
  },
  avatar: {
    width: normalizeIcon(48),
    height: normalizeIcon(48),
    borderRadius: normalizeIcon(24),
  },
  headerText: {
    marginLeft: normalizeSpace(12),
    flex: 1,
  },
  nameSkeleton: {
    width: '40%',
    height: normalize(14),
    borderRadius: normalizeSpace(4),
    marginBottom: normalizeSpace(8),
  },
  dateSkeleton: {
    width: '25%',
    height: normalize(12),
    borderRadius: normalizeSpace(4),
  },
  titleSkeleton: {
    width: '70%',
    height: normalize(18),
    borderRadius: normalizeSpace(4),
    marginBottom: normalizeSpace(12),
  },
  contentContainer: {
    marginBottom: normalizeSpace(16),
  },
  contentLine: {
    height: normalize(14),
    borderRadius: normalizeSpace(4),
    marginBottom: normalizeSpace(8),
  },
  imageSkeleton: {
    width: '100%',
    height: SCREEN_WIDTH * 0.6,
    borderRadius: normalizeSpace(12),
    marginBottom: normalizeSpace(16),
  },
  actions: {
    flexDirection: 'row',
    marginBottom: normalizeSpace(12),
  },
  actionButton: {
    width: normalizeIcon(32),
    height: normalizeIcon(32),
    borderRadius: normalizeIcon(16),
    marginRight: normalizeSpace(12),
  },
  stats: {
    flexDirection: 'row',
  },
  statSkeleton: {
    width: '20%',
    height: normalize(12),
    borderRadius: normalizeSpace(4),
    marginRight: normalizeSpace(16),
  },
  commentsContainer: {
    margin: normalizeSpace(16),
    marginTop: 0,
    borderRadius: normalizeSpace(16),
    padding: normalizeSpace(16),
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: normalizeSpace(16),
  },
  commentAvatar: {
    width: normalizeIcon(32),
    height: normalizeIcon(32),
    borderRadius: normalizeIcon(16),
  },
  commentContent: {
    marginLeft: normalizeSpace(12),
    flex: 1,
  },
  commentName: {
    width: '30%',
    height: normalize(12),
    borderRadius: normalizeSpace(4),
    marginBottom: normalizeSpace(8),
  },
  commentText: {
    width: '90%',
    height: normalize(14),
    borderRadius: normalizeSpace(4),
  },
});

export default PostDetailSkeleton;
