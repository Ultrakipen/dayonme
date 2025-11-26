import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import reviewService from '../../../services/api/reviewService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

interface QuoteData {
  content: string;
  emotion: string;
  icon: string;
  likeCount: number;
}

export const DailyComfortQuote: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scale = getScale();

  const loadQuote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getDailyComfortQuote();
      if (response.status === 'success' && response.data) {
        setQuote(response.data);
      }
    } catch (err) {
      setError('위로의 한 줄을 불러오는데 실패했습니다');
      console.error('위로의 한 줄 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="오늘의 위로">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={loadQuote}
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

  if (loading) {
    return (
      <Card accessible={true} accessibilityLabel="오늘의 위로 로딩 중">
        <View style={styles.header}>
          <Text style={{ fontSize: FONT_SIZES.h2 * scale }}>✨</Text>
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
            로딩 중...
          </Text>
        </View>
      </Card>
    );
  }

  if (!quote) {
    return (
      <Card accessible={true} accessibilityLabel="오늘의 위로">
        <View style={styles.header}>
          <Text style={{ fontSize: FONT_SIZES.h2 * scale }}>✨</Text>
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>오늘의 위로</Text>
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
          아직 위로의 글이 없어요
        </Text>
      </Card>
    );
  }

  return (
    <Card accessible={true} accessibilityLabel={`오늘의 위로: ${quote.content}`} accessibilityHint={`좋아요 ${quote.likeCount}개`}>
      <View style={styles.header}>
        <Text style={{ fontSize: FONT_SIZES.h2 * scale }}>✨</Text>
        <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>오늘의 위로</Text>
        <View style={styles.statsRow} accessible={true} accessibilityLabel={`좋아요 ${quote.likeCount}개`}>
          <Text style={{ fontSize: FONT_SIZES.small * scale }}>{quote.icon || '💝'}</Text>
          <Text style={[styles.likeText, { color: colors.primary, fontSize: FONT_SIZES.tiny * scale }]}>
            {quote.likeCount}
          </Text>
        </View>
      </View>
      <Text style={[styles.quoteContent, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale, lineHeight: 20 * scale }]} numberOfLines={2}>
        "{quote.content}"
      </Text>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
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
  loadingText: {
    marginTop: 4,
  },
  emptyText: {
    marginTop: 4,
  },
  quoteContent: {
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeText: {
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
