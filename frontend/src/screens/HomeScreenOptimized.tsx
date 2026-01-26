// HomeScreenOptimized.tsx - 무한 스크롤이 적용된 최적화 버전
// 사용 방법: App.tsx나 네비게이션에서 HomeScreen 대신 HomeScreenOptimized 사용

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useNavigation } from '@react-navigation/native';
import { InfinitePostsList } from '../components/InfinitePostsList';
import { PostsErrorBoundary } from '../components/PostsErrorBoundary';
import { normalize, hp } from '../utils/responsive';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text } from '../components/ui';

export const HomeScreenOptimized: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme, isDark } = useModernTheme();
  const navigation = useNavigation<any>();

  const handlePostPress = (post: any) => {
    navigation.navigate('PostDetail', { postId: post.post_id });
  };

  const handleLikePress = async (postId: number) => {
    // TODO: 좋아요 처리 로직
    console.log('Like post:', postId);
  };

  const handleCommentPress = (postId: number) => {
    navigation.navigate('CommentScreen', { postId });
  };

  const handleSharePress = async (post: any) => {
    // TODO: 공유 처리 로직
    console.log('Share post:', post.post_id);
  };

  const handleBookmarkPress = async (postId: number) => {
    // TODO: 북마크 처리 로직
    console.log('Bookmark post:', postId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          홈
        </Text>
        <View style={styles.headerActions}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={normalize(24)}
            color={theme.text.primary}
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>
      </View>

      {/* 무한 스크롤 게시물 리스트 */}
      <PostsErrorBoundary>
        <InfinitePostsList
          isAuthenticated={isAuthenticated}
          onPostPress={handlePostPress}
          onLikePress={handleLikePress}
          onCommentPress={handleCommentPress}
          onSharePress={handleSharePress}
          onBookmarkPress={handleBookmarkPress}
        />
      </PostsErrorBoundary>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(16),
  },
});

export default HomeScreenOptimized;
