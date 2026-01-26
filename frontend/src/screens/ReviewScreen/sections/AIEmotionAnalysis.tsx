import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { TwemojiImage } from '../../../components/common/TwemojiImage';
import { useReviewData } from '../ReviewDataContext';

interface Props {
  period?: 'week' | 'month' | 'year';
}

export const AIEmotionAnalysis: React.FC<Props> = React.memo(({ period = 'week' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale), [scale]);

  // Context에서 데이터 가져오기 (이미 로드됨)
  const { data, loading, refresh } = useReviewData();
  const analysis = data.aiAnalysis;

  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 타이핑 애니메이션
  const startTypingAnimation = useCallback((text: string) => {
    // undefined 문자열 제거 및 안전 처리
    const safeText = (text || '')
      .replace(/\.?undefined/g, '')
      .replace(/undefined/g, '')
      .trim();

    if (!safeText) {
      setTypingText('감정 데이터를 분석하고 있어요.');
      setIsTyping(false);
      return () => {};
    }

    setIsTyping(true);
    setTypingText('');

    let index = 0;
    const interval = setInterval(() => {
      if (index < safeText.length) {
        const char = safeText.charAt(index);
        setTypingText(prev => prev + char);
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // 데이터가 로드되면 타이핑 애니메이션 시작
  useEffect(() => {
    if (analysis?.summary) {
      startTypingAnimation(analysis.summary);
    }
  }, [analysis, startTypingAnimation]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'stable': return '➡️';
      case 'declining': return '📉';
      default: return '📊';
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving': return '상승세';
      case 'stable': return '안정적';
      case 'declining': return '하락세';
      default: return '분석 중';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#4CAF50';
      case 'stable': return '#2196F3';
      case 'declining': return '#FF9800';
      default: return colors.textSecondary;
    }
  };

  if (loading || !analysis) {
    return (
      <Card accessible={true} accessibilityLabel="나의 감정 흐름 로딩 중">
        <View style={styles.loadingContainer}>
          <TwemojiImage emoji="🤖" size={32 * scale} style={{ marginBottom: 12 * scale }} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }]}>
            AI가 감정을 분석하고 있어요...
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card accessible={true} accessibilityLabel="나의 감정 흐름 결과">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TwemojiImage emoji="🤖" size={FONT_SIZES.h4 * scale} style={{ marginRight: 8 * scale }} />
            <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
              나의 감정 흐름
            </Text>
          </View>
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor(analysis.emotionTrend) + '20' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TwemojiImage emoji={getTrendIcon(analysis.emotionTrend)} size={FONT_SIZES.caption * scale} style={{ marginRight: 4 * scale }} />
              <Text style={{ fontSize: FONT_SIZES.caption * scale, color: getTrendColor(analysis.emotionTrend) }}>
                {getTrendText(analysis.emotionTrend)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* AI 코멘트 (타이핑 효과) */}
      <View style={[styles.aiCommentBox, {
        backgroundColor: isDark ? colors.surface : '#F8F9FA',
        borderLeftColor: colors.primary
      }]}>
        <Text style={[styles.aiComment, { color: colors.text, fontSize: FONT_SIZES.body * scale, lineHeight: 24 * scale }]}>
          "{typingText}"
          {isTyping && <Text style={{ color: colors.primary }}>|</Text>}
        </Text>
      </View>

      {/* 키워드 태그 */}
      {analysis.keywords && analysis.keywords.length > 0 && (
        <View style={styles.keywordsContainer}>
          <Text style={[styles.keywordsLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
            주요 키워드
          </Text>
          <View style={styles.keywordsList}>
            {analysis.keywords.slice(0, 5).map((keyword, index) => (
              <View
                key={index}
                style={[styles.keywordTag, { backgroundColor: colors.primary + '15' }]}
              >
                <Text style={[styles.keywordText, { color: colors.primary, fontSize: FONT_SIZES.caption * scale }]}>
                  #{keyword}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* AI 제안 */}
      {analysis.suggestion && (
        <View style={[styles.suggestionBox, {
          backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : '#E8F5E9'
        }]}>
          <TwemojiImage emoji="💡" size={FONT_SIZES.bodyLarge * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.suggestionText, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale, lineHeight: 20 * scale }]}>
            {analysis.suggestion}
          </Text>
        </View>
      )}

      {/* 신뢰도 */}
      <View style={styles.confidenceContainer}>
        <Text style={[styles.confidenceLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale }]}>
          분석 신뢰도
        </Text>
        <View style={[styles.confidenceBar, { backgroundColor: colors.border }]}>
          <View
            style={[styles.confidenceFill, {
              width: `${analysis.confidence}%`,
              backgroundColor: colors.primary
            }]}
          />
        </View>
        <Text style={[styles.confidenceValue, { color: colors.primary, fontSize: FONT_SIZES.tiny * scale }]}>
          {analysis.confidence}%
        </Text>
      </View>
    </Card>
  );
});

const createStyles = (scale: number) => StyleSheet.create({
  header: {
    marginBottom: 16 * scale,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  trendBadge: {
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 12 * scale,
  },
  aiCommentBox: {
    padding: 16 * scale,
    borderRadius: 12 * scale,
    borderLeftWidth: 4 * scale,
    marginBottom: 16 * scale,
    minHeight: 80 * scale,
  },
  aiComment: {
    fontStyle: 'italic',
    fontFamily: 'Pretendard-Medium',
  },
  keywordsContainer: {
    marginBottom: 16 * scale,
  },
  keywordsLabel: {
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 8 * scale,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8 * scale,
  },
  keywordTag: {
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 16 * scale,
  },
  keywordText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12 * scale,
    borderRadius: 12 * scale,
    marginBottom: 16 * scale,
  },
  suggestionText: {
    flex: 1,
    fontFamily: 'Pretendard-Medium',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
  },
  confidenceLabel: {
    fontFamily: 'Pretendard-Medium',
  },
  confidenceBar: {
    flex: 1,
    height: 4 * scale,
    borderRadius: 2 * scale,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2 * scale,
  },
  confidenceValue: {
    fontFamily: 'Pretendard-Bold',
    minWidth: 35 * scale,
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24 * scale,
  },
  loadingEmoji: {
    marginBottom: 12 * scale,
  },
  loadingText: {
    fontFamily: 'Pretendard-Medium',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16 * scale,
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    padding: 8 * scale,
  },
});
