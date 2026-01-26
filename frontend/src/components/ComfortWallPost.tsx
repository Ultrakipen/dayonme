// src/components/ComfortWallPost.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text as RNText,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert
} from 'react-native';
import { Text } from './ui/index';
import { useModernTheme } from '../contexts/ModernThemeContext';

// 숫자 포맷팅 함수 (쉼표 제거 - 더 강력한 버전)
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  // 먼저 숫자로 변환한 후 다시 문자열로 변환하여 모든 포맷팅 제거
  const cleanNumber = parseInt(String(num).replace(/[^0-9]/g, ''));
  return isNaN(cleanNumber) ? '0' : String(cleanNumber);
};

import {
  Card,
  // Button,
  IconButton,
  Menu,
  Divider
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  post_id: number;
  content: string;
  is_anonymous: boolean;
  user_id: number;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  tags?: string[]; // 태그 배열 추가
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  emotions?: Array<{
    emotion_id: number;
    name: string;
    icon: string;
  }>;
  comments?: Array<{
    comment_id: number;
    content: string;
    is_anonymous: boolean;
    user?: {
      nickname: string;
    };
  }>;
}

interface ComfortWallPostProps {
  post: Post;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onPostPress?: () => void;
  onEditPress?: (postId: number) => void;
  onDeletePress?: (postId: number) => void;
  liked?: boolean;
}

const ComfortWallPost: React.FC<ComfortWallPostProps> = ({
  post,
  onLikePress,
  onCommentPress,
  onPostPress,
  onEditPress,
  onDeletePress,
  liked = false
}) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDark } = useModernTheme();
  const [expanded, setExpanded] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [menuVisible, setMenuVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 현재 사용자가 게시물 작성자인지 확인
  const isAuthor = user?.user_id === post.user_id;

  // 게시물 클릭 처리
  const handlePostPress = () => {
    if (onPostPress) {
      onPostPress();
    } else {
      navigation.navigate('PostDetail', { postId: post.post_id, postType: 'comfort' });
    }
  };

  // 좋아요 클릭 처리
  const handleLikePress = () => {
    if (onLikePress) {
      onLikePress();
    }
    // 로컬 상태 업데이트 (UI 반응성을 위해)
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  // 댓글 클릭 처리
  const handleCommentPress = () => {
    if (onCommentPress) {
      onCommentPress();
    } else {
      navigation.navigate('PostDetail', { postId: post.post_id, postType: 'comfort' });
    }
  };

  // 수정 버튼 클릭
  const handleEditPress = () => {
    setMenuVisible(false);
    if (onEditPress) {
      onEditPress(post.post_id);
    } else {
      navigation.navigate('EditPost', { postId: post.post_id });
    }
  };

  // 삭제 버튼 클릭
  const handleDeletePress = () => {
    setMenuVisible(false);
    Alert.alert(
      '게시물 삭제',
      '정말로 이 게시물을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            if (onDeletePress) {
              onDeletePress(post.post_id);
            }
          }
        }
      ]
    );
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}일 전`;
    }
  };

  // 긴 텍스트 처리
  const shouldShowExpandButton = post.content.length > 150;
  const displayContent = expanded ? post.content :
    shouldShowExpandButton ? post.content.substring(0, 150) + '...' : post.content;

  // 동적 스타일
  const dynamicStyles = useMemo(() => ({
    postCard: {
      ...styles.postCard,
      backgroundColor: theme.card,
    },
    authorName: {
      ...styles.authorName,
      color: theme.text.primary,
    },
    postDate: {
      ...styles.postDate,
      color: theme.text.primarySecondary,
    },
    postContent: {
      ...styles.postContent,
      color: theme.text.primary,
    },
    expandButtonText: {
      ...styles.expandButtonText,
      color: theme.primary,
    },
    actionText: {
      ...styles.actionText,
      color: theme.text.primarySecondary,
    },
    commentUser: {
      ...styles.commentUser,
      color: theme.text.primary,
    },
    commentContent: {
      ...styles.commentContent,
      color: theme.text.primarySecondary,
    },
    moreComments: {
      ...styles.moreComments,
      color: theme.primary,
    },
  }), [theme]);

  return (
    <Card style={dynamicStyles.postCard} testID="comfort-wall-post">
      <Card.Content>
        {/* 게시물 헤더 */}
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <Text style={dynamicStyles.authorName}>
              {post.is_anonymous ? '익명' : post.user?.nickname || '사용자'}
            </Text>
            <Text style={dynamicStyles.postDate}>{formatDate(post.created_at)}</Text>
          </View>

          {/* 작성자에게만 메뉴 버튼 표시 */}
          {isAuthor && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                  testID="post-menu-button"
                  accessible={true}
                  accessibilityLabel="게시물 메뉴"
                  accessibilityHint="수정 또는 삭제"
                />
              }
            >
              <Menu.Item
                onPress={handleEditPress}
                title="수정"
                leadingIcon="pencil"
                testID="edit-menu-item"
              />
              <Divider />
              <Menu.Item
                onPress={handleDeletePress}
                title="삭제"
                leadingIcon="delete"
                titleStyle={{ color: '#f44336' }}
                testID="delete-menu-item"
              />
            </Menu>
          )}
        </View>

        {/* 감정 태그들 */}
        {post.emotions && post.emotions.length > 0 && (
          <View style={styles.emotionsContainer}>
            {post.emotions.slice(0, 3).map((emotion) => (
              <View key={emotion.emotion_id} style={styles.emotionTag}>
                <Text style={styles.emotionText}>{emotion.name}</Text>
              </View>
            ))}
            {post.emotions.length > 3 && (
              <Text style={styles.moreEmotions}>
                +{post.emotions.length - 3}
              </Text>
            )}
          </View>
        )}

        {/* 게시물 내용 */}
        <TouchableOpacity onPress={handlePostPress} activeOpacity={0.7} accessible={true} accessibilityLabel={`게시물 내용: ${post.content.substring(0, 50)}`} accessibilityRole="button">
          <Text style={dynamicStyles.postContent} testID="post-content">
            {displayContent}
          </Text>
          {shouldShowExpandButton && (
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={styles.expandButton}
              accessible={true}
              accessibilityLabel={expanded ? '접기' : '더 보기'}
              accessibilityRole="button"
            >
              <Text style={dynamicStyles.expandButtonText}>
                {expanded ? '접기' : '더 보기'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* 태그들 표시 */}
        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => {
              // 안전한 태그 이름 추출
              const tagName = typeof tag === 'string' ? tag : (tag?.name || '');
              if (!tagName) return null; // 유효하지 않은 태그는 렌더링하지 않음
              
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.tagChip} 
                  activeOpacity={0.7}
                  testID={`tag-${index}`}
                >
                  <Text style={styles.tagText}>#{tagName}</Text>
                </TouchableOpacity>
              );
            }).filter(Boolean)}
          </View>
        )}

        {/* 게시물 이미지 (있는 경우) */}
        {post.image_url && (
          <TouchableOpacity onPress={handlePostPress} style={styles.imageContainer} accessible={true} accessibilityLabel="게시물 이미지 보기" accessibilityRole="imagebutton">
            <Image
              source={{ uri: post.image_url, cache: 'force-cache' }}
              style={styles.image}
              testID="post-image"
              resizeMode="cover"
              fadeDuration={300}
              onLoad={() => setImageLoaded(true)}
              progressiveRenderingEnabled={true}
              accessible={true}
              accessibilityLabel="게시물 첨부 이미지"
            />
          </TouchableOpacity>
        )}

        {/* 게시물 작업 버튼 (좋아요, 댓글) */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleLikePress}
            style={[styles.actionButton, liked && styles.likedButton]}
            testID="like-button"
            accessible={true}
            accessibilityLabel={`좋아요 ${likeCount}개`}
            accessibilityRole="button"
            accessibilityState={{ selected: liked }}
          >
            <MaterialCommunityIcons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? '#ff4757' : theme.text.primarySecondary}
            />
            <Text style={[dynamicStyles.actionText, liked && styles.likedText]}>
              좋아요 {likeCount > 0 ? likeCount : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCommentPress}
            style={styles.actionButton}
            testID="comment-button"
            accessible={true}
            accessibilityLabel={`댓글 ${post.comment_count}개`}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="comment-outline"
              size={20}
              color={theme.text.primarySecondary}
            />
            <Text style={dynamicStyles.actionText}>
              댓글 {post.comment_count > 0 ? formatNumber(post.comment_count) : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 댓글 미리보기 (최대 2개) */}
        {post.comments && post.comments.length > 0 && (
          <View style={styles.commentsPreview}>
            {post.comments.slice(0, 2).map(comment => (
              <View key={comment.comment_id} style={styles.commentItem}>
                <Text style={dynamicStyles.commentUser}>
                  {comment.is_anonymous ? '익명' : comment.user?.nickname || '사용자'}:
                </Text>
                <Text style={dynamicStyles.commentContent}>
                  {comment.content.length > 50
                    ? comment.content.substring(0, 50) + '...'
                    : comment.content
                  }
                </Text>
              </View>
            ))}
            {post.comment_count > 2 && (
              <TouchableOpacity onPress={handleCommentPress} accessible={true} accessibilityLabel={`댓글 ${post.comment_count - 2}개 더 보기`} accessibilityRole="button">
                <Text style={dynamicStyles.moreComments}>
                  댓글 {formatNumber(post.comment_count - 2)}개 더 보기
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  postCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#333',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  emotionTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  emotionText: {
    fontSize: 12,
    color: '#333',
  },
  moreEmotions: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  expandButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#6200ee',
    fontFamily: 'Pretendard-Medium',
  },
  imageContainer: {
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    minHeight: 44,
    minWidth: 80,
  },
  likedButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Pretendard-Medium',
  },
  likedText: {
    color: '#ff4757',
  },
  commentsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  commentUser: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginRight: 6,
  },
  commentContent: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  moreComments: {
    fontSize: 14,
    color: '#6200ee',
    fontFamily: 'Pretendard-Medium',
    marginTop: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0095F6',
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#0095F6',
  },
});

export default ComfortWallPost;