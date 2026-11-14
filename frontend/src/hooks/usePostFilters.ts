// hooks/usePostFilters.ts
import { useMemo } from 'react';
import { DisplayPost } from '../types/HomeScreen.types';

export const usePostFilters = (
  posts: DisplayPost[],
  selectedEmotion: string,
  sortOrder: 'recent' | 'popular'
): DisplayPost[] => {
  return useMemo(() => {
    console.log('🔍 [usePostFilters] 시작:', {
      postsCount: posts?.length,
      selectedEmotion,
      sortOrder
    });

    if (!posts || !Array.isArray(posts)) {
      console.log('❌ [usePostFilters] posts가 유효하지 않음');
      return [];
    }

    let filtered = [...posts];
    // 첫 게시물의 emotions 확인
    if (filtered.length > 0) {
      console.log("📊 [usePostFilters] 첫 게시물 emotions:", {
        post_id: filtered[0].post_id,
        emotions: filtered[0].emotions,
        emotions_length: filtered[0].emotions?.length
      });
    }
    console.log('📊 [usePostFilters] 복사 후:', filtered.length);

    // 감정 필터링
    if (selectedEmotion !== '전체') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(post => {
        if (!post.emotions || post.emotions.length === 0) return false;
        return post.emotions.some(emotion =>
          typeof emotion.name === 'string' && emotion.name === selectedEmotion
        );
      });
      console.log(`📊 [usePostFilters] 감정 필터링: ${beforeFilter} -> ${filtered.length}`);
    }

    // 정렬 (안전하게)
    try {
      if (sortOrder === 'popular') {
        // 인기순
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentPosts = filtered.filter(post => {
          const date = new Date(post.created_at);
          return !isNaN(date.getTime()) && date >= thirtyDaysAgo;
        });
        
        const oldPosts = filtered.filter(post => {
          const date = new Date(post.created_at);
          return !isNaN(date.getTime()) && date < thirtyDaysAgo;
        });

        recentPosts.sort((a, b) => {
          if (b.like_count === a.like_count) {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          }
          return b.like_count - a.like_count;
        });

        oldPosts.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });

        filtered = [...recentPosts, ...oldPosts];
      } else {
        // 최신순 (안전하게 - undefined 날짜는 맨 뒤로)
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

          // 둘 다 유효하지 않으면 순서 유지
          if (!dateA && !dateB) return 0;
          // dateA만 없으면 뒤로
          if (!dateA) return 1;
          // dateB만 없으면 앞으로
          if (!dateB) return -1;

          return dateB - dateA;
        });
      }
      
      console.log('✅ [usePostFilters] 최종 결과:', filtered.length);
    } catch (error) {
      console.error('❌ [usePostFilters] 정렬 오류:', error);
    }

    return filtered;
  }, [posts, selectedEmotion, sortOrder]);
};
