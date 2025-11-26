// PostsList.tsx - FlatList로 게시물 목록 렌더링 (성능 최적화)
import React, { useCallback, useMemo } from 'react';
import { FlatList, View, ActivityIndicator, RefreshControl, Vibration } from 'react-native';
import { Text, Box, Center } from '../../components/ui';
import CompactPostCard from '../../components/CompactPostCard';
import EmptyState from '../../components/HomeScreen/EmptyState';
import { normalize, normalizeSpace } from '../../utils/responsive';
import { type DisplayPost } from '../HomeScreen/types';

interface PostsListProps {
  posts: DisplayPost[];
  filteredPosts: DisplayPost[];
  paginatedPosts: DisplayPost[];
  loadingPosts: boolean;
  isRefreshing: boolean;
  hasMorePosts: boolean;
  likedPosts: Set<number>;
  bookmarkedPosts: Set<number>;
  colors: any;
  isDark: boolean;
  highlightedPost: { id: number; content: string } | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onPostExpand: (post: DisplayPost) => void;
  onLike: (postId: number) => void;
  onBookmark: (postId: number) => void;
  postRefs: React.MutableRefObject<any>;
  postPositions: React.MutableRefObject<any>;
  cumulativeY: React.MutableRefObject<number>;
}

const PostsList: React.FC<PostsListProps> = ({
  posts,
  filteredPosts,
  paginatedPosts,
  loadingPosts,
  isRefreshing,
  hasMorePosts,
  likedPosts,
  bookmarkedPosts,
  colors,
  isDark,
  highlightedPost,
  onRefresh,
  onLoadMore,
  onPostExpand,
  onLike,
  onBookmark,
  postRefs,
  postPositions,
  cumulativeY,
}) => {
  // 베스트 게시물 계산 (메모이제이션)
  const bestPost = useMemo(() => {
    if (filteredPosts.length === 0) return null;
    return [...filteredPosts].sort((a, b) => {
      if (b.like_count === a.like_count) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return b.like_count - a.like_count;
    })[0];
  }, [filteredPosts]);

  // 게시물 렌더링 (메모이제이션)
  const renderPost = useCallback(({ item: post, index }: { item: DisplayPost; index: number }) => {
    const isHighlighted = highlightedPost?.id === post.post_id && highlightedPost?.content === post.content;

    return (
      <View
        key={`post-${post.post_id}`}
        ref={(ref: any) => {
          if (ref) postRefs.current[post.post_id] = ref;
        }}
        style={{ width: '100%', paddingHorizontal: 8, marginBottom: 12 }}
        onLayout={(event: any) => {
          const layout = event.nativeEvent.layout;
          if (postPositions.current[post.post_id] === undefined) {
            postPositions.current[post.post_id] = cumulativeY.current;
            cumulativeY.current += layout.height + 12;
          }
        }}
      >
        <View
          style={[
            { width: '100%' },
            isHighlighted && {
              borderWidth: 8,
              borderColor: '#8b5cf6',
              backgroundColor: '#f3e8ff',
              transform: [{ scale: 1.01 }],
              shadowColor: '#7c3aed',
              shadowOpacity: 0.5,
              shadowRadius: 16,
              borderRadius: 8,
            },
          ]}
        >
          <CompactPostCard
            post={{
              ...post,
              updated_at: post.updated_at || post.created_at,
              emotions: post.emotions?.map(emotion => ({
                ...emotion,
                name: typeof emotion.name === 'string' ? emotion.name : '감정',
              })) || [],
            }}
            onExpand={onPostExpand}
            onLike={onLike}
            liked={likedPosts.has(post.post_id)}
            onBookmark={onBookmark}
            isBookmarked={bookmarkedPosts.has(post.post_id)}
          />
        </View>

        {/* 베스트 게시물 삽입 (3번째 다음) */}
        {index === 2 && bestPost && bestPost.post_id !== post.post_id && filteredPosts.length > 3 && (
          <View style={{ position: 'relative', width: '100%', paddingHorizontal: 8, marginBottom: 12, marginTop: 12 }}>
            {/* 베스트 배지 */}
            <Box
              style={{
                position: 'absolute',
                top: -12,
                left: 20,
                zIndex: 10,
                backgroundColor: '#f59e0b',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text style={{ fontSize: normalize(13, 11, 15) }}>⭐</Text>
              <Text style={{ fontSize: normalize(13, 11, 15), fontWeight: '700', color: '#ffffff' }}>오늘의 베스트</Text>
            </Box>

            {/* 베스트 게시물 */}
            <View
              style={{
                width: '100%',
                borderWidth: 3,
                borderColor: '#f59e0b',
                borderRadius: 12,
                backgroundColor: colors.cardBackground,
                overflow: 'hidden',
                shadowColor: '#f59e0b',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <CompactPostCard
                post={{
                  ...bestPost,
                  updated_at: bestPost.updated_at || bestPost.created_at,
                  emotions: bestPost.emotions?.map(emotion => ({
                    ...emotion,
                    name: typeof emotion.name === 'string' ? emotion.name : '감정',
                  })) || [],
                }}
                onExpand={onPostExpand}
                onLike={onLike}
                liked={likedPosts.has(bestPost.post_id)}
                onBookmark={onBookmark}
                isBookmarked={bookmarkedPosts.has(bestPost.post_id)}
              />
            </View>
          </View>
        )}
      </View>
    );
  }, [highlightedPost, likedPosts, bookmarkedPosts, colors, bestPost, filteredPosts, onPostExpand, onLike, onBookmark, postRefs, postPositions, cumulativeY]);

  // 로딩 중
  if (loadingPosts) {
    return (
      <Box style={{ backgroundColor: colors.cardBackground, borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <Center style={{ paddingVertical: 32 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, fontSize: normalize(15), color: colors.textSecondary }}>게시물을 불러오는 중...</Text>
        </Center>
      </Box>
    );
  }

  // 게시물 없음
  if (posts.length === 0) {
    return <EmptyState isDark={isDark} />;
  }

  // 필터링 결과 없음
  if (filteredPosts.length === 0) {
    return (
      <Box style={{ backgroundColor: colors.cardBackground, borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <Center style={{ paddingVertical: 32 }}>
          <Text style={{ marginTop: 16, fontSize: normalize(15), color: colors.textSecondary }}>
            선택한 필터에 해당하는 게시물이 없습니다.
          </Text>
        </Center>
      </Box>
    );
  }

  // Footer 렌더링
  const renderFooter = () => {
    if (!hasMorePosts) return null;
    return (
      <View style={{ paddingVertical: normalizeSpace(20), alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ marginTop: normalizeSpace(8), fontSize: normalize(12), color: colors.textSecondary }}>
          더 많은 게시물 불러오는 중...
        </Text>
      </View>
    );
  };

  // FlatList로 렌더링 (성능 최적화)
  return (
    <FlatList
      data={paginatedPosts}
      renderItem={renderPost}
      keyExtractor={(item) => `post-${item.post_id}`}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: normalizeSpace(120) }}
      showsVerticalScrollIndicator={false}
      // 성능 최적화
      windowSize={10}
      maxToRenderPerBatch={5}
      initialNumToRender={10}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      // 무한 스크롤
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      // 새로고침
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            Vibration.vibrate(5);
            onRefresh();
          }}
          colors={['#7c3aed']}
          tintColor="#7c3aed"
          title="✨ 새로운 감정을 불러오는 중..."
          titleColor="#7c3aed"
        />
      }
      // 메모리 최적화
      getItemLayout={(data, index) => ({
        length: 400, // 평균 아이템 높이 (추정)
        offset: 400 * index,
        index,
      })}
    />
  );
};

export default React.memo(PostsList);
