import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import comfortLevelService, { ComfortStats } from '../../../services/api/comfortLevelService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

export const ComfortLevel: React.FC = React.memo(() => {
  const { colors } = useModernTheme();
  const [stats, setStats] = useState<ComfortStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scale = getScale();

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const data = await comfortLevelService.getStats();
      setStats(data);
    } catch (err) {
      setError('위로 통계를 불러오는데 실패했습니다');
      console.error('위로 통계 로드 실패:', err);
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (error) {
    return (
      <Card variant="warm" style={{ padding: 12 * scale, marginBottom: 10 * scale }} accessible={true} accessibilityLabel="위로 레벨">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body }}>{error}</Text>
          <TouchableOpacity
            onPress={loadStats}
            style={[styles.retryButton, { marginTop: 12 * scale }]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  if (!stats) return null;

  const expProgress = stats.next_level_exp ? (stats.level_exp / stats.next_level_exp) * 100 : 0;

  return (
    <Card
      variant="warm"
      style={{ padding: 12 * scale, marginBottom: 10 * scale }}
      accessible={true}
      accessibilityLabel={`위로 레벨 ${stats.comfort_level}, ${stats.level_name}`}
    >
      <View style={styles.header}>
        <Text style={[styles.levelEmoji, { fontSize: 28 * scale }]}>
          {stats.icon_emoji}
        </Text>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelName, { color: colors.text, fontSize: FONT_SIZES.bodyLarge }]}>
            {stats.level_name}
          </Text>
          <Text style={[styles.levelNumber, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
            Lv.{stats.comfort_level}
          </Text>
        </View>
        <Text style={[styles.expText, { color: colors.textSecondary, fontSize: FONT_SIZES.caption, marginLeft: 'auto' }]}>
          {stats.level_exp}/{stats.next_level_exp}
        </Text>
      </View>

      <View style={[styles.expBarContainer, { marginTop: 8 * scale }]}>
        <View
          style={[styles.expBarBg, {
            backgroundColor: colors.border,
            height: 6 * scale,
            borderRadius: 3 * scale
          }]}
          accessible={true}
          accessibilityLabel={`경험치 ${Math.round(expProgress)}퍼센트`}
        >
          <View style={[styles.expBarFill, {
            width: `${expProgress}%`,
            backgroundColor: colors.primary,
            height: 6 * scale,
            borderRadius: 3 * scale
          }]} />
        </View>
      </View>

      <View style={[styles.statsGrid, { marginTop: 10 * scale }]}>
        <View style={styles.statItem} accessible={true} accessibilityLabel={`응원 ${stats.comfort_given_count}개`}>
          <Text style={{ fontSize: FONT_SIZES.bodyLarge }}>💬</Text>
          <Text style={[styles.statValue, { color: colors.text, fontSize: FONT_SIZES.bodyLarge }]}>
            {stats.comfort_given_count}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
            응원
          </Text>
        </View>
        <View style={styles.statItem} accessible={true} accessibilityLabel={`공감력 ${stats.impact_score}점`}>
          <Text style={{ fontSize: FONT_SIZES.bodyLarge }}>⭐</Text>
          <Text style={[styles.statValue, { color: colors.text, fontSize: FONT_SIZES.bodyLarge }]}>
            {stats.impact_score}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
            공감력
          </Text>
        </View>
        <View style={styles.statItem} accessible={true} accessibilityLabel={`연속 ${stats.streak_days}일`}>
          <Text style={{ fontSize: FONT_SIZES.bodyLarge }}>🔥</Text>
          <Text style={[styles.statValue, { color: colors.text, fontSize: FONT_SIZES.bodyLarge }]}>
            {stats.streak_days}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
            연속
          </Text>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelEmoji: {
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  levelNumber: {
    fontWeight: '600',
  },
  expBarContainer: {
    gap: 6,
  },
  expBarBg: {
    overflow: 'hidden',
  },
  expBarFill: {},
  expText: {
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontWeight: '700',
  },
  statLabel: {},
  nextLevel: {
    alignItems: 'center',
  },
  nextLevelText: {
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
