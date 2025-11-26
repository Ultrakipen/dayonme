import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { useNavigation } from '@react-navigation/native';
import reviewService from '../../../services/api/reviewService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

interface EchoData {
  emotion: string;
  icon: string;
  color: string;
  echoCount: number;
}

export const EmotionEcho: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const navigation = useNavigation<any>();
  const [data, setData] = useState<EchoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scale = getScale();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getEmotionEcho();
      if (response.status === 'success' && response.data) {
        setData(response.data);
      }
    } catch (err) {
      setError('감정 공명을 불러오는데 실패했습니다');
      console.log('감정 공명 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="감정 공명">
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

  if (loading || !data) {
    return (
      <Card accessible={true} accessibilityLabel="감정 공명 로딩 중">
        <View style={styles.header}>
          <Text style={{ fontSize: FONT_SIZES.h2 * scale }}>🔮</Text>
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>감정 공명</Text>
          {!loading && !data && (
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="기록하기"
            >
              <Text style={[styles.ctaText, { fontSize: FONT_SIZES.tiny * scale }]}>기록하기</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.small * scale }]}>
          {loading ? '로딩 중...' : '아직 기록된 감정이 없어요'}
        </Text>
      </Card>
    );
  }

  return (
    <Card accessible={true} accessibilityLabel={`감정 공명: ${data.emotion}, 같은 감정을 느끼는 사람 ${data.echoCount}명`}>
      <View style={styles.header}>
        <Text style={{ fontSize: FONT_SIZES.h2 * scale }}>🔮</Text>
        <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>감정 공명</Text>
        <View
          style={[styles.echoBox, { backgroundColor: isDark ? '#2A2A3A' : '#F0F8FF' }]}
          accessible={true}
          accessibilityLabel={`현재 감정: ${data.emotion}`}
        >
          <Text style={{ fontSize: FONT_SIZES.h3 * scale }}>{data.icon}</Text>
          <Text style={[styles.emotionName, { color: data.color, fontSize: FONT_SIZES.small * scale }]}>
            {data.emotion}
          </Text>
        </View>
      </View>
      <View style={styles.echoRow} accessible={true} accessibilityLabel={`같은 감정을 느끼는 사람 ${data.echoCount}명, 최근 24시간`}>
        <Text style={[styles.echoText, { color: colors.text, fontSize: FONT_SIZES.caption * scale }]}>
          같은 감정을 느끼는 사람
        </Text>
        <Text style={[styles.echoCount, { color: colors.primary, fontSize: FONT_SIZES.bodyLarge * scale }]}>
          {data.echoCount}명
        </Text>
        <Text style={[styles.echoSubtext, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale }]}>
          (24h)
        </Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  subtitle: {},
  ctaButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  echoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  emotionName: {
    fontWeight: '600',
  },
  echoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  echoText: {},
  echoCount: {
    fontWeight: '700',
  },
  echoSubtext: {},
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
