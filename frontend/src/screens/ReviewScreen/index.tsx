import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useModernTheme } from '../../hooks/useModernTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import reviewService, { ReviewSummaryResponse } from '../../services/api/reviewService';
import { FONT_SIZES } from '../../constants';
import { getScale } from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 지연 로딩 컴포넌트 (성능 최적화)
const CommunityTemperature = lazy(() => import('./sections/CommunityTemperature').then(m => ({ default: m.CommunityTemperature })));
const PersonalTemperature = lazy(() => import('./sections/PersonalTemperature').then(m => ({ default: m.PersonalTemperature })));
const GlimmeringMoments = lazy(() => import('./sections/GlimmeringMoments').then(m => ({ default: m.GlimmeringMoments })));
const SimilarMoment = lazy(() => import('./sections/SimilarMoment').then(m => ({ default: m.SimilarMoment })));
const EmotionTimeline = lazy(() => import('./sections/EmotionTimeline').then(m => ({ default: m.EmotionTimeline })));
const StreakBadge = lazy(() => import('./sections/StreakBadge').then(m => ({ default: m.StreakBadge })));
const RealTimeActivity = lazy(() => import('./sections/RealTimeActivity').then(m => ({ default: m.RealTimeActivity })));
const EmotionInsights = lazy(() => import('./sections/EmotionInsights').then(m => ({ default: m.EmotionInsights })));
const EmotionHeatmap = lazy(() => import('./sections/EmotionHeatmap').then(m => ({ default: m.EmotionHeatmap })));
const EncouragementStats = lazy(() => import('./sections/EncouragementStats').then(m => ({ default: m.EncouragementStats })));
const BadgePreview = lazy(() => import('./sections/BadgePreview').then(m => ({ default: m.BadgePreview })));
const DailyChallenge = lazy(() => import('./sections/DailyChallenge').then(m => ({ default: m.DailyChallenge })));
const EmotionJourney = lazy(() => import('./sections/EmotionJourney').then(m => ({ default: m.EmotionJourney })));
const EmotionWeather = lazy(() => import('./sections/EmotionWeather').then(m => ({ default: m.EmotionWeather })));
const TimeCapsule = lazy(() => import('./sections/TimeCapsule').then(m => ({ default: m.TimeCapsule })));
const ComfortLevel = lazy(() => import('./sections/ComfortLevel').then(m => ({ default: m.ComfortLevel })));
const HallOfFame = lazy(() => import('./sections/HallOfFame').then(m => ({ default: m.HallOfFame })));
const LiveComfortPreview = lazy(() => import('./sections/LiveComfortPreview').then(m => ({ default: m.LiveComfortPreview })));
const NightFragments = lazy(() => import('./sections/NightFragments').then(m => ({ default: m.NightFragments })));
const DailyComfortQuote = lazy(() => import('./sections/DailyComfortQuote').then(m => ({ default: m.DailyComfortQuote })));
const EmotionEcho = lazy(() => import('./sections/EmotionEcho').then(m => ({ default: m.EmotionEcho })));
const EmotionColorPalette = lazy(() => import('./sections/EmotionColorPalette').then(m => ({ default: m.EmotionColorPalette })));
const PositiveHighlight = lazy(() => import('./sections/PositiveHighlight').then(m => ({ default: m.PositiveHighlight })));
const QuickMoodPulse = lazy(() => import('./sections/QuickMoodPulse').then(m => ({ default: m.QuickMoodPulse })));
const AnonymousResonance = lazy(() => import('./sections/AnonymousResonance').then(m => ({ default: m.AnonymousResonance })));
const MicroJournal = lazy(() => import('./sections/MicroJournal').then(m => ({ default: m.MicroJournal })));

// 캐시 키
const CACHE_KEY = '@review_summary_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5분

// TypeScript 타입 정의
interface EmotionStat {
  name: string;
  count: number;
  color: string;
  icon: string;
}

interface ReviewSummary {
  emotionStats?: EmotionStat[];
  heatmapData?: Array<{ date: string; count: number; level: number }>;
  insights?: {
    topEmotion: string;
    totalPosts: number;
    positiveRatio: number;
    mostActiveHour: number;
    mostActiveDay: string;
  };
}

interface SectionItem {
  id: string;
  type: string;
  priority: number;
  weekOnly?: boolean;
}

// 섹션 로딩 플레이스홀더
const SectionPlaceholder: React.FC = React.memo(() => {
  const { colors } = useModernTheme();
  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
});

// 감정 분포 카드 컴포넌트 (분리)
const EmotionDistributionCard: React.FC<{
  emotionStats: EmotionStat[];
  periodText: string;
}> = React.memo(({ emotionStats, periodText }) => {
  const { colors } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const styles = getStyles();

  if (!emotionStats?.length) return null;

  return (
    <Card accessible={true} accessibilityLabel="감정 분포 통계">
      <Text style={[styles.cardTitle, { color: colors.text }]}>
        📊 {periodText} 감정 분포
      </Text>
      {emotionStats.slice(0, 5).map((emotion, index) => (
        <View key={index} style={styles.emotionRow}>
          <Text style={styles.emotionIcon}>{emotion.icon}</Text>
          <Text style={[styles.emotionName, { color: colors.text }]}>{emotion.name}</Text>
          <View style={[styles.emotionBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.emotionBarFill,
                {
                  width: `${(emotion.count / emotionStats[0].count) * 100}%`,
                  backgroundColor: emotion.color
                }
              ]}
            />
          </View>
          <Text style={[styles.emotionCount, { color: colors.textSecondary }]}>
            {emotion.count}
          </Text>
        </View>
      ))}
    </Card>
  );
});

const ReviewScreen: React.FC = () => {
  const { colors } = useModernTheme();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const scale = getScale(360, 0.8, 1.5);
  const styles = getStyles();

  // 캐시에서 데이터 로드
  const loadFromCache = useCallback(async (periodKey: string): Promise<ReviewSummary | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${periodKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (err) {
      console.error('캐시 로드 실패:', err);
    }
    return null;
  }, []);

  // 캐시에 데이터 저장
  const saveToCache = useCallback(async (periodKey: string, data: ReviewSummary) => {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY}_${periodKey}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('캐시 저장 실패:', err);
    }
  }, []);

  // 데이터 로드 (캐싱 적용)
  const loadSummary = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        setLoading(true);
      }
      setError(null);

      // 캐시 확인 (강제 새로고침이 아닌 경우)
      if (!forceRefresh) {
        const cachedData = await loadFromCache(period);
        if (cachedData) {
          setSummary(cachedData);
          setLoading(false);
          return;
        }
      }

      // API 호출
      const data = await reviewService.getSummary(period);
      setSummary(data.data);

      // 캐시 저장
      await saveToCache(period, data.data);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다');
      console.error('요약 로드 실패:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, loadFromCache, saveToCache]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSummary(true);
  }, [loadSummary]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSummary();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, loadSummary]);

  // Period 변경 시 스크롤 상단으로
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [period]);

  const periods = useMemo(() => [
    { key: 'week' as const, label: '주간' },
    { key: 'month' as const, label: '월간' },
    { key: 'year' as const, label: '연간' }
  ], []);

  const periodText = useMemo(() => {
    switch (period) {
      case 'week': return { prefix: '이번 주', range: '최근 7일' };
      case 'month': return { prefix: '이번 달', range: '최근 30일' };
      case 'year': return { prefix: '올해', range: '최근 365일' };
    }
  }, [period]);

  // 섹션 데이터 구조 (FlatList용)
  const sections: SectionItem[] = useMemo(() => {
    const baseSections: SectionItem[] = [
      // 1단계: 즉각적 참여 & 보상
      { id: 'dailyComfortQuote', type: 'DailyComfortQuote', priority: 1, weekOnly: true },
      { id: 'quickMoodPulse', type: 'QuickMoodPulse', priority: 2, weekOnly: true },
      { id: 'streakBadge', type: 'StreakBadge', priority: 3 },
      { id: 'dailyChallenge', type: 'DailyChallenge', priority: 4, weekOnly: true },
      { id: 'microJournal', type: 'MicroJournal', priority: 5, weekOnly: true },
      { id: 'badgePreview', type: 'BadgePreview', priority: 6 },

      // 2단계: 개인 인사이트
      { id: 'emotionInsights', type: 'EmotionInsights', priority: 7 },
      { id: 'personalTemperature', type: 'PersonalTemperature', priority: 8 },
      { id: 'emotionJourney', type: 'EmotionJourney', priority: 9 },
      { id: 'emotionTimeline', type: 'EmotionTimeline', priority: 10 },
      { id: 'glimmeringMoments', type: 'GlimmeringMoments', priority: 11 },
      { id: 'positiveHighlight', type: 'PositiveHighlight', priority: 12 },

      // 3단계: 시각적 통계
      { id: 'emotionWeather', type: 'EmotionWeather', priority: 13 },
      { id: 'emotionColorPalette', type: 'EmotionColorPalette', priority: 14 },
      { id: 'emotionHeatmap', type: 'EmotionHeatmap', priority: 15 },
      { id: 'emotionDistribution', type: 'EmotionDistribution', priority: 16 },

      // 4단계: 익명 연결감
      { id: 'emotionEcho', type: 'EmotionEcho', priority: 17 },
      { id: 'anonymousResonance', type: 'AnonymousResonance', priority: 18 },
      { id: 'similarMoment', type: 'SimilarMoment', priority: 19 },
      { id: 'nightFragments', type: 'NightFragments', priority: 20 },
      { id: 'timeCapsule', type: 'TimeCapsule', priority: 21 },

      // 5단계: 커뮤니티
      { id: 'comfortLevel', type: 'ComfortLevel', priority: 22 },
      { id: 'communityTemperature', type: 'CommunityTemperature', priority: 23 },
      { id: 'realTimeActivity', type: 'RealTimeActivity', priority: 24 },
      { id: 'encouragementStats', type: 'EncouragementStats', priority: 25 },
      { id: 'hallOfFame', type: 'HallOfFame', priority: 26 },
      { id: 'liveComfortPreview', type: 'LiveComfortPreview', priority: 27 },
    ];

    // 주간이 아닐 경우 weekOnly 섹션 필터링
    return baseSections.filter(section => !section.weekOnly || period === 'week');
  }, [period]);

  // 섹션 렌더러
  const renderSection = useCallback(({ item }: { item: SectionItem }) => {
    const renderContent = () => {
      switch (item.type) {
        case 'DailyComfortQuote':
          return <DailyComfortQuote />;
        case 'QuickMoodPulse':
          return <QuickMoodPulse />;
        case 'StreakBadge':
          return <StreakBadge />;
        case 'DailyChallenge':
          return <DailyChallenge />;
        case 'MicroJournal':
          return <MicroJournal />;
        case 'BadgePreview':
          return <BadgePreview />;
        case 'EmotionInsights':
          if (!summary?.insights || !summary?.emotionStats?.[0]) return null;
          return (
            <EmotionInsights
              data={{
                topEmotion: summary.insights.topEmotion,
                topEmotionIcon: summary.emotionStats[0].icon,
                topEmotionCount: summary.emotionStats[0].count,
                totalPosts: summary.insights.totalPosts,
                positiveRatio: summary.insights.positiveRatio,
                mostActiveHour: summary.insights.mostActiveHour,
                mostActiveDay: summary.insights.mostActiveDay,
              }}
            />
          );
        case 'PersonalTemperature':
          return <PersonalTemperature period={period} periodText={periodText.prefix} />;
        case 'EmotionJourney':
          return <EmotionJourney period={period} />;
        case 'EmotionTimeline':
          return <EmotionTimeline period={period} periodText={periodText.prefix} />;
        case 'GlimmeringMoments':
          return <GlimmeringMoments />;
        case 'PositiveHighlight':
          return <PositiveHighlight />;
        case 'EmotionWeather':
          return <EmotionWeather period={period} />;
        case 'EmotionColorPalette':
          return <EmotionColorPalette />;
        case 'EmotionHeatmap':
          if (!summary?.heatmapData) return null;
          return <EmotionHeatmap data={summary.heatmapData} period={period === 'week' ? 'week' : 'month'} />;
        case 'EmotionDistribution':
          if (!summary?.emotionStats?.length) return null;
          return <EmotionDistributionCard emotionStats={summary.emotionStats} periodText={periodText.prefix} />;
        case 'EmotionEcho':
          return <EmotionEcho />;
        case 'AnonymousResonance':
          return <AnonymousResonance />;
        case 'SimilarMoment':
          return <SimilarMoment />;
        case 'NightFragments':
          return <NightFragments />;
        case 'TimeCapsule':
          return <TimeCapsule />;
        case 'ComfortLevel':
          return <ComfortLevel />;
        case 'CommunityTemperature':
          return <CommunityTemperature period={period} periodText={periodText.prefix} />;
        case 'RealTimeActivity':
          return <RealTimeActivity />;
        case 'EncouragementStats':
          return <EncouragementStats />;
        case 'HallOfFame':
          return <HallOfFame />;
        case 'LiveComfortPreview':
          return <LiveComfortPreview />;
        default:
          return null;
      }
    };

    return (
      <Suspense fallback={<SectionPlaceholder />}>
        {renderContent()}
      </Suspense>
    );
  }, [summary, period, periodText]);

  // FlatList 최적화 설정
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 200, // 예상 아이템 높이
    offset: 200 * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: SectionItem) => item.id, []);

  // 비로그인 사용자 UI
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.guestHeader}>
          <Text style={[styles.guestHeaderTitle, { color: colors.text }]}>일상 돌아보기</Text>
        </View>

        <View style={styles.guestContent}>
          <View style={[styles.guestCard, {
            backgroundColor: colors.card,
            shadowColor: colors.text,
          }]}>
            <View style={[styles.iconContainer, {
              backgroundColor: `${colors.primary}15`,
            }]}>
              <Text style={styles.guestIcon}>📊</Text>
            </View>

            <Text style={[styles.guestTitle, { color: colors.text }]}>
              나만의 감정 통계
            </Text>

            <Text style={[styles.guestDescription, { color: colors.textSecondary }]}>
              감정 기록을 돌아보고{'\n'}
              인사이트를 확인해보세요
            </Text>

            <View style={styles.featureList}>
              {['주간/월간/연간 감정 분석', '개인 맞춤 인사이트', '나만의 감정 히스토리'].map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <Text style={[styles.featureDot, { color: colors.primary }]}>•</Text>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.guestSignupButton, {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              }]}
              onPress={() => {
                const rootNav = navigation.getParent();
                if (rootNav) {
                  rootNav.navigate('Auth' as never, { screen: 'Register' } as never);
                }
              }}
            >
              <Text style={[styles.guestSignupButtonText, { fontSize: FONT_SIZES.body * scale, color: colors.background }]}>시작하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestLoginButton}
              onPress={() => {
                const rootNav = navigation.getParent();
                if (rootNav) {
                  rootNav.navigate('Auth' as never, { screen: 'Login' } as never);
                }
              }}
            >
              <Text style={[styles.guestLoginButtonText, { color: colors.textSecondary }]}>
                이미 계정이 있으신가요? <Text style={{ color: colors.primary, fontWeight: '700' }}>로그인</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 헤더 렌더러
  const ListHeader = useMemo(() => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>일상 돌아보기</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
        {periodText.prefix} ({periodText.range})
      </Text>

      <View style={styles.periodSelector}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[
              styles.periodButton,
              { borderColor: colors.border },
              period === p.key && { backgroundColor: colors.primary }
            ]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[
              styles.periodText,
              { color: period === p.key ? colors.background : colors.text }
            ]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [colors, period, periodText, periods, styles]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => loadSummary(true)}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={sections}
          renderItem={renderSection}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={<View style={{ height: 40 * scale }} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          // 성능 최적화 설정
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          initialNumToRender={8}
          // Pull-to-refresh
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

// 반응형 스케일 계산 (lazy)
let _styles: any = null;
const getStyles = () => {
  if (!_styles) {
    const scale = getScale();
    _styles = StyleSheet.create({
      container: {
        flex: 1,
      },
      header: {
        paddingTop: 50 * scale,
        paddingBottom: 12 * scale,
      },
      headerTitle: {
        fontSize: FONT_SIZES.h1 * scale,
        fontWeight: '700',
        marginBottom: 2 * scale,
      },
      headerSubtitle: {
        fontSize: FONT_SIZES.caption * scale,
        marginBottom: 12 * scale,
      },
      periodSelector: {
        flexDirection: 'row',
        gap: 8 * scale,
      },
      periodButton: {
        paddingHorizontal: 14 * scale,
        paddingVertical: 6 * scale,
        borderRadius: 16 * scale,
        borderWidth: 1,
      },
      periodText: {
        fontSize: FONT_SIZES.caption * scale,
        fontWeight: '600',
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      content: {
        paddingHorizontal: 20 * scale,
      },
      cardTitle: {
        fontSize: FONT_SIZES.h4 * scale,
        fontWeight: '700',
        marginBottom: 12 * scale,
      },
      emotionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12 * scale,
      },
      emotionIcon: {
        fontSize: FONT_SIZES.h2 * scale,
        marginRight: 8 * scale,
      },
      emotionName: {
        fontSize: FONT_SIZES.body * scale,
        fontWeight: '600',
        width: 60 * scale,
      },
      emotionBar: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 8,
      },
      emotionBarFill: {
        height: '100%',
        borderRadius: 4 * scale,
      },
      emotionCount: {
        fontSize: FONT_SIZES.bodySmall * scale,
        width: 40 * scale,
        textAlign: 'right',
      },
      // 비로그인 사용자 UI 스타일
      guestHeader: {
        paddingTop: 50 * scale,
        paddingHorizontal: 20 * scale,
        paddingBottom: 16 * scale,
      },
      guestHeaderTitle: {
        fontSize: FONT_SIZES.h1 * scale,
        fontWeight: '700',
      },
      guestContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20 * scale,
        paddingBottom: 100 * scale,
      },
      guestCard: {
        borderRadius: 24 * scale,
        padding: 28 * scale,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 * scale },
        shadowOpacity: 0.08,
        shadowRadius: 12 * scale,
        elevation: 8,
      },
      iconContainer: {
        width: 80 * scale,
        height: 80 * scale,
        borderRadius: 40 * scale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20 * scale,
      },
      guestIcon: {
        fontSize: 40 * scale,
      },
      guestTitle: {
        fontSize: FONT_SIZES.h2 * scale,
        fontWeight: '700',
        marginBottom: 10 * scale,
        textAlign: 'center',
      },
      guestDescription: {
        fontSize: FONT_SIZES.body * scale,
        lineHeight: 22 * scale,
        textAlign: 'center',
        marginBottom: 24 * scale,
      },
      featureList: {
        width: '100%',
        marginBottom: 28 * scale,
      },
      featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10 * scale,
        paddingLeft: 8 * scale,
      },
      featureDot: {
        fontSize: FONT_SIZES.body * scale,
        marginRight: 8 * scale,
        fontWeight: '700',
      },
      featureText: {
        fontSize: FONT_SIZES.bodySmall * scale,
        lineHeight: 20 * scale,
      },
      guestSignupButton: {
        width: '100%',
        paddingVertical: 16 * scale,
        borderRadius: 14 * scale,
        alignItems: 'center',
        marginBottom: 12 * scale,
        shadowOffset: { width: 0, height: 4 * scale },
        shadowOpacity: 0.3,
        shadowRadius: 8 * scale,
        elevation: 6,
      },
      guestSignupButtonText: {
        fontWeight: '700',
        letterSpacing: 0.5,
      },
      guestLoginButton: {
        paddingVertical: 12 * scale,
      },
      guestLoginButtonText: {
        textAlign: 'center',
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      errorText: {
        textAlign: 'center',
        marginBottom: 16,
      },
      retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
      },
      retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
      },
    });
  }
  return _styles;
};

export default ReviewScreen;
