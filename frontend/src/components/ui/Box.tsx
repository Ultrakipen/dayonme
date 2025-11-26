// src/components/ui/Box.tsx
import React from 'react';
import { View, ViewProps } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

const boxStyle = tva({
  base: '',
});

interface BoxProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export const Box: React.FC<BoxProps> = ({
  children,
  className,
  style,
  ...props
}) => {
  return (
    <View 
      className={boxStyle({ class: className })}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
};

export default Box;