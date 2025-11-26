// layouts/FormLayout.tsx
// 폼을 위한 레이아웃 컴포넌트

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import LoadingIndicator from '../components/LoadingIndicator';

interface FormLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onSubmit?: () => void;
  avoidKeyboard?: boolean;
}

const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  loading = false,
  style,
  contentContainerStyle,
  header,
  footer,
  onSubmit,
  avoidKeyboard = true,
}) => {
  const { theme } = useTheme();
  
  const content = (
    <>
      {/* 헤더 영역 */}
      {header && <View style={styles.headerContainer}>{header}</View>}
      
      {/* 폼 콘텐츠 */}
      <View style={[styles.formContainer, contentContainerStyle]}>
        {loading ? <LoadingIndicator /> : children}
      </View>
      
      {/* 푸터 영역 (주로 제출 버튼) */}
      {footer && (
        <View style={styles.footerContainer}>
          {footer}
        </View>
      )}
    </>
  );
  
  // 키보드 회피 활성화 여부에 따라 다른 컴포넌트 반환
  if (avoidKeyboard) {
    return (
      <KeyboardAvoidingView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
          style,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  footerContainer: {
    width: '100%',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
});

export default FormLayout;