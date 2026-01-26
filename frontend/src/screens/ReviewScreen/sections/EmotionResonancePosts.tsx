import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import apiClient from '../../../services/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwemojiImage } from '../../../components/common/TwemojiImage';
import { API_BASE_URL } from '../../../config/api';

const CACHE_KEY = '@emotion_resonance_cache_v6'; // v6로 변경하여 캐시 초기화 (avatar_url 상세 로그)
const CACHE_EXPIRY = 5 * 60 * 1000; // 5분

// 상대 경로를 전체 URL로 변환
const getFullImageUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
};

interface EmotionInfo {
  name: string;
  icon: string;
  color: string;
}

interface PostUser {
  user_id: number;
  nickname: string;
  avatar_url?: string;
}

interface PostEngagement {
  likes: number;
  comments: number;
}

interface ResonancePost {
  post_id: number;
  content: string;
  user: PostUser;
  emotion: EmotionInfo;
  engagement: PostEngagement;
  created_at: string;
}

interface EmotionResonanceData {
  currentEmotion: EmotionInfo;
  stats: {
    totalUsers: number;
    totalPosts: number;
  };
  posts: ResonancePost[];
}

export const EmotionResonancePosts: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const navigation = useNavigation();
  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale), [scale]);

  const [data, setData] = useState<EmotionResonanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // 캐시 로드
  const loadFromCache = useCallback(async (): Promise<EmotionResonanceData | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return cachedData;
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('공감 포스트 캐시 로드 실패:', err);
    }
    return null;
  }, []);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[EmotionResonancePosts] 데이터 로드 시작');

      // 임시로 캐시 비활성화하여 항상 새 데이터 로드
      // const cachedData = await loadFromCache();
      // if (cachedData) {
      //   console.log('[EmotionResonancePosts] 캐시에서 데이터 로드:', cachedData);
      //   console.log('[EmotionResonancePosts] 캐시된 포스트:', cachedData?.posts?.map((p: ResonancePost) => ({
      //     id: p.post_id,
      //     user: p.user.nickname,
      //     avatar: p.user.avatar_url
      //   })));
      //   setData(cachedData);
      //   setLoading(false);
      //   return;
      // }

      console.log('[EmotionResonancePosts] API 요청 시작: /review/emotion-resonance-posts');
      const response = await apiClient.get('/review/emotion-resonance-posts');
      console.log('[EmotionResonancePosts] API 응답:', response.data);

      if (response.data.status === 'success') {
        const newData = response.data.data;
        console.log('[EmotionResonancePosts] 데이터 설정:', newData);
        const postsInfo = newData?.posts?.map((p: ResonancePost) => ({
          id: p.post_id,
          user: p.user.nickname,
          avatar_original: p.user.avatar_url,
          avatar_full: getFullImageUrl(p.user.avatar_url)
        }));
        console.log('[EmotionResonancePosts] 포스트 목록 (JSON):', JSON.stringify(postsInfo, null, 2));
        setData(newData);

        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: newData,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      console.error('[EmotionResonancePosts] API 실패:', err);
      if (__DEV__) console.warn('공감 포스트 API 실패:', err);
      setData(null);
    } finally {
      setLoading(false);
      console.log('[EmotionResonancePosts] 로딩 완료');
    }
  }, [loadFromCache]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 포스트 클릭 (HomeStack의 PostDetail로 이동)
  const handlePostPress = useCallback((postId: number) => {
    navigation.navigate('Home' as never, {
      screen: 'PostDetail',
      params: { postId }
    } as never);
  }, [navigation]);

  // 시간 포맷
  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }, []);

  // 이미지 에러 핸들러
  const handleImageError = useCallback((postId: number) => {
    console.log('[EmotionResonancePosts] 이미지 로드 실패 - postId:', postId);
    setImageErrors(prev => new Set(prev).add(postId));
  }, []);

  console.log('[EmotionResonancePosts] 렌더링 - loading:', loading, 'data:', data, 'posts:', data?.posts?.length);

  if (loading || !data || data.posts.length === 0) {
    console.log('[EmotionResonancePosts] 렌더링 중단 - loading:', loading, 'data:', !!data, 'posts:', data?.posts?.length);
    return null;
  }

  return (
    <Card accessible={true} accessibilityLabel="감정 공감 포스트">
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TwemojiImage emoji="💭" size={FONT_SIZES.h4 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
            이런 마음, 나만 느낀 건 아니에요
          </Text>
        </View>
      </View>

      {/* 감정 배너 */}
      <View style={[styles.emotionBanner, {
        backgroundColor: isDark ? data.currentEmotion.color + '25' : data.currentEmotion.color + '15'
      }]}>
        <TwemojiImage emoji={data.currentEmotion.icon} size={FONT_SIZES.h1 * scale} />
        <View style={{ marginLeft: 12 * scale, flex: 1 }}>
          <Text style={[styles.emotionLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
            최근 당신이 자주 느낀 감정
          </Text>
          <Text style={[styles.emotionName, { color: colors.text, fontSize: FONT_SIZES.bodyLarge * scale }]}>
            {data.currentEmotion.name}
          </Text>
        </View>
        <View style={styles.statsBadge}>
          <Text style={[styles.statsText, { fontSize: FONT_SIZES.tiny * scale, color: colors.textSecondary }]}>
            {data.stats.totalUsers}명이 공감
          </Text>
        </View>
      </View>

      {/* 포스트 목록 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.postsScroll}
        contentContainerStyle={styles.postsContent}
      >
        {data.posts.map((post) => (
          <TouchableOpacity
            key={post.post_id}
            style={[styles.postCard, {
              backgroundColor: isDark ? colors.surface : '#F8F9FA',
              borderColor: isDark ? colors.border : data.currentEmotion.color + '30'
            }]}
            onPress={() => handlePostPress(post.post_id)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel={`${post.user.nickname}의 포스트`}
            accessibilityRole="button"
          >
            {/* 사용자 정보 */}
            <View style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: data.currentEmotion.color + '30' }]}>
                {(() => {
                  const fullAvatarUrl = getFullImageUrl(post.user.avatar_url);
                  return fullAvatarUrl && !imageErrors.has(post.post_id) ? (
                    <Image
                      source={{ uri: fullAvatarUrl }}
                      style={styles.avatarImage}
                      onError={() => handleImageError(post.post_id)}
                    />
                  ) : (
                    <Text style={[styles.avatarText, { fontSize: FONT_SIZES.body * scale, color: colors.text }]}>
                      {post.user.nickname[0]}
                    </Text>
                  );
                })()}
              </View>
              <View style={{ flex: 1, marginLeft: 8 * scale }}>
                <Text
                  style={[styles.nickname, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}
                  numberOfLines={1}
                >
                  {post.user.nickname}
                </Text>
                <Text style={[styles.timeText, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale }]}>
                  {formatTime(post.created_at)}
                </Text>
              </View>
              <TwemojiImage emoji={post.emotion.icon} size={FONT_SIZES.bodyLarge * scale} />
            </View>

            {/* 포스트 내용 */}
            <Text
              style={[styles.postContent, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}
              numberOfLines={4}
            >
              {post.content}
            </Text>

            {/* 참여도 */}
            <View style={styles.engagement}>
              <View style={styles.engagementItem}>
                <Text style={{ fontSize: FONT_SIZES.caption * scale }}>❤️</Text>
                <Text style={[styles.engagementText, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
                  {post.engagement.likes}
                </Text>
              </View>
              <View style={styles.engagementItem}>
                <Text style={{ fontSize: FONT_SIZES.caption * scale }}>💬</Text>
                <Text style={[styles.engagementText, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
                  {post.engagement.comments}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 더보기 */}
      <TouchableOpacity
        style={[styles.moreLink, { borderTopColor: colors.border }]}
        onPress={() => navigation.navigate('Home' as never)}
        accessible={true}
        accessibilityLabel="나의 하루에서 더 많은 포스트 보기"
      >
        <Text style={[styles.moreLinkText, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
          나의 하루에서 더 많은 이야기 보기 →
        </Text>
      </TouchableOpacity>
    </Card>
  );
});

const createStyles = (scale: number) => StyleSheet.create({
  header: {
    marginBottom: 12 * scale,
  },
  title: {
    fontFamily: 'Pretendard-Bold',
    lineHeight: 24 * scale,
  },
  emotionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16 * scale,
    borderRadius: 16 * scale,
    marginBottom: 16 * scale,
  },
  emotionLabel: {
    fontFamily: 'Pretendard-Medium',
    marginBottom: 2 * scale,
  },
  emotionName: {
    fontFamily: 'Pretendard-Bold',
  },
  statsBadge: {
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 12 * scale,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statsText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  postsScroll: {
    marginHorizontal: -4 * scale,
  },
  postsContent: {
    paddingHorizontal: 4 * scale,
    gap: 12 * scale,
  },
  postCard: {
    width: 260 * scale,
    padding: 14 * scale,
    borderRadius: 16 * scale,
    borderWidth: 1.5,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10 * scale,
  },
  avatar: {
    width: 36 * scale,
    height: 36 * scale,
    borderRadius: 18 * scale,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: 'Pretendard-Bold',
  },
  nickname: {
    fontFamily: 'Pretendard-SemiBold',
  },
  timeText: {
    marginTop: 2 * scale,
  },
  postContent: {
    lineHeight: 20 * scale,
    marginBottom: 10 * scale,
    minHeight: 80 * scale,
  },
  engagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 * scale,
    paddingTop: 8 * scale,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * scale,
  },
  engagementText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  moreLink: {
    marginTop: 16 * scale,
    paddingTop: 12 * scale,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  moreLinkText: {
    fontFamily: 'Pretendard-Medium',
  },
});
