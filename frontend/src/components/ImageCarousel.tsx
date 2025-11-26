// src/components/ImageCarousel.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Text } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

const ImageCarousel: React.FC<ImageCarouselProps> = ({
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
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fullscreenScrollRef = useRef<ScrollView>(null);

  const SCREEN_WIDTH = getScreenWidth();
  const carouselWidth = width || SCREEN_WIDTH;

  // 빈 이미지 배열 처리
  if (!images || images.length === 0) {
    return null;
  }

  // 단일 이미지인 경우 간단하게 표시
  if (images.length === 1) {
    return (
      <View
        style={[styles.container, containerStyle]}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (showFullscreenButton) {
              setFullscreenIndex(0);
              setFullscreenVisible(true);
            }
          }}
        >
          <FastImage
            source={{ uri: images[0], priority: FastImage.priority.normal, cache: FastImage.cacheControl.immutable }}
            style={[styles.singleImage, { height, borderRadius }]}
            resizeMode={FastImage.resizeMode.cover}
          />
        </TouchableOpacity>

        {showFullscreenButton && (
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={() => {
              setFullscreenIndex(0);
              setFullscreenVisible(true);
            }}
          >
            <MaterialCommunityIcons name="arrow-expand" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* 풀스크린 모달 */}
        <Modal
          visible={fullscreenVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullscreenVisible(false)}
        >
          <View style={styles.fullscreenContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullscreenVisible(false)}
            >
              <MaterialCommunityIcons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            <FastImage
              source={{ uri: images[0], priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable }}
              style={styles.fullscreenImage}
              resizeMode={FastImage.resizeMode.contain}
            />
          </View>
        </Modal>
      </View>
    );
  }

  // 스크롤 이벤트 핸들러 - 정확한 인덱스 계산
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.min(
      Math.max(Math.round(contentOffsetX / carouselWidth), 0),
      images.length - 1
    );
    setCurrentIndex(index);
  };

  const handleFullscreenScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.min(
      Math.max(Math.round(contentOffsetX / SCREEN_WIDTH), 0),
      images.length - 1
    );
    setFullscreenIndex(index);
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
        {images.map((imageUri, index) => (
          <TouchableOpacity
            key={`image-${index}`}
            activeOpacity={0.9}
            onPress={() => {
              if (showFullscreenButton) {
                setFullscreenIndex(index);
                setFullscreenVisible(true);
              }
            }}
            style={{ width: carouselWidth }}
          >
            <FastImage
              source={{ uri: imageUri, priority: FastImage.priority.normal, cache: FastImage.cacheControl.immutable }}
              style={[styles.carouselImage, { width: carouselWidth, height, borderRadius }]}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => {
                console.warn('이미지 로드 실패:', imageUri);
              }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 페이지 인디케이터 */}
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
          onPress={() => {
            setFullscreenIndex(currentIndex);
            setFullscreenVisible(true);
          }}
        >
          <MaterialCommunityIcons name="arrow-expand" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* 풀스크린 모달 */}
      <Modal
        visible={fullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullscreenVisible(false)}
          >
            <MaterialCommunityIcons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 풀스크린 이미지 카운터 */}
          <View style={styles.fullscreenCounterContainer}>
            <Text style={styles.fullscreenCounterText}>
              {fullscreenIndex + 1}/{images.length}
            </Text>
          </View>

          {/* 풀스크린 슬라이더 */}
          <ScrollView
            ref={fullscreenScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleFullscreenScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="center"
            contentOffset={{ x: fullscreenIndex * SCREEN_WIDTH, y: 0 }}
          >
            {images.map((imageUri, index) => (
              <View key={`fullscreen-${index}`} style={styles.fullscreenImageContainer}>
                <FastImage
                  source={{ uri: imageUri, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable }}
                  style={styles.fullscreenImage}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>
            ))}
          </ScrollView>

          {/* 풀스크린 인디케이터 */}
          <View style={styles.fullscreenIndicatorContainer}>
            {images.map((_, index) => (
              <View
                key={`fs-indicator-${index}`}
                style={[
                  styles.fullscreenIndicator,
                  index === fullscreenIndex
                    ? styles.fullscreenIndicatorActive
                    : styles.fullscreenIndicatorInactive,
                ]}
              />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  singleImage: {
    width: '100%',
  },
  carouselImage: {
    // Width is set dynamically via inline style
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
    fontWeight: '600',
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
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCounterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullscreenCounterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  fullscreenImageContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenIndicatorContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  fullscreenIndicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 30,
  },
  fullscreenIndicatorInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default ImageCarousel;
