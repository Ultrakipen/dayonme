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
import { showAlert } from '../contexts/AlertContext';
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

  const emailRef = useRef<any>(null);

  // 반응형 헬퍼
  const { normalize, normalizeFontSize, spacing } = useMemo(() => {
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
    } catch (error: any) {
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
      } else {
        showAlert.error(
          '오류',
          data.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.'
        );
      }
    } catch (error: any) {
      showAlert.error(
        '오류',
        error.message || '서버와의 연결에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [email, isLoading, validateForm]);

  // 모달 닫기
  const handleModalClose = useCallback(() => {
    setShowSuccessModal(false);
    navigation.goBack();
  }, [navigation]);

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
      paddingHorizontal: spacing(24),
      paddingVertical: spacing(60),
      minHeight: height
    },
    backButton: {
      position: 'absolute' as const,
      top: spacing(50),
      left: spacing(20),
      zIndex: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.25)',
      borderRadius: spacing(16),
      width: spacing(48),
      height: spacing(48),
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacing(2) },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: spacing(6),
      elevation: 4
    },
    card: {
      backgroundColor: isDark ? theme.colors.card : 'rgba(255, 255, 255, 0.95)',
      borderRadius: spacing(28),
      padding: spacing(28),
      width: '100%' as const,
      maxWidth: Math.min(width - spacing(40), 400),
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacing(16) },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: spacing(24),
      elevation: 18
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderRadius: spacing(14),
      fontSize: normalizeFontSize(16)
    },
    textInputContent: {
      paddingHorizontal: spacing(18),
      paddingVertical: spacing(14),
      fontSize: normalizeFontSize(16),
      color: isDark ? COLORS.text.dark : COLORS.text.light
    },
    errorText: {
      color: COLORS.error,
      fontSize: normalizeFontSize(14),
      marginTop: spacing(8),
      marginLeft: spacing(6),
      fontWeight: '700' as const
    },
    submitButton: {
      borderRadius: spacing(16),
      paddingVertical: spacing(16),
      minHeight: spacing(54),
      justifyContent: 'center' as const,
      shadowColor: COLORS.gradient.primary[0],
      shadowOffset: { width: 0, height: spacing(6) },
      shadowOpacity: 0.25,
      shadowRadius: spacing(12),
      elevation: 10
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing(28)
    },
    modalCard: {
      backgroundColor: isDark ? theme.colors.card : COLORS.white,
      borderRadius: spacing(24),
      padding: spacing(28),
      width: '100%' as const,
      maxWidth: Math.min(width - spacing(48), 340),
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacing(16) },
      shadowOpacity: isDark ? 0.6 : 0.25,
      shadowRadius: spacing(24),
      elevation: 20
    }
  }), [theme, isDark, width, height, spacing, normalizeFontSize]);

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
                  <Text style={{
                    fontSize: normalizeFontSize(22),
                    fontWeight: '600',
                    color: isDark ? theme.colors.text.primary : COLORS.white
                  }}>
                    ←
                  </Text>
                </Pressable>

                <View style={styles.card}>
                  <VStack style={{ gap: spacing(24) }}>
                    {/* 헤더 섹션 */}
                    <VStack style={{ alignItems: 'center', gap: spacing(16) }}>
                      <View style={{
                        width: spacing(70),
                        height: spacing(70),
                        borderRadius: spacing(35),
                        backgroundColor: isDark ? theme.colors.background : COLORS.white,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: COLORS.gradient.primary[0],
                        shadowOffset: { width: 0, height: spacing(6) },
                        shadowOpacity: isDark ? 0.4 : 0.25,
                        shadowRadius: spacing(12),
                        elevation: 10
                      }}>
                        <LinearGradient
                          colors={COLORS.gradient.primary}
                          style={{
                            width: spacing(54),
                            height: spacing(54),
                            borderRadius: spacing(27),
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{
                            fontSize: normalizeFontSize(26),
                            fontWeight: '900',
                            color: COLORS.white
                          }}>
                            🔐
                          </Text>
                        </LinearGradient>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{
                          fontSize: normalizeFontSize(26),
                          fontWeight: '800',
                          color: theme.colors.text.primary,
                          letterSpacing: -0.5,
                          marginBottom: spacing(12),
                          textShadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2
                        }}>
                          비밀번호 찾기
                        </Text>
                        <Text style={{
                          fontSize: normalizeFontSize(15),
                          color: theme.colors.text.secondary,
                          fontWeight: '600',
                          textAlign: 'center',
                          lineHeight: normalizeFontSize(22),
                          paddingHorizontal: spacing(8)
                        }}>
                          가입하신 이메일 주소를 입력하시면{'\n'}
                          비밀번호 재설정 링크를 보내드립니다
                        </Text>
                      </View>
                    </VStack>

                    {/* 이메일 입력 섹션 */}
                    <VStack style={{ gap: spacing(20) }}>
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
                            borderRadius: spacing(14),
                            borderWidth: 2,
                            borderColor: errors.email ? COLORS.error : email ? COLORS.gradient.primary[0] : 'transparent'
                          }}
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
                    <VStack style={{ gap: spacing(16), marginTop: spacing(8) }}>
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
                              fontSize: normalizeFontSize(16),
                              fontWeight: '700',
                              textAlign: 'center',
                              letterSpacing: 0.3
                            }}>
                              {isLoading ? '전송 중...' : '재설정 링크 전송'}
                            </Text>
                          </View>
                        </LinearGradient>
                      </Pressable>

                      {/* 로그인으로 돌아가기 */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: spacing(4)
                      }}>
                        <Text style={{
                          color: theme.colors.text.secondary,
                          fontSize: normalizeFontSize(14),
                          fontWeight: '500'
                        }}>
                          비밀번호가 기억나셨나요?{' '}
                        </Text>
                        <Pressable
                          onPress={handleGoBack}
                          accessibilityRole="button"
                          accessibilityLabel="로그인 화면으로 이동"
                        >
                          <Text style={{
                            color: COLORS.gradient.primary[0],
                            fontSize: normalizeFontSize(14),
                            fontWeight: '700'
                          }}>
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
              <VStack style={{ gap: spacing(20), alignItems: 'center' }}>
                {/* 성공 아이콘 */}
                <View style={{
                  width: spacing(70),
                  height: spacing(70),
                  borderRadius: spacing(35),
                  backgroundColor: isDark ? theme.colors.background : '#f0f9ff',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <LinearGradient
                    colors={COLORS.gradient.primary}
                    style={{
                      width: spacing(56),
                      height: spacing(56),
                      borderRadius: spacing(28),
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ fontSize: normalizeFontSize(28) }}>✉️</Text>
                  </LinearGradient>
                </View>

                {/* 제목 */}
                <Text
                  style={{
                    fontSize: normalizeFontSize(24),
                    fontWeight: '800',
                    color: theme.colors.text.primary,
                    textAlign: 'center',
                    letterSpacing: -0.5
                  }}
                  accessibilityRole="header"
                >
                  이메일 전송 완료
                </Text>

                {/* 설명 */}
                <Text style={{
                  fontSize: normalizeFontSize(15),
                  fontWeight: '500',
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                  lineHeight: normalizeFontSize(23),
                  paddingHorizontal: spacing(8)
                }}>
                  비밀번호 재설정 링크를{'\n'}
                  이메일로 전송했습니다.{'\n'}
                  이메일을 확인해주세요.
                </Text>

                {/* 확인 버튼 */}
                <Pressable
                  onPress={handleModalClose}
                  style={{ width: '100%' }}
                  accessibilityRole="button"
                  accessibilityLabel="확인"
                  accessibilityHint="로그인 화면으로 돌아갑니다"
                >
                  <LinearGradient
                    colors={COLORS.gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: '100%',
                      borderRadius: spacing(14),
                      paddingVertical: spacing(16),
                      minHeight: spacing(52),
                      justifyContent: 'center',
                      shadowColor: COLORS.gradient.primary[0],
                      shadowOffset: { width: 0, height: spacing(5) },
                      shadowOpacity: isDark ? 0.4 : 0.25,
                      shadowRadius: spacing(10),
                      elevation: 8
                    }}
                  >
                    <Text style={{
                      color: COLORS.white,
                      fontSize: normalizeFontSize(16),
                      fontWeight: '700',
                      textAlign: 'center',
                      letterSpacing: 0.3
                    }}>
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
