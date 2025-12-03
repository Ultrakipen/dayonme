import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import apiClient from '../../../services/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

const CACHE_KEY = '@ai_emotion_analysis_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30분

interface AIAnalysis {
  summary: string;
  emotionTrend: 'improving' | 'stable' | 'declining';
  suggestion: string;
  keywords: string[];
  confidence: number;
}

interface Props {
  period?: 'week' | 'month' | 'year';
}

export const AIEmotionAnalysis: React.FC<Props> = React.memo(({ period = 'week' }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale), [scale]);

  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 캐시 로드
  const loadFromCache = useCallback(async (): Promise<AIAnalysis | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${period}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('AI 분석 캐시 로드 실패:', err);
    }
    return null;
  }, [period]);

  // 캐시 저장
  const saveToCache = useCallback(async (data: AIAnalysis) => {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY}_${period}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      if (__DEV__) console.warn('AI 분석 캐시 저장 실패:', err);
    }
  }, [period]);

  // 데이터 로드
  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 캐시 확인
      const cachedData = await loadFromCache();
      if (cachedData) {
        setAnalysis(cachedData);
        setLoading(false);
        startTypingAnimation(cachedData.summary);
        return;
      }

      const response = await apiClient.get(`/review/ai-analysis?period=${period}`);

      if (response.data.status === 'success') {
        const data = response.data.data;
        setAnalysis(data);
        await saveToCache(data);
        startTypingAnimation(data.summary);
      }
    } catch (err) {
      setError('AI 분석을 불러오는데 실패했습니다');
      if (__DEV__) console.error('AI 분석 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [period, loadFromCache, saveToCache]);

  // 타이핑 애니메이션
  const startTypingAnimation = useCallback((text: string) => {
    setIsTyping(true);
    setTypingText('');

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setTypingText(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

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

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="AI 감정 분석">
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            onPress={loadAnalysis}
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

  if (loading || !analysis) {
    return (
      <Card accessible={true} accessibilityLabel="AI 감정 분석 로딩 중">
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
    <Card accessible={true} accessibilityLabel="AI 감정 분석 결과">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TwemojiImage emoji="🤖" size={FONT_SIZES.h3 * scale} style={{ marginRight: 8 * scale }} />
            <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale }]}>
              AI 감정 분석
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
    fontWeight: '700',
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
    fontWeight: '500',
  },
  keywordsContainer: {
    marginBottom: 16 * scale,
  },
  keywordsLabel: {
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '500',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
  },
  confidenceLabel: {
    fontWeight: '500',
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
    fontWeight: '700',
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
    fontWeight: '500',
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
