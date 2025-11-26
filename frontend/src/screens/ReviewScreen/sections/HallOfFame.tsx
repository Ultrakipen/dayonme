import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import comfortLevelService, { HallOfFameRank } from '../../../services/api/comfortLevelService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

export const HallOfFame: React.FC = React.memo(() => {
  const { colors } = useModernTheme();
  const [rankings, setRankings] = useState<HallOfFameRank[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [error, setError] = useState<string | null>(null);
  const scale = getScale();

  const loadRankings = useCallback(async () => {
    try {
      setError(null);
      const data = await comfortLevelService.getHallOfFame(period);
      // 배열인지 확인
      const rankArray = Array.isArray(data) ? data : [];
      setRankings(rankArray.slice(0, 10));
    } catch (err) {
      setError('명예의 전당을 불러오는데 실패했습니다');
      console.error('명예의 전당 로드 실패:', err);
      setRankings([]);
    }
  }, [period]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const getRankBadge = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}위`;
  };

  const periods = [
    { key: 'daily' as const, label: '일간' },
    { key: 'weekly' as const, label: '주간' },
    { key: 'monthly' as const, label: '월간' },
  ];

  if (error) {
    return (
      <Card variant="highlight" style={{ padding: 16 * scale, marginBottom: 12 * scale }} accessible={true} accessibilityLabel="위로 명예의 전당">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={loadRankings}
            style={[styles.retryButton, { marginTop: 12 * scale }]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body * scale }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <Card
      variant="highlight"
      style={{ padding: 16 * scale, marginBottom: 12 * scale }}
      accessible={true}
      accessibilityLabel="위로 명예의 전당"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
          🏆 위로 명예의 전당
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale, marginTop: 4 * scale }]}>
          가장 많은 위로를 받은 익명 사용자
        </Text>
      </View>

      <View style={[styles.periodSelector, { marginTop: 12 * scale, gap: 8 * scale }]}>
        {periods.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[
              styles.periodButton,
              {
                backgroundColor: period === p.key ? colors.primary : 'transparent',
                paddingHorizontal: 12 * scale,
                paddingVertical: 6 * scale,
                borderRadius: 16 * scale,
                borderWidth: period === p.key ? 0 : 1.5,
                borderColor: colors.textSecondary,
              },
            ]}
            onPress={() => setPeriod(p.key)}
            accessibilityRole="button"
            accessibilityLabel={`${p.label} 랭킹`}
            accessibilityState={{ selected: period === p.key }}
          >
            <Text style={[
              styles.periodText,
              {
                color: period === p.key ? '#fff' : colors.textSecondary,
                fontSize: FONT_SIZES.caption * scale
              }
            ]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 14 * scale }}>
        {rankings.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
            아직 랭킹 데이터가 없습니다
          </Text>
        ) : (
          rankings.map((item, index) => (
            <View
              key={item.rank_id}
              style={[
                styles.rankItem,
                {
                  borderBottomWidth: index < rankings.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  paddingVertical: 10 * scale
                }
              ]}
              accessible={true}
              accessibilityLabel={`${getRankBadge(item.rank_position)} 익명${item.user_id}, 공감력 ${item.impact_score}점, 응원 ${item.comfort_count}개`}
            >
              <Text style={[styles.rankBadge, { fontSize: FONT_SIZES.bodySmall * scale, minWidth: 40 * scale }]}>
                {getRankBadge(item.rank_position)}
              </Text>
              <Text style={[styles.rankName, {
                color: colors.text,
                fontSize: FONT_SIZES.bodySmall * scale,
                flex: 1
              }]}>
                익명{item.user_id}
              </Text>
              <View style={styles.rankStats}>
                <Text style={[styles.rankStat, { color: colors.textSecondary, fontSize: FONT_SIZES.small * scale }]}>
                  {item.impact_score}
                </Text>
                <Text style={[styles.rankStat, {
                  color: colors.textSecondary,
                  fontSize: FONT_SIZES.small * scale,
                  marginLeft: 8 * scale
                }]}>
                  {item.comfort_count}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'column',
  },
  description: {
    lineHeight: 18,
  },
  title: {
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
  },
  periodButton: {},
  periodText: {
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    fontWeight: '700',
  },
  rankName: {
    fontWeight: '600',
  },
  rankStats: {
    flexDirection: 'row',
  },
  rankStat: {},
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
