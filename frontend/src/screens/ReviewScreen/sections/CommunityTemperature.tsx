import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, AppState, TouchableOpacity } from 'react-native';
import reviewService from '../../../services/api/reviewService';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { Card } from '../../../components/common/Card';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { getCommunityTempColor, getCommunityTempText, getCommunityTempIcon } from '../../../utils/temperatureUtils';

interface TemperatureData {
  temperature: number;
  totalUsers: number;
  emotions: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
    icon: string;
  }>;
  userCurrentEmotion?: {
    name: string;
    icon: string;
    matchCount: number;
  };
}

interface Props {
  period?: 'week' | 'month' | 'year';
  periodText?: string;
}

export const CommunityTemperature: React.FC<Props> = React.memo(({ period = 'week', periodText = '이번 주' }) => {
  const { colors } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [data, setData] = useState<TemperatureData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getCommunityTemperature();
      setData(response.data);
    } catch (err) {
      setError('커뮤니티 온도를 불러오는데 실패했습니다');
      console.error('커뮤니티 온도 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    let interval: NodeJS.Timeout | null = null;
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadData();
        interval = setInterval(loadData, 300000);
      } else {
        if (interval) clearInterval(interval);
      }
    });

    interval = setInterval(loadData, 300000);

    return () => {
      if (interval) clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [period, loadData]);

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="커뮤니티 감정 온도계">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body }}>{error}</Text>
          <TouchableOpacity
            onPress={loadData}
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

  if (!data) return null;

  return (
    <Card accessible={true} accessibilityLabel="커뮤니티 감정 온도계" accessibilityHint="현재 커뮤니티의 전체적인 감정 상태를 보여줍니다">
      <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3, marginBottom: 16 * scale }]}>
        🌡️ {periodText} 우리의 감정 온도
      </Text>

      <View style={[styles.tempContainer, { marginBottom: 12 * scale }]}>
        <Text style={{ fontSize: 48 * scale, marginBottom: 8 * scale }}>
          {getCommunityTempIcon(data.temperature)}
        </Text>
        <Text style={[styles.tempText, { color: getCommunityTempColor(data.temperature), fontSize: FONT_SIZES.h1 }]}>
          {getCommunityTempText(data.temperature)} {data.temperature.toFixed(1)}°
        </Text>
      </View>

      <View
        style={[styles.progressBar, { backgroundColor: colors.border, height: 8 * scale, borderRadius: 4 * scale, marginBottom: 12 * scale }]}
        accessible={true}
        accessibilityLabel={`감정 온도 ${data.temperature.toFixed(1)}도`}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(((data.temperature - 34) / 6) * 100, 100)}%`,
              backgroundColor: getCommunityTempColor(data.temperature),
              borderRadius: 4 * scale
            }
          ]}
        />
      </View>

      <Text style={[styles.userCount, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall, marginBottom: 16 * scale }]}>
        {periodText} {data.totalUsers.toLocaleString()}명이 감정을 기록했어요
      </Text>

      <View style={[styles.emotionList, { gap: 8 * scale }]}>
        {data.emotions.slice(0, 3).map((emotion, index) => (
          <View
            key={index}
            style={[styles.emotionItem, { gap: 8 * scale }]}
            accessible={true}
            accessibilityLabel={`${emotion.name} 감정, ${emotion.count}명, ${emotion.percentage}퍼센트`}
          >
            <Text style={{ fontSize: FONT_SIZES.h2 }}>{emotion.icon}</Text>
            <Text style={[styles.emotionName, { color: colors.text, fontSize: FONT_SIZES.body }]}>
              {emotion.name}
            </Text>
            <Text style={[styles.emotionCount, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
              {emotion.count}명 ({emotion.percentage}%)
            </Text>
          </View>
        ))}
      </View>

      {data.userCurrentEmotion && (
        <View style={[styles.userMatch, { backgroundColor: colors.surface || colors.background, marginTop: 12 * scale, padding: 12 * scale, borderRadius: 12 * scale }]}>
          <Text style={[styles.userMatchText, { color: colors.text, fontSize: FONT_SIZES.bodySmall, lineHeight: 20 * scale }]}>
            💭 당신과 같은 '{data.userCurrentEmotion.name}'을 느끼는 분이{'\n'}
            {data.userCurrentEmotion.matchCount}명 있어요
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
  tempContainer: {
    alignItems: 'center',
  },
  tempText: {
    fontWeight: '700',
  },
  progressBar: {
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  userCount: {
    textAlign: 'center',
  },
  emotionList: {
  },
  emotionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emotionName: {
    fontWeight: '600',
    flex: 1,
  },
  emotionCount: {
  },
  userMatch: {
  },
  userMatchText: {
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
