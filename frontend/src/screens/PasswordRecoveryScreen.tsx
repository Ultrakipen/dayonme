// src/screens/PasswordRecoveryScreen.tsx - 비밀번호 찾기 화면
import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
  View,
  StatusBar,
  Modal,
  PixelRatio,
  Pressable
} from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { Text, VStack } from '../components/ui';
import { API_CONFIG } from '../config/api';
import { showModernToast } from '../components/ModernToast';
import { useModernTheme } from '../contexts/ModernThemeContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 타입 정의
type RootStackParamList = {
  PasswordRecovery: undefined;
  Login: undefined;
};

type PasswordRecoveryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PasswordRecovery'
>;

interface PasswordRecoveryScreenProps {
  navigation: PasswordRecoveryScreenNavigationProp;
}

// 상수 정의
const BREAKPOINTS = {
  small: 360,
  medium: 390,
  large: 428
} as const;

const COLORS = {
  gradient: {
    primary: ['#667eea', '#764ba2'] as const,
    primaryDark: ['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)', 'rgba(240, 147, 251, 0.2)'] as const,
    primaryLight: ['#667eea', '#764ba2', '#f093fb'] as const,
  },
  error: '#FF3040',
  white: '#ffffff',
  black: '#000000',
  placeholder: {
    light: '#999',
    dark: '#888888'
  },
  text: {
    light: '#000000',
    dark: '#ffffff'
  }
} as const;

// 개선된 이메일 검증 정규식
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// API 요청 타임아웃 (10초)
const API_TIMEOUT = 10000;

const PasswordRecoveryScreen: React.FC<PasswordRecoveryScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useModernTheme();
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number>(0);

  const emailRef = useRef<any>(null);
  const RESEND_COOLDOWN = 60000; // 1분

  // 반응형 계산을 useMemo로 한 번만 수행
  const responsiveValues = useMemo(() => {
    const getScreenType = () => {
      if (width <= BREAKPOINTS.small) return 'small';
      if (width <= BREAKPOINTS.medium) return 'medium';
      return 'large';
    };

    const normalize = (size: number, minScale = 0.85, maxScale = 1.15) => {
      const type = getScreenType();
      let scale = 1;
      if (type === 'small') scale = Math.max(width / BREAKPOINTS.medium, minScale);
      else if (type === 'large') scale = Math.min(width / BREAKPOINTS.medium, maxScale);
      return Math.round(PixelRatio.roundToNearestPixel(size * scale));
    };

    const normalizeFontSize = (size: number) => {
      const normalized = normalize(size, 0.9, 1.1);
      return Math.max(12, Math.min(normalized, size * 1.2));
    };

    const spacing = (size: number) => normalize(size, 0.9, 1.1);

    return { normalize, normalizeFontSize, spacing };
  }, [width]);

  const { normalize, normalizeFontSize, spacing } = responsiveValues;

  // 이메일 검증
  const validateForm = useCallback(() => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  // 이메일 변경 핸들러 (실시간 에러 제거)
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors({});
    }
  }, [errors.email]);

  // API 요청 timeout wrapper
  const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = API_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      throw error;
    }
  };

  // 비밀번호 재설정 요청
  const handlePasswordRecovery = useCallback(async () => {
    if (isLoading) return; // 중복 클릭 방지
    if (!validateForm()) return;

    // 스팸 방지: 재전송 대기 시간 체크
    const now = Date.now();
    if (now - lastSentTime < RESEND_COOLDOWN) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN - (now - lastSentTime)) / 1000);
      showModernToast('info', `${remainingSeconds}초 후 다시 시도해주세요.`);
      return;
    }


    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
        setEmail(''); // 성공 후 입력 필드 초기화
        setLastSentTime(Date.now()); // 마지막 전송 시간 업데이트
      } else {
        showModernToast('error', data.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.');
      }
    } catch (error: unknown) {
      showModernToast('error', error.message || '서버와의 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [email, isLoading, validateForm, lastSentTime]);

  // 모달 닫기
  const handleModalClose = useCallback(() => {
    setShowSuccessModal(false);
    navigation.goBack();
  }, [navigation]);

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 미리 계산된 spacing 값들
  const spacingValues = useMemo(() => ({
    s2: spacing(2),
    s6: spacing(6),
    s8: spacing(8),
    s12: spacing(12),
    s14: spacing(14),
    s16: spacing(16),
    s18: spacing(18),
    s20: spacing(20),
    s24: spacing(24),
    s27: spacing(27),
    s28: spacing(28),
    s35: spacing(35),
    s40: spacing(40),
    s48: spacing(48),
    s50: spacing(50),
    s54: spacing(54),
    s60: spacing(60),
    s70: spacing(70)
  }), [spacing]);

  // 미리 계산된 폰트 사이즈들
  const fontSizes = useMemo(() => ({
    f14: normalizeFontSize(14),
    f15: normalizeFontSize(15),
    f16: normalizeFontSize(16),
    f18: normalizeFontSize(18),
    f22: normalizeFontSize(22),
    f26: normalizeFontSize(26)
  }), [normalizeFontSize]);

  // 동적 스타일 (errors, email 상태에 따라 변경)
  const textInputOutlineStyle = useMemo(() => ({
    borderRadius: spacingValues.s14,
    borderWidth: 2,
    borderColor: errors.email ? COLORS.error : email ? COLORS.gradient.primary[0] : 'transparent'
  }), [errors.email, email, spacingValues.s14]);

  // 스타일 메모이제이션
  const styles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacingValues.s24,
      paddingVertical: spacingValues.s60,
      minHeight: height
    },
    backButton: {
      position: 'absolute' as const,
      top: spacingValues.s50,
      left: spacingValues.s20,
      zIndex: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.25)',
      borderRadius: spacingValues.s16,
      width: spacingValues.s48,
      height: spacingValues.s48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacingValues.s2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: spacingValues.s6,
      elevation: 4
    },
    backButtonText: {
      fontSize: fontSizes.f22,
      fontFamily: 'Pretendard-SemiBold',
      color: isDark ? theme.colors.text.primary : COLORS.white
    },
    card: {
      backgroundColor: isDark ? theme.colors.card : 'rgba(255, 255, 255, 0.95)',
      borderRadius: spacingValues.s28,
      padding: spacingValues.s28,
      width: '100%' as const,
      maxWidth: Math.min(width - spacingValues.s40, 400),
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacingValues.s16 },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: spacingValues.s24,
      elevation: 18
    },
    headerContainer: {
      gap: spacingValues.s24
    },
    headerContent: {
      alignItems: 'center' as const,
      gap: spacingValues.s16
    },
    iconContainer: {
      width: spacingValues.s70,
      height: spacingValues.s70,
      borderRadius: spacingValues.s35,
      backgroundColor: isDark ? theme.colors.background : COLORS.white,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: COLORS.gradient.primary[0],
      shadowOffset: { width: 0, height: spacingValues.s6 },
      shadowOpacity: isDark ? 0.4 : 0.25,
      shadowRadius: spacingValues.s12,
      elevation: 10
    },
    iconGradient: {
      width: spacingValues.s54,
      height: spacingValues.s54,
      borderRadius: spacingValues.s27,
      justifyContent: 'center' as const,
      alignItems: 'center' as const
    },
    iconText: {
      fontSize: fontSizes.f26,
      fontFamily: 'Pretendard-Black',
      color: COLORS.white
    },
    titleContainer: {
      alignItems: 'center' as const
    },
    title: {
      fontSize: fontSizes.f26,
      fontFamily: 'Pretendard-ExtraBold',
      color: theme.colors.text.primary,
      letterSpacing: -0.5,
      marginBottom: spacingValues.s12,
      textShadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2
    },
    subtitle: {
      fontSize: fontSizes.f15,
      color: theme.colors.text.secondary,
      fontFamily: 'Pretendard-SemiBold',
      textAlign: 'center' as const,
      lineHeight: fontSizes.f22,
      paddingHorizontal: spacingValues.s8
    },
    inputContainer: {
      gap: spacingValues.s20
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderRadius: spacingValues.s14,
      fontSize: fontSizes.f16
    },
    textInputContent: {
      paddingHorizontal: spacingValues.s18,
      paddingVertical: spacingValues.s14,
      fontSize: fontSizes.f16,
      color: isDark ? COLORS.text.dark : COLORS.text.light
    },
    errorText: {
      color: COLORS.error,
      fontSize: fontSizes.f14,
      marginTop: spacingValues.s8,
      marginLeft: spacingValues.s6,
      fontFamily: 'Pretendard-Bold' as const
    },
    buttonContainer: {
      gap: spacingValues.s16,
      marginTop: spacingValues.s8
    },
    submitButton: {
      borderRadius: spacingValues.s16,
      paddingVertical: spacingValues.s16,
      minHeight: spacingValues.s54,
      justifyContent: 'center' as const,
      shadowColor: COLORS.gradient.primary[0],
      shadowOffset: { width: 0, height: spacingValues.s6 },
      shadowOpacity: 0.25,
      shadowRadius: spacingValues.s12,
      elevation: 10
    },
    submitButtonContent: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const
    },
    submitButtonLoader: {
      marginRight: spacingValues.s8
    },
    submitButtonText: {
      color: COLORS.white,
      fontSize: fontSizes.f16,
      fontFamily: 'Pretendard-Bold',
      textAlign: 'center' as const,
      letterSpacing: 0.3
    },
    loginLinkContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginTop: spacingValues.s8
    },
    loginLinkText: {
      color: theme.colors.text.secondary,
      fontSize: fontSizes.f14,
      fontFamily: 'Pretendard-Medium'
    },
    loginLinkButton: {
      color: COLORS.gradient.primary[0],
      fontSize: fontSizes.f14,
      fontFamily: 'Pretendard-Bold'
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacingValues.s28
    },
    modalCard: {
      backgroundColor: isDark ? theme.colors.card : COLORS.white,
      borderRadius: spacingValues.s24,
      padding: spacingValues.s28,
      width: '100%' as const,
      maxWidth: Math.min(width - spacingValues.s48, 340),
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacingValues.s16 },
      shadowOpacity: isDark ? 0.6 : 0.25,
      shadowRadius: spacingValues.s24,
      elevation: 20
    },
    modalContentContainer: {
      gap: spacingValues.s20,
      alignItems: 'center' as const
    },
    modalIconContainer: {
      width: spacingValues.s70,
      height: spacingValues.s70,
      borderRadius: spacingValues.s35,
      backgroundColor: isDark ? theme.colors.background : '#f0f9ff',
      justifyContent: 'center' as const,
      alignItems: 'center' as const
    },
    modalIconGradient: {
      width: spacingValues.s54,
      height: spacingValues.s54,
      borderRadius: spacingValues.s27,
      justifyContent: 'center' as const,
      alignItems: 'center' as const
    },
    modalIconEmoji: {
      fontSize: fontSizes.f26
    },
    modalTitle: {
      fontSize: fontSizes.f22,
      fontFamily: 'Pretendard-ExtraBold',
      color: theme.colors.text.primary,
      textAlign: 'center' as const,
      letterSpacing: -0.5
    },
    modalDescription: {
      fontSize: fontSizes.f15,
      fontFamily: 'Pretendard-Medium',
      color: theme.colors.text.secondary,
      textAlign: 'center' as const,
      lineHeight: fontSizes.f22,
      paddingHorizontal: spacingValues.s8
    },
    modalButtonContainer: {
      width: '100%' as const
    },
    modalButton: {
      width: '100%' as const,
      borderRadius: spacingValues.s14,
      paddingVertical: spacingValues.s16,
      minHeight: spacingValues.s50,
      justifyContent: 'center' as const,
      shadowColor: COLORS.gradient.primary[0],
      shadowOffset: { width: 0, height: spacingValues.s6 },
      shadowOpacity: isDark ? 0.4 : 0.25,
      shadowRadius: spacingValues.s12,
      elevation: 8
    },
    modalButtonText: {
      color: COLORS.white,
      fontSize: fontSizes.f16,
      fontFamily: 'Pretendard-Bold',
      textAlign: 'center' as const,
      letterSpacing: 0.3
    }
  }), [theme, isDark, width, height, spacingValues, fontSizes]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <LinearGradient
            colors={isDark ? COLORS.gradient.primaryDark : COLORS.gradient.primaryLight}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* 뒤로가기 버튼 */}
                <Pressable
                  onPress={handleGoBack}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="뒤로가기"
                  accessibilityHint="이전 화면으로 돌아갑니다"
                >
                  <Text style={styles.backButtonText}>
                    ←
                  </Text>
                </Pressable>

                <View style={styles.card}>
                  <VStack style={styles.headerContainer}>
                    {/* 헤더 섹션 */}
                    <VStack style={styles.headerContent}>
                      <View style={styles.iconContainer}>
                        <LinearGradient
                          colors={COLORS.gradient.primary}
                          style={styles.iconGradient}
                        >
                          <Text style={styles.iconText}>
                            🔐
                          </Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.titleContainer}>
                        <Text style={styles.title}>
                          비밀번호 찾기
                        </Text>
                        <Text style={styles.subtitle}>
                          가입하신 이메일 주소를 입력하시면{'\n'}
                          비밀번호 재설정 링크를 보내드립니다
                        </Text>
                      </View>
                    </VStack>

                    {/* 이메일 입력 섹션 */}
                    <VStack style={styles.inputContainer}>
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
                          outlineStyle={textInputOutlineStyle}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect={false}
                          textContentType="emailAddress"
                          returnKeyType="done"
                          editable={!isLoading}
                          selectTextOnFocus={true}
                          onSubmitEditing={handlePasswordRecovery}
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
                          accessibilityHint="비밀번호 재설정을 위한 이메일 주소를 입력하세요"
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
                    </VStack>

                    {/* 제출 버튼 섹션 */}
                    <VStack style={styles.buttonContainer}>
                      <Pressable
                        onPress={handlePasswordRecovery}
                        disabled={isLoading}
                        accessibilityRole="button"
                        accessibilityLabel="재설정 링크 전송"
                        accessibilityHint="이메일로 비밀번호 재설정 링크를 전송합니다"
                        accessibilityState={{ disabled: isLoading }}
                      >
                        <LinearGradient
                          colors={isLoading ? ['#ccc', '#999'] : COLORS.gradient.primary}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.submitButton,
                            { opacity: isLoading ? 0.7 : 1 }
                          ]}
                        >
                          <View style={styles.submitButtonContent}>
                            {isLoading && (
                              <ActivityIndicator
                                size="small"
                                color={COLORS.white}
                                style={styles.submitButtonLoader}
                              />
                            )}
                            <Text style={styles.submitButtonText}>
                              {isLoading ? '전송 중...' : '재설정 링크 전송'}
                            </Text>
                          </View>
                        </LinearGradient>
                      </Pressable>

                      {/* 로그인으로 돌아가기 */}
                      <View style={styles.loginLinkContainer}>
                        <Text style={styles.loginLinkText}>
                          비밀번호가 기억나셨나요?{' '}
                        </Text>
                        <Pressable
                          onPress={handleGoBack}
                          accessibilityRole="button"
                          accessibilityLabel="로그인 화면으로 이동"
                        >
                          <Text style={styles.loginLinkButton}>
                            로그인
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

      {/* 성공 모달 */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
        accessibilityViewIsModal
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleModalClose}
          accessibilityRole="button"
          accessibilityLabel="모달 닫기"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              <VStack style={styles.modalContentContainer}>
                {/* 성공 아이콘 */}
                <View style={styles.modalIconContainer}>
                  <LinearGradient
                    colors={COLORS.gradient.primary}
                    style={styles.modalIconGradient}
                  >
                    <Text style={styles.modalIconEmoji}>✉️</Text>
                  </LinearGradient>
                </View>

                {/* 제목 */}
                <Text
                  style={styles.modalTitle}
                  accessibilityRole="header"
                >
                  이메일 전송 완료
                </Text>

                {/* 설명 */}
                <Text style={styles.modalDescription}>
                  비밀번호 재설정 링크를{'\n'}
                  이메일로 전송했습니다.{'\n'}
                  이메일을 확인해주세요.
                </Text>

                {/* 확인 버튼 */}
                <Pressable
                  onPress={handleModalClose}
                  style={styles.modalButtonContainer}
                  accessibilityRole="button"
                  accessibilityLabel="확인"
                  accessibilityHint="로그인 화면으로 돌아갑니다"
                >
                  <LinearGradient
                    colors={COLORS.gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>
                      확인
                    </Text>
                  </LinearGradient>
                </Pressable>
              </VStack>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default PasswordRecoveryScreen;
