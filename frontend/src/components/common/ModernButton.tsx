import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text' | 'outlined';
  color?: 'primary' | 'secondary' | 'error' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  color = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false
}) => {
  const { theme, isDark } = useModernTheme();

  // 색상 정의
  const colorMap = {
    primary: isDark ? '#60a5fa' : '#0095F6',
    secondary: isDark ? '#9ca3af' : '#6B7280',
    error: '#FF3B30',
    success: '#00BA7C',
  };

  // 사이즈 정의
  const sizeMap = {
    small: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14, minHeight: 36 },
    medium: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, minHeight: 44 },
    large: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 18, minHeight: 52 },
  };

  const buttonColor = colorMap[color];
  const buttonSize = sizeMap[size];

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingHorizontal: buttonSize.paddingHorizontal,
      paddingVertical: buttonSize.paddingVertical,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: buttonSize.minHeight,
      flexDirection: 'row',
      gap: 8,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = buttonColor;
        break;
      case 'secondary':
        baseStyle.backgroundColor = isDark ? theme.bg.secondary : '#F8F9FA';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = isDark ? theme.bg.border : '#E0E0E0';
        break;
      case 'outlined':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = buttonColor;
        break;
      case 'text':
        baseStyle.backgroundColor = 'transparent';
        break;
    }

    if (disabled || loading) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextColor = (): string => {
    if (variant === 'primary') {
      return '#FFFFFF';
    } else if (variant === 'outlined' || variant === 'text') {
      return buttonColor;
    } else {
      return theme.colors.text.primary;
    }
  };

  const getTextStyle = (): TextStyle => {
    return {
      fontSize: buttonSize.fontSize,
      fontWeight: '600',
      textAlign: 'center',
      color: getTextColor(),
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {icon && !loading && (
        <Icon name={icon} size={buttonSize.fontSize + 2} color={getTextColor()} />
      )}
      <Text style={[getTextStyle(), textStyle]}>
        {loading ? '로딩 중...' : title}
      </Text>
    </TouchableOpacity>
  );
};

export default ModernButton;