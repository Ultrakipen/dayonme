import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { normalize, normalizeSpace, normalizeIcon, normalizeTouchable } from '../utils/responsive';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  const { theme, isDark, toggleTheme } = useModernTheme();
  const { isAuthenticated, isLoading } = useAuth();

  const colors = useMemo(() => ({
    background: theme.colors.background,
    cardBackground: theme.colors.surface,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    border: theme.colors.border,
    primary: isDark ? '#A78BFA' : '#667eea',
  }), [theme, isDark]);

  // 로그인된 사용자는 Main으로 자동 리다이렉트
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigation.replace('Main');
    }
  }, [isLoading, isAuthenticated, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* 다크모드 토글 버튼 (우측 상단) */}
      <TouchableOpacity
        style={[styles.themeToggle, {
          top: normalizeSpace(40),
          right: normalizeSpace(20),
          minHeight: normalizeTouchable(44),
          minWidth: normalizeTouchable(44),
        }]}
        onPress={toggleTheme}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        accessibilityHint="테마를 변경합니다"
      >
        <MaterialCommunityIcons
          name={isDark ? 'weather-sunny' : 'weather-night'}
          size={normalizeIcon(28)}
          color={isDark ? '#A78BFA' : '#667eea'}
        />
      </TouchableOpacity>

      <View style={[styles.content, {
        paddingHorizontal: normalizeSpace(32),
        paddingTop: normalizeSpace(100),
      }]}>
        <Text
          style={[styles.logo, {
            color: colors.primary,
            fontSize: normalize(42),
            marginBottom: normalizeSpace(18),
          }]}
          accessible={true}
          accessibilityRole="header"
        >
          Day on me
        </Text>
        <Text
          style={[styles.subtitle, {
            color: colors.textSecondary,
            fontSize: normalize(14),
            lineHeight: normalize(22),
            marginBottom: normalizeSpace(120),
          }]}
          accessible={true}
        >
          작은 공감들의 큰 이야기{'\n'}
          오늘도 나의 마음에{'\n'}따뜻함이 켜집니다
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, {
            backgroundColor: colors.primary,
            paddingVertical: normalizeSpace(16),
            borderRadius: normalize(14),
            marginBottom: normalizeSpace(12),
            minHeight: normalizeTouchable(50),
          }]}
          onPress={() => navigation.navigate('Auth')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="시작하기"
          accessibilityHint="로그인 또는 회원가입 화면으로 이동합니다"
        >
          <Text style={[styles.primaryButtonText, { fontSize: normalize(16) }]}>시작하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, {
            paddingVertical: normalizeSpace(12),
            minHeight: normalizeTouchable(44),
          }]}
          onPress={() => navigation.navigate('Main')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="둘러보기 먼저"
          accessibilityHint="로그인 없이 앱을 둘러봅니다"
        >
          <Text style={[styles.secondaryButtonText, {
            color: colors.primary,
            fontSize: normalize(15),
          }]}>
            둘러보기 먼저
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
    position: 'absolute',
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Bold',
  },
  secondaryButton: {
    // paddingVertical는 인라인으로 처리
  },
  secondaryButtonText: {
    fontFamily: 'Pretendard-SemiBold',
  },
});

export default WelcomeScreen;
