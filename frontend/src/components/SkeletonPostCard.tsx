// src/components/SkeletonPostCard.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalizeSpace, normalize } from '../utils/responsive';

const SkeletonPostCard = () => {
  const { isDark } = useModernTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.card}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { opacity, backgroundColor: skeletonColor }]} />
        <View style={{ flex: 1 }}>
          <Animated.View style={[styles.titleLine, { opacity, backgroundColor: skeletonColor }]} />
          <Animated.View style={[styles.subtitleLine, { opacity, backgroundColor: skeletonColor }]} />
        </View>
      </View>

      {/* 본문 */}
      <View style={styles.content}>
        <Animated.View style={[styles.textLine, { opacity, backgroundColor: skeletonColor }]} />
        <Animated.View style={[styles.textLine, { width: '80%', opacity, backgroundColor: skeletonColor }]} />
      </View>

      {/* 이미지 */}
      <Animated.View style={[styles.image, { opacity, backgroundColor: skeletonColor }]} />

      {/* 액션 버튼 */}
      <View style={styles.actions}>
        <Animated.View style={[styles.actionButton, { opacity, backgroundColor: skeletonColor }]} />
        <Animated.View style={[styles.actionButton, { opacity, backgroundColor: skeletonColor }]} />
        <Animated.View style={[styles.actionButton, { opacity, backgroundColor: skeletonColor }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: normalizeSpace(16),
    marginBottom: normalizeSpace(12),
    gap: normalizeSpace(12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalizeSpace(12),
  },
  avatar: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
  },
  titleLine: {
    width: '60%',
    height: normalize(14),
    borderRadius: normalize(4),
    marginBottom: normalizeSpace(6),
  },
  subtitleLine: {
    width: '40%',
    height: normalize(12),
    borderRadius: normalize(4),
  },
  content: {
    gap: normalizeSpace(8),
  },
  textLine: {
    width: '100%',
    height: normalize(12),
    borderRadius: normalize(4),
  },
  image: {
    width: '100%',
    height: normalize(200),
    borderRadius: normalize(12),
  },
  actions: {
    flexDirection: 'row',
    gap: normalizeSpace(12),
  },
  actionButton: {
    width: normalize(60),
    height: normalize(32),
    borderRadius: normalize(8),
  },
});

export default SkeletonPostCard;
