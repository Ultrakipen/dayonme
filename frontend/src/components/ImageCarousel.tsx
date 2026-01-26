// src/components/ImageCarousel.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import ImageView from 'react-native-image-viewing';
import { Text } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getImageProps } from '../utils/imageOptimization';

// React Native 0.80 호환성: lazy 초기화
const getScreenWidth = () => {
  try {
    const w = Dimensions.get('window').width;
    if (w > 0) return w;
  } catch (e) {}
  return 360;
};

interface ImageCarouselProps {
  images: string[];
  height?: number;
  borderRadius?: number;
  showFullscreenButton?: boolean;
  containerStyle?: any;
  width?: number;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const ImageCarousel = React.memo<ImageCarouselProps>(({
  images,
  height = 280,
  borderRadius = 16,
  showFullscreenButton = true,
  containerStyle,
  width,
  accessible,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const SCREEN_WIDTH = getScreenWidth();
  const carouselWidth = width || SCREEN_WIDTH;

  // 빈 이미지 배열 처리
  if (!images || images.length === 0) {
    return null;
  }

  // 이미지 프리로드 (첫 번째 이미지만 - Lazy Loading 최적화)
  useEffect(() => {
    if (images && images.length > 0) {
      const firstImage = {
        uri: getImageProps(images[0], 'detail', 0).uri,
        priority: FastImage.priority.high,
      };
      FastImage.preload([firstImage]);
    }
  }, [images]);

  // 이미지 뷰어 포맷 변환 (최적화된 URL 사용)
  const imageViewerData = images.map(uri => ({ uri: getImageProps(uri, 'full').uri }));

  // 스크롤 이벤트 핸들러
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.min(
      Math.max(Math.round(contentOffsetX / carouselWidth), 0),
      images.length - 1
    );
    setCurrentIndex(index);
  };

  // 이미지 뷰어 열기
  const openImageViewer = (index: number) => {
    if (showFullscreenButton) {
      setViewerIndex(index);
      setViewerVisible(true);
    }
  };

  return (
    <View
      style={[styles.container, containerStyle]}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {/* 이미지 슬라이더 */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={carouselWidth}
        snapToAlignment="center"
        style={{ borderRadius }}
      >
        {images.map((imageUri, index) => {
          const imageProps = getImageProps(imageUri, 'detail', index);
          return (
            <TouchableOpacity
              key={`image-${index}-${imageUri}`}
              activeOpacity={0.9}
              onPress={() => openImageViewer(index)}
              style={{ width: carouselWidth }}
            >
              <FastImage
                source={{
                  uri: imageProps.uri,
                  priority: FastImage.priority.high, // 고정 우선순위 (깜빡임 방지)
                  cache: FastImage.cacheControl.immutable, // 캐싱 강화
                }}
                style={[styles.carouselImage, { width: carouselWidth, height, borderRadius }]}
                resizeMode={FastImage.resizeMode.cover}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 페이지 인디케이터 - 다중 이미지일 때만 */}
      {images.length > 1 && (
        <View style={styles.indicatorContainer}>
          {images.map((_, index) => (
            <View
              key={`indicator-${index}`}
              style={[
                styles.indicator,
                index === currentIndex ? styles.indicatorActive : styles.indicatorInactive,
              ]}
            />
          ))}
        </View>
      )}

      {/* 이미지 카운터 */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex + 1}/{images.length}
        </Text>
      </View>

      {/* 풀스크린 버튼 */}
      {showFullscreenButton && (
        <TouchableOpacity
          style={styles.fullscreenButton}
          onPress={() => openImageViewer(currentIndex)}
        >
          <MaterialCommunityIcons name="arrow-expand" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* react-native-image-viewing: 줌인/줌아웃 가능한 이미지 뷰어 */}
      <ImageView
        images={imageViewerData}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        presentationStyle="overFullScreen"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  carouselImage: {
    // Width/height set dynamically
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  indicatorInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  counterContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImageCarousel;
