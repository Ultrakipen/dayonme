import React, { Component, ErrorInfo, ComponentType } from 'react';
import { Text as RNText, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../components/ui';

interface WithErrorHandlingState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 컴포넌트에 오류 처리 기능을 추가하는 HOC
 * @param WrappedComponent 래핑할 컴포넌트
 * @returns 오류 처리 로직이 추가된 새 컴포넌트
 */
export const withErrorHandling = <P extends object>(
  WrappedComponent: ComponentType<P>
): ComponentType<P> => {
  // 클래스 정의 확장
  class WithErrorHandling extends Component<P, WithErrorHandlingState> {
    // 정적 속성 타입 선언
    static displayName: string;

    constructor(props: P) {
      super(props);
      this.state = {
        hasError: false,
        error: null,
        errorInfo: null,
      };
    }

    static getDerivedStateFromError(error: Error): Partial<WithErrorHandlingState> {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
      this.setState({ errorInfo });
      console.error('컴포넌트 오류:', error, errorInfo);
    }

    resetError = (): void => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    };

    render() {
      if (this.state.hasError) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>문제가 발생했습니다</Text>
            <Text style={styles.errorDescription}>
              컴포넌트 렌더링 중 오류가 발생했습니다. 다시 시도해 주세요.
            </Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.toString()}
            </Text>
            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  }

  const styles = StyleSheet.create({
    errorContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: 'red',
    },
    errorDescription: {
      fontSize: 14,
      marginBottom: 15,
      textAlign: 'center',
    },
    errorMessage: {
      fontSize: 12,
      marginBottom: 20,
      color: '#666',
      padding: 10,
      backgroundColor: '#f8f8f8',
      width: '100%',
    },
    button: {
      backgroundColor: '#2196F3',
      padding: 10,
      borderRadius: 5,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
    },
  });

  // 컴포넌트 이름 설정
  const wrappedComponentName = 
    WrappedComponent.displayName || 
    WrappedComponent.name || 
    'Component';
  
  // 정적 속성 설정
  WithErrorHandling.displayName = `withErrorHandling(${wrappedComponentName})`;

  return WithErrorHandling;
};