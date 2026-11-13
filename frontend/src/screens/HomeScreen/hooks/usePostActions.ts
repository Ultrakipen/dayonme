// usePostActions.ts - 게시물 액션 (좋아요, 북마크, 삭제)
import { useCallback } from 'react';
import { Alert } from 'react-native';
import postService from '../../../services/api/postService';
import myDayService from '../../../services/api/myDayService';
import bookmarkService from '../../../services/api/bookmarkService';
import { type DisplayPost } from '../types';

interface UsePostActionsProps {
  isAuthenticated: boolean;
  isConnected: boolean;
  user: any;
  posts: DisplayPost[];
  setPosts: React.Dispatch<React.SetStateAction<DisplayPost[]>>;
  likedPosts: Set<number>;
  setLikedPosts: React.Dispatch<React.SetStateAction<Set<number>>>;
  bookmarkedPosts: Set<number>;
  setBookmarkedPosts: React.Dispatch<React.SetStateAction<Set<number>>>;
  setEmotionLoginPromptAction: (action: 'like' | 'comment' | 'post' | 'profile' | 'bookmark') => void;
  setEmotionLoginPromptVisible: (visible: boolean) => void;
}

export const usePostActions = ({
  isAuthenticated,
  isConnected,
  user,
  posts,
  setPosts,
  likedPosts,
  setLikedPosts,
  bookmarkedPosts,
  setBookmarkedPosts,
  setEmotionLoginPromptAction,
  setEmotionLoginPromptVisible,
}: UsePostActionsProps) => {

  const handleLike = useCallback(async (postId: number) => {
    if (!isAuthenticated || !user) {
      setEmotionLoginPromptAction('like');
      setEmotionLoginPromptVisible(true);
      return;
    }

    if (!isConnected) {
      Alert.alert('오프라인', '네트워크 연결을 확인해주세요.');
      return;
    }

    try {
      const isCurrentlyLiked = likedPosts.has(postId);
      const targetPost = posts.find(post => post.post_id === postId);
      if (!targetPost) return;

      let success = false;
      let lastError = null;

      const apiAttempts = [
        () => myDayService.likePost(postId),
        () => postService.likePost(postId)
      ];

      for (const apiCall of apiAttempts) {
        try {
          await apiCall();
          success = true;
          break;
        } catch (error: any) {
          lastError = error;
          if (error.response?.status !== 404) break;
        }
      }

      if (!success) throw lastError;

      if (isCurrentlyLiked) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        setLikedPosts(prev => new Set([...prev, postId]));
      }

      setPosts(posts.map(post =>
        post.post_id === postId
          ? { ...post, like_count: isCurrentlyLiked ? post.like_count - 1 : post.like_count + 1, isLiked: !isCurrentlyLiked }
          : post
      ));
    } catch (error: any) {
      const errorMessage = error.response?.status === 404 ? '게시물을 찾을 수 없습니다.' : '좋아요 처리 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    }
  }, [isAuthenticated, user, posts, likedPosts, isConnected, setPosts, setLikedPosts, setEmotionLoginPromptAction, setEmotionLoginPromptVisible]);

  const handleBookmark = useCallback(async (postId: number) => {
    if (!isAuthenticated || !user) {
      setEmotionLoginPromptAction('bookmark');
      setEmotionLoginPromptVisible(true);
      return;
    }

    if (!isConnected) {
      Alert.alert('오프라인', '네트워크 연결을 확인해주세요.');
      return;
    }

    const wasBookmarked = bookmarkedPosts.has(postId);

    setBookmarkedPosts(prev => {
      const newSet = new Set(prev);
      if (wasBookmarked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    try {
      if (wasBookmarked) {
        await bookmarkService.removeBookmark(postId, 'my_day');
      } else {
        await bookmarkService.addBookmark(postId, 'my_day');
      }
    } catch (error: any) {
      setBookmarkedPosts(prev => {
        const newSet = new Set(prev);
        if (wasBookmarked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      Alert.alert('오류', '북마크 처리 중 문제가 발생했습니다.');
    }
  }, [isAuthenticated, user, bookmarkedPosts, isConnected, setBookmarkedPosts, setEmotionLoginPromptAction, setEmotionLoginPromptVisible]);

  const deletePost = useCallback(async (postId: number) => {
    if (!isAuthenticated) return;

    try {
      let success = false;
      const apiAttempts = [
        () => myDayService.deletePost(postId),
        () => postService.deletePost(postId)
      ];

      for (const apiCall of apiAttempts) {
        try {
          await apiCall();
          success = true;
          break;
        } catch (error: any) {
          if (error.response?.status !== 404) break;
        }
      }

      if (success) {
        setPosts(posts.filter(post => post.post_id !== postId));
        Alert.alert('성공', '게시물이 삭제되었습니다.');
      } else {
        Alert.alert('오류', '게시물을 삭제할 수 없습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '게시물 삭제 중 문제가 발생했습니다.');
    }
  }, [isAuthenticated, posts, setPosts]);

  return {
    handleLike,
    handleBookmark,
    deletePost,
  };
};
