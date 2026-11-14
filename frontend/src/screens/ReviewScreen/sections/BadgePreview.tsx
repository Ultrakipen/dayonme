import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { BadgeCollection } from './BadgeCollection';
import reviewService from '../../../services/api/reviewService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
  achievement_icon?: string;
  achievement_name?: string;
}

export const BadgePreview: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([
    { id: '1', icon: '🔥', name: '7일 연속', description: '일주일 연속 기록', unlocked: true },
    { id: '2', icon: '💯', name: '100번째', description: '100개 감정 기록', unlocked: false, progress: 45, total: 100 },
    { id: '3', icon: '🌈', name: '감정 탐험가', description: '모든 감정 경험', unlocked: false, progress: 12, total: 20 },
  ]);

  const loadBadges = useCallback(async () => {
    try {
      setError(null);
      const response = await reviewService.getUserBadges();

      if (response.status === 'success' && response.data?.badges?.length > 0) {
        const formattedBadges = response.data.badges.slice(0, 3).map((b: any) => ({
          id: b.achievement_id?.toString() || b.id?.toString(),
          icon: b.achievement_icon || '🏆',
          name: b.achievement_name || '배지',
          description: b.achievement_type || '',
          unlocked: true,
        }));
        setBadges(formattedBadges);
      }
    } catch (err) {
      setError('배지 정보를 불러오는데 실패했습니다');
      console.error('배지 로드 실패:', err);
    }
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const recentBadges = badges.slice(0, 3);

  const handleViewAll = () => {
    setShowAllBadges(true);
  };

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="나의 배지 섹션">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body }}>{error}</Text>
          <TouchableOpacity
            onPress={loadBadges}
            style={[styles.retryButton, { marginTop: 12 * scale }]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <Card accessible={true} accessibilityLabel="나의 배지 섹션">
      <View style={[styles.header, { marginBottom: 16 * scale }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TwemojiImage emoji="🏆" size={FONT_SIZES.h3 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>나의 배지</Text>
        </View>
        <TouchableOpacity
          onPress={handleViewAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="모든 배지 보기"
          accessibilityHint="전체 배지 목록을 확인합니다"
        >
          <Text style={[styles.moreButton, { color: colors.primary, fontSize: FONT_SIZES.bodySmall }]}>모두 보기 →</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.badgesContainer, { gap: 12 * scale, marginBottom: 16 * scale }]}>
        {recentBadges.map((badge) => (
          <View
            key={badge.id}
            style={[styles.badgeItem, { gap: 8 * scale }]}
            accessible={true}
            accessibilityLabel={`${badge.name} 배지, ${badge.unlocked ? '획득 완료' : '미획득'}`}
          >
            <View style={[
              styles.badgeIcon,
              {
                backgroundColor: isDark ? colors.surface : colors.border,
                width: 64 * scale,
                height: 64 * scale,
                borderRadius: 32 * scale
              },
              !badge.unlocked && styles.badgeLocked
            ]}>
              <TwemojiImage
                emoji={badge.unlocked ? badge.icon : '🔒'}
                size={badge.unlocked ? 32 * scale : FONT_SIZES.h1 * scale}
              />
            </View>
            <Text style={[styles.badgeName, { color: colors.text, fontSize: FONT_SIZES.small }]} numberOfLines={1}>
              {badge.name}
            </Text>
            {!badge.unlocked && badge.progress && (
              <View style={[styles.progressBar, { backgroundColor: colors.border, height: 4 * scale, borderRadius: 2 * scale }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(badge.progress / badge.total!) * 100}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 2 * scale
                    }
                  ]}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={[styles.summary, {
        backgroundColor: isDark
          ? 'rgba(99, 102, 241, 0.12)'
          : colors.surface || colors.border + '30',
        padding: 12 * scale,
        borderRadius: 12 * scale
      }]}>
        <Text style={[styles.summaryText, { color: colors.text, fontSize: FONT_SIZES.caption }]}>
          {badges.filter(b => b.unlocked).length}개 달성 · {badges.length - badges.filter(b => b.unlocked).length}개 도전 중
        </Text>
      </View>

      <Modal
        visible={showAllBadges}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllBadges(false)}
      >
        <BadgeCollection onClose={() => setShowAllBadges(false)} />
      </Modal>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  moreButton: {
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
  },
  badgeItem: {
    flex: 1,
    alignItems: 'center',
  },
  badgeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  summary: {
  },
  summaryText: {
    fontWeight: '600',
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
