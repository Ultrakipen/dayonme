import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import challengeService from '../services/api/challengeService';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/designSystem';
import { formatDate, formatDateShort, getDday } from '../utils/dateUtils';

// 반응형 크기 계산 (CLAUDE.md 기준: BASE_WIDTH = 360)
// S25: 1080x2340(FHD+), S25+/Ultra: 1440x3120(QHD+) 대응
const BASE_WIDTH = 360;
const getWindowDimensions = () => {
  try {
    const dims = Dimensions.get('window');
    if (dims.width > 0) return dims;
  } catch (e) {}
  return { width: BASE_WIDTH, height: 780 };
};
const normalize = (size: number) => {
  const { width } = getWindowDimensions();
  // QHD+ 해상도까지 대응 (최대 1.5배)
  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.5);
  return Math.round(size * scale);
};

// 반응형 폰트 크기 (2026 트렌드 최적화, S25/S25+/Ultra 대응, 가독성 개선)
// React Native 0.80 호환: 기본값 사용, 컴포넌트 내에서 동적 계산
const fonts = {
  xxl: 28, xl: 24, lg: 20, md: 17, sm: 15, xs: 14, xxs: 14,
};

// 반응형 아이콘 크기
const icons = {
  xl: 28, lg: 24, md: 20, sm: 18, xs: 16,
};

// 반응형 간격 (2026 트렌드 - 넉넉한 여백)
const spacing = {
  xxl: 32, xl: 24, lg: 20, md: 16, sm: 12, xs: 10, xxs: 6,
};


interface Challenge {
  challenge_id: number;
  title: string;
  description: string;
  category?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  status: 'active' | 'upcoming' | 'completed';
  participant_count: number;
  is_participating: boolean;
  progress?: number;
  tags?: string[];
  creator_name?: string;
  image_url?: string;
  comment_count?: number;
  like_count?: number;
  is_trending?: boolean;
  is_new?: boolean;
  hot_score?: number;
}

const HotChallengesScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();
  const { isAuthenticated, user } = useAuth();

  // 반응형 최적화: 화면 크기 메모이제이션
  const windowDimensions = useMemo(() => getWindowDimensions(), []);
  const cardWidth = useMemo(() =>
    windowDimensions.width > 600 ? '80%' : '95%'
  , [windowDimensions.width]);

  // 상태 관리
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'deadline'>('popular');

  // 커스텀 Alert 상태
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success' as 'success' | 'error' | 'warning' | 'confirm',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: '확인',
    cancelText: '취소',
  });

  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // 커스텀 Alert 헬퍼
  const showAlert = useCallback((config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertVisible(false);
  }, []);

  // 초기 애니메이션 (Spring Physics)
  useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 9,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 디데이 계산 함수
  const getDDayInfo = (challenge: Challenge) => {
    const today = new Date();

    if (challenge.status === 'active') {
      const endDate = new Date(challenge.end_date);
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 ? `D-${daysLeft}` : '오늘 마감';
    } else if (challenge.status === 'upcoming') {
      const startDate = new Date(challenge.start_date);
      const daysToStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysToStart > 0 ? `${daysToStart}일 후 시작` : '곧 시작';
    }
    return '종료됨';
  };


  // 이번 주 시작일과 종료일 계산
  const getThisWeekRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 이번 주 월요일 계산
    const currentDay = today.getDay(); // 0 (일요일) ~ 6 (토요일)
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const thisWeekMonday = new Date(today);
    thisWeekMonday.setDate(today.getDate() - daysFromMonday);

    // 이번 주 일요일 계산
    const thisWeekSunday = new Date(thisWeekMonday);
    thisWeekSunday.setDate(thisWeekMonday.getDate() + 6);

    return {
      start: thisWeekMonday,
      end: thisWeekSunday
    };
  };

  // HOT 챌린지 데이터 로드 (캐싱 전략 적용)
  const loadHotChallenges = useCallback(async (page = 1, isRefresh = false) => {
    try {
      const cacheKey = user?.id ? `hot_challenges_cache_${user.id}` : 'hot_challenges_cache_guest';
      if (page === 1 && !isRefresh) {
        setLoading(true);
        // 캐시된 데이터 먼저 로드 (Stale-While-Revalidate)
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 3 * 60 * 1000) { // 3분 이내 (실시간성 개선)
            setChallenges(data);
            setLoading(false);
          }
        }
      }
      if (page > 1) {
        setLoadingMore(true);
      }

      const response = await challengeService.getChallenges({
        page,
        limit: 10,
        sortBy: 'popular',
      });

      if (response?.data) {
        const responseData = response.data;
        const newChallenges = Array.isArray(responseData) ? responseData : (responseData.data || []);

        if (page === 1) {
          setChallenges(newChallenges);
          // 첫 페이지만 캐싱
          await AsyncStorage.setItem(cacheKey, JSON.stringify({
            data: newChallenges,
            timestamp: Date.now()
          }));
        } else {
          setChallenges(prev => [...prev, ...newChallenges]);
        }

        setHasMoreData(newChallenges.length === 10);
        setCurrentPage(page);
      }
    } catch (error: any) {
      if (__DEV__) console.error('챌린지 로드 에러:', error.message);
      showAlert({
        type: 'error',
        title: '오류',
        message: '네트워크 연결을 확인해주세요.',
        onConfirm: hideAlert,
        onCancel: () => {},
        confirmText: '확인',
        cancelText: '',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user]);

  // 초기 데이터 로드
  useEffect(() => {
    loadHotChallenges(1, false);
  }, []);

  // 필터링 로직 (태그 검색 포함)
  useEffect(() => {
    let result = [...challenges];

    // 검색 (제목/설명/태그)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        (c.tags && c.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // 정렬
    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'deadline') {
      result.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
    }

    setFilteredChallenges(result);
  }, [challenges, searchQuery, sortBy]);

  // 새로고침
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHotChallenges(1, true);
  }, [loadHotChallenges]);

  // 더 많은 데이터 로드
  const loadMore = useCallback(() => {
    if (hasMoreData && !loadingMore) {
      loadHotChallenges(currentPage + 1);
    }
  }, [hasMoreData, loadingMore, currentPage, loadHotChallenges]);

  // 네비게이션 핸들러
  const handleChallengePress = useCallback((challenge: Challenge) => {
    navigation.navigate('ChallengeDetail' as never, { challengeId: challenge.challenge_id } as never);
  }, [navigation]);

  // 챌린지 참여/나가기 핸들러 (비로그인 사용자 제한)
  const handleJoinChallenge = useCallback(async (challengeId: number) => {
    // 비로그인 사용자 차단
    if (!isAuthenticated) {
      showAlert({
        type: 'warning',
        title: '로그인 필요',
        message: '챌린지 참여는 로그인 후 이용 가능합니다.',
        onConfirm: () => {
          hideAlert();
          navigation.navigate('Login' as never);
        },
        onCancel: hideAlert,
        confirmText: '로그인',
        cancelText: '취소',
      });
      return;
    }

    try {
      setLoadingMore(true);

      const currentChallenge = challenges.find(c => c.challenge_id === challengeId);

      if (!currentChallenge) {
        showAlert({
          type: 'error',
          title: '오류',
          message: '챌린지를 찾을 수 없습니다.',
          onConfirm: hideAlert,
          onCancel: () => {},
          confirmText: '확인',
          cancelText: '',
        });
        return;
      }

      if (currentChallenge.is_participating) {
        showAlert({
          type: 'confirm',
          title: '챌린지 나가기',
          message: '정말로 이 챌린지에서 나가시겠습니까?',
          onConfirm: async () => {
            hideAlert();
            try {
              const response = await challengeService.leaveChallenge(challengeId);

              if (response?.status === 200 || response?.status === 204) {
                setChallenges(prev => prev.map(challenge =>
                  challenge.challenge_id === challengeId
                    ? { ...challenge, is_participating: false, participant_count: Math.max(0, challenge.participant_count - 1) }
                    : challenge
                ));

                ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
                showAlert({
                  type: 'success',
                  title: '성공',
                  message: '챌린지에서 나갔습니다.',
                  onConfirm: hideAlert,
                  onCancel: () => {},
                  confirmText: '확인',
                  cancelText: '',
                });
              }
            } catch (leaveError: any) {
              if (__DEV__) console.error('챌린지 나가기 에러:', leaveError.message);
              showAlert({
                type: 'error',
                title: '오류',
                message: '나가기에 실패했습니다. 다시 시도해주세요.',
                onConfirm: hideAlert,
                onCancel: () => {},
                confirmText: '확인',
                cancelText: '',
              });
            }
          },
          onCancel: hideAlert,
          confirmText: '나가기',
          cancelText: '취소',
        });
      } else {
        const response = await challengeService.participateInChallenge(challengeId);

        if (response?.data || response?.status === 200 || response?.status === 201) {
          setChallenges(prev => prev.map(challenge =>
            challenge.challenge_id === challengeId
              ? { ...challenge, is_participating: true, participant_count: challenge.participant_count + 1 }
              : challenge
          ));

          ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
          showAlert({
            type: 'success',
            title: '성공',
            message: '챌린지에 참여했습니다!',
            onConfirm: hideAlert,
            onCancel: () => {},
            confirmText: '확인',
            cancelText: '',
          });
        }
      }
    } catch (error: any) {
      if (__DEV__) console.error('챌린지 참여 에러:', error.message);
      showAlert({
        type: 'error',
        title: '오류',
        message: '요청 처리에 실패했습니다. 다시 시도해주세요.',
        onConfirm: hideAlert,
        onCancel: () => {},
        confirmText: '확인',
        cancelText: '',
      });
    } finally {
      setLoadingMore(false);
    }
  }, [challenges, isAuthenticated, navigation, showAlert, hideAlert]);

  // 상태 색상 가져오기
  const getStatusColor = (status: Challenge['status']) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'upcoming': return COLORS.warning;
      case 'completed': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  // 상태별 배경색 가져오기 (개선된)
  const getStatusBackgroundColor = (status: Challenge['status'], isDark: boolean) => {
    switch (status) {
      case 'active':
        return isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)';
      case 'upcoming':
        return isDark ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255, 149, 0, 0.1)';
      case 'completed':
        return isDark ? 'rgba(142, 142, 147, 0.15)' : 'rgba(142, 142, 147, 0.1)';
      default:
        return isDark ? 'rgba(142, 142, 147, 0.15)' : 'rgba(142, 142, 147, 0.1)';
    }
  };

  // 상태별 보더색 가져오기 (개선된)
  const getStatusBorderColor = (status: Challenge['status'], isDark: boolean) => {
    switch (status) {
      case 'active':
        return isDark ? 'rgba(52, 199, 89, 0.3)' : 'rgba(52, 199, 89, 0.25)';
      case 'upcoming':
        return isDark ? 'rgba(255, 149, 0, 0.3)' : 'rgba(255, 149, 0, 0.25)';
      case 'completed':
        return isDark ? 'rgba(142, 142, 147, 0.3)' : 'rgba(142, 142, 147, 0.25)';
      default:
        return isDark ? 'rgba(142, 142, 147, 0.3)' : 'rgba(142, 142, 147, 0.25)';
    }
  };

  // 상태별 텍스트 색상 가져오기 (개선된)
  const getStatusTextColor = (status: Challenge['status']) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'upcoming': return COLORS.warning;
      case 'completed': return isDark ? 'rgba(142, 142, 147, 0.8)' : COLORS.textSecondary;
      default: return isDark ? 'rgba(142, 142, 147, 0.8)' : COLORS.textSecondary;
    }
  };

  // Skeleton 로딩 컴포넌트
  const SkeletonCard = React.memo(() => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop(); // 메모리 누수 방지
    }, []);

    const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

    return (
      <View style={[styles.hotChallengeCard, { backgroundColor: theme.card }]}>
        <View style={styles.hotChallengeCardContent}>
          <Animated.View style={[styles.skeletonBox, { width: '40%', height: 24, opacity }]} />
          <Animated.View style={[styles.skeletonBox, { width: '80%', height: 20, marginTop: 12, opacity }]} />
          <Animated.View style={[styles.skeletonBox, { width: '60%', height: 16, marginTop: 8, opacity }]} />
        </View>
      </View>
    );
  });

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

  const HotChallengeCard = React.memo(({ challenge, index }: { challenge: Challenge; index: number }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
      Animated.spring(scaleValue, {
        toValue: 0.97,
        friction: 8,
        tension: 180,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 7,
        tension: 150,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.hotChallengeCard,
          {
            width: cardWidth,
            maxWidth: 500,
            transform: [{ scale: scaleValue }],
            backgroundColor: theme.card,
            borderWidth: isDark ? 1 : 0,
            borderColor: theme.border,
            ...(isDark ? {} : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            }),
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => handleChallengePress(challenge)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessibilityLabel={`${challenge.title} 챌린지`}
          accessibilityHint="탭하여 상세 정보 보기"
          accessibilityRole="button"
          style={styles.hotChallengeCardContent}
        >
          {/* 헤더 - 통합된 HOT 순위 배지와 상태/태그 */}
          <View style={styles.hotChallengeCardHeader}>
            {/* 통합 HOT 순위 배지 - 좌측 (개선된) */}
            <View style={styles.badgeRow}>
              <View style={[
                styles.unifiedHotBadge,
                !isDark && {
                  shadowColor: '#FF6B6B',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 3,
                }
              ]}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.unifiedBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="fire" size={icons.sm} color="white" />
                  <Text style={styles.unifiedBadgeRank}>#{index + 1}</Text>
                </LinearGradient>
              </View>

              {/* 급상승 뱃지 */}
              {challenge.is_trending && (
                <View style={styles.trendingBadge}>
                  <MaterialCommunityIcons name="trending-up" size={icons.xs} color="#FF6B6B" />
                  <Text style={styles.trendingText}>급상승</Text>
                </View>
              )}

              {/* 신규 뱃지 */}
              {challenge.is_new && !challenge.is_trending && (
                <View style={styles.newBadge}>
                  <Text style={styles.newText}>NEW</Text>
                </View>
              )}
            </View>

            {/* 상태와 태그 영역 - 우측 (개선된) */}
            <View style={styles.statusTagRow}>
              <View style={[
                styles.statusIndicator,
                {
                  backgroundColor: getStatusBackgroundColor(challenge.status, isDark),
                  borderColor: getStatusBorderColor(challenge.status, isDark),
                }
              ]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(challenge.status) }]} />
                <Text style={[
                  styles.statusText,
                  { color: getStatusTextColor(challenge.status) }
                ]}>
                  {challenge.status === 'active' ? '진행중' :
                   challenge.status === 'upcoming' ? '예정' : '종료'}
                </Text>
              </View>

              {/* 태그를 진행중과 같은 라인에 배치 (개선된) */}
              {challenge.tags && challenge.tags.length > 0 && (
                <View style={styles.inlineTagContainer}>
                  {challenge.tags.slice(0, 2).map((tag, tagIndex) => (
                    <View key={tagIndex} style={[
                      styles.inlineTag,
                      {
                        backgroundColor: isDark ? 'rgba(108, 92, 231, 0.15)' : 'rgba(108, 92, 231, 0.1)',
                        borderColor: isDark ? 'rgba(108, 92, 231, 0.3)' : 'rgba(108, 92, 231, 0.25)'
                      }
                    ]}>
                      <Text style={[
                        styles.inlineTagText,
                        { color: isDark ? '#6C5CE7' : theme.primary }
                      ]}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* 제목 */}
          <Text style={[styles.hotChallengeTitle, { color: theme.text.primary }]} numberOfLines={2}>
            {challenge.title}
          </Text>

          {/* 설명 */}
          <Text style={[styles.hotChallengeDescription, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : theme.subText }]} numberOfLines={2}>
            {challenge.description}
          </Text>

          {/* 메타 정보: 2개만 표시 (컴팩트) */}
          <View style={[styles.challengeMetaInfo, {
            backgroundColor: isDark
              ? 'rgba(28, 28, 30, 0.6)'
              : 'rgba(255, 255, 255, 0.7)',
            borderColor: theme.border,
          }]}>
            {/* 디데이 */}
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name={challenge.status === 'active' ? 'clock-outline' : challenge.status === 'upcoming' ? 'calendar-clock' : 'check-circle'}
                size={icons.sm}
                color={challenge.status === 'active' ? '#FF6B6B' : challenge.status === 'upcoming' ? '#FF9500' : (isDark ? 'rgba(255, 255, 255, 0.6)' : '#999999')}
              />
              <Text style={[styles.metaText, {
                color: challenge.status === 'active' ? '#FF6B6B' : challenge.status === 'upcoming' ? '#FF9500' : (isDark ? 'rgba(255, 255, 255, 0.6)' : '#999999'),
              }]}>
                {getDDayInfo(challenge)}
              </Text>
            </View>

            {/* 좋아요 수 */}
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="heart" size={icons.sm}
                color={isDark ? '#FF6B9D' : '#E91E63'} />
              <Text style={[styles.metaText, {
                color: isDark ? '#FF6B9D' : '#E91E63',
              }]}>
                {challenge.like_count || 0}
              </Text>
            </View>
          </View>
          <View style={styles.hotChallengeCardFooter}>
            <View style={[styles.participantInfo, {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(142, 142, 147, 0.1)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(142, 142, 147, 0.2)',
            }]}>
              <MaterialCommunityIcons
                name="account-group"
                size={icons.sm}
                color={theme.text.primary}
              />
              <Text style={[styles.participantText, { color: theme.text.primary }]}>
                {challenge.participant_count}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.joinButton,
                challenge.is_participating && styles.leaveButton,
                !isAuthenticated && styles.disabledButton,
                !isDark && {
                  shadowColor: '#007AFF',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 5,
                  elevation: 3,
                }
              ]}
              onPress={() => handleJoinChallenge(challenge.challenge_id)}
              disabled={loadingMore || !isAuthenticated}
              accessibilityLabel={!isAuthenticated ? '로그인 필요' : (challenge.is_participating ? '챌린지 나가기' : '챌린지 참여하기')}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={!isAuthenticated
                  ? ['#999999', '#777777']
                  : challenge.is_participating
                  ? [COLORS.danger, '#E17055']
                  : [COLORS.primary, COLORS.secondary]
                }
                style={styles.joinButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {!isAuthenticated ? (
                  <>
                    <MaterialCommunityIcons name="lock" size={icons.sm} color="white" />
                    <Text style={[styles.joinButtonText, { marginLeft: 2 }]}>
                      로그인
                    </Text>
                  </>
                ) : challenge.is_participating ? (
                  <>
                    <MaterialCommunityIcons name="exit-to-app" size={icons.sm} color="white" />
                    <Text style={[styles.joinButtonText, { marginLeft: 2 }]}>
                      나가기
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="plus" size={icons.sm} color="white" />
                    <Text style={[styles.joinButtonText, { marginLeft: 2 }]}>
                      참여
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  });


  if (loading && challenges.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />
        <FlatList
          data={[1, 2, 3, 4]}
          renderItem={() => <SkeletonCard />}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* 헤더 */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={isDark ? [
            'rgba(255, 107, 107, 0.15)',
            'rgba(255, 142, 83, 0.08)',
            'transparent'
          ] : [
            'rgba(255, 107, 107, 0.1)',
            'rgba(255, 142, 83, 0.05)',
            'transparent'
          ]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="뒤로가기"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={icons.lg}
                color={theme.text.primary}
              />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <View style={styles.headerTitleRow}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.fireIcon}
                >
                  <MaterialCommunityIcons name="fire" size={icons.md} color="white" />
                </LinearGradient>
                <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
                  HOT 챌린지
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : theme.subText }]}>
                가장 인기 있는 감정 챌린지들
              </Text>
            </View>
          </View>

          {/* 검색바 (제목/설명/태그 검색) */}
          <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
            <MaterialCommunityIcons name="magnify" size={icons.md} color={theme.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text.primary }]}
              placeholder="제목, 설명, 태그 검색..."
              placeholderTextColor={theme.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={icons.md} color={theme.text.secondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* 정렬 옵션 */}
          <View style={styles.sortRow}>
            <Text style={[styles.sortLabel, { color: theme.text.secondary }]}>정렬:</Text>
            {[
              { key: 'popular', label: '인기순', icon: 'fire' },
              { key: 'recent', label: '최신순', icon: 'clock-outline' },
              { key: 'deadline', label: '마감임박', icon: 'calendar-alert' },
            ].map(({ key, label, icon }) => (
              <TouchableOpacity
                key={key}
                style={[styles.sortButton, sortBy === key && { backgroundColor: isDark ? 'rgba(108,92,231,0.2)' : 'rgba(0,122,255,0.1)' }]}
                onPress={() => setSortBy(key as any)}
              >
                <MaterialCommunityIcons name={icon as any} size={icons.sm} color={sortBy === key ? (isDark ? '#6C5CE7' : theme.primary) : theme.text.secondary} />
                <Text style={[styles.sortButtonText, { color: sortBy === key ? (isDark ? '#6C5CE7' : theme.primary) : theme.text.secondary }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      <FlatList
        data={filteredChallenges}
        renderItem={({ item, index }) => (
          <HotChallengeCard challenge={item} index={index} />
        )}
        keyExtractor={(item) => item.challenge_id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            tintColor={'#FF6B6B'}
          />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContainer}
        // 성능 최적화
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        ListFooterComponent={() => (
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingMoreText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : theme.subText }]}>
                더 많은 HOT 챌린지 로드 중...
              </Text>
            </View>
          ) : null
        )}
      />

      {/* 커스텀 Alert Modal */}
      <Modal
        visible={alertVisible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.alertOverlay}>
          <Animated.View style={[
            styles.alertContainer,
            { backgroundColor: isDark ? 'rgba(28, 28, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)' }
          ]}>
            {/* 아이콘 */}
            <View style={[
              styles.alertIconContainer,
              {
                backgroundColor: alertConfig.type === 'success' ? 'rgba(52, 199, 89, 0.15)' :
                  alertConfig.type === 'error' ? 'rgba(255, 59, 48, 0.15)' :
                  alertConfig.type === 'warning' ? 'rgba(255, 149, 0, 0.15)' :
                  'rgba(0, 122, 255, 0.15)'
              }
            ]}>
              <MaterialCommunityIcons
                name={
                  alertConfig.type === 'success' ? 'check-circle' :
                  alertConfig.type === 'error' ? 'alert-circle' :
                  alertConfig.type === 'warning' ? 'alert' :
                  'help-circle'
                }
                size={icons.xl}
                color={
                  alertConfig.type === 'success' ? COLORS.success :
                  alertConfig.type === 'error' ? COLORS.danger :
                  alertConfig.type === 'warning' ? COLORS.warning :
                  COLORS.primary
                }
              />
            </View>

            {/* 제목 */}
            <Text style={[styles.alertTitle, { color: theme.text.primary }]}>
              {alertConfig.title}
            </Text>

            {/* 메시지 */}
            <Text style={[styles.alertMessage, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : theme.subText }]}>
              {alertConfig.message}
            </Text>

            {/* 버튼 영역 */}
            <View style={styles.alertButtons}>
              {alertConfig.cancelText && (
                <TouchableOpacity
                  style={[styles.alertButton, styles.alertCancelButton, {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  }]}
                  onPress={alertConfig.onCancel}
                >
                  <Text style={[styles.alertButtonText, { color: theme.text.primary }]}>
                    {alertConfig.cancelText}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.alertButton,
                  styles.alertConfirmButton,
                  !alertConfig.cancelText && styles.alertSingleButton
                ]}
                onPress={alertConfig.onConfirm}
              >
                <LinearGradient
                  colors={
                    alertConfig.type === 'success' ? [COLORS.success, '#2ECC71'] :
                    alertConfig.type === 'error' || alertConfig.confirmText === '나가기' ? [COLORS.danger, '#E17055'] :
                    alertConfig.type === 'warning' ? [COLORS.warning, '#FFA726'] :
                    [COLORS.primary, COLORS.secondary]
                  }
                  style={styles.alertButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.alertConfirmText}>{alertConfig.confirmText}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
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
    marginTop: spacing.sm,
    fontSize: fonts.sm,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: fonts.sm * 1.4,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },

  // 헤더 스타일
  header: {
    paddingTop: 0,
  },
  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.sm : spacing.xxl + spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  fireIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xxs,
  },
  headerTitle: {
    fontSize: fonts.md,
    fontWeight: '700',
    lineHeight: fonts.md * 1.3,
    letterSpacing: -0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },
  headerSubtitle: {
    fontSize: fonts.xxs,
    fontWeight: '600',
    opacity: 0.8,
    letterSpacing: -0.2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },

  // 리스트 스타일
  listContainer: {
    paddingBottom: 120,
  },

  // 검색/필터 스타일 (컴팩트)
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.xxs,
    fontSize: fonts.xs,
    paddingVertical: 0,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sortLabel: {
    fontSize: fonts.xxs,
    fontWeight: '600',
    marginRight: spacing.xxs,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: spacing.xxs,
  },
  sortButtonText: {
    fontSize: fonts.xxs,
    fontWeight: '600',
    marginLeft: 2,
  },

  // Skeleton 스타일
  skeletonBox: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },

  // HOT 챌린지 카드 스타일 - 2026 트렌드
  hotChallengeCard: {
    alignSelf: 'center',
    marginBottom: spacing.xs,
    borderRadius: 16,
    overflow: 'hidden',
  },
  hotChallengeCardContent: {
    padding: spacing.sm,
  },

  // 통합 HOT 순위 배지 스타일 - 컴팩트
  unifiedHotBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  unifiedBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    minWidth: 50,
    justifyContent: 'center',
  },
  unifiedBadgeRank: {
    color: 'white',
    fontSize: fonts.xxs,
    fontWeight: '700',
    marginLeft: 2,
    letterSpacing: -0.1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },

  // 헤더 영역 - 통합 배지와 상태/태그 라인 (컴팩트)
  hotChallengeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
    marginTop: 0,
    paddingHorizontal: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  trendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B6B',
    marginLeft: 2,
    letterSpacing: -0.1,
  },
  newBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  newText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34C759',
    letterSpacing: -0.1,
  },
  statusTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginLeft: spacing.md,
  },
  // 상태 인디케이터 (초소형)
  statusIndicator: {
    flexDirection: 'row',
    marginRight: spacing.xxs,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 2,
  },
  // 상태 텍스트
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },

  // 인라인 태그 컨테이너
  inlineTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // 인라인 태그 (초소형)
  inlineTag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: spacing.xxs,
    borderWidth: 1,
  },
  // 인라인 태그 텍스트
  inlineTagText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },

  // 제목과 설명 - 컴팩트
  hotChallengeTitle: {
    fontSize: fonts.md,
    fontWeight: '700',
    lineHeight: fonts.md * 1.4,
    marginBottom: spacing.xxs,
    letterSpacing: -0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },
  hotChallengeDescription: {
    fontSize: fonts.xs,
    fontWeight: '500',
    lineHeight: fonts.xs * 1.5,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },

  // 챌린지 메타 정보 스타일 - 컴팩트
  challengeMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
  },
  metaText: {
    fontSize: fonts.xxs,
    fontWeight: '600',
    marginLeft: 2,
    letterSpacing: -0.1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },

  // 하단 정보 - 컴팩트
  hotChallengeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  participantText: {
    fontSize: fonts.xxs,
    fontWeight: '600',
    lineHeight: fonts.xxs * 1.3,
    marginLeft: 2,
    letterSpacing: -0.1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaveButton: {
    opacity: 0.9,
  },
  disabledButton: {
    opacity: 0.6,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontSize: fonts.xs,
    fontWeight: '700',
    letterSpacing: -0.1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },

  // 로딩 더보기 스타일
  loadingMore: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: spacing.xxs,
    fontSize: fonts.xs,
    fontWeight: '600',
    letterSpacing: -0.1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },

  // 커스텀 Alert 스타일 (2026 트렌드 - Glassmorphism)
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    padding: spacing.xl,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  alertIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  alertTitle: {
    fontSize: fonts.xl,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },
  alertMessage: {
    fontSize: fonts.md,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: fonts.md * 1.5,
    letterSpacing: -0.2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },
  alertButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  alertButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  alertCancelButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  alertConfirmButton: {
    overflow: 'hidden',
  },
  alertSingleButton: {
    flex: 1,
  },
  alertButtonGradient: {
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: fonts.md,
    fontWeight: '700',
    letterSpacing: -0.2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },
  alertConfirmText: {
    fontSize: fonts.md,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },
});

export default HotChallengesScreen;