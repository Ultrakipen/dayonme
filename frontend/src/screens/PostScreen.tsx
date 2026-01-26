// src/screens/PostScreen.tsx
import React, { useEffect, useState } from 'react';
import { TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import postService from '../services/api/postService';
import { Box, Text, VStack, HStack, Center } from '../components/ui';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { FONT_SIZES } from '../constants';

interface PostScreenProps {
  route: {
    params: {
      postId: number;
    };
  };
  navigation: any;
}

const PostScreen: React.FC<PostScreenProps> = ({ route, navigation }) => {
  const { theme, isDark } = useModernTheme();
  const { postId } = route.params;
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPostData();
    fetchComments();
  }, [postId]);

  const fetchPostData = async () => {
    try {
      setLoading(true);
      const response = await postService.getPostById(postId);
      setPost(response.data);
    } catch (error) {
      setError('게시물을 불러오는 중 오류가 발생했습니다');
      if (__DEV__) console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await postService.getComments(postId);
      setComments(response.data.comments || []);
    } catch (error) {
      if (__DEV__) console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await postService.addComment(postId, {
        content: newComment,
        is_anonymous: isAnonymous
      });
      setNewComment('');
      fetchComments(); // 댓글 목록 새로고침
    } catch (error) {
      setError('댓글을 작성하는 중 오류가 발생했습니다');
      if (__DEV__) console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Center className="flex-1" style={{ backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Center>
    );
  }

  if (!post) {
    return (
      <Center className="flex-1" style={{ backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text.primarySecondary }}>게시물을 찾을 수 없습니다</Text>
      </Center>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 p-4"
      style={{ backgroundColor: theme.colors.background }}
    >
      <VStack className="space-y-4">
        <Box className="mb-4">
          <HStack className="justify-between items-center mb-2">
            <Text style={{ color: theme.colors.text.primarySecondary, fontSize: FONT_SIZES.bodySmall }}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
            <HStack
              className="items-center px-2 py-1 rounded-xl"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <MaterialCommunityIcons name="emoticon-happy-outline" size={16} color="#FFD700" />
              <Text
                className="ml-1 text-xs"
                style={{ color: theme.colors.text.primary }}
              >
                {post.emotion_summary}
              </Text>
            </HStack>
          </HStack>

          <Text
            className="text-base leading-6 my-3"
            style={{ color: theme.colors.text.primary }}
          >
            {post.content}
          </Text>

          <HStack className="mt-2 space-x-4">
            <HStack className="items-center">
              <MaterialCommunityIcons name="heart-outline" size={20} color="#FF6347" />
              <Text
                className="ml-1 text-sm"
                style={{ color: theme.colors.text.primarySecondary }}
                testID="like-count"
              >
                {post.like_count}
              </Text>
            </HStack>
            <HStack className="items-center">
              <MaterialCommunityIcons name="comment-outline" size={20} color="#4682B4" />
              <Text
                className="ml-1 text-sm"
                style={{ color: theme.colors.text.primarySecondary }}
                testID="comment-count"
              >
                {post.comment_count}
              </Text>
            </HStack>
          </HStack>
        </Box>

        <Box className="h-px my-4" style={{ backgroundColor: theme.colors.border }} />

        <Text
          className="text-base font-bold mb-3"
          style={{ color: theme.colors.text.primary }}
        >
          댓글 {comments.length}개
        </Text>

        <FlatList
          data={comments}
          keyExtractor={(item: any) => item.comment_id.toString()}
          renderItem={({ item }: { item: any }) => (
            <Box
              className="p-3"
              style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
            >
              <Text className="font-bold mb-1" style={{ color: theme.colors.text.primary }}>
                {item.is_anonymous ? '익명' : `사용자 ${item.user_id}`}
              </Text>
              <Text className="text-sm leading-5" style={{ color: theme.colors.text.primary }}>
                {item.content}
              </Text>
              <Text className="text-xs mt-1" style={{ color: theme.colors.text.primarySecondary }}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </Box>
          )}
          ListEmptyComponent={
            <Text
              className="text-center mt-6"
              style={{ color: theme.colors.text.primarySecondary }}
            >
              첫 번째 댓글을 남겨보세요!
            </Text>
          }
        />

        <HStack
          className="items-center p-2 space-x-2"
          style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }}
        >
          <Button
            mode={isAnonymous ? "contained" : "outlined"}
            onPress={() => setIsAnonymous(!isAnonymous)}
            compact
          >
            익명
          </Button>
          <TextInput
            className="flex-1 rounded-full px-3 py-2 max-h-24 mr-2"
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              color: theme.colors.text.primary
            }}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor={theme.colors.text.primarySecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <Button
            mode="contained"
            onPress={handleAddComment}
            loading={submitting}
            disabled={submitting || !newComment.trim()}
            compact
          >
            게시
          </Button>
        </HStack>
      </VStack>
    </SafeAreaView>
  );
};


export default PostScreen;