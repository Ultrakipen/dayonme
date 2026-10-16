import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import reviewService from '../../../services/api/reviewService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

interface TimelineItem {
  time: string;
  emotion: string;
  icon: string;
  temperature: number;
}

interface Props {
  period?: 'week' | 'month' | 'year';
  periodText?: string;
}

export const EmotionTimeline: React.FC<Props> = React.memo(({ period = 'week', periodText = '이번 주' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fadeAnims = useRef<Animated.Value[]>([]).current;
  const slideAnims = useRef<Animated.Value[]>([]).current;

  const loadTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getPersonalTimeline(period);
      setItems(response.data.items || []);
    } catch (err) {
      setError('감정 타임라인을 불러오는데 실패했습니다');
      console.error('개인 감정 타임라인 로드 실패:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  // 애니메이션 실행
  useEffect(() => {
    if (!loading && displayItems.length > 0) {
      startAnimations();
    }
  }, [loading, items]);

  const getDefaultItems = (): TimelineItem[] => {
    switch (period) {
      case 'week':
        return [
          { time: '월요일', emotion: '설렘', icon: '🦋', temperature: 36.8 },
          { time: '수요일', emotion: '안정', icon: '🌿', temperature: 36.5 },
          { time: '금요일', emotion: '활기', icon: '⚡', temperature: 37.0 },
        ];
      case 'month':
        return [
          { time: '월초', emotion: '활기', icon: '⚡', temperature: 36.7 },
          { time: '월중', emotion: '평온', icon: '🧘', temperature: 36.5 },
          { time: '월말', emotion: '기대', icon: '💫', temperature: 36.9 },
        ];
      case 'year':
        return [
          { time: '봄', emotion: '설렘', icon: '🦋', temperature: 37.0 },
          { time: '여름', emotion: '활기', icon: '🔥', temperature: 37.2 },
          { time: '가을', emotion: '평온', icon: '🍂', temperature: 36.5 },
          { time: '겨울', emotion: '온화', icon: '☀️', temperature: 36.3 },
        ];
    }
  };

  const displayItems = items.length > 0 ? items : getDefaultItems();

  // 애니메이션 값 초기화 및 실행 (displayItems가 변경될 때마다)
  if (fadeAnims.length !== displayItems.length) {
    fadeAnims.length = 0;
    slideAnims.length = 0;
    displayItems.forEach(() => {
      fadeAnims.push(new Animated.Value(0));
      slideAnims.push(new Animated.Value(30));
    });

    // 애니메이션 실행
    if (!loading && displayItems.length > 0) {
      setTimeout(() => {
        const animations = displayItems.map((_, index) => {
          return Animated.parallel([
            Animated.timing(fadeAnims[index], {
              toValue: 1,
              duration: 400,
              delay: index * 150,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnims[index], {
              toValue: 0,
              duration: 400,
              delay: index * 150,
              useNativeDriver: true,
            }),
          ]);
        });

        Animated.stagger(100, animations).start();
      }, 100);
    }
  }

  // 순차 애니메이션 실행 함수 (legacy)
  const startAnimations = () => {
    const animations = displayItems.map((_, index) => {
      return Animated.parallel([
        Animated.timing(fadeAnims[index], {
          toValue: 1,
          duration: 400,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[index], {
          toValue: 0,
          duration: 400,
          delay: index * 150,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(100, animations).start();
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 37.0) return '#FF6B6B';
    if (temp >= 36.5) return '#FFA500';
    if (temp >= 36.0) return '#52C41A';
    if (temp >= 35.5) return '#87CEEB';
    return '#6B7280';
  };

  const getCardBackgroundColor = (temp: number) => {
    if (isDark) {
      if (temp >= 37.0) return 'rgba(239, 68, 68, 0.12)';
      if (temp >= 36.5) return 'rgba(245, 158, 11, 0.12)';
      if (temp >= 36.0) return 'rgba(16, 185, 129, 0.12)';
      if (temp >= 35.5) return 'rgba(59, 130, 246, 0.12)';
      return 'rgba(107, 114, 128, 0.12)';
    } else {
      return colors.surface || colors.background;
    }
  };

  const getIconCircleBackground = () => {
    return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  };

  const getProgressBarBackground = () => {
    return isDark ? 'rgba(255, 255, 255, 0.1)' : colors.border;
  };

  const getInsightIconBackground = () => {
    return isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)';
  };

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="감정 타임라인">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body }}>{error}</Text>
          <TouchableOpacity
            onPress={loadTimeline}
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

  if (loading && items.length === 0) {
    return null;
  }

  return (
    <Card accessible={true} accessibilityLabel={`나의 ${periodText} 감정 흐름`}>
      <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4, marginBottom: 16 * scale }]}>
        나의 {periodText} 감정 흐름
      </Text>

      <View style={[styles.timeline, { gap: 12 * scale }]}>
        {displayItems.map((item, index) => (
          <Animated.View
            key={index}
            accessible={true}
            accessibilityLabel={`${item.time}, ${item.emotion} 감정, 온도 ${item.temperature}도`}
            style={[
              styles.timelineItem,
              {
                opacity: fadeAnims[index] || 1,
                transform: [{ translateX: slideAnims[index] || 0 }],
                marginBottom: 12 * scale
              },
            ]}
          >
            <View style={[
              styles.timelineCard,
              {
                backgroundColor: getCardBackgroundColor(item.temperature),
                shadowColor: isDark ? 'transparent' : '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 8,
                elevation: isDark ? 0 : 2,
                padding: 18 * scale,
                borderRadius: 18 * scale
              }
            ]}>
              <View style={[styles.timelineHeader, { marginBottom: 14 * scale }]}>
                <View style={styles.dayContainer}>
                  <Text style={[styles.time, { color: colors.text, fontSize: FONT_SIZES.body }]}>{item.time}</Text>
                </View>
                <View style={[styles.temperatureChip, {
                  backgroundColor: getTemperatureColor(item.temperature) + '30',
                  paddingHorizontal: 14 * scale,
                  paddingVertical: 8 * scale,
                  borderRadius: 14 * scale
                }]}>
                  <Text style={[styles.temperature, { color: getTemperatureColor(item.temperature), fontSize: FONT_SIZES.body }]}>
                    {item.temperature}°
                  </Text>
                </View>
              </View>

              <View style={[styles.emotionContainer, { gap: 12 * scale, marginBottom: 14 * scale }]}>
                <View style={[styles.iconCircle, {
                  backgroundColor: getIconCircleBackground(),
                  width: 52 * scale,
                  height: 52 * scale,
                  borderRadius: 26 * scale
                }]}>
                  <Text style={{ fontSize: 32 * scale }}>{item.icon}</Text>
                </View>
                <Text style={[styles.emotion, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>{item.emotion}</Text>
              </View>

              <View style={[styles.temperatureBar, {
                backgroundColor: getProgressBarBackground(),
                height: 10 * scale,
                borderRadius: 5 * scale
              }]}>
                <Animated.View
                  style={[
                    styles.temperatureBarFill,
                    {
                      width: `${Math.max(0, Math.min(((item.temperature - 35) / 3) * 100, 100))}%`,
                      backgroundColor: getTemperatureColor(item.temperature),
                      borderRadius: 5 * scale
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      {displayItems.length > 0 && (
        <View style={[styles.insight, {
          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : colors.surface || colors.border + '20',
          marginTop: 20 * scale,
          padding: 16 * scale,
          borderRadius: 16 * scale,
          gap: 12 * scale
        }]}>
          <View style={[styles.insightIconContainer, {
            backgroundColor: getInsightIconBackground(),
            width: 36 * scale,
            height: 36 * scale,
            borderRadius: 18 * scale
          }]}>
            <Text style={{ fontSize: FONT_SIZES.h2 }}>💡</Text>
          </View>
          <Text style={[styles.insightText, {
            color: colors.text,
            fontSize: FONT_SIZES.body,
            lineHeight: 22 * scale
          }]}>
            {displayItems.length > 0 ?
              `${displayItems[0].time}에 ${displayItems[0].emotion}을 주로 느꼈어요` :
              '아직 데이터가 충분하지 않아요'}
          </Text>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
  },
  timeline: {
  },
  timelineItem: {
  },
  timelineCard: {
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayContainer: {
    flex: 1,
  },
  time: {
    fontWeight: '700',
  },
  temperatureChip: {
  },
  temperature: {
    fontWeight: '800',
  },
  emotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotion: {
    fontWeight: '700',
  },
  temperatureBar: {
    overflow: 'hidden',
  },
  temperatureBarFill: {
    height: '100%',
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
