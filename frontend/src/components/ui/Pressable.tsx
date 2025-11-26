// src/components/ui/Pressable.tsx
import React from 'react';
import { Pressable as RNPressable, PressableProps as RNPressableProps, ViewStyle } from 'react-native';

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

  return (
    <RNPressable style={[pressableStyle, style]} {...props}>
      {children}
    </RNPressable>
  );
};

export default Pressable;