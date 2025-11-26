import React from 'react';
import { View, TouchableOpacity, Text as RNText } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import createStylesFn from '../../styles/ReviewScreen.styles';

interface PeriodSelectorProps {
  selectedPeriod: 'week' | 'month' | 'year';
  onPeriodChange: (period: 'week' | 'month' | 'year') => void;
}

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ selectedPeriod, onPeriodChange }) => {
  const { isDark, colors } = useModernTheme();
  const styles = createStylesFn(isDark, colors);

  return (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'year'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.selectedPeriodButton
          ]}
          onPress={() => {
            ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
            onPeriodChange(period);
          }}
          accessibilityRole="button"
          accessibilityLabel={period === "week" ? "주간 보기" : period === "month" ? "월간 보기" : "연간 보기"}
        >
          <RNText style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.selectedPeriodButtonText
          ]}>
            {period === 'week' ? '주간' : period === 'month' ? '월간' : '연간'}
          </RNText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default React.memo(PeriodSelector);
