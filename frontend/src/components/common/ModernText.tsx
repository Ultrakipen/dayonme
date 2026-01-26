import React from 'react';
import { Text, TextStyle } from 'react-native';

interface ModernTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label' | 'subtitle';
  color?: 'primary' | 'secondary' | 'tertiary';
  style?: TextStyle;
  numberOfLines?: number;
}

const ModernText: React.FC<ModernTextProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  style,
  numberOfLines
}) => {
  const getTextStyle = (): TextStyle => {
    let baseStyle: TextStyle = {};
    
    // Variant styles
    switch (variant) {
      case 'h1':
        baseStyle = { fontSize: 32, fontFamily: 'Pretendard-Bold' };
        break;
      case 'h2':
        baseStyle = { fontSize: 28, fontFamily: 'Pretendard-Bold' };
        break;
      case 'h3':
        baseStyle = { fontSize: 24, fontFamily: 'Pretendard-SemiBold' };
        break;
      case 'h4':
        baseStyle = { fontSize: 20, fontFamily: 'Pretendard-SemiBold' };
        break;
      case 'body':
        baseStyle = { fontSize: 16 };
        break;
      case 'caption':
        baseStyle = { fontSize: 12 };
        break;
      case 'label':
        baseStyle = { fontSize: 14, fontFamily: 'Pretendard-Medium' };
        break;
      case 'subtitle':
        baseStyle = { fontSize: 16, fontFamily: 'Pretendard-Medium' };
        break;
    }
    
    // Color styles
    switch (color) {
      case 'primary':
        baseStyle.color = '#333';
        break;
      case 'secondary':
        baseStyle.color = '#666';
        break;
      case 'tertiary':
        baseStyle.color = '#999';
        break;
    }
    
    return { ...baseStyle, ...(style || {}) };
  };

  return (
    <Text style={getTextStyle()} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
};

export default ModernText;