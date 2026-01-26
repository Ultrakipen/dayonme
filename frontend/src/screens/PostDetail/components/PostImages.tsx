import React, { useState, useRef, useCallback } from 'react';
import {
  ScrollView,
  Image,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text } from '../../../components/ui';
import { useModernTheme } from '../../../contexts/ModernThemeContext';
import { normalizeImageUrl, logImageError, logImageSuccess } from '../../../utils/imageUtils';
import { normalizeSpace, normalizeIcon } from '../../../utils/responsive';

// 이미지 로딩 상태 관리를 위한 타입
interface ImageLoadState {
  [key: number]: 'loading' | 'loaded' | 'error';
}

interface PostImagesProps {
  imageUrls: string | string[];
  onDoubleTap: () => void;
  showLikeAnimation: boolean;
  likeAnimationValue: Animated.Value;
}

// 메모이제이션된 이미지 컴포넌트 - 댓글 상태 변경 시 재렌더링 방지
const PostImages = React.memo<PostImagesProps>(
  ({ imageUrls, onDoubleTap, showLikeAnimation, likeAnimationValue }) => {
    const { theme, isDark } = useModernTheme();
    const colors = {
      background: theme.bg.primary,
      cardBackground: theme.bg.card,
      text: theme.text.primary,
      textSecondary: theme.text.secondary,
      border: theme.bg.border,
      primary: isDark ? '#60a5fa' : '#3b82f6',
    };

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
    const [fullscreenIndex, setFullscreenIndex] = useState(0);
    const [imageLoadStates, setImageLoadStates] = useState<ImageLoadState>({});
    const scrollViewRef = useRef<ScrollView>(null);
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    // Lazy Loading: 현재 이미지와 전후 1개만 로드
    const shouldLoadImage = useCallback((index: number) => {
      return Math.abs(index - currentImageIndex) <= 1;
    }, [currentImageIndex]);

    // 이미지 로드 완료 핸들러
    const handleImageLoad = useCallback((index: number, url: string) => {
      setImageLoadStates(prev => ({ ...prev, [index]: 'loaded' }));
      logImageSuccess('PostDetail', url);
    }, []);

    // 이미지 로드 에러 핸들러
    const handleImageError = useCallback((index: number, url: string, error: any) => {
      setImageLoadStates(prev => ({ ...prev, [index]: 'error' }));
      logImageError('PostDetail', url, url, error?.nativeEvent?.error);
    }, []);

    // 이미지 크기 최적화 - 모바일에 적절한 크기
    // 카드 안쪽 여백 고려 (카드 margin 16 + 내부 padding 필요)
    const cardMargin = normalizeSpace(16); // 카드 좌우 마진
    const imagePadding = normalizeSpace(12); // 이미지 좌우 여백
    const totalHorizontalSpace = (cardMargin * 2) + (imagePadding * 2);
    const imageWidth = screenWidth - totalHorizontalSpace; // 섹션 너비 이내

    // 이미지 높이를 더욱 제한 (모바일 UX 최적화)
    // 1:1 정사각형 기준 하되 화면 높이의 25%를 초과하지 않음
    const squareHeight = imageWidth; // 정사각형
    const maxScreenHeight = screenHeight * 0.25; // 화면 높이의 25%만 사용
    const minImageHeight = normalizeSpace(150); // 초소형 기기용 최소 높이
    const calculatedHeight = Math.min(squareHeight * 0.65, maxScreenHeight);
    const imageHeight = Math.max(calculatedHeight, minImageHeight); // 최소 높이 보장

    const normalizedUrls = React.useMemo(() => {
      let urls: string[] = [];

      // JSON 문자열로 된 배열인 경우 파싱
      if (typeof imageUrls === 'string' && imageUrls.startsWith('[')) {
        try {
          const parsed = JSON.parse(imageUrls);
          urls = Array.isArray(parsed) ? parsed : [imageUrls];
        } catch (e) {
          if (__DEV__) {
            if (__DEV__) console.warn('이미지 URL JSON 파싱 실패:', e);
          }
          urls = [imageUrls];
        }
      } else if (Array.isArray(imageUrls)) {
        urls = imageUrls;
      } else {
        urls = [imageUrls];
      }

      return urls.map(url => normalizeImageUrl(url, undefined, true)).filter(url => url && url.trim() !== '');
    }, [imageUrls]);

    const handleScroll = (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / imageWidth);
      setCurrentImageIndex(index);
    };

    if (!normalizedUrls || normalizedUrls.length === 0) {
      if (__DEV__) {
        if (__DEV__) console.log('⏭️ PostImages 렌더링 건너뜀: 빈 URL');
      }
      return null;
    }

    if (__DEV__) {
      if (__DEV__) console.log('🖼️ PostImages 렌더링:', normalizedUrls.length, '개 이미지');
    }

    return (
      <View style={{ paddingHorizontal: imagePadding, paddingBottom: normalizeSpace(16), position: 'relative' }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ width: imageWidth }}
        >
          {normalizedUrls.map((url, index) => (
            <TouchableOpacity
              key={`image-${index}-${url.slice(-20)}`}
              activeOpacity={0.9}
              onPress={onDoubleTap}
              style={{
                position: 'relative',
                width: imageWidth,
                marginRight: index < normalizedUrls.length - 1 ? imagePadding : 0
              }}
            >
              {/* Lazy Loading: 현재 이미지와 전후 1개만 실제 로드 */}
              {shouldLoadImage(index) ? (
                <Image
                  source={{
                    uri: url,
                    cache: 'force-cache' // 캐싱 강화
                  }}
                  style={{
                    width: imageWidth,
                    height: imageHeight,
                    borderRadius: normalizeSpace(16),
                    backgroundColor: isDark ? '#27272a' : '#f3f4f6',
                  }}
                  resizeMode="cover"
                  onError={(error: any) => handleImageError(index, url, error)}
                  onLoad={() => handleImageLoad(index, url)}
                  fadeDuration={200}
                />
              ) : (
                // 플레이스홀더 - 아직 로드하지 않은 이미지
                <View
                  style={{
                    width: imageWidth,
                    height: imageHeight,
                    borderRadius: normalizeSpace(16),
                    backgroundColor: isDark ? '#27272a' : '#f3f4f6',
                  }}
                />
              )}

              {/* 로딩 인디케이터 */}
              {shouldLoadImage(index) && imageLoadStates[index] !== 'loaded' && imageLoadStates[index] !== 'error' && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: normalizeSpace(16),
                    backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}

              {/* 에러 상태 표시 */}
              {imageLoadStates[index] === 'error' && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: normalizeSpace(16),
                    backgroundColor: isDark ? '#27272a' : '#f3f4f6',
                  }}
                >
                  <MaterialCommunityIcons
                    name="image-off"
                    size={normalizeIcon(32)}
                    color={isDark ? '#71717a' : '#9ca3af'}
                  />
                </View>
              )}

              {/* 더블탭 하트 애니메이션 - 현재 보이는 이미지에만 표시 */}
              {showLikeAnimation && index === currentImageIndex && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: normalizeIcon(-25),
                    marginLeft: normalizeIcon(-25),
                    opacity: likeAnimationValue,
                    transform: [
                      {
                        scale: likeAnimationValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.8],
                        }),
                      },
                    ],
                  }}
                >
                  <MaterialCommunityIcons name="heart" size={normalizeIcon(50)} color="#FF6B6B" />
                </Animated.View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 페이지 인디케이터 - 이미지가 2개 이상일 때만 표시 */}
        {normalizedUrls.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: normalizeSpace(12),
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {normalizedUrls.map((_, index) => (
              <View
                key={index}
                style={{
                  width: currentImageIndex === index ? normalizeSpace(24) : normalizeSpace(8),
                  height: normalizeSpace(8),
                  borderRadius: normalizeSpace(4),
                  marginHorizontal: normalizeSpace(4),
                  backgroundColor: currentImageIndex === index ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              />
            ))}
          </View>
        )}

        {/* 이미지 카운터 */}
        <View style={{
          position: 'absolute',
          top: normalizeSpace(12),
          right: normalizeSpace(12),
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          paddingHorizontal: normalizeSpace(12),
          paddingVertical: normalizeSpace(6),
          borderRadius: normalizeSpace(16),
          zIndex: 10,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: normalizeSpace(12), fontFamily: 'Pretendard-SemiBold' }}>
            {currentImageIndex + 1}/{normalizedUrls.length}
          </Text>
        </View>

        {/* 풀스크린 버튼 */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: normalizeSpace(12),
            left: normalizeSpace(12),
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            width: normalizeSpace(36),
            height: normalizeSpace(36),
            borderRadius: normalizeSpace(18),
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
          onPress={() => {
            setFullscreenIndex(currentImageIndex);
            setFullscreenVisible(true);
          }}
        >
          <MaterialCommunityIcons name="arrow-expand" size={normalizeIcon(20)} color="#FFFFFF" />
        </TouchableOpacity>

        {/* react-native-image-viewing: 줌인/줌아웃 가능한 이미지 뷰어 */}
        <ImageView
          images={normalizedUrls.map(uri => ({ uri }))}
          imageIndex={fullscreenIndex}
          visible={fullscreenVisible}
          onRequestClose={() => setFullscreenVisible(false)}
          swipeToCloseEnabled={true}
          doubleTapToZoomEnabled={true}
          presentationStyle="overFullScreen"
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    // 성능 최적화: JSON.stringify 대신 효율적인 비교
    const prevUrls = Array.isArray(prevProps.imageUrls) ? prevProps.imageUrls : [prevProps.imageUrls];
    const nextUrls = Array.isArray(nextProps.imageUrls) ? nextProps.imageUrls : [nextProps.imageUrls];

    // 배열 길이가 다르면 리렌더링
    if (prevUrls.length !== nextUrls.length) return false;

    // 첫 번째와 마지막 URL만 비교 (성능 최적화)
    const urlsMatch = prevUrls.length === 0 ||
      (prevUrls[0] === nextUrls[0] && prevUrls[prevUrls.length - 1] === nextUrls[nextUrls.length - 1]);

    return urlsMatch && prevProps.showLikeAnimation === nextProps.showLikeAnimation;
  }
);

PostImages.displayName = 'PostImages';

export default PostImages;
