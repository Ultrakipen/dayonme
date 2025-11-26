import React, { memo } from 'react';
import { View, Text as RNText, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { Text } from '../ui';

interface MemoizedCardProps {
  title: string;
  content: string;
  imageUrl?: string;
  onPress?: () => void;
  footer?: React.ReactNode;
  timestamp?: string;
  authorName?: string;
  authorImageUrl?: string;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  onLike?: () => void;
  onComment?: () => void;
}

// 카드 컴포넌트 (props가 변경되지 않으면 리렌더링하지 않음)
const MemoizedCardComponent: React.FC<MemoizedCardProps> = ({
  title,
  content,
  imageUrl,
  onPress,
  footer,
  timestamp,
  authorName,
  authorImageUrl,
  isLiked = false,
  likesCount = 0,
  commentsCount = 0,
  onLike,
  onComment,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {authorName && (
        <View style={styles.authorContainer}>
          {authorImageUrl && (
            <Image
              source={{ uri: authorImageUrl }}
              style={styles.authorImage}
            />
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
          </View>
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content} numberOfLines={3}>
        {content}
      </Text>

      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statButton}
          onPress={onLike}
          disabled={!onLike}
        >
          <Text style={[styles.statText, isLiked && styles.likedText]}>
            좋아요 {likesCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.statButton}
          onPress={onComment}
          disabled={!onComment}
        >
          <Text style={styles.statText}>댓글 {commentsCount}</Text>
        </TouchableOpacity>
      </View>

      {footer && <View style={styles.footer}>{footer}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  likedText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});

// memo로 컴포넌트를 메모이제이션하여 불필요한 리렌더링 방지
export const MemoizedCard = memo(MemoizedCardComponent);