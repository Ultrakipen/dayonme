import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import {
  ScrollView,
  RefreshControl,
  View,
  Text as RNText,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import ProfileImage from '../components/common/ProfileImage';
import ImagePicker from '../components/common/ImagePicker';
import Button from '../components/Button';
import userService from '../services/api/userService';
import myDayService, { type UserEmotionStats } from '../services/api/myDayService';
import postService from '../services/api/postService';
import reviewService from '../services/api/reviewService';
 import uploadService from '../services/api/uploadService';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import ActivityChart from '../components/common/ActivityChart';
import BottomSheetAlert from '../components/common/BottomSheetAlert';
import Toast from '../components/common/Toast';
import ProfileSkeleton from '../components/common/ProfileSkeleton';
import { sanitizeText, escapeHtml } from '../utils/sanitize';
import { performanceMonitor } from '../utils/performanceMonitor';
import { normalizeSpace, normalizeIcon, normalizeTouchable } from '../utils/responsive';
import { FONT_SIZES, APP_VERSION } from '../constants';
import { CACHE_CONFIG, PERFORMANCE } from '../utils/constants';
import { localEmotions } from '../constants/homeEmotions';

interface UserStats {
  user_id?: number;
  my_day_post_count?: number;
  someone_day_post_count?: number;
  my_day_like_received_count?: number;
  someone_day_like_received_count?: number;
  my_day_comment_received_count?: number;
  someone_day_comment_received_count?: number;
  challenge_count?: number;
  total_posts?: number;
  total_likes_received?: number;
  total_comments?: number;
  active_challenges?: number;
  last_updated?: string;
}

interface EmotionTag {
  name: string;
  count: number;
  color: string;
  emotion_id?: number;
  icon?: string;
}

interface DisplayPost {
  post_id: number;
  postType?: 'myDay' | 'comfort'; // 게시물 타입 (key 중복 방지)
  authorName: string;
  content: string;
  emotions: Array<{
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  }>;
  image_url?: string;
  images?: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
  user_id: number;
  isLiked: boolean;
}

const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser, isAuthenticated } = useAuth();
  const { theme, isDark, toggleTheme } = useModernTheme();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { width: screenWidth } = useWindowDimensions();

  const maskEmail = useCallback((email: string): string => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }, []);

  // 상대적 시간 계산 (2026 트렌드) - 시간 부분을 제거하고 정확한 날짜 차이 계산
  const getRelativeTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    // 시간 부분을 0으로 설정하여 날짜만 비교
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears}년 전`;
    if (diffMonths > 0) return `${diffMonths}개월 전`;
    if (diffDays > 0) return `${diffDays}일 전`;
    return '오늘';
  }, []);

  // 2025 트렌드 컬러 시스템 (다크모드 대응)
  const emotionColors = {
    primary: isDark ? '#60a5fa' : '#0095F6',
    secondary: isDark ? '#9ca3af' : '#444444',
    text: theme.colors.text.primary,
    textSecondary: isDark ? theme.colors.text.secondary : '#555555',
    textLight: isDark ? theme.colors.text.secondary : '#666666',
    background: theme.colors.background,
    surface: theme.colors.card,
    surfaceSecondary: isDark ? theme.bg.secondary : '#F0F0F0',
    border: theme.bg.border,
    success: '#00BA7C',
    warning: '#FF9500',
    error: '#FF3B30',
    gold: '#FFD60A',
  };

  // 반응형 스케일 계산 (동적)
  const scale = useMemo(() => {
    const BASE_WIDTH = 360;
    const ratio = screenWidth / BASE_WIDTH;
    if (screenWidth >= 480) return Math.min(ratio, 1.5);
    if (screenWidth >= 390) return Math.min(ratio, 1.3);
    return Math.max(0.85, Math.min(ratio, 1.1));
  }, [screenWidth]);

  // 반응형 폰트 크기 계산 (최소 크기 보장)
  const getFontSize = useCallback((baseSize: number) => {
    const scaled = Math.round(baseSize * scale);
    return Math.max(scaled, baseSize * 0.9);
  }, [scale]);

  // 📱 반응형 스타일 생성 (useMemo)
  const dynamicStyles = useMemo(() => StyleSheet.create({
    settingText: {
      flex: 1,
      fontSize: getFontSize(16), // 15 → 16 (가독성 향상)
      fontFamily: 'Pretendard-SemiBold',
      letterSpacing: -0.3,
      lineHeight: getFontSize(16) * 1.4, // 22.4px
      textAlignVertical: 'center' as const,
    },
    sectionHeader: {
      fontSize: getFontSize(16),
      fontFamily: 'Pretendard-Bold',
      letterSpacing: -0.3,
      lineHeight: getFontSize(16) * 1.3,
    },
    userName: {
      fontSize: getFontSize(18), // 17 → 18
      fontFamily: 'Pretendard-Bold',
      letterSpacing: -0.3,
      lineHeight: getFontSize(18) * 1.3,
    },
    statNumber: {
      fontSize: getFontSize(20), // 18 → 20
      fontFamily: 'Pretendard-Bold',
      letterSpacing: -0.4,
      lineHeight: getFontSize(20) * 1.2,
    },
    statLabel: {
      fontSize: getFontSize(14),
      fontFamily: 'Pretendard-Medium',
      letterSpacing: -0.2,
      lineHeight: getFontSize(14) * 1.4,
    },
  }), [getFontSize]);

  const [stats, setStats] = useState<UserStats>({});
  const [weeklyStats, setWeeklyStats] = useState({
    weeklyPosts: 0,
    weeklyLikes: 0,
    weeklyComments: 0,
    consecutiveDays: 0
  });
  const [bestPostLikes, setBestPostLikes] = useState(0);
  const [challengeStats, setChallengeStats] = useState({
    createdChallenges: 0,
    joinedChallenges: 0,
    completedChallenges: 0
  });
  const [firstActivity, setFirstActivity] = useState({
    days_since_first_activity: 0,
    first_activity_date: null as string | null,
    signup_date: null as string | null,
    first_post_date: null as string | null,
    first_challenge_date: null as string | null
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // 💾 캐싱: 데이터 캐시 및 캐시 타임스탬프
  const [dataCache, setDataCache] = useState<any>(null);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [emotionTags, setEmotionTags] = useState<EmotionTag[]>([]);
  const [badges, setBadges] = useState<Array<{id: string; icon: string; name: string; unlocked: boolean}>>([]);
  const [favoriteQuote, setFavoriteQuote] = useState(user?.favorite_quote || '꿈을 포기하지 마세요. 당신은 충분히 가치 있는 사람입니다. ✨');
  const [showQuoteEditor, setShowQuoteEditor] = useState(false);
  const [tempQuote, setTempQuote] = useState(favoriteQuote);
  const [initialLoad, setInitialLoad] = useState(true);
  const [myRecentPosts, setMyRecentPosts] = useState<DisplayPost[]>([]);
  const [isMyRecentPostsCollapsed, setIsMyRecentPostsCollapsed] = useState(false);

  const totalEmotionCount = useMemo(
    () => emotionTags.reduce((sum, tag) => sum + tag.count, 0),
    [emotionTags]
  );
  const [bottomSheetAlert, setBottomSheetAlert] = useState({ visible: false, title: '', message: '', buttons: [] });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });

  // 🔥 감정 색상 매핑 (먼저 정의)
  const getDefaultEmotionColor = useCallback((emotionName: string): string => {
    const colorMap: { [key: string]: string } = {
      '행복': '#00C851',
      '기쁨': '#FFD93D',
      '슬픔': '#5DADE2',
      '우울': '#85929E',
      '평온': '#48CAE4',
      '감사': '#FF9F43',
      '뿌듯': '#A29BFE',
      '희망': '#FD79A8',
      '설렘': '#E84393',
      '위로': '#00B894',
      '불안': '#FDCB6E',
      '버럭': '#E17055',
      '지루': '#B2BEC3'
    };
    return colorMap[emotionName] || '#667eea';
  }, []);

  // 🔥 연속 작성일 계산
  const calculateConsecutiveDays = useCallback((posts: any[]) => {
    if (posts.length === 0) return 0;

    const dateGroups: { [key: string]: boolean } = {};
    posts.forEach((post: any) => {
      const dateKey = new Date(post.created_at).toDateString();
      dateGroups[dateKey] = true;
    });

    let consecutive = 0;
    const today = new Date();

    for (let i = 0; i < PERFORMANCE.MAX_CONSECUTIVE_DAYS; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toDateString();

      if (dateGroups[dateKey]) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }, []);

  // 🔥 주간 통계 로드 (최적화: 백엔드 API 사용)
  const loadWeeklyStats = useCallback(async () => {
    try {
      const response = await userService.getWeeklyStats();

      if (response.status === 'success' && response.data) {
        setWeeklyStats({
          weeklyPosts: response.data.weeklyPosts,
          weeklyLikes: response.data.weeklyLikes,
          weeklyComments: response.data.weeklyComments,
          consecutiveDays: response.data.consecutiveDays
        });
        setBestPostLikes(response.data.bestPostLikes);
      } else {
        setWeeklyStats({ weeklyPosts: 0, weeklyLikes: 0, weeklyComments: 0, consecutiveDays: 0 });
        setBestPostLikes(0);
      }
    } catch (error) {
      if (__DEV__) console.error('주간 통계 로드 오류:', error);
      setWeeklyStats({ weeklyPosts: 0, weeklyLikes: 0, weeklyComments: 0, consecutiveDays: 0 });
      setBestPostLikes(0);
    }
  }, []);

  // 🔥 나의 최근 글 로드 (나의 하루 + 위로와 공감)
  const loadMyRecentPosts = useCallback(async () => {
    try {
      // 병렬 호출로 성능 개선
      const [myDayResponse, postResponse] = await Promise.all([
        myDayService.getMyPosts({ page: 1, limit: 10, sort_by: 'latest' }),
        postService.getMyPosts({ page: 1, limit: 10, sort_by: 'latest' })
      ]);

      let myDayPosts: any[] = [];
      let comfortPosts: any[] = [];

      // 나의 하루 데이터 추출 (타입 추가)
      if (myDayResponse.status === 'success' && myDayResponse.data) {
        if (myDayResponse.data.posts) {
          myDayPosts = myDayResponse.data.posts.map((p: any) => ({ ...p, postType: 'myDay' }));
        } else if (Array.isArray(myDayResponse.data)) {
          myDayPosts = myDayResponse.data.map((p: any) => ({ ...p, postType: 'myDay' }));
        }
      }

      // 위로와 공감 데이터 추출 (타입 추가)
      if (postResponse.status === 'success' && postResponse.data) {
        if (postResponse.data.posts) {
          comfortPosts = postResponse.data.posts.map((p: any) => ({ ...p, postType: 'comfort' }));
        } else if (Array.isArray(postResponse.data)) {
          comfortPosts = postResponse.data.map((p: any) => ({ ...p, postType: 'comfort' }));
        }
      }

      // 두 배열 합치기
      const allPosts = [...myDayPosts, ...comfortPosts];

      // 🔥 post_id 기준 중복 제거
      const uniquePosts = allPosts.filter((post, index, self) =>
        index === self.findIndex(p => p.post_id === post.post_id)
      );

      // created_at 기준으로 정렬 (최신순)
      uniquePosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 최대 3개만 선택
      const recentPosts = uniquePosts.slice(0, 3);

      const myDisplayPosts: DisplayPost[] = recentPosts.map(apiPost => ({
        post_id: apiPost.post_id,
        postType: apiPost.postType, // 'myDay' 또는 'comfort'
        authorName: apiPost.is_anonymous ? '익명' : (apiPost.user?.nickname || '나'),
        content: apiPost.content,
        emotions: apiPost.emotions?.map((emotion: any) => {
          const localEmotion = localEmotions.find(local => local.label === emotion.name);
          return {
            emotion_id: emotion.emotion_id,
            name: emotion.name,
            icon: emotion.icon || localEmotion?.icon || '😊',
            color: emotion.color || localEmotion?.color || '#6366f1'
          };
        }) || [],
        image_url: apiPost.image_url,
        like_count: apiPost.like_count || 0,
        comment_count: apiPost.comment_count || 0,
        created_at: apiPost.created_at || new Date().toISOString(),
        updated_at: apiPost.updated_at || apiPost.created_at || new Date().toISOString(),
        is_anonymous: apiPost.is_anonymous || false,
        user_id: apiPost.user_id,
        isLiked: apiPost.is_liked || false
      }));

      setMyRecentPosts(myDisplayPosts);
      if (__DEV__) {
        console.log('=== 최근 글 로드 ===');
        console.log('나의 하루 게시물:', myDayPosts.length);
        console.log('위로와 공감 게시물:', comfortPosts.length);
        console.log('전체 게시물:', allPosts.length);
        console.log('중복 제거 후 게시물:', uniquePosts.length);
        console.log('화면 표시 게시물 수:', myDisplayPosts.length);
      }
    } catch (error: any) {
      setMyRecentPosts([]);
      if (__DEV__) console.error('내 최근 게시물 로딩 오류:', error);
    }
  }, []);

  // Toast helper (loadAllData보다 먼저 정의)
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  // 🔥 트래픽 최적화: 병렬 API 호출 및 중복 제거 + 💾 캐싱
  const loadAllData = useCallback(async (forceRefresh = false) => {
    if (!user || !isAuthenticated) return;

    // 💾 캐시 확인
    const now = Date.now();
    const isCacheValid = !forceRefresh && dataCache && (now - cacheTimestamp < CACHE_CONFIG.PROFILE_DATA);

    if (isCacheValid) {
      if (__DEV__) console.log('💾 캐시된 데이터 사용');
      setStats(dataCache.stats);
      setEmotionTags(dataCache.emotionTags);
      setFirstActivity(dataCache.firstActivity);
      setChallengeStats(dataCache.challengeStats);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      performanceMonitor.start('ProfileScreen_loadAllData');

      const [statsRes, emotionsRes, activityRes, challengeRes, badgesRes, weeklyRes] = await Promise.all([
        performanceMonitor.measureAsync('API_getUserStats', () => userService.getUserStats()),
        performanceMonitor.measureAsync('API_getEmotionStats', () => myDayService.getUserEmotionStats()),
        performanceMonitor.measureAsync('API_getFirstActivity', () => userService.getFirstActivity()),
        performanceMonitor.measureAsync('API_getChallengeStats', () => userService.getChallengeStats()),
        performanceMonitor.measureAsync('API_getBadges', () => reviewService.getUserBadges().catch(() => ({ status: 'error', data: { badges: [] } }))),
        performanceMonitor.measureAsync('API_getWeeklyStats', () => userService.getWeeklyStats().catch(() => ({ status: 'error', data: null }))),
      ]);

      performanceMonitor.end('ProfileScreen_loadAllData');

      if (statsRes.status === 'success') {
        setStats(statsRes.data || {});
      }

      if (emotionsRes.status === 'success' && emotionsRes.data.length > 0) {
        const emotionTagsData = emotionsRes.data.map((stat: UserEmotionStats) => ({
          name: stat.emotion_name,
          count: stat.count,
          color: stat.emotion_color || getDefaultEmotionColor(stat.emotion_name),
          emotion_id: stat.emotion_id,
          icon: stat.emotion_icon
        }));
        setEmotionTags(emotionTagsData);
      } else {
        setEmotionTags([]);
      }

      if (activityRes.status === 'success' && activityRes.data) {
        setFirstActivity({
          days_since_first_activity: activityRes.data.days_since_first_activity,
          first_activity_date: activityRes.data.first_activity_date,
          signup_date: activityRes.data.signup_date,
          first_post_date: activityRes.data.first_post_date,
          first_challenge_date: activityRes.data.first_challenge_date
        });
      }

      if (challengeRes.status === 'success' && challengeRes.data) {
        setChallengeStats({
          createdChallenges: challengeRes.data.created,
          joinedChallenges: challengeRes.data.participated,
          completedChallenges: challengeRes.data.completed
        });
      }

      // 배지 데이터 설정
      if (badgesRes?.status === 'success' && badgesRes.data?.badges) {
        setBadges(badgesRes.data.badges.slice(0, 4).map((b: any) => ({
          id: b.id?.toString() || b.achievement_id?.toString(),
          icon: b.achievement_icon || '🏆',
          name: b.achievement_name || '배지',
          unlocked: true
        })));
      }

      // 주간 통계 처리
      if (weeklyRes.status === 'success' && weeklyRes.data) {
        setWeeklyStats({
          weeklyPosts: weeklyRes.data.weeklyPosts,
          weeklyLikes: weeklyRes.data.weeklyLikes,
          weeklyComments: weeklyRes.data.weeklyComments,
          consecutiveDays: weeklyRes.data.consecutiveDays
        });
        setBestPostLikes(weeklyRes.data.bestPostLikes);
      } else {
        setWeeklyStats({ weeklyPosts: 0, weeklyLikes: 0, weeklyComments: 0, consecutiveDays: 0 });
        setBestPostLikes(0);
      }

      // 💾 캐시 저장 (성공적으로 로드한 경우에만)
      setDataCache({
        stats: statsRes.data || {},
        emotionTags: emotionsRes.data?.map((stat: UserEmotionStats) => ({
          name: stat.emotion_name,
          count: stat.count,
          color: stat.emotion_color || getDefaultEmotionColor(stat.emotion_name),
          emotion_id: stat.emotion_id,
          icon: stat.emotion_icon
        })) || [],
        firstActivity: activityRes.data || {},
        challengeStats: challengeRes.data || {}
      });
      setCacheTimestamp(Date.now());

    } catch (error: unknown) {
      if (__DEV__) console.error('데이터 로드 오류:', error);

      if (error?.response?.status === 401) {
        showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'error');
        await logout();
        navigation.navigate('Auth' as never);
        return;
      }

      setBottomSheetAlert({
        visible: true,
        title: '로드 실패',
        message: '데이터를 불러오지 못했습니다.',
        buttons: [
          { text: '취소', style: 'cancel' },
          { text: '재시도', onPress: () => loadAllData(true) }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, getDefaultEmotionColor, loadWeeklyStats, dataCache, cacheTimestamp, logout, navigation, showToast]);

  // 초기 로드 및 화면 포커스 시 데이터 로드
  useEffect(() => {
    if (isFocused && initialLoad) {
      loadAllData();
      loadWeeklyStats();
      loadMyRecentPosts();
      setInitialLoad(false);
    }
  }, [isFocused, initialLoad, loadAllData, loadWeeklyStats, loadMyRecentPosts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // 💾 새로고침 시 캐시 무시하고 강제 로드
    await Promise.all([
      loadAllData(true),
      loadWeeklyStats(),
      loadMyRecentPosts()
    ]);
    setRefreshing(false);
  }, [loadAllData, loadWeeklyStats, loadMyRecentPosts]);

  const handleLogout = useCallback(() => {
    setBottomSheetAlert({
      visible: true,
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      buttons: [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              if (__DEV__) console.error('로그아웃 오류:', error);
            }
          }
        },
      ]
    });
  }, [logout, navigation]);

  const handleProfileImageChange = useCallback((imageUrl: string) => {
    if (__DEV__) console.log('프로필 이미지 업데이트:', imageUrl);
    if (user) {
      const updatedUser = { ...user, profile_image_url: imageUrl };
      updateUser(updatedUser);
      setShowImagePicker(false);
    }
  }, [user, updateUser]);

 const handleRemoveProfileImage = useCallback(async () => {
      setBottomSheetAlert({
        visible: true,
        title: '프로필 이미지 삭제',
        message: '프로필 이미지를 삭제하시겠습니까?',
        buttons: [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                await uploadService.deleteProfileImage();

                if (user) {
                  const updatedUser = {
                    ...user,
                    profile_image_url: ''
                  };
                  updateUser(updatedUser);
                }

                setShowImagePicker(false);
                setTimeout(() => {
                  showToast('프로필 이미지가 삭제되었습니다.', 'success');
                }, 300);
              } catch (error: unknown) {
                showToast(error?.message || '프로필 이미지 삭제 중 오류가 발생했습니다.', 'error');
              }
            }
          }
        ]
      });
    }, [user, updateUser, showToast]);

  const handleSaveQuote = useCallback(async () => {
    try {
      // 🔒 보안: 입력 검증
      if (!tempQuote || tempQuote.trim().length === 0) {
        showToast('명언을 입력해주세요.', 'warning');
        return;
      }

      if (tempQuote.length > 200) {
        showToast('명언은 200자 이하로 입력해주세요.', 'warning');
        return;
      }

      // 🔒 보안: XSS 방어 - sanitize 적용
      const sanitizedQuote = sanitizeText(tempQuote.trim(), 200);

      if (sanitizedQuote.length === 0) {
        showToast('유효하지 않은 내용입니다.', 'error');
        return;
      }

      setFavoriteQuote(sanitizedQuote);
      await userService.updateProfile({ favorite_quote: sanitizedQuote });

      if (user) {
        updateUser({ ...user, favorite_quote: sanitizedQuote });
      }

      setShowQuoteEditor(false);
      showToast('명언이 저장되었습니다!', 'success');
    } catch (error) {
      if (__DEV__) console.error('명언 저장 오류:', error);
      showToast('명언 저장 중 문제가 발생했습니다.', 'error');
    }
  }, [tempQuote, user, updateUser, showToast]);

  const formatNumber = useCallback((num?: number): string => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }, []);

  // 로딩 화면 (Skeleton UI)
  if (loading && initialLoad) {
    return <ProfileSkeleton />;
  }

  // 비로그인 사용자 로그인 유도 화면
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          backgroundColor={theme.colors.background}
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />

        {/* 다크모드 토글 버튼 (우측 상단) */}
        <TouchableOpacity
          style={[styles.themeToggle, {
            top: normalizeSpace(40),
            right: normalizeSpace(20),
            minHeight: normalizeTouchable(44),
            minWidth: normalizeTouchable(44),
          }]}
          onPress={toggleTheme}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          accessibilityHint="테마를 변경합니다"
        >
          <MaterialCommunityIcons
            name={isDark ? 'weather-sunny' : 'weather-night'}
            size={normalizeIcon(28)}
            color={isDark ? '#A78BFA' : '#667eea'}
          />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          {/* 감정 아바타 아이콘 */}
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.colors.card,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 3,
            borderColor: '#667eea',
          }}>
            <RNText style={{ fontSize: 48 }}>😊</RNText>
          </View>

          {/* 환영 메시지 */}
          <RNText style={{
            fontSize: getFontSize(20),
            fontFamily: 'Pretendard-Bold',
            color: isDark ? theme.colors.text.primary : '#1F2937',
            marginBottom: 12,
            textAlign: 'center',
          }}>
            당신의 감정 여행,{'\n'}지금 시작하세요
          </RNText>

          <RNText style={{
            fontSize: getFontSize(14),
            color: isDark ? theme.colors.text.secondary : '#6B7280',
            marginBottom: 32,
            textAlign: 'center',
            lineHeight: 21,
          }}>
            나만의 감정을 기록하고{'\n'}특별한 순간을 공유해보세요 ✨
          </RNText>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth' as never)}
            style={{
              width: '100%',
              maxWidth: 320,
              height: 48,
              backgroundColor: '#667eea',
              borderRadius: 24,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
              shadowColor: '#667eea',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
            accessibilityRole="button"
            accessibilityLabel="로그인하기"
          >
            <RNText style={{
              color: '#FFFFFF',
              fontSize: getFontSize(15),
              fontFamily: 'Pretendard-Bold',
              letterSpacing: -0.3,
            }}>
              로그인하기
            </RNText>
          </TouchableOpacity>

          {/* 회원가입 버튼 */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth' as never, { screen: 'Register' })}
            style={{
              width: '100%',
              maxWidth: 320,
              height: 48,
              backgroundColor: theme.colors.card,
              borderRadius: 24,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#667eea',
            }}
            accessibilityRole="button"
            accessibilityLabel="회원가입하기"
          >
            <RNText style={{
              color: '#667eea',
              fontSize: getFontSize(15),
              fontFamily: 'Pretendard-Bold',
              letterSpacing: -0.3,
            }}>
              회원가입하기
            </RNText>
          </TouchableOpacity>

          {/* 기능 안내 */}
          <View style={{ marginTop: 28, width: '100%', maxWidth: 320, paddingHorizontal: 8 }}>
            <RNText style={{
              fontSize: getFontSize(15),
              fontFamily: 'Pretendard-Bold',
              color: isDark ? theme.colors.text.primary : '#374151',
              marginBottom: 16,
              textAlign: 'center',
              lineHeight: 22,
            }}>
              당신의 감정 여행,{'\n'}지금 시작해볼까요?
            </RNText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {[
                { emoji: '🎨', text: '나만의\n감정 기록장', gradient: ['#FF6B9D', '#FFA06B'] },
                { emoji: '💫', text: '나를 표현하는\n특별한 공간', gradient: ['#A78BFA', '#EC4899'] },
                { emoji: '🏆', text: '도전과\n성장의 기록', gradient: ['#60A5FA', '#34D399'] },
                { emoji: '💬', text: '따뜻한\n위로와 공감', gradient: ['#FBBF24', '#F59E0B'] }
              ].map((item, index) => (
                <LinearGradient
                  key={`${index}-${isDark}`}
                  colors={isDark
                    ? [item.gradient[0] + '30', item.gradient[1] + '20']
                    : item.gradient
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: '48%',
                    minHeight: 88,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 8,
                    overflow: 'hidden',
                    ...(!isDark && {
                      shadowColor: item.gradient[0],
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.12,
                      shadowRadius: 8,
                      elevation: 3,
                    }),
                    ...(isDark && {
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                    })
                  }}
                >
                  <RNText style={{ fontSize: 26, lineHeight: 30, marginBottom: 8 }}>
                    {item.emoji}
                  </RNText>
                  <RNText
                    style={{
                      fontSize: getFontSize(13),
                      fontFamily: 'Pretendard-SemiBold',
                      color: isDark ? theme.colors.text.primary : '#1A1A1A',
                      lineHeight: 18,
                    }}
                    numberOfLines={3}
                  >
                    {item.text}
                  </RNText>
                </LinearGradient>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View style={styles.animatedContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[emotionColors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 향상된 모던 헤더 */}
        <View style={[styles.enhancedHeader, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={styles.profileBackButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <Icon name="arrow-back" size={20} color={emotionColors.text} />
          </TouchableOpacity>
          <View style={styles.headerContainer}>
            <View style={styles.titleRow}>
              <RNText style={[styles.mainTitle, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>내 프로필</RNText>
              <TouchableOpacity
                style={styles.encouragementButton}
                onPress={() => navigation.navigate('Encouragement')}
                accessibilityLabel="받은 격려 메시지"
                accessibilityHint="받은 격려 메시지를 확인합니다"
              >
                <Icon name="heart" size={24} color="#E91E63" />
              </TouchableOpacity>
            </View>
            <View style={styles.subtitleContainer}>
              <View style={[styles.pointDot, { backgroundColor: emotionColors.primary }]} />
              <RNText style={[styles.subtitle, { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }]}>나의 감정 성장 여행</RNText>
              <RNText style={styles.heartIcon}>✨</RNText>
            </View>
          </View>
        </View>

        {/* 프로필 정보 */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              onPress={() => setShowImagePicker(true)}
              style={styles.profileImageContainer}
              activeOpacity={0.8}
              accessibilityLabel="프로필 이미지 변경"
              accessibilityHint="탭하여 프로필 사진을 변경하세요"
            >
              <ProfileImage
                imageUrl={user.profile_image_url}
                size="large"
                onPress={() => setShowImagePicker(true)}
                editable={true}
                showBorder={true}
              />
              <View style={styles.editIconBadge}>
                <Icon name="camera" size={16} color={emotionColors.background} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <RNText style={[styles.userName, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>
                {user.nickname || user.username}
              </RNText>

              {/* 소셜 로그인 사용자가 아닌 경우에만 username 표시 */}
              {user.username && !user.username.startsWith('naver_') && !user.username.startsWith('kakao_') && !user.username.startsWith('google_') && (
                <RNText style={[styles.userHandle, { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }]}>
                  @{user.username}
                </RNText>
              )}

              <RNText style={[styles.userEmail, { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }]}>
                {user.email}
              </RNText>
              
              <View style={styles.joinDateContainer}>
                <Icon name="calendar-outline" size={normalizeIcon(14)} color={emotionColors.textLight} />
                <RNText style={[styles.joinDate, { color: isDark ? theme.colors.text.secondary : emotionColors.textLight }]}>
                  {user.created_at ? (
                    <>
                      {new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })} 가입
                      <RNText style={{ color: emotionColors.primary, fontFamily: 'Pretendard-SemiBold' }}>  •  {getRelativeTime(user.created_at)}</RNText>
                    </>
                  ) : '정보 없음'}
                </RNText>
              </View>
            </View>
          </View>

          {/* 좋아하는 명언 */}
          {favoriteQuote && (
            <TouchableOpacity style={[styles.quoteContainer, { backgroundColor: isDark ? theme.bg.secondary : '#E3F2FD' }]} onPress={() => {
              setTempQuote(favoriteQuote);
              setShowQuoteEditor(true);
            }}>
              <View style={styles.quoteHeader}>
                <Icon name="chatbox-ellipses-outline" size={18} color={emotionColors.primary} />
                <RNText style={[styles.quoteLabel, { color: isDark ? theme.colors.text.primary : emotionColors.primary }]}>나의 명언</RNText>
                <Icon name="create-outline" size={14} color={emotionColors.textLight} />
              </View>
              <RNText style={[styles.quoteText, { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }]}>{favoriteQuote}</RNText>
            </TouchableOpacity>
          )}
        </View>

        {/* 나의 최근 글 */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.card, marginBottom: normalizeSpace(16) }]}>
          <View style={[styles.cardHeader, { marginBottom: normalizeSpace(8) }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalizeSpace(8) }}>
              <RNText style={[styles.cardTitle, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>
                ✍️ 나의 최근 글
              </RNText>
              <View style={{
                backgroundColor: emotionColors.surfaceSecondary,
                paddingHorizontal: normalizeSpace(8),
                paddingVertical: normalizeSpace(3),
                borderRadius: normalizeSpace(12)
              }}>
                <RNText style={{
                  color: emotionColors.textSecondary,
                  fontSize: getFontSize(12),
                  fontFamily: 'Pretendard-SemiBold'
                }}>
                  {myRecentPosts.length}
                </RNText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalizeSpace(6) }}>
              <Pressable
                onPress={() => navigation.navigate('MyPosts' as never)}
                style={{
                  paddingHorizontal: normalizeSpace(10),
                  paddingVertical: normalizeSpace(6),
                  borderRadius: normalizeSpace(10),
                  backgroundColor: isDark ? 'rgba(167, 139, 250, 0.15)' : '#eef2ff',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(167, 139, 250, 0.3)' : '#c7d2fe'
                }}
              >
                <RNText style={{
                  fontSize: getFontSize(11),
                  fontFamily: 'Pretendard-Bold',
                  color: isDark ? '#A78BFA' : '#667eea',
                  letterSpacing: -0.2
                }}>
                  전체보기
                </RNText>
              </Pressable>
              <Pressable
                onPress={() => setIsMyRecentPostsCollapsed(!isMyRecentPostsCollapsed)}
                style={{
                  padding: normalizeSpace(6),
                  borderRadius: normalizeSpace(12),
                  backgroundColor: isDark ? '#404040' : '#f3f4f6'
                }}
              >
                <MaterialCommunityIcons
                  name={isMyRecentPostsCollapsed ? "chevron-down" : "chevron-up"}
                  size={normalizeIcon(14)}
                  color={isDark ? '#ffffff' : '#6b7280'}
                />
              </Pressable>
            </View>
          </View>

          {!isMyRecentPostsCollapsed && (
            <>
              {myRecentPosts.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: normalizeSpace(6),
                    paddingHorizontal: normalizeSpace(4)
                  }}
                >
                  {(() => {
                    const postsToShow = myRecentPosts.slice(0, 3);
                    if (__DEV__) {
                      console.log('=== 최근 글 렌더링 ===');
                      console.log('myRecentPosts.length:', myRecentPosts.length);
                      console.log('렌더링할 게시물 수:', postsToShow.length);
                    }
                    return postsToShow;
                  })().map((post) => {
                    // 카드 배치 가능 영역: 전체 - margin(32) - padding(24) - containerPadding(8)
                    const availableWidth = screenWidth - 56 - normalizeSpace(8);
                    // gap 공간 제외 후 3등분 (gap 6으로 줄여서 폭 증가)
                    const cardWidth = (availableWidth - normalizeSpace(12)) / 3 - 1;
                    return (
                      <Pressable
                        key={`${post.postType || 'post'}_${post.post_id}`}
                        onPress={() => {
                          // MyPosts 화면으로 이동
                          navigation.navigate('MyPosts' as never, { highlightPostId: post.post_id } as never);
                        }}
                        style={{
                          width: cardWidth,
                          backgroundColor: isDark ? theme.bg.secondary : '#f9fafb',
                          borderRadius: normalizeSpace(10),
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                          padding: normalizeSpace(8),
                          gap: normalizeSpace(4),
                          minHeight: normalizeSpace(100)
                        }}
                      >
                        {post.emotions.length > 0 && (
                          <View style={{ alignItems: 'center', gap: normalizeSpace(1) }}>
                            <RNText style={{ fontSize: normalizeIcon(20) }}>
                              {post.emotions[0]?.icon || '😊'}
                            </RNText>
                            <RNText
                              numberOfLines={1}
                              style={{
                                fontSize: getFontSize(10),
                                color: emotionColors.text,
                                fontFamily: 'Pretendard-SemiBold',
                                textAlign: 'center'
                              }}
                            >
                              {post.emotions[0]?.name || '감정'}
                            </RNText>
                          </View>
                        )}

                        <RNText
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={{
                            fontSize: getFontSize(11),
                            color: emotionColors.textSecondary,
                            lineHeight: getFontSize(11) * 1.5,
                            flex: 1,
                            textAlign: 'center',
                            paddingHorizontal: normalizeSpace(2)
                          }}
                        >
                          {post.content || '내용 없음'}
                        </RNText>

                        <View style={{ flexDirection: 'row', gap: normalizeSpace(8), alignItems: 'center', justifyContent: 'center' }}>
                          <RNText style={{ fontSize: getFontSize(10), color: emotionColors.textLight }}>
                            ❤️ {post.like_count}
                          </RNText>
                          <RNText style={{ fontSize: getFontSize(10), color: emotionColors.textLight }}>
                            💬 {post.comment_count}
                          </RNText>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={{ paddingVertical: normalizeSpace(24), alignItems: 'center' }}>
                  <RNText style={{
                    fontSize: getFontSize(14),
                    color: emotionColors.textSecondary,
                    textAlign: 'center'
                  }}>
                    아직 작성한 글이 없습니다{'\n'}
                    첫 번째 글을 작성해보세요! ✨
                  </RNText>
                </View>
              )}
            </>
          )}
        </View>

        {/* 통계 정보 - 작은 칩 방식 */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
          <RNText style={[styles.cardTitle, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>
            활동 통계
          </RNText>

          {/* 작은 칩 그리드 (9개, 3x3) - 배경 제거 & 더 작게 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalizeSpace(3) }}>
            {/* 받은 응원 */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Encouragement')}
              activeOpacity={0.7}
              style={{
                width: (screenWidth - normalizeSpace(80)) / 3,
                paddingVertical: normalizeSpace(4),
                paddingHorizontal: normalizeSpace(6),
                alignItems: 'center',
                gap: normalizeSpace(1),
              }}
            >
              <Icon name="heart" size={20} color="#E91E63" />
              <RNText style={{ fontSize: getFontSize(17), color: isDark ? theme.colors.text.primary : theme.colors.text.primary, fontFamily: 'Pretendard-Bold' }}>
                {formatNumber(stats.encouragement_received_count || 0)}
              </RNText>
              <RNText style={{ fontSize: getFontSize(11), color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>
                받은 응원
              </RNText>
            </TouchableOpacity>

            {/* 나의 하루 */}
            <View style={{
              width: (screenWidth - normalizeSpace(80)) / 3,
              paddingVertical: normalizeSpace(4),
              paddingHorizontal: normalizeSpace(6),
              alignItems: 'center',
              gap: normalizeSpace(1),
            }}>
              <Icon name="happy-outline" size={20} color={emotionColors.primary} />
              <RNText style={{ fontSize: getFontSize(17), color: isDark ? theme.colors.text.primary : theme.colors.text.primary, fontFamily: 'Pretendard-Bold' }}>
                {formatNumber(stats.my_day_post_count)}
              </RNText>
              <RNText style={{ fontSize: getFontSize(11), color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>
                나의 하루
              </RNText>
            </View>

            {/* 위로와 공감 */}
            <View style={{
              width: (screenWidth - normalizeSpace(80)) / 3,
              paddingVertical: normalizeSpace(4),
              paddingHorizontal: normalizeSpace(6),
              alignItems: 'center',
              gap: normalizeSpace(1),
            }}>
              <Icon name="time-outline" size={20} color="#9C27B0" />
              <RNText style={{ fontSize: getFontSize(17), color: isDark ? theme.colors.text.primary : theme.colors.text.primary, fontFamily: 'Pretendard-Bold' }}>
                {formatNumber(stats.someone_day_post_count || 0)}
              </RNText>
              <RNText style={{ fontSize: getFontSize(11), color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>
                위로와 공감
              </RNText>
            </View>

            {/* 하루 좋아요 */}
            <View style={{
              width: (screenWidth - normalizeSpace(80)) / 3,
              paddingVertical: normalizeSpace(4),
              paddingHorizontal: normalizeSpace(6),
              alignItems: 'center',
              gap: normalizeSpace(1),
            }}>
              <Icon name="heart-outline" size={20} color={emotionColors.error} />
              <RNText style={{ fontSize: getFontSize(17), color: isDark ? theme.colors.text.primary : theme.colors.text.primary, fontFamily: 'Pretendard-Bold' }}>
                {formatNumber(stats.my_day_like_received_count)}
              </RNText>
              <RNText style={{ fontSize: getFontSize(11), color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>
                하루 좋아요
              </RNText>
            </View>

            {/* 위로 좋아요 */}
            <View style={{
              width: (screenWidth - normalizeSpace(80)) / 3,
              paddingVertical: normalizeSpace(4),
              paddingHorizontal: normalizeSpace(6),
              alignItems: 'center',
              gap: normalizeSpace(1),
            }}>
              <Icon name="heart-circle-outline" size={20} color="#FFC107" />
              <RNText style={{ fontSize: getFontSize(17), color: isDark ? theme.colors.text.primary : theme.colors.text.primary, fontFamily: 'Pretendard-Bold' }}>
                {formatNumber(stats.someone_day_like_received_count || 0)}
              </RNText>
              <RNText style={{ fontSize: getFontSize(11), color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>
                위로 좋아요
              </RNText>
            </View>

            {/* 하루 댓글 */}
            <View style={{
              width: (screenWidth - normalizeSpace(80)) / 3,
              paddingVertical: normalizeSpace(4),
              paddingHorizontal: normalizeSpace(6),
              alignItems: 'center',
              gap: normalizeSpace(1),
            }}>
              <Icon name="chatbubble-outline" size={20} color={emotionColors.warning} />
              <RNText style={{ fontSize: getFontSize(17), color: isDark ? theme.colors.text.primary : theme.colors.text.primary, fontFamily: 'Pretendard-Bold' }}>
                {formatNumber(stats.my_day_comment_received_count)}
              </RNText>
              <RNText style={{ fontSize: getFontSize(11), color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>
                하루 댓글
              </RNText>
            </View>

            {/* 위로 댓글 */}
            <View style={{
              width: (screenWidth - normalizeSpace(80)) / 3,
              paddingVertical: normalizeSpace(4),
              paddingHorizontal: normalizeSpace(6),
              alignItems: 'center',
              gap: normalizeSpace(1),
            }}>
              <Icon name="chatbubbles-outline" size={20} color="#009688" />
              <RNText style={{ fontSize: getFontSize(17), color: isDark ? theme.colors.text.primary : theme.colors.text.primary, fontFamily: 'Pretendard-Bold' }}>
                {formatNumber(stats.someone_day_comment_received_count || 0)}
              </RNText>
              <RNText style={{ fontSize: getFontSize(11), color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>
                위로 댓글
              </RNText>
            </View>

            {/* 챌린지 */}
            <View style={{
              width: (screenWidth - normalizeSpace(80)) / 3,
              paddingVertical: normalizeSpace(4),
              paddingHorizontal: normalizeSpace(6),
              alignItems: 'center',
              gap: normalizeSpace(1),
            }}>
              <Icon name="trophy-outline" size={20} color={emotionColors.gold} />
              <RNText style={{ fontSize: getFontSize(17), color: isDark ? theme.colors.text.primary : theme.colors.text.primary, fontFamily: 'Pretendard-Bold' }}>
                {formatNumber(stats.challenge_count)}
              </RNText>
              <RNText style={{ fontSize: getFontSize(11), color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>
                챌린지
              </RNText>
            </View>

            {/* 감정 기록 */}
            <View style={{
              width: (screenWidth - normalizeSpace(80)) / 3,
              paddingVertical: normalizeSpace(4),
              paddingHorizontal: normalizeSpace(6),
              alignItems: 'center',
              gap: normalizeSpace(1),
            }}>
              <Icon name="color-palette-outline" size={20} color="#E91E63" />
              <RNText style={{ fontSize: getFontSize(17), color: isDark ? theme.colors.text.primary : theme.colors.text.primary, fontFamily: 'Pretendard-Bold' }}>
                {formatNumber(totalEmotionCount)}
              </RNText>
              <RNText style={{ fontSize: getFontSize(11), color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>
                감정 기록
              </RNText>
            </View>
          </View>
        </View>

        {/* 이번 주 활동 현황 */}
        <View style={[styles.weeklyActivityCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalizeSpace(8) }}>
              <Icon name="bar-chart" size={22} color={emotionColors.primary} />
              <RNText style={[styles.cardTitle, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>이번 주 활동</RNText>
            </View>
            <RNText style={[styles.cardSubtitle, { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }]}>
              {new Date().getMonth() + 1}월 {Math.ceil(new Date().getDate() / 7)}주차
            </RNText>
          </View>

          {/* 동기부여 메시지 */}
          {weeklyStats.weeklyPosts > 0 && (
            <View style={{
              backgroundColor: isDark ? 'rgba(96, 165, 250, 0.1)' : '#E3F2FD',
              padding: normalizeSpace(12),
              borderRadius: normalizeSpace(10),
              marginBottom: normalizeSpace(16),
              borderLeftWidth: 3,
              borderLeftColor: emotionColors.primary
            }}>
              <RNText style={{
                fontSize: getFontSize(12),
                color: isDark ? '#60a5fa' : '#1976D2',
                fontFamily: 'Pretendard-SemiBold',
                lineHeight: getFontSize(12) * 1.5
              }}>
                {weeklyStats.weeklyPosts >= 7 ? '🎉 매일 꾸준히 작성하셨네요!' :
                 weeklyStats.weeklyPosts >= 5 ? '👏 이번 주도 열심히 활동하셨어요!' :
                 weeklyStats.weeklyPosts >= 3 ? '💪 좋은 습관을 만들어가고 있어요!' :
                 '🌱 하루하루 기록해보세요!'}
              </RNText>
            </View>
          )}

          {/* 활동 그래프 */}
          <View style={{ marginBottom: normalizeSpace(12) }}>
            <ActivityChart
              data={[
                { label: '작성', value: weeklyStats.weeklyPosts, color: '#4CAF50' },
                { label: '공감', value: weeklyStats.weeklyLikes, color: '#E91E63' },
                { label: '댓글', value: weeklyStats.weeklyComments, color: '#FF9800' },
                { label: '연속', value: weeklyStats.consecutiveDays, color: '#FF5722' },
              ]}
              type="bar"
              height={normalizeSpace(180)}
              textColor={isDark ? theme.colors.text.primary : '#000000'}
            />
          </View>

          {/* 통계 요약 */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingTop: normalizeSpace(12),
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0'
          }}>
            <View style={{ alignItems: 'center' }}>
              <Icon name="create-outline" size={16} color="#4CAF50" />
              <RNText style={{ fontSize: getFontSize(12), fontFamily: 'Pretendard-SemiBold', color: isDark ? theme.colors.text.primary : '#000000', marginTop: normalizeSpace(4) }}>
                {weeklyStats.weeklyPosts}개
              </RNText>
              <RNText style={{ fontSize: getFontSize(10), color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }}>작성</RNText>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Icon name="heart-outline" size={16} color="#E91E63" />
              <RNText style={{ fontSize: getFontSize(12), fontFamily: 'Pretendard-SemiBold', color: isDark ? theme.colors.text.primary : '#000000', marginTop: normalizeSpace(4) }}>
                {weeklyStats.weeklyLikes}개
              </RNText>
              <RNText style={{ fontSize: getFontSize(10), color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }}>공감</RNText>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Icon name="chatbubble-outline" size={16} color="#FF9800" />
              <RNText style={{ fontSize: getFontSize(12), fontFamily: 'Pretendard-SemiBold', color: isDark ? theme.colors.text.primary : '#000000', marginTop: normalizeSpace(4) }}>
                {weeklyStats.weeklyComments}개
              </RNText>
              <RNText style={{ fontSize: getFontSize(10), color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }}>댓글</RNText>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Icon name="flame" size={16} color="#FF5722" />
              <RNText style={{ fontSize: getFontSize(12), fontFamily: 'Pretendard-SemiBold', color: isDark ? theme.colors.text.primary : '#000000', marginTop: normalizeSpace(4) }}>
                {weeklyStats.consecutiveDays > 0 ? `${weeklyStats.consecutiveDays}일` : '-'}
              </RNText>
              <RNText style={{ fontSize: getFontSize(10), color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }}>연속</RNText>
            </View>
          </View>
        </View>

        {/* 나만의 특별한 기록 */}
        <View style={[styles.recordsCard, { backgroundColor: theme.colors.card }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Icon name="ribbon" size={20} color={emotionColors.primary} style={{ marginRight: 8 }} />
            <RNText style={{ fontSize: FONT_SIZES.h4, fontFamily: 'Pretendard-Bold', color: isDark ? theme.colors.text.primary : emotionColors.text }}>나만의 특별한 기록</RNText>
          </View>

          <View style={styles.recordsList}>
            <View style={[styles.recordItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}>
              <Icon name="rocket" size={20} color={emotionColors.warning} />
              <View style={styles.recordInfo}>
                <RNText style={[styles.recordTitle, { color: isDark ? theme.colors.text.primary : '#000000' }]}>여정 시작일</RNText>
                <RNText style={[styles.recordValue, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '정보 없음'}
                </RNText>
              </View>
            </View>

            <View style={[styles.recordItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}>
              <Icon name="trophy" size={20} color={emotionColors.gold} />
              <View style={styles.recordInfo}>
                <RNText style={[styles.recordTitle, { color: isDark ? theme.colors.text.primary : '#000000' }]}>최장 연속 작성</RNText>
                <RNText style={[styles.recordValue, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>
                  {weeklyStats.consecutiveDays}일
                </RNText>
              </View>
            </View>

            <View style={[styles.recordItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}>
              <Icon name="star" size={20} color={emotionColors.primary} />
              <View style={styles.recordInfo}>
                <RNText style={[styles.recordTitle, { color: isDark ? theme.colors.text.primary : '#000000' }]}>인기 게시물</RNText>
                <RNText style={[styles.recordValue, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>
                  {bestPostLikes > 0 ? `${bestPostLikes}개 공감` : '게시물을 작성해보세요!'}
                </RNText>
              </View>
            </View>

            <View style={[styles.recordItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}>
              <Icon name="calendar" size={20} color={emotionColors.success} />
              <View style={styles.recordInfo}>
                <RNText style={[styles.recordTitle, { color: isDark ? theme.colors.text.primary : '#000000' }]}>활동 최초 D+</RNText>
                <RNText style={[styles.recordValue, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>
                  {firstActivity.days_since_first_activity}일
                </RNText>
              </View>
            </View>
          </View>
        </View>

        {/* 나의 배지 */}
        {badges.length > 0 && (
          <View style={[styles.badgeCard, { backgroundColor: theme.colors.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Icon name="medal-outline" size={20} color={emotionColors.gold} style={{ marginRight: 8 }} />
              <RNText style={{ fontSize: FONT_SIZES.h4, fontFamily: 'Pretendard-Bold', color: isDark ? theme.colors.text.primary : emotionColors.text }}>나의 배지</RNText>
              <View style={{ flex: 1 }} />
              <RNText style={{ fontSize: FONT_SIZES.bodySmall, fontFamily: 'Pretendard-Medium', color: emotionColors.textSecondary }}>{badges.length}개 획득</RNText>
            </View>
            <View style={styles.badgeGrid}>
              {badges.map((badge) => (
                <View key={badge.id} style={[styles.badgeItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}>
                  <RNText style={styles.badgeIcon}>{badge.icon}</RNText>
                  <RNText style={[styles.badgeName, { color: isDark ? theme.colors.text.primary : '#333' }]} numberOfLines={1}>{badge.name}</RNText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 챌린지 현황 */}
        <View style={[styles.challengeCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardHeader}>
            <Icon name="trophy-outline" size={22} color={emotionColors.primary} />
            <RNText style={[styles.cardTitle, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>챌린지 현황</RNText>
          </View>

          <View style={styles.challengeStats}>
            <View style={[styles.challengeStatItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}>
              <View style={styles.challengeIconContainer}>
                <Icon name="add-circle-outline" size={25} color={emotionColors.success} />
              </View>
              <RNText style={[styles.challengeStatNumber, { color: isDark ? theme.colors.text.primary : '#000000' }]}>
                {challengeStats.createdChallenges}
              </RNText>
              <RNText style={[styles.challengeStatLabel, { color: isDark ? theme.colors.text.secondary : '#555555' }]}>만든{'\n'}챌린지</RNText>
            </View>

            <View style={[styles.challengeStatItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}>
              <View style={styles.challengeIconContainer}>
                <Icon name="people-outline" size={25} color={emotionColors.primary} />
              </View>
              <RNText style={[styles.challengeStatNumber, { color: isDark ? theme.colors.text.primary : '#000000' }]}>
                {challengeStats.joinedChallenges}
              </RNText>
              <RNText style={[styles.challengeStatLabel, { color: isDark ? theme.colors.text.secondary : '#555555' }]}>참여한{'\n'}챌린지</RNText>
            </View>

            <View style={[styles.challengeStatItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}>
              <View style={styles.challengeIconContainer}>
                <Icon name="checkmark-circle-outline" size={25} color={emotionColors.warning} />
              </View>
              <RNText style={[styles.challengeStatNumber, { color: isDark ? theme.colors.text.primary : '#000000' }]}>
                {challengeStats.completedChallenges}
              </RNText>
              <RNText style={[styles.challengeStatLabel, { color: isDark ? theme.colors.text.secondary : '#555555' }]}>완료한{'\n'}챌린지</RNText>
            </View>
          </View>
        </View>


        {/* 감정 태그 선호도 */}
        {emotionTags.length > 0 && (
          <View style={[styles.emotionTagsCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.emotionHeader}>
              <Icon name="heart" size={22} color={emotionColors.primary} />
              <RNText style={[styles.cardTitle, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>감정 태그 선호도</RNText>
              <RNText style={[styles.emotionSubtitle, { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }]}>
                {totalEmotionCount}회 기록
              </RNText>
            </View>

            <View style={styles.simpleEmotionContainer}>
              {emotionTags.slice(0, 5).map((tag, index) => (
                <View
                  key={tag.emotion_id || tag.name}
                  style={[
                    styles.simpleEmotionTag,
                    index < 3 && styles.topSimpleTag,
                    { backgroundColor: index < 3 ? (isDark ? theme.bg.secondary : '#E3F2FD') : (isDark ? theme.bg.secondary : '#F8F9FA') }
                  ]}
                >
                  <View
                    style={[
                      styles.emotionDot,
                      index < 3 && styles.topEmotionDot,
                      { backgroundColor: tag.color }
                    ]}
                  />
                  <View style={styles.emotionInfo}>
                    <RNText style={[
                      styles.simpleEmotionName,
                      index < 3 && styles.topEmotionName,
                      { color: isDark ? theme.colors.text.primary : '#000000' }
                    ]}>
                      {tag.name}
                    </RNText>
                    <RNText style={[
                      styles.simpleEmotionCount,
                      index < 3 && styles.topEmotionCount,
                      { color: isDark ? theme.colors.text.secondary : '#333333' }
                    ]}>
                      {tag.count}번
                    </RNText>
                  </View>
                  {index < 3 && (
                    <View style={[styles.rankBadge, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                      <RNText style={[styles.rankText, { color: isDark ? '#FFFFFF' : '#333333' }]}>{index + 1}</RNText>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* 📊 감정 분포 차트 */}
            {emotionTags.length >= 3 && (
              <View style={{ marginTop: 20, marginBottom: 20 }}>
                <RNText style={[
                  styles.emotionSubtitle,
                  {
                    color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary,
                    marginBottom: 12,
                    textAlign: 'center'
                  }
                ]}>
                  감정 분포
                </RNText>
                <ActivityChart
                  data={emotionTags.slice(0, 5).map(tag => ({
                    label: tag.name,
                    value: tag.count,
                    color: tag.color
                  }))}
                  type="pie"
                  height={200}
                />
              </View>
            )}

            <View style={[styles.emotionStats, { backgroundColor: isDark ? theme.bg.secondary : '#F0F8FF' }]}>
              <View style={styles.statRow}>
                <RNText style={[styles.emotionStatLabel, { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }]}>가장 자주 사용한 감정</RNText>
                <RNText style={[styles.statValue, { color: isDark ? theme.colors.text.primary : '#000000' }]}>
                  {emotionTags[0]?.name || '없음'}
                </RNText>
              </View>
              <View style={styles.statRow}>
                <RNText style={[styles.emotionStatLabel, { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }]}>총 감정 기록</RNText>
                <RNText style={[styles.statValue, { color: isDark ? theme.colors.text.primary : '#000000' }]}>
                  {totalEmotionCount}회
                </RNText>
              </View>
              <View style={styles.statRow}>
                <RNText style={[styles.emotionStatLabel, { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary }]}>다양한 감정 사용</RNText>
                <RNText style={[styles.statValue, { color: isDark ? theme.colors.text.primary : '#000000' }]}>
                  {emotionTags.length}개 종류
                </RNText>
              </View>
            </View>
          </View>
        )}

        {/* 설정 및 기타 옵션 */}
        <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
          <RNText style={[styles.cardTitle, { color: isDark ? theme.colors.text.primary : emotionColors.text }]}>
            설정 ⚙️
          </RNText>

          <View style={styles.settingsContainer}>
            {/* 전체 설정 */}
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
              accessibilityLabel="전체 설정"
            >
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(102, 126, 234, 0.1)' }]}>
                <Icon name="settings-outline" size={20} color={emotionColors.primary} />
              </View>
              <RNText style={[styles.settingText, { color: isDark ? theme.colors.text.primary : '#1A1A1A' }]}>전체 설정</RNText>
              <Icon name="chevron-forward" size={16} color={isDark ? emotionColors.textSecondary : '#999999'} />
            </TouchableOpacity>

            {/* 관심 글 */}
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}
              onPress={() => navigation.navigate('Bookmarks')}
              activeOpacity={0.7}
              accessibilityLabel="관심 글"
            >
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)' }]}>
                <Icon name="bookmark-outline" size={20} color="#EC4899" />
              </View>
              <RNText style={[styles.settingText, { color: isDark ? theme.colors.text.primary : '#1A1A1A' }]}>관심 글</RNText>
              <Icon name="chevron-forward" size={16} color={isDark ? emotionColors.textSecondary : '#999999'} />
            </TouchableOpacity>

            {/* 차단 관리 */}
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}
              onPress={() => navigation.navigate('BlockManagement')}
              activeOpacity={0.7}
              accessibilityLabel="차단 관리"
            >
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)' }]}>
                <Icon name="ban-outline" size={20} color={emotionColors.error} />
              </View>
              <RNText style={[styles.settingText, { color: isDark ? theme.colors.text.primary : '#1A1A1A' }]}>차단 관리</RNText>
              <Icon name="chevron-forward" size={16} color={isDark ? emotionColors.textSecondary : '#999999'} />
            </TouchableOpacity>

            {/* 관리자 대시보드 */}
            {(user?.role === 'admin' || user?.is_admin) && (
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(102, 126, 234, 0.08)' : 'rgba(102, 126, 234, 0.06)' }]}
                onPress={() => navigation.navigate('AdminDashboard')}
                activeOpacity={0.7}
                accessibilityLabel="관리자 대시보드"
              >
                <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.12)' }]}>
                  <Icon name="shield-checkmark" size={20} color="#667EEA" />
                </View>
                <RNText style={[styles.settingText, { color: '#667EEA', fontFamily: 'Pretendard-Bold' }]}>관리자</RNText>
                <Icon name="chevron-forward" size={16} color="#667EEA" />
              </TouchableOpacity>
            )}

            {/* 로그아웃 */}
            <TouchableOpacity
              style={[styles.settingItem, styles.logoutItem, { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.08)' : '#FFF5F5' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
              accessibilityLabel="로그아웃"
            >
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.12)' }]}>
                <Icon name="log-out-outline" size={20} color={emotionColors.error} />
              </View>
              <RNText style={[styles.logoutText, { color: emotionColors.error }]}>로그아웃</RNText>
              <Icon name="chevron-forward" size={16} color={isDark ? emotionColors.textSecondary : '#999999'} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
      </View>

      {/* 이미지 선택 모달 */}
      {showImagePicker && (
        <View style={[styles.modalContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card, borderColor: isDark ? theme.bg.border : '#e0e0e0' }]}>
            <View style={styles.modalHeader}>
              <RNText style={[styles.modalTitle, { color: theme.colors.text.primary }]}>프로필 이미지 변경</RNText>
              <TouchableOpacity
                onPress={() => setShowImagePicker(false)}
                style={[styles.closeButton, { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }]}
              >
                <Icon name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ImagePicker
              currentImageUrl={user.profile_image_url}
              onImageSelected={handleProfileImageChange}
              onImageRemoved={handleRemoveProfileImage}
              type="profile"
              maxSizeMB={5}
              showPreview={true}
            />
          </View>
        </View>
      )}

      {/* 명언 편집 모달 */}
      {showQuoteEditor && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modernModalContainer}
        >
          <View style={[styles.modernModalContent, { backgroundColor: theme.colors.card }]}>
            {/* 간소화된 헤더 */}
            <View style={[styles.modernModalHeader, { borderBottomColor: isDark ? theme.bg.border : '#F0F0F0' }]}>
              <RNText style={[styles.modernModalTitle, { color: isDark ? theme.colors.text.primary : '#000000' }]}>나의 명언</RNText>
              <TouchableOpacity
                onPress={() => setShowQuoteEditor(false)}
                style={[styles.modernCloseButton, { backgroundColor: isDark ? theme.bg.primary : '#F8F9FA' }]}
              >
                <Icon name="close" size={20} color={emotionColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* 컴팩트한 바디 */}
            <View style={styles.modernQuoteEditorBody}>
              <TextInput
                style={[styles.modernQuoteInput, {
                  backgroundColor: isDark ? theme.bg.primary : '#F8F9FA',
                  color: isDark ? theme.colors.text.primary : '#000000'
                }]}
                value={tempQuote}
                onChangeText={setTempQuote}
                placeholder="당신에게 힘이 되는 말을 남겨보세요..."
                placeholderTextColor={emotionColors.textLight}
                multiline={true}
                maxLength={200}
                textAlignVertical="top"
                autoFocus={true}
              />

              <View style={styles.modernQuoteFooter}>
                <RNText style={[
                  styles.modernQuoteCounter,
                  { color: isDark ? theme.colors.text.secondary : emotionColors.textSecondary },
                  (tempQuote?.length || 0) > 180 && { color: emotionColors.warning },
                  (tempQuote?.length || 0) > 195 && { color: emotionColors.error }
                ]}>
                  {tempQuote?.length || 0}/200
                </RNText>

                <TouchableOpacity
                  style={[
                    styles.modernCompleteButton,
                    {
                      backgroundColor: (!tempQuote || tempQuote.trim().length === 0)
                        ? (isDark ? theme.bg.secondary : '#E0E0E0')
                        : emotionColors.primary
                    },
                    (!tempQuote || tempQuote.trim().length === 0) && styles.modernCompleteButtonDisabled
                  ]}
                  onPress={handleSaveQuote}
                  disabled={!tempQuote || tempQuote.trim().length === 0}
                >
                  <Icon
                    name="checkmark"
                    size={16}
                    color={(!tempQuote || tempQuote.trim().length === 0) ? emotionColors.textLight : '#FFFFFF'}
                  />
                  <RNText style={[
                    styles.modernCompleteButtonText,
                    { color: (!tempQuote || tempQuote.trim().length === 0) ? emotionColors.textLight : '#FFFFFF' },
                    (!tempQuote || tempQuote.trim().length === 0) && styles.modernCompleteButtonTextDisabled
                  ]}>
                    완료
                  </RNText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* BottomSheetAlert */}
      <BottomSheetAlert
        visible={bottomSheetAlert.visible}
        title={bottomSheetAlert.title}
        message={bottomSheetAlert.message}
        buttons={bottomSheetAlert.buttons}
        onClose={() => setBottomSheetAlert({ visible: false, title: '', message: '', buttons: [] })}
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

// 이 파일에서 emotionColors는 컴포넌트 내부에서 동적 생성됩니다 (1120줄 이후 참조)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginRequiredText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-Medium',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  themeToggle: {
    position: 'absolute',
    zIndex: 10,
    padding: 8,
  },
  // 모던 미니멀 헤더
  enhancedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'android' ? 24 : 40,
    paddingBottom: 6,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    marginBottom: 2,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  profileBackButton: {
    padding: 5,
    marginRight: 12,
    marginTop: 0,
  },
  headerContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 8,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: 'Pretendard-ExtraBold',
    letterSpacing: -0.4,
    lineHeight: 30,
    textAlign: 'left',
    flex: 1,
  },
  encouragementButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  modernSettingsButton: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 0,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.bodyLarge, // 15 → 16 (가독성 향상)
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  heartIcon: {
    fontSize: FONT_SIZES.bodyLarge,
    marginLeft: 6,
  },
  profileCard: {
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 4,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 0,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileImageContainer: {
    position: 'relative',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
  },
  joinDate: {
    fontSize: FONT_SIZES.small,
    fontFamily: 'Pretendard-Medium',
    letterSpacing: 0.3,
    lineHeight: FONT_SIZES.small * 1.4,
  },
  userName: {
    fontSize: FONT_SIZES.h3, // 17 → 18 (사용자명 강조)
    fontFamily: 'Pretendard-Bold',
    marginBottom: 6,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  userHandle: {
    fontSize: FONT_SIZES.body, // 14 → 15 (핸들명 가독성)
    marginBottom: 3,
    fontFamily: 'Pretendard-Medium',
    lineHeight: 21,
  },
  userEmail: {
    fontSize: FONT_SIZES.body, // 14 → 15 (이메일 가독성)
    fontFamily: 'Pretendard-Medium',
    lineHeight: 21,
  },
  loadingText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-Medium',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-SemiBold',
  },
  statsCard: {
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 0,
  },
  cardTitle: {
    fontSize: FONT_SIZES.h4,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 6,
    textAlign: 'left',
    letterSpacing: -0.2,
    lineHeight: 22,
    flexShrink: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 2,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 50,
    flex: 1,
  },
  statNumber: {
    fontSize: FONT_SIZES.h3,
    fontFamily: 'Pretendard-Bold',
    marginTop: 2,
    marginBottom: 1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: FONT_SIZES.caption,
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight: 16,
  },
  settingsCard: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 0,
  },
  settingsContainer: {
    gap: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 6,
    minHeight: 48,
    elevation: 0.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  settingText: {
    flex: 1,
    fontSize: FONT_SIZES.bodyLarge, // 15 → 16 (설정 항목 가독성)
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.2,
    lineHeight: 22,
    textAlignVertical: 'center',
  },
  settingIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutItem: {
    marginTop: 4,
    borderTopWidth: 0,
    paddingTop: 0,
  },
  logoutText: {
    flex: 1,
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 22,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: FONT_SIZES.h2, // 18 → 20 (모달 제목 강조)
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.2,
    flex: 1,
    lineHeight: 28,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  // 새로 추가된 스타일들
  quoteContainer: {
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
    borderWidth: 0,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: FONT_SIZES.bodySmall, // 13 → 14 (라벨 가독성)
    fontFamily: 'Pretendard-SemiBold',
    flex: 1,
    lineHeight: 20,
  },
  quoteText: {
    fontSize: FONT_SIZES.bodyLarge, // 15 → 16 (명언 강조)
    fontStyle: 'italic',
    lineHeight: 26,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'left',
    letterSpacing: 0.1,
  },
  emotionTagsCard: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 0,
  },
  emotionTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  // 심플하고 세련된 감정 태그 스타일
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  emotionSubtitle: {
    fontSize: FONT_SIZES.body, // 14 → 15 (서브타이틀 가독성)
    fontFamily: 'Pretendard-Medium',
    marginLeft: 'auto',
    lineHeight: 21,
  },
  simpleEmotionContainer: {
    gap: 0,
  },
  simpleEmotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0,
    marginBottom: 3,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  topSimpleTag: {
    borderWidth: 0,
  },
  emotionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  topEmotionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  emotionInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simpleEmotionName: {
    fontSize: FONT_SIZES.body, // 14 → 15 (감정명 가독성)
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: 0,
    lineHeight: 21,
  },
  topEmotionName: {
    fontSize: FONT_SIZES.bodyLarge, // 15 → 16 (상위 감정명 강조)
    fontFamily: 'Pretendard-Bold',
    lineHeight: 22,
  },
  simpleEmotionCount: {
    fontSize: FONT_SIZES.bodySmall, // 13 → 14 (횟수 가독성)
    fontFamily: 'Pretendard-Medium',
    lineHeight: 20,
  },
  topEmotionCount: {
    fontSize: FONT_SIZES.bodyLarge, // 15 → 16 (상위 횟수 강조)
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 22,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  rankText: {
    fontSize: FONT_SIZES.body, // 14 → 15 (순위 텍스트 강조)
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    lineHeight: 21,
  },
  // 감정 통계 하단 정보
  emotionStats: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0,
    gap: 6,
    borderRadius: 10,
    padding: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emotionStatLabel: {
    fontSize: FONT_SIZES.bodySmall, // 13 → 14 (라벨 가독성)
    fontFamily: 'Pretendard-Medium',
    lineHeight: 20,
  },
  statValue: {
    fontSize: FONT_SIZES.body, // 14 → 15 (값 강조)
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 21,
  },
  chartCard: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    elevation: 0,
    shadowColor: 'transparent',
    borderWidth: 0.5,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  chartDescription: {
    fontSize: FONT_SIZES.bodyLarge,
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    lineHeight: 24,
  },
  // 프라이버시 설정 스타일
  privacyContainer: {
    gap: 20,
  },
  privacySection: {
    paddingBottom: 20,
    borderBottomWidth: 0,
    marginBottom: 24,
  },
  privacyTitle: {
    fontSize: FONT_SIZES.h4,
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 12,
  },
  privacyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  selectedPrivacy: {
  },
  privacyOptionText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-Medium',
  },
  selectedPrivacyText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  privacyToggleContainer: {
    gap: 12,
  },
  privacyToggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  privacyToggleLabel: {
    fontSize: FONT_SIZES.h4,
    fontFamily: 'Pretendard-Medium',
  },
  privacyToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  privacyToggleActive: {
  },
  privacyToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    left: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  privacyToggleThumbActive: {
    left: 22,
  },
  // 이번 주 활동 카드 스타일
  weeklyActivityCard: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'nowrap',
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Medium',
    marginLeft: 'auto',
  },
  weeklyStats: {
    gap: 0,
  },
  weeklyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0,
    marginBottom: 6,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  weeklyLabel: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    fontFamily: 'Pretendard-Medium',
    marginLeft: 10,
    lineHeight: 20,
  },
  weeklyNumber: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-Bold',
  },
  // 나만의 기록 카드 스타일
  recordsCard: {
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 0,
  },
  recordsList: {
    gap: 0,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 0,
    marginBottom: 6,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recordInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordTitle: {
    fontSize: FONT_SIZES.body,
    fontFamily: 'Pretendard-Medium',
    lineHeight: 20,
  },
  recordValue: {
    fontSize: FONT_SIZES.body,
    fontFamily: 'Pretendard-SemiBold',
  },
  // 배지 스타일
  badgeCard: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  badgeCount: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Medium',
    marginLeft: 'auto',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badgeItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: FONT_SIZES.tiny,
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
  // 챌린지 현황 스타일
  challengeCard: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 0,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  challengeStatItem: {
    alignItems: 'center',
    borderRadius: 14,
    padding: 10,
    flex: 1,
    borderWidth: 0,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  challengeIconContainer: {
    marginBottom: 6,
  },
  challengeStatNumber: {
    fontSize: FONT_SIZES.h3,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 2,
  },
  challengeStatLabel: {
    fontSize: FONT_SIZES.small,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    lineHeight: 16,
  },
  // 명언 편집 모달 스타일
  quoteModalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  quoteEditorBody: {
    padding: 24,
  },
  quoteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  quoteInputLabel: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: 0.2,
  },
  quoteInput: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    fontSize: FONT_SIZES.bodyLarge,
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'Pretendard-Medium',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  quoteCounter: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  quoteCounterText: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Medium',
  },
  quoteTips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  quoteTipsText: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Medium',
    flex: 1,
    lineHeight: 20,
  },
  quoteButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quoteCancelButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  quoteCancelButtonText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-SemiBold',
  },
  quoteSaveButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  quoteSaveButtonText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  // 모던한 명언 편집 모달 스타일
  modernModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modernModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  modernModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modernModalTitle: {
    fontSize: FONT_SIZES.h3,
    fontFamily: 'Pretendard-Bold',
    color: '#000000',
    letterSpacing: 0.1,
  },
  modernCloseButton: {
    padding: 4,
    borderRadius: 8,
  },
  modernQuoteEditorBody: {
    padding: 20,
  },
  modernQuoteInput: {
    borderWidth: 0,
    borderRadius: 12,
    padding: 16,
    fontSize: FONT_SIZES.bodyLarge,
    color: '#000000',
    minHeight: 100,
    maxHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'Pretendard-Medium',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  modernQuoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  modernQuoteCounter: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Medium',
  },
  modernCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modernCompleteButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  modernCompleteButtonText: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modernCompleteButtonTextDisabled: {
  },
});

export default ProfileScreen;