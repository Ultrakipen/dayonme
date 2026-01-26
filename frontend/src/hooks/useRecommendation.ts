// src/hooks/useRecommendation.ts
import { useState, useEffect, useCallback } from 'react';
import emotionService from '../services/api/emotionService';
import bookmarkService from '../services/api/bookmarkService';
import {
  loadEmotionPrefs,
  saveEmotionPrefs,
  recordPostView as recordView,
  recordLike as recordLikeAction,
  recordBookmark as recordBookmarkAction,
  type EmotionPrefs,
} from '../utils/recommendationScore';

export const useRecommendation = (userId?: number) => {
  const [emotionPrefs, setEmotionPrefs] = useState<EmotionPrefs>({});
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드: AsyncStorage + 서버 데이터 통합
  const loadPreferences = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. AsyncStorage에서 로컬 선호도 로드
      const localPrefs = await loadEmotionPrefs();

      // 2. 서버에서 주간 감정 통계 로드
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const statsResponse = await emotionService.getEmotionStats({
        start_date: weekAgo.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        source: 'post',
      });

      // 3. 주간 감정 데이터를 선호도에 반영
      if (statsResponse?.data?.data) {
        const weeklyData = statsResponse.data.data;
        weeklyData.forEach((dayData: any) => {
          if (dayData.emotions && Array.isArray(dayData.emotions)) {
            dayData.emotions.forEach((emotion: any) => {
              if (!localPrefs[emotion.name]) {
                localPrefs[emotion.name] = { viewCount: 0, likeCount: 0, bookmarkCount: 0 };
              }
              localPrefs[emotion.name].viewCount += emotion.count || 0;
            });
          }
        });
      }

      // 4. 북마크 데이터 반영
      try {
        const bookmarkResponse = await bookmarkService.getBookmarks({ limit: 50 });
        if (bookmarkResponse?.data?.bookmarks) {
          bookmarkResponse.data.bookmarks.forEach((bookmark: any) => {
            if (bookmark.post?.emotions) {
              bookmark.post.emotions.forEach((emotion: any) => {
                if (!localPrefs[emotion.name]) {
                  localPrefs[emotion.name] = { viewCount: 0, likeCount: 0, bookmarkCount: 0 };
                }
                localPrefs[emotion.name].bookmarkCount += 1;
              });
            }
          });
        }
      } catch (error) {
        // 북마크 로드 실패해도 계속 진행
        if (__DEV__) console.log('북마크 로드 실패 (무시):', error);
      }

      // 5. 통합된 선호도 저장 및 상태 업데이트
      await saveEmotionPrefs(localPrefs);
      setEmotionPrefs(localPrefs);
    } catch (error) {
      if (__DEV__) console.error('감정 선호도 로드 실패:', error);
      setEmotionPrefs({});
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // 게시물 조회 기록
  const recordPostView = useCallback(
    async (postId: number, emotions: Array<{ name: string }>, durationSeconds: number) => {
      await recordView(postId, emotions, durationSeconds);
      // 로컬 상태 즉시 업데이트
      const updated = { ...emotionPrefs };
      emotions.forEach(emotion => {
        if (!updated[emotion.name]) {
          updated[emotion.name] = { viewCount: 0, likeCount: 0, bookmarkCount: 0 };
        }
        updated[emotion.name].viewCount += 1;
      });
      setEmotionPrefs(updated);
    },
    [emotionPrefs]
  );

  // 좋아요 기록
  const recordLike = useCallback(
    async (emotions: Array<{ name: string }>) => {
      await recordLikeAction(emotions);
      const updated = { ...emotionPrefs };
      emotions.forEach(emotion => {
        if (!updated[emotion.name]) {
          updated[emotion.name] = { viewCount: 0, likeCount: 0, bookmarkCount: 0 };
        }
        updated[emotion.name].likeCount += 1;
      });
      setEmotionPrefs(updated);
    },
    [emotionPrefs]
  );

  // 북마크 기록
  const recordBookmark = useCallback(
    async (emotions: Array<{ name: string }>) => {
      await recordBookmarkAction(emotions);
      const updated = { ...emotionPrefs };
      emotions.forEach(emotion => {
        if (!updated[emotion.name]) {
          updated[emotion.name] = { viewCount: 0, likeCount: 0, bookmarkCount: 0 };
        }
        updated[emotion.name].bookmarkCount += 1;
      });
      setEmotionPrefs(updated);
    },
    [emotionPrefs]
  );

  return {
    emotionPrefs,
    isLoading,
    recordPostView,
    recordLike,
    recordBookmark,
    refresh: loadPreferences,
  };
};

export default useRecommendation;
