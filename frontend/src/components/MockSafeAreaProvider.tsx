import React from 'react';
import {View, ViewStyle} from 'react-native';

interface SafeAreaProviderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SafeAreaProvider: React.FC<SafeAreaProviderProps> = ({
  children,
  style,
}) => {
  return <View style={[{flex: 1}, style]}>{children}</View>;
};

export const SafeAreaView: React.FC<SafeAreaProviderProps> = ({
  children,
  style,
}) => {
  return <View style={[{flex: 1}, style]}>{children}</View>;
};

export const useSafeAreaInsets = () => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export const EdgeInsets = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};