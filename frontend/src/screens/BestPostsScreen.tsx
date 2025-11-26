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
import ImageCarousel from '../components/ImageCarousel';
import ClickableNickname from '../components/ClickableNickname';
import ClickableAvatar from '../components/ClickableAvatar';
import { PostSkeletonList } from '../components/SkeletonCard';

// React Native 0.80 호환성: 기본값만 정의 (모듈 레벨에서 normalize 호출 금지)
const DEFAULT_GRID_PADDING = 12;
const DEFAULT_COLUMN_GAP = 12;
const CACHE_TTL = 5 * 60 * 1000; // 5분

// lazy getter
const getGridPadding = () => normalizeSpace(DEFAULT_GRID_PADDING);
const getColumnGap = () => normalizeSpace(DEFAULT_COLUMN_GAP);


// 랜덤 감정 아바타 데이터
const EMOTION_AVATARS = [
  { label: '기쁨이', emoji: '😊', color: '#FFD700' },
  { label: '행복이', emoji: '😄', color: '#FFA500' },
  { label: '슬픔이', emoji: '😢', color: '#4682B4' },
  { label: '우울이', emoji: '😞', color: '#708090' },
  { label: '지루미', emoji: '😑', color: '#A9A9A9' },
  { label: '버럭이', emoji: '😠', color: '#FF4500' },
  { label: '불안이', emoji: '😰', color: '#DDA0DD' },
  { label: '걱정이', emoji: '😟', color: '#FFA07A' },
  { label: '감동이', emoji: '🥺', color: '#FF6347' },
  { label: '황당이', emoji: '🤨', color: '#20B2AA' },
  { label: '당황이', emoji: '😲', color: '#FF8C00' },
  { label: '짜증이', emoji: '😤', color: '#DC143C' },
  { label: '무섭이', emoji: '😨', color: '#9370DB' },
  { label: '추억이', emoji: '🥰', color: '#87CEEB' },
  { label: '설렘이', emoji: '🤗', color: '#FF69B4' },
  { label: '편안이', emoji: '😌', color: '#98FB98' },
  { label: '궁금이', emoji: '🤔', color: '#DAA520' },
  { label: '사랑이', emoji: '❤️', color: '#E91E63' },
  { label: '아픔이', emoji: '🤕', color: '#8B4513' },
  { label: '욕심이', emoji: '🤑', color: '#32CD32' },
];

const getRandomEmotion = (userId: number, postId: number) => {
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

const truncateToSevenLines = (text: string) => {
  if (!text) return '';
  const maxChars = 266;
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
      console.error('차단 목록 로드 오류:', error);
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
      console.error('베스트 게시물 로드 오류:', error);
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
    const emotion = getRandomEmotion(post.user_id, post.post_id);
    const hasImages = post.images && post.images.length > 0;
    // TODO: 썸네일 API 구현 시 원본 대신 썸네일 사용으로 트래픽 최적화
    const imageUrls = hasImages ? post.images!.map(normalizeImageUrl) : [];

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
                    profileImageUrl={post.user?.profile_image_url}
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
          <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={hasImages ? 3 : 7}>
            {truncateToSevenLines(post.content)}
          </Text>

          {/* 이미지 */}
          {hasImages && (
            <View style={styles.imageContainer}>
              <ImageCarousel images={imageUrls} height={140} />
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
        {/* 헤더 */}
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>베스트</Text>
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

        {/* 게시물 목록 */}
        {loading && posts.length === 0 ? (
          <PostSkeletonList count={6} />
        ) : (
          <FlatList
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
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
    fontWeight: '600',
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
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  listContent: {
    paddingTop: 12,
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
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  nicknameText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  timeText: {
    fontSize: 11,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontWeight: '600',
    marginTop: 20,
    letterSpacing: -0.3,
  },
});

export default BestPostsScreen;
