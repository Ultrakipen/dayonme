import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { FONT_SIZES } from '../../constants';
import { getScale } from '../../utils/responsive';
import { TwemojiImage } from '../../components/common/TwemojiImage';
import { ReviewDataProvider, useReviewData } from './ReviewDataContext';

// ===== 직접 import (Lazy Loading 제거 - 초기 로딩 개선) =====
// 탭 1: 오늘
import { QuickMoodPulse } from './sections/QuickMoodPulse';
import { StreakBadge } from './sections/StreakBadge';
import { DailyChallenge } from './sections/DailyChallenge';
import { MicroJournal } from './sections/MicroJournal';
import { WeeklyGoal } from './sections/WeeklyGoal';

// 탭 2: 인사이트
import { WeeklyEmotionChart } from './sections/WeeklyEmotionChart';
import { AIEmotionAnalysis } from './sections/AIEmotionAnalysis';
import { PersonalTemperature } from './sections/PersonalTemperature';
import { EmotionHeatmap } from './sections/EmotionHeatmap';
import { PersonalBest } from './sections/PersonalBest';
import { EmotionWeather } from './sections/EmotionWeather';

// 탭 3: 커뮤니티
import { RealTimeActivity } from './sections/RealTimeActivity';
import { AnonymousResonance } from './sections/AnonymousResonance';
import { AnonymousQA } from './sections/AnonymousQA';
import { EmotionResonancePosts } from './sections/EmotionResonancePosts';
import { TimeCapsule } from './sections/TimeCapsule';
import { BadgePreview } from './sections/BadgePreview';

// ===== 타입 정의 =====
type TabKey = 'today' | 'insights' | 'community';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
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

// ===== 탭별 섹션 구성 =====
const TAB_SECTIONS: Record<TabKey, SectionItem[]> = {
  today: [
    { id: 'quickMoodPulse', type: 'QuickMoodPulse' },
    { id: 'streakBadge', type: 'StreakBadge' },
    { id: 'weeklyGoal', type: 'WeeklyGoal' },
    { id: 'dailyChallenge', type: 'DailyChallenge' },
    { id: 'microJournal', type: 'MicroJournal' },
  ],
  insights: [
    { id: 'weeklyEmotionChart', type: 'WeeklyEmotionChart' },
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
    { id: 'emotionResonancePosts', type: 'EmotionResonancePosts' },
    { id: 'timeCapsule', type: 'TimeCapsule' },
    { id: 'badgePreview', type: 'BadgePreview' },
  ],
};

// ===== 내부 컨텐츠 컴포넌트 =====
const ReviewScreenContent: React.FC = () => {
  const { colors, isDark } = useModernTheme();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { data, loading, period, setPeriod, refresh } = useReviewData();

  const [activeTab, setActiveTab] = useState<TabKey>((route.params as any)?.initialTab || 'today');
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const lastRefreshTime = useRef<number>(0);

  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale, SCREEN_WIDTH), [scale, SCREEN_WIDTH]);

  // 탭 인디케이터 애니메이션
  useEffect(() => {
    const tabIndex = TABS.findIndex(t => t.key === activeTab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      tension: 68,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabIndicatorAnim]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh(true);
    lastRefreshTime.current = Date.now();
    setRefreshing(false);
  }, [refresh]);

  // 화면 포커스 시 조건부 새로고침 (30초 이상 지났을 때만)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      const shouldRefresh = timeSinceLastRefresh > 30000; // 30초

      if (shouldRefresh && !loading) {
        refresh(true);
        lastRefreshTime.current = now;
      }
    }, [loading, refresh])
  );

  // 탭 변경 시 스크롤 상단으로
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [activeTab]);

  // 기간 텍스트
  const periodText = useMemo(() => {
    switch (period) {
      case 'week': return { prefix: '이번 주', range: '최근 7일' };
      case 'month': return { prefix: '이번 달', range: '최근 30일' };
      case 'year': return { prefix: '올해', range: '최근 365일' };
    }
  }, [period]);

  // 현재 탭의 섹션들
  const currentSections = useMemo(() => TAB_SECTIONS[activeTab], [activeTab]);

  // 섹션 렌더러 (Context 데이터 사용)
  const renderSection = useCallback(({ item }: { item: SectionItem }) => {
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
      case 'WeeklyEmotionChart':
        return <WeeklyEmotionChart />;
      case 'AIEmotionAnalysis':
        return <AIEmotionAnalysis period={period} />;
      case 'PersonalTemperature':
        return <PersonalTemperature period={period} periodText={periodText.prefix} />;
      case 'EmotionHeatmap':
        return <EmotionHeatmap period={period} />;
      case 'PersonalBest':
        return <PersonalBest period={period} />;
      case 'EmotionWeather':
        return <EmotionWeather period={period} />;

      // 커뮤니티 탭
      case 'RealTimeActivity':
        return <RealTimeActivity />;
      case 'AnonymousQA':
        return <AnonymousQA />;
      case 'AnonymousResonance':
        return <AnonymousResonance />;
      case 'EmotionResonancePosts':
        return <EmotionResonancePosts />;
      case 'TimeCapsule':
        return <TimeCapsule />;
      case 'BadgePreview':
        return <BadgePreview />;

      default:
        return null;
    }
  }, [data.summary, period, periodText]);

  const keyExtractor = useCallback((item: SectionItem) => item.id, []);

  // 탭 인디케이터 위치 계산
  const tabWidth = (SCREEN_WIDTH - 40 * scale) / TABS.length;
  const indicatorTranslateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  // 비로그인 사용자 UI
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
              감정 기록을 돌아보고{'\n'}나의 감정 흐름을 확인해보세요
            </Text>

            <View style={styles.featureList}>
              {['나의 감정 흐름', '주간 목표 설정', '나만의 최고 기록', '익명 Q&A'].map((feature, i) => (
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
                이미 계정이 있으신가요? <Text style={{ color: colors.primary, fontFamily: 'Pretendard-Bold' }}>로그인</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 헤더 컴포넌트
  const ListHeader = useMemo(() => (
    <View style={styles.header}>
      {/* 2줄 구조 헤더 */}
      <View style={[
        styles.twoLineHeader,
        {
          backgroundColor: isDark
            ? `${colors.primary}18`
            : `${colors.primary}12`,
        }
      ]}>
        {/* 첫 번째 줄: 아이콘 + 타이틀 */}
        <View style={styles.firstLine}>
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}30` }]}>
            <TwemojiImage emoji="✨" size={18 * scale} />
          </View>
          <Text style={[styles.mainTitle, { color: colors.text }]}>나의 감정 리뷰</Text>
        </View>

        {/* 두 번째 줄: 기간 정보 + 기간 선택 (인사이트 탭) */}
        <View style={styles.secondLine}>
          <Text style={[styles.periodInfo, { color: colors.textSecondary }]}>
            {periodText.prefix} · {data.summary?.insights?.totalPosts || 0}개 기록
          </Text>

          {activeTab === 'insights' && (
            <View style={styles.periodSelector}>
              {(['week', 'month', 'year'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: period === p ? colors.primary : 'transparent',
                      borderColor: period === p ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    { color: period === p ? colors.background : colors.text }
                  ]}>
                    {p === 'week' ? '주' : p === 'month' ? '월' : '년'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

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
                fontFamily: activeTab === tab.key ? 'Pretendard-Bold' : 'Pretendard-Medium',
              }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [colors, isDark, activeTab, period, periodText, tabWidth, indicatorTranslateX, scale, styles, setPeriod]);

  // 메인 렌더링
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

// ===== 메인 컴포넌트 (Provider로 감싸기) =====
const ReviewScreen: React.FC = () => {
  return (
    <ReviewDataProvider>
      <ReviewScreenContent />
    </ReviewDataProvider>
  );
};

// ===== 반응형 스타일 =====
const createStyles = (scale: number, screenWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8 * scale,
    paddingBottom: 12 * scale,
  },
  twoLineHeader: {
    paddingHorizontal: 16 * scale,
    paddingVertical: 14 * scale,
    marginHorizontal: -20 * scale,
    marginBottom: 12 * scale,
    borderBottomLeftRadius: 20 * scale,
    borderBottomRightRadius: 20 * scale,
    gap: 10 * scale,
  },
  firstLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10 * scale,
  },
  iconCircle: {
    width: 38 * scale,
    height: 38 * scale,
    borderRadius: 19 * scale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 19 * scale,
    fontFamily: 'Pretendard-ExtraBold',
    letterSpacing: -0.3,
  },
  secondLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 48 * scale,
  },
  periodInfo: {
    fontSize: 13 * scale,
    fontFamily: 'Pretendard-Medium',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 6 * scale,
  },
  periodButton: {
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 14 * scale,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 13 * scale,
    fontFamily: 'Pretendard-Bold',
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
    fontSize: FONT_SIZES.bodyLarge * scale,
  },
  tabLabel: {
    fontSize: FONT_SIZES.bodySmall * scale,
    fontFamily: 'Pretendard-Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12 * scale,
  },
  loadingText: {
    fontSize: FONT_SIZES.body * scale,
    fontFamily: 'Pretendard-Regular',
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
    fontSize: FONT_SIZES.h1 * scale,
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-Bold',
    marginBottom: 10 * scale,
    textAlign: 'center',
  },
  guestDescription: {
    fontSize: FONT_SIZES.body * scale,
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-Bold',
    marginRight: 8 * scale,
  },
  featureText: {
    fontSize: FONT_SIZES.bodySmall * scale,
    fontFamily: 'Pretendard-Regular',
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
    fontSize: FONT_SIZES.body * scale,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: 0.5,
  },
  guestLoginButton: {
    paddingVertical: 12 * scale,
  },
  guestLoginButtonText: {
    fontSize: FONT_SIZES.bodySmall * scale,
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },
});

export default ReviewScreen;
