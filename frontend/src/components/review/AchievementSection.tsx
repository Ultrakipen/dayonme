import React from 'react';
import { View, Text as RNText, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { Achievement } from '../../types/ReviewScreen.types';
import { getEmotionColors } from '../../constants/reviewColors';
import CircularProgress from '../common/CircularProgress';
import createStylesFn, { scaleFontSize, scaleSpacing } from '../../styles/ReviewScreen.styles';

interface AchievementSectionProps {
  achievements: Achievement[];
  selectedPeriod: 'week' | 'month' | 'year';
}

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

const AchievementSection: React.FC<AchievementSectionProps> = ({
  achievements,
  selectedPeriod
}) => {
  const { isDark, colors } = useModernTheme();
  const emotionColors = getEmotionColors(isDark);
  const themeColors = getEmotionColors(isDark);
  const styles = createStylesFn(isDark, colors);

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedPeriod === 'week') {
      return ![6, 7].includes(achievement.id);
    } else if (selectedPeriod === 'month') {
      return true;
    } else {
      return ![2].includes(achievement.id);
    }
  });

  if (filteredAchievements.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Icon name="medal" size={26} color={emotionColors.primary} />
        <RNText style={styles.sectionTitle}>성장 마일스톤</RNText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filteredAchievements.map((achievement) => (
          <TouchableOpacity
            key={achievement.id}
            style={[
              styles.achievementCard,
              !achievement.unlocked && styles.achievementLocked
            ]}
            onPress={() => {
              ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
              achievement.onPress?.();
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${achievement.title} ${achievement.unlocked ? '달성함' : '미달성'}`}
            accessibilityHint={achievement.description}
          >
            <LinearGradient
              colors={achievement.unlocked
                ? [achievement.color + '40', achievement.color + '10']
                : isDark ? ['#2C2C2E', '#1C1C1E'] : ['#E5E5EA', '#F2F2F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.achievementIcon}
            >
              <MaterialCommunityIcons
                name={achievement.icon as any}
                size={34}
                color={achievement.unlocked ? achievement.color : '#CCCCCC'}
              />
              {achievement.unlocked && (
                <View style={styles.unlockedBadge}>
                  <Icon name="checkmark-circle" size={20} color={themeColors.success} />
                </View>
              )}
            </LinearGradient>
            <RNText style={[
              styles.achievementTitle,
              !achievement.unlocked && styles.achievementLockedText
            ]}>
              {achievement.title}
            </RNText>
            <RNText style={[
              styles.achievementDescription,
              !achievement.unlocked && styles.achievementLockedText
            ]}>
              {achievement.description}
            </RNText>
            {achievement.progress !== undefined && achievement.maxProgress && (
              <View style={{ marginTop: scaleSpacing(12), alignItems: 'center' }}>
                <CircularProgress
                  progress={achievement.progress}
                  maxProgress={achievement.maxProgress}
                  size={60}
                  strokeWidth={5}
                  color={achievement.unlocked ? achievement.color : '#CCCCCC'}
                />
                <RNText style={[styles.progressText, { marginTop: scaleSpacing(8) }]}>
                  {achievement.progress}/{achievement.maxProgress}
                </RNText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default React.memo(AchievementSection);
