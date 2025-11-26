import React, { useState } from 'react';
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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import commentService from '../services/api/commentService';
import blockService from '../services/api/blockService';
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

interface InstagramCommentItemProps {
  comment: Comment;
  currentUserId?: number;
  isPostAuthor?: boolean;
  isReply?: boolean;
  depth?: number; // 답글 깊이 추가
  onReply?: (comment: Comment) => void;
  onEdit?: (commentId: number, newContent: string) => void;
  onDelete?: (commentId: number) => void;
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
  onReply,
  onEdit,
  onDelete,
  onUserProfile,
  onRefresh,
  onCommentBlocked,
}) => {
  const { theme, isDark } = useModernTheme();
  const [liked, setLiked] = useState(comment.is_liked || false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);

  const displayName = comment.is_anonymous ? '익명' : comment.user?.nickname || '사용자';
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

  // 댓글 좋아요
  const handleLike = async () => {
    try {
      const response = await commentService.likeComment(comment.comment_id);
      if (response.status === 'success' && response.data) {
        setLiked(response.data.is_liked);
        setLikeCount(response.data.like_count);
      }
    } catch (error) {
      console.error('댓글 좋아요 오류:', error);
      // 낙관적 업데이트 롤백
      setLiked(!liked);
      setLikeCount(liked ? likeCount + 1 : likeCount - 1);
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

  // 댓글 수정
  const handleEdit = () => {
    setShowActionSheet(false);
    if (Platform.OS === 'ios') {
      // iOS에서만 Alert.prompt 사용
      (Alert as any).prompt(
        '댓글 수정',
        '댓글을 수정해주세요.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '저장',
            onPress: async (newContent: string) => {
              if (newContent && newContent.trim() && onEdit) {
                try {
                  await commentService.editComment(comment.comment_id, newContent.trim());
                  onEdit(comment.comment_id, newContent.trim());
                  onRefresh?.();
                } catch (error) {
                  Alert.alert('오류', '댓글 수정 중 오류가 발생했습니다.');
                }
              }
            },
          },
        ],
        'plain-text',
        comment.content
      );
    } else {
      // Android에서는 일반 알림으로 처리
      Alert.alert(
        '댓글 수정',
        '댓글 수정 기능은 현재 개발 중입니다.',
        [{ text: '확인', style: 'default' }]
      );
    }
  };

  // 댓글 삭제 확인
  const handleDeleteConfirm = () => {
    setShowActionSheet(false);
    Alert.alert(
      '댓글 삭제',
      '이 댓글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await commentService.deleteComment(comment.comment_id);
              onDelete?.(comment.comment_id);
              onRefresh?.();
            } catch (error) {
              Alert.alert('오류', '댓글 삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
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
      await commentService.reportComment(comment.comment_id, reason);
      Alert.alert('신고 완료', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
    } catch (error) {
      Alert.alert('오류', '신고 접수 중 오류가 발생했습니다.');
    }
  };

  // 댓글 차단
  const handleBlockComment = () => {
    setShowActionSheet(false);
    setBlockModalVisible(true);
  };

  const handleBlockConfirm = async (reason?: BlockReason) => {
    try {
      console.log('🚫 댓글 차단 시도:', comment.comment_id);
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
    } catch (error) {
      console.error('❌ 댓글 차단 오류:', error);
      Alert.alert('오류', '댓글 차단에 실패했습니다.');
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
              ) : (
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
                <TouchableOpacity onPress={handleUserPress} disabled={comment.is_anonymous}>
                  <Text style={styles.userName}>
                    {displayName}
                    {isCommentAuthor && <Text style={styles.authorBadge}> 작성자</Text>}
                    <Text style={styles.commentTime}> {formatInstagramTime(comment.created_at)}</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {renderTaggedContent(comment.content)}

              {/* 감정 아이콘 섹션 */}
              <View style={styles.emotionSection}>
                <TouchableOpacity style={styles.emotionButton}>
                  <Text style={styles.emotionIcon}>❤️</Text>
                  <Text style={styles.emotionText}>사랑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.emotionButton}>
                  <Text style={styles.emotionIcon}>😊</Text>
                  <Text style={styles.emotionText}>기쁨</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.emotionButton}>
                  <Text style={styles.emotionIcon}>😭</Text>
                  <Text style={styles.emotionText}>슬픔</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.emotionButton}>
                  <Text style={styles.emotionIcon}>😮</Text>
                  <Text style={styles.emotionText}>놀람</Text>
                </TouchableOpacity>
              </View>

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

        {/* 답글 렌더링 */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <InstagramCommentItem
                key={reply.comment_id}
                comment={reply}
                currentUserId={currentUserId}
                isPostAuthor={isPostAuthor}
                isReply={true}
                depth={depth + 1}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onUserProfile={onUserProfile}
                onRefresh={onRefresh}
                onCommentBlocked={onCommentBlocked}
              />
            ))}
          </View>
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
    fontWeight: '600',
  },
  replyAvatarText: {
    fontSize: scaleFont(12),
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
    fontWeight: '600',
    color: theme.text.primary,
    marginRight: scaleSize(8),
    letterSpacing: -0.2,
  },
  authorBadge: {
    fontSize: scaleFont(12),
    fontWeight: '400',
    color: theme.text.tertiary,
  },
  commentTime: {
    fontSize: scaleFont(12),
    fontWeight: '400',
    color: theme.text.tertiary,
  },
  commentText: {
    fontSize: scaleFont(15),
    lineHeight: scaleFont(22),
    color: theme.text.primary,
    marginBottom: scaleSize(4),
    letterSpacing: -0.1,
  },
  taggedUser: {
    fontSize: scaleFont(15),
    lineHeight: scaleFont(22),
    color: isDark ? '#60a5fa' : '#3b82f6',
    fontWeight: '600',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSize(6),
  },
  timeText: {
    fontSize: scaleFont(12),
    fontWeight: '400',
    color: theme.text.tertiary,
    marginRight: scaleSize(16),
  },
  likeCountText: {
    fontSize: scaleFont(13),
    color: theme.text.secondary,
    fontWeight: '600',
    marginRight: scaleSize(16),
  },
  replyText: {
    fontSize: scaleFont(13),
    color: theme.text.secondary,
    fontWeight: '600',
    marginRight: scaleSize(16),
  },
  likeActionText: {
    fontSize: scaleFont(13),
    color: '#e91e63',
    fontWeight: '600',
    marginRight: scaleSize(16),
  },
  likeButton: {
    padding: scaleSize(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleSize(8),
  },
  emotionSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: scaleSize(4),
    marginBottom: scaleSize(8),
    paddingTop: scaleSize(8),
    borderTopWidth: 0.5,
    borderTopColor: theme.bg.border,
  },
  emotionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(4),
    backgroundColor: theme.bg.secondary,
    borderRadius: scaleSize(16),
    borderWidth: 0.5,
    borderColor: theme.bg.border,
    marginRight: scaleSize(8),
    marginBottom: scaleSize(4),
  },
  emotionIcon: {
    fontSize: scaleFont(16),
    marginRight: scaleSize(4),
  },
  emotionText: {
    fontSize: scaleFont(13),
    color: theme.text.secondary,
    fontWeight: '500',
    letterSpacing: -0.1,
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
});

export default InstagramCommentItem;