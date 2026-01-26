// 최적화된 이미지 컴포넌트 (2026 모바일 트렌드 + Lazy Loading)
import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, findNodeHandle } from 'react-native';
import FastImage, { FastImageProps, Priority, ResizeMode } from 'react-native-fast-image';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalize } from '../utils/responsive';

// 이미지 크기 사전 정의 (트래픽 최적화)
export const IMAGE_SIZES = {
  thumbnail: 150,
  small: 300,
  card: 400,
  medium: 600,
  detail: 800,
  full: 1200,
} as const;

// 이미지 품질 사전 정의
export const IMAGE_QUALITY = {
  low: 60,
  medium: 75,
  high: 85,
  max: 95,
} as const;

interface OptimizedImageProps extends Omit<FastImageProps, 'source'> {
  uri: string;
  width?: number | string;
  height?: number | string;
  size?: keyof typeof IMAGE_SIZES;
  quality?: keyof typeof IMAGE_QUALITY;
  priority?: 'low' | 'normal' | 'high';
  showLoader?: boolean;
  fallbackText?: string;
  accessibilityLabel?: string;
}

/**
 * 최적화된 이미지 컴포넌트
 * - FastImage 기반 (네이티브 캐싱)
 * - 자동 리사이징 및 품질 조정
 * - 로딩 상태 표시
 * - 에러 처리
 * - React.memo로 재렌더링 방지
 */
export const OptimizedImage = React.memo<OptimizedImageProps>(({
  uri,
  width = '100%',
  height = 200,
  size = 'card',
  quality = 'high',
  priority = 'normal',
  showLoader = true,
  fallbackText = '이미지',
  style,
  accessibilityLabel,
  ...props
}) => {
  const { theme, isDark } = useModernTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority === 'high'); // Lazy loading

  const viewRef = useRef<View>(null);

  // Lazy Loading: 화면에 보일 때만 로드
  useEffect(() => {
    if (priority === 'high' || shouldLoad) return;

    // 간단한 타이머로 Lazy Loading 구현 (React Native에서 IntersectionObserver 대안)
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 100); // 100ms 후 로드

    return () => clearTimeout(timer);
  }, [priority, shouldLoad]);

  const priorityMap = {
    low: FastImage.priority.low,
    normal: FastImage.priority.normal,
    high: FastImage.priority.high,
  };

  // 이미지 URL 최적화 (메모이제이션으로 재생성 방지 - 깜빡임 방지)
  const optimizedUri = React.useMemo(() => {
    if (!uri) return '';
    if (uri.includes('?w=') || uri.includes('&w=')) return uri;

    const targetSize = IMAGE_SIZES[size];
    const targetQuality = IMAGE_QUALITY[quality];
    const separator = uri.includes('?') ? '&' : '?';

    return `${uri}${separator}w=${targetSize}&q=${targetQuality}`;
  }, [uri, size, quality]);

  // FastImage source 객체 메모이제이션 (재생성 방지 - 깜빡임 방지)
  const imageSource = React.useMemo(() => ({
    uri: shouldLoad ? optimizedUri : '', // Lazy loading: shouldLoad일 때만 URI 설정
    priority: priorityMap[priority],
    cache: FastImage.cacheControl.immutable,
  }), [optimizedUri, priority, shouldLoad]);

  if (!uri || error) {
    return (
      <View style={[
        styles.container,
        styles.fallbackContainer,
        { width, height, backgroundColor: isDark ? '#374151' : '#f3f4f6' }
      ]}>
        <Text style={[styles.fallbackText, { color: theme.text.tertiary }]}>
          {fallbackText}
        </Text>
      </View>
    );
  }

  return (
    <View ref={viewRef} style={[styles.container, { width, height }]}>
      {shouldLoad ? (
        <>
          <FastImage
            {...props}
            source={imageSource}
            style={[styles.image, style]}
            resizeMode={FastImage.resizeMode.cover}
            onLoadStart={() => {
              if (showLoader) {
                setLoading(true);
                setError(false);
              }
            }}
            onLoadEnd={() => showLoader && setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            accessibilityLabel={accessibilityLabel || fallbackText}
            accessible={true}
          />
          {loading && !error && showLoader && (
            <View style={[
              styles.loading,
              { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)' }
            ]}>
              <ActivityIndicator
                size="small"
                color={isDark ? '#a78bfa' : '#667eea'}
              />
            </View>
          )}
        </>
      ) : (
        <View style={[
          styles.loading,
          { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
        ]}>
          <ActivityIndicator
            size="small"
            color={isDark ? '#a78bfa' : '#667eea'}
          />
        </View>
      )}
    </View>
  );
});

// 프로필 이미지 전용 컴포넌트
interface ProfileImageProps extends Omit<OptimizedImageProps, 'size' | 'width' | 'height'> {
  size?: number;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  size = 40,
  style,
  ...props
}) => {
  const containerSize = normalize(size);

  return (
    <OptimizedImage
      {...props}
      size="thumbnail"
      quality="medium"
      width={containerSize}
      height={containerSize}
      style={[{ borderRadius: containerSize / 2 }, style]}
      fallbackText="👤"
    />
  );
};

// 포스트 이미지 전용 컴포넌트
interface PostImageProps extends Omit<OptimizedImageProps, 'size'> {
  isDetail?: boolean;
}

export const PostImage: React.FC<PostImageProps> = ({
  isDetail = false,
  ...props
}) => {
  return (
    <OptimizedImage
      {...props}
      size={isDetail ? 'detail' : 'card'}
      quality="high"
      priority={isDetail ? 'high' : 'normal'}
    />
  );
};

// 썸네일 이미지 전용 컴포넌트
export const ThumbnailImage: React.FC<OptimizedImageProps> = (props) => {
  return (
    <OptimizedImage
      {...props}
      size="thumbnail"
      quality="medium"
      priority="low"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: normalize(14),
  },
});
