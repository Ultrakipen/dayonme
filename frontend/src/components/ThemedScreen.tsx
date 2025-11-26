// components/ThemedScreen.tsx - 다크모드 지원 스크린 래퍼
import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useModernTheme } from '../contexts/ModernThemeContext';

interface ThemedScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  style?: ViewStyle;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  useBackground?: boolean;
}

export const ThemedScreen: React.FC<ThemedScreenProps> = ({
  children,
  scroll = false,
  scrollProps,
  style,
  edges = ['top', 'bottom'],
  useBackground = true,
}) => {
  const { theme, isDark } = useModernTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: useBackground ? theme.bg.primary : 'transparent',
    ...style,
  };

  if (scroll) {
    return (
      <SafeAreaView style={containerStyle} edges={edges}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle} edges={edges}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </SafeAreaView>
  );
};

export default ThemedScreen;
