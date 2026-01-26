/**
 * 최적화된 이미지 컴포넌트
 * - 블러 플레이스홀더
 * - 프로그레시브 로딩
 * - 네트워크 기반 품질 조정
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';
import { getImageProps } from '../../utils/imageOptimization';
import { IMAGE_SIZES } from '../../utils/imageOptimization';

interface OptimizedImageProps {
  uri: string;
  size?: keyof typeof IMAGE_SIZES;
  index?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  onLoad?: () => void;
  onError?: () => void;
  showLoader?: boolean;
  loaderColor?: string;
  blurRadius?: number;
  fallbackColor?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  size = 'card',
  index = 0,
  style,
  containerStyle,
  resizeMode = 'cover',
  onLoad,
  onError,
  showLoader = true,
  loaderColor = '#6366f1',
  blurRadius = 10,
  fallbackColor = 'rgba(0, 0, 0, 0.05)',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setThumbnailLoaded(false);
  }, [uri]);

  const imageProps = getImageProps(uri, size, index);

  // 썸네일 이미지 (블러 효과용)
  const thumbnailProps = size !== 'thumbnail' ? getImageProps(uri, 'thumbnail', index) : null;

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true);
  };

  if (error) {
    return (
      <View style={[styles.container, containerStyle, { backgroundColor: fallbackColor }]}>
        <View style={styles.errorContainer}>
          {/* 에러 아이콘 대신 단순 배경색만 표시 */}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {/* 썸네일 (블러 플레이스홀더) */}
      {thumbnailProps && !thumbnailLoaded && (
        <FastImage
          source={thumbnailProps as Source}
          style={[StyleSheet.absoluteFill, style]}
          resizeMode={FastImage.resizeMode[resizeMode]}
          blurRadius={blurRadius}
          onLoad={handleThumbnailLoad}
        />
      )}

      {/* 실제 이미지 */}
      <FastImage
        source={imageProps as Source}
        style={[style, loading && { opacity: 0 }]}
        resizeMode={FastImage.resizeMode[resizeMode]}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* 로딩 인디케이터 */}
      {loading && showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={loaderColor} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
