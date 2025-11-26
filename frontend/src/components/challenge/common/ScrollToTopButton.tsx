import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS } from '../../../constants/challenge';

interface ScrollToTopButtonProps {
  onPress: () => void;
  isDarkMode?: boolean;
  opacity: Animated.Value;
  visible: boolean;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  onPress,
  isDarkMode = false,
  opacity,
  visible
}) => {
  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [
            {
              scale: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ],
        },
        !visible && { pointerEvents: 'none' as const },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="chevron-up"
          size={22}
          color={isDarkMode ? CHALLENGE_COLORS.darkText : CHALLENGE_COLORS.text}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    shadowColor: CHALLENGE_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
});
