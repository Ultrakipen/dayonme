import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

interface Props {
  period?: 'week' | 'month' | 'year';
}

export const EmotionWeather: React.FC<Props> = React.memo(({ period = 'week' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);

  const periodInfo = useMemo(() => {
    switch (period) {
      case 'week':
        return {
          title: '오늘의 마음 날씨',
          description: '아침: 맑음 ☀️ · 점심: 구름조금 ⛅ · 저녁: 흐림 ☁️',
          accessibilityLabel: '오늘의 마음 날씨',
          accessibilityHint: '하루 동안의 감정 변화를 날씨로 표현합니다'
        };
      case 'month':
        return {
          title: '이번 달의 마음 날씨',
          description: '초반: 화창 ☀️ · 중반: 흐림 ☁️ · 말: 맑음 🌤️',
          accessibilityLabel: '이번 달의 마음 날씨',
          accessibilityHint: '한 달 동안의 감정 변화를 날씨로 표현합니다'
        };
      case 'year':
        return {
          title: '올해의 마음 날씨',
          description: '봄: 맑음 ☀️ · 여름: 화창 🌞 · 가을: 구름조금 ⛅ · 겨울: 흐림 ☁️',
          accessibilityLabel: '올해의 마음 날씨',
          accessibilityHint: '일 년 동안의 감정 변화를 날씨로 표현합니다'
        };
    }
  }, [period]);

  return (
    <Card
      accessible={true}
      accessibilityLabel={periodInfo.accessibilityLabel}
      accessibilityHint={periodInfo.accessibilityHint}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 * scale }}>
        <TwemojiImage emoji="🌤️" size={FONT_SIZES.h3 * scale} style={{ marginRight: 8 * scale }} />
        <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>
          {periodInfo.title}
        </Text>
      </View>

      <View style={[styles.weatherBox, {
        backgroundColor: isDark ? colors.surface : colors.border + '30',
        padding: 16 * scale,
        borderRadius: 16 * scale,
        gap: 16 * scale
      }]}>
        <TwemojiImage emoji="☀️" size={56 * scale} />
        <View style={styles.weatherInfo}>
          <Text style={[styles.weatherTitle, { color: colors.text, fontSize: FONT_SIZES.h3, marginBottom: 4 * scale }]}>
            전반적으로 화창
          </Text>
          <Text style={[styles.weatherDesc, { color: colors.textSecondary, fontSize: FONT_SIZES.caption, lineHeight: 18 * scale }]}>
            {periodInfo.description}
          </Text>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
  },
  weatherBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTitle: {
    fontWeight: '700',
  },
  weatherDesc: {
  },
});
