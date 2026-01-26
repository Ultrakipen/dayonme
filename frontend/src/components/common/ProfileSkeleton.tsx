import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useModernTheme } from '../../contexts/ModernThemeContext';

const ProfileSkeleton: React.FC = () => {
  const { isDark, theme } = useModernTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
  const shimmerColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 헤더 Skeleton */}
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <Animated.View
          style={[
            styles.profileImageSkeleton,
            { backgroundColor: skeletonColor, opacity: shimmerOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.nameSkeleton,
            { backgroundColor: skeletonColor, opacity: shimmerOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.emailSkeleton,
            { backgroundColor: skeletonColor, opacity: shimmerOpacity },
          ]}
        />
      </View>

      {/* 통계 Skeleton */}
      <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.statItem}>
            <Animated.View
              style={[
                styles.statNumberSkeleton,
                { backgroundColor: skeletonColor, opacity: shimmerOpacity },
              ]}
            />
            <Animated.View
              style={[
                styles.statLabelSkeleton,
                { backgroundColor: skeletonColor, opacity: shimmerOpacity },
              ]}
            />
          </View>
        ))}
      </View>

      {/* 카드 Skeleton */}
      {[1, 2, 3].map((item) => (
        <View
          key={item}
          style={[styles.cardSkeleton, { backgroundColor: theme.colors.card }]}
        >
          <Animated.View
            style={[
              styles.cardTitleSkeleton,
              { backgroundColor: skeletonColor, opacity: shimmerOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.cardContentSkeleton,
              { backgroundColor: skeletonColor, opacity: shimmerOpacity },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  nameSkeleton: {
    width: 120,
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  emailSkeleton: {
    width: 160,
    height: 16,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumberSkeleton: {
    width: 40,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  statLabelSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 7,
  },
  cardSkeleton: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitleSkeleton: {
    width: 100,
    height: 20,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardContentSkeleton: {
    width: '100%',
    height: 80,
    borderRadius: 12,
  },
});

export default ProfileSkeleton;
