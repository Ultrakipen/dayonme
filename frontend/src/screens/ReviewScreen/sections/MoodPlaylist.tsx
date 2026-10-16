import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Platform } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import apiClient from '../../../services/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

const CACHE_KEY = '@mood_playlist_cache_v2';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1시간

interface PlaylistItem {
  id: string;
  name: string;
  description: string;
  searchQuery: string; // YouTube 검색 쿼리
  emotion: string;
  icon: string;
}

interface MoodPlaylistData {
  currentEmotion: string;
  emotionIcon: string;
  playlists: PlaylistItem[];
}

// 감정별 YouTube 플레이리스트 (한국어 최적화)
const EMOTION_PLAYLISTS: Record<string, PlaylistItem[]> = {
  '행복': [
    { id: 'h1', name: '신나는 팝송', description: '기분 좋아지는 신나는 음악', searchQuery: '신나는 팝송 플레이리스트 2024', emotion: '행복', icon: '🎉' },
    { id: 'h2', name: '기분좋은 K-POP', description: '밝고 에너지 넘치는 케이팝', searchQuery: '기분좋은 케이팝 노래 모음', emotion: '행복', icon: '💃' },
    { id: 'h3', name: '드라이브 음악', description: '달리고 싶은 날의 BGM', searchQuery: '드라이브 음악 신나는 노래', emotion: '행복', icon: '🚗' },
  ],
  '평온': [
    { id: 'p1', name: '잔잔한 피아노', description: '마음이 편안해지는 피아노', searchQuery: '잔잔한 피아노 음악 휴식', emotion: '평온', icon: '🎹' },
    { id: 'p2', name: '카페 재즈', description: '커피와 어울리는 재즈', searchQuery: '카페 재즈 음악 편안한', emotion: '평온', icon: '☕' },
    { id: 'p3', name: '자연의 소리', description: '힐링되는 자연 사운드', searchQuery: '자연의 소리 힐링 음악 빗소리', emotion: '평온', icon: '🌿' },
  ],
  '슬픔': [
    { id: 's1', name: '감성 발라드', description: '마음을 어루만지는 노래', searchQuery: '감성 발라드 모음 2024 위로', emotion: '슬픔', icon: '🎤' },
    { id: 's2', name: '새벽 감성', description: '밤에 듣기 좋은 노래', searchQuery: '새벽 감성 노래 잠잘때 듣는', emotion: '슬픔', icon: '🌙' },
    { id: 's3', name: '위로가 되는', description: '힘들 때 듣는 음악', searchQuery: '위로가 되는 노래 힘들때 듣는 음악', emotion: '슬픔', icon: '🤗' },
  ],
  '불안': [
    { id: 'a1', name: '명상 음악', description: '마음을 진정시키는 음악', searchQuery: '명상 음악 마음 안정 불안 해소', emotion: '불안', icon: '🧘' },
    { id: 'a2', name: 'ASMR 사운드', description: '긴장 완화 ASMR', searchQuery: 'ASMR 불안 해소 수면 유도', emotion: '불안', icon: '🎧' },
    { id: 'a3', name: '수면 유도', description: '깊은 잠을 위한 음악', searchQuery: '수면 유도 음악 불면증 깊은 잠', emotion: '불안', icon: '😴' },
  ],
  '분노': [
    { id: 'r1', name: '운동 음악', description: '에너지 발산용 음악', searchQuery: '운동할때 듣는 음악 헬스장 신나는', emotion: '분노', icon: '💪' },
    { id: 'r2', name: '강렬한 록', description: '스트레스 해소 록 음악', searchQuery: '스트레스 해소 록 음악 강렬한', emotion: '분노', icon: '🎸' },
    { id: 'r3', name: '힙합 비트', description: '파워풀한 힙합 모음', searchQuery: '힙합 음악 신나는 비트 에너지', emotion: '분노', icon: '🔥' },
  ],
  '감사': [
    { id: 'g1', name: '따뜻한 음악', description: '마음이 따뜻해지는 노래', searchQuery: '따뜻한 노래 감동적인 음악', emotion: '감사', icon: '💝' },
    { id: 'g2', name: '어쿠스틱', description: '포근한 어쿠스틱 음악', searchQuery: '어쿠스틱 노래 포근한 기타', emotion: '감사', icon: '🎸' },
  ],
  '설렘': [
    { id: 'e1', name: '설레는 OST', description: '두근두근 드라마 OST', searchQuery: '설레는 드라마 OST 로맨스', emotion: '설렘', icon: '💕' },
    { id: 'e2', name: '봄 느낌', description: '봄처럼 설레는 음악', searchQuery: '봄 노래 설레는 음악 상큼한', emotion: '설렘', icon: '🌸' },
  ],
};

// 기본 감정 (API 실패 시)
const DEFAULT_EMOTION = '평온';

export const MoodPlaylist: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale), [scale]);

  const [data, setData] = useState<MoodPlaylistData | null>(null);
  const [loading, setLoading] = useState(true);

  // 캐시 로드
  const loadFromCache = useCallback(async (): Promise<MoodPlaylistData | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return cachedData;
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('Mood Playlist 캐시 로드 실패:', err);
    }
    return null;
  }, []);

  // 감정에 맞는 플레이리스트 가져오기
  const getPlaylistsForEmotion = useCallback((emotion: string): PlaylistItem[] => {
    // 정확히 매칭되는 감정 찾기
    if (EMOTION_PLAYLISTS[emotion]) {
      return EMOTION_PLAYLISTS[emotion];
    }

    // 유사 감정 매핑
    const emotionMap: Record<string, string> = {
      '기쁨': '행복', '즐거움': '행복', '신남': '행복',
      '차분': '평온', '편안': '평온', '안정': '평온', '휴식': '평온',
      '우울': '슬픔', '외로움': '슬픔', '그리움': '슬픔',
      '걱정': '불안', '초조': '불안', '긴장': '불안',
      '짜증': '분노', '화남': '분노', '답답': '분노',
      '고마움': '감사', '행복': '감사',
      '두근거림': '설렘', '기대': '설렘',
    };

    const mappedEmotion = emotionMap[emotion];
    if (mappedEmotion && EMOTION_PLAYLISTS[mappedEmotion]) {
      return EMOTION_PLAYLISTS[mappedEmotion];
    }

    return EMOTION_PLAYLISTS[DEFAULT_EMOTION];
  }, []);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const cachedData = await loadFromCache();
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // API에서 현재 감정 가져오기
      const response = await apiClient.get('/review/mood-playlist');

      if (response.data.status === 'success') {
        const { currentEmotion, emotionIcon } = response.data.data;
        const playlists = getPlaylistsForEmotion(currentEmotion);

        const newData: MoodPlaylistData = {
          currentEmotion,
          emotionIcon,
          playlists,
        };

        setData(newData);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: newData,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      // API 실패 시 기본 플레이리스트 사용
      if (__DEV__) console.warn('Mood Playlist API 실패, 기본값 사용:', err);
      setData({
        currentEmotion: DEFAULT_EMOTION,
        emotionIcon: '😌',
        playlists: EMOTION_PLAYLISTS[DEFAULT_EMOTION],
      });
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, getPlaylistsForEmotion]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // YouTube 열기
  const openYouTube = useCallback(async (searchQuery: string) => {
    const encodedQuery = encodeURIComponent(searchQuery);

    // YouTube 앱 딥링크 (앱이 있으면 앱으로, 없으면 웹으로)
    const youtubeAppUrl = Platform.select({
      ios: `youtube://results?search_query=${encodedQuery}`,
      android: `vnd.youtube://results?search_query=${encodedQuery}`,
      default: `https://www.youtube.com/results?search_query=${encodedQuery}`,
    });

    const webUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

    try {
      const canOpenApp = await Linking.canOpenURL(youtubeAppUrl);
      if (canOpenApp) {
        await Linking.openURL(youtubeAppUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (err) {
      // 앱 실패 시 웹으로 폴백
      try {
        await Linking.openURL(webUrl);
      } catch (webErr) {
        if (__DEV__) console.error('YouTube 열기 실패:', webErr);
      }
    }
  }, []);

  // YouTube 검색 페이지 열기
  const openYouTubeHome = useCallback(async () => {
    const emotion = data?.currentEmotion || DEFAULT_EMOTION;
    const searchQuery = `${emotion} 감성 음악 플레이리스트`;
    await openYouTube(searchQuery);
  }, [data?.currentEmotion, openYouTube]);

  if (loading || !data) return null;

  return (
    <Card accessible={true} accessibilityLabel="감정 맞춤 플레이리스트">
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TwemojiImage emoji="🎵" size={FONT_SIZES.h3 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>
            오늘의 추천 음악
          </Text>
        </View>
      </View>

      <View style={[styles.emotionBanner, {
        backgroundColor: isDark ? colors.primary + '20' : colors.primary + '10'
      }]}>
        <TwemojiImage emoji={data.emotionIcon} size={FONT_SIZES.h1 * scale} />
        <View style={{ marginLeft: 12 * scale, flex: 1 }}>
          <Text style={[styles.emotionLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
            현재 감정
          </Text>
          <Text style={[styles.emotionName, { color: colors.text, fontSize: FONT_SIZES.bodyLarge }]}>
            {data.currentEmotion}
          </Text>
        </View>
        <View style={[styles.youtubeBadge]}>
          <TwemojiImage emoji="▶️" size={12 * scale} style={{ marginRight: 4 * scale }} />
          <Text style={[styles.youtubeText, { fontSize: FONT_SIZES.tiny }]}>YouTube</Text>
        </View>
      </View>

      {/* 플레이리스트 목록 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.playlistsScroll}
        contentContainerStyle={styles.playlistsContent}
      >
        {data.playlists.map((playlist) => (
          <TouchableOpacity
            key={playlist.id}
            style={[styles.playlistCard, {
              backgroundColor: isDark ? colors.surface : '#F8F9FA'
            }]}
            onPress={() => openYouTube(playlist.searchQuery)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel={`${playlist.name} YouTube에서 검색`}
            accessibilityRole="button"
          >
            <View style={[styles.playlistIcon, { backgroundColor: colors.primary + '20' }]}>
              <TwemojiImage emoji={playlist.icon} size={FONT_SIZES.h1 * scale} />
            </View>
            <Text
              style={[styles.playlistName, { color: colors.text, fontSize: FONT_SIZES.body }]}
              numberOfLines={1}
            >
              {playlist.name}
            </Text>
            <Text
              style={[styles.playlistDesc, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}
              numberOfLines={2}
            >
              {playlist.description}
            </Text>
            <View style={[styles.playButton, { backgroundColor: '#FF0000' + '15' }]}>
              <Text style={[styles.playButtonText, { color: '#FF0000', fontSize: FONT_SIZES.bodySmall }]}>
                ▶ YouTube
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 더보기 링크 */}
      <TouchableOpacity
        style={[styles.moreLink, { borderTopColor: colors.border }]}
        onPress={openYouTubeHome}
        accessible={true}
        accessibilityLabel="YouTube에서 더 많은 음악 탐색하기"
      >
        <Text style={[styles.moreLinkText, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall }]}>
          YouTube에서 더 많은 음악 탐색하기 →
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
    fontWeight: '700',
  },
  emotionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16 * scale,
    borderRadius: 16 * scale,
    marginBottom: 16 * scale,
  },
  emotionLabel: {
    fontWeight: '500',
  },
  emotionName: {
    fontWeight: '700',
  },
  youtubeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 12 * scale,
  },
  youtubeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  playlistsScroll: {
    marginHorizontal: -4 * scale,
  },
  playlistsContent: {
    paddingHorizontal: 4 * scale,
    gap: 12 * scale,
  },
  playlistCard: {
    width: 150 * scale,
    padding: 12 * scale,
    borderRadius: 16 * scale,
  },
  playlistIcon: {
    width: 48 * scale,
    height: 48 * scale,
    borderRadius: 12 * scale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8 * scale,
  },
  playlistName: {
    fontWeight: '700',
    marginBottom: 4 * scale,
  },
  playlistDesc: {
    lineHeight: 16 * scale,
    marginBottom: 8 * scale,
    minHeight: 32 * scale,
  },
  playButton: {
    alignItems: 'center',
    paddingVertical: 6 * scale,
    borderRadius: 8 * scale,
  },
  playButtonText: {
    fontWeight: '700',
  },
  moreLink: {
    marginTop: 16 * scale,
    paddingTop: 12 * scale,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  moreLinkText: {
    fontWeight: '500',
  },
});
