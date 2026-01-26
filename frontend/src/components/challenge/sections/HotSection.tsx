import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS as COLORS } from '../../../constants/challenge';
import { CleanHotCard } from '../cards/CleanHotCard';
import { EmptyHotSection } from '../empty/EmptyHotSection';
import { useModernTheme } from '../../../contexts/ModernThemeContext';

interface Challenge {
  challenge_id: number;
  title: string;
  end_date: string;
  image_urls?: string[];
  tags?: string[];
  participant_count: number;
  like_count?: number;
  comment_count?: number;
  hot_score?: number;
  is_trending?: boolean;
  is_new?: boolean;
}

interface HotSectionProps {
  bestChallenges: Challenge[];
  hotDisplayCount: number;
  fireAnimation: Animated.Value;
  onChallengePress: (challenge: Challenge) => void;
  onViewAll: () => void;
  onLoadMore: () => void;
  isDarkMode?: boolean;
  onMoreOptions?: (challenge: Challenge) => void;
}

export const HotSection = memo<HotSectionProps>(({
  bestChallenges,
  hotDisplayCount,
  fireAnimation,
  onChallengePress,
  onViewAll,
  onLoadMore,
  isDarkMode = false,
  onMoreOptions,
}) => {
  const { theme } = useModernTheme();

  return (
    <LinearGradient
      colors={['rgba(255,100,100,0.15)', 'rgba(255,150,50,0.08)', 'rgba(255,180,100,0.03)', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.bestSectionGradient}
    >
      <View style={styles.bestSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.sectionIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Animated.View style={{ transform: [{ scale: fireAnimation }] }}>
                <MaterialCommunityIcons name="fire" size={20} color="white" />
              </Animated.View>
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              이번주 HOT챌린지
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewAllButton, { backgroundColor: theme.colors.surface }]}
            onPress={onViewAll}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="HOT 챌린지 더보기"
            accessibilityRole="button"
          >
            <Text style={[styles.viewAllText, { color: COLORS.primary }]}>전체보기</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.hotGridContainer}>
          {bestChallenges.slice(0, hotDisplayCount).map((challenge, index) => (
            <View key={challenge.challenge_id} style={styles.hotGridItem}>
              <CleanHotCard
                challenge={challenge}
                index={index}
                onPress={onChallengePress}
                isDarkMode={isDarkMode}
                onMorePress={onMoreOptions ? () => onMoreOptions(challenge) : undefined}
              />
            </View>
          ))}
        </View>

        {bestChallenges.length > hotDisplayCount && (
          <TouchableOpacity
            style={[styles.loadMoreButton, { backgroundColor: theme.colors.surface }]}
            onPress={onLoadMore}
          >
            <Text style={[styles.loadMoreText, { color: COLORS.primary }]}>더 보기</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {bestChallenges.length === 0 && (
          <EmptyHotSection isDarkMode={isDarkMode} />
        )}
      </View>
    </LinearGradient>
  );
});

HotSection.displayName = 'HotSection';

const styles = StyleSheet.create({
  bestSectionGradient: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  bestSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    marginRight: 4,
  },
  hotGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  hotGridItem: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 12,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    marginRight: 4,
  },
});
