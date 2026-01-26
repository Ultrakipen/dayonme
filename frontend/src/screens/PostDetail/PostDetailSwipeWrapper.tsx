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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePostSwipe } from '../../hooks/usePostSwipe';
import PostDetailSkeleton from '../../components/PostDetailSkeleton';
import CommentBottomSheet, { CommentBottomSheetRef, Comment as BSComment } from '../../components/CommentBottomSheet';
import { RootStackParamList } from '../../types/navigation';
import { normalize, normalizeSpace, normalizeIcon } from '../../utils/responsive';
import logger from '../../utils/logger';
import comfortWallService from '../../services/api/comfortWallService';
import myDayService from '../../services/api/myDayService';
import postService from '../../services/api/postService';

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

  const { postId, postType = 'post', highlightCommentId, sourceScreen, openComments } = route.params;

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

  // 댓글 바텀시트 관련 상태
  const { user } = useAuth();
  const commentBottomSheetRef = useRef<CommentBottomSheetRef>(null);
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [commentPostUserId, setCommentPostUserId] = useState<number | undefined>(undefined);
  const [comments, setComments] = useState<BSComment[]>([]);
  const [bestComments, setBestComments] = useState<BSComment[]>([]);
  const [totalCommentCount, setTotalCommentCount] = useState(0);

  // 댓글 바텀시트 열기 핸들러
  const handleOpenComments = useCallback(async (targetPostId: number, targetPostUserId?: number) => {
    setCommentPostId(targetPostId);
    setCommentPostUserId(targetPostUserId);
    setComments([]);
    setBestComments([]);
    setTotalCommentCount(0);

    try {
      let response;
      const normalizedType = postType === 'comfort' ? 'comfort' : postType === 'myday' ? 'myday' : 'post';

      if (normalizedType === 'comfort') {
        response = await comfortWallService.getComments(targetPostId);
      } else if (normalizedType === 'myday') {
        response = await myDayService.getComments(targetPostId);
      } else {
        response = await postService.getComments(targetPostId);
      }

      const data = response?.data?.data || response?.data || response;
      const commentsList = data?.comments || data || [];
      const best = data?.best_comments || data?.bestComments || [];
      const total = data?.total_count || data?.totalCount || commentsList.length;

      setComments(Array.isArray(commentsList) ? commentsList : []);
      setBestComments(Array.isArray(best) ? best : []);
      setTotalCommentCount(total);

      commentBottomSheetRef.current?.expand();
    } catch (error) {
      logger.log('[PostDetailSwipeWrapper] 댓글 로드 실패:', error);
      commentBottomSheetRef.current?.expand();
    }
  }, [postType]);

  // 댓글 작성 핸들러
  const handleSubmitComment = useCallback(async (content: string, isAnonymous: boolean, parentCommentId?: number) => {
    if (!commentPostId) return;

    try {
      const normalizedType = postType === 'comfort' ? 'comfort' : postType === 'myday' ? 'myday' : 'post';

      if (normalizedType === 'comfort') {
        await comfortWallService.addComment(commentPostId, { content, is_anonymous: isAnonymous });
      } else if (normalizedType === 'myday') {
        await myDayService.createComment(commentPostId, { content, is_anonymous: isAnonymous });
      } else {
        await postService.createComment(commentPostId, { content, is_anonymous: isAnonymous });
      }

      // 댓글 목록 새로고침
      handleOpenComments(commentPostId, commentPostUserId);
    } catch (error) {
      logger.log('[PostDetailSwipeWrapper] 댓글 작성 실패:', error);
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
    }
  }, [commentPostId, commentPostUserId, postType, handleOpenComments]);

  // 댓글 좋아요 핸들러
  const handleLikeComment = useCallback(async (comment: BSComment) => {
    if (!commentPostId) return;
    try {
      const normalizedType = postType === 'comfort' ? 'comfort' : postType === 'myday' ? 'myday' : 'post';
      if (normalizedType === 'comfort') {
        await comfortWallService.likeComment(comment.comment_id);
      } else if (normalizedType === 'myday') {
        await myDayService.likeComment(comment.comment_id);
      } else {
        await postService.likeComment(comment.comment_id);
      }
      handleOpenComments(commentPostId, commentPostUserId);
    } catch (error) {
      logger.log('[PostDetailSwipeWrapper] 댓글 좋아요 실패:', error);
    }
  }, [commentPostId, commentPostUserId, postType, handleOpenComments]);

  // 댓글 삭제 핸들러
  const handleDeleteComment = useCallback(async (comment: BSComment) => {
    if (!commentPostId) return;

    Alert.alert('댓글 삭제', '정말로 이 댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const normalizedType = postType === 'comfort' ? 'comfort' : postType === 'myday' ? 'myday' : 'post';
            if (normalizedType === 'comfort') {
              await comfortWallService.deleteComment(comment.comment_id);
            } else if (normalizedType === 'myday') {
              await myDayService.deleteComment(comment.comment_id);
            } else {
              await postService.deleteComment(comment.comment_id);
            }
            handleOpenComments(commentPostId, commentPostUserId);
          } catch (error) {
            logger.log('[PostDetailSwipeWrapper] 댓글 삭제 실패:', error);
            Alert.alert('오류', '댓글 삭제에 실패했습니다.');
          }
        }
      }
    ]);
  }, [commentPostId, commentPostUserId, postType, handleOpenComments]);

  // 댓글 수정 핸들러 (placeholder)
  const handleEditComment = useCallback((comment: BSComment) => {
    Alert.alert('알림', '댓글 수정 기능은 준비 중입니다.');
  }, []);

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
                openComments: index === currentIndex ? openComments : undefined, // 첫 번째 게시물에만 자동 열기
                isSwipeMode: true, // 스와이프 모드 플래그 추가
              },
            }}
            navigation={navigation}
            onOpenComments={() => handleOpenComments(item.post_id, item.user_id)}
          />
        </View>
      );
    },
    [viewableIndex, currentIndex, highlightCommentId, postType, colors.background, navigation, route, screenHeight, openComments, handleOpenComments]
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

      {/* 하단 고정 액션바 */}
      <View style={[styles.bottomActionBar, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
        <View style={styles.actionBarLeft}>
          <TouchableOpacity
            style={styles.actionBarButton}
            onPress={() => {
              // 좋아요 기능은 개별 PostDetailScreen에서 처리
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="heart-outline"
              size={normalizeIcon(24)}
              color={isDark ? '#D1D5DB' : '#64748b'}
            />
            <RNText style={[styles.actionBarCount, { color: isDark ? '#D1D5DB' : '#64748b' }]}>
              {posts[viewableIndex]?.like_count || 0}
            </RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBarButton}
            onPress={() => {
              const currentPost = posts[viewableIndex];
              if (currentPost) {
                handleOpenComments(currentPost.post_id, currentPost.user_id);
              }
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="comment-outline"
              size={normalizeIcon(24)}
              color={isDark ? '#D1D5DB' : '#64748b'}
            />
            <RNText style={[styles.actionBarCount, { color: isDark ? '#D1D5DB' : '#64748b' }]}>
              {posts[viewableIndex]?.comment_count || 0}
            </RNText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.commentButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            const currentPost = posts[viewableIndex];
            if (currentPost) {
              handleOpenComments(currentPost.post_id, currentPost.user_id);
            }
          }}
        >
          <MaterialCommunityIcons name="pencil" size={normalizeIcon(16)} color="#fff" />
          <RNText style={styles.commentButtonText}>댓글 달기</RNText>
        </TouchableOpacity>
      </View>

      {/* 댓글 바텀시트 - 스와이프 모드에서 최상위 레벨로 렌더링 */}
      {commentPostId && (
        <CommentBottomSheet
          ref={commentBottomSheetRef}
          postId={commentPostId}
          postUserId={commentPostUserId}
          postType={postType || 'post'}
          totalCount={totalCommentCount}
          isAuthenticated={!!user}
          comments={comments}
          bestComments={bestComments}
          onSubmitComment={handleSubmitComment}
          onLikeComment={handleLikeComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
        />
      )}
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
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: normalizeSpace(12),
  },
  positionIndicator: {
    fontSize: normalize(13),
    fontFamily: 'Pretendard-Medium',
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
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: normalizeSpace(8),
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalizeSpace(16),
    paddingVertical: normalizeSpace(12),
    borderTopWidth: 1,
  },
  actionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalizeSpace(20),
  },
  actionBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalizeSpace(6),
  },
  actionBarCount: {
    fontSize: normalize(14),
    fontFamily: 'Pretendard-SemiBold',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalizeSpace(20),
    paddingHorizontal: normalizeSpace(16),
    paddingVertical: normalizeSpace(8),
  },
  commentButtonText: {
    color: '#fff',
    fontSize: normalize(12),
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: normalizeSpace(6),
  },
});

export default PostDetailSwipeWrapper;
