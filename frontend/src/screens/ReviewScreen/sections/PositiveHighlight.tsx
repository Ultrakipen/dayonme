import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { Card } from '../../../components/common/Card';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import reviewService from '../../../services/api/reviewService';

interface PositiveEmotion {
  emotion: string;
  emoji: string;
  count: number;
  lastDate: string;
}

interface PositiveData {
  emotions: PositiveEmotion[];
  positiveRatio: number;
  streak: number;
  totalCount: number;
}

export const PositiveHighlight: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [positiveData, setPositiveData] = useState<PositiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sparkleAnim] = useState(new Animated.Value(0));

  // 긍정 감정 키워드 정의
  const positiveEmotions = useMemo(() =>
    ['행복', '설렘', '평온', '사랑', '감사', '희망', '기쁨', '만족', '즐거움', '신남'],
    []
  );

  const loadPositiveData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewService.getSummary('week');
      const { emotionStats = [], insights } = response.data;

      // 긍정 감정 필터링
      const filtered = emotionStats.filter((stat: any) =>
        positiveEmotions.some(pe => stat.name.includes(pe))
      );

      const totalPositive = filtered.reduce((sum: number, stat: any) => sum + stat.count, 0);
      const totalAll = emotionStats.reduce((sum: number, stat: any) => sum + stat.count, 0);
      const ratio = totalAll > 0 ? (totalPositive / totalAll) * 100 : 0;

      // 데이터가 없으면 렌더링 안 함
      if (totalPositive === 0) {
        setPositiveData(null);
        return;
      }

      setPositiveData({
        emotions: filtered.slice(0, 4).map((stat: any) => ({
          emotion: stat.name,
          emoji: stat.icon,
          count: stat.count,
          lastDate: '오늘'
        })),
        positiveRatio: Math.round(ratio),
        streak: insights?.consecutiveDays || 0,
        totalCount: totalPositive
      });

      // 애니메이션
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(sparkleAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } catch (err) {
      if (__DEV__) console.error('긍정 데이터 로드 실패:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [positiveEmotions, sparkleAnim]);

  useEffect(() => {
    loadPositiveData();
  }, [loadPositiveData]);

  // 로딩, 에러, 데이터 없음 처리
  if (loading || error || !positiveData || positiveData.totalCount === 0) {
    return null;
  }

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1]
  });

  return (
    <Card accessible={true} accessibilityLabel="긍정 하이라이트">
      <View style={styles.header}>
        <Animated.Text
          style={[styles.sparkle, { opacity: sparkleOpacity }]}
          accessibilityLabel="반짝이는 별"
        >
          ✨
        </Animated.Text>
        <Text
          style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}
          accessibilityRole="header"
        >
          당신의 럭키 모먼트
        </Text>
      </View>

      {/* 긍정 비율 */}
      <View
        style={[styles.ratioContainer, { backgroundColor: isDark ? '#1a3d1a' : '#e8f5e9' }]}
        accessible={true}
        accessibilityLabel={`이번 주 긍정 지수 ${positiveData.positiveRatio}퍼센트`}
      >
        <Text style={[styles.ratioLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
          이번 주 긍정 지수
        </Text>
        <Text style={[styles.ratioValue, { color: '#4caf50', fontSize: FONT_SIZES.h1 * scale }]}>
          {positiveData.positiveRatio}%
        </Text>
        {positiveData.positiveRatio > 50 && (
          <Text style={[styles.encouragement, { color: '#4caf50', fontSize: FONT_SIZES.caption * scale }]}>
            🍀 행운이 함께하는 한 주!
          </Text>
        )}
      </View>

      {/* 긍정 감정 리스트 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.emotionScroll}
        accessible={false}
      >
        {positiveData.emotions.map((item, index) => (
          <View
            key={index}
            style={[
              styles.emotionCard,
              {
                backgroundColor: isDark ? colors.border : '#fff3e0',
                borderColor: '#ff9800'
              }
            ]}
            accessible={true}
            accessibilityLabel={`${item.emotion} ${item.count}회`}
          >
            <Text style={styles.emotionEmoji}>{item.emoji}</Text>
            <Text style={[styles.emotionName, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}>
              {item.emotion}
            </Text>
            <Text style={[styles.emotionCount, { color: '#ff9800', fontSize: FONT_SIZES.h4 * scale }]}>
              {item.count}회
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* 연속일 */}
      {positiveData.streak > 0 && (
        <View
          style={[styles.streakBadge, { backgroundColor: isDark ? '#3d2a1a' : '#fff8e1' }]}
          accessible={true}
          accessibilityLabel={`${positiveData.streak}일 연속 긍정 기록 중`}
        >
          <Text style={[styles.streakText, { color: '#ffa726', fontSize: FONT_SIZES.body * scale }]}>
            🔥 {positiveData.streak}일 연속 긍정 기록 중!
          </Text>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sparkle: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  ratioContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  ratioLabel: {
    marginBottom: 8,
  },
  ratioValue: {
    fontFamily: 'Pretendard-ExtraBold',
    marginBottom: 4,
  },
  encouragement: {
    fontFamily: 'Pretendard-SemiBold',
  },
  emotionScroll: {
    marginBottom: 12,
  },
  emotionCard: {
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
  },
  emotionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emotionName: {
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 4,
  },
  emotionCount: {
    fontFamily: 'Pretendard-Bold',
  },
  streakBadge: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  streakText: {
    fontFamily: 'Pretendard-Bold',
  },
});
