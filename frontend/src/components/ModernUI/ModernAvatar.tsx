// components/InstagramThemed/InstagramAvatar.tsx - 인스타그램 스타일 아바타 컴포넌트
import React from 'react';
import { View, TouchableOpacity, ViewStyle, ImageStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { StyledText } from './StyledText';

interface InstagramAvatarProps {
  source?: { uri: string } | number;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showStory?: boolean;
  hasUnseenStory?: boolean;
  username?: string;
  showUsername?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const InstagramAvatar: React.FC<InstagramAvatarProps> = ({
  source,
  size = 'medium',
  showStory = false,
  hasUnseenStory = false,
  username,
  showUsername = false,
  onPress,
  style,
}) => {
  const { theme } = useModernTheme();

  // 사이즈별 크기 설정
  const getAvatarSize = (): number => {
    switch (size) {
      case 'small':
        return 32;
      case 'large':
        return 64;
      case 'xlarge':
        return 90;
      default: // medium
        return 48;
    }
  };

  // 텍스트 크기 설정
  const getTextVariant = () => {
    switch (size) {
      case 'small':
        return 'captionSmall';
      case 'large':
      case 'xlarge':
        return 'label';
      default:
        return 'caption';
    }
  };

  const avatarSize = getAvatarSize();
  const borderRadius = avatarSize / 2;

  // 스토리 테두리 스타일
  const getStoryBorderStyle = (): ViewStyle => {
    if (!showStory) return {};
    
    const borderWidth = size === 'small' ? 1.5 : size === 'large' || size === 'xlarge' ? 3 : 2;
    const padding = borderWidth + 2;
    
    return {
      padding,
      borderRadius: (avatarSize + padding * 2) / 2,
      background: hasUnseenStory 
        ? `linear-gradient(45deg, ${theme.colors.gradient.primary.join(', ')})` 
        : theme.colors.neutral[300],
      borderWidth,
      borderColor: hasUnseenStory 
        ? 'transparent'
        : theme.colors.neutral[300],
    };
  };

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    ...style,
  };

  const avatarStyle: ImageStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius,
    backgroundColor: theme.colors.neutral[200],
  };

  const storyBorderStyle = getStoryBorderStyle();

  const AvatarContent = () => (
    <View style={storyBorderStyle}>
      {source ? (
        <FastImage
          source={typeof source === 'number' ? source : {
            uri: source.uri,
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable
          }}
          style={avatarStyle}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[avatarStyle, { backgroundColor: theme.colors.neutral[300], justifyContent: 'center', alignItems: 'center' }]}>
          <StyledText variant="body" color="secondary">
            {username ? username.charAt(0).toUpperCase() : '?'}
          </StyledText>
        </View>
      )}
    </View>
  );

  return (
    <View style={containerStyle}>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <AvatarContent />
        </TouchableOpacity>
      ) : (
        <AvatarContent />
      )}
      
      {showUsername && username && (
        <StyledText 
          variant={getTextVariant() as any} 
          color="primary" 
          numberOfLines={1}
          style={{ 
            marginTop: theme.spacing.xs,
            maxWidth: avatarSize + 20,
            textAlign: 'center'
          }}
        >
          {username}
        </StyledText>
      )}
    </View>
  );
};

// 특수한 아바타 컴포넌트들
export const StoryAvatar: React.FC<Omit<InstagramAvatarProps, 'showStory'>> = (props) => (
  <InstagramAvatar showStory={true} {...props} />
);

export const ProfileAvatar: React.FC<Omit<InstagramAvatarProps, 'size' | 'showUsername'>> = (props) => (
  <InstagramAvatar size="large" showUsername={true} {...props} />
);