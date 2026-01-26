import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, SafeAreaView } from 'react-native';
import { useModernTheme } from '../../../hooks/useModernTheme';
import reviewService from '../../../services/api/reviewService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

interface Badge {
  id: number;
  achievement_type: string;
  achievement_name: string;
  achievement_icon: string;
  earned_at: string;
}

interface BadgeData {
  badges: Badge[];
  newBadges: number;
}

interface Props {
  onClose?: () => void;
}

export const BadgeCollection: React.FC<Props> = ({ onClose }) => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [data, setData] = useState<BadgeData | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const response = await reviewService.getUserBadges();
      setData(response.data);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      if (__DEV__) console.error('배지 로드 실패:', error);
    }
  };

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>배지를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 with 닫기 버튼 */}
      <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <Text style={[styles.modalTitle, { color: colors.text, fontSize: FONT_SIZES.h2 * scale }]}>
          🏆 나의 배지
        </Text>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessible={true}
            accessibilityLabel="닫기"
            accessibilityRole="button"
          >
            <Text style={[styles.closeButtonText, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }]}>
              총 {data.badges.length}개 배지 보유
            </Text>
            {data.newBadges > 0 && (
              <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.newBadgeText, { fontSize: FONT_SIZES.caption * scale }]}>
                  +{data.newBadges} NEW
                </Text>
              </View>
            )}
          </View>

          {data.badges.length > 0 ? (
            <View style={styles.badgeGrid}>
              {data.badges.map((badge, index) => (
                <Animated.View
                  key={badge.id}
                  style={[
                    styles.badgeItem,
                    {
                      backgroundColor: isDark ? colors.surface : colors.border + '30',
                      opacity: fadeAnim,
                    }
                  ]}
                >
                  <Text style={[styles.badgeIcon, { fontSize: 48 * scale }]}>{badge.achievement_icon}</Text>
                  <Text style={[styles.badgeName, { color: colors.text, fontSize: FONT_SIZES.small * scale }]} numberOfLines={2}>
                    {badge.achievement_name}
                  </Text>
                  <Text style={[styles.badgeDate, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny * scale }]}>
                    {new Date(badge.earned_at).toLocaleDateString('ko-KR')}
                  </Text>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>
                아직 획득한 배지가 없습니다
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontFamily: 'Pretendard-Bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontFamily: 'Pretendard-SemiBold',
  },
  newBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#fff',
    fontFamily: 'Pretendard-Bold',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  badgeItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    marginBottom: 8,
  },
  badgeName: {
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDate: {
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
