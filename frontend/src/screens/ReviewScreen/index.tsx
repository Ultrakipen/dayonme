import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useModernTheme } from '../../hooks/useModernTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import reviewService from '../../services/api/reviewService';
import { FONT_SIZES } from '../../constants';
import { getScale } from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwemojiImage } from '../../components/common/TwemojiImage';

// ===== 지연 로딩 컴포넌트 (성능 최적화) =====
// 탭 1: 오늘
const QuickMoodPulse = lazy(() => import('./sections/QuickMoodPulse').then(m => ({ default: m.QuickMoodPulse })));
const StreakBadge = lazy(() => import('./sections/StreakBadge').then(m => ({ default: m.StreakBadge })));
const DailyChallenge = lazy(() => import('./sections/DailyChallenge').then(m => ({ default: m.DailyChallenge })));
const MicroJournal = lazy(() => import('./sections/MicroJournal').then(m => ({ default: m.MicroJournal })));
const WeeklyGoal = lazy(() => import('./sections/WeeklyGoal').then(m => ({ default: m.WeeklyGoal })));

// 탭 2: 인사이트
const AIEmotionAnalysis = lazy(() => import('./sections/AIEmotionAnalysis').then(m => ({ default: m.AIEmotionAnalysis })));
const PersonalTemperature = lazy(() => import('./sections/PersonalTemperature').then(m => ({ default: m.PersonalTemperature })));
const EmotionHeatmap = lazy(() => import('./sections/EmotionHeatmap').then(m => ({ default: m.EmotionHeatmap })));
const PersonalBest = lazy(() => import('./sections/PersonalBest').then(m => ({ default: m.PersonalBest })));
const EmotionWeather = lazy(() => import('./sections/EmotionWeather').then(m => ({ default: m.EmotionWeather })));
const EmotionInsights = lazy(() => import('./sections/EmotionInsights').then(m => ({ default: m.EmotionInsights })));

// 탭 3: 커뮤니티
const RealTimeActivity = lazy(() => import('./sections/RealTimeActivity').then(m => ({ default: m.RealTimeActivity })));
const AnonymousResonance = lazy(() => import('./sections/AnonymousResonance').then(m => ({ default: m.AnonymousResonance })));
const AnonymousQA = lazy(() => import('./sections/AnonymousQA').then(m => ({ default: m.AnonymousQA })));
const MoodPlaylist = lazy(() => import('./sections/MoodPlaylist').then(m => ({ default: m.MoodPlaylist })));
const TimeCapsule = lazy(() => import('./sections/TimeCapsule').then(m => ({ default: m.TimeCapsule })));
const BadgePreview = lazy(() => import('./sections/BadgePreview').then(m => ({ default: m.BadgePreview })));

// ===== 상수 =====
const CACHE_KEY = '@review_summary_cache';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10분

// ===== 타입 정의 =====
type TabKey = 'today' | 'insights' | 'community';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
}

interface ReviewSummary {
  emotionStats?: Array<{ name: string; count: number; color: string; icon: string }>;
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
}

// ===== 탭 설정 =====
const TABS: Tab[] = [
  { key: 'today', label: '오늘', icon: '✨' },
  { key: 'insights', label: '인사이트', icon: '📊' },
  { key: 'community', label: '커뮤니티', icon: '💬' },
];

// ===== 탭별 섹션 구성 (통합된 12개) =====
const TAB_SECTIONS: Record<TabKey, SectionItem[]> = {
  today: [
    { id: 'quickMoodPulse', type: 'QuickMoodPulse' },
    { id: 'streakBadge', type: 'StreakBadge' },
    { id: 'weeklyGoal', type: 'WeeklyGoal' },
    { id: 'dailyChallenge', type: 'DailyChallenge' },
    { id: 'microJournal', type: 'MicroJournal' },
  ],
  insights: [
    { id: 'aiEmotionAnalysis', type: 'AIEmotionAnalysis' },
    { id: 'personalTemperature', type: 'PersonalTemperature' },
    { id: 'emotionHeatmap', type: 'EmotionHeatmap' },
    { id: 'personalBest', type: 'PersonalBest' },
    { id: 'emotionWeather', type: 'EmotionWeather' },
  ],
  community: [
    { id: 'realTimeActivity', type: 'RealTimeActivity' },
    { id: 'anonymousQA', type: 'AnonymousQA' },
    { id: 'anonymousResonance', type: 'AnonymousResonance' },
    { id: 'moodPlaylist', type: 'MoodPlaylist' },
    { id: 'timeCapsule', type: 'TimeCapsule' },
    { id: 'badgePreview', type: 'BadgePreview' },
  ],
};

// ===== 섹션 플레이스홀더 =====
const SectionPlaceholder: React.FC = React.memo(() => {
  const { colors } = useModernTheme();
  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
});

// ===== 메인 컴포넌트 =====
const ReviewScreen: React.FC = () => {
  const { colors, isDark } = useModernTheme();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale, SCREEN_WIDTH), [scale, SCREEN_WIDTH]);

  // ===== 탭 인디케이터 애니메이션 =====
  useEffect(() => {
    const tabIndex = TABS.findIndex(t => t.key === activeTab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      tension: 68,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabIndicatorAnim]);

  // ===== 캐시 로드 =====
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
      if (__DEV__) console.warn('캐시 로드 실패:', err);
    }
    return null;
  }, []);

  // ===== 캐시 저장 =====
  const saveToCache = useCallback(async (periodKey: string, data: ReviewSummary) => {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY}_${periodKey}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      if (__DEV__) console.warn('캐시 저장 실패:', err);
    }
  }, []);

  // ===== 데이터 로드 =====
  const loadSummary = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        setLoading(true);
      }

      if (!forceRefresh) {
        const cachedData = await loadFromCache(period);
        if (cachedData) {
          setSummary(cachedData);
          setLoading(false);
          return;
        }
      }

      const data = await reviewService.getSummary(period);
      setSummary(data.data);
      await saveToCache(period, data.data);
    } catch (err) {
      if (__DEV__) console.warn('요약 로드 실패:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, loadFromCache, saveToCache]);

  // ===== Pull-to-refresh =====
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

  // ===== 탭 변경 시 스크롤 상단으로 =====
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [activeTab]);

  // ===== 기간 텍스트 =====
  const periodText = useMemo(() => {
    switch (period) {
      case 'week': return { prefix: '이번 주', range: '최근 7일' };
      case 'month': return { prefix: '이번 달', range: '최근 30일' };
      case 'year': return { prefix: '올해', range: '최근 365일' };
    }
  }, [period]);

  // ===== 현재 탭의 섹션들 =====
  const currentSections = useMemo(() => TAB_SECTIONS[activeTab], [activeTab]);

  // ===== 섹션 렌더러 =====
  const renderSection = useCallback(({ item }: { item: SectionItem }) => {
    const renderContent = () => {
      switch (item.type) {
        // 오늘 탭
        case 'QuickMoodPulse':
          return <QuickMoodPulse />;
        case 'StreakBadge':
          return <StreakBadge />;
        case 'WeeklyGoal':
          return <WeeklyGoal />;
        case 'DailyChallenge':
          return <DailyChallenge />;
        case 'MicroJournal':
          return <MicroJournal />;

        // 인사이트 탭
        case 'AIEmotionAnalysis':
          return <AIEmotionAnalysis period={period} />;
        case 'PersonalTemperature':
          return <PersonalTemperature period={period} periodText={periodText.prefix} />;
        case 'EmotionHeatmap':
          return <EmotionHeatmap data={summary?.heatmapData} period={period === 'week' ? 'week' : 'month'} />;
        case 'PersonalBest':
          return <PersonalBest period={period} />;
        case 'EmotionWeather':
          return <EmotionWeather period={period} />;
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

        // 커뮤니티 탭
        case 'RealTimeActivity':
          return <RealTimeActivity />;
        case 'AnonymousQA':
          return <AnonymousQA />;
        case 'AnonymousResonance':
          return <AnonymousResonance />;
        case 'MoodPlaylist':
          return <MoodPlaylist />;
        case 'TimeCapsule':
          return <TimeCapsule />;
        case 'BadgePreview':
          return <BadgePreview />;

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

  const keyExtractor = useCallback((item: SectionItem) => item.id, []);

  // ===== 탭 인디케이터 위치 계산 =====
  const tabWidth = (SCREEN_WIDTH - 40 * scale) / TABS.length;
  const indicatorTranslateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });


  // ===== 헤더 컴포넌트 =====
  const ListHeader = useMemo(() => (
    <View style={styles.header}>
      {/* 제목 */}
      <Text style={[styles.headerTitle, { color: colors.text }]}>일상 돌아보기</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
        {periodText.prefix} ({periodText.range})
      </Text>

      {/* 기간 선택자 (인사이트 탭에서만 표시) */}
      {activeTab === 'insights' && (
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                { borderColor: colors.border },
                period === p && { backgroundColor: colors.primary }
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[
                styles.periodText,
                { color: period === p ? colors.background : colors.text }
              ]}>
                {p === 'week' ? '주간' : p === 'month' ? '월간' : '연간'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 탭 바 */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? colors.surface : '#F0F0F0' }]}>
        {/* 탭 인디케이터 */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              backgroundColor: colors.primary,
              width: tabWidth - 8 * scale,
              transform: [{ translateX: Animated.add(indicatorTranslateX, new Animated.Value(4 * scale)) }],
            }
          ]}
        />

        {/* 탭 버튼 */}
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, { width: tabWidth }]}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityLabel={`${tab.label} 탭`}
          >
            <View style={{ opacity: activeTab === tab.key ? 1 : 0.6 }}>
              <TwemojiImage emoji={tab.icon} size={FONT_SIZES.bodyLarge * scale} />
            </View>
            <Text style={[
              styles.tabLabel,
              {
                color: activeTab === tab.key ? (isDark ? '#FFFFFF' : colors.background) : colors.textSecondary,
                fontWeight: activeTab === tab.key ? '700' : '500',
              }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [colors, isDark, activeTab, period, periodText, tabWidth, indicatorTranslateX, scale, styles]);

  // ===== 비로그인 사용자 UI =====
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.guestHeader}>
          <Text style={[styles.guestHeaderTitle, { color: colors.text }]}>일상 돌아보기</Text>
        </View>

        <View style={styles.guestContent}>
          <View style={[styles.guestCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <TwemojiImage emoji="📊" size={40 * scale} />
            </View>

            <Text style={[styles.guestTitle, { color: colors.text }]}>나만의 감정 통계</Text>

            <Text style={[styles.guestDescription, { color: colors.textSecondary }]}>
              감정 기록을 돌아보고{'\n'}AI 인사이트를 확인해보세요
            </Text>

            <View style={styles.featureList}>
              {['AI 감정 분석', '주간 목표 설정', '나만의 최고 기록', '익명 Q&A'].map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <Text style={[styles.featureDot, { color: colors.primary }]}>•</Text>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.guestSignupButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => {
                const rootNav = navigation.getParent();
                if (rootNav) {
                  rootNav.navigate('Auth' as never, { screen: 'Register' } as never);
                }
              }}
            >
              <Text style={[styles.guestSignupButtonText, { color: colors.background }]}>시작하기</Text>
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

  // ===== 메인 렌더링 =====
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            데이터를 불러오는 중...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={currentSections}
          renderItem={renderSection}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={<View style={{ height: 40 * scale }} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          initialNumToRender={5}
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

// ===== 반응형 스타일 =====
const createStyles = (scale: number, screenWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50 * scale,
    paddingBottom: 8 * scale,
  },
  headerTitle: {
    fontSize: FONT_SIZES.h1,
    fontWeight: '700',
    marginBottom: 2 * scale,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.caption,
    marginBottom: 16 * scale,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8 * scale,
    marginBottom: 16 * scale,
  },
  periodButton: {
    paddingHorizontal: 14 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 16 * scale,
    borderWidth: 1,
  },
  periodText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 16 * scale,
    padding: 4 * scale,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4 * scale,
    bottom: 4 * scale,
    borderRadius: 12 * scale,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10 * scale,
    gap: 6 * scale,
    zIndex: 1,
  },
  tabIcon: {
    fontSize: FONT_SIZES.bodyLarge,
  },
  tabLabel: {
    fontSize: FONT_SIZES.bodySmall,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12 * scale,
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
  },
  content: {
    paddingHorizontal: 20 * scale,
  },
  // 비로그인 UI
  guestHeader: {
    paddingTop: 50 * scale,
    paddingHorizontal: 20 * scale,
    paddingBottom: 16 * scale,
  },
  guestHeaderTitle: {
    fontSize: FONT_SIZES.h1,
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
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
    marginBottom: 10 * scale,
    textAlign: 'center',
  },
  guestDescription: {
    fontSize: FONT_SIZES.body,
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
    fontSize: FONT_SIZES.body,
    marginRight: 8 * scale,
    fontWeight: '700',
  },
  featureText: {
    fontSize: FONT_SIZES.bodySmall,
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
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  guestLoginButton: {
    paddingVertical: 12 * scale,
  },
  guestLoginButtonText: {
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center',
  },
});

export default ReviewScreen;
