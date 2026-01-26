// hooks/usePostFilters.ts
import { useMemo } from 'react';
import { DisplayPost } from '../types/HomeScreen.types';

export const usePostFilters = (
  posts: DisplayPost[],
  selectedEmotion: string,
  sortOrder: 'recent' | 'popular'
): DisplayPost[] => {
  return useMemo(() => {
    if (__DEV__) console.log('🔍 [usePostFilters] 시작:', {
      postsCount: posts?.length,
      selectedEmotion,
      sortOrder
    });

    if (!posts || !Array.isArray(posts)) {
      if (__DEV__) console.log('❌ [usePostFilters] posts가 유효하지 않음');
      return [];
    }

    let filtered = [...posts];
    // 첫 게시물의 emotions 확인
    if (filtered.length > 0) {
      if (__DEV__) console.log("📊 [usePostFilters] 첫 게시물 emotions:", {
        post_id: filtered[0].post_id,
        emotions: filtered[0].emotions,
        emotions_length: filtered[0].emotions?.length
      });
    }
    if (__DEV__) console.log('📊 [usePostFilters] 복사 후:', filtered.length);

    // 감정 필터링
    if (selectedEmotion && selectedEmotion !== '') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(post => {
        if (!post.emotions || post.emotions.length === 0) return false;
        return post.emotions.some(emotion =>
          typeof emotion.name === 'string' && emotion.name === selectedEmotion
        );
      });
      if (__DEV__) console.log(`📊 [usePostFilters] 감정 필터링: ${beforeFilter} -> ${filtered.length}`);
    }

    // 정렬 (안전하게)
    try {
      if (sortOrder === 'popular') {
        // 인기순: 좋아요 수 기준 정렬 (같으면 최신순)
        filtered.sort((a, b) => {
          const likeA = a.like_count || 0;
          const likeB = b.like_count || 0;
          if (likeB !== likeA) {
            return likeB - likeA;
          }
          // 좋아요 수 같으면 최신순
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        if (__DEV__) console.log('✅ [usePostFilters] 인기순 정렬 완료:', filtered.length);
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
      
      if (__DEV__) console.log('✅ [usePostFilters] 최종 결과:', filtered.length);
    } catch (error) {
      if (__DEV__) console.error('❌ [usePostFilters] 정렬 오류:', error);
    }

    return filtered;
  }, [posts, selectedEmotion, sortOrder]);
};
