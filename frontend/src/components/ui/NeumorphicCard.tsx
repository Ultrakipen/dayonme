// 네오모피즘 카드 컴포넌트
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { normalizeBorderRadius } from '../../utils/responsive';

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressed?: boolean;
  convex?: boolean; // true: 볼록, false: 오목
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  style,
  pressed = false,
  convex = true
}) => {
  const { isDark, theme } = useModernTheme();

  const getNeumorphicStyle = () => {
    if (isDark) {
      // 다크모드 네오모피즘
      const bgColor = theme.bg.card;
      return {
        backgroundColor: bgColor,
        borderRadius: normalizeBorderRadius(16),
        shadowColor: pressed || !convex ? '#ffffff' : '#000000',
        shadowOffset: pressed || !convex
          ? { width: -4, height: -4 }
          : { width: 6, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: pressed || !convex ? 2 : 8,
      };
    } else {
      // 라이트모드 네오모피즘
      const bgColor = theme.bg.card;
      return {
        backgroundColor: bgColor,
        borderRadius: normalizeBorderRadius(16),
        shadowColor: pressed || !convex ? '#ffffff' : '#000000',
        shadowOffset: pressed || !convex
          ? { width: -4, height: -4 }
          : { width: 6, height: 6 },
        shadowOpacity: pressed || !convex ? 0.5 : 0.15,
        shadowRadius: 8,
        elevation: pressed || !convex ? 2 : 8,
      };
    }
  };

  return (
    <View style={[getNeumorphicStyle(), style]}>
      {children}
    </View>
  );
};

export default NeumorphicCard;
