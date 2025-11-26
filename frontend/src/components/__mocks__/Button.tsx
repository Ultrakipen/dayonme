// src/components/__mocks__/Button.tsx
import React from 'react';
import { TouchableOpacity, Text as RNText, View } from 'react-native';
import { Text } from '../ui';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: any;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false, 
  leftIcon, 
  rightIcon 
}) => {
  return (
    <TouchableOpacity 
      testID="button-component"
      onPress={!disabled && !loading ? onPress : undefined}
      disabled={disabled || loading}
    >
      {!loading && leftIcon}
      {!loading && <Text testID="button-text">{title}</Text>}
      {loading && <View testID="loading-indicator" />}
      {!loading && rightIcon}
    </TouchableOpacity>
  );
};

export default Button;