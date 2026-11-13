// components/EmotionGrowthCard.tsx
// 바이럴 포인트 - 감정 성장 카드 (공유 가능한 카드)

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { viralApi, CompletionCard } from '../services/api/emotionFeatureService';

const getScreenWidth = () => Dimensions.get('window').width;
const BASE_WIDTH = 360;

interface EmotionGrowthCardProps {
  completionData?: CompletionCard;
  completionId?: number;
  onShare?: () => void;
  showShareButton?: boolean;
  compact?: boolean;
}

const EmotionGrowthCard: React.FC<EmotionGrowthCardProps> = ({
  completionData,
  completionId,
  onShare,
  showShareButton = true,
  compact = false,
}) => {
  const { isDarkMode } = useTheme();
  const { theme } = useModernTheme();
  const [data, setData] = useState<CompletionCard | null>(completionData || null);
  const [loading, setLoading] = useState(!completionData && !!completionId);
  const [sharing, setSharing] = useState(false);

  const scale = useMemo(() => {
    const screenWidth = getScreenWidth();
    return Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.3);
  }, []);

  // 완주 타입별 라벨
  const getCompletionLabel = useCallback((type: string) => {
    switch (type) {
      case '7day': return '7일 완주';
      case '21day': return '21일 완주';
      case '30day': return '30일 완주';
      default: return '챌린지 완주';
    }
  }, []);

  // 그라데이션 색상
  const gradientColors = useMemo(() => {
    if (isDarkMode) {
      return ['#1a1a2e', '#16213e', '#0f3460'];
    }
    return [theme.colors.primaryDark, theme.colors.primaryDark, theme.colors.primaryDark];
  }, [isDarkMode, theme.colors.primaryDark]);

  // 데이터 로드
  React.useEffect(() => {
    if (completionId && !completionData) {
      loadData();
    }
  }, [completionId]);

  const loadData = async () => {
    if (!completionId) return;
    try {
      setLoading(true);
      const response = await viralApi.getCompletionCard(completionId);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      if (__DEV__) console.error('카드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 공유 기능
  const handleShare = async () => {
    if (!data) return;

    try {
      setSharing(true);

      const shareMessage = `🎉 ${data.challenge_title} ${getCompletionLabel(data.completion_type)}!

📅 ${data.completed_days}일간의 감정 기록
💝 ${data.total_emotions_logged}번의 감정 표현
🤗 ${data.encouragements_received}개의 응원 받음
💪 ${data.encouragements_given}개의 응원 보냄

${data.top_emotions?.map(e => e.icon).join(' ') || ''}

#감정챌린지 #Dayonme #마음돌봄`;

      await Share.share({
        message: shareMessage,
        title: `${data.challenge_title} 완주!`,
      });

      // 공유 횟수 증가
      if (data.completion_id) {
        await viralApi.shareCard(data.completion_id);
      }

      onShare?.();
    } catch (error) {
      if (__DEV__) console.error('공유 실패:', error);
    } finally {
      setSharing(false);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!data) return null;

  const cardStyle = compact ? styles.compactCard : styles.card;

  return (
    <LinearGradient
      colors={gradientColors}
      style={[cardStyle, { borderRadius: 20 * scale }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* 완주 배지 */}
      <View style={[styles.badge, { paddingHorizontal: 12 * scale, paddingVertical: 6 * scale }]}>
        <Text style={[styles.badgeText, { fontSize: 12 * scale }]}>
          🏆 {getCompletionLabel(data.completion_type)}
        </Text>
      </View>

      {/* 챌린지 제목 */}
      <Text style={[styles.title, { fontSize: (compact ? 18 : 22) * scale, marginTop: 16 * scale }]}>
        {data.challenge_title}
      </Text>

      {/* 통계 섹션 */}
      <View style={[styles.statsContainer, { marginTop: 20 * scale }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { fontSize: (compact ? 24 : 28) * scale }]}>
            {data.completed_days}
          </Text>
          <Text style={[styles.statLabel, { fontSize: 11 * scale }]}>일간 기록</Text>
        </View>

        <View style={[styles.divider, { height: 40 * scale }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { fontSize: (compact ? 24 : 28) * scale }]}>
            {data.total_emotions_logged}
          </Text>
          <Text style={[styles.statLabel, { fontSize: 11 * scale }]}>감정 표현</Text>
        </View>

        <View style={[styles.divider, { height: 40 * scale }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { fontSize: (compact ? 24 : 28) * scale }]}>
            {data.encouragements_received}
          </Text>
          <Text style={[styles.statLabel, { fontSize: 11 * scale }]}>응원 받음</Text>
        </View>
      </View>

      {/* Top 감정 */}
      {data.top_emotions && data.top_emotions.length > 0 && (
        <View style={[styles.emotionsContainer, { marginTop: 16 * scale }]}>
          <Text style={[styles.emotionsLabel, { fontSize: 12 * scale }]}>자주 표현한 감정</Text>
          <View style={styles.emotionsRow}>
            {data.top_emotions.map((emotion, index) => (
              <View key={index} style={[styles.emotionBubble, { padding: 8 * scale, marginHorizontal: 4 * scale }]}>
                <Text style={{ fontSize: 24 * scale }}>{emotion.icon}</Text>
                {!compact && (
                  <Text style={[styles.emotionName, { fontSize: 10 * scale }]}>{emotion.name}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 응원 통계 */}
      {!compact && (
        <View style={[styles.encouragementStats, { marginTop: 12 * scale, padding: 12 * scale }]}>
          <View style={styles.encouragementItem}>
            <Text style={{ fontSize: 16 * scale }}>💪</Text>
            <Text style={[styles.encouragementText, { fontSize: 12 * scale }]}>
              {data.encouragements_given}개의 응원을 보냈어요
            </Text>
          </View>
        </View>
      )}

      {/* 완주 날짜 */}
      <Text style={[styles.dateText, { fontSize: 11 * scale, marginTop: 12 * scale }]}>
        {new Date(data.completed_at).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })} 완주
      </Text>

      {/* 공유 버튼 */}
      {showShareButton && (
        <TouchableOpacity
          style={[styles.shareButton, { marginTop: 16 * scale, paddingVertical: 12 * scale }]}
          onPress={handleShare}
          disabled={sharing}
          activeOpacity={0.8}
        >
          {sharing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.shareButtonText, { fontSize: 14 * scale }]}>
              📤 카드 공유하기
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* 브랜드 워터마크 */}
      <Text style={[styles.watermark, { fontSize: 10 * scale, marginTop: 8 * scale }]}>
        Dayonme
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  compactCard: {
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  emotionsContainer: {
    alignItems: 'center',
  },
  emotionsLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  emotionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emotionBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
  },
  emotionName: {
    color: '#fff',
    marginTop: 2,
  },
  encouragementStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    width: '100%',
  },
  encouragementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  encouragementText: {
    color: '#fff',
    marginLeft: 8,
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  watermark: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default React.memo(EmotionGrowthCard);
