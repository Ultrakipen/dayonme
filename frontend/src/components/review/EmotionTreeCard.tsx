import React from 'react';
import { View, Text as RNText, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { EmotionTreeStage } from '../../types/ReviewScreen.types';
import { getEmotionColors } from '../../constants/reviewColors';
import createStylesFn, { scaleFontSize, scaleSpacing } from '../../styles/ReviewScreen.styles';

interface EmotionTreeCardProps {
  emotionTreeStage: EmotionTreeStage;
  consecutiveDays: number;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

const EmotionTreeCard: React.FC<EmotionTreeCardProps> = ({
  emotionTreeStage,
  consecutiveDays,
  fadeAnim,
  scaleAnim
}) => {
  const { isDark, colors } = useModernTheme();
  const themeColors = getEmotionColors(isDark);
  const styles = createStylesFn(isDark, colors);

  return (
    <Animated.View style={[
      styles.treeContainer,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      <View style={styles.treeCard}>
        <View style={styles.treeHeader}>
          <RNText style={styles.treeEmoji}>{emotionTreeStage.emoji}</RNText>
          <View style={styles.treeTextContainer}>
            <RNText style={styles.treeName}>{emotionTreeStage.name}</RNText>
            <RNText style={styles.treeDescription}>
              {emotionTreeStage.description}
            </RNText>
          </View>
        </View>
        <View style={styles.treeDaysContainer}>
          <Icon name="flame" size={20} color={themeColors.error} />
          <RNText style={styles.treeDaysText}>
            {consecutiveDays > 0
              ? `🔥 ${consecutiveDays}일 연속 기록 중`
              : '오늘부터 시작해볼까요?'}
          </RNText>
        </View>
      </View>
    </Animated.View>
  );
};

export default React.memo(EmotionTreeCard);
