// components/PostDetailErrorBoundary.tsx
// PostDetail 화면 전용 Error Boundary
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { normalize, normalizeSpace, normalizeIcon } from '../utils/responsive';
import logger from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * PostDetail 전용 Error Boundary
 * - 게시물 로딩 실패 시 대체 UI 표시
 * - 재시도 버튼 제공
 * - 에러 로깅
 */
class PostDetailErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    logger.error('❌ [PostDetailErrorBoundary] 에러 발생:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // 커스텀 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);

    // TODO: 에러 리포팅 서비스 (Sentry, Firebase Crashlytics 등)
    // reportError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });

    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={normalizeIcon(64)}
              color="#ef4444"
              style={styles.icon}
            />
            <Text style={styles.title}>게시물을 불러올 수 없습니다</Text>
            <Text style={styles.message}>
              {this.state.error?.message || '일시적인 오류가 발생했습니다'}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={normalizeIcon(20)}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              문제가 계속되면 앱을 재시작해주세요
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalizeSpace(32),
  },
  icon: {
    marginBottom: normalizeSpace(24),
  },
  title: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: normalizeSpace(12),
    textAlign: 'center',
  },
  message: {
    fontSize: normalize(14),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: normalize(20),
    marginBottom: normalizeSpace(32),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: normalizeSpace(24),
    paddingVertical: normalizeSpace(12),
    borderRadius: normalizeSpace(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: normalizeSpace(8),
  },
  retryButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#ffffff',
  },
  hint: {
    fontSize: normalize(12),
    color: '#9ca3af',
    marginTop: normalizeSpace(24),
    textAlign: 'center',
  },
});

export default PostDetailErrorBoundary;
