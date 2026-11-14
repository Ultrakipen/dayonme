import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import reviewService from '../../../services/api/reviewService';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { Card } from '../../../components/common/Card';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { getPersonalTempColor, getPersonalTempText, getPersonalTempIcon } from '../../../utils/temperatureUtils';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

interface TemperatureData {
  temperature: number;
  totalPosts: number;
  emotions: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
    icon: string;
  }>;
}

interface Props {
  period?: 'week' | 'month' | 'year';
  periodText?: string;
}

export const PersonalTemperature: React.FC<Props> = React.memo(({ period = 'week', periodText = '이번 주' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [data, setData] = useState<TemperatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getPersonalTemperature(period);
      setData(response.data);
    } catch (err) {
      setError('감정 온도를 불러오는데 실패했습니다');
      console.error('개인 감정 온도 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPredictiveInsight = () => {
    if (!data) return { icon: '💭', message: '' };
    const temp = data.temperature;

    if (temp >= 37.0) {
      return {
        icon: '🔥',
        message: '활기찬 감정이 넘치네요! 이 에너지를 긍정적으로 활용해보세요.'
      };
    } else if (temp >= 36.5) {
      return {
        icon: '😊',
        message: '건강한 감정 상태를 유지하고 있어요. 계속 이어가세요!'
      };
    } else if (temp >= 36.0) {
      return {
        icon: '🌱',
        message: '안정적인 시기네요. 작은 기쁨들을 발견해보는 건 어떨까요?'
      };
    } else if (temp >= 35.5) {
      return {
        icon: '💙',
        message: '조금 차분한 시기네요. 천천히 자신을 돌아보는 시간을 가져보세요.'
      };
    } else {
      return {
        icon: '🫂',
        message: '힘든 시간이지만, 괜찮아요. 천천히 한 걸음씩 나아가요.'
      };
    }
  };

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="나의 감정 온도계">
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

  if (loading || !data) return null;

  const predictiveInsight = getPredictiveInsight();

  return (
    <Card accessible={true} accessibilityLabel="나의 감정 온도계" accessibilityHint="나의 감정 상태를 체온으로 표현합니다">
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 * scale }}>
        <TwemojiImage emoji="🌡️" size={FONT_SIZES.h3 * scale} style={{ marginRight: 8 * scale }} />
        <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>
          나의 {periodText} 감정 온도
        </Text>
      </View>

      <View style={[styles.tempContainer, { marginBottom: 12 * scale }]}>
        <TwemojiImage emoji={getPersonalTempIcon(data.temperature)} size={48 * scale} style={{ marginBottom: 8 * scale }} />
        <Text style={[styles.tempText, { color: colors.text, fontSize: FONT_SIZES.h1 }]}>
          {getPersonalTempText(data.temperature)} {data.temperature.toFixed(1)}°
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
              width: `${Math.max(0, Math.min(((data.temperature - 35) / 3) * 100, 100))}%`,
              backgroundColor: data.temperature >= 36.3 && data.temperature < 36.8 ? colors.success : data.temperature >= 35.8 && data.temperature < 36.3 ? colors.primary : getPersonalTempColor(data.temperature),
              borderRadius: 4 * scale
            }
          ]}
        />
      </View>

      <Text style={[styles.postCount, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall, marginBottom: 16 * scale }]}>
        {periodText} {data.totalPosts}개의 감정을 기록했어요
      </Text>

      {data.emotions.length > 0 && (
        <>
          <View style={[styles.emotionList, { gap: 8 * scale }]}>
            {data.emotions.slice(0, 3).map((emotion, index) => (
              <View
                key={index}
                style={[styles.emotionItem, { gap: 8 * scale }]}
                accessible={true}
                accessibilityLabel={`${emotion.name} 감정, ${emotion.count}회, ${emotion.percentage}퍼센트`}
              >
                <TwemojiImage emoji={emotion.icon} size={FONT_SIZES.h2 * scale} />
                <Text style={[styles.emotionName, { color: colors.text, fontSize: FONT_SIZES.body }]}>
                  {emotion.name}
                </Text>
                <Text style={[styles.emotionCount, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
                  {emotion.count}회 ({emotion.percentage}%)
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.insight, { backgroundColor: colors.surface || colors.background, marginTop: 12 * scale, padding: 12 * scale, borderRadius: 12 * scale }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <TwemojiImage emoji="💭" size={FONT_SIZES.bodySmall * scale} style={{ marginRight: 6 * scale }} />
              <Text style={[styles.insightText, { color: colors.text, fontSize: FONT_SIZES.bodySmall, lineHeight: 20 * scale }]}>
                {data.emotions[0].name}을 가장 많이 느꼈어요
              </Text>
            </View>
          </View>
        </>
      )}

      <View style={[styles.predictiveInsight, {
        backgroundColor: isDark ? colors.surface : colors.border + '20',
        marginTop: 16 * scale,
        padding: 16 * scale,
        borderRadius: 16 * scale,
        gap: 12 * scale
      }]}>
        <TwemojiImage emoji={predictiveInsight.icon} size={FONT_SIZES.h1 * scale} />
        <Text style={[styles.predictiveText, { color: colors.text, fontSize: FONT_SIZES.body, lineHeight: 22 * scale }]}>
          {predictiveInsight.message}
        </Text>
      </View>
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
  postCount: {
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
  insight: {
  },
  insightText: {
    textAlign: 'center',
  },
  predictiveInsight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictiveText: {
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
