import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import encouragementService from '../../../services/api/encouragementService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

interface EncouragementStatsData {
  totalCount: number;
  unreadCount: number;
  recentMessages?: Array<{
    message: string;
    sent_at: string;
  }>;
}

interface Props {
  onPress?: () => void;
}

export const EncouragementStats: React.FC<Props> = React.memo(({ onPress }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [data, setData] = useState<EncouragementStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await encouragementService.getReceivedEncouragements({
        page: 1,
        limit: 3
      });

      // 안전한 데이터 추출
      const messages = response.data?.data || [];
      const pagination = response.data?.pagination || { total: 0, unreadCount: 0 };

      setData({
        totalCount: pagination.total || 0,
        unreadCount: pagination.unreadCount || 0,
        recentMessages: Array.isArray(messages) ? messages.slice(0, 3) : [],
      });
    } catch (err) {
      setError('위로 메시지를 불러오는데 실패했습니다');
      if (__DEV__) console.error('위로 메시지 통계 로드 실패:', err);
      // 에러 발생 시 빈 데이터 설정
      setData({
        totalCount: 0,
        unreadCount: 0,
        recentMessages: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="익명 위로 메시지 통계">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={loadStats}
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

  if (loading || !data) return null;
  if (data.totalCount === 0) return null; // 위로 메시지가 없으면 표시 안 함

  const getEncouragementText = () => {
    const count = data.totalCount;
    if (count === 1) {
      return '1명의 누군가가 당신을 응원하고 있어요';
    } else {
      return `${count}명의 누군가가 당신을 응원하고 있어요`;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel="익명 위로 메시지 보기"
      accessibilityHint="받은 익명 위로 메시지를 확인합니다"
    >
      <Card accessible={true} accessibilityLabel="익명 위로 메시지 통계" accessibilityHint="받은 익명 위로 메시지 현황">
        <View style={[styles.header, { marginBottom: 16 * scale }]}>
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
            💌 익명의 응원
          </Text>
          {data.unreadCount > 0 && (
            <View
              style={[styles.badge, {
                backgroundColor: colors.primary,
                minWidth: 24 * scale,
                height: 24 * scale,
                borderRadius: 12 * scale,
                paddingHorizontal: 8 * scale
              }]}
              accessible={true}
              accessibilityLabel={`읽지 않은 메시지 ${data.unreadCount}개`}
            >
              <Text style={[styles.badgeText, { fontSize: FONT_SIZES.small * scale }]}>{data.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={[styles.mainStats, {
          backgroundColor: isDark ? 'rgba(255, 100, 100, 0.1)' : colors.surface || colors.border + '20',
          padding: 16 * scale,
          borderRadius: 16 * scale,
          marginBottom: 16 * scale,
          gap: 14 * scale
        }]}>
          <Text style={{ fontSize: 36 * scale }}>💝</Text>
          <View style={styles.statsTextContainer}>
            <Text style={[styles.statsText, {
              color: colors.text,
              fontSize: FONT_SIZES.bodyLarge * scale,
              lineHeight: 24 * scale,
              marginBottom: 4 * scale
            }]}>
              {getEncouragementText()}
            </Text>
            <Text style={[styles.statsSubtext, {
              color: colors.textSecondary,
              fontSize: FONT_SIZES.caption * scale,
              lineHeight: 18 * scale
            }]}>
              따뜻한 마음을 전해받았어요
            </Text>
          </View>
        </View>

        {data.recentMessages && data.recentMessages.length > 0 && (
          <View style={[styles.recentMessages, { marginBottom: 16 * scale }]}>
            <Text style={[styles.recentTitle, {
              color: colors.textSecondary,
              fontSize: FONT_SIZES.caption * scale,
              marginBottom: 10 * scale
            }]}>
              최근 받은 메시지
            </Text>
            {data.recentMessages.slice(0, 2).map((msg, index) => (
              <View
                key={index}
                style={[styles.messagePreview, {
                  backgroundColor: colors.surface || colors.background,
                  padding: 12 * scale,
                  borderRadius: 12 * scale,
                  marginBottom: 8 * scale
                }]}
                accessible={true}
                accessibilityLabel={`메시지: ${msg.message}`}
              >
                <Text
                  style={[styles.messageText, {
                    color: colors.text,
                    fontSize: FONT_SIZES.bodySmall * scale,
                    lineHeight: 20 * scale
                  }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  "{msg.message}"
                </Text>
              </View>
            ))}
            {data.totalCount > 2 && (
              <Text style={[styles.moreText, {
                color: colors.primary,
                fontSize: FONT_SIZES.caption * scale,
                marginTop: 8 * scale
              }]}>
                +{data.totalCount - 2}개의 메시지 더 보기
              </Text>
            )}
          </View>
        )}

        <View style={[styles.footer, { borderTopColor: colors.border, paddingTop: 12 * scale }]}>
          <Text style={[styles.footerText, {
            color: colors.textSecondary,
            fontSize: FONT_SIZES.caption * scale,
            lineHeight: 18 * scale
          }]}>
            💡 힘든 시간을 함께 나누고 있어요
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Bold',
  },
  mainStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsTextContainer: {
    flex: 1,
  },
  statsText: {
    fontFamily: 'Pretendard-Bold',
  },
  statsSubtext: {
  },
  recentMessages: {
  },
  recentTitle: {
    fontFamily: 'Pretendard-SemiBold',
  },
  messagePreview: {
  },
  messageText: {
    fontStyle: 'italic',
  },
  moreText: {
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
  },
  footerText: {
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
