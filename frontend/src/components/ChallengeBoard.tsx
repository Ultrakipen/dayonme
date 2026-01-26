// src/components/ChallengeBoard.tsx - 챌린지 소통 게시판 컴포넌트
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Card } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../styles/challengeDesignSystem';
// 임시 LinearGradient 대체
const LinearGradient = ({ children, colors, style, ...props }: any) => (
  <View style={[style, { backgroundColor: colors?.[0] || '#667eea' }]} {...props}>
    {children}
  </View>
);

interface BoardPost {
  id: number;
  user_id: number;
  username: string;
  nickname?: string;
  content: string;
  created_at: string;
  likes: number;
  isLiked: boolean;
  replies?: BoardPost[];
}

interface ChallengeBoardProps {
  challengeId: number;
  isParticipating: boolean;
}

const ChallengeBoard: React.FC<ChallengeBoardProps> = ({
  challengeId,
  isParticipating
}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 임시 데이터로 시작 (실제로는 API 호출)
  useEffect(() => {
    // 실제 구현시에는 challengeService.getBoardPosts(challengeId) 호출
    const mockPosts: BoardPost[] = [
      {
        id: 1,
        user_id: 1,
        username: "participant1",
        nickname: "감정탐험가",
        content: "오늘 챌린지 시작했는데 벌써 설레네요! 다들 화이팅해요 💪",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: 5,
        isLiked: false,
        replies: [
          {
            id: 2,
            user_id: 2,
            username: "participant2",
            nickname: "마음치유사",
            content: "저도 같은 마음이에요! 함께 힘내봐요 😊",
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            likes: 2,
            isLiked: false,
          }
        ]
      },
      {
        id: 3,
        user_id: 3,
        username: "participant3",
        nickname: "일상기록러",
        content: "2일차인데 벌써 변화가 느껴져요. 감정을 기록하니까 좀 더 객관적으로 볼 수 있는 것 같아요.",
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        likes: 8,
        isLiked: true,
      }
    ];
    
    setPosts(mockPosts);
  }, [challengeId]);

  const handleSubmitPost = async () => {
    if (!newPost.trim() || !isParticipating) return;
    
    setIsSubmitting(true);
    try {
      // 실제 구현시: await challengeService.createBoardPost(challengeId, newPost)
      const mockNewPost: BoardPost = {
        id: Date.now(),
        user_id: user?.user_id || 0,
        username: user?.username || 'anonymous',
        nickname: user?.nickname,
        content: newPost.trim(),
        created_at: new Date().toISOString(),
        likes: 0,
        isLiked: false,
      };
      
      setPosts([mockNewPost, ...posts]);
      setNewPost('');
      Alert.alert('성공', '게시글이 작성되었습니다.');
    } catch (error) {
      Alert.alert('오류', '게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (postId: number) => {
    // 실제 구현시: await challengeService.likeBoardPost(postId)
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  const renderPost = ({ item }: { item: BoardPost }) => (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.nickname || item.username).charAt(0)}
            </Text>
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>
              {item.nickname || item.username}
            </Text>
            <Text style={styles.postTime}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.likeButton, item.isLiked && styles.likedButton]}
          onPress={() => handleLikePost(item.id)}
        >
          <MaterialCommunityIcons 
            name={item.isLiked ? "heart" : "heart-outline"} 
            size={18} 
            color={item.isLiked ? "#e11d48" : "#64748b"} 
          />
          <Text style={[styles.likeCount, item.isLiked && styles.likedCount]}>
            {item.likes}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.postContent}>{item.content}</Text>
      
      {/* 답글 표시 */}
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesSection}>
          {item.replies.map((reply) => (
            <View key={reply.id} style={styles.replyItem}>
              <View style={styles.replyHeader}>
                <Text style={styles.replyAuthor}>
                  {reply.nickname || reply.username}
                </Text>
                <Text style={styles.replyTime}>
                  {formatTimeAgo(reply.created_at)}
                </Text>
              </View>
              <Text style={styles.replyContent}>{reply.content}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <MaterialCommunityIcons name="forum" size={20} color="#fff" />
          <Text style={styles.headerTitle}>소통 게시판</Text>
        </LinearGradient>
      </View>

      {/* 글 작성 영역 */}
      {isParticipating && (
        <Card style={styles.writeCard}>
          <View style={styles.writeContainer}>
            <TextInput
              style={styles.writeInput}
              placeholder="챌린지 중 느낀 점이나 응원의 말을 남겨보세요..."
              multiline
              numberOfLines={3}
              value={newPost}
              onChangeText={setNewPost}
              maxLength={200}
            />
            <View style={styles.writeActions}>
              <Text style={styles.charCount}>{newPost.length}/200</Text>
              <TouchableOpacity
                style={[styles.submitButton, (!newPost.trim() || isSubmitting) && styles.disabledButton]}
                onPress={handleSubmitPost}
                disabled={!newPost.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={16} color="#fff" />
                    <Text style={styles.submitButtonText}>게시</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      )}

      {/* 게시글 목록 */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="message-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>아직 게시글이 없습니다</Text>
            <Text style={styles.emptyDescription}>
              {isParticipating 
                ? "첫 번째 게시글을 작성해보세요!"
                : "챌린지에 참여하면 소통에 참여할 수 있습니다."
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#ffffff',
  },
  writeCard: {
    marginBottom: SPACING.cardGap,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  writeContainer: {
    padding: 16,
  },
  writeInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,  // 14→16
    backgroundColor: '#f8fafc',
  },
  writeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  charCount: {
    fontSize: 14,
    color: '#64748b',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,  // 14→16
    fontFamily: 'Pretendard-SemiBold',
  },
  postsList: {
    paddingBottom: 20,
  },
  postCard: {
    marginBottom: SPACING.cardGap,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,  // 14→16
    fontFamily: 'Pretendard-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 14,
    color: '#64748b',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  likedButton: {
    backgroundColor: '#fef2f2',
  },
  likeCount: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#64748b',
  },
  likedCount: {
    color: '#e11d48',
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 16,  // 14→16
    color: '#334155',
    lineHeight: 20,
  },
  repliesSection: {
    backgroundColor: '#f8fafc',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 14,
  },
  replyItem: {
    marginBottom: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  replyAuthor: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#475569',
  },
  replyTime: {
    fontSize: 14,
    color: '#64748b',
  },
  replyContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: '#374151',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: 16,  // 14→16
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChallengeBoard;