import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import postService from '../services/api/postService';
import comfortWallService from '../services/api/comfortWallService';
import commentService from '../services/api/commentService';
import blockService, { BlockedContent } from '../services/api/blockService';
import { RootStackParamList } from '../types/navigation';
import { normalizeImageUrl } from '../utils/imageUtils';
import InstagramCommentItem from '../components/InstagramCommentItem';
import { optimizeCommentTree, validateCommentContent, sanitizeCommentContent, formatInstagramTime } from '../utils/commentUtils';
import ClickableNickname from '../components/ClickableNickname';
import EmotionLoginPromptModal from '../components/EmotionLoginPromptModal';
import { FONT_SIZES } from '../constants';

type CommentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Comment'>;
type CommentScreenRouteProp = RouteProp<RootStackParamList, 'Comment'>;

interface Post {
  post_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
}

interface Comment {
  comment_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  like_count: number;
  created_at: string;
  parent_comment_id?: number;
  user?: {
    nickname: string;
    profile_image_url?: string;
    is_author?: boolean;
  };
  replies?: Comment[];
  is_liked?: boolean;
}

// 반응형 스케일링 (프로젝트 규칙 준수) - React Native 0.80 호환
const BASE_WIDTH = 360;
const getScreenWidth = () => {
  try {
    const w = Dimensions.get('window').width;
    if (w > 0) return w;
  } catch (e) {}
  return BASE_WIDTH;
};
const getScreenHeight = () => {
  try {
    const h = Dimensions.get('window').height;
    if (h > 0) return h;
  } catch (e) {}
  return 780;
};
const scaleFont = (size: number) => {
  const scale = Math.min(Math.max(getScreenWidth() / BASE_WIDTH, 0.9), 1.3);
  return Math.round(size * scale);
};
const scaleSize = (size: number) => (getScreenWidth() / BASE_WIDTH) * size;

const CommentScreen: React.FC = () => {
  const navigation = useNavigation<CommentScreenNavigationProp>();
  const route = useRoute<CommentScreenRouteProp>();
  const { user } = useAuth();
  const { theme, isDark } = useModernTheme();
  const { postId } = route.params as { postId: number };
  const insets = useSafeAreaInsets();

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [blockedContents, setBlockedContents] = useState<BlockedContent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 감정 중심 로그인 프롬프트 모달 상태
  const [emotionLoginPromptVisible, setEmotionLoginPromptVisible] = useState(false);
  const [emotionLoginPromptAction, setEmotionLoginPromptAction] = useState<'like' | 'comment' | 'post' | 'profile'>('comment');

  // 스켈레톤 로딩 컴포넌트
  const SkeletonComment = () => {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const opacity = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <View style={styles.skeletonContainer}>
        <Animated.View style={[styles.skeletonAvatar, { opacity, backgroundColor: theme.bg.border }]} />
        <View style={{ flex: 1 }}>
          <Animated.View style={[styles.skeletonLine, { opacity, width: '40%', backgroundColor: theme.bg.border }]} />
          <Animated.View style={[styles.skeletonLine, { opacity, width: '80%', marginTop: 8, backgroundColor: theme.bg.border }]} />
        </View>
      </View>
    );
  };

  // 키보드 이벤트 리스너
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event: any) => {
      const height = event.endCoordinates.height;
      setKeyboardHeight(height);
      // 키보드가 나타날 때 자동으로 맨 아래로 스크롤 (Android 전용)
      if (Platform.OS === 'android') {
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 300);
      }
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    const keyboardWillShowListener = Platform.OS === 'ios' ?
      Keyboard.addListener('keyboardWillShow', (event: any) => {
        setKeyboardHeight(event.endCoordinates.height);
        // iOS에서 키보드 나타날 때 스크롤
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }) : null;

    const keyboardWillHideListener = Platform.OS === 'ios' ?
      Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
      }) : null;

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  // 화면 포커스시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      fetchData(1, false);
    }, [postId])
  );

  // 무한 스크롤 핸들러
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchData(page + 1, true);
    }
  }, [loadingMore, hasMore, loading, page, fetchData]);

  // 헤더 설정
  useEffect(() => {
    navigation.setOptions({
      title: '댓글',
      headerStyle: {
        backgroundColor: theme.bg.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.bg.border,
      },
      headerTintColor: theme.text.primary,
      headerTitleStyle: {
        fontSize: FONT_SIZES.h3,
        fontWeight: '600',
        color: theme.text.primary,
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, isDark]);

  // 데이터 로드
  const fetchData = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setComments([]);
      } else {
        setLoadingMore(true);
      }

      // 차단된 콘텐츠 목록 가져오기 (첫 페이지에만)
      let blockedList: BlockedContent[] = [];
      if (pageNum === 1) {
        try {
          const blockResponse = await blockService.getBlockedContents();
          if (blockResponse.status === 'success' && blockResponse.data) {
            blockedList = blockResponse.data;
            setBlockedContents(blockedList);
          }
        } catch (error) {
          console.log('차단 목록 로딩 실패:', error);
        }
      } else {
        blockedList = blockedContents;
      }

      // 게시물 정보 가져오기 (첫 페이지에만)
      if (pageNum === 1) {
        let postResponse;
        try {
          postResponse = await comfortWallService.getPostDetail(postId);
        } catch {
          postResponse = await postService.getPostById(postId);
        }

        if (postResponse.data?.status === 'success' && postResponse.data.data) {
          setPost(postResponse.data.data);
        }
      }

      // 댓글 페이지네이션 로드
      try {
        const commentsResponse = await postService.getComments(postId, { page: pageNum.toString(), limit: '20' });
        if (commentsResponse.status === 'success' && commentsResponse.data) {
          const newComments = (commentsResponse.data.comments || [])
            .map((comment: any) => ({
              ...comment,
              created_at: comment.created_at || new Date().toISOString()
            }))
            .filter((comment: any) => !blockService.isContentBlocked(blockedList, 'comment', comment.comment_id));

          if (append) {
            setComments(prev => [...prev, ...newComments]);
          } else {
            setComments(newComments);
          }

          setHasMore(commentsResponse.data.has_more || false);
          setPage(pageNum);
        }
      } catch (error) {
        console.error('댓글 로딩 오류:', error);
        if (pageNum === 1) {
          setComments([]);
        }
      }
    } catch (error) {
      console.error('댓글 데이터 로딩 오류:', error);
      if (pageNum === 1) {
        Alert.alert('오류', '댓글을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, blockedContents]);



  // 댓글 작성 (Optimistic UI + 트래픽 최적화 + 보안 강화)
  const handleSubmitComment = async () => {
    if (!user) {
      setEmotionLoginPromptAction('comment');
      setEmotionLoginPromptVisible(true);
      return;
    }

    // 보안: XSS 방지를 위한 입력 정제
    const sanitizedText = sanitizeCommentContent(commentText);

    const validation = validateCommentContent(sanitizedText);
    if (!validation.isValid) {
      ReactNativeHapticFeedback.trigger('notificationError', { enableVibrateFallback: true });
      Alert.alert('오류', validation.error);
      return;
    }

    try {
      setSubmitting(true);
      ReactNativeHapticFeedback.trigger('impactMedium', { enableVibrateFallback: true });

      // [comment_id] 제거 후 정규화 (보안 강화, 한글 완벽 지원)
      const cleanedContent = sanitizedText.trim().replace(/@([가-힣\w😀-🙏]+)\s*\[\d+\]/gu, '@$1');
      const normalizedContent = cleanedContent.normalize('NFC').substring(0, 200);
      const tempId = Date.now();

      // Optimistic UI: 즉시 화면에 추가 (트래픽 감소)
      const optimisticComment: Comment = {
        comment_id: tempId,
        user_id: user.user_id,
        content: normalizedContent,
        is_anonymous: isAnonymous,
        like_count: 0,
        created_at: new Date().toISOString(),
        parent_comment_id: replyingTo?.comment_id,
        user: { nickname: user.nickname, profile_image_url: user.profile_image_url },
        is_liked: false,
      };

      setComments(prev => [...prev, optimisticComment]);
      setCommentText('');
      setReplyingTo(null);

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      const commentData = {
        content: normalizedContent,
        is_anonymous: isAnonymous,
        parent_comment_id: replyingTo?.comment_id || undefined,
      };

      let response;
      try {
        response = await comfortWallService.addComment(postId, commentData);
      } catch {
        response = await postService.addComment(postId, commentData);
      }

      if (response.status === 'success') {
        ReactNativeHapticFeedback.trigger('notificationSuccess', { enableVibrateFallback: true });
        // 실제 데이터로 교체
        setComments(prev => prev.map(c =>
          c.comment_id === tempId && response.data ? response.data : c
        ));
      } else {
        // 실패시 롤백
        setComments(prev => prev.filter(c => c.comment_id !== tempId));
        Alert.alert('오류', '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      ReactNativeHapticFeedback.trigger('notificationError', { enableVibrateFallback: true });
      Alert.alert('오류', '댓글 작성 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 답글 작성
  const handleReply = useCallback((comment: Comment) => {
    ReactNativeHapticFeedback.trigger('impactLight', { enableVibrateFallback: true });
    const displayName = comment.is_anonymous ? '익명' : comment.user?.nickname || '사용자';
    setReplyingTo(comment);
    setCommentText(`@${displayName} `);
    textInputRef.current?.focus();
  }, []);


  // 게시물 요약 렌더링 (리렌더링 최적화)
  const renderPostSummary = useCallback(() => (
    <View style={[styles.postSummary, {
      backgroundColor: theme.bg.card,
      borderBottomColor: theme.bg.border,
    }]}>
      <View style={styles.postHeader}>
        {/* 프로필 사진 또는 아바타 */}
        {!post?.is_anonymous && post?.user?.profile_image_url ? (
          <Image
            key={`post-profile-${post.post_id}`}
            source={{ uri: normalizeImageUrl(post.user.profile_image_url) }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              marginRight: 12,
            }}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.text.primary }]}>
            <Text style={[styles.avatarText, { color: theme.bg.primary }]}>
              {post?.is_anonymous ? '익' : (post?.user?.nickname?.[0] || 'U')}
            </Text>
          </View>
        )}
        <View style={styles.postInfo}>
          <Text style={[styles.postAuthor, { color: theme.text.primary }]}>
            {post?.is_anonymous ? '익명' : (post?.user?.nickname || '사용자')}
          </Text>
          <Text style={[styles.postTime, { color: theme.text.secondary }]}>{formatInstagramTime(post?.created_at || '')}</Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: theme.text.primary }]} numberOfLines={3}>
        {post?.content}
      </Text>
    </View>
  ), [post, theme]);

  // 댓글 수정 처리
  const handleEditComment = useCallback(async (commentId: number, newContent: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.comment_id === commentId) {
        return { ...comment, content: newContent };
      }
      return comment;
    }));
    await fetchData(); // 서버 데이터와 동기화
  }, [fetchData]);

  // 댓글 삭제 처리
  const handleDeleteComment = useCallback(async (commentId: number) => {
    try {
      console.log('🗑️ 댓글 삭제 시작:', commentId);

      // 사용자 확인
      Alert.alert(
        '댓글 삭제',
        '정말로 이 댓글을 삭제하시겠습니까?\n삭제된 댓글은 복구할 수 없습니다.',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                // 로딩 상태 표시 (선택적)
                setSubmitting(true);

                // API를 통해 댓글 삭제
                await commentService.deleteComment(commentId);

                console.log('✅ 댓글 삭제 성공:', commentId);

                // 성공적으로 삭제된 후 전체 댓글 목록 새로고침
                await fetchData();

                // 답글이 있던 댓글이 삭제되었을 수도 있으므로 답글 상태 초기화
                setReplyingTo(null);

              } catch (error: any) {
                console.error('❌ 댓글 삭제 실패:', error);
                Alert.alert(
                  '삭제 실패',
                  error.message || '댓글 삭제 중 오류가 발생했습니다.',
                  [{ text: '확인' }]
                );
              } finally {
                setSubmitting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ 댓글 삭제 중 예외 발생:', error);
    }
  }, [fetchData]);

  // 사용자 프로필 보기
  const handleUserProfile = useCallback((userId: number, nickname?: string) => {
    if (!userId || userId === user?.user_id) {
      return;
    }
    navigation.navigate('UserProfile', {
      userId,
      nickname,
    });
  }, [navigation, user?.user_id]);

  // 댓글 차단 처리
  const handleCommentBlocked = useCallback(async (commentId: number) => {
    console.log('✅ 댓글 차단 완료:', commentId);
    // 댓글 목록에서 제거
    setComments(prev => prev.filter(comment => comment.comment_id !== commentId));
    // 전체 데이터 새로고침
    await fetchData();
  }, [fetchData]);

  // 댓글 렌더링 (InstagramCommentItem 사용)
  const renderComment = useCallback(({ item }: { item: Comment }) => (
    <InstagramCommentItem
      comment={item}
      currentUserId={user?.user_id}
      isPostAuthor={post?.user_id === item.user_id}
      depth={0}
      onReply={handleReply}
      onEdit={handleEditComment}
      onDelete={handleDeleteComment}
      onUserProfile={handleUserProfile}
      onRefresh={fetchData}
      onCommentBlocked={handleCommentBlocked}
    />
  ), [user?.user_id, post?.user_id, handleReply, handleEditComment, handleDeleteComment, handleUserProfile, fetchData, handleCommentBlocked]);

  const commentTree = optimizeCommentTree(comments);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonPostContainer}>
            <SkeletonComment />
            <SkeletonComment />
            <SkeletonComment />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const charCount = commentText.length;
  const maxChars = 200;
  const charCountColor = charCount > maxChars * 0.9 ? '#FF3B30' : theme.text.tertiary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.bg.primary }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={commentTree}
          renderItem={renderComment}
          keyExtractor={(item: Comment) => item.comment_id.toString()}
          ListHeaderComponent={renderPostSummary}
          contentContainerStyle={[
            styles.commentsList,
            {
              paddingBottom: Platform.OS === 'android' && keyboardHeight > 0
                ? keyboardHeight + 120
                : 20
            }
          ]}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          getItemLayout={undefined}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="comment-outline" size={48} color={theme.text.tertiary} />
              <Text style={[styles.emptyText, { color: theme.text.secondary }]}>아직 댓글이 없습니다.</Text>
              <Text style={[styles.emptySubText, { color: theme.text.tertiary }]}>첫 번째 댓글을 남겨보세요!</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={theme.text.secondary} />
                <Text style={[styles.loadingMoreText, { color: theme.text.secondary }]}>댓글 불러오는 중...</Text>
              </View>
            ) : null
          }
          onRefresh={() => fetchData(1, false)}
          refreshing={loading}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
        />
        
        {/* 댓글 입력 */}
        <View style={[
          styles.inputContainer,
          {
            paddingBottom: insets.bottom + 12,
            backgroundColor: theme.bg.primary,
            borderTopColor: theme.bg.border,
          },
          Platform.OS === 'android' && keyboardHeight > 0 && {
            position: 'absolute',
            bottom: keyboardHeight,
            left: 0,
            right: 0,
            zIndex: 1000,
          }
        ]}>
          {replyingTo && (
            <View style={[styles.replyingIndicator, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[styles.replyingText, { color: theme.text.secondary }]}>
                {replyingTo.is_anonymous ? '익명' : replyingTo.user?.nickname}님에게 답글
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReplyingTo(null);
                  setCommentText('');
                }}
              >
                <MaterialCommunityIcons name="close" size={scaleSize(16)} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.anonymousToggle}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={[
                styles.checkbox,
                { borderColor: theme.bg.border },
                isAnonymous && { backgroundColor: theme.text.primary, borderColor: theme.text.primary }
              ]}>
                {isAnonymous && (
                  <MaterialCommunityIcons name="check" size={12} color={theme.bg.primary} />
                )}
              </View>
              <Text style={[styles.anonymousText, { color: theme.text.secondary }]}>익명</Text>
            </TouchableOpacity>

            <TextInput
              ref={textInputRef}
              style={[styles.textInput, {
                backgroundColor: theme.bg.secondary,
                borderColor: theme.bg.border,
                color: theme.text.primary,
              }]}
              placeholder="댓글 달기..."
              placeholderTextColor={theme.text.tertiary}
              value={commentText}
              onChangeText={setCommentText}
              onFocus={() => {
                // 포커스시 약간의 딜레이 후 스크롤
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 200);
              }}
              multiline
              maxLength={200}
            />

            <TouchableOpacity
              style={[styles.sendButton, (!commentText.trim() || submitting) && styles.sendButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={theme.text.tertiary} />
              ) : (
                <Text style={[
                  styles.sendButtonText,
                  { color: theme.text.primary },
                  (!commentText.trim() || submitting) && { color: theme.text.tertiary }
                ]}>
                  게시
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 감정 중심 로그인 프롬프트 모달 */}
      <EmotionLoginPromptModal
        visible={emotionLoginPromptVisible}
        onClose={() => setEmotionLoginPromptVisible(false)}
        onLogin={() => {
          setEmotionLoginPromptVisible(false);
          navigation.navigate('Auth', { screen: 'Login' });
        }}
        onRegister={() => {
          setEmotionLoginPromptVisible(false);
          navigation.navigate('Auth', { screen: 'Register' });
        }}
        actionType={emotionLoginPromptAction}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONT_SIZES.bodyLarge,
  },
  skeletonPostContainer: {
    padding: 16,
  },
  skeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  postSummary: {
    padding: 16,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
  },
  postInfo: {
    flex: 1,
  },
  postAuthor: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  postTime: {
    fontSize: scaleFont(13),
    marginTop: 2,
  },
  postContent: {
    fontSize: scaleFont(16),
    lineHeight: scaleFont(24),
    letterSpacing: -0.1,
  },
  commentsList: {
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: scaleFont(16),
    marginTop: 16,
    letterSpacing: -0.2,
  },
  emptySubText: {
    fontSize: scaleFont(14),
    marginTop: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: scaleSize(16),
    paddingVertical: 12,
  },
  replyingIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyingText: {
    fontSize: scaleFont(14),
    letterSpacing: -0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
  },
  anonymousText: {
    fontSize: scaleFont(13),
    letterSpacing: -0.1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: scaleSize(16),
    paddingVertical: 8,
    fontSize: scaleFont(16),
    lineHeight: scaleFont(22),
    maxHeight: 80,
  },
  sendButton: {
    paddingHorizontal: scaleSize(16),
    paddingVertical: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sendButtonTextDisabled: {
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    fontSize: scaleFont(13),
    marginTop: 8,
    letterSpacing: -0.1,
  },
});

export default CommentScreen;