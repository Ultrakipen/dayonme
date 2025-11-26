// src/screens/ResetPasswordScreen.tsx - 비밀번호 재설정 화면
import React, { useState, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  StatusBar
} from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { Box, Text, VStack } from '../components/ui';
import { API_CONFIG } from '../config/api';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalize, normalizeSpace } from '../utils/responsive';
import { isValidPassword } from '../utils/validation';
import { FONT_SIZES } from '../constants';

const ResetPasswordScreen = ({ navigation, route }: any) => {
  const { theme, isDark } = useModernTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);

  // URL 파라미터에서 토큰 가져오기
  const token = route.params?.token;

  useEffect(() => {
    // 토큰 유효성 확인
    checkToken();
  }, []);

  const checkToken = async () => {
    if (!token) {
      Alert.alert(
        '오류',
        '유효하지 않은 재설정 링크입니다.',
        [{ text: '확인', onPress: () => navigation.navigate('Login') }]
      );
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/check-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setTokenValid(true);
        setUserEmail(data.data?.email || '');
      } else {
        Alert.alert(
          '오류',
          data.message || '유효하지 않거나 만료된 재설정 링크입니다.',
          [{ text: '확인', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        '오류',
        '서버와의 연결에 실패했습니다. 다시 시도해주세요.',
        [{ text: '확인', onPress: () => navigation.navigate('Login') }]
      );
    } finally {
      setIsCheckingToken(false);
    }
  };

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = '새 비밀번호를 입력해주세요';
    } else if (!isValidPassword(password)) {
      newErrors.password = '비밀번호는 8자 이상, 영문 대소문자, 숫자, 특수문자를 포함해야 합니다';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          '비밀번호 재설정 완료',
          '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert(
          '오류',
          data.message || '비밀번호 재설정 중 오류가 발생했습니다.'
        );
      }
    } catch (error: any) {
      Alert.alert(
        '오류',
        '서버와의 연결에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  if (isCheckingToken) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <LinearGradient
          colors={isDark ? ['#4a5568', '#2d3748', '#1a202c'] : ['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={{ color: colors.text, fontSize: FONT_SIZES.h3, marginTop: 20, fontWeight: '600' }}>
            링크 확인 중...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (!tokenValid) {
    return null; // Alert가 표시되고 로그인 화면으로 이동
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'light-content'} backgroundColor="transparent" translucent />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <LinearGradient
            colors={isDark ? ['#4a5568', '#2d3748', '#1a202c'] : ['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 32,
                  paddingVertical: 60,
                  minHeight: height
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={{
                  backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 32,
                  padding: 32,
                  width: '100%',
                  maxWidth: 380,
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOffset: { width: 0, height: 20 },
                  shadowOpacity: isDark ? 0.4 : 0.25,
                  shadowRadius: 30,
                  elevation: 20,
                  backdropFilter: 'blur(20px)'
                }}>
                  <VStack className="space-y-10">
                    {/* 헤더 섹션 */}
                    <VStack className="items-center space-y-6">
                      <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: theme.bg.card,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: isDark ? '#000' : '#667eea',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: isDark ? 0.5 : 0.3,
                        shadowRadius: 16,
                        elevation: 12
                      }}>
                        <LinearGradient
                          colors={isDark ? ['#4a5568', '#2d3748'] : ['#667eea', '#764ba2']}
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{
                            fontSize: 28,
                            fontWeight: '900',
                            color: theme.textPrimary
                          }}>
                            🔑
                          </Text>
                        </LinearGradient>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{
                          fontSize: 48,
                          fontWeight: '900',
                          color: theme.textPrimary,
                          letterSpacing: -1.2,
                          marginBottom: 12,
                          textShadowColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2
                        }}>
                          새 비밀번호 설정
                        </Text>
                        {userEmail && (
                          <Text style={{
                            fontSize: FONT_SIZES.body,
                            color: isDark ? theme.primary : '#667eea',
                            fontWeight: '600',
                            textAlign: 'center',
                            marginBottom: 8
                          }}>
                            {userEmail}
                          </Text>
                        )}
                        <Text style={{
                          fontSize: FONT_SIZES.h4,
                          color: theme.textSecondary,
                          fontWeight: '600',
                          textAlign: 'center',
                          lineHeight: 26,
                          paddingHorizontal: 12
                        }}>
                          새로운 비밀번호를 입력해주세요
                        </Text>
                      </View>
                    </VStack>

                    {/* 비밀번호 입력 섹션 */}
                    <VStack className="space-y-6">
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          ref={passwordRef}
                          placeholder="새 비밀번호"
                          placeholderTextColor={theme.textSecondary}
                          value={password}
                          onChangeText={setPassword}
                          mode="outlined"
                          style={{
                            backgroundColor: theme.bg.card,
                            borderRadius: 16,
                            fontSize: FONT_SIZES.h4,
                            fontWeight: '600',
                            color: theme.textPrimary
                          }}
                          contentStyle={{
                            paddingHorizontal: 20,
                            paddingVertical: 18,
                            fontSize: FONT_SIZES.h4
                          }}
                          outlineStyle={{
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: errors.password ? '#FF3040' : password ? (isDark ? theme.primary : '#667eea') : 'transparent'
                          }}
                          secureTextEntry
                          autoComplete="password-new"
                          autoCorrect={false}
                          textContentType="newPassword"
                          returnKeyType="next"
                          editable={!isLoading}
                          selectTextOnFocus={true}
                          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                          theme={{
                            colors: {
                              primary: isDark ? theme.primary : '#667eea',
                              onSurfaceVariant: theme.textSecondary,
                              outline: 'transparent',
                              text: theme.textPrimary
                            },
                          }}
                        />
                        {errors.password && (
                          <Text style={{
                            color: '#FF3040',
                            fontSize: FONT_SIZES.bodySmall,
                            marginTop: 10,
                            marginLeft: 6,
                            fontWeight: '700'
                          }}>
                            {errors.password}
                          </Text>
                        )}
                      </View>

                      <View style={{ position: 'relative' }}>
                        <TextInput
                          ref={confirmPasswordRef}
                          placeholder="새 비밀번호 확인"
                          placeholderTextColor={theme.textSecondary}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          mode="outlined"
                          style={{
                            backgroundColor: theme.bg.card,
                            borderRadius: 16,
                            fontSize: FONT_SIZES.h4,
                            fontWeight: '600',
                            color: theme.textPrimary
                          }}
                          contentStyle={{
                            paddingHorizontal: 20,
                            paddingVertical: 18,
                            fontSize: FONT_SIZES.h4
                          }}
                          outlineStyle={{
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: errors.confirmPassword ? '#FF3040' : confirmPassword ? (isDark ? theme.primary : '#667eea') : 'transparent'
                          }}
                          secureTextEntry
                          autoComplete="password-new"
                          autoCorrect={false}
                          textContentType="newPassword"
                          returnKeyType="done"
                          editable={!isLoading}
                          selectTextOnFocus={true}
                          onSubmitEditing={handleResetPassword}
                          theme={{
                            colors: {
                              primary: isDark ? theme.primary : '#667eea',
                              onSurfaceVariant: theme.textSecondary,
                              outline: 'transparent',
                              text: theme.textPrimary
                            },
                          }}
                        />
                        {errors.confirmPassword && (
                          <Text style={{
                            color: '#FF3040',
                            fontSize: FONT_SIZES.bodySmall,
                            marginTop: 10,
                            marginLeft: 6,
                            fontWeight: '700'
                          }}>
                            {errors.confirmPassword}
                          </Text>
                        )}
                      </View>
                    </VStack>

                    {/* 제출 버튼 섹션 */}
                    <VStack className="space-y-6">
                      <TouchableWithoutFeedback onPress={handleResetPassword}>
                        <LinearGradient
                          colors={isLoading ? ['#ccc', '#999'] : (isDark ? ['#4a5568', '#2d3748'] : ['#667eea', '#764ba2'])}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            borderRadius: 16,
                            paddingVertical: 18,
                            paddingHorizontal: 24,
                            shadowColor: isDark ? '#000' : '#667eea',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: isDark ? 0.5 : 0.3,
                            shadowRadius: 16,
                            elevation: 12,
                            opacity: isLoading ? 0.7 : 1
                          }}
                        >
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            {isLoading && (
                              <ActivityIndicator
                                size="small"
                                color={theme.textPrimary}
                                style={{ marginRight: 12 }}
                              />
                            )}
                            <Text style={{
                              color: theme.textPrimary,
                              fontSize: FONT_SIZES.h3,
                              fontWeight: '800',
                              textAlign: 'center',
                              letterSpacing: 0.3
                            }}>
                              {isLoading ? '처리 중...' : '비밀번호 변경'}
                            </Text>
                          </View>
                        </LinearGradient>
                      </TouchableWithoutFeedback>

                      {/* 로그인으로 돌아가기 */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 12
                      }}>
                        <Text style={{
                          color: theme.textSecondary,
                          fontSize: FONT_SIZES.bodyLarge,
                          fontWeight: '400'
                        }}>
                          비밀번호가 기억나셨나요?{' '}
                        </Text>
                        <TouchableWithoutFeedback onPress={() => navigation.navigate('Login')}>
                          <Text style={{
                            color: isDark ? theme.primary : '#667eea',
                            fontSize: FONT_SIZES.h4,
                            fontWeight: '700'
                          }}>
                            로그인
                          </Text>
                        </TouchableWithoutFeedback>
                      </View>
                    </VStack>
                  </VStack>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

export default ResetPasswordScreen;
