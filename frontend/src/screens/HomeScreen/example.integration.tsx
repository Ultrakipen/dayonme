// example.integration.tsx - HomeScreen에 hooks를 통합하는 예제
// ⚠️ 이 파일은 예제입니다. 실제 HomeScreen.tsx에 적용하려면 README.md를 참고하세요.

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../hooks/useNetwork';
import { useHomeData } from './hooks/useHomeData';
import { usePostActions } from './hooks/usePostActions';
import { type AnonymousUser } from './types';
import { anonymousManager } from '../../utils/anonymousNickname';

// 기존 HomeScreen에서 이런 식으로 사용하면 됩니다
const ExampleHomeScreenIntegration = () => {
  const { user, isAuthenticated } = useAuth();
  const { isConnected } = useNetwork();

  // UI 상태
  const [emotionLoginPromptVisible, setEmotionLoginPromptVisible] = useState(false);
  const [emotionLoginPromptAction, setEmotionLoginPromptAction] = useState<'like' | 'comment' | 'post' | 'profile' | 'bookmark'>('like');

  // ===== 기존 processCommentsWithAnonymous 함수 (그대로 유지) =====
  const processCommentsWithAnonymous = useCallback(async (postId: number, comments: any[]) => {
    return await Promise.all(
      comments.map(async (comment) => {
        if (comment.is_anonymous && comment.user_id) {
          try {
            const anonymousUser = await anonymousManager.getOrCreateAnonymousUser(postId, comment.user_id);
            return { ...comment, anonymousUser };
          } catch (error) {
            return comment;
          }
        }
        return comment;
      })
    );
  }, []);

  // ===== ✅ NEW: hooks 사용 =====
  const homeData = useHomeData({
    isAuthenticated,
    isConnected,
    processCommentsWithAnonymous,
  });

  const postActions = usePostActions({
    isAuthenticated,
    isConnected,
    user,
    posts: homeData.posts,
    setPosts: homeData.setPosts,
    likedPosts: homeData.likedPosts,
    setLikedPosts: homeData.setLikedPosts,
    bookmarkedPosts: homeData.bookmarkedPosts,
    setBookmarkedPosts: homeData.setBookmarkedPosts,
    setEmotionLoginPromptAction,
    setEmotionLoginPromptVisible,
  });

  // ===== ✅ 이제 이렇게 사용 =====
  // homeData.loadPosts(true);              // 게시물 로드
  // postActions.handleLike(postId);         // 좋아요
  // postActions.handleBookmark(postId);     // 북마크
  // postActions.deletePost(postId);         // 삭제

  // 상태 접근:
  // homeData.posts                          // 게시물 목록
  // homeData.isRefreshing                   // 새로고침 중
  // homeData.loadingPosts                   // 로딩 중
  // homeData.bookmarkedPosts                // 북마크된 게시물 Set
  // homeData.likedPosts                     // 좋아요한 게시물 Set

  return null; // 실제 UI는 기존 HomeScreen.tsx와 동일
};

// ===== 기존 HomeScreen.tsx에 적용하는 방법 =====
/*
1. HomeScreen.tsx 상단에 import 추가:

import { useHomeData } from './HomeScreen/hooks/useHomeData';
import { usePostActions } from './HomeScreen/hooks/usePostActions';

2. HomeScreen 컴포넌트 내부에서 (218줄 부근):

const homeData = useHomeData({
  isAuthenticated,
  isConnected,
  processCommentsWithAnonymous,
});

const postActions = usePostActions({
  isAuthenticated,
  isConnected,
  user,
  posts: homeData.posts,
  setPosts: homeData.setPosts,
  likedPosts: homeData.likedPosts,
  setLikedPosts: homeData.setLikedPosts,
  bookmarkedPosts: homeData.bookmarkedPosts,
  setBookmarkedPosts: homeData.setBookmarkedPosts,
  setEmotionLoginPromptAction,
  setEmotionLoginPromptVisible,
});

3. 기존 상태 변수 제거 (309-315줄):
// const [posts, setPosts] = useState<DisplayPost[]>([]);  // ❌ 삭제
// const [isRefreshing, setIsRefreshing] = useState(false); // ❌ 삭제
// const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set()); // ❌ 삭제
// ... 등등

4. 기존 함수 제거 (3037줄, 2872줄, 2954줄):
// const loadPosts = async (forceRefresh: boolean = false) => { ... } // ❌ 삭제
// const handleLike = useCallback(async (postId: number) => { ... }  // ❌ 삭제
// const handleBookmark = useCallback(async (postId: number) => { ... } // ❌ 삭제

5. 사용하는 곳에서 교체:
// loadPosts()  →  homeData.loadPosts()
// handleLike(postId)  →  postActions.handleLike(postId)
// handleBookmark(postId)  →  postActions.handleBookmark(postId)
// posts  →  homeData.posts
// isRefreshing  →  homeData.isRefreshing
*/

export default ExampleHomeScreenIntegration;
