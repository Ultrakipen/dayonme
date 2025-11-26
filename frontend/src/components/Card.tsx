// src/components/Card.tsx
import React from 'react';
import { ViewStyle } from 'react-native';
import { Box, Text, Pressable } from './ui';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  footer?: React.ReactNode;
  elevated?: boolean;
  borderRadius?: number;
  padding?: number;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  style,
  onPress,
  footer,
  elevated = true,
  borderRadius = 8,
  padding = 16,
}) => {
  const getCardClasses = () => {
    let classes = 'bg-white mb-3 overflow-hidden';
    
    if (elevated) {
      classes += ' shadow-md';
    }
    
    // borderRadius를 Tailwind 클래스로 변환
    if (borderRadius <= 4) classes += ' rounded';
    else if (borderRadius <= 8) classes += ' rounded-lg';
    else classes += ' rounded-xl';
    
    return classes;
  };

  const paddingStyle = { padding };
  
  if (onPress) {
    return (
      <Pressable
        className={getCardClasses()}
        style={[paddingStyle, style]}
        onPress={onPress}
      >
        {title && <Text className="text-base font-semibold mb-3 text-gray-800">{title}</Text>}
        <Box className="w-full">{children}</Box>
        {footer && <Box className="mt-3 pt-3 border-t border-gray-200">{footer}</Box>}
      </Pressable>
    );
  }
  
  return (
    <Box
      className={getCardClasses()}
      style={[paddingStyle, style]}
    >
      {title && <Text className="text-base font-semibold mb-3 text-gray-800">{title}</Text>}
      <Box className="w-full">{children}</Box>
      {footer && <Box className="mt-3 pt-3 border-t border-gray-200">{footer}</Box>}
    </Box>
  );
};


export default Card;