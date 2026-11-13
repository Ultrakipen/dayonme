// RegisterScreen.tsx - 인스타그램 스타일 단계별 회원가입
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  View,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput as RNTextInput,
  PixelRatio,
  Pressable
} from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import { Text, VStack, HStack } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/api/authService';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { kakaoNativeLogin } from '../services/api/kakaoNativeLogin';
import { startNaverLogin } from '../services/api/naverAuth';
import { showAlert } from '../contexts/AlertContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { FONT_SIZES } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 타입 정의
type RootStackParamList = {
  Register: undefined;
  Login: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

interface FormData {
  email: string;
  verificationCode: string[];
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
}

// 상수 정의
const BREAKPOINTS = {
  small: 360,
  medium: 390,
  large: 428
} as const;

const COLORS = {
  error: '#FF3040',
  success: '#00C851',
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
  progress: {
    active: '#5566DD',
    inactive: '#e0e0e0'
  },
  border: {
    light: '#e1e5e9',
    dark: '#3a3a3a'
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
    },
    tertiary: {
      light: '#8e8e93',
      dark: '#888888'
    }
  }
} as const;

// 개선된 이메일 검증 정규식
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 비밀번호 검증 정규식
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

// 타이머 시간 (5분)
const TIMER_DURATION = 300;

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register } = useAuth();
  const { theme, isDark, toggleTheme } = useModernTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [step, setStep] = useState(1); // 1: 이메일, 2: 인증, 3: 정보, 4: 프로필

  const [formData, setFormData] = useState<FormData>({
    email: '',
    verificationCode: ['', '', '', '', '', ''],
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });

  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 인증 코드 입력 refs
  const codeInputRefs = useRef<Array<RNTextInput | null>>([]);

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

  // 타이머 시작
  const startResendTimer = useCallback(() => {
    setResendTimer(TIMER_DURATION);
  }, []);

  // 타이머 처리
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // 이메일 인증 코드 발송
  const handleSendCode = useCallback(async () => {
    if (sendingCode) return;

    if (!formData.email) {
      showAlert.error('오류', '이메일을 입력해주세요.');
      return;
    }

    if (!EMAIL_REGEX.test(formData.email)) {
      showAlert.error('오류', '유효한 이메일 주소를 입력해주세요.');
      return;
    }

    setSendingCode(true);
    try {
      await authService.sendVerificationCode(formData.email);
      // 성공 알림 대신 바로 다음 단계로 이동 (브릿지 오류 방지)
      setStep(2);
      startResendTimer();
    } catch (error: any) {
      showAlert.error('오류', error.message || '인증 코드 발송에 실패했습니다.');
    } finally {
      setSendingCode(false);
    }
  }, [formData.email, sendingCode, startResendTimer]);

  // 인증 코드 확인
  const handleVerifyCode = useCallback(async () => {
    if (loading) return;

    const code = formData.verificationCode.join('');

    if (code.length !== 6) {
      showAlert.error('오류', '6자리 인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyCode(formData.email, code);
      setIsEmailVerified(true);
      // 성공 알림 대신 바로 다음 단계로 이동 (브릿지 오류 방지)
      setStep(3);
    } catch (error: any) {
      showAlert.error('오류', error.message || '인증 코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  }, [formData.email, formData.verificationCode, loading]);

  // 회원가입
  const handleRegister = useCallback(async () => {
    if (loading) return;

    if (!isEmailVerified) {
      showAlert.error('오류', '이메일 인증을 먼저 완료해주세요.');
      return;
    }

    if (!formData.username || formData.username.length < 3) {
      showAlert.error('오류', '사용자명은 3자 이상이어야 합니다.');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      showAlert.error('오류', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (!PASSWORD_REGEX.test(formData.password)) {
      showAlert.error('비밀번호 오류', '비밀번호는 대소문자, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert.error('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        nickname: formData.nickname.trim() || formData.username.trim(),
      });

      showAlert.success('회원가입 성공', 'Dayonme에 오신 것을 환영합니다!');

      // 회원가입 성공 후 Main으로 이동
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error: any) {
      showAlert.error('회원가입 실패', error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [formData, loading, isEmailVerified, register]);

  // 인증 코드 입력 핸들러
  const handleCodeChange = useCallback((index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...formData.verificationCode];
    newCode[index] = value;
    setFormData(prev => ({ ...prev, verificationCode: newCode }));

    // 자동으로 다음 입력으로 이동
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  }, [formData.verificationCode]);

  // 백스페이스 처리
  const handleCodeKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !formData.verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  }, [formData.verificationCode]);

  // 폼 데이터 업데이트 핸들러
  const updateFormData = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 카카오 로그인 핸들러
  const handleKakaoLogin = useCallback(async () => {
    if (isSocialLoading) return;
    setIsSocialLoading(true);
    try {
      await kakaoNativeLogin();
    } catch (error: any) {
      console.error('카카오 로그인 오류:', error);
      showAlert.error('로그인 실패', '카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSocialLoading(false);
    }
  }, [isSocialLoading]);

  // 네이버 로그인 핸들러
  const handleNaverLogin = useCallback(async () => {
    if (isSocialLoading) return;
    setIsSocialLoading(true);
    try {
      await startNaverLogin();
    } catch (error: any) {
      console.error('네이버 로그인 오류:', error);
      showAlert.error('로그인 실패', '네이버 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSocialLoading(false);
    }
  }, [isSocialLoading]);

  // 뒤로가기 핸들러
  const handleGoBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  // 스타일 메모이제이션
  const styles = useMemo(() => ({
    container: {
      flex: 1
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 24,
      paddingVertical: 60,
      minHeight: height
    },
    card: {
      backgroundColor: isDark ? theme.bg.card : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 32,
      padding: 36,
      width: '100%' as const,
      maxWidth: 460,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 30,
      elevation: 20
    },
    themeToggle: {
      position: 'absolute' as const,
      top: insets.top + spacing(8),
      right: spacing(16),
      zIndex: 1000,
      padding: spacing(8),
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: spacing(12)
    },
    backButton: {
      position: 'absolute' as const,
      top: spacing(50),
      left: spacing(20),
      zIndex: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderRadius: spacing(16),
      width: spacing(48),
      height: spacing(48),
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacing(2) },
      shadowOpacity: 0.1,
      shadowRadius: spacing(6),
      elevation: 4
    },
    textInput: {
      backgroundColor: theme.bg.secondary,
      borderRadius: 16,
      fontSize: FONT_SIZES.h4,
      fontWeight: '600' as const
    },
    textInputContent: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      fontSize: FONT_SIZES.h4,
      color: isDark ? theme.text.primary : '#1a1a1a'
    },
    button: {
      borderRadius: spacing(16),
      paddingVertical: spacing(16),
      minHeight: spacing(54),
      justifyContent: 'center' as const,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: spacing(6) },
      shadowOpacity: 0.25,
      shadowRadius: spacing(12),
      elevation: 10
    },
    socialButton: {
      flex: 1,
      borderRadius: spacing(14),
      paddingVertical: spacing(15),
      minHeight: spacing(52),
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: spacing(3) },
      shadowOpacity: 0.12,
      shadowRadius: spacing(8),
      elevation: 6
    },
    loginLinkContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing(14),
      marginTop: spacing(20)
    },
    loginLinkText: {
      color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
      fontSize: normalizeFontSize(15),
      fontWeight: '600' as const
    },
    loginLinkHighlight: {
      color: theme.colors.accentText,
      fontSize: normalizeFontSize(15),
      fontWeight: '700' as const
    }
  }), [theme, isDark, height, spacing, normalizeFontSize, insets.top]);

  // 진행률 표시 스타일
  const progressBarStyles = useMemo(() => ({
    container: {
      justifyContent: 'center' as const,
      marginBottom: 32,
      gap: 8
    },
    activeBar: {
      width: 48,
      height: 12,
      borderRadius: 6,
      backgroundColor: COLORS.progress.active
    },
    inactiveBar: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: COLORS.progress.inactive
    }
  }), []);

  // 진행률 표시
  const renderProgressBar = useCallback(() => (
    <HStack style={progressBarStyles.container}>
      {[1, 2, 3, 4].map((s) => (
        <View
          key={s}
          style={step >= s ? progressBarStyles.activeBar : progressBarStyles.inactiveBar}
        />
      ))}
    </HStack>
  ), [step, progressBarStyles]);

  // Step 1: 이메일 입력
  const renderStep1 = useCallback(() => (
    <VStack style={{ gap: spacing(20) }}>
      <VStack style={{ alignItems: 'center', gap: spacing(16) }}>
        <Text style={{
          fontSize: normalizeFontSize(26),
          fontWeight: '900',
          color: isDark ? theme.text.primary : '#1a1a1a',
          letterSpacing: -0.5
        }}>
          이메일 입력
        </Text>
        <Text style={{
          fontSize: normalizeFontSize(15),
          color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: normalizeFontSize(22)
        }}>
          가입할 이메일 주소를{'\n'}입력해주세요
        </Text>
      </VStack>

      <View style={{ marginTop: spacing(12) }}>
        <TextInput
          placeholder="이메일 주소"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          mode="outlined"
          textColor={isDark ? COLORS.text.dark : COLORS.text.light}
          style={styles.textInput}
          contentStyle={styles.textInputContent}
          outlineStyle={{
            borderRadius: 16,
            borderWidth: formData.email ? 2 : 1,
            borderColor: formData.email ? theme.colors.primary : theme.colors.inputBorder
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          editable={!sendingCode}
          theme={{
            colors: {
              primary: theme.colors.primary,
              onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
              outline: 'transparent'
            },
          }}
          placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
          accessibilityLabel="이메일 주소 입력"
          accessibilityHint="회원가입을 위한 이메일 주소를 입력하세요"
        />
      </View>

      <Pressable
        onPress={handleSendCode}
        disabled={sendingCode}
        accessibilityRole="button"
        accessibilityLabel="인증 코드 받기"
        accessibilityState={{ disabled: sendingCode }}
      >
        <View
          style={[styles.button, {
            marginTop: spacing(8),
            opacity: sendingCode ? 0.7 : 1,
            backgroundColor: sendingCode ? (isDark ? '#4B4B55' : '#767676') : theme.colors.primary
          }]}
        >
          <HStack style={{ justifyContent: 'center', alignItems: 'center', gap: spacing(8) }}>
            {sendingCode && <ActivityIndicator size="small" color={COLORS.white} />}
            <Text style={{
              color: sendingCode ? COLORS.white : theme.colors.onAccent,
              fontSize: normalizeFontSize(16),
              fontWeight: '700',
              letterSpacing: 0.3
            }}>
              {sendingCode ? '전송 중...' : '인증 코드 받기'}
            </Text>
          </HStack>
        </View>
      </Pressable>

      {/* 간편 가입 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing(20),
        marginBottom: spacing(8)
      }}>
        <View style={{ flex: 1, height: 1, backgroundColor: isDark ? COLORS.border.dark : COLORS.border.light }} />
        <Text style={{
          paddingHorizontal: spacing(16),
          fontSize: normalizeFontSize(14),
          color: isDark ? COLORS.text.tertiary.dark : COLORS.text.tertiary.light,
          fontWeight: '600'
        }}>
          간편 가입
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: isDark ? COLORS.border.dark : COLORS.border.light }} />
      </View>

      <HStack style={{ gap: spacing(10) }}>
        <Pressable
          onPress={handleKakaoLogin}
          disabled={isSocialLoading}
          accessibilityRole="button"
          accessibilityLabel="카카오로 가입"
          accessibilityState={{ disabled: isSocialLoading }}
          style={{ flex: 1 }}
        >
          <View style={[
            styles.socialButton,
            {
              backgroundColor: COLORS.kakao.background,
              opacity: isSocialLoading ? 0.7 : 1
            }
          ]}>
            <View style={{
              width: spacing(22),
              height: spacing(22),
              backgroundColor: COLORS.kakao.text,
              borderRadius: spacing(11),
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: normalizeFontSize(13), fontWeight: '900', color: COLORS.kakao.background }}>K</Text>
            </View>
            <Text style={{
              color: COLORS.kakao.text,
              fontSize: normalizeFontSize(15),
              fontWeight: '700',
              letterSpacing: 0.2,
              marginLeft: spacing(8)
            }}>
              카카오
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleNaverLogin}
          disabled={isSocialLoading}
          accessibilityRole="button"
          accessibilityLabel="네이버로 가입"
          accessibilityState={{ disabled: isSocialLoading }}
          style={{ flex: 1 }}
        >
          <View style={[
            styles.socialButton,
            {
              backgroundColor: COLORS.naver.background,
              opacity: isSocialLoading ? 0.7 : 1
            }
          ]}>
            <View style={{
              width: spacing(22),
              height: spacing(22),
              backgroundColor: COLORS.white,
              borderRadius: spacing(11),
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: normalizeFontSize(13), fontWeight: '900', color: COLORS.naver.background }}>N</Text>
            </View>
            <Text style={{
              color: COLORS.naver.text,
              fontSize: normalizeFontSize(15),
              fontWeight: '700',
              letterSpacing: 0.2,
              marginLeft: spacing(8)
            }}>
              네이버
            </Text>
          </View>
        </Pressable>
      </HStack>
    </VStack>
  ), [formData.email, sendingCode, isSocialLoading, handleSendCode, handleKakaoLogin, handleNaverLogin, updateFormData, styles, spacing, normalizeFontSize, isDark, theme]);

  // Step 2: 인증 코드 입력
  const renderStep2 = useCallback(() => {
    const minutes = Math.floor(resendTimer / 60);
    const seconds = resendTimer % 60;

    return (
      <VStack style={{ gap: spacing(28) }}>
        <VStack style={{ alignItems: 'center', gap: spacing(16) }}>
          <Text style={{ fontSize: normalizeFontSize(48) }}>📧</Text>
          <Text style={{
            fontSize: normalizeFontSize(26),
            fontWeight: '900',
            color: isDark ? theme.text.primary : '#1a1a1a',
            letterSpacing: -0.5
          }}>
            인증 코드 입력
          </Text>
          <Text style={{
            fontSize: normalizeFontSize(15),
            color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
            fontWeight: '600',
            textAlign: 'center',
            lineHeight: normalizeFontSize(22)
          }}>
            {formData.email}으로{'\n'}발송된 코드를 입력해주세요
          </Text>
        </VStack>

        {/* 인증 코드 입력 */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginVertical: 8,
          paddingHorizontal: 10,
        }}>
          {formData.verificationCode.map((digit, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                maxWidth: 44,
                height: 40,
                borderRadius: 8,
                borderWidth: digit ? 2 : 1.5,
                borderColor: digit ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB'),
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F9FAFB',
                marginHorizontal: 4,
                shadowColor: digit ? theme.colors.primary : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: digit ? 0.15 : 0.05,
                shadowRadius: 4,
                elevation: digit ? 3 : 1,
              }}
            >
              <RNTextInput
                ref={(ref) => (codeInputRefs.current[index] = ref)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#1F2937',
                  padding: 0,
                }}
                value={digit}
                onChangeText={(value) => handleCodeChange(index, value)}
                onKeyPress={({ nativeEvent: { key } }) => handleCodeKeyPress(index, key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
                accessibilityLabel={`인증 코드 ${index + 1}번째 자리`}
              />
            </View>
          ))}
        </View>

        {resendTimer > 0 && (
          <Text style={{
            textAlign: 'center',
            fontSize: normalizeFontSize(15),
            color: theme.colors.accentText,
            fontWeight: '700'
          }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
        )}

        <Pressable
          onPress={handleVerifyCode}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="인증 코드 확인"
          accessibilityState={{ disabled: loading }}
        >
          <View
            style={[styles.button, {
              opacity: loading ? 0.7 : 1,
              backgroundColor: loading ? (isDark ? '#4B4B55' : '#767676') : theme.colors.primary
            }]}
          >
            <HStack style={{ justifyContent: 'center', alignItems: 'center', gap: spacing(8) }}>
              {loading && <ActivityIndicator size="small" color={COLORS.white} />}
              <Text style={{
                color: loading ? COLORS.white : theme.colors.onAccent,
                fontSize: normalizeFontSize(16),
                fontWeight: '700',
                letterSpacing: 0.3
              }}>
                {loading ? '확인 중...' : '다음'}
              </Text>
            </HStack>
          </View>
        </Pressable>

        {resendTimer === 0 && (
          <Pressable
            onPress={handleSendCode}
            accessibilityRole="button"
            accessibilityLabel="코드 재전송"
          >
            <Text style={{
              textAlign: 'center',
              fontSize: normalizeFontSize(15),
              color: theme.colors.accentText,
              fontWeight: '700'
            }}>
              코드 재전송
            </Text>
          </Pressable>
        )}
      </VStack>
    );
  }, [formData.email, formData.verificationCode, resendTimer, loading, handleVerifyCode, handleCodeChange, handleCodeKeyPress, handleSendCode, spacing, normalizeFontSize, isDark, theme, styles, codeInputRefs]);

  // Step 3: 기본 정보 입력
  const renderStep3 = useCallback(() => (
    <VStack style={{ gap: spacing(20) }}>
      <VStack style={{ alignItems: 'center', gap: spacing(16) }}>
        <Text style={{
          fontSize: normalizeFontSize(26),
          fontWeight: '900',
          color: isDark ? theme.text.primary : '#1a1a1a',
          letterSpacing: -0.5
        }}>
          기본 정보
        </Text>
        <Text style={{
          fontSize: normalizeFontSize(15),
          color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: normalizeFontSize(22)
        }}>
          사용자명과 비밀번호를{'\n'}설정해주세요
        </Text>
      </VStack>

      <VStack style={{ gap: 16, marginTop: 8 }}>
        <TextInput
          placeholder="사용자명 (3자 이상)"
          value={formData.username}
          onChangeText={(value) => updateFormData('username', value)}
          mode="outlined"
          textColor={isDark ? COLORS.text.dark : COLORS.text.light}
          style={styles.textInput}
          contentStyle={styles.textInputContent}
          outlineStyle={{
            borderRadius: 16,
            borderWidth: formData.username ? 2 : 1,
            borderColor: formData.username ? theme.colors.primary : theme.colors.inputBorder
          }}
          autoCapitalize="none"
          maxLength={20}
          theme={{
            colors: {
              primary: theme.colors.primary,
              onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
              outline: 'transparent'
            },
          }}
          placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
          accessibilityLabel="사용자명 입력"
          accessibilityHint="3자 이상의 사용자명을 입력하세요"
        />

        <TextInput
          placeholder="비밀번호 (8자 이상)"
          value={formData.password}
          onChangeText={(value) => updateFormData('password', value)}
          mode="outlined"
          textColor={isDark ? COLORS.text.dark : COLORS.text.light}
          style={styles.textInput}
          contentStyle={styles.textInputContent}
          outlineStyle={{
            borderRadius: 16,
            borderWidth: formData.password ? 2 : 1,
            borderColor: formData.password ? theme.colors.primary : theme.colors.inputBorder
          }}
          secureTextEntry={!showPassword}
          theme={{
            colors: {
              primary: theme.colors.primary,
              onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
              outline: 'transparent'
            },
          }}
          placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
          accessibilityLabel="비밀번호 입력"
          accessibilityHint="8자 이상, 대소문자, 숫자, 특수문자 포함"
        />
        <Text style={{
          color: isDark ? theme.text.tertiary : COLORS.text.tertiary.light,
          fontSize: FONT_SIZES.bodySmall,
          marginTop: -8,
          marginLeft: 8,
          lineHeight: 22,
          fontWeight: '600'
        }}>
          대문자, 소문자, 숫자, 특수문자(!@#$%^&*) 포함
        </Text>

        <TextInput
          placeholder="비밀번호 확인"
          value={formData.confirmPassword}
          onChangeText={(value) => updateFormData('confirmPassword', value)}
          mode="outlined"
          textColor={isDark ? COLORS.text.dark : COLORS.text.light}
          style={styles.textInput}
          contentStyle={styles.textInputContent}
          outlineStyle={{
            borderRadius: 16,
            borderWidth: 2,
            borderColor: formData.confirmPassword ?
              (formData.password === formData.confirmPassword ? COLORS.success : COLORS.error) :
              'transparent'
          }}
          secureTextEntry={!showConfirmPassword}
          theme={{
            colors: {
              primary: theme.colors.primary,
              onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
              outline: 'transparent'
            },
          }}
          placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
          accessibilityLabel="비밀번호 확인 입력"
        />

        {/* 비밀번호 보기 체크박스 */}
        <Pressable
          onPress={() => {
            setShowPassword(!showPassword);
            setShowConfirmPassword(!showConfirmPassword);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            marginLeft: 4
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: showPassword }}
          accessibilityLabel="비밀번호 보기"
        >
          <View style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: showPassword ? theme.colors.primary : (isDark ? '#555' : '#ccc'),
            backgroundColor: showPassword ? theme.colors.primary : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10
          }}>
            {showPassword && (
              <MaterialCommunityIcons name="check" size={14} color={theme.colors.onAccent} />
            )}
          </View>
          <Text style={{
            color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
            fontSize: FONT_SIZES.bodySmall,
            fontWeight: '600'
          }}>
            비밀번호 보기
          </Text>
        </Pressable>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <Text
            style={{
              color: COLORS.error,
              fontSize: FONT_SIZES.bodyLarge,
              marginTop: -8,
              marginLeft: 8,
              fontWeight: '600'
            }}
            accessibilityRole="alert"
          >
            비밀번호가 일치하지 않습니다
          </Text>
        )}
      </VStack>

      <Pressable
        onPress={() => setStep(4)}
        accessibilityRole="button"
        accessibilityLabel="다음 단계로"
      >
        <View
          style={[styles.button, { marginTop: spacing(14), backgroundColor: theme.colors.primary }]}
        >
          <Text style={{
            color: theme.colors.onAccent,
            fontSize: normalizeFontSize(16),
            fontWeight: '700',
            textAlign: 'center',
            letterSpacing: 0.3
          }}>
            다음
          </Text>
        </View>
      </Pressable>
    </VStack>
  ), [formData.username, formData.password, formData.confirmPassword, updateFormData, spacing, normalizeFontSize, isDark, theme, styles, showPassword, showConfirmPassword]);

  // Step 4: 프로필 설정 (선택)
  const renderStep4 = useCallback(() => (
    <VStack style={{ gap: spacing(20) }}>
      <VStack style={{ alignItems: 'center', gap: spacing(16) }}>
        <Text style={{ fontSize: normalizeFontSize(48) }}>✨</Text>
        <Text style={{
          fontSize: normalizeFontSize(26),
          fontWeight: '900',
          color: isDark ? theme.text.primary : '#1a1a1a',
          letterSpacing: -0.5
        }}>
          거의 다 왔어요!
        </Text>
        <Text style={{
          fontSize: normalizeFontSize(15),
          color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: normalizeFontSize(22)
        }}>
          닉네임을 설정해주세요{'\n'}(나중에 변경 가능)
        </Text>
      </VStack>

      <TextInput
        placeholder="닉네임 (선택사항)"
        value={formData.nickname}
        onChangeText={(value) => updateFormData('nickname', value)}
        mode="outlined"
        textColor={isDark ? COLORS.text.dark : COLORS.text.light}
        style={styles.textInput}
        contentStyle={styles.textInputContent}
        outlineStyle={{
          borderRadius: 16,
          borderWidth: formData.nickname ? 2 : 1,
          borderColor: formData.nickname ? theme.colors.primary : theme.colors.inputBorder
        }}
        maxLength={20}
        theme={{
          colors: {
            primary: theme.colors.primary,
            onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
            outline: 'transparent'
          },
        }}
        placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
        accessibilityLabel="닉네임 입력"
        accessibilityHint="선택사항입니다. 나중에 변경할 수 있습니다"
      />

      <VStack style={{ gap: spacing(10), marginTop: spacing(14) }}>
        <Pressable
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="가입 완료"
          accessibilityState={{ disabled: loading }}
        >
          <View
            style={[styles.button, {
              opacity: loading ? 0.7 : 1,
              backgroundColor: loading ? (isDark ? '#4B4B55' : '#767676') : theme.colors.primary
            }]}
          >
            <HStack style={{ justifyContent: 'center', alignItems: 'center', gap: spacing(8) }}>
              {loading && <ActivityIndicator size="small" color={COLORS.white} />}
              <Text style={{
                color: loading ? COLORS.white : theme.colors.onAccent,
                fontSize: normalizeFontSize(16),
                fontWeight: '700',
                letterSpacing: 0.3
              }}>
                {loading ? '가입 중...' : '가입 완료'}
              </Text>
            </HStack>
          </View>
        </Pressable>

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="건너뛰기"
          accessibilityState={{ disabled: loading }}
        >
          <View style={{
            borderRadius: spacing(16),
            paddingVertical: spacing(16),
            minHeight: spacing(54),
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: isDark ? theme.bg.border : '#ddd',
            backgroundColor: theme.bg.secondary,
            opacity: loading ? 0.7 : 1
          }}>
            <Text style={{
              color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
              fontSize: normalizeFontSize(16),
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: 0.3
            }}>
              건너뛰기
            </Text>
          </View>
        </Pressable>
      </VStack>
    </VStack>
  ), [formData.nickname, loading, handleRegister, updateFormData, spacing, normalizeFontSize, isDark, theme, styles]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* 다크모드 토글 버튼 */}
          <Pressable
            style={styles.themeToggle}
            onPress={toggleTheme}
            accessibilityRole="button"
            accessibilityLabel={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={normalize(24)}
              color={COLORS.white}
            />
          </Pressable>

          <View
            style={{ flex: 1, backgroundColor: isDark ? COLORS.black : theme.colors.primary }}
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
                  accessibilityLabel={step > 1 ? '이전 단계로' : '뒤로가기'}
                >
                  <Text style={{
                    fontSize: normalizeFontSize(22),
                    fontWeight: '600',
                    color: COLORS.white
                  }}>
                    ←
                  </Text>
                </Pressable>

                <View style={styles.card}>
                  {renderProgressBar()}

                  {step === 1 && renderStep1()}
                  {step === 2 && renderStep2()}
                  {step === 3 && renderStep3()}
                  {step === 4 && renderStep4()}

                  {/* 로그인 링크 */}
                  {step === 1 && (
                    <Pressable
                      onPress={() => navigation.goBack()}
                      accessibilityRole="button"
                      accessibilityLabel="로그인 화면으로 이동"
                    >
                      <View style={styles.loginLinkContainer}>
                        <Text style={styles.loginLinkText}>
                          이미 계정이 있으신가요?{' '}
                        </Text>
                        <Text style={styles.loginLinkHighlight}>
                          로그인
                        </Text>
                      </View>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

export default RegisterScreen;
