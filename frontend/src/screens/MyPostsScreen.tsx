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
  ActivityIndicator
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
import CommentBottomSheet, { CommentBottomSheetRef, Comment as BSComment } from '../components/CommentBottomSheet';

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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

  // 댓글 바텀시트 관련 state
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<BSComment[]>([]);
  const [bestComments, setBestComments] = useState<BSComment[]>([]);
  const [totalCommentCount, setTotalCommentCount] = useState(0);
  const commentBottomSheetRef = useRef<CommentBottomSheetRef>(null);

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

  // 헤더 자동 숨김 애니메이션 (2단계)
  const searchTranslateY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [headerMode, setHeaderMode] = useState<'full' | 'compact' | 'hidden'>('full');

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

  // image_url이 JSON 배열 문자열인 경우 파싱하는 헬퍼 함수
  const parseImageUrls = useCallback((imageUrl: string | undefined, imagesArr?: string[]): string[] => {
    if (imagesArr && Array.isArray(imagesArr) && imagesArr.length > 0) {
      return imagesArr.map((img: string) => sanitizeUrlCallback(img));
    }
    if (!imageUrl) return [];
    try {
      if (typeof imageUrl === 'string' && imageUrl.startsWith('[')) {
        const parsed = JSON.parse(imageUrl);
        return Array.isArray(parsed) ? parsed.map((img: string) => sanitizeUrlCallback(img)) : [];
      }
      return [sanitizeUrlCallback(imageUrl)];
    } catch {
      return [sanitizeUrlCallback(imageUrl)];
    }
  }, [sanitizeUrlCallback]);



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

      // 항상 모든 게시물을 로드 (탭 선택은 표시 필터링만 담당)
      const [myDayResponse, comfortResponse] = await Promise.all([
        myDayService.getMyPosts(),
        comfortWallService.getMyPosts()
      ]);

      const myDayData = myDayResponse?.data?.data?.posts || myDayResponse?.data?.posts || myDayResponse?.data || [];
      if (__DEV__) console.log('📸 [MyPostsScreen] myDay API 응답 개수:', myDayData.length);
      myDayPosts = Array.isArray(myDayData) ? myDayData.map((post: any) => {
        // 이미지 URL을 미리 정규화하여 저장 (재렌더링 방지)
        const rawImages = parseImageUrls(post.image_url, post.images);
        const normalizedImages = rawImages.map(url => normalizeImageUrl(url));
        const imageUrl = normalizedImages.length > 0 ? normalizedImages[0] : undefined;
        return {
          id: post.post_id,
          content: (post.content || '').substring(0, 5000),
          image_url: imageUrl,
          images: normalizedImages.length > 0 ? normalizedImages : undefined,
          thumbnail_url: post.thumbnail_url ? normalizeImageUrl(sanitizeUrlCallback(post.thumbnail_url)) : imageUrl,
          created_at: post.created_at || post.createdAt,
          likes_count: post.like_count || post.likes_count || 0,
          comments_count: post.comment_count || post.comments_count || 0,
          emotions: post.emotions,
          type: 'myDay' as const
        };
      }) : [];

      const comfortData = comfortResponse?.data?.data?.posts || comfortResponse?.data?.posts || comfortResponse?.data || [];
      if (__DEV__) console.log('📸 [MyPostsScreen] comfort API 응답 개수:', comfortData.length);
      comfortPosts = Array.isArray(comfortData) ? comfortData.map((post: any) => {
        // 이미지 URL을 미리 정규화하여 저장 (재렌더링 방지)
        const rawImages = parseImageUrls(post.image_url, post.images);
        const normalizedImages = rawImages.map(url => normalizeImageUrl(url));
        const imageUrl = normalizedImages.length > 0 ? normalizedImages[0] : undefined;
        return {
          id: post.post_id,
          content: (post.content || '').substring(0, 5000),
          image_url: imageUrl,
          images: normalizedImages.length > 0 ? normalizedImages : undefined,
          thumbnail_url: post.thumbnail_url ? normalizeImageUrl(sanitizeUrlCallback(post.thumbnail_url)) : imageUrl,
          created_at: post.created_at,
          likes_count: post.like_count || post.likes_count || 0,
          comments_count: post.comment_count || post.comments_count || 0,
          title: post.title,
          tag: post.tag,
          type: 'comfort' as const
        };
      }) : [];

      const allPosts = [...myDayPosts, ...comfortPosts];
      if (__DEV__) console.log('📸 [MyPostsScreen] 전체 게시물 로드 완료:', { total: allPosts.length, myDay: myDayPosts.length, comfort: comfortPosts.length });
      setPosts(allPosts);
      setCachedPosts(allPosts);
      setLastFetch(Date.now());
    } catch (error: unknown) {
      const msg = error?.response?.status === 401 ? '로그인이 필요합니다.' :
                  error?.message?.includes('Network') ? '네트워크 연결을 확인해주세요.' : '게시물을 불러오지 못했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, sanitizeUrlCallback]);

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
      headerShown: false, // 네이티브 헤더 숨김, 커스텀 헤더 사용
    });
  }, [navigation]);

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
  const handleViewDetail = (post: Post, openComments: boolean = false) => {
    // post.type에 따라 sourceScreen 결정 (소문자로 통일)
    const sourceScreen = post.type === 'comfort' ? 'comfort' : post.type === 'myDay' ? 'home' : undefined;
    // PostDetail에서는 'myday' (소문자)를 기대하므로 변환
    const normalizedPostType = post.type === 'myDay' ? 'myday' : post.type;

    if (__DEV__) console.log('[MyPostsScreen] handleViewDetail:', { postId: post.id, postType: normalizedPostType, sourceScreen, openComments });

    navigation.navigate('PostDetail', {
      postId: post.id,
      postType: normalizedPostType,
      sourceScreen, // 출처 스크린 정보 전달
      enableSwipe: false, // 내 게시물 화면에서는 스와이프 비활성화
      openComments // 댓글 보기로 바로 열기
    });
  };

  // 메뉴 토글 (type + id로 고유 식별)
  const toggleMenu = (postType: string, postId: number) => {
    const menuKey = `${postType}-${postId}`;
    setOpenMenuId(prev => prev === menuKey ? null : menuKey);
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
     } catch (error: unknown) {
      const msg = error?.response?.status === 403 ? '삭제 권한이 없습니다.' :
                  error?.message?.includes('Network') ? '네트워크 연결을 확인해주세요.' : '게시물 삭제에 실패했습니다.';
      Alert.alert('오류', msg);
    }
  }, [selectedPost]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // 댓글 바텀시트 열기
  const handleOpenComments = useCallback(async (post: Post) => {
    if (__DEV__) console.log('[MyPostsScreen] handleOpenComments 호출:', post.id, post.type);

    // 먼저 post를 설정하여 BottomSheet가 렌더링되게 함
    setCommentPost(post);
    setComments([]);
    setBestComments([]);
    setTotalCommentCount(0);

    try {
      const normalizedPostType = post.type === 'myDay' ? 'myday' : post.type;
      let response;

      if (normalizedPostType === 'comfort') {
        response = await comfortWallService.getComments(post.id);
      } else {
        response = await myDayService.getComments(post.id);
      }

      const data = response?.data?.data || response?.data || response;
      const commentsList = data?.comments || data || [];
      const best = data?.best_comments || data?.bestComments || [];
      const total = data?.total_count || data?.totalCount || commentsList.length;

      setComments(Array.isArray(commentsList) ? commentsList : []);
      setBestComments(Array.isArray(best) ? best : []);
      setTotalCommentCount(total);

      // setTimeout으로 다음 틱에서 open 호출 (렌더링 완료 후)
      setTimeout(() => {
        if (__DEV__) console.log('[MyPostsScreen] BottomSheet open 시도');
        commentBottomSheetRef.current?.open();
      }, 100);
    } catch (error) {
      if (__DEV__) console.error('[MyPostsScreen] 댓글 로드 실패:', error);
      setTimeout(() => {
        commentBottomSheetRef.current?.open();
      }, 100);
    }
  }, []);

  // 댓글 작성
  const handleSubmitComment = useCallback(async (content: string, isAnonymous: boolean, parentCommentId?: number) => {
    if (!commentPost) return;

    const normalizedPostType = commentPost.type === 'myDay' ? 'myday' : commentPost.type;

    try {
      if (normalizedPostType === 'comfort') {
        await comfortWallService.createComment(commentPost.id, { content, is_anonymous: isAnonymous });
      } else {
        await myDayService.createComment(commentPost.id, { content, is_anonymous: isAnonymous });
      }

      // 댓글 목록 새로고침
      handleOpenComments(commentPost);

      // 게시물 댓글 카운트 업데이트
      setPosts(prev => prev.map(p =>
        p.id === commentPost.id && p.type === commentPost.type
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (error) {
      if (__DEV__) console.error('[MyPostsScreen] 댓글 작성 실패:', error);
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
    }
  }, [commentPost, handleOpenComments]);

  // 댓글 좋아요
  const handleLikeComment = useCallback(async (comment: BSComment) => {
    if (!commentPost) return;
    try {
      const normalizedPostType = commentPost.type === 'myDay' ? 'myday' : commentPost.type;
      if (normalizedPostType === 'comfort') {
        await comfortWallService.likeComment(comment.comment_id);
      } else {
        await myDayService.likeComment(comment.comment_id);
      }
      handleOpenComments(commentPost);
    } catch (error) {
      if (__DEV__) console.error('[MyPostsScreen] 댓글 좋아요 실패:', error);
    }
  }, [commentPost, handleOpenComments]);

  // 댓글 삭제
  const handleDeleteComment = useCallback(async (comment: BSComment) => {
    if (!commentPost) return;

    Alert.alert('댓글 삭제', '정말로 이 댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const normalizedPostType = commentPost.type === 'myDay' ? 'myday' : commentPost.type;
            if (normalizedPostType === 'comfort') {
              await comfortWallService.deleteComment(comment.comment_id);
            } else {
              await myDayService.deleteComment(comment.comment_id);
            }
            handleOpenComments(commentPost);
            setPosts(prev => prev.map(p =>
              p.id === commentPost.id && p.type === commentPost.type
                ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
                : p
            ));
          } catch (error) {
            if (__DEV__) console.error('[MyPostsScreen] 댓글 삭제 실패:', error);
            Alert.alert('오류', '댓글 삭제에 실패했습니다.');
          }
        }
      }
    ]);
  }, [commentPost, handleOpenComments]);

  // 댓글 수정 (현재 미구현 - placeholder)
  const handleEditComment = useCallback((comment: BSComment) => {
    Alert.alert('알림', '댓글 수정 기능은 준비 중입니다.');
  }, []);

  // 스크롤 위치 추적 및 2단계 헤더 숨김 처리
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const scrollDiff = offsetY - lastScrollY.current;

    // 상단 이동 버튼 표시
    const shouldShow = offsetY > 300;
    if (shouldShow !== showScrollToTop) {
      setShowScrollToTop(shouldShow);
      Animated.timing(scrollToTopOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    // 2단계 헤더 숨김/표시
    if (Math.abs(scrollDiff) > 5) {
      if (scrollDiff > 0 && offsetY > 80) {
        // 1단계: 검색 영역만 숨김
        if (headerMode === 'full') {
          setHeaderMode('compact');
          Animated.timing(searchTranslateY, {
            toValue: -80,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
        // 2단계: 탭까지 숨김
        else if (offsetY > 250 && headerMode === 'compact') {
          setHeaderMode('hidden');
          Animated.timing(headerTranslateY, {
            toValue: -150,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      } else if (scrollDiff < 0) {
        // 위로 스크롤 -> 헤더 복원
        if (headerMode !== 'full') {
          setHeaderMode('full');
          Animated.parallel([
            Animated.timing(searchTranslateY, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            })
          ]).start();
        }
      }
      lastScrollY.current = offsetY;
    }
  }, [showScrollToTop, scrollToTopOpacity, headerMode, searchTranslateY, headerTranslateY]);

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


  // SearchSection을 useMemo로 메모이제이션 (개선: 높이 축소 + 인라인 배치)
  const SearchSection = useMemo(() => (
    <VStack style={{
      paddingHorizontal: scaleSpacing(12),
      paddingVertical: scaleSpacing(8),
      backgroundColor: isDark
        ? 'rgba(17, 17, 17, 0.85)'
        : 'rgba(255, 255, 255, 0.85)',
      borderBottomWidth: isDark ? 1 : 0,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.03,
      shadowRadius: 2,
      elevation: isDark ? 0 : 1
    }}>
      {/* 검색창 + 필터 한 줄 배치 */}
      <HStack style={{ alignItems: 'center', gap: scaleSpacing(8) }}>
        {/* 검색 입력창 (축소) */}
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: themeColors.inputBackground,
          borderRadius: scaleSpacing(9),
          paddingHorizontal: scaleSpacing(10),
          borderWidth: 1,
          borderColor: themeColors.border,
          height: scaleSpacing(36)
        }}>
          <TouchableOpacity onPress={handleSearchSubmit} style={{ marginRight: scaleSpacing(6) }} accessibilityLabel="검색" accessibilityRole="button">
            <MaterialCommunityIcons name="magnify" size={scaleFontSize(16)} color={themeColors.searchIcon} />
          </TouchableOpacity>
          <TextInput
            placeholder="게시물 검색..."
            placeholderTextColor={themeColors.placeholder}
            value={searchInputText}
            onChangeText={setSearchInputText}
            onSubmitEditing={handleSearchSubmit}
            style={{ flex: 1, fontSize: scaleFontSize(TYPOGRAPHY.body - 1), color: theme.text.primary, paddingVertical: 0, fontFamily: 'Pretendard-Medium' }}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="게시물 검색 입력"
          />
          {searchInputText.length > 0 && (
            <TouchableOpacity onPress={handleSearchClear} style={{ marginLeft: scaleSpacing(4) }} accessibilityLabel="검색어 지우기" accessibilityRole="button">
              <MaterialCommunityIcons name="close-circle" size={scaleFontSize(14)} color={themeColors.placeholder} />
            </TouchableOpacity>
          )}
        </View>

        {/* 검색 필터 (축소 + 아이콘) */}
        <HStack style={{ gap: scaleSpacing(4) }}>
          {([
            { type: 'all', icon: 'format-list-bulleted', label: '전체' },
            { type: 'content', icon: 'text', label: '내용' },
            { type: 'tag', icon: 'tag', label: '태그' }
          ] as const).map(({ type, icon, label }) => (
            <Pressable
              key={type}
              style={{
                paddingHorizontal: scaleSpacing(8),
                paddingVertical: scaleSpacing(4),
                height: scaleSpacing(24),
                borderRadius: scaleSpacing(12),
                backgroundColor: searchType === type ? theme.colors.primary : themeColors.inputBackground,
                borderWidth: 1,
                borderColor: searchType === type ? theme.colors.primary : themeColors.border,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => { setSearchType(type); Vibration.vibrate(5); }}
            >
              <MaterialCommunityIcons
                name={icon}
                size={scaleFontSize(12)}
                color={searchType === type ? '#FFF' : theme.text.secondary}
              />
            </Pressable>
          ))}
        </HStack>
      </HStack>

      {/* 검색 결과 인라인 표시 */}
      {searchQuery.trim() && (
        <HStack style={{ marginTop: scaleSpacing(6), alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.captionSmall - 1), fontFamily: 'Pretendard-Medium', color: theme.text.tertiary }}>
            '{searchQuery}' 결과 {filteredAndSearchedPosts.length}개
          </Text>
          <Pressable
            style={{
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : themeColors.primaryLight,
              borderRadius: scaleSpacing(10),
              paddingHorizontal: scaleSpacing(8),
              paddingVertical: scaleSpacing(2),
              flexDirection: 'row',
              alignItems: 'center'
            }}
            onPress={handleSearchClear}
          >
            <MaterialCommunityIcons name="refresh" size={scaleFontSize(11)} color={theme.colors.primary} />
            <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.captionSmall - 1), fontFamily: 'Pretendard-SemiBold', color: theme.colors.primary, marginLeft: scaleSpacing(3) }}>초기화</Text>
          </Pressable>
        </HStack>
      )}
    </VStack>
  ), [isDark, theme, themeColors, scaleSpacing, scaleFontSize, searchInputText, searchQuery, searchType, filteredAndSearchedPosts.length, handleSearchSubmit, handleSearchClear]);

  const getSortLabel = () => {
    const labels = { latest: '최신순', oldest: '오래된순', mostLiked: '좋아요순', mostCommented: '댓글순' };
    return labels[sortBy];
  };

  // 커스텀 헤더 컴포넌트 (Glassmorphism 효과)
  const CustomHeader = useMemo(() => (
    <HStack style={{
      height: scaleSpacing(56),
      paddingHorizontal: scaleSpacing(12),
      backgroundColor: isDark
        ? 'rgba(17, 17, 17, 0.85)'
        : 'rgba(255, 255, 255, 0.85)',
      alignItems: 'center',
      borderBottomWidth: isDark ? 1 : 0,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: isDark ? 0 : 2
    }}>
      <TouchableOpacity
        onPress={() => {
          Vibration.vibrate(10);
          handleGoBack();
        }}
        style={{ padding: scaleSpacing(8), marginLeft: scaleSpacing(-8) }}
        accessibilityLabel="뒤로 가기"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="arrow-left" size={scaleFontSize(24)} color={theme.text.primary} />
      </TouchableOpacity>
      <Text style={{
        fontSize: TYPOGRAPHY.h2,
        fontFamily: 'Pretendard-Bold',
        letterSpacing: -0.5,
        color: theme.text.primary,
        marginLeft: scaleSpacing(8)
      }}>
        나의 게시글
      </Text>
    </HStack>
  ), [isDark, theme, themeColors, scaleSpacing, scaleFontSize, handleGoBack]);

  const TabAndSortSection = useMemo(() => (
    <HStack style={{
      paddingHorizontal: scaleSpacing(12),
      paddingVertical: scaleSpacing(8),
      backgroundColor: isDark
        ? 'rgba(17, 17, 17, 0.85)'
        : 'rgba(255, 255, 255, 0.85)',
      borderBottomWidth: isDark ? 1 : 0,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.03,
      shadowRadius: 2,
      elevation: isDark ? 0 : 1
    }}>
      {/* 탭 그룹 (축소 + 카운트 인라인) */}
      <HStack style={{
        flex: 1,
        flexShrink: 1,
        marginRight: scaleSpacing(8),
        backgroundColor: themeColors.inputBackground,
        borderRadius: scaleSpacing(10),
        padding: scaleSpacing(3),
        gap: scaleSpacing(4)
      }}>
        {(['all', 'myDay', 'comfort'] as const).map(tab => {
          // 각 탭별 카운트 계산 (항상 전체 posts 배열 기준)
          let count = 0;
          if (tab === 'all') {
            count = posts.length;
          } else {
            count = posts.filter(p => p.type === tab).length;
          }

          const isActive = selectedTab === tab;

          // 디버깅 로그
          if (__DEV__ && tab === 'myDay') {
            const myDayPosts = posts.filter(p => p.type === 'myDay');
            console.log('[MyPostsScreen] 나의하루 카운트:', count, '/ 전체:', posts.length, '/ myDay posts:', myDayPosts.length);
          }
          if (__DEV__ && tab === 'comfort') {
            const comfortPosts = posts.filter(p => p.type === 'comfort');
            console.log('[MyPostsScreen] 위로공감 카운트:', count, '/ 전체:', posts.length, '/ comfort posts:', comfortPosts.length);
          }

          return (
            <Pressable
              key={tab}
              style={{
                flexShrink: 1,
                borderRadius: scaleSpacing(7),
                paddingVertical: scaleSpacing(5),
                paddingHorizontal: scaleSpacing(10),
                backgroundColor: isActive ? theme.colors.primary : 'transparent',
                shadowColor: theme.colors.primary,
                shadowOffset: isActive ? { width: 0, height: 2 } : undefined,
                shadowOpacity: isActive ? (isDark ? 0.4 : 0.15) : undefined,
                shadowRadius: isActive ? 4 : undefined,
                elevation: isActive ? 2 : undefined,
                minHeight: scaleSpacing(30)
              }}
              onPress={() => {
                if (__DEV__) console.log('[MyPostsScreen] 탭 변경:', selectedTab, '→', tab);
                setSelectedTab(tab);
                setPage(1);
                Vibration.vibrate(5);
              }}
            >
              <HStack style={{ alignItems: 'center', gap: scaleSpacing(4), flexShrink: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: scaleFontSize(TYPOGRAPHY.body - 2),
                    fontFamily: 'Pretendard-Bold',
                    letterSpacing: -0.3,
                    color: isActive ? '#FFF' : theme.text.secondary
                  }}>
                  {tab === 'all' ? '전체' : tab === 'myDay' ? '나의하루' : '위로공감'}
                </Text>
                <View style={{
                  backgroundColor: isActive
                    ? 'rgba(255, 255, 255, 0.25)'
                    : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                  borderRadius: scaleSpacing(8),
                  paddingHorizontal: scaleSpacing(5),
                  paddingVertical: scaleSpacing(1),
                  minWidth: scaleSpacing(18),
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: scaleFontSize(TYPOGRAPHY.captionSmall - 1),
                    fontFamily: 'Pretendard-Bold',
                    color: isActive ? '#FFF' : theme.colors.primary
                  }}>
                    {count}
                  </Text>
                </View>
              </HStack>
            </Pressable>
          );
        })}
      </HStack>

      {/* 정렬 메뉴 (커스텀 드롭다운) */}
      <View style={{ flexShrink: 0, zIndex: sortMenuVisible ? 1000 : 1 }}>
        <Pressable
          onPress={() => {
            setSortMenuVisible(!sortMenuVisible);
            Vibration.vibrate(5);
            if (__DEV__) console.log('[MyPostsScreen] 정렬 메뉴 토글:', !sortMenuVisible, '현재 sortBy:', sortBy);
          }}
          style={{
            backgroundColor: themeColors.inputBackground,
            borderRadius: scaleSpacing(8),
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: scaleSpacing(10),
            paddingVertical: scaleSpacing(6),
            borderWidth: 1,
            borderColor: themeColors.border,
            minHeight: scaleSpacing(30)
          }}
        >
          <MaterialCommunityIcons name="sort-variant" size={scaleFontSize(14)} color={theme.colors.primary} style={{ marginRight: scaleSpacing(4) }} />
          <Text
            numberOfLines={1}
            style={{
              fontSize: scaleFontSize(TYPOGRAPHY.body - 2),
              fontFamily: 'Pretendard-SemiBold',
              marginRight: scaleSpacing(2),
              color: theme.text.primary
            }}>{getSortLabel()}</Text>
          <MaterialCommunityIcons
            name={sortMenuVisible ? "chevron-up" : "chevron-down"}
            size={scaleFontSize(14)}
            color={theme.text.secondary}
          />
        </Pressable>

        {/* 드롭다운 메뉴 */}
        {sortMenuVisible && (
          <>
            {/* 외부 클릭 감지용 오버레이 */}
            <Pressable
              onPress={() => setSortMenuVisible(false)}
              style={{
                position: 'absolute',
                top: scaleSpacing(36),
                right: scaleSpacing(-200),
                width: scaleSpacing(400),
                height: scaleSpacing(300),
                zIndex: 999
              }}
            />
            <View style={{
              position: 'absolute',
              top: scaleSpacing(36),
              right: 0,
              backgroundColor: theme.colors.card,
              borderRadius: scaleSpacing(10),
              borderWidth: 1,
              borderColor: isDark ? themeColors.border : 'rgba(0,0,0,0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.15,
              shadowRadius: 8,
              elevation: 8,
              minWidth: scaleSpacing(120),
              zIndex: 1001
            }}>
              {([
                { key: 'latest' as const, label: '최신순', icon: 'clock-outline' },
                { key: 'oldest' as const, label: '오래된순', icon: 'clock-time-eight-outline' },
                { key: 'mostLiked' as const, label: '좋아요순', icon: 'heart-outline' },
                { key: 'mostCommented' as const, label: '댓글순', icon: 'comment-outline' }
              ] as const).map(({ key, label, icon }, index) => (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (__DEV__) console.log('[MyPostsScreen] 정렬 선택:', key);
                    setSortBy(key);
                    setPage(1);
                    setSortMenuVisible(false);
                    Vibration.vibrate(5);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: scaleSpacing(10),
                    paddingHorizontal: scaleSpacing(12),
                    borderBottomWidth: index < 3 ? 1 : 0,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    backgroundColor: sortBy === key
                      ? (isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)')
                      : 'transparent'
                  }}
                >
                  <MaterialCommunityIcons
                    name={sortBy === key ? 'check-circle' : icon}
                    size={scaleFontSize(16)}
                    color={sortBy === key ? theme.colors.primary : theme.text.secondary}
                    style={{ marginRight: scaleSpacing(8) }}
                  />
                  <Text style={{
                    fontSize: scaleFontSize(TYPOGRAPHY.body - 1),
                    fontFamily: sortBy === key ? 'Pretendard-Bold' : 'Pretendard-Medium',
                    color: sortBy === key ? theme.colors.primary : theme.text.primary
                  }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </HStack>
  ), [isDark, theme, themeColors, scaleSpacing, scaleFontSize, selectedTab, posts, sortMenuVisible, sortBy, getSortLabel]);

  // PostCard 메모이제이션 (이미지 재렌더링 방지)
  const PostCard = React.memo(({ post }: { post: Post }) => {
    // 이미 정규화된 이미지 URL 사용 (loadPosts에서 처리됨)
    // useMemo로 배열 재생성 방지 (깜빡임 방지)
    const imageUrls = React.useMemo(() =>
      post.images || (post.image_url ? [post.image_url] : []),
      [post.images, post.image_url]
    );

    // 이미지 크기를 메모이제이션하여 재계산 방지
    const imageWidth = React.useMemo(() => SCREEN_WIDTH - scaleSpacing(44), []);
    const imageHeight = React.useMemo(() => Math.min(scaleSpacing(200), SCREEN_WIDTH * 0.5), []);

    return (
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
                  fontFamily: 'Pretendard-Bold',
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
                  <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.captionSmall), fontFamily: 'Pretendard-SemiBold', color: isDark ? '#D1D5DB' : '#6B7280' }}>
                    #{post.tag}
                  </Text>
                </View>
              )}
            </HStack>
            <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.captionSmall), fontFamily: 'Pretendard-Medium', color: theme.text.secondary }}>
              {formatTimeAgo(post.created_at)}
            </Text>
          </VStack>
          <Menu
            visible={openMenuId === `${post.type}-${post.id}`}
            onDismiss={() => setOpenMenuId(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                iconColor={theme.text.primary}
                size={scaleFontSize(20)}
                onPress={() => { toggleMenu(post.type, post.id); Vibration.vibrate(5); }}
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
            <Divider style={{ backgroundColor: theme.border }} />
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
              fontFamily: 'Pretendard-Bold',
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

        {imageUrls.length > 0 && (
          imageUrls.length === 1 ? (
            <TouchableOpacity
              onPress={() => handleViewDetail(post)}
              activeOpacity={0.7}
              style={{ marginBottom: scaleSpacing(8) }}
            >
              <OptimizedImage
                key={`${post.type}-${post.id}-img`}
                uri={imageUrls[0]}
                thumbnailUri={post.thumbnail_url}
                width={imageWidth}
                height={imageHeight}
                borderRadius={scaleSpacing(10)}
                backgroundColor={themeColors.border}
                resizeMode="contain"
                accessible={true}
                accessibilityLabel={`${post.title || post.content.substring(0, 30)}의 이미지`}
                accessibilityRole="image"
                priority="normal"
                showLoader={false}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleViewDetail(post)}
              activeOpacity={0.7}
              style={{ marginBottom: scaleSpacing(8) }}
            >
              <ImageCarousel
                key={`${post.type}-${post.id}-carousel`}
                images={imageUrls}
                height={imageHeight}
                borderRadius={scaleSpacing(10)}
                showFullscreenButton={true}
                containerStyle={{ marginBottom: 0 }}
                width={imageWidth}
                accessible={true}
                accessibilityLabel={`${post.title || post.content.substring(0, 30)}, ${imageUrls.length}개의 이미지`}
                accessibilityHint="두 번 탭하여 이미지 전체화면으로 보기"
              />
            </TouchableOpacity>
          )
        )}

        {post.emotions && post.emotions.length > 0 && (
          <VStack style={{ marginBottom: scaleSpacing(12) }}>
            <Text style={{
              fontSize: scaleFontSize(TYPOGRAPHY.body),
              fontFamily: 'Pretendard-SemiBold',
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
                    <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body - 1), fontFamily: 'Pretendard-SemiBold', color: isDark ? '#F0ABFC' : '#A855F7' }}>
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
                  <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body - 1), color: theme.text.primary, fontFamily: 'Pretendard-SemiBold' }}>
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
              <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body), fontFamily: 'Pretendard-Bold', color: theme.text.primary }}>{post.likes_count}</Text>
            </HStack>
            <TouchableOpacity
              onPress={() => { handleOpenComments(post); Vibration.vibrate(10); }}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center' }}
              accessibilityLabel="댓글 보기"
              accessibilityRole="button"
            >
              <View style={{
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
                borderRadius: scaleSpacing(12),
                padding: scaleSpacing(5),
                marginRight: scaleSpacing(5)
              }}>
                <MaterialCommunityIcons name="comment-outline" size={scaleFontSize(16)} color={themeColors.commentColor} />
              </View>
              <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body), fontFamily: 'Pretendard-Bold', color: theme.text.primary }}>{post.comments_count}</Text>
            </TouchableOpacity>
            {/* 댓글 달기 버튼 */}
            <TouchableOpacity
              onPress={() => { handleOpenComments(post); Vibration.vibrate(10); }}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: scaleSpacing(12),
                paddingHorizontal: scaleSpacing(10),
                paddingVertical: scaleSpacing(6),
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
                borderRadius: scaleSpacing(10),
              }}
              accessibilityLabel="댓글 달기"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="comment-plus-outline" size={scaleFontSize(14)} color={themeColors.commentColor} />
              <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.captionSmall), fontFamily: 'Pretendard-SemiBold', color: themeColors.commentColor, marginLeft: scaleSpacing(4) }}>댓글 달기</Text>
            </TouchableOpacity>
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
            <Text style={{ fontSize: scaleFontSize(TYPOGRAPHY.body), fontFamily: 'Pretendard-Bold', color: '#FFF', letterSpacing: -0.3 }}>상세보기</Text>
          </Pressable>
        </HStack>
      </VStack>
    </Card>
    );
  }, (prevProps, nextProps) => {
    // 커스텀 비교 함수 - 불필요한 재렌더링 완전 방지
    const prev = prevProps.post;
    const next = nextProps.post;

    // ID와 타입이 같으면 같은 게시물 (재렌더링 불필요)
    if (prev.id === next.id && prev.type === next.type) {
      // 좋아요/댓글 수만 변경된 경우에만 재렌더링
      return (
        prev.likes_count === next.likes_count &&
        prev.comments_count === next.comments_count
      );
    }

    // 다른 게시물이면 재렌더링 필요
    return false;
  });

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
        fontFamily: 'Pretendard-Bold',
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      {/* FlatList를 먼저 배치하여 전체 화면 사용 */}
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
        contentContainerStyle={{
          paddingHorizontal: scaleSpacing(12),
          paddingTop: scaleSpacing(150), // 헤더 전체 높이 (56 + 52 + 46 = ~154px)
          paddingBottom: scaleSpacing(100)
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        windowSize={10}
        maxToRenderPerBatch={5}
        removeClippedSubviews={false}
        initialNumToRender={8}
        updateCellsBatchingPeriod={50}
        ListHeaderComponent={<View style={{ height: scaleSpacing(1) }} />}
        legacyImplementation={false}
      />

      {/* 헤더를 absolute로 상단에 고정 (2단계 애니메이션) */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        transform: [{ translateY: headerTranslateY }],
        zIndex: 10,
        backgroundColor: theme.colors.background
      }}>
        {CustomHeader}

        {/* SearchSection - 별도 애니메이션 */}
        <Animated.View style={{
          transform: [{ translateY: searchTranslateY }]
        }}>
          {SearchSection}
        </Animated.View>

        {TabAndSortSection}
      </Animated.View>

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

      {/* 댓글 바텀시트 */}
      {commentPost && (
        <CommentBottomSheet
          ref={commentBottomSheetRef}
          comments={comments}
          bestComments={bestComments}
          totalCount={totalCommentCount}
          postId={commentPost.id}
          postType={commentPost.type === 'myDay' ? 'myday' : commentPost.type}
          onSubmitComment={handleSubmitComment}
          onLikeComment={handleLikeComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onRefresh={() => commentPost && handleOpenComments(commentPost)}
          isAuthenticated={!!user}
        />
      )}
    </SafeAreaView>
  );
};

export default MyPostsScreen;
