import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { reportError, trackUserAction } from '../services/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorMessage = error?.message || '';

    // React Native 0.80 + Hermes 호환성 오류는 무시
    if (errorMessage.includes('property is not configurable') ||
        errorMessage.includes('AlertProvider') ||
        errorMessage.includes('undefined') ||
        errorMessage.includes('Text strings must be rendered') ||
        errorMessage.includes('Malformed calls from JS') ||
        errorMessage.includes('field sizes are different') ||
        errorMessage.includes('HostFunction')) {
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorMessage = error?.message || '';

    // React Native 0.80 + Hermes 호환성 오류는 무시
    if (errorMessage.includes('property is not configurable') ||
        errorMessage.includes('AlertProvider') ||
        errorMessage.includes('undefined') ||
        errorMessage.includes('Text strings must be rendered') ||
        errorMessage.includes('Malformed calls from JS') ||
        errorMessage.includes('field sizes are different') ||
        errorMessage.includes('HostFunction')) {
      return;
    }

    this.setState({ errorInfo });

    // 에러 로깅 또는 다른 처리
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 프로덕션 에러 리포팅 서비스로 전송
    reportError(error, errorInfo, {
      boundary: 'ErrorBoundary',
      timestamp: new Date().toISOString(),
    });

    // 개발 환경에서만 콘솔 출력
    if (__DEV__) {
      console.error('ErrorBoundary 오류:', error, errorInfo);
    }
  }

  resetError = (): void => {
    // 사용자 복구 시도 추적
    trackUserAction('error_recovery_attempt', 'error', {
      errorMessage: this.state.error?.message,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={80}
            color="#EF4444"
          />
          <Text style={styles.title}>앗, 문제가 발생했어요</Text>
          <Text style={styles.description}>
            일시적인 오류가 발생했습니다.{'\n'}
            다시 시도해주세요.
          </Text>

          {/* 프로덕션: 에러 ID 표시 (지원팀 문의용) */}
          {!__DEV__ && (
            <Text style={styles.errorId}>
              오류 ID: {Date.now().toString(36).toUpperCase()}
            </Text>
          )}

          {/* 개발 환경: 상세 에러 정보 */}
          {__DEV__ && this.state.error && (
            <ScrollView style={styles.errorContainer}>
              <Text style={styles.errorMessage}>
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo?.componentStack && (
                <Text style={styles.stackTrace}>
                  {this.state.errorInfo.componentStack.slice(0, 500)}
                </Text>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={this.resetError}
            accessible={true}
            accessibilityLabel="다시 시도"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    padding: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  errorId: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  errorContainer: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 24,
  },
  errorMessage: {
    fontSize: 13,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  stackTrace: {
    fontSize: 11,
    color: '#94A3B8',
    backgroundColor: '#F8FAFC',
    padding: 8,
    marginTop: 8,
    borderRadius: 6,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 150,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;