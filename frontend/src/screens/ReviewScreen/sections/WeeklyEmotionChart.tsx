// src/screens/ReviewScreen/sections/WeeklyEmotionChart.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { useAuth } from '../../../contexts/AuthContext';
import { getScale } from '../../../utils/responsive';
import { FONT_SIZES } from '../../../constants';
import emotionService from '../../../services/api/emotionService';
import { devLog } from '../../../utils/security';

type WeeklyEmotion = {
  date: string;
  emotions: Array<{
    name: string;
    icon: string;
    color: string;
    count: number;
  }>;
};

export const WeeklyEmotionChart: React.FC = () => {
  const { colors, isDark } = useModernTheme();
  const { user } = useAuth();
  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale, colors, isDark), [scale, colors, isDark]);

  const [weeklyEmotions, setWeeklyEmotions] = useState<WeeklyEmotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 주간 감정 데이터 로드
  const loadWeeklyEmotions = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await emotionService.getEmotionStats({
        start_date: weekAgo.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        source: 'post',
      });

      setWeeklyEmotions(response?.data?.data || []);
    } catch (error) {
      devLog('주간 감정 로드 실패:', error);
      setWeeklyEmotions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadWeeklyEmotions();
  }, [loadWeeklyEmotions]);

  // 날짜 배열 생성 (월요일~일요일)
  const dates = useMemo(() => {
    const result = [];
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : -(currentDay - 1);

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + mondayOffset + i);
      const isToday = date.toDateString() === today.toDateString();
      result.push({
        dateStr: date.toISOString().split('T')[0],
        dayName: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
        isToday,
      });
    }
    return result;
  }, []);

  // 감정 데이터 확인
  const hasAnyEmotion = weeklyEmotions.some(
    (data) => data.emotions && data.emotions.length > 0
  );

  // 감정 삭제
  const handleDeleteEmotions = useCallback(async () => {
    try {
      await emotionService.deleteTodayEmotions();
      await loadWeeklyEmotions();
      alert('오늘의 감정 기록이 삭제되었습니다.');
    } catch (error) {
      devLog('감정 삭제 실패:', error);
      alert('감정 기록 삭제 중 오류가 발생했습니다.');
    }
  }, [loadWeeklyEmotions]);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>📊 이번 주 감정 기록</Text>
          <View style={styles.actions}>
            {/* 접기/펼치기 버튼 */}
            <TouchableOpacity
              onPress={() => setIsCollapsed(!isCollapsed)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: isCollapsed
                    ? isDark ? '#7f1d1d' : '#fef2f2'
                    : isDark ? '#14532d' : '#dcfce7',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                size={18 * scale}
                color={isCollapsed ? '#dc2626' : '#16a34a'}
              />
            </TouchableOpacity>

            {/* 삭제 버튼 */}
            <TouchableOpacity
              onPress={handleDeleteEmotions}
              style={[
                styles.actionButton,
                { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' },
              ]}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={18 * scale}
                color="#dc2626"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 컨텐츠 */}
      {!isCollapsed && (
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>감정 기록 로딩중...</Text>
            </View>
          ) : (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {dates.map((dateInfo) => {
                  const dayEmotions = weeklyEmotions.find(
                    (data) => data.date === dateInfo.dateStr
                  );
                  const hasEmotion =
                    dayEmotions &&
                    Array.isArray(dayEmotions.emotions) &&
                    dayEmotions.emotions.length > 0;
                  const topEmotion = hasEmotion
                    ? dayEmotions.emotions.reduce((prev, current) =>
                        prev.count > current.count ? prev : current
                      )
                    : null;

                  const isEmoji = topEmotion && /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(topEmotion.icon);

                  return (
                    <View key={dateInfo.dateStr} style={styles.dayContainer}>
                      <View
                        style={[
                          styles.emotionCircle,
                          {
                            backgroundColor: hasEmotion
                              ? `${topEmotion?.color}30`
                              : 'transparent',
                            borderColor: dateInfo.isToday
                              ? colors.primary
                              : hasEmotion
                              ? topEmotion?.color || colors.border
                              : colors.border,
                          },
                        ]}
                      >
                        <View style={[styles.emotionInner, { backgroundColor: colors.card }]}>
                          {hasEmotion && topEmotion ? (
                            isEmoji ? (
                              <Text style={styles.emotionEmoji}>{topEmotion.icon}</Text>
                            ) : (
                              <MaterialCommunityIcons
                                name={topEmotion.icon as any}
                                size={30 * scale}
                                color={topEmotion.color || colors.primary}
                              />
                            )
                          ) : (
                            <MaterialCommunityIcons
                              name="emoticon-outline"
                              size={30 * scale}
                              color={colors.border}
                            />
                          )}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: dateInfo.isToday ? colors.primary : colors.text,
                            fontWeight: dateInfo.isToday ? '700' : '600',
                          },
                        ]}
                      >
                        {dateInfo.dayName}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              {!hasAnyEmotion && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    아직 이번 주에 기록된 감정이 없습니다{'\n'}
                    글을 작성하며 감정을 기록해보세요! ✨
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (scale: number, colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16 * scale,
      marginBottom: 16 * scale,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: 16 * scale,
      paddingVertical: 12 * scale,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#f3f4f6',
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: FONT_SIZES.body,
      fontFamily: 'Pretendard-Bold',
      color: colors.text,
      letterSpacing: -0.4,
    },
    actions: {
      flexDirection: 'row',
      gap: 8 * scale,
      alignItems: 'center',
    },
    actionButton: {
      width: 27 * scale,
      height: 27 * scale,
      borderRadius: 12 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingHorizontal: 12 * scale,
      paddingVertical: 8 * scale,
    },
    loadingContainer: {
      paddingVertical: 32 * scale,
      alignItems: 'center',
      gap: 8 * scale,
    },
    loadingText: {
      fontSize: FONT_SIZES.bodySmall,
      color: colors.textSecondary,
    },
    scrollContent: {
      paddingHorizontal: 3 * scale,
      gap: 4 * scale,
    },
    dayContainer: {
      alignItems: 'center',
      minWidth: 55 * scale,
    },
    emotionCircle: {
      width: 40 * scale,
      height: 40 * scale,
      borderRadius: 23 * scale,
      padding: 2 * scale,
      borderWidth: 3,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emotionInner: {
      width: 45 * scale,
      height: 45 * scale,
      borderRadius: 23 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emotionEmoji: {
      fontSize: 30 * scale,
    },
    dayText: {
      marginTop: 3 * scale,
      fontSize: FONT_SIZES.caption,
    },
    emptyContainer: {
      paddingVertical: 12 * scale,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: FONT_SIZES.bodySmall,
      color: colors.textSecondary,
      lineHeight: 22 * scale,
    },
  });
