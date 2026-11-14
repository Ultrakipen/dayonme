import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

interface DayData {
  date: string;
  count: number;
  level: number; // 0-4
}

interface Props {
  data?: DayData[];
  period?: 'week' | 'month';
}

export const EmotionHeatmap: React.FC<Props> = React.memo(({ data, period = 'week' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);

  // 최근 7일 또는 30일 데이터 생성
  const getDaysData = (): DayData[] => {
    if (data) return data;

    const days = period === 'week' ? 7 : 30;
    const result: DayData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const randomCount = Math.floor(Math.random() * 5);
      result.push({
        date: date.toISOString().split('T')[0],
        count: randomCount,
        level: randomCount > 0 ? Math.min(Math.floor(randomCount / 1.5) + 1, 4) : 0,
      });
    }
    return result;
  };

  const daysData = getDaysData();

  // 주간 모드일 때 정확히 7일만 표시
  const displayData = period === 'week' ? daysData.slice(-7) : daysData;

  // 셀 숫자 글자색: 셀 배경(투명도 단계를 카드 위에 합성한 색)과의 대비가 더 큰 쪽(흰색/진한 색)을 고른다
  const cellTextColor = (level: number) => {
    const toRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const lum = (c: number[]) => {
      const f = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const alphas = [0, 0.25, 0.5, 0.75, 1];
    const fg = toRgb(colors.primary);
    const bg = toRgb(colors.card);
    const a = alphas[level];
    const mixed = fg.map((v, i) => v * a + bg[i] * (1 - a));
    const L = lum(mixed);
    const contrastWhite = 1.05 / (L + 0.05);
    const contrastDark = (L + 0.05) / (lum([18, 18, 18]) + 0.05);
    return contrastWhite >= contrastDark ? '#FFFFFF' : '#121212';
  };

  const getLevelColor = (level: number) => {
    const levels = [colors.border, colors.primary + '40', colors.primary + '80', colors.primary + 'BF', colors.primary];
    return levels[level];
  };

  const getWeekDay = (dateStr: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[new Date(dateStr).getDay()];
  };

  const totalRecords = displayData.reduce((sum, day) => sum + day.count, 0);
  const activeDays = displayData.filter(d => d.count > 0).length;
  const streak = calculateStreak(displayData);

  function calculateStreak(days: DayData[]): number {
    let currentStreak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  }

  return (
    <Card accessible={true} accessibilityLabel="활동 캘린더">
      <View style={[styles.header, { marginBottom: 16 * scale }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 * scale }}>
          <TwemojiImage emoji="📅" size={FONT_SIZES.h3 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>활동 캘린더</Text>
        </View>
        <View style={[styles.statsRow, { gap: 12 * scale }]}>
          <View style={styles.statBadge} accessible={true} accessibilityLabel={`총 ${totalRecords}개 기록`}>
            <Text style={[styles.statValue, { color: colors.primary, fontSize: FONT_SIZES.h1 }]}>{totalRecords}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny, marginTop: 2 * scale }]}>기록</Text>
          </View>
          <View style={styles.statBadge} accessible={true} accessibilityLabel={`${activeDays}일 활동`}>
            <Text style={[styles.statValue, { color: colors.primary, fontSize: FONT_SIZES.h1 }]}>{activeDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny, marginTop: 2 * scale }]}>활동일</Text>
          </View>
          <View style={styles.statBadge} accessible={true} accessibilityLabel={`${streak}일 연속`}>
            <Text style={[styles.statValue, { color: colors.primary, fontSize: FONT_SIZES.h1 }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny, marginTop: 2 * scale }]}>연속</Text>
          </View>
        </View>
      </View>

      <View style={[styles.heatmapContainer, { marginBottom: 12 * scale }]}>
        {period === 'week' && (
          <View style={[styles.weekLabels, { marginBottom: 8 * scale }]}>
            {displayData.map((day, index) => (
              <Text key={index} style={[styles.weekLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny, width: 40 * scale }]}>
                {getWeekDay(day.date)}
              </Text>
            ))}
          </View>
        )}

        <View style={[
          styles.gridContainer,
          period === 'week'
            ? { flexWrap: 'nowrap', justifyContent: 'space-around' } // 요일 헤더(space-around)와 같은 배치로 7열 정렬
            : { gap: 6 * scale }
        ]}>
          {displayData.map((day, index) => (
            <View
              key={index}
              accessible={true}
              accessibilityLabel={`${getWeekDay(day.date)}, ${day.count}개 기록`}
              style={[
                styles.cell,
                {
                  backgroundColor: getLevelColor(day.level),
                  width: period === 'week' ? 40 * scale : 18 * scale,
                  height: period === 'week' ? 40 * scale : 18 * scale,
                  borderRadius: 8 * scale
                }
              ]}
            >
              {period === 'week' && day.count > 0 && (
                <Text style={[styles.cellText, { fontSize: FONT_SIZES.small, color: cellTextColor(day.level) }]}>{day.count}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.legend, { gap: 8 * scale }]} accessible={true} accessibilityLabel="활동량 범례">
        <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny }]}>적음</Text>
        <View style={[styles.legendDots, { gap: 4 * scale }]}>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[styles.legendDot, { backgroundColor: getLevelColor(level), width: 12 * scale, height: 12 * scale, borderRadius: 3 * scale }]}
            />
          ))}
        </View>
        <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny }]}>많음</Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
  },
  title: {
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '800',
  },
  statLabel: {
  },
  heatmapContainer: {
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
  },
  legendDots: {
    flexDirection: 'row',
  },
  legendDot: {
  },
});
