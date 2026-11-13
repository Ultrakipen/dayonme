import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ViewStyle,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import challengeService from '../services/api/challengeService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/designSystem';
import { getScale } from '../utils/responsive';

// 반응형 크기 계산 (FHD+ 1080x2340 기준 - DP 단위)
const BASE_WIDTH = 360;
const BASE_HEIGHT = 780;

const scaleFontSize = (size: number) => {
  const scale = getScale();
  return Math.max(Math.round(size * scale), 14); // 최소 14px 보장
};

const scaleSize = (size: number) => {
  try {
    const { width } = Dimensions.get('window');
    if (width > 0) return Math.round((width / BASE_WIDTH) * size);
  } catch (e) {}
  return size;
};


interface Challenge {
  challenge_id: number;
  creator_id?: number;          // 생성자 ID 추가
  creator?: {
    user_id: number;
    username: string;
    nickname?: string;
  };
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  participant_count: number;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'upcoming';
  tags?: string[];
  progress?: number;
  max_participants?: number;
  category?: string;
  recent_emotions?: Array<{
    emotion_id: number;
    emotion_name: string;
    emotion_color: string;
    date: string;
  }>;
  is_participating?: boolean;
  // 소셜 인터랙션 카운트 추가
  comment_count?: number;
  like_count?: number;
}

const MyChallengesScreenFixed = ({ route }: any) => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { theme, isDark } = useModernTheme();
  const { user } = useAuth();

  // 사용자 정보 로깅
  if (__DEV__) {
    console.log("🔍 사용자 정보 확인:", {
      user: user,
      userId: user?.user_id,
      userType: typeof user?.user_id,
      userKeys: user ? Object.keys(user) : "null"
    });
  }

  // route params에서 tab 가져오기 (ReviewScreen에서 전달한 값)
  const initialTab = route?.params?.tab === 'participated' ? 'participating' : 'created';

  // 상태 관리
  const [activeTab, setActiveTab] = useState<'created' | 'participating'>(initialTab);
  const [createdChallenges, setCreatedChallenges] = useState<Challenge[]>([]);
  const [participatingChallenges, setParticipatingChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'ending_soon'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  // 옵션 모달 상태
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // 캐싱 전략 - 트래픽 최적화 (30초 이내 재방문 시 캐시 사용)
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 30 * 1000; // 30초

  // 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  // 탭 레이아웃 상태
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  // 초기 애니메이션
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 탭 인디케이터 애니메이션
  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === 'created' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab]);

  // route params 변경 감지하여 탭 업데이트 (ReviewScreen에서 돌아왔을 때)
  useEffect(() => {
    if (route?.params?.tab) {
      const newTab = route.params.tab === 'participated' ? 'participating' : 'created';
      if (newTab !== activeTab) {
        setActiveTab(newTab);
      }
    }
  }, [route?.params?.tab]);

  // 데이터 로드 - 캐시 기반 최적화 (30초 이내는 캐시 사용)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime.current;

      // 30초 이내 재방문 시 캐시 사용 (트래픽 절약)
      if (timeSinceLastFetch < CACHE_DURATION && (createdChallenges.length > 0 || participatingChallenges.length > 0)) {
        if (__DEV__) console.log('🚀 캐시 사용 (마지막 로드:', Math.floor(timeSinceLastFetch / 1000), '초 전)');
        return;
      }

      // 캐시 만료 또는 첫 방문 시 새로고침
      if (__DEV__) console.log('🔄 데이터 새로고침 시작');
      loadChallenges();
    }, [createdChallenges.length, participatingChallenges.length])
  );

  const loadChallenges = async () => {
    try {
      setIsLoading(true);

      // 두 탭의 데이터를 동시에 로드
      const [createdResponse, participatingResponse] = await Promise.all([
        challengeService.getMyChallenges({
          page: 1,
          limit: 20,
        }),
        challengeService.getMyParticipations({
          page: 1,
          limit: 20,
        })
      ]);

      // 생성한 챌린지 데이터 처리
      if (createdResponse.status === 200 || createdResponse.status === 201) {
        let createdData = [];
        if (createdResponse.data?.data) {
          createdData = createdResponse.data.data;
        } else if (Array.isArray(createdResponse.data)) {
          createdData = createdResponse.data;
        }

        if (__DEV__) console.log('📊 생성한 챌린지 데이터:', createdData.length, '개');
        if (createdData.length > 0) {
          if (__DEV__) {
            console.log('📊 첫 번째 챌린지:', {
              challenge_id: createdData[0].challenge_id,
              title: createdData[0].title,
              status: createdData[0].status,
              participant_count: createdData[0].participant_count,
              end_date: createdData[0].end_date
            });
          }
        }

        setCreatedChallenges(createdData);
      }

      // 참여 중인 챌린지 데이터 처리
      if (participatingResponse.status === 200 || participatingResponse.status === 201) {
        let participatingData = [];
        if (participatingResponse.data?.data) {
          participatingData = participatingResponse.data.data;
        } else if (Array.isArray(participatingResponse.data)) {
          participatingData = participatingResponse.data;
        }

        // 백엔드에서 실제 댓글수와 좋아요수를 받아옴

        // 디버깅: 데이터 구조 확인
        if (__DEV__) console.log('📊 참여 중인 챌린지 데이터 개수:', participatingData.length);
        if (participatingData.length > 0) {
          if (__DEV__) {
            console.log('📊 첫 번째 챌린지 샘플:', {
              challenge_id: participatingData[0].challenge_id,
              title: participatingData[0].title,
              created_at: participatingData[0].created_at,
              participant_count: participatingData[0].participant_count,
              comment_count: participatingData[0].comment_count,
              like_count: participatingData[0].like_count
            });
          }
        }

        setParticipatingChallenges(participatingData);
      }

      // 로드 성공 시 캐시 타임스탬프 업데이트
      lastFetchTime.current = Date.now();
      if (__DEV__) console.log('✅ 데이터 로드 완료, 캐시 갱신됨');
    } catch (error) {
      console.error('챌린지 로드 오류:', error);
      Alert.alert('오류', '챌린지를 불러오는 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 새로고침 - 명시적 새로고침 시 캐시 무시
  const handleRefresh = () => {
    setIsRefreshing(true);
    lastFetchTime.current = 0; // 캐시 무효화
    loadChallenges();
  };

  // 필터링된 챌린지

  // 날짜 포맷팅 (개선된 버전 - 오류 수정)
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '날짜 없음';

      // ISO 날짜 문자열 정규화
      let normalizedDateString = dateString;
      if (typeof dateString === 'string') {
        // UTC 시간대 처리
        if (!dateString.includes('T')) {
          normalizedDateString = dateString + 'T00:00:00.000Z';
        } else if (!dateString.includes('Z') && !dateString.includes('+')) {
          normalizedDateString = dateString + 'Z';
        }
      }

      const date = new Date(normalizedDateString);

      // 유효하지 않은 날짜 체크
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return '날짜 확인 중';
      }

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));

      if (minutes < 1) return '방금 전';
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;
      if (days === 0) return '오늘';
      if (days === 1) return '어제';
      if (days < 7) return `${days}일 전`;
      if (days < 30) return `${Math.floor(days / 7)}주 전`;
      if (days < 365) return `${Math.floor(days / 30)}개월 전`;
      return `${Math.floor(days / 365)}년 전`;
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error, 'Input:', dateString);
      return '날짜 오류';
    }
  };

  // D-day 계산 (개선된 버전 - 오류 수정)
  const getDday = (endDate: string, status?: 'active' | 'upcoming' | 'completed') => {
    try {
      if (!endDate) return '날짜 없음';

      // 완료된 챌린지는 상태 우선
      if (status === 'completed') return '완료됨';

      // ISO 날짜 문자열 정규화
      let normalizedEndDate = endDate;
      if (typeof endDate === 'string') {
        if (!endDate.includes('T')) {
          normalizedEndDate = endDate + 'T23:59:59.999Z';
        } else if (!endDate.includes('Z') && !endDate.includes('+')) {
          normalizedEndDate = endDate + 'Z';
        }
      }

      const now = new Date();
      const end = new Date(normalizedEndDate);

      // 유효하지 않은 날짜 체크
      if (isNaN(end.getTime())) {
        console.warn('Invalid end date string:', endDate);
        return '날짜 확인 중';
      }

      // 현지 시간 기준으로 정확한 일수 계산
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endDay = new Date(end);
      endDay.setHours(23, 59, 59, 999);

      const diff = endDay.getTime() - today.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return 'D-Day';
      if (days > 0) return `D-${days}`;
      if (days === -1) return '어제 종료';
      if (days < -1) return '종료됨';
      return '종료됨';
    } catch (error) {
      console.error('D-day 계산 오류:', error, 'Input:', endDate);
      return '계산 오류';
    }
  };

  // 상태 정보 (아이콘 의미 명확화)
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { text: '진행중', color: COLORS.success, icon: 'play' }; // 재생 버튼 아이콘
      case 'upcoming':
        return { text: '예정', color: COLORS.warning, icon: 'clock' }; // 시계 아이콘
      case 'completed':
        return { text: '완료', color: COLORS.textSecondary, icon: 'check' }; // 체크 아이콘
      default:
        return { text: status, color: COLORS.textSecondary, icon: 'information' }; // 정보 아이콘
    }
  };

  // 챌린지 참여/나가기 핸들러
  const handleJoinChallenge = useCallback(async (challengeId: number, isCurrentlyParticipating: boolean) => {
    try {
      if (isCurrentlyParticipating) {
        // 나가기 확인 다이얼로그
        Alert.alert(
          '챌린지 나가기',
          '정말로 이 챌린지에서 나가시겠습니까?\n참여 기록이 사라질 수 있습니다.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '나가기',
              style: 'destructive',
              onPress: async () => {
                try {
                  const response = await challengeService.leaveChallenge(challengeId);

                  if (response?.status === 200 || response?.status === 204) {
                    // 로컬 상태 업데이트
                    setParticipatingChallenges(prev =>
                      prev.filter(challenge => challenge.challenge_id !== challengeId)
                    );

                    Alert.alert('성공', '챌린지에서 나갔습니다.');
                  }
                } catch (leaveError: any) {
                  console.error('❌ 챌린지 나가기 실패:', leaveError);
                  Alert.alert('오류', leaveError.response?.data?.message || '챌린지 나가기에 실패했습니다.');
                }
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ 챌린지 액션 실패:', error);
      Alert.alert('오류', '요청 처리에 실패했습니다.');
    }
  }, []);

  // 챌린지 편집 핸들러 - 옵션 선택 제공
  const handleEditChallenge = useCallback((challengeId: number) => {
    if (__DEV__) console.log('챌린지 편집 옵션 선택:', challengeId);
    // 현재 선택된 챌린지 설정하여 옵션 모달에서 사용
    const challenge = activeTab === 'created'
      ? createdChallenges.find(c => c.challenge_id === challengeId)
      : participatingChallenges.find(c => c.challenge_id === challengeId);

    if (challenge) {
      setSelectedChallenge(challenge);
      setShowOptionsModal(true);
    }
  }, [activeTab, createdChallenges, participatingChallenges]);

  // 챌린지 삭제 핸들러
  const handleDeleteChallenge = useCallback(async (challengeId: number) => {
    try {
      Alert.alert(
        '챌린지 삭제',
        '정말로 이 챌린지를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 모든 참여자의 감정 기록도 함께 삭제됩니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                if (__DEV__) console.log('🗑️ 챌린지 삭제 시작:', challengeId);

                // 1. 서버에서 챌린지 삭제
                await challengeService.deleteChallenge(challengeId);
                if (__DEV__) console.log('✅ 서버에서 챌린지 삭제 완료');

                // 2. 캐시 클리어 (즉시 적용)
                challengeService.clearCache();
                if (__DEV__) console.log('🗑️ 캐시 클리어 완료');

                // 3. 로컬 상태 즉시 업데이트 (두 탭 모두)
                setCreatedChallenges(prev => {
                  const updated = prev.filter(challenge => challenge.challenge_id !== challengeId);
                  if (__DEV__) console.log('📝 생성 챌린지 상태 업데이트:', prev.length, '->', updated.length);
                  return updated;
                });
                setParticipatingChallenges(prev => {
                  const updated = prev.filter(challenge => challenge.challenge_id !== challengeId);
                  if (__DEV__) console.log('📝 참여 챌린지 상태 업데이트:', prev.length, '->', updated.length);
                  return updated;
                });

                Alert.alert(
                  '삭제 완료',
                  '챌린지가 성공적으로 삭제되었습니다.',
                  [
                    {
                      text: '확인',
                      onPress: () => {
                        // 4. 백그라운드에서 데이터 새로고침으로 서버와 동기화
                        setTimeout(() => {
                          if (__DEV__) console.log('🔄 백그라운드 데이터 동기화 시작');
                          loadChallenges();
                        }, 100);
                      }
                    }
                  ]
                );
              } catch (error: any) {
                console.error('❌ 챌린지 삭제 실패:', error);
                Alert.alert('오류', '챌린지 삭제에 실패했습니다.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ 챌린지 삭제 오류:', error);
    }
  }, [loadChallenges]);

  // 통계 보기 핸들러
  const handleViewStats = useCallback((challengeId: number) => {
    if (__DEV__) console.log('통계 보기:', challengeId);
    navigation.navigate('ChallengeDetail' as never, {
      challengeId,
      openStatsModal: true
    } as never);
  }, [navigation]);

  // 알림 설정 핸들러
  const handleNotificationSettings = useCallback((challengeId: number) => {
    Alert.alert(
      '알림 설정',
      '이 챌린지의 알림을 어떻게 설정하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '알림 끄기', onPress: () => { if (__DEV__) console.log('알림 끄기:', challengeId); } },
        { text: '알림 켜기', onPress: () => { if (__DEV__) console.log('알림 켜기:', challengeId); } },
        { text: '맞춤 설정', onPress: () => { if (__DEV__) console.log('맞춤 설정:', challengeId); } }
      ]
    );
  }, []);

  // 챌린지 공유 핸들러
  const handleShareChallenge = useCallback((challenge: Challenge) => {
    const shareText = `🎯 감정 챌린지에 함께 참여해보세요!\n\n📝 ${challenge.title}\n${challenge.description ? `💭 ${challenge.description}\n` : ''}👥 현재 ${challenge.participant_count}명 참여 중\n\n#감정챌린지 #Dayonme`;

    Alert.alert(
      '챌린지 공유',
      '어떤 방식으로 공유하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '링크 복사',
          onPress: () => {
            // TODO: 실제 클립보드 API 사용
            if (__DEV__) console.log('링크 복사:', shareText);
            Alert.alert('완료', '챌린지 링크가 클립보드에 복사되었습니다.');
          }
        },
        {
          text: 'SNS 공유',
          onPress: () => {
            if (__DEV__) console.log('SNS 공유:', shareText);
            Alert.alert('알림', 'SNS 공유 기능은 곧 추가될 예정입니다.');
          }
        }
      ]
    );
  }, []);

  // 참여자 초대 핸들러
  const handleInviteParticipants = useCallback((challengeId: number) => {
    Alert.alert(
      '참여자 초대',
      '친구들을 챌린지에 초대해보세요!',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '연락처에서 초대',
          onPress: () => {
            if (__DEV__) console.log('연락처에서 초대:', challengeId);
            Alert.alert('알림', '연락처 초대 기능은 곧 추가될 예정입니다.');
          }
        },
        {
          text: '초대 링크 생성',
          onPress: () => {
            if (__DEV__) console.log('초대 링크 생성:', challengeId);
            Alert.alert('완료', '초대 링크가 생성되었습니다.\n(개발 중)');
          }
        }
      ]
    );
  }, []);

  // 신고 핸들러
  const handleReport = useCallback(async (reportType: 'spam' | 'inappropriate' | 'other') => {
    if (!selectedChallenge) return;

    try {
      // TODO: 실제 신고 API 호출 구현
      if (__DEV__) console.log(`신고 접수: 챌린지 ID ${selectedChallenge.challenge_id}, 사유: ${reportType}`);

      Alert.alert(
        '신고 완료',
        '신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.',
        [{ text: '확인' }]
      );
    } catch (error) {
      console.error('신고 처리 오류:', error);
      Alert.alert('오류', '신고 처리 중 문제가 발생했습니다.');
    }
  }, [selectedChallenge]);

  // 더 많은 옵션 핸들러 - 하단 모달 사용
  const handleMoreOptions = useCallback((challenge: Challenge) => {
    if (__DEV__) console.log('옵션 모달 열기:', challenge.challenge_id, challenge.title);
    if (__DEV__) {
      console.log('🔍 생성자 확인 (하이브리드 방식):', {
        currentUserId: user?.user_id,
        creatorUserId: challenge.creator?.user_id,
        creatorId: challenge.creator_id
      });
    }

    setSelectedChallenge(challenge);
    setShowOptionsModal(true);
  }, [user, activeTab]);

  // 옵션 선택 핸들러
  const handleOptionSelect = useCallback((action: string) => {
    if (!selectedChallenge) return;

    setShowOptionsModal(false);

    // 약간의 딜레이 후 액션 실행 (모달 닫힘 애니메이션과 겹치지 않도록)
    setTimeout(() => {
      switch (action) {
        case 'editTitle':
          // 제목과 설명 수정
          navigation.navigate('ChallengeDetail' as never, {
            challengeId: selectedChallenge.challenge_id,
            openEditModal: true
          } as never);
          break;
        case 'editPeriod':
          // 기간 수정
          navigation.navigate('ChallengeDetail' as never, {
            challengeId: selectedChallenge.challenge_id,
            openPeriodModal: true
          } as never);
          break;
        case 'delete':
          handleDeleteChallenge(selectedChallenge.challenge_id);
          break;
        case 'leave':
          handleJoinChallenge(selectedChallenge.challenge_id, true);
          break;
        case 'stats':
          handleViewStats(selectedChallenge.challenge_id);
          break;
        case 'notification':
          handleNotificationSettings(selectedChallenge.challenge_id);
          break;
        case 'share':
          handleShareChallenge(selectedChallenge);
          break;
        case 'invite':
          handleInviteParticipants(selectedChallenge.challenge_id);
          break;
        case 'report':
          Alert.alert(
            '신고하기',
            '이 챌린지를 신고하시겠습니까?\n신고 사유를 선택해주세요.',
            [
              { text: '취소', style: 'cancel' },
              { text: '스팸/광고', onPress: () => handleReport('spam') },
              { text: '부적절한 내용', onPress: () => handleReport('inappropriate') },
              { text: '기타', onPress: () => handleReport('other') }
            ]
          );
          break;
      }
      setSelectedChallenge(null);
    }, 300);
  }, [selectedChallenge, navigation, handleJoinChallenge, handleDeleteChallenge, handleReport, handleViewStats, handleNotificationSettings, handleShareChallenge, handleInviteParticipants]);

  // 하모니 글래스모피즘 + 네오모피즘 카드 컴포넌트
  const HarmonyCard = ({ challenge, index }: { challenge: Challenge; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    // 서버 상태가 active 로 남아 있어도 종료일이 지났으면 화면에서는 종료로 취급한다(표시 전용)
    const endedByDate = !!challenge.end_date && !isNaN(new Date(challenge.end_date).getTime()) && new Date(challenge.end_date).getTime() < Date.now() - 24 * 60 * 60 * 1000;
    const displayStatus = challenge.status === 'active' && endedByDate ? 'completed' : challenge.status;
    const statusInfo = getStatusInfo(displayStatus);
    const isCreated = activeTab === 'created';

    // 상태별 조화로운 그라데이션 선택
    const getHarmonyGradient = () => {
      switch (displayStatus) {
        case 'active':
          return COLORS.gradientHarmony;  // 메인 하모니
        case 'upcoming':
          return COLORS.gradientWarm;     // 따뜻한 톤
        case 'completed':
          return COLORS.gradientCool;     // 쿨 톤
        default:
          return COLORS.gradientNature;   // 자연 그린
      }
    };

    useEffect(() => {
      const animation = Animated.parallel([
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 500,
          delay: index * 120,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
      animation.start();

      // 메모리 누수 방지: 컴포넌트 언마운트 시 애니메이션 정지
      return () => animation.stop();
    }, [index]);

    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 250,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 250,
        friction: 8,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.harmonyCard,
          {
            opacity: cardAnim,
            transform: [
              { scale: scaleValue },
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                })
              }
            ],
            shadowColor: isDark ? '#000' : COLORS.neuShadowDark,
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.12,
            shadowRadius: 8,
            elevation: 3,
          }
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate('ChallengeDetail' as never, { challengeId: challenge.challenge_id } as never)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.harmonyCardTouchable}
        >
          {/* 네오모피즘 배경 */}
          <View style={[
            styles.harmonyCardContainer,
            {
              backgroundColor: isDark ? theme.colors.card : COLORS.surface,
            }
          ]}>
            {/* 글래스모피즘 오버레이 */}
            <LinearGradient
              colors={[
                isDark ? 'rgba(255, 255, 255, 0.03)' : COLORS.glass,
                isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.1)'
              ]}
              style={styles.glassOverlay}
            >
              {/* 상태별 컬러 액센트 바 */}
              <LinearGradient
                colors={getHarmonyGradient()}
                style={styles.colorAccentBar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />

              {/* 헤더 영역 */}
              <View style={styles.harmonyCardHeader}>
                <LinearGradient
                  colors={getHarmonyGradient()}
                  style={styles.harmonyStatusBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons name={statusInfo.icon as any} size={12} color="white" />
                  <Text style={styles.harmonyStatusText}>
                    {getDday(challenge.end_date, challenge.status)}
                  </Text>
                </LinearGradient>

                <TouchableOpacity
                  style={[
                    styles.harmonyOptionButton,
                    { backgroundColor: isDark ? theme.colors.border : COLORS.surfaceVariant }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleMoreOptions(challenge);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={16}
                    color={isDark ? theme.colors.text.primary : COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* 메인 콘텐츠 */}
              <View style={styles.harmonyCardContent}>
                <Text
                  style={[styles.harmonyCardTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}
                  numberOfLines={2}
                >
                  {challenge.title}
                </Text>

                {/* 소셜 인터랙션 - 컴팩트 레이아웃 */}
                <View style={styles.harmonyCardMeta}>
                  <View style={styles.metaInfoRow}>
                    {/* 좋아요 */}
                    <View style={styles.compactSocialBadge}>
                      <MaterialCommunityIcons
                        name="heart"
                        size={13}
                        color={COLORS.danger}
                      />
                      <Text style={[styles.compactSocialText, { color: COLORS.danger }]}>
                        {challenge.like_count || 0}
                      </Text>
                    </View>

                    {/* 댓글 */}
                    <View style={styles.compactSocialBadge}>
                      <MaterialCommunityIcons
                        name="comment-text-outline"
                        size={13}
                        color={theme.colors.accentText}
                      />
                      <Text style={[styles.compactSocialText, { color: theme.colors.accentText }]}>
                        {challenge.comment_count || 0}
                      </Text>
                    </View>

                    <Text style={[styles.metaDivider, { color: isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary }]}>•</Text>

                    {/* 참여자 */}
                    <View style={styles.compactInfoBadge}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={12}
                        color={statusInfo.color}
                      />
                      <Text style={[styles.compactInfoText, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
                        {challenge.participant_count}
                      </Text>
                    </View>

                    <Text style={[styles.metaDivider, { color: isDark ? theme.colors.text.secondary : COLORS.textSecondary }]}>•</Text>

                    {/* 날짜 */}
                    <Text style={[styles.compactDateText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : COLORS.textSecondary }]}>
                      {formatDate(activeTab === "created" ? challenge.created_at : ((challenge as any).joined_at || challenge.created_at))}
                    </Text>
                  </View>
                </View>

                {challenge.progress !== undefined && (
                  <View style={styles.progressSection}>
                    <View style={[
                      styles.harmonyProgressBar,
                      { backgroundColor: isDark ? theme.colors.border : COLORS.surfaceVariant }
                    ]}>
                      <LinearGradient
                        colors={getHarmonyGradient()}
                        style={[
                          styles.harmonyProgressFill,
                          { width: `${challenge.progress}%` } as ViewStyle
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                    <Text style={[styles.progressLabel, { color: statusInfo.color }]}>
                      {challenge.progress}% 완료
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // 헤더 컴포넌트
  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* 상단 네비게이션 */}
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // ReviewScreen에서 왔는지 확인
            if (route?.params?.fromScreen === 'Review') {
              // ReviewScreen으로 직접 이동
              navigation.navigate('Review' as never);
            } else if (navigation.canGoBack()) {
              // 그 외의 경우 이전 화면으로 뒤로가기
              navigation.goBack();
            } else {
              // 뒤로갈 곳이 없으면 Challenge 메인으로
              navigation.navigate('ChallengeMain' as never);
            }
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={isDark ? theme.colors.text.primary : COLORS.text}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
          나의 챌린지
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearchModal(true)}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.accentText} />
          </TouchableOpacity>

        </View>
      </View>

      {/* 탭 네비게이션 - 간소화 버전 */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <TouchableOpacity
            style={[
              styles.simpleTabButton,
              activeTab === 'created' && [styles.activeCreatedTabButton, { backgroundColor: theme.colors.primary, shadowColor: isDark ? '#000000' : theme.colors.primary }]
            ]}
            onPress={() => setActiveTab('created')}
          >
            <MaterialCommunityIcons
              name="crown"
              size={16}
              color={activeTab === 'created' ? theme.colors.onAccent : (isDark ? theme.colors.text.primary : COLORS.text)}
            />
            <Text style={[
              styles.simpleTabText,
              {
                color: activeTab === 'created' ? theme.colors.onAccent : (isDark ? theme.colors.text.primary : COLORS.text),
                fontWeight: activeTab === 'created' ? '700' : '600'
              }
            ]}>
              만든 챌린지
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.simpleTabButton,
              activeTab === 'participating' && styles.activeParticipatingTabButton
            ]}
            onPress={() => setActiveTab('participating')}
          >
            <MaterialCommunityIcons
              name="heart-multiple"
              size={16}
              color={activeTab === 'participating' ? 'white' : (isDark ? theme.colors.text.primary : COLORS.text)}
            />
            <Text style={[
              styles.simpleTabText,
              {
                color: activeTab === 'participating' ? 'white' : (isDark ? theme.colors.text.primary : COLORS.text),
                fontWeight: activeTab === 'participating' ? '700' : '600'
              }
            ]}>
              참여한 챌린지
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 컴팩트 통계 */}
      <View style={styles.compactStats}>
        <Text style={[styles.compactStatText, { color: isDark ? theme.colors.text.secondary : COLORS.textSecondary }]}>
          생성 {createdChallenges.length} · 참여 {participatingChallenges.length}
        </Text>
      </View>
    </Animated.View>
  );

  // 필터 섹션
  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersScroll}
      style={styles.filtersContainer}
    >
      {[
        { key: 'all', label: '전체', icon: 'apps', type: 'status' },
        { key: 'active', label: '진행중', icon: 'play-circle', type: 'status' },
        { key: 'ending_soon', label: '마감임박', icon: 'fire', type: 'status' },
        { key: 'completed', label: '완료', icon: 'check-circle', type: 'status' },
        { key: 'latest', label: '최신순', icon: 'clock-outline', type: 'sort' },
        { key: 'popular', label: '인기순', icon: 'heart-outline', type: 'sort' }
      ].map((filter) => {
        const isActive = filter.type === 'status'
          ? filterStatus === filter.key
          : sortBy === filter.key;

        return (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive
                  ? theme.colors.primary
                  : (isDark ? theme.colors.border : COLORS.surfaceVariant),
              }
            ]}
            onPress={() => filter.type === 'status'
              ? setFilterStatus(filter.key as any)
              : setSortBy(filter.key as any)}
          >
            <MaterialCommunityIcons
              name={filter.icon as any}
              size={14}
              color={isActive ? theme.colors.onAccent : (isDark ? theme.colors.text.primary : COLORS.text)}
            />
            <Text style={[
              styles.filterChipText,
              { color: isActive ? theme.colors.onAccent : (isDark ? theme.colors.text.primary : COLORS.text) }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // Filtered challenges - useMemo for performance
  const filteredChallenges = useMemo(() => {
    const challenges = activeTab === 'created' ? createdChallenges : participatingChallenges;
    const now = new Date();

    const filtered = challenges.filter(challenge => {
      const endDate = new Date(challenge.end_date);
      const isExpired = endDate < now;
      const daysLeft = Math.ceil((endDate - now.getTime()) / (1000 * 60 * 60 * 24));

      if (filterStatus === 'ending_soon') {
        return !isExpired && daysLeft >= 0 && daysLeft <= 7;
      } else if (filterStatus === 'active') {
        return !isExpired;
      } else if (filterStatus === 'completed') {
        return isExpired || challenge.status === 'completed';
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          challenge.title.toLowerCase().includes(query) ||
          challenge.description.toLowerCase().includes(query) ||
          (challenge.tags && challenge.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return activeTab === 'created'
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : new Date((b as any).joined_at || b.created_at).getTime() - new Date((a as any).joined_at || a.created_at).getTime();
        case 'popular':
          return (b.participant_count || 0) - (a.participant_count || 0);
        default:
          return 0;
      }
    });
  }, [activeTab, createdChallenges, participatingChallenges, filterStatus, searchQuery, sortBy]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? theme.colors.background : COLORS.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? theme.colors.background : COLORS.background} translucent={false} />
        <SafeAreaView style={{ backgroundColor: isDark ? theme.colors.background : COLORS.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accentText} />
          <Text style={[styles.loadingText, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
            챌린지 불러오는 중...
          </Text>
        </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.colors.background : COLORS.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? theme.colors.background : COLORS.background} translucent={false} />
      <SafeAreaView style={{ backgroundColor: isDark ? theme.colors.background : COLORS.background }}>

      <FlatList<Challenge>
        data={filteredChallenges}
        renderItem={({ item, index }: { item: Challenge; index: number }) => <HarmonyCard challenge={item} index={index} />}
        keyExtractor={(item: Challenge) => item.challenge_id.toString()}
        numColumns={1}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderFilters()}
          </>
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['rgba(108, 92, 231, 0.1)', 'transparent']}
              style={styles.emptyGradient}
            />
            <MaterialCommunityIcons
              name={activeTab === 'created' ? 'crown-outline' : 'heart-multiple-outline'}
              size={60}
              color={isDark ? theme.colors.text.secondary : COLORS.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
              {activeTab === 'created'
                ? '아직 만든 챌린지가 없어요'
                : '참여 중인 챌린지가 없어요'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? theme.colors.text.secondary : COLORS.textSecondary }]}>
              {activeTab === 'created'
                ? '첫 번째 감정 챌린지를 만들어보세요'
                : '흥미로운 챌린지에 참여해보세요'}
            </Text>

            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => navigation.navigate(activeTab === 'created' ? 'CreateChallenge' as never : 'ChallengeMain' as never)}
            >
              <LinearGradient
                colors={COLORS.gradientHarmony}
                style={styles.emptyActionGradient}
              >
                <MaterialCommunityIcons
                  name={activeTab === 'created' ? 'plus-circle' : 'rocket-launch'}
                  size={18}
                  color="white"
                />
                <Text style={styles.emptyActionText}>
                  {activeTab === 'created' ? '챌린지 만들기' : '챌린지 둘러보기'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      />

      {/* 검색 모달 */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowSearchModal(false)} />
          <View style={[
            styles.searchModal,
            { backgroundColor: isDark ? theme.colors.card : COLORS.surface }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
                챌린지 검색
              </Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={isDark ? theme.colors.text.primary : COLORS.text}
                />
              </TouchableOpacity>
            </View>

            <View style={[
              styles.searchInputContainer,
              {
                backgroundColor: isDark ? theme.colors.border : COLORS.surfaceVariant,
                borderColor: isDark ? theme.colors.border : COLORS.border
              }
            ]}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={isDark ? theme.colors.text.secondary : COLORS.textSecondary}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDark ? '#FFFFFF' : COLORS.text }
                ]}
                placeholder="챌린지 제목이나 태그로 검색..."
                placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.6)' : COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color={isDark ? theme.colors.text.secondary : COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.searchApplyButton}
              onPress={() => setShowSearchModal(false)}
            >
              <LinearGradient
                colors={COLORS.gradientHarmony}
                style={styles.searchApplyGradient}
              >
                <Text style={styles.searchApplyText}>검색</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 옵션 모달 - 하단에서 올라오는 스타일 */}
      <Modal
        visible={showOptionsModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <Pressable
          style={styles.optionsModalOverlay}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={[
            styles.optionsModal,
            { backgroundColor: isDark ? theme.colors.card : COLORS.surface }
          ]}>
            <View style={styles.optionsModalHandle} />

            <View style={[
              styles.optionsModalHeader,
              {
                backgroundColor: isDark ? 'rgba(40, 40, 44, 0.8)' : 'rgba(248, 249, 250, 0.8)',
                borderBottomColor: isDark ? theme.colors.border : '#E5E5EA'
              }
            ]}>
              <Text style={[styles.optionsModalTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
                {selectedChallenge?.title}
              </Text>
              <Text style={[styles.optionsModalSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary }]}>
                {activeTab === 'created' ? '내가 만든 챌린지' : '참여 중인 챌린지'}
              </Text>
            </View>

            <View style={styles.optionsContainer}>
              {/* 생성자 확인: creator.user_id 또는 creator_id 모두 지원 */}
              {(user?.user_id && selectedChallenge && (
                (selectedChallenge.creator?.user_id &&
                 (selectedChallenge.creator.user_id === user.user_id ||
                  String(selectedChallenge.creator.user_id) === String(user.user_id))) ||
                (selectedChallenge.creator_id &&
                 (selectedChallenge.creator_id === user.user_id ||
                  String(selectedChallenge.creator_id) === String(user.user_id)))
              )) ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isDark ? 'rgba(40, 40, 44, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        borderBottomColor: isDark ? theme.colors.border : '#E5E5EA'
                      }
                    ]}
                    onPress={() => handleOptionSelect('editTitle')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                      <MaterialCommunityIcons name="pencil" size={22} color={theme.colors.accentText} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
                        제목과 설명 수정
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary }]}>
                        챌린지 제목과 설명을 변경합니다
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? theme.colors.text.secondary : COLORS.textTertiary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isDark ? 'rgba(40, 40, 44, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        borderBottomColor: isDark ? theme.colors.border : '#E5E5EA'
                      }
                    ]}
                    onPress={() => handleOptionSelect('editPeriod')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                      <MaterialCommunityIcons name="calendar-range" size={22} color={COLORS.secondary} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
                        기간 수정
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary }]}>
                        챌린지 시작일과 종료일을 변경합니다
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? theme.colors.text.secondary : COLORS.textTertiary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isDark ? 'rgba(40, 40, 44, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        borderBottomColor: isDark ? theme.colors.border : '#E5E5EA'
                      }
                    ]}
                    onPress={() => handleOptionSelect('stats')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.success + '20' }]}>
                      <MaterialCommunityIcons name="chart-line" size={22} color={COLORS.success} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
                        통계 보기
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary }]}>
                        참여자 현황과 진행률을 확인합니다
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? theme.colors.text.secondary : COLORS.textTertiary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      styles.deleteOption,
                      {
                        backgroundColor: isDark ? 'rgba(40, 40, 44, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                      }
                    ]}
                    onPress={() => handleOptionSelect('delete')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.danger + '20' }]}>
                      <MaterialCommunityIcons name="delete" size={22} color={COLORS.danger} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: COLORS.danger }]}>
                        삭제하기
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary }]}>
                        챌린지를 영구적으로 삭제합니다
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isDark ? 'rgba(40, 40, 44, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        borderBottomColor: isDark ? theme.colors.border : '#E5E5EA'
                      }
                    ]}
                    onPress={() => handleOptionSelect('notification')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                      <MaterialCommunityIcons name="bell" size={22} color={COLORS.warning} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
                        알림 설정
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary }]}>
                        챌린지 알림을 관리합니다
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? theme.colors.text.secondary : COLORS.textTertiary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isDark ? 'rgba(40, 40, 44, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        borderBottomColor: isDark ? theme.colors.border : '#E5E5EA'
                      }
                    ]}
                    onPress={() => handleOptionSelect('share')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.success + '20' }]}>
                      <MaterialCommunityIcons name="share" size={22} color={COLORS.success} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
                        공유하기
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary }]}>
                        친구들과 챌린지를 공유합니다
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? theme.colors.text.secondary : COLORS.textTertiary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isDark ? 'rgba(40, 40, 44, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        borderBottomColor: isDark ? theme.colors.border : '#E5E5EA'
                      }
                    ]}
                    onPress={() => handleOptionSelect('report')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                      <MaterialCommunityIcons name="flag" size={22} color={COLORS.warning} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: isDark ? theme.colors.text.primary : COLORS.text }]}>
                        신고하기
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary }]}>
                        부적절한 콘텐츠를 신고합니다
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? theme.colors.text.secondary : COLORS.textTertiary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      styles.deleteOption,
                      {
                        backgroundColor: isDark ? 'rgba(40, 40, 44, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                      }
                    ]}
                    onPress={() => handleOptionSelect('leave')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.danger + '20' }]}>
                      <MaterialCommunityIcons name="exit-to-app" size={22} color={COLORS.danger} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: COLORS.danger }]}>
                        나가기
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : COLORS.textSecondary }]}>
                        챌린지 참여를 중단합니다
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
      </SafeAreaView>
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
    marginTop: 12,
    fontSize: scaleFontSize(15),
    fontWeight: '600',
  },

  // 헤더
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    marginRight: 8,
  },
  addButton: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 탭 네비게이션
  tabContainer: {
    marginBottom: 8,
    marginHorizontal: 20,
  },
  tabBackground: {
    flexDirection: 'row',
    borderRadius: 28,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 1,
  },
  tabIndicatorGradient: {
    flex: 1,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 20,
    position: 'relative',
  },
  tabText: {
    fontSize: scaleFontSize(16),
    marginLeft: 8,
  },

  // 간소화된 탭 스타일
  simpleTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 3,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
    shadowOpacity: 0.15,
    elevation: 4,
  },
  activeCreatedTabButton: {
    backgroundColor: '#5566DD',         // 밝은 Primary 컬러로 명확한 대비
    shadowOpacity: 0.15,
    elevation: 4,
    shadowColor: '#5566DD',
  },
  activeParticipatingTabButton: {
    backgroundColor: '#764BA2',         // 밝은 Secondary 컬러로 명확한 대비
    shadowOpacity: 0.15,
    elevation: 4,
    shadowColor: '#764BA2',
  },
  simpleTabText: {
    fontSize: scaleFontSize(13),
    marginLeft: 5,
    letterSpacing: 0,
    lineHeight: 18,
    fontWeight: '700',
  },

  // 컴팩트 통계
  compactStats: {
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  compactStatText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
  },

  // 필터
  filtersContainer: {
    marginBottom: 12,
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: scaleFontSize(13),
    fontWeight: '700',
    marginLeft: 4,
  },

  // 리스트
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },

  // 2025 하모니 글래스모피즘 + 네오모피즘 카드
  harmonyCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  harmonyCardTouchable: {
    flex: 1,
  },
  harmonyCardContainer: {
    flex: 1,
    borderRadius: 18,
    minHeight: 110,
  },
  glassOverlay: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    backdropFilter: 'blur(20px)',
  },
  colorAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  harmonyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
  },
  harmonyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  harmonyStatusText: {
    color: 'white',
    fontSize: scaleFontSize(13),
    fontWeight: '700',
    letterSpacing: 0,
  },
  harmonyOptionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  harmonyCardContent: {
    flex: 1,
  },
  harmonyCardTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 5,
    letterSpacing: -0.1,
    color: COLORS.text,
  },
  harmonyCardMeta: {
    marginBottom: 2,             // 최소 여백
  },
  // 컴팩트 메타 정보 라인
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,                      // 타이트한 간격
    flexWrap: 'wrap',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // 컴팩트 소셜 배지 (좋아요, 댓글)
  compactSocialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactSocialText: {
    fontSize: scaleFontSize(13),
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 16,
  },
  // 컴팩트 정보 배지 (참여자)
  compactInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactInfoText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 16,
  },
  // 컴팩트 날짜 텍스트
  compactDateText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 16,
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  metaDivider: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    marginHorizontal: 2,         // 타이트한 간격
    opacity: 0.5,
  },
  participantText: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    letterSpacing: 0,
  },
  harmonyDateText: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    letterSpacing: 0,
  },
  progressSection: {
    marginTop: 6,
  },
  harmonyProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  harmonyProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: scaleFontSize(13),
    fontWeight: '700',
    textAlign: 'right',
    letterSpacing: 0,
  },
  // 빈 상태
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    position: 'relative',
  },
  emptyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  emptyTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: scaleFontSize(14),
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyActionText: {
    color: 'white',
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    marginLeft: 6,
  },

  // 검색 모달
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  searchModal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFontSize(16),
    marginLeft: 10,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 21,
  },
  searchApplyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchApplyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchApplyText: {
    color: 'white',
    fontSize: scaleFontSize(18),
    fontWeight: '700',
  },

  // 옵션 모달 스타일 (하단에서 올라오는 형태 - 개선된 버전)
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 더 진한 오버레이
    justifyContent: 'flex-end',
  },
  optionsModal: {
    borderTopLeftRadius: 32,     // 더 둥근 모서리
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    paddingHorizontal: 0,
    maxHeight: '75%',            // 더 많은 옵션을 위해 살짝 늘림
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,         // 더 강한 그림자
    shadowRadius: 20,            // 더 부드러운 그림자
    elevation: 4,
  },
  optionsModalHandle: {
    width: 48,                   // 더 긴 핸들
    height: 5,                   // 더 두껐게
    backgroundColor: '#C7C7CC',  // iOS 스타일 색상
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 24,
    opacity: 0.6,
  },
  optionsModalHeader: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomWidth: 0.5,
  },
  optionsModalTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  optionsModalSubtitle: {
    fontSize: scaleFontSize(15),
    fontWeight: '500',
    opacity: 0.8,
  },
  optionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    marginBottom: 2,
    lineHeight: 21,
    letterSpacing: 0,
  },
  optionsContainer: {
    paddingTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 0.3,
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  optionIcon: {
    width: 48,                   // 더 큰 아이콘 영역
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    shadowColor: 'rgba(0, 0, 0, 0.1)', // 미세한 그림자
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    marginBottom: 2,
    lineHeight: 20,
    letterSpacing: 0,
  },
  optionSubtitle: {
    fontSize: scaleFontSize(14),
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0,
    opacity: 0.85,
  },
});

export default MyChallengesScreenFixed;