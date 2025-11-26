import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Card, Button, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { FONT_SIZES } from '../constants';

interface ComfortPost {
  post_id: number;
  title: string;
  content: string;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
}

const ComfortWallScreen: React.FC = () => {
  if (__DEV__) {
    console.log('ComfortWallScreen rendering...');
  }

  const { theme, isDark } = useModernTheme();

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: theme.colors.primary,
  };

  const [posts, setPosts] = useState<ComfortPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 샘플 데이터 로드
    const loadSampleData = () => {
      const samplePosts: ComfortPost[] = [
        {
          post_id: 1,
          title: "혼자서는 해결할 수 없는 고민이 있어요",
          content: "요즘 너무 많은 일이 겹쳐서 스트레스가 심해요. 어떻게 해야 할지 모르겠어요. 누군가와 이야기하고 싶어요.",
          is_anonymous: true,
          like_count: 12,
          comment_count: 5,
          created_at: new Date().toISOString()
        },
        {
          post_id: 2,
          title: "취업 준비가 너무 힘들어요",
          content: "몇 개월째 취업 준비를 하고 있는데 계속 떨어지고 있어요. 자신감도 많이 떨어지고 우울해지는 것 같아요.",
          is_anonymous: true,
          like_count: 8,
          comment_count: 3,
          created_at: new Date().toISOString()
        }
      ];
      
      setTimeout(() => {
        setPosts(samplePosts);
        setLoading(false);
      }, 1000);
    };

    loadSampleData();
  }, []);

  const handleCreatePost = () => {
    Alert.alert('게시물 작성', '게시물 작성 기능은 곧 추가될 예정입니다.');
  };

  const handleLike = (postId: number) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.post_id === postId 
          ? { ...post, like_count: post.like_count + 1 }
          : post
      )
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>게시물을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={[styles.header, {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border
        }]}>
          <Text style={[styles.title, { color: colors.text }]}>위로와 공감</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>따뜻한 위로와 공감을 나눠보세요</Text>
        </View>

        {/* 게시물 목록 */}
        <View style={styles.postsContainer}>
          {posts.map(post => (
            <Card key={post.post_id} style={[styles.postCard, {
              backgroundColor: colors.cardBackground,
              shadowColor: isDark ? '#ffffff' : '#000000',
              shadowOpacity: isDark ? 0.2 : 0.08,
              elevation: 3,
            }]}>
              <Card.Content>
                <Text style={[styles.postTitle, { color: theme.colors.text.primary }]}>{post.title}</Text>
                <Text style={[styles.postContent, { color: theme.colors.text.primarySecondary }]} numberOfLines={3}>
                  {post.content}
                </Text>
                <View style={styles.postMeta}>
                  <Text style={[styles.postDate, { color: theme.colors.text.primaryTertiary }]}>
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </Text>
                  <Text style={[styles.postAuthor, { color: theme.colors.text.primarySecondary }]}>
                    {post.is_anonymous ? '익명' : '사용자'}
                  </Text>
                </View>
              </Card.Content>
              <Card.Actions>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleLike(post.post_id)}
                >
                  <MaterialCommunityIcons name="heart-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.actionText, { color: theme.colors.text.primarySecondary }]}>{post.like_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialCommunityIcons name="comment-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.actionText, { color: theme.colors.text.primarySecondary }]}>{post.comment_count}</Text>
                </TouchableOpacity>
              </Card.Actions>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* 플로팅 액션 버튼 */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={handleCreatePost}
        label="고민 작성"
        color="#FFFFFF"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONT_SIZES.bodyLarge,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZES.bodyLarge,
  },
  postsContainer: {
    padding: 16,
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  postTitle: {
    fontSize: FONT_SIZES.h3,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    fontSize: FONT_SIZES.bodySmall,
    lineHeight: 20,
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postDate: {
    fontSize: FONT_SIZES.small,
  },
  postAuthor: {
    fontSize: FONT_SIZES.small,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: FONT_SIZES.small,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ComfortWallScreen;