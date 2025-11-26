import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getEmotionColors } from '../../../constants/reviewColors';
import createStylesFn from '../../../styles/ReviewScreen.styles';
import { useModernTheme } from '../../../contexts/ModernThemeContext';

interface TodayCTAProps {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onPress: () => void;
}

export const TodayCTA: React.FC<TodayCTAProps> = ({
  fadeAnim,
  scaleAnim,
  onPress
}) => {
  const { isDark, colors } = useModernTheme();
  const styles = createStylesFn(isDark, colors);
  const emotionColors = getEmotionColors(isDark);

  return (
    <Animated.View style={[
      styles.ctaContainer,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      <View style={styles.ctaCard}>
        <Icon name="create-outline" size={48} color={emotionColors.primary} />
        <Text style={styles.ctaTitle}>오늘 하루는 어떠셨나요?</Text>
        <Text style={styles.ctaSubtitle}>
          5분만 시간 내서 오늘 하루를 되돌아보세요
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="오늘의 감정 기록하기"
          accessibilityHint="두 번 탭하여 오늘의 감정을 기록하세요"
        >
          <Text style={styles.ctaButtonText}>지금 기록하기</Text>
          <Icon name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
