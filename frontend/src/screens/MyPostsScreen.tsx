import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  View,
  TextInput,
  Animated,
  Vibration,
  useWindowDimensions,
  BackHandler,
  Image
} from 'react-native';
import {
  Card,
  IconButton,
  Menu,
  Divider,
  ActivityIndicator,
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import myDayService from '../services/api/myDayService';
import comfortWallService from '../services/api/comfortWallService';
import { Box, Text, HStack, VStack, Pressable, Center } from '../components/ui';
import { normalizeImageUrl } from '../utils/imageUtils';
import { TYPOGRAPHY, ACCESSIBLE_COLORS } from '../utils/typography';
import { sanitizeUrl } from '../utils/validation';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import ImageCarousel from '../components/ImageCarousel';
import { OptimizedImage } from '../components/OptimizedImage';
import { useMyPosts, useDeletePost } from '../hooks/useQueryPosts';
import { getScale } from '../utils/responsive';

// 게시물 타입 정의
interface Post {
  id: number;
  content: string;
  image_url?: string;
  thumbnail_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  emotions?: any[];
  type: 'myDay' | 'comfort';
  title?: string;
  tag?: string;
  images?: string[];
}

// 시간 포맷팅 함수
const formatTimeAgo = (dateString: string): string => {
  try {
    if (!dateString) return '방금 전';
    const now = new Date();
    const postDate = new Date(dateString);
    if (isNaN(postDate.getTime())) return '방금 전';
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일`;
    return postDate.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
 } catch {
    return '방금 전';
  }
};

interface MyPostsScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    canGoBack: () => boolean;
    setOptions: (options: any) => void;
  };
}

const MyPostsScreen: React.FC<MyPostsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme, isDark } = useModernTheme();
  const route = useRoute();
  const { sourceScreen } = route.params as { sourceScreen?: 'Comfort' | 'Home' } || {};
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // 테마 색상 정의
  const themeColors = useMemo(() => ({
    primaryLight: isDark ? '#4c52a8' : '#eef2ff',
    inputBackground: theme.colors.surface,
    placeholder: theme.text.tertiary,
    border: theme.colors.border,
    searchIcon: theme.colors.primary,
    likeColor: isDark ? '#FF8A8A' : '#EF4444',
    commentColor: isDark ? '#60A5FA' : '#3B82F6',
  }), [isDark, theme]);


  const scaleFontSize = useCallback((size: number) => Math.round(size * getScale()), []);
  const scaleSpacing = useCallback((size: number) => Math.round(size * getScale()), []);

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'myDay' | 'comfort'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputText, setSearchInputText] = useState(''); // 검색 입력 상태를 부모로 이동
  const [searchType, setSearchType] = useState<'all' | 'content' | 'tag'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cachedPosts, setCachedPosts] = useState<Post[]>([]);
  const [lastFetch, setLastFetch] = useState(0);
  const PAGE_SIZE = 15;
  const CACHE_DURATION = 3 * 60 * 1000;

  // 검색 실행 - 즉시 실행으로 변경
  const handleSearchSubmit = useCallback(() => {
    const trimmedQuery = searchInputText.trim();
    if (trimmedQuery.length >= 1) {
      setSearchQuery(trimmedQuery);
      setPage(1);
    }
    Vibration.vibrate(5);
  }, [searchInputText]);

  const handleSearchClear = useCallback(() => {
    setSearchInputText('');
    setSearchQuery('');
    setSearchType('all');
    setPage(1);
    Vibration.vibrate(5);
  }, []);

  // 정렬 기능 상태
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'mostLiked' | 'mostCommented'>('latest');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // 상단 이동 버튼 상태
  const flatListRef = useRef<FlatList>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollToTopOpacity = useRef(new Animated.Value(0)).current;

  const filteredAndSearchedPosts = useMemo(() => {
    let filtered = selectedTab === 'all' ? posts : posts.filter(post => post.type === selectedTab);
    if (searchQuery.trim()) {
      filtered = filtered.filter(post => {
        const query = searchQuery.toLowerCase();
        switch (searchType) {
          case 'content':
            return post.content.toLowerCase().includes(query) || (post.title?.toLowerCase().includes(query));
          case 'tag':
            return post.tag?.toLowerCase().includes(query) || post.emotions?.some(e => e.name.toLowerCase().includes(query));
          default:
            return post.content.toLowerCase().includes(query) || (post.title?.toLowerCase().includes(query)) ||
                   (post.tag?.toLowerCase().includes(query)) || post.emotions?.some(e => e.name.toLowerCase().includes(query));
        }
      });
    }
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'latest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'mostLiked': return b.likes_count - a.likes_count;
        case 'mostCommented': return b.comments_count - a.comments_count;
        default: return 0;
      }
    });
    return sorted.slice(0, page * PAGE_SIZE);
  }, [posts, selectedTab, searchQuery, searchType, sortBy, page]);

  const cachedPostsRef = useRef<Post[]>([]);
  const lastFetchRef = useRef<number>(0);

  // ref 동기화를 하나의 useEffect로 통합
  useEffect(() => {
    cachedPostsRef.current = cachedPosts;
    lastFetchRef.current = lastFetch;
  }, [cachedPosts, lastFetch]);

  const sanitizeUrlCallback = useCallback((url: string) => {
    return sanitizeUrl(url);
  }, []);

  const loadPosts = useCallback(async (refresh = false) => {
    if (!user) return;

    const now = Date.now();
    if (!refresh && cachedPostsRef.current.length > 0 && now - lastFetchRef.current < CACHE_DURATION) {
      setPosts(cachedPostsRef.current);
      setIsLoading(false);
      return;
    }

    try {
      if (refresh) {
        setIsRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else setIsLoading(true);

      let myDayPosts: Post[] = [];
      let comfortPosts: Post[] = [];

      // 선택된 탭에 따라 필요한 API만 호출
      if (selectedTab === 'all') {
        const [myDayResponse, comfortResponse] = await Promise.all([
          myDayService.getMyPosts({ limit: 100 }),
          comfortWallService.getMyPosts({ limit: 100 })
        ]);

        const myDayData = myDayResponse?.data?.data?.posts || myDayResponse?.data?.posts || myDayResponse?.data || [];
        myDayPosts = Array.isArray(myDayData) ? myDayData.map((post: any) => ({
          id: post.post_id,
          content: (post.content || '').substring(0, 5000),
          image_url: sanitizeUrlCallback(post.image_url),
          thumbnail_url: sanitizeUrlCallback(post.thumbnail_url || post.image_url),
          created_at: post.created_at || post.createdAt,
          likes_count: post.like_count || post.likes_count || 0,
          comments_count: post.comment_count || post.comments_count || 0,
          emotions: post.emotions,
          type: 'myDay' as const
        })) : [];

        const comfortData = comfortResponse?.data?.data?.posts || comfortResponse?.data?.posts || comfortResponse?.data || [];
        comfortPosts = Array.isArray(comfortData) ? comfortData.map((post: any) => ({
          id: post.post_id,
          content: (post.content || '').substring(0, 5000),
          image_url: sanitizeUrlCallback(post.image_url),
          thumbnail_url: sanitizeUrlCallback(post.thumbnail_url || post.image_url),
          created_at: post.created_at,
          likes_count: post.like_count || post.likes_count || 0,
          comments_count: post.comment_count || post.comments_count || 0,
          title: post.title,
          tag: post.tag,
          type: 'comfort' as const
        })) : [];
      } else if (selectedTab === 'myDay') {
        const myDayResponse = await myDayService.getMyPosts({ limit: 100 });
        const myDayData = myDayResponse?.data?.data?.posts || myDayResponse?.data?.posts || myDayResponse?.data || [];
        myDayPosts = Array.isArray(myDayData) ? myDayData.map((post: any) => ({
          id: post.post_id,
          content: (post.content || '').substring(0, 5000),
          image_url: sanitizeUrlCallback(post.image_url),
          thumbnail_url: sanitizeUrlCallback(post.thumbnail_url || post.image_url),
          created_at: post.created_at || post.createdAt,
          likes_count: post.like_count || post.likes_count || 0,
          comments_count: post.comment_count || post.comments_count || 0,
          emotions: post.emotions,
          type: 'myDay' as const
        })) : [];
      } else if (selectedTab === 'comfort') {
        const comfortResponse = await comfortWallService.getMyPosts({ limit: 100 });
        const comfortData = comfortResponse?.data?.data?.posts || comfortResponse?.data?.posts || comfortResponse?.data || [];
        comfortPosts = Array.isArray(comfortData) ? comfortData.map((post: any) => ({
          id: post.post_id,
          content: (post.content || '').substring(0, 5000),
          image_url: sanitizeUrlCallback(post.image_url),
          thumbnail_url: sanitizeUrlCallback(post.thumbnail_url || post.image_url),
          created_at: post.created_at,
          likes_count: post.like_count || post.likes_count || 0,
          comments_count: post.comment_count || post.comments_count || 0,
          title: post.title,
          tag: post.tag,
          type: 'comfort' as const
        })) : [];
      }

      const allPosts = [...myDayPosts, ...comfortPosts];
      setPosts(allPosts);
      setCachedPosts(allPosts);
      setLastFetch(Date.now());
    } catch (error: any) {
      const msg = error?.response?.status === 401 ? '로그인이 필요합니다.' :
                  error?.message?.includes('Network') ? '네트워크 연결을 확인해주세요.' : '게시물을 불러오지 못했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, sanitizeUrlCallback, selectedTab]);

  // 화면 포커스시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadPosts(true);
    }, [loadPosts])
  );

  // 뒤로가기 핸들러
  const handleGoBack = useCallback(() => {
    if (sourceScreen === 'Comfort') {
      // @ts-ignore
      navigation.getParent()?.navigate('Main', { screen: 'Comfort' });
    } else if (sourceScreen === 'Home') {
      // @ts-ignore
      navigation.getParent()?.navigate('Main', { screen: 'Home' });
    } else {
      navigation.goBack();
    }
  }, [navigation, sourceScreen]);

  // 안드로이드 하드웨어 백 버튼 처리
  useEffect(() => {
    const backAction = () => {
      handleGoBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [handleGoBack]);

  useEffect(() => {
    navigation.setOptions({
      title: '나의 게시글',
      headerStyle: {
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0
      },
      headerTintColor: theme.text.primary,
      headerTitleStyle: {
        fontSize: TYPOGRAPHY.h2,
        fontWeight: '700',
        letterSpacing: -0.5
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            Vibration.vibrate(10);
            handleGoBack();
          }}
          style={{ padding: scaleSpacing(8), marginLeft: scaleSpacing(6) }}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={scaleFontSize(24)} color={theme.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, scaleFontSize, scaleSpacing, theme, handleGoBack]);

  // 게시물 수정
  const handleEditPost = (post: Post) => {
    setOpenMenuId(null);

    if (post.type === 'myDay') {
      navigation.navigate('WriteMyDay', {
        isEditMode: true,
        editPostId: post.id,
        existingPost: {
          post_id: post.id,
          content: post.content,
          image_url: post.image_url,
          emotions: post.emotions,
          emotion_id: post.emotion_id,
          is_anonymous: post.is_anonymous
        }
      });
    } else {
      navigation.navigate('WriteComfortPost', {
        postId: post.id
      });
    }
  };

  // 게시물 상세 보기
  const handleViewDetail = (post: Post) => {
    // post.type에 따라 sourceScreen 결정
    const sourceScreen = post.type === 'comfort' ? 'Comfort' : post.type === 'myDay' ? 'Home' : undefined;

    navigation.navigate('PostDetail', {
      postId: post.id,
      postType: post.type,
      sourceScreen, // 출처 스크린 정보 전달
      enableSwipe: true
    });
  };

  // 메뉴 토글
  const toggleMenu = (postId: number) => {
    setOpenMenuId(prev => prev === postId ? null : postId);
  };

  // 삭제 확인 다이얼로그 표시
  const showDeleteDialog = (post: Post) => {
    setSelectedPost(post);
    setOpenMenuId(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedPost) return;

    try {
      if (selectedPost.type === 'myDay') {
        await myDayService.deletePost(selectedPost.id);
      } else {
        await comfortWallService.deletePost(selectedPost.id);
      }

      setPosts(prev => prev.filter(post => post.id !== selectedPost.id));
      setCachedPosts(prev => prev.filter(post => post.id !== selectedPost.id));
      setShowDeleteModal(false);
      setSelectedPost(null);

      Alert.alert('완료', '게시물이 삭제되었습니다.');
     } catch (error: any) {
      const msg = error?.response?.status === 403 ? '삭제 권한이 없습니다.' :
                  error?.message?.includes('Network') ? '네트워크 연결을 확인해주세요.' : '게시물 삭제에 실패했습니다.';
      Alert.alert('오류', msg);
    }
  }, [selectedPost]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // 스크롤 위치 추적
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > 300;

    if (shouldShow !== showScrollToTop) {
      setShowScrollToTop(shouldShow);
      Animated.timing(scrollToTopOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showScrollToTop, scrollToTopOpacity]);

  // 상단으로 스크롤
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // 더 불러오기
  const loadMore = useCallback(() => {
    // 검색 중일 때는 클라이언트 필터링이므로 더 불러오지 않음
    if (searchQuery.trim()) return;

    const totalFiltered = selectedTab === 'all' ? posts.length : posts.filter(p => p.type === selectedTab).length;
    if (!isLoadingMore && hasMore && filteredAndSearchedPosts.length < totalFiltered) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [searchQuery, isLoadingMore, hasMore, filteredAndSearchedPosts.length, posts.length, selectedTab]);


  // SearchSection을 useMemo로 메모이제이션
  const SearchSection = useMemo(() => (
    <VStack style={{
      paddingHorizontal: scaleSpacing(12),
      paddingVertical: scaleSpacing(10),
      backgroundColor: theme.colors.card,
      borderBottomWidth: isDark ? 1 : 0,
      borderBottomColor: isDark ? themeColors.border : 'transparent',
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.03,
      shadowRadius: 2,
      elevation: isDark ? 0 : 1
    }}>
      {/* 인라인 검색 입력 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: themeColors.inputBackground,
        borderRadius: scaleSpacing(10),
        paddingHorizontal: scaleSpacing(10),
        borderWidth: 1,
        borderColor: themeColors.border,
        minHeight: scaleSpacing(44)
      }}>
        <TouchableOpacity onPress={handleSearchSubmit} style={{ marginRight: scaleSpacing(6) }} accessibilityLabel="검색" accessibilityRole="button">
          <MaterialCommunityIcons name="magnify" size={scaleFontSize(18)} color={themeColors.searchIcon} />
        </TouchableOpacity>
        <TextInput
          placeholder="게시물 검색..."
          placeholderTextColor={themeColors.placeholder}
          value={searchInputText}
          onChangeText={setSearchInputText}
          onSubmitEditing={handleSearchSubmit}
          style={{ flex: 1, fontSize: scaleFontSize(TYPOGRAPHY.body), color: theme.text.primary, paddingVertical: 0, fontWeight: '500' }}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="게시물 검색 입력"
        />
        {searchInputText.length > 0 && (
          <TouchableOpacity onPress={handleSearchClear} style={{ marginLeft: scaleSpacing(4) }} accessibilityLabel="검색어 지우기" accessibilityRole="button">
            <MaterialCommunityIcons name="close-circle" size={scaleFontSize(16)} color={themeColors.placeholder} />
          </TouchableOpacity>
        )}
      </View>
      <HStack style={{ marginTop: scaleSpacing(8), gap: scaleSpacing(6) }}>
        {(['all', 'content', 'tag'] as const).map(type => (
          <Pressable
            key={type}
            style={{
              paddingHorizontal: scaleSpacing(10),
              paddingVertical: scaleSpacing(5),
              height: scaleSpacing(28),
              borderRadius: scaleSpacing(14),
              backgroundColor: searchType === type ? themeColors.primaryLight : themeColors.inputBackground
            }}
            onPress={() => { setSearchType(type); Vibration.vibrate(5); }}
          >
            <Text style={{
              fontSize: scaleFontSize(TYPOGRAPHY.captionSmall),
              fontWeight: '600',
              textAlign: 'center',
              color: searchType === type ? theme.colors.primary : theme.text.secondary
            }}>
              {type === 'all' ? '전체' : type === 'content' ? '내용' : '태그'}
            </Text>
          </Pressable>
        ))}
      </HStack>
      {searchQuery.trim() && (
        <HStack style={{ marginTop: scaleSpacing(8), alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.captionSmall), fontWeight: '500', color: theme.text.secondary }}>
            '{searchQuery}' 검색 결과: {filteredAndSearchedPosts.length}개
          </Text>
          <Pressable
            style={{
              backgroundColor: themeColors.primaryLight,
              borderRadius: scaleSpacing(12),
              paddingHorizontal: scaleSpacing(8),
              paddingVertical: scaleSpacing(3),
              flexDirection: 'row',
              alignItems: 'center'
            }}
            onPress={handleSearchClear}
          >
            <MaterialCommunityIcons name="refresh" size={scaleFontSize(12)} color={theme.colors.primary} />
            <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.captionSmall), fontWeight: '600', color: theme.colors.primary, marginLeft: scaleSpacing(4) }}>초기화</Text>
          </Pressable>
        </HStack>
      )}
    </VStack>
  ), [isDark, theme, themeColors, scaleSpacing, scaleFontSize, searchInputText, searchQuery, searchType, filteredAndSearchedPosts.length, handleSearchSubmit, handleSearchClear]);

  const getSortLabel = () => {
    const labels = { latest: '최신순', oldest: '오래된순', mostLiked: '좋아요순', mostCommented: '댓글순' };
    return labels[sortBy];
  };

  const TabAndSortSection = useMemo(() => (
    <HStack style={{
      paddingHorizontal: scaleSpacing(12),
      paddingVertical: scaleSpacing(10),
      backgroundColor: theme.colors.card,
      borderBottomWidth: isDark ? 1 : 0,
      borderBottomColor: isDark ? themeColors.border : 'transparent',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.03,
      shadowRadius: 2,
      elevation: isDark ? 0 : 1
    }}>
      <HStack style={{
        flex: 1,
        backgroundColor: themeColors.inputBackground,
        borderRadius: scaleSpacing(12),
        padding: scaleSpacing(4),
        marginRight: scaleSpacing(8),
        maxWidth: '72%'
      }}>
        {(['all', 'myDay', 'comfort'] as const).map(tab => (
          <Pressable
            key={tab}
            style={{
              flex: 1,
              borderRadius: scaleSpacing(8),
              paddingVertical: scaleSpacing(6),
              paddingHorizontal: scaleSpacing(4),
              backgroundColor: selectedTab === tab ? theme.colors.card : 'transparent',
              shadowColor: isDark ? '#000' : '#8B5CF6',
              shadowOffset: selectedTab === tab ? { width: 0, height: 1 } : undefined,
              shadowOpacity: selectedTab === tab ? (isDark ? 0.3 : 0.06) : undefined,
              shadowRadius: selectedTab === tab ? 3 : undefined,
              elevation: selectedTab === tab ? 1 : undefined
            }}
            onPress={() => { setSelectedTab(tab); setPage(1); Vibration.vibrate(5); }}
          >
            <Text style={{
              fontSize: scaleFontSize(TYPOGRAPHY.body - 1),
              fontWeight: '700',
              letterSpacing: -0.3,
              textAlign: 'center',
              color: selectedTab === tab ? theme.colors.primary : theme.text.secondary
            }}>
              {tab === 'all' ? '전체' : tab === 'myDay' ? '나의하루' : '위로공감'}
            </Text>
            <Text style={{
              fontSize: scaleFontSize(TYPOGRAPHY.captionSmall),
              fontWeight: '600',
              textAlign: 'center',
              marginTop: scaleSpacing(2),
              color: selectedTab === tab ? themeColors.primaryLight : themeColors.placeholder
            }}>
              {tab === 'all' ? posts.length : posts.filter(p => p.type === tab).length}
            </Text>
          </Pressable>
        ))}
      </HStack>
      <Menu
        visible={sortMenuVisible}
        onDismiss={() => setSortMenuVisible(false)}
        anchor={
          <Pressable
            onPress={() => setSortMenuVisible(true)}
            style={{
              backgroundColor: themeColors.inputBackground,
              borderRadius: scaleSpacing(8),
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: scaleSpacing(10),
              paddingVertical: scaleSpacing(8)
            }}
          >
            <Text style={{
              fontSize: scaleFontSize(TYPOGRAPHY.body - 1),
              fontWeight: '600',
              marginRight: scaleSpacing(3),
              color: theme.text.primary
            }}>{getSortLabel()}</Text>
            <MaterialCommunityIcons name="chevron-down" size={scaleFontSize(16)} color={theme.text.primary} />
          </Pressable>
        }
        contentStyle={{
          backgroundColor: theme.colors.card,
          borderRadius: scaleSpacing(10),
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? themeColors.border : 'transparent'
        }}
      >
        {[
          { key: 'latest', label: '최신순' },
          { key: 'oldest', label: '오래된순' },
          { key: 'mostLiked', label: '좋아요순' },
          { key: 'mostCommented', label: '댓글순' }
        ].map(({ key, label }) => (
          <Menu.Item
            key={key}
            onPress={() => { setSortBy(key as any); setPage(1); setSortMenuVisible(false); Vibration.vibrate(5); }}
            title={label}
            leadingIcon={sortBy === key ? 'check' : undefined}
            titleStyle={{
              fontSize: scaleFontSize(TYPOGRAPHY.body),
              fontWeight: sortBy === key ? '700' : '500',
              color: sortBy === key ? theme.colors.primary : theme.text.primary
            }}
          />
        ))}
      </Menu>
    </HStack>
  ), [isDark, theme, themeColors, scaleSpacing, scaleFontSize, selectedTab, posts, sortMenuVisible, sortBy, getSortLabel]);

  const PostCard = React.memo(({ post }: { post: Post }) => (
    <Card
      className="overflow-hidden"
      elevation={0}
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: scaleSpacing(14),
        shadowColor: isDark ? '#000' : '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.4 : 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginHorizontal: 0,
        marginBottom: scaleSpacing(14),
        borderWidth: isDark ? 1 : 0,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent'
      }}
    >
      <VStack style={{ padding: scaleSpacing(10) }}>
        <HStack className="justify-between items-start mb-3">
          <VStack className="flex-1">
            <HStack className="items-center mb-1.5">
              <View style={{
                backgroundColor: isDark
                  ? (post.type === 'myDay' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(236, 72, 153, 0.2)')
                  : (post.type === 'myDay' ? '#EDE9FE' : '#FDF2F8'),
                paddingHorizontal: scaleSpacing(8),
                paddingVertical: scaleSpacing(4),
                borderRadius: scaleSpacing(8),
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? (post.type === 'myDay' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(236, 72, 153, 0.4)') : 'transparent'
              }}>
                <Text style={{
                  fontSize: scaleFontSize(TYPOGRAPHY.body - 1),
                  marginRight: scaleSpacing(2)
                }}>
                  {post.type === 'myDay' ? '🌅' : '🤗'}
                </Text>
                <Text style={{
                  fontSize: scaleFontSize(TYPOGRAPHY.body - 1),
                  fontWeight: '700',
                  color: post.type === 'myDay'
                    ? (isDark ? '#A78BFA' : '#7C3AED')
                    : (isDark ? '#F9A8D4' : '#EC4899')
                }}>
                  {post.type === 'myDay' ? '나의 하루' : '위로와 공감'}
                </Text>
              </View>
              {post.tag && (
                <View style={{
                  backgroundColor: isDark ? 'rgba(156, 163, 175, 0.2)' : '#F3F4F6',
                  paddingHorizontal: scaleSpacing(8),
                  paddingVertical: scaleSpacing(4),
                  borderRadius: scaleSpacing(8),
                  marginLeft: scaleSpacing(6),
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark ? 'rgba(156, 163, 175, 0.4)' : 'transparent'
                }}>
                  <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.captionSmall), fontWeight: '600', color: isDark ? '#D1D5DB' : '#6B7280' }}>
                    #{post.tag}
                  </Text>
                </View>
              )}
            </HStack>
            <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.captionSmall), fontWeight: '500', color: theme.text.secondary }}>
              {formatTimeAgo(post.created_at)}
            </Text>
          </VStack>
          <Menu
            visible={openMenuId === post.id}
            onDismiss={() => setOpenMenuId(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                iconColor={theme.text.primary}
                size={scaleFontSize(20)}
                onPress={() => { toggleMenu(post.id); Vibration.vibrate(5); }}
                style={{ margin: -6 }}
                accessibilityLabel="게시물 메뉴"
              />
            }
            contentStyle={{
              backgroundColor: theme.colors.card,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? themeColors.border : 'transparent'
            }}
          >
            <Menu.Item
              onPress={() => handleViewDetail(post)}
              title="상세 보기"
              leadingIcon="eye"
              titleStyle={{ color: theme.text.primary }}
            />
            <Menu.Item
              onPress={() => handleEditPost(post)}
              title="수정"
              leadingIcon="pencil"
              titleStyle={{ color: theme.text.primary }}
            />
            <Divider style={{ backgroundColor: theme.colors.border }} />
            <Menu.Item
              onPress={() => showDeleteDialog(post)}
              title="삭제"
              leadingIcon="delete"
              titleStyle={{ color: '#EF4444' }}
            />
          </Menu>
        </HStack>

        {post.title && (
          <Text numberOfLines={2}
            style={{
              fontSize: scaleFontSize(TYPOGRAPHY.h3),
              lineHeight: scaleFontSize(TYPOGRAPHY.h3) * 1.4,
              letterSpacing: -0.4,
              fontWeight: '700',
              marginBottom: scaleSpacing(8),
              color: theme.text.primary
            }}>
            {post.title}
          </Text>
        )}

        <TouchableOpacity onPress={() => handleViewDetail(post)} activeOpacity={0.7}>
          <Text numberOfLines={3}
            style={{
              fontSize: scaleFontSize(TYPOGRAPHY.body),
              lineHeight: scaleFontSize(TYPOGRAPHY.body) * 1.5,
              letterSpacing: -0.2,
              marginBottom: scaleSpacing(10),
              color: theme.text.secondary
            }}>
            {post.content}
          </Text>
        </TouchableOpacity>

        {(() => {
          let imageUrls: string[] = [];
          if (post.images && Array.isArray(post.images) && post.images.length > 0) {
            imageUrls = post.images;
          } else if (post.image_url) {
            try {
              imageUrls = typeof post.image_url === 'string' && post.image_url.startsWith('[') ? JSON.parse(post.image_url) : [post.image_url];
            } catch { imageUrls = [post.image_url]; }
          }
          if (imageUrls.length === 0) return null;
          const normalizedUrls = imageUrls.map(url => normalizeImageUrl(url));

          if (normalizedUrls.length === 1) {
            return (
              <TouchableOpacity onPress={() => handleViewDetail(post)} activeOpacity={0.7} style={{ marginBottom: scaleSpacing(8) }}>
                <OptimizedImage
                  uri={normalizedUrls[0]}
                  thumbnailUri={post.thumbnail_url ? normalizeImageUrl(post.thumbnail_url) : undefined}
                  width={SCREEN_WIDTH - scaleSpacing(44)}
                  height={Math.min(scaleSpacing(200), SCREEN_WIDTH * 0.5)}
                  borderRadius={scaleSpacing(10)}
                  backgroundColor={themeColors.border}
                  resizeMode="contain"
                  accessible={true}
                  accessibilityLabel={`${post.title || post.content.substring(0, 30)}의 이미지`}
                  accessibilityRole="image"
                  priority="normal"
                />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity onPress={() => handleViewDetail(post)} activeOpacity={0.7} style={{ marginBottom: scaleSpacing(8) }}>
              <ImageCarousel
                images={normalizedUrls}
                height={Math.min(scaleSpacing(200), SCREEN_WIDTH * 0.5)}
                borderRadius={scaleSpacing(10)}
                showFullscreenButton={true}
                containerStyle={{ marginBottom: 0 }}
                width={SCREEN_WIDTH - scaleSpacing(44)}
                accessible={true}
                accessibilityLabel={`${post.title || post.content.substring(0, 30)}, ${normalizedUrls.length}개의 이미지`}
                accessibilityHint="두 번 탭하여 이미지 전체화면으로 보기"
              />
            </TouchableOpacity>
          );
        })()}

        {post.emotions && post.emotions.length > 0 && (
          <VStack style={{ marginBottom: scaleSpacing(12) }}>
            <Text style={{
              fontSize: scaleFontSize(TYPOGRAPHY.body),
              fontWeight: '600',
              letterSpacing: -0.3,
              marginBottom: scaleSpacing(8),
              color: theme.text.primary
            }}>
              🌈 오늘의 감정
            </Text>
            <HStack style={{ flexWrap: 'wrap' }}>
              {post.emotions.slice(0, 4).map((emotion: any, i: number) => {
                const getEmotionIcon = (emotionName: string) => {
                  const iconMap: { [key: string]: string } = {
                    'angry': '😠', 'sad': '😢', 'happy': '😊', 'excited': '🤩',
                    'anxious': '😰', 'calm': '😌', 'surprised': '😲', 'tired': '😴',
                    'confused': '😕', 'grateful': '🙏', 'frown': '😞', 'love': '😍'
                  };
                  return iconMap[emotionName.toLowerCase()] || '😊';
                };
                return (
                  <View
                    key={i}
                    style={{
                      backgroundColor: isDark ? 'rgba(233, 121, 249, 0.2)' : '#FEF7FF',
                      paddingHorizontal: scaleSpacing(10),
                      paddingVertical: scaleSpacing(5),
                      borderRadius: scaleSpacing(12),
                      marginRight: scaleSpacing(6),
                      marginBottom: scaleSpacing(6),
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(233, 121, 249, 0.5)' : '#E879F9'
                    }}
                  >
                    <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body - 1), fontWeight: '600', color: isDark ? '#F0ABFC' : '#A855F7' }}>
                      {getEmotionIcon(emotion.name)} {emotion.name}
                    </Text>
                  </View>
                );
              })}
              {post.emotions.length > 4 && (
                <View style={{
                  backgroundColor: themeColors.inputBackground,
                  paddingHorizontal: scaleSpacing(10),
                  paddingVertical: scaleSpacing(5),
                  borderRadius: scaleSpacing(12),
                  borderWidth: 1,
                  borderColor: themeColors.border
                }}>
                  <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body - 1), color: theme.text.primary, fontWeight: '600' }}>
                    +{post.emotions.length - 4}개 더
                  </Text>
                </View>
              )}
            </HStack>
          </VStack>
        )}

        <HStack style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: scaleSpacing(12),
          borderTopWidth: 1,
          borderTopColor: themeColors.border
        }}>
          <HStack style={{ alignItems: 'center' }}>
            <HStack style={{ alignItems: 'center', marginRight: scaleSpacing(16) }}>
              <View style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                borderRadius: scaleSpacing(12),
                padding: scaleSpacing(5),
                marginRight: scaleSpacing(5)
              }}>
                <MaterialCommunityIcons name="heart" size={scaleFontSize(16)} color={themeColors.likeColor} />
              </View>
              <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body), fontWeight: '700', color: theme.text.primary }}>{post.likes_count}</Text>
            </HStack>
            <HStack style={{ alignItems: 'center' }}>
              <View style={{
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
                borderRadius: scaleSpacing(12),
                padding: scaleSpacing(5),
                marginRight: scaleSpacing(5)
              }}>
                <MaterialCommunityIcons name="comment-outline" size={scaleFontSize(16)} color={themeColors.commentColor} />
              </View>
              <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body), fontWeight: '700', color: theme.text.primary }}>{post.comments_count}</Text>
            </HStack>
          </HStack>
          <Pressable
            onPress={() => { handleViewDetail(post); Vibration.vibrate(10); }}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.primary,
              borderRadius: scaleSpacing(14),
              paddingHorizontal: scaleSpacing(18),
              paddingVertical: scaleSpacing(9),
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: isDark ? 0.5 : 0.25,
              shadowRadius: 6,
              elevation: 4,
              minHeight: scaleSpacing(40),
              transform: [{ scale: pressed ? 0.96 : 1 }]
            })}
            accessibilityLabel="게시물 상세보기"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body), fontWeight: '700', color: '#FFF', letterSpacing: -0.3 }}>상세보기</Text>
          </Pressable>
        </HStack>
      </VStack>
    </Card>
  ));

  const SkeletonCard = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

    return (
      <Card elevation={0} style={{
        backgroundColor: theme.colors.card,
        borderRadius: scaleSpacing(12),
        padding: scaleSpacing(10),
        shadowColor: isDark ? '#000' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: scaleSpacing(12)
      }}>
        <Animated.View style={{ opacity }}>
          <Box style={{ backgroundColor: themeColors.border, borderRadius: scaleSpacing(8), width: '40%', height: scaleSpacing(24), marginBottom: scaleSpacing(8) }} />
          <Box style={{ backgroundColor: themeColors.border, borderRadius: scaleSpacing(6), width: '80%', height: scaleSpacing(16), marginBottom: scaleSpacing(6) }} />
          <Box style={{ backgroundColor: themeColors.border, borderRadius: scaleSpacing(6), width: '100%', height: scaleSpacing(70) }} />
        </Animated.View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <VStack style={{
          paddingTop: scaleSpacing(12),
          paddingHorizontal: scaleSpacing(12),
          width: '100%'
        }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </VStack>
      </SafeAreaView>
    );
  }

  const renderEmpty = () => (
    <Center style={{ flex: 1, paddingVertical: scaleSpacing(80) }}>
      <MaterialCommunityIcons
        name={searchQuery.trim() ? "magnify" : "post-outline"}
        size={scaleFontSize(40)}
        color={themeColors.border}
      />
      <Text style={{
        fontSize: scaleFontSize(TYPOGRAPHY.body + 1),
        fontWeight: '700',
        marginTop: scaleSpacing(12),
        color: theme.text.primary
      }}>
        {searchQuery.trim() ? '검색 결과 없음' : selectedTab === 'all' ? '게시물 없음' : selectedTab === 'myDay' ? '나의하루 없음' : '위로공감 없음'}
      </Text>
      <Text style={{
        fontSize: scaleFontSize(TYPOGRAPHY.body),
        marginTop: scaleSpacing(4),
        color: theme.text.secondary
      }}>
        {searchQuery.trim() ? '다른 키워드로 검색' : '첫 게시물을 작성해보세요'}
      </Text>
    </Center>
  );

  const renderFooter = () => {
    // 검색 중이거나 로딩 중이 아니면 표시하지 않음
    if (searchQuery.trim() || !isLoadingMore) return null;
    return (
      <Center style={{ paddingVertical: scaleSpacing(16) }}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </Center>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {SearchSection}
      {TabAndSortSection}

      <FlatList
        ref={flatListRef}
        data={filteredAndSearchedPosts}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => <PostCard post={item} />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadPosts(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: scaleSpacing(12), paddingTop: scaleSpacing(12), paddingBottom: scaleSpacing(20) }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        windowSize={10}
        maxToRenderPerBatch={5}
        removeClippedSubviews={true}
        initialNumToRender={8}
      />

      {showScrollToTop && (
        <Animated.View style={{ position: 'absolute', bottom: scaleSpacing(20), right: scaleSpacing(20), opacity: scrollToTopOpacity }}>
          <TouchableOpacity
            onPress={() => { scrollToTop(); Vibration.vibrate(10); }}
            activeOpacity={0.8}
            style={{
              width: scaleSpacing(50),
              height: scaleSpacing(50),
              borderRadius: scaleSpacing(25),
              backgroundColor: theme.colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.5 : 0.3,
              shadowRadius: 8,
              elevation: 8
            }}
            accessibilityLabel="맨 위로 이동"
            accessibilityRole="button"
            accessibilityHint="스크롤을 맨 위로 이동합니다"
          >
            <MaterialCommunityIcons name="chevron-up" size={scaleFontSize(26)} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="게시물 삭제"
        message="정말로 이 게시물을 삭제하시겠습니까? 삭제된 게시물은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </SafeAreaView>
  );
};

export default MyPostsScreen;
