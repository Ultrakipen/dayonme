import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import LinearGradient from 'react-native-linear-gradient';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

interface InsightData {
  topEmotion: string;
  topEmotionIcon: string;
  topEmotionCount: number;
  totalPosts: number;
  positiveRatio: number;
  mostActiveHour: number;
  mostActiveDay: string;
}

interface Props {
  data?: InsightData;
}

export const EmotionInsights: React.FC<Props> = React.memo(({ data }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);

  if (!data) return null;

  const getDayEmoji = (day: string) => {
    const map: Record<string, string> = {
      '월요일': '📅', '화요일': '🔥', '수요일': '⚡',
      '목요일': '🌟', '금요일': '🎉', '토요일': '🌈', '일요일': '☀️'
    };
    return map[day] || '📅';
  };

  const getTimeEmoji = (hour: number) => {
    if (hour >= 6 && hour < 12) return '🌅';
    if (hour >= 12 && hour < 18) return '☀️';
    if (hour >= 18 && hour < 22) return '🌆';
    return '🌙';
  };

  const insights = [
    {
      icon: data.topEmotionIcon,
      title: '가장 많이 느낀 감정',
      value: data.topEmotion,
      subtitle: `${data.topEmotionCount}번`,
      gradient: isDark ? ['#3d4b8e', '#4a2d66'] : ['#5a67d8', '#6b46c1'],
    },
    {
      icon: data.positiveRatio >= 60 ? '😊' : data.positiveRatio >= 40 ? '😐' : '😔',
      title: '긍정 비율',
      value: `${data.positiveRatio}%`,
      subtitle: data.positiveRatio >= 60 ? '밝은 한 주!' : '힘내세요!',
      gradient: isDark ? ['#9d5ca3', '#a3364a'] : ['#d946a8', '#dc2626'],
    },
    {
      icon: getDayEmoji(data.mostActiveDay),
      title: '가장 활발한 요일',
      value: data.mostActiveDay,
      subtitle: '활동 집중',
      gradient: isDark ? ['#2f6ca0', '#009aa3'] : ['#0891b2', '#0284c7'],
    },
    {
      icon: getTimeEmoji(data.mostActiveHour),
      title: '주로 기록하는 시간',
      value: `${data.mostActiveHour}시`,
      subtitle: data.mostActiveHour >= 22 || data.mostActiveHour < 6 ? '밤에 더 솔직해요' : '활동적이에요',
      gradient: isDark ? ['#2a8c4d', '#239a87'] : ['#059669', '#10b981'],
    },
  ];

  return (
    <Card accessible={true} accessibilityLabel="감정 인사이트 섹션">
      <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale, marginBottom: 4 * scale }]}>✨ 감정 인사이트</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale, marginBottom: 16 * scale }]}>
        데이터로 보는 나의 감정 패턴
      </Text>

      <View style={[styles.grid, { marginHorizontal: -6 * scale }]}>
        {insights.map((insight, index) => (
          <View
            key={index}
            style={[styles.insightWrapper, { paddingHorizontal: 6 * scale, marginBottom: 12 * scale }]}
            accessible={true}
            accessibilityLabel={`${insight.title}: ${insight.value}, ${insight.subtitle}`}
          >
            <LinearGradient
              colors={insight.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.insightCard, { borderRadius: 20 * scale, padding: 16 * scale, minHeight: 140 * scale }]}
            >
              <Text style={{ fontSize: 32 * scale, marginBottom: 8 * scale }}>{insight.icon}</Text>
              <Text style={[styles.insightTitle, { fontSize: FONT_SIZES.tiny * scale, marginBottom: 4 * scale }]}>{insight.title}</Text>
              <Text style={[styles.insightValue, { fontSize: FONT_SIZES.h2 * scale, marginBottom: 2 * scale }]}>{insight.value}</Text>
              <Text style={[styles.insightSubtitle, { fontSize: FONT_SIZES.tiny * scale }]}>{insight.subtitle}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  subtitle: {
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  insightWrapper: {
    width: '50%',
  },
  insightCard: {
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  insightTitle: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'Pretendard-SemiBold',
  },
  insightValue: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-ExtraBold',
  },
  insightSubtitle: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: 'Pretendard-Medium',
  },
});
