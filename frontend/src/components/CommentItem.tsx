// src/components/CommentItem.tsx
import React, { useState } from 'react';
import { View, Text as RNText, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Text } from './ui';
import { removeCommentId } from '../utils/commentUtils';
import blockService from '../services/api/blockService';
import BlockReasonModal, { BlockReason } from './BlockReasonModal';

interface CommentItemProps {
  id: number;
  content: string;
  userName: string;
  userId?: number;
  currentUserId?: number;
  isAnonymous: boolean;
  createdAt: string;
  likeCount?: number;
  isPostAuthor?: boolean;
  profileImage?: string;
  onReply?: () => void;
  onLike?: () => void;
  onEdit?: (commentId: number, newContent: string) => void;
  onDelete?: (commentId: number) => void;
  onUserBlocked?: (userId: number) => void;
  onCommentBlocked?: (commentId: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  id,
  content,
  userName,
  userId,
  currentUserId,
  isAnonymous,
  createdAt,
  likeCount = 0,
  isPostAuthor = false,
  profileImage,
  onReply,
  onLike,
  onEdit,
  onDelete,
  onUserBlocked,
  onCommentBlocked,
}) => {
  const displayName = isAnonymous ? '익명' : userName;
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).replace(/\./g, '.').replace(/\s/g, ' ')
    : '';

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [blockModalVisible, setBlockModalVisible] = useState(false);

  const handleBlockUser = () => {
    if (userId && onUserBlocked) {
      onUserBlocked(userId);
    }
  };

  const handleBlockComment = () => {
    setBlockModalVisible(true);
  };

  const handleBlockConfirm = async (reason?: BlockReason) => {
    try {
      await blockService.blockContent({
        contentType: 'comment',
        contentId: id,
        reason,
      });
      Alert.alert('완료', '댓글이 차단되었습니다.');
      if (onCommentBlocked) {
        onCommentBlocked(id);
      }
    } catch (error) {
      console.error('댓글 차단 오류:', error);
      Alert.alert('오류', '댓글 차단에 실패했습니다.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim().length === 0) {
      Alert.alert('오류', '댓글 내용을 입력해주세요.');
      return;
    }
    if (editContent.trim().length > 300) {
      Alert.alert('오류', '댓글은 300자 이하로 입력해주세요.');
      return;
    }
    if (onEdit) {
      onEdit(id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      '댓글 삭제',
      '정말로 이 댓글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(id);
            }
          }
        }
      ]
    );
  };

  const isOwner = userId === currentUserId;

  // comment_id 제거한 깨끗한 내용
  const displayContent = removeCommentId(content);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* 프로필 이미지 */}
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <FastImage
              source={{
                uri: profileImage,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable
              }}
              style={styles.profileImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={[styles.profileImage, styles.profilePlaceholder]}>
              <Text style={styles.profilePlaceholderText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.userInfoRow}>
            <Text style={styles.userName}>
              {displayName}
              {isPostAuthor && <Text style={styles.authorBadge}> 작성자</Text>}
            </Text>
            {!isAnonymous && userId && onUserBlocked && (
              <TouchableOpacity onPress={handleBlockUser} style={styles.blockButton}>
                <Text style={styles.blockButtonText}>차단</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>

      {isEditing ? (
        <>
          <TextInput
            style={styles.editInput}
            value={editContent}
            onChangeText={setEditContent}
            multiline
            placeholder="댓글을 입력하세요..."
            maxLength={300}
          />
          <View style={styles.editButtons}>
            <TouchableOpacity onPress={handleCancelEdit} style={[styles.editButton, styles.cancelButton]}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveEdit} style={[styles.editButton, styles.saveButton]}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.content} testID="content">{displayContent}</Text>

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

          <View style={styles.footer}>
            {onLike && (
              <TouchableOpacity onPress={onLike} style={styles.button}>
                <Text style={styles.buttonText}>공감 {likeCount > 0 ? likeCount : ''}</Text>
              </TouchableOpacity>
            )}
            {onReply && (
              <TouchableOpacity onPress={onReply} style={styles.button}>
                <Text style={styles.buttonText}>답글</Text>
              </TouchableOpacity>
            )}
            {isOwner ? (
              <>
                <TouchableOpacity onPress={handleEdit} style={styles.button}>
                  <Text style={styles.buttonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.button}>
                  <Text style={[styles.buttonText, styles.deleteText]}>삭제</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {onCommentBlocked && (
                  <TouchableOpacity onPress={handleBlockComment} style={styles.button}>
                    <Text style={[styles.buttonText, styles.blockTextButton]}>차단</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </>
      )}

      <BlockReasonModal
        visible={blockModalVisible}
        onClose={() => setBlockModalVisible(false)}
        onBlock={handleBlockConfirm}
        targetName="이 댓글"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  // 프로필 이미지
  profileImageContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profilePlaceholder: {
    backgroundColor: '#E1E8ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#657786',
  },
  // 콘텐츠 영역
  contentWrapper: {
    flex: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
  },
  authorBadge: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
    marginLeft: 6,
  },
  blockButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
  },
  blockButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    lineHeight: 18,
    color: '#718096',
  },
  // 댓글 내용
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1A202C',
    marginBottom: 12,
    marginLeft: 56,
  },
  // 감정 섹션
  emotionSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 12,
    marginLeft: 56,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  emotionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    marginBottom: 6,
  },
  emotionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  emotionText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
  },
  // 버튼 영역
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: 56,
  },
  button: {
    marginRight: 20,
    paddingVertical: 4,
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#718096',
    fontWeight: '600',
  },
  deleteText: {
    color: '#1A202C',
  },
  blockTextButton: {
    color: '#E53E3E',
  },
  // 수정 모드
  editInput: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    lineHeight: 24,
    color: '#1A202C',
    marginBottom: 12,
    marginLeft: 56,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F7FAFC',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginLeft: 56,
  },
  editButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#EDF2F7',
  },
  saveButton: {
    backgroundColor: '#1A1A1A',
  },
  cancelButtonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4A5568',
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CommentItem;
