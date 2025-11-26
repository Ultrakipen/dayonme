// components/InstagramThemed/InstagramPost.tsx - 인스타그램 스타일 포스트 컴포넌트
import React, { useState } from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { StyledText, TimestampText, HashtagText } from './StyledText';
import { PostCard } from './StyledCard';
import { InstagramAvatar } from './ModernAvatar';
import { StyledButton } from './StyledButton';

interface InstagramPostProps {
  post: {
    id: number;
    title?: string;
    content: string;
    author?: string;
    isAnonymous?: boolean;
    timestamp: string;
    likeCount?: number;
    commentCount?: number;
    tags?: string[];
    emotion?: string;
    emotionIcon?: string;
  };
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onUserPress?: (userId: number) => void;
  isLiked?: boolean;
  showActions?: boolean;
  style?: ViewStyle;
}

export const InstagramPost: React.FC<InstagramPostProps> = ({
  post,
  onLike,
  onComment,
  onUserPress,
  isLiked = false,
  showActions = true,
  style,
}) => {
  const { theme } = useModernTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // 텍스트 길이에 따른 더보기/줄이기 기능
  const shouldShowMore = post.content.length > 150;
  const displayContent = shouldShowMore && !isExpanded 
    ? post.content.substring(0, 150) + '...' 
    : post.content;

  // 해시태그와 일반 텍스트 분리
  const renderContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[^\s#]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <HashtagText key={index}>
            {part}
          </HashtagText>
        );
      }
      return <StyledText key={index} variant="postText">{part}</StyledText>;
    });
  };

  return (
    <PostCard style={[{ margin: 0, marginBottom: theme.spacing.md }, style]}>
      {/* 포스트 헤더 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
      }}>
        <InstagramAvatar
          size="small"
          username={post.isAnonymous ? '익명' : post.author || '사용자'}
          onPress={() => !post.isAnonymous && onUserPress?.(post.id)}
        />
        
        <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
          <StyledText variant="username" color="primary">
            {post.isAnonymous ? '익명' : post.author || '사용자'}
          </StyledText>
          <TimestampText>
            {new Date(post.timestamp).toLocaleDateString()}
          </TimestampText>
        </View>

        {/* 감정 표시 */}
        {post.emotion && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.light.surface,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
            borderRadius: theme.spacing.sm,
          }}>
            <StyledText variant="caption">{post.emotionIcon}</StyledText>
            <StyledText variant="captionSmall" color="secondary" style={{ marginLeft: theme.spacing.xs }}>
              {post.emotion}
            </StyledText>
          </View>
        )}
      </View>

      {/* 포스트 내용 */}
      <View style={{
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
      }}>
        {/* 제목 (있는 경우) */}
        {post.title && (
          <StyledText variant="h4" color="primary" style={{ marginBottom: theme.spacing.sm }}>
            {post.title}
          </StyledText>
        )}

        {/* 본문 */}
        <View>
          {renderContent(displayContent)}
          {shouldShowMore && (
            <TouchableOpacity 
              onPress={() => setIsExpanded(!isExpanded)}
              style={{ marginTop: theme.spacing.xs }}
            >
              <StyledText variant="caption" color="secondary">
                {isExpanded ? '줄이기' : '더보기'}
              </StyledText>
            </TouchableOpacity>
          )}
        </View>

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: theme.spacing.sm,
          }}>
            {post.tags.map((tag, index) => (
              <HashtagText key={index} style={{ marginRight: theme.spacing.sm }}>
                #{tag}
              </HashtagText>
            ))}
          </View>
        )}
      </View>

      {/* 액션 버튼들 */}
      {showActions && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral[200],
          marginTop: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
        }}>
          <TouchableOpacity
            onPress={() => onLike?.(post.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: theme.spacing.lg,
            }}
          >
            <IconButton
              icon={isLiked ? "heart" : "heart-outline"}
              iconColor={isLiked ? '#FF3040' : theme.colors.neutral[500]}
              size={20}
              style={{ margin: 0 }}
            />
            <StyledText variant="caption" color="secondary">
              {post.likeCount || 0}
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onComment?.(post.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: theme.spacing.lg,
            }}
          >
            <IconButton
              icon="comment-outline"
              iconColor={theme.colors.neutral[500]}
              size={20}
              style={{ margin: 0 }}
            />
            <StyledText variant="caption" color="secondary">
              {post.commentCount || 0}
            </StyledText>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {/* 응원하기 버튼 */}
          <StyledButton
            title="응원하기"
            variant="outline"
            size="small"
            onPress={() => onComment?.(post.id)}
          />
        </View>
      )}
    </PostCard>
  );
};