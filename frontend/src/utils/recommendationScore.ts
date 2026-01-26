// src/utils/recommendationScore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EmotionPrefs = {
  [emotionName: string]: {
    viewCount: number;
    likeCount: number;
    bookmarkCount: number;
  };
};

export type Post = {
  post_id: number;
  content: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  emotions?: Array<{ name: string; icon: string; color: string }>;
  user?: { user_id: number; nickname: string };
};

const getHoursSince = (dateStr: string): number => {
  const now = new Date().getTime();
  const postTime = new Date(dateStr).getTime();
  return (now - postTime) / (1000 * 60 * 60);
};

// 맞춤 탭: 사용자 감정 패턴 기반 추천
export const calculateCustomScore = (
  post: Post,
  emotionPrefs: EmotionPrefs
): number => {
  if (!post.emotions || post.emotions.length === 0) return 0;

  let score = 0;
  const hoursAgo = getHoursSince(post.created_at);

  // 1. 감정 매칭 점수 (60%)
  post.emotions.forEach(emotion => {
    const pref = emotionPrefs[emotion.name];
    if (pref) {
      const emotionScore =
        pref.viewCount * 5 +
        pref.likeCount * 15 +
        pref.bookmarkCount * 30;
      score += emotionScore * 0.6;
    }
  });

  // 2. 인기도 (25%)
  const engagementScore = (post.like_count * 2 + post.comment_count * 3) * 0.25;
  score += engagementScore;

  // 3. 최신도 (15%) - 24시간 이내 가중치
  if (hoursAgo <= 24) {
    score += (24 - hoursAgo) * 0.15;
  }

  return score;
};

// 인기 탭: 순수 인기도 기반
export const calculatePopularityScore = (post: Post): number => {
  const hoursAgo = getHoursSince(post.created_at);

  // 48시간 이내만 인기 탭에 표시
  if (hoursAgo > 48) return 0;

  const interactionScore = (post.like_count * 3) + (post.comment_count * 5);
  const timeWeight = Math.max(0, (48 - hoursAgo) / 48);

  return interactionScore * (1 + timeWeight * 0.5);
};

// AsyncStorage에서 감정 선호도 로드
export const loadEmotionPrefs = async (): Promise<EmotionPrefs> => {
  try {
    const data = await AsyncStorage.getItem('@emotion_prefs');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

// 감정 선호도 저장
export const saveEmotionPrefs = async (prefs: EmotionPrefs): Promise<void> => {
  try {
    await AsyncStorage.setItem('@emotion_prefs', JSON.stringify(prefs));
  } catch (error) {
    if (__DEV__) console.error('감정 선호도 저장 실패:', error);
  }
};

// 게시물 조회 기록
export const recordPostView = async (
  postId: number,
  emotions: Array<{ name: string }>,
  durationSeconds: number
): Promise<void> => {
  if (durationSeconds < 2) return; // 2초 미만은 무시

  try {
    const prefs = await loadEmotionPrefs();

    emotions.forEach(emotion => {
      if (!prefs[emotion.name]) {
        prefs[emotion.name] = { viewCount: 0, likeCount: 0, bookmarkCount: 0 };
      }
      prefs[emotion.name].viewCount += 1;
    });

    await saveEmotionPrefs(prefs);
  } catch (error) {
    if (__DEV__) console.error('조회 기록 실패:', error);
  }
};

// 좋아요 기록
export const recordLike = async (emotions: Array<{ name: string }>): Promise<void> => {
  try {
    const prefs = await loadEmotionPrefs();

    emotions.forEach(emotion => {
      if (!prefs[emotion.name]) {
        prefs[emotion.name] = { viewCount: 0, likeCount: 0, bookmarkCount: 0 };
      }
      prefs[emotion.name].likeCount += 1;
    });

    await saveEmotionPrefs(prefs);
  } catch (error) {
    if (__DEV__) console.error('좋아요 기록 실패:', error);
  }
};

// 북마크 기록
export const recordBookmark = async (emotions: Array<{ name: string }>): Promise<void> => {
  try {
    const prefs = await loadEmotionPrefs();

    emotions.forEach(emotion => {
      if (!prefs[emotion.name]) {
        prefs[emotion.name] = { viewCount: 0, likeCount: 0, bookmarkCount: 0 };
      }
      prefs[emotion.name].bookmarkCount += 1;
    });

    await saveEmotionPrefs(prefs);
  } catch (error) {
    if (__DEV__) console.error('북마크 기록 실패:', error);
  }
};
