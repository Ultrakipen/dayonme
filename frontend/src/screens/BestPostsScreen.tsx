// 이번주 베스트 전체보기 화면
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
  RefreshControl,
  Image,
  SafeAreaView,
  StatusBar,
  Vibration,
  Animated,
  ScrollView,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import comfortWallService from '../services/api/comfortWallService';
import blockService, { BlockedUser, BlockedContent } from '../services/api/blockService';
import { normalizeImageUrl } from '../utils/imageUtils';
import { RFValue, normalize, normalizeSpace, normalizeTouchable, wp, hp } from '../utils/responsive';
import FastImage from 'react-native-fast-image';
import ClickableNickname from '../components/ClickableNickname';
import ClickableAvatar from '../components/ClickableAvatar';
import { PostSkeletonList } from '../components/SkeletonCard';
import { EMOTION_AVATARS } from '../constants/emotions';

// React Native 0.80 호환성: 기본값만 정의 (모듈 레벨에서 normalize 호출 금지)
const DEFAULT_GRID_PADDING = 12;
const DEFAULT_COLUMN_GAP = 12;
const CACHE_TTL = 5 * 60 * 1000; // 5분

// lazy getter
const getGridPadding = () => normalizeSpace(DEFAULT_GRID_PADDING);
const getColumnGap = () => normalizeSpace(DEFAULT_COLUMN_GAP);

// Animated FlatList 생성 (useNativeDriver 지원)
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);


// 감정 데이터는 emotions.ts에서 import (일관성 유지)

const getRandomEmotion = (userId: number, postId: number, anonymousEmotionId?: number | null) => {
  // 저장된 익명 감정이 있으면 해당 감정 반환
  if (anonymousEmotionId && anonymousEmotionId >= 1 && anonymousEmotionId <= 20) {
    const emotion = EMOTION_AVATARS.find(e => e.id === anonymousEmotionId);
    if (emotion) return emotion;
  }

  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const seed1 = (userSeed * 17 + postSeed * 37) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41) % 500;
  const seed3 = (userSeed + postSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_AVATARS.length;
  return EMOTION_AVATARS[finalSeed];
};

const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  else if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  else if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  else if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  else if (diffInSeconds < 2419200) return `${Math.floor(diffInSeconds / 604800)}주 전`;
  else return postDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
};

// 이미지 유무에 따라 텍스트 길이 최적화 (2026 트렌드 반영)
const truncateText = (text: string, hasImages: boolean) => {
  if (!text) return '';
  // 이미지 있을 때: 4줄 약 152자, 이미지 없을 때: 5줄 약 190자
  const maxChars = hasImages ? 152 : 190;
  if (text.length <= maxChars) return text;
  const truncated = text.substring(0, maxChars - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  if (lastSpaceIndex > maxChars * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  return truncated + '...';
};

interface BestPost {
  post_id: number;
  title: string;
  content: string;
  user_id: number;
  is_anonymous: boolean;
  anonymous_emotion_id?: number | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at?: string;
  tags?: Array<{ tag_id: number; name: string }>;
  images?: string[];
  image_url?: string;
  user?: {
    nickname?: string;
    profile_image_url?: string;
  };
}

const BestPostsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme: modernTheme, isDark } = useModernTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const colors = useMemo(() => ({
    background: modernTheme.bg.primary,
    cardBackground: modernTheme.bg.card,
    headerBackground: modernTheme.bg.card,
    text: modernTheme.text.primary,
    textSecondary: modernTheme.text.secondary,
    border: modernTheme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
    iconColor: isDark ? '#FFFFFF' : '#1a1a1a',
  }), [modernTheme, isDark]);

  const POST_CARD_WIDTH = useMemo(() => (width - (getGridPadding() * 2) - getColumnGap()) / 2, [width]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<BestPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedContents, setBlockedContents] = useState<BlockedContent[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [sortBy, setSortBy] = useState<'likes' | 'comments' | 'recent'>('likes');

  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  const lastFetchTimeRef = useRef<number>(0);

  // 스크롤 헤더 숨김 애니메이션
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 174; // 헤더(60) + 필터(114) = 174px

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  // 차단 목록 로드
  const loadBlockedData = useCallback(async () => {
    try {
      const [usersResponse, contentsResponse] = await Promise.all([
        blockService.getBlockedUsers(),
        blockService.getBlockedContents(),
      ]);

      if (usersResponse.data?.status === 'success') {
        setBlockedUsers(usersResponse.data.data || []);
      }

      if (contentsResponse.data?.status === 'success') {
        setBlockedContents(contentsResponse.data.data || []);
      }
    } catch (error) {
      if (__DEV__) console.error('차단 목록 로드 오류:', error);
    }
  }, []);

  // 베스트 게시물 로드
  const loadBestPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append && !hasMoreRef.current) return;
      if (append && loadingMoreRef.current) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await comfortWallService.getBestPosts({
        period,
        page: pageNum,
        limit: 20,
      });

      if (response.data?.status === 'success') {
        const newPosts = response.data.data.posts || [];

        // 디버그: 이미지 데이터 확인
        if (__DEV__ && newPosts.length > 0) {
          console.log('📸 베스트 게시물 이미지 필드:', {
            total: newPosts.length,
            withImages: newPosts.filter((p: any) => p.images?.length > 0).length,
            withImageUrl: newPosts.filter((p: any) => p.image_url).length,
          });
          console.log('📸 첫 번째 게시물:', {
            post_id: newPosts[0].post_id,
            title: newPosts[0].title,
            images: newPosts[0].images,
            image_url: newPosts[0].image_url,
          });
        }

        // 차단 필터링
        const filteredPosts = newPosts.filter((post: BestPost) => {
          const isBlockedContent = blockedContents.some(
            bc => bc.content_type === 'post' && bc.content_id === post.post_id
          );
          if (isBlockedContent) return false;

          if (!post.is_anonymous) {
            const isBlockedUser = blockedUsers.some(bu => bu.blocked_id === post.user_id);
            if (isBlockedUser) return false;
          }

          return true;
        });

        if (append) {
          setPosts(prev => {
            // 중복 제거: 기존 post_id와 새로운 post_id를 비교
            const existingIds = new Set(prev.map(p => p.post_id));
            const uniqueNewPosts = filteredPosts.filter(p => !existingIds.has(p.post_id));
            return [...prev, ...uniqueNewPosts];
          });
        } else {
          setPosts(filteredPosts);
        }

        setHasMore(newPosts.length >= 20);
      }
    } catch (error) {
      if (__DEV__) console.error('베스트 게시물 로드 오류:', error);
      Alert.alert('오류', '베스트 게시물을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (append) {
        setRefreshing(false);
      }
    }
  }, [blockedUsers, blockedContents, period]);

  // 초기 로드 (캐싱 적용)
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const now = Date.now();
        const shouldRefetch = (now - lastFetchTimeRef.current) > CACHE_TTL;

        if (!shouldRefetch && posts.length > 0) return;

        lastFetchTimeRef.current = now;
        if (user) {
          await loadBlockedData();
        }
        await loadBestPosts(1, false);
      };
      init();
    }, [user, loadBlockedData, loadBestPosts, posts.length])
  );

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    lastFetchTimeRef.current = Date.now();
    if (user) {
      await loadBlockedData();
    }
    await loadBestPosts(1, false);
    setRefreshing(false);
  }, [user, loadBlockedData, loadBestPosts]);

  // 무한 스크롤
  const handleLoadMore = useCallback(() => {
    if (hasMoreRef.current && !loadingMoreRef.current) {
      const nextPage = pageRef.current + 1;
      setPage(nextPage);
      loadBestPosts(nextPage, true);
    }
  }, [loadBestPosts]);

  // 정렬된 게시물
  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    if (sortBy === 'likes') return sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
    if (sortBy === 'comments') return sorted.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
    if (sortBy === 'recent') return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [posts, sortBy]);

  // 기간/정렬 변경 시 초기화
  const handleFilterChange = useCallback((newPeriod?: typeof period, newSort?: typeof sortBy) => {
    if (newPeriod) setPeriod(newPeriod);
    if (newSort) setSortBy(newSort);
    setPage(1);
    setPosts([]);
    lastFetchTimeRef.current = 0;
  }, []);

  // 스크롤 이벤트 핸들러 (인스타그램 스타일)
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        // 스크롤 방향 감지 (최소 이동 거리 5px)
        if (Math.abs(diff) > 5) {
          if (diff > 0 && currentScrollY > 50) {
            // 아래로 스크롤 - 헤더 숨김
            Animated.timing(headerTranslateY, {
              toValue: -HEADER_HEIGHT,
              duration: 250,
              useNativeDriver: true,
            }).start();
          } else if (diff < 0 || currentScrollY < 50) {
            // 위로 스크롤 또는 상단 근처 - 헤더 표시
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start();
          }
          lastScrollY.current = currentScrollY;
        }
      },
    }
  );

  // 게시물 클릭
  const handlePostPress = useCallback((post: BestPost) => {
    Vibration.vibrate(10);
    navigation.navigate('PostDetail', {
      postId: post.post_id,
      postType: 'comfort',
    });
  }, [navigation]);

  // 게시물 카드 렌더링
  const renderPost = useCallback(({ item: post }: { item: BestPost }) => {
    const emotion = getRandomEmotion(post.user_id, post.post_id, post.anonymous_emotion_id);

    // 이미지 처리: images 배열, image_url 문자열/JSON 배열 모두 지원
    let imageUrls: string[] = [];

    if (post.images && post.images.length > 0) {
      // 1. images 배열이 있는 경우
      imageUrls = post.images.map(url => {
        const normalized = normalizeImageUrl(url);
        // 최적화 API 우회: 원본 URL 사용 (URL 중복 문제 해결)
        return normalized.replace('/api/images/', '/api/uploads/');
      });
    } else if (post.image_url) {
      // 2. image_url 처리
      try {
        // JSON 문자열로 된 배열인지 확인 (예: '["/path/1.jpg","/path/2.jpg"]')
        if (typeof post.image_url === 'string' && post.image_url.startsWith('[')) {
          const parsed = JSON.parse(post.image_url);
          if (Array.isArray(parsed)) {
            imageUrls = parsed.map(url => normalizeImageUrl(url));
          } else {
            imageUrls = [normalizeImageUrl(post.image_url)];
          }
        } else {
          // 단일 URL 문자열
          imageUrls = [normalizeImageUrl(post.image_url)];
        }
      } catch (e) {
        // JSON 파싱 실패 시 단일 문자열로 처리
        if (__DEV__) console.error('❌ JSON 파싱 실패:', post.image_url, e);
        imageUrls = [normalizeImageUrl(post.image_url)];
      }
    }
    const hasImages = imageUrls.length > 0;

    // 디버그: 모든 게시물의 이미지 처리 결과 출력
    if (__DEV__) {
      console.log(`🖼️ [${post.post_id}] 이미지 처리:`, {
        title: post.title?.substring(0, 20),
        image_url_type: typeof post.image_url,
        image_url_length: post.image_url?.length,
        image_url_preview: post.image_url?.substring(0, 50),
        imageUrls_count: imageUrls.length,
        imageUrls_preview: imageUrls[0]?.substring(0, 50),
        hasImages,
      });
    }

    return (
      <TouchableOpacity
        style={[
          styles.postCard,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: isDark ? '#000' : '#000',
            width: POST_CARD_WIDTH,
          }
        ]}
        onPress={() => handlePostPress(post)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${post.title || '제목 없음'}, ${post.like_count || 0}개 좋아요, ${post.comment_count || 0}개 댓글`}
        accessibilityHint="탭하여 게시물 상세보기"
      >
        <View style={styles.postCardContent}>
          {/* 헤더 */}
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              {post.is_anonymous ? (
                <>
                  <View style={[styles.emotionAvatar, { backgroundColor: `${emotion.color}15` }]}>
                    <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                  </View>
                  <View style={styles.authorTextContainer}>
                    <Text style={[styles.emotionLabel, { color: colors.text }]}>{emotion.label}</Text>
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>{getTimeAgo(post.created_at)}</Text>
                  </View>
                </>
              ) : (
                <>
                  <ClickableAvatar
                    userId={post.user_id}
                    avatarUrl={post.user?.profile_image_url}
                    nickname={post.user?.nickname}
                    size={38}
                  />
                  <View style={styles.authorTextContainer}>
                    <ClickableNickname
                      userId={post.user_id}
                      nickname={post.user?.nickname || '알 수 없음'}
                      style={[styles.nicknameText, { color: colors.text }]}
                    />
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>{getTimeAgo(post.created_at)}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* 제목 */}
          {post.title && (
            <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
              {post.title}
            </Text>
          )}

          {/* 내용 */}
          <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={hasImages ? 4 : 5}>
            {truncateText(post.content, hasImages)}
          </Text>

          {/* 이미지 */}
          {hasImages && (
            <View style={styles.imageContainer}>
              {__DEV__ && console.log(`✅ [${post.post_id}] 이미지 렌더링:`, imageUrls)}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                style={styles.imageScroll}
              >
                {imageUrls.map((imageUrl, index) => (
                  <FastImage
                    key={`${post.post_id}-img-${index}`}
                    source={{
                      uri: imageUrl,
                      priority: FastImage.priority.high,
                    }}
                    style={styles.postImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ))}
              </ScrollView>
              {imageUrls.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>1/{imageUrls.length}</Text>
                </View>
              )}
            </View>
          )}

          {/* 하단 정보 */}
          <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
            <View style={styles.statsContainer}>
              <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <MaterialCommunityIcons name="heart" size={16} color={isDark ? '#ff6b9d' : '#e91e63'} />
                <Text style={[styles.statText, { color: colors.text }]}>{post.like_count || 0}</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <MaterialCommunityIcons name="comment" size={16} color={colors.primary} />
                <Text style={[styles.statText, { color: colors.text }]}>{post.comment_count || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handlePostPress, colors, isDark, POST_CARD_WIDTH]);

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.headerBackground }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBackground} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 헤더 (스크롤 시 자동 숨김) */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              backgroundColor: colors.headerBackground,
              transform: [{ translateY: headerTranslateY }],
            }
          ]}
        >
          <View style={[styles.header, { backgroundColor: colors.headerBackground, shadowColor: isDark ? '#000' : '#000' }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.iconColor} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons name="trophy" size={20} color={isDark ? '#FFD700' : '#FFA500'} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>위로와 공감 베스트</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* 필터 */}
          <View style={[styles.filterContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.periodTabs}>
              {[
                { key: 'daily', label: '오늘', icon: 'calendar-today' },
                { key: 'weekly', label: '이번주', icon: 'calendar-week' },
                { key: 'monthly', label: '이번달', icon: 'calendar-month' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.periodTab,
                    period === tab.key && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleFilterChange(tab.key as typeof period)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={16}
                    color={period === tab.key ? '#fff' : colors.textSecondary}
                  />
                  <Text style={[
                    styles.periodTabText,
                    { color: period === tab.key ? '#fff' : colors.textSecondary }
                  ]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sortButtons}>
              {[
                { key: 'likes', label: '좋아요', icon: 'heart' },
                { key: 'comments', label: '댓글', icon: 'comment' },
                { key: 'recent', label: '최신', icon: 'clock' },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.key}
                  style={[
                    styles.sortButton,
                    { borderColor: colors.border },
                    sortBy === sort.key && { backgroundColor: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(59,130,246,0.1)', borderColor: colors.primary },
                  ]}
                  onPress={() => handleFilterChange(undefined, sort.key as typeof sortBy)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={sort.icon as any}
                    size={14}
                    color={sortBy === sort.key ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[
                    styles.sortButtonText,
                    { color: sortBy === sort.key ? colors.primary : colors.textSecondary }
                  ]}>{sort.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* 게시물 목록 */}
        {loading && posts.length === 0 ? (
          <PostSkeletonList count={6} />
        ) : (
          <AnimatedFlatList
            data={sortedPosts}
            renderItem={renderPost}
            keyExtractor={(item) => `best-${item.post_id}`}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() =>
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="trophy-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>베스트 게시물이 없습니다</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  placeholder: {
    width: 28,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  periodTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  periodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  periodTabText: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.2,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.2,
  },
  listContent: {
    paddingTop: 186, // 헤더 높이(174) + 여백(12)
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: DEFAULT_GRID_PADDING,
    gap: DEFAULT_COLUMN_GAP,
    marginBottom: 14,
  },
  postCard: {
    minHeight: 240,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  postCardContent: {
    padding: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emotionAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionEmoji: {
    fontSize: 22,
  },
  authorTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  emotionLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
  },
  nicknameText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
  },
  timeText: {
    fontSize: 11,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-ExtraBold',
    marginBottom: 8,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  imageContainer: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imageScroll: {
    borderRadius: 12,
  },
  postImage: {
    width: 160,
    height: 140,
    borderRadius: 12,
    marginRight: 8,
  },
  imageCounter: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    marginTop: 20,
    letterSpacing: -0.3,
  },
});

export default BestPostsScreen;
