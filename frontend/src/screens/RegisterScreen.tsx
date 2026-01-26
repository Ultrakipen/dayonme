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
import LinearGradient from 'react-native-linear-gradient';
import { Text, VStack, HStack } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/api/authService';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { kakaoNativeLogin } from '../services/api/kakaoNativeLogin';
import { startNaverLogin } from '../services/api/naverAuth';
import { showAlert } from '../contexts/AlertContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { FONT_SIZES } from '../constants';
import { LayoutAnimation, UIManager, Platform as RNPlatform } from 'react-native';

// New Architecture에서는 setLayoutAnimationEnabledExperimental이 작동하지 않으므로
// Old Architecture에서만 실행
if (
  RNPlatform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !(global as any).nativeFabricUIManager // New Architecture가 아닐 때만
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  ageRange: string;
}

// 연령대 옵션 (카카오 심사용)
const AGE_RANGE_OPTIONS = [
  { label: '선택 안함', value: '' },
  { label: '10대 (15~19세)', value: '15~19' },
  { label: '20대', value: '20~29' },
  { label: '30대', value: '30~39' },
  { label: '40대', value: '40~49' },
  { label: '50대', value: '50~59' },
  { label: '60대 이상', value: '60~' },
];

// 상수 정의
const BREAKPOINTS = {
  small: 360,
  medium: 390,
  large: 428
} as const;

const COLORS = {
  gradient: {
    primary: ['#667eea', '#764ba2'] as const,
    primaryDark: ['#1a1a1a', '#2d2d2d', '#1a1a1a'] as const,
    primaryLight: ['#667eea', '#764ba2', '#f093fb'] as const,
  },
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
    active: '#667eea',
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
  const { width, height } = useWindowDimensions();
  const [step, setStep] = useState(1); // 1: 이메일, 2: 인증, 3: 정보, 4: 프로필

  // fadeAnim 제거 - 깜빡임 방지

  const [formData, setFormData] = useState<FormData>({
    email: '',
    verificationCode: ['', '', '', '', '', ''],
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    ageRange: '',
  });

  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 약관 동의 상태
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [ageRangeAgreed, setAgeRangeAgreed] = useState(false);
  const [showAgeRangePicker, setShowAgeRangePicker] = useState(false);

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
            // 타이머 만료 시 보안을 위해 입력된 인증 코드 초기화
            setFormData(prevData => ({
              ...prevData,
              verificationCode: ['', '', '', '', '', '']
            }));
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
      // 이메일 중복 체크
      const emailCheck = await authService.checkEmail(formData.email);
      if (!emailCheck.available) {
        showAlert.confirm(
          '이메일 중복',
          '이미 사용 중인 이메일입니다.\n로그인 화면으로 이동하시겠습니까?',
          () => {
            // 확인 버튼: 로그인 화면으로 이동
            navigation.navigate('Login');
          },
          () => {
            // 취소 버튼: 이메일 필드 초기화
            setFormData(prev => ({ ...prev, email: '' }));
          }
        );
        return;
      }

      await authService.sendVerificationCode(formData.email);
      // 성공 알림 대신 바로 다음 단계로 이동 (브릿지 오류 방지)
      setStep(2);
      startResendTimer();
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

    if (!formData.username || formData.username.length < 2) {
      showAlert.error('오류', '사용자명은 2자 이상이어야 합니다.');
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
        age_range: formData.ageRange || undefined,
      });

      showAlert.success('회원가입 성공', 'Dayonme에 오신 것을 환영합니다!');

      // 회원가입 성공 후 Main으로 이동
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error: unknown) {
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

  // 비밀번호 강도 계산
  const calculatePasswordStrength = useCallback((password: string) => {
    if (!password) return { strength: 0, color: '#e0e0e0', label: '' };

    let strength = 0;
    const checks = {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
    };

    strength += checks.length ? 20 : 0;
    strength += checks.hasUpper ? 20 : 0;
    strength += checks.hasLower ? 20 : 0;
    strength += checks.hasNumber ? 20 : 0;
    strength += checks.hasSpecial ? 20 : 0;

    let color = '#FF3040'; // 약함
    let label = '약함';
    if (strength >= 80) {
      color = '#00C851'; // 강함
      label = '강함';
    } else if (strength >= 60) {
      color = '#FFB300'; // 보통
      label = '보통';
    }

    return { strength, color, label };
  }, []);

  // 카카오 로그인 핸들러
  const handleKakaoLogin = useCallback(async () => {
    if (isSocialLoading) return;
    setIsSocialLoading(true);
    try {
      await kakaoNativeLogin();
    } catch (error: unknown) {
      if (__DEV__) console.error('카카오 로그인 오류:', error);
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
    } catch (error: unknown) {
      if (__DEV__) console.error('네이버 로그인 오류:', error);
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
      justifyContent: 'flex-start' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 24,
      paddingTop: 100,
      paddingBottom: 60,
      minHeight: height,
    },
    card: {
      backgroundColor: isDark ? theme.bg.card : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 32,
      padding: 28,
      paddingTop: 32,
      paddingBottom: 32,
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
      top: spacing(16),
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
      fontFamily: 'Pretendard-SemiBold' as const
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
      shadowColor: COLORS.gradient.primary[0],
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
      fontFamily: 'Pretendard-SemiBold' as const
    },
    loginLinkHighlight: {
      color: isDark ? '#60a5fa' : COLORS.gradient.primary[0],
      fontSize: normalizeFontSize(15),
      fontFamily: 'Pretendard-Bold' as const
    }
  }), [theme, isDark, height, spacing, normalizeFontSize]);

  // 진행률 표시 스타일
  const progressBarStyles = useMemo(() => ({
    container: {
      justifyContent: 'center' as const,
      marginBottom: 20,
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

  // 진행률 표시 (5단계)
  const renderProgressBar = useCallback(() => (
    <HStack style={progressBarStyles.container}>
      {[1, 2, 3, 4, 5].map((s) => (
        <View
          key={s}
          style={step >= s ? progressBarStyles.activeBar : progressBarStyles.inactiveBar}
        />
      ))}
    </HStack>
  ), [step, progressBarStyles]);

  // Step 1: 이메일 입력
  const renderStep1 = useCallback(() => (
    <VStack style={{ gap: spacing(16) }}>
      <VStack style={{ alignItems: 'center', gap: spacing(12) }}>
        <Text style={{
          fontSize: normalizeFontSize(26),
          fontFamily: 'Pretendard-Black',
          color: isDark ? theme.text.primary : '#1a1a1a',
          letterSpacing: -0.5
        }}>
          이메일 입력
        </Text>
        <Text style={{
          fontSize: normalizeFontSize(15),
          color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
          fontFamily: 'Pretendard-SemiBold',
          textAlign: 'center',
          lineHeight: normalizeFontSize(22)
        }}>
          가입할 이메일 주소를{'\n'}입력해주세요
        </Text>
      </VStack>

      <View style={{ marginTop: spacing(8), position: 'relative' }}>
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
            borderWidth: 2,
            borderColor: formData.email ? COLORS.gradient.primary[0] : 'transparent'
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          editable={!sendingCode}
          theme={{
            colors: {
              primary: COLORS.gradient.primary[0],
              onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
              outline: 'transparent'
            },
          }}
          placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
          accessibilityLabel="이메일 주소 입력"
          accessibilityHint="회원가입을 위한 이메일 주소를 입력하세요"
        />
        {formData.email && (
          <View style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: [{ translateY: -12 }]
          }}>
            <Icon
              name={EMAIL_REGEX.test(formData.email) ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={EMAIL_REGEX.test(formData.email) ? '#00C851' : '#FF3040'}
            />
          </View>
        )}
      </View>

      <Pressable
        onPress={handleSendCode}
        disabled={sendingCode}
        accessibilityRole="button"
        accessibilityLabel="인증 코드 받기"
        accessibilityState={{ disabled: sendingCode }}
      >
        <LinearGradient
          colors={sendingCode ? ['#ccc', '#999'] : COLORS.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, { marginTop: spacing(4), opacity: sendingCode ? 0.7 : 1 }]}
        >
          <HStack style={{ justifyContent: 'center', alignItems: 'center', gap: spacing(8) }}>
            {sendingCode && <ActivityIndicator size="small" color={COLORS.white} />}
            <Text style={{
              color: COLORS.white,
              fontSize: normalizeFontSize(16),
              fontFamily: 'Pretendard-Bold',
              letterSpacing: 0.3
            }}>
              {sendingCode ? '전송 중...' : '인증 코드 받기'}
            </Text>
          </HStack>
        </LinearGradient>
      </Pressable>

      {/* 간편 가입 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing(16),
        marginBottom: spacing(6)
      }}>
        <View style={{ flex: 1, height: 1, backgroundColor: isDark ? COLORS.border.dark : COLORS.border.light }} />
        <Text style={{
          paddingHorizontal: spacing(16),
          fontSize: normalizeFontSize(14),
          color: isDark ? COLORS.text.tertiary.dark : COLORS.text.tertiary.light,
          fontFamily: 'Pretendard-SemiBold'
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
              <Text style={{ fontSize: normalizeFontSize(13), fontFamily: 'Pretendard-Black', color: COLORS.kakao.background }}>K</Text>
            </View>
            <Text style={{
              color: COLORS.kakao.text,
              fontSize: normalizeFontSize(15),
              fontFamily: 'Pretendard-Bold',
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
              <Text style={{ fontSize: normalizeFontSize(13), fontFamily: 'Pretendard-Black', color: COLORS.naver.background }}>N</Text>
            </View>
            <Text style={{
              color: COLORS.naver.text,
              fontSize: normalizeFontSize(15),
              fontFamily: 'Pretendard-Bold',
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
            fontFamily: 'Pretendard-Black',
            color: isDark ? theme.text.primary : '#1a1a1a',
            letterSpacing: -0.5
          }}>
            인증 코드 입력
          </Text>
          <Text style={{
            fontSize: normalizeFontSize(15),
            color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
            fontFamily: 'Pretendard-SemiBold',
            textAlign: 'center',
            lineHeight: normalizeFontSize(22)
          }}>
            {formData.email}으로{'\n'}발송된 코드를 입력해주세요
          </Text>
        </VStack>

        {/* 인증 코드 입력 - 모바일 최적화 */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginVertical: spacing(12),
          paddingHorizontal: spacing(8),
        }}>
          {formData.verificationCode.map((digit, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                maxWidth: normalize(52),
                height: normalize(56),
                borderRadius: normalize(12),
                borderWidth: digit ? 2.5 : 2,
                borderColor: digit ? COLORS.gradient.primary[0] : (isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB'),
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F9FAFB',
                marginHorizontal: spacing(4),
                shadowColor: digit ? COLORS.gradient.primary[0] : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: digit ? 0.2 : 0.05,
                shadowRadius: 6,
                elevation: digit ? 4 : 1,
              }}
            >
              <RNTextInput
                ref={(ref) => (codeInputRefs.current[index] = ref)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: normalizeFontSize(24),
                  fontFamily: 'Pretendard-Bold',
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
            color: isDark ? '#60a5fa' : COLORS.gradient.primary[0],
            fontFamily: 'Pretendard-Bold'
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
          <LinearGradient
            colors={loading ? ['#ccc', '#999'] : COLORS.gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
          >
            <HStack style={{ justifyContent: 'center', alignItems: 'center', gap: spacing(8) }}>
              {loading && <ActivityIndicator size="small" color={COLORS.white} />}
              <Text style={{
                color: COLORS.white,
                fontSize: normalizeFontSize(16),
                fontFamily: 'Pretendard-Bold',
                letterSpacing: 0.3
              }}>
                {loading ? '확인 중...' : '다음'}
              </Text>
            </HStack>
          </LinearGradient>
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
              color: isDark ? '#60a5fa' : COLORS.gradient.primary[0],
              fontFamily: 'Pretendard-Bold'
            }}>
              코드 재전송
            </Text>
          </Pressable>
        )}
      </VStack>
    );
  }, [formData.email, formData.verificationCode, resendTimer, loading, handleVerifyCode, handleCodeChange, handleCodeKeyPress, handleSendCode, spacing, normalizeFontSize, isDark, theme, styles, codeInputRefs]);

  // Step 3: 기본 정보 입력
  const renderStep3 = useCallback(() => {
    const passwordStrength = calculatePasswordStrength(formData.password);

    return (
      <VStack style={{ gap: spacing(20) }}>
        <VStack style={{ alignItems: 'center', gap: spacing(16) }}>
          <Text style={{
            fontSize: normalizeFontSize(26),
            fontFamily: 'Pretendard-Black',
            color: isDark ? theme.text.primary : '#1a1a1a',
            letterSpacing: -0.5
          }}>
            기본 정보
          </Text>
          <Text style={{
            fontSize: normalizeFontSize(15),
            color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
            fontFamily: 'Pretendard-SemiBold',
            textAlign: 'center',
            lineHeight: normalizeFontSize(22)
          }}>
            사용자명과 비밀번호를{'\n'}설정해주세요
          </Text>
        </VStack>

        <VStack style={{ gap: 16, marginTop: 8 }}>
          <TextInput
            placeholder="사용자명 (2자 이상)"
            value={formData.username}
            onChangeText={(value) => updateFormData('username', value)}
            mode="outlined"
            textColor={isDark ? COLORS.text.dark : COLORS.text.light}
            style={styles.textInput}
            contentStyle={styles.textInputContent}
            outlineStyle={{
              borderRadius: 16,
              borderWidth: 2,
              borderColor: formData.username ? COLORS.gradient.primary[0] : 'transparent'
            }}
            autoCapitalize="none"
            maxLength={20}
            theme={{
              colors: {
                primary: COLORS.gradient.primary[0],
                onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
                outline: 'transparent'
              },
            }}
            placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
            accessibilityLabel="사용자명 입력"
            accessibilityHint="2자 이상의 사용자명을 입력하세요"
          />

          <View style={{ position: 'relative' }}>
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
                borderWidth: 2,
                borderColor: formData.password ? COLORS.gradient.primary[0] : 'transparent'
              }}
              secureTextEntry={!showPassword}
              theme={{
                colors: {
                  primary: COLORS.gradient.primary[0],
                  onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
                  outline: 'transparent'
                },
              }}
              placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
              accessibilityLabel="비밀번호 입력"
              accessibilityHint="8자 이상, 대소문자, 숫자, 특수문자 포함"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -12 }] }}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color={isDark ? '#999' : '#666'} />
            </Pressable>
          </View>

          {/* 비밀번호 강도 표시기 */}
          {formData.password && (
            <View style={{ marginTop: -8, marginHorizontal: 8 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6
              }}>
                <Text style={{
                  color: isDark ? theme.text.tertiary : COLORS.text.tertiary.light,
                  fontSize: FONT_SIZES.bodySmall,
                  fontFamily: 'Pretendard-SemiBold'
                }}>
                  비밀번호 강도
                </Text>
                <Text style={{
                  color: passwordStrength.color,
                  fontSize: FONT_SIZES.bodySmall,
                  fontFamily: 'Pretendard-Bold'
                }}>
                  {passwordStrength.label}
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: isDark ? '#333' : '#e0e0e0',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <View style={{
                  height: '100%',
                  width: `${passwordStrength.strength}%`,
                  backgroundColor: passwordStrength.color,
                  borderRadius: 3
                }} />
              </View>
            </View>
          )}

          <Text style={{
            color: isDark ? theme.text.tertiary : COLORS.text.tertiary.light,
            fontSize: FONT_SIZES.bodySmall,
            marginTop: formData.password ? -4 : -8,
            marginLeft: 8,
            lineHeight: 22,
            fontFamily: 'Pretendard-SemiBold'
          }}>
            대문자, 소문자, 숫자, 특수문자(!@#$%^&*) 포함
          </Text>

        <View style={{ position: 'relative' }}>
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
              primary: COLORS.gradient.primary[0],
              onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
              outline: 'transparent'
            },
          }}
          placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
          accessibilityLabel="비밀번호 확인 입력"
        />
        <Pressable
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={{ position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -12 }] }}
        >
          <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color={isDark ? '#999' : '#666'} />
        </Pressable>
      </View>

      {/* 기존 비밀번호 보기 체크박스 삭제됨 - 각 필드에 토글 아이콘 추가 */}
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <Text
            style={{
              color: COLORS.error,
              fontSize: FONT_SIZES.bodyLarge,
              marginTop: -8,
              marginLeft: 8,
              fontFamily: 'Pretendard-SemiBold'
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
        <LinearGradient
          colors={COLORS.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, { marginTop: spacing(14) }]}
        >
          <Text style={{
            color: COLORS.white,
            fontSize: normalizeFontSize(16),
            fontFamily: 'Pretendard-Bold',
            textAlign: 'center',
            letterSpacing: 0.3
          }}>
            다음
          </Text>
        </LinearGradient>
      </Pressable>
    </VStack>
    );
  }, [formData.username, formData.password, formData.confirmPassword, calculatePasswordStrength, updateFormData, spacing, normalizeFontSize, isDark, theme, styles, showPassword, showConfirmPassword]);

  // Step 4: 약관 동의
  const renderStep4 = useCallback(() => {
    const allRequired = termsAgreed && privacyAgreed;
    const allAgreed = termsAgreed && privacyAgreed && marketingAgreed && ageRangeAgreed;

    const handleAllAgree = () => {
      const newState = !allAgreed;
      setTermsAgreed(newState);
      setPrivacyAgreed(newState);
      setMarketingAgreed(newState);
      setAgeRangeAgreed(newState);
      if (!newState) {
        updateFormData('ageRange', '');
      }
    };

    return (
      <VStack style={{ gap: spacing(20) }}>
        <VStack style={{ alignItems: 'center', gap: spacing(12) }}>
          <Text style={{ fontSize: normalizeFontSize(40) }}>📋</Text>
          <Text style={{
            fontSize: normalizeFontSize(24),
            fontFamily: 'Pretendard-Black',
            color: isDark ? theme.text.primary : '#1a1a1a',
            letterSpacing: -0.5
          }}>
            약관 동의
          </Text>
          <Text style={{
            fontSize: normalizeFontSize(14),
            color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
            fontFamily: 'Pretendard-SemiBold',
            textAlign: 'center',
            lineHeight: normalizeFontSize(20)
          }}>
            서비스 이용을 위해{'\n'}약관에 동의해주세요
          </Text>
        </VStack>

        {/* 수집하는 개인정보 안내 - 카카오 심사용 상세 표시 */}
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8f9fa',
          borderRadius: spacing(12),
          padding: spacing(16),
          marginBottom: spacing(8),
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e9ecef'
        }}>
          <Text style={{
            fontSize: normalizeFontSize(14),
            fontFamily: 'Pretendard-ExtraBold',
            color: isDark ? theme.text.primary : '#1a1a1a',
            marginBottom: spacing(12)
          }}>
            개인정보 수집 및 이용 안내
          </Text>

          {/* 일반 회원가입 수집 항목 */}
          <View style={{
            backgroundColor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
            borderRadius: spacing(8),
            padding: spacing(12),
            marginBottom: spacing(10)
          }}>
            <Text style={{
              fontSize: normalizeFontSize(12),
              fontFamily: 'Pretendard-Bold',
              color: COLORS.gradient.primary[0],
              marginBottom: spacing(8)
            }}>
              [일반 회원가입]
            </Text>
            <View style={{ gap: spacing(6) }}>
              <HStack style={{ alignItems: 'flex-start' }}>
                <Text style={{ fontSize: normalizeFontSize(11), color: COLORS.error, fontFamily: 'Pretendard-Bold', width: 40 }}>필수</Text>
                <Text style={{ fontSize: normalizeFontSize(11), color: isDark ? theme.text.secondary : '#555', flex: 1 }}>
                  이메일, 비밀번호, 사용자명
                </Text>
              </HStack>
              <HStack style={{ alignItems: 'flex-start' }}>
                <Text style={{ fontSize: normalizeFontSize(11), color: isDark ? theme.text.tertiary : '#888', fontFamily: 'Pretendard-Bold', width: 40 }}>선택</Text>
                <Text style={{ fontSize: normalizeFontSize(11), color: isDark ? theme.text.secondary : '#555', flex: 1 }}>
                  닉네임, 연령대
                </Text>
              </HStack>
            </View>
          </View>

          {/* 소셜 로그인 수집 항목 */}
          <View style={{
            backgroundColor: isDark ? 'rgba(254, 229, 0, 0.1)' : 'rgba(254, 229, 0, 0.15)',
            borderRadius: spacing(8),
            padding: spacing(12),
            marginBottom: spacing(10)
          }}>
            <Text style={{
              fontSize: normalizeFontSize(12),
              fontFamily: 'Pretendard-Bold',
              color: '#B8860B',
              marginBottom: spacing(8)
            }}>
              [카카오/네이버 간편 로그인]
            </Text>
            <View style={{ gap: spacing(6) }}>
              <HStack style={{ alignItems: 'flex-start' }}>
                <Text style={{ fontSize: normalizeFontSize(11), color: isDark ? theme.text.tertiary : '#888', fontFamily: 'Pretendard-Bold', width: 40 }}>선택</Text>
                <Text style={{ fontSize: normalizeFontSize(11), color: isDark ? theme.text.secondary : '#555', flex: 1 }}>
                  닉네임, 이메일, 연령대
                </Text>
              </HStack>
            </View>
          </View>

          {/* 수집 목적 */}
          <View style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
            borderRadius: spacing(8),
            padding: spacing(12),
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e9ecef'
          }}>
            <Text style={{
              fontSize: normalizeFontSize(12),
              fontFamily: 'Pretendard-Bold',
              color: isDark ? theme.text.primary : '#333',
              marginBottom: spacing(8)
            }}>
              수집 목적
            </Text>
            <View style={{ gap: spacing(4) }}>
              <Text style={{ fontSize: normalizeFontSize(10), color: isDark ? theme.text.secondary : '#666', lineHeight: 16 }}>
                • 이메일/비밀번호: 회원 식별 및 로그인
              </Text>
              <Text style={{ fontSize: normalizeFontSize(10), color: isDark ? theme.text.secondary : '#666', lineHeight: 16 }}>
                • 닉네임: 서비스 내 프로필 표시
              </Text>
              <Text style={{ fontSize: normalizeFontSize(10), color: isDark ? theme.text.secondary : '#666', lineHeight: 16 }}>
                • 연령대: 연령별 맞춤 콘텐츠 및 통계 분석
              </Text>
            </View>
            <Text style={{
              fontSize: normalizeFontSize(10),
              color: isDark ? theme.text.tertiary : '#888',
              marginTop: spacing(8),
              lineHeight: 14
            }}>
              ※ 보유기간: 회원 탈퇴 시까지 (관련 법령에 따라 일부 정보는 일정 기간 보관)
            </Text>
          </View>
        </View>

        {/* 전체 동의 */}
        <Pressable
          onPress={handleAllAgree}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing(16),
            backgroundColor: isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.08)',
            borderRadius: spacing(14),
            borderWidth: 2,
            borderColor: allAgreed ? COLORS.gradient.primary[0] : 'transparent'
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: allAgreed }}
          accessibilityLabel="전체 동의"
        >
          <View style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: allAgreed ? COLORS.gradient.primary[0] : (isDark ? '#555' : '#ccc'),
            backgroundColor: allAgreed ? COLORS.gradient.primary[0] : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing(12)
          }}>
            {allAgreed && (
              <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
            )}
          </View>
          <Text style={{
            fontSize: normalizeFontSize(16),
            fontFamily: 'Pretendard-Bold',
            color: isDark ? theme.text.primary : '#1a1a1a'
          }}>
            전체 동의
          </Text>
        </Pressable>

        <View style={{ height: 1, backgroundColor: isDark ? COLORS.border.dark : COLORS.border.light, marginVertical: spacing(4) }} />

        {/* 이용약관 동의 */}
        <Pressable
          onPress={() => setTermsAgreed(!termsAgreed)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing(10),
            paddingHorizontal: spacing(4)
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAgreed }}
          accessibilityLabel="서비스 이용약관 동의 (필수)"
        >
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: termsAgreed ? COLORS.gradient.primary[0] : (isDark ? '#555' : '#ccc'),
            backgroundColor: termsAgreed ? COLORS.gradient.primary[0] : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing(12)
          }}>
            {termsAgreed && (
              <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <HStack style={{ alignItems: 'center', gap: spacing(6) }}>
              <Text style={{
                fontSize: normalizeFontSize(15),
                fontFamily: 'Pretendard-SemiBold',
                color: isDark ? theme.text.primary : '#1a1a1a'
              }}>
                서비스 이용약관
              </Text>
              <Text style={{
                fontSize: normalizeFontSize(12),
                fontFamily: 'Pretendard-Bold',
                color: COLORS.error
              }}>
                (필수)
              </Text>
            </HStack>
          </View>
          <Pressable
            onPress={() => {
              // 이용약관 페이지로 이동 (Linking 사용)
              import('react-native').then(({ Linking }) => {
                Linking.openURL('https://dayonme.com/terms.html');
              });
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{
              fontSize: normalizeFontSize(13),
              color: isDark ? '#60a5fa' : COLORS.gradient.primary[0],
              fontFamily: 'Pretendard-SemiBold'
            }}>
              보기
            </Text>
          </Pressable>
        </Pressable>

        {/* 개인정보처리방침 동의 */}
        <Pressable
          onPress={() => setPrivacyAgreed(!privacyAgreed)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing(10),
            paddingHorizontal: spacing(4)
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: privacyAgreed }}
          accessibilityLabel="개인정보처리방침 동의 (필수)"
        >
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: privacyAgreed ? COLORS.gradient.primary[0] : (isDark ? '#555' : '#ccc'),
            backgroundColor: privacyAgreed ? COLORS.gradient.primary[0] : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing(12)
          }}>
            {privacyAgreed && (
              <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <HStack style={{ alignItems: 'center', gap: spacing(6) }}>
              <Text style={{
                fontSize: normalizeFontSize(15),
                fontFamily: 'Pretendard-SemiBold',
                color: isDark ? theme.text.primary : '#1a1a1a'
              }}>
                개인정보처리방침
              </Text>
              <Text style={{
                fontSize: normalizeFontSize(12),
                fontFamily: 'Pretendard-Bold',
                color: COLORS.error
              }}>
                (필수)
              </Text>
            </HStack>
          </View>
          <Pressable
            onPress={() => {
              import('react-native').then(({ Linking }) => {
                Linking.openURL('https://dayonme.com/privacy.html');
              });
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{
              fontSize: normalizeFontSize(13),
              color: isDark ? '#60a5fa' : COLORS.gradient.primary[0],
              fontFamily: 'Pretendard-SemiBold'
            }}>
              보기
            </Text>
          </Pressable>
        </Pressable>

        {/* 마케팅 정보 수신 동의 */}
        <Pressable
          onPress={() => setMarketingAgreed(!marketingAgreed)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing(10),
            paddingHorizontal: spacing(4)
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: marketingAgreed }}
          accessibilityLabel="마케팅 정보 수신 동의 (선택)"
        >
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: marketingAgreed ? COLORS.gradient.primary[0] : (isDark ? '#555' : '#ccc'),
            backgroundColor: marketingAgreed ? COLORS.gradient.primary[0] : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing(12)
          }}>
            {marketingAgreed && (
              <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <HStack style={{ alignItems: 'center', gap: spacing(6) }}>
              <Text style={{
                fontSize: normalizeFontSize(15),
                fontFamily: 'Pretendard-SemiBold',
                color: isDark ? theme.text.primary : '#1a1a1a'
              }}>
                마케팅 정보 수신
              </Text>
              <Text style={{
                fontSize: normalizeFontSize(12),
                fontFamily: 'Pretendard-SemiBold',
                color: isDark ? theme.text.tertiary : COLORS.text.tertiary.light
              }}>
                (선택)
              </Text>
            </HStack>
          </View>
        </Pressable>

        {/* 연령대 정보 제공 동의 (카카오 심사용) */}
        <View style={{
          marginTop: spacing(4),
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
          borderRadius: spacing(12),
          padding: spacing(12),
          borderWidth: 1,
          borderColor: ageRangeAgreed ? COLORS.gradient.primary[0] : (isDark ? 'rgba(255,255,255,0.08)' : '#e9ecef')
        }}>
          <Pressable
            onPress={() => {
              const newState = !ageRangeAgreed;
              setAgeRangeAgreed(newState);
              if (!newState) {
                updateFormData('ageRange', '');
                setShowAgeRangePicker(false);
              } else {
                setShowAgeRangePicker(true);
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start'
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ageRangeAgreed }}
            accessibilityLabel="연령대 정보 제공 동의 (선택)"
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: ageRangeAgreed ? COLORS.gradient.primary[0] : (isDark ? '#555' : '#ccc'),
              backgroundColor: ageRangeAgreed ? COLORS.gradient.primary[0] : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: spacing(12),
              marginTop: spacing(2)
            }}>
              {ageRangeAgreed && (
                <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <HStack style={{ alignItems: 'center', gap: spacing(6), marginBottom: spacing(4) }}>
                <Text style={{
                  fontSize: normalizeFontSize(15),
                  fontFamily: 'Pretendard-Bold',
                  color: isDark ? theme.text.primary : '#1a1a1a'
                }}>
                  연령대 정보 제공 동의
                </Text>
                <Text style={{
                  fontSize: normalizeFontSize(12),
                  fontFamily: 'Pretendard-SemiBold',
                  color: isDark ? theme.text.tertiary : COLORS.text.tertiary.light
                }}>
                  (선택)
                </Text>
              </HStack>

              {/* 상세 안내 */}
              <View style={{
                backgroundColor: isDark ? 'rgba(102, 126, 234, 0.08)' : 'rgba(102, 126, 234, 0.05)',
                borderRadius: spacing(8),
                padding: spacing(10),
                marginTop: spacing(4)
              }}>
                <Text style={{
                  fontSize: normalizeFontSize(11),
                  fontFamily: 'Pretendard-SemiBold',
                  color: isDark ? theme.text.secondary : '#555',
                  marginBottom: spacing(6)
                }}>
                  수집 항목: 연령대 (10대, 20대, 30대 등)
                </Text>
                <Text style={{
                  fontSize: normalizeFontSize(11),
                  color: isDark ? theme.text.tertiary : '#666',
                  lineHeight: 16
                }}>
                  수집 목적: 연령별 맞춤 콘텐츠 추천, 서비스 이용 통계 분석, 사용자 경험 개선
                </Text>
                <Text style={{
                  fontSize: normalizeFontSize(10),
                  color: isDark ? theme.text.tertiary : '#888',
                  marginTop: spacing(6),
                  lineHeight: 14
                }}>
                  ※ 동의하지 않아도 서비스 이용에 제한이 없습니다
                </Text>
              </View>
            </View>
          </Pressable>

          {/* 연령대 선택 UI */}
          {ageRangeAgreed && (
            <View style={{
              marginLeft: spacing(36),
              marginTop: spacing(12),
              paddingTop: spacing(12),
              borderTopWidth: 1,
              borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#e9ecef'
            }}>
              <Text style={{
                fontSize: normalizeFontSize(13),
                fontFamily: 'Pretendard-Bold',
                color: isDark ? theme.text.primary : '#333',
                marginBottom: spacing(10)
              }}>
                연령대를 선택해주세요
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(8) }}>
                {AGE_RANGE_OPTIONS.filter(opt => opt.value !== '').map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => updateFormData('ageRange', option.value)}
                    style={{
                      paddingVertical: spacing(10),
                      paddingHorizontal: spacing(16),
                      borderRadius: spacing(20),
                      backgroundColor: formData.ageRange === option.value
                        ? COLORS.gradient.primary[0]
                        : (isDark ? 'rgba(255,255,255,0.1)' : '#e9ecef'),
                      borderWidth: 2,
                      borderColor: formData.ageRange === option.value
                        ? COLORS.gradient.primary[0]
                        : 'transparent'
                    }}
                  >
                    <Text style={{
                      fontSize: normalizeFontSize(13),
                      fontFamily: 'Pretendard-Bold',
                      color: formData.ageRange === option.value
                        ? COLORS.white
                        : (isDark ? theme.text.secondary : '#555')
                    }}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {formData.ageRange && (
                <Text style={{
                  fontSize: normalizeFontSize(12),
                  color: COLORS.gradient.primary[0],
                  fontFamily: 'Pretendard-SemiBold',
                  marginTop: spacing(10)
                }}>
                  선택됨: {AGE_RANGE_OPTIONS.find(opt => opt.value === formData.ageRange)?.label}
                </Text>
              )}
            </View>
          )}
        </View>

        <Pressable
          onPress={() => {
            if (!allRequired) {
              showAlert.error('필수 동의 필요', '서비스 이용약관과 개인정보처리방침에 동의해주세요.');
              return;
            }
            setStep(5);
          }}
          disabled={!allRequired}
          accessibilityRole="button"
          accessibilityLabel="다음 단계로"
          accessibilityState={{ disabled: !allRequired }}
          style={{ marginTop: spacing(8) }}
        >
          <LinearGradient
            colors={allRequired ? COLORS.gradient.primary : ['#ccc', '#999']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, { opacity: allRequired ? 1 : 0.6 }]}
          >
            <Text style={{
              color: COLORS.white,
              fontSize: normalizeFontSize(16),
              fontFamily: 'Pretendard-Bold',
              textAlign: 'center',
              letterSpacing: 0.3
            }}>
              다음
            </Text>
          </LinearGradient>
        </Pressable>
      </VStack>
    );
  }, [termsAgreed, privacyAgreed, marketingAgreed, ageRangeAgreed, formData.ageRange, updateFormData, spacing, normalizeFontSize, isDark, theme, styles]);

  // Step 5: 프로필 설정 (선택)
  const renderStep5 = useCallback(() => (
    <VStack style={{ gap: spacing(20) }}>
      <VStack style={{ alignItems: 'center', gap: spacing(16) }}>
        <Text style={{ fontSize: normalizeFontSize(48) }}>✨</Text>
        <Text style={{
          fontSize: normalizeFontSize(26),
          fontFamily: 'Pretendard-Black',
          color: isDark ? theme.text.primary : '#1a1a1a',
          letterSpacing: -0.5
        }}>
          거의 다 왔어요!
        </Text>
        <Text style={{
          fontSize: normalizeFontSize(15),
          color: isDark ? theme.text.secondary : COLORS.text.secondary.light,
          fontFamily: 'Pretendard-SemiBold',
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
          borderWidth: 2,
          borderColor: formData.nickname ? COLORS.gradient.primary[0] : 'transparent'
        }}
        maxLength={20}
        theme={{
          colors: {
            primary: COLORS.gradient.primary[0],
            onSurfaceVariant: isDark ? theme.text.secondary : COLORS.text.secondary.light,
            outline: 'transparent'
          },
        }}
        placeholderTextColor={isDark ? theme.text.tertiary : COLORS.placeholder.light}
        accessibilityLabel="닉네임 입력"
        accessibilityHint="선택사항입니다. 나중에 변경할 수 있습니다"
      />

      <Pressable
        onPress={handleRegister}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="가입 완료"
        accessibilityState={{ disabled: loading }}
        style={{ marginTop: spacing(14) }}
      >
        <LinearGradient
          colors={loading ? ['#ccc', '#999'] : COLORS.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
        >
          <HStack style={{ justifyContent: 'center', alignItems: 'center', gap: spacing(8) }}>
            {loading && <ActivityIndicator size="small" color={COLORS.white} />}
            <Text style={{
              color: COLORS.white,
              fontSize: normalizeFontSize(16),
              fontFamily: 'Pretendard-Bold',
              letterSpacing: 0.3
            }}>
              {loading ? '가입 중...' : '가입 완료'}
            </Text>
          </HStack>
        </LinearGradient>
      </Pressable>
    </VStack>
  ), [formData.nickname, loading, handleRegister, updateFormData, spacing, normalizeFontSize, isDark, theme, styles]);

  return (
    <View style={styles.container}>
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
                bounces={false}
                overScrollMode="never"
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
                    fontFamily: 'Pretendard-SemiBold',
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
                  {step === 5 && renderStep5()}

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
          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default RegisterScreen;
