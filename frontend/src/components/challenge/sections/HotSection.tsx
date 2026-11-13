import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
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
    <View style={styles.bestSectionGradient}>
      <View style={styles.bestSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.colors.tint }]}>
              <Animated.View style={{ transform: [{ scale: fireAnimation }] }}>
                <MaterialCommunityIcons name="fire" size={20} color={theme.colors.accentText} />
              </Animated.View>
            </View>
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
            <Text style={[styles.viewAllText, { color: theme.colors.accentText }]}>전체보기</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.accentText} />
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
            <Text style={[styles.loadMoreText, { color: theme.colors.accentText }]}>더 보기</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.accentText} />
          </TouchableOpacity>
        )}

        {bestChallenges.length === 0 && (
          <EmptyHotSection isDarkMode={isDarkMode} />
        )}
      </View>
    </View>
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
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '600',
    marginRight: 4,
  },
});
