import React from 'react';
import { Pressable, Text } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

const buttonStyle = tva({
  base: 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  variants: {
    variant: {
      default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90',
      destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/90',
      outline: 'border border-slate-200 bg-transparent hover:bg-slate-100',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
      ghost: 'hover:bg-slate-100 hover:text-slate-900',
      link: 'text-slate-900 underline-offset-4 hover:underline',
    },
    size: {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  onPress,
  disabled,
  className,
  ...props
}) => {
  return (
    <Pressable
      className={buttonStyle({ variant, size, class: className })}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Text className="text-center font-medium">
        {children}
      </Text>
    </Pressable>
  );
};

export default Button;