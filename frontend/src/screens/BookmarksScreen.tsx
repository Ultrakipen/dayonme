// 북마크 화면 (2026 모바일 트렌드 & 인스타그램 스타일 + 스와이프)
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Text as RNText } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalize, normalizeSpace } from '../utils/responsive';
import bookmarkService, { BookmarkItem, PostType } from '../services/api/bookmarkService';
import { OptimizedImage } from '../components/OptimizedImage';

const BookmarksScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();

  const [activeTab, setActiveTab] = useState<'all' | PostType>('all');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Swipeable refs for closing other swipeables
  const swipeableRefs = useRef<Map<number, Swipeable>>(new Map());

  // Haptic feedback options
  const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  };

  // 북마크 목록 조회
  const fetchBookmarks = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await bookmarkService.getBookmarks({
        page: pageNum,
        limit: 20,
        postType: activeTab === 'all' ? undefined : activeTab,
      });

      const newBookmarks = response.data.bookmarks;

      if (refresh || pageNum === 1) {
        setBookmarks(newBookmarks);
      } else {
        setBookmarks(prev => [...prev, ...newBookmarks]);
      }

      setHasMore(pageNum < response.data.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('북마크 조회 오류:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBookmarks(1, false);
  }, [activeTab]);

  // 새로고침
  const handleRefresh = () => {
    fetchBookmarks(1, true);
  };

  // 북마크 제거
  const handleRemoveBookmark = async (item: BookmarkItem) => {
    try {
      // Haptic feedback
      ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);

      // Close swipeable
      const swipeable = swipeableRefs.current.get(item.bookmark_id);
      if (swipeable) {
        swipeable.close();
      }

      // Remove bookmark
      await bookmarkService.toggleBookmark(item.post_type, item.post.post_id);
      setBookmarks(prev => prev.filter(b => b.bookmark_id !== item.bookmark_id));

      // Success haptic
      ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
    } catch (error) {
      console.error('북마크 제거 오류:', error);
      ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
    }
  };

  // 스와이프 오른쪽 액션 (삭제)
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    item: BookmarkItem
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={[
          styles.swipeActionContainer,
          { opacity, transform: [{ translateX }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: isDark ? '#ef4444' : '#dc2626' }]}
          onPress={() => handleRemoveBookmark(item)}
          activeOpacity={0.7}
        >
          <Icon name="trash-outline" size={normalize(22)} color="#ffffff" />
          <RNText style={styles.deleteButtonText}>삭제</RNText>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // 게시물 이동
  const handlePostPress = (item: BookmarkItem) => {
    if (!item.post) return;

    if (item.post_type === 'my_day') {
      (navigation as any).navigate('Home', {
        screen: 'PostDetail',
        params: { postId: item.post.post_id },
      });
    } else {
      (navigation as any).navigate('Comfort', {
        screen: 'ComfortWallDetail',
        params: { postId: item.post.post_id },
      });
    }
  };

  // 북마크 카드 렌더링 (스와이프 가능)
  const renderBookmarkCard = (item: BookmarkItem) => {
    if (!item.post) return null;

    const { post } = item;
    const hasImage = post.images && post.images.length > 0;

    return (
      <Swipeable
        key={item.bookmark_id}
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current.set(item.bookmark_id, ref);
          }
        }}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
        onSwipeableOpen={() => {
          ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
        }}
      >
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.bg.border }
          ]}
          onPress={() => handlePostPress(item)}
          activeOpacity={0.7}
          accessibilityLabel={`북마크된 게시물: ${post.content.substring(0, 30)}`}
          accessibilityHint="탭하여 게시물 보기, 왼쪽으로 스와이프하여 삭제"
        >
          <View style={styles.cardHeader}>
            <View style={styles.typeTag}>
              <Icon
                name={item.post_type === 'my_day' ? 'calendar-outline' : 'heart-outline'}
                size={normalize(14)}
                color={isDark ? '#a78bfa' : '#667eea'}
              />
              <RNText style={[styles.typeText, { color: isDark ? '#a78bfa' : '#667eea' }]}>
                {item.post_type === 'my_day' ? '나의 하루' : '위로와 공감'}
              </RNText>
            </View>
            {/* 스와이프로 대체되어 북마크 아이콘 제거 */}
            <Icon
              name="chevron-back"
              size={normalize(18)}
              color={theme.text.tertiary}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </View>

          <View style={styles.cardContent}>
            {hasImage && (
              <OptimizedImage
                uri={post.images[0]}
                width={normalize(80)}
                height={normalize(80)}
                size="thumbnail"
                quality="medium"
                style={styles.thumbnail}
              />
            )}
            <View style={[styles.textContent, hasImage && styles.textContentWithImage]}>
              <RNText
                style={[styles.contentText, { color: theme.text.primary }]}
                numberOfLines={hasImage ? 3 : 4}
              >
                {post.content}
              </RNText>
              <View style={styles.meta}>
                <RNText style={[styles.metaText, { color: theme.text.tertiary }]}>
                  {post.created_at
                    ? (() => {
                        const date = new Date(post.created_at);
                        return !isNaN(date.getTime())
                          ? date.toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '날짜 정보 없음';
                      })()
                    : '날짜 정보 없음'}
                </RNText>
              </View>
            </View>
          </View>

          {post.tags && post.tags.length > 0 && (
            <View style={styles.tags}>
              {post.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag.tag_id}
                  style={[styles.tag, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
                >
                  <RNText style={[styles.tagText, { color: theme.text.secondary }]}>
                    #{tag.name}
                  </RNText>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.bg.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="뒤로 가기"
          >
            <Icon name="arrow-back" size={normalize(24)} color={theme.text.primary} />
          </TouchableOpacity>
          <RNText style={[styles.headerTitle, { color: theme.text.primary }]}>
            관심 글
          </RNText>
          <View style={{ width: normalize(24) }} />
        </View>

      {/* 탭 필터 */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.card, borderBottomColor: theme.bg.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && styles.activeTab,
            activeTab === 'all' && { borderBottomColor: isDark ? '#a78bfa' : '#667eea' }
          ]}
          onPress={() => setActiveTab('all')}
        >
          <RNText style={[
            styles.tabText,
            { color: theme.text.secondary },
            activeTab === 'all' && styles.activeTabText,
            activeTab === 'all' && { color: isDark ? '#a78bfa' : '#667eea' }
          ]}>
            전체
          </RNText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my_day' && styles.activeTab,
            activeTab === 'my_day' && { borderBottomColor: isDark ? '#a78bfa' : '#667eea' }
          ]}
          onPress={() => setActiveTab('my_day')}
        >
          <RNText style={[
            styles.tabText,
            { color: theme.text.secondary },
            activeTab === 'my_day' && styles.activeTabText,
            activeTab === 'my_day' && { color: isDark ? '#a78bfa' : '#667eea' }
          ]}>
            나의 하루
          </RNText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'comfort_wall' && styles.activeTab,
            activeTab === 'comfort_wall' && { borderBottomColor: isDark ? '#a78bfa' : '#667eea' }
          ]}
          onPress={() => setActiveTab('comfort_wall')}
        >
          <RNText style={[
            styles.tabText,
            { color: theme.text.secondary },
            activeTab === 'comfort_wall' && styles.activeTabText,
            activeTab === 'comfort_wall' && { color: isDark ? '#a78bfa' : '#667eea' }
          ]}>
            위로와 공감
          </RNText>
        </TouchableOpacity>
      </View>

      {/* 콘텐츠 */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#a78bfa' : '#667eea'}
            colors={[isDark ? '#a78bfa' : '#667eea']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? '#a78bfa' : '#667eea'} />
          </View>
        ) : bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="bookmark-outline" size={normalize(64)} color={theme.text.tertiary} />
            <RNText style={[styles.emptyText, { color: theme.text.secondary }]}>
              북마크한 글이 없습니다
            </RNText>
            <RNText style={[styles.emptySubText, { color: theme.text.tertiary }]}>
              관심있는 글을 북마크해보세요
            </RNText>
          </View>
        ) : (
          <>
            {bookmarks.map(renderBookmarkCard)}
            {loading && page > 1 && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={isDark ? '#a78bfa' : '#667eea'} />
              </View>
            )}
          </>
        )}
      </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalizeSpace(16),
    paddingVertical: normalizeSpace(16),
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: normalizeSpace(14),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: normalize(14),
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  scrollContent: {
    padding: normalizeSpace(16),
  },
  card: {
    borderRadius: normalize(16),
    padding: normalizeSpace(16),
    marginBottom: normalizeSpace(12),
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalizeSpace(12),
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalizeSpace(6),
  },
  typeText: {
    fontSize: normalize(13),
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'row',
    gap: normalizeSpace(12),
  },
  thumbnail: {
    borderRadius: normalize(12),
  },
  textContent: {
    flex: 1,
  },
  textContentWithImage: {
    flex: 1,
  },
  contentText: {
    fontSize: normalize(15),
    lineHeight: normalize(22),
    marginBottom: normalizeSpace(8),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: normalize(12),
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalizeSpace(8),
    marginTop: normalizeSpace(12),
  },
  tag: {
    paddingHorizontal: normalizeSpace(12),
    paddingVertical: normalizeSpace(6),
    borderRadius: normalize(12),
  },
  tagText: {
    fontSize: normalize(12),
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalizeSpace(40),
  },
  loadingMore: {
    paddingVertical: normalizeSpace(20),
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalizeSpace(80),
  },
  emptyText: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginTop: normalizeSpace(16),
  },
  emptySubText: {
    fontSize: normalize(14),
    marginTop: normalizeSpace(8),
  },
  // 스와이프 액션 스타일
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: normalizeSpace(12),
  },
  deleteButton: {
    width: normalize(80),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: normalize(16),
    borderBottomRightRadius: normalize(16),
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: normalize(13),
    fontWeight: '700',
    marginTop: normalizeSpace(4),
  },
});

export default BookmarksScreen;
