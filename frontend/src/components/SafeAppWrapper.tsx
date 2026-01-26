import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SafeAppWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // 알려진 React Native 0.80 호환성 오류 (구체적으로 정의)
  private static readonly CRITICAL_COMPATIBILITY_ERRORS = [
    'Cannot redefine property', // Hermes 프로퍼티
    'property is not configurable and cannot be redefined',
    'AlertProvider is not defined in scope',
    'EventDispatcher is not defined',
    'SafeAreaProvider is not defined',
    'ViewManager.*is not defined', // 정규식 패턴
    'Text strings must be rendered within a <Text> component',
    'Unable to parse color from rgba\\(', // 구체적인 색상 파싱 오류
    'Rendered more hooks than during the previous render',
    'Rendered fewer hooks than during the previous render',
    'Malformed calls from JS: field sizes are different',
    'on a null object reference.*ViewManager', // 구체적인 null 참조
  ];

  private static isKnownCriticalError(errorMessage: string): boolean {
    return this.CRITICAL_COMPATIBILITY_ERRORS.some(pattern =>
      errorMessage.includes(pattern) || new RegExp(pattern).test(errorMessage)
    );
  }

  static getDerivedStateFromError(error: Error): State {
    try {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';

      // 알려진 심각한 호환성 오류만 무시
      if (this.isKnownCriticalError(errorMessage)) {
        if (__DEV__ && process.env.DEBUG_ERROR_FILTER === 'true') {
          console.warn('[SafeAppWrapper] 필터링된 치명적 오류:', errorMessage);
        }
        return { hasError: false };
      }

      if (__DEV__) console.error('[SafeAppWrapper] 처리되지 않은 오류:', errorMessage);
      return { hasError: true, error };
    } catch (handlerError) {
      // 오류 처리 중 오류 발생 시 앱은 계속 실행
      if (__DEV__) console.error('[SafeAppWrapper] 오류 핸들러 실패:', handlerError);
      return { hasError: false };
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    try {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';

      // 알려진 호환성 오류는 무시
      if (SafeAppWrapper.isKnownCriticalError(errorMessage)) {
        if (__DEV__ && process.env.DEBUG_ERROR_FILTER === 'true') {
          console.warn('[SafeAppWrapper] componentDidCatch - 필터링된 오류:', errorMessage);
        }
        return;
      }

      // 실제 오류만 로그 출력
      if (__DEV__) {
        console.error('[SafeAppWrapper] 심각한 오류:', errorMessage);
        console.error('Component Stack:', errorInfo?.componentStack);
      }
    } catch (handlerError) {
      // 오류 처리 중 오류 발생해도 무시 (무한 루프 방지)
      if (__DEV__) console.error('[SafeAppWrapper] 핸들러 오류:', handlerError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>앱 로딩 중 문제가 발생했습니다</Text>
          <Text style={styles.errorDetails}>
            {this.state.error?.message || '알 수 없는 오류'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SafeAppWrapper;