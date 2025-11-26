// 스켈레톤 로딩 컴포넌트 (2026년 트렌드)
// React Native 0.80 호환성: 모듈 레벨에서 normalize 호출 금지
import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { normalize, normalizeSpace, RFValue } from '../utils/responsive';

const getScreenWidth = () => {
  try {
    const w = Dimensions.get('window').width;
    if (w > 0) return w;
  } catch (e) {}
  return 360;
};

// 기본값 (런타임 전)
const DEFAULT_GRID_PADDING = 12;
const DEFAULT_COLUMN_GAP = 12;
const DEFAULT_POST_CARD_WIDTH = (360 - (DEFAULT_GRID_PADDING * 2) - DEFAULT_COLUMN_GAP) / 2;

const COLORS = {
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F8FAFC',
};

// 시머 애니메이션 효과
const ShimmerEffect = ({ width: w, height: h, borderRadius = 8, style = {} }: any) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          backgroundColor: COLORS.skeleton,
          borderRadius: normalize(borderRadius),
          opacity,
        },
        style,
      ]}
    />
  );
};

// 2열 그리드 게시물 카드 스켈레톤
export const PostCardSkeleton = () => {
  const dynamicStyles = useMemo(() => {
    const gridPadding = normalizeSpace(12);
    const columnGap = normalizeSpace(12);
    const screenWidth = getScreenWidth();
    const postCardWidth = (screenWidth - (gridPadding * 2) - columnGap) / 2;

    return {
      postCard: {
        width: postCardWidth,
        minHeight: normalize(240),
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(16),
        overflow: 'hidden' as const,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: normalizeSpace(14),
      },
      postCardContent: {
        padding: normalizeSpace(12),
      },
      footer: {
        flexDirection: 'row' as const,
        marginTop: normalizeSpace(10),
        paddingTop: normalizeSpace(10),
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
      },
    };
  }, []);

  return (
    <View style={dynamicStyles.postCard}>
      <View style={dynamicStyles.postCardContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <ShimmerEffect width={38} height={38} borderRadius={19} />
          <View style={{ flex: 1, marginLeft: normalizeSpace(10) }}>
            <ShimmerEffect width="60%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <ShimmerEffect width="40%" height={10} borderRadius={4} />
          </View>
        </View>

        {/* 제목 */}
        <ShimmerEffect width="90%" height={16} borderRadius={4} style={{ marginBottom: 8, marginTop: 10 }} />

        {/* 본문 */}
        <ShimmerEffect width="100%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
        <ShimmerEffect width="95%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
        <ShimmerEffect width="80%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />

        {/* 이미지 */}
        <ShimmerEffect width="100%" height={140} borderRadius={12} style={{ marginVertical: 8 }} />

        {/* 하단 통계 */}
        <View style={dynamicStyles.footer}>
          <ShimmerEffect width={60} height={28} borderRadius={16} />
          <ShimmerEffect width={60} height={28} borderRadius={16} style={{ marginLeft: 10 }} />
        </View>
      </View>
    </View>
  );
};

// 3열 그리드 베스트 카드 스켈레톤
export const BestCardSkeleton = ({ cardWidth }: { cardWidth: number }) => {
  const dynamicStyles = useMemo(() => ({
    bestCard: {
      width: cardWidth,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: normalizeSpace(7),
      borderWidth: 1,
      borderColor: '#E2E8F040',
      marginBottom: normalizeSpace(12),
    },
    bestCardHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: normalizeSpace(8),
    },
  }), [cardWidth]);

  return (
    <View style={dynamicStyles.bestCard}>
      <View style={dynamicStyles.bestCardHeader}>
        <ShimmerEffect width={35} height={24} borderRadius={16} />
        <ShimmerEffect width={16} height={16} borderRadius={8} />
      </View>
      <ShimmerEffect width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
      <ShimmerEffect width="100%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
      <ShimmerEffect width="80%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ShimmerEffect width={50} height={12} borderRadius={4} />
        <ShimmerEffect width={50} height={12} borderRadius={4} />
      </View>
    </View>
  );
};

// 인스타그램 스타일 카드 스켈레톤
export const InstagramCardSkeleton = () => {
  const dynamicStyles = useMemo(() => ({
    instagramCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: normalizeSpace(10),
      borderWidth: 1,
      borderColor: '#E2E8F030',
      marginBottom: normalizeSpace(10),
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: normalizeSpace(12),
      paddingTop: normalizeSpace(6),
      borderTopWidth: 1,
      borderTopColor: '#E2E8F015',
    },
  }), []);

  return (
    <View style={dynamicStyles.instagramCard}>
      {/* 헤더 */}
      <View style={styles.header}>
        <ShimmerEffect width={38} height={38} borderRadius={19} />
        <View style={{ flex: 1, marginLeft: normalizeSpace(10) }}>
          <ShimmerEffect width="50%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
          <ShimmerEffect width="30%" height={10} borderRadius={4} />
        </View>
        <ShimmerEffect width={24} height={24} borderRadius={12} />
      </View>

      {/* 제목 */}
      <ShimmerEffect width="85%" height={14} borderRadius={4} style={{ marginVertical: 8 }} />

      {/* 이미지 */}
      <ShimmerEffect width="100%" height={100} borderRadius={8} style={{ marginBottom: 8 }} />

      {/* 본문 */}
      <ShimmerEffect width="100%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
      <ShimmerEffect width="90%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />

      {/* 태그 */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
        <ShimmerEffect width={60} height={20} borderRadius={10} />
        <ShimmerEffect width={50} height={20} borderRadius={10} />
        <ShimmerEffect width={55} height={20} borderRadius={10} />
      </View>

      {/* 액션 버튼 */}
      <View style={dynamicStyles.actions}>
        <ShimmerEffect width={70} height={28} borderRadius={8} />
        <ShimmerEffect width={70} height={28} borderRadius={8} />
      </View>
    </View>
  );
};

// 2열 그리드 스켈레톤 리스트
export const PostSkeletonList = ({ count = 6 }: { count?: number }) => {
  const dynamicStyles = useMemo(() => ({
    gridContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: normalizeSpace(12),
      paddingTop: normalizeSpace(12),
    },
  }), []);

  return (
    <View style={dynamicStyles.gridContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );
};

// 정적 스타일만 (normalize 사용 안함)
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PostCardSkeleton;
