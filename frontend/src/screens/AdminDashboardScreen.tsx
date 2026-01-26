// src/screens/AdminDashboardScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
  useWindowDimensions,
  Animated,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import reportService from '../services/api/reportService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { FONT_SIZES, SPACING, moderateScale, scale, verticalScale } from '../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

interface ReportStats {
  status: string;
  data: {
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
    total: number;
    by_type: {
      challenge: {
        pending: number;
        reviewed: number;
        resolved: number;
        dismissed: number;
        total: number;
      };
      post: {
        pending: number;
        reviewed: number;
        resolved: number;
        dismissed: number;
        total: number;
      };
    };
  };
}

const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const { theme, isDark } = useModernTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [stats, setStats] = useState<ReportStats['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  const colors = useMemo(() => ({
    background: isDark ? '#0A0A0F' : '#F8FAFC',
    card: isDark ? '#1A1A24' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A2E',
    textSecondary: isDark ? '#C0C0D0' : '#64748B',
    textTertiary: isDark ? '#707080' : '#94A3B8',
    border: isDark ? '#2A2A3A' : '#E2E8F0',
    headerBg: isDark ? '#1A1A24' : '#FFFFFF',
    pending: isDark ? '#FF6B6B' : '#EF4444',
    pendingBg: isDark ? 'rgba(255, 107, 107, 0.12)' : 'rgba(239, 68, 68, 0.08)',
    pendingGradient: isDark ? ['#FF6B6B', '#FF8E8E'] : ['#EF4444', '#F87171'],
    reviewed: isDark ? '#FFD93D' : '#F59E0B',
    reviewedBg: isDark ? 'rgba(255, 217, 61, 0.12)' : 'rgba(245, 158, 11, 0.08)',
    reviewedGradient: isDark ? ['#FFD93D', '#FFE066'] : ['#F59E0B', '#FBBF24'],
    resolved: isDark ? '#6BCB77' : '#10B981',
    resolvedBg: isDark ? 'rgba(107, 203, 119, 0.12)' : 'rgba(16, 185, 129, 0.08)',
    resolvedGradient: isDark ? ['#6BCB77', '#8ED99A'] : ['#10B981', '#34D399'],
    dismissed: isDark ? '#9CA3AF' : '#6B7280',
    dismissedBg: isDark ? 'rgba(156, 163, 175, 0.12)' : 'rgba(107, 114, 128, 0.08)',
    dismissedGradient: isDark ? ['#9CA3AF', '#B0B7C0'] : ['#6B7280', '#9CA3AF'],
    challengeIcon: isDark ? '#A78BFA' : '#8B5CF6',
    challengeGradient: isDark ? ['#A78BFA', '#C4B5FD'] : ['#8B5CF6', '#A78BFA'],
    postIcon: isDark ? '#6BCB77' : '#10B981',
    postGradient: isDark ? ['#6BCB77', '#8ED99A'] : ['#10B981', '#34D399'],
    cardShadow: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.08)',
    accentGradient: isDark ? ['#667EEA', '#764BA2'] : ['#667EEA', '#764BA2'],
  }), [isDark]);

  const loadStats = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const CACHE_TIME = 5 * 60 * 1000;

    if (!forceRefresh && stats && (now - lastFetch < CACHE_TIME)) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const response = await reportService.getReportStats();
      setStats(response.data);
      setLastFetch(now);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (err: unknown) {
      if (__DEV__) console.error('통계 로드 오류:', err?.message || '알 수 없는 오류');
      setError(err?.message || '통계를 불러올 수 없습니다');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stats, lastFetch, fadeAnim]);

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats(true);
  }, [loadStats]);

  const StatCard = React.memo(({
    icon,
    label,
    count,
    color,
    bgColor,
    gradient,
    onPress,
  }: {
    icon: string;
    label: string;
    count: number;
    color: string;
    bgColor: string;
    gradient: string[];
    onPress?: () => void;
  }) => {
    const scaleAnim = useMemo(() => new Animated.Value(1), []);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    };

    return (
    <Animated.View style={[styles.statCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.statCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? `${color}20` : `${color}15`,
            ...Platform.select({
              ios: {
                shadowColor: color,
                shadowOffset: { width: 0, height: verticalScale(4) },
                shadowOpacity: isDark ? 0.25 : 0.15,
                shadowRadius: moderateScale(12),
              },
              android: {
                elevation: isDark ? 6 : 4,
              },
            }),
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${count}건`}
        accessibilityHint="탭하여 상세 목록 보기"
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <MaterialCommunityIcons name={icon} size={moderateScale(26)} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.statCount, { color }]} allowFontScaling={false}>{count}</Text>
        <Text style={[styles.statLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
    );
  });

  const SkeletonCard = () => (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: moderateScale(40), height: moderateScale(32) }]} />
      <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: moderateScale(60), height: moderateScale(16) }]} />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
          <View style={styles.backButton} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>관리자 대시보드</Text>
          <View style={styles.refreshButton} />
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>신고 통계</Text>
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="뒤로 가기">
            <MaterialCommunityIcons name="arrow-left" size={moderateScale(24)} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>관리자 대시보드</Text>
          <View style={styles.refreshButton} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={moderateScale(64)} color={colors.textSecondary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>오류가 발생했습니다</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.challengeIcon }]}
            onPress={() => {
              setLoading(true);
              loadStats(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <MaterialCommunityIcons name="refresh" size={moderateScale(20)} color="#FFFFFF" />
            <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
            ...Platform.select({
              ios: {
                shadowColor: isDark ? '#000000' : '#000000',
                shadowOffset: { width: 0, height: verticalScale(2) },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: moderateScale(8),
              },
              android: {
                elevation: isDark ? 6 : 4,
              },
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={moderateScale(24)}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          관리자 대시보드
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="새로고침"
        >
          <MaterialCommunityIcons
            name="refresh"
            size={moderateScale(24)}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.challengeIcon}
            colors={[colors.challengeIcon]}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
        {stats?.total === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={colors.accentGradient}
              style={styles.emptyIconContainer}
            >
              <MaterialCommunityIcons name="clipboard-check-outline" size={moderateScale(48)} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>신고 내역이 없습니다</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              처리할 신고가 없습니다
            </Text>
          </View>
        ) : (
          <>
        {/* 총계 헤더 */}
        <View style={styles.totalHeader}>
          <LinearGradient
            colors={colors.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.totalHeaderGradient}
          >
            <View style={styles.totalHeaderContent}>
              <View style={styles.totalIconContainer}>
                <MaterialCommunityIcons name="shield-check" size={moderateScale(32)} color="#FFFFFF" />
              </View>
              <View style={styles.totalTextContainer}>
                <Text style={styles.totalLabel}>전체 신고</Text>
                <Text style={styles.totalCount}>{stats?.total || 0}건</Text>
              </View>
            </View>
            <View style={styles.totalSubStats}>
              <View style={styles.totalSubStatItem}>
                <Text style={styles.totalSubStatValue}>{stats?.pending || 0}</Text>
                <Text style={styles.totalSubStatLabel}>대기</Text>
              </View>
              <View style={[styles.totalSubStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={styles.totalSubStatItem}>
                <Text style={styles.totalSubStatValue}>{stats?.reviewed || 0}</Text>
                <Text style={styles.totalSubStatLabel}>검토</Text>
              </View>
              <View style={[styles.totalSubStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={styles.totalSubStatItem}>
                <Text style={styles.totalSubStatValue}>{(stats?.resolved || 0) + (stats?.dismissed || 0)}</Text>
                <Text style={styles.totalSubStatLabel}>완료</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              상태별 현황
            </Text>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon="alert-circle-outline"
              label="대기중"
              count={stats?.pending || 0}
              color={colors.pending}
              bgColor={colors.pendingBg}
              gradient={colors.pendingGradient}
              onPress={() =>
                navigation.navigate('AdminReportList', { status: 'pending' })
              }
            />
            <StatCard
              icon="eye-outline"
              label="검토중"
              count={stats?.reviewed || 0}
              color={colors.reviewed}
              bgColor={colors.reviewedBg}
              gradient={colors.reviewedGradient}
              onPress={() =>
                navigation.navigate('AdminReportList', { status: 'reviewed' })
              }
            />
            <StatCard
              icon="check-circle-outline"
              label="처리완료"
              count={stats?.resolved || 0}
              color={colors.resolved}
              bgColor={colors.resolvedBg}
              gradient={colors.resolvedGradient}
              onPress={() =>
                navigation.navigate('AdminReportList', { status: 'resolved' })
              }
            />
            <StatCard
              icon="close-circle-outline"
              label="기각됨"
              count={stats?.dismissed || 0}
              color={colors.dismissed}
              bgColor={colors.dismissedBg}
              gradient={colors.dismissedGradient}
              onPress={() =>
                navigation.navigate('AdminReportList', { status: 'dismissed' })
              }
            />
          </View>
        </View>

        {/* 타입별 통계 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              카테고리별 현황
            </Text>
          </View>

          {/* 챌린지 신고 */}
          <TouchableOpacity
            style={[
              styles.typeCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? `${colors.challengeIcon}20` : `${colors.challengeIcon}15`,
                ...Platform.select({
                  ios: {
                    shadowColor: colors.challengeIcon,
                    shadowOffset: { width: 0, height: verticalScale(4) },
                    shadowOpacity: isDark ? 0.2 : 0.1,
                    shadowRadius: moderateScale(12),
                  },
                  android: {
                    elevation: isDark ? 4 : 3,
                  },
                }),
              },
            ]}
            onPress={() =>
              navigation.navigate('AdminReportList', { item_type: 'challenge' })
            }
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="감정 챌린지 신고 내역"
          >
            <View style={styles.typeHeader}>
              <LinearGradient
                colors={colors.challengeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.typeIconContainer}
              >
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={moderateScale(22)}
                  color="#FFFFFF"
                />
              </LinearGradient>
              <View style={styles.typeInfo}>
                <Text style={[styles.typeTitle, { color: colors.text }]}>
                  감정 챌린지
                </Text>
                <Text style={[styles.typeCount, { color: colors.textSecondary }]}>
                  총 {stats?.by_type?.challenge?.total || 0}건
                </Text>
              </View>
              <View style={[styles.typeArrowContainer, { backgroundColor: `${colors.challengeIcon}10` }]}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={moderateScale(20)}
                  color={colors.challengeIcon}
                />
              </View>
            </View>
            <View style={[styles.typeStats, { borderTopColor: colors.border }]}>
              <View style={styles.typeStat}>
                <Text style={[styles.typeStatValue, { color: isDark ? '#FF6B6B' : '#EF4444' }]}>
                  {stats?.by_type?.challenge?.pending || 0}
                </Text>
                <Text style={[styles.typeStatLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  대기
                </Text>
              </View>
              <View style={[styles.typeStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.typeStat}>
                <Text style={[styles.typeStatValue, { color: isDark ? '#FFD93D' : '#F59E0B' }]}>
                  {stats?.by_type?.challenge?.reviewed || 0}
                </Text>
                <Text style={[styles.typeStatLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  검토
                </Text>
              </View>
              <View style={[styles.typeStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.typeStat}>
                <Text style={[styles.typeStatValue, { color: isDark ? '#6BCB77' : '#10B981' }]}>
                  {stats?.by_type?.challenge?.resolved || 0}
                </Text>
                <Text style={[styles.typeStatLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  완료
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 게시물 신고 */}
          <TouchableOpacity
            style={[
              styles.typeCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? `${colors.postIcon}20` : `${colors.postIcon}15`,
                ...Platform.select({
                  ios: {
                    shadowColor: colors.postIcon,
                    shadowOffset: { width: 0, height: verticalScale(4) },
                    shadowOpacity: isDark ? 0.2 : 0.1,
                    shadowRadius: moderateScale(12),
                  },
                  android: {
                    elevation: isDark ? 4 : 3,
                  },
                }),
              },
            ]}
            onPress={() =>
              navigation.navigate('AdminReportList', { item_type: 'post' })
            }
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="게시물 신고 내역"
          >
            <View style={styles.typeHeader}>
              <LinearGradient
                colors={colors.postGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.typeIconContainer}
              >
                <MaterialCommunityIcons
                  name="text-box-outline"
                  size={moderateScale(22)}
                  color="#FFFFFF"
                />
              </LinearGradient>
              <View style={styles.typeInfo}>
                <Text style={[styles.typeTitle, { color: colors.text }]}>
                  나의하루 · 위로와 공감
                </Text>
                <Text style={[styles.typeCount, { color: colors.textSecondary }]}>
                  총 {stats?.by_type?.post?.total || 0}건
                </Text>
              </View>
              <View style={[styles.typeArrowContainer, { backgroundColor: `${colors.postIcon}10` }]}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={moderateScale(20)}
                  color={colors.postIcon}
                />
              </View>
            </View>
            <View style={[styles.typeStats, { borderTopColor: colors.border }]}>
              <View style={styles.typeStat}>
                <Text style={[styles.typeStatValue, { color: isDark ? '#FF6B6B' : '#EF4444' }]}>
                  {stats?.by_type?.post?.pending || 0}
                </Text>
                <Text style={[styles.typeStatLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  대기
                </Text>
              </View>
              <View style={[styles.typeStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.typeStat}>
                <Text style={[styles.typeStatValue, { color: isDark ? '#FFD93D' : '#F59E0B' }]}>
                  {stats?.by_type?.post?.reviewed || 0}
                </Text>
                <Text style={[styles.typeStatLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  검토
                </Text>
              </View>
              <View style={[styles.typeStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.typeStat}>
                <Text style={[styles.typeStatValue, { color: isDark ? '#6BCB77' : '#10B981' }]}>
                  {stats?.by_type?.post?.resolved || 0}
                </Text>
                <Text style={[styles.typeStatLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  완료
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 빠른 액션 */}
        <View style={[styles.section, { paddingBottom: SPACING.xl }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              빠른 액션
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? `${colors.challengeIcon}20` : `${colors.challengeIcon}15`,
                ...Platform.select({
                  ios: {
                    shadowColor: colors.challengeIcon,
                    shadowOffset: { width: 0, height: verticalScale(4) },
                    shadowOpacity: isDark ? 0.2 : 0.1,
                    shadowRadius: moderateScale(12),
                  },
                  android: {
                    elevation: isDark ? 4 : 3,
                  },
                }),
              },
            ]}
            onPress={() => navigation.navigate('AdminReportList', {})}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="전체 신고 목록 보기"
          >
            <LinearGradient
              colors={colors.accentGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionIconContainer}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={moderateScale(20)}
                color="#FFFFFF"
              />
            </LinearGradient>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              전체 신고 목록 보기
            </Text>
            <View style={[styles.actionArrowContainer, { backgroundColor: `${colors.challengeIcon}10` }]}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={moderateScale(18)}
                color={colors.challengeIcon}
              />
            </View>
          </TouchableOpacity>
        </View>
          </>
        )}
        </Animated.View>
      </ScrollView>
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
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.body,
    fontFamily: 'Pretendard-Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingTop:
      Platform.OS === 'android'
        ? (StatusBar.currentHeight || 0) + SPACING.sm
        : moderateScale(48),
    borderBottomWidth: 0,
  },
  backButton: {
    padding: SPACING.xxs,
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.h4,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
  },
  refreshButton: {
    padding: SPACING.xxs,
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  // 총계 헤더 스타일
  totalHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  totalHeaderGradient: {
    borderRadius: moderateScale(20),
    padding: SPACING.lg,
  },
  totalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  totalIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  totalTextContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: moderateScale(2),
  },
  totalCount: {
    fontSize: FONT_SIZES.h2,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  totalSubStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  totalSubStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  totalSubStatValue: {
    fontSize: FONT_SIZES.h4,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  totalSubStatLabel: {
    fontSize: FONT_SIZES.small,
    fontFamily: 'Pretendard-Medium',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: moderateScale(2),
  },
  totalSubStatDivider: {
    width: 1,
    height: moderateScale(24),
  },
  section: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(28),
    paddingBottom: moderateScale(12),
  },
  sectionHeader: {
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    fontSize: FONT_SIZES.h5,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: moderateScale(-6),
  },
  statCardWrapper: {
    width: '50%',
    paddingHorizontal: moderateScale(6),
    marginBottom: moderateScale(16),
  },
  statCard: {
    padding: SPACING.md,
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(130),
    borderWidth: 1,
  },
  iconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statCount: {
    fontSize: FONT_SIZES.h2,
    fontFamily: 'Pretendard-ExtraBold',
    marginBottom: moderateScale(2),
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.1,
  },
  typeCard: {
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
    borderWidth: 1,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeIconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: FONT_SIZES.body,
    fontFamily: 'Pretendard-Bold',
    marginBottom: moderateScale(2),
    letterSpacing: -0.2,
  },
  typeCount: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Medium',
  },
  typeArrowContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  typeStat: {
    alignItems: 'center',
    flex: 1,
  },
  typeStatDivider: {
    width: 1,
    height: moderateScale(28),
  },
  typeStatLabel: {
    fontSize: FONT_SIZES.small,
    fontFamily: 'Pretendard-Medium',
    marginTop: moderateScale(2),
  },
  typeStatValue: {
    fontSize: FONT_SIZES.h5,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: moderateScale(16),
    borderWidth: 1,
  },
  actionIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  actionArrowContainer: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    fontSize: FONT_SIZES.h3,
    fontFamily: 'Pretendard-Bold',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZES.body * 1.5,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: moderateScale(12),
  },
  retryButtonText: {
    fontSize: FONT_SIZES.body,
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: SPACING.xs,
  },
  skeletonLine: {
    borderRadius: moderateScale(8),
    marginVertical: moderateScale(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZES.h3,
    fontFamily: 'Pretendard-Bold',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    lineHeight: FONT_SIZES.body * 1.5,
  },
});

export default AdminDashboardScreen;
