import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ModernContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  safeArea?: boolean;
}

const ModernContainer: React.FC<ModernContainerProps> = ({
  children,
  style,
  padding = true,
  safeArea = true
}) => {
  const containerStyle = [
    styles.container,
    padding && styles.padding,
    style
  ];

  if (safeArea) {
    return (
      <SafeAreaView style={containerStyle}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  padding: {
    padding: 16,
  },
});

export default ModernContainer;