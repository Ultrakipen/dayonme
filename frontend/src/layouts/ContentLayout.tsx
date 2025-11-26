// layouts/ContentLayout.tsx
// 컨텐츠 표시를 위한 레이아웃 컴포넌트

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import LoadingIndicator from '../components/LoadingIndicator';

interface ContentLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const ContentLayout: React.FC<ContentLayoutProps> = ({
  children,
  loading = false,
  refreshing = false,
  onRefresh,
  padded = true,
  style,
  contentContainerStyle,
  scrollEnabled = true,
  header,
  footer,
}) => {
  const { theme } = useTheme();
  
  // 로딩 중일 때는 로딩 인디케이터만 표시
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <LoadingIndicator />
      </View>
    );
  }
  
  const renderContent = () => (
    <>
      {/* 헤더 영역 */}
      {header && <View style={styles.headerContainer}>{header}</View>}
      
      {/* 메인 콘텐츠 */}
      <View style={[
        styles.contentInner,
        padded && styles.paddedContent,
        contentContainerStyle,
      ]}>
        {children}
      </View>
      
      {/* 푸터 영역 */}
      {footer && <View style={styles.footerContainer}>{footer}</View>}
    </>
  );
  
  // 스크롤 가능 여부에 따라 다른 컴포넌트 반환
  if (scrollEnabled) {
    return (
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
          style,
        ]}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
      >
        {renderContent()}
      </ScrollView>
    );
  }
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    width: '100%',
  },
  contentInner: {
    flex: 1,
  },
  paddedContent: {
    padding: 16,
  },
  footerContainer: {
    width: '100%',
  },
});

export default ContentLayout;