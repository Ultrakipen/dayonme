import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import apiClient from '../../../services/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

const CACHE_KEY = '@personal_best_cache';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10분

interface PersonalBestData {
  currentStreak: number;
  bestStreak: number;
  currentWeekPosts: number;
  bestWeekPosts: number;
  currentMonthLikes: number;
  bestMonthLikes: number;
  currentPositiveRatio: number;
  bestPositiveRatio: number;
  achievements: Array<{
    type: string;
    title: string;
    isNew: boolean;
  }>;
}

interface Props {
  period?: 'week' | 'month' | 'year';
}

export const PersonalBest: React.FC<Props> = React.memo(({ period = 'week' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale), [scale]);

  const [data, setData] = useState<PersonalBestData | null>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useState(new Animated.Value(1))[0];

  // 캐시 로드
  const loadFromCache = useCallback(async (): Promise<PersonalBestData | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${period}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return cachedData;
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('Personal Best 캐시 로드 실패:', err);
    }
    return null;
  }, [period]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const cachedData = await loadFromCache();
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      const response = await apiClient.get(`/review/personal-best?period=${period}`);

      if (response.data.status === 'success') {
        const responseData = response.data.data;
        setData(responseData);
        await AsyncStorage.setItem(`${CACHE_KEY}_${period}`, JSON.stringify({
          data: responseData,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      if (__DEV__) console.error('Personal Best 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [period, loadFromCache]);

  // 펄스 애니메이션 (신기록 시)
  useEffect(() => {
    if (data?.achievements?.some(a => a.isNew)) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [data, pulseAnim]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data) return null;

  const stats = [
    {
      icon: '🔥',
      label: '연속 기록',
      current: data.currentStreak,
      best: data.bestStreak,
      unit: '일',
      isRecord: data.currentStreak >= data.bestStreak && data.currentStreak > 0,
    },
    {
      icon: '📝',
      label: '주간 기록',
      current: data.currentWeekPosts,
      best: data.bestWeekPosts,
      unit: '개',
      isRecord: data.currentWeekPosts >= data.bestWeekPosts && data.currentWeekPosts > 0,
    },
    {
      icon: '💕',
      label: '월간 공감',
      current: data.currentMonthLikes,
      best: data.bestMonthLikes,
      unit: '개',
      isRecord: data.currentMonthLikes >= data.bestMonthLikes && data.currentMonthLikes > 0,
    },
    {
      icon: '😊',
      label: '긍정 비율',
      current: data.currentPositiveRatio,
      best: data.bestPositiveRatio,
      unit: '%',
      isRecord: data.currentPositiveRatio >= data.bestPositiveRatio && data.currentPositiveRatio > 0,
    },
  ];

  const hasNewRecord = stats.some(s => s.isRecord);

  return (
    <Card accessible={true} accessibilityLabel="나의 최고 기록">
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TwemojiImage emoji="🏆" size={FONT_SIZES.h3 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale }]}>
            나의 최고 기록
          </Text>
        </View>
        {hasNewRecord && (
          <Animated.View style={[styles.newRecordBadge, {
            backgroundColor: '#FFD700' + '30',
            transform: [{ scale: pulseAnim }]
          }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TwemojiImage emoji="🎉" size={FONT_SIZES.caption * scale} style={{ marginRight: 4 * scale }} />
              <Text style={[styles.newRecordText, { fontSize: FONT_SIZES.caption * scale }]}>
                NEW!
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
        과거의 나와 비교해보세요
      </Text>

      {/* 통계 그리드 */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[styles.statCard, {
              backgroundColor: stat.isRecord
                ? (isDark ? 'rgba(255, 215, 0, 0.15)' : '#FFFDE7')
                : (isDark ? colors.surface : '#F8F9FA')
            }]}
            accessible={true}
            accessibilityLabel={`${stat.label}: 현재 ${stat.current}${stat.unit}, 최고 ${stat.best}${stat.unit}`}
          >
            <TwemojiImage emoji={stat.icon} size={FONT_SIZES.h1 * scale} style={{ marginBottom: 8 * scale }} />
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
              {stat.label}
            </Text>
            <View style={styles.statValues}>
              <Text style={[styles.currentValue, {
                color: stat.isRecord ? '#FFD700' : colors.primary,
                fontSize: FONT_SIZES.h2 * scale
              }]}>
                {stat.current}{stat.unit}
              </Text>
              <View style={styles.bestValue}>
                <Text style={[styles.bestLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale }]}>
                  최고
                </Text>
                <Text style={[styles.bestNumber, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
                  {stat.best}{stat.unit}
                </Text>
              </View>
            </View>
            {stat.isRecord && (
              <View style={[styles.recordBadge, { backgroundColor: '#FFD700' }]}>
                <Text style={[styles.recordText, { fontSize: FONT_SIZES.tiny * scale }]}>
                  최고기록!
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* 최근 달성 */}
      {data.achievements && data.achievements.length > 0 && (
        <View style={styles.achievementsContainer}>
          <Text style={[styles.achievementsTitle, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}>
            최근 달성
          </Text>
          <View style={styles.achievementsList}>
            {data.achievements.slice(0, 3).map((achievement, index) => (
              <View
                key={index}
                style={[styles.achievementItem, {
                  backgroundColor: achievement.isNew
                    ? (isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9')
                    : (isDark ? colors.surface : '#F5F5F5')
                }]}
              >
                <Text style={[styles.achievementText, { color: colors.text, fontSize: FONT_SIZES.caption * scale }]}>
                  {achievement.title}
                </Text>
                {achievement.isNew && (
                  <TwemojiImage emoji="✨" size={FONT_SIZES.caption * scale} />
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 격려 메시지 */}
      <View style={[styles.encouragement, {
        backgroundColor: isDark ? colors.primary + '15' : colors.primary + '10'
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <TwemojiImage emoji={hasNewRecord ? '🎊' : '💪'} size={FONT_SIZES.bodySmall * scale} style={{ marginRight: 6 * scale }} />
          <Text style={[styles.encouragementText, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}>
            {hasNewRecord
              ? '새로운 기록을 세웠어요! 정말 대단해요!'
              : '꾸준히 하다 보면 새 기록을 세울 수 있어요!'}
          </Text>
        </View>
      </View>
    </Card>
  );
});

const createStyles = (scale: number) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4 * scale,
  },
  title: {
    fontWeight: '700',
  },
  newRecordBadge: {
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 12 * scale,
  },
  newRecordText: {
    fontWeight: '700',
  },
  subtitle: {
    marginBottom: 16 * scale,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12 * scale,
    marginBottom: 16 * scale,
  },
  statCard: {
    width: '47%',
    padding: 16 * scale,
    borderRadius: 16 * scale,
    alignItems: 'center',
    position: 'relative',
  },
  statLabel: {
    fontWeight: '500',
    marginBottom: 8 * scale,
  },
  statValues: {
    alignItems: 'center',
  },
  currentValue: {
    fontWeight: '800',
  },
  bestValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * scale,
    marginTop: 4 * scale,
  },
  bestLabel: {
    fontWeight: '500',
  },
  bestNumber: {
    fontWeight: '600',
  },
  recordBadge: {
    position: 'absolute',
    top: 8 * scale,
    right: 8 * scale,
    paddingHorizontal: 8 * scale,
    paddingVertical: 2 * scale,
    borderRadius: 8 * scale,
  },
  recordText: {
    color: '#000000',
    fontWeight: '700',
  },
  achievementsContainer: {
    marginBottom: 16 * scale,
  },
  achievementsTitle: {
    fontWeight: '600',
    marginBottom: 8 * scale,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8 * scale,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 16 * scale,
    gap: 4 * scale,
  },
  achievementText: {
    fontWeight: '500',
  },
  encouragement: {
    padding: 12 * scale,
    borderRadius: 12 * scale,
    alignItems: 'center',
  },
  encouragementText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
