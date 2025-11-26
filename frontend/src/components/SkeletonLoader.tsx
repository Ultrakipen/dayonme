// src/components/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e2e8f0', '#f1f5f9'],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

// 게시물 카드 스켈레톤
export const PostCardSkeleton: React.FC = () => (
  <View style={styles.postCardSkeleton}>
    {/* 헤더 */}
    <View style={styles.headerSkeleton}>
      <SkeletonLoader width={60} height={12} />
      <SkeletonLoader width={80} height={10} />
    </View>
    
    {/* 제목 */}
    <SkeletonLoader width="90%" height={16} style={{ marginBottom: 8 }} />
    
    {/* 내용 */}
    <SkeletonLoader width="100%" height={12} style={{ marginBottom: 4 }} />
    <SkeletonLoader width="80%" height={12} style={{ marginBottom: 8 }} />
    
    {/* 태그들 */}
    <View style={styles.tagsSkeleton}>
      <SkeletonLoader width={50} height={20} borderRadius={10} />
      <SkeletonLoader width={60} height={20} borderRadius={10} />
      <SkeletonLoader width={40} height={20} borderRadius={10} />
    </View>
    
    {/* 하단 버튼들 */}
    <View style={styles.actionsSkeleton}>
      <SkeletonLoader width={60} height={30} borderRadius={15} />
      <SkeletonLoader width={80} height={30} borderRadius={15} />
    </View>
  </View>
);

// 베스트 게시물 스켈레톤
export const BestPostSkeleton: React.FC = () => (
  <View style={styles.bestPostSkeleton}>
    {/* 순위 배지 */}
    <View style={styles.badgeSkeleton}>
      <SkeletonLoader width={30} height={16} borderRadius={8} />
    </View>
    
    {/* 제목 */}
    <SkeletonLoader width="90%" height={14} style={{ marginBottom: 6 }} />
    <SkeletonLoader width="70%" height={14} style={{ marginBottom: 8 }} />
    
    {/* 내용 */}
    <SkeletonLoader width="100%" height={11} style={{ marginBottom: 4 }} />
    <SkeletonLoader width="80%" height={11} style={{ marginBottom: 8 }} />
    
    {/* 통계 */}
    <View style={styles.statsSkeleton}>
      <SkeletonLoader width={25} height={10} />
      <SkeletonLoader width={25} height={10} />
    </View>
  </View>
);

// 내 게시물 스켈레톤
export const MyPostSkeleton: React.FC = () => (
  <View style={styles.myPostSkeleton}>
    <View style={styles.myPostContent}>
      <SkeletonLoader width="80%" height={14} style={{ marginBottom: 6 }} />
      <SkeletonLoader width="100%" height={11} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="60%" height={11} style={{ marginBottom: 8 }} />
      
      <View style={styles.myPostMeta}>
        <SkeletonLoader width={60} height={9} />
        <View style={styles.myPostStats}>
          <SkeletonLoader width={20} height={9} />
          <SkeletonLoader width={20} height={9} />
        </View>
      </View>
    </View>
    <SkeletonLoader width={8} height={16} />
  </View>
);

const styles = StyleSheet.create({
  postCardSkeleton: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagsSkeleton: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  actionsSkeleton: {
    flexDirection: 'row',
    gap: 12,
  },
  bestPostSkeleton: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  myPostSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  myPostContent: {
    flex: 1,
  },
  myPostMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myPostStats: {
    flexDirection: 'row',
    gap: 8,
  },
  profileCardSkeleton: {
    backgroundColor: 'white',
    padding: 24,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  notificationItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 16,
  },
});
// 프로필 카드 스켈레톤
export const ProfileCardSkeleton: React.FC = () => (
  <View style={styles.profileCardSkeleton}>
    <SkeletonLoader width={100} height={100} borderRadius={50}
      style={{ marginBottom: 16, alignSelf: 'center' }} />
    <SkeletonLoader width={120} height={24}
      style={{ marginBottom: 8, alignSelf: 'center' }} />
    <SkeletonLoader width={180} height={16}
      style={{ marginBottom: 24, alignSelf: 'center' }} />
    <View style={styles.statsRow}>
      <SkeletonLoader width={60} height={40} borderRadius={12} />
      <SkeletonLoader width={60} height={40} borderRadius={12} />
      <SkeletonLoader width={60} height={40} borderRadius={12} />
    </View>
  </View>
);

// 알림 아이템 스켈레톤
export const NotificationItemSkeleton: React.FC = () => (
  <View style={styles.notificationItemSkeleton}>
    <SkeletonLoader width={56} height={56} borderRadius={28} />
    <View style={{ flex: 1, marginLeft: 16 }}>
      <SkeletonLoader width="80%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="60%" height={14} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="40%" height={12} />
    </View>
  </View>
);
