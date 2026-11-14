// 기존 ChallengeScreen.tsx 파일을 복사하고 삭제 기능을 추가한 수정 버전
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Platform,
  FlatList,
  Animated,
  TextInput,
  BackHandler,
  Modal,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MasonryList from '@react-native-seoul/masonry-list';
import challengeService from '../services/api/challengeService';
import reportService from '../services/api/reportService';
import ShareModal from '../components/ShareModal';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { normalizeImageUrl } from '../utils/imageUtils';
import { normalize } from '../utils/responsive';
import BottomSheet from '../components/BottomSheet';
import { ChallengeTabs } from '../components/challenge/tabs/ChallengeTabs';
import { ChallengeFilters } from '../components/challenge/filters/ChallengeFilters';
import { SearchStatus } from '../components/challenge/filters/SearchStatus';
import { CleanHotCard } from '../components/challenge/cards/CleanHotCard';
import { EmptyHotSection } from '../components/challenge/empty/EmptyHotSection';
import { EmptyMyChallenge } from '../components/challenge/empty/EmptyMyChallenge';
// import SimpleEditChallengeModal from '../components/modals/SimpleEditChallengeModal'; // 네이티브 모달로 교체
import { GoalChallengeCard } from '../components/challenge/cards/GoalChallengeCard';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, getGradientColors } from '../constants/designSystem';
import { showAlert } from '../contexts/AlertContext';
import { getDday as getDdayUtil, formatDateShort } from '../utils/dateUtils';
import { sanitizeErrorMessage } from '../utils/sanitize';
import { HotSection } from '../components/challenge/sections/HotSection';
import { AllSection } from '../components/challenge/sections/AllSection';
import { MySection } from '../components/challenge/sections/MySection';
import GuestPromptBottomSheet from '../components/GuestPromptBottomSheet';
// import SwipeableCard from '../components/SwipeableCard'; // 임시 비활성화
import { FONT_SIZES } from '../constants';

// React Native 0.80 호환: 동적 화면 너비
const getScreenWidth = () => {
  try {
    const width = Dimensions.get('window').width;
    if (width > 0) return width;
  } catch (e) {}
  return 360;
};
const CARD_SPACING = 12; // 카드 간 간격
const CONTAINER_PADDING = 12; // 좌우 여백


interface Challenge {
  challenge_id: number;
  creator?: {
    user_id: number;
    username: string;
    nickname?: string;
  };
  creator_id?: number;
  title: string;
  description: string;
  category: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'upcoming' | 'completed';
  participant_count: number;
  is_participating: boolean;
  max_participants?: number;
  progress?: number;
  tags?: string[];
  creator_name?: string;
  image_url?: string;
  image_urls?: string[];
  // 목표지향적 챌린지 속성 추가
  goal_type?: 'daily' | 'weekly' | 'total_count';
  goal_value?: number;
  success_criteria?: string;
  current_streak?: number;
  completion_rate?: number;
  required_actions?: string[];
  created_by_user?: boolean;
  // 소셜 인터랙션 카운트 추가
  comment_count?: number;
  like_count?: number;
  // 베스트 챌린지 속성
  ranking?: number;
  score?: number;
}
interface SearchFilter {
  query: string;
  category: string;
  sortBy: string;
  showCompleted: boolean;
  tags?: string[];
}
const ChallengeScreenFixed = ({ route }: any) => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { theme, isDark } = useModernTheme();
  const { user, isAuthenticated } = useAuth();
  const isFocused = useIsFocused();

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  // 프로필 이미지 컴포넌트 - 필터/탭 변경과 무관하게 유지
  const HeaderProfileImage = useMemo(() => {
    if (user?.profile_image_url) {
      return (
        <FastImage
          source={{
            uri: normalizeImageUrl(user.profile_image_url),
            priority: FastImage.priority.high,
            cache: FastImage.cacheControl.immutable,
          }}
          style={{
            width: 46,
            height: 46,
            borderRadius: 17,
            borderWidth: 2,
            borderColor: theme.bg.border,
          }}
          resizeMode={FastImage.resizeMode.cover}
        />
      );
    }
    return <MaterialCommunityIcons name="account-circle-outline" size={34} color={theme.text.primary} />;
  }, [user?.profile_image_url, user?.user_id, theme.bg.border, theme.text.primary]);

  // Refs
  const scrollViewRef = useRef<typeof ScrollView | null>(null);
  // 상태 관리
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [bestChallenges, setBestChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingChallengeId, setDeletingChallengeId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [isSearchMode, setIsSearchMode] = useState(false); // 전체 화면 검색 모드
  const [searchHistory, setSearchHistory] = useState<string[]>([]); // 검색 기록
  const [currentSearchQuery, setCurrentSearchQuery] = useState(''); // 현재 입력 중인 검색어
  const [showScrollToTop, setShowScrollToTop] = useState(false); // 스크롤 탑 버튼 표시 여부
  const scrollToTopOpacity = useRef(new Animated.Value(0)).current; // 스크롤 탑 버튼 애니메이션
  // BottomSheet 상태
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  // 신고한 챌린지 ID 목록
  const [reportedChallengeIds, setReportedChallengeIds] = useState<Set<number>>(new Set());
  // 편집 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMaxParticipants, setEditMaxParticipants] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>({
    query: '',
    category: 'all',
    sortBy: 'latest',
    showCompleted: false
  });
  // 탭 상태 추가
  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'my'>('all');
  // 탭 필터 상태
  const [myStatusFilter, setMyStatusFilter] = useState<'created' | 'participating'>('created');
  const [allStatusFilter, setAllStatusFilter] = useState<'active' | 'completed'>('active');
  // 비로그인 사용자 프롬프트 상태
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestPromptConfig, setGuestPromptConfig] = useState({
    title: '로그인이 필요해요',
    message: '챌린지에 참여하고 감정을 기록해보세요'
  });
  // 탭별 데이터 로드 상태 캐싱 (트래픽 최적화)
  const tabLoadedRef = useRef<{
    all: boolean;
    hot: boolean;
    my: boolean;
  }>({
    all: false,
    hot: false,
    my: false
  });

  // 검색 필터 변경 감지 (필터 변경 시 캐시 리셋)
  useEffect(() => {
    if (__DEV__) console.log('🔄 searchFilter 변경됨:', searchFilter);
    // 필터 변경 시 all, hot 탭 캐시 리셋 (새 필터 적용된 데이터 로드)
    tabLoadedRef.current.all = false;
    tabLoadedRef.current.hot = false;
  }, [searchFilter.category, searchFilter.sortBy, searchFilter.showCompleted]);

  // allStatusFilter 변경 감지 (필터 변경 시 캐시 리셋)
  useEffect(() => {
    if (__DEV__) console.log('🔄 allStatusFilter 변경됨:', allStatusFilter);
    // 필터 변경 시 all, hot 탭 캐시 리셋 (새 필터 적용된 데이터 로드)
    tabLoadedRef.current.all = false;
    tabLoadedRef.current.hot = false;
  }, [allStatusFilter]);
  // 탭 변경 핸들러 - allStatusFilter 리셋
  const handleTabChange = useCallback((newTab: 'all' | 'hot' | 'my') => {
    // 같은 탭을 클릭하면 아무것도 하지 않음
    if (newTab === activeTab) {
      if (__DEV__) console.log('🔄 같은 탭 클릭:', newTab);
      return;
    }

    // 비로그인 사용자가 'my' 탭을 선택하려고 하면 로그인 프롬프트
    if (newTab === 'my' && !isAuthenticated) {
      if (__DEV__) console.log('⚠️ 비로그인 사용자 - my 탭 접근 시도');
      setGuestPromptConfig({
        title: '로그인이 필요해요',
        message: '내 챌린지를 보려면 로그인이 필요합니다'
      });
      setShowGuestPrompt(true);
      return;
    }

    if (__DEV__) console.log('🔄 탭 변경:', activeTab, '→', newTab);

    // All 탭에서 다른 탭으로 이동 시 allStatusFilter를 active로 리셋
    if (activeTab === 'all' && newTab !== 'all') {
      if (__DEV__) console.log('🔄 allStatusFilter 리셋: active (All 탭 벗어남)');
      setAllStatusFilter('active');
    }

    setActiveTab(newTab);
  }, [activeTab, isAuthenticated, navigation]);
  const handleReportChallenge = async (challengeId: number, reason: string) => {
    try {
      const reportTypes: any = {
        spam: 'spam',
        inappropriate: 'inappropriate',
        harassment: 'harassment',
        other: 'other'
      };

      await reportService.submitReport({
        item_type: 'challenge',
        item_id: challengeId,
        report_type: reportTypes[reason] || 'other',
        reason: reason,
        details: reason
      });

      // 신고 성공 시 ID 저장
      setReportedChallengeIds(prev => new Set(prev).add(challengeId));

      showAlert.show('신고 완료', '신고가 접수되었습니다.');
    } catch (error: any) {
      if (__DEV__) console.error('신고 오류:', error);

      // 중복 신고 에러 처리
      if (error?.response?.data?.code === 'ALREADY_REPORTED') {
        showAlert.show('알림', '이미 신고한 챌린지입니다.');
      } else {
        showAlert.show('오류', sanitizeErrorMessage(error));
      }
    }
  };

  const handleShareChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowShareModal(true);
  };

  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  // HOT 불꽃 애니메이션
  const fireAnimation = useRef(new Animated.Value(1)).current;
  // HOT 불꽃 애니메이션 효과
  // HOT 탭 무한 스크롤
  const [hotDisplayCount, setHotDisplayCount] = useState(10);
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fireAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fireAnimation]);

  // 초기 애니메이션
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);
  // 데이터 로드
  const loadChallenges = useCallback(async (page = 1, isRefresh = false, customFilter?: SearchFilter) => {
    try {
      // 검색/필터 변경 시에만 캐시 클리어 (탭 전환 시에는 클리어하지 않음)
      if (page === 1 && !isRefresh && customFilter) {
        challengeService.clearCacheByPattern('challenges_');
        if (__DEV__) console.log('🗑️ Filter change: clear cache');
      }
      if (page === 1 && !isRefresh) {
        setLoading(true);
      }
      if (page > 1) {
        setLoadingMore(true);
      }
      const filterToUse = customFilter || searchFilter;
      if (__DEV__) console.log('🔵 loadChallenges 호출:', { page, activeTab, allStatusFilter });
      // 백엔드 API와 호환되도록 파라미터 매핑
      const requestParams: {
        page: number;
        limit: number;
        query: string;
        category: string;
        status?: 'active' | 'completed' | 'upcoming';
        sort_by: 'latest' | 'created_at' | 'popular' | 'participant_count' | 'ending_soon' | 'start_date';
        order: 'asc' | 'desc';
        tags?: string[];
      } = {
        page,
        limit: 10,
        query: filterToUse.query,
        category: filterToUse.category,
        status: activeTab === 'all'
          ? (allStatusFilter === 'completed' ? 'completed' : 'active')
          : (activeTab === 'hot' ? 'active' : undefined),
        sort_by: (filterToUse.sortBy === 'latest' ? 'created_at' :
                 filterToUse.sortBy === 'popular' ? 'popular' :
                 filterToUse.sortBy === 'recommended' ? 'like_count' :
                 filterToUse.sortBy === 'ending_soon' ? 'ending_soon' : 'created_at') as 'latest' | 'created_at' | 'popular' | 'like_count' | 'participant_count' | 'ending_soon' | 'start_date',
        order: filterToUse.sortBy === 'ending_soon' ? 'asc' : 'desc',
        tags: filterToUse.tags
      };
      // undefined 값 제거
      Object.keys(requestParams).forEach(key => {
        if (requestParams[key as keyof typeof requestParams] === undefined) {
          delete requestParams[key as keyof typeof requestParams];
        }
      });
      if (__DEV__) console.log('🔍 챌린지 검색 요청 파라미터:', JSON.stringify(requestParams, null, 2));
      const response = await challengeService.getChallenges(requestParams);
      if (__DEV__) console.log('🔍 챌린지 API 호출 완료:', response?.data?.length || response?.data?.data?.length || 0, '개 챌린지');
      if (response?.data) {
        // 백엔드 응답 구조에 맞게 수정: response.data가 직접 배열임
        const responseData = response.data;
        let newChallenges = Array.isArray(responseData) ? responseData : (responseData.data || []);
        const pagination = Array.isArray(responseData) ? null : responseData.pagination;

        // 백엔드에서 실제 댓글수와 좋아요수를 받아옴
        if (__DEV__) console.log(`💬 챌린지 데이터 확인: ${newChallenges.length}개 로드됨`);
        if (newChallenges.length > 0) {
          if (__DEV__) console.log(`💬 첫 번째 챌린지 - ${newChallenges[0].title}: 댓글 ${newChallenges[0].comment_count || 0}, 좋아요 ${newChallenges[0].like_count || 0}`);
          if (__DEV__) console.log('🖼️ 첫 번째 챌린지 전체 데이터:', JSON.stringify(newChallenges[0], null, 2));
        }

        if (page === 1) {
          setChallenges(newChallenges);
          if (__DEV__) console.log('✅ setChallenges 완료:', newChallenges.length, '개 챌린지 설정');
          // HOT 챌린지는 활성 상태(active)만 필터링 (정렬 변경 시 전체 데이터 표시 위해 slice 제거)
          const activeChallenges = newChallenges.filter((challenge: Challenge) => {
            return challenge.status === 'active';
          });
          setBestChallenges(activeChallenges);
          if (__DEV__) console.log('✅ setBestChallenges 완료:', activeChallenges.length, '개 HOT 챌린지 설정');
        } else {
          setChallenges(prev => [...prev, ...newChallenges]);
        }
        setHasMoreData(pagination ? pagination.page < pagination.totalPages : newChallenges.length >= requestParams.limit);
        setCurrentPage(page);
        if (__DEV__) {
          console.log('📊 챌린지 데이터 로드 완료:', {
            challenges: newChallenges.length,
            page,
            hasMore: newChallenges.length === 10
          });
        }
      }
    } catch (error) {
      if (__DEV__) console.error('❌ 챌린지 로드 실패:', error);
      showAlert.show('오류', '챌린지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [searchFilter, activeTab, allStatusFilter]);

  // 나의 챌린지 로드 (내가 생성한 + 참여중인 챌린지)
  const loadMyChallenges = useCallback(async (isRefresh = false) => {
    try {
      if (__DEV__) console.log('🔵 loadMyChallenges 시작');

      // 비로그인 사용자는 early return
      if (!isAuthenticated || !user) {
        if (__DEV__) console.log('⚠️ 비로그인 사용자 - loadMyChallenges 건너뜀');
        setLoading(false);
        setRefreshing(false);
        setChallenges([]);
        return;
      }

      if (!isRefresh) {
        setLoading(true);
      }

      // 내가 생성한 챌린지와 참여한 챌린지를 동시에 가져오기
      if (__DEV__) console.log('🔵 API 호출 시작: getMyChallenges, getMyParticipations');
      const [myCreatedResponse, myParticipationsResponse] = await Promise.all([
        challengeService.getMyChallenges({
          page: 1,
          limit: 50
        }),
        challengeService.getMyParticipations({
          page: 1,
          limit: 50
        })
      ]);

      if (__DEV__) {
        console.log('🔵 API 응답 수신:', {
          createdStatus: myCreatedResponse?.status,
          participationsStatus: myParticipationsResponse?.status
        });
      }

      // 데이터 파싱
      const myCreated = Array.isArray(myCreatedResponse?.data) ? myCreatedResponse.data : (myCreatedResponse?.data?.data || []);
      const myParticipations = Array.isArray(myParticipationsResponse?.data) ? myParticipationsResponse.data : (myParticipationsResponse?.data?.data || []);

      if (__DEV__) {
        console.log('🔵 데이터 파싱 완료:', {
          myCreatedLength: myCreated.length,
          myParticipationsLength: myParticipations.length
        });
      }

      // created_by_user 플래그 명시적으로 설정 및 기본값 설정
      const myCreatedWithFlag = myCreated.map((c: any) => ({
        ...c,
        created_by_user: true,
        is_participating: true,
        comment_count: c.comment_count || 0,
        like_count: c.like_count || 0,
        tags: Array.isArray(c.tags) ? c.tags : []
      }));

      const myParticipationsWithFlag = myParticipations.map((c: any) => ({
        ...c,
        created_by_user: false,
        is_participating: true,
        comment_count: c.comment_count || 0,
        like_count: c.like_count || 0,
        tags: Array.isArray(c.tags) ? c.tags : []
      }));

      if (__DEV__) console.log('📊 나의 챌린지 데이터 통합:', {
        생성한챌린지: myCreatedWithFlag.length,
        참여챌린지: myParticipationsWithFlag.length
      });
      if (myCreatedWithFlag.length > 0) {
        if (__DEV__) console.log('📊 첫 번째 생성 챌린지:', {
          challenge_id: myCreatedWithFlag[0].challenge_id,
          title: myCreatedWithFlag[0].title,
          created_by_user: myCreatedWithFlag[0].created_by_user
        });
      }

      // 두 배열을 합침 (중복 제거)
      const combinedChallenges = [...myCreatedWithFlag];
      myParticipationsWithFlag.forEach((participation: any) => {
        if (!combinedChallenges.find(c => c.challenge_id === participation.challenge_id)) {
          combinedChallenges.push(participation);
        }
      });

      if (__DEV__) console.log('📊 나의 챌린지 로드 완료:', {
        created: myCreatedWithFlag.length,
        participations: myParticipationsWithFlag.length,
        total: combinedChallenges.length
      });

      setChallenges(combinedChallenges);
      if (__DEV__) console.log('✅ setChallenges 완료 - my 탭:', combinedChallenges.length, '개');
      if (__DEV__) console.log('🔵 setChallenges 호출 완료');
    } catch (error) {
      console.error('❌ 나의 챌린지 로드 실패:', error);
      showAlert.show('오류', '나의 챌린지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (__DEV__) console.log('🔵 loadMyChallenges 종료');
    }
  }, [isAuthenticated, user]); // 비로그인 사용자 체크를 위한 의존성 추가

  // 검색 필터 변경 시 챌린지 로드 (검색 모드가 아닐 때만, "나의" 탭이 아닐 때만)
  // activeTab 의존성 제거 - 탭 전환은 별도 useEffect에서 캐싱 로직으로 처리
  useEffect(() => {
    // 필터 변경 시에는 캐시 리셋 후 즉시 로드 (라인 178-192에서 캐시 리셋됨)
    if (!isSearchMode && activeTab !== 'my') {
      if (__DEV__) console.log('🔄 필터 변경 감지 - 데이터 로드:', { activeTab, searchFilter, allStatusFilter });
      // 필터 변경은 사용자가 명시적으로 요청한 것이므로 로딩 표시 없이 즉시 로드
      loadChallenges(1, true, searchFilter);  // isRefresh=true로 로딩 스피너 방지
      tabLoadedRef.current[activeTab] = true;
      if (activeTab === 'all') tabLoadedRef.current.hot = true;
      else if (activeTab === 'hot') tabLoadedRef.current.all = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilter.query, searchFilter.category, searchFilter.sortBy, isSearchMode, allStatusFilter]);

  // 비로그인 사용자 activeTab 강제 변경
  useEffect(() => {
    if (!isAuthenticated && activeTab === 'my') {
      if (__DEV__) console.log('⚠️ 비로그인 상태에서 my 탭 감지 - all 탭으로 변경');
      setActiveTab('all');
    }
  }, [isAuthenticated, activeTab]);

  // activeTab 변경 시 데이터 로드 (캐싱 최적화)
  useEffect(() => {
    if (__DEV__) console.log('🔄 activeTab 변경 감지:', activeTab, '/ 로드 상태:', tabLoadedRef.current);

    // 이미 로드된 탭은 재로드하지 않음 (트래픽 절약)
    if (tabLoadedRef.current[activeTab]) {
      if (__DEV__) console.log('✅ 탭 데이터 캐시 사용 - API 호출 스킵:', activeTab);
      return;
    }

    if (activeTab === 'my') {
      // 비로그인 사용자는 my 탭 로드를 건너뜀
      if (!isAuthenticated || !user) {
        if (__DEV__) console.log('⚠️ 비로그인 사용자 - my 탭 로드 건너뜀');
        return;
      }
      if (__DEV__) console.log('🔄 나의 탭 선택 - 나의 챌린지 로드 시작 (첫 로드)');
      loadMyChallenges(true);
      tabLoadedRef.current.my = true;
    } else if (activeTab === 'all') {
      if (__DEV__) console.log('🔄 전체 탭 선택 - 챌린지 로드 시작 (첫 로드)');
      loadChallenges(1, true);
      tabLoadedRef.current.all = true;
      // HOT 탭은 All 탭 데이터를 필터링만 하므로 함께 로드 완료 처리
      tabLoadedRef.current.hot = true;
    } else if (activeTab === 'hot') {
      // HOT 탭은 All 탭 데이터 필터링만 사용 (별도 API 호출 없음)
      if (!tabLoadedRef.current.all) {
        if (__DEV__) console.log('🔄 HOT 탭 선택 - All 데이터 로드 (첫 로드)');
        loadChallenges(1, true);
        tabLoadedRef.current.all = true;
      }
      tabLoadedRef.current.hot = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated, user]);
  // 태그 추출 함수
  const extractTagsFromQuery = useCallback((query: string) => {
    const tagRegex = /#(\S+)/g;
    const tags: string[] = [];
    let match;
    while ((match = tagRegex.exec(query)) !== null) {
      tags.push(match[1]);
    }
    const searchQuery = query.replace(tagRegex, '').trim();
    return { searchQuery, tags };
  }, []);
  // 실시간 검색 (검색 모드일 때)
  useEffect(() => {
    if (isSearchMode && currentSearchQuery.trim().length >= 1) {
      const timeoutId = setTimeout(() => {
        // 태그와 일반 검색어 분리
        const { searchQuery, tags } = extractTagsFromQuery(currentSearchQuery.trim());
        const tempFilter = {
          ...searchFilter,
          query: searchQuery,
          tags: tags.length > 0 ? tags : undefined
        };
        loadChallenges(1, false, tempFilter);
      }, 300); // 300ms 디바운스
      return () => clearTimeout(timeoutId);
    } else if (isSearchMode && currentSearchQuery.trim().length === 0) {
      // 검색어가 없으면 전체 목록 표시
      loadChallenges(1, false, { ...searchFilter, query: '', tags: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearchQuery, isSearchMode, searchFilter, extractTagsFromQuery]);
  // 새로고침
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // 새로고침 시 현재 탭 캐시 리셋 (최신 데이터 로드)
    tabLoadedRef.current[activeTab] = false;
    if (__DEV__) console.log('🔄 새로고침 - 탭 캐시 리셋:', activeTab);

    if (activeTab === 'my' && isAuthenticated && user) {
      loadMyChallenges(true);
      tabLoadedRef.current.my = true;
    } else {
      loadChallenges(1, true);
      if (activeTab === 'all') {
        tabLoadedRef.current.all = true;
        tabLoadedRef.current.hot = true;
      } else if (activeTab === 'hot') {
        tabLoadedRef.current.hot = true;
        tabLoadedRef.current.all = true;
      }
    }
  }, [activeTab, loadChallenges, loadMyChallenges, isAuthenticated, user]);

  // 실시간 업데이트 트리거 함수
  const triggerUpdate = useCallback(() => {
    setLastUpdateTime(Date.now());
    // 실시간 업데이트 시 모든 탭 캐시 리셋 (최신 데이터 동기화)
    tabLoadedRef.current = { all: false, hot: false, my: false };
    if (__DEV__) console.log('🔄 실시간 업데이트 - 모든 탭 캐시 리셋');

    if (activeTab === 'my' && isAuthenticated && user) {
      loadMyChallenges(true);
      tabLoadedRef.current.my = true;
    } else {
      loadChallenges(1, true);
      if (activeTab === 'all') {
        tabLoadedRef.current.all = true;
        tabLoadedRef.current.hot = true;
      } else if (activeTab === 'hot') {
        tabLoadedRef.current.hot = true;
        tabLoadedRef.current.all = true;
      }
    }
  }, [activeTab, loadChallenges, loadMyChallenges, isAuthenticated, user]);
  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollY > 200; // 200px 이상 스크롤하면 버튼 표시
    if (shouldShow !== showScrollToTop) {
      setShowScrollToTop(shouldShow);
      // 부드러운 애니메이션 효과
      Animated.timing(scrollToTopOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showScrollToTop, scrollToTopOpacity]);
  // 스와이프 액션 생성
  // 더보기 옵션 처리 (BottomSheet 방식)
  const handleMoreOptions = useCallback((challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowBottomSheet(true);
  }, []);
  // 현재 사용자 ID 가져오기
  const getCurrentUserId = useCallback(() => {
    return user?.user_id || null;
  }, [user]);
  // BottomSheet 액션 생성
  const createBottomSheetActions = () => {
    if (!selectedChallenge) {
      return [];
    }
    const currentUserId = getCurrentUserId();
    const isCreator = currentUserId && (
      // 기존 creator.user_id 방식
      (selectedChallenge.creator?.user_id === currentUserId ||
       String(selectedChallenge.creator?.user_id) === String(currentUserId)) ||
      // 새로 추가할 creator_id 방식
      (selectedChallenge.creator_id === currentUserId ||
       String(selectedChallenge.creator_id) === String(currentUserId)) ||
      // created_by_user 플래그
      selectedChallenge.created_by_user === true
    );
    
    const actions = [];
    
    if (isCreator) {
      actions.push({
        id: 'edit',
        title: '수정하기',
        icon: 'pencil',
        
        onPress: () => {
          setEditingChallenge(selectedChallenge);
          setEditTitle(selectedChallenge?.title || '');
          setEditDescription(selectedChallenge?.description || '');
          setEditMaxParticipants(selectedChallenge?.max_participants?.toString() || '');
          setEditStartDate(selectedChallenge?.start_date?.split('T')[0] || '');
          setEditEndDate(selectedChallenge?.end_date?.split('T')[0] || '');
          setShowEditModal(true);
        }
      });
      actions.push({
        id: 'delete',
        title: '삭제하기',
        icon: 'delete',
        destructive: true,
        onPress: () => {
          // 삭제 함수가 나중에 정의되므로 setTimeout으로 래핑
          setTimeout(() => handleDeleteChallenge(selectedChallenge.challenge_id), 0);
        }
      });
    }
    // 공유하기는 항상 표시
    actions.push({
      id: 'share',
      title: '공유하기',
      icon: 'share-variant',
      
      onPress: () => {
        setShowBottomSheet(false);
        setTimeout(() => setShowShareModal(true), 300);
      }
    });

    // 신고하기는 본인 글이 아니고 아직 신고하지 않았을 때만 표시
    if (!isCreator && !selectedChallenge.is_reported) {
      actions.push({
        id: 'report',
        title: '신고하기',
        icon: 'flag',
        
        onPress: () => {
          setShowBottomSheet(false);
          setTimeout(() => {
            showAlert.show(
              '신고 사유 선택',
              '신고 사유를 선택해주세요',
              [
                { text: '스팸/도배', onPress: () => handleReportChallenge(selectedChallenge.challenge_id, 'spam') },
                { text: '부적절한 내용', onPress: () => handleReportChallenge(selectedChallenge.challenge_id, 'inappropriate') },
                { text: '괴롭힘/욕설', onPress: () => handleReportChallenge(selectedChallenge.challenge_id, 'harassment') },
                { text: '기타', onPress: () => handleReportChallenge(selectedChallenge.challenge_id, 'other') },
                { text: '취소', style: 'cancel' }
              ]
            );
          }, 300);
        }
      });
    }

    return actions;
  };
  // 수정 완료 처리
  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) {
      showAlert.show('오류', '제목을 입력해주세요.');
      return;
    }
    if (editTitle.trim().length < 3) {
      showAlert.show('오류', '제목은 3글자 이상이어야 합니다.');
      return;
    }
    if (editTitle.trim().length > 50) {
      showAlert.show('오류', '제목은 50글자 이하여야 합니다.');
      return;
    }
    if (editDescription.trim().length > 500) {
      showAlert.show('오류', '설명은 500글자 이하여야 합니다.');
      return;
    }
    // 최대 참여자 수 검증
    if (editMaxParticipants.trim()) {
      const parsedMax = parseInt(editMaxParticipants.trim(), 10);
      if (isNaN(parsedMax) || parsedMax < 2 || parsedMax > 1000) {
        showAlert.show('오류', '최대 참여자 수는 2명 이상 1000명 이하여야 합니다.');
        return;
      }
    }
    // 날짜 유효성 검사
    if (!editStartDate.trim() || !editEndDate.trim()) {
      showAlert.show('오류', '시작일과 종료일을 모두 입력해주세요.');
      return;
    }
    const startDate = new Date(editStartDate);
    const endDate = new Date(editEndDate);
    if (startDate >= endDate) {
      showAlert.show('오류', '시작일은 종료일보다 빨라야 합니다.');
      return;
    }
    try {
      setIsUpdating(true);
      if (__DEV__) console.log('📝 챌린지 업데이트 시작:', editingChallenge?.challenge_id);
      const updateData = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        max_participants: editMaxParticipants.trim() ? parseInt(editMaxParticipants.trim(), 10) : undefined,
        start_date: editStartDate.trim(),
        end_date: editEndDate.trim()
      };
      await challengeService.updateChallenge(editingChallenge!.challenge_id, updateData);
      // 로컬 상태 업데이트
      setChallenges(prevChallenges =>
        prevChallenges.map(challenge =>
          challenge.challenge_id === editingChallenge!.challenge_id
            ? { ...challenge, ...updateData }
            : challenge
        )
      );
      setBestChallenges(prevBest =>
        prevBest.map(challenge =>
          challenge.challenge_id === editingChallenge!.challenge_id
            ? { ...challenge, ...updateData, ranking: challenge.ranking, score: challenge.score }
            : challenge
        )
      );
      setShowEditModal(false);
      setEditingChallenge(null);
      showAlert.show('성공', '챌린지 정보가 수정되었습니다.');
      if (__DEV__) console.log('✅ 챌린지 업데이트 완료');
    } catch (error) {
      console.error('❌ 챌린지 수정 실패:', error);
      showAlert.show('오류', '챌린지 수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  }, [editTitle, editDescription, editMaxParticipants, editStartDate, editEndDate, editingChallenge]);
  // 편집 모달 닫기
  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingChallenge(null);
    setEditTitle('');
    setEditDescription('');
    setEditMaxParticipants('');
    setEditStartDate('');
    setEditEndDate('');
  }, []);
  // 챌린지 필터링 함수 - 백엔드의 status 필드를 신뢰
  const filterChallengesByStatus = useCallback((challengeList: Challenge[], status: 'active' | 'completed') => {
    return challengeList.filter(c => {
      if (status === 'completed') {
        return c.status === 'completed';
      } else {
        return c.status === 'active' || c.status === 'upcoming';
      }
    });
  }, []);
  // 개발용: 캐시 강제 초기화 및 새로고침
  const resetAllCache = useCallback(() => {
    showAlert.show(
      '캐시 초기화',
      '모든 캐시를 삭제하고 새로고침하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            if (__DEV__) console.log('🧹 모든 캐시 강제 초기화 시작');
            // 1. 챌린지 서비스 캐시 초기화
            challengeService.clearCache();
            // 2. 로컬 상태 초기화
            setChallenges([]);
            setBestChallenges([]);
            setCurrentPage(1);
            setHasMoreData(true);
            // 3. 강제 새로고침
            setTimeout(() => {
              loadChallenges(1, true);
            }, 100);
            if (__DEV__) console.log('✅ 캐시 초기화 완료');
            showAlert.show('완료', '캐시가 초기화되었습니다.');
          }
        }
      ]
    );
  }, [loadChallenges]);
  // 더 많은 데이터 로드
  const loadMore = useCallback(() => {
    if (hasMoreData && !loadingMore) {
      loadChallenges(currentPage + 1);
    }
  }, [hasMoreData, loadingMore, currentPage, loadChallenges]);
  // 메인 화면 필터 변경
  const handleFilterChange = useCallback((key: keyof SearchFilter, value: any) => {
    setSearchFilter(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);
  // 검색 모드 진입
  const enterSearchMode = useCallback(() => {
    setIsSearchMode(true);
    setCurrentSearchQuery(searchFilter.query || ''); // 현재 검색어 유지, undefined 방지
  }, [searchFilter.query]);
  // 검색 모드 종료
  const exitSearchMode = useCallback(() => {
    setIsSearchMode(false);
    setCurrentSearchQuery('');
  }, []);
  // 검색어 변경 처리
  const handleSearchQueryChange = useCallback((query: string) => {
    setCurrentSearchQuery(query);
  }, []);
  // 검색 기록에 추가
  const addToSearchHistory = useCallback((query: string) => {
    if (query.trim().length > 0) {
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item !== query);
        return [query, ...filtered].slice(0, 10); // 최대 10개 기록
      });
    }
  }, []);
  // 검색 실행 및 기록 추가
const executeSearch = useCallback((query: string) => {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 0) {
    addToSearchHistory(trimmedQuery);
    // 태그와 일반 검색어 분리
    const { searchQuery, tags } = extractTagsFromQuery(trimmedQuery);
    setSearchFilter(prev => ({
      ...prev,
      query: searchQuery,
      tags: tags.length > 0 ? tags : undefined
    }));
    setCurrentPage(1);
    setIsSearchMode(false);
  }
}, [addToSearchHistory, extractTagsFromQuery]);
  // 검색 초기화
  const clearSearch = useCallback(() => {
    setSearchFilter(prev => ({ ...prev, query: '' }));
    setCurrentSearchQuery('');
    setCurrentPage(1);
  }, []);
  // 네비게이션 핸들러
  const handleChallengePress = useCallback((challenge: Challenge) => {
    navigation.navigate('ChallengeDetail' as never, { challengeId: challenge.challenge_id } as never);
  }, [navigation]);
  const handleCreateChallenge = useCallback(() => {
    // 비로그인 사용자 체크 (이중 방어)
    if (!isAuthenticated) {
      setGuestPromptConfig({
        title: '로그인이 필요해요',
        message: '챌린지를 만들려면 로그인이 필요합니다'
      });
      setShowGuestPrompt(true);
      return;
    }

    navigation.navigate('CreateChallenge' as never, {
      onChallengeCreated: () => {
        // 챌린지 생성 후 콜백
        triggerUpdate();
      }
    } as never);
  }, [navigation, triggerUpdate, isAuthenticated]);
  const handleViewMyChallenges = useCallback(() => {
    navigation.navigate('MyChallenges' as never);
  }, [navigation]);
  const handleViewAllChallenges = useCallback(() => {
    // HOT 챌린지 전용 화면으로 이동
    navigation.navigate('HotChallenges' as never);
  }, [navigation]);
  // 챌린지 삭제 핸들러
  const handleDeleteChallenge = useCallback(async (challengeId: number) => {
    // 이미 삭제 진행 중인 경우 중복 요청 방지
    if (deletingChallengeId !== null) {
      if (__DEV__) console.log('⚠️ 이미 삭제 진행 중, 중복 요청 방지:', { current: deletingChallengeId, requested: challengeId });
      return;
    }
    try {
      showAlert.show(
        '챌린지 삭제',
        '정말로 이 챌린지를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 모든 참여자의 감정 기록도 함께 삭제됩니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                if (__DEV__) console.log('🗑️ 삭제 시작:', challengeId);
                setDeletingChallengeId(challengeId);
                await challengeService.deleteChallenge(challengeId);
                if (__DEV__) console.log('✅ 삭제 API 호출 성공:', challengeId);
                // 챌린지 삭제 후 캐시 무효화
                challengeService.clearCache();
                if (__DEV__) console.log('✅ 챌린지 삭제 완료 - 캐시 무효화됨');
                // 로컬 상태에서 즉시 제거 (Alert 이전에 실행)
                setChallenges(prev =>
                  prev.filter(challenge => challenge.challenge_id !== challengeId)
                );
                setBestChallenges(prev =>
                  prev.filter(challenge => challenge.challenge_id !== challengeId)
                );
                // 즉시 업데이트 트리거
                triggerUpdate();
                showAlert.show(
                  '삭제 완료',
                  '챌린지가 성공적으로 삭제되었습니다.',
                  [
                    {
                      text: '확인',
                      style: 'default'
                    }
                  ]
                );
              } catch (error: any) {
                console.error('❌ 챌린지 삭제 실패:', error);
                showAlert.show('오류', '챌린지 삭제에 실패했습니다.');
              } finally {
                setDeletingChallengeId(null);
                if (__DEV__) console.log('🏁 삭제 프로세스 완료, 로딩 상태 해제');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('챌린지 삭제 오류:', error);
      setDeletingChallengeId(null);
    }
  }, [loadChallenges, deletingChallengeId]);
  // 챌린지 참여/나가기 핸들러
  const handleJoinChallenge = useCallback(async (challengeId: number) => {
    // 비로그인 사용자 체크
    if (!isAuthenticated) {
      setGuestPromptConfig({
        title: '로그인이 필요해요',
        message: '챌린지에 참여하려면 로그인이 필요합니다'
      });
      setShowGuestPrompt(true);
      return;
    }

    try {
      setLoadingMore(true);
      // 현재 참여 상태 확인
      const currentChallenge = challenges.find(c => c.challenge_id === challengeId) ||
                              bestChallenges.find(c => c.challenge_id === challengeId);
      if (__DEV__) {
        console.log('🔍 현재 챌린지 참여 상태 확인:', {
          challengeId,
          isParticipating: currentChallenge?.is_participating
        });
      }
      if (!currentChallenge) {
        showAlert.show('오류', '챌린지 정보를 찾을 수 없습니다.');
        return;
      }
      if (currentChallenge.is_participating) {
        // 이미 참여중인 경우 - 관리 화면으로 이동 또는 나가기 옵션
        showAlert.show(
          '참여 중인 챌린지',
          '이미 참여 중인 챌린지입니다.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '상세 보기',
              onPress: () => navigation.navigate('ChallengeDetail' as never, { challengeId } as never)
            },
            {
              text: '나가기',
              style: 'destructive',
              onPress: async () => {
                try {
                  const response = await challengeService.leaveChallenge(challengeId);
                  if (response?.status === 200 || response?.status === 204) {
                    // 로컬 상태 업데이트
                    setChallenges(prev => prev.map(challenge =>
                      challenge.challenge_id === challengeId
                        ? { ...challenge, is_participating: false, participant_count: Math.max(0, challenge.participant_count - 1) }
                        : challenge
                    ));
                    setBestChallenges(prev => prev.map(challenge =>
                      challenge.challenge_id === challengeId
                        ? { ...challenge, is_participating: false, participant_count: Math.max(0, challenge.participant_count - 1) }
                        : challenge
                    ));
                    showAlert.show('성공', '챌린지에서 나갔습니다.');
                  }
                } catch (leaveError: any) {
                  console.error('❌ 챌린지 나가기 실패:', leaveError);
                  showAlert.show('오류', leaveError.response?.data?.message || '챌린지 나가기에 실패했습니다.');
                }
              }
            }
          ]
        );
      } else {
        // 참여하지 않은 경우 - 참여하기
        const response = await challengeService.participateInChallenge(challengeId);
        if (__DEV__) {
          console.log('✅ 챌린지 참여 응답:', {
            status: response?.status,
            challengeId
          });
        }
        if (response?.data || response?.status === 200 || response?.status === 201) {
          // 로컬 상태 업데이트
          setChallenges(prev => prev.map(challenge =>
            challenge.challenge_id === challengeId
              ? { ...challenge, is_participating: true, participant_count: challenge.participant_count + 1 }
              : challenge
          ));
          setBestChallenges(prev => prev.map(challenge =>
            challenge.challenge_id === challengeId
              ? { ...challenge, is_participating: true, participant_count: challenge.participant_count + 1 }
              : challenge
          ));
          showAlert.show('성공', '챌린지에 참여했습니다!');
          // 즉시 업데이트 트리거
          triggerUpdate();
        }
      }
    } catch (error: any) {
      console.error('❌ 챌린지 참여/나가기 실패:', error);
      if (error.response?.status === 409 || error.response?.data?.message?.includes('이미 참여')) {
        // 이미 참여 중인 경우
        showAlert.show(
          '이미 참여 중',
          '이 챌린지에 이미 참여하고 있습니다.',
          [
            { text: '확인', style: 'default' },
            {
              text: '상세 보기',
              onPress: () => navigation.navigate('ChallengeDetail' as never, { challengeId } as never)
            }
          ]
        );
        // 로컬 상태를 참여 중으로 업데이트
        setChallenges(prev => prev.map(challenge =>
          challenge.challenge_id === challengeId
            ? { ...challenge, is_participating: true }
            : challenge
        ));
        setBestChallenges(prev => prev.map(challenge =>
          challenge.challenge_id === challengeId
            ? { ...challenge, is_participating: true }
            : challenge
        ));
      } else {
        showAlert.show('오류', error.response?.data?.message || '요청 처리에 실패했습니다.');
      }
    } finally {
      setLoadingMore(false);
    }
  }, [challenges, bestChallenges, navigation, loadChallenges]);
  // 상태 색상 가져오기
  const getStatusColor = (status: Challenge['status']) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'upcoming': return COLORS.warning;
      case 'completed': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };
  // 챌린지 상태 자동 갱신 - 화면 포커스 시
  useEffect(() => {
    if (isFocused) {
      // 화면이 포커스될 때마다 데이터 새로고침
      triggerUpdate();
    }
  }, [isFocused, triggerUpdate]);

  // 주기적 상태 확인 (5분마다) - 배터리/트래픽 최적화
  useEffect(() => {
    const interval = setInterval(() => {
      if (isFocused) {
        loadChallenges(1, true);
      }
    }, 300000); // 5분마다 새로고침 (트래픽 최적화)

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  // 백 핸들러
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isSearchMode) {
          exitSearchMode();
          return true;
        }
        return false;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [isSearchMode, exitSearchMode])
  );
  // 페이지 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      const shouldRefresh = route?.params?.refresh;
      if (shouldRefresh) {
        if (__DEV__) console.log('🔄 새로고침 파라미터 감지됨 - 강제 새로고침');
        loadChallenges(1, true); // 강제 새로고침
        // 파라미터 초기화
        // navigation.setParams({ refresh: undefined }); // setParams는 React Navigation v6에서 지원되지 않음
      } else {
        loadChallenges(1); // 일반 로드
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route?.params?.refresh]) // navigation 제거
  );
  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.bg.primary }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={isDark ? '#1a1a2e' : COLORS.gradientStart}
          translucent={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accentText} />
          <Text style={[styles.loadingText, { color: theme.text.primary }]}>
            챌린지 불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  // 검색 모드 렌더링
  if (isSearchMode) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.bg.primary }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.bg.primary}
          translucent={false}
        />
        {/* 검색 헤더 */}
        <View style={[styles.searchHeader, { borderBottomColor: theme.bg.border, shadowColor: isDark ? '#000000' : '#000000' }]}>
          <TouchableOpacity onPress={exitSearchMode} style={styles.backButton}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.text.primary}
            />
          </TouchableOpacity>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.bg.card, shadowColor: isDark ? '#000000' : theme.colors.primary }]}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.text.secondary}
            />
            <TextInput
              style={[styles.searchTextInput, { color: theme.text.primary }]}
              placeholder="챌린지 제목, 태그로 검색... (예: #감정기록)"
              placeholderTextColor={theme.text.secondary}
              value={currentSearchQuery}
              onChangeText={handleSearchQueryChange}
              onSubmitEditing={() => executeSearch(currentSearchQuery)}
              autoFocus
              returnKeyType="search"
            />
            {currentSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setCurrentSearchQuery('')} style={styles.clearButton}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={theme.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* 검색 내용 */}
        <ScrollView style={styles.searchContent}>
          {/* 검색 기록 */}
          {currentSearchQuery.length === 0 && searchHistory.length > 0 && (
            <View style={styles.searchModeSection}>
              <Text style={[styles.searchSectionTitle, { color: theme.text.primary }]}>
                최근 검색
              </Text>
              {searchHistory.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchHistoryItem}
                  onPress={() => {
                    setCurrentSearchQuery(item);
                    executeSearch(item);
                  }}
                >
                  <MaterialCommunityIcons
                    name="history"
                    size={16}
                    color={theme.text.secondary}
                  />
                  <Text style={[styles.searchHistoryText, { color: theme.text.primary }]}>
                    {item}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSearchHistory(prev => prev.filter((_, i) => i !== index))}
                    style={styles.removeHistoryButton}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={14}
                      color={theme.text.secondary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* 인기 검색어 */}
          {currentSearchQuery.length === 0 && (
            <View style={styles.searchModeSection}>
              <Text style={[styles.searchSectionTitle, { color: theme.text.primary }]}>
                인기 검색어
              </Text>
              {['감정 관리', '30일 챌린지', '마음챙김', '습관 형성', '긍정 사고'].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.popularSearchItem}
                  onPress={() => {
                    setCurrentSearchQuery(item);
                    executeSearch(item);
                  }}
                >
                  <Text style={[styles.popularSearchRank, { color: theme.colors.accentText }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.popularSearchText, { color: theme.text.primary }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* 검색 결과 */}
          {currentSearchQuery.length > 0 && (
            <View style={styles.searchModeSection}>
              <Text style={[styles.searchSectionTitle, { color: theme.text.primary }]}>
                검색 결과 ({challenges.length}개)
              </Text>
              {challenges.map((challenge, _index) => (
                <TouchableOpacity
                  key={challenge.challenge_id}
                  style={[styles.searchResultItem, { borderBottomColor: theme.bg.border }]}
                  onPress={() => handleChallengePress(challenge)}
                >
                  <View style={styles.searchResultContent}>
                    <Text style={[styles.searchResultTitle, { color: theme.text.primary }]}>
                      {challenge.title}
                    </Text>
                    <Text style={[styles.searchResultDescription, { color: theme.text.secondary }]} numberOfLines={3}>
                      {challenge.description}
                    </Text>
                    <View style={styles.searchResultMeta}>
                      <Text style={[styles.searchResultParticipants, { color: theme.colors.accentText }]}>
                        {challenge.participant_count}명 참여
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(challenge.status) }]}>
                        <Text style={styles.statusBadgeText}>
                          {challenge.status === 'active' ? '진행중' : challenge.status === 'upcoming' ? '시작 전' : '완료'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {currentSearchQuery.length > 0 && challenges.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={48}
                    color={theme.text.secondary}
                  />
                  <Text style={[styles.noResultsText, { color: theme.text.secondary }]}>
                    '{currentSearchQuery}' 검색 결과가 없습니다
                  </Text>
                  <Text style={[styles.noResultsSubtext, { color: theme.text.secondary }]}>
                    다른 키워드로 검색해보세요
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg.primary}
        translucent={false}
      />
      {/* 상단 은은한 색 번짐 (헤더 뒤 배경) */}
      <LinearGradient
        pointerEvents="none"
        colors={[theme.colors.primary + '26', theme.colors.primary + '00']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180 }}
      />
      {/* 위로와 공감 페이지와 동일한 단일 색상 헤더 */}
      <View
        style={[
          styles.headerGradient,
          {
            backgroundColor: 'transparent',
            borderBottomWidth: isDark ? 0 : 0.5,
            borderBottomColor: isDark ? 'transparent' : theme.bg.border,
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleRow}>
                <MaterialCommunityIcons
                  name="trophy-variant-outline"
                  size={22}
                  color={theme.text.primary}
                  style={styles.headerIcon}
                />
                <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
                  감정 챌린지
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>
                감정과 행복을 나누는 챌린지
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => navigation.navigate('ProfileMain' as never)}
              >
                {HeaderProfileImage}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      {/* 탭 네비게이션 */}
      {(() => {
        const shouldShowMyTab = !!isAuthenticated && !!user;
        if (__DEV__) console.log('🔍 ChallengeTabs showMyTab:', { isAuthenticated, hasUser: !!user, shouldShowMyTab });
        return (
          <ChallengeTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            showMyTab={shouldShowMyTab}
          />
        );
      })()}
      {/* 검색 상태 표시 */}
      {searchFilter.query && (
        <SearchStatus
          query={searchFilter.query}
          resultCount={challenges.length}
          onClear={clearSearch}
        />
      )}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: handleScroll
          }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 검색 및 필터 섹션 - my 탭에서는 숨김 */}
        <View style={{ display: activeTab !== 'my' ? 'flex' : 'none' }}>
          <ChallengeFilters
            searchQuery={searchFilter.query}
            sortBy={searchFilter.sortBy}
            onSearchPress={enterSearchMode}
            onFilterChange={handleFilterChange}
          />
        </View>

        {/* HOT 탭 - 항상 렌더링하되 숨김 처리로 깜빡임 방지 */}
        <View style={{ display: activeTab === 'hot' ? 'flex' : 'none' }}>
          <HotSection
            onMoreOptions={handleMoreOptions}
            bestChallenges={bestChallenges}
            hotDisplayCount={hotDisplayCount}
            fireAnimation={fireAnimation}
            onChallengePress={handleChallengePress}
            onViewAll={handleViewAllChallenges}
            onLoadMore={() => setHotDisplayCount(prev => prev + 10)}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* All 탭 - 항상 렌더링하되 숨김 처리로 깜빡임 방지 */}
        <View style={{ display: activeTab === 'all' ? 'flex' : 'none' }}>
          <AllSection
            challenges={challenges}
            allStatusFilter={allStatusFilter}
            sortBy={searchFilter.sortBy}
            onChallengePress={handleChallengePress}
            onMoreOptions={handleMoreOptions}
            onViewMyChallenges={handleViewMyChallenges}
            onFilterChange={setAllStatusFilter}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            hasMoreData={hasMoreData}
            filterChallengesByStatus={filterChallengesByStatus}
            isDarkMode={isDarkMode}
            isAuthenticated={isAuthenticated}
          />
        </View>

        {/* My 탭 - 항상 렌더링하되 숨김 처리로 깜빡임 방지 */}
        <View style={{ display: activeTab === 'my' ? 'flex' : 'none' }}>
          <MySection
            challenges={challenges}
            myStatusFilter={myStatusFilter}
            onChallengePress={handleChallengePress}
            onFilterChange={setMyStatusFilter}
            onCreateChallenge={() => navigation.navigate('CreateChallenge' as never)}
            onViewAll={() => setActiveTab('all')}
          />
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
      {/* 플로팅 액션 버튼들 */}
      <View style={styles.floatingButtonContainer}>
        {/* 상단으로 이동 버튼 - 애니메이션과 함께 표시 */}
        <Animated.View
          style={[
            {
              opacity: scrollToTopOpacity,
              transform: [
                {
                  scale: scrollToTopOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
            showScrollToTop ? {} : { pointerEvents: 'none' }, // 숨겨진 상태에서는 터치 비활성화
          ]}
        >
          <TouchableOpacity
            style={[
              styles.scrollToTopButton,
              {
                backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderWidth: 0.5,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                shadowColor: isDark ? '#000000' : '#000000',
                shadowOpacity: isDark ? 0.1 : 0.15,
              },
            ]}
            onPress={() => {
              // ScrollView ref가 있다면 상단으로 스크롤
              if (scrollViewRef?.current) {
                (scrollViewRef.current as any).scrollTo({ y: 0, animated: true });
                // 버튼을 눌렀을 때 작은 펄스 애니메이션
                Animated.sequence([
                  Animated.timing(scrollToTopOpacity, {
                    toValue: 0.7,
                    duration: 100,
                    useNativeDriver: true,
                  }),
                  Animated.timing(scrollToTopOpacity, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                  }),
                ]).start();
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="chevron-up"
              size={22}
              color={theme.text.primary}
            />
          </TouchableOpacity>
        </Animated.View>
        {/* 챌린지 생성 버튼 - 로그인 사용자만 표시 */}
        {isAuthenticated && (
          <TouchableOpacity
            style={[styles.floatingButton, { shadowColor: isDark ? '#000000' : theme.colors.primary }]}
            onPress={handleCreateChallenge}
            activeOpacity={0.8}
            accessibilityLabel="새 챌린지 만들기"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary]}
              style={styles.floatingButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="plus" size={24} color={theme.colors.onAccent} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
      {/* 챌린지 수정 모달 */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseEditModal}
      >
        <View style={[
          styles.editModalContent,
          { backgroundColor: theme.bg.primary }
        ]}>
          {/* 헤더 */}
          <View style={[styles.modalHeader, {
            borderBottomColor: theme.bg.border,
            backgroundColor: theme.bg.card,
            shadowColor: isDark ? '#000000' : '#000000',
          }]}>
            <TouchableOpacity
              onPress={handleCloseEditModal}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={26}
                color={theme.text.primary}
              />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <View style={styles.modalTitleWrapper}>
                <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                  챌린지 수정
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.text.secondary }]}>
                  챌린지 정보를 수정해보세요
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSaveEdit}
              disabled={isUpdating || !editTitle.trim() || !editDescription.trim()}
              style={[styles.modernSaveButton, {
                backgroundColor: (isUpdating || !editTitle.trim() || !editDescription.trim())
                  ? theme.text.tertiary
                  : COLORS.primary,
                opacity: (isUpdating || !editTitle.trim() || !editDescription.trim()) ? 0.6 : 1
              }]}
            >
              {isUpdating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.alwaysWhite || "#FFFFFF"} />
                  <Text style={[styles.loadingText, { color: theme.colors.alwaysWhite || "#FFFFFF" }]}>저장 중...</Text>
                </View>
              ) : (
                <View style={styles.saveButtonContent}>
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={theme.colors.alwaysWhite || "#FFFFFF"}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.modernSaveButtonText}>
                    저장하기
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* 제목 입력 */}
            <View style={styles.modernFieldContainer}>
              <View style={styles.modernFieldHeader}>
                <View style={styles.labelWithIcon}>
                  <MaterialCommunityIcons
                    name="format-title"
                    size={20}
                    color={theme.colors.accentText}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.modernFieldLabel, { color: theme.text.primary }]}>
                    제목
                  </Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>필수</Text>
                  </View>
                </View>
                <Text style={[styles.modernCharCount, {
                  color: editTitle.length > 40 ? COLORS.warning : theme.text.secondary
                }]}>
                  {editTitle.length}/50
                </Text>
              </View>
              <View style={[
                styles.modernInputWrapper,
                {
                  backgroundColor: theme.bg.card,
                  borderColor: editTitle.trim() ? COLORS.primary : theme.bg.border,
                  borderWidth: editTitle.trim() ? 2 : 1,
                  shadowColor: editTitle.trim() ? COLORS.primary : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: editTitle.trim() ? 0.1 : 0,
                  shadowRadius: 8,
                  elevation: editTitle.trim() ? 3 : 1,
                }
              ]}>
                <TextInput
                  style={[
                    styles.modernInput,
                    { color: theme.text.primary }
                  ]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="오늘 챌린지 테스트입니다"
                  placeholderTextColor={theme.text.tertiary}
                  maxLength={50}
                  selectionColor={COLORS.primary}
                />
              </View>
            </View>
            {/* 설명 입력 */}
            <View style={styles.modernFieldContainer}>
              <View style={styles.modernFieldHeader}>
                <View style={styles.labelWithIcon}>
                  <MaterialCommunityIcons
                    name="text-long"
                    size={20}
                    color={theme.colors.accentText}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.modernFieldLabel, { color: theme.text.primary }]}>
                    설명
                  </Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>필수</Text>
                  </View>
                </View>
                <Text style={[styles.modernCharCount, {
                  color: editDescription.length > 450 ? COLORS.warning : theme.text.secondary
                }]}>
                  {editDescription.length}/500
                </Text>
              </View>
              <View style={[
                styles.modernTextAreaWrapper,
                {
                  backgroundColor: theme.bg.card,
                  borderColor: editDescription.trim() ? COLORS.primary : theme.bg.border,
                  borderWidth: editDescription.trim() ? 2 : 1,
                  shadowColor: editDescription.trim() ? COLORS.primary : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: editDescription.trim() ? 0.1 : 0,
                  shadowRadius: 8,
                  elevation: editDescription.trim() ? 3 : 1,
                }
              ]}>
                <TextInput
                  style={[
                    styles.modernTextArea,
                    { color: theme.text.primary }
                  ]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="안녕하세요 챌린지 테스트에요"
                  placeholderTextColor={theme.text.tertiary}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  selectionColor={COLORS.primary}
                />
              </View>
            </View>
            {/* 챌린지 기간 입력 */}
            <View style={styles.modernFieldContainer}>
              <View style={styles.modernFieldHeader}>
                <View style={styles.labelWithIcon}>
                  <MaterialCommunityIcons
                    name="calendar-range"
                    size={20}
                    color={theme.colors.accentText}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.modernFieldLabel, { color: theme.text.primary }]}>
                    챌린지 기간
                  </Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>필수</Text>
                  </View>
                </View>
              </View>
              <View style={styles.modernDateContainer}>
                {/* 시작일 */}
                <View style={styles.modernDateField}>
                  <Text style={[styles.modernDateLabel, { color: theme.text.secondary }]}>
                    시작일
                  </Text>
                  <View style={[
                    styles.modernDateInputWrapper,
                    {
                      backgroundColor: theme.bg.card,
                      borderColor: editStartDate.trim() ? COLORS.primary : theme.bg.border,
                      borderWidth: editStartDate.trim() ? 2 : 1,
                      shadowColor: editStartDate.trim() ? COLORS.primary : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: editStartDate.trim() ? 0.1 : 0,
                      shadowRadius: 8,
                      elevation: editStartDate.trim() ? 3 : 1,
                    }
                  ]}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={20}
                      color={theme.colors.accentText}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      style={[
                        styles.modernDateInput,
                        { color: theme.text.primary }
                      ]}
                      value={editStartDate}
                      onChangeText={setEditStartDate}
                      placeholder="2025-09-19"
                      placeholderTextColor={theme.text.tertiary}
                      selectionColor={COLORS.primary}
                    />
                  </View>
                </View>
                {/* 구분선 */}
                <View style={styles.modernDateSeparator}>
                  <View style={[styles.modernArrowContainer, {
                    backgroundColor: theme.bg.secondary
                  }]}>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={24}
                      color={theme.colors.accentText}
                    />
                  </View>
                </View>
                {/* 종료일 */}
                <View style={styles.modernDateField}>
                  <Text style={[styles.modernDateLabel, { color: theme.text.secondary }]}>
                    종료일
                  </Text>
                  <View style={[
                    styles.modernDateInputWrapper,
                    {
                      backgroundColor: theme.bg.card,
                      borderColor: editEndDate.trim() ? COLORS.primary : theme.bg.border,
                      borderWidth: editEndDate.trim() ? 2 : 1,
                      shadowColor: editEndDate.trim() ? COLORS.primary : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: editEndDate.trim() ? 0.1 : 0,
                      shadowRadius: 8,
                      elevation: editEndDate.trim() ? 3 : 1,
                    }
                  ]}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={20}
                      color={theme.colors.accentText}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      style={[
                        styles.modernDateInput,
                        { color: theme.text.primary }
                      ]}
                      value={editEndDate}
                      onChangeText={setEditEndDate}
                      placeholder="2025-09-26"
                      placeholderTextColor={theme.text.tertiary}
                      selectionColor={COLORS.primary}
                    />
                  </View>
                </View>
              </View>
            </View>
            {/* 최대 참여자 수 입력 */}
            <View style={[styles.modernFieldContainer, { marginBottom: 30 }]}>
              <View style={styles.modernFieldHeader}>
                <View style={styles.labelWithIcon}>
                  <MaterialCommunityIcons
                    name="account-multiple"
                    size={20}
                    color={theme.colors.accentText}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.modernFieldLabel, { color: theme.text.primary }]}>
                    최대 참여자 수
                  </Text>
                  <View style={[styles.optionalBadge, { backgroundColor: theme.bg.border }]}>
                    <Text style={[styles.optionalBadgeText, { color: theme.text.secondary }]}>선택</Text>
                  </View>
                </View>
              </View>
              <View style={[
                styles.modernInputWrapper,
                {
                  backgroundColor: theme.bg.card,
                  borderColor: editMaxParticipants.trim() ? COLORS.primary : theme.bg.border,
                  borderWidth: editMaxParticipants.trim() ? 2 : 1,
                  shadowColor: editMaxParticipants.trim() ? COLORS.primary : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: editMaxParticipants.trim() ? 0.1 : 0,
                  shadowRadius: 8,
                  elevation: editMaxParticipants.trim() ? 3 : 1,
                }
              ]}>
                <MaterialCommunityIcons
                  name="account-multiple"
                  size={20}
                  color={theme.colors.accentText}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  style={[
                    styles.modernInput,
                    { color: theme.text.primary }
                  ]}
                  value={editMaxParticipants}
                  onChangeText={setEditMaxParticipants}
                  placeholder="예: 50"
                  placeholderTextColor={theme.text.tertiary}
                  keyboardType="numeric"
                  selectionColor={COLORS.primary}
                />
              </View>
              <View style={styles.modernHelperContainer}>
                <MaterialCommunityIcons
                  name="information"
                  size={16}
                  color={theme.text.secondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.modernHelperText, { color: theme.text.secondary }]}>
                  비워두면 무제한으로 참여할 수 있습니다
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* BottomSheet */}
      <BottomSheet
        visible={showBottomSheet}
        onClose={() => {
          setShowBottomSheet(false);
          setSelectedChallenge(null);
        }}
        actions={createBottomSheetActions()}
      />
      {/* ShareModal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        challenge={selectedChallenge}
      />
      {/* 비로그인 사용자 가입 유도 바텀시트 */}
      <GuestPromptBottomSheet
        visible={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
        onLogin={() => {
          setShowGuestPrompt(false);
          navigation.navigate('Auth' as never, { screen: 'Login' } as never);
        }}
        onRegister={() => {
          setShowGuestPrompt(false);
          navigation.navigate('Auth' as never, { screen: 'Register' } as never);
        }}
        title={guestPromptConfig.title}
        message={guestPromptConfig.message}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
    lineHeight: 20,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
    paddingBottom: 16,
  },
  headerContent: {
    width: '95%',
    alignSelf: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 3,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
    letterSpacing: -0.2,
  },
  headerRight: {
    marginLeft: 20,
    marginRight: 10,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  // 베스트 섹션 스타일
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 13,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 21,
    marginTop: 0 ,
  },
  sectionCount: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
    marginRight: 5,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  // 스토리 카드 스타일
  storyScrollContainer: {
    paddingRight: 20,
    overflow: 'hidden',
  },
  storyCard: {
    width: 132, // 테두리를 감안하여 약간 크게
    height: 192, // 테두리를 감안하여 약간 크게
    marginRight: 10, // 마진 조정
    marginTop: -1, // 상단 테두리 숨기기
    marginLeft: -1, // 좌측 테두리 숨기기
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
    // @ts-ignore - React Native Web compatibility
    outline: 'none',
    overflow: 'hidden',
  },
  storyCardTouchable: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  // 2025 트렌드: 미니멀 모던 카드
  modernCardTouchable: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
    // @ts-ignore - React Native Web compatibility
    outline: 'none',
  },
  modernCardContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    justifyContent: 'space-between',
    // 2025 트렌드: 테두리 완전 제거
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
    // @ts-ignore - React Native Web compatibility
    outline: 'none',
    // 매우 서브틀한 그림자로 깊이감 표현
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    height: 44,
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  // 나의 챌린지 섹션 스타일
  myChallengesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  myChallengesScrollContainer: {
    paddingHorizontal: 4,
  },
  myChallengeMiniCard: {
    width: 160,
    marginRight: 10,
  },
  myChallengeMiniCardContent: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 0.5,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  myChallengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ddayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ddayBadgeText: {
    color: 'white',
    fontSize: FONT_SIZES.small,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 16,
  },
  myChallengeMiniTitle: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 8,
    letterSpacing: -0.2,
    minHeight: 36,
  },
  miniProgressContainer: {
    marginBottom: 12,
  },
  miniProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginBottom: 4,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  miniProgressText: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 16,
    letterSpacing: -0.1,
  },
  myChallengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myChallengeMiniParticipants: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginLeft: 3,
    lineHeight: 16,
  },
  creatorBadge: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  // 챌린지 섹션 스타일
  myChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
  },
  myChallengeText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
    marginLeft: 3,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  // 목표지향적 진행률 스타일
  // D-day 스타일
  // 소셜 인터랙션 스타일
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    marginRight: 8,
    marginTop: 4,
  },
  // 로딩 더보기 스타일
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 6,
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loadMoreText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  // 검색 모드 스타일
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
    borderBottomWidth: 0.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    elevation: 2,
  },
  searchTextInput: {
flex: 1,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    marginLeft: 8,
    paddingVertical: 4,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  clearButton: {
    padding: 4,
  },
  searchContent: {
    flex: 1,
  },
  searchModeSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 12,
    marginTop: 0,
  },
  searchSectionTitle: {
fontSize: FONT_SIZES.body,
    fontWeight: '700',
    marginBottom: 14,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  searchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginVertical: 3,
    borderRadius: 10,
  },
  searchHistoryText: {
flex: 1,
    marginLeft: 12,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  removeHistoryButton: {
    padding: 4,
  },
  popularSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginVertical: 3,
    borderRadius: 10,
  },
  popularSearchRank: {
width: 26,
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  popularSearchText: {
marginLeft: 12,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  searchResultItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
fontSize: FONT_SIZES.body,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  searchResultDescription: {
fontSize: FONT_SIZES.caption,
    lineHeight: 18,
    fontWeight: '400',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultParticipants: {
fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
color: 'white',
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 4,
    lineHeight: 20,
  },
  noResultsSubtext: {
fontSize: FONT_SIZES.caption,
    lineHeight: 18,
  },
  // 플로팅 액션 버튼 스타일
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'flex-end',
  },
  scrollToTopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  floatingButton: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
  // 2열 레이아웃 스타일
  challengeRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  twoColumnCard: {
    position: 'relative',
    width: '47%',
    marginVertical: 4,
  },
  // 태그 스타일
  // moreOptionsButton 제거 - 카드 내부로 이동
  // moreOptionsButton: {
  //   position: 'absolute',
  //   top: 12,
  //   right: 12,
  //   width: 32,
  //   height: 32,
  //   borderRadius: 16,
  //   backgroundColor: 'rgba(0, 0, 0, 0.1)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   zIndex: 10,
  // },
  // 편집 모달 스타일
  editModalContent: {
    flex: 1,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
   modalTitle: {
fontSize: FONT_SIZES.h3,
    fontWeight: '700',
    letterSpacing: -0.2,
    // 2025 트렌드: 글로우 효과
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
   saveHeaderButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,         // 20 → 25
    paddingHorizontal: 24,    // 20 → 24
    paddingVertical: 8,      // 8 → 10
    // 그라데이션 배경을 위한 오버플로우
    overflow: 'hidden',
    // 네오모피즘 그림자
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  saveHeaderButtonText: {
fontSize: FONT_SIZES.bodySmall,
    fontWeight: '700',
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  editFieldContainer: {
    marginBottom: 28,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  editFieldLabel: {
fontSize: FONT_SIZES.h4,
    fontWeight: '700',
    letterSpacing: 0,
  },
  uniformTextAreaStyle: {
minHeight: 140,           // 120 → 140
    fontSize: FONT_SIZES.h4,             // 새로 추가
    fontWeight: '500',        // 새로 추가
    lineHeight: 24,           // 새로 추가
    letterSpacing: 0,      // 새로 추가
  },
  uniformCharCount: {
fontSize: FONT_SIZES.caption,
    textAlign: 'right',
    marginTop: 8,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0,
  },
  uniformHelperText: {
fontSize: FONT_SIZES.caption,
    marginTop: 6,
    fontStyle: 'italic',
  },
  // 새로운 모던 스타일들
  modalTitleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalTitleWrapper: {
    alignItems: 'center',
  },
  modalSubtitle: {
fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0,
  },
  modernSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernSaveButtonText: {
    fontSize: FONT_SIZES.h4,
    fontWeight: '700',
    letterSpacing: 0,
  },
  modernFieldContainer: {
    marginBottom: 24,
  },
  modernFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernFieldLabel: {
fontSize: FONT_SIZES.h3,
    fontWeight: '700',
    marginRight: 10,
    letterSpacing: 0,
  },
  requiredBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 4,
  },
  requiredBadgeText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  optionalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 4,
  },
  optionalBadgeText: {
color: '#666666',
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modernCharCount: {
fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 20,
  },
  modernInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 52,
  },
  modernInput: {
flex: 1,
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '500',
    lineHeight: 20,
  },
  modernTextAreaWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 120,
  },
  modernTextArea: {
fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '500',
    lineHeight: 22,
    minHeight: 88,
  },
  modernDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernDateField: {
    flex: 1,
  },
  modernDateLabel: {
fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0,
  },
  modernDateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
  },
  modernDateInput: {
flex: 1,
    fontSize: FONT_SIZES.body,
    fontWeight: '500',
    textAlign: 'center',
  },
  modernDateSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
  },
  modernArrowContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: `${COLORS.primary}30`,
  },
  modernHelperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  modernHelperText: {
fontSize: FONT_SIZES.body,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: 0,
  },
  // 미니 소셜 인터랙션 스타일 (나의 챌린지용)
  miniSocialInteractionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  miniSocialInteractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  miniSocialInteractionText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
    marginLeft: 2,
    letterSpacing: 0,
    lineHeight: 18,
  },
  hotSocialInteractionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotSocialInteractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hotSocialInteractionText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '700',
    marginLeft: 2,
    letterSpacing: 0,
    lineHeight: 18,
  },
  // HOT 챌린지 Masonry 컨테이너
  hotScrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  hotScrollItem: {
    marginBottom: 12,
  },
  // 기존 그리드 스타일 (호환성 유지)
  // 더 보기 버튼
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  loadMoreText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
    
    marginRight: 4,
    letterSpacing: 0,
  },
  // 이미지 관련 스타일
  hotCardImageContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 0,
  },
  hotCardImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
  },
  hotCardGradient: {
    width: '100%',
    minHeight: 140,
    paddingVertical: 5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // HOT 챌린지 태그 스타일
  hotTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  hotTagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    marginRight: 4,
    marginBottom: 4,
  },
  hotTagText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
    
    letterSpacing: 0,
    lineHeight: 16,
  },
  hotMoreTags: {
    fontSize: FONT_SIZES.tiny,
    fontWeight: '500',
    marginLeft: 2,
    lineHeight: 16,
  },
  // HOT 챌린지 소셜 인터랙션 스타일
  hotSocialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  hotSocialItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotSocialText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
  },
  hotSocialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotCardContent: {
    padding: 12,
    paddingTop: 10,
  },
  hotCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  // 상태 탭 스타일
  statusTabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 3,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusTabActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  statusTabText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0,
  },
  statusTabTextActive: {
    color: '#111827',
  },
  // 나의 챌린지 상태 필터 스타일
});
export default ChallengeScreenFixed;
