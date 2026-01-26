import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

const API_URL = 'https://dayonme.com/api';

interface JourneyStep {
  day: string;
  emotion: string;
  icon: string;
  date?: string;
  temperature?: number;
}

interface Props {
  period?: 'week' | 'month' | 'year';
}

export const EmotionJourney: React.FC<Props> = React.memo(({ period = 'week' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [error, setError] = useState<string | null>(null);
  const [journey, setJourney] = useState<JourneyStep[]>([
    { day: '월', emotion: '행복', icon: '🥰' },
    { day: '화', emotion: '평온', icon: '🧘' },
    { day: '수', emotion: '기쁨', icon: '💫' },
    { day: '목', emotion: '슬픔', icon: '🌧️' },
    { day: '금', emotion: '결심', icon: '🔥' },
  ]);
  const [summary, setSummary] = useState('이번 주 감정 여행');

  const periodInfo = useMemo(() => {
    switch (period) {
      case 'week':
        return {
          title: '이번 주 감정 여행',
          accessibilityLabel: '이번 주 감정 여행',
          accessibilityHint: '일주일 동안의 감정 변화를 시각적으로 보여줍니다'
        };
      case 'month':
        return {
          title: '이번 달 감정 여행',
          accessibilityLabel: '이번 달 감정 여행',
          accessibilityHint: '한 달 동안의 감정 변화를 시각적으로 보여줍니다'
        };
      case 'year':
        return {
          title: '올해의 감정 여행',
          accessibilityLabel: '올해의 감정 여행',
          accessibilityHint: '일 년 동안의 감정 변화를 시각적으로 보여줍니다'
        };
    }
  }, [period]);

  const loadJourney = useCallback(async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/review/emotion-journey?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success' && response.data.data.steps.length > 0) {
        setJourney(response.data.data.steps);
        setSummary(response.data.data.summary);
      }
    } catch (err) {
      setError('감정 여정을 불러오는데 실패했습니다');
      if (__DEV__) console.error('감정 여정 로드 실패:', err);
    }
  }, [period]);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  const getDayColor = (index: number) => {
    const gradientColors = [
      { bg: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)' },
      { bg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)' },
      { bg: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)' },
      { bg: isDark ? 'rgba(192, 132, 252, 0.15)' : 'rgba(192, 132, 252, 0.1)', border: 'rgba(192, 132, 252, 0.3)' },
      { bg: isDark ? 'rgba(216, 180, 254, 0.15)' : 'rgba(216, 180, 254, 0.1)', border: 'rgba(216, 180, 254, 0.3)' },
      { bg: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.3)' },
      { bg: isDark ? 'rgba(244, 114, 182, 0.15)' : 'rgba(244, 114, 182, 0.1)', border: 'rgba(244, 114, 182, 0.3)' },
    ];
    return gradientColors[index % gradientColors.length];
  };

  if (error) {
    return (
      <Card
        accessible={true}
        accessibilityLabel={periodInfo.accessibilityLabel}
        accessibilityHint={periodInfo.accessibilityHint}
      >
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={loadJourney}
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
      accessible={true}
      accessibilityLabel={periodInfo.accessibilityLabel}
      accessibilityHint={periodInfo.accessibilityHint}
    >
      <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale, marginBottom: 16 * scale }]}>
        {periodInfo.title}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 * scale }}
      >
        <View style={[styles.journeyContainer, { marginBottom: 16 * scale }]}>
          {journey.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <View
                style={[styles.step, { gap: 6 * scale }]}
                accessible={true}
                accessibilityLabel={`${step.day}요일, ${step.emotion} 감정`}
              >
                <View style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isDark ? getDayColor(index).bg : colors.surface,
                    width: 48 * scale,
                    height: 48 * scale,
                    borderRadius: 24 * scale
                  }
                ]}>
                  <Text style={{ fontSize: 28 * scale }}>{step.icon}</Text>
                </View>
                <Text style={[styles.day, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale }]}>
                  {step.day}
                </Text>
                <Text style={[styles.emotion, { color: colors.text, fontSize: FONT_SIZES.small * scale }]}>
                  {step.emotion}
                </Text>
              </View>
              {index < journey.length - 1 && (
                <View style={[styles.arrow, { marginHorizontal: 4 * scale }]}>
                  <Text style={[styles.arrowText, { color: isDark ? colors.border + '60' : colors.border, fontSize: FONT_SIZES.bodyLarge * scale }]}>·</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.summary, {
        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : colors.surface || colors.border + '30',
        padding: 14 * scale,
        borderRadius: 14 * scale
      }]}>
        <Text style={[styles.summaryText, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale, lineHeight: 20 * scale }]}>
          {summary}
        </Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  journeyContainer: {
    flexDirection: 'row',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    alignItems: 'center',
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  day: {
    fontFamily: 'Pretendard-SemiBold',
  },
  emotion: {
    fontFamily: 'Pretendard-Bold',
  },
  arrow: {
  },
  arrowText: {
  },
  summary: {
  },
  summaryText: {
    fontFamily: 'Pretendard-SemiBold',
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
