

// src/components/ComfortWall/LoadingIndicator.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  message?: string;
  type?: 'default' | 'dots' | 'spinner' | 'pulse';
  color?: string;
  style?: any;
  showIcon?: boolean;
  iconName?: string;
}

const ComfortWallLoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  message = '로딩 중...',
  type = 'default',
  color,
  style,
  showIcon = false,
  iconName = 'loading'
}) => {
  const theme = useTheme();
  const indicatorColor = color || theme.colors.primary;

  const renderLoadingByType = () => {
    switch (type) {
      case 'dots':
        return <DotsLoading color={indicatorColor} />;
      case 'pulse':
        return <PulseLoading color={indicatorColor} size={size} />;
      case 'spinner':
      case 'default':
      default:
        return (
          <ActivityIndicator 
            size={size} 
            color={indicatorColor}
            style={styles.indicator}
          />
        );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <MaterialCommunityIcons 
          name={iconName} 
          size={24} 
          color={indicatorColor}
          style={styles.icon}
        />
      )}
      {renderLoadingByType()}
      {message && (
        <Text style={[styles.message, { color: theme.colors.onSurface }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

// 점 애니메이션 로딩
const DotsLoading: React.FC<{ color: string }> = ({ color }) => {
  return (
    <View style={styles.dotsContainer}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
};

// 맥박 애니메이션 로딩
const PulseLoading: React.FC<{ color: string; size: 'small' | 'large' }> = ({ 
  color, 
  size 
}) => {
  const pulseSize = size === 'large' ? 40 : 24;
  
  return (
    <View style={styles.pulseContainer}>
      <View 
        style={[
          styles.pulseCircle, 
          { 
            backgroundColor: color,
            width: pulseSize,
            height: pulseSize,
            borderRadius: pulseSize / 2
          }
        ]} 
      />
    </View>
  );
};


export const PostLoadingIndicator: React.FC<{ message?: string }> = ({ 
  message = '게시물을 불러오는 중...' 
}) => (
  <ComfortWallLoadingIndicator 
    message={message}
    showIcon
    iconName="post-outline"
    type="pulse"
  />
);

export const CommentLoadingIndicator: React.FC<{ message?: string }> = ({ 
  message = '댓글을 불러오는 중...' 
}) => (
  <ComfortWallLoadingIndicator 
    message={message}
    showIcon
    iconName="comment-outline"
    type="dots"
    size="small"
  />
);

export const SearchLoadingIndicator: React.FC<{ message?: string }> = ({ 
  message = '검색 중...' 
}) => (
  <ComfortWallLoadingIndicator 
    message={message}
    showIcon
    iconName="magnify"
    type="pulse"
    size="small"
  />
);

export const UploadLoadingIndicator: React.FC<{ message?: string }> = ({ 
  message = '업로드 중...' 
}) => (
  <ComfortWallLoadingIndicator 
    message={message}
    showIcon
    iconName="cloud-upload-outline"
    type="pulse"
  />
);

// 인라인 로딩 (작은 공간용)
export const InlineLoadingIndicator: React.FC<{ size?: number }> = ({ size = 16 }) => {
  const theme = useTheme();
  return (
    <ActivityIndicator 
      size="small" 
      color={theme.colors.primary}
      style={{ width: size, height: size }}
    />
  );
};

// 무한 스크롤용 로딩
export const InfiniteScrollLoadingIndicator: React.FC = () => {
  const theme = useTheme();
  return (
    <View style={styles.infiniteScrollContainer}>
      <ActivityIndicator 
        size="small" 
        color={theme.colors.primary}
      />
      <Text style={[styles.infiniteScrollText, { color: theme.colors.onSurface }]}>
        더 많은 게시물 불러오는 중...
      </Text>
    </View>
  );
};

// 새로고침 로딩
export const RefreshLoadingIndicator: React.FC = () => {
  const theme = useTheme();
  return (
    <View style={styles.refreshContainer}>
      <MaterialCommunityIcons 
        name="refresh" 
        size={20} 
        color={theme.colors.primary}
      />
      <Text style={[styles.refreshText, { color: theme.colors.onSurface }]}>
        새로고침 중...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  indicator: {
    marginVertical: 8,
  },
  icon: {
    marginBottom: 8,
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  
  // 점 애니메이션 스타일
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    // 애니메이션은 실제 구현 시 Animated API 사용
  },
  
  // 맥박 애니메이션 스타일
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pulseCircle: {
    // 애니메이션은 실제 구현 시 Animated API 사용
  },
  
  // 무한 스크롤 로딩 스타일
  infiniteScrollContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  infiniteScrollText: {
    marginLeft: 8,
    fontSize: 12,
    opacity: 0.6,
  },
  
  // 새로고침 로딩 스타일
  refreshContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  refreshText: {
    marginLeft: 6,
    fontSize: 12,
    opacity: 0.6,
  },
});

export default ComfortWallLoadingIndicator;