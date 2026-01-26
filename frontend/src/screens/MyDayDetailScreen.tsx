import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
  RefreshControl,
  Animated,
  Keyboard,
  TextInput as RNTextInput,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Box, VStack, HStack } from '../components/ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import myDayService from '../services/api/myDayService';
import commentService from '../services/api/commentService';
import blockService from '../services/api/blockService';
import { normalizeImageUrl } from '../utils/imageUtils';
import BlockReasonModal, { BlockReason } from '../components/BlockReasonModal';
import ClickableNickname from '../components/ClickableNickname';
import ClickableAvatar from '../components/ClickableAvatar';
import CommentBottomSheet, { CommentBottomSheetRef, Comment as BSComment } from '../components/CommentBottomSheet';
import { useModernTheme } from '../contexts/ModernThemeContext';
import ModernToast, { ToastType } from '../components/ModernToast';
import { FONT_SIZES } from '../constants';
import { EMOTION_AVATARS } from '../constants/emotions';

// 반응형 폰트 스케일링 함수 - React Native 0.80 호환
const BASE_WIDTH = 360;
const getResponsiveFontSize = (size: number): number => {
  try {
    const dims = Dimensions.get('window');
    const screenWidth = dims?.width || BASE_WIDTH;
    const scale = Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.3);
    return Math.round(size * scale);
  } catch (e) {
    return Math.round(size);
  }
};

// 타입 정의
interface MyDayPost {
  post_id: number;
  content: string;
  emotion_id?: number;
  emotion_name: string;
  emotion_color: string;
  emotion_icon: string;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  is_anonymous: boolean;
  user_id: number;
  is_liked?: boolean;
  emotions?: Array<{
    id: number;
    name: string;
    color: string;
    icon: string;
  }>;
  user?: {
    nickname: string;
    username: string;
    profile_image_url?: string;
  };
}

interface Comment {
  comment_id: number;
  content: string;
  user_id: number;
  user?: {
    nickname: string;
    username: string;
    profile_image_url?: string;
  };
  is_anonymous: boolean;
  created_at: string;
  like_count: number;
  is_liked: boolean;
  parent_comment_id?: number;
  replies?: Comment[];
}

interface MyDayDetailScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: {
    params: {
      postId: number;
      highlightCommentId?: number;
    };
  };
}

// 감정 데이터는 emotions.ts에서 import (일관성 유지)

const getRandomEmotion = (userId: number, postId: number, commentId: number = 0) => {
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const commentSeed = commentId || 0;

  const seed1 = (userSeed * 17 + postSeed * 37 + commentSeed * 7) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41 + commentSeed * 11) % 500;
  const seed3 = (userSeed + postSeed + commentSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_AVATARS.length;

  return EMOTION_AVATARS[finalSeed];
};

// PostImage 컴포넌트 - PostDetailScreen과 동일
const PostImage = React.memo<{
  imageUrl: string;
  onDoubleTap: () => void;
  showLikeAnimation: boolean;
  likeAnimationValue: Animated.Value;
  isDark?: boolean;
  backgroundColor?: string;
}>(({ imageUrl, onDoubleTap, showLikeAnimation, likeAnimationValue, isDark = false, backgroundColor }) => {
  const normalizedUrl = React.useMemo(() => {
    let url = imageUrl;

    // JSON 문자열로 된 배열인 경우 파싱
    if (typeof imageUrl === 'string' && imageUrl.startsWith('[')) {
      try {
        const parsed = JSON.parse(imageUrl);
        url = Array.isArray(parsed) ? parsed[0] : imageUrl;
      } catch (e) {
        if (__DEV__) console.warn('이미지 URL JSON 파싱 실패:', e);
      }
    } else if (Array.isArray(imageUrl)) {
      url = imageUrl[0];
    }

    return normalizeImageUrl(url);
  }, [imageUrl]);

  if (!normalizedUrl || normalizedUrl.trim() === '') {
    return null;
  }

  return (
    <Box style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onDoubleTap}
        style={{ position: 'relative' }}
      >
        <Image
          source={{ uri: normalizedUrl }}
          style={{
            width: '100%',
            height: 300,
            borderRadius: 0,
            backgroundColor: backgroundColor || (isDark ? '#1a1a1a' : '#f5f5f5'),
          }}
          resizeMode="cover"
        />

        {/* 더블탭 하트 애니메이션 */}
        {showLikeAnimation && (
          <Animated.View style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: -25,
            marginLeft: -25,
            opacity: likeAnimationValue,
            transform: [{
              scale: likeAnimationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.8],
              })
            }]
          }}>
            <MaterialCommunityIcons name="heart" size={50} color="#ef4444" />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Box>
  );
}, (prevProps, nextProps) => {
  return prevProps.imageUrl === nextProps.imageUrl &&
         prevProps.showLikeAnimation === nextProps.showLikeAnimation &&
         prevProps.backgroundColor === nextProps.backgroundColor;
});

PostImage.displayName = 'PostImage';

const MyDayDetailScreen: React.FC<MyDayDetailScreenProps> = ({ navigation, route }) => {
  const { postId, highlightCommentId } = route.params;
  const { user } = useAuth();
  const { theme, isDark } = useModernTheme();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const commentRefs = useRef<Map<number, View | null>>(new Map());
  const textInputRef = useRef<RNTextInput | null>(null);
  const commentBottomSheetRef = useRef<CommentBottomSheetRef>(null);

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  // State
  const [post, setPost] = useState<MyDayPost | null>(null);
  const [isLikingPost, setIsLikingPost] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [bestComments, setBestComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [allCommentsCollapsed, setAllCommentsCollapsed] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockCommentId, setBlockCommentId] = useState<number | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(highlightCommentId || null);

  // 더블탭 좋아요 기능
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const likeAnimationValue = useRef(new Animated.Value(0)).current;
  const lastTap = useRef<number>(0);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');

  // 댓글 수정 상태
  const [editingComment, setEditingComment] = useState<BSComment | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Toast 표시 함수
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  // 댓글 수정 핸들러
  const handleEditComment = useCallback((comment: BSComment) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
  }, []);

  // 댓글 수정 저장
  const handleSaveCommentEdit = useCallback(async () => {
    if (!editingComment || !editCommentText.trim()) {
      showToast('댓글 내용을 입력해주세요', 'error');
      return;
    }

    try {
      const trimmedText = editCommentText.trim();

      // 답글인 경우 멘션 확인 및 추가
      let finalContent = trimmedText;
      if (editingComment.parent_comment_id) {
        // 멘션이 없으면 원본에서 추출하여 추가
        const mentionMatch = editingComment.content.match(/^@(\S+)\s+/);
        const hasMention = /^@\S+\s+/.test(trimmedText);

        if (!hasMention && mentionMatch) {
          // 멘션이 없으면 원본 멘션 추가
          finalContent = `${mentionMatch[0]}${trimmedText}`;
        }
      }

      await commentService.updateComment(editingComment.comment_id, {
        content: finalContent,
      });

      // 댓글 목록 업데이트
      setComments(prev =>
        prev.map(c => {
          if (c.comment_id === editingComment.comment_id) {
            return { ...c, content: finalContent };
          }
          // 답글인 경우
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r =>
                r.comment_id === editingComment.comment_id
                  ? { ...r, content: finalContent }
                  : r
              )
            };
          }
          return c;
        })
      );

      setEditingComment(null);
      setEditCommentText('');
      showToast('댓글이 수정되었습니다', 'success');
    } catch (error) {
      if (__DEV__) console.error('댓글 수정 실패:', error);
      showToast('댓글 수정에 실패했습니다', 'error');
    }
  }, [editingComment, editCommentText, showToast]);

  // 댓글 삭제 핸들러
  const handleDeleteComment = useCallback((comment: BSComment) => {
    Alert.alert(
      '댓글 삭제',
      '이 댓글을 삭제하시겠습니까?\n삭제된 댓글은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await myDayService.deleteComment(comment.comment_id, postId);

              // 댓글 목록에서 제거
              setComments(prev => {
                // 최상위 댓글인 경우
                const filtered = prev.filter(c => c.comment_id !== comment.comment_id);

                // 답글인 경우
                return filtered.map(c => ({
                  ...c,
                  replies: c.replies?.filter(r => r.comment_id !== comment.comment_id) || []
                }));
              });

              // 게시글의 댓글 수 업데이트
              if (post) {
                setPost({
                  ...post,
                  comment_count: Math.max(0, (post.comment_count || 0) - 1)
                });
              }

              showToast('댓글이 삭제되었습니다', 'success');
            } catch (error) {
              if (__DEV__) console.error('댓글 삭제 실패:', error);
              showToast('댓글 삭제에 실패했습니다', 'error');
            }
          }
        }
      ]
    );
  }, [postId, post, showToast]);

  // 베스트 댓글 추출 함수
  const extractBestComments = (comments: Comment[]): Comment[] => {
    return [...comments]
      .filter(comment => !comment.parent_comment_id)
      .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      .slice(0, 3)
      .filter(comment => (comment.like_count || 0) > 0);
  };

  // 데이터 로드
  const loadPostData = useCallback(async () => {
    try {
      setIsLoading(true);

      const postResponse = await myDayService.getPostById(postId);
      if (postResponse?.status === 'success' && postResponse.data) {
        const postData = postResponse.data;
        const isLiked = postData.likes?.some((like: any) => like.user_id === user?.user_id) || false;

        setPost({
          ...postData,
          is_liked: isLiked,
          created_at: postData.createdAt || postData.created_at,
          updated_at: postData.updatedAt || postData.updated_at
        });
      } else {
        showToast('게시글을 불러올 수 없습니다', 'error');
        navigation.goBack();
      }

      const commentsResponse = await commentService.getComments({
        type: 'my_day',
        post_id: postId
      });

      if (commentsResponse?.status === 'success') {
        const rawCommentsData = commentsResponse.data?.comments || [];

        const commentsData = rawCommentsData.map((comment: any) => ({
          ...comment,
          is_liked: comment.user_liked || comment.is_liked || false,
          replies: comment.replies?.map((reply: any) => ({
            ...reply,
            is_liked: reply.user_liked || reply.is_liked || false
          })) || []
        }));

        setComments(commentsData);

        const bestCommentsData = extractBestComments(commentsData);
        setBestComments(bestCommentsData);

        if (highlightCommentId) {
          if (__DEV__) console.log('📍 [MyDayDetailScreen] 댓글 하이라이트 준비:', highlightCommentId);

          // 답글인 경우 부모 댓글 확인 (디버깅용)
          const findParentCommentId = (commentId: number, allComments: Comment[]): number | null => {
            for (const comment of allComments) {
              if (comment.replies && comment.replies.length > 0) {
                const foundReply = comment.replies.find(r => r.comment_id === commentId);
                if (foundReply) {
                  return comment.comment_id;
                }
                // 재귀적으로 답글의 답글 검색
                const parentInReplies = findParentCommentId(commentId, comment.replies);
                if (parentInReplies !== null) {
                  return parentInReplies;
                }
              }
            }
            return null;
          };

          const parentCommentId = findParentCommentId(highlightCommentId, commentsData);
          if (parentCommentId) {
            if (__DEV__) console.log('📍 [MyDayDetailScreen] 답글의 부모 댓글 찾음:', parentCommentId);
          }

          // 딜레이를 1초로 늘려서 댓글이 완전히 렌더링되는 시간 확보
          setTimeout(() => {
            const commentView = commentRefs.current.get(highlightCommentId);
            if (commentView && scrollViewRef.current) {
              commentView.measureLayout(
                scrollViewRef.current as any,
                (x: number, y: number, width: number, height: number) => {
                  if (__DEV__) console.log('📍 [MyDayDetailScreen] 댓글 위치 측정:', { x, y, width, height });
                  scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
                },
                (error: any) => {
                  if (__DEV__) console.error('📍 [MyDayDetailScreen] 댓글 위치 측정 실패:', error);
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }
              );
            } else {
              if (__DEV__) console.log('📍 [MyDayDetailScreen] 댓글 ref 없음, 맨 아래로 스크롤');
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }, 1000);

          setTimeout(() => {
            if (__DEV__) console.log('📍 [MyDayDetailScreen] 하이라이트 제거');
            setHighlightedCommentId(null);
          }, 4500);
        }
      }

    } catch (error) {
      if (__DEV__) console.error('❌ MyDay 게시글 상세 데이터 로드 오류:', error);
      showToast('데이터를 불러오는데 실패했습니다', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [postId, navigation, highlightCommentId, user?.user_id, showToast]);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPostData();
    setIsRefreshing(false);
  }, [loadPostData]);

  // 댓글 제출
  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);

      const response = await commentService.createComment({
        type: 'my_day',
        post_id: postId,
        content: commentText.trim(),
        parent_comment_id: replyingTo || undefined,
        is_anonymous: true
      });

      if (response?.status === 'success') {
        setCommentText('');
        setReplyingTo(null);
        Keyboard.dismiss();

        // 게시글 댓글 수 증가
        setPost(prevPost => prevPost ? { ...prevPost, comment_count: prevPost.comment_count + 1 } : null);

        // 댓글 목록만 다시 로드
        const commentsResponse = await commentService.getComments({
          type: 'my_day',
          post_id: postId
        });

        if (commentsResponse?.status === 'success') {
          const rawCommentsData = commentsResponse.data?.comments || [];
          const commentsData = rawCommentsData.map((comment: any) => ({
            ...comment,
            is_liked: comment.user_liked || comment.is_liked || false,
            replies: comment.replies?.map((reply: any) => ({
              ...reply,
              is_liked: reply.user_liked || reply.is_liked || false
            })) || []
          }));

          setComments(commentsData);
          setBestComments(extractBestComments(commentsData));
        }
      } else {
        showToast('댓글 작성에 실패했습니다', 'error');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ 댓글 작성 오류:', error);
      showToast('댓글 작성에 실패했습니다', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  }, [commentText, isSubmittingComment, postId, replyingTo, showToast]);

  // 댓글 좋아요 (Optimistic Update)
  const handleCommentLike = useCallback(async (commentId: number) => {
    try {
      // Optimistic Update: UI 먼저 업데이트
      setComments(prevComments => {
        const updateComments = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.comment_id === commentId) {
              const newIsLiked = !comment.is_liked;
              return {
                ...comment,
                is_liked: newIsLiked,
                like_count: newIsLiked ? comment.like_count + 1 : Math.max(0, comment.like_count - 1)
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateComments(comment.replies)
              };
            }
            return comment;
          });
        };
        const updatedComments = updateComments(prevComments);
        setBestComments(extractBestComments(updatedComments));
        return updatedComments;
      });

      // 서버에 요청
      const response = await commentService.likeComment(commentId, 'my_day');
      if (response?.status !== 'success') {
        // 실패 시 롤백
        await loadPostData();
      }
    } catch (error) {
      if (__DEV__) console.error('❌ 댓글 좋아요 오류:', error);
      // 에러 시 롤백
      await loadPostData();
    }
  }, [loadPostData]);

  // 답글 달기
  const handleReply = useCallback((commentId: number) => {
    setReplyingTo(commentId);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  }, []);

  // 댓글 차단
  const handleBlockComment = useCallback((commentId: number) => {
    setBlockCommentId(commentId);
    setBlockModalVisible(true);
  }, []);

  // 차단 확인 처리
  const handleBlockConfirm = useCallback(async (reason?: BlockReason) => {
    if (blockCommentId === null) return;

    try {
      await blockService.blockContent({
        contentType: 'comment',
        contentId: blockCommentId,
        reason,
      });

      await loadPostData();
      showToast('댓글이 차단되었습니다', 'success');
    } catch (error) {
      if (__DEV__) console.error('❌ 댓글 차단 오류:', error);
      showToast('댓글 차단 중 오류가 발생했습니다', 'error');
    } finally {
      setBlockCommentId(null);
    }
  }, [blockCommentId, loadPostData, showToast]);

  // 더블탭 처리
  const handleDoubleTap = useCallback(() => {
    if (!post) return;

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      handlePostLike();

      setShowLikeAnimation(true);
      likeAnimationValue.setValue(0);

      Animated.timing(likeAnimationValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setShowLikeAnimation(false);
      });
    }
    lastTap.current = now;
  }, [post, likeAnimationValue]);

  // 게시물 좋아요
  const handlePostLike = useCallback(async () => {
    if (!post || isLikingPost) return;

    // 자기 글 좋아요 방지
    if (post.user_id === user?.user_id) {
      showToast('자신의 게시물에는 좋아요를 할 수 없습니다', 'info');
      return;
    }

    try {
      setIsLikingPost(true);
      const response = await myDayService.likePost(post.post_id);

      if (response?.status === 'success') {
        setPost(prevPost => {
          if (!prevPost) return null;
          const newIsLiked = !prevPost.is_liked;
          return {
            ...prevPost,
            is_liked: newIsLiked,
            like_count: newIsLiked
              ? prevPost.like_count + 1
              : Math.max(0, prevPost.like_count - 1)
          };
        });
      }
    } catch (error) {
      if (__DEV__) console.error('❌ 게시물 좋아요 오류:', error);
    } finally {
      setIsLikingPost(false);
    }
  }, [post, isLikingPost, user?.user_id, showToast]);

  // 베스트 댓글 클릭 시 원본 댓글로 스크롤
  const scrollToComment = useCallback((commentId: number) => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  // 전체 댓글 접기/펼치기
  const toggleAllCommentsCollapse = useCallback(() => {
    setAllCommentsCollapsed(!allCommentsCollapsed);
  }, [allCommentsCollapsed]);

  // 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadPostData();
    }, [loadPostData])
  );

  // 댓글 렌더링 함수
  const renderComment = useCallback((comment: Comment, isReply = false) => {
    const emotion = getRandomEmotion(comment.user_id, postId, comment.comment_id);
    const isOwner = comment.user_id === user?.user_id;
    const isHighlighted = comment.comment_id === highlightedCommentId;

    return (
      <View
        key={comment.comment_id}
        ref={(ref: View | null) => commentRefs.current.set(comment.comment_id, ref)}
        style={[
          styles.commentContainer,
          { backgroundColor: theme.bg.card },
          isReply && [styles.replyContainer, { backgroundColor: theme.bg.secondary, borderLeftColor: theme.bg.border }],
          isHighlighted && {
            backgroundColor: isDark ? '#92400e' : '#FEF3C7',
            borderWidth: 2,
            borderColor: isDark ? '#f59e0b' : '#F59E0B',
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }
        ]}
      >
        <HStack style={{ alignItems: 'flex-start' }}>
          <ClickableAvatar
            userId={comment.user_id}
            nickname={comment.user?.nickname || emotion.label}
            isAnonymous={comment.is_anonymous}
            avatarUrl={comment.user?.profile_image_url}
            avatarText={emotion.emoji}
            avatarColor={emotion.color}
            size={32}
          />

          <VStack style={{ flex: 1, marginLeft: 12 }}>
            <HStack style={{ alignItems: 'center', marginBottom: 4 }} pointerEvents="box-none">
              <ClickableNickname
                userId={comment.user_id}
                nickname={comment.user?.nickname || emotion.label}
                isAnonymous={comment.is_anonymous}
                style={[styles.userName, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}
              >
                {comment.is_anonymous ? emotion.label : (comment.user?.nickname || emotion.label)}
              </ClickableNickname>
              {isOwner && (
                <Text style={[styles.ownerBadge, { color: isDark ? '#E5E5E5' : '#666666' }]}> [나]</Text>
              )}
              <Text style={[styles.commentDate, { color: isDark ? '#B3B3B3' : '#999999' }]}>
                {comment.created_at ? dayjs(comment.created_at).locale('ko').format('M월 D일 HH:mm') : '날짜 없음'}
              </Text>
            </HStack>

            <Text style={[styles.commentContent, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>{comment.content}</Text>

            <HStack style={{ alignItems: 'center', marginTop: 8, gap: 8 }}>
              <TouchableOpacity
                style={[
                  styles.commentActionButton,
                  { backgroundColor: comment.is_liked ? (isDark ? '#7f1d1d' : '#fef2f2') : theme.bg.secondary }
                ]}
                onPress={() => handleCommentLike(comment.comment_id)}
              >
                <MaterialCommunityIcons
                  name={comment.is_liked ? 'heart' : 'heart-outline'}
                  size={16}
                  color={comment.is_liked ? '#ef4444' : (isDark ? '#B3B3B3' : '#666666')}
                />
                <Text style={[
                  styles.commentActionText,
                  { color: comment.is_liked ? '#ef4444' : (isDark ? '#B3B3B3' : '#666666') }
                ]}>
                  {comment.like_count > 0 ? comment.like_count : '좋아요'}
                </Text>
              </TouchableOpacity>

              {!isReply && (
                <TouchableOpacity
                  style={[styles.commentActionButton, { backgroundColor: theme.bg.secondary }]}
                  onPress={() => handleReply(comment.comment_id)}
                >
                  <MaterialCommunityIcons
                    name="reply-outline"
                    size={16}
                    color={isDark ? '#B3B3B3' : '#666666'}
                  />
                  <Text style={[styles.commentActionText, { color: isDark ? '#B3B3B3' : '#666666' }]}>답글</Text>
                </TouchableOpacity>
              )}

              {isOwner ? (
                <>
                  <TouchableOpacity style={[styles.commentActionButton, { backgroundColor: theme.bg.secondary }]}>
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={16}
                      color={isDark ? '#B3B3B3' : '#666666'}
                    />
                    <Text style={[styles.commentActionText, { color: isDark ? '#B3B3B3' : '#666666' }]}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.commentActionButton, { backgroundColor: theme.bg.secondary }]}>
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={16}
                      color="#ef4444"
                    />
                    <Text style={[styles.commentActionText, { color: '#ef4444' }]}>삭제</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.commentActionButton, { backgroundColor: theme.bg.secondary }]}
                  onPress={() => handleBlockComment(comment.comment_id)}
                >
                  <MaterialCommunityIcons
                    name="cancel"
                    size={16}
                    color="#ef4444"
                  />
                  <Text style={[styles.commentActionText, { color: '#ef4444' }]}>차단</Text>
                </TouchableOpacity>
              )}
            </HStack>
          </VStack>
        </HStack>

        {comment.replies && comment.replies.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </View>
        )}
      </View>
    );
  }, [postId, user?.user_id, highlightedCommentId, handleCommentLike, handleReply, handleBlockComment, isDark, theme]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg.primary }]}>
        <Text style={{ fontSize: FONT_SIZES.bodySmall, color: isDark ? '#B3B3B3' : '#666666' }}>게시글을 불러오는 중...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.bg.primary }]}>
        <Text style={{ fontSize: FONT_SIZES.bodySmall, color: isDark ? '#B3B3B3' : '#666666' }}>게시글을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.secondary }}>
      {/* 헤더 */}
      <HStack style={[styles.header, { backgroundColor: theme.bg.card, borderBottomColor: theme.bg.border }]}>
        <TouchableOpacity
          onPress={navigation.goBack}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>나의 이야기</Text>
        <View style={{ width: 28 }} />
      </HStack>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* 게시물 카드 */}
        <Box style={[styles.postCard, { backgroundColor: theme.bg.card, shadowColor: isDark ? '#fff' : '#000', shadowOpacity: isDark ? 0.1 : 0.04 }]}>
          {/* 게시물 헤더 */}
          <HStack style={styles.postHeader} pointerEvents="box-none">
            <ClickableAvatar
              userId={post.user_id}
              nickname={post.user?.nickname || post.user?.username || '사용자'}
              isAnonymous={post.is_anonymous}
              avatarUrl={post.user?.profile_image_url}
              avatarText={post.emotions?.[0]?.name ? getRandomEmotion(post.user_id, post.post_id).emoji : undefined}
              avatarColor={post.emotions?.[0]?.color || post.emotion_color}
              size={48}
            />
            <VStack style={{ marginLeft: 12, flex: 1 }}>
              <HStack style={{ alignItems: 'center', marginBottom: 4 }} pointerEvents="box-none">
                <ClickableNickname
                  userId={post.user_id}
                  nickname={post.user?.nickname || post.user?.username || '사용자'}
                  isAnonymous={post.is_anonymous}
                  style={[styles.postNickname, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}
                >
                  {post.is_anonymous ? '익명' : (post.user?.nickname || post.user?.username || '사용자')}
                </ClickableNickname>
                {post.user_id === user?.user_id && (
                  <Text style={[styles.ownerBadge, { color: isDark ? '#E5E5E5' : '#666666' }]}> [나]</Text>
                )}
              </HStack>
              <Text style={[styles.postDate, { color: isDark ? '#B3B3B3' : '#999999' }]}>
                {post.created_at ? dayjs(post.created_at).locale('ko').format('M월 D일 (ddd)') : '날짜 없음'}
              </Text>
            </VStack>
          </HStack>

          {/* 내용 */}
          <TouchableOpacity
            style={{ paddingHorizontal: 20, paddingBottom: 20, position: 'relative' }}
            activeOpacity={1}
            onPress={handleDoubleTap}
          >
            <Text style={[styles.postContent, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>{post.content}</Text>

            {/* 텍스트 영역 더블탭 하트 애니메이션 */}
            {showLikeAnimation && !post.image_url && (
              <Animated.View style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: -25,
                marginLeft: -25,
                opacity: likeAnimationValue,
                transform: [{
                  scale: likeAnimationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.8],
                  })
                }]
              }}>
                <MaterialCommunityIcons name="heart" size={50} color="#ef4444" />
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* 이미지 */}
          {post.image_url && (
            <PostImage
              imageUrl={Array.isArray(post.image_url) ? post.image_url[0] : post.image_url}
              onDoubleTap={handleDoubleTap}
              showLikeAnimation={showLikeAnimation}
              likeAnimationValue={likeAnimationValue}
              isDark={isDark}
              backgroundColor={colors.background}
            />
          )}

          {/* 감정 태그 */}
          {post.emotions && post.emotions.length > 0 && (
            (() => {
              const emotionColor = post.emotions[0].color || '#666666';
              // 밝은 색상 체크
              const isLightColor = (hexColor: string) => {
                const hex = hexColor.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                return brightness > 180;
              };
              const textColor = isDark ? theme.text.primary : (isLightColor(emotionColor) ? '#333333' : emotionColor);
              return (
                <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: FONT_SIZES.small, color: isDark ? '#B3B3B3' : '#666666', fontFamily: 'Pretendard-Medium' }}>오늘의 감정</Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? emotionColor + '30' : emotionColor + '25',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: isDark ? emotionColor + '60' : emotionColor + '50',
                    }}>
                      <Text style={{ fontSize: FONT_SIZES.bodyLarge }}>
                        {getRandomEmotion(post.user_id, post.post_id).emoji}
                      </Text>
                      <Text style={{
                        fontSize: FONT_SIZES.caption,
                        fontFamily: 'Pretendard-Bold',
                        color: textColor,
                        marginLeft: 6,
                      }}>
                        {post.emotions[0].name}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()
          )}

          {/* 액션 버튼 영역 */}
          <HStack style={[styles.actionContainer, { borderTopColor: theme.bg.border }]}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={handlePostLike}
              disabled={isLikingPost}
            >
              <MaterialCommunityIcons
                name={post.is_liked ? 'heart' : 'heart-outline'}
                size={24}
                color={post.is_liked ? '#ef4444' : colors.textSecondary}
              />
              <Text style={{
                fontSize: FONT_SIZES.bodySmall,
                fontFamily: 'Pretendard-SemiBold',
                color: post.is_liked ? '#ef4444' : colors.textSecondary
              }}>
                {post.like_count}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => {
                setTimeout(() => {
                  textInputRef.current?.focus();
                }, 100);
              }}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={24}
                color={colors.textSecondary}
              />
              <Text style={{
                fontSize: FONT_SIZES.bodySmall,
                fontFamily: 'Pretendard-SemiBold',
                color: colors.textSecondary
              }}>
                {post.comment_count}
              </Text>
            </TouchableOpacity>
          </HStack>
        </Box>

        {/* 댓글 섹션 - Bottom Sheet 열기 버튼 */}
        <TouchableOpacity
          onPress={() => commentBottomSheetRef.current?.open()}
          style={{
            margin: 12,
            marginTop: 8,
            padding: 16,
            backgroundColor: theme.bg.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          activeOpacity={0.7}
        >
          <HStack style={{ alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons
              name="comment-text-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={{
              fontSize: getResponsiveFontSize(14),
              fontFamily: 'Pretendard-SemiBold',
              color: isDark ? '#FFFFFF' : '#1A1A1A',
            }}>
              댓글 {comments.length}개
            </Text>
            {bestComments.length > 0 && (
              <View style={{
                backgroundColor: '#fbbf24',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <Text style={{ fontSize: 10, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                  베스트 {bestComments.length}
                </Text>
              </View>
            )}
          </HStack>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={isDark ? '#B3B3B3' : '#666666'}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* 하단 액션 바 */}
      <View style={[styles.commentInputContainer, { backgroundColor: theme.bg.card, borderTopColor: theme.bg.border }]}>
        <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <HStack style={{ alignItems: 'center', gap: 20 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={handlePostLike}
            >
              <MaterialCommunityIcons
                name={post?.is_liked ? 'heart' : 'heart-outline'}
                size={24}
                color={post?.is_liked ? '#FF3B30' : (isDark ? '#E5E7EB' : '#64748b')}
              />
              <Text style={{
                fontSize: getResponsiveFontSize(13),
                fontFamily: 'Pretendard-SemiBold',
                color: post?.is_liked ? '#FF3B30' : (isDark ? '#E5E7EB' : '#64748b')
              }}>
                {post?.like_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => commentBottomSheetRef.current?.open()}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={24}
                color={isDark ? '#D1D5DB' : '#64748b'}
              />
              <Text style={{
                fontSize: getResponsiveFontSize(13),
                fontFamily: 'Pretendard-SemiBold',
                color: isDark ? '#D1D5DB' : '#64748b'
              }}>
                {comments.length}
              </Text>
            </TouchableOpacity>
          </HStack>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
            onPress={() => commentBottomSheetRef.current?.expand()}
          >
            <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
            <Text style={{ marginLeft: 6, color: '#fff', fontSize: getResponsiveFontSize(12), fontFamily: 'Pretendard-SemiBold' }}>
              댓글 달기
            </Text>
          </TouchableOpacity>
        </HStack>
      </View>

      {/* CommentBottomSheet */}
      <CommentBottomSheet
        ref={commentBottomSheetRef}
        comments={comments as BSComment[]}
        bestComments={bestComments as BSComment[]}
        totalCount={comments.length}
        postId={postId}
        postUserId={post?.user_id}
        postType="myday"
        loading={isLoading}
        hasMore={false}
        onSubmitComment={async (content, anonymous, parentId) => {
          const commentData = {
            content: parentId
              ? `@${comments.find(c => c.comment_id === parentId)?.user?.nickname || '익명'} ${content}`
              : content,
            is_anonymous: anonymous,
            parent_comment_id: parentId
          };

          const response = await myDayService.addComment(postId, commentData);
          if (response.status === 'success' || response.data?.status === 'success') {
            const newComment = response.data.data || response.data;
            if (parentId) {
              // 답글은 맨 뒤에 추가 (시간순 유지)
              setComments(prev => prev.map(c => {
                if (c.comment_id === parentId) {
                  return { ...c, replies: [...(c.replies || []), { ...newComment, replies: [] }] };
                }
                return c;
              }));
            } else {
              // 최상위 댓글은 맨 뒤에 추가 (시간순 유지)
              setComments(prev => [...prev, { ...newComment, replies: [] }]);
            }
          }
        }}
        onLikeComment={(c: BSComment) => handleCommentLike(c.comment_id)}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onLongPressComment={(c: BSComment) => {
          setBlockCommentId(c.comment_id);
          setBlockModalVisible(true);
        }}
        onRefresh={loadPostData}
        isAuthenticated={!!user}
      />

      <BlockReasonModal
        visible={blockModalVisible}
        onClose={() => {
          setBlockModalVisible(false);
          setBlockCommentId(null);
        }}
        onBlock={handleBlockConfirm}
        targetName="이 댓글"
      />

      <ModernToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      {/* 댓글 수정 모달 */}
      <Modal
        visible={!!editingComment}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingComment(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={1}
            onPress={() => setEditingComment(null)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                width: '85%',
                backgroundColor: theme.bg.card,
                borderRadius: 16,
                padding: 20,
                maxHeight: '70%',
              }}
            >
              <Text style={{
                fontSize: getResponsiveFontSize(18),
                fontFamily: 'Pretendard-Bold',
                color: theme.text.primary,
                marginBottom: 16,
              }}>
                댓글 수정
              </Text>

              <RNTextInput
                value={editCommentText}
                onChangeText={setEditCommentText}
                placeholder="댓글 내용을 입력하세요"
                placeholderTextColor={theme.text.tertiary}
                multiline
                maxLength={500}
                style={{
                  backgroundColor: theme.bg.secondary,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: getResponsiveFontSize(14),
                  color: theme.text.primary,
                  minHeight: 100,
                  maxHeight: 200,
                  textAlignVertical: 'top',
                }}
              />

              <HStack style={{ marginTop: 16, gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setEditingComment(null)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.bg.secondary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: getResponsiveFontSize(14),
                    fontFamily: 'Pretendard-SemiBold',
                    color: theme.text.secondary,
                  }}>
                    취소
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveCommentEdit}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: getResponsiveFontSize(14),
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#FFFFFF',
                  }}>
                    수정
                  </Text>
                </TouchableOpacity>
              </HStack>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-Bold',
  },
  postCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  postNickname: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Bold',
  },
  postDate: {
    fontSize: FONT_SIZES.caption,
  },
  ownerBadge: {
    fontSize: FONT_SIZES.tiny,
    fontFamily: 'Pretendard-Bold',
    marginLeft: 4,
  },
  postContent: {
    fontSize: FONT_SIZES.body,
    lineHeight: 24,
  },
  actionContainer: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  commentSection: {
    margin: 8,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentTitle: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Bold',
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  collapseText: {
    fontSize: FONT_SIZES.caption,
    fontFamily: 'Pretendard-Medium',
    marginLeft: 4,
  },
  bestCommentsSection: {
    marginBottom: 16,
  },
  bestCommentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  bestCommentsTitle: {
    fontSize: FONT_SIZES.small,
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: 6,
  },
  bestComment: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    position: 'relative',
  },
  bestRank: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  bestRankText: {
    fontSize: FONT_SIZES.tiny,
    fontFamily: 'Pretendard-Bold',
    color: '#fff',
  },
  bestCommentUser: {
    fontSize: FONT_SIZES.small,
    fontFamily: 'Pretendard-SemiBold',
  },
  bestCommentLikes: {
    fontSize: FONT_SIZES.small,
    fontFamily: 'Pretendard-Medium',
    marginLeft: 4,
  },
  bestCommentContent: {
    fontSize: FONT_SIZES.caption,
    lineHeight: 20,
  },
  commentContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  replyContainer: {
    marginLeft: 40,
    paddingLeft: 16,
    borderLeftWidth: 2,
  },
  userName: {
    fontSize: FONT_SIZES.caption,
    fontFamily: 'Pretendard-SemiBold',
  },
  commentDate: {
    fontSize: FONT_SIZES.small,
    marginLeft: 8,
  },
  commentContent: {
    fontSize: FONT_SIZES.bodySmall,
    lineHeight: 22,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  commentActionText: {
    fontSize: FONT_SIZES.caption,
    fontFamily: 'Pretendard-SemiBold',
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyIndicatorText: {
    fontSize: FONT_SIZES.caption,
    fontFamily: 'Pretendard-Medium',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FONT_SIZES.bodySmall,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {},
});

export default MyDayDetailScreen;
