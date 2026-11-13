import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { imageService } from '../../services/imageService';
import ModernIcon from './ModernIcon';
import FastImage from 'react-native-fast-image';

interface ProfileImageProps {
  imageUrl?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
  editable?: boolean;
  style?: any;
  showBorder?: boolean;
}

// 🔥 반응형 이미지 크기 (DP 기준)
const SIZES = {
  small: 40,   // 리스트, 댓글
  medium: 60,  // 카드
  large: 80,   // 프로필 헤더
  xlarge: 120, // 프로필 상세
};

const ProfileImage: React.FC<ProfileImageProps> = ({
  imageUrl,
  size = 'medium',
  onPress,
  editable = false,
  style,
  showBorder = true,
}) => {
  const { colors, spacing } = useModernTheme();
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const imageSize = SIZES[size];

  // 이미지 URL 처리
  const processedImageUrl = imageUrl && imageUrl.trim() !== '' ? imageService.getImageUrl(imageUrl) : null;
  const shouldShowDefaultImage = !processedImageUrl || imageError;

  // 🔥 최적화: imageUrl 변경 시에만 에러 상태 초기화 (버전 업데이트 제거)
  React.useEffect(() => {
    setImageError(false);
    setIsLoading(false);
  }, [imageUrl]);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const containerStyle = [
    styles.container,
    {
      width: imageSize,
      height: imageSize,
      borderRadius: imageSize / 2,
      backgroundColor: colors.surface,
    },
    showBorder && {
      borderWidth: 2,
      borderColor: colors.primary + '20',
    },
    style,
  ];

  const imageStyle = [
    styles.image,
    {
      width: imageSize,
      height: imageSize,
      borderRadius: imageSize / 2,
    },
  ];

  const iconSize = imageSize * 0.4;

  const renderImage = () => {
    if (shouldShowDefaultImage) {
      return (
        <View style={[styles.defaultContainer, { backgroundColor: colors.surfaceVariant }]}>
          <ModernIcon 
            name="account" 
            size={iconSize} 
            color={colors.onSurfaceVariant} 
          />
        </View>
      );
    }

    // 🔥 이미지 최적화: WebP 형식 + 크기별 썸네일
    const sizeParams = {
      small: 'w=80&h=80',
      medium: 'w=120&h=120',
      large: 'w=160&h=160',
      xlarge: 'w=240&h=240',
    };

    const separator = processedImageUrl.includes('?') ? '&' : '?';
    const optimizedUrl = `${processedImageUrl}${separator}${sizeParams[size]}&format=webp&quality=85`;

    return (
      <FastImage
        key={`profile-${processedImageUrl}`}
        source={{
          uri: optimizedUrl,
          priority: size === 'large' || size === 'xlarge' ? FastImage.priority.high : FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable, // 적극적 캐싱
        }}
        style={imageStyle}
        resizeMode={FastImage.resizeMode.cover}
        onError={handleImageError}
        onLoad={handleImageLoad}
        onLoadStart={() => setIsLoading(true)}
      />
    );
  };

  const renderEditableOverlay = () => {
    if (!editable) return null;

    return (
      <View style={[styles.editOverlay, { backgroundColor: colors.primary + '90' }]}>
        <ModernIcon 
          name="camera" 
          size={iconSize * 0.5} 
          color={colors.onPrimary} 
        />
      </View>
    );
  };

  const renderLoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.loadingOverlay, { backgroundColor: colors.surface + '90' }]}>
        <ModernIcon 
          name="loading" 
          size={iconSize * 0.6} 
          color={colors.primary} 
        />
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity 
        style={containerStyle} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {renderImage()}
        {renderEditableOverlay()}
        {renderLoadingOverlay()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      {renderImage()}
      {renderLoadingOverlay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
  },
  defaultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '40%',
    height: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileImage;