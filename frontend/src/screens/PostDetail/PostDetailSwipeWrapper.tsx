// screens/PostDetail/PostDetailSwipeWrapper.tsx
// 게시물 상세보기 스와이프 네비게이션 Wrapper
import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  ViewToken,
  TouchableOpacity,
  Text as RNText,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { usePostSwipe } from '../../hooks/usePostSwipe';
import PostDetailSkeleton from '../../components/PostDetailSkeleton';
import { RootStackParamList } from '../../types/navigation';
import { normalize, normalizeSpace, normalizeIcon } from '../../utils/responsive';
import logger from '../../utils/logger';

// PostDetailScreen을 동적으로 import (기존 컴포넌트 재사용)
import PostDetailScreen from './index';

type PostDetailSwipeNavigationProp = StackNavigationProp<RootStackParamList, 'PostDetail'>;
type PostDetailSwipeRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

interface Post {
  post_id: number;
  user_id: number;
  content: string;
  title?: string;
  is_anonymous: boolean;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  emotions?: Array<{
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  }>;
  tags?: Array<{
    tag_id: number;
    name: string;
  }>;
  is_liked?: boolean;
}

/**
 * PostDetail 스와이프 Wrapper
 * - FlatList 기반 수직 페이징
 * - 무한 스크롤 (상하 방향)
 * - Prefetch 최적화
 * - 뒤로가기 버튼 유지
 */
const PostDetailSwipeWrapper: React.FC = () => {
  const navigation = useNavigation<PostDetailSwipeNavigationProp>();
  const route = useRoute<PostDetailSwipeRouteProp>();
  const { theme: modernTheme, isDark } = useModernTheme();
  const { height: screenHeight } = useWindowDimensions();

  const { postId, postType = 'post', highlightCommentId, sourceScreen } = route.params;

  const colors = {
    background: modernTheme.bg.primary,
    cardBackground: modernTheme.bg.card,
    text: modernTheme.text.primary,
    textSecondary: modernTheme.text.secondary,
    border: modernTheme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  // 스와이프 hook 사용
  const {
    posts,
    currentIndex,
    isLoading,
    hasMore,
    loadMore,
    loadPrevious,
    refreshCurrentPost,
  } = usePostSwipe({
    initialPostId: postId,
    postType: postType as 'post' | 'comfort' | 'myday',
    sourceScreen,
  });

  const flatListRef = useRef<FlatList>(null);
  const [viewableIndex, setViewableIndex] = useState(0);
  const [showScrollHint, setShowScrollHint] = useState(true);

  // 현재 보이는 아이템 추적
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index || 0;
      setViewableIndex(index);
      logger.log('📍 [PostDetailSwipe] 현재 인덱스:', index);

      // Prefetch 트리거
      if (index >= posts.length - 2 && hasMore) {
        logger.log('🔄 [PostDetailSwipe] Prefetch 트리거: 다음 페이지');
        loadMore();
      }

      if (index <= 1) {
        logger.log('🔄 [PostDetailSwipe] Prefetch 트리거: 이전 페이지');
        loadPrevious();
      }
    }
  }).current;

  // 스크롤 힌트 자동 숨김
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollHint(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // 게시물 렌더링
  const renderPost = useCallback(
    ({ item, index }: { item: Post; index: number }) => {
      // 현재 보이는 게시물만 렌더링 (성능 최적화)
      const isVisible = Math.abs(index - viewableIndex) <= 1;

      if (!isVisible) {
        return (
          <View style={[styles.postContainer, { backgroundColor: colors.background, height: screenHeight }]}>
            <PostDetailSkeleton showComments={false} />
          </View>
        );
      }

      return (
        <View style={[styles.postContainer, { backgroundColor: colors.background, height: screenHeight }]}>
          <PostDetailScreen
            route={{
              ...route,
              params: {
                postId: item.post_id,
                postType,
                highlightCommentId: index === currentIndex ? highlightCommentId : undefined,
              },
            }}
            navigation={navigation}
          />
        </View>
      );
    },
    [viewableIndex, currentIndex, highlightCommentId, postType, colors.background, navigation, route, screenHeight]
  );

  // 로딩 footer
  const renderFooter = useCallback(() => {
    if (!isLoading || !hasMore) return null;

    return (
      <View style={[styles.footerLoader, { backgroundColor: colors.background, height: screenHeight }]}>
        <PostDetailSkeleton showComments={false} />
      </View>
    );
  }, [isLoading, hasMore, colors.background, screenHeight]);

  // 게시물이 로드되지 않았을 때
  if (posts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />
        <PostDetailSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* 헤더: 뒤로가기 버튼 + 위치 표시 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={normalizeIcon(24)}
            color={colors.text}
          />
        </TouchableOpacity>

        <RNText style={[styles.headerTitle, { color: colors.text }]}>게시물</RNText>

        <RNText style={[styles.positionIndicator, { color: colors.textSecondary }]}>
          {viewableIndex + 1} / {posts.length}
          {hasMore && '+'}
        </RNText>
      </View>

      {/* 스크롤 힌트 */}
      {showScrollHint && (
        <View style={styles.scrollHint}>
          <View style={[styles.hintBubble, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons
              name="gesture-swipe-vertical"
              size={normalizeIcon(20)}
              color="#fff"
            />
            <RNText style={styles.hintText}>상하 스와이프로 다음 게시물 보기</RNText>
          </View>
        </View>
      )}

      {/* FlatList: 수직 페이징 */}
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => `post-${item.post_id}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={currentIndex}
        getItemLayout={(data, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        ListFooterComponent={renderFooter}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        initialNumToRender={1}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        // 성능 최적화
        updateCellsBatchingPeriod={50}
        disableIntervalMomentum={true}
        decelerationRate="fast"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalizeSpace(16),
    paddingVertical: normalizeSpace(12),
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: normalizeSpace(4),
  },
  headerTitle: {
    flex: 1,
    fontSize: normalize(16),
    fontWeight: '600',
    marginLeft: normalizeSpace(12),
  },
  positionIndicator: {
    fontSize: normalize(13),
    fontWeight: '500',
  },
  postContainer: {
    // height는 컴포넌트에서 동적으로 설정
  },
  footerLoader: {
    // height는 컴포넌트에서 동적으로 설정
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollHint: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  hintBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalizeSpace(16),
    paddingVertical: normalizeSpace(10),
    borderRadius: normalizeSpace(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  hintText: {
    color: '#fff',
    fontSize: normalize(13),
    fontWeight: '600',
    marginLeft: normalizeSpace(8),
  },
});

export default PostDetailSwipeWrapper;
