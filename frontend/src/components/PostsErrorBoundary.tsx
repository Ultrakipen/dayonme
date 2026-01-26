// PostsErrorBoundary.tsx - 게시물 로딩 에러 처리
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { normalize, hp, wp } from '../utils/responsive';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PostsErrorBoundary extends Component<Props, State> {
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
    console.error('PostsErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={normalize(48)}
              color="#ef4444"
            />
            <Text style={styles.errorTitle}>문제가 발생했습니다</Text>
            <Text style={styles.errorMessage}>
              게시물을 불러오는 중 오류가 발생했습니다.
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={styles.errorDetails}>
                {this.state.error.message}
              </Text>
            )}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={normalize(20)}
                color="#ffffff"
              />
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: wp(8),
    paddingVertical: hp(10),
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: normalize(16),
    padding: normalize(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: wp(90),
  },
  errorTitle: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: normalize(16),
    marginBottom: normalize(8),
  },
  errorMessage: {
    fontSize: normalize(14),
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: normalize(16),
  },
  errorDetails: {
    fontSize: normalize(12),
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: normalize(16),
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(12),
    borderRadius: normalize(8),
    gap: normalize(8),
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: normalize(14),
    fontWeight: '600',
  },
});
