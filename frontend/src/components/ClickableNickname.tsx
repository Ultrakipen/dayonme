// src/components/ClickableNickname.tsx
import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, TextStyle, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import EmotionLoginPromptModal from './EmotionLoginPromptModal';
import { useModernTheme } from '../contexts/ModernThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ClickableNicknameProps {
  userId: number;
  nickname?: string;
  isAnonymous?: boolean;
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
  onLoginRequired?: () => void; // 비로그인 시 호출될 콜백
}

/**
 * 클릭 가능한 닉네임 컴포넌트
 * - 익명이 아닌 경우 클릭 시 해당 사용자의 프로필로 이동
 * - 익명이거나 본인인 경우 클릭 불가
 */
const ClickableNickname: React.FC<ClickableNicknameProps> = ({
  userId,
  nickname = '사용자',
  isAnonymous = false,
  style,
  children,
  onLoginRequired,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useModernTheme();
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);

  // 본인 여부 확인
  const isOwnProfile = user?.user_id === userId;

  // 클릭 가능 여부: 로그인했고, 익명이 아니고, 본인도 아닌 경우
  const isClickable = isAuthenticated && !isAnonymous && !isOwnProfile;

  // 디버깅 로그
  console.log('👤 ClickableNickname:', {
    userId,
    nickname,
    isAnonymous,
    currentUserId: user?.user_id,
    isOwnProfile,
    isClickable,
  });

  const handlePress = () => {
    console.log('🖱️ 닉네임 클릭됨:', { userId, nickname, isClickable });

    if (!isClickable) {
      console.log('❌ 클릭 불가능 (익명 또는 본인)');
      return;
    }

    // 비로그인 사용자 체크
    if (!isAuthenticated || !user) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        setLoginPromptVisible(true);
      }
      return;
    }

    try {
      console.log('✅ UserProfile로 이동 시도:', { userId, nickname });

      navigation.navigate('UserProfile', {
        userId,
        nickname,
      });

      console.log('✅ Navigation.navigate 호출 완료');
    } catch (error) {
      console.error('❌ Navigation 오류:', error);
      Alert.alert('오류', '프로필 화면으로 이동할 수 없습니다.');
    }
  };

  // 스타일 병합 (배열과 객체 모두 처리)
  const mergedStyle = StyleSheet.flatten(style);

  // 클릭 불가능한 경우 일반 Text로 렌더링
  if (!isClickable) {
    return <Text style={mergedStyle}>{children || nickname}</Text>;
  }

  // 클릭 가능한 경우 TouchableOpacity로 렌더링
  // 클릭 가능한 스타일을 명시적으로 적용
  const clickableTextStyle: TextStyle = {
    ...mergedStyle,
    color: theme.colors.accentText,
    textDecorationLine: 'underline',
    textDecorationColor: theme.colors.accentText,
    fontWeight: '700',
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        style={{
          // 터치 영역을 명확하게
          paddingVertical: 2,
          paddingHorizontal: 2,
        }}
      >
        <Text style={clickableTextStyle}>
          {children || nickname}
        </Text>
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

const styles = StyleSheet.create({
  clickable: {
    // 클릭 가능함을 시각적으로 표시
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: '#405DE6',
    color: '#405DE6',
  },
  pressed: {
    opacity: 0.6,
  },
});

export default ClickableNickname;
