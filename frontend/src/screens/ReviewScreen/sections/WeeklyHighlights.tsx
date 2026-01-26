import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import LinearGradient from 'react-native-linear-gradient';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

const scale = 1; // StyleSheet용 기본값

interface Highlight {
  id: number;
  type: 'most_liked' | 'longest' | 'most_honest' | 'special';
  title: string;
  emotion: string;
  emotionIcon: string;
  content: string;
  imageUrl?: string;
  likeCount?: number;
  date: string;
}

interface Props {
  highlights?: Highlight[];
}

export const WeeklyHighlights: React.FC<Props> = ({ highlights }) => {
  const { colors } = useModernTheme();

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { icon: string; label: string; gradient: string[] }> = {
      most_liked: { icon: '❤️', label: '가장 많은 공감', gradient: ['#f093fb', '#f5576c'] },
      longest: { icon: '📝', label: '가장 긴 이야기', gradient: ['#4facfe', '#00f2fe'] },
      most_honest: { icon: '💭', label: '가장 솔직한 순간', gradient: ['#667eea', '#764ba2'] },
      special: { icon: '⭐', label: '특별한 순간', gradient: ['#fa709a', '#fee140'] },
    };
    return configs[type] || configs.special;
  };

  const defaultHighlights: Highlight[] = [
    {
      id: 1,
      type: 'most_liked',
      title: '가장 많은 공감',
      emotion: '행복',
      emotionIcon: '😊',
      content: '오늘 프로젝트가 성공적으로 끝났다. 팀원들과 함께 축하했고...',
      likeCount: 24,
      date: '2025.11.15',
    },
    {
      id: 2,
      type: 'longest',
      title: '가장 긴 이야기',
      emotion: '감사',
      emotionIcon: '🙏',
      content: '오랜만에 가족들과 시간을 보냈다. 부모님께서 건강하셔서...',
      date: '2025.11.13',
    },
    {
      id: 3,
      type: 'most_honest',
      title: '가장 솔직한 순간',
      emotion: '불안',
      emotionIcon: '😰',
      content: '미래가 불안하다. 하지만 이런 마음도 괜찮다고 스스로에게...',
      date: '2025.11.12',
    },
  ];

  const displayHighlights = highlights || defaultHighlights;

  if (displayHighlights.length === 0) return null;

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>🌟 이번 주 베스트 모먼트</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        당신의 특별한 순간들
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={260 * scale}
      >
        {displayHighlights.map((highlight, index) => {
          const config = getTypeConfig(highlight.type);
          return (
            <View key={highlight.id} style={styles.cardWrapper}>
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.highlightCard}
              >
                {highlight.imageUrl && (
                  <Image
                    source={{ uri: highlight.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.cardContent}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>{config.icon}</Text>
                    <Text style={styles.badgeText}>{config.label}</Text>
                  </View>

                  <View style={styles.emotionRow}>
                    <Text style={styles.emotionIcon}>{highlight.emotionIcon}</Text>
                    <Text style={styles.emotionText}>{highlight.emotion}</Text>
                  </View>

                  <Text style={styles.content} numberOfLines={3}>
                    {highlight.content}
                  </Text>

                  <View style={styles.footer}>
                    <Text style={styles.date}>{highlight.date}</Text>
                    {highlight.likeCount !== undefined && (
                      <View style={styles.likeRow}>
                        <Text style={styles.likeIcon}>❤️</Text>
                        <Text style={styles.likeCount}>{highlight.likeCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.h4 * scale,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 4 * scale,
  },
  subtitle: {
    fontSize: FONT_SIZES.caption * scale,
    marginBottom: 16 * scale,
  },
  scrollContent: {
    paddingRight: 20 * scale,
  },
  cardWrapper: {
    marginRight: 16 * scale,
  },
  highlightCard: {
    width: 240 * scale,
    minHeight: 200 * scale,
    borderRadius: 24 * scale,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  image: {
    width: '100%',
    height: 120 * scale,
  },
  cardContent: {
    padding: 20 * scale,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 16 * scale,
    marginBottom: 12 * scale,
  },
  badgeIcon: {
    fontSize: FONT_SIZES.bodySmall * scale,
    marginRight: 4 * scale,
  },
  badgeText: {
    fontSize: FONT_SIZES.tiny * scale,
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Bold',
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8 * scale,
  },
  emotionIcon: {
    fontSize: FONT_SIZES.h2 * scale,
    marginRight: 6 * scale,
  },
  emotionText: {
    fontSize: FONT_SIZES.body * scale,
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Bold',
  },
  content: {
    fontSize: FONT_SIZES.bodySmall * scale,
    color: '#FFFFFF',
    lineHeight: 20 * scale,
    marginBottom: 12 * scale,
    opacity: 0.95,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: FONT_SIZES.tiny * scale,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: 'Pretendard-Medium',
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 12 * scale,
  },
  likeIcon: {
    fontSize: FONT_SIZES.small * scale,
    marginRight: 4 * scale,
  },
  likeCount: {
    fontSize: FONT_SIZES.small * scale,
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Bold',
  },
});
