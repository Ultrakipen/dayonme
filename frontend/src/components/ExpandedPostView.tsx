// src/components/ExpandedPostView.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  InteractionManager
} from 'react-native';
import { Card, ActivityIndicator } from 'react-native-paper';
import { Text, Box, HStack, VStack } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCommentTime } from '../utils/dateUtils';
import { normalizeImageUrl } from '../utils/imageUtils';
import { removeCommentId } from '../utils/commentUtils';

// 숫자 포맷팅 함수 (쉼표 제거 - 더 강력한 버전)
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  // 먼저 숫자로 변환한 후 다시 문자열로 변환하여 모든 포맷팅 제거
  const cleanNumber = parseInt(String(num).replace(/[^0-9]/g, ''));
  return isNaN(cleanNumber) ? '0' : String(cleanNumber);
};

// 감정 아이콘 시스템 (익명 사용자용)
const anonymousEmotions = [
  { label: '기쁨이', icon: 'emoticon-happy', color: '#FFD700' },
  { label: '행복이', icon: 'emoticon-excited', color: '#FFA500' },
  { label: '슬픔이', icon: 'emoticon-sad', color: '#4682B4' },
  { label: '우울이', icon: 'emoticon-neutral', color: '#708090' },
  { label: '지루미', icon: 'emoticon-dead', color: '#A9A9A9' },
  { label: '버럭이', icon: 'emoticon-angry', color: '#FF4500' },
  { label: '불안이', icon: 'emoticon-confused', color: '#DDA0DD' },
  { label: '걱정이', icon: 'emoticon-frown', color: '#FFA07A' },
  { label: '감동이', icon: 'heart', color: '#FF6347' },
  { label: '황당이', icon: 'emoticon-wink', color: '#20B2AA' },
  { label: '당황이', icon: 'emoticon-tongue', color: '#FF8C00' },
  { label: '짜증이', icon: 'emoticon-devil', color: '#DC143C' },
  { label: '무섭이', icon: 'emoticon-cry', color: '#9370DB' },
  { label: '추억이', icon: 'emoticon-cool', color: '#87CEEB' },
  { label: '설렘이', icon: 'heart-multiple', color: '#FF69B4' },
  { label: '편안이', icon: 'emoticon-kiss', color: '#98FB98' },
  { label: '궁금이', icon: 'emoticon-outline', color: '#DAA520' },
  { label: '사랑이', icon: 'heart', color: '#E91E63' },
  { label: '아픔이', icon: 'medical-bag', color: '#8B4513' },
  { label: '욕심이', icon: 'currency-usd', color: '#32CD32' }
];

// 일반 사용자를 위한 감정 아이콘 (닉네임 앞에 표시)
const getUserEmotionIcon = (userId: number) => {
  const index = userId % anonymousEmotions.length;
  return anonymousEmotions[index];
};

// 익명 사용자를 위한 감정 할당 (중복시 번호 추가) - ComfortScreen과 일관성 유지
const getAnonymousEmotion = (userId?: number, commentId?: number, allComments: Comment[] = [], postId?: number) => {
  // ComfortScreen의 getRandomEmotion과 동일한 로직 사용
  const seed = userId && postId ? (postId + userId * 13) : (userId || commentId || 1);
  const baseEmotion = anonymousEmotions[Math.abs(seed) % anonymousEmotions.length];
  
  if (__DEV__) console.log('🎯 익명 감정 할당 (일관성):', { userId, commentId, postId, seed, baseEmotion: baseEmotion.label });
  
  // 같은 감정을 사용하는 익명 사용자들 찾기
  const sameEmotionUsers = allComments.filter(comment => {
    if (!comment.is_anonymous || !comment.user_id || comment.user_id === userId) return false;
    const otherSeed = comment.user_id && postId ? (postId + comment.user_id * 13) : (comment.user_id || comment.comment_id || 1);
    const otherEmotionIndex = Math.abs(otherSeed) % anonymousEmotions.length;
    return otherEmotionIndex === (Math.abs(seed) % anonymousEmotions.length);
  });
  
  // 현재 사용자의 번호 결정 (ID 순서 기반)
  if (sameEmotionUsers.length > 0) {
    const uniqueUserIds = [...new Set(sameEmotionUsers.map(c => c.user_id))];
    uniqueUserIds.sort((a, b) => (a || 0) - (b || 0));
    const userIndex = uniqueUserIds.findIndex(id => id === userId);
    
    if (userIndex >= 0 && uniqueUserIds.length > 1) {
      return {
        ...baseEmotion,
        label: `${baseEmotion.label}${userIndex + 1}` // 기쁨이1, 기쁨이2...
      };
    }
  }
  
  return baseEmotion;
};

// 계층적 댓글 구조 생성
const buildCommentTree = (comments: Comment[]) => {
  const commentMap = new Map();
  const rootComments: Comment[] = [];
  
  // 모든 댓글을 맵에 저장하고 replies 배열 초기화
  comments.forEach(comment => {
    commentMap.set(comment.comment_id, { ...comment, replies: [] });
  });
  
  // 부모-자식 관계 설정
  comments.forEach(comment => {
    if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
      // 답글인 경우
      commentMap.get(comment.parent_comment_id).replies.push(commentMap.get(comment.comment_id));
    } else {
      // 최상위 댓글인 경우
      rootComments.push(commentMap.get(comment.comment_id));
    }
  });
  
  return rootComments;
};

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
  };
  replies?: Comment[];
}

interface Post {
  post_id: number;
  title?: string;
  content: string;
  user_id: number;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  images?: string[];
  image_url?: string;
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
  comments?: Comment[];
}

// FlatList 아이템 타입 정의
interface FlatListItem {
  id: string;
  type: 'post' | 'comments-header' | 'best-comments' | 'comment' | 'load-more';
  data: Post | { commentsCount: number } | Comment[] | Comment | { remainingCount: number };
}

interface ExpandedPostViewProps {
  post: Post;
  onCollapse: () => void;
  onLike?: (postId: number) => void;
  onCommentSubmit?: (postId: number, content: string, isAnonymous: boolean, parentCommentId?: number) => void;
  onCommentLike?: (commentId: number) => void;
  liked?: boolean;
  currentUserId?: number;
}

const ExpandedPostView: React.FC<ExpandedPostViewProps> = ({
  post,
  onCollapse,
  onLike,
  onCommentSubmit,
  onCommentLike,
  liked = false,
  currentUserId
}) => {
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [displayedComments, setDisplayedComments] = useState<Comment[]>([]);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [collapsedReplies, setCollapsedReplies] = useState<Set<number>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  const [hideInputForScroll, setHideInputForScroll] = useState(false); // 스크롤을 위해 입력창 숨기기
  const [commentPositions, setCommentPositions] = useState<{[key: number]: number}>({});
  const textInputRef = useRef<any>(null);
  const commentRefs = useRef<{[key: number]: any}>({});
  const scrollViewRef = useRef<any>(null);
  const flatListRef = useRef<any>(null);
  
  const COMMENTS_PER_PAGE = 10;

  // 댓글 트리 구조 생성 (답글을 부모 댓글 아래에 표시)
  const commentTree = buildCommentTree(post.comments || []);
  
  // 디버깅용 로그 추가
  React.useEffect(() => {
    if (__DEV__) console.log('🚀 ExpandedPostView 마운트/업데이트:', {
      postId: post.post_id,
      commentsReceived: post.comments?.length || 0,
      commentTreeLength: commentTree.length,
      firstComment: post.comments?.[0]

    });
  }, [post.comments?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // 베스트 댓글 시스템 - TOP 3
  const BEST_COMMENT_THRESHOLD = 1; // 좋아요 1개 이상이면 베스트 댓글 후보
  
  // 전체 댓글을 시간순으로 정렬 (최신 댓글이 위로)
  const allSortedComments = commentTree.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // 베스트 댓글 선정: 좋아요가 많은 순으로 TOP 3
  const bestComments = allSortedComments
    .filter(comment => !comment.parent_comment_id) // 답글 제외, 원댓글만
    .filter(comment => (comment.like_count || 0) >= BEST_COMMENT_THRESHOLD)
    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
    .slice(0, 3); // 베스트 댓글 TOP 3
  
  if (__DEV__) console.log('🏆 베스트 댓글 TOP 3 선정:', {
    전체댓글수: allSortedComments.length,
    베스트댓글수: bestComments.length,
    베스트댓글: bestComments.map((c, index) => ({ 
      순위: index + 1, 
      id: c.comment_id, 
      좋아요: c.like_count,
      내용: c.content.substring(0, 20) + '...' 
    }))
  });

  // 초기 댓글 로드 (의존성 배열에 allSortedComments 추가)
  React.useEffect(() => {
    const initialComments = allSortedComments.slice(0, COMMENTS_PER_PAGE);
    setDisplayedComments(initialComments);
    setHasMoreComments(allSortedComments.length > COMMENTS_PER_PAGE);
  }, [allSortedComments.length]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // 베스트 댓글 클릭 시 해당 원댓글을 하이라이트하고 상단으로 이동
  const scrollToBestComment = (commentId: number, rank: number) => {
    if (__DEV__) console.log(`🚀🚀🚀 ${rank}위 베스트댓글 클릭!`, commentId);
    
    // 1. 하이라이트 활성화
    setHighlightedCommentId(commentId);
    if (__DEV__) console.log('🎯 원댓글 하이라이트 활성화:', commentId);
    
    // 2. 해당 댓글을 맨 앞으로 이동한 새로운 배열 생성
    const targetComment = allSortedComments.find(c => c.comment_id === commentId);
    if (!targetComment) {
      if (__DEV__) console.log('❌ 댓글을 찾을 수 없음:', commentId);
      return;
    }
    
    // 타겟 댓글을 제외한 나머지 댓글들
    const otherComments = allSortedComments.filter(c => c.comment_id !== commentId);
    
    // 타겟 댓글을 맨 앞에 배치한 새로운 배열
    const reorderedComments = [targetComment, ...otherComments];
    
    if (__DEV__) console.log('📋 댓글 순서 재배열:', {
      순위: rank,
      원래순서: allSortedComments.map(c => c.comment_id),
      새순서: reorderedComments.map(c => c.comment_id),
      타겟댓글: commentId
    });
    
    // 3. 재배열된 댓글로 상태 업데이트
    setDisplayedComments(reorderedComments);
    setHasMoreComments(false);
    
    // 4. 댓글 섹션으로 스크롤 (베스트 댓글 섹션 이후)
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ 
        offset: 700, // 게시물 + 베스트댓글 섹션을 지나 일반 댓글 섹션으로
        animated: true 
      });
      if (__DEV__) console.log(`✅ ${rank}위 댓글 상단으로 이동 완료`);
    }, 200);
    
    // 5. 15초 후 하이라이트 해제 & 원래 순서로 복원
    setTimeout(() => {
      setHighlightedCommentId(null);
      setDisplayedComments(allSortedComments); // 원래 순서로 복원
      if (__DEV__) console.log(`🔄 ${rank}위 댓글 하이라이트 해제 & 원래 순서 복원:`, commentId);
    }, 15000);
  };
  

  // 베스트 댓글 미리보기 렌더링 (간단한 형태)
  const renderBestCommentPreview = (comment: Comment) => {
    const isPostAuthor = post.user_id === comment.user_id;
    const isAuthor = currentUserId === comment.user_id;
    
    // 익명 사용자 처리
    let displayName = comment.user?.nickname || '탈퇴한 사용자';
    let emotionIcon = 'account-circle';
    let avatarColor = '#9ca3af';
    
    if (comment.is_anonymous) {
      const emotion = getAnonymousEmotion(comment.user_id, comment.comment_id, post.comments || [], post.post_id);
      displayName = emotion.label;
      emotionIcon = emotion.icon;
      avatarColor = emotion.color;
    } else if (!comment.is_anonymous && comment.user_id) {
      const emotion = getUserEmotionIcon(comment.user_id);
      emotionIcon = emotion.icon;
      avatarColor = emotion.color;
    }

    return (
      <Box style={styles.bestCommentSimple}>
        <Text style={styles.bestCommentContent} numberOfLines={1}>
          {removeCommentId(comment.content)}
        </Text>
      </Box>
    );
  };

  // 답글 접기/펼치기 토글
  const toggleReplies = (commentId: number) => {
    setCollapsedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // 댓글 좋아요 토글
  const handleCommentLike = (commentId: number) => {
    const isLiked = likedComments.has(commentId);
    
    if (__DEV__) console.log('❤️ 좋아요 클릭:', { 
      commentId, 
      currentState: isLiked ? 'liked' : 'not liked',
      newState: isLiked ? 'will unlike' : 'will like' 
    });
    
    // 로컬 상태 업데이트
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
    
    // 부모 컴포넌트의 좋아요 핸들러 호출 (백엔드 업데이트)
    onCommentLike?.(commentId);
  };

  // 더 많은 댓글 로드
  const loadMoreComments = () => {
    if (loadingMore || !hasMoreComments) return;
    
    setLoadingMore(true);
    setTimeout(() => {
      const currentLength = displayedComments.length;
      const nextComments = allSortedComments.slice(currentLength, currentLength + COMMENTS_PER_PAGE);
      
      setDisplayedComments(prev => [...prev, ...nextComments]);
      setHasMoreComments(currentLength + nextComments.length < allSortedComments.length);
      setLoadingMore(false);
    }, 500); // 로딩 효과를 위한 짧은 딜레이
  };

  // 댓글 제출 처리
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      Alert.alert('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await onCommentSubmit?.(
        post.post_id, 
        commentText.trim(), 
        isAnonymous,
        replyingTo?.comment_id
      );
      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
      if (__DEV__) console.error('댓글 작성 오류:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 답글 시작
  const handleReplyPress = (comment: Comment) => {
    setReplyingTo(comment);
    const displayName = comment.is_anonymous ? '익명' : (comment.user?.nickname || '사용자');
    setCommentText(`@${displayName} `);
    // 답글 작성 시 익명 상태 초기화 (사용자가 선택할 수 있도록)
    setIsAnonymous(false);
    // 인라인 입력창이 렌더링된 후 자동 포커스 (autoFocus 속성으로 처리됨)
  };

  // 댓글 렌더링 (한 섹션으로 통합)
  const renderComment = (comment: Comment, isReply: boolean = false, isBest: boolean = false) => {
    const isHighlighted = highlightedCommentId === comment.comment_id;
    
    if (isHighlighted) {
      if (__DEV__) console.log('🎆🎆🎆 댓글 렌더링 시 하이라이트 확인:', {
        commentId: comment.comment_id,
        isReply,
        isBest,
        isHighlighted,
        highlightedCommentId
      });
    }
    
    const isAuthor = currentUserId === comment.user_id;
    const isPostAuthor = post.user_id === comment.user_id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isCollapsed = collapsedReplies.has(comment.comment_id);
    
    // 감정 시스템 적용
    let displayName, avatarText, avatarColor, emotionIcon;
    
    if (__DEV__) console.log('🎭 댓글 렌더링:', {
      comment_id: comment.comment_id,
      is_anonymous: comment.is_anonymous,
      comment_user_id: comment.user_id,
      post_user_id: post.user_id,
      nickname: comment.user?.nickname,
      like_count: comment.like_count,
      isReply: isReply,
      isPostAuthor: isPostAuthor,
      currentUserId: currentUserId
    });
    
    if (comment.is_anonymous) {
      // 익명 사용자: 감정 단어로 표시 (WriteMyDayScreen 스타일)
      const emotion = getAnonymousEmotion(comment.user_id, comment.comment_id, post.comments || [], post.post_id);
      displayName = isPostAuthor ? '글쓴이' : emotion.label;
      
      // WriteMyDayScreen처럼 이모지 아바타 사용
      const emotionMappings: { [key: string]: string } = {
        '기쁨이': '😊',
        '행복이': '😄',
        '슬픔이': '😢',
        '우울이': '😞',
        '지루미': '😑',
        '버럭이': '😠',
        '불안이': '😰',
        '걱정이': '😟',
        '감동이': '🥺',
        '황당이': '🤨',
        '당황이': '😲',
        '짜증이': '😤',
        '무섭이': '😨',
        '추억이': '🥹',
        '설렘이': '🤗',
        '편안이': '😌',
        '궁금이': '🤔',
        '사랑이': '❤️',
        '아픔이': '🤕',
        '욕심이': '🤑',
      };
      
      avatarText = isPostAuthor ? '글' : (emotionMappings[emotion.label.replace(/\d+$/, '')] || '😊');
      avatarColor = isPostAuthor ? '#f59e0b' : emotion.color;
      emotionIcon = isPostAuthor ? 'account-edit' : emotion.icon;
      if (__DEV__) console.log('🎭 익명 사용자:', { emotion, displayName, avatarText, isPostAuthor });
    } else {
      // 일반 사용자: 닉네임 + 감정 아이콘
      const userEmotion = getUserEmotionIcon(comment.user_id || 1);
      displayName = isPostAuthor ? '글쓴이' : (comment.user?.nickname || '사용자');
      avatarText = isPostAuthor ? '글' : (displayName[0] || 'U');
      avatarColor = isPostAuthor ? '#f59e0b' : (isAuthor ? '#059669' : '#6366f1');
      emotionIcon = isPostAuthor ? 'account-edit' : userEmotion.icon;
      if (__DEV__) console.log('🎭 일반 사용자:', { displayName, emotionIcon: userEmotion.label, isPostAuthor });
    }
    

    if (!isReply) {
      // 최상위 댓글 (섹션 단위로 렌더링)
      return (
        <Box key={comment.comment_id}
          style={[
            styles.commentSection, 
            isBest && styles.bestCommentSection,
            // 원 댓글에서 하이라이트 적용 - 강력한 시각적 아웃라인
            isHighlighted && {
              borderWidth: 15,
              borderColor: '#6200ee',
              backgroundColor: '#f3e8ff',
              shadowColor: '#6200ee',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 1.0,
              shadowRadius: 30,
              elevation: 30,
              transform: [{ scale: 1.12 }],
              marginVertical: 30,
              marginHorizontal: -10,
              borderRadius: 20,
              zIndex: 1000,
              // 추가 강조 효과
              borderStyle: 'solid',
              position: 'relative',
            }
          ]}
          onLayout={(event) => {
            if (!isReply) { // 답글이 아닌 모든 원 댓글
              const { y, height } = event.nativeEvent.layout;
              setCommentPositions(prev => ({
                ...prev,
                [comment.comment_id]: y
              }));
              
              if (__DEV__) console.log('📐 원 댓글 레이아웃 업데이트:', {
                commentId: comment.comment_id,
                y,
                height,
                isHighlighted: highlightedCommentId === comment.comment_id,
                isBest
              });
              
              if (isHighlighted) {
                if (__DEV__) console.log('🎆🎆🎆 원 댓글 하이라이트 적용 확인!:', {
                  commentId: comment.comment_id,
                  y,
                  height,
                  timestamp: new Date().toLocaleTimeString(),
                  하이라이트상태: '원댓글에 적용됨',
                  isBest: false
                });
              }
            }
          }}>
          {/* 베스트 댓글 표시 */}
          {isBest && (
            <Box style={styles.bestCommentBadge}>
              <MaterialCommunityIcons name="crown" size={16} color="#fbbf24" />
              <Text style={styles.bestCommentBadgeText}>베스트</Text>
            </Box>
          )}
          
          {/* 원 댓글 */}
          <Box style={styles.commentItem}>
            {/* 댓글 아바타 */}
            {comment.user?.profile_image_url && !comment.is_anonymous ? (
              <Image 
                source={{ uri: normalizeImageUrl(comment.user.profile_image_url) }}
                style={styles.commentAvatar}
              />
            ) : (
              <Box style={[
                styles.commentAvatar, 
                { backgroundColor: avatarColor },
                comment.is_anonymous && styles.emotionAvatar
              ]}>
                <Text style={[
                  styles.commentAvatarText,
                  comment.is_anonymous && styles.emotionAvatarText
                ]}>
                  {avatarText}
                </Text>
              </Box>
            )}
            
            {/* 댓글 메인 컨텐츠 */}
            <VStack style={styles.commentMainContent}>
              {/* 첫 번째 줄: 기본 정보 + 액션 버튼들 */}
              <HStack style={styles.commentInfoRow}>
                {/* 왼쪽: 기본 정보 */}
                <HStack style={styles.commentBasicInfo}>
                  <Box style={styles.authorContainer}>
                    <MaterialCommunityIcons 
                      name={emotionIcon} 
                      size={16} 
                      color={avatarColor} 
                      style={styles.emotionIconStyle}
                    />
                    <Text style={[
                      styles.commentAuthor,
                      isPostAuthor && styles.postAuthorName,
                      comment.is_anonymous && !isPostAuthor && styles.emotionName
                    ]}>
                      {displayName}
                    </Text>
                  </Box>
                  
                  {/* 배지들 */}
                  {isPostAuthor && (
                    <Box style={styles.postAuthorBadge}>
                      <Text style={styles.postAuthorBadgeText}>글쓴이</Text>
                    </Box>
                  )}
                  {isAuthor && !isPostAuthor && (
                    <Box style={styles.currentUserBadge}>
                      <Text style={styles.currentUserBadgeText}>나</Text>
                    </Box>
                  )}
                  
                  <Text style={styles.commentTime}>• {formatCommentTime(comment.created_at)}</Text>
                </HStack>

                {/* 오른쪽: 액션 버튼들 */}
                <HStack style={styles.commentActionsInline}>
                  <TouchableOpacity 
                    onPress={() => handleReplyPress(comment)}
                    style={styles.inlineActionButton}
                  >
                    <Text style={styles.inlineActionText}>답글</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => handleCommentLike(comment.comment_id)}
                    style={styles.inlineActionButton}
                  >
                    <HStack style={styles.commentLikeContainer}>
                      <MaterialCommunityIcons 
                        name={likedComments.has(comment.comment_id) ? "heart" : "heart-outline"} 
                        size={14} 
                        color={likedComments.has(comment.comment_id) ? "#ef4444" : "#6b7280"} 
                      />
                      {comment.like_count > 0 && (
                        <Text style={[
                          styles.inlineActionText,
                          likedComments.has(comment.comment_id) && styles.likedButtonText
                        ]}>
                          {formatNumber(comment.like_count)}
                        </Text>
                      )}
                    </HStack>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.inlineActionButton}>
                    <Text style={[styles.inlineActionText, styles.reportButtonText]}>신고</Text>
                  </TouchableOpacity>
                  
                  {/* 답글 토글 */}
                  {hasReplies && (
                    <TouchableOpacity 
                      onPress={() => toggleReplies(comment.comment_id)}
                      style={styles.replyToggleButton}
                    >
                      <MaterialCommunityIcons 
                        name={isCollapsed ? "chevron-down" : "chevron-up"} 
                        size={16} 
                        color="#6366f1" 
                      />
                      <Text style={styles.replyToggleText}>
                        답글 {`${comment.replies?.length || 0}`}개 {isCollapsed ? '보기' : '숨기기'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </HStack>
              </HStack>
              
              {/* 댓글 내용 */}
              <Text style={styles.commentContent}>{removeCommentId(comment.content)}</Text>
            </VStack>
          </Box>

          {/* 인라인 답글 입력창 */}
          {replyingTo?.comment_id === comment.comment_id && (
            <Box style={styles.inlineReplyContainer}>
              <HStack style={styles.inlineReplyInputRow}>
                <TextInput
                  ref={textInputRef}
                  style={styles.inlineReplyInput}
                  placeholder={`답글 작성하기...`}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={200}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleCommentSubmit}
                  style={[
                    styles.inlineReplySendButton,
                    !commentText.trim() && styles.inlineReplySendButtonDisabled
                  ]}
                  disabled={submitting || !commentText.trim()}
                >
                  <MaterialCommunityIcons 
                    name="send" 
                    size={16} 
                    color={!commentText.trim() ? '#9ca3af' : '#ffffff'} 
                  />
                </TouchableOpacity>
              </HStack>
              <HStack style={styles.inlineReplyOptions}>
                <TouchableOpacity
                  onPress={() => setIsAnonymous(!isAnonymous)}
                  style={[
                    styles.inlineAnonymousToggle,
                    isAnonymous && styles.inlineAnonymousToggleActive
                  ]}
                >
                  <MaterialCommunityIcons 
                    name={isAnonymous ? "incognito" : "incognito-off"} 
                    size={14} 
                    color={isAnonymous ? "#ffffff" : "#6b7280"} 
                  />
                  <Text style={[
                    styles.inlineAnonymousText,
                    isAnonymous && styles.inlineAnonymousTextActive
                  ]}>
                    익명
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setReplyingTo(null);
                    setCommentText('');
                  }}
                  style={styles.inlineCancelButton}
                >
                  <Text style={styles.inlineCancelText}>취소</Text>
                </TouchableOpacity>
                <Text style={styles.inlineCharacterCount}>{commentText.length}/200</Text>
              </HStack>
            </Box>
          )}

          {/* 답글들 */}
          {hasReplies && !isCollapsed && (
            <Box style={styles.repliesContainer}>
              {comment.replies
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map(reply => renderComment(reply, true))}
            </Box>
          )}
        </Box>
      );
    } else {
      // 답글
      return (
        <Box key={comment.comment_id} style={[
          styles.replyItem,
          isHighlighted && {
            borderWidth: 12,
            borderColor: '#6200ee',
            backgroundColor: '#f3e8ff',
            shadowColor: '#6200ee',
            shadowOffset: { width: 0, height: 15 },
            shadowOpacity: 1.0,
            shadowRadius: 25,
            elevation: 25,
            transform: [{ scale: 1.08 }],
            marginVertical: 20,
            marginHorizontal: -5,
            borderRadius: 18,
            zIndex: 1000,
            borderStyle: 'solid',
            position: 'relative',
          }
        ]}
        onLayout={(event) => {
          if (isHighlighted) {
            if (__DEV__) console.log('🎨 하이라이트된 답글 렌더링:', {
              commentId: comment.comment_id,
              y: event.nativeEvent.layout.y,
              isReply: true,
              timestamp: new Date().toLocaleTimeString()
            });
          }
        }}>
          {/* 답글 아바타 */}
          {comment.user?.profile_image_url && !comment.is_anonymous ? (
            <Image 
              source={{ uri: normalizeImageUrl(comment.user.profile_image_url) }}
              style={styles.replyAvatar}
            />
          ) : (
            <Box style={[
              styles.replyAvatar, 
              { backgroundColor: avatarColor },
              comment.is_anonymous && styles.emotionAvatar
            ]}>
              <Text style={[
                styles.replyAvatarText,
                comment.is_anonymous && styles.emotionAvatarText
              ]}>
                {avatarText}
              </Text>
            </Box>
          )}
          
          {/* 답글 메인 컨텐츠 */}
          <VStack style={styles.replyMainContent}>
            {/* 답글 대상 표시 */}
            {comment.parent_comment_id && (
              <Box style={styles.replyTarget}>
                <MaterialCommunityIcons name="reply" size={12} color="#8b5cf6" />
                <Text style={styles.replyTargetText}>
                  {(() => {
                    const parentComment = post.comments?.find(c => c.comment_id === comment.parent_comment_id);
                    if (parentComment) {
                      const parentName = parentComment.is_anonymous ? '익명' : (parentComment.user?.nickname || '사용자');
                      return `${parentName}님에게 답글`;
                    }
                    return '답글';
                  })()}
                </Text>
              </Box>
            )}
            
            {/* 첫 번째 줄: 기본 정보 + 액션 버튼들 */}
            <HStack style={styles.commentInfoRow}>
              {/* 왼쪽: 기본 정보 */}
              <HStack style={styles.commentBasicInfo}>
                <Box style={styles.authorContainer}>
                  <MaterialCommunityIcons 
                    name={emotionIcon} 
                    size={16} 
                    color={avatarColor} 
                    style={styles.emotionIconStyle}
                  />
                  <Text style={[
                    styles.commentAuthor,
                    isPostAuthor && styles.postAuthorName,
                    comment.is_anonymous && !isPostAuthor && styles.emotionName
                  ]}>
                    {displayName}
                  </Text>
                </Box>
                
                {/* 배지들 */}
                {isPostAuthor && (
                  <Box style={styles.postAuthorBadge}>
                    <Text style={styles.postAuthorBadgeText}>글쓴이</Text>
                  </Box>
                )}
                {isAuthor && !isPostAuthor && (
                  <Box style={styles.currentUserBadge}>
                    <Text style={styles.currentUserBadgeText}>나</Text>
                  </Box>
                )}
                
                <Text style={styles.commentTime}>• {formatCommentTime(comment.created_at)}</Text>
              </HStack>

              {/* 오른쪽: 액션 버튼들 */}
              <HStack style={styles.commentActionsInline}>
                <TouchableOpacity 
                  onPress={() => handleReplyPress(comment)}
                  style={styles.inlineActionButton}
                >
                  <Text style={styles.inlineActionText}>답글</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => handleCommentLike(comment.comment_id)}
                  style={styles.inlineActionButton}
                >
                  <HStack style={styles.commentLikeContainer}>
                    <MaterialCommunityIcons 
                      name={likedComments.has(comment.comment_id) ? "heart" : "heart-outline"} 
                      size={14} 
                      color={likedComments.has(comment.comment_id) ? "#ef4444" : "#6b7280"} 
                    />
                    {comment.like_count > 0 && (
                      <Text style={[
                        styles.inlineActionText,
                        likedComments.has(comment.comment_id) && styles.likedButtonText
                      ]}>
                        {formatNumber(comment.like_count)}
                      </Text>
                    )}
                  </HStack>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.inlineActionButton}>
                  <Text style={[styles.inlineActionText, styles.reportButtonText]}>신고</Text>
                </TouchableOpacity>
              </HStack>
            </HStack>
            
            {/* 답글 내용 (@멘션 제거) */}
            <Text style={styles.commentContent}>
              {removeCommentId(comment.content.replace(/^@[^\s]+\s*/, ''))}
            </Text>
          </VStack>
        </Box>
      );
    }
  };

  // 작성자 정보
  let displayName, avatarText, avatarColor, emotionIcon;
  if (post.is_anonymous) {
    const emotion = getAnonymousEmotion(post.user_id, post.post_id, post.comments || [], post.post_id);
    displayName = emotion.label;
    emotionIcon = emotion.icon;
    
    // 감정에 맞는 이모지 매핑
    const emotionMappings: { [key: string]: string } = {
      '기쁨이': '😊', '행복이': '😄', '슬픔이': '😢', '우울이': '😞', '지루미': '😑',
      '버럭이': '😠', '불안이': '😰', '걱정이': '😟', '감동이': '🥹', '황당이': '😯',
      '당황이': '😳', '짜증이': '😤', '무섭이': '😨', '추억이': '🤔', '설렘이': '🥰',
      '편안이': '😌', '궁금이': '🤨', '사랑이': '❤️', '아픔이': '🤕', '욕심이': '🤑'
    };
    
    avatarText = emotionMappings[emotion.label.replace(/\d+$/, '')] || '😊';
    avatarColor = emotion.color;
  } else {
    displayName = post.user?.nickname || '사용자';
    emotionIcon = null;
    avatarText = displayName[0] || 'U';
    avatarColor = '#667eea';
  }

  // FlatList 데이터 구조
  const flatListData = React.useMemo((): FlatListItem[] => {
    // DB의 comment_count와 실제 댓글 배열 중 더 정확한 값 사용
    const actualCommentCount = Math.max(post.comment_count || 0, allSortedComments.length);
    
    const data: FlatListItem[] = [
      { id: 'post', type: 'post', data: post },
      { id: 'comments-header', type: 'comments-header', data: { commentsCount: actualCommentCount } }
    ];

    // 베스트 댓글 TOP 3 추가
    if (bestComments.length > 0) {
      data.push({ id: 'best-comments', type: 'best-comments', data: bestComments });
    }

    // 일반 댓글들 추가
    displayedComments.forEach(comment => {
      data.push({ 
        id: `comment-${comment.comment_id}`, 
        type: 'comment', 
        data: comment 
      });
    });

    // 더보기 버튼
    if (hasMoreComments) {
      data.push({ id: 'load-more', type: 'load-more', data: { remainingCount: allSortedComments.length - displayedComments.length } });
    }

    return data;
  }, [post, displayedComments, bestComments, hasMoreComments, allSortedComments.length]);

  // FlatList renderItem
  const renderItem = ({ item, index }: { item: FlatListItem; index: number }) => {
    switch (item.type) {
      case 'post': {
        const postData = item.data as Post;
        return (
          <View style={styles.postContainer}>
            {/* 게시물 헤더 */}
            <HStack style={styles.postHeader}>
              {/* 첫 번째 셀: 아바타 */}
              <Box style={[styles.postAvatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.postAvatarText}>{avatarText}</Text>
              </Box>
              
              {/* 두 번째 셀: 작성자명과 작성날짜 */}
              <VStack style={styles.postAuthorInfo}>
                <HStack style={styles.postAuthorNameRow}>
                  <Text style={styles.postAuthorName}>{displayName}</Text>
                  {post.is_anonymous && emotionIcon && (
                    <MaterialCommunityIcons 
                      name={emotionIcon} 
                      size={18} 
                      color={avatarColor} 
                      style={{ marginLeft: 10 }}
                    />
                  )}
                </HStack>
                <Text style={styles.postTimestamp}>{formatCommentTime(postData.created_at)}</Text>
              </VStack>
            </HStack>

            {/* 감정 태그들 */}
            {postData.emotions && postData.emotions.length > 0 && (
              <HStack style={styles.postEmotionsContainer}>
                {postData.emotions.map((emotion) => (
                  <Box
                    key={emotion.emotion_id}
                    style={[
                      styles.postEmotionTag,
                      { backgroundColor: `${emotion.color}15`, borderColor: `${emotion.color}30` }
                    ]}
                  >
                    <Text style={[styles.postEmotionText, { color: emotion.color }]}>
                      {emotion.name}
                    </Text>
                  </Box>
                ))}
              </HStack>
            )}

            {/* 게시물 전체 내용 */}
            <Text style={styles.postContent}>{postData.content}</Text>

            {/* 이미지 (있는 경우) */}
            {postData.image_url && (
              <Box style={styles.imageContainer}>
                <Image 
                  source={{ uri: normalizeImageUrl(postData.image_url) }} 
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </Box>
            )}

            {/* 게시물 액션 */}
            <HStack style={styles.postActions}>
              <TouchableOpacity 
                onPress={() => onLike?.(postData.post_id)}
                style={[styles.postAction, liked && styles.likedAction]}
              >
                <MaterialCommunityIcons 
                  name={liked ? "heart" : "heart-outline"} 
                  size={20} 
                  color={liked ? "#ef4444" : "#6b7280"} 
                />
                <Text style={[styles.postActionText, liked && styles.likedActionText]}>
                  {postData.like_count}
                </Text>
              </TouchableOpacity>

              <Box style={styles.postAction}>
                <MaterialCommunityIcons name="comment-outline" size={20} color="#6b7280" />
                <Text style={styles.postActionText}>{postData.comment_count}</Text>
              </Box>
            </HStack>
          </View>
        );
      }

      case 'comments-header': {
        const headerData = item.data as { commentsCount: number };
        return (
          <Box style={styles.commentsSection}>
            {allSortedComments.length > 0 && (
              <Box style={styles.regularCommentsHeader}>
                <Text style={styles.regularCommentsHeaderText}>
                  💬댓글 ({headerData.commentsCount})
                </Text>
              </Box>
            )}
          </Box>
        );
      }

      case 'best-comments': {
        const commentsData = item.data as Comment[];
        return (
          <View style={styles.bestCommentsContainer}>
            {/* 베스트 댓글 블록 전체 */}
            <Box style={styles.bestCommentsBlock}>
              {/* 헤더 */}
              <Box style={styles.bestCommentsMainHeader}>
                <MaterialCommunityIcons name="trophy" size={24} color="#f59e0b" />
                <Text style={styles.bestCommentsMainHeaderText}>🏆 베스트 댓글 TOP 3</Text>
              </Box>
              
              {/* 베스트 댓글 목록 */}
              {commentsData.map((comment, index) => {
                const rank = index + 1;
                const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // 금, 은, 동
                const rankIcons = ['trophy', 'medal', 'medal-outline']; // 트로피, 메달, 메달 아웃라인
                const rankTexts = ['1ST', '2ND', '3RD'];
                
                return (
                  <View key={`best-comment-${comment.comment_id}`}>
                    <View
                      style={styles.bestCommentItem}
                    >
                      {/* 작성자 정보 처리 */}
                      {(() => {
                        const isPostAuthor = post.user_id === comment.user_id;
                        const isAuthor = currentUserId === comment.user_id;
                        let displayName = comment.user?.nickname || '탈퇴한 사용자';
                        let emotionIcon = 'account-circle';
                        let avatarColor = '#9ca3af';
                        
                        if (comment.is_anonymous) {
                          const emotion = getAnonymousEmotion(comment.user_id, comment.comment_id, post.comments || [], post.post_id);
                          displayName = emotion.label;
                          emotionIcon = emotion.icon;
                          avatarColor = emotion.color;
                        } else if (!comment.is_anonymous && comment.user_id) {
                          const emotion = getUserEmotionIcon(comment.user_id);
                          emotionIcon = emotion.icon;
                          avatarColor = emotion.color;
                        }

                        return (
                          <>
                            {/* 첫 번째 줄: 순위 + 작성자 + 날짜 + 하트/개수 */}
                            <HStack style={styles.bestCommentInfoLine}>
                              <Box style={[styles.rankBadge, { backgroundColor: rankColors[index] }]}>
                                <MaterialCommunityIcons name={rankIcons[index]} size={16} color="#ffffff" />
                                <Text style={styles.rankText}>{rankTexts[index]}</Text>
                              </Box>
                              
                              <MaterialCommunityIcons 
                                name={emotionIcon} 
                                size={12} 
                                color={avatarColor} 
                                style={styles.bestCommentIcon}
                              />
                              
                              <Text style={[
                                styles.bestCommentAuthor,
                                isPostAuthor && styles.postAuthorName,
                                comment.is_anonymous && !isPostAuthor && styles.anonymousName
                              ]}>
                                {displayName}
                              </Text>
                              
                              {isPostAuthor && (
                                <Text style={styles.bestCommentBadge}>글쓴이</Text>
                              )}
                              {isAuthor && !isPostAuthor && (
                                <Text style={styles.bestCommentBadge}>나</Text>
                              )}
                              
                              <Text style={styles.bestCommentTime}>
                                {formatCommentTime(comment.created_at)}
                              </Text>
                              
                              <Box style={styles.bestCommentLikeBox}>
                                <MaterialCommunityIcons name="heart" size={16} color="#ef4444" />
                                <Text style={styles.bestCommentLikeCount}>{comment.like_count}</Text>
                              </Box>
                            </HStack>
                            
                            {/* 두 번째 줄: 댓글 내용 */}
                            <Text style={styles.bestCommentContent} numberOfLines={1}>
                              {removeCommentId(comment.content)}
                            </Text>
                          </>
                        );
                      })()}
                    </View>
                    
                    {/* 구분선 (마지막 댓글 제외) */}
                    {index < commentsData.length - 1 && (
                      <Box style={styles.bestCommentDivider} />
                    )}
                  </View>
                );
              })}
            </Box>
            <Box style={styles.bestCommentSeparator} />
          </View>
        );
      }

      case 'comment': {
        const commentData = item.data as Comment;
        return (
          <View 
            ref={(ref) => {
              if (ref && !commentData.parent_comment_id) {
                commentRefs.current[commentData.comment_id] = ref;
                if (__DEV__) console.log('📌 FlatList 원본 댓글 ref 설정:', {
                  commentId: commentData.comment_id,
                  index,
                  hasRef: !!ref
                });
              }
            }}
          >
            {renderComment(commentData, false, false)}
          </View>
        );
      }

      case 'load-more': {
        const loadMoreData = item.data as { remainingCount: number };
        return (
          <TouchableOpacity 
            onPress={loadMoreComments}
            style={styles.loadMoreButton}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <Text style={styles.loadMoreText}>
                더 많은 댓글 보기 ({formatNumber(loadMoreData.remainingCount)}개)
              </Text>
            )}
          </TouchableOpacity>
        );
      }

      default:
        return null;
    }
  };


  return (
    <View style={styles.container}>
      <Card style={styles.expandedCard}>
        {/* 헤더 - 접기 버튼 */}
        <HStack style={styles.expandedHeader}>
          <TouchableOpacity onPress={onCollapse} style={styles.collapseButton}>
            <MaterialCommunityIcons name="chevron-up" size={20} color="#8b5cf6" />
            <Text style={styles.collapseButtonText}>접기</Text>
          </TouchableOpacity>
        </HStack>

        <FlatList 
          ref={flatListRef}
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.content}
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingBottom: 20
          }}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          scrollEnabled={true}
          bounces={true}
          onScrollToIndexFailed={(info) => {
            if (__DEV__) console.log('❌ scrollToIndex 실패:', info);
            // 백업: 수동으로 스크롤 위치 계산
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ 
                index: info.index, 
                animated: true,
                viewPosition: 0.5 
              });
            });
          }}
          onScrollBeginDrag={() => { if (__DEV__) console.log('🚀 FlatList 사용자 스크롤 시작'); }}
          onScrollEndDrag={() => { if (__DEV__) console.log('🛏 FlatList 사용자 스크롤 종료'); }}
          onMomentumScrollEnd={() => { if (__DEV__) console.log('🏁 FlatList 스크롤 완전 정지'); }}
        />

        {/* 고정된 댓글 입력창 - 메인 댓글 작성용 */}
        {!hideInputForScroll && !replyingTo && (
          <Box style={styles.commentInputContainer}>

          {/* 익명 작성 토글 버튼 */}
          <TouchableOpacity
            onPress={() => setIsAnonymous(!isAnonymous)}
            style={[styles.anonymousButton, isAnonymous && styles.anonymousButtonActive]}
          >
            <MaterialCommunityIcons 
              name={isAnonymous ? "incognito" : "incognito-off"} 
              size={18} 
              color={isAnonymous ? "#ffffff" : "#6b7280"} 
            />
            <Text style={[styles.anonymousButtonText, isAnonymous && styles.anonymousButtonTextActive]}>
              {isAnonymous ? "익명으로 작성 중" : "익명으로 작성"}
            </Text>
          </TouchableOpacity>

          {/* 댓글 입력 */}
          <HStack style={styles.commentInput}>
            <TextInput
              ref={textInputRef}
              placeholder="따뜻한 댓글을 남겨주세요..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={200}
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              onPress={handleCommentSubmit}
              disabled={!commentText.trim() || submitting}
              style={[
                styles.submitButton,
                (!commentText.trim() || submitting) && styles.disabledSubmitButton
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialCommunityIcons 
                  name="send" 
                  size={16} 
                  color={!commentText.trim() ? '#9ca3af' : '#ffffff'} 
                />
              )}
            </TouchableOpacity>
          </HStack>

          {/* 글자 수 */}
          <Text style={styles.characterCount}>{commentText.length}/200</Text>
          </Box>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  expandedCard: {
    margin: 13,
    borderRadius: 16,
    flex: 1,
  },
  expandedHeader: {
    padding: 16,
    paddingBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    gap: 4,
  },
  collapseButtonText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontFamily: 'Pretendard-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  postContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  postAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  postAvatarText: {
    color: '#ffffff',
    fontSize: 25,
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginRight: 8,
  },
  postAuthorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  postAuthorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  postAuthorName: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#1f2937',
  },
  postTimestamp: {
    fontSize: 15,
    color: '#6b7280',
    fontFamily: 'Pretendard-SemiBold',
  },
  postEmotionsContainer: {
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  postEmotionTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  postEmotionText: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 240,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 0,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  likedAction: {
    backgroundColor: '#f3e8ff',
  },
  postActionText: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#6b7280',
  },
  likedActionText: {
    color: '#ef4444',
  },
  commentsSection: {
    marginTop: 8,
    paddingTop: 2,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  commentSection: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  highlightedComment: {
    borderWidth: 12,
    borderColor: '#6200ee',
    backgroundColor: '#f3e8ff',
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 1.0,
    shadowRadius: 25,
    elevation: 25,
    transform: [{ scale: 1.15 }],
    borderStyle: 'solid',
    marginVertical: 20,
    borderRadius: 20,
    overflow: 'hidden',
    // 추가적인 강조 효과
    position: 'relative',
    zIndex: 999,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  replyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingLeft: 48,
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  repliesContainer: {
    backgroundColor: '#f8fafc',
  },
  commentMainContent: {
    flex: 1,
    marginLeft: 12,
  },
  replyMainContent: {
    flex: 1,
    marginLeft: 60,
  },
  commentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flex: 1,
  },
  commentBasicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    alignContent: 'center',
  },
  commentActionsInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineActionButton: {
    marginLeft: 12,
  },
  commentLikeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineActionText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Pretendard-Medium',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    resizeMode: 'cover',
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
    resizeMode: 'cover',
  },
  commentAvatarText: {
    fontSize: 22, // 이모지용 크기 증가
    fontFamily: 'Pretendard-Bold',
    color: '#ffffff',
  },
  replyAvatarText: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: '#ffffff',
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthorRow: {
    alignItems: 'center',
    gap: 6,
  },
  commentAuthor: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: '#1f2937',
  },
  // 기존 authorBadge 스타일은 currentUserBadge로 사용
  currentUserBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#059669',
    borderRadius: 8,
    marginLeft: 6,
  },
  currentUserBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontFamily: 'Pretendard-SemiBold',
  },
  
  // 글쓴이 배지
  postAuthorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    marginLeft: 6,
  },
  postAuthorBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontFamily: 'Pretendard-SemiBold',
  },
  
  // 익명 배지
  anonymousBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#6b7280',
    borderRadius: 8,
    marginLeft: 6,
  },
  anonymousBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontFamily: 'Pretendard-SemiBold',
  },
  
  // 글쓴이 아바타
  postAuthorAvatar: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  
  // 익명 아바타
  anonymousAvatar: {
    backgroundColor: '#6b7280',
  },
  
  
  // 익명 이름
  anonymousName: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Pretendard-Medium',
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  commentInputContainer: {
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  replyingIndicator: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  replyingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  replyingText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontFamily: 'Pretendard-SemiBold',
    flex: 1,
    marginLeft: 6,
  },
  replyingContent: {
    marginTop: 4,
  },
  replyingAuthor: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'Pretendard-Medium',
    marginBottom: 4,
  },
  replyingPreview: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  replyTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ede9fe',
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  replyTargetText: {
    fontSize: 12,
    color: '#7c3aed',
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: 4,
  },
  
  // 인라인 답글 입력창 스타일
  inlineReplyContainer: {
    marginTop: 12,
    marginLeft: 12,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  inlineReplyInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inlineReplyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
  },
  inlineReplySendButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineReplySendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  inlineReplyOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  inlineAnonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    gap: 4,
  },
  inlineAnonymousToggleActive: {
    backgroundColor: '#8b5cf6',
  },
  inlineAnonymousText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Pretendard-Medium',
  },
  inlineAnonymousTextActive: {
    color: '#ffffff',
  },
  inlineCancelButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  inlineCancelText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Pretendard-Medium',
  },
  inlineCharacterCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  anonymousText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Pretendard-Medium',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    minHeight: 20,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSubmitButton: {
    backgroundColor: '#e5e7eb',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontFamily: 'Pretendard-SemiBold',
  },
  
  // 감정 기반 익명 사용자 스타일
  emotionAvatar: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emotionAvatarText: {
    fontSize: 20, // 이모지 크기 증가
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emotionName: {
    color: '#1f2937',
    fontFamily: 'Pretendard-Bold',
    fontSize: 14,
  },
  
  // 향상된 액션 버튼 스타일
  likeAction: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  replyAction: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  
  // 새로운 액션 버튼 스타일
  actionButton: {
    marginRight: 16,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Pretendard-Medium',
  },
  reportButtonText: {
    color: '#ef4444',
  },
  toggleRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  toggleRepliesText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Pretendard-Medium',
    marginRight: 4,
  },
  likedButtonText: {
    color: '#f97316',
    fontFamily: 'Pretendard-SemiBold',
  },
  emotionIconStyle: {
    marginRight: 6,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  
  // 베스트 댓글 스타일
  bestCommentsSection: {
    marginBottom: 10,
  },
  bestCommentHeader: {
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  bestCommentTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#92400e',
    marginLeft: 4,
  },
  bestCommentSection: {
    borderWidth: 1,
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 4, // 베스트 댓글과 일반 댓글 사이 간격 증가
  },
  bestCommentBadgeText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Bold',
    color: '#ffffff',
    marginLeft: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // 베스트 댓글 헤더
  bestCommentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 0,
    borderColor: '#fbbf24',
    alignSelf: 'flex-start',
  },
  bestCommentsHeaderText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#92400e',
    marginLeft: 8,
  },
  
  // 일반 댓글 헤더
  regularCommentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 2,
    borderTopWidth: 0,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  regularCommentsHeaderText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#374151',
  },
  
  regularCommentsSection: {
    marginTop: 8,
  },
  regularCommentTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  
  // 익명 작성 버튼 스타일
  anonymousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  anonymousButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  anonymousButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Pretendard-Medium',
    marginLeft: 8,
  },
  anonymousButtonTextActive: {
    color: '#ffffff',
    fontFamily: 'Pretendard-SemiBold',
  },
  
  // 답글 토글 버튼 스타일
  replyToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginLeft: 12,
  },
  replyToggleText: {
    fontSize: 12,
    color: '#6366f1',
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: 4,
  },
  
  // 베스트 댓글 미리보기 스타일 (간단한 형태)
  bestCommentPreview: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    backgroundColor: '#fefbf3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  bestCommentSeparator: {
    height: 0,
    backgroundColor: '#e5e7eb',
    marginVertical: 5,
    marginHorizontal: 8,
  },
  bestCommentSimple: {
    flex: 1,
  },
  bestCommentSimpleHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  bestCommentIcon: {
    marginRight: 6,
  },
  bestCommentAuthor: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#374151',
  },
  bestCommentBadge: {
    fontSize: 9,
    fontFamily: 'Pretendard-Bold',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  bestCommentTime: {
    fontSize: 10,
    color: '#9ca3af',
  },
  bestCommentLikes: {
    alignItems: 'center',
    marginLeft: 'auto',
  },
  bestCommentLikesText: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#f59e0b',
    marginLeft: 3,
  },
  bestCommentContent: {
    fontSize: 13,
    lineHeight: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  bestCommentNotice: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  // 베스트 댓글 TOP 3 스타일
  bestCommentsContainer: {
    marginVertical: 0,
    marginHorizontal: 8,
  },
  bestCommentsBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  bestCommentsMainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b',
  },
  bestCommentsMainHeaderText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#92400e',
    marginLeft: 5,
  },
  bestCommentItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  bestCommentInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 0,
  },
  bestCommentLikeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  bestCommentLikeCount: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#ef4444',
  },
  bestCommentDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  rankText: {
    fontSize: 10,
    fontFamily: 'Pretendard-Bold',
    color: '#ffffff',
    marginLeft: 2,
  },
});

export default ExpandedPostView;