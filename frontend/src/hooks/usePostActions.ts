// hooks/usePostActions.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import postService from '../services/api/postService';
import myDayService from '../services/api/myDayService';
import { DisplayPost } from '../types/HomeScreen.types';

interface UsePostActionsReturn {
  likedPosts: Set<number>;
  handleLike: (postId: number, posts: DisplayPost[], setPosts: (posts: DisplayPost[]) => void) => Promise<void>;
  handleDelete: (postId: number, setPosts: (fn: (prev: DisplayPost[]) => DisplayPost[]) => void) => Promise<void>;
  setLikedPosts: React.Dispatch<React.SetStateAction<Set<number>>>;
}

export const usePostActions = (): UsePostActionsReturn => {
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const handleLike = useCallback(async (
    postId: number,
    posts: DisplayPost[],
    setPosts: (posts: DisplayPost[]) => void
  ) => {
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
          if (error.response?.status !== 404) {
            break;
          }
        }
      }

      if (!success) {
        throw lastError;
      }

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
          ? {
            ...post,
            like_count: isCurrentlyLiked
              ? post.like_count - 1
              : post.like_count + 1,
            isLiked: !isCurrentlyLiked
          }
          : post
      ));
    } catch (error: any) {
      const errorMessage = error.response?.status === 404
        ? '게시물을 찾을 수 없습니다.'
        : '좋아요 처리 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    }
  }, [likedPosts]);

  const handleDelete = useCallback(async (
    postId: number,
    setPosts: (fn: (prev: DisplayPost[]) => DisplayPost[]) => void
  ) => {
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
          if (error.response?.status !== 404) {
            break;
          }
        }
      }

      if (success) {
        setPosts(prev => prev.filter(post => post.post_id !== postId));
        Alert.alert('성공', '게시물이 삭제되었습니다.');
      } else {
        Alert.alert('오류', '게시물을 삭제할 수 없습니다.');
      }
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      Alert.alert('오류', '게시물 삭제 중 오류가 발생했습니다.');
    }
  }, []);

  return {
    likedPosts,
    handleLike,
    handleDelete,
    setLikedPosts
  };
};
