// src/components/ui/Pressable.tsx
import React from 'react';
import { Pressable as RNPressable, PressableProps as RNPressableProps, ViewStyle, Text as RNText } from 'react-native';

interface PressableProps extends RNPressableProps {
  children?: React.ReactNode;
  bg?: string;
  p?: number;
  px?: number;
  py?: number;
  m?: number;
  mx?: number;
  my?: number;
  mt?: number;
  mb?: number;
  ml?: number;
  mr?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  flex?: number;
  width?: string | number;
  height?: string | number;
  justifyContent?: ViewStyle['justifyContent'];
  alignItems?: ViewStyle['alignItems'];
  flexDirection?: ViewStyle['flexDirection'];
}

export const Pressable: React.FC<PressableProps> = ({
  children,
  bg,
  p,
  px,
  py,
  m,
  mx,
  my,
  mt,
  mb,
  ml,
  mr,
  borderRadius,
  borderWidth,
  borderColor,
  flex,
  width,
  height,
  justifyContent,
  alignItems,
  flexDirection,
  style,
  ...props
}) => {
  const pressableStyle: ViewStyle = {
    backgroundColor: bg,
    padding: p,
    paddingHorizontal: px,
    paddingVertical: py,
    margin: m,
    marginHorizontal: mx,
    marginVertical: my,
    marginTop: mt,
    marginBottom: mb,
    marginLeft: ml,
    marginRight: mr,
    borderRadius,
    borderWidth,
    borderColor,
    flex,
    width,
    height,
    justifyContent,
    alignItems,
    flexDirection,
  };

  // Remove undefined values
  Object.keys(pressableStyle).forEach(key => {
    if (pressableStyle[key as keyof ViewStyle] === undefined) {
      delete pressableStyle[key as keyof ViewStyle];
    }
  });

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
    <RNPressable style={[pressableStyle, style]} {...props}>
      {safeChildren}
    </RNPressable>
  );
};

export default Pressable;