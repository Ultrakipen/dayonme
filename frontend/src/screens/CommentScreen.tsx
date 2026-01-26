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
import myDayService from '../services/api/myDayService';
import commentService from '../services/api/commentService';
import blockService, { BlockedContent } from '../services/api/blockService';
import { RootStackParamList } from '../types/navigation';
import { normalizeImageUrl } from '../utils/imageUtils';
import InstagramCommentItem from '../components/InstagramCommentItem';
import { optimizeCommentTree, validateCommentContent, sanitizeCommentContent, formatInstagramTime } from '../utils/commentUtils';
import ClickableNickname from '../components/ClickableNickname';
import EmotionLoginPromptModal from '../components/EmotionLoginPromptModal';
import { FONT_SIZES } from '../constants';
import { EMOTION_AVATARS, getTwemojiUrl } from '../constants/emotions';
import FastImage from 'react-native-fast-image';

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

// 메모이즈된 입력 컴포넌트 - 타이핑 시 부모 재렌더링 방지
interface CommentInputProps {
  onSubmit: (text: string, isAnonymous: boolean) => Promise<void>;
  replyingTo: Comment | null;
  onCancelReply: () => void;
  theme: any;
  submitting: boolean;
  flatListRef: React.RefObject<FlatList>;
  insets: { bottom: number };
  keyboardHeight: number;
}

const CommentInput = React.memo(({
  onSubmit,
  replyingTo,
  onCancelReply,
  theme,
  submitting,
  flatListRef,
  insets,
  keyboardHeight,
}: CommentInputProps) => {
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // replyingTo 변경 시 @멘션 추가
  useEffect(() => {
    if (replyingTo) {
      const displayName = replyingTo.is_anonymous ? '익명' : replyingTo.user?.nickname || '사용자';
      setText(`@${displayName} `);
      textInputRef.current?.focus();
    }
  }, [replyingTo]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    try {
      await onSubmit(text.trim(), isAnonymous);
      setText('');
      setIsAnonymous(false);
      // 제출 후 키보드 닫기 및 포커스 해제
      Keyboard.dismiss();
      textInputRef.current?.blur();
    } catch (error) {
      // 에러는 부모에서 처리
    }
  };

  const handleCancelReply = () => {
    setText('');
    onCancelReply();
  };

  // 입력창 스타일 - 화면 하단 절대 위치, 키보드 높이만큼 올라감
  return (
    <View style={[
      styles.inputContainer,
      {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: keyboardHeight,
        paddingBottom: keyboardHeight > 0 ? 12 : (Platform.OS === 'ios' ? insets.bottom + 12 : 12),
        backgroundColor: theme.bg.primary,
        borderTopColor: theme.bg.border,
      }
    ]}>
      {replyingTo && (
        <View style={[styles.replyingIndicator, { backgroundColor: theme.bg.secondary }]}>
          <Text style={[styles.replyingText, { color: theme.text.secondary }]}>
            {replyingTo.is_anonymous ? '익명' : replyingTo.user?.nickname}님에게 답글
          </Text>
          <TouchableOpacity onPress={handleCancelReply}>
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
          value={text}
          onChangeText={setText}
          onFocus={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 200);
          }}
          multiline
          maxLength={200}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || submitting) && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!text.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.text.tertiary} />
          ) : (
            <Text style={[
              styles.sendButtonText,
              { color: theme.text.primary },
              (!text.trim() || submitting) && { color: theme.text.tertiary }
            ]}>
              게시
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const CommentScreen: React.FC = () => {
  const navigation = useNavigation<CommentScreenNavigationProp>();
  const route = useRoute<CommentScreenRouteProp>();
  const { user } = useAuth();
  const { theme, isDark } = useModernTheme();
  // showPostInfo: 알림/목록에서 직접 진입 시 true, 글 상세보기에서 진입 시 false
  const { postId, postType, showPostInfo = true } = route.params as {
    postId: number;
    postType?: string;
    showPostInfo?: boolean;
  };
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [blockedContents, setBlockedContents] = useState<BlockedContent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);

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
      // 키보드가 나타날 때 자동으로 맨 아래로 스크롤
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    // iOS 전용 - 더 부드러운 애니메이션을 위해
    const keyboardWillShowListener = Platform.OS === 'ios' ?
      Keyboard.addListener('keyboardWillShow', (event: any) => {
        setKeyboardHeight(event.endCoordinates.height);
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
        fontFamily: 'Pretendard-SemiBold',
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
          if (__DEV__) console.log('차단 목록 로딩 실패:', error);
        }
      } else {
        blockedList = blockedContents;
      }

      // 게시물 정보 가져오기 (첫 페이지에만)
      if (pageNum === 1) {
        let postResponse;
        try {
          // postType에 따라 적절한 서비스 사용
          if (postType === 'comfort') {
            postResponse = await comfortWallService.getPostDetail(postId);
          } else if (postType === 'myday' || postType === 'my_day') {
            postResponse = await myDayService.getPostById(postId);
          } else {
            postResponse = await postService.getPostById(postId);
          }
        } catch {
          // fallback: 다른 서비스 시도
          try {
            postResponse = await comfortWallService.getPostDetail(postId);
          } catch {
            postResponse = await postService.getPostById(postId);
          }
        }

        // 응답 구조 정규화 (서비스별 응답 구조 차이 처리)
        if (postResponse) {
          // myDayService는 response.data 반환, comfortWallService는 axios response 반환
          const responseData = postResponse.data || postResponse;
          const postData = responseData?.data || responseData;
          if (postData && (postData.post_id || postData.id)) {
            setPost(postData);
          }
        }
      }

      // 댓글 페이지네이션 로드 - postType에 따라 적절한 서비스 사용
      try {
        let commentsResponse;
        if (postType === 'comfort') {
          commentsResponse = await comfortWallService.getComments(postId, { page: pageNum.toString(), limit: '20' });
        } else if (postType === 'myday' || postType === 'my_day') {
          commentsResponse = await myDayService.getComments(postId, { page: pageNum.toString(), limit: '20' });
        } else {
          commentsResponse = await postService.getComments(postId, { page: pageNum.toString(), limit: '20' });
        }

        if (__DEV__) console.log('📋 [CommentScreen] 댓글 API 응답:', JSON.stringify(commentsResponse, null, 2));

        // 다양한 응답 구조 처리 (Axios 래핑 여부에 따라)
        let commentsData: any[] = [];
        let hasMoreData = false;

        // Axios 응답: { data: { status: 'success', data: { comments: [...] } } }
        if (commentsResponse.data?.status === 'success' && commentsResponse.data?.data) {
          commentsData = commentsResponse.data.data.comments || commentsResponse.data.data || [];
          hasMoreData = commentsResponse.data.data.has_more || false;
        }
        // Axios 응답: { data: { status: 'success', comments: [...] } }
        else if (commentsResponse.data?.status === 'success' && commentsResponse.data?.comments) {
          commentsData = commentsResponse.data.comments || [];
          hasMoreData = commentsResponse.data.has_more || false;
        }
        // 직접 응답: { status: 'success', data: { comments: [...] } }
        else if (commentsResponse.status === 'success' && commentsResponse.data) {
          commentsData = commentsResponse.data.comments || commentsResponse.data || [];
          hasMoreData = commentsResponse.data.has_more || false;
        }
        // 배열 직접 반환
        else if (Array.isArray(commentsResponse.data)) {
          commentsData = commentsResponse.data;
        }

        if (__DEV__) console.log('📋 [CommentScreen] 파싱된 댓글 수:', commentsData.length);

        const newComments = commentsData
          .map((comment: any) => ({
            ...comment,
            user: comment.User || comment.user, // User 필드 호환성
            created_at: comment.created_at || new Date().toISOString()
          }))
          .filter((comment: any) => !blockService.isContentBlocked(blockedList, 'comment', comment.comment_id));

        if (append) {
          setComments(prev => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }

        setHasMore(hasMoreData);
        setPage(pageNum);
      } catch (error) {
        if (__DEV__) console.error('댓글 로딩 오류:', error);
        if (pageNum === 1) {
          setComments([]);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('댓글 데이터 로딩 오류:', error);
      if (pageNum === 1) {
        Alert.alert('오류', '댓글을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, postType, blockedContents]);



  // 댓글 작성 (Optimistic UI + 트래픽 최적화 + 보안 강화)
  // CommentInput 컴포넌트에서 호출하는 버전
  const handleSubmitComment = useCallback(async (inputText: string, inputIsAnonymous: boolean) => {
    if (!user) {
      setEmotionLoginPromptAction('comment');
      setEmotionLoginPromptVisible(true);
      throw new Error('로그인이 필요합니다');
    }

    // 보안: XSS 방지를 위한 입력 정제
    const sanitizedText = sanitizeCommentContent(inputText);

    const validation = validateCommentContent(sanitizedText);
    if (!validation.isValid) {
      ReactNativeHapticFeedback.trigger('notificationError', { enableVibrateFallback: true });
      Alert.alert('오류', validation.error || '유효하지 않은 댓글입니다');
      throw new Error(validation.error);
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
        is_anonymous: inputIsAnonymous,
        like_count: 0,
        created_at: new Date().toISOString(),
        parent_comment_id: replyingTo?.comment_id,
        user: { nickname: user.nickname, profile_image_url: user.profile_image_url },
        is_liked: false,
      };

      setComments(prev => [...prev, optimisticComment]);
      setReplyingTo(null);

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      const commentData = {
        content: normalizedContent,
        is_anonymous: inputIsAnonymous,
        parent_comment_id: replyingTo?.comment_id || undefined,
      };

      let response;
      try {
        // postType에 따라 적절한 서비스 사용
        if (postType === 'comfort') {
          response = await comfortWallService.addComment(postId, commentData);
        } else if (postType === 'myday' || postType === 'my_day') {
          response = await myDayService.addComment(postId, commentData);
        } else {
          response = await postService.addComment(postId, commentData);
        }
      } catch {
        // fallback
        try {
          response = await comfortWallService.addComment(postId, commentData);
        } catch {
          response = await postService.addComment(postId, commentData);
        }
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
      if (__DEV__) console.error('댓글 작성 오류:', error);
      ReactNativeHapticFeedback.trigger('notificationError', { enableVibrateFallback: true });
      Alert.alert('오류', '댓글 작성 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [user, postType, postId, replyingTo]);

  // 답글 작성 - CommentInput에서 replyingTo 상태를 통해 처리
  const handleReply = useCallback((comment: Comment) => {
    ReactNativeHapticFeedback.trigger('impactLight', { enableVibrateFallback: true });
    setReplyingTo(comment);
  }, []);

  // 답글 취소
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);


  // 익명 게시물용 감정 이모지 계산 (시드 기반)
  const getAnonymousEmotion = useCallback((userId?: number, postIdNum?: number) => {
    const userSeed = userId || 1;
    const postSeed = postIdNum || 1;
    const seed1 = (userSeed * 17 + postSeed * 37) % 1000;
    const seed2 = (userSeed * 23 + postSeed * 41) % 500;
    const seed3 = (userSeed + postSeed) * 13;
    const finalSeed = (seed1 + seed2 + seed3) % EMOTION_AVATARS.length;
    return EMOTION_AVATARS[finalSeed];
  }, []);

  // 게시물 요약 렌더링 (리렌더링 최적화)
  const renderPostSummary = useCallback(() => {
    // 익명 게시물인 경우 감정 이모지 계산
    const anonymousEmotion = post?.is_anonymous ? getAnonymousEmotion(post?.user_id, post?.post_id) : null;

    return (
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
        ) : post?.is_anonymous && anonymousEmotion ? (
          // 익명: 감정 이모지 아바타
          <View style={[styles.avatar, { backgroundColor: anonymousEmotion.color + '30' }]}>
            <FastImage
              key={`comment-emoji-${anonymousEmotion.emojiCode}`}
              source={{
                uri: getTwemojiUrl(anonymousEmotion.emojiCode),
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.web,
              }}
              style={{ width: 24, height: 24 }}
              resizeMode={FastImage.resizeMode.contain}
            />
          </View>
        ) : (
          // 실명이지만 프로필 사진 없음: 닉네임 첫 글자
          <View style={[styles.avatar, { backgroundColor: isDark ? '#a78bfa' : '#8b5cf6' }]}>
            <Text style={[styles.avatarText, { color: '#ffffff' }]}>
              {post?.user?.nickname?.[0] || 'U'}
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
    );
  }, [post, theme, isDark, getAnonymousEmotion]);

  // 댓글 수정 처리 - postType에 따라 적절한 서비스 사용
  const handleEditComment = useCallback(async (commentId: number, newContent: string) => {
    try {
      if (__DEV__) console.log('✏️ 댓글 수정 시작:', commentId, newContent);

      // 낙관적 업데이트
      setComments(prev => prev.map(comment => {
        if (comment.comment_id === commentId) {
          return { ...comment, content: newContent };
        }
        // 답글에서도 찾기
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.comment_id === commentId
                ? { ...reply, content: newContent }
                : reply
            ),
          };
        }
        return comment;
      }));

      // postType에 따라 적절한 서비스로 댓글 수정
      if (postType === 'comfort') {
        await comfortWallService.updateComment(commentId, { content: newContent });
      } else if (postType === 'myday' || postType === 'my_day') {
        await myDayService.updateComment(commentId, { content: newContent }, postId);
      } else {
        await commentService.editComment(commentId, newContent);
      }

      if (__DEV__) console.log('✅ 댓글 수정 성공:', commentId);

      // 서버 데이터와 동기화
      await fetchData();
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ 댓글 수정 실패:', error);
      Alert.alert('수정 실패', '댓글 수정 중 오류가 발생했습니다.');
      // 실패 시 원래 데이터로 새로고침
      await fetchData();
    }
  }, [fetchData, postType, postId]);

  // 댓글 삭제 처리 - InstagramCommentItem에서 이미 확인 모달을 표시하므로 바로 삭제 실행
  const handleDeleteComment = useCallback(async (commentId: number) => {
    try {
      if (__DEV__) console.log('🗑️ 댓글 삭제 시작:', commentId);
      setSubmitting(true);

      // postType에 따라 적절한 서비스로 댓글 삭제
      if (postType === 'comfort') {
        await comfortWallService.deleteComment(commentId, postId);
      } else if (postType === 'myday' || postType === 'my_day') {
        await myDayService.deleteComment(commentId, postId);
      } else {
        await commentService.deleteComment(commentId);
      }

      if (__DEV__) console.log('✅ 댓글 삭제 성공:', commentId);

      // 성공적으로 삭제된 후 전체 댓글 목록 새로고침
      await fetchData();

      // 답글이 있던 댓글이 삭제되었을 수도 있으므로 답글 상태 초기화
      setReplyingTo(null);

    } catch (error: unknown) {
      if (__DEV__) console.error('❌ 댓글 삭제 실패:', error);
      Alert.alert(
        '삭제 실패',
        (error as Error).message || '댓글 삭제 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    } finally {
      setSubmitting(false);
    }
  }, [fetchData, postType, postId]);

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
    if (__DEV__) console.log('✅ 댓글 차단 완료:', commentId);
    // 댓글 목록에서 제거
    setComments(prev => prev.filter(comment => comment.comment_id !== commentId));
    // 전체 데이터 새로고침
    await fetchData();
  }, [fetchData]);

  // 댓글 좋아요 처리 - postType에 따라 적절한 서비스 사용
  const handleLikeComment = useCallback(async (commentId: number) => {
    try {
      let response;
      if (postType === 'comfort') {
        response = await comfortWallService.likeComment(commentId);
      } else if (postType === 'myday' || postType === 'my_day') {
        response = await myDayService.likeComment(commentId);
      } else {
        response = await commentService.likeComment(commentId);
      }

      if (response?.status === 'success' && response.data) {
        return { is_liked: response.data.is_liked, like_count: response.data.like_count };
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error('댓글 좋아요 오류:', error);
      throw error;
    }
  }, [postType]);

  // 댓글 렌더링 (InstagramCommentItem 사용)
  const renderComment = useCallback(({ item }: { item: Comment }) => (
    <InstagramCommentItem
      comment={item}
      currentUserId={user?.user_id}
      isPostAuthor={post?.user_id === item.user_id}
      depth={0}
      postType={postType}
      postId={postId}
      onReply={handleReply}
      onEdit={handleEditComment}
      onDelete={handleDeleteComment}
      onLike={handleLikeComment}
      onUserProfile={handleUserProfile}
      onRefresh={fetchData}
      onCommentBlocked={handleCommentBlocked}
    />
  ), [user?.user_id, post?.user_id, postType, postId, handleReply, handleEditComment, handleDeleteComment, handleLikeComment, handleUserProfile, fetchData, handleCommentBlocked]);

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

  // 입력창 높이 (대략)
  const INPUT_HEIGHT = 70;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      {/* 상단 SafeArea */}
      <SafeAreaView style={{ backgroundColor: theme.bg.primary }} edges={['top']} />

      {/* FlatList - 키보드/입력창 높이만큼 하단 여백 */}
      <FlatList
        ref={flatListRef}
        data={commentTree}
        renderItem={renderComment}
        keyExtractor={(item: Comment) => item.comment_id.toString()}
        ListHeaderComponent={showPostInfo ? renderPostSummary : null}
        contentContainerStyle={[
          styles.commentsList,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + INPUT_HEIGHT : INPUT_HEIGHT + insets.bottom }
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

      {/* 댓글 입력 - 화면 하단 절대 위치, 키보드 위로 이동 */}
      <CommentInput
        onSubmit={handleSubmitComment}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        theme={theme}
        submitting={submitting}
        flatListRef={flatListRef}
        insets={insets}
        keyboardHeight={keyboardHeight}
      />

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
    </View>
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
    fontFamily: 'Pretendard-SemiBold',
  },
  postInfo: {
    flex: 1,
  },
  postAuthor: {
    fontSize: scaleFont(15),
    fontFamily: 'Pretendard-SemiBold',
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
    paddingBottom: 16,
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
    fontFamily: 'Pretendard-SemiBold',
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