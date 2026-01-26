import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { TwemojiImage } from '../../../components/common/TwemojiImage';
import { useReviewData } from '../ReviewDataContext';

interface DayData {
  date: string;
  count: number;
  level: number; // 0-4
}

interface Props {
  period?: 'week' | 'month' | 'year';
}

export const EmotionHeatmap: React.FC<Props> = React.memo(({ period = 'week' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const { data: reviewData } = useReviewData();

  // 백엔드에서 제공하는 실제 데이터 사용
  const daysData = useMemo((): DayData[] => {
    const heatmapData = reviewData.summary?.heatmapData;

    if (heatmapData && heatmapData.length > 0) {
      // 백엔드 데이터가 있으면 그대로 사용
      return heatmapData;
    }

    // 데이터가 없을 경우에만 빈 배열 생성 (더미 데이터 없음)
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const result: DayData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      result.push({
        date: date.toISOString().split('T')[0],
        count: 0,
        level: 0,
      });
    }
    return result;
  }, [reviewData.summary?.heatmapData, period]);

  // period별 표시 데이터 처리
  const displayData = useMemo(() => {
    if (period === 'week') {
      return daysData.slice(-7);
    } else if (period === 'month') {
      return daysData;
    } else {
      // 연간 모드: 12개월로 그룹화
      const monthlyData: DayData[] = [];
      const today = new Date();

      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = monthDate.toISOString().split('T')[0].substring(0, 7);

        // 해당 월의 모든 데이터 합산
        const monthDays = daysData.filter(d => d.date.startsWith(monthStr));
        const totalCount = monthDays.reduce((sum, d) => sum + d.count, 0);
        const avgLevel = monthDays.length > 0
          ? Math.round(monthDays.reduce((sum, d) => sum + d.level, 0) / monthDays.length)
          : 0;

        monthlyData.push({
          date: monthStr,
          count: totalCount,
          level: avgLevel,
        });
      }
      return monthlyData;
    }
  }, [daysData, period]);

  const getLevelColor = (level: number) => {
    if (isDark) {
      const colors = ['#1e293b', '#3b82f6', '#2563eb', '#1e40af', '#1e3a8a'];
      return colors[level];
    } else {
      const colors = ['#e2e8f0', '#60a5fa', '#3b82f6', '#2563eb', '#1e40af'];
      return colors[level];
    }
  };

  // 텍스트 색상 결정 (배경색에 따라)
  const getTextColor = (level: number) => {
    if (isDark) {
      return '#FFFFFF'; // 다크모드는 항상 흰색
    } else {
      // 라이트모드: level 0-1은 어두운 색, level 2-4는 흰색
      return level <= 1 ? colors.text : '#FFFFFF';
    }
  };

  const getWeekDay = (dateStr: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[new Date(dateStr).getDay()];
  };

  const getMonthLabel = (dateStr: string) => {
    const month = parseInt(dateStr.split('-')[1]);
    return `${month}월`;
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
          <TwemojiImage emoji="📅" size={FONT_SIZES.h4 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>활동 캘린더</Text>
        </View>
        <View style={[styles.statsRow, { gap: 12 * scale }]}>
          <View style={styles.statBadge} accessible={true} accessibilityLabel={`총 ${totalRecords}개 기록`}>
            <Text style={[styles.statValue, { color: colors.primary, fontSize: FONT_SIZES.h1 * scale }]}>{totalRecords}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale, marginTop: 2 * scale }]}>기록</Text>
          </View>
          <View style={styles.statBadge} accessible={true} accessibilityLabel={`${activeDays}일 활동`}>
            <Text style={[styles.statValue, { color: colors.primary, fontSize: FONT_SIZES.h1 * scale }]}>{activeDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale, marginTop: 2 * scale }]}>활동일</Text>
          </View>
          <View style={styles.statBadge} accessible={true} accessibilityLabel={`${streak}일 연속`}>
            <Text style={[styles.statValue, { color: colors.primary, fontSize: FONT_SIZES.h1 * scale }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale, marginTop: 2 * scale }]}>연속</Text>
          </View>
        </View>
      </View>

      <View style={[styles.heatmapContainer, { marginBottom: 12 * scale }]}>
        {/* 레이블 */}
        {period === 'week' && (
          <View style={[styles.weekLabels, { marginBottom: 8 * scale }]}>
            {displayData.map((day, index) => (
              <Text
                key={index}
                style={[
                  styles.weekLabel,
                  {
                    color: colors.textSecondary,
                    fontSize: FONT_SIZES.tiny * scale,
                    width: 40 * scale
                  }
                ]}
              >
                {getWeekDay(day.date)}
              </Text>
            ))}
          </View>
        )}

        {/* 연간 모드 */}
        {period === 'year' && (
          <View style={[styles.yearGrid, { gap: 5 * scale }]}>
            {displayData.map((day, index) => {
              const month = parseInt(day.date.split('-')[1]);
              return (
                <View
                  key={index}
                  accessible={true}
                  accessibilityLabel={`${month}월, ${day.count}개 기록`}
                  style={[
                    styles.yearCell,
                    {
                      backgroundColor: getLevelColor(day.level),
                      borderRadius: 10 * scale,
                      flex: 1,
                      minHeight: 60 * scale,
                      paddingVertical: 8 * scale,
                    }
                  ]}
                >
                  <Text style={[styles.monthNumber, { color: getTextColor(day.level), fontSize: FONT_SIZES.tiny * scale, marginBottom: 4 * scale, opacity: 0.95 }]}>
                    {month}월
                  </Text>
                  {day.count > 0 && (
                    <Text style={[styles.cellText, { color: getTextColor(day.level), fontSize: FONT_SIZES.h4 * scale, fontFamily: 'Pretendard-ExtraBold' }]}>{day.count}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 주간/월간 모드 */}
        {period !== 'year' && (
          <View style={[styles.gridContainer, { gap: 6 * scale }]}>
            {displayData.map((day, index) => {
              const cellSize = period === 'week' ? 40 * scale : 18 * scale;
              return (
                <View
                  key={index}
                  accessible={true}
                  accessibilityLabel={`${getWeekDay(day.date)}, ${day.count}개 기록`}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: getLevelColor(day.level),
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 8 * scale
                    }
                  ]}
                >
                  {period === 'week' && day.count > 0 && (
                    <Text style={[styles.cellText, { fontSize: FONT_SIZES.small * scale }]}>{day.count}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={[styles.legend, { gap: 8 * scale }]} accessible={true} accessibilityLabel="활동량 범례">
        <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale }]}>적음</Text>
        <View style={[styles.legendDots, { gap: 4 * scale }]}>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[styles.legendDot, { backgroundColor: getLevelColor(level), width: 12 * scale, height: 12 * scale, borderRadius: 3 * scale }]}
            />
          ))}
        </View>
        <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale }]}>많음</Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
  },
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Pretendard-ExtraBold',
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
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
  yearGrid: {
    flexDirection: 'row',
  },
  yearCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNumber: {
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-Bold',
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
