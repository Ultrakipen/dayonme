// src/screens/UserProfileScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text as RNText,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import userService, { UserProfile } from '../services/api/userService';
import blockService from '../services/api/blockService';
import { RootStackParamList } from '../types/navigation';
import SendEncouragementModal from '../components/SendEncouragementModal';
import EmotionIcon from '../components/common/EmotionIcon';
import { getReadableEmotionColor } from '../utils/emotionTextColor';
import { useAuth } from '../contexts/AuthContext';
import GuestPromptBottomSheet from '../components/GuestPromptBottomSheet';
import { showAlert } from '../contexts/AlertContext';
import { moderateScale } from '../constants';
import { ProfileCardSkeleton, SkeletonLoader } from '../components/SkeletonLoader';
import BottomSheetAlert from '../components/common/BottomSheetAlert';
import { useModernTheme } from '../contexts/ModernThemeContext';

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  challengeCount: number;
  joinedDate: string;
}

interface EmotionTag {
  emotion_id: number;
  name: string;
  icon: string;
  color: string;
  count: number;
}

const UserProfileScreen: React.FC = React.memo(() => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UserProfileScreenRouteProp>();
  const { userId, nickname } = route.params;
  const { width: screenWidth } = useWindowDimensions();
  const { isAuthenticated } = useAuth();
  const { theme, isDark } = useModernTheme();

  const colors = useMemo(() => ({
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: theme.colors.accentText,
  }), [theme, isDark]);

  // 테마별 emotion colors
  const emotionColors = useMemo(() => ({
    primary: isDark ? '#8B7FD5' : '#6B4CE6',
    error: theme.colors.error,
    success: theme.colors.success,
    warning: theme.colors.warning,
    encouragement: isDark ? '#E57AA3' : '#FF6B9D',
  }), [isDark, theme]);

  // 🔥 반응형 스케일 (동적)
  const scale = useMemo(() => {
    const BASE_WIDTH = 360;
    return Math.max(0.85, Math.min(1.3, screenWidth / BASE_WIDTH));
  }, [screenWidth]);

  // 공통 헤더 스타일 (모든 상태에서 사용)
  const headerStyles = useMemo(() => StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(12),
      paddingTop: moderateScale(48),
      backgroundColor: theme.bg.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.bg.border,
    },
    backButton: {
      padding: moderateScale(8),
    },
    headerTitle: {
      fontSize: moderateScale(17),
      fontWeight: '700',
      color: theme.text.primary,
      letterSpacing: -0.3,
    },
    moreButton: {
      padding: moderateScale(8),
    },
  }), [theme, isDark]);

  // 🔥 메인 스타일 (항상 호출되어야 함 - hooks 규칙)
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.bg.primary,
    },
    loadingText: {
      marginTop: moderateScale(12),
      fontSize: moderateScale(16),
      color: theme.text.secondary,
      fontWeight: '500',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(12),
      paddingTop: moderateScale(48),
      backgroundColor: theme.bg.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.bg.border,
    },
    backButton: {
      padding: moderateScale(8),
    },
    headerTitle: {
      fontSize: moderateScale(17),
      fontWeight: '700',
      color: theme.text.primary,
      letterSpacing: -0.3,
    },
    moreButton: {
      padding: moderateScale(8),
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: moderateScale(24),
    },
    profileInfoContainer: {
      backgroundColor: theme.bg.card,
      paddingVertical: moderateScale(24),
      paddingHorizontal: moderateScale(24),
      alignItems: 'center',
      borderBottomWidth: moderateScale(8),
      borderBottomColor: theme.bg.secondary,
    },
    profileImageContainer: {
      marginBottom: moderateScale(16),
    },
    profileImage: {
      width: moderateScale(90),
      height: moderateScale(90),
      borderRadius: moderateScale(45),
      borderWidth: moderateScale(3),
      borderColor: emotionColors.primary,
    },
    profileImagePlaceholder: {
      width: moderateScale(90),
      height: moderateScale(90),
      borderRadius: moderateScale(45),
      backgroundColor: theme.bg.secondary,
      borderWidth: moderateScale(3),
      borderColor: theme.bg.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: moderateScale(45),
    },
    nickname: {
      fontSize: moderateScale(17),
      fontWeight: '700',
      color: theme.text.primary,
      marginBottom: moderateScale(8),
      letterSpacing: -0.3,
    },
    favoriteQuote: {
      fontSize: moderateScale(14),
      lineHeight: moderateScale(20),
      color: theme.text.secondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: moderateScale(12),
      paddingHorizontal: moderateScale(16),
    },
    joinDate: {
      fontSize: moderateScale(14),
      color: theme.text.secondary,
      marginBottom: moderateScale(24),
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: emotionColors.primary,
      paddingVertical: moderateScale(14),
      paddingHorizontal: moderateScale(32),
      borderRadius: moderateScale(12),
      shadowColor: isDark ? '#000000' : '#000',
      shadowOffset: { width: 0, height: moderateScale(4) },
      shadowOpacity: isDark ? 0.1 : 0.2,
      shadowRadius: moderateScale(8),
      elevation: 4,
    },
    actionButtonIcon: {
      marginRight: moderateScale(8),
    },
    encouragementButton: {
      backgroundColor: emotionColors.encouragement,
    },
    actionButtonText: {
      fontSize: moderateScale(15),
      fontWeight: '600',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    privateProfileContainer: {
      backgroundColor: theme.bg.card,
      paddingVertical: moderateScale(80),
      paddingHorizontal: moderateScale(24),
      alignItems: 'center',
      borderBottomWidth: moderateScale(8),
      borderBottomColor: theme.bg.secondary,
    },
    privateProfileText: {
      fontSize: moderateScale(16),
      color: theme.text.secondary,
      marginTop: moderateScale(16),
    },
    statsCard: {
      backgroundColor: theme.bg.card,
      paddingVertical: moderateScale(24),
      paddingHorizontal: moderateScale(20),
      marginBottom: moderateScale(8),
    },
    sectionTitle: {
      fontSize: moderateScale(17),
      fontWeight: '700',
      color: theme.text.primary,
      marginBottom: moderateScale(16),
      letterSpacing: -0.3,
    },
    statsGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: moderateScale(20),
      fontWeight: '700',
      color: theme.text.primary,
      marginBottom: moderateScale(4),
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: Math.max(moderateScale(13), 12),
      color: theme.text.secondary,
      fontWeight: '500',
    },
    statDivider: {
      width: 1,
      height: moderateScale(40),
      backgroundColor: theme.bg.border,
    },
    emotionCard: {
      backgroundColor: theme.bg.card,
      paddingVertical: moderateScale(24),
      paddingHorizontal: moderateScale(20),
      marginBottom: moderateScale(8),
    },
    emotionTagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: moderateScale(12),
    },
    emotionTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(6),
      paddingVertical: moderateScale(8),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(20),
      borderWidth: 1,
    },
    emotionIcon: {
      fontSize: moderateScale(18),
    },
    emotionEmoji: {
      fontSize: moderateScale(20),
    },
    emotionName: {
      fontSize: moderateScale(14),
      fontWeight: '600',
    },
    emotionCount: {
      fontSize: Math.max(moderateScale(13), 12),
      color: theme.text.secondary,
      fontWeight: '500',
    },
    postsCard: {
      backgroundColor: theme.bg.card,
      paddingVertical: moderateScale(24),
      paddingHorizontal: moderateScale(20),
      marginBottom: moderateScale(8),
    },
    privateText: {
      fontSize: moderateScale(16),
      lineHeight: moderateScale(24),
      color: theme.text.secondary,
      textAlign: 'center',
      paddingVertical: moderateScale(20),
      fontWeight: '500',
    },
    emptyText: {
      fontSize: moderateScale(16),
      lineHeight: moderateScale(24),
      color: theme.text.secondary,
      textAlign: 'center',
      paddingVertical: moderateScale(32),
      fontWeight: '500',
    },
    postsLoadingContainer: {
      paddingVertical: moderateScale(40),
      alignItems: 'center',
      justifyContent: 'center',
    },
    postsLoadingText: {
      marginTop: moderateScale(12),
      fontSize: moderateScale(14),
      color: theme.text.secondary,
    },
    postsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: moderateScale(16),
    },
    postCount: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: emotionColors.primary,
    },
    postsContainer: {
      gap: moderateScale(16),
    },
    postItem: {
      backgroundColor: theme.bg.secondary,
      borderRadius: moderateScale(12),
      padding: moderateScale(14),
      borderWidth: 1,
      borderColor: theme.bg.border,
    },
    postHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: moderateScale(12),
    },
    postHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(8),
      flex: 1,
    },
    postEmotionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(4),
      backgroundColor: 'transparent',
      paddingVertical: moderateScale(4),
      paddingHorizontal: moderateScale(8),
      borderRadius: moderateScale(12),
      borderWidth: 1,
      borderColor: theme.bg.border,
    },
    postEmotionIcon: {
      fontSize: moderateScale(16),
    },
    postEmotionName: {
      fontSize: Math.max(moderateScale(12), 12),
      fontWeight: '600',
      color: theme.text.secondary,
    },
    postTypeBadge: {
      paddingVertical: moderateScale(6),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(16),
      borderWidth: 1.5,
    },
    myDayBadge: {
      backgroundColor: theme.colors.tint,
      borderColor: theme.colors.primary,
    },
    comfortBadge: {
      backgroundColor: isDark ? '#78350F' : '#FEF3C7',
      borderColor: isDark ? '#FBBF24' : '#F59E0B',
    },
    postTypeText: {
      fontSize: Math.max(moderateScale(13), 12),
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    myDayText: {
      color: theme.colors.accentText,
    },
    comfortText: {
      color: isDark ? '#FCD34D' : '#D97706',
    },
    postDate: {
      fontSize: Math.max(moderateScale(13), 12),
      color: theme.text.secondary,
      fontWeight: '500',
    },
    postContent: {
      fontSize: moderateScale(15),
      lineHeight: moderateScale(22),
      color: theme.text.primary,
      marginBottom: moderateScale(12),
      letterSpacing: -0.2,
    },
    postImage: {
      width: '100%',
      height: moderateScale(180),
      borderRadius: moderateScale(8),
      marginBottom: moderateScale(12),
      backgroundColor: theme.bg.border,
    },
    postStats: {
      flexDirection: 'row',
      gap: moderateScale(16),
      paddingTop: moderateScale(12),
      borderTopWidth: 1,
      borderTopColor: theme.bg.border,
    },
    postStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(4),
    },
    postStatText: {
      fontSize: Math.max(moderateScale(13), 12),
      color: theme.text.secondary,
      fontWeight: '500',
    },
    showMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: moderateScale(16),
      paddingVertical: moderateScale(12),
      backgroundColor: theme.bg.secondary,
      borderRadius: moderateScale(8),
      borderWidth: 1,
      borderColor: theme.bg.border,
    },
    showMoreButtonIcon: {
      marginLeft: moderateScale(6),
    },
    showMoreText: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: emotionColors.primary,
    },
    blockedBanner: {
      backgroundColor: isDark ? '#2D1F1F' : '#FFF3F3',
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(12),
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#5A3535' : '#FFCDD2',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    blockedBannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    blockedBannerIcon: {
      marginRight: moderateScale(8),
    },
    blockedBannerText: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: isDark ? '#FF8A80' : '#D32F2F',
      letterSpacing: -0.2,
    },
    unblockButton: {
      paddingVertical: moderateScale(6),
      paddingHorizontal: moderateScale(14),
      backgroundColor: isDark ? '#D32F2F' : '#FF3B30',
      borderRadius: moderateScale(6),
    },
    unblockButtonText: {
      fontSize: Math.max(moderateScale(13), 12),
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: moderateScale(32),
      backgroundColor: theme.bg.primary,
    },
    errorTitle: {
      fontSize: moderateScale(20),
      fontWeight: '700',
      color: theme.text.primary,
      marginTop: moderateScale(24),
      marginBottom: moderateScale(12),
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    errorMessage: {
      fontSize: moderateScale(15),
      lineHeight: moderateScale(22),
      color: theme.text.secondary,
      textAlign: 'center',
      marginBottom: moderateScale(32),
      letterSpacing: -0.2,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: emotionColors.primary,
      paddingVertical: moderateScale(14),
      paddingHorizontal: moderateScale(32),
      borderRadius: moderateScale(12),
      marginBottom: moderateScale(12),
      shadowColor: isDark ? '#000000' : '#000',
      shadowOffset: { width: 0, height: moderateScale(4) },
      shadowOpacity: isDark ? 0.1 : 0.2,
      shadowRadius: moderateScale(8),
      elevation: 4,
    },
    retryButtonIcon: {
      marginRight: moderateScale(8),
    },
    retryButtonText: {
      fontSize: moderateScale(16),
      fontWeight: '600',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    backButtonError: {
      paddingVertical: moderateScale(12),
      paddingHorizontal: moderateScale(24),
    },
    backButtonErrorText: {
      fontSize: moderateScale(15),
      fontWeight: '500',
      color: theme.text.secondary,
      letterSpacing: -0.2,
    },
  }), [theme, isDark, emotionColors, scale]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    challengeCount: 0,
    joinedDate: '',
  });
  const [emotionTags, setEmotionTags] = useState<EmotionTag[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [showEncouragementModal, setShowEncouragementModal] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [guestPromptConfig, setGuestPromptConfig] = useState({
    title: '로그인이 필요해요',
    message: '프로필을 보려면 로그인이 필요합니다'
  });

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isAuthenticated]);

  // 게시물은 loadUserProfile에서 함께 로드되므로 별도 useEffect 불필요

  const loadUserProfile = useCallback(async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      setError(null);
      setImageLoadError(false);
      if (__DEV__) console.log('🔄 [PERF] 프로필 로드 시작:', userId);

      // 🚀 1단계: 필수 데이터(프로필)만 먼저 로드
      const profileStart = Date.now();
      const profileResponse = await userService.getUserById(userId);
      if (__DEV__) console.log(`⏱️ [PERF] 프로필 조회: ${Date.now() - profileStart}ms`);

      if (profileResponse.status === 'success' && profileResponse.data) {
        setUserProfile(profileResponse.data);
        // ✅ 프로필만 로드되면 바로 화면 표시
        setLoading(false);
        if (__DEV__) console.log(`✅ [PERF] 화면 표시: ${Date.now() - startTime}ms`);
      } else {
        throw new Error('프로필을 불러올 수 없습니다.');
      }

      // 🚀 2단계: 나머지 데이터는 백그라운드에서 병렬 로드
      const secondaryStart = Date.now();
      const [statsResponse, emotionsResponse, blockedUsersResponse, postsResponse] = await Promise.allSettled([
        userService.getUserStatsByUserId(userId),
        userService.getUserEmotionsByUserId(userId),
        isAuthenticated ? blockService.getBlockedUsers() : Promise.resolve(null),
        userService.getUserPostsByUserId(userId, { page: 1, limit: 5 }),
      ]);
      if (__DEV__) console.log(`⏱️ [PERF] 부가 데이터: ${Date.now() - secondaryStart}ms`);

      // ✅ 통계 처리 (선택)
      if (statsResponse.status === 'fulfilled' && statsResponse.value?.status === 'success' && statsResponse.value.data) {
        setUserStats({
          totalPosts: statsResponse.value.data.totalPosts || 0,
          totalLikes: statsResponse.value.data.totalLikes || 0,
          totalComments: statsResponse.value.data.totalComments || 0,
          challengeCount: statsResponse.value.data.challengeCount || 0,
          joinedDate: statsResponse.value.data.joinedDate || '',
        });
        if (__DEV__) console.log('✅ 통계 로드 완료');
      } else if (__DEV__) {
        console.warn('⚠️ 통계 로드 실패 (계속 진행)');
      }

      // ✅ 감정 태그 처리 (선택)
      if (emotionsResponse.status === 'fulfilled' && emotionsResponse.value?.status === 'success' && emotionsResponse.value.data) {
        const emotionTagsData = emotionsResponse.value.data.map((stat: any) => ({
          emotion_id: stat.emotion_id,
          name: stat.emotion_name,
          icon: stat.emotion_icon,
          color: stat.emotion_color,
          count: stat.count,
        }));
        setEmotionTags(emotionTagsData);
        if (__DEV__) console.log('✅ 감정 태그 로드 완료');
      } else if (__DEV__) {
        console.warn('⚠️ 감정 태그 로드 실패 (계속 진행)');
      }

      // ✅ 차단 상태 처리 (선택)
      if (isAuthenticated && blockedUsersResponse.status === 'fulfilled' && blockedUsersResponse.value?.status === 'success' && blockedUsersResponse.value.data) {
        const isUserBlocked = blockService.isUserBlocked(blockedUsersResponse.value.data, userId);
        setIsBlocked(isUserBlocked);
        if (__DEV__ && isUserBlocked) console.log('ℹ️ 차단한 사용자');
      } else {
        setIsBlocked(false);
      }

      // ✅ 게시물 처리 (선택)
      if (postsResponse.status === 'fulfilled' && postsResponse.value?.status === 'success' && postsResponse.value.data) {
        setUserPosts(postsResponse.value.data.posts || []);
        if (__DEV__) console.log('✅ 게시물 로드 완료:', postsResponse.value.data.posts.length);
      } else if (__DEV__) {
        console.warn('⚠️ 게시물 로드 실패 (계속 진행)');
      }

      if (__DEV__) console.log(`🎉 [PERF] 전체 로드 완료: ${Date.now() - startTime}ms`);

    } catch (error: any) {
      if (__DEV__) console.error(`❌ [PERF] 프로필 로드 오류 (${Date.now() - startTime}ms):`, error);
      setLoading(false); // 에러 발생 시 로딩 상태 해제

      if (error.response?.status === 401 || error.response?.data?.code === 'TOKEN_EXPIRED') {
        setGuestPromptConfig({
          title: '로그인이 필요해요',
          message: error.message || '프로필을 보려면 로그인이 필요합니다'
        });
        setShowGuestPrompt(true);
      } else {
        setError(error.message || '사용자 정보를 불러올 수 없습니다.');
      }
    }
  }, [userId, isAuthenticated]);

  const handleBlockUser = useCallback(async () => {
    try {
      if (__DEV__) console.log('🚫 사용자 차단 시도:', userId);
      await blockService.blockUser(userId);
      setIsBlocked(true);
      if (__DEV__) console.log('✅ 사용자 차단 성공:', userId);

      showAlert.success('완료', '사용자를 차단했습니다.', [
        {
          text: '확인',
          onPress: () => {
            if (__DEV__) console.log('🔙 이전 화면으로 돌아가기');
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      if (__DEV__) console.error('❌ 사용자 차단 실패:', error);
      showAlert.error('오류', error.message || '차단에 실패했습니다.');
    }
  }, [userId, navigation]);

  const handleUnblockUser = useCallback(async () => {
    try {
      if (__DEV__) console.log('🔓 사용자 차단 해제 시도:', userId);
      await blockService.unblockUser(userId);
      setIsBlocked(false);
      if (__DEV__) console.log('✅ 사용자 차단 해제 성공:', userId);

      // 🚀 병렬 처리: 게시물 + 통계를 동시에 새로고침
      if (__DEV__) console.log('🔄 프로필 정보 새로고침 중...');

      const [postsResult, statsResult] = await Promise.allSettled([
        userService.getUserPostsByUserId(userId, { page: 1, limit: 5 }),
        userService.getUserStatsByUserId(userId),
      ]);

      // 게시물 업데이트
      if (postsResult.status === 'fulfilled' && postsResult.value?.status === 'success' && postsResult.value.data) {
        setUserPosts(postsResult.value.data.posts || []);
        if (__DEV__) console.log('✅ 게시물 업데이트 완료');
      }

      // 통계 업데이트
      if (statsResult.status === 'fulfilled' && statsResult.value?.status === 'success' && statsResult.value.data) {
        setUserStats({
          totalPosts: statsResult.value.data.totalPosts || 0,
          totalLikes: statsResult.value.data.totalLikes || 0,
          totalComments: statsResult.value.data.totalComments || 0,
          challengeCount: statsResult.value.data.challengeCount || 0,
          joinedDate: statsResult.value.data.joinedDate || '',
        });
        if (__DEV__) console.log('✅ 통계 업데이트 완료');
      }

      showAlert.success('완료', '차단을 해제했습니다.');
    } catch (error: any) {
      if (__DEV__) console.error('❌ 사용자 차단 해제 실패:', error);
      showAlert.error('오류', error.message || '차단 해제에 실패했습니다.');
    }
  }, [userId]);

  const loadUserPosts = useCallback(async () => {
    if (postsLoading) return;

    try {
      setPostsLoading(true);
      if (__DEV__) console.log('🔄 사용자 게시물 로드 중:', userId);

      const postsResponse = await userService.getUserPostsByUserId(userId, {
        page: 1,
        limit: 5,
      });

      if (postsResponse.status === 'success' && postsResponse.data) {
        setUserPosts(postsResponse.data.posts || []);
        if (__DEV__) console.log('✅ 사용자 게시물 로드 완료:', postsResponse.data.posts.length);
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ 사용자 게시물 로드 오류:', error);
      // 게시물은 선택적이므로 오류가 나도 계속 진행
    } finally {
      setPostsLoading(false);
    }
  }, [userId, postsLoading]);

  const handleReportUser = () => {
    showAlert.info('준비 중', '신고 기능은 곧 제공될 예정입니다.');
  };

  const renderHeader = () => (
    <View style={headerStyles.header}>
      <TouchableOpacity
        style={headerStyles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={theme.text.primary} />
      </TouchableOpacity>

      <RNText style={headerStyles.headerTitle}>프로필</RNText>

      <TouchableOpacity
        style={headerStyles.moreButton}
        onPress={() => setShowOptionsSheet(true)}
      >
        <Icon name="ellipsis-vertical" size={24} color={theme.text.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderProfileInfo = () => {
    if (!userProfile) return null;

    const showProfile = userProfile.privacy_settings?.show_profile ?? true;

    if (!showProfile) {
      return (
        <View style={styles.privateProfileContainer}>
          <Icon name="lock-closed" size={48} color={theme.text.secondary} />
          <RNText style={styles.privateProfileText}>
            비공개 프로필입니다
          </RNText>
        </View>
      );
    }

    return (
      <View style={styles.profileInfoContainer}>
        {/* 프로필 이미지 */}
        <View style={styles.profileImageContainer}>
          {userProfile.profile_image_url && !imageLoadError ? (
            <>
              <FastImage
                source={{
                  uri: userProfile.profile_image_url,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.profileImage}
                resizeMode={FastImage.resizeMode.cover}
                onLoad={() => {
                  if (__DEV__) console.log('✅ 프로필 이미지 로드 성공');
                  setProfileImageLoading(false);
                  setImageLoadError(false);
                }}
                onError={(error) => {
                  if (__DEV__) console.error('❌ 프로필 이미지 로드 실패');
                  setProfileImageLoading(false);
                  setImageLoadError(true);
                }}
                onLoadStart={() => {
                  if (__DEV__) console.log('🔄 프로필 이미지 로드 시작');
                  setProfileImageLoading(true);
                }}
              />
              {profileImageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color={theme.text.secondary} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Icon name="person" size={moderateScale(48)} color={theme.text.secondary} />
            </View>
          )}
        </View>

        {/* 닉네임 */}
        <RNText style={styles.nickname}>
          {userProfile.nickname || userProfile.username}
        </RNText>

        {/* 좋아하는 명언/문구 */}
        {userProfile.favorite_quote && (
          <RNText style={styles.favoriteQuote}>
            "{userProfile.favorite_quote}"
          </RNText>
        )}

        {/* 가입일 */}
        <RNText style={styles.joinDate}>
          가입일: {new Date(userProfile.created_at).toLocaleDateString('ko-KR')}
        </RNText>

        {/* 액션 버튼 - 익명 격려만 표시 */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.encouragementButton]}
            onPress={() => setShowEncouragementModal(true)}
          >
            <Icon name="heart-outline" size={20} color="#FFFFFF" style={styles.actionButtonIcon} />
            <RNText style={styles.actionButtonText}>익명으로 격려하기</RNText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStats = () => {
    if (!userProfile?.privacy_settings?.show_profile) return null;

    const showStats = userProfile.privacy_settings?.show_posts ?? true;

    if (!showStats) {
      return (
        <View style={styles.statsCard}>
          <RNText style={styles.privateText}>
            활동 통계가 비공개 상태입니다
          </RNText>
        </View>
      );
    }

    return (
      <View style={styles.statsCard}>
        <RNText style={styles.sectionTitle}>활동 통계</RNText>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <RNText style={styles.statValue}>{userStats.totalPosts}</RNText>
            <RNText style={styles.statLabel}>게시물</RNText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <RNText style={styles.statValue}>{userStats.totalLikes}</RNText>
            <RNText style={styles.statLabel}>받은 공감</RNText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <RNText style={styles.statValue}>{userStats.challengeCount}</RNText>
            <RNText style={styles.statLabel}>챌린지</RNText>
          </View>
        </View>
      </View>
    );
  };

  const renderEmotionStats = () => {
    if (!userProfile?.privacy_settings?.show_profile) return null;

    const showEmotions = userProfile.privacy_settings?.show_emotions ?? true;

    if (!showEmotions) {
      return (
        <View style={styles.emotionCard}>
          <RNText style={styles.privateText}>
            감정 통계가 비공개 상태입니다
          </RNText>
        </View>
      );
    }

    if (emotionTags.length === 0) {
      return (
        <View style={styles.emotionCard}>
          <RNText style={styles.sectionTitle}>감정 태그</RNText>
          <RNText style={styles.emptyText}>
            아직 감정을 기록하지 않았습니다
          </RNText>
        </View>
      );
    }

    return (
      <View style={styles.emotionCard}>
        <RNText style={styles.sectionTitle}>자주 사용하는 감정</RNText>

        <View style={styles.emotionTagsContainer}>
          {emotionTags.slice(0, 5).map((tag, index) => {
            // 아이콘이 emoji인지 MaterialCommunityIcons 이름인지 확인
            const isEmoji = tag.icon && (tag.icon.length <= 4 || /[\u{1F600}-\u{1F64F}]/u.test(tag.icon));

            return (
              <View
                key={tag.emotion_id}
                style={[
                  styles.emotionTag,
                  { backgroundColor: tag.color + '20', borderColor: tag.color }
                ]}
              >
                {isEmoji ? (
                  <EmotionIcon emotionId={tag.emotion_id} label={tag.name} size={moderateScale(22)} />
                ) : (
                  <MaterialCommunityIcons
                    name={tag.icon || 'emoticon-happy-outline'}
                    size={20}
                    color={tag.color}
                  />
                )}
                <RNText style={[styles.emotionName, { color: getReadableEmotionColor(tag.color, isDark, theme.text.primary) }]}>
                  {tag.name}
                </RNText>
                <RNText style={styles.emotionCount}>{tag.count}회</RNText>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) {
      return '날짜 없음';
    }

    let date: Date;

    // Date 객체인 경우
    if (dateString instanceof Date) {
      date = dateString;
    }
    // 문자열인 경우
    else if (typeof dateString === 'string') {
      date = new Date(dateString);
    }
    // 그 외의 경우
    else {
      return '날짜 형식 오류';
    }

    // Invalid Date 체크
    if (isNaN(date.getTime())) {
      return '잘못된 날짜';
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderPosts = () => {
    if (!userProfile?.privacy_settings?.show_profile) return null;

    const showPosts = userProfile.privacy_settings?.show_posts ?? true;

    if (!showPosts) {
      return (
        <View style={styles.postsCard}>
          <RNText style={styles.privateText}>
            게시물이 비공개 상태입니다
          </RNText>
        </View>
      );
    }

    if (postsLoading) {
      return (
        <View style={styles.postsCard}>
          <SkeletonLoader width={80} height={moderateScale(17)} style={{ marginBottom: moderateScale(16) }} />
          {[1, 2].map((i) => (
            <View key={i} style={[styles.postItem, { marginBottom: moderateScale(16) }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: moderateScale(12) }}>
                <SkeletonLoader width={100} height={moderateScale(24)} borderRadius={moderateScale(12)} />
                <SkeletonLoader width={70} height={moderateScale(13)} />
              </View>
              <SkeletonLoader width="100%" height={moderateScale(15)} style={{ marginBottom: moderateScale(8) }} />
              <SkeletonLoader width="80%" height={moderateScale(15)} />
            </View>
          ))}
        </View>
      );
    }

    if (userPosts.length === 0) {
      return (
        <View style={styles.postsCard}>
          <RNText style={styles.sectionTitle}>게시물</RNText>
          <RNText style={styles.emptyText}>
            공개된 게시물이 없습니다
          </RNText>
        </View>
      );
    }

    const displayedPosts = showAllPosts ? userPosts : userPosts.slice(0, 3);

    return (
      <View style={styles.postsCard}>
        <View style={styles.postsHeader}>
          <RNText style={styles.sectionTitle}>게시물</RNText>
          <RNText style={styles.postCount}>{userPosts.length}개</RNText>
        </View>

        <View style={styles.postsContainer}>
          {displayedPosts.map((post) => (
            <TouchableOpacity
              key={post.post_id}
              style={styles.postItem}
              activeOpacity={0.7}
              onPress={() => {
                if (__DEV__) console.log('🔍 게시물 클릭:', post.post_id);
                navigation.navigate('PostDetail', {
                  postId: post.post_id,
                  sourceScreen: 'profile',
                  enableSwipe: true
                });
              }}
            >
              <View style={styles.postHeader}>
                <View style={styles.postHeaderLeft}>
                  {/* 게시물 타입 배지 - 앞쪽으로 이동 */}
                  <View style={[
                    styles.postTypeBadge,
                    post.post_type === 'my_day' ? styles.myDayBadge : styles.comfortBadge
                  ]}>
                    <RNText style={[
                      styles.postTypeText,
                      post.post_type === 'my_day' ? styles.myDayText : styles.comfortText
                    ]}>
                      {post.post_type === 'my_day' ? '나의 하루' : '위로와 공감'}
                    </RNText>
                  </View>

                  {/* 감정 배지 */}
                  <View style={styles.postEmotionBadge}>
                    {post.emotions && post.emotions.length > 0 ? (
                      (() => {
                        const emotion = post.emotions[0];
                        const isEmoji = emotion.icon && (emotion.icon.length <= 4 || /[\u{1F600}-\u{1F64F}]/u.test(emotion.icon));

                        return isEmoji ? (
                          <EmotionIcon emotionId={emotion.emotion_id} label={emotion.name} size={moderateScale(18)} />
                        ) : (
                          <MaterialCommunityIcons
                            name={emotion.icon || 'emoticon-happy-outline'}
                            size={16}
                            color={emotion.color}
                          />
                        );
                      })()
                    ) : (
                      <RNText style={styles.postEmotionIcon}>💭</RNText>
                    )}
                    <RNText style={styles.postEmotionName}>
                      {post.emotions && post.emotions.length > 0 ? post.emotions[0].name : '일상'}
                    </RNText>
                  </View>
                </View>

                <RNText style={styles.postDate}>
                  {formatDate(post.created_at)}
                </RNText>
              </View>

              <RNText style={styles.postContent} numberOfLines={3}>
                {post.content}
              </RNText>

              {post.image_url && (
                <FastImage
                  source={{
                    uri: post.image_url,
                    priority: FastImage.priority.low,
                    cache: FastImage.cacheControl.web,
                  }}
                  style={styles.postImage}
                  resizeMode={FastImage.resizeMode.cover}
                  onError={() => {
                    if (__DEV__) console.warn('게시물 이미지 로드 실패:', post.post_id);
                  }}
                />
              )}

              <View style={styles.postStats}>
                <View style={styles.postStatItem}>
                  <Icon name="heart" size={14} color={emotionColors.error} />
                  <RNText style={styles.postStatText}>
                    {post.like_count || 0}
                  </RNText>
                </View>
                <View style={styles.postStatItem}>
                  <Icon name="chatbubble" size={14} color={emotionColors.primary} />
                  <RNText style={styles.postStatText}>
                    {post.comment_count || 0}
                  </RNText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {userPosts.length > 3 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAllPosts(!showAllPosts)}
          >
            <RNText style={styles.showMoreText}>
              {showAllPosts ? '접기' : `더보기 (${userPosts.length - 3}개)`}
            </RNText>
            <Icon
              name={showAllPosts ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={emotionColors.primary}
              style={styles.showMoreButtonIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    if (__DEV__) console.log('🎨 [RENDER] 스켈레톤 화면 렌더링');
    const loadingStyles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.bg.primary,
      },
    });

    return (
      <View style={loadingStyles.container}>
        {renderHeader()}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <RNText style={{ marginTop: moderateScale(16), color: theme.text.secondary }}>
            프로필 로드 중...
          </RNText>
        </View>
      </View>
    );
  }

  if (__DEV__) console.log('🎨 [RENDER] 정상 화면 렌더링', { hasProfile: !!userProfile });

  // 에러 화면
  if (error) {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.bg.primary,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(12),
        paddingTop: moderateScale(48),
        backgroundColor: theme.bg.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.bg.border,
      },
      backButton: {
        padding: moderateScale(8),
      },
      headerTitle: {
        fontSize: moderateScale(17),
        fontWeight: '700',
        color: theme.text.primary,
        letterSpacing: -0.3,
      },
      moreButton: {
        padding: moderateScale(8),
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(32),
        backgroundColor: theme.bg.primary,
      },
      errorTitle: {
        fontSize: moderateScale(20),
        fontWeight: '700',
        color: theme.text.primary,
        marginTop: moderateScale(24),
        marginBottom: moderateScale(12),
        textAlign: 'center',
        letterSpacing: -0.5,
      },
      errorMessage: {
        fontSize: moderateScale(15),
        lineHeight: moderateScale(22),
        color: theme.text.secondary,
        textAlign: 'center',
        marginBottom: moderateScale(32),
        letterSpacing: -0.2,
      },
      retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: emotionColors.primary,
        paddingVertical: moderateScale(14),
        paddingHorizontal: moderateScale(32),
        borderRadius: moderateScale(12),
        marginBottom: moderateScale(12),
        shadowColor: isDark ? '#000000' : '#000',
        shadowOffset: { width: 0, height: moderateScale(4) },
        shadowOpacity: isDark ? 0.1 : 0.2,
        shadowRadius: moderateScale(8),
        elevation: 4,
      },
      retryButtonIcon: {
        marginRight: moderateScale(8),
      },
      retryButtonText: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: -0.3,
      },
      backButtonError: {
        paddingVertical: moderateScale(12),
        paddingHorizontal: moderateScale(24),
      },
      backButtonErrorText: {
        fontSize: moderateScale(15),
        fontWeight: '500',
        color: theme.text.secondary,
        letterSpacing: -0.2,
      },
    });

    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={moderateScale(64)} color={emotionColors.error} />
          <RNText style={styles.errorTitle}>프로필을 불러올 수 없습니다</RNText>
          <RNText style={styles.errorMessage}>{error}</RNText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadUserProfile}
            activeOpacity={0.7}
          >
            <Icon name="refresh" size={moderateScale(20)} color="#FFFFFF" style={styles.retryButtonIcon} />
            <RNText style={styles.retryButtonText}>다시 시도</RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButtonError}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <RNText style={styles.backButtonErrorText}>돌아가기</RNText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* 차단된 사용자 배너 */}
      {isBlocked && (
        <View style={styles.blockedBanner}>
          <View style={styles.blockedBannerContent}>
            <Icon name="ban" size={moderateScale(20)} color="#FF3B30" style={styles.blockedBannerIcon} />
            <RNText style={styles.blockedBannerText}>
              이 사용자를 차단했습니다
            </RNText>
          </View>
          <TouchableOpacity
            style={styles.unblockButton}
            onPress={handleUnblockUser}
            activeOpacity={0.7}
          >
            <RNText style={styles.unblockButtonText}>차단 해제</RNText>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileInfo()}
        {renderStats()}
        {renderEmotionStats()}
        {renderPosts()}
      </ScrollView>

      {/* 익명 격려 메시지 모달 */}
      {userProfile && (
        <SendEncouragementModal
          visible={showEncouragementModal}
          onClose={() => setShowEncouragementModal(false)}
          toUserId={userId}
          toUserNickname={userProfile.nickname || userProfile.username}
        />
      )}

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
        isDarkMode={isDark}
      />

      {/* 옵션 바텀시트 */}
      <BottomSheetAlert
        visible={showOptionsSheet}
        onClose={() => setShowOptionsSheet(false)}
        buttons={[
          {
            text: isBlocked ? '차단 해제' : '차단',
            style: 'destructive',
            onPress: () => {
              setShowOptionsSheet(false);
              if (isBlocked) {
                handleUnblockUser();
              } else {
                handleBlockUser();
              }
            },
          },
          {
            text: '신고',
            onPress: () => {
              setShowOptionsSheet(false);
              handleReportUser();
            },
          },
          {
            text: '취소',
            style: 'cancel',
          },
        ]}
      />
    </View>
  );
});

export default UserProfileScreen;
