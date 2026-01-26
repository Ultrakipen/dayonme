// src/screens/ResetPasswordScreen.tsx - 비밀번호 재설정 화면
import React, { useState, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  StatusBar,
  useWindowDimensions,
  Animated
} from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Pressable } from 'react-native';
import { Box, Text, VStack } from '../components/ui';
import { API_CONFIG } from '../config/api';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalize, normalizeSpace } from '../utils/responsive';
import { isValidPassword } from '../utils/validation';
import { FONT_SIZES } from '../constants';
import { showModernToast } from '../components/ModernToast';

const ResetPasswordScreen = ({ navigation, route }: any) => {
  const { theme, isDark } = useModernTheme();
  const { height } = useWindowDimensions();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);

  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);
  const matchCheckScale = useRef(new Animated.Value(0)).current;

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, color: '#e0e0e0', label: '' };
    let strength = 0;
    if (pwd.length >= 8) strength += 20;
    if (/[A-Z]/.test(pwd)) strength += 20;
    if (/[a-z]/.test(pwd)) strength += 20;
    if (/\d/.test(pwd)) strength += 20;
    if (/[!@#$%^&*]/.test(pwd)) strength += 20;
    let color = '#FF3040', label = '약함';
    if (strength >= 80) { color = '#00C851'; label = '강함'; }
    else if (strength >= 60) { color = '#FFB300'; label = '보통'; }
    return { strength, color, label };
  };

  // 비밀번호 요구사항 체크
  const getPasswordRequirements = (pwd: string) => {
    console.log('🔍 getPasswordRequirements called with:', pwd);
    return [
      {
        label: '8자 이상',
        met: pwd.length >= 8,
        icon: 'text'
      },
      {
        label: '영문 대문자 포함 (A-Z)',
        met: /[A-Z]/.test(pwd),
        icon: 'text-outline'
      },
      {
        label: '영문 소문자 포함 (a-z)',
        met: /[a-z]/.test(pwd),
        icon: 'text-outline'
      },
      {
        label: '숫자 포함 (0-9)',
        met: /\d/.test(pwd),
        icon: 'calculator-outline'
      },
      {
        label: '특수문자 포함 (!@#$%^&*)',
        met: /[!@#$%^&*]/.test(pwd),
        icon: 'star-outline'
      }
    ];
  };

  // URL 파라미터에서 토큰 가져오기
  const token = route.params?.token;

  useEffect(() => {
    // 토큰 유효성 확인
    checkToken();
  }, []);

  const checkToken = async () => {
    if (!token) {
      showModernToast('error', '유효하지 않은 재설정 링크입니다.');
      setTimeout(() => navigation.navigate('Login'), 2000);
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
        showModernToast('error', data.message || '유효하지 않거나 만료된 재설정 링크입니다.');
        setTimeout(() => navigation.navigate('Login'), 2000);
      }
    } catch (error: unknown) {
      showModernToast('error', '서버와의 연결에 실패했습니다. 다시 시도해주세요.');
      setTimeout(() => navigation.navigate('Login'), 2000);
    } finally {
      setIsCheckingToken(false);
    }
  };

  // 비밀번호 일치 여부 실시간 체크
  useEffect(() => {
    if (password && confirmPassword) {
      const match = password === confirmPassword;
      setIsPasswordMatch(match);

      // 일치하면 에러 클리어
      if (match) {
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
      }

      // 애니메이션 효과
      Animated.spring(matchCheckScale, {
        toValue: match ? 1 : 0,
        useNativeDriver: true,
        friction: 5,
      }).start();
    } else {
      setIsPasswordMatch(false);
      matchCheckScale.setValue(0);
    }
  }, [password, confirmPassword]);

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
    console.log('🔐 비밀번호 변경 시작');
    console.log('📝 입력값:', {
      password: password ? '***' : '없음',
      confirmPassword: confirmPassword ? '***' : '없음',
      passwordLength: password.length,
      hasToken: !!token
    });

    if (!validateForm()) {
      console.log('❌ 폼 유효성 검사 실패');
      showModernToast('error', '입력한 정보를 다시 확인해주세요.');
      return;
    }

    console.log('✅ 폼 유효성 검사 통과');
    setIsLoading(true);

    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/auth/reset-password`;
      console.log('📡 API 호출 시작:', apiUrl);
      console.log('📤 요청 데이터:', { token: token ? '있음' : '없음', newPassword: '***' });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password
        }),
      });

      console.log('📥 응답 상태:', response.status, response.ok);

      const contentType = response.headers.get('content-type');
      console.log('📋 응답 타입:', contentType);

      let data;
      try {
        data = await response.json();
        console.log('📦 응답 데이터:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.log('❌ JSON 파싱 실패:', parseError);
        const text = await response.text();
        console.log('📄 응답 텍스트:', text);
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }

      if (response.ok && data.status === 'success') {
        console.log('✅ 비밀번호 변경 성공');
        showModernToast('success', '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.');
        setTimeout(() => {
          console.log('🔄 로그인 화면으로 이동');
          navigation.navigate('Login');
        }, 2000);
      } else {
        console.log('❌ 비밀번호 변경 실패:', data.message);
        showModernToast('error', data.message || '비밀번호 재설정 중 오류가 발생했습니다.');
      }
    } catch (error: unknown) {
      console.log('❌ API 호출 오류:', error);
      if (error instanceof Error) {
        console.log('오류 메시지:', error.message);
        console.log('오류 스택:', error.stack);
      }
      showModernToast('error', '서버와의 연결에 실패했습니다. 네트워크 연결을 확인해주세요.');
    } finally {
      console.log('🔚 처리 완료, 로딩 상태 해제');
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={{ color: '#1a1a1a', fontSize: FONT_SIZES.h3, marginTop: normalizeSpace(20), fontFamily: 'Pretendard-SemiBold' }}>
          링크 확인 중...
        </Text>
      </View>
    );
  }

  if (!tokenValid) {
    return null; // Alert가 표시되고 로그인 화면으로 이동
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: normalizeSpace(20),
                  paddingVertical: normalizeSpace(40),
                  paddingBottom: normalizeSpace(60)
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={{
                  backgroundColor: '#ffffff',
                  borderRadius: normalize(20),
                  padding: normalizeSpace(24),
                  width: '100%',
                  maxWidth: normalize(360),
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: normalize(4) },
                  shadowOpacity: 0.1,
                  shadowRadius: normalize(12),
                  elevation: 5
                }}>
                  <VStack style={{ gap: normalizeSpace(20) }}>
                    {/* 헤더 섹션 */}
                    <VStack style={{ alignItems: 'center', gap: normalizeSpace(14) }}>
                      <View style={{
                        width: normalize(64),
                        height: normalize(64),
                        borderRadius: normalize(32),
                        backgroundColor: '#f0f0f0',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#667eea',
                        shadowOffset: { width: 0, height: normalize(4) },
                        shadowOpacity: 0.2,
                        shadowRadius: normalize(8),
                        elevation: 6
                      }}>
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={{
                            width: normalize(48),
                            height: normalize(48),
                            borderRadius: normalize(24),
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Icon name="key" size={normalize(24)} color="#fff" />
                        </LinearGradient>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{
                          fontSize: FONT_SIZES.h2,
                          fontFamily: 'Pretendard-Bold',
                          color: '#1a1a1a',
                          letterSpacing: -0.3,
                          marginBottom: normalizeSpace(6)
                        }}>
                          새 비밀번호 설정
                        </Text>
                        {userEmail && (
                          <Text style={{
                            fontSize: FONT_SIZES.caption,
                            color: '#667eea',
                            fontFamily: 'Pretendard-Medium',
                            textAlign: 'center',
                            marginBottom: normalizeSpace(4)
                          }}>
                            {userEmail}
                          </Text>
                        )}
                        <Text style={{
                          fontSize: FONT_SIZES.caption,
                          color: '#666',
                          fontFamily: 'Pretendard-Regular',
                          textAlign: 'center',
                          lineHeight: normalize(18),
                          paddingHorizontal: normalizeSpace(8)
                        }}>
                          새로운 비밀번호를 입력해주세요
                        </Text>
                      </View>
                    </VStack>

                    {/* 비밀번호 입력 섹션 */}
                    <VStack style={{ gap: normalizeSpace(14) }}>
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          ref={passwordRef}
                          placeholder="새 비밀번호"
                          placeholderTextColor="#999"
                          value={password}
                          onChangeText={setPassword}
                          mode="outlined"
                          style={{
                            backgroundColor: '#f8f8f8',
                            borderRadius: normalize(14),
                            fontSize: FONT_SIZES.body,
                            fontFamily: 'Pretendard-Medium',
                            color: '#1a1a1a'
                          }}
                          contentStyle={{
                            paddingHorizontal: normalizeSpace(16),
                            paddingVertical: normalizeSpace(14),
                            paddingRight: normalizeSpace(50),
                            fontSize: FONT_SIZES.body
                          }}
                          outlineStyle={{
                            borderRadius: normalize(14),
                            borderWidth: 2,
                            borderColor: errors.password ? '#FF3040' : password ? '#667eea' : '#e0e0e0'
                          }}
                          secureTextEntry={!showPassword}
                          autoComplete="password-new"
                          autoCorrect={false}
                          textContentType="newPassword"
                          returnKeyType="next"
                          editable={!isLoading}
                          selectTextOnFocus={true}
                          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                          theme={{
                            colors: {
                              primary: '#667eea',
                              onSurfaceVariant: '#999',
                              outline: 'transparent',
                              text: '#1a1a1a'
                            },
                          }}
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: normalizeSpace(14), top: normalizeSpace(16) }}>
                          <Icon name={showPassword ? 'eye-off' : 'eye'} size={normalize(22)} color="#666" />
                        </Pressable>

                        {/* 비밀번호 요구사항 체크리스트 */}
                        {password && (
                          <View style={{ marginTop: normalizeSpace(10), marginHorizontal: normalizeSpace(6) }}>
                            <Text style={{ color: '#666', fontSize: FONT_SIZES.caption, fontFamily: 'Pretendard-SemiBold', marginBottom: normalizeSpace(8) }}>
                              비밀번호 요구사항
                            </Text>
                            {getPasswordRequirements(password).map((req, index) => (
                              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: normalizeSpace(6) }}>
                                <View style={{
                                  width: normalize(18),
                                  height: normalize(18),
                                  borderRadius: normalize(9),
                                  backgroundColor: req.met ? '#00C851' : '#e0e0e0',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  marginRight: normalizeSpace(8)
                                }}>
                                  {req.met && (
                                    <Icon name="checkmark" size={normalize(12)} color="#fff" />
                                  )}
                                </View>
                                <Text style={{
                                  color: req.met ? '#00A040' : '#666',
                                  fontSize: FONT_SIZES.caption,
                                  fontFamily: req.met ? 'Pretendard-SemiBold' : 'Pretendard-Regular'
                                }}>
                                  {req.label}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* 비밀번호 강도 표시 */}
                        {password && (() => { const ps = calculatePasswordStrength(password); return (
                          <View style={{ marginTop: normalizeSpace(10), marginHorizontal: normalizeSpace(6) }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: normalizeSpace(6) }}>
                              <Text style={{ color: '#666', fontSize: FONT_SIZES.caption, fontFamily: 'Pretendard-SemiBold' }}>비밀번호 강도</Text>
                              <Text style={{ color: ps.color, fontSize: FONT_SIZES.caption, fontFamily: 'Pretendard-Bold' }}>{ps.label}</Text>
                            </View>
                            <View style={{ height: normalize(5), backgroundColor: '#e0e0e0', borderRadius: normalize(3) }}>
                              <View style={{ height: '100%', width: `${ps.strength}%`, backgroundColor: ps.color, borderRadius: normalize(3) }} />
                            </View>
                          </View>
                        ); })()}

                        {errors.password && (
                          <Text style={{ color: '#FF3040', fontSize: FONT_SIZES.caption, marginTop: normalizeSpace(8), marginLeft: normalizeSpace(6), fontFamily: 'Pretendard-SemiBold' }}>
                            {errors.password}
                          </Text>
                        )}
                      </View>

                      <View style={{ position: 'relative' }}>
                        <TextInput
                          ref={confirmPasswordRef}
                          placeholder="새 비밀번호 확인"
                          placeholderTextColor="#999"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          mode="outlined"
                          style={{
                            backgroundColor: '#f8f8f8',
                            borderRadius: normalize(14),
                            fontSize: FONT_SIZES.body,
                            fontFamily: 'Pretendard-Medium',
                            color: '#1a1a1a'
                          }}
                          contentStyle={{
                            paddingHorizontal: normalizeSpace(16),
                            paddingVertical: normalizeSpace(14),
                            paddingRight: normalizeSpace(isPasswordMatch ? 90 : 50),
                            fontSize: FONT_SIZES.body
                          }}
                          outlineStyle={{
                            borderRadius: normalize(14),
                            borderWidth: 2,
                            borderColor: errors.confirmPassword ? '#FF3040' : isPasswordMatch ? '#00C851' : confirmPassword ? '#667eea' : '#e0e0e0'
                          }}
                          secureTextEntry={!showConfirmPassword}
                          autoComplete="password-new"
                          autoCorrect={false}
                          textContentType="newPassword"
                          returnKeyType="done"
                          editable={!isLoading}
                          selectTextOnFocus={true}
                          onSubmitEditing={handleResetPassword}
                          theme={{
                            colors: {
                              primary: '#667eea',
                              onSurfaceVariant: '#999',
                              outline: 'transparent',
                              text: '#1a1a1a'
                            },
                          }}
                        />
                        {/* 비밀번호 일치 표시 아이콘 */}
                        {isPasswordMatch && (
                          <Animated.View style={{
                            position: 'absolute',
                            right: normalizeSpace(54),
                            top: normalizeSpace(16),
                            transform: [
                              { scale: matchCheckScale }
                            ]
                          }}>
                            <View style={{
                              width: normalize(24),
                              height: normalize(24),
                              borderRadius: normalize(12),
                              backgroundColor: '#00C851',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <Icon name="checkmark" size={normalize(14)} color="#fff" />
                            </View>
                          </Animated.View>
                        )}

                        {/* 비밀번호 보기/숨기기 버튼 */}
                        <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: normalizeSpace(14), top: normalizeSpace(16) }}>
                          <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={normalize(22)} color="#666" />
                        </Pressable>

                        {errors.confirmPassword && (
                          <Text style={{
                            color: '#FF3040',
                            fontSize: FONT_SIZES.caption,
                            marginTop: normalizeSpace(8),
                            marginLeft: normalizeSpace(6),
                            fontFamily: 'Pretendard-SemiBold'
                          }}>
                            {errors.confirmPassword}
                          </Text>
                        )}
                        {/* 비밀번호 일치 시 긍정 메시지 */}
                        {isPasswordMatch && !errors.confirmPassword && (
                          <Text style={{
                            color: '#00C851',
                            fontSize: FONT_SIZES.caption,
                            marginTop: normalizeSpace(8),
                            marginLeft: normalizeSpace(6),
                            fontFamily: 'Pretendard-SemiBold'
                          }}>
                            비밀번호가 일치합니다
                          </Text>
                        )}
                      </View>
                    </VStack>

                    {/* 제출 버튼 섹션 */}
                    <VStack style={{ gap: normalizeSpace(12), marginTop: normalizeSpace(8) }}>
                      <Pressable onPress={handleResetPassword} disabled={isLoading}>
                        <LinearGradient
                          colors={isLoading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            borderRadius: normalize(14),
                            paddingVertical: normalizeSpace(16),
                            paddingHorizontal: normalizeSpace(20),
                            shadowColor: '#667eea',
                            shadowOffset: { width: 0, height: normalize(6) },
                            shadowOpacity: 0.3,
                            shadowRadius: normalize(12),
                            elevation: 8,
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
                                color="#ffffff"
                                style={{ marginRight: normalizeSpace(10) }}
                              />
                            )}
                            <Text style={{
                              color: '#ffffff',
                              fontSize: FONT_SIZES.h4,
                              fontFamily: 'Pretendard-Bold',
                              textAlign: 'center',
                              letterSpacing: -0.3
                            }}>
                              {isLoading ? '처리 중...' : '비밀번호 변경'}
                            </Text>
                          </View>
                        </LinearGradient>
                      </Pressable>

                      {/* 로그인으로 돌아가기 */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: normalizeSpace(8)
                      }}>
                        <Text style={{
                          color: '#666',
                          fontSize: FONT_SIZES.body,
                          fontFamily: 'Pretendard-Regular'
                        }}>
                          비밀번호가 기억나셨나요?{' '}
                        </Text>
                        <Pressable onPress={() => navigation.navigate('Login')}>
                          <Text style={{
                            color: '#667eea',
                            fontSize: FONT_SIZES.body,
                            fontFamily: 'Pretendard-Bold'
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
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

export default ResetPasswordScreen;
