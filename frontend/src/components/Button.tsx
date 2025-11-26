// src/components/Button.tsx
import React from 'react';
import { ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Text, Pressable } from './ui';

// 나머지 코드는 그대로 유지
interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const getButtonClasses = () => {
    let baseClasses = 'rounded-lg flex-row items-center justify-center';
    
    // 타입별 스타일
    switch (type) {
      case 'primary':
        baseClasses += ' bg-blue-500';
        break;
      case 'secondary':
        baseClasses += ' bg-blue-100';
        break;
      case 'outline':
        baseClasses += ' bg-transparent border border-blue-500';
        break;
      case 'text':
        baseClasses += ' bg-transparent px-0';
        break;
    }
    
    // 크기별 스타일
    switch (size) {
      case 'small':
        baseClasses += ' py-1.5 px-3 min-w-20';
        break;
      case 'medium':
        baseClasses += ' py-2.5 px-4 min-w-25';
        break;
      case 'large':
        baseClasses += ' py-3.5 px-5 min-w-30';
        break;
    }
    
    // 비활성화 상태
    if (disabled) {
      baseClasses += ' bg-gray-300 border-gray-300';
    }
    
    return baseClasses;
  };
  
  const getTextClasses = () => {
    let textClasses = 'font-semibold';
    
    switch (type) {
      case 'primary':
        textClasses += ' text-white';
        break;
      case 'secondary':
        textClasses += ' text-blue-500';
        break;
      case 'outline':
        textClasses += ' text-blue-500';
        break;
      case 'text':
        textClasses += ' text-blue-500 font-medium';
        break;
    }
    
    switch (size) {
      case 'small':
        textClasses += ' text-xs';
        break;
      case 'medium':
        textClasses += ' text-sm';
        break;
      case 'large':
        textClasses += ' text-base';
        break;
    }
    
    if (disabled) {
      textClasses += ' text-gray-500';
    }
    
    return textClasses;
  };
  
  return (
    <Pressable
      className={getButtonClasses()}
      style={style}
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
    >
      {leftIcon && !loading && (
        typeof leftIcon === 'string' ? <Text>{leftIcon}</Text> : leftIcon
      )}
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={type === 'primary' ? '#FFFFFF' : '#4A90E2'} 
        />
      ) : (
        <Text className={getTextClasses()} style={textStyle}>
          {title}
        </Text>
      )}
      {rightIcon && !loading && (
        typeof rightIcon === 'string' ? <Text>{rightIcon}</Text> : rightIcon
      )}
    </Pressable>
  );
};


export default Button;