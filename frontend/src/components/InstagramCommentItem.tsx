import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  ActionSheetIOS,
  Platform,
  Modal,
  Pressable,
  Dimensions,
  TextInput,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import commentService from '../services/api/commentService';
import blockService from '../services/api/blockService';
import reportService from '../services/api/reportService';
import { parseTaggedText, formatInstagramTime } from '../utils/commentUtils';
import { normalizeImageUrl } from '../utils/imageUtils';
import BlockReasonModal, { BlockReason } from './BlockReasonModal';
import { useModernTheme } from '../contexts/ModernThemeContext';

// 반응형 스케일링 (React Native 0.80 호환)
const BASE_WIDTH = 360;
const getScreenWidth = () => {
  try {
    const w = Dimensions.get('window').width;
    if (w > 0) return w;
  } catch (e) {}
  return BASE_WIDTH;
};
const scaleFont = (size: number) => {
  const scale = Math.min(Math.max(getScreenWidth() / BASE_WIDTH, 0.9), 1.3);
  return Math.round(size * scale);
};
const scaleSize = (size: number) => (getScreenWidth() / BASE_WIDTH) * size;

// 익명 사용자용 감정 캐릭터 배열
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
];

// 익명 감정 생성 함수 - 사용자 ID와 댓글 ID 기반으로 일관된 캐릭터 생성
const getAnonymousEmotion = (userId?: number, commentId?: number) => {
  const userSeed = userId || 1;
  const commentSeed = commentId || 0;
  const seed = (userSeed * 17 + commentSeed * 7) % EMOTION_CHARACTERS.length;
  return EMOTION_CHARACTERS[seed];
};

interface Comment {
  comment_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  like_count: number;
  created_at: string;
  parent_comment_id?: number;
  emotion_tag?: string; // 감정 태그
  user?: {
    nickname: string;
    profile_image_url?: string;
    is_author?: boolean;
  };
  replies?: Comment[];
  is_liked?: boolean;
}

interface InstagramCommentItemProps {
  comment: Comment;
  currentUserId?: number;
  isPostAuthor?: boolean;
  isReply?: boolean;
  depth?: number; // 답글 깊이 추가
  postType?: string; // 게시물 타입 (myday, comfort, etc.)
  postId?: number; // 게시물 ID
  onReply?: (comment: Comment) => void;
  onEdit?: (commentId: number, newContent: string) => void;
  onDelete?: (commentId: number) => void;
  onLike?: (commentId: number) => Promise<{ is_liked: boolean; like_count: number } | null>; // 좋아요 콜백
  onUserProfile?: (userId: number) => void;
  onRefresh?: () => void;
  onCommentBlocked?: (commentId: number) => void;
}

const InstagramCommentItem: React.FC<InstagramCommentItemProps> = ({
  comment,
  currentUserId,
  isPostAuthor = false,
  isReply = false,
  depth = 0,
  postType,
  postId,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onUserProfile,
  onRefresh,
  onCommentBlocked,
}) => {
  const { theme, isDark } = useModernTheme();
  const [liked, setLiked] = useState(comment.is_liked || false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);

  // 수정/삭제 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editInputRef = useRef<TextInput>(null);

  // 익명 사용자의 경우 감정 캐릭터 생성
  const anonymousEmotion = comment.is_anonymous
    ? getAnonymousEmotion(comment.user_id, comment.comment_id)
    : null;
  const displayName = comment.is_anonymous
    ? '익명'
    : comment.user?.nickname || '사용자';
  const isOwner = comment.user_id === currentUserId;
  const isCommentAuthor = comment.user?.is_author || isPostAuthor;

  const styles = getStyles(theme, isDark);

  // 태그된 텍스트 렌더링
  const renderTaggedContent = (content: string) => {
    const parts = parseTaggedText(content);
    
    return (
      <Text style={styles.commentText}>
        {parts.map((part, index) => {
          if (part.type === 'tag') {
            return (
              <Text
                key={index}
                style={styles.taggedUser}
                onPress={() => {
                  if (part.userId && onUserProfile) {
                    onUserProfile(part.userId);
                  }
                }}
              >
                {part.content}
              </Text>
            );
          }
          return (
            <Text key={index} style={styles.commentText}>
              {part.content}
            </Text>
          );
        })}
      </Text>
    );
  };

  // 댓글 좋아요 - 부모 컴포넌트의 onLike 콜백 사용
  const handleLike = async () => {
    // 낙관적 업데이트
    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      if (onLike) {
        const result = await onLike(comment.comment_id);
        if (result) {
          setLiked(result.is_liked);
          setLikeCount(result.like_count);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('댓글 좋아요 오류:', error);
      // 낙관적 업데이트 롤백
      setLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  // 댓글 길게 눌렀을 때
  const handleLongPress = () => {
    if (Platform.OS === 'ios') {
      const options = [];
      const destructiveIndex = [];
      let cancelButtonIndex = 0;

      if (isOwner) {
        options.push('수정하기', '삭제하기', '취소');
        destructiveIndex.push(1);
        cancelButtonIndex = 2;
      } else {
        options.push('신고하기', '차단하기', '취소');
        destructiveIndex.push(0, 1);
        cancelButtonIndex = 2;
      }

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: destructiveIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (isOwner) {
            if (buttonIndex === 0) handleEdit();
            else if (buttonIndex === 1) handleDeleteConfirm();
          } else {
            if (buttonIndex === 0) handleReport();
            else if (buttonIndex === 1) handleBlockComment();
          }
        }
      );
    } else {
      setShowActionSheet(true);
    }
  };

  // 댓글 수정 - 커스텀 모달 열기
  const handleEdit = () => {
    setShowActionSheet(false);
    setEditText(comment.content);
    setShowEditModal(true);
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  // 댓글 수정 제출
  const handleEditSubmit = async () => {
    if (!editText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onEdit) {
        onEdit(comment.comment_id, editText.trim());
      }
      setShowEditModal(false);
      onRefresh?.();
    } catch (error) {
      Alert.alert('오류', '댓글 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 삭제 확인 - 커스텀 모달 열기
  const handleDeleteConfirm = () => {
    setShowActionSheet(false);
    setShowDeleteModal(true);
  };

  // 댓글 삭제 실행
  const handleDeleteExecute = () => {
    setShowDeleteModal(false);
    onDelete?.(comment.comment_id);
  };

  // 댓글 신고
  const handleReport = () => {
    setShowActionSheet(false);
    Alert.alert(
      '댓글 신고',
      '이 댓글을 신고하는 이유를 선택해주세요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '스팸', onPress: () => submitReport('스팸') },
        { text: '부적절한 내용', onPress: () => submitReport('부적절한 내용') },
        { text: '욕설/혐오표현', onPress: () => submitReport('욕설/혐오표현') },
        { text: '기타', onPress: () => submitReport('기타') },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    try {
      // reason을 report_type으로 매핑
      const reportTypeMap: { [key: string]: string } = {
        '스팸': 'spam',
        '부적절한 내용': 'inappropriate',
        '욕설/혐오표현': 'harassment',
        '기타': 'other',
      };

      const reportType = reportTypeMap[reason] || 'other';

      await reportService.reportComment(
        comment.comment_id,
        reportType as 'spam' | 'inappropriate' | 'harassment' | 'violence' | 'misinformation' | 'other',
        reason,
        '사용자 신고'
      );

      Alert.alert('신고 완료', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
    } catch (error: any) {
      if (__DEV__) console.error('댓글 신고 오류:', error);
      const errorMessage = error?.response?.data?.message || error?.message || '신고 접수 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    }
  };

  // 댓글 차단
  const handleBlockComment = () => {
    setShowActionSheet(false);
    setBlockModalVisible(true);
  };

  const handleBlockConfirm = async (reason?: BlockReason) => {
    try {
      if (__DEV__) console.log('🚫 댓글 차단 시도:', comment.comment_id);
      await blockService.blockContent({
        contentType: 'comment',
        contentId: comment.comment_id,
        reason,
      });
      Alert.alert('완료', '댓글이 차단되었습니다.');
      if (onCommentBlocked) {
        onCommentBlocked(comment.comment_id);
      }
      onRefresh?.();
    } catch (error: any) {
      if (__DEV__) console.error('❌ 댓글 차단 오류:', error);
      const errorMessage = error?.response?.data?.message;
      if (errorMessage?.includes('이미 차단')) {
        Alert.alert('알림', '이미 차단한 댓글입니다.');
      } else {
        Alert.alert('오류', '댓글 차단에 실패했습니다.');
      }
    }
  };

  // 사용자 프로필 터치
  const handleUserPress = () => {
    if (!comment.is_anonymous && comment.user_id && onUserProfile) {
      onUserProfile(comment.user_id);
    }
  };

  return (
    <>
      <View style={[styles.container, isReply && styles.replyContainer]}>
        <TouchableWithoutFeedback onLongPress={handleLongPress}>
          <View style={styles.commentContent}>
            {/* 아바타와 사용자 정보 */}
            <TouchableOpacity onPress={handleUserPress} disabled={comment.is_anonymous}>
              {!comment.is_anonymous && comment.user?.profile_image_url ? (
                <Image
                  source={{ uri: normalizeImageUrl(comment.user.profile_image_url) }}
                  style={[
                    styles.avatar,
                    isReply && styles.replyAvatar,
                    { backgroundColor: 'transparent' }
                  ]}
                />
              ) : comment.is_anonymous && anonymousEmotion ? (
                // 익명 사용자: 감정 이모지 아바타
                <View style={[
                  styles.avatar,
                  isReply && styles.replyAvatar,
                  { backgroundColor: anonymousEmotion.color }
                ]}>
                  <Text style={[styles.avatarEmoji, isReply && styles.replyAvatarEmoji]}>
                    {anonymousEmotion.emoji}
                  </Text>
                </View>
              ) : (
                // 일반 사용자 (프로필 사진 없음)
                <View style={[styles.avatar, isReply && styles.replyAvatar]}>
                  <Text style={[styles.avatarText, isReply && styles.replyAvatarText]}>
                    {displayName[0]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 댓글 본문 */}
            <View style={styles.commentBody}>
              <View style={styles.commentHeader}>
                <Text style={styles.userName}>
                  {displayName}
                </Text>
                {/* 감정 태그 배지 */}
                {comment.emotion_tag && (() => {
                  const emotion = EMOTION_CHARACTERS.find(e => e.label === comment.emotion_tag);
                  const emotionColor = emotion?.color || '#FFD700';
                  return (
                    <View style={[
                      styles.emotionTagBadge,
                      { backgroundColor: emotionColor + '30', borderColor: emotionColor }
                    ]}>
                      <Text style={[styles.emotionTagText, { color: emotionColor }]}>
                        #{comment.emotion_tag}
                      </Text>
                    </View>
                  );
                })()}
                {isCommentAuthor && (
                  <View style={styles.authorBadgeContainer}>
                    <Text style={styles.authorBadge}>작성자</Text>
                  </View>
                )}
                <Text style={styles.commentTime}> {formatInstagramTime(comment.created_at)}</Text>
              </View>

              {renderTaggedContent(comment.content)}

              {/* 댓글 액션들 */}
              <View style={styles.commentActions}>
                <Text style={styles.timeText}>{formatInstagramTime(comment.created_at)}</Text>
                
                {likeCount > 0 && (
                  <Text style={styles.likeCountText}>좋아요 {likeCount}개</Text>
                )}
                
                <TouchableOpacity onPress={handleLike}>
                  <Text style={styles.likeActionText}>{liked ? '좋아요 취소' : '좋아요'}</Text>
                </TouchableOpacity>
                
                {onReply && (
                  <TouchableOpacity onPress={() => onReply(comment)}>
                    <Text style={styles.replyText}>답글 달기</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 좋아요 버튼 */}
            <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
              <MaterialCommunityIcons
                name={liked ? "heart" : "heart-outline"}
                size={18}
                color={liked ? "#e91e63" : "#666666"}
              />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>

        {/* 답글 렌더링 - 최대 1단계 들여쓰기만 허용 (인스타그램 스타일) */}
        {comment.replies && comment.replies.length > 0 && depth < 1 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <InstagramCommentItem
                key={reply.comment_id}
                comment={reply}
                currentUserId={currentUserId}
                isPostAuthor={isPostAuthor}
                isReply={true}
                depth={1}
                postType={postType}
                postId={postId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onLike={onLike}
                onUserProfile={onUserProfile}
                onRefresh={onRefresh}
                onCommentBlocked={onCommentBlocked}
              />
            ))}
          </View>
        )}
        {/* depth >= 1인 경우 답글의 답글은 같은 레벨로 표시 */}
        {comment.replies && comment.replies.length > 0 && depth >= 1 && (
          <>
            {comment.replies.map((reply) => (
              <InstagramCommentItem
                key={reply.comment_id}
                comment={reply}
                currentUserId={currentUserId}
                isPostAuthor={isPostAuthor}
                isReply={true}
                depth={1}
                postType={postType}
                postId={postId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onLike={onLike}
                onUserProfile={onUserProfile}
                onRefresh={onRefresh}
                onCommentBlocked={onCommentBlocked}
              />
            ))}
          </>
        )}
      </View>

      {/* Android용 액션 시트 */}
      {showActionSheet && Platform.OS === 'android' && (
        <Modal transparent visible={showActionSheet} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowActionSheet(false)}>
            <View style={styles.actionSheet}>
              {isOwner ? (
                <>
                  <TouchableOpacity style={styles.actionItem} onPress={handleEdit}>
                    <Text style={styles.actionText}>수정하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionItem} onPress={handleDeleteConfirm}>
                    <Text style={[styles.actionText, styles.destructiveText]}>삭제하기</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.actionItem} onPress={handleReport}>
                    <Text style={[styles.actionText, styles.destructiveText]}>신고하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionItem} onPress={handleBlockComment}>
                    <Text style={[styles.actionText, styles.destructiveText]}>차단하기</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.actionItem} onPress={() => setShowActionSheet(false)}>
                <Text style={styles.actionText}>취소</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      <BlockReasonModal
        visible={blockModalVisible}
        onClose={() => setBlockModalVisible(false)}
        onBlock={handleBlockConfirm}
        targetName="이 댓글"
      />

      {/* 댓글 수정 모달 */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.editModalOverlay}
        >
          <Pressable
            style={styles.editModalOverlay}
            onPress={() => setShowEditModal(false)}
          >
            <Pressable style={[styles.editModalContainer, { backgroundColor: theme.bg.card }]} onPress={e => e.stopPropagation()}>
              <View style={styles.editModalHeader}>
                <Text style={[styles.editModalTitle, { color: theme.text.primary }]}>댓글 수정</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={theme.text.secondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                ref={editInputRef}
                style={[styles.editTextInput, {
                  backgroundColor: theme.bg.secondary,
                  color: theme.text.primary,
                  borderColor: theme.bg.border,
                }]}
                value={editText}
                onChangeText={setEditText}
                placeholder="댓글을 입력하세요..."
                placeholderTextColor={theme.text.tertiary}
                multiline
                maxLength={500}
                autoFocus
              />

              <View style={styles.editModalFooter}>
                <Text style={[styles.charCount, { color: theme.text.tertiary }]}>
                  {editText.length}/500
                </Text>
                <View style={styles.editModalButtons}>
                  <TouchableOpacity
                    style={[styles.editModalButton, styles.cancelButton, { borderColor: theme.bg.border }]}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={[styles.editModalButtonText, { color: theme.text.secondary }]}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.editModalButton,
                      styles.saveButton,
                      (!editText.trim() || isSubmitting) && styles.disabledButton
                    ]}
                    onPress={handleEditSubmit}
                    disabled={!editText.trim() || isSubmitting}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSubmitting ? '저장 중...' : '저장'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* 댓글 삭제 확인 모달 */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          style={styles.deleteModalOverlay}
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={[styles.deleteModalContainer, { backgroundColor: theme.bg.card }]}>
            <View style={styles.deleteModalIcon}>
              <MaterialCommunityIcons name="delete-outline" size={48} color="#FF3B30" />
            </View>
            <Text style={[styles.deleteModalTitle, { color: theme.text.primary }]}>댓글 삭제</Text>
            <Text style={[styles.deleteModalMessage, { color: theme.text.secondary }]}>
              이 댓글을 삭제하시겠습니까?{'\n'}삭제된 댓글은 복구할 수 없습니다.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteCancelButton, { borderColor: theme.bg.border }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.deleteModalButtonText, { color: theme.text.secondary }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteConfirmButton]}
                onPress={handleDeleteExecute}
              >
                <Text style={styles.deleteConfirmButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: theme.bg.card,
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    borderBottomWidth: 0.5,
    borderBottomColor: theme.bg.border,
  },
  replyContainer: {
    paddingLeft: scaleSize(48),
    backgroundColor: theme.bg.secondary,
  },
  commentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(18),
    backgroundColor: theme.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSize(12),
  },
  replyAvatar: {
    width: scaleSize(28),
    height: scaleSize(28),
    borderRadius: scaleSize(14),
  },
  avatarText: {
    color: theme.bg.primary,
    fontSize: scaleFont(14),
    fontFamily: 'Pretendard-SemiBold',
  },
  replyAvatarText: {
    fontSize: scaleFont(12),
  },
  avatarEmoji: {
    fontSize: scaleFont(22),
  },
  replyAvatarEmoji: {
    fontSize: scaleFont(18),
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(2),
  },
  userName: {
    fontSize: scaleFont(14),
    fontFamily: 'Pretendard-SemiBold',
    color: theme.text.primary,
    marginRight: scaleSize(6),
    letterSpacing: -0.2,
  },
  emotionTagBadge: {
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(2),
    borderRadius: scaleSize(10),
    marginRight: scaleSize(6),
    borderWidth: 1,
  },
  emotionTagText: {
    fontSize: scaleFont(11),
    fontFamily: 'Pretendard-SemiBold',
  },
  authorBadgeContainer: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(2),
    borderRadius: scaleSize(10),
    marginRight: scaleSize(6),
  },
  authorBadge: {
    fontSize: scaleFont(11),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  commentTime: {
    fontSize: scaleFont(12),
    fontFamily: 'Pretendard-Regular',
    color: theme.text.tertiary,
  },
  commentText: {
    fontSize: scaleFont(13),
    lineHeight: scaleFont(20),
    color: theme.text.primary,
    marginBottom: scaleSize(4),
    letterSpacing: -0.1,
  },
  taggedUser: {
    fontSize: scaleFont(15),
    lineHeight: scaleFont(22),
    color: isDark ? '#60a5fa' : '#3b82f6',
    fontFamily: 'Pretendard-SemiBold',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSize(6),
  },
  timeText: {
    fontSize: scaleFont(12),
    fontFamily: 'Pretendard-Regular',
    color: theme.text.tertiary,
    marginRight: scaleSize(16),
  },
  likeCountText: {
    fontSize: scaleFont(13),
    color: theme.text.secondary,
    fontFamily: 'Pretendard-SemiBold',
    marginRight: scaleSize(16),
  },
  replyText: {
    fontSize: scaleFont(13),
    color: theme.text.secondary,
    fontFamily: 'Pretendard-SemiBold',
    marginRight: scaleSize(16),
  },
  likeActionText: {
    fontSize: scaleFont(13),
    color: '#e91e63',
    fontFamily: 'Pretendard-SemiBold',
    marginRight: scaleSize(16),
  },
  likeButton: {
    padding: scaleSize(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleSize(8),
  },
  repliesContainer: {
    marginTop: scaleSize(8),
    marginLeft: scaleSize(36),
    borderLeftWidth: 1,
    borderLeftColor: theme.bg.border,
    paddingLeft: scaleSize(12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as 'flex-end',
  },
  actionSheet: {
    backgroundColor: theme.bg.card,
    borderTopLeftRadius: scaleSize(20),
    borderTopRightRadius: scaleSize(20),
    paddingTop: scaleSize(8),
    paddingBottom: scaleSize(32),
  },
  actionItem: {
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(24),
    borderBottomWidth: 0.5,
    borderBottomColor: theme.bg.border,
  },
  actionText: {
    fontSize: scaleFont(16),
    color: theme.text.primary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  destructiveText: {
    color: '#FF3B30',
  },

  // 수정 모달 스타일
  editModalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleSize(20),
  },
  editModalContainer: {
    width: '100%',
    maxWidth: scaleSize(340),
    borderRadius: scaleSize(16),
    padding: scaleSize(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSize(16),
  },
  editModalTitle: {
    fontSize: scaleFont(18),
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
  },
  editTextInput: {
    borderWidth: 1,
    borderRadius: scaleSize(12),
    padding: scaleSize(14),
    fontSize: scaleFont(15),
    minHeight: scaleSize(100),
    maxHeight: scaleSize(200),
    textAlignVertical: 'top',
    letterSpacing: -0.1,
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleSize(16),
  },
  charCount: {
    fontSize: scaleFont(12),
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: scaleSize(8),
  },
  editModalButton: {
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(20),
    borderRadius: scaleSize(10),
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  editModalButtonText: {
    fontSize: scaleFont(14),
    fontFamily: 'Pretendard-SemiBold',
  },
  saveButtonText: {
    fontSize: scaleFont(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#ffffff',
  },

  // 삭제 모달 스타일
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleSize(20),
  },
  deleteModalContainer: {
    width: '100%',
    maxWidth: scaleSize(300),
    borderRadius: scaleSize(20),
    padding: scaleSize(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalIcon: {
    marginBottom: scaleSize(16),
  },
  deleteModalTitle: {
    fontSize: scaleFont(20),
    fontFamily: 'Pretendard-Bold',
    marginBottom: scaleSize(8),
    letterSpacing: -0.3,
  },
  deleteModalMessage: {
    fontSize: scaleFont(14),
    textAlign: 'center',
    lineHeight: scaleFont(20),
    marginBottom: scaleSize(24),
    letterSpacing: -0.1,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: scaleSize(12),
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: scaleSize(14),
    borderRadius: scaleSize(12),
    alignItems: 'center',
  },
  deleteCancelButton: {
    borderWidth: 1,
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  deleteModalButtonText: {
    fontSize: scaleFont(15),
    fontFamily: 'Pretendard-SemiBold',
  },
  deleteConfirmButtonText: {
    fontSize: scaleFont(15),
    fontFamily: 'Pretendard-SemiBold',
    color: '#ffffff',
  },
});

export default InstagramCommentItem;