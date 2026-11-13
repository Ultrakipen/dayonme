// screens/EmotionReportScreen.tsx
// 감정 리포트 화면 - 월간/주간 감정 분석 리포트

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { reportApi, EmotionReport } from '../services/api/emotionFeatureService';

const getScreenWidth = () => Dimensions.get('window').width;
const BASE_WIDTH = 360;

const EmotionReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();
  const [report, setReport] = useState<EmotionReport | null>(null);
  const [reportList, setReportList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const scale = useMemo(() => {
    const screenWidth = getScreenWidth();
    return Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.3);
  }, []);

  const colors = useMemo(() => ({
    background: isDark ? '#121212' : '#f8f9fa',
    card: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    primary: theme.colors.primary,
    border: isDark ? '#333333' : '#e0e0e0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    chartBg: isDark ? '#2a2a2a' : '#f0f0f0',
  }), [isDark, theme]);

  // 트렌드 아이콘 및 색상
  const getTrendInfo = useCallback((trend: string) => {
    switch (trend) {
      case 'increasing':
        return { icon: '📈', color: colors.success, label: '상승세' };
      case 'decreasing':
        return { icon: '📉', color: colors.error, label: '하락세' };
      default:
        return { icon: '➡️', color: colors.warning, label: '안정세' };
    }
  }, [colors]);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currentReportRes, reportListRes] = await Promise.all([
        reportApi.getCurrentMonthReport(),
        reportApi.getReportList(6)
      ]);

      if (currentReportRes.success) {
        setReport(currentReportRes.data);
        setSelectedPeriod(currentReportRes.data.report_period);
      }

      if (reportListRes.success) {
        setReportList(reportListRes.data);
      }
    } catch (error) {
      if (__DEV__) console.error('리포트 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 특정 월 리포트 로드
  const loadMonthReport = async (period: string) => {
    try {
      setLoading(true);
      const [year, month] = period.split('-');
      const response = await reportApi.getMonthlyReport(Number(year), Number(month));
      if (response.success) {
        setReport(response.data);
        setSelectedPeriod(period);
      }
    } catch (error) {
      if (__DEV__) console.error('월간 리포트 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 감정 분포 바 차트
  const renderEmotionDistribution = () => {
    if (!report?.emotion_distribution || report.emotion_distribution.length === 0) {
      return (
        <View style={[styles.emptyChart, { padding: 24 * scale }]}>
          <Text style={{ fontSize: 40 * scale }}>📊</Text>
          <Text style={[styles.emptyChartText, { color: colors.textSecondary, fontSize: 13 * scale, marginTop: 8 * scale }]}>
            이번 달 감정 기록이 없습니다
          </Text>
        </View>
      );
    }

    const maxCount = Math.max(...report.emotion_distribution.map(e => e.count));

    return (
      <View style={styles.distributionContainer}>
        {report.emotion_distribution.slice(0, 5).map((emotion, index) => (
          <View key={index} style={[styles.distributionItem, { marginBottom: 12 * scale }]}>
            <View style={styles.distributionLabel}>
              <Text style={{ fontSize: 20 * scale }}>{emotion.icon}</Text>
              <Text style={[styles.emotionName, { color: colors.text, fontSize: 13 * scale, marginLeft: 8 * scale }]}>
                {emotion.emotion_name}
              </Text>
            </View>
            <View style={[styles.barContainer, { backgroundColor: colors.chartBg, height: 20 * scale, borderRadius: 10 * scale }]}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${(emotion.count / maxCount) * 100}%`,
                    backgroundColor: colors.primary,
                    height: 20 * scale,
                    borderRadius: 10 * scale,
                  }
                ]}
              />
              <Text style={[styles.barText, { color: colors.text, fontSize: Math.max(12, 12 * scale) }]}>
                {emotion.count}회 ({emotion.percentage}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 요일별 패턴
  const renderWeeklyPattern = () => {
    if (!report?.weekly_pattern || report.weekly_pattern.length === 0) {
      return null;
    }

    const maxCount = Math.max(...report.weekly_pattern.map(p => p.count), 1);

    return (
      <View style={[styles.weeklyPatternContainer, { marginTop: 16 * scale }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 15 * scale, marginBottom: 12 * scale }]}>
          📅 요일별 기록 패턴
        </Text>
        <View style={styles.weeklyChart}>
          {report.weekly_pattern.map((day, index) => (
            <View key={index} style={styles.dayColumn}>
              <View style={[styles.dayBarContainer, { backgroundColor: colors.chartBg, height: 80 * scale, borderRadius: 8 * scale }]}>
                <View
                  style={[
                    styles.dayBar,
                    {
                      height: `${(day.count / maxCount) * 100}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 8 * scale,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, { color: colors.textSecondary, fontSize: Math.max(12, 12 * scale), marginTop: 4 * scale }]}>
                {day.day_name}
              </Text>
              <Text style={[styles.dayCount, { color: colors.text, fontSize: Math.max(12, 12 * scale) }]}>
                {day.count}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 통계 카드
  const renderStatCard = (icon: string, value: number | string, label: string, color?: string) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>
      <Text style={{ fontSize: 24 * scale }}>{icon}</Text>
      <Text style={[styles.statValue, { color: color || colors.primary, fontSize: 24 * scale, marginTop: 8 * scale }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: Math.max(12, 12 * scale), marginTop: 4 * scale }]}>
        {label}
      </Text>
    </View>
  );

  // 월 선택기
  const renderMonthSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.monthSelector, { marginVertical: 16 * scale }]}
      contentContainerStyle={{ paddingHorizontal: 16 * scale }}
    >
      {reportList.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.monthButton,
            {
              backgroundColor: selectedPeriod === item.report_period ? colors.primary : colors.card,
              paddingHorizontal: 16 * scale,
              paddingVertical: 10 * scale,
              marginRight: 8 * scale,
              borderRadius: 20 * scale,
            }
          ]}
          onPress={() => loadMonthReport(item.report_period)}
        >
          <Text style={[
            styles.monthButtonText,
            {
              color: selectedPeriod === item.report_period ? theme.colors.onAccent : colors.text,
              fontSize: 13 * scale,
            }
          ]}>
            {item.report_period.replace('-', '년 ')}월
          </Text>
          {!item.is_viewed && (
            <View style={[styles.newBadge, { backgroundColor: colors.error, marginLeft: 4 * scale }]}>
              <Text style={{ color: '#fff', fontSize: Math.max(10, 10 * scale) }}>N</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading && !report) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontSize: 14 * scale, marginTop: 12 * scale }]}>
            리포트를 생성하고 있습니다...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const trendInfo = report ? getTrendInfo(report.emotion_trend) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingHorizontal: 16 * scale, paddingVertical: 12 * scale, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.text, fontSize: 24 * scale }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 18 * scale }]}>
          📊 감정 리포트
        </Text>
        <View style={{ width: 40 * scale }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* 월 선택기 */}
        {renderMonthSelector()}

        {report && (
          <>
            {/* 요약 섹션 */}
            <View style={[styles.summarySection, { paddingHorizontal: 16 * scale }]}>
              <View style={[styles.summaryCard, { backgroundColor: colors.card, padding: 20 * scale, borderRadius: 16 * scale }]}>
                <View style={styles.summaryHeader}>
                  <Text style={[styles.periodText, { color: colors.textSecondary, fontSize: 13 * scale }]}>
                    {report.report_period.replace('-', '년 ')}월 리포트
                  </Text>
                  {trendInfo && (
                    <View style={[styles.trendBadge, { backgroundColor: trendInfo.color + '20', paddingHorizontal: 10 * scale, paddingVertical: 4 * scale, borderRadius: 12 * scale }]}>
                      <Text style={{ fontSize: 14 * scale }}>{trendInfo.icon}</Text>
                      <Text style={[styles.trendLabel, { color: trendInfo.color, fontSize: 12 * scale, marginLeft: 4 * scale }]}>
                        {trendInfo.label}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Top 감정 */}
                {report.top_emotions && report.top_emotions.length > 0 && (
                  <View style={[styles.topEmotionsContainer, { marginTop: 16 * scale }]}>
                    <Text style={[styles.topEmotionsLabel, { color: colors.textSecondary, fontSize: 12 * scale }]}>
                      가장 많이 기록한 감정
                    </Text>
                    <View style={[styles.topEmotionsRow, { marginTop: 8 * scale }]}>
                      {report.top_emotions.map((icon, index) => (
                        <Text key={index} style={{ fontSize: 32 * scale, marginHorizontal: 4 * scale }}>
                          {icon}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* 통계 그리드 */}
            <View style={[styles.statsGrid, { paddingHorizontal: 16 * scale, marginTop: 16 * scale }]}>
              <View style={styles.statsRow}>
                {renderStatCard('📝', report.total_logs, '감정 기록')}
                {renderStatCard('📅', report.active_days, '활동 일수')}
              </View>
              <View style={[styles.statsRow, { marginTop: 8 * scale }]}>
                {renderStatCard('🎯', report.challenge_participations, '챌린지 참여')}
                {renderStatCard('🏆', report.challenges_completed, '챌린지 완주')}
              </View>
              <View style={[styles.statsRow, { marginTop: 8 * scale }]}>
                {renderStatCard('💌', report.encouragements_sent, '보낸 응원')}
                {renderStatCard('💝', report.encouragements_received, '받은 응원')}
              </View>
            </View>

            {/* 감정 분포 */}
            <View style={[styles.section, { paddingHorizontal: 16 * scale, marginTop: 24 * scale }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 15 * scale, marginBottom: 16 * scale }]}>
                🎨 감정 분포
              </Text>
              <View style={[styles.sectionCard, { backgroundColor: colors.card, padding: 16 * scale, borderRadius: 16 * scale }]}>
                {renderEmotionDistribution()}
              </View>
            </View>

            {/* 요일별 패턴 */}
            <View style={[styles.section, { paddingHorizontal: 16 * scale }]}>
              <View style={[styles.sectionCard, { backgroundColor: colors.card, padding: 16 * scale, borderRadius: 16 * scale }]}>
                {renderWeeklyPattern()}
              </View>
            </View>

            {/* AI 인사이트 (있는 경우) */}
            {report.ai_insight && (
              <View style={[styles.section, { paddingHorizontal: 16 * scale }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 15 * scale, marginBottom: 12 * scale }]}>
                  💡 AI 인사이트
                </Text>
                <View style={[styles.insightCard, { backgroundColor: colors.primary + '15', padding: 16 * scale, borderRadius: 16 * scale }]}>
                  <Text style={[styles.insightText, { color: colors.text, fontSize: 14 * scale, lineHeight: 22 * scale }]}>
                    {report.ai_insight}
                  </Text>
                </View>
              </View>
            )}

            {/* 추천 (있는 경우) */}
            {report.ai_recommendations && report.ai_recommendations.length > 0 && (
              <View style={[styles.section, { paddingHorizontal: 16 * scale, marginBottom: 24 * scale }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 15 * scale, marginBottom: 12 * scale }]}>
                  ✨ 추천 활동
                </Text>
                {report.ai_recommendations.map((rec, index) => (
                  <View key={index} style={[styles.recommendationItem, { backgroundColor: colors.card, padding: 12 * scale, borderRadius: 12 * scale, marginBottom: 8 * scale }]}>
                    <Text style={[styles.recommendationText, { color: colors.text, fontSize: 13 * scale }]}>
                      • {rec}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 생성 시간 */}
            <Text style={[styles.generatedAt, { color: colors.textSecondary, fontSize: Math.max(12, 12 * scale), textAlign: 'center', marginBottom: 24 * scale }]}>
              {new Date(report.generated_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} 생성
            </Text>
          </>
        )}
      </ScrollView>
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
  loadingText: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontWeight: '300',
  },
  headerTitle: {
    fontWeight: '700',
  },
  monthSelector: {},
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  monthButtonText: {
    fontWeight: '600',
  },
  newBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  summarySection: {},
  summaryCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodText: {},
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendLabel: {
    fontWeight: '600',
  },
  topEmotionsContainer: {
    alignItems: 'center',
  },
  topEmotionsLabel: {},
  topEmotionsRow: {
    flexDirection: 'row',
  },
  statsGrid: {},
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statValue: {
    fontWeight: '800',
  },
  statLabel: {},
  section: {},
  sectionTitle: {
    fontWeight: '700',
  },
  sectionCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  distributionContainer: {},
  distributionItem: {},
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emotionName: {
    fontWeight: '500',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bar: {},
  barText: {
    position: 'absolute',
    right: 8,
    fontWeight: '600',
  },
  emptyChart: {
    alignItems: 'center',
  },
  emptyChartText: {},
  weeklyPatternContainer: {},
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayBarContainer: {
    width: '70%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  dayBar: {
    width: '100%',
  },
  dayLabel: {},
  dayCount: {
    fontWeight: '600',
  },
  insightCard: {},
  insightText: {},
  recommendationItem: {},
  recommendationText: {},
  generatedAt: {},
});

export default EmotionReportScreen;
