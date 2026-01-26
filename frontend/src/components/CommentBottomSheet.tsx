// src/components/CommentBottomSheet.tsx
// Bottom Sheet 스타일 댓글 시스템 - 인스타그램/틱톡 스타일
// BUILD: 2025-12-06 - 키보드 입력창 가림 문제 수정
import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle, memo, useState, useEffect } from 'react';
import {
  View,
  Text as RNText,
  TouchableOpacity,
  TextInput,
  FlatList,
  Keyboard,
  Platform,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  KeyboardEvent,
} from 'react-native';
import BottomSheet, { BottomSheetFlatList, BottomSheetBackdrop, BottomSheetTextInput, BottomSheetFooter, BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Box, HStack, VStack } from './ui';
import ClickableNickname from './ClickableNickname';
import ClickableAvatar from './ClickableAvatar';
import { TYPOGRAPHY } from '../utils/typography';
import { FONT_SIZES } from '../constants';
import { logger } from '../utils/security';
import reportService from '../services/api/reportService';
import blockService from '../services/api/blockService';
import ActionBottomSheet from './BottomSheet';  // BottomSheet를 ActionBottomSheet으로 alias
import BottomSheetAlert from './common/BottomSheetAlert';

// 반응형 스케일링
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 360;
const scale = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.9), 1.3);
const normalize = (size: number) => Math.round(size * scale);

// 감정 캐릭터 배열
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

// 익명 감정 생성 함수
const getAnonymousEmotion = (userId?: number, postId?: number, commentId?: number) => {
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const commentSeed = commentId || 0;
  const seed1 = (userSeed * 17 + postSeed * 37 + commentSeed * 7) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41 + commentSeed * 11) % 500;
  const seed3 = (userSeed + postSeed + commentSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_CHARACTERS.length;
  return EMOTION_CHARACTERS[finalSeed];
};

// 타입 정의
export interface Comment {
  comment_id: number;
  content: string;
  user_id: number;
  is_anonymous?: boolean;
  like_count?: number;
  is_liked?: boolean;
  created_at: string;
  parent_comment_id?: number;
  user?: { nickname?: string; profile_image_url?: string; is_author?: boolean };
  User?: { nickname?: string; profile_image_url?: string; is_author?: boolean };
  replies?: Comment[];
}

interface CommentBottomSheetProps {
  comments: Comment[];
  bestComments?: Comment[];
  totalCount: number;
  postId: number;
  postUserId?: number;
  postType: string;
  loading?: boolean;
  hasMore?: boolean;
  highlightCommentId?: number | null;
  onLoadMore?: () => void;
  onSubmitComment: (content: string, isAnonymous: boolean, parentCommentId?: number) => Promise<void>;
  onLikeComment: (comment: Comment) => void;
  onEditComment: (comment: Comment) => void;
  onDeleteComment: (comment: Comment) => void;
  onReplyComment?: (comment: Comment) => void;
  onLongPressComment?: (comment: Comment) => void;
  onRefresh?: () => void;
  isAuthenticated: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export interface CommentBottomSheetRef {
  open: () => void;
  close: () => void;
  expand: () => void;
  snapToIndex: (index: number) => void;
}

// 메모이즈된 Footer 입력 컴포넌트 - 타이핑 시 부모 re-render 방지
interface FooterInputProps {
  replyingTo: Comment | null;
  onCancelReply: () => void;
  onSubmit: (text: string, isAnonymous: boolean, parentCommentId?: number) => Promise<void>;
  isAuthenticated: boolean;
  modernTheme: any;
  isDark: boolean;
  onFocusExpand?: () => void; // 입력창 포커스 시 BottomSheet 확장
}

const FooterInputComponent = memo(({
  replyingTo,
  onCancelReply,
  onSubmit,
  isAuthenticated,
  modernTheme,
  isDark,
  onFocusExpand,
}: FooterInputProps) => {
  const inputRef = useRef<any>(null);
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasText = text.trim().length > 0;

  // 입력창 포커스 핸들러
  const handleFocus = useCallback(() => {
    onFocusExpand?.();
  }, [onFocusExpand]);

  const handleSubmit = async () => {
    if (!hasText || submitting) return;
    try {
      setSubmitting(true);
      await onSubmit(text.trim(), isAnonymous, replyingTo?.comment_id);
      setText('');
      setIsAnonymous(false);
      Keyboard.dismiss();
    } catch (error) {
      logger.log('댓글 작성 실패:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReply = () => {
    setText('');
    onCancelReply();
  };

  return (
    <View style={{
      backgroundColor: modernTheme.bg.card,
      borderTopWidth: 1,
      borderTopColor: modernTheme.bg.border,
      paddingHorizontal: normalize(16),
      paddingTop: normalize(12),
      paddingBottom: normalize(16),
    }}>
      {/* 답글 표시 */}
      {replyingTo && (
        <HStack style={{
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : '#F3E8FF',
          padding: normalize(8),
          borderRadius: normalize(8),
          marginBottom: normalize(8),
        }}>
          <MaterialCommunityIcons name="reply" size={normalize(16)} color={modernTheme.colors.primary} />
          <RNText style={{
            flex: 1,
            marginLeft: normalize(8),
            fontSize: normalize(13),
            color: modernTheme.text.secondary,
          }} numberOfLines={1}>
            {replyingTo.User?.nickname || replyingTo.user?.nickname || '익명'}님에게 답글 작성 중
          </RNText>
          <TouchableOpacity onPress={handleCancelReply}>
            <MaterialCommunityIcons name="close" size={normalize(18)} color={modernTheme.text.tertiary} />
          </TouchableOpacity>
        </HStack>
      )}

      <HStack style={{ alignItems: 'flex-end', gap: normalize(8) }}>
        {/* 익명 토글 */}
        <TouchableOpacity
          onPress={() => setIsAnonymous(!isAnonymous)}
          style={{
            padding: normalize(10),
            borderRadius: normalize(20),
            backgroundColor: isAnonymous ? modernTheme.colors.primary : modernTheme.bg.secondary,
          }}
        >
          <MaterialCommunityIcons
            name={isAnonymous ? 'incognito' : 'incognito-off'}
            size={normalize(20)}
            color={isAnonymous ? '#fff' : modernTheme.text.tertiary}
          />
        </TouchableOpacity>

        {/* 입력 필드 */}
        <View style={{
          flex: 1,
          backgroundColor: modernTheme.bg.secondary,
          borderRadius: normalize(20),
          paddingHorizontal: normalize(16),
          paddingVertical: Platform.OS === 'ios' ? normalize(10) : normalize(4),
          minHeight: normalize(40),
          maxHeight: normalize(100),
        }}>
          <BottomSheetTextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onFocus={handleFocus}
            placeholder={isAuthenticated ? (replyingTo ? '답글을 입력하세요...' : '댓글을 입력하세요...') : '로그인 후 댓글을 작성할 수 있습니다'}
            placeholderTextColor={modernTheme.text.tertiary}
            editable={isAuthenticated}
            multiline
            maxLength={500}
            style={{
              fontSize: normalize(14),
              color: modernTheme.text.primary,
              maxHeight: normalize(80),
            }}
          />
        </View>

        {/* 전송 버튼 */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!hasText || submitting || !isAuthenticated}
          style={{
            padding: normalize(10),
            borderRadius: normalize(20),
            backgroundColor: hasText && isAuthenticated
              ? modernTheme.colors.primary
              : modernTheme.bg.secondary,
          }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons
              name="send"
              size={normalize(20)}
              color={hasText && isAuthenticated ? '#fff' : modernTheme.text.tertiary}
            />
          )}
        </TouchableOpacity>
      </HStack>
    </View>
  );
});

// 메모이즈된 댓글 아이템
const CommentItem = memo(({
  comment,
  isReply = false,
  depth = 0,
  postUserId,
  postId,
  currentUserId,
  isDark,
  modernTheme,
  onLike,
  onReply,
  onLongPress,
  onEdit,
  onDelete,
  onReport,
  onBlock,
  onRefresh,
  collapsedComments,
  onToggleCollapse,
  isAuthenticated = false,
  isHighlighted = false,
}: {
  comment: Comment;
  isReply?: boolean;
  depth?: number;
  postUserId?: number;
  postId: number;
  currentUserId?: number;
  isDark: boolean;
  modernTheme: any;
  onLike: (comment: Comment) => void;
  onReply: (comment: Comment) => void;
  onLongPress: (comment: Comment) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  onReport: (comment: Comment) => void;
  onBlock?: (comment: Comment) => void;
  onRefresh?: () => void;
  collapsedComments: Set<number>;
  onToggleCollapse: (commentId: number) => void;
  isAuthenticated?: boolean;
  isHighlighted?: boolean;
}) => {
  const commentUser = comment.User || comment.user;
  const commentUserId = comment.user_id;
  const commentIsAnonymous = comment.is_anonymous;
  const isPostAuthor = commentUser?.is_author || postUserId === commentUserId;
  const isMyComment = currentUserId && commentUserId === currentUserId;
  const isCollapsed = collapsedComments.has(comment.comment_id);
  const hasReplies = comment.replies && comment.replies.length > 0;

  // 신고/차단 관련 상태
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showReportSuccessSheet, setShowReportSuccessSheet] = useState(false);
  const [showBlockSheet, setShowBlockSheet] = useState(false);
  const [showBlockSuccessSheet, setShowBlockSuccessSheet] = useState(false);
  const [reportErrorAlert, setReportErrorAlert] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [blockErrorAlert, setBlockErrorAlert] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // 표시 정보 결정
  let displayName = '';
  let avatarText = '';
  let avatarColor = '#8b5cf6';
  let emotionEmoji: string | null = null;

  if (commentIsAnonymous) {
    const emotion = getAnonymousEmotion(commentUserId, postId, comment.comment_id);
    displayName = emotion.label;
    avatarText = emotion.label[0] || '익';
    avatarColor = emotion.color;
    emotionEmoji = emotion.emoji;
  } else {
    displayName = commentUser?.nickname || '사용자';
    avatarText = displayName[0] || 'U';
    avatarColor = isPostAuthor ? '#059669' : '#8b5cf6';
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMs / 3600000);
      const diffDay = Math.floor(diffMs / 86400000);

      if (diffMin < 1) return '방금 전';
      if (diffMin < 60) return `${diffMin}분 전`;
      if (diffHour < 24) return `${diffHour}시간 전`;
      if (diffDay < 7) return `${diffDay}일 전`;
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch {
      return '방금 전';
    }
  };

  // 댓글 신고 상태
  const [isReporting, setIsReporting] = useState(false);

  // 댓글 신고 API 호출
  const handleReportComment = (reportType: string) => {
    if (isReporting) return;
    setIsReporting(true);
    setShowReportSheet(false);

    // 약간의 딜레이 후 API 호출 (BottomSheet 닫힘 후)
    setTimeout(async () => {
      try {
        await reportService.reportComment(
          comment.comment_id,
          reportType as 'spam' | 'inappropriate' | 'harassment' | 'other',
          reportType,
          `댓글 신고: ${comment.content.substring(0, 100)}`
        );
        setShowReportSuccessSheet(true);
      } catch (error: any) {
        if (__DEV__) console.log('🚨 댓글 신고 에러:', JSON.stringify(error?.response?.data));
        const errorCode = error?.response?.data?.code;
        const errorMessage = error?.response?.data?.message;

        if (errorCode === 'ALREADY_REPORTED' || errorMessage?.includes('이미 신고')) {
          if (__DEV__) console.log('🚨 중복 신고 감지 - Alert 표시');
          setReportErrorAlert({ visible: true, message: '이미 신고한 댓글입니다.' });
        } else {
          if (__DEV__) console.log('🚨 기타 에러 - Alert 표시');
          setReportErrorAlert({ visible: true, message: '신고 처리 중 문제가 발생했습니다.' });
        }
      } finally {
        setIsReporting(false);
      }
    }, 300);
  };

  // 댓글 차단 API 호출
  const handleBlockComment = async (reason: string) => {
    setShowBlockSheet(false);
    setTimeout(async () => {
      try {
        await blockService.blockContent({
          contentType: 'comment',
          contentId: comment.comment_id,
          reason,
        });
        setShowBlockSuccessSheet(true);
        setTimeout(() => onRefresh?.(), 500);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message;
        if (errorMessage?.includes('이미 차단')) {
          setBlockErrorAlert({ visible: true, message: '이미 차단한 댓글입니다.' });
        } else {
          setBlockErrorAlert({ visible: true, message: '차단 처리 중 문제가 발생했습니다.' });
        }
      }
    }, 300);
  };

  // 더보기 옵션 actions
  const getOptionsActions = () => {
    if (isMyComment) {
      return [
        {
          id: 'edit',
          title: '수정',
          icon: 'pencil-outline',
          onPress: () => {
            setShowOptionsSheet(false);
            setTimeout(() => onEdit(comment), 300);
          },
        },
        {
          id: 'delete',
          title: '삭제',
          icon: 'delete-outline',
          destructive: true,
          onPress: () => {
            setShowOptionsSheet(false);
            setTimeout(() => onDelete(comment), 300);
          },
        },
      ];
    } else {
      return [
        {
          id: 'report',
          title: '신고',
          icon: 'alert-circle-outline',
          destructive: true,
          onPress: () => {
            setShowOptionsSheet(false);
            setTimeout(() => setShowReportSheet(true), 300);
          },
        },
        {
          id: 'block',
          title: '차단',
          icon: 'block-helper',
          destructive: true,
          onPress: () => {
            setShowOptionsSheet(false);
            setTimeout(() => setShowBlockSheet(true), 300);
          },
        },
      ];
    }
  };

  // 신고 사유 선택 actions
  const reportReasonActions = [
    {
      id: 'spam',
      title: '스팸/도배',
      icon: 'alert-circle-outline',
      destructive: true,
      skipAutoClose: true,
      onPress: () => handleReportComment('spam'),
    },
    {
      id: 'inappropriate',
      title: '부적절한 내용',
      icon: 'alert-circle-outline',
      destructive: true,
      skipAutoClose: true,
      onPress: () => handleReportComment('inappropriate'),
    },
    {
      id: 'harassment',
      title: '괴롭힘/욕설',
      icon: 'alert-circle-outline',
      destructive: true,
      skipAutoClose: true,
      onPress: () => handleReportComment('harassment'),
    },
    {
      id: 'other',
      title: '기타',
      icon: 'alert-circle-outline',
      destructive: true,
      skipAutoClose: true,
      onPress: () => handleReportComment('other'),
    },
  ];

  // 신고 완료 actions
  const reportSuccessActions = [
    {
      id: 'ok',
      title: '확인',
      icon: 'check-circle-outline',
      onPress: () => setShowReportSuccessSheet(false),
    },
  ];

  // 차단 사유 선택 actions
  const blockReasonActions = [
    {
      id: 'spam',
      title: '스팸/도배',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleBlockComment('spam'),
    },
    {
      id: 'inappropriate',
      title: '부적절한 내용',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleBlockComment('inappropriate'),
    },
    {
      id: 'harassment',
      title: '괴롭힘/욕설',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleBlockComment('harassment'),
    },
    {
      id: 'other',
      title: '기타',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleBlockComment('other'),
    },
  ];

  // 차단 완료 actions
  const blockSuccessActions = [
    {
      id: 'ok',
      title: '확인',
      icon: 'check-circle-outline',
      onPress: () => setShowBlockSuccessSheet(false),
    },
  ];

  const maxDepth = 2;
  const paddingLeft = Math.min(depth, maxDepth) * normalize(16);

  return (
    <View style={{ paddingLeft }}>
      <TouchableOpacity
        onLongPress={() => onLongPress(comment)}
        activeOpacity={isMyComment ? 0.8 : 1}
        style={{
          backgroundColor: isHighlighted
            ? (isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)')
            : (isReply ? modernTheme.bg.secondary : modernTheme.bg.card),
          borderRadius: normalize(10),
          padding: normalize(isReply ? 8 : 12),
          marginBottom: normalize(6),
          borderWidth: isReply ? 0 : 1,
          borderColor: isHighlighted
            ? (isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)')
            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
        }}
      >
        {/* 헤더 */}
        <HStack style={{ alignItems: 'center', marginBottom: normalize(6) }}>
          <ClickableAvatar
            userId={commentUserId}
            nickname={displayName}
            isAnonymous={commentIsAnonymous}
            avatarUrl={!commentIsAnonymous && commentUser?.profile_image_url ? commentUser.profile_image_url : undefined}
            avatarText={emotionEmoji || avatarText}
            avatarColor={avatarColor}
            size={isReply ? normalize(32) : normalize(40)}
          />
          <VStack style={{ flex: 1, marginLeft: normalize(8) }}>
            <HStack style={{ alignItems: 'center' }}>
              <ClickableNickname
                userId={commentUserId}
                nickname={displayName}
                isAnonymous={commentIsAnonymous}
                style={{
                  fontSize: normalize(TYPOGRAPHY.bodySmall),
                  fontFamily: 'Pretendard-Bold',
                  color: modernTheme.text.primary,
                }}
              >
                {displayName}
              </ClickableNickname>
              {isPostAuthor && (
                <View style={{
                  backgroundColor: '#059669',
                  paddingHorizontal: normalize(6),
                  paddingVertical: normalize(2),
                  borderRadius: normalize(4),
                  marginLeft: normalize(6),
                }}>
                  <RNText style={{ fontSize: normalize(10), color: '#fff', fontFamily: 'Pretendard-SemiBold' }}>
                    작성자
                  </RNText>
                </View>
              )}
              {isMyComment && (
                <View style={{
                  backgroundColor: modernTheme.colors.primary,
                  paddingHorizontal: normalize(6),
                  paddingVertical: normalize(2),
                  borderRadius: normalize(4),
                  marginLeft: normalize(6),
                }}>
                  <RNText style={{ fontSize: normalize(10), color: '#fff', fontFamily: 'Pretendard-SemiBold' }}>
                    나
                  </RNText>
                </View>
              )}
            </HStack>
            <RNText style={{
              fontSize: normalize(11),
              color: modernTheme.text.tertiary,
              marginTop: normalize(2),
            }}>
              {formatTime(comment.created_at)}
            </RNText>
          </VStack>
        </HStack>

        {/* 내용 */}
        <View style={{ marginBottom: normalize(8) }}>
          {/* 답글인 경우 표시 */}
          {isReply && comment.parent_comment_id && (
            <RNText style={{
              fontSize: normalize(11),
              color: modernTheme.text.tertiary,
              marginBottom: normalize(4),
            }}>
              답글
            </RNText>
          )}
          <RNText style={{
            fontSize: normalize(TYPOGRAPHY.bodySmall),
            lineHeight: normalize(18),
            color: modernTheme.text.primary,
          }}>
            {comment.content}
          </RNText>
        </View>

        {/* 액션 버튼 */}
        <HStack style={{ alignItems: 'center', gap: normalize(16) }}>
          <TouchableOpacity
            onPress={() => onLike(comment)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}
          >
            <MaterialCommunityIcons
              name={comment.is_liked ? 'heart' : 'heart-outline'}
              size={normalize(18)}
              color={comment.is_liked ? '#FF3B30' : modernTheme.text.tertiary}
            />
            {(comment.like_count ?? 0) > 0 && (
              <RNText style={{
                fontSize: normalize(12),
                color: comment.is_liked ? '#FF3B30' : modernTheme.text.tertiary,
              }}>
                {comment.like_count}
              </RNText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onReply(comment)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}
          >
            <MaterialCommunityIcons
              name="reply"
              size={normalize(18)}
              color={modernTheme.text.tertiary}
            />
            <RNText style={{ fontSize: normalize(12), color: modernTheme.text.tertiary }}>
              답글
            </RNText>
          </TouchableOpacity>

          {hasReplies && (
            <TouchableOpacity
              onPress={() => onToggleCollapse(comment.comment_id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}
            >
              <MaterialCommunityIcons
                name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                size={normalize(18)}
                color={modernTheme.colors.primary}
              />
              <RNText style={{ fontSize: normalize(12), color: modernTheme.colors.primary }}>
                {isCollapsed ? `답글 ${comment.replies?.length}개 보기` : '접기'}
              </RNText>
            </TouchableOpacity>
          )}

          {/* 더보기 버튼 - 로그인 사용자만 */}
          {isAuthenticated && (
            <TouchableOpacity
              onPress={() => setShowOptionsSheet(true)}
              style={{ marginLeft: 'auto', padding: normalize(4) }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="dots-horizontal"
                size={normalize(18)}
                color={modernTheme.text.tertiary}
              />
            </TouchableOpacity>
          )}
        </HStack>
      </TouchableOpacity>

      {/* 답글 목록 */}
      {hasReplies && !isCollapsed && (
        <View style={{ marginTop: normalize(4) }}>
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.comment_id}
              comment={reply}
              isReply={true}
              depth={depth + 1}
              postUserId={postUserId}
              postId={postId}
              currentUserId={currentUserId}
              isDark={isDark}
              modernTheme={modernTheme}
              onLike={onLike}
              onReply={onReply}
              onLongPress={onLongPress}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
              collapsedComments={collapsedComments}
              onToggleCollapse={onToggleCollapse}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </View>
      )}

      {/* 댓글 옵션 BottomSheet */}
      <ActionBottomSheet
        visible={showOptionsSheet}
        onClose={() => setShowOptionsSheet(false)}
        actions={getOptionsActions()}
      />

      {/* 신고 사유 선택 BottomSheet */}
      <ActionBottomSheet
        visible={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        title="신고 사유 선택"
        subtitle="신고 사유를 선택해주세요"
        actions={reportReasonActions}
      />

      {/* 신고 완료 BottomSheet */}
      <ActionBottomSheet
        visible={showReportSuccessSheet}
        onClose={() => setShowReportSuccessSheet(false)}
        title="신고 완료"
        subtitle={`신고가 접수되었습니다.\n관리자가 검토 후 조치하겠습니다.`}
        actions={reportSuccessActions}
      />

      {/* 신고 오류 Alert */}
      <BottomSheetAlert
        visible={reportErrorAlert.visible}
        title="알림"
        message={reportErrorAlert.message}
        buttons={[
          {
            text: '확인',
            style: 'default',
            onPress: () => setReportErrorAlert({ visible: false, message: '' }),
          },
        ]}
        onClose={() => setReportErrorAlert({ visible: false, message: '' })}
      />

      {/* 차단 사유 선택 BottomSheet */}
      <ActionBottomSheet
        visible={showBlockSheet}
        onClose={() => setShowBlockSheet(false)}
        title="차단 사유 선택"
        subtitle="차단 사유를 선택해주세요"
        actions={blockReasonActions}
      />

      {/* 차단 완료 BottomSheet */}
      <ActionBottomSheet
        visible={showBlockSuccessSheet}
        onClose={() => setShowBlockSuccessSheet(false)}
        title="차단 완료"
        subtitle="댓글이 차단되었습니다."
        actions={blockSuccessActions}
      />

      {/* 차단 오류 Alert */}
      <BottomSheetAlert
        visible={blockErrorAlert.visible}
        title="알림"
        message={blockErrorAlert.message}
        buttons={[
          {
            text: '확인',
            style: 'default',
            onPress: () => setBlockErrorAlert({ visible: false, message: '' }),
          },
        ]}
        onClose={() => setBlockErrorAlert({ visible: false, message: '' })}
      />
    </View>
  );
});

// 메인 컴포넌트
const CommentBottomSheet = forwardRef<CommentBottomSheetRef, CommentBottomSheetProps>((props, ref) => {
  const {
    comments,
    bestComments = [],
    totalCount,
    postId,
    postUserId,
    postType,
    loading = false,
    hasMore = false,
    highlightCommentId,
    onLoadMore,
    onSubmitComment,
    onLikeComment,
    onEditComment,
    onDeleteComment,
    onReplyComment,
    onLongPressComment,
    onRefresh,
    isAuthenticated,
    onOpenChange,
  } = props;

  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const { theme: modernTheme, isDark } = useModernTheme();
  const { user } = useAuth();

  // theme과 isDark를 ref로 저장하여 재렌더링 방지
  const modernThemeRef = useRef(modernTheme);
  const isDarkRef = useRef(isDark);
  modernThemeRef.current = modernTheme;
  isDarkRef.current = isDark;

  // 상태 - FooterInputComponent로 입력 상태 분리하여 타이핑 시 re-render 방지
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(new Set());
  // currentSheetIndex state 제거 - ref만 사용하여 재렌더링 방지
  const currentSheetIndexRef = useRef(-1);

  // 스냅 포인트: 50%, 75%, 95% (댓글 입력창이 잘 보이도록 확장)
  const snapPoints = useMemo(() => ['50%', '75%', '95%'], []);

  // 댓글을 시간순으로 정렬 (오래된 것 → 최신)
  const sortedComments = useMemo(() => {
    const sortCommentsRecursively = (commentList: Comment[]): Comment[] => {
      return commentList
        .map(comment => ({
          ...comment,
          // 답글도 재귀적으로 시간순 정렬
          replies: comment.replies ? sortCommentsRecursively(comment.replies) : []
        }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    };
    return sortCommentsRecursively(comments);
  }, [comments]);

  // highlightCommentId로 스크롤하는 함수
  const scrollToHighlightedComment = useCallback(() => {
    if (!highlightCommentId || !flatListRef.current) {
      logger.warn('⚠️ [CommentBottomSheet] 스크롤 불가:', { highlightCommentId, hasFlatListRef: !!flatListRef.current });
      return;
    }

    logger.log('📍 [CommentBottomSheet] 하이라이트 댓글로 스크롤 시작:', highlightCommentId);

    // sortedComments에서 인덱스 찾기 (베스트 댓글 제외)
    const commentIndex = sortedComments.findIndex(c => c.comment_id === highlightCommentId);

    logger.log('📍 [CommentBottomSheet] 댓글 인덱스:', {
      commentIndex,
      totalComments: sortedComments.length,
      highlightCommentId
    });

    if (commentIndex !== -1) {
      // 바텀시트가 완전히 열린 후 스크롤 (딜레이 증가)
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: commentIndex,
            animated: true,
            viewPosition: 0.3, // 화면 상단 30% 위치
          });
          logger.log('✅ [CommentBottomSheet] 스크롤 완료:', commentIndex);
        } catch (error) {
          logger.error('❌ [CommentBottomSheet] 스크롤 실패:', error);
          // 실패 시 수동 스크롤
          flatListRef.current?.scrollToOffset({
            offset: commentIndex * 150, // 대략적인 높이
            animated: true,
          });
        }
      }, 1000);
    } else {
      logger.warn('⚠️ [CommentBottomSheet] 하이라이트 댓글을 찾을 수 없음:', {
        highlightCommentId,
        availableCommentIds: sortedComments.map(c => c.comment_id).slice(0, 5)
      });
    }
  }, [highlightCommentId, sortedComments]);

  // ref 핸들러 노출 (state 업데이트 제거 - 재렌더링 방지)
  useImperativeHandle(ref, () => ({
    open: () => {
      if (__DEV__) console.log('[CommentBottomSheet] open() 호출됨, bottomSheetRef:', !!bottomSheetRef.current);
      const sheet = bottomSheetRef.current;
      if (sheet) {
        currentSheetIndexRef.current = 0;
        sheet.snapToIndex(0);
        if (__DEV__) console.log('[CommentBottomSheet] snapToIndex(0) 실행됨');

        // 하이라이트 댓글로 스크롤
        if (highlightCommentId) {
          scrollToHighlightedComment();
        }
      } else {
        if (__DEV__) console.log('[CommentBottomSheet] bottomSheetRef가 null입니다!');
      }
    },
    close: () => {
      currentSheetIndexRef.current = -1;
      bottomSheetRef.current?.close();
    },
    expand: () => {
      const sheet = bottomSheetRef.current;
      if (sheet) {
        currentSheetIndexRef.current = 2;
        sheet.snapToIndex(2);
      }
    },
    snapToIndex: (index: number) => {
      currentSheetIndexRef.current = index;
      bottomSheetRef.current?.snapToIndex(index);
    },
  }), [highlightCommentId, scrollToHighlightedComment]);

  // 댓글 접기/펼치기
  const toggleCollapse = useCallback((commentId: number) => {
    setCollapsedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  // 답글 시작
  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo(comment);
    bottomSheetRef.current?.snapToIndex(2);
    onReplyComment?.(comment);
  }, [onReplyComment]);

  // 롱프레스 핸들러
  const handleLongPress = useCallback((comment: Comment) => {
    if (onLongPressComment) {
      onLongPressComment(comment);
    }
  }, [onLongPressComment]);

  // 신고 핸들러 (더미 - 실제 신고는 CommentItem에서 처리)
  const handleReport = useCallback((comment: Comment) => {
    logger.log('📢 댓글 신고 요청:', { commentId: comment.comment_id });
  }, []);

  // 렌더 아이템
  const renderItem = useCallback(({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      postUserId={postUserId}
      postId={postId}
      currentUserId={user?.user_id}
      isDark={isDark}
      modernTheme={modernTheme}
      onLike={onLikeComment}
      onReply={handleReply}
      onLongPress={handleLongPress}
      onEdit={onEditComment}
      onDelete={onDeleteComment}
      onReport={handleReport}
      onRefresh={onRefresh}
      collapsedComments={collapsedComments}
      onToggleCollapse={toggleCollapse}
      isAuthenticated={isAuthenticated}
      isHighlighted={item.comment_id === highlightCommentId}
    />
  ), [postUserId, postId, user?.user_id, isDark, modernTheme, onLikeComment, handleReply, handleLongPress, onEditComment, onDeleteComment, handleReport, onRefresh, collapsedComments, toggleCollapse, isAuthenticated, highlightCommentId]);

  // 키 추출
  const keyExtractor = useCallback((item: Comment) => `comment-${item.comment_id}`, []);

  // 헤더
  const ListHeader = useMemo(() => (
    <View style={{ paddingBottom: normalize(12) }}>
      {/* 베스트 댓글 */}
      {bestComments.length > 0 && (
        <View style={{
          backgroundColor: isDark ? 'rgba(251,191,36,0.1)' : '#FFFBEB',
          borderRadius: normalize(12),
          padding: normalize(12),
          marginBottom: normalize(12),
          borderWidth: 1,
          borderColor: isDark ? 'rgba(251,191,36,0.3)' : '#FEF3C7',
        }}>
          <HStack style={{ alignItems: 'center', marginBottom: normalize(8) }}>
            <MaterialCommunityIcons name="trophy-outline" size={normalize(16)} color="#fbbf24" />
            <RNText style={{
              fontSize: normalize(TYPOGRAPHY.body),
              fontFamily: 'Pretendard-SemiBold',
              color: '#fbbf24',
              marginLeft: normalize(6),
            }}>
              베스트 댓글
            </RNText>
          </HStack>
          {bestComments.slice(0, 2).map((comment) => (
            <CommentItem
              key={`best-${comment.comment_id}`}
              comment={comment}
              postUserId={postUserId}
              postId={postId}
              currentUserId={user?.user_id}
              isDark={isDark}
              modernTheme={modernTheme}
              onLike={onLikeComment}
              onReply={handleReply}
              onLongPress={handleLongPress}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onReport={handleReport}
              onRefresh={onRefresh}
              collapsedComments={collapsedComments}
              onToggleCollapse={toggleCollapse}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </View>
      )}
    </View>
  ), [bestComments, isDark, postUserId, postId, user?.user_id, modernTheme, onLikeComment, handleReply, handleLongPress, onEditComment, onDeleteComment, handleReport, onRefresh, collapsedComments, toggleCollapse, isAuthenticated]);

  // 푸터 (로딩)
  const ListFooter = useMemo(() => {
    if (!hasMore) return null;
    return (
      <View style={{ paddingVertical: normalize(16), alignItems: 'center' }}>
        <ActivityIndicator size="small" color={modernTheme.colors.primary} />
      </View>
    );
  }, [hasMore, modernTheme.colors.primary]);

  // 빈 목록
  const ListEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
          <ActivityIndicator size="large" color={modernTheme.colors.primary} />
          <RNText style={{
            marginTop: normalize(12),
            fontSize: normalize(14),
            color: modernTheme.text.secondary,
          }}>
            댓글을 불러오는 중...
          </RNText>
        </View>
      );
    }
    return (
      <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
        <MaterialCommunityIcons
          name="comment-outline"
          size={normalize(48)}
          color={modernTheme.text.tertiary}
        />
        <RNText style={{
          marginTop: normalize(12),
          fontSize: normalize(14),
          color: modernTheme.text.secondary,
        }}>
          첫 번째 댓글을 남겨보세요
        </RNText>
      </View>
    );
  }, [loading, modernTheme]);

  // 백드롭 렌더러
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // 푸터 렌더러 - FooterInputComponent를 사용하여 타이핑 시 부모 re-render 방지
  const footerBottomInset = insets.bottom + normalize(8);

  // 댓글 제출 핸들러 (FooterInputComponent에 전달)
  const handleFooterSubmit = useCallback(async (text: string, isAnonymous: boolean, parentCommentId?: number) => {
    await onSubmitComment(text, isAnonymous, parentCommentId);
    setReplyingTo(null);
    // 새 댓글 작성 후 목록 맨 아래로 스크롤 (시간순 정렬이므로 최신 댓글이 맨 아래)
    // 데이터 렌더링 후 스크롤
    setTimeout(() => {
      flatListRef.current?.scrollToEnd?.({ animated: true });
    }, 500);
  }, [onSubmitComment]);

  // 답글 취소 핸들러
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // 입력창 포커스 시 BottomSheet 최대 확장 (state 업데이트 없이 ref만 사용하여 재렌더링 방지)
  const handleFocusExpand = useCallback(() => {
    // 현재 최대 크기(95%)가 아니면 확장
    if (currentSheetIndexRef.current < 2) {
      currentSheetIndexRef.current = 2;
      // setCurrentSheetIndex 제거 - 불필요한 재렌더링 방지
      bottomSheetRef.current?.snapToIndex(2);
    }
  }, []);

  const renderFooter = useCallback(
    (footerProps: BottomSheetFooterProps) => (
      <BottomSheetFooter {...footerProps} bottomInset={footerBottomInset}>
        <FooterInputComponent
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onSubmit={handleFooterSubmit}
          isAuthenticated={isAuthenticated}
          modernTheme={modernThemeRef.current}
          isDark={isDarkRef.current}
          onFocusExpand={handleFocusExpand}
        />
      </BottomSheetFooter>
    ),
    [footerBottomInset, replyingTo, handleCancelReply, handleFooterSubmit, isAuthenticated, handleFocusExpand]
  );

  // BottomSheet가 닫힌 상태에서 터치 이벤트를 통과시키기 위한 상태
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents={isSheetOpen ? 'auto' : 'box-none'}
    >
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={{
        backgroundColor: modernTheme.bg.primary,
        borderTopLeftRadius: normalize(20),
        borderTopRightRadius: normalize(20),
      }}
      handleIndicatorStyle={{
        backgroundColor: modernTheme.text.tertiary,
        width: normalize(40),
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="none"
      android_keyboardInputMode="adjustResize"
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      onChange={(index) => {
        // 이전 index 저장 (state 대신 ref 사용)
        const prevIndex = currentSheetIndexRef.current;

        // ref만 업데이트 (state 업데이트 제거로 불필요한 re-render 방지)
        currentSheetIndexRef.current = index;

        // BottomSheet 열림/닫힘 상태 콜백 (열리거나 닫힐 때만)
        const isOpen = index >= 0;
        const wasOpen = prevIndex >= 0;
        if (isOpen !== wasOpen) {
          onOpenChange?.(isOpen);
          // pointerEvents 제어를 위한 상태 업데이트
          setIsSheetOpen(isOpen);
        }

        // BottomSheet가 닫힐 때만 키보드 해제
        if (index === -1) {
          Keyboard.dismiss();
        }
      }}
    >
      {/* 헤더 */}
      <View style={{
        paddingHorizontal: normalize(16),
        paddingBottom: normalize(12),
        borderBottomWidth: 1,
        borderBottomColor: modernTheme.bg.border,
      }}>
        <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <RNText style={{
            fontSize: normalize(18),
            fontFamily: 'Pretendard-Bold',
            color: modernTheme.text.primary,
          }}>
            댓글 {totalCount}개
          </RNText>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.close()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={normalize(24)}
              color={modernTheme.text.secondary}
            />
          </TouchableOpacity>
        </HStack>
      </View>

      {/* 댓글 목록 */}
      <BottomSheetFlatList
        ref={flatListRef}
        data={sortedComments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={{
          paddingHorizontal: normalize(16),
          paddingTop: normalize(12),
          paddingBottom: normalize(100),
        }}
        onEndReached={hasMore ? onLoadMore : undefined}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        onScrollToIndexFailed={(info) => {
          logger.warn('⚠️ [CommentBottomSheet] scrollToIndex 실패:', info);
          // 실패 시 수동으로 스크롤
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
          });
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      />
    </BottomSheet>
    </View>
  );
});

CommentBottomSheet.displayName = 'CommentBottomSheet';

export default CommentBottomSheet;
