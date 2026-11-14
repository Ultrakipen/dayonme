// src/screens/LoginScreen.tsx - Instagram-inspired 2026 design
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
  View,
  StatusBar,
  PixelRatio,
  Pressable
} from 'react-native';
import { TextInput, ActivityIndicator, Checkbox } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { Text, VStack, HStack } from '../components/ui';
import { kakaoNativeLogin } from '../services/api/kakaoNativeLogin';
import { naverNativeLogin } from '../services/api/naverNativeLogin';
import { showAlert } from '../contexts/AlertContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';

// 타입 정의
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordRecovery: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

// 화면 크기별 breakpoint (논리적 픽셀 기준)
const BREAKPOINTS = {
  small: 360,  // Galaxy S8, iPhone SE
  medium: 390, // iPhone 12/13/14, Galaxy S21
  large: 428   // iPhone 14 Pro Max, Galaxy S25+
} as const;

// 색상 상수
const COLORS = {
  gradient: {
    primary: ['#667eea', '#764ba2'] as const,
    primaryDark: ['#1a1a1a', '#2d2d2d', '#1a1a1a'] as const,
    primaryLight: ['#667eea', '#764ba2', '#f093fb'] as const,
  },
  error: '#FF3040',
  white: '#ffffff',
  black: '#000000',
  kakao: {
    background: '#FEE500',
    text: '#3C1E1E'
  },
  naver: {
    background: '#03C75A',
    text: '#ffffff'
  },
  placeholder: {
    light: '#999',
    dark: '#888888'
  },
  text: {
    light: '#000000',
    dark: '#ffffff',
    secondary: {
      light: '#666',
      dark: '#a8a8a8'
    }
  }
} as const;

// 개선된 이메일 검증 정규식
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// API 요청 타임아웃 (10초)
const API_TIMEOUT = 10000;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, checkAuthStatus } = useAuth();
  const { theme, isDark, toggleTheme } = useModernTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [rememberEmail, setRememberEmail] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // TextInput ref 생성
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  // 저장된 이메일 로드
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberEmail(true);
        }
      } catch (error) {
        console.error('이메일 로드 실패:', error);
      }
    };
    loadSavedEmail();
  }, []);

  // 반응형 헬퍼 함수들
  const { normalize, normalizeFontSize, spacing } = useMemo(() => {
    const getScreenType = () => {
      if (screenWidth <= BREAKPOINTS.small) return 'small';
      if (screenWidth <= BREAKPOINTS.medium) return 'medium';
      return 'large';
    };

    const normalize = (size: number, minScale: number = 0.85, maxScale: number = 1.15) => {
      const type = getScreenType();
      let scale = 1;

      if (type === 'small') {
        scale = Math.max(screenWidth / BREAKPOINTS.medium, minScale);
      } else if (type === 'large') {
        scale = Math.min(screenWidth / BREAKPOINTS.medium, maxScale);
      }

      const normalized = size * scale;
      return Math.round(PixelRatio.roundToNearestPixel(normalized));
    };

    const normalizeFontSize = (size: number) => {
      const normalized = normalize(size, 0.9, 1.1);
      return Math.max(12, Math.min(normalized, size * 1.2));
    };

    const spacing = (size: number) => normalize(size, 0.9, 1.1);

    return {
      normalize,
      normalizeFontSize,
      spacing
    };
  }, [screenWidth]);

  // API 요청 timeout wrapper
  const fetchWithTimeout = useCallback(async (url: string, options: RequestInit, timeout: number = API_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      throw error;
    }
  }, []);

  // 이메일 검증
  const validateForm = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  // 이메일 변경 핸들러 (실시간 에러 제거)
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  }, [errors.email]);

  // 비밀번호 변경 핸들러 (실시간 에러 제거)
  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  }, [errors.password]);

  // 로그인 핸들러
  const handleLogin = useCallback(async () => {
    if (isLoading) return; // 중복 클릭 방지
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 이메일 저장 처리
      if (rememberEmail) {
        await AsyncStorage.setItem('savedEmail', email);
      } else {
        await AsyncStorage.removeItem('savedEmail');
      }

      // rememberMe 옵션과 함께 로그인
      await login({ email, password, rememberMe });

      // 로그인 성공 후 Main으로 이동
      // Auth가 모달로 열리므로 부모 네비게이터를 통해 reset 해야 함
      console.log('🚀 로그인 성공 - Main으로 화면 전환 시도');
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
        console.log('✅ 부모 네비게이터로 Main 전환 완료');
      } else {
        // 부모가 없으면 현재 네비게이터 사용
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
        console.log('✅ 현재 네비게이터로 Main 전환 완료');
      }
    } catch (error: any) {
      // 보안: 서버 에러 메시지를 직접 노출하지 않고 일반화된 메시지 사용
      const status = error?.response?.status;
      let errorMessage = '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

      if (status === 401 || status === 400) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (status === 429) {
        errorMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      }

      showAlert.error('로그인 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, rememberEmail, rememberMe, isLoading, validateForm, login]);

  // 네이버 로그인 핸들러
  const handleNaverLogin = useCallback(async () => {
    if (isSocialLoading) return;
    setIsSocialLoading(true);
    try {
      await naverNativeLogin();
      await checkAuthStatus();

      // 소셜 로그인 성공 후 Main으로 이동
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }
    } catch (error: any) {
      console.error('네이버 로그인 오류:', error);
      showAlert.error('로그인 실패', '네이버 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSocialLoading(false);
    }
  }, [isSocialLoading, checkAuthStatus]);

  // 카카오 로그인 핸들러
  const handleKakaoLogin = useCallback(async () => {
    if (isSocialLoading) return;
    setIsSocialLoading(true);
    try {
      await kakaoNativeLogin();
      await checkAuthStatus();

      // 소셜 로그인 성공 후 Main으로 이동
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }
    } catch (error: any) {
      console.error('카카오 로그인 오류:', error);
      showAlert.error('로그인 실패', '카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSocialLoading(false);
    }
  }, [isSocialLoading, checkAuthStatus]);

  // 비밀번호 표시 토글
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // 이메일 기억하기 토글
  const toggleRememberEmail = useCallback(() => {
    setRememberEmail(prev => !prev);
  }, []);

  // 로그인 상태 유지 토글
  const toggleRememberMe = useCallback(() => {
    setRememberMe(prev => !prev);
  }, []);

  // 스타일 메모이제이션
  const styles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: isDark ? COLORS.black : COLORS.gradient.primary[0]
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing(20),
      paddingVertical: spacing(16),
      minHeight: screenHeight * 0.9
    },
    card: {
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.96)',
      borderRadius: spacing(20),
      padding: spacing(18),
      width: '100%' as const,
      maxWidth: Math.min(screenWidth - spacing(40), 420),
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacing(8) },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: spacing(16),
      elevation: isDark ? 12 : 18
    },
    themeToggle: {
      position: 'absolute' as const,
      top: spacing(16),
      right: spacing(16),
      zIndex: 1000,
      padding: spacing(8),
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: spacing(12)
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderRadius: spacing(12),
      fontSize: normalizeFontSize(15)
    },
    textInputContent: {
      paddingHorizontal: spacing(14),
      paddingVertical: spacing(9),
      fontSize: normalizeFontSize(15),
      color: isDark ? COLORS.text.dark : COLORS.text.light
    },
    errorText: {
      color: COLORS.error,
      fontSize: normalizeFontSize(12),
      marginTop: spacing(5),
      marginLeft: spacing(4),
      fontWeight: '600' as const
    },
    loginButton: {
      borderRadius: spacing(14),
      paddingVertical: spacing(13),
      minHeight: spacing(50),
      justifyContent: 'center' as const,
      shadowColor: COLORS.gradient.primary[0],
      shadowOffset: { width: 0, height: spacing(5) },
      shadowOpacity: 0.25,
      shadowRadius: spacing(10),
      elevation: 10
    },
    socialButton: {
      borderRadius: spacing(14),
      paddingVertical: spacing(12),
      minHeight: spacing(48),
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacing(2) },
      shadowOpacity: 0.1,
      shadowRadius: spacing(6),
      elevation: 5
    }
  }), [theme, isDark, screenWidth, screenHeight, spacing, normalizeFontSize]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* 다크모드 토글 버튼 */}
            <Pressable
              style={styles.themeToggle}
              onPress={toggleTheme}
              accessibilityRole="button"
              accessibilityLabel={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              accessibilityHint="테마를 변경합니다"
            >
              <MaterialCommunityIcons
                name={isDark ? 'weather-sunny' : 'weather-night'}
                size={normalize(24)}
                color={COLORS.white}
              />
            </Pressable>

            <LinearGradient
              colors={isDark ? COLORS.gradient.primaryDark : COLORS.gradient.primaryLight}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                <View style={styles.card}>
                  <VStack style={{ gap: spacing(16) }}>
                    {/* 헤더 섹션 */}
                    <VStack style={{ gap: spacing(8), alignItems: 'center' }}>
                      <View style={{
                        width: spacing(50),
                        height: spacing(50),
                        borderRadius: spacing(25),
                        backgroundColor: isDark ? '#2d2d2d' : COLORS.white,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: isDark ? COLORS.white : COLORS.gradient.primary[0],
                        shadowOffset: { width: 0, height: spacing(4) },
                        shadowOpacity: isDark ? 0.1 : 0.25,
                        shadowRadius: spacing(10),
                        elevation: 10
                      }}>
                        <LinearGradient
                          colors={COLORS.gradient.primary}
                          style={{
                            width: spacing(38),
                            height: spacing(38),
                            borderRadius: spacing(19),
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{
                            fontSize: normalizeFontSize(18),
                            fontWeight: '900',
                            color: COLORS.white
                          }}>
                            💙
                          </Text>
                        </LinearGradient>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{
                          fontSize: normalizeFontSize(26),
                          fontWeight: '900',
                          color: isDark ? COLORS.white : '#1a1a1a',
                          letterSpacing: -0.5,
                          marginBottom: spacing(6),
                          textShadowColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2
                        }}>
                          Day on me
                        </Text>
                        <Text style={{
                          fontSize: normalizeFontSize(13),
                          color: isDark ? COLORS.text.secondary.dark : '#555',
                          fontWeight: '600',
                          textAlign: 'center',
                          lineHeight: normalizeFontSize(19)
                        }}>
                          작은 공감들의 큰 이야기{'\n'}
          오늘도 나의 마음에 따뜻함이 켜집니다
                        </Text>
                      </View>
                    </VStack>

                    {/* 입력 필드 섹션 */}
                    <VStack style={{ gap: spacing(9) }}>
                      {/* 이메일 입력 */}
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          ref={emailRef}
                          placeholder="이메일 주소"
                          placeholderTextColor={isDark ? COLORS.placeholder.dark : COLORS.placeholder.light}
                          value={email}
                          onChangeText={handleEmailChange}
                          mode="outlined"
                          textColor={isDark ? COLORS.text.dark : COLORS.text.light}
                          style={styles.textInput}
                          contentStyle={styles.textInputContent}
                          outlineStyle={{
                            borderRadius: spacing(12),
                            borderWidth: isDark ? 0 : (errors.email ? 1.5 : email ? 1 : 0),
                            borderColor: errors.email ? COLORS.error : email ? COLORS.gradient.primary[0] : 'transparent'
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect={false}
                          textContentType="emailAddress"
                          returnKeyType="next"
                          blurOnSubmit={false}
                          editable={!isLoading}
                          selectTextOnFocus={true}
                          onSubmitEditing={() => passwordRef.current?.focus()}
                          theme={{
                            colors: {
                              primary: COLORS.gradient.primary[0],
                              onSurfaceVariant: isDark ? COLORS.placeholder.dark : '#666',
                              outline: 'transparent',
                              text: isDark ? COLORS.text.dark : COLORS.text.light,
                              placeholder: isDark ? COLORS.placeholder.dark : COLORS.placeholder.light
                            },
                          }}
                          accessibilityLabel="이메일 주소 입력"
                          accessibilityHint="로그인을 위한 이메일 주소를 입력하세요"
                        />
                        {errors.email && (
                          <Text
                            style={styles.errorText}
                            accessibilityRole="alert"
                          >
                            {errors.email}
                          </Text>
                        )}
                      </View>

                      {/* 비밀번호 입력 */}
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          ref={passwordRef}
                          placeholder="비밀번호"
                          placeholderTextColor={isDark ? COLORS.placeholder.dark : COLORS.placeholder.light}
                          value={password}
                          onChangeText={handlePasswordChange}
                          mode="outlined"
                          textColor={isDark ? COLORS.text.dark : COLORS.text.light}
                          style={styles.textInput}
                          contentStyle={styles.textInputContent}
                          outlineStyle={{
                            borderRadius: spacing(12),
                            borderWidth: isDark ? 0 : (errors.password ? 1.5 : password ? 1 : 0),
                            borderColor: errors.password ? COLORS.error : password ? COLORS.gradient.primary[0] : 'transparent'
                          }}
                          secureTextEntry={!showPassword}
                          autoComplete="password"
                          autoCorrect={false}
                          textContentType="password"
                          returnKeyType="done"
                          editable={!isLoading}
                          selectTextOnFocus={true}
                          onSubmitEditing={handleLogin}
                          right={
                            <TextInput.Icon
                              icon={showPassword ? 'eye-off' : 'eye'}
                              onPress={togglePasswordVisibility}
                              size={spacing(22)}
                              color={password ? COLORS.gradient.primary[0] : (isDark ? '#888' : COLORS.placeholder.light)}
                              disabled={isLoading}
                            />
                          }
                          theme={{
                            colors: {
                              primary: COLORS.gradient.primary[0],
                              onSurfaceVariant: isDark ? COLORS.placeholder.dark : '#666',
                              outline: 'transparent',
                              text: isDark ? COLORS.text.dark : COLORS.text.light,
                              placeholder: isDark ? COLORS.placeholder.dark : COLORS.placeholder.light
                            },
                          }}
                          accessibilityLabel="비밀번호 입력"
                          accessibilityHint="로그인을 위한 비밀번호를 입력하세요"
                        />
                        {errors.password && (
                          <Text
                            style={styles.errorText}
                            accessibilityRole="alert"
                          >
                            {errors.password}
                          </Text>
                        )}
                      </View>

                      {/* 체크박스 옵션 */}
                      <HStack style={{ justifyContent: 'space-between', marginTop: spacing(4), flexWrap: 'wrap' }}>
                        <Pressable
                          onPress={toggleRememberEmail}
                          accessibilityRole="checkbox"
                          accessibilityLabel="이메일 기억하기"
                          accessibilityState={{ checked: rememberEmail }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                        >
                          <Checkbox
                            status={rememberEmail ? 'checked' : 'unchecked'}
                            onPress={toggleRememberEmail}
                            color={COLORS.gradient.primary[0]}
                          />
                          <Text style={{
                            fontSize: normalizeFontSize(13),
                            color: isDark ? COLORS.text.secondary.dark : '#555',
                            fontWeight: '500',
                            marginLeft: spacing(2)
                          }}>
                            이메일 기억하기
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={toggleRememberMe}
                          accessibilityRole="checkbox"
                          accessibilityLabel="로그인 상태 유지"
                          accessibilityState={{ checked: rememberMe }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                        >
                          <Checkbox
                            status={rememberMe ? 'checked' : 'unchecked'}
                            onPress={toggleRememberMe}
                            color={COLORS.gradient.primary[0]}
                          />
                          <Text style={{
                            fontSize: normalizeFontSize(13),
                            color: isDark ? COLORS.text.secondary.dark : '#555',
                            fontWeight: '500',
                            marginLeft: spacing(2)
                          }}>
                            로그인 상태 유지
                          </Text>
                        </Pressable>
                      </HStack>
                    </VStack>

                    {/* 버튼 섹션 */}
                    <VStack style={{ gap: spacing(9) }}>
                      {/* 로그인 버튼 */}
                      <Pressable
                        onPress={handleLogin}
                        disabled={isLoading}
                        accessibilityRole="button"
                        accessibilityLabel="로그인"
                        accessibilityHint="이메일과 비밀번호로 로그인합니다"
                        accessibilityState={{ disabled: isLoading }}
                      >
                        <LinearGradient
                          colors={isLoading ? ['#ccc', '#999'] : COLORS.gradient.primary}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.loginButton,
                            { opacity: isLoading ? 0.7 : 1 }
                          ]}
                        >
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            {isLoading && (
                              <ActivityIndicator
                                size="small"
                                color={COLORS.white}
                                style={{ marginRight: spacing(8) }}
                              />
                            )}
                            <Text style={{
                              color: COLORS.white,
                              fontSize: normalizeFontSize(15.5),
                              fontWeight: '700',
                              textAlign: 'center',
                              letterSpacing: 0.3
                            }}>
                              {isLoading ? '로그인 중...' : '로그인'}
                            </Text>
                          </View>
                        </LinearGradient>
                      </Pressable>

                      {/* 비밀번호 찾기 */}
                      <Pressable
                        onPress={() => navigation.navigate('PasswordRecovery')}
                        accessibilityRole="button"
                        accessibilityLabel="비밀번호 찾기"
                        style={{
                          alignItems: 'center',
                          paddingVertical: spacing(4),
                          minHeight: spacing(36)
                        }}
                      >
                        <Text style={{
                          color: COLORS.gradient.primary[0],
                          fontSize: normalizeFontSize(13.5),
                          fontWeight: '600'
                        }}>
                          비밀번호를 잊으셨나요?
                        </Text>
                      </Pressable>

                      {/* 소셜 로그인 구분선 */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginVertical: spacing(6)
                      }}>
                        <View style={{
                          flex: 1,
                          height: 1,
                          backgroundColor: isDark ? '#3a3a3a' : '#e1e5e9'
                        }} />
                        <Text style={{
                          paddingHorizontal: spacing(10),
                          fontSize: normalizeFontSize(13),
                          color: isDark ? COLORS.placeholder.dark : '#8e8e93',
                          fontWeight: '600'
                        }}>
                          간편 로그인
                        </Text>
                        <View style={{
                          flex: 1,
                          height: 1,
                          backgroundColor: isDark ? '#3a3a3a' : '#e1e5e9'
                        }} />
                      </View>

                      {/* 소셜 로그인 버튼들 */}
                      <VStack style={{ gap: spacing(8) }}>
                        {/* 카카오 로그인 */}
                        <Pressable
                          onPress={handleKakaoLogin}
                          disabled={isSocialLoading}
                          accessibilityRole="button"
                          accessibilityLabel="카카오로 로그인"
                          accessibilityState={{ disabled: isSocialLoading }}
                        >
                          <View style={[
                            styles.socialButton,
                            {
                              backgroundColor: COLORS.kakao.background,
                              opacity: isSocialLoading ? 0.7 : 1
                            }
                          ]}>
                            <View style={{
                              width: spacing(20),
                              height: spacing(20),
                              backgroundColor: COLORS.kakao.text,
                              borderRadius: spacing(10),
                              marginRight: spacing(10),
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <Text style={{
                                fontSize: normalizeFontSize(12),
                                fontWeight: '900',
                                color: COLORS.kakao.background
                              }}>K</Text>
                            </View>
                            <Text style={{
                              color: COLORS.kakao.text,
                              fontSize: normalizeFontSize(14.5),
                              fontWeight: '700',
                              letterSpacing: 0.3
                            }}>
                              카카오로 계속하기
                            </Text>
                          </View>
                        </Pressable>

                        {/* 네이버 로그인 */}
                        <Pressable
                          onPress={handleNaverLogin}
                          disabled={isSocialLoading}
                          accessibilityRole="button"
                          accessibilityLabel="네이버로 로그인"
                          accessibilityState={{ disabled: isSocialLoading }}
                        >
                          <View style={[
                            styles.socialButton,
                            {
                              backgroundColor: COLORS.naver.background,
                              opacity: isSocialLoading ? 0.7 : 1
                            }
                          ]}>
                            <View style={{
                              width: spacing(20),
                              height: spacing(20),
                              backgroundColor: COLORS.white,
                              borderRadius: spacing(10),
                              marginRight: spacing(10),
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <Text style={{
                                fontSize: normalizeFontSize(12),
                                fontWeight: '900',
                                color: COLORS.naver.background
                              }}>N</Text>
                            </View>
                            <Text style={{
                              color: COLORS.naver.text,
                              fontSize: normalizeFontSize(14.5),
                              fontWeight: '700',
                              letterSpacing: 0.3
                            }}>
                              네이버로 계속하기
                            </Text>
                          </View>
                        </Pressable>

                      </VStack>

                      {/* 회원가입 링크 */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: spacing(6),
                        minHeight: spacing(36)
                      }}>
                        <Text style={{
                          color: isDark ? COLORS.text.secondary.dark : COLORS.text.secondary.light,
                          fontSize: normalizeFontSize(13.5),
                          fontWeight: '400'
                        }}>
                          계정이 없으신가요?{' '}
                        </Text>
                        <Pressable
                          onPress={() => navigation.navigate('Register')}
                          accessibilityRole="button"
                          accessibilityLabel="회원가입"
                          style={{
                            paddingVertical: spacing(6),
                            paddingHorizontal: spacing(4)
                          }}
                        >
                          <Text style={{
                            color: COLORS.gradient.primary[0],
                            fontSize: normalizeFontSize(13.5),
                            fontWeight: '700'
                          }}>
                            회원가입
                          </Text>
                        </Pressable>
                      </View>
                    </VStack>
                  </VStack>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
    </>
  );
};

export default LoginScreen;
