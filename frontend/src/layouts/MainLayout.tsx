// layouts/MainLayout.tsx
// 앱의 메인 화면을 위한 레이아웃 컴포넌트

import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import LoadingIndicator from '../components/LoadingIndicator';

interface MainLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  loading = false,
  header,
  footer,
  style,
  contentContainerStyle,
  backgroundColor,
}) => {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: backgroundColor || theme.colors.background },
        style,
      ]}
    >
      <StatusBar
        backgroundColor={backgroundColor || theme.colors.background}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      
      {/* 헤더 영역 */}
      {header && <View style={styles.headerContainer}>{header}</View>}
      
      {/* 메인 콘텐츠 */}
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {loading ? <LoadingIndicator /> : children}
      </View>
      
      {/* 푸터 영역 */}
      {footer && <View style={styles.footerContainer}>{footer}</View>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    width: '100%',
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  footerContainer: {
    width: '100%',
    zIndex: 10,
  },
});

export default MainLayout;