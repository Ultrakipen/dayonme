// src/components/ProfileAvatar.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Text } from './ui';
import { useModernTheme } from '../contexts/ModernThemeContext';

interface ProfileAvatarProps {
  imageUrl?: string;
  size?: number;
  name?: string;
  showName?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  isAnonymous?: boolean;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  imageUrl,
  size = 48,
  name,
  showName = false,
  onPress,
  style,
  isAnonymous = false,
}) => {
  const { theme, isDark } = useModernTheme();

  const renderInitial = () => {
    if (isAnonymous) return '익';
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    return '?';
  };

  const AvatarContainer = onPress ? TouchableOpacity : View;

  const dynamicStyles = {
    avatar: {
      backgroundColor: isDark ? theme.bg.secondary : '#E1EFF9',
    },
    anonymousAvatar: {
      backgroundColor: isDark ? theme.bg.tertiary : '#F0F0F0',
    },
    initial: {
      color: isDark ? theme.colors.primary : '#4A90E2',
    },
    name: {
      color: isDark ? theme.colors.text.primary : '#333333',
    },
  };

  return (
    <AvatarContainer
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View
        style={[
          styles.avatar,
          dynamicStyles.avatar,
          isAnonymous && dynamicStyles.anonymousAvatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        {imageUrl ? (
          <FastImage
            source={{
              uri: imageUrl,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable
            }}
            style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <Text style={[styles.initial, dynamicStyles.initial, { fontSize: size / 2.5 }]}>
            {renderInitial()}
          </Text>
        )}
      </View>

      {showName && name && (
        <Text style={[styles.name, dynamicStyles.name]}>
          {isAnonymous ? '익명' : name}
        </Text>
      )}
    </AvatarContainer>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  avatar: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  image: { resizeMode: 'cover' },
  initial: { fontWeight: 'bold' },
  name: { marginTop: 4, fontSize: 12 },
});

export default ProfileAvatar;