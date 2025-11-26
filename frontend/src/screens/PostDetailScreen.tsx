// src/screens/PostDetailScreen.tsx
// 익명 게시물/댓글 "나" 표시 기능 추가
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ScrollView,
  Platform,
  Image,
  View,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  Share,
  Dimensions,
  useWindowDimensions,
  Keyboard,
  Animated,
  Modal,
  TextInput as RNTextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Chip,
  ActivityIndicator,
  Avatar,
  IconButton,
  Switch,
  Surface,
  Divider,
  useTheme,
  Portal
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text as UIText, VStack, HStack, Center, Pressable } from '../components/ui';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import CustomAlert from '../components/ui/CustomAlert';
import PostOptionsModal from '../components/ui/PostOptionsModal';
import BlockReasonModal, { BlockReason } from '../components/BlockReasonModal';
import { showAlert } from '../contexts/AlertContext';
import ClickableNickname from '../components/ClickableNickname';
import ClickableAvatar from '../components/ClickableAvatar';
import EmotionLoginPromptModal from '../components/EmotionLoginPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import postService from '../services/api/postService';
import comfortWallService from '../services/api/comfortWallService';
import myDayService from '../services/api/myDayService';
import { RootStackParamList } from '../types/navigation';
import blockService from '../services/api/blockService';
import reportService from '../services/api/reportService';
import bookmarkService from '../services/api/bookmarkService';
import { normalizeImageUrl, logImageError, logImageSuccess } from '../utils/imageUtils';
import { TYPOGRAPHY, ACCESSIBLE_COLORS, MIN_TOUCH_SIZE } from '../utils/typography';
import { logger, sanitizeInput } from '../utils/security';
import { FONT_SIZES } from '../constants';

// 감정 캐릭터 배열 - 실제 이모지 사용
const EMOTION_CHARACTERS = [
  { label: '기쁨이', emoji: '😊', color: '#FFD700' },
  { label: '행복이', emoji: '😄', color: '#FFA500' },
  { label: '슬픔이', emoji: '😢', color: '#4682B4' },
  { label: '우울이', emoji: '😞', color: '#708090' },
  { label: '지루미', emoji: '😑', color: '#A9A9A9' },
  { label: '버럭이', emoji: '😠', color: '#FF4500' },
  { label: '불안이', emoji: '😰', color: '#DDA0DD' },
  { label: '걱정이', emoji: '😟', color: '#FFA07A' },
  { label: '감동이', emoji: '🥺', color: '#FF6347' },
  { label: '황당이', emoji: '🤨', color: '#20B2AA' },
  { label: '당황이', emoji: '😲', color: '#FF8C00' },
  { label: '짜증이', emoji: '😤', color: '#DC143C' },
  { label: '무섭이', emoji: '😨', color: '#9370DB' },
  { label: '추억이', emoji: '🥰', color: '#87CEEB' },
  { label: '설렘이', emoji: '🤗', color: '#FF69B4' },
  { label: '편안이', emoji: '😌', color: '#98FB98' },
  { label: '궁금이', emoji: '🤔', color: '#DAA520' },
  { label: '사랑이', emoji: '❤️', color: '#E91E63' },
  { label: '아픔이', emoji: '🤕', color: '#8B4513' },
  { label: '욕심이', emoji: '🤑', color: '#32CD32' }
];

// 사용자별 랜덤 감정 생성 함수
const getRandomEmotion = (userId: number, postId: number, commentId: number) => {
  // 더 복잡한 시드 생성으로 다양성 확보
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const commentSeed = commentId || 0;
  
  // 다양한 수학적 연산으로 시드 생성
  const seed1 = (userSeed * 17 + postSeed * 37 + commentSeed * 7) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41 + commentSeed * 11) % 500;
  const seed3 = (userSeed + postSeed + commentSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_CHARACTERS.length;
  
  logger.log(`🎭 PostDetail 감정 할당 디버그:`, {
    userId,
    postId,
    commentId,
    userSeed,
    postSeed,
    commentSeed,
    finalSeed,
    totalEmotions: EMOTION_CHARACTERS.length,
    selectedEmotion: EMOTION_CHARACTERS[finalSeed]?.label
  });
  
  return EMOTION_CHARACTERS[finalSeed];
};

// 익명 감정 시스템 - EMOTION_CHARACTERS와 동일하게 사용
const anonymousEmotions = EMOTION_CHARACTERS;

const getAnonymousEmotion = (userId?: number, postId?: number, commentId?: number, postEmotion?: string) => {
  // 실제 게시물 감정이 있으면 해당 감정에 맞는 아바타 사용
  if (postEmotion) {
    const emotionKeywords = {
      // 기쁨 계열 확장
      '기쁨': '기쁨이', '즐거움': '기쁨이', '신남': '행복이', '좋음': '행복이', '재미': '기쁨이', '흥미': '기쁨이',
      '행복': '행복이', '만족': '행복이', '기뻐': '기쁨이', '즐거워': '기쁨이', '신나': '행복이',
      
      // 감동 계열 확장  
      '감동': '감동이', '뭉클': '감동이', '눈물': '감동이', '벅참': '감동이', '울컥': '감동이', '고마움': '감동이',
      
      // 슬픔 계열 확장
      '슬픔': '슬픔이', '우울': '우울이', '외로움': '슬픔이', '서글픔': '슬픔이', '울적': '우울이', '허전': '슬픔이',
      '아쉬움': '슬픔이', '그리움': '추억이', '그립': '추억이',
      
      // 무서움 계열 확장
      '무섭': '무섭이', '무서움': '무섭이', '두려움': '무섭이', '공포': '무섭이', '무서워': '무섭이', '두려워': '무섭이',
      
      // 화남 계열 확장
      '화남': '버럭이', '분노': '버럭이', '열받음': '버럭이', '빡침': '짜증이', '화가': '버럭이', '열받': '버럭이',
      '짜증': '짜증이', '심술': '짜증이', '화나': '버럭이', '짜증나': '짜증이',
      
      // 불안 걱정 계열 확장
      '불안': '불안이', '걱정': '걱정이', '근심': '걱정이', '염려': '걱정이', '불안해': '불안이', '걱정돼': '걱정이',
      
      // 지루함 계열 확장
      '지루함': '지루미', '지겨움': '지루미', '따분': '지루미', '지루해': '지루미', '지겨워': '지루미',
      
      // 황당 당황 계열 확장
      '황당': '황당이', '당황': '당황이', '어이없': '황당이', '헛웃음': '황당이', '멘붕': '당황이',
      
      // 설렘 계열 확장
      '설렘': '설렘이', '두근': '설렘이', '떨림': '설렘이', '설레': '설렘이', '두근거림': '설렘이',
      
      // 편안함 계열 확장
      '편안': '편안이', '평온': '편안이', '여유': '편안이', '차분': '편안이', '안정': '편안이',
      
      // 궁금함 계열 확장
      '궁금': '궁금이', '의문': '궁금이', '호기심': '궁금이', '궁금해': '궁금이',
      
      // 사랑 계열 확장
      '사랑': '사랑이', '애정': '사랑이', '좋아': '사랑이', '마음': '사랑이',
      
      // 아픔 계열 확장
      '아픔': '아픔이', '고통': '아픔이', '힘듦': '아픔이', '괴로움': '아픔이', '아파': '아픔이',
      
      // 욕심 계열 확장
      '욕심': '욕심이', '탐욕': '욕심이', '욕망': '욕심이'
    };
    
    // 게시물 감정과 매칭되는 익명 감정 찾기 (안전성 강화)
    logger.log('🔍 PostDetail getAnonymousEmotion 디버그:', {
      userId,
      postId,
      commentId,
      postEmotion,
      postEmotionType: typeof postEmotion
    });
    
    try {
      for (const [keyword, emotionLabel] of Object.entries(emotionKeywords)) {
        const isMatch = postEmotion && keyword && (postEmotion.includes(keyword) || keyword.includes(postEmotion));
        
        if (isMatch) {
          logger.log('🎯 PostDetail 키워드 매치 발견:', {
            postEmotion,
            keyword,
            emotionLabel,
            matchType: postEmotion.includes(keyword) ? 'postEmotion.includes(keyword)' : 'keyword.includes(postEmotion)'
          });
          
          const matchedEmotion = anonymousEmotions.find(e => e && e.label === emotionLabel);
          if (matchedEmotion) {
            logger.log(`🎭 PostDetail 감정 매칭 성공: ${postEmotion} -> ${emotionLabel} (${matchedEmotion.emoji})`);
            return {
              ...matchedEmotion,
              label: matchedEmotion.label // 기존 레이블 그대로 유지
            };
          } else {
            logger.warn('⚠️ PostDetail anonymousEmotions에서 찾을 수 없음:', emotionLabel);
          }
        }
      }
      
      logger.log('❌ PostDetail 매칭되는 키워드 없음:', {
        postEmotion,
        willUseFallback: true
      });
      
    } catch (error) {
      logger.warn('🚨 PostDetail 감정 매칭 중 오류 발생:', error);
    }
  }
  
  // 실제 감정이 없거나 매칭되지 않으면 랜덤 할당 (통일된 방식 사용)
  return getRandomEmotion(userId || 1, postId || 1, commentId || 0);
};

// 베스트 댓글 추출 함수
const extractBestComments = (comments: Comment[]): Comment[] => {
  // 백엔드에서 best_comments가 있으면 우선 사용
  if ((comments as any).best_comments) {
    return (comments as any).best_comments;
  }
  
  // 없으면 프론트엔드에서 필터링 (1개 이상 좋아요받은 루트 댓글) - 테스트용으로 기준 낮춤
  const bestComments = comments
    .filter(comment => !comment.parent_comment_id && (comment.like_count || 0) >= 1)
    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
    .slice(0, 5); // 최대 5개까지만
    
  return bestComments;
};

// 댓글을 찾는 헬퍼 함수 (재귀적으로 검색)
const findCommentById = (comments: Comment[], commentId: number): Comment | null => {
  for (const comment of comments) {
    if (comment.comment_id === commentId) {
      return comment;
    }
    if (comment.replies && comment.replies.length > 0) {
      const found = findCommentById(comment.replies, commentId);
      if (found) return found;
    }
  }
  return null;
};

// 메모이제이션된 이미지 컴포넌트 - 댓글 상태 변경 시 재렌더링 방지
const PostImages = React.memo<{
    imageUrls: string | string[];
    onDoubleTap: () => void;
    showLikeAnimation: boolean;
    likeAnimationValue: Animated.Value;
  }>(({ imageUrls, onDoubleTap, showLikeAnimation, likeAnimationValue }) =>
  {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const { width: screenWidth } = useWindowDimensions();
    const { theme: modernTheme } = useModernTheme();

    const normalizedUrls = React.useMemo(() => {
      let urls: string[] = [];

      // JSON 문자열로 된 배열인 경우 파싱
      if (typeof imageUrls === 'string' && imageUrls.startsWith('[')) {
        try {
          const parsed = JSON.parse(imageUrls);
          urls = Array.isArray(parsed) ? parsed : [imageUrls];
        } catch (e) {
          logger.warn('이미지 URL JSON 파싱 실패:', e);
          urls = [imageUrls];
        }
      } else if (Array.isArray(imageUrls)) {
        urls = imageUrls;
      } else {
        urls = [imageUrls];
      }

    return urls.map(url => normalizeImageUrl(url, undefined, true)).filter(url => url && url.trim() !== '');
    }, [imageUrls]);

    const handleScroll = (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / screenWidth);
      setCurrentImageIndex(index);
    };

    if (!normalizedUrls || normalizedUrls.length === 0) {
      logger.log('⏭️ PostImages 렌더링 건너뜀: 빈 URL');
      return null;
    }

  logger.log('🖼️ PostImages 렌더링:', normalizedUrls.length, '개 이미지');  

    return (
      <Box style={{ paddingHorizontal: 0, paddingBottom: 24 }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ width: '100%' }}
        >
          {normalizedUrls.map((url, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={onDoubleTap}
              style={{ position: 'relative', width: screenWidth }}
            >
              <Image
                source={{ uri: url }}
                style={{
                  width: screenWidth,
                  height: screenWidth * 0.65,
                  borderRadius: 0,
                  backgroundColor: modernTheme.bg.secondary,
                }}
                resizeMode="cover"
                onError={(error: any) => {
                 logImageError('PostDetail', url, url, error.nativeEvent?.error); 
                }}
                onLoad={() => {
                  logImageSuccess('PostDetail', url);
                }}
              />

              {/* 더블탭 하트 애니메이션 - 현재 보이는 이미지에만 표시 */}      
              {showLikeAnimation && index === currentImageIndex && (
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
                  <MaterialCommunityIcons name="heart" size={50} color="#FF6B6B" />
                </Animated.View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 페이지 인디케이터 - 이미지가 2개 이상일 때만 표시 */}
        {normalizedUrls.length > 1 && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 12,
            gap: 6,
          }}>
            {normalizedUrls.map((_, index) => (
              <View
                key={index}
                style={{
                  width: currentImageIndex === index ? 8 : 6,
                  height: currentImageIndex === index ? 8 : 6,
                  borderRadius: 4,
                 backgroundColor: currentImageIndex === index ? modernTheme.colors.primary : modernTheme.colors.border,
                }}
              />
            ))}
          </View>
        )}
      </Box>
    );
  }, (prevProps, nextProps) => {
    // imageUrls가 같고, showLikeAnimation 상태가 같으면 리렌더링하지 않음      
    return JSON.stringify(prevProps.imageUrls) ===
  JSON.stringify(nextProps.imageUrls) &&
           prevProps.showLikeAnimation === nextProps.showLikeAnimation;
  });

  PostImages.displayName = 'PostImages';

// 올바른 타입 정의
type PostDetailNavigationProp = StackNavigationProp<RootStackParamList, 'PostDetail'>;
type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

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

interface Comment {
  comment_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  like_count: number;
  is_liked?: boolean;
  created_at: string;
  parent_comment_id?: number;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  replies?: Comment[];
}

interface PostDetailScreenProps {
  navigation: PostDetailNavigationProp;
  route: PostDetailRouteProp;
}

const PostDetailScreen: React.FC<PostDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { theme: modernTheme, isDark } = useModernTheme();
  const { user, isAuthenticated } = useAuth();
  const { postId, postType, highlightCommentId } = route.params;

  logger.log('📍 [PostDetailScreen] 렌더링:', { postId, postType, highlightCommentId });
  logger.log('🔍 [PostDetailScreen] 현재 로그인 사용자:', {
    hasUser: !!user,
    userId: user?.user_id,
    isAuthenticated,
    userKeys: user ? Object.keys(user) : []
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<any>(null);

  // fetchPostData 호출을 위한 상태 (hooks 순서 문제 해결)
  const [shouldLoadData, setShouldLoadData] = useState(false);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [bestComments, setBestComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(highlightCommentId || null);

  // 댓글 위치 추적을 위한 ref 맵
  const commentRefs = useRef<Map<number, any>>(new Map());
  
  // 답글 관련 상태
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [inlineReplyingTo, setInlineReplyingTo] = useState<Comment | null>(null);
  const [inlineCommentText, setInlineCommentText] = useState('');
  const [inlineIsAnonymous, setInlineIsAnonymous] = useState(false);
  
  // 댓글 수정/삭제 관련 상태
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showCommentActionSheet, setShowCommentActionSheet] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  
  // 더블탭 공감 기능
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const likeAnimationValue = useRef(new Animated.Value(0)).current;
  const lastTap = useRef<number>(0);
  
  // 댓글 접기/펼치기 상태
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(new Set());
  const [allCommentsCollapsed, setAllCommentsCollapsed] = useState(false);
  // 본문 더보기/접기 상태
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  // 페이지네이션 및 스크롤 상태
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // 액션 메뉴 상태
  const [showActionSheet, setShowActionSheet] = useState(false);

  // 차단 모달 상태
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{type: 'post' | 'user' | 'comment', data: any} | null>(null);
 // 신고 모달 관련 state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string>('');      
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  // 커스텀 Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // 감정 중심 로그인 프롬프트 모달 상태
  const [emotionLoginPromptVisible, setEmotionLoginPromptVisible] = useState(false);
  const [emotionLoginPromptAction, setEmotionLoginPromptAction] = useState<'like' | 'comment' | 'post' | 'profile'>('comment');

  // 다크모드 대응 스타일
  const styles = getStyles(modernTheme, isDark);

  // 베스트 댓글 클릭 시 원본 댓글로 스크롤하는 함수 (bestCommentsView보다 먼저 정의)
  const scrollToComment = useCallback((commentId: number) => {
    logger.log('🎯 댓글로 스크롤 시작:', commentId);
    const commentRef = commentRefs.current.get(commentId);
    if (commentRef && scrollViewRef.current) {
      // 짧은 지연 후 측정하여 렌더링 완료 보장
      setTimeout(() => {
        commentRef.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          logger.log('🎯 댓글 위치 측정 완료:', { commentId, pageY });
          (scrollViewRef.current as any)?.scrollTo({
            y: Math.max(0, pageY - 150), // 상단에서 150px 여유 공간, 음수 방지
            animated: true
          });
        });
      }, 100);
    } else {
      logger.warn('⚠️ 댓글 ref를 찾을 수 없음:', commentId);
      // 대체 스크롤 방법: 단순히 댓글 섹션으로 스크롤
      (scrollViewRef.current as any)?.scrollTo({
        y: 800, // 댓글 섹션 근처로 스크롤
        animated: true
      });
    }
  }, []);

  // 베스트 댓글 렌더링 (early return 이전에 호출)
  const bestCommentsView = useMemo(() => {
    if (!bestComments || bestComments.length === 0) return null;

    return bestComments.map((bestComment, index) => {
      const emotion = bestComment.is_anonymous
        ? getAnonymousEmotion(bestComment.user_id, post?.post_id || 0, bestComment.comment_id)
        : null;

      return (
        <TouchableOpacity
          key={`best-${bestComment.comment_id}`}
          onPress={() => scrollToComment(bestComment.comment_id)}
          style={{
            backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : '#fffbeb',
            borderRadius: 10,
            padding: 10,
            marginBottom: index < bestComments.length - 1 ? 6 : 0,
            borderWidth: 1,
            borderColor: '#fef3c7',
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
            position: 'relative'
          }}
        >
          {/* 베스트 순위 표시 */}
          <Box style={{
            position: 'absolute',
            top: -4,
            left: -4,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#cd7c2f',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}>
            <RNText style={{
              fontSize: TYPOGRAPHY.captionSmall,
              fontWeight: '700',
              color: '#ffffff'
            }}>
              {index + 1}
            </RNText>
          </Box>
          <HStack style={{ alignItems: 'flex-start' }}>
            {emotion ? (
              <Box style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: emotion.color,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}>
                <RNText style={{ fontSize: FONT_SIZES.small }}>
                  {emotion.emoji}
                </RNText>
              </Box>
            ) : (
              <Box style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: modernTheme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}>
                <RNText style={{
                  fontSize: TYPOGRAPHY.caption,
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  {(bestComment.user?.nickname || '사용자')[0]}
                </RNText>
              </Box>
            )}
            <VStack style={{ flex: 1 }}>
              <HStack style={{ alignItems: 'center', marginBottom: 3 }}>
                <RNText style={{
                  fontSize: TYPOGRAPHY.caption,
                  fontWeight: '600',
                  color: '#92400e',
                  marginRight: 6
                }}>
                  {emotion ? emotion.label : (bestComment.user?.nickname || '사용자')}
                </RNText>
                <HStack style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="heart"
                    size={10}
                    color="#ef4444"
                    style={{ marginRight: 3 }}
                  />
                  <RNText style={{
                    fontSize: TYPOGRAPHY.captionSmall,
                    color: '#ef4444',
                    fontWeight: '500'
                  }}>
                    {bestComment.like_count || 0}
                  </RNText>
                </HStack>
              </HStack>
              <RNText style={{
                fontSize: TYPOGRAPHY.caption,
                color: '#92400e',
                lineHeight: 17
              }} numberOfLines={2}>
                {bestComment.content}
              </RNText>
            </VStack>
          </HStack>
        </TouchableOpacity>
      );
    });
  }, [bestComments, post?.post_id, isDark, modernTheme.colors.primary, scrollToComment]);

  // 댓글 목록 정렬 (renderComment는 나중에 정의되므로 여기서는 정렬만)
  const sortedComments = useMemo(() => {
    return comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [comments]);

  // 본문 최상단으로 스크롤하는 함수
  const scrollToTop = useCallback(() => {
    logger.log('📍 scrollToTop 호출됨, scrollViewRef.current:', scrollViewRef.current);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
      logger.log('✅ 스크롤 실행됨');
    } else {
      logger.warn('⚠️ scrollViewRef.current가 null입니다');
    }
  }, []);



  // 댓글 ref 설정 함수
  const setCommentRef = useCallback((commentId: number, ref: any) => {
    if (ref) {
      commentRefs.current.set(commentId, ref);
    } else {
      commentRefs.current.delete(commentId);
    }
  }, []);

  // 화면이 포커스될 때만 데이터 새로고침 (중복 호출 방지)
  // fetchPostData는 아래에 정의되어 있으므로 useEffect로 변경
  useFocusEffect(
    useCallback(() => {
      logger.log('🔄 PostDetail 화면 포커스 - 데이터 새로고침');
      setShouldLoadData(true);
    }, [])
  );

  // 헤더 설정 - 게시물 로드 후 동적 업데이트
  // 키보드 이벤트 리스너
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event: any) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

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

  // 현재 네비게이션 스택을 기반으로 타이틀 결정
  const getScreenTitle = useCallback(() => {
    try {
      // route params에서 sourceScreen 확인 (우선순위)
      const sourceScreen = (route.params as any)?.sourceScreen;
      if (sourceScreen === 'Comfort') {
        return '마음 나누기';
      }
      if (sourceScreen === 'Home') {
        return '하루 이야기';
      }

      const state = navigation.getState();
      const currentRoute = state?.routes?.[state.index];
      const parentState = navigation.getParent()?.getState();
      const parentRoute = parentState?.routes?.[parentState.index];

      logger.log('🔍 네비게이션 스택 디버그:', {
        currentRoute: currentRoute?.name,
        parentRoute: parentRoute?.name,
        sourceScreen,
        postId: route.params?.postId
      });

      // ComfortStack에서 온 경우
      if (parentRoute?.name === 'Comfort' || currentRoute?.name === 'ComfortMain') {
        return '마음 나누기';
      }

      // HomeStack에서 온 경우 (나의 하루 게시물)
      if (parentRoute?.name === 'Home' || currentRoute?.name === 'HomeMain') {
        return '하루 이야기';
      }

      // 기타의 경우 (RootNavigator 등)
      return '게시물';
    } catch (error) {
      logger.warn('타이틀 결정 중 오류:', error);
      return '게시물';
    }
  }, [navigation, route.params]);

  useEffect(() => {
    const title = getScreenTitle();
    const isComfortPost = title === '마음 나누기';
    const isMyDayPost = title === '하루 이야기';
    
    // 동적 헤더 설정 (각 타입별로 다른 색상 적용)
    let headerBackgroundColor = '#ffffff';
    let borderBottomColor = 'rgba(0, 0, 0, 0.08)';
    
    if (isComfortPost) {
      headerBackgroundColor = '#f8f9ff';
      borderBottomColor = 'rgba(99, 102, 241, 0.1)';
    } else if (isMyDayPost) {
      headerBackgroundColor = '#fff8f0';
      borderBottomColor = 'rgba(255, 152, 0, 0.1)';
    }
    
    logger.log('🎨 [헤더 설정 1] fontSize: FONT_SIZES.h3으로 설정');
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 40 }}>
          <RNText style={{
            fontSize: TYPOGRAPHY.h2,
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: 0.2,
          }}>
            {title}
          </RNText>
        </View>
      ),
      headerTitleStyle: undefined, // 전역 스타일 완전 제거
      headerStyle: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerBackground: () => (
        <View style={{
          flex: 1,
          backgroundColor: isDark ? modernTheme.bg.card : modernTheme.colors.primary,
        }} />
      ),
      headerTintColor: '#ffffff',
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            padding: 8,
            marginLeft: 8,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="#ffffff"
          />
        </Pressable>
      ),

     headerRight: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8,
  marginRight: 8 }}>
      {/* 본문으로 이동 버튼 */}
      <Pressable
        onPress={() => { logger.log("위 화살표 클릭!"); scrollViewRef.current?.scrollTo({ y: 0, animated: true }); }}
        className="p-2 rounded-xl"
        style={{
          backgroundColor: modernTheme.bg.card,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 2,
          borderRadius: 12,
        }}
      >
        <MaterialCommunityIcons
          name="arrow-up-circle"
          size={20}
          color={isDark ? '#FFFFFF' : '#6366F1'}
        />
      </Pressable>

      {/* 북마크 버튼 - 로그인한 사용자만 표시 */}
      {isAuthenticated && (
        <Pressable
          onPress={handleBookmarkPress}
          className="p-2 rounded-xl"
          style={{
            backgroundColor: modernTheme.bg.card,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 2,
            borderRadius: 12,
          }}
        >
          <MaterialCommunityIcons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isBookmarked ? '#6366F1' : (isDark ? '#FFFFFF' : '#1f2937')}
          />
        </Pressable>
      )}

      {/* 옵션 메뉴 버튼 - 로그인한 사용자만 표시 */}
      {isAuthenticated && (
        <Pressable
          onPress={() => setShowActionSheet(true)}
          className="p-2 rounded-xl"
          style={{
            backgroundColor: modernTheme.bg.card,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 2,
            borderRadius: 12,
          }}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={20}
            color={isDark ? '#FFFFFF' : '#1f2937'}
          />
        </Pressable>
      )}
    </View>
  ),
    });
  }, [navigation]);

  // 컴포넌트 언마운트 시 댓글 refs 정리
  useEffect(() => {
    return () => {
      commentRefs.current.clear();
    };
  }, []);

  // 게시물 데이터 로드
  const fetchPostData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      logger.log('🔍 PostDetail 데이터 로드 시작:', { postId, retryCount });
      
      // postType에 따라 API 호출 순서 최적화
      let postResponse;
      let apiUsed = '';
      
      // MyDay 게시물은 트리 구조 댓글을 위해 MyDay API를 우선 호출
      // MyDay API가 트리 구조(replies 배열)를 제공하므로 댓글 들여쓰기가 가능함
      const apiSequence = postType === 'myday' 
        ? ['MyDay', 'Posts', 'ComfortWall']  // MyDay 게시물은 MyDay API 먼저 (트리 구조 댓글용)
        : postType === 'comfort'
        ? ['ComfortWall', 'Posts', 'MyDay']  // Comfort 게시물이면 ComfortWall API 먼저, 실패 시 Posts API
        : ['Posts', 'MyDay', 'ComfortWall'];  // 기본 게시물이면 Posts API 먼저, 실패 시 MyDay API
        
      logger.log('🔍 API 호출 순서:', apiSequence);
      
      for (const api of apiSequence) {
        let apiSuccess = false;
        let maxRetries = api === 'ComfortWall' && retryCount === 0 ? 3 : 1; // ComfortWall API는 첫 시도에서만 재시도
        
        for (let attemptCount = 0; attemptCount < maxRetries && !apiSuccess; attemptCount++) {
          try {
            if (attemptCount > 0) {
              logger.log(`🔄 ${api} API 재시도 (${attemptCount}/${maxRetries - 1}):`, postId);
              // 재시도 시 점진적 지연
              await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount));
            } else {
              logger.log(`🚀 ${api} API 호출 중...`);
            }
            
            if (api === 'MyDay') {
              postResponse = await myDayService.getPostById(postId);
            } else if (api === 'ComfortWall') {
              postResponse = await comfortWallService.getPostDetail(postId);
            } else if (api === 'Posts') {
              postResponse = await postService.getPostById(postId);
            }
            
            apiUsed = api;
            apiSuccess = true;
            logger.log(`✅ ${api} API로 게시물 조회 성공${attemptCount > 0 ? ` (재시도 ${attemptCount}회 후)` : ''}`);
            break; // 성공하면 전체 루프 종료
            
          } catch (error: any) {
            const statusCode = error.response?.status;
            const errorMessage = error.response?.data?.message || error.message;
            
            logger.log(`❌ ${api} API 실패:`, statusCode, errorMessage);
            
            // 500 에러의 경우 더 구체적인 로깅
            if (statusCode === 500) {
              console.error(`🔥 ${api} API 서버 에러 (500):`, {
                postId,
                attempt: attemptCount + 1,
                maxRetries,
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL,
                fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
                headers: error.config?.headers,
                errorData: error.response?.data,
                responseStatus: error.response?.status,
                responseStatusText: error.response?.statusText,
                requestData: error.config?.data,
                timestamp: new Date().toISOString()
              });
              
              // 500 에러이고 재시도 가능한 경우
              if (attemptCount < maxRetries - 1) {
                logger.warn(`🔄 ${api} 서버 에러로 인한 재시도 예정 (${attemptCount + 1}/${maxRetries - 1})`);
                continue; // 다음 재시도 진행
              }
            }
            
            // 403, 404 에러는 재시도하지 않고 바로 다음 API로 이동
            if (statusCode === 403 || statusCode === 404) {
              logger.log(`⏩ ${api} API ${statusCode} 에러 - 다음 API로 이동`);
              break; // 다음 API로 이동
            }
            
            // 마지막 재시도도 실패했거나 재시도 불가능한 에러인 경우
            if (attemptCount === maxRetries - 1) {
              // 마지막 API까지 실패했으면 에러 던지기
              if (api === apiSequence[apiSequence.length - 1]) {
                throw error;
              }
              break; // 다음 API로 이동
            }
          }
        }
        
        if (apiSuccess) {
          break; // 성공한 경우 전체 API 시퀀스 종료
        }
      }
      
      logger.log('🔍 사용된 API:', apiUsed);
      
      // 응답 구조 디버깅
      logger.log('🔍 PostDetail API 전체 응답:', JSON.stringify(postResponse.data, null, 2));
      
      // Axios 응답 구조: { data: { status: 'success', data: {...} } }
      const responseData = postResponse.data;
      logger.log('🔍 responseData 구조:', {
        hasResponseData: !!responseData,
        status: responseData?.status,
        hasData: !!responseData?.data,
        dataType: typeof responseData?.data
      });
      
      // 다양한 응답 구조 지원
      let postData = null;
      
      if (responseData && responseData.status === 'success' && responseData.data) {
        // 표준 구조: { status: 'success', data: {...} }
        postData = responseData.data;
        logger.log('✅ 표준 응답 구조로 파싱 성공');
      } else if (responseData && responseData.data && responseData.data.status === 'success' && responseData.data.data) {
        // 중첩 구조: { data: { status: 'success', data: {...} } }
        postData = responseData.data.data;
        logger.log('✅ 중첩 응답 구조로 파싱 성공');
      } else if (responseData && typeof responseData === 'object' && responseData.post_id) {
        // 직접 데이터 구조: { post_id: ..., content: ..., ... }
        postData = responseData;
        logger.log('✅ 직접 데이터 구조로 파싱 성공');
      }
      
      if (postData) {
        // MyDay API는 createdAt/updatedAt을 사용하므로 정규화
        const normalizedPostData = {
          ...postData,
          created_at: postData.created_at || postData.createdAt || new Date().toISOString(),
          updated_at: postData.updated_at || postData.updatedAt || postData.created_at || postData.createdAt || new Date().toISOString()
        };
        
        logger.log('📅 정규화된 게시물 데이터:', {
          original_created_at: postData.created_at,
          original_createdAt: postData.createdAt,
          normalized_created_at: normalizedPostData.created_at
        });
        
        logger.log('🎯 게시물 상태 설정:', {
          postId: normalizedPostData.post_id,
          content: normalizedPostData.content?.substring(0, 50),
          isLiked: postData.is_liked,
          likeCount: postData.like_count,
          hasCurrentError: !!error
        });

        setPost(normalizedPostData);
        setLiked(postData.is_liked || false);
        setLikeCount(postData.like_count || 0);
        
        // 성공적으로 로드되었으므로 오류 상태 초기화
        setError(null);
        
        // 헤더 타이틀을 컨텍스트에 맞게 설정
        const title = getScreenTitle();
        const isComfortPost = title === '마음 나누기';
        const isMyDayPost = title === '하루 이야기';

        let headerBackgroundColor = '#ffffff';
        let borderBottomColor = 'rgba(0, 0, 0, 0.08)';
        
        if (isComfortPost) {
          headerBackgroundColor = '#f8f9ff';
          borderBottomColor = 'rgba(99, 102, 241, 0.1)';
        } else if (isMyDayPost) {
          headerBackgroundColor = '#fff8f0';
          borderBottomColor = 'rgba(255, 152, 0, 0.1)';
        }
        
        logger.log('🎨 [헤더 설정 2] fetchPostData 내부 - fontSize: FONT_SIZES.h3으로 설정');
        navigation.setOptions({
          headerTitle: () => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 40 }}>
              <RNText style={{
                fontSize: TYPOGRAPHY.h2,
                fontWeight: '700',
                color: '#ffffff',
                letterSpacing: 0.2,
              }}>
                {title}
              </RNText>
            </View>
          ),
          headerTitleStyle: undefined, // 전역 스타일 완전 제거
          headerStyle: {
            backgroundColor: 'transparent',
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerBackground: () => (
            <View style={{
              flex: 1,
              backgroundColor: isDark ? modernTheme.bg.card : modernTheme.colors.primary,
            }} />
          ),
          headerTintColor: '#ffffff',
        });
        
        logger.log(`📋 헤더 타이틀 설정: ${title}`);

        // Comfort Wall API는 댓글도 함께 반환하므로 별도 요청 불필요
        if (postData.comments && postData.comments.length > 0) {
          // 댓글 구조 분석을 위한 로깅
          logger.log('🔍 서버에서 받은 댓글 구조 분석:', {
            totalComments: postData.comments?.length,
            commentsStructure: (postData.comments || []).map((comment: any) => ({
              comment_id: comment.comment_id,
              parent_comment_id: comment.parent_comment_id,
              content: comment.content?.substring(0, 30),
              has_replies: comment.replies?.length > 0,
              replies_count: comment.replies?.length || 0
            }))
          });
          
          // 댓글 데이터에서 created_at이 없는 경우 안전하게 처리
          logger.log('🔍 PostDetail 원본 댓글 데이터:', (postData.comments || []).map((comment: any, index: number) => ({
            index,
            comment_id: comment.comment_id,
            user_id: comment.user_id,
            content: comment.content?.substring(0, 30),
            is_anonymous: comment.is_anonymous,
            has_user: !!comment.user,
            user_nickname: comment.user?.nickname,
            replies_count: comment.replies?.length || 0
          })));
          
          // 백엔드에서 이미 트리 구조로 보내므로 평면화하지 않고 그대로 사용
          const safeComments = (postData.comments || []).map((comment: any) => ({
            ...comment,
            created_at: comment.created_at || new Date().toISOString(),
            // 답글도 재귀적으로 created_at 보장
            replies: comment.replies ? comment.replies.map((reply: any) => ({
              ...reply,
              created_at: reply.created_at || new Date().toISOString(),
              // 답글의 답글도 처리
              replies: reply.replies ? reply.replies.map((subReply: any) => ({
                ...subReply,
                created_at: subReply.created_at || new Date().toISOString()
              })) : []
            })) : []
          }));
          
          logger.log('✅ 트리 구조 댓글 처리 완료:', {
            rootCommentsCount: safeComments.length,
            totalReplies: safeComments.reduce((total: number, comment: any) => {
              const firstLevelReplies = comment.replies?.length || 0;
              const secondLevelReplies = comment.replies?.reduce((subTotal: number, reply: any) =>
                subTotal + (reply.replies?.length || 0), 0) || 0;
              return total + firstLevelReplies + secondLevelReplies;
            }, 0)
          });
          
          setComments(safeComments);
          
          // 베스트 댓글 처리 - 백엔드에서 온 데이터 우선 사용
          let bestCommentsData: Comment[] = [];
          if (postData.best_comments) {
            logger.log('✅ 백엔드에서 베스트 댓글 받음:', postData.best_comments.length);
            bestCommentsData = postData.best_comments;
          } else {
            logger.log('🔍 프론트엔드에서 베스트 댓글 필터링');
            bestCommentsData = extractBestComments(safeComments);
          }
          
          logger.log('🏆 베스트 댓글 설정:', {
            count: bestCommentsData.length,
            comments: bestCommentsData.map(c => ({
              id: c.comment_id,
              likes: c.like_count,
              content: c.content?.substring(0, 30)
            }))
          });
          
          setBestComments(bestCommentsData);

          // 알림에서 넘어온 경우 해당 댓글로 스크롤
          if (highlightCommentId) {
            logger.log('📍 [PostDetailScreen] 댓글 하이라이트 준비:', highlightCommentId);

            // 답글인 경우 부모 댓글 찾기 및 펼치기
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

            const parentCommentId = findParentCommentId(highlightCommentId, safeComments);

            if (parentCommentId) {
              logger.log('📍 [PostDetailScreen] 답글의 부모 댓글 찾음:', parentCommentId);
              // 부모 댓글 펼치기
              setCollapsedComments(prev => {
                const newSet = new Set(prev);
                newSet.delete(parentCommentId);
                return newSet;
              });
            }

            // 딜레이를 1초로 늘려서 댓글이 펼쳐지는 시간 확보
            setTimeout(() => {
              const commentView = commentRefs.current.get(highlightCommentId);
              if (commentView && scrollViewRef.current) {
                commentView.measureLayout(
                  scrollViewRef.current as any,
                  (x: number, y: number, width: number, height: number) => {
                    logger.log('📍 [PostDetailScreen] 댓글 위치 측정:', { x, y, width, height });
                    (scrollViewRef.current as any)?.scrollTo({ y: Math.max(0, y - 100), animated: true });
                  },
                  (error: any) => {
                    console.error('📍 [PostDetailScreen] 댓글 위치 측정 실패:', error);
                    // 실패 시 맨 아래로 스크롤
                    (scrollViewRef.current as any)?.scrollToEnd({ animated: true });
                  }
                );
              } else {
                logger.log('📍 [PostDetailScreen] 댓글 ref 없음, 맨 아래로 스크롤');
                (scrollViewRef.current as any)?.scrollToEnd({ animated: true });
              }
            }, 1000);

            // 3.5초 후 하이라이트 제거
            setTimeout(() => {
              logger.log('📍 [PostDetailScreen] 하이라이트 제거');
              setHighlightedCommentId(null);
            }, 4500);
          }

        } else {
          // 별도 댓글 로드 (MyDay API 우선 시도)
          try {
            let commentsResponse;
            try {
              logger.log('📥 MyDay API로 댓글 로드 시도:', postId);
              commentsResponse = await myDayService.getComments(postId);
              logger.log('📋 MyDay API 댓글 응답:', commentsResponse);
            } catch (myDayCommentError) {
              logger.log('📥 MyDay 댓글 실패, 일반 API로 댓글 로드 시도:', postId);
              commentsResponse = await postService.getComments(postId);
            }
            logger.log('📋 댓글 API 응답:', commentsResponse);
            
            // MyDay API와 일반 API의 다른 응답 구조 처리
            let commentsData = [];
            if (commentsResponse.status === 'success' && commentsResponse.data) {
              // 일반 API 구조
              commentsData = commentsResponse.data.comments || commentsResponse.data || [];
            } else if (commentsResponse.data?.status === 'success' && commentsResponse.data?.data) {
              // MyDay API 구조: { data: { status: 'success', data: { comments: [...] } } }
              commentsData = commentsResponse.data.data.comments || [];
            }
            
            logger.log('🔍 댓글 데이터 파싱 결과:', {
              commentsDataLength: commentsData.length,
              commentsDataType: typeof commentsData,
              firstComment: commentsData[0],
              isArray: Array.isArray(commentsData)
            });
            
            if (commentsData.length >= 0) {
              const safeComments = commentsData.map((comment: any, index: number) => {
                logger.log('🔍 개별 댓글 데이터 확인:', {
                  index,
                  comment_id: comment.comment_id,
                  user_id: comment.user_id,
                  is_anonymous: comment.is_anonymous,
                  hasUserData: !!(comment.user || comment.User),
                  userNickname: comment.user?.nickname || comment.User?.nickname,
                  content: comment.content?.substring(0, 30)
                });
                
                return {
                  ...comment,
                  user_id: comment.user_id, // 사용자 ID 보존
                  is_anonymous: comment.is_anonymous, // 익명 여부 보존
                  user: comment.user || comment.User, // 사용자 정보 보존 (user 또는 User 필드)
                  created_at: comment.created_at || new Date().toISOString()
                };
              })
              // 최신 댓글이 위에 오도록 내림차순 정렬
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              logger.log('✅ 일반 API 댓글 로드 성공:', safeComments.length);
              setComments(safeComments);
              
              // 베스트 댓글 처리 (별도 로드의 경우 프론트엔드에서 필터링)
              const bestCommentsData = extractBestComments(safeComments);
              setBestComments(bestCommentsData);
              logger.log('🏆 별도 로드 베스트 댓글:', bestCommentsData.length);

              // 알림에서 넘어온 경우 해당 댓글로 스크롤
              if (highlightCommentId) {
                logger.log('📍 [PostDetailScreen] 별도 로드 후 댓글 하이라이트 준비:', highlightCommentId);

                // 답글인 경우 부모 댓글 찾기 및 펼치기
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

                const parentCommentId = findParentCommentId(highlightCommentId, safeComments);

                if (parentCommentId) {
                  logger.log('📍 [PostDetailScreen] 답글의 부모 댓글 찾음:', parentCommentId);
                  // 부모 댓글 펼치기
                  setCollapsedComments(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(parentCommentId);
                    return newSet;
                  });
                }

                // 딜레이를 1초로 늘려서 댓글이 펼쳐지는 시간 확보
                setTimeout(() => {
                  const commentView = commentRefs.current.get(highlightCommentId);
                  if (commentView && scrollViewRef.current) {
                    commentView.measureLayout(
                      scrollViewRef.current as any,
                      (x: number, y: number, width: number, height: number) => {
                        logger.log('📍 [PostDetailScreen] 댓글 위치 측정:', { x, y, width, height });
                        (scrollViewRef.current as any)?.scrollTo({ y: Math.max(0, y - 100), animated: true });
                      },
                      (error: any) => {
                        console.error('📍 [PostDetailScreen] 댓글 위치 측정 실패:', error);
                        // 실패 시 맨 아래로 스크롤
                        (scrollViewRef.current as any)?.scrollToEnd({ animated: true });
                      }
                    );
                  } else {
                    logger.log('📍 [PostDetailScreen] 댓글 ref 없음, 맨 아래로 스크롤');
                    (scrollViewRef.current as any)?.scrollToEnd({ animated: true });
                  }
                }, 1000);

                // 3.5초 후 하이라이트 제거
                setTimeout(() => {
                  logger.log('📍 [PostDetailScreen] 하이라이트 제거');
                  setHighlightedCommentId(null);
                }, 4500);
              }
            } else {
              logger.log('❌ 일반 API 댓글 응답 구조 이상');
              setComments([]);
            }
          } catch (commentError) {
            logger.log('❌ 댓글 로드 실패:', commentError);
            setComments([]);
          }
        }
      } else {
        console.error('❌ 모든 응답 구조 파싱 실패:', {
          hasResponseData: !!responseData,
          responseDataType: typeof responseData,
          status: responseData?.status,
          hasData: !!responseData?.data,
          hasNestedData: !!(responseData?.data?.data),
          hasPostId: !!(responseData?.post_id),
          keys: responseData ? Object.keys(responseData) : [],
          fullResponse: JSON.stringify(responseData, null, 2)
        });
        throw new Error(responseData?.message || '게시물을 불러올 수 없습니다.');
      }
      
    } catch (error: any) {
      console.error('🔥 모든 API 실패 - 최종 오류:', error);
      
      // 상태 코드별 사용자 친화적 메시지 제공
      let errorMessage = '게시물을 불러오는 중 오류가 발생했습니다.';
      const statusCode = error.response?.status;
      
      switch (statusCode) {
        case 404:
          errorMessage = '게시물을 찾을 수 없습니다.\n게시물이 삭제되었거나 존재하지 않을 수 있습니다.';
          break;
        case 500:
          errorMessage = '서버에 일시적인 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.';
          console.error('🔥 서버 에러 - 모든 재시도 실패:', {
            postId,
            statusCode,
            errorData: error.response?.data,
            errorMessage: error.response?.data?.message
          });
          break;
        case 403:
          errorMessage = '이 게시물에 접근할 권한이 없습니다.';
          break;
        case 401:
          errorMessage = '로그인이 필요한 게시물입니다.';
          break;
        default:
          errorMessage = error.response?.data?.message || 
                        error.message || 
                        '게시물 정보를 불러오는 중 오류가 발생했습니다.';
      }
      
      setError(errorMessage);
      setPost(null); // 404 오류 시 게시물 데이터 초기화
    } finally {
      setLoading(false);
    }
  }, [postId, postType, navigation, getScreenTitle]);

  // shouldLoadData가 true가 되면 fetchPostData 호출
  useEffect(() => {
    if (shouldLoadData) {
      fetchPostData();
      setShouldLoadData(false);
    }
  }, [shouldLoadData, fetchPostData]);

  // 댓글 추가 로드 (무한 스크롤)
  const loadMoreComments = useCallback(async () => {
    if (loadingMoreComments || !hasMoreComments || !postId) return;

    setLoadingMoreComments(true);
    try {
      const nextPage = commentPage + 1;
      let response;

      if (postType === 'myday') {
        response = await myDayService.getComments(postId, { page: nextPage, limit: 10 });
      } else {
        response = await postService.getComments(postId, { page: nextPage, limit: 10 });
      }

      const newComments = response.data?.comments || response.data?.data?.comments || [];

      if (newComments.length > 0) {
        setComments(prev => [...prev, ...newComments]);
        setCommentPage(nextPage);
        setHasMoreComments(newComments.length === 10);
      } else {
        setHasMoreComments(false);
      }
    } catch (error) {
      logger.error('댓글 추가 로드 실패:', error);
    } finally {
      setLoadingMoreComments(false);
    }
  }, [loadingMoreComments, hasMoreComments, postId, postType, commentPage]);

  // 스크롤 핸들러
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 500);
  }, []);

  // 공유하기
  const handleShare = useCallback(async () => {
    if (!post) return;
    
    try {
      const shareContent = {
        title: '게시물 공유',
        message: `"${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`
      };
      
      await Share.share(shareContent);
      setShowActionSheet(false);
    } catch (error) {
      console.error('공유 오류:', error);
    }
  }, [post]);

   // 신고하기
    const handleReport = useCallback(() => {
      if (!post) return;

      setShowActionSheet(false);
      setSelectedPostId(post.post_id);
      setSelectedReportReason('');
      setReportDetails('');
      setReportModalVisible(true);
    }, [post]);

    // 신고 제출
    const handleSubmitReport = useCallback(async () => {
      if (!selectedPostId || !selectedReportReason) {
        showAlert.info('알림', '신고 사유를 선택해주세요.');
        return;
      }

      if (selectedReportReason === 'other') {
        if (!reportDetails.trim()) {
          showAlert.info('알림', '상세 사유를 입력해주세요.');
          return;
        }
        if (reportDetails.trim().length < 10) {
          showAlert.info('알림', '상세 사유는 최소 10자 이상 입력해주세요.');
          return;
        }
      }

      try {
        setIsSubmittingReport(true);
        await reportService.reportPost(
          selectedPostId,
          selectedReportReason as any,
          selectedReportReason,
          reportDetails.trim() || undefined
        );

        setReportModalVisible(false);
        setSelectedPostId(null);
        setSelectedReportReason('');
        setReportDetails('');

        setAlertConfig({
          visible: true,
          type: 'success',
          title: '신고 완료',
          message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
        });
      } catch (error: any) {
        console.error('게시물 신고 오류:', error);
        setAlertConfig({
          visible: true,
          type: 'error',
          title: '오류',
          message: error.response?.data?.error || '신고 제출 중 오류가 발생했습니다.',
        });
      } finally {
        setIsSubmittingReport(false);
      }
    }, [selectedPostId, selectedReportReason, reportDetails]);

  // 수정하기 (내 글인 경우)
  const handleEdit = useCallback(() => {
    if (!post) return;
    
    setShowActionSheet(false);
    
    logger.log('🔧 PostDetailScreen handleEdit 디버그:', {
      postId: post.post_id,
      postType: postType,
      postTypeCheck: postType === 'comfort',
      routeParams: route.params
    });
    
    // 게시물 종류 판단 - 더 안전한 방법으로 수정
    const hasTitle = !!(post as any).title;
    const isComfortPost = postType === 'comfort' || hasTitle;
    
    logger.log('📊 게시물 타입 분석:', {
      postType,
      hasTitle,
      isComfortPost,
      title: (post as any).title
    });
    
    // 게시물 종류에 따라 올바른 수정 화면으로 이동
    if (isComfortPost) {
      logger.log('✅ 위로와 공감 게시물 수정 - WriteComfortPost로 이동');
      // 위로와 공감 게시물 수정
      navigation.navigate('WriteComfortPost', {
        editMode: true,
        postId: post.post_id,
        existingPost: {
          title: (post as any).title || '',
          content: post.content,
          tags: (post as any).tags || [],
          is_anonymous: post.is_anonymous || false,
          images: (post as any).images || []
        }
      });
    } else {
      logger.log('🔄 나의 하루 게시물 수정 - WriteMyDay로 이동');
      // 나의 하루 게시물 수정
      navigation.navigate('WriteMyDay', { 
        editPostId: post.post_id, 
        mode: 'edit',
        existingPost: post 
      });
    }
  }, [post, navigation, postType, route.params]);

  // 삭제하기 (내 글인 경우)
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setShowDeleteModal(false);
    try {
      logger.log('🗑️ 게시물 삭제 시작:', {
        postId: post!.post_id,
        postType: postType
      });

      if (postType === 'myday') {
        await myDayService.deletePost(post!.post_id);
      } else {
        await postService.deletePost(post!.post_id);
      }

      logger.log('✅ 게시물 삭제 성공');
      
      // 게시물 목록으로 돌아가기
      navigation.goBack();
    } catch (error: any) {
      console.error('❌ 게시물 삭제 실패:', error);
      const errorMessage = error.response?.data?.message || error.message || '게시물 삭제 중 오류가 발생했습니다.';
      showAlert.error('오류', errorMessage);
    }
    setShowActionSheet(false);
  }, [post, navigation, postType]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // 게시물 차단
  const handleBlockPost = useCallback(() => {
    logger.log('🚫 게시물 차단 시작:', { postId: post?.post_id, hasPost: !!post });
    if (!post) {
      logger.log('⚠️ 게시물 정보가 없어 차단할 수 없습니다.');
      return;
    }
    setBlockTarget({ type: 'post', data: post });
    setBlockModalVisible(true);
  }, [post]);

  // 사용자 차단
  const handleBlockUser = useCallback(() => {
    logger.log('🚫 사용자 차단 시작:', {
      userId: post?.user_id,
      hasPost: !!post,
      isAnonymous: post?.is_anonymous
    });

    if (!post || post.is_anonymous) {
      logger.log('⚠️ 게시물 정보가 없거나 익명 게시물이어서 차단할 수 없습니다.');
      return;
    }

    setBlockTarget({ type: 'user', data: post });
    setBlockModalVisible(true);
  }, [post]);

  // 댓글 수정하기
  const handleEditComment = useCallback((comment: Comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
    setShowCommentActionSheet(false);
  }, []);

  // 댓글 삭제하기
  const handleDeleteComment = useCallback(async (comment: Comment) => {
    showAlert.show(
      '댓글 삭제',
      '이 댓글을 삭제하시겠습니까?\n삭제된 댓글은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제하기', 
          style: 'destructive',
          onPress: async () => {
            try {
              logger.log('💬 댓글 삭제 시작:', {
                commentId: comment.comment_id,
                postId: postId,
                postType: postType
              });

              // API 순차 시도 (성공할 때까지)
              let success = false;
              let lastError = null;

              // 1. postType에 따라 우선 API 선택
              const apiSequence = postType === 'myday' 
                ? [
                  () => myDayService.deleteComment(comment.comment_id, postId),
                  () => comfortWallService.deleteComment(comment.comment_id),
                  () => postService.deleteComment(comment.comment_id)
                ]
                : postType === 'comfort'
                ? [
                  () => comfortWallService.deleteComment(comment.comment_id),
                  () => myDayService.deleteComment(comment.comment_id, postId),
                  () => postService.deleteComment(comment.comment_id)
                ]
                : [
                  () => postService.deleteComment(comment.comment_id),
                  () => comfortWallService.deleteComment(comment.comment_id),
                  () => myDayService.deleteComment(comment.comment_id, postId)
                ];

              // 순차적으로 API 시도
              for (const apiCall of apiSequence) {
                try {
                  logger.log('💬 댓글 삭제 API 시도 중...');
                  await apiCall();
                  success = true;
                  logger.log('✅ 댓글 삭제 성공');
                  break;
                } catch (error: any) {
                  logger.log('❌ 댓글 삭제 API 실패:', error.response?.status, error.message);
                  lastError = error;
                }
              }

              if (!success) {
                throw lastError;
              }

              showAlert.success('완료', '댓글이 삭제되었습니다.');
              // 데이터 새로고침
              setShouldLoadData(true);
            } catch (error: any) {
              console.error('❌ 모든 댓글 삭제 API 실패:', error);
              showAlert.error('오류', '댓글 삭제 중 오류가 발생했습니다.');
            }
            setShowCommentActionSheet(false);
          }
        }
      ]
    );
  }, [postType, postId]);

  // 댓글 수정 저장
  const handleSaveCommentEdit = useCallback(async () => {
    if (!editCommentText.trim()) {
      showAlert.info('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    if (!editingComment) return;

    try {
      const commentData = {
        content: editCommentText.trim().normalize('NFC')
      };

      logger.log('💬 댓글 수정 시작:', {
        commentId: editingComment.comment_id,
        postId: postId,
        postType: postType,
        data: commentData
      });

      // API 순차 시도 (성공할 때까지)
      let success = false;
      let lastError = null;

      // 1. postType에 따라 우선 API 선택
      const apiSequence = postType === 'myday' 
        ? [
          () => myDayService.updateComment(editingComment.comment_id, commentData, postId),
          () => comfortWallService.updateComment(editingComment.comment_id, commentData),
          () => postService.updateComment(editingComment.comment_id, commentData)
        ]
        : postType === 'comfort'
        ? [
          () => comfortWallService.updateComment(editingComment.comment_id, commentData),
          () => myDayService.updateComment(editingComment.comment_id, commentData, postId),
          () => postService.updateComment(editingComment.comment_id, commentData)
        ]
        : [
          () => postService.updateComment(editingComment.comment_id, commentData),
          () => comfortWallService.updateComment(editingComment.comment_id, commentData),
          () => myDayService.updateComment(editingComment.comment_id, commentData, postId)
        ];

      // 순차적으로 API 시도
      for (const apiCall of apiSequence) {
        try {
          logger.log('💬 댓글 수정 API 시도 중...');
          await apiCall();
          success = true;
          logger.log('✅ 댓글 수정 성공');
          break;
        } catch (error: any) {
          logger.log('❌ 댓글 수정 API 실패:', error.response?.status, error.message);
          lastError = error;
        }
      }

      if (!success) {
        throw lastError;
      }

      showAlert.success('완료', '댓글이 수정되었습니다.');
      setEditingComment(null);
      setEditCommentText('');
      // 데이터 새로고침
      setShouldLoadData(true);
    } catch (error: any) {
      console.error('❌ 모든 댓글 수정 API 실패:', error);
      showAlert.error('오류', '댓글 수정 중 오류가 발생했습니다.');
    }
  }, [editCommentText, editingComment, postType, postId]);

  // 댓글 수정 취소
  const handleCancelCommentEdit = useCallback(() => {
    setEditingComment(null);
    setEditCommentText('');
  }, []);

  // 댓글 액션 메뉴 표시
  const handleCommentLongPress = useCallback((comment: Comment) => {
    setSelectedComment(comment);
    setShowCommentActionSheet(true);
  }, [user]);

  // 댓글 신고 처리
  const handleReportComment = useCallback(async (comment: Comment) => {
    try {
      showAlert.show(
        '댓글 신고',
        '이 댓글을 신고하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '신고',
            style: 'destructive',
            onPress: async () => {
              try {
                // TODO: 신고 API 호출 (차후 완성 예정)
                logger.log('📢 댓글 신고 요청:', { commentId: comment.comment_id });

                // 임시로 성공 메시지만 표시
                showAlert.success('신고 완료', '해당 댓글이 신고되었습니다. 검토 후 조치하겠습니다.');

                setSelectedComment(null);
                setShowCommentActionSheet(false);
              } catch (error: any) {
                console.error('❌ 댓글 신고 오류:', error);
                showAlert.error('오류', '댓글 신고 중 오류가 발생했습니다.');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ 댓글 신고 처리 오류:', error);
    }
  }, []);

  // 댓글 차단 처리
  const handleBlockComment = useCallback((comment: Comment) => {
    setBlockTarget({ type: 'comment', data: comment });
    setBlockModalVisible(true);
    setShowCommentActionSheet(false);
  }, []);

  // 차단 확인 처리
  const handleBlockConfirm = useCallback(async (reason?: BlockReason) => {
    if (!blockTarget) return;

    try {
      if (blockTarget.type === 'post') {
        logger.log('📡 blockService.blockContent 호출:', {
          contentType: 'post',
          contentId: blockTarget.data.post_id,
          reason,
        });
        await blockService.blockContent({
          contentType: 'post',
          contentId: blockTarget.data.post_id,
          reason,
        });
        logger.log('✅ 게시물 차단 API 응답');
        showAlert.success('완료', '게시물이 차단되었습니다.', [
          {
            text: '확인',
            onPress: () => {
              setShowActionSheet(false);
              navigation.goBack();
            },
            style: 'default'
          }
        ]);
      } else if (blockTarget.type === 'user') {
        logger.log('📡 blockService.blockUser 호출:', blockTarget.data.user_id);
        await blockService.blockUser(blockTarget.data.user_id, reason);
        const nickname = blockTarget.data.user?.nickname || '사용자';
        logger.log('✅ 사용자 차단 성공:', nickname);
        showAlert.success('완료', `${nickname}님이 차단되었습니다.`, [
          {
            text: '확인',
            onPress: () => {
              setShowActionSheet(false);
              navigation.goBack();
            },
            style: 'default'
          }
        ]);
      } else if (blockTarget.type === 'comment') {
        logger.log('🚫 댓글 차단 시도:', blockTarget.data.comment_id);
        await blockService.blockContent({
          contentType: 'comment',
          contentId: blockTarget.data.comment_id,
          reason,
        });
        logger.log('✅ 댓글 차단 성공');
        setShouldLoadData(true);
        showAlert.success('완료', '댓글이 차단되었습니다.');
        setSelectedComment(null);
        setShowCommentActionSheet(false);
      }
    } catch (error: any) {
      console.error('❌ 차단 오류:', error);
      showAlert.error('오류', '차단 중 오류가 발생했습니다.');
    } finally {
      setBlockTarget(null);
    }
  }, [blockTarget, navigation]);

  // 댓글 접기/펼치기 토글
  const toggleCommentCollapse = useCallback((commentId: number) => {
    setCollapsedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  // 전체 댓글 접기/펼치기 토글
  const toggleAllCommentsCollapse = useCallback(() => {
    setAllCommentsCollapsed(prev => !prev);
  }, []);

  // 인라인 답글 작성
  const handleInlineReplySubmit = useCallback(async () => {
    // 비로그인 사용자 체크
    if (!isAuthenticated || !user) {
      setEmotionLoginPromptAction('comment');
      setEmotionLoginPromptVisible(true);
      return;
    }

    if (!inlineCommentText.trim()) {
      showAlert.info('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    if (!inlineReplyingTo) return;

    try {
      setSubmitting(true);

      const normalizedContent = `@${inlineReplyingTo.is_anonymous ? '익명' : (inlineReplyingTo.user?.nickname || '사용자')} ${inlineCommentText.trim()}`;

      const commentData = {
        content: normalizedContent.normalize('NFC'),
        is_anonymous: inlineIsAnonymous,
        parent_comment_id: inlineReplyingTo.comment_id
      };

      logger.log('💬 인라인 답글 작성:', {
        parentCommentId: inlineReplyingTo.comment_id,
        data: commentData
      });

      // API 순차 시도
      let success = false;
      let lastError = null;

      const apiSequence = postType === 'myday' 
        ? [
          () => myDayService.addComment(postId, commentData),
          () => comfortWallService.addComment(postId, commentData),
          () => postService.addComment(postId, commentData)
        ]
        : postType === 'comfort'
        ? [
          () => comfortWallService.addComment(postId, commentData),
          () => myDayService.addComment(postId, commentData),
          () => postService.addComment(postId, commentData)
        ]
        : [
          () => postService.addComment(postId, commentData),
          () => comfortWallService.addComment(postId, commentData),
          () => myDayService.addComment(postId, commentData)
        ];

      for (const apiCall of apiSequence) {
        try {
          await apiCall();
          success = true;
          logger.log('✅ 인라인 답글 작성 성공');
          break;
        } catch (error: any) {
          logger.log('❌ 인라인 답글 작성 API 실패:', error.response?.status, error.message);
          lastError = error;
        }
      }

      if (!success) {
        throw lastError;
      }

      // 상태 초기화
      setInlineReplyingTo(null);
      setInlineCommentText('');
      setInlineIsAnonymous(false);

      // 데이터 새로고침
      setShouldLoadData(true);

      // 댓글 목록으로 스크롤
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);

    } catch (error: any) {
      console.error('❌ 인라인 답글 작성 오류:', error);
      showAlert.error('오류', '답글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [inlineCommentText, inlineReplyingTo, inlineIsAnonymous, postType, postId]);

  // 인라인 답글 취소
  const handleInlineReplyCancel = useCallback(() => {
    setInlineReplyingTo(null);
    setInlineCommentText('');
    setInlineIsAnonymous(false);
  }, []);

  // 더블탭 공감 기능
  const handleDoubleTap = () => {
    logger.log('🔍 더블탭 시도 - 상태 확인:', { 
      hasPost: !!post, 
      hasError: !!error, 
      postId 
    });

    // 게시물이 없고 로딩이 완료된 상태이거나, 오류가 있으면서 게시물이 없는 경우에만 차단
    if ((!post && !loading) || (error && !post)) {
      logger.log('❌ 더블탭 차단됨 - 게시물 없음 또는 오류 상태');
      return;
    }

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      // 더블탭 감지
      logger.log('✅ 더블탭 감지 - 좋아요 처리 시작');
      handleLikePress();
      
      // 하트 애니메이션 실행
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
  };

  // 좋아요 처리
  const handleLikePress = async () => {
    // 비로그인 사용자 체크
    if (!isAuthenticated) {
      showAlert.info('알림', '로그인이 필요한 기능입니다.');
      return;
    }

    logger.log('🔍 좋아요 버튼 클릭 - 상태 확인:', {
      hasPost: !!post,
      hasError: !!error,
      isSubmitting: submitting,
      postId
    });

    // 게시물이 없고 로딩 중도 아닌 경우에만 차단
    if (!post && !loading) {
      logger.log('❌ 게시물 없음 (로딩 완료 후) - 좋아요 처리 중단');
      showAlert.error('오류', '게시물 정보를 찾을 수 없습니다.');
      return;
    }

    // 오류가 있으면서 게시물도 없는 경우에만 차단
    if (error && !post) {
      logger.log('❌ 오류 상태이며 게시물 없음 - 좋아요 처리 중단:', error);
      showAlert.error('오류', '게시물에 오류가 있어 좋아요를 할 수 없습니다.');
      return;
    }

    // 이미 처리 중인 경우 중복 요청 방지
    if (submitting) {
      logger.log('⏳ 이미 처리 중 - 중복 요청 방지');
      return;
    }
    
    try {
      logger.log('🚀 좋아요 요청 시작:', { postId, postType });
      
      let response;
      // postType에 따라 적절한 API 사용
      if (postType === 'comfort') {
        logger.log('💝 ComfortWall API 사용');
        response = await comfortWallService.likePost(postId);
      } else if (postType === 'myday') {
        logger.log('🌞 MyDay API 사용');
        response = await myDayService.likePost(postId);
      } else {
        logger.log('📝 기본 Posts API 사용');
        response = await postService.likePost(postId);
      }
      
      if (response.status === 'success' || response.data?.status === 'success') {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        
        // 게시물 상태도 업데이트
        if (post && typeof post === 'object') {
          setPost({
            ...post,
            is_liked: newLiked,
            like_count: newLiked ? (post.like_count || 0) + 1 : Math.max((post.like_count || 0) - 1, 0)
          });
        }
        
        logger.log('✅ 좋아요 처리 성공:', { 
          apiUsed: postType === 'comfort' ? 'ComfortWall' : postType === 'myday' ? 'MyDay' : 'Posts',
          newLiked, 
          newCount: newLiked ? likeCount + 1 : likeCount - 1 
        });
      }
    } catch (error: any) {
      console.error('❌ 첫 번째 좋아요 API 실패:', error);
      
      // 404 오류인 경우 대체 API들을 시도
      if (error.response?.status === 404) {
        logger.log('🔄 대체 API 시도 중...');
        
        try {
          let fallbackResponse;
          const apiSequence = postType === 'comfort' 
            ? ['Posts', 'MyDay']  // Comfort가 실패하면 Posts, MyDay 순으로 시도
            : postType === 'myday'
            ? ['ComfortWall', 'Posts']  // MyDay가 실패하면 ComfortWall, Posts 순으로 시도
            : ['ComfortWall', 'MyDay']; // Posts가 실패하면 ComfortWall, MyDay 순으로 시도
          
          for (const api of apiSequence) {
            try {
              logger.log(`🔄 ${api} API로 재시도 중...`);
              
              if (api === 'ComfortWall') {
                fallbackResponse = await comfortWallService.likePost(postId);
              } else if (api === 'MyDay') {
                fallbackResponse = await myDayService.likePost(postId);
              } else if (api === 'Posts') {
                fallbackResponse = await postService.likePost(postId);
              }
              
              // 성공하면 상태 업데이트 후 함수 종료
              if (fallbackResponse.status === 'success' || fallbackResponse.data?.status === 'success') {
                logger.log(`✅ ${api} API로 좋아요 성공!`);
                const newLiked = !liked;
                setLiked(newLiked);
                setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
                
                if (post && typeof post === 'object') {
                  setPost({
                    ...post,
                    is_liked: newLiked,
                    like_count: newLiked ? (post.like_count || 0) + 1 : Math.max((post.like_count || 0) - 1, 0)
                  });
                }
                return; // 성공 시 함수 종료
              }
            } catch (fallbackError: any) {
              logger.log(`❌ ${api} API도 실패:`, fallbackError.response?.status);
              continue; // 다음 API 시도
            }
          }
        } catch (fallbackError: any) {
          console.error('❌ 모든 대체 API 실패:', fallbackError);
        }
      }
      
      // 모든 API가 실패했을 때의 오류 메시지
      let errorMessage = '좋아요 처리 중 문제가 발생했습니다.';
      
      if (error.response?.status === 404) {
        errorMessage = '게시물을 찾을 수 없습니다. 게시물이 삭제되었을 수 있습니다.';
      } else if (error.response?.status === 401) {
        errorMessage = '로그인이 필요합니다.';
      } else if (error.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      showAlert.error('오류', errorMessage);
    }
  };

  // 북마크 토글 핸들러
  const handleBookmarkPress = async () => {
    // 비로그인 사용자 체크
    if (!isAuthenticated) {
      showAlert.info('알림', '로그인이 필요한 기능입니다.');
      return;
    }

    if (!post || !postId) {
      logger.log('❌ 게시물 정보 없음 - 북마크 처리 중단');
      return;
    }

    try {
      // postType에 따라 적절한 타입 설정
      const bookmarkType = postType === 'comfort' ? 'comfort_wall' : 'my_day';
      const response = await bookmarkService.toggleBookmark(bookmarkType, postId);

      if (response.status === 'success') {
        setIsBookmarked(response.data.isBookmarked);
        showAlert.success(
          response.data.isBookmarked ? '북마크 추가' : '북마크 해제',
          response.data.isBookmarked ? '관심 글에 추가했습니다 🔖' : '관심 글에서 제거했습니다'
        );
        logger.log('✅ 북마크 처리 성공:', { isBookmarked: response.data.isBookmarked });
      }
    } catch (error: any) {
      console.error('❌ 북마크 처리 실패:', error);
      let errorMessage = '북마크 처리 중 오류가 발생했습니다.';

      if (error.response?.status === 404) {
        errorMessage = '게시물을 찾을 수 없습니다.';
      } else if (error.response?.status === 401) {
        errorMessage = '로그인이 필요합니다.';
      }

      showAlert.error('오류', errorMessage);
    }
  };

  // 댓글 좋아요 처리
  const handleCommentLike = async (comment: Comment) => {
    // 비로그인 사용자 체크
    if (!isAuthenticated) {
      showAlert.info('알림', '로그인이 필요한 기능입니다.');
      return;
    }

    try {
      logger.log('❤️ 댓글 좋아요 요청:', { commentId: comment.comment_id, postType });
      
      // postType에 따라 적절한 API 사용
      let response;
      let success = false;
      let lastError = null;
      
      // API 순차 시도
      const apiAttempts = postType === 'myday' 
        ? [
          () => myDayService.likeComment(comment.comment_id),
          () => postService.likeComment(comment.comment_id),
          () => comfortWallService.likeComment(comment.comment_id)
        ]
        : postType === 'comfort'
        ? [
          () => comfortWallService.likeComment(comment.comment_id),
          () => postService.likeComment(comment.comment_id),
          () => myDayService.likeComment(comment.comment_id)
        ]
        : [
          () => postService.likeComment(comment.comment_id),
          () => myDayService.likeComment(comment.comment_id),
          () => comfortWallService.likeComment(comment.comment_id)
        ];
      
      for (const apiCall of apiAttempts) {
        try {
          response = await apiCall();
          success = true;
          logger.log('✅ 댓글 좋아요 API 성공');
          break;
        } catch (error: any) {
          logger.log('❌ 댓글 좋아요 API 실패:', error.response?.status, error.message);
          lastError = error;
          
          // 404 에러가 아닌 경우 즉시 중단
          if (error.response?.status !== 404) {
            break;
          }
        }
      }
      
      if (!success) {
        throw lastError;
      }
      
      // 응답 구조 확인 및 데이터 추출
      let is_liked: boolean = false;
      let like_count: number = 0;

      if (response.data?.status === 'success') {
        const data = response.data.data;
        is_liked = data.is_liked;
        like_count = data.like_count;
      } else if (response.status === 'success') {
        is_liked = response.data.is_liked;
        like_count = response.data.like_count;
      }
      
      logger.log('✅ 댓글 좋아요 성공:', { commentId: comment.comment_id, is_liked, like_count });
      
      // 댓글 상태 업데이트 함수
      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.comment_id === comment.comment_id) {
            return {
              ...c,
              like_count,
              is_liked
            };
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: updateCommentInTree(c.replies)
            };
          }
          return c;
        });
      };
      
      // 댓글 목록 업데이트
      setComments(prevComments => updateCommentInTree(prevComments));
      
      // 베스트 댓글 목록도 업데이트
      setBestComments(prevBest => updateCommentInTree(prevBest));
      
    } catch (error: any) {
      console.error('❌ 댓글 좋아요 처리 오류:', error);
      const errorMessage = error.response?.data?.message || '댓글 좋아요 처리 중 문제가 발생했습니다.';
      showAlert.error('오류', errorMessage);
    }
  };

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      showAlert.info('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);

      const normalizedContent = replyingTo
        ? `@${replyingTo.user?.nickname || '익명'} ${commentText.trim()}`
        : commentText.trim();

      const commentData = {
        content: normalizedContent,
        is_anonymous: isAnonymous,
        parent_comment_id: replyingTo ? replyingTo.comment_id : undefined
      };

      logger.log('💬 댓글 작성 요청:', {
        postId,
        commentData,
        replyingTo: replyingTo ? {
          comment_id: replyingTo.comment_id,
          user_nickname: replyingTo.user?.nickname
        } : null,
        isReply: !!replyingTo
      });

      let response;
      try {
        if (postType === 'myday') {
          response = await myDayService.addComment(postId, commentData);
        } else if (postType === 'comfort') {
          response = await comfortWallService.addComment(postId, commentData);
        } else {
          response = await postService.addComment(postId, commentData);
        }
        logger.log('✅ 댓글 작성 성공 - 응답 확인:', {
          status: response.status,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          comment_id: response.data?.comment_id
        });
      } catch (apiError: any) {
        logger.log('❌ 첫 번째 API 실패, 폴백 시도');
        // 폴백으로 다른 API들 시도
        response = await postService.addComment(postId, {
          content: normalizedContent,
          is_anonymous: isAnonymous,
          parent_comment_id: replyingTo?.comment_id || undefined,
        });
      }

      if ((response.status === 'success' || response.data?.status === 'success') && response.data) {
        logger.log('✅ 댓글 작성 응답 데이터:', response.data);
        
        // 응답 구조 확인 및 데이터 추출
        const commentData = response.data.data || response.data;
        logger.log('🔍 추출된 댓글 데이터:', {
          hasCommentData: !!commentData,
          comment_id: commentData?.comment_id,
          user_id: commentData?.user_id,
          content: commentData?.content,
          dataKeys: commentData ? Object.keys(commentData) : []
        });
        
        if (!commentData || !commentData.comment_id) {
          console.error('❌ 댓글 데이터에 comment_id가 없음');
          // 전체 데이터를 다시 로드
          setShouldLoadData(true);
          setCommentText('');
          setReplyingTo(null);
          return;
        }
        
        // 새 댓글을 즉시 댓글 목록에 추가
        const newComment = {
          ...commentData,
          user: commentData.is_anonymous ? null : commentData.user,
          User: commentData.is_anonymous ? null : commentData.user, // 호환성을 위해 두 형태 모두 추가
          replies: []
        };
        
        setComments(prevComments => {
          logger.log('📋 현재 댓글 목록:', prevComments.map(c => ({
            id: c.comment_id,
            content: c.content?.substring(0, 20),
            replies_count: c.replies?.length || 0
          })));
          
          // 답글인 경우 부모 댓글을 찾아서 replies에 추가
          if (newComment.parent_comment_id) {
            logger.log('🔗 답글 추가 시도:', { 
              newCommentId: newComment.comment_id, 
              parentId: newComment.parent_comment_id,
              현재댓글목록: prevComments.map(c => c.comment_id)
            });
            
            let foundParent = false;
            const updatedComments = prevComments.map(comment => {
              if (comment.comment_id === newComment.parent_comment_id) {
                foundParent = true;
                logger.log('✅ 부모 댓글 찾음 - 답글 추가:', {
                  parentId: comment.comment_id,
                  기존답글수: comment.replies?.length || 0
                });
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment]
                };
              }
              // 중첩된 답글에서도 찾기 (2단계 답글의 경우)
              if (comment.replies && comment.replies.length > 0) {
                const updatedReplies = comment.replies.map(reply => {
                  if (reply.comment_id === newComment.parent_comment_id) {
                    foundParent = true;
                    logger.log('✅ 답글에서 부모 찾음 - 2단계 답글 추가:', {
                      parentId: reply.comment_id,
                      기존답글수: reply.replies?.length || 0
                    });
                    return {
                      ...reply,
                      replies: [...(reply.replies || []), newComment]
                    };
                  }
                  return reply;
                });
                return { ...comment, replies: updatedReplies };
              }
              return comment;
            });
            
            if (!foundParent) {
              logger.warn('❌ 부모 댓글을 찾을 수 없음 - 최상위 댓글로 추가:', {
                parentId: newComment.parent_comment_id,
                availableComments: prevComments.map(c => c.comment_id)
              });
              return [newComment, ...prevComments];
            }
            
            logger.log('📋 답글 추가 후 댓글 목록:', updatedComments.map(c => ({
              id: c.comment_id,
              content: c.content?.substring(0, 20),
              replies_count: c.replies?.length || 0
            })));
            
            return updatedComments;
          } else {
            // 일반 댓글인 경우
            const existingIndex = prevComments.findIndex(c => c.comment_id === newComment.comment_id);
            if (existingIndex >= 0) {
              logger.log('🔄 기존 댓글 업데이트:', newComment.comment_id);
              const updatedComments = [...prevComments];
              updatedComments[existingIndex] = newComment;
              return updatedComments;
            } else {
              logger.log('🆕 새 댓글 추가:', newComment.comment_id);
              const updatedComments = [newComment, ...prevComments];
              
              logger.log('📋 새 댓글 추가 후 목록:', updatedComments.map(c => ({
                id: c.comment_id,
                content: c.content?.substring(0, 20),
                user: c.user?.nickname || '익명'
              })));
              
              return updatedComments;
            }
          }
        });
        
        // 게시물의 댓글 수 증가
        setPost(prevPost => prevPost ? {
          ...prevPost,
          comment_count: (prevPost.comment_count || 0) + 1
        } : prevPost);
        
        setCommentText('');
        const wasReply = !!replyingTo;
        const newCommentId = commentData.comment_id;
        setReplyingTo(null); // 답글 상태 초기화
        setIsCommentInputFocused(false); // 댓글 입력창 숨기기

        // TextInput 포커스 해제 및 키보드 닫기
        Keyboard.dismiss();
        if (textInputRef.current) {
          textInputRef.current.blur();
        }

        // 새 댓글을 하이라이트하고 스크롤
        setHighlightedCommentId(newCommentId);

        // 일반 댓글은 최상단에 추가되므로 최상단으로 스크롤
        // 답글은 부모 댓글 위치가 유지되므로 현재 위치 유지
        setTimeout(() => {
          if (!wasReply) {
            // 일반 댓글: 최상단으로 스크롤
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }
          // 하이라이트 3초 후 제거
          setTimeout(() => {
            setHighlightedCommentId(null);
          }, 3000);
        }, 300);
      }
    } catch (error: any) {
      console.error('댓글 작성 오류:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          '댓글 작성 중 문제가 발생했습니다.';
      
      showAlert.error('오류', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };


  // 날짜 포맷팅 - 안전한 처리
  const formatDate = (dateString: string | undefined | null) => {
    try {
      // dateString이 undefined이거나 null인 경우 처리
      if (!dateString) {
        logger.warn('📅 Date formatting: dateString is undefined or null');
        return '방금 전';
      }

      const date = new Date(dateString);
      
      // 유효하지 않은 날짜인 경우 처리
      if (isNaN(date.getTime())) {
        logger.warn('📅 Invalid date string:', dateString);
        return '방금 전';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;

      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('📅 Date formatting error:', error, 'for string:', dateString);
      return '방금 전';
    }
  };

  // 댓글용 시간 포맷팅 (월,일,시:분:초)
  const formatCommentTime = (dateString: string | undefined | null) => {
    try {
      if (!dateString) {
        return '방금 전';
      }

      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return '방금 전';
      }

      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      
      return `${month}월 ${day}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('📅 Comment time formatting error:', error, 'for string:', dateString);
      return '방금 전';
    }
  };

  // 백엔드에서 이미 완벽한 트리 구조로 보내므로 별도 처리 불필요
  
  // 전체 댓글 수 계산 (재귀적으로 모든 답글 포함)
  const calculateTotalCommentCount = (comments: Comment[]): number => {
    return comments.reduce((total: number, comment: Comment) => {
      const repliesCount = comment.replies ? calculateTotalCommentCount(comment.replies) : 0;
      return total + 1 + repliesCount;
    }, 0);
  };
  
  const totalCommentCount = calculateTotalCommentCount(comments);

  // 댓글 렌더링 - 개선된 디자인 (ComfortScreen과 일치)
  // useCallback으로 메모이제이션하여 불필요한 재렌더링 방지
  const renderComment = useCallback((comment: Comment & { replies?: Comment[] }, isReply: boolean = false, depth: number = 0) => {
    // 사용자 정보 추출 - comment.User 또는 comment.user 모두 지원
    const commentUser = (comment as any).User || (comment as any).user;
    const commentUserId = comment.user_id;
    const commentIsAnonymous = comment.is_anonymous;
    
    // 게시물 작성자가 자신의 글에 댓글을 단 경우 확인 (백엔드에서 제공하는 is_author 사용)
    const isPostAuthor = commentUser?.is_author || post?.user_id === commentUserId;
    
    logger.log('🔍 댓글 작성자 확인 (수정됨):', {
      comment_id: comment.comment_id,
      post_user_id: post?.user_id,
      comment_user_id: commentUserId,
      comment_is_anonymous: commentIsAnonymous,
      commentUser: commentUser,
      user_is_author: commentUser?.is_author,
      calculated_isPostAuthor: isPostAuthor
    });
    
    // 표시할 이름 결정
    let displayName = '';
    let avatarText = '';
    let avatarColor = '#8b5cf6';
    let emotionEmoji = null;

    if (commentIsAnonymous) {
      // 익명 댓글인 경우 항상 랜덤 감정 적용
      const emotion = getAnonymousEmotion(commentUserId, post?.post_id || 0, comment.comment_id);
      displayName = emotion.label;
      avatarText = emotion.label[0] || '익';
      avatarColor = emotion.color;
      emotionEmoji = emotion.emoji;
    } else {
      // 일반 사용자: 실제 닉네임 사용
      displayName = commentUser?.nickname || '사용자';

      // 댓글에 감정 정보가 있는지 확인 (하루 이야기 댓글 등)
      const commentEmotion = (comment as any).emotion;
      if (commentEmotion && typeof commentEmotion === 'string' && commentEmotion.trim() !== '') {
        // 감정 이름을 이모지로 변환
        const emotionToEmoji: { [key: string]: string } = {
          '기쁨': '😊', '행복': '😄', '슬픔': '😢', '우울': '😞', '지루': '😑',
          '화남': '😠', '분노': '😠', '불안': '😰', '걱정': '😟', '감동': '🥺',
          '황당': '🤨', '당황': '😲', '짜증': '😤', '무서움': '😨', '추억': '🥰',
          '설렘': '🤗', '편안': '😌', '궁금': '🤔', '사랑': '❤️', '아픔': '🤕',
          '욕심': '🤑'
        };

        // 감정 이름에서 이모지 찾기
        let foundEmoji = null;
        for (const [key, emoji] of Object.entries(emotionToEmoji)) {
          if (commentEmotion.includes(key) || key.includes(commentEmotion)) {
            foundEmoji = emoji;
            break;
          }
        }

        if (foundEmoji) {
          emotionEmoji = foundEmoji;
          avatarText = foundEmoji;
          avatarColor = '#8b5cf6';
        } else {
          avatarText = displayName[0] || 'U';
          avatarColor = isPostAuthor ? '#059669' : '#8b5cf6';
        }
      } else {
        avatarText = displayName[0] || 'U';
        avatarColor = isPostAuthor ? '#059669' : '#8b5cf6';
      }
    }
    
    // 내 댓글인지 확인
    const isMyComment = user && commentUserId === user.user_id;
    const isHighlighted = comment.comment_id === highlightedCommentId;
    
    // 접기 상태 확인
    const isCollapsed = collapsedComments.has(comment.comment_id);
    const hasReplies = comment.replies && comment.replies.length > 0;
    
    return (
      <TouchableOpacity
        key={comment.comment_id}
        ref={(ref: any) => setCommentRef(comment.comment_id, ref)}
        onLongPress={() => handleCommentLongPress(comment)}
        activeOpacity={isMyComment ? 0.8 : 1}
        style={{
          backgroundColor: isHighlighted ? '#FEF3C7' : (isReply ? modernTheme.bg.secondary : modernTheme.bg.card),
          borderRadius: 8,
          padding: isReply ? 6 : 10,
          ...(isHighlighted && { borderWidth: 2, borderColor: '#F59E0B', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }),
          marginBottom: 6,
          borderWidth: isReply ? 0 : 1,
          borderColor: 'rgba(0, 0, 0, 0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.02,
          shadowRadius: 2,
          elevation: 1
        }}
      >
        {/* 댓글 헤더 - 컴팩트한 디자인 */}
        <HStack style={{ alignItems: 'center', marginBottom: 4 }} pointerEvents="box-none">
          {/* 클릭 가능한 아바타 */}
          <ClickableAvatar
            userId={commentUserId}
            nickname={displayName}
            isAnonymous={commentIsAnonymous}
            avatarUrl={!commentIsAnonymous && commentUser?.profile_image_url && commentUser.profile_image_url.trim() !== '' ? commentUser.profile_image_url : undefined}
            avatarText={emotionEmoji || avatarText}
            avatarColor={avatarColor}
            size={isReply ? 22 : 26}
          />
          <VStack style={{ flex: 1, marginLeft: 6 }} pointerEvents="box-none">
            <HStack style={{ alignItems: 'center' }} pointerEvents="box-none">
              <ClickableNickname
                userId={commentUserId}
                nickname={displayName}
                isAnonymous={commentIsAnonymous}
                style={{
                  fontSize: TYPOGRAPHY.body,
                  fontWeight: '600',
                  color: modernTheme.text.primary,
                  marginRight: 4
                }}
              >
                {displayName}
              </ClickableNickname>

              {/* 익명 댓글의 감정 이모지 */}
              {commentIsAnonymous && emotionEmoji && (
                <RNText style={{
                  fontSize: TYPOGRAPHY.caption,
                  marginRight: 3
                }}>
                  {emotionEmoji}
                </RNText>
              )}

              {/* 익명 댓글에서 본인이 작성한 댓글일 때 "나" 표시 */}
              {(() => {
                logger.log('🔍 [PostDetail 댓글] "나" 표시 체크:', {
                  comment_id: comment.comment_id,
                  hasUser: !!user,
                  userId: user?.user_id,
                  commentUserId: commentUserId,
                  commentIsAnonymous,
                  isMyComment
                });

                return commentIsAnonymous && isMyComment && (
                  <Box
                    style={{
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                      backgroundColor: modernTheme.colors.primary,
                      borderRadius: 3,
                      marginRight: 3,
                    }}
                  >
                    <RNText style={{
                      fontSize: TYPOGRAPHY.captionSmall,
                      color: '#ffffff',
                      fontWeight: '600'
                    }}>
                      나
                    </RNText>
                  </Box>
                );
              })()}

              {isPostAuthor && (
                <Box
                  style={{
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                    backgroundColor: '#10b981',
                    borderRadius: 3,
                    marginRight: 3,
                  }}
                >
                  <RNText style={{
                    fontSize: TYPOGRAPHY.captionSmall,
                    color: '#ffffff',
                    fontWeight: '600'
                  }}>
                    작성자
                  </RNText>
                </Box>
              )}
              <RNText style={{
                fontSize: TYPOGRAPHY.captionSmall,
                color: '#9ca3af'
              }}>
                {formatCommentTime(comment.created_at)}
              </RNText>
            </HStack>
          </VStack>
          
          {/* 접기/펼치기 버튼 - 답글이 있는 최상위 댓글에만 표시 (오른쪽 상단) */}
          {!isReply && hasReplies && (
            <TouchableOpacity
              onPress={() => toggleCommentCollapse(comment.comment_id)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: 4,
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2
              }}
            >
              <MaterialCommunityIcons
                name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                size={14}
                color="#6b7280"
              />
            </TouchableOpacity>
          )}
        </HStack>
        
        {/* 댓글 내용 또는 수정 입력창 */}
        {editingComment?.comment_id === comment.comment_id ? (
          <Box style={{ marginLeft: isReply ? 28 : 32, marginTop: 6 }}>
            <TextInput
              mode="outlined"
              placeholder="댓글을 수정해주세요..."
              value={editCommentText}
              onChangeText={setEditCommentText}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: modernTheme.bg.secondary,
                fontSize: TYPOGRAPHY.body,
              }}
              outlineColor="#E5E7EB"
              activeOutlineColor="#8B5CF6"
              theme={{
                colors: {
                  onSurfaceVariant: '#6B7280',
                  outline: '#E5E7EB',
                  primary: '#8B5CF6'
                }
              }}
            />
            <HStack style={{ justifyContent: 'flex-end', marginTop: 6, gap: 6 }}>
              <Button
                mode="outlined"
                onPress={handleCancelCommentEdit}
                compact
                style={{ borderRadius: 6 }}
                contentStyle={{ paddingHorizontal: 6 }}
                labelStyle={{ fontSize: TYPOGRAPHY.body }}
              >
                취소
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveCommentEdit}
                compact
                style={{ borderRadius: 6, backgroundColor: modernTheme.colors.primary }}
                contentStyle={{ paddingHorizontal: 6 }}
                labelStyle={{ fontSize: TYPOGRAPHY.body }}
              >
                저장
              </Button>
            </HStack>
          </Box>
        ) : (
          <RNText style={{
            fontSize: TYPOGRAPHY.body,
            lineHeight: 18,
            color: modernTheme.text.primary,
            marginLeft: isReply ? 24 : 28,
            letterSpacing: 0.05
          }}>
            {comment.content?.replace(/(@[^[]+)\[\d+\]/g, '$1')}
          </RNText>
        )}

        {/* 답글 버튼과 수정/삭제 버튼 */}
        {!editingComment && (
          <Box style={{ marginLeft: isReply ? 24 : 28, marginTop: 4 }}>
            <HStack style={{ gap: 4 }}>
              {/* 좋아요 버튼 - 컴팩트한 디자인 */}
              <TouchableOpacity
                onPress={() => handleCommentLike(comment)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 3,
                  paddingHorizontal: 6,
                  borderRadius: 10,
                  backgroundColor: comment.is_liked ? '#fef3c7' : '#f9fafb',
                  borderWidth: 1,
                  borderColor: comment.is_liked ? '#f59e0b' : '#e5e7eb',
                  alignSelf: 'flex-start',
                  minWidth: 50,
                  justifyContent: 'center'
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={comment.is_liked ? "heart" : "heart-outline"}
                  size={11}
                  color={comment.is_liked ? "#f59e0b" : "#6b7280"}
                  style={{ marginRight: 3 }}
                />
                <RNText style={{
                  fontSize: TYPOGRAPHY.captionSmall,
                  color: comment.is_liked ? "#f59e0b" : "#6b7280",
                  fontWeight: comment.is_liked ? '600' : '500'
                }}>
                  {comment.like_count || 0}
                </RNText>
              </TouchableOpacity>

              {/* 답글 버튼 - 2단계까지만 표시 */}
              {depth < 2 && (
                <TouchableOpacity
                  onPress={() => {
                    setInlineReplyingTo(comment);
                    setInlineCommentText('');

                    // 답글 입력창이 표시되고 키보드가 올라오는 것을 고려한 스크롤
                    setTimeout(() => {
                      const commentRef = commentRefs.current.get(comment.comment_id);
                      if (commentRef && scrollViewRef.current) {
                        commentRef.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                          // 답글 입력창 높이(약 250px) + 키보드 예상 높이(300px) 고려
                          const targetY = Math.max(0, pageY - 100);
                          (scrollViewRef.current as any)?.scrollTo({
                            y: targetY,
                            animated: true
                          });
                        });
                      }
                    }, 150);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 3,
                    paddingHorizontal: 6,
                    borderRadius: 10,
                    backgroundColor: modernTheme.bg.secondary,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    alignSelf: 'flex-start'
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="reply"
                    size={10}
                    color="#6b7280"
                    style={{ marginRight: 3 }}
                  />
                  <RNText style={{ fontSize: TYPOGRAPHY.captionSmall, color: modernTheme.text.secondary, fontWeight: '500' }}>
                    답글
                  </RNText>
                </TouchableOpacity>
              )}

              {/* 내 댓글/답글인 경우 수정 버튼 표시 */}
              {isMyComment && (
                <TouchableOpacity
                  onPress={() => handleEditComment(comment)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 2,
                    paddingHorizontal: 5,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#fef3c7',
                    alignSelf: 'flex-start'
                  }}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={9}
                    color="#f59e0b"
                    style={{ marginRight: 2 }}
                  />
                  <RNText style={{ fontSize: TYPOGRAPHY.captionSmall, color: '#f59e0b', fontWeight: '500' }}>
                    수정
                  </RNText>
                </TouchableOpacity>
              )}

              {/* 내 댓글/답글인 경우 삭제 버튼 표시 */}
              {isMyComment && (
                <TouchableOpacity
                  onPress={() => handleDeleteComment(comment)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 2,
                    paddingHorizontal: 5,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                    alignSelf: 'flex-start'
                  }}
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={9}
                    color="#dc2626"
                    style={{ marginRight: 2 }}
                  />
                  <RNText style={{ fontSize: TYPOGRAPHY.captionSmall, color: '#dc2626', fontWeight: '500' }}>
                    삭제
                  </RNText>
                </TouchableOpacity>
              )}
            </HStack>
          </Box>
        )}

        {/* 인라인 답글 입력창 - 컴팩트한 디자인 */}
        {inlineReplyingTo?.comment_id === comment.comment_id && (
          <Box style={{
            marginLeft: 32,
            marginTop: 6,
            marginBottom: 6,
          }}>
            {/* 간단한 답글 입력 필드 */}
            <HStack style={{ alignItems: 'center', gap: 6 }}>
              <TextInput
                mode="outlined"
                placeholder={`@${displayName} 답글...`}
                value={inlineCommentText}
                onChangeText={setInlineCommentText}
                autoFocus={true}
                onFocus={() => {
                  // 하단 고정 댓글 입력창으로 포커스 이동
                  handleInlineReplyCancel();
                  setReplyingTo(inlineReplyingTo);
                  setCommentText('');
                  setIsCommentInputFocused(true);
                  setTimeout(() => {
                    textInputRef.current?.focus();
                  }, 100);
                }}
                style={{
                  flex: 1,
                  backgroundColor: modernTheme.bg.secondary,
                  fontSize: TYPOGRAPHY.body,
                  height: 36,
                }}
                outlineColor="#e5e7eb"
                activeOutlineColor="#8b5cf6"
                theme={{
                  colors: {
                    onSurfaceVariant: '#9ca3af',
                    outline: '#e5e7eb',
                    primary: '#8b5cf6'
                  }
                }}
                dense
              />
              <TouchableOpacity onPress={handleInlineReplyCancel}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </HStack>
          </Box>
        )}

        {/* 답글 렌더링 - 접기 상태에 따라 표시/숨김 */}
        {comment.replies && comment.replies.length > 0 && !isCollapsed && (
          <Box style={{
            marginLeft: 12,
            marginTop: 6,
            paddingLeft: 10,
            borderLeftWidth: 2,
            borderLeftColor: '#e5e7eb'
          }}>
            {(comment.replies || [])
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((reply, replyIndex) => (
                <React.Fragment key={`reply-${reply.comment_id || `temp-${replyIndex}`}`}>
                  {renderComment(reply, true, depth + 1)}
                </React.Fragment>
              ))}
              
            {/* 답글 접기 버튼 */}
            <TouchableOpacity
              onPress={() => toggleCommentCollapse(comment.comment_id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
                paddingHorizontal: 10,
                marginTop: 6,
                borderRadius: 12,
                backgroundColor: modernTheme.bg.secondary,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                alignSelf: 'center'
              }}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={10}
                color="#64748b"
                style={{ marginRight: 3 }}
              />
              <RNText style={{
                fontSize: TYPOGRAPHY.captionSmall,
                color: '#64748b',
                fontWeight: '500'
              }}>
                답글 접기
              </RNText>
            </TouchableOpacity>
          </Box>
        )}
        
        {/* 접힌 상태에서 답글 개수 표시 */}
        {comment.replies && comment.replies.length > 0 && isCollapsed && (
          <Box style={{ 
            marginLeft: isReply ? 36 : 42, 
            marginTop: 8 
          }}>
            <TouchableOpacity
              onPress={() => toggleCommentCollapse(comment.comment_id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 5,
                paddingHorizontal: 9,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#f0f9ff',
                borderWidth: 1,
                borderColor: '#bae6fd',
                alignSelf: 'flex-start'
              }}
            >
              <MaterialCommunityIcons
                name="comment-multiple-outline"
                size={11}
                color="#0ea5e9"
                style={{ marginRight: 4 }}
              />
              <RNText style={{
                fontSize: TYPOGRAPHY.caption,
                color: '#0ea5e9',
                fontWeight: '600'
              }}>
                답글 {comment.replies.length}개 더보기
              </RNText>
              <MaterialCommunityIcons
                name="chevron-down"
                size={11}
                color="#0ea5e9"
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </Box>
        )}
      </TouchableOpacity>
    );
  }, [user, post, highlightedCommentId, collapsedComments, modernTheme, handleCommentLongPress, toggleCommentCollapse]); // renderComment 함수 닫기 - useCallback 의존성 배열 추가

  // 로딩 화면
  if (loading) {
    return (
      <Center className="flex-1">
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text className="mt-4 text-base text-gray-600">게시물을 불러오는 중...</Text>
      </Center>
    );
  }

  // 오류 화면
  if (error && !post) {
    return (
      <Center className="flex-1 px-8">
        <MaterialCommunityIcons name="alert-circle" size={64} color="#ccc" />
        <Text className="text-base text-gray-600 text-center my-4">{error}</Text>
        
        {/* 개발 중 추가 정보 표시 */}
        <Text className="text-base text-gray-400 text-center mt-2">
          Post ID: {postId}
        </Text>
        
        <Button mode="contained" onPress={() => fetchPostData(0)} className="mt-4">
          다시 시도
        </Button>
        
        {/* 뒤로 가기 버튼 추가 */}
        <Button mode="outlined" onPress={() => navigation.goBack()} className="mt-2">
          뒤로 가기
        </Button>
      </Center>
    );
  }

  // 게시물이 없는 경우
  if (!post) {
    return (
      <Center className="flex-1 px-8">
        <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
        <Text className="text-base text-gray-600 text-center my-4">게시물을 찾을 수 없습니다.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} className="mt-4">
          뒤로 가기
        </Button>
      </Center>
    );
  }
 // 신고 모달
    const ReportModal = () => {

      const reportReasons = [
        {
          type: 'spam',
          label: '스팸/도배',
          description: '반복적이거나 무의미한 내용',
          icon: 'alert-octagon'
        },
        {
          type: 'inappropriate',
          label: '부적절한 내용',
          description: '커뮤니티 가이드라인 위반',
          icon: 'alert-circle'
        },
        {
          type: 'harassment',
          label: '괴롭힘/욕설',
          description: '다른 사용자를 괴롭히거나 모욕',
          icon: 'account-alert'
        },
        {
          type: 'violence',
          label: '폭력적 내용',
          description: '폭력을 조장하거나 묘사',
          icon: 'shield-alert'
        },
        {
          type: 'misinformation',
          label: '잘못된 정보',
          description: '거짓이거나 오해를 불러일으키는 정보',
          icon: 'information-off'
        },
        {
          type: 'other',
          label: '기타',
          description: '위에 해당하지 않는 기타 사유',
          icon: 'dots-horizontal-circle'
        },
      ];

      return (
        <Portal>
          <Modal
            visible={reportModalVisible}
            onDismiss={() => !isSubmittingReport && setReportModalVisible(false)}    
          >
            <View style={styles.reportModal}>
              {/* 헤더 */}
              <View style={styles.reportModalHeader}>
                <MaterialCommunityIcons name="flag" size={30} color="#FFD60A" />
                <Text style={styles.reportModalTitle}>게시물 신고</Text>
              </View>
              <Text style={styles.reportModalSubtitle}>
                신고 사유를 선택해주세요
              </Text>

              {/* 신고 사유 목록 */}
              <ScrollView
                style={styles.reportReasonsContainer}
                showsVerticalScrollIndicator={false}
              >
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.type}
                    style={[
                      styles.reportReasonItem,
                      selectedReportReason === reason.type && 
  styles.reportReasonItemSelected
                    ]}
                    onPress={() => setSelectedReportReason(reason.type)}
                    disabled={isSubmittingReport}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reportReasonIconWrapper}>
                      <MaterialCommunityIcons
                        name={reason.icon}
                        size={24}
                        color={selectedReportReason === reason.type ? '#FFD60A' : (isDark ? '#D1D1D6' : modernTheme.text.secondary)}
                      />
                    </View>
                    <View style={styles.reportReasonContent}>
                      <Text style={[
                        styles.reportReasonLabel,
                        selectedReportReason === reason.type && 
  styles.reportReasonLabelSelected
                      ]}>
                        {reason.label}
                      </Text>
                      <Text style={styles.reportReasonDescription}>
                        {reason.description}
                      </Text>
                    </View>
                    {selectedReportReason === reason.type && (
                      <MaterialCommunityIcons
                        name="radiobox-marked"
                        size={26}
                        color="#FFD60A"
                      />
                    )}
                    {selectedReportReason !== reason.type && (
                      <MaterialCommunityIcons
                        name="radiobox-blank"
                        size={26}
                        color={isDark ? '#48484A' : '#C7C7CC'}
                      />
                    )}
                  </TouchableOpacity>
                ))}

                {/* 기타 사유 입력 */}
                {selectedReportReason === 'other' && (
                  <View style={styles.reportDetailsContainer}>
                    <TextInput
                      mode="outlined"
                      placeholder="상세 사유를 입력해주세요 (최소 10자)"
                      placeholderTextColor={isDark ? '#98989D' : '#8E8E93'}
                      value={reportDetails}
                      onChangeText={setReportDetails}
                      multiline
                      numberOfLines={4}
                      style={styles.reportDetailsInput}
                      disabled={isSubmittingReport}
                      maxLength={500}
                      outlineColor={isDark ? '#48484A' : '#C7C7CC'}
                      activeOutlineColor="#FFD60A"
                      textColor={modernTheme.text.primary}
                      theme={{
                        colors: {
                          onSurfaceVariant: isDark ? '#98989D' : '#8E8E93',
                        }
                      }}
                    />
                    <Text style={styles.reportDetailsCounter}>
                      {reportDetails.length}/500
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* 버튼 영역 */}
              <View style={styles.reportModalButtons}>
                <TouchableOpacity
                  style={[styles.reportCancelButton]}
                  onPress={() => setReportModalVisible(false)}
                  disabled={isSubmittingReport}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reportCancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reportSubmitButton,
                    (!selectedReportReason || isSubmittingReport) && 
  styles.reportSubmitButtonDisabled
                  ]}
                  onPress={handleSubmitReport}
                  disabled={isSubmittingReport || !selectedReportReason}
                  activeOpacity={0.7}
                >
                  {isSubmittingReport ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={[
                      styles.reportSubmitButtonText,
                      (!selectedReportReason) && styles.reportSubmitButtonTextDisabled
                    ]}>신고하기</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </Portal>
      );
    };
  return (
    <>
      <View style={{ flex: 1, backgroundColor: modernTheme.bg.primary }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120  // 고정된 하단 입력창 공간 확보
        }}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollEndDrag={(e) => {
          const offsetY = e.nativeEvent.contentOffset.y;
          const contentHeight = e.nativeEvent.contentSize.height;
          const scrollViewHeight = e.nativeEvent.layoutMeasurement.height;

          // 하단 200px 이내로 스크롤 시 추가 로드
          if (contentHeight - offsetY - scrollViewHeight < 200) {
            loadMoreComments();
          }
        }}
      >
        {/* 게시물 카드 - 개선된 디자인 */}
        <Box
          style={{
            margin: 8,
            marginBottom: 8,
            backgroundColor: modernTheme.bg.card,
            borderRadius: 12,
            shadowColor: isDark ? '#fff' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.02 : 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* 게시물 헤더 */}
          <HStack style={{ alignItems: 'center', padding: 12, paddingBottom: 8 }} pointerEvents="box-none">
            {post.is_anonymous ? (
              <>
                {/* 익명 게시물: 감정 이모지 아바타 (클릭 불가) */}
                {(() => {
                  const postEmotion = post.emotions && post.emotions.length > 0 ? post.emotions[0].name : undefined;
                  const emotion = getAnonymousEmotion(post.user_id, post.post_id, 0, postEmotion);
                  return (
                    <>
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: emotion.color,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.08,
                          shadowRadius: 3,
                          elevation: 2,
                        }}
                      >
                        <RNText style={{
                          fontSize: TYPOGRAPHY.h2,
                          color: '#ffffff',
                          textAlign: 'center',
                          lineHeight: 26
                        }}>
                          {emotion.emoji}
                        </RNText>
                      </Box>
                      <VStack style={{ marginLeft: 10, flex: 1 }}>
                        <HStack style={{ alignItems: 'center', marginBottom: 2 }}>
                          {/* 감정 단어만 표시 (오른쪽 이모지 제거) */}
                          <Box style={{
                            backgroundColor: `${emotion.color}15`,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: `${emotion.color}30`,
                          }}>
                            <RNText style={{
                              fontSize: TYPOGRAPHY.body,
                              fontWeight: '700',
                              color: emotion.color
                            }}>
                              {emotion.label}
                            </RNText>
                          </Box>

                          {/* 익명 게시물에서 본인이 작성한 글일 때 "나" 표시 */}
                          {(() => {
                            const isMyPost = user && post.user_id === user.user_id;
                            logger.log('🔍 [PostDetail 게시물] "나" 표시 체크:', {
                              hasUser: !!user,
                              userId: user?.user_id,
                              postUserId: post.user_id,
                              isAnonymous: post.is_anonymous,
                              isMyPost
                            });

                            return isMyPost && (
                              <Box
                                style={{
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  backgroundColor: modernTheme.colors.primary,
                                  borderRadius: 4,
                                  marginLeft: 6,
                                }}
                              >
                                <RNText style={{
                                  fontSize: TYPOGRAPHY.captionSmall,
                                  color: '#ffffff',
                                  fontWeight: '600'
                                }}>
                                  나
                                </RNText>
                              </Box>
                            );
                          })()}
                        </HStack>
                        <RNText style={{
                          fontSize: TYPOGRAPHY.captionSmall,
                          color: modernTheme.text.secondary,
                          fontWeight: '500',
                          letterSpacing: 0.1
                        }}>
                          {formatDate(post.created_at)}
                        </RNText>
                      </VStack>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                {/* 실명 게시물: 클릭 가능한 프로필 */}
                <ClickableAvatar
                  userId={post.user_id}
                  nickname={post.user?.nickname || '사용자'}
                  isAnonymous={false}
                  avatarUrl={post.user?.profile_image_url}
                  avatarText={post.user?.nickname?.[0] || 'U'}
                  avatarColor="#667eea"
                  size={40}
                />
                <VStack style={{ marginLeft: 10, flex: 1 }} pointerEvents="box-none">
                  <View pointerEvents="box-none">
                    <ClickableNickname
                      userId={post.user_id}
                      nickname={post.user?.nickname || '사용자'}
                      isAnonymous={false}
                      style={{
                        fontSize: TYPOGRAPHY.body,
                        fontWeight: '700',
                        color: modernTheme.text.primary,
                        marginBottom: 2,
                        letterSpacing: -0.2
                      }}
                    >
                      {post.user?.nickname || '사용자'}
                    </ClickableNickname>
                  </View>
                  <RNText style={{
                    fontSize: TYPOGRAPHY.captionSmall,
                    color: modernTheme.text.secondary,
                    fontWeight: '500',
                    letterSpacing: 0.1
                  }}>
                    {formatDate(post.created_at)}
                  </RNText>
                </VStack>
              </>
            )}
          </HStack>

          {/* 게시물 제목 - 매거진 스타일 */}
          {post.title && (
            <Box style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
              <RNText style={{
                fontSize: FONT_SIZES.bodyLarge,
                lineHeight: 22,
                color: modernTheme.text.primary,
                fontWeight: '700',
                letterSpacing: -0.3,
                marginBottom: 6,
              }}>
                {post.title}
              </RNText>
            </Box>
          )}

          {/* 게시물 내용 - 읽기 최적화 */}
         {/* 게시물 내용 - 읽기 최적화 + 더보기/접기 */}
          <Box style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
            <TouchableOpacity
              style={{ position: 'relative' }}
              activeOpacity={1}
              onPress={(!post && !loading) || (error && !post) ? undefined : handleDoubleTap}
              disabled={(!post && !loading) || (error && !post)}
              pointerEvents="box-none"
            >
<RNText
  style={{
    fontSize: FONT_SIZES.bodySmall,
    lineHeight: 20,
    color: modernTheme.text.primary,
    letterSpacing: 0.1,
    textAlign: 'left',
  }}
  numberOfLines={isContentExpanded ? undefined : 5}
  ellipsizeMode="tail"
>
  {post.content}
</RNText>


              {/* 텍스트 영역 더블탭 하트 애니메이션 */}
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
                  <MaterialCommunityIcons name="heart" size={50} color="#FF6B6B" />
                </Animated.View>
              )}
            </TouchableOpacity>

            {/* 더보기/접기 버튼 - 본문이 긴 경우에만 표시 */}
            {post.content && post.content.length > 10 && (
              <TouchableOpacity
                onPress={() => {
                  logger.log('더보기 버튼 클릭! 현재 상태:', isContentExpanded);
                  setIsContentExpanded(!isContentExpanded);
                }}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  marginTop: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  alignSelf: 'flex-start',
                  backgroundColor: modernTheme.colors.primary,
                  borderRadius: 6,
                  zIndex: 1000,
                  elevation: 5,
                }}
              >
                <RNText style={{
                  fontSize: TYPOGRAPHY.caption,
                  fontWeight: '600',
                  color: '#FFFFFF',
                  letterSpacing: 0.1,
                }}>
                  {isContentExpanded ? '접기' : '더보기'}
                </RNText>
              </TouchableOpacity>
            )}
          </Box>
          

          {/* 이미지 (있는 경우) - 메모이제이션으로 불필요한 재렌더링 방지 */}
          {post.image_url && (
            <PostImages
    imageUrls={post.image_url}
    onDoubleTap={handleDoubleTap}
    showLikeAnimation={showLikeAnimation}
    likeAnimationValue={likeAnimationValue}
  />
          )}

          {/* 태그들 표시 */}
          {post.tags && post.tags.length > 0 && (
            <Box style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {post.tags.map((tag, index) => {
                  const tagName = typeof tag === 'string' ? tag : (tag?.name || '');
                  if (!tagName || !tagName.trim()) return null;

                  // tag_id가 있으면 사용하고, 없으면 index 사용
                  const tagId = typeof tag === 'object' && tag?.tag_id ? tag.tag_id : index;

                  return (
                  <TouchableOpacity
                    key={`tag-${post.post_id}-${tagId}`}
                    style={{
                      backgroundColor: isDark ? 'rgba(3, 169, 244, 0.15)' : '#E3F2FD',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginRight: 6,
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: '#0095F6',
                    }}
                  >
                    <RNText style={{
                      fontSize: TYPOGRAPHY.caption,
                      fontWeight: '500',
                      color: '#0095F6',
                    }}>
                      #{tagName}
                    </RNText>
                  </TouchableOpacity>
                  );
                }).filter(Boolean)}
              </View>
            </Box>
          )}

          {/* 오늘의 감정 배지 */}
          {post.emotions && post.emotions.length > 0 && (
            <Box style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
              {post.emotions.slice(0, 1).map((emotion, index) => {
                const getEmotionEmoji = (emotionName: string): string => {
                  const emojiMap: Record<string, string> = {
                    '행복': '😊',
                    '기쁨': '😄',
                    '감사': '🙏',
                    '위로': '🤗',
                    '감동': '🥺',
                    '슬픔': '😢',
                    '우울': '😞',
                    '불안': '😰',
                    '걱정': '😟',
                    '화남': '😠',
                    '지침': '😑',
                    '무서움': '😨',
                    '편함': '😌',
                    '궁금': '🤔',
                    '사랑': '❤️',
                    '아픔': '🤕',
                    '욕심': '🤑',
                    '추억': '🥰',
                    '설렘': '🤗',
                    '황당': '🤨',
                    '당황': '😲',
                    '고독': '😔',
                    '충격': '😱'
                  };

                  for (const [key, emoji] of Object.entries(emojiMap)) {
                    if (emotionName.includes(key) || key.includes(emotionName)) {
                      return emoji;
                    }
                  }
                  return '😊';
                };

                const emotionEmoji = getEmotionEmoji(typeof emotion.name === 'string' ? emotion.name : '감정');

                return (
                  <Box
                    key={`emotion-${emotion.emotion_id || index}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: `${emotion.color}15`,
                      borderWidth: 1,
                      borderColor: `${emotion.color}30`,
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <RNText style={{
                      fontSize: TYPOGRAPHY.caption,
                      marginRight: 4,
                    }}>
                      {emotionEmoji}
                    </RNText>
                    <RNText style={{
                      fontSize: TYPOGRAPHY.caption,
                      fontWeight: '600',
                      color: emotion.color,
                    }}>
                      오늘의 감정: {typeof emotion.name === 'string' ? emotion.name : '감정'}
                    </RNText>
                  </Box>
                );
              })}
              {post.emotions.length > 1 && (
                <RNText style={{
                  fontSize: TYPOGRAPHY.captionSmall,
                  color: modernTheme.text.tertiary,
                  marginTop: 3,
                }}>
                  +{post.emotions.length - 1}개 감정 더
                </RNText>
              )}
            </Box>
          )}

          {/* 액션 버튼들 - 인스타그램 스타일 */}
          <Box style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0'
          }}>
            <Pressable
              onPress={(!post && !loading) || (error && !post) ? undefined : handleLikePress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 16,
                paddingVertical: 6,
                paddingHorizontal: 8,
                borderRadius: 16,
                backgroundColor: liked ? modernTheme.bg.hover : 'transparent',
                opacity: (!post && !loading) || (error && !post) ? 0.5 : 1,
              }}
              disabled={(!post && !loading) || (error && !post)}
            >
              <MaterialCommunityIcons
                name={liked ? "heart" : "heart-outline"}
                size={18}
                color={(!post && !loading) || (error && !post) ? "#9ca3af" : liked ? "#1A1A1A" : "#666666"}
              />
              <RNText style={{
                marginLeft: 4,
                fontSize: TYPOGRAPHY.body,
                fontWeight: '600',
                color: (!post && !loading) || (error && !post) ? '#9ca3af' : liked ? '#111827' : '#6b7280',
                letterSpacing: -0.1
              }}>
                {likeCount}
              </RNText>
            </Pressable>

            <Pressable
              onPress={() => {
                // 댓글 섹션으로 스크롤
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                paddingHorizontal: 8,
                borderRadius: 16,
                backgroundColor: 'transparent',
              }}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={18}
                color="#666666"
              />
              <RNText style={{
                marginLeft: 4,
                fontSize: TYPOGRAPHY.body,
                fontWeight: '600',
                color: '#666666'
              }}>
                {totalCommentCount}
              </RNText>
            </Pressable>
          </Box>
        </Box>

        {/* 댓글 섹션 */}
        {totalCommentCount > 0 && (
          <Box style={{ margin: 12, marginTop: 8 }}>
            <HStack style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <RNText style={{
                fontSize: TYPOGRAPHY.body,
                fontWeight: '700',
                color: modernTheme.text.primary
              }}>
                댓글 {totalCommentCount}개
              </RNText>

              <TouchableOpacity
                onPress={toggleAllCommentsCollapse}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  backgroundColor: modernTheme.bg.secondary,
                }}
              >
                <MaterialCommunityIcons
                  name={allCommentsCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={12}
                  color="#6b7280"
                  style={{ marginRight: 3 }}
                />
                <RNText style={{
                  fontSize: TYPOGRAPHY.caption,
                  fontWeight: '500',
                  color: '#6b7280'
                }}>
                  {allCommentsCollapsed ? '전체 펼치기' : '전체 접기'}
                </RNText>
              </TouchableOpacity>
            </HStack>
            
            {/* 베스트 댓글 섹션 */}
            {!allCommentsCollapsed && bestComments.length > 0 && (
              <Box style={{ marginBottom: 16 }}>
                <HStack style={{ 
                  alignItems: 'center', 
                  marginBottom: 12, 
                  paddingBottom: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <MaterialCommunityIcons
                    name="trophy-outline"
                    size={14}
                    color="#fbbf24"
                    style={{ marginRight: 6 }}
                  />
                  <RNText style={{
                    fontSize: TYPOGRAPHY.body,
                    fontWeight: '600',
                    color: '#fbbf24'
                  }}>
                    베스트 댓글
                  </RNText>
                </HStack>

                {/* 베스트 댓글 목록 */}
                {bestCommentsView}
              </Box>
            )}
            
            {/* 전체 접기 상태가 아닐 때만 댓글 표시 - 최신순 정렬 */}
            {!allCommentsCollapsed && sortedComments.map((comment, commentIndex) => (
              <React.Fragment key={`comment-${comment.comment_id || `temp-${commentIndex}`}`}>
                {renderComment(comment)}
              </React.Fragment>
            ))}

            {/* 무한 스크롤 로딩 인디케이터 */}
            {!allCommentsCollapsed && loadingMoreComments && (
              <Box style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={modernTheme.colors.primary} />
                <RNText style={{
                  marginTop: 8,
                  fontSize: TYPOGRAPHY.caption,
                  color: modernTheme.text.secondary
                }}>
                  댓글 로딩 중...
                </RNText>
              </Box>
            )}

            {/* 더 이상 댓글 없음 표시 */}
            {!allCommentsCollapsed && !hasMoreComments && totalCommentCount > 10 && (
              <Box style={{ paddingVertical: 16, alignItems: 'center' }}>
                <RNText style={{ fontSize: TYPOGRAPHY.caption, color: modernTheme.text.tertiary }}>
                  모든 댓글을 불러왔습니다
                </RNText>
              </Box>
            )}
          </Box>
        )}

        {/* 댓글 입력 섹션은 ScrollView 밖으로 이동함 */}
      </ScrollView>

      {/* 상단 이동 FAB 버튼 */}
      {showScrollTop && (
        <TouchableOpacity
          onPress={scrollToTop}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 100,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: modernTheme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 8,
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-up" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* 고정된 댓글 입력창 */}
      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: modernTheme.bg.card,
          borderTopWidth: 1,
          borderTopColor: modernTheme.bg.border,
          padding: 16,
          paddingBottom: Platform.OS === 'ios' ? 34 : 16,
          marginBottom: keyboardHeight,
        }}
      >
        {(() => {
          const shouldShowSimpleView = !isCommentInputFocused || !isAuthenticated;
          logger.log('🔍 [PostDetailScreen] 댓글창 렌더링 조건', {
            isCommentInputFocused,
            isAuthenticated,
            shouldShowSimpleView,
            viewType: shouldShowSimpleView ? '간단한 버튼' : '전체 입력창'
          });
          return shouldShowSimpleView;
        })() ? (
          /* 간단한 댓글 달기 버튼과 액션 버튼들 */
          <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            {/* 좌측: 좋아요와 댓글 카운트 */}
            <HStack style={{ alignItems: 'center', gap: 20 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={(!post && !loading) || (error && !post) ? undefined : handleLikePress}
                activeOpacity={(!post && !loading) || (error && !post) ? 1 : 0.7}
                disabled={(!post && !loading) || (error && !post)}
              >
                <MaterialCommunityIcons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={(!post && !loading) || (error && !post) ? '#9ca3af' : liked ? '#ef4444' : '#64748b'}
                />
                <RNText style={{
                  fontSize: FONT_SIZES.bodySmall,
                  fontWeight: '600',
                  color: (!post && !loading) || (error && !post) ? '#9ca3af' : liked ? '#ef4444' : '#64748b'
                }}>
                  {likeCount}
                </RNText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={() => {
                  if (isAuthenticated) {
                    setIsCommentInputFocused(true);
                    setTimeout(() => {
                      textInputRef.current?.focus();
                    }, 100);
                  }
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="comment-outline"
                  size={24}
                  color="#64748b"
                />
                <RNText style={{
                  fontSize: FONT_SIZES.bodySmall,
                  fontWeight: '600',
                  color: '#64748b'
                }}>
                  {comments.length}
                </RNText>
              </TouchableOpacity>
            </HStack>

            {/* 우측: 댓글 달기 버튼 - 모든 사용자에게 표시 */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: modernTheme.bg.secondary,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.08)',
              }}
              onPress={() => {
                logger.log('💬 [PostDetailScreen] 댓글 달기 버튼 클릭됨', {
                  isAuthenticated,
                  hasUser: !!user,
                  userId: user?.user_id
                });

                if (!isAuthenticated || !user) {
                  logger.log('❌ [PostDetailScreen] 비로그인 사용자 - 모달 표시');
                  setEmotionLoginPromptAction('comment');
                  setEmotionLoginPromptVisible(true);
                  return;
                }

                logger.log('✅ [PostDetailScreen] 로그인 사용자 - 댓글 입력창 열기');
                setIsCommentInputFocused(true);
                setTimeout(() => {
                  textInputRef.current?.focus();
                }, 100);
              }}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#6B7280" />
              <RNText style={{ marginLeft: 6, color: '#6B7280', fontSize: TYPOGRAPHY.caption, fontWeight: '500' }}>
                댓글 달기
              </RNText>
            </TouchableOpacity>
          </HStack>
        ) : (
          /* 전체 댓글 입력창 */
          <Box>
            {/* 답글 표시 */}
            {replyingTo && (
          <Box
            style={{
            backgroundColor: modernTheme.bg.secondary,
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#8B5CF6'
          }}>
            <HStack style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <RNText style={{ fontSize: TYPOGRAPHY.caption, color: '#6B7280', fontWeight: '600' }}>
                답글 작성 중
              </RNText>
              <TouchableOpacity onPress={() => {
                setReplyingTo(null);
                setIsCommentInputFocused(false);
                if (textInputRef.current) {
                  textInputRef.current.blur();
                }
              }}>
                <MaterialCommunityIcons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </HStack>
            <RNText style={{ fontSize: TYPOGRAPHY.caption, color: '#4B5563' }} numberOfLines={2}>
              @{replyingTo.is_anonymous ? '익명' : (replyingTo.user?.nickname || '사용자')}: {replyingTo.content}
            </RNText>
          </Box>
        )}

        {/* 익명 댓글 토글 */}
        <HStack style={{ alignItems: 'center', marginBottom: 12 }}>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            color="#8B5CF6"
          />
          <RNText style={{ marginLeft: 8, fontSize: TYPOGRAPHY.body, color: '#4B5563' }}>
            익명으로 댓글 작성
          </RNText>
        </HStack>

        {/* 댓글 입력 필드 */}
        <View style={{
          backgroundColor: modernTheme.bg.secondary,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        }}>
          <RNTextInput
            ref={textInputRef}
            placeholder={replyingTo ? "답글을 입력해주세요..." : "댓글을 입력해주세요..."}
            value={commentText}
            onChangeText={(text) => {
              console.log('✍️ 텍스트 입력:', text);
              setCommentText(text);
            }}
            onFocus={() => {
              console.log('🔒🔒🔒 [PostDetailScreen] TextInput onFocus 호출됨', {
                isAuthenticated,
                hasUser: !!user,
                userId: user?.user_id,
                isDark
              });

              if (!isAuthenticated || !user) {
                console.log('❌❌❌ [PostDetailScreen] 비로그인 사용자 차단! 모달 표시');
                textInputRef.current?.blur();
                setEmotionLoginPromptAction('comment');
                setEmotionLoginPromptVisible(true);
                return;
              }

              console.log('✅✅✅ [PostDetailScreen] 로그인 사용자 - 댓글 입력 허용');
              setIsCommentInputFocused(true);
            }}
            multiline={true}
            numberOfLines={4}
            autoCorrect={false}
            underlineColorAndroid="transparent"
            keyboardAppearance="dark"
            importantForAutofill="no"
            style={{
              fontSize: TYPOGRAPHY.body,
              padding: 12,
              minHeight: 80,
              textAlignVertical: 'top',
              color: '#FFFFFF',
              backgroundColor: 'transparent',
            }}
            placeholderTextColor="#9CA3AF"
            selectionColor="#6366F1"
          />
        </View>

        {/* 취소 및 작성 버튼 */}
        <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
          {/* 취소 버튼 */}
          <Pressable
            onPress={() => {
              console.log('🔙🔙🔙 [PostDetailScreen] 취소 버튼 클릭됨', {
                commentText: commentText,
                commentTextLength: commentText.length,
                trimmedLength: commentText.trim().length,
                isCommentInputFocused,
                hasReplyingTo: !!replyingTo
              });

              // 키보드를 먼저 닫습니다
              Keyboard.dismiss();

              // 내용이 없으면 바로 취소
              if (!commentText.trim()) {
                console.log('⚪ 빈 내용 - 바로 취소');
                setCommentText('');
                setReplyingTo(null);
                setIsAnonymous(false);
                setIsCommentInputFocused(false);
                textInputRef.current?.blur();
                return;
              }

              // 작성 중인 내용이 있으면 확인
              console.log('🟡 내용 있음 - Alert 표시');
              setTimeout(() => {
                showAlert.show(
                  '작성 취소',
                  '작성 중인 내용이 삭제됩니다. 취소하시겠습니까?',
                  [
                    {
                      text: '계속 작성',
                      style: 'cancel',
                      onPress: () => {
                        console.log('▶️ 계속 작성 선택');
                      }
                    },
                    {
                      text: '삭제',
                      style: 'destructive',
                      onPress: () => {
                        console.log('🗑️ 삭제 선택 - 취소 처리');
                        setCommentText('');
                        setReplyingTo(null);
                        setIsAnonymous(false);
                        setIsCommentInputFocused(false);
                        textInputRef.current?.blur();
                      }
                    }
                  ]
                );
              }, 100);
            }}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 12,
              backgroundColor: modernTheme.bg.secondary,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <RNText style={{
              fontSize: FONT_SIZES.bodySmall,
              fontWeight: '600',
              color: isDark ? '#9CA3AF' : '#6B7280'
            }}>
              취소
            </RNText>
          </Pressable>

          {/* 작성 버튼 */}
          <Pressable
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
            style={({ pressed }) => ({
              flex: 2,
              borderRadius: 12,
              backgroundColor: (!commentText.trim() || submitting) ? '#d1d5db' : '#6366F1',
              borderWidth: 1,
              borderColor: 'rgba(99, 102, 241, 0.2)',
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (!commentText.trim() || submitting) ? 0.5 : (pressed ? 0.7 : 1),
            })}
          >
            <RNText style={{
              fontSize: FONT_SIZES.bodySmall,
              fontWeight: '600',
              color: 'white'
            }}>
              {submitting ? '작성 중...' : (replyingTo ? '답글 작성' : '댓글 작성')}
            </RNText>
          </Pressable>
        </View>
        </Box>
        )}
      </Box>

      {/* 게시물 옵션 모달 - 로그인한 사용자만 표시 */}
      {isAuthenticated && (
        <PostOptionsModal
          visible={showActionSheet}
          isOwner={post != null && user != null && post.user_id === user.user_id}
          isAnonymous={post?.is_anonymous || false}
          onShare={handleShare}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReport={handleReport}
          onBlockPost={handleBlockPost}
          onBlockUser={handleBlockUser}
          onClose={() => setShowActionSheet(false)}
        />
      )}

      {/* 댓글 액션 시트 모달 - 로그인한 사용자만 표시 */}
      {isAuthenticated && showCommentActionSheet && selectedComment && (() => {
        const isMyComment = user && selectedComment.user_id === user.user_id;
        
        return (
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => setShowCommentActionSheet(false)}
          >
            <TouchableOpacity
              style={styles.actionSheetContainer}
              activeOpacity={1}
            >
              {isMyComment ? (
                <>
                  {/* 내 댓글 - 수정/삭제 옵션 */}
                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    onPress={() => handleEditComment(selectedComment)}
                  >
                    <MaterialCommunityIcons name="pencil" size={24} color="#10B981" />
                    <Text style={[styles.actionSheetText, { color: '#10B981' }]}>댓글 수정</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    onPress={() => handleDeleteComment(selectedComment)}
                  >
                    <MaterialCommunityIcons name="delete" size={24} color="#EF4444" />
                    <Text style={[styles.actionSheetText, { color: '#EF4444' }]}>댓글 삭제</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* 타인 댓글 - 차단 및 신고 옵션 */}
                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    onPress={() => handleBlockComment(selectedComment)}
                  >
                    <MaterialCommunityIcons name="cancel" size={24} color="#EF4444" />
                    <Text style={[styles.actionSheetText, { color: '#EF4444' }]}>댓글 차단</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    onPress={() => handleReportComment(selectedComment)}
                  >
                    <MaterialCommunityIcons name="flag" size={24} color="#F59E0B" />
                    <Text style={[styles.actionSheetText, { color: '#F59E0B' }]}>댓글 신고</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* 취소 */}
              <TouchableOpacity
                style={[styles.actionSheetItem, styles.actionSheetCancel]}
                onPress={() => setShowCommentActionSheet(false)}
              >
                <Text style={[styles.actionSheetText, { color: '#6B7280' }]}>취소</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })()}

    </View>
      <ConfirmationModal
        visible={showDeleteModal}
        title="게시물 삭제"
        message="정말로 이 게시물을 삭제하시겠습니까? 삭제된 게시물은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <BlockReasonModal
        visible={blockModalVisible}
        onClose={() => {
          setBlockModalVisible(false);
          setBlockTarget(null);
        }}
        onBlock={handleBlockConfirm}
        targetName={
          blockTarget?.type === 'post' ? '이 게시물' :
          blockTarget?.type === 'user' ? blockTarget.data.user?.nickname || '이 사용자' :
          '이 댓글'
        }
    />
<ReportModal />

        {alertConfig && (
          <CustomAlert
            visible={alertConfig.visible}
            type={alertConfig.type}
            title={alertConfig.title}
            message={alertConfig.message}
            onConfirm={() => setAlertConfig(null)}
          />
        )}

        {/* 감정 중심 로그인 프롬프트 모달 */}
        <EmotionLoginPromptModal
          visible={emotionLoginPromptVisible}
          onClose={() => setEmotionLoginPromptVisible(false)}
          onLogin={() => {
            logger.log('🔐 [PostDetailScreen] 로그인 버튼 클릭됨');
            setEmotionLoginPromptVisible(false);
            setTimeout(() => {
              try {
                logger.log('🔐 [PostDetailScreen] Auth/Login 화면으로 이동 시도');
                (navigation as any).navigate('Auth', { screen: 'Login' });
                logger.log('✅ [PostDetailScreen] 네비게이션 성공');
              } catch (error) {
                logger.log('❌ [PostDetailScreen] 네비게이션 오류:', error);
              }
            }, 100);
          }}
          onRegister={() => {
            logger.log('📝 [PostDetailScreen] 회원가입 버튼 클릭됨');
            setEmotionLoginPromptVisible(false);
            setTimeout(() => {
              try {
                logger.log('📝 [PostDetailScreen] Auth/Register 화면으로 이동 시도');
                (navigation as any).navigate('Auth', { screen: 'Register' });
                logger.log('✅ [PostDetailScreen] 네비게이션 성공');
              } catch (error) {
                logger.log('❌ [PostDetailScreen] 네비게이션 오류:', error);
              }
            }, 100);
          }}
          actionType={emotionLoginPromptAction}
        />
      </>

  );
};

const getWindowHeight = () => {
  try {
    const h = Dimensions.get('window').height;
    if (h > 0) return h;
  } catch (e) {}
  return 780;
};

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  actionSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  actionSheetContainer: {
    backgroundColor: theme.bg.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: theme.bg.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    minHeight: 200,
    shadowColor: isDark ? '#fff' : '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: isDark ? 0.1 : 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  centerModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  centerModalContainer: {
    backgroundColor: theme.bg.card,
    borderRadius: 16,
    marginHorizontal: 40,
    paddingVertical: 16,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: isDark ? '#fff' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.1 : 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  actionSheetCancel: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
    justifyContent: 'center',
  },
  actionSheetText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: FONT_SIZES.h4,
    fontWeight: '600',
    color: theme.text.primary,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  modalItemText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    flex: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 20,
  },
highlightedComment: {
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.25)' : '#FEF3C7',
      borderWidth: 2,
      borderColor: '#F59E0B',
      borderRadius: 8,
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    // 신고 모달 스타일
    reportModal: {
      backgroundColor: theme.bg.card,
      marginHorizontal: 20,
      marginVertical: 40,
      borderRadius: 28,
      padding: 0,
      maxHeight: '88%',
      shadowColor: isDark ? '#fff' : '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.15 : 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    reportModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 32,
      paddingHorizontal: 24,
      paddingBottom: 16,
      gap: 14,
    },
    reportModalTitle: {
      fontSize: TYPOGRAPHY.h2,
      fontWeight: '700',
      color: isDark ? '#FAFAFA' : theme.text.primary,
      letterSpacing: -0.6,
    },
    reportModalSubtitle: {
      fontSize: FONT_SIZES.body,
      color: isDark ? '#D1D1D6' : theme.text.secondary,
      textAlign: 'center',
      marginBottom: 22,
      paddingHorizontal: 24,
      lineHeight: 22,
    },
    reportReasonsContainer: {
      width: '100%',
      maxHeight: 420,
      paddingHorizontal: 22,
    },
    reportReasonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bg.secondary,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 18,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    reportReasonItemSelected: {
      borderColor: '#FFD60A',
      backgroundColor: isDark ? 'rgba(255, 214, 10, 0.18)' : 'rgba(255, 214, 10, 0.1)',
    },
    reportReasonIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.bg.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    reportReasonContent: {
      flex: 1,
    },
    reportReasonLabel: {
      fontSize: FONT_SIZES.bodyLarge,
      fontWeight: '600',
      color: isDark ? '#E8E8E8' : theme.text.primary,
      marginBottom: 5,
      letterSpacing: -0.3,
    },
    reportReasonLabelSelected: {
      color: '#FFD60A',
      fontWeight: '700',
    },
    reportReasonDescription: {
      fontSize: TYPOGRAPHY.body,
      color: isDark ? '#D1D1D6' : theme.text.secondary,
      lineHeight: 19,
    },
    reportDetailsContainer: {
      marginTop: 10,
      marginBottom: 14,
    },
    reportDetailsInput: {
      backgroundColor: theme.bg.card,
      fontSize: FONT_SIZES.body,
    },
    reportDetailsCounter: {
      fontSize: TYPOGRAPHY.body,
      color: isDark ? '#D1D1D6' : theme.text.secondary,
      textAlign: 'right',
      marginTop: 8,
      marginRight: 6,
    },
    reportModalButtons: {
      flexDirection: 'row',
      gap: 14,
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 28,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    reportCancelButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: theme.bg.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reportCancelButtonText: {
      fontSize: FONT_SIZES.bodyLarge,
      fontWeight: '600',
      color: isDark ? '#E8E8E8' : theme.text.primary,
      letterSpacing: -0.3,
    },
    reportSubmitButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: '#FFD60A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    reportSubmitButtonDisabled: {
      backgroundColor: theme.bg.tertiary,
      opacity: 0.5,
    },
    reportSubmitButtonText: {
      fontSize: FONT_SIZES.bodyLarge,
      fontWeight: '700',
      color: '#1C1C1E',
      letterSpacing: -0.3,
    },
    reportSubmitButtonTextDisabled: {
      color: isDark ? '#E8E8E8' : '#1C1C1E',
    },
  });

export default PostDetailScreen;