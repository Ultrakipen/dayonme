// InfinitePostsList.tsx - 무한 스크롤 게시물 리스트
import React, { useCallback } from 'react';
import { FlatList, View, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { Text } from './ui';
import { useInfinitePostsQuery } from '../screens/HomeScreen/hooks/useInfinitePostsQuery';
import { PostsErrorBoundary } from './PostsErrorBoundary';
import { PostsSuspenseFallback } from './PostsSuspense';
import CompactPostCard from './CompactPostCard';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalize, hp } from '../utils/responsive';
import { anonymousManager } from '../utils/anonymousNickname';

interface InfinitePostsListProps {
  isAuthenticated: boolean;
  onPostPress?: (post: any) => void;
  onLikePress?: (postId: number) => void;
  onCommentPress?: (postId: number) => void;
  onSharePress?: (post: any) => void;
  onBookmarkPress?: (postId: number) => void;
}

export const InfinitePostsList: React.FC<InfinitePostsListProps> = ({
  isAuthenticated,
  onPostPress,
  onLikePress,
  onCommentPress,
  onSharePress,
  onBookmarkPress,
}) => {
  const { theme, isDark } = useModernTheme();

  // 댓글 처리 함수
  const processComments = useCallback(async (postId: number, comments: any[]) => {
    if (!Array.isArray(comments)) return [];

    // 익명 사용자 ID 할당
    const commentsWithAnonymous = comments.map(comment => {
      if (comment.is_anonymous) {
        const anonymousUser = anonymousManager.getOrCreateAnonymousUser(
          postId,
          comment.user_id
        );
        return {
          ...comment,
          anonymousUser,
        };
      }
      return comment;
    });

    // 답글 구조화
    const topLevelComments = commentsWithAnonymous.filter(c => !c.parent_comment_id);
    const replies = commentsWithAnonymous.filter(c => c.parent_comment_id);

    const structuredComments = topLevelComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_comment_id === comment.comment_id),
    }));

    return structuredComments;
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfinitePostsQuery({
    isAuthenticated,
    processComments,
  });

  // 모든 페이지의 게시물을 하나의 배열로 합치기
  const posts = React.useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || [];
  }, [data]);

  // 북마크된 게시물 ID (첫 페이지에서만)
  const bookmarkedPostIds = React.useMemo(() => {
    return data?.pages[0]?.bookmarkedPostIds || new Set<number>();
  }, [data]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item: post }: { item: any }) => (
    <CompactPostCard
      post={post}
      onPress={() => onPostPress?.(post)}
      onLike={() => onLikePress?.(post.post_id)}
      onComment={() => onCommentPress?.(post.post_id)}
      onShare={() => onSharePress?.(post)}
      onBookmark={() => onBookmarkPress?.(post.post_id)}
      isBookmarked={bookmarkedPostIds.has(post.post_id)}
    />
  ), [onPostPress, onLikePress, onCommentPress, onSharePress, onBookmarkPress, bookmarkedPostIds]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator
          size="small"
          color={isDark ? '#a78bfa' : '#667eea'}
        />
        <Text style={[styles.footerText, { color: theme.text.secondary }]}>
          더 불러오는 중...
        </Text>
      </View>
    );
  }, [isFetchingNextPage, isDark, theme]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
        아직 게시물이 없습니다
      </Text>
    </View>
  ), [theme]);

  if (isLoading) {
    return <PostsSuspenseFallback />;
  }

  if (isError) {
    return (
      <PostsErrorBoundary onReset={refetch}>
        <View />
      </PostsErrorBoundary>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => `post-${item.post_id}`}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          tintColor={isDark ? '#a78bfa' : '#667eea'}
        />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      initialNumToRender={5}
      windowSize={10}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(8),
    paddingBottom: normalize(24),
  },
  footer: {
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginTop: normalize(8),
    fontSize: normalize(12),
  },
  emptyContainer: {
    paddingVertical: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: normalize(14),
  },
});
