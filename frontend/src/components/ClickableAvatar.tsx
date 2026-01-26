// src/components/ClickableAvatar.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { normalizeImageUrl } from '../utils/imageUtils';
import EmotionLoginPromptModal from './EmotionLoginPromptModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Twemoji CDN URL 생성 함수
const getTwemojiUrl = (emojiCode: string): string =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${emojiCode}.png`;

interface ClickableAvatarProps {
  userId: number;
  nickname?: string;
  isAnonymous?: boolean;
  avatarUrl?: string | null;
  avatarText?: string;
  avatarEmojiCode?: string; // Twemoji 코드 (예: '1f60a')
  avatarColor?: string;
  size?: number; // 기본 40
  containerStyle?: ViewStyle;
  onLoginRequired?: () => void; // 비로그인 시 호출될 콜백
}

/**
 * 클릭 가능한 아바타 컴포넌트
 * - 익명이 아닌 경우 클릭 시 해당 사용자의 프로필로 이동
 * - 익명이거나 본인인 경우 클릭 불가
 */
const ClickableAvatar: React.FC<ClickableAvatarProps> = ({
  userId,
  nickname = '사용자',
  isAnonymous = false,
  avatarUrl,
  avatarText = '사',
  avatarEmojiCode,
  avatarColor = '#9333ea',
  size = 40,
  containerStyle,
  onLoginRequired,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [twemojiError, setTwemojiError] = useState(false);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);

  // 마운트/언마운트 추적
  useEffect(() => {
    if (__DEV__) console.log('🎭 [ClickableAvatar] 마운트:', { userId, nickname, isAnonymous });
    return () => {
      if (__DEV__) console.log('🎭 [ClickableAvatar] 언마운트:', { userId, nickname });
    };
  }, []);

  // 본인 여부 확인
  const isOwnProfile = useMemo(() => user?.user_id === userId, [user?.user_id, userId]);

  // 클릭 가능 여부: 로그인했고, 익명이 아니고, 본인도 아닌 경우
  const isClickable = useMemo(() => {
    const clickable = isAuthenticated && !isAnonymous && !isOwnProfile;
    if (__DEV__) {
      if (__DEV__) console.log('🖼️ ClickableAvatar 렌더:', {
        userId,
        nickname,
        isClickable: clickable,
        isAuthenticated,
        isAnonymous,
        isOwnProfile,
        avatarUrl: avatarUrl ? 'exists' : 'none',
      });
    }
    return clickable;
  }, [isAuthenticated, isAnonymous, isOwnProfile, userId, nickname, avatarUrl]);

  // 이미지 URL 정규화 (메모이제이션)
  const normalizedImageUrl = useMemo(() =>
    avatarUrl ? normalizeImageUrl(avatarUrl) : null,
    [avatarUrl]
  );

  // 이미지 표시 가능 여부 (익명이 아니고, URL이 있고, 에러가 없을 때만)
  const shouldShowImage = useMemo(() =>
    !isAnonymous && normalizedImageUrl && !imageError,
    [isAnonymous, normalizedImageUrl, imageError]
  );


  const handlePress = () => {
    if (__DEV__) {
      if (__DEV__) console.log('👆 ClickableAvatar 클릭:', {
        userId,
        nickname,
        isClickable,
        isAuthenticated,
        isAnonymous,
        isOwnProfile,
      });
    }

    if (!isClickable) {
      if (__DEV__) console.log('⚠️ 클릭 불가: isClickable=false');
      return;
    }

    // 비로그인 사용자 체크
    if (!isAuthenticated || !user) {
      if (__DEV__) console.log('⚠️ 비로그인 사용자 - 로그인 안내 표시');
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        setLoginPromptVisible(true);
      }
      return;
    }

    try {
      if (__DEV__) console.log('✅ UserProfile로 이동:', { userId, nickname });
      navigation.navigate('UserProfile', {
        userId,
        nickname,
      });
    } catch (error) {
      if (__DEV__) console.error('❌ Navigation 오류:', error);
    }
  };

  // 이모지 여부 확인 (이모지는 일반적으로 2-4 바이트 유니코드 문자)
  const isEmoji = useMemo(() => {
    if (!avatarText) return false;
    // 이모지 유니코드 범위 확인
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(avatarText);
  }, [avatarText]);

  // 아바타 스타일 (메모이제이션)
  const avatarContainerStyle: ViewStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: isEmoji ? avatarColor + '40' : avatarColor + '30', // 이모지는 배경 더 진하게
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // 이미지가 borderRadius 밖으로 나가지 않도록
    // 클릭 가능한 경우 테두리와 그림자 추가
    ...(isClickable && {
      borderWidth: 2,
      borderColor: '#405DE6',
      shadowColor: '#405DE6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    }),
  }), [size, avatarColor, isClickable, isEmoji]);

  const avatarTextStyle = useMemo(() => {
    if (isEmoji) {
      // 이모지인 경우: 더 크게 표시하고 색상 제거
      return {
        fontSize: size * 0.75, // 이모지는 더 크게
        lineHeight: size * 0.75,
      };
    }
    // 일반 텍스트인 경우
    return {
      fontSize: size * 0.55,
      fontFamily: 'Pretendard-SemiBold' as const,
      color: avatarColor,
    };
  }, [size, avatarColor, isEmoji]);

  // 이미지 스타일 (메모이제이션)
  const imageStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
  }), [size]);

  // FastImage source 객체 (메모이제이션) - 깜빡임 방지
  const imageSource = useMemo(() => ({
    uri: normalizedImageUrl,
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable // 강력한 캐싱으로 깜빡임 방지
  }), [normalizedImageUrl]);

  // 이미지 로드 실패 핸들러 (메모이제이션)
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // 이미지 로드 성공 핸들러 (메모이제이션)
  const handleImageLoad = useCallback(() => {
    // 이미지 로드 성공
  }, []);

  // Twemoji 이미지 스타일 (메모이제이션) - 고해상도 지원
  const twemojiStyle = useMemo(() => ({
    width: size * 0.80,
    height: size * 0.80,
  }), [size]);

  // Twemoji FastImage source (캐싱 최적화)
  const twemojiSource = useMemo(() => avatarEmojiCode ? ({
    uri: getTwemojiUrl(avatarEmojiCode),
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable, // 강력한 캐싱으로 깜빡임 방지
  }) : null, [avatarEmojiCode]);

  // Twemoji 로드 실패 핸들러
  const handleTwemojiError = useCallback(() => {
    setTwemojiError(true);
  }, []);

  // 아바타 내용 렌더링 (이미지 또는 텍스트) - 메모이제이션
  const renderAvatarContent = useCallback(() => {
    // 1. 실명 댓글 + 프로필 이미지가 있는 경우
    if (shouldShowImage) {
      return (
        <FastImage
          key={`avatar-user-${userId}`} // userId 기반 key로 안정성 확보 (깜빡임 방지)
          source={imageSource}
          style={imageStyle}
          resizeMode={FastImage.resizeMode.cover}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      );
    }
    // 2. 익명 댓글 - avatarEmojiCode가 있으면 Twemoji 이미지 사용 (isEmoji 체크 제거)
    if (avatarEmojiCode && twemojiSource && !twemojiError) {
      return (
        <FastImage
          key={`twemoji-${avatarEmojiCode}`} // 이모지 코드 기반 key (안정적)
          source={twemojiSource}
          style={twemojiStyle}
          resizeMode={FastImage.resizeMode.contain}
          onError={handleTwemojiError}
        />
      );
    }
    // 3. 폴백: 이모지 텍스트 또는 닉네임 첫 글자
    if (isEmoji) {
      return <Text style={avatarTextStyle}>{avatarText}</Text>;
    }
    // 4. 일반 텍스트 (닉네임 첫 글자)
    return <Text style={avatarTextStyle}>{avatarText}</Text>;
  }, [userId, shouldShowImage, imageSource, imageStyle, handleImageError, handleImageLoad, avatarText, avatarTextStyle, avatarEmojiCode, isEmoji, twemojiStyle, twemojiSource, twemojiError, handleTwemojiError]);

  // 클릭 불가능한 경우 일반 View로 렌더링
  if (!isClickable) {
    return (
      <View style={[avatarContainerStyle, containerStyle]}>
        {renderAvatarContent()}
      </View>
    );
  }

  // 클릭 가능한 경우 TouchableOpacity로 렌더링
  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={containerStyle}
      >
        <View style={avatarContainerStyle}>
          {renderAvatarContent()}
        </View>
      </TouchableOpacity>

      <EmotionLoginPromptModal
        visible={loginPromptVisible}
        onClose={() => setLoginPromptVisible(false)}
        onLogin={() => {
          setLoginPromptVisible(false);
          navigation.navigate('Auth', { screen: 'Login' });
        }}
        onRegister={() => {
          setLoginPromptVisible(false);
          navigation.navigate('Auth', { screen: 'Register' });
        }}
        actionType="profile"
      />
    </>
  );
};

// React.memo로 컴포넌트 메모이제이션하여 불필요한 재렌더링 방지
export default React.memo(ClickableAvatar, (prevProps, nextProps) => {
  // 커스텀 비교 함수: 모든 props가 동일하면 재렌더링하지 않음
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.nickname === nextProps.nickname &&
    prevProps.isAnonymous === nextProps.isAnonymous &&
    prevProps.avatarUrl === nextProps.avatarUrl &&
    prevProps.avatarText === nextProps.avatarText &&
    prevProps.avatarEmojiCode === nextProps.avatarEmojiCode &&
    prevProps.avatarColor === nextProps.avatarColor &&
    prevProps.size === nextProps.size
  );
});
