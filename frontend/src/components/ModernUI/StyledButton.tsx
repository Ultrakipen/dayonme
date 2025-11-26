// components/ModernUI/StyledButton.tsx - 모던 스타일 버튼 컴포넌트
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ViewStyle, ActivityIndicator } from 'react-native';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { StyledText } from './StyledText';

interface StyledButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  textColor?: string;
}

export const StyledButton: React.FC<StyledButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  textColor,
  style,
  disabled,
  ...props
}) => {
  const { theme } = useModernTheme();

  // 사이즈별 스타일
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          height: 28,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.spacing.app.buttonRadius,
        };
      case 'large':
        return {
          height: 44,
          paddingHorizontal: theme.spacing['2xl'],
          borderRadius: theme.spacing.app.buttonRadius,
        };
      default: // medium
        return {
          height: theme.spacing.app.buttonHeight,
          paddingHorizontal: theme.spacing.xl,
          borderRadius: theme.spacing.app.buttonRadius,
        };
    }
  };

  // 변형별 스타일
  const getVariantStyle = (): ViewStyle => {
    const isDisabled = disabled || loading;
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDisabled 
            ? theme.colors.neutral[300]
            : theme.colors.app.blue,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: isDisabled
            ? theme.colors.neutral[100]
            : theme.colors.neutral[200],
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled
            ? theme.colors.neutral[300]
            : theme.colors.app.blue,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          paddingHorizontal: theme.spacing.sm,
        };
      default:
        return {};
    }
  };

  // 텍스트 색상
  const getTextColor = (): string => {
    const isDisabled = disabled || loading;
    
    if (isDisabled) {
      return theme.colors.neutral[500];
    }

    switch (variant) {
      case 'primary':
        return theme.colors.app.white;
      case 'secondary':
        return theme.colors.text;
      case 'outline':
        return theme.colors.app.blue;
      case 'ghost':
      case 'text':
        return theme.colors.app.blue;
      default:
        return theme.colors.text;
    }
  };

  // 텍스트 사이즈
  const getTextVariant = () => {
    switch (size) {
      case 'small':
        return 'buttonSmall';
      case 'large':
        return 'buttonLarge';
      default:
        return 'button';
    }
  };

  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...getSizeStyle(),
    ...getVariantStyle(),
    width: fullWidth ? '100%' : 'auto',
    opacity: (disabled || loading) ? 0.6 : 1,
  };

  const combinedStyle = [buttonStyle, style];
  const finalTextColor = textColor || getTextColor();

  return (
    <TouchableOpacity
      style={combinedStyle}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={finalTextColor}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <React.Fragment>
              {icon}
              <StyledText
                variant={getTextVariant() as any}
                color="inherit"
                style={{ color: finalTextColor, marginLeft: theme.spacing.sm }}
              >
                {title}
              </StyledText>
            </React.Fragment>
          )}
          {!icon && (
            <StyledText
              variant={getTextVariant() as any}
              color="inherit"
              style={{ color: finalTextColor }}
            >
              {title}
            </StyledText>
          )}
          {icon && iconPosition === 'right' && (
            <React.Fragment>
              <StyledText
                variant={getTextVariant() as any}
                color="inherit"
                style={{ color: finalTextColor, marginRight: theme.spacing.sm }}
              >
                {title}
              </StyledText>
              {icon}
            </React.Fragment>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

// 특수한 버튼 컴포넌트들
export const PrimaryButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="ghost" {...props} />
);

export const TextButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="text" {...props} />
);