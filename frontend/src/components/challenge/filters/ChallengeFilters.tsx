import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS as COLORS } from '../../../constants/challenge';
import { normalize, normalizeIcon } from '../../../utils/responsive';
import { useModernTheme } from '../../../contexts/ModernThemeContext';

interface FilterOption {
  key: string;
  label: string;
  icon: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'latest', label: '최신순', icon: 'clock-outline' },
  { key: 'popular', label: '인기순', icon: 'heart-outline' },
  { key: 'ending_soon', label: '마감임박', icon: 'timer-outline' },
  { key: 'recommended', label: '추천', icon: 'star-outline' }
];

interface ChallengeFiltersProps {
  searchQuery: string;
  sortBy: string;
  onSearchPress: () => void;
  onFilterChange: (type: string, value: string) => void;
}

export const ChallengeFilters = memo<ChallengeFiltersProps>(({
  searchQuery,
  sortBy,
  onSearchPress,
  onFilterChange,
}) => {
  const { theme, isDark } = useModernTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? theme.bg.surface : 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        shadowOpacity: 0,
      }
    ]}>
      {/* 검색 버튼 */}
      <TouchableOpacity
        style={[
          styles.searchButton,
          {
            backgroundColor: theme.bg.card,
            borderColor: theme.bg.border,
            shadowOpacity: isDark ? 0.2 : 0.08,
          }
        ]}
        onPress={onSearchPress}
        activeOpacity={0.7}
      >
        <View style={styles.searchButtonContent}>
          <MaterialCommunityIcons
            name="magnify"
            size={normalizeIcon(18)}
            color={theme.text.secondary}
          />
          <Text style={[
            styles.searchPlaceholder,
            { color: theme.text.secondary }
          ]}>
            {searchQuery || '챌린지 검색...'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 필터 칩 */}
      <View style={styles.filterChipsContainer}>
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: sortBy === filter.key
                  ? COLORS.primary
                  : theme.bg.card,
                borderColor: sortBy === filter.key
                  ? COLORS.primary
                  : theme.bg.border
              }
            ]}
            onPress={() => onFilterChange('sortBy', filter.key)}
          >
            <MaterialCommunityIcons
              name={filter.icon}
              size={normalizeIcon(14)}
              color={sortBy === filter.key ? 'white' : COLORS.primary}
            />
            <Text style={[
              styles.filterChipText,
              { color: sortBy === filter.key ? 'white' : COLORS.primary }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

ChallengeFilters.displayName = 'ChallengeFilters';

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 3,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 5,
    height: 38,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0.5,
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: normalize(14),
    fontFamily: 'Pretendard-Medium',
    lineHeight: 18,
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    letterSpacing: -0.2,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 0.5,
    marginHorizontal: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipText: {
    fontSize: normalize(13),
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: 4,
    letterSpacing: -0.2,
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    lineHeight: 16,
  },
});
