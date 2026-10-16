// src/screens/OnboardingScreen.tsx
import React, { useState, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Button,
  TextInput,
  ProgressBar,
  Card,
  Chip,
  Surface,
  ActivityIndicator,
  IconButton
} from 'react-native-paper';
import { Box, Text, VStack, HStack, Center, Pressable } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../contexts/AlertContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { FONT_SIZES } from '../constants';

interface OnboardingData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  nickname: string;
  theme_preference: 'light' | 'dark' | 'system';
  favoriteEmotions: string[];
}

const EMOTION_OPTIONS = [
  { id: 'happy', label: '😊 행복', color: '#FFD93D' },
  { id: 'excited', label: '🤩 신남', color: '#FF6B6B' },
  { id: 'calm', label: '😌 평온', color: '#4ECDC4' },
  { id: 'grateful', label: '🙏 감사', color: '#95E1D3' },
  { id: 'confident', label: '😎 자신감', color: '#F38BA8' },
  { id: 'curious', label: '🤔 호기심', color: '#A8DADC' },
  { id: 'peaceful', label: '🕊️ 평화', color: '#B8E6B8' },
  { id: 'motivated', label: '💪 동기부여', color: '#FFB4A2' }
];

const THEME_OPTIONS = [
  { id: 'light', label: '라이트 모드', icon: 'white-balance-sunny', color: '#FFF' },
  { id: 'dark', label: '다크 모드', icon: 'moon-waning-crescent', color: '#2D3748' },
  { id: 'system', label: '시스템 설정', icon: 'cog', color: '#718096' }
];

interface OnboardingScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';
const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { theme, isDark } = useModernTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    nickname: '',
    theme_preference: 'system',
    favoriteEmotions: []
  });

  const [errors, setErrors] = useState<Partial<OnboardingData>>({});

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const newErrors: Partial<OnboardingData> = {};
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    } else if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(formData.password)) {
      newErrors.password = '비밀번호는 대소문자, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<OnboardingData> = {};
    
    if (!formData.username) {
      newErrors.username = '사용자 이름을 입력해주세요';
    } else if (formData.username.length < 2) {
      newErrors.username = '사용자 이름은 최소 2자 이상이어야 합니다';
    }
    
    if (!formData.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요';
    } else if (formData.nickname.length < 2) {
      newErrors.nickname = '닉네임은 최소 2자 이상이어야 합니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    switch (currentStep) {
      case 1:
        if (validateStep1()) {
          setCurrentStep(2);
        }
        break;
      case 2:
        if (validateStep2()) {
          setCurrentStep(3);
        }
        break;
      case 3:
        handleRegister();
        break;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      // 성공 시 메인 화면으로 이동
    } catch (error: any) {
      showAlert(
        '회원가입 실패',
        error.response?.data?.message || '회원가입 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmotion = (emotionId: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteEmotions: prev.favoriteEmotions.includes(emotionId)
        ? prev.favoriteEmotions.filter(id => id !== emotionId)
        : [...prev.favoriteEmotions, emotionId]
    }));
  };

  const renderStep1 = () => (
    <Box className="p-5">
      <Text style={{ fontSize: FONT_SIZES.h1, fontWeight: 'bold', color: theme.text.primary, marginBottom: 8, textAlign: 'center' }}>계정 정보 입력</Text>
      <Text style={{ fontSize: FONT_SIZES.bodyLarge, color: theme.text.secondary, marginBottom: 32, textAlign: 'center' }}>안전한 계정을 만들어주세요</Text>

      <TextInput
        label="이메일"
        value={formData.email}
        onChangeText={(text: string) => handleInputChange('email', text)}
        mode="outlined"
        style={{ marginBottom: 16, backgroundColor: theme.surface }}
        theme={{ colors: { text: theme.text.primary, placeholder: theme.text.secondary, primary: theme.primary } }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        textContentType="emailAddress"
        returnKeyType="next"
        blurOnSubmit={false}
        editable={true}
        selectTextOnFocus={true}
        error={!!errors.email}
      />
      {errors.email && <Text style={{ color: theme.colors.error || '#DC2626', fontSize: FONT_SIZES.small, marginBottom: 8, marginLeft: 4 }}>{errors.email}</Text>}

      <TextInput
        label="비밀번호"
        value={formData.password}
        onChangeText={(text: string) => handleInputChange('password', text)}
        mode="outlined"
        style={{ marginBottom: 8, backgroundColor: theme.surface }}
        theme={{ colors: { text: theme.text.primary, placeholder: theme.text.secondary, primary: theme.primary } }}
        secureTextEntry
        error={!!errors.password}
      />
      {errors.password && <Text style={{ color: theme.colors.error || '#DC2626', fontSize: FONT_SIZES.small, marginBottom: 8, marginLeft: 4 }}>{errors.password}</Text>}

      <TextInput
        label="비밀번호 확인"
        value={formData.confirmPassword}
        onChangeText={(text: string) => handleInputChange('confirmPassword', text)}
        mode="outlined"
        style={{ marginBottom: 8, backgroundColor: theme.surface }}
        theme={{ colors: { text: theme.text.primary, placeholder: theme.text.secondary, primary: theme.primary } }}
        secureTextEntry
        error={!!errors.confirmPassword}
      />
      {errors.confirmPassword && <Text style={{ color: theme.colors.error || '#DC2626', fontSize: FONT_SIZES.small, marginBottom: 8, marginLeft: 4 }}>{errors.confirmPassword}</Text>}
    </Box>
  );

  const renderStep2 = () => (
    <Box className="p-5">
      <Text style={{ fontSize: FONT_SIZES.h1, fontWeight: 'bold', color: theme.text.primary, marginBottom: 8, textAlign: 'center' }}>프로필 설정</Text>
      <Text style={{ fontSize: FONT_SIZES.bodyLarge, color: theme.text.secondary, marginBottom: 32, textAlign: 'center' }}>나를 소개해주세요</Text>

      <TextInput
        label="사용자 이름"
        value={formData.username}
        onChangeText={(text: string) => handleInputChange('username', text)}
        mode="outlined"
        style={{ marginBottom: 8, backgroundColor: theme.surface }}
        theme={{ colors: { text: theme.text.primary, placeholder: theme.text.secondary, primary: theme.primary } }}
        error={!!errors.username}
      />
      {errors.username && <Text style={{ color: theme.colors.error || '#DC2626', fontSize: FONT_SIZES.small, marginBottom: 8, marginLeft: 4 }}>{errors.username}</Text>}

      <TextInput
        label="닉네임"
        value={formData.nickname}
        onChangeText={(text: string) => handleInputChange('nickname', text)}
        mode="outlined"
        style={{ marginBottom: 8, backgroundColor: theme.surface }}
        theme={{ colors: { text: theme.text.primary, placeholder: theme.text.secondary, primary: theme.primary } }}
        error={!!errors.nickname}
      />
      {errors.nickname && <Text style={{ color: theme.colors.error || '#DC2626', fontSize: FONT_SIZES.small, marginBottom: 8, marginLeft: 4 }}>{errors.nickname}</Text>}

      <Text style={{ fontSize: FONT_SIZES.h3, fontWeight: 'bold', color: theme.text.primary, marginTop: 20, marginBottom: 16 }}>테마 선택</Text>
      <VStack className="gap-2">
        {THEME_OPTIONS.map((themeOption) => (
          <Surface
            key={themeOption.id}
            style={{
              borderRadius: 8,
              marginBottom: 8,
              borderWidth: formData.theme_preference === themeOption.id ? 2 : 0,
              borderColor: formData.theme_preference === themeOption.id ? theme.primary : 'transparent',
              backgroundColor: theme.surface
            }}
            elevation={isDark ? 0 : 2}
          >
            <Button
              mode={formData.theme_preference === themeOption.id ? 'contained' : 'outlined'}
              onPress={() => handleInputChange('theme_preference', themeOption.id as 'light' | 'dark' | 'system')}
              icon={themeOption.icon}
              style={{ margin: 4 }}
              buttonColor={formData.theme_preference === themeOption.id ? theme.primary : undefined}
              textColor={formData.theme_preference === themeOption.id ? '#FFF' : theme.text.primary}
            >
              {themeOption.label}
            </Button>
          </Surface>
        ))}
      </VStack>
    </Box>
  );

  const renderStep3 = () => (
    <Box className="p-5">
      <Text style={{ fontSize: FONT_SIZES.h1, fontWeight: 'bold', color: theme.text.primary, marginBottom: 8, textAlign: 'center' }}>감정 선호도</Text>
      <Text style={{ fontSize: FONT_SIZES.bodyLarge, color: theme.text.secondary, marginBottom: 32, textAlign: 'center' }}>어떤 감정을 자주 느끼시나요? (3개 이상 선택)</Text>

      <Box className="flex-row flex-wrap gap-2 mb-5">
        {EMOTION_OPTIONS.map((emotion) => (
          <Chip
            key={emotion.id}
            mode={formData.favoriteEmotions.includes(emotion.id) ? 'flat' : 'outlined'}
            selected={formData.favoriteEmotions.includes(emotion.id)}
            onPress={() => toggleEmotion(emotion.id)}
            style={{
              marginBottom: 8,
              opacity: formData.favoriteEmotions.includes(emotion.id) ? 0.75 : 1,
              backgroundColor: formData.favoriteEmotions.includes(emotion.id) ? emotion.color + '40' : isDark ? theme.surface : undefined
            }}
            textStyle={{ color: theme.text.primary }}
          >
            {emotion.label}
          </Chip>
        ))}
      </Box>

      <Text style={{ textAlign: 'center', color: theme.text.secondary, fontSize: FONT_SIZES.bodySmall }}>
        {formData.favoriteEmotions.length}/8 선택됨
      </Text>
    </Box>
  );

  return (
    <Box style={{ flex: 1, backgroundColor: theme.background }}>
      <Box style={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 20 }}>
        <ProgressBar
          progress={currentStep / 3}
          style={{
            height: 4,
            backgroundColor: isDark ? theme.border : '#d1d5db',
            borderRadius: 4
          }}
          color={theme.primary}
        />
        <HStack className="justify-between items-center mt-2">
          {currentStep > 1 && (
            <IconButton
              icon="arrow-left"
              onPress={handleBack}
              style={{ margin: 0 }}
              iconColor={theme.text.primary}
            />
          )}
          <Text style={{ fontSize: FONT_SIZES.bodyLarge, fontWeight: 'bold', color: theme.text.primary }}>{currentStep}/3</Text>
        </HStack>
      </Box>

      <Card style={{
        flex: 1,
        margin: 20,
        backgroundColor: theme.card,
        ...(isDark ? {} : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        })
      }}>
        <Card.Content>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </Card.Content>
      </Card>

      <Box style={{ padding: 20 }}>
        <Button
          mode="contained"
          onPress={handleNext}
          style={{ paddingVertical: 8, marginBottom: 8 }}
          buttonColor={theme.primary}
          textColor="#FFF"
          disabled={isLoading || (currentStep === 3 && formData.favoriteEmotions.length < 3)}
          loading={isLoading}
        >
          {currentStep === 3 ? '가입 완료' : '다음'}
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          style={{ alignSelf: 'center' }}
          textColor={theme.text.secondary}
        >
          이미 계정이 있으신가요? 로그인
        </Button>
      </Box>
    </Box>
  );
};


export default OnboardingScreen;