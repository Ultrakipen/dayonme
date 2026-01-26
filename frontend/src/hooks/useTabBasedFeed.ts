// src/hooks/useTabBasedFeed.ts
import { useMemo } from 'react';
import {
  calculatePopularityScore,
  type Post,
} from '../utils/recommendationScore';

export type FeedTab = '전체' | '나와 같은감정' | '인기' | '나의 글';

export const useTabBasedFeed = (
  posts: any[],
  activeTab: FeedTab,
  userRecentEmotions: string[], // 사용자의 최근 "나의 하루" 글의 감정 이름들
  currentUserId?: number // 현재 로그인한 사용자 ID
) => {
  const filteredPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    switch (activeTab) {
      case '나와 같은감정': {
        // 사용자의 최근 "나의 하루" 글과 같은 감정 필터링
        if (!userRecentEmotions || userRecentEmotions.length === 0) {
          // 최근 감정이 없으면 빈 배열 또는 안내 메시지
          return [];
        }

        const filtered = posts
          .filter(post => {
            // 본인의 글은 제외
            if (currentUserId && post.user_id === currentUserId) return false;

            if (!post.emotions || post.emotions.length === 0) return false;
            // 게시물의 감정 중 하나라도 사용자의 최근 감정과 일치하면 표시
            return post.emotions.some((emotion: any) =>
              userRecentEmotions.includes(emotion.name)
            );
          })
          .sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

        return filtered;
      }

      case '인기': {
        // 인기도 기반 정렬 (48시간 이내)
        const scored = posts
          .map(post => ({
            ...post,
            _score: calculatePopularityScore(post as Post),
          }))
          .filter(post => post._score > 0)
          .sort((a, b) => b._score - a._score)
          .slice(0, 50);

        return scored.length > 0 ? scored : posts.slice(0, 20);
      }

      case '나의 글': {
        // 본인 글만 필터링
        if (!currentUserId) return [];

        return posts
          .filter(post => post.user_id === currentUserId)
          .sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }

      case '전체':
      default: {
        // 시간순 정렬
        return posts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    }
  }, [posts, activeTab, userRecentEmotions, currentUserId]);

  return filteredPosts;
};

export default useTabBasedFeed;
