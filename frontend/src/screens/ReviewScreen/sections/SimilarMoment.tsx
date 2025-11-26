import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import reviewService from '../../../services/api/reviewService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

export const SimilarMoment: React.FC = React.memo(() => {
  const { colors } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const response = await reviewService.getCommunityTemperature();
      setData(response.data);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다');
      console.error('비슷한 순간 로드 실패:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (error) {
    return (
      <Card style={{ padding: 14 * scale, marginBottom: 12 * scale }} accessible={true} accessibilityLabel="나와 비슷한 순간">
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

  if (!data?.userCurrentEmotion) return null;

  return (
    <Card
      style={{ padding: 14 * scale, marginBottom: 12 * scale }}
      accessible={true}
      accessibilityLabel={`나와 비슷한 순간: ${data.userCurrentEmotion.name} 감정을 느끼는 사람이 ${data.userCurrentEmotion.matchCount}명 있습니다`}
    >
      <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.bodyLarge * scale, marginBottom: 10 * scale }]}>💭 나와 비슷한 순간</Text>

      <View style={[styles.content, { gap: 6 * scale }]}>
        <Text style={[styles.line1, { color: colors.text, fontSize: FONT_SIZES.body * scale, lineHeight: 22 * scale }]}>
          지금 <Text style={[styles.emotionText, { color: colors.primary, fontSize: FONT_SIZES.bodyLarge * scale }]}>'{data.userCurrentEmotion.name}'</Text>을 느끼는 분이{' '}
          <Text style={[styles.countText, { color: colors.primary, fontSize: FONT_SIZES.h2 * scale }]}>{data.userCurrentEmotion.matchCount}명</Text> 있어요
        </Text>
        <Text style={[styles.line2, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, lineHeight: 20 * scale }]}>
          혼자가 아니에요 💙
        </Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
  },
  content: {
    alignItems: 'center',
  },
  line1: {
    textAlign: 'center',
  },
  emotionText: {
    fontWeight: '700',
  },
  countText: {
    fontWeight: '800',
  },
  line2: {
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
