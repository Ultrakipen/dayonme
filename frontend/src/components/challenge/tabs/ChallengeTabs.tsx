import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS as COLORS } from '../../../constants/challenge';
import { normalize, normalizeIcon } from '../../../utils/responsive';
import { useModernTheme } from '../../../contexts/ModernThemeContext';

export type ChallengeTab = 'all' | 'hot' | 'my';

interface ChallengeTabsProps {
  activeTab: ChallengeTab;
  onTabChange: (tab: ChallengeTab) => void;
  showMyTab?: boolean;  // 나의 챌린지 탭 표시 여부 (기본값: true)
}

export const ChallengeTabs = memo<ChallengeTabsProps>(({ activeTab, onTabChange, showMyTab = true }) => {
  const { theme, isDark } = useModernTheme();
  if (__DEV__) console.log('📊 ChallengeTabs 렌더링:', { activeTab, showMyTab });

  return (
    <View style={[
      styles.tabContainer,
      {
        backgroundColor: theme.bg.primary,
        borderBottomWidth: isDark ? 0 : 0.5,
        borderBottomColor: isDark ? 'transparent' : theme.bg.border,
      }
    ]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'all' && styles.tabActive,
          { backgroundColor: activeTab === 'all' ? theme.colors.primary : 'transparent' }
        ]}
        onPress={() => onTabChange('all')}
      >
        <MaterialCommunityIcons
          name="view-grid-outline"
          size={normalizeIcon(16)}
          color={activeTab === 'all' ? theme.colors.onAccent : theme.text.secondary}
        />
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[
          styles.tabText,
          activeTab === 'all' && styles.tabTextActive,
          { color: activeTab === 'all' ? theme.colors.onAccent : theme.text.secondary }
        ]}>
          전체
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'hot' && styles.tabActive,
          { backgroundColor: activeTab === 'hot' ? theme.colors.primary : 'transparent' }
        ]}
        onPress={() => onTabChange('hot')}
      >
        <MaterialCommunityIcons
          name="fire"
          size={normalizeIcon(16)}
          color={activeTab === 'hot' ? theme.colors.onAccent : theme.text.secondary}
        />
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[
          styles.tabText,
          activeTab === 'hot' && styles.tabTextActive,
          { color: activeTab === 'hot' ? theme.colors.onAccent : theme.text.secondary }
        ]}>
          HOT
        </Text>
      </TouchableOpacity>

      {/* 나의 챌린지 탭 - 로그인 사용자만 표시 */}
      {showMyTab && (
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my' && styles.tabActive,
            { backgroundColor: activeTab === 'my' ? COLORS.warning : 'transparent' }
          ]}
          onPress={() => onTabChange('my')}
        >
          <MaterialCommunityIcons
            name="star-outline"
            size={normalizeIcon(16)}
            color={activeTab === 'my' ? 'white' : theme.text.secondary}
          />
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[
            styles.tabText,
            activeTab === 'my' && styles.tabTextActive,
            { color: activeTab === 'my' ? 'white' : theme.text.secondary }
          ]}>
            나의 챌린지
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

ChallengeTabs.displayName = 'ChallengeTabs';

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
});
