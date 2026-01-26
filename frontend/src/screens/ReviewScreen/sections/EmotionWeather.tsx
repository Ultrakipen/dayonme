import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../services/api/client';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

const CACHE_KEY = '@emotion_weather_cache';
const CACHE_EXPIRY = 0; // 10분 → 테스트를 위해 0으로 변경

interface WeatherSegment {
  name: string;
  weather: string;
  icon: string;
  label: string;
  avgTemperature?: number;
  beforeSignup?: boolean;
  hasData?: boolean;
}

interface WeatherData {
  overall: {
    weather: string;
    icon: string;
    label: string;
    avgTemperature: number;
  };
  segments: WeatherSegment[];
  avgTemperature: number;
}

interface Props {
  period?: 'week' | 'month' | 'year';
}

export const EmotionWeather: React.FC<Props> = React.memo(({ period = 'week' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);

  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodInfo = useMemo(() => {
    switch (period) {
      case 'week':
        return {
          title: '오늘의 마음 날씨',
          accessibilityLabel: '오늘의 마음 날씨',
          accessibilityHint: '하루 동안의 감정 변화를 날씨로 표현합니다'
        };
      case 'month':
        return {
          title: '이번 달의 마음 날씨',
          accessibilityLabel: '이번 달의 마음 날씨',
          accessibilityHint: '한 달 동안의 감정 변화를 날씨로 표현합니다'
        };
      case 'year':
        return {
          title: '올해의 마음 날씨',
          accessibilityLabel: '올해의 마음 날씨',
          accessibilityHint: '일 년 동안의 감정 변화를 날씨로 표현합니다'
        };
    }
  }, [period]);

  // 캐시에서 로드
  const loadFromCache = useCallback(async (): Promise<WeatherData | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${period}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return cachedData;
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('날씨 캐시 로드 실패:', err);
    }
    return null;
  }, [period]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 캐시 확인
      const cachedData = await loadFromCache();
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // API 호출
      const response = await apiClient.get(`/review/emotion-weather?period=${period}`);

      if (response.data.status === 'success' && response.data.data) {
        const weatherData = response.data.data;
        console.log('🌦️ [EmotionWeather] API 응답:', JSON.stringify(weatherData, null, 2));
        setData(weatherData);

        // 캐시 저장
        await AsyncStorage.setItem(`${CACHE_KEY}_${period}`, JSON.stringify({
          data: weatherData,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      setError('날씨 정보를 불러오는데 실패했습니다');
      if (__DEV__) console.warn('감정 날씨 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [period, loadFromCache]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 에러 상태
  if (error) {
    return (
      <Card accessible={true} accessibilityLabel={periodInfo.accessibilityLabel}>
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={loadData}
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

  // 로딩 상태
  if (loading) {
    return (
      <Card accessible={true} accessibilityLabel={periodInfo.accessibilityLabel}>
        <View style={[styles.skeleton, { backgroundColor: colors.border, height: 120 * scale, borderRadius: 16 * scale }]} />
      </Card>
    );
  }

  // 데이터 없음
  if (!data || data.overall.weather === 'unknown') {
    return (
      <Card accessible={true} accessibilityLabel={periodInfo.accessibilityLabel}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 * scale }}>
          <TwemojiImage emoji="🌤️" size={FONT_SIZES.h4 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
            {periodInfo.title}
          </Text>
        </View>
        <View style={[styles.emptyBox, {
          backgroundColor: isDark ? colors.surface : colors.border + '30',
          padding: 24 * scale,
          borderRadius: 16 * scale,
        }]}>
          <TwemojiImage emoji="📝" size={40 * scale} style={{ marginBottom: 12 * scale }} />
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale, textAlign: 'center' }}>
            감정을 기록하면 마음 날씨가 나타나요
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card
      accessible={true}
      accessibilityLabel={periodInfo.accessibilityLabel}
      accessibilityHint={periodInfo.accessibilityHint}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 * scale }}>
        <TwemojiImage emoji="🌤️" size={FONT_SIZES.h4 * scale} style={{ marginRight: 8 * scale }} />
        <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
          {periodInfo.title}
        </Text>
      </View>

      <View style={[styles.weatherBox, {
        backgroundColor: isDark ? colors.surface : colors.border + '30',
        padding: 16 * scale,
        borderRadius: 16 * scale,
        gap: 12 * scale
      }]}>
        <TwemojiImage emoji={data.overall.icon} size={56 * scale} />
        <View style={styles.weatherInfo}>
          <Text style={[styles.weatherTitle, { color: colors.text, fontSize: FONT_SIZES.h4 * scale, marginBottom: 8 * scale }]}>
            전반적으로 {data.overall.label}
          </Text>

          {/* 칩 형태로 세그먼트 표시 */}
          <View style={[styles.chipsContainer, { gap: 6 * scale }]}>
            {data.segments.map((segment, index) => (
              <View
                key={index}
                style={[styles.chip, {
                  backgroundColor: segment.hasData
                    ? (isDark ? colors.border + '60' : colors.border + '40')
                    : 'transparent',
                  borderWidth: segment.hasData ? 0 : 1,
                  borderColor: isDark ? colors.border + '50' : colors.border + '70',
                  paddingHorizontal: 10 * scale,
                  paddingVertical: 5 * scale,
                  borderRadius: 8 * scale,
                }]}
                accessible={true}
                accessibilityLabel={`${segment.name} ${segment.label}`}
              >
                <View style={styles.chipContent}>
                  <Text style={[styles.chipText, {
                    color: segment.hasData ? colors.text : colors.textSecondary,
                    fontSize: FONT_SIZES.tiny * scale,
                    marginRight: 4 * scale,
                  }]}>
                    {segment.name}:
                  </Text>
                  {segment.icon && (
                    <TwemojiImage emoji={segment.icon} size={12 * scale} style={{ marginRight: 3 * scale }} />
                  )}
                  <Text style={[styles.chipLabel, {
                    color: segment.hasData ? colors.text : colors.textSecondary,
                    fontSize: FONT_SIZES.tiny * scale,
                  }]}>
                    {segment.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 세그먼트별 날씨 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 12 * scale }}
        contentContainerStyle={[styles.segmentsScrollContainer, { gap: period === 'year' ? 4 * scale : 8 * scale }]}
      >
        {data.segments.map((segment, index) => {
          // name을 파싱하여 숫자와 단위로 분리 (예: "1일 전" → ["1일", "전"])
          const nameParts = segment.name.split(' ');
          const mainPart = nameParts[0]; // "1일" or "1주차" or "1월"
          const subPart = nameParts[1] || ''; // "전" or ""

          // 가입 이전 날짜는 빈 칸으로 표시
          if (segment.beforeSignup) {
            return (
              <View
                key={index}
                style={[styles.segmentItem, {
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: isDark ? colors.border + '40' : colors.border + '60',
                  borderStyle: 'dashed',
                  padding: 10 * scale,
                  borderRadius: 12 * scale,
                  width: period === 'year' ? 68 * scale : 76 * scale,
                  opacity: 0.3,
                }]}
                accessible={true}
                accessibilityLabel={`${segment.name}: 가입 이전`}
              >
                <View style={{ height: 32 * scale, marginBottom: 4 * scale }} />
                <Text style={[styles.segmentName, {
                  color: colors.textSecondary,
                  fontSize: FONT_SIZES.tiny * scale,
                  textAlign: 'center',
                }]}>
                  {mainPart}
                </Text>
                {subPart && (
                  <Text style={[styles.segmentName, {
                    color: colors.textSecondary,
                    fontSize: FONT_SIZES.tiny * scale,
                    textAlign: 'center',
                  }]}>
                    {subPart}
                  </Text>
                )}
                <Text style={[styles.segmentLabel, {
                  color: colors.textSecondary,
                  fontSize: FONT_SIZES.tiny * scale,
                  textAlign: 'center',
                  marginTop: 2 * scale,
                }]}>
                  -
                </Text>
              </View>
            );
          }

          return (
            <View
              key={index}
              style={[styles.segmentItem, {
                backgroundColor: segment.hasData ? (isDark ? colors.border : '#F8F9FA') : 'transparent',
                borderWidth: segment.hasData ? 0 : 1,
                borderColor: isDark ? colors.border : colors.border + '80',
                padding: 10 * scale,
                borderRadius: 12 * scale,
                width: period === 'year' ? 68 * scale : 76 * scale,
                opacity: segment.hasData ? 1 : 0.6,
              }]}
              accessible={true}
              accessibilityLabel={`${segment.name}: ${segment.label}`}
            >
              {segment.icon && (
                <TwemojiImage emoji={segment.icon} size={32 * scale} style={{ marginBottom: 4 * scale }} />
              )}
              <Text style={[styles.segmentName, {
                color: colors.textSecondary,
                fontSize: FONT_SIZES.tiny * scale,
                textAlign: 'center',
              }]}>
                {mainPart}
              </Text>
              {subPart && (
                <Text style={[styles.segmentName, {
                  color: colors.textSecondary,
                  fontSize: FONT_SIZES.tiny * scale,
                  textAlign: 'center',
                }]}>
                  {subPart}
                </Text>
              )}
              <Text style={[styles.segmentLabel, {
                color: segment.hasData ? colors.text : colors.textSecondary,
                fontSize: FONT_SIZES.caption * scale,
                textAlign: 'center',
                marginTop: 2 * scale,
              }]}>
                {segment.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* 평균 온도 표시 */}
      <View style={[styles.tempInfo, {
        marginTop: 12 * scale,
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
        padding: 10 * scale,
        borderRadius: 10 * scale
      }]}>
        <TwemojiImage emoji="🌡️" size={FONT_SIZES.bodySmall * scale} style={{ marginRight: 6 * scale }} />
        <Text style={{ color: colors.text, fontSize: FONT_SIZES.caption * scale }}>
          평균 감정 온도: <Text style={{ fontFamily: 'Pretendard-Bold', color: colors.primary }}>{data.avgTemperature}°</Text>
        </Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  weatherBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTitle: {
    fontFamily: 'Pretendard-Bold',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontFamily: 'Pretendard-Medium',
  },
  chipLabel: {
    fontFamily: 'Pretendard-SemiBold',
  },
  segmentsScrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  segmentItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentName: {
    fontFamily: 'Pretendard-Medium',
    width: '100%',
  },
  segmentLabel: {
    fontFamily: 'Pretendard-SemiBold',
    width: '100%',
  },
  tempInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
  skeleton: {
    opacity: 0.3,
  },
});
