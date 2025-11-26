// components/ModernUI/StyledText.tsx - 모던 스타일 텍스트 컴포넌트
import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useModernTheme } from '../../contexts/ModernThemeContext';

interface StyledTextProps extends TextProps {
  variant?: 
    | 'h1' | 'h2' | 'h3' | 'h4'
    | 'body' | 'bodyLarge' | 'bodySmall'
    | 'label' | 'labelSmall'
    | 'caption' | 'captionSmall'
    | 'button' | 'buttonLarge' | 'buttonSmall'
    | 'username' | 'postText' | 'hashtag' | 'mention' | 'timestamp';
  color?: 'primary' | 'secondary' | 'tertiary' | 'white' | 'black' | 'inherit';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
  center?: boolean;
  numberOfLines?: number;
}

export const StyledText: React.FC<StyledTextProps> = ({
  children,
  style,
  variant = 'body',
  color = 'primary',
  weight,
  center = false,
  ...props
}) => {
  const { theme } = useModernTheme();

  // 기본 텍스트 스타일 가져오기
  const baseStyle = theme.typography.textStyles[variant] || theme.typography.textStyles.body;

  // 색상 적용
  const getTextColor = (): string => {
    switch (color) {
      case 'primary':
        return theme.colors.text;
      case 'secondary':
        return theme.colors.textSecondary;
      case 'tertiary':
        return theme.colors.textTertiary;
      case 'white':
        return theme.colors.instagram.white;
      case 'black':
        return theme.colors.instagram.black;
      case 'inherit':
        return 'inherit';
      default:
        return theme.colors.text;
    }
  };

  // 폰트 가중치 적용
  const getFontWeight = (): string => {
    if (weight) {
      return theme.typography.fontWeight[weight];
    }
    return baseStyle.fontWeight || theme.typography.fontWeight.regular;
  };

  const textStyle: TextStyle = {
    ...baseStyle,
    color: getTextColor(),
    fontWeight: getFontWeight(),
    fontFamily: theme.typography.fontFamily.primary,
    textAlign: center ? 'center' : 'left',
  };

  const combinedStyle = [textStyle, style];

  return (
    <Text style={combinedStyle} {...props}>
      {children}
    </Text>
  );
};

// 특수한 텍스트 컴포넌트들
export const UsernameText: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="username" {...props} />
);

export const PostText: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="postText" {...props} />
);

export const HashtagText: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="hashtag" color="inherit" {...props} />
);

export const MentionText: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="mention" color="inherit" {...props} />
);

export const TimestampText: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="timestamp" color="inherit" {...props} />
);

export const CaptionText: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="caption" {...props} />
);

export const ButtonText: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="button" {...props} />
);

export const HeaderText: React.FC<Omit<StyledTextProps, 'variant'> & { level?: 1 | 2 | 3 | 4 }> = ({ level = 1, ...props }) => (
  <StyledText variant={`h${level}` as any} {...props} />
);