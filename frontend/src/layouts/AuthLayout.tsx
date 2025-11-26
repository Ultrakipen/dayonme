// layouts/AuthLayout.tsx
import React from 'react';
import * as ReactNative from 'react-native';
// @ts-ignore
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import LoadingIndicator from '../components/LoadingIndicator';

// 타입 문제 없이 사용할 수 있는 방식으로 컴포넌트 가져오기
const { 
  View, 
  StyleSheet, 
  Platform, 
  ScrollView, 
  KeyboardAvoidingView, 
  TouchableWithoutFeedback, 
  Keyboard, 
  ImageBackground, 
  Image, 
  StatusBar 
} = ReactNative;

interface AuthLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  imageBackground?: boolean;
  logoVisible?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  loading = false,
  title,
  footer,
  imageBackground = false,
  logoVisible = true,
}) => {
  const { theme } = useTheme();
  
  // Keyboard.dismiss를 안전하게 호출
  const dismissKeyboard = () => {
    try {
      if (Keyboard && typeof Keyboard.dismiss === 'function') {
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('키보드 닫기 오류', error);
    }
  };
  
  const renderContent = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
      testID="keyboard-avoiding-view"
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard} testID="keyboard-dismiss">
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          testID="scroll-view"
        >
          {/* 로고 */}
          {logoVisible && (
            <View style={styles.logoContainer} testID="logo-container">
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
                testID="logo-image"
              />
            </View>
          )}
          
          {/* 제목 */}
          {title && <View style={styles.titleContainer} testID="title-container">{title}</View>}
          
          {/* 메인 콘텐츠 */}
          <View style={styles.contentContainer} testID="content-container">
            {loading ? <LoadingIndicator /> : children}
          </View>
          
          {/* 푸터 */}
          {footer && <View style={styles.footerContainer} testID="footer-container">{footer}</View>}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
  
  // 배경 이미지 사용 여부에 따라 다른 레이아웃 반환
  // SafeAreaView 대신 View 사용
  if (imageBackground) {
    return (
      <View style={styles.container} testID="auth-layout">
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          testID="status-bar"
        />
        <ImageBackground
          source={require('../assets/images/auth-background.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
          testID="image-background"
        >
          <View style={styles.overlay} testID="overlay">
            {renderContent()}
          </View>
        </ImageBackground>
      </View>
    );
  }
  
  // SafeAreaView 대신 View 사용
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="auth-layout"
    >
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        testID="status-bar"
      />
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  titleContainer: {
    marginBottom: 30,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  footerContainer: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
});

export default AuthLayout;