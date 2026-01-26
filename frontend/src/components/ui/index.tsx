// src/components/ui/index.tsx
import React from 'react';
import { View, Text as RNText, Pressable as RNPressable, ViewStyle, TextStyle } from 'react-native';

// Type definitions
interface BoxProps {
  children?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  [key: string]: any;
}

interface TextProps {
  children?: React.ReactNode;
  className?: string;
  style?: TextStyle;
  [key: string]: any;
}

interface PressableProps {
  children?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  onPress?: (event?: any) => void;
  [key: string]: any;
}

// Utility function to convert common Tailwind classes to React Native styles
const convertClassToStyle = (className: string = ''): ViewStyle => {
  if (!className) return {};
  const classes = className.split(' ');
  const style: ViewStyle = {};

  classes.forEach(cls => {
    // Layout
    if (cls === 'flex-1') style.flex = 1;
    if (cls === 'flex-row') style.flexDirection = 'row';
    if (cls === 'flex-col') style.flexDirection = 'column';
    if (cls === 'justify-center') style.justifyContent = 'center';
    if (cls === 'justify-between') style.justifyContent = 'space-between';
    if (cls === 'justify-around') style.justifyContent = 'space-around';
    if (cls === 'justify-evenly') style.justifyContent = 'space-evenly';
    if (cls === 'justify-start') style.justifyContent = 'flex-start';
    if (cls === 'justify-end') style.justifyContent = 'flex-end';
    if (cls === 'items-center') style.alignItems = 'center';
    if (cls === 'items-start') style.alignItems = 'flex-start';
    if (cls === 'items-end') style.alignItems = 'flex-end';
    if (cls === 'items-stretch') style.alignItems = 'stretch';
    
    // Flex wrap
    if (cls === 'flex-wrap') style.flexWrap = 'wrap';
    if (cls === 'flex-nowrap') style.flexWrap = 'nowrap';
    
    // Gap (approximate with margin)
    if (cls.startsWith('gap-')) {
      const value = parseInt(cls.replace('gap-', '')) * 4;
      // Note: React Native doesn't have gap, this is handled per component
    }
    
    // Space between (handled in parent components)
    if (cls.startsWith('space-x-') || cls.startsWith('space-y-')) {
      // This is handled by parent components, not individual elements
    }
    
    // Backgrounds
    if (cls === 'bg-white') style.backgroundColor = '#ffffff';
    if (cls === 'bg-gray-50') style.backgroundColor = '#f9fafb';
    if (cls === 'bg-gray-100') style.backgroundColor = '#f3f4f6';
    if (cls === 'bg-gray-200') style.backgroundColor = '#e5e7eb';
    if (cls === 'bg-purple-50') style.backgroundColor = '#faf5ff';
    if (cls === 'bg-purple-100') style.backgroundColor = '#f3e8ff';
    if (cls === 'bg-blue-500') style.backgroundColor = '#3b82f6';
    if (cls === 'bg-red-500') style.backgroundColor = '#ef4444';
    if (cls === 'bg-green-500') style.backgroundColor = '#10b981';
    
    // Padding
    if (cls.startsWith('p-')) {
      const value = parseInt(cls.replace('p-', '')) * 4;
      style.padding = value;
    }
    if (cls.startsWith('px-')) {
      const value = parseInt(cls.replace('px-', '')) * 4;
      style.paddingHorizontal = value;
    }
    if (cls.startsWith('py-')) {
      const value = parseFloat(cls.replace('py-', ''));
      if (value === 0.5) style.paddingVertical = 2;
      else style.paddingVertical = value * 4;
    }
    
    // Margin
    if (cls.startsWith('m-')) {
      const value = parseInt(cls.replace('m-', '')) * 4;
      style.margin = value;
    }
    if (cls.startsWith('mx-')) {
      const value = parseInt(cls.replace('mx-', '')) * 4;
      style.marginHorizontal = value;
    }
    if (cls.startsWith('my-')) {
      const value = parseInt(cls.replace('my-', '')) * 4;
      style.marginVertical = value;
    }
    if (cls.startsWith('mb-')) {
      const value = parseInt(cls.replace('mb-', '')) * 4;
      style.marginBottom = value;
    }
    if (cls.startsWith('mt-')) {
      const value = parseInt(cls.replace('mt-', '')) * 4;
      style.marginTop = value;
    }
    if (cls.startsWith('mr-')) {
      const value = parseInt(cls.replace('mr-', '')) * 4;
      style.marginRight = value;
    }
    if (cls.startsWith('ml-')) {
      const value = parseInt(cls.replace('ml-', '')) * 4;
      style.marginLeft = value;
    }
    
    // Border radius
    if (cls === 'rounded') style.borderRadius = 4;
    if (cls === 'rounded-lg') style.borderRadius = 8;
    if (cls === 'rounded-xl') style.borderRadius = 12;
    if (cls === 'rounded-2xl') style.borderRadius = 16;
    if (cls === 'rounded-full') style.borderRadius = 9999;
    
    // Border
    if (cls === 'border') style.borderWidth = 1;
    if (cls === 'border-gray-200') { style.borderWidth = 1; style.borderColor = '#e5e7eb'; }
    if (cls === 'border-gray-300') { style.borderWidth = 1; style.borderColor = '#d1d5db'; }
    
    // Shadow
    if (cls === 'shadow-sm') {
      style.shadowColor = '#000';
      style.shadowOffset = { width: 0, height: 1 };
      style.shadowOpacity = 0.05;
      style.shadowRadius = 2;
      style.elevation = 1;
    }
    if (cls === 'shadow-md') {
      style.shadowColor = '#000';
      style.shadowOffset = { width: 0, height: 4 };
      style.shadowOpacity = 0.1;
      style.shadowRadius = 6;
      style.elevation = 3;
    }
    
    // Width/Height
    if (cls.startsWith('w-')) {
      const value = cls.replace('w-', '');
      if (value === 'full') style.width = '100%';
      else if (value.includes('/')) {
        const [num, den] = value.split('/');
        style.width = `${(parseInt(num) / parseInt(den)) * 100}%`;
      }
      else style.width = parseInt(value) * 4;
    }
    if (cls.startsWith('h-')) {
      const value = cls.replace('h-', '');
      if (value === 'full') style.height = '100%';
      else style.height = parseInt(value) * 4;
    }
    if (cls.startsWith('min-h-')) {
      const value = cls.replace('min-h-', '');
      if (value === 'full') style.minHeight = '100%';
      else style.minHeight = parseInt(value) * 4;
    }
    
    // Position
    if (cls === 'absolute') style.position = 'absolute';
    if (cls === 'relative') style.position = 'relative';
    if (cls.startsWith('top-')) style.top = parseInt(cls.replace('top-', '')) * 4;
    if (cls.startsWith('bottom-')) style.bottom = parseInt(cls.replace('bottom-', '')) * 4;
    if (cls.startsWith('left-')) style.left = parseInt(cls.replace('left-', '')) * 4;
    if (cls.startsWith('right-')) style.right = parseInt(cls.replace('right-', '')) * 4;
    
    // Z-index
    if (cls.startsWith('z-')) style.zIndex = parseInt(cls.replace('z-', ''));
    
    // Overflow
    if (cls === 'overflow-hidden') style.overflow = 'hidden';
  });

  return style;
};

// Convert text-specific classes
const convertTextClassToStyle = (className: string = ''): TextStyle => {
  if (!className) return {};
  const classes = className.split(' ');
  const style: TextStyle = {};

  classes.forEach(cls => {
    // Text size
    if (cls === 'text-xs') style.fontSize = 12;
    if (cls === 'text-sm') style.fontSize = 14;
    if (cls === 'text-base') style.fontSize = 16;
    if (cls === 'text-lg') style.fontSize = 18;
    if (cls === 'text-xl') style.fontSize = 20;
    if (cls === 'text-2xl') style.fontSize = 24;
    if (cls === 'text-3xl') style.fontSize = 30;
    
    // Font family (Pretendard)
    if (cls === 'font-normal') style.fontFamily = 'Pretendard-Regular';
    if (cls === 'font-medium') style.fontFamily = 'Pretendard-Medium';
    if (cls === 'font-semibold') style.fontFamily = 'Pretendard-SemiBold';
    if (cls === 'font-bold') style.fontFamily = 'Pretendard-Bold';
    
    // Text color
    if (cls === 'text-white') style.color = '#ffffff';
    if (cls === 'text-black') style.color = '#000000';
    if (cls === 'text-gray-500') style.color = '#6b7280';
    if (cls === 'text-gray-600') style.color = '#4b5563';
    if (cls === 'text-gray-700') style.color = '#374151';
    if (cls === 'text-gray-800') style.color = '#1f2937';
    if (cls === 'text-gray-900') style.color = '#111827';
    if (cls === 'text-blue-500') style.color = '#3b82f6';
    if (cls === 'text-red-500') style.color = '#ef4444';
    if (cls === 'text-green-500') style.color = '#10b981';
    if (cls === 'text-green-600') style.color = '#059669';
    if (cls === 'text-purple-800') style.color = '#5b21b6';
    
    // Text align
    if (cls === 'text-left') style.textAlign = 'left';
    if (cls === 'text-center') style.textAlign = 'center';
    if (cls === 'text-right') style.textAlign = 'right';
    
    // Line height
    if (cls.startsWith('leading-')) {
      const value = parseInt(cls.replace('leading-', ''));
      style.lineHeight = value;
    }
  });

  return style;
};

// Box component (React Native 0.80 호환: 안전한 children 렌더링)
export const Box: React.FC<BoxProps> = ({ children, className, style, ...props }) => {
  const computedStyle = { ...convertClassToStyle(className), ...style };

  // React Native 0.80 호환성: children을 안전하게 필터링
  const safeChildren = React.useMemo(() => {
    if (children === null || children === undefined) {
      return null;
    }

    // 원시 타입 값들을 Text로 자동 감싸기 (문자열, 숫자, boolean)
    if (typeof children === 'string') {
      // 빈 문자열이나 공백만 있는 경우 null 반환
      return children.trim() === '' ? null : <RNText>{children}</RNText>;
    }

    if (typeof children === 'number') {
      return <RNText>{children}</RNText>;
    }

    if (typeof children === 'boolean') {
      return null; // boolean은 렌더링하지 않음
    }

    // 배열인 경우 각 요소를 필터링하고 변환
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (child === null || child === undefined) return null;
        if (typeof child === 'boolean') return null;
        if (typeof child === 'string') {
          return child.trim() === '' ? null : <RNText key={index}>{child}</RNText>;
        }
        if (typeof child === 'number') {
          return <RNText key={index}>{child}</RNText>;
        }
        return child;
      }).filter(child => child !== null);
    }

    return children;
  }, [children]);

  return (
    <View style={computedStyle} {...props}>
      {safeChildren}
    </View>
  );
};

// Text component
export const Text: React.FC<TextProps> = ({ children, className, style, ...props }) => {
  const computedStyle = { ...convertTextClassToStyle(className), ...style };
  
  // 안전한 children 처리 (쉼표 제거)
  const safeChildren = React.useMemo(() => {
    if (children === null || children === undefined) {
      return '';
    }
    if (typeof children === 'string') {
      return children;
    }
    if (typeof children === 'number') {
      // 숫자를 문자열로 변환할 때 쉼표 제거
      return String(children).replace(/,/g, '');
    }
    if (React.isValidElement(children)) {
      return children;
    }
    // Array인 경우 그대로 반환
    if (Array.isArray(children)) {
      return children;
    }
    // 기타 원시 타입만 문자열로 변환
    if (typeof children === 'boolean' || typeof children === 'symbol') {
      return '';
    }
    // object나 복합 타입은 그대로 반환 (React가 처리하도록)
    return children;
  }, [children]);
  
  return (
    <RNText style={computedStyle} {...props}>
      {safeChildren}
    </RNText>
  );
};

// Pressable component (React Native 0.80 호환: 안전한 children 렌더링)
export const Pressable: React.FC<PressableProps> = ({ children, className, style, onPress, ...props }) => {
  const computedStyle = { ...convertClassToStyle(className), ...style };

  // React Native 0.80 호환성: children을 안전하게 필터링
  const safeChildren = React.useMemo(() => {
    if (children === null || children === undefined) {
      return null;
    }

    // 원시 타입 값들을 Text로 자동 감싸기 (문자열, 숫자, boolean)
    if (typeof children === 'string') {
      return children.trim() === '' ? null : <RNText>{children}</RNText>;
    }

    if (typeof children === 'number') {
      return <RNText>{children}</RNText>;
    }

    if (typeof children === 'boolean') {
      return null;
    }

    // 배열인 경우 각 요소를 필터링하고 변환
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (child === null || child === undefined) return null;
        if (typeof child === 'boolean') return null;
        if (typeof child === 'string') {
          return child.trim() === '' ? null : <RNText key={index}>{child}</RNText>;
        }
        if (typeof child === 'number') {
          return <RNText key={index}>{child}</RNText>;
        }
        return child;
      }).filter(child => child !== null);
    }

    return children;
  }, [children]);

  return (
    <RNPressable style={computedStyle} onPress={onPress} {...props}>
      {safeChildren}
    </RNPressable>
  );
};

// Layout helpers
export const HStack: React.FC<BoxProps> = ({ children, className, ...props }) => (
  <Box className={`flex-row ${className || ''}`} {...props}>
    {children}
  </Box>
);

export const VStack: React.FC<BoxProps> = ({ children, className, ...props }) => (
  <Box className={`flex-col ${className || ''}`} {...props}>
    {children}
  </Box>
);

export const Center: React.FC<BoxProps> = ({ children, className, ...props }) => (
  <Box className={`justify-center items-center ${className || ''}`} {...props}>
    {children}
  </Box>
);

export const Spacer: React.FC<BoxProps> = ({ className, ...props }) => (
  <Box className={`flex-1 ${className || ''}`} {...props} />
);