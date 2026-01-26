import React, { useMemo } from 'react';
import {
  Modal,
  View,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
  StyleSheet,
  Text as RNText,
  useColorScheme,
  Platform,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text, VStack, HStack } from './ui';
import { moderateScale } from '../constants';
import { ModernThemeContext } from '../contexts/ModernThemeContext';

// React Native 0.80 호환성: 런타임에 스케일 값 계산
const getScaledValues = () => ({
  ms2: moderateScale(2),
  ms3: moderateScale(3),
  ms4: moderateScale(4),
  ms6: moderateScale(6),
  ms8: moderateScale(8),
  ms10: moderateScale(10),
  ms12: moderateScale(12),
  ms13: moderateScale(13),
  ms14: moderateScale(14),
  ms15: moderateScale(15),
  ms16: moderateScale(16),
  ms18: moderateScale(18),
  ms20: moderateScale(20),
  ms22: moderateScale(22),
  ms24: moderateScale(24),
  ms32: moderateScale(32),
  ms36: moderateScale(36),
  ms60: moderateScale(60),
  ms64: moderateScale(64),
  ms360: moderateScale(360),
  ms400: moderateScale(400),
});

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
  onDismiss?: () => void;
  variant?: 'default' | 'compact' | 'toast'; // 토스트 모드 추가
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: '확인', style: 'default' }],
  onDismiss,
  variant = 'default',
}) => {
  const scheme = useColorScheme();
  const themeContext = React.useContext(ModernThemeContext);

  // React Native 0.80 호환성: 런타임에 스케일 값 계산
  const sv = useMemo(() => getScaledValues(), []);

  // 테마 컨텍스트가 있으면 사용, 없으면 시스템 테마 사용
  const isDark = themeContext ? themeContext.isDark : scheme === 'dark';

  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;
  const slideValue = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideValue, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideValue, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    // 먼저 Alert 닫기
    if (onDismiss) {
      onDismiss();
    }

    // 그 다음 콜백 실행
    if (button.onPress) {
      setTimeout(() => {
        button.onPress?.();
      }, 200);
    }
  };

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          name: 'check-circle',
          color: isDark ? '#34D399' : '#10B981',
          bgColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#D1FAE5',
          gradient: ['#10B981', '#059669']
        };
      case 'error':
        return {
          name: 'close-circle',
          color: isDark ? '#F87171' : '#EF4444',
          bgColor: isDark ? 'rgba(248, 113, 113, 0.15)' : '#FEE2E2',
          gradient: ['#EF4444', '#DC2626']
        };
      case 'warning':
        return {
          name: 'alert-circle',
          color: isDark ? '#FBBF24' : '#F59E0B',
          bgColor: isDark ? 'rgba(251, 191, 36, 0.15)' : '#FEF3C7',
          gradient: ['#F59E0B', '#D97706']
        };
      default:
        return {
          name: 'information',
          color: isDark ? '#60A5FA' : '#667eea',
          bgColor: isDark ? 'rgba(96, 165, 250, 0.15)' : '#EEF2FF',
          gradient: ['#667eea', '#764ba2']
        };
    }
  };

  const getButtonGradient = (style?: string) => {
    switch (style) {
      case 'destructive':
        return isDark ? ['#DC2626', '#991B1B'] : ['#EF4444', '#DC2626'];
      case 'cancel':
        return isDark ? ['#374151', '#1F2937'] : ['#F3F4F6', '#E5E7EB'];
      default:
        return ['#667eea', '#764ba2'];
    }
  };

  const getButtonTextColor = (style?: string) => {
    if (style === 'cancel') {
      return isDark ? '#F9FAFB' : '#1F2937';
    }
    return '#FFFFFF';
  };

  const iconConfig = getIconConfig();

  const colors = {
    background: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1a1a1a',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    backdrop: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => onDismiss?.()}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={variant === 'toast' ? undefined : handleBackdropPress}>
        <Animated.View
          style={[
            variant === 'toast' ? styles.toastBackdrop : styles.backdrop,
            variant === 'toast'
              ? { paddingHorizontal: sv.ms16, paddingTop: sv.ms60 }
              : { paddingHorizontal: sv.ms24 },
            {
              opacity: variant === 'toast' ? 1 : opacityValue,
              backgroundColor: variant === 'toast' ? 'transparent' : colors.backdrop,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                variant === 'toast'
                  ? [styles.toastContainer, { maxWidth: sv.ms400 }]
                  : [styles.container, { maxWidth: sv.ms360 }],
                {
                  transform: variant === 'toast'
                    ? [{ translateY: slideValue }]
                    : [{ scale: scaleValue }, { translateY: slideValue }],
                  opacity: opacityValue,
                },
              ]}
            >
              <View style={[
                styles.alertBox,
                {
                  backgroundColor: colors.background,
                  borderRadius: sv.ms20,
                  padding: sv.ms20,
                  shadowOffset: { width: 0, height: sv.ms12 },
                  shadowRadius: sv.ms20,
                },
                variant === 'compact' && { padding: sv.ms14, borderRadius: sv.ms18 },
                variant === 'toast' && { borderRadius: sv.ms14, padding: sv.ms14, paddingHorizontal: sv.ms16, shadowOffset: { width: 0, height: sv.ms4 }, shadowRadius: sv.ms10 }
              ]}>
                {/* 토스트 모드 */}
                {variant === 'toast' ? (
                  <HStack style={[styles.toastContent, { gap: sv.ms10 }]}>
                    <MaterialCommunityIcons
                      name={iconConfig.name}
                      size={sv.ms22}
                      color={iconConfig.color}
                    />
                    <RNText style={[styles.toastMessage, { color: colors.text, fontSize: sv.ms14 }]}>
                      {title || message}
                    </RNText>
                  </HStack>
                ) : (
                  <>
                    {/* 아이콘 - compact 모드에서는 숨김 */}
                    {variant !== 'compact' && (
                      <View style={[styles.iconContainer, {
                        backgroundColor: iconConfig.bgColor,
                        width: sv.ms64,
                        height: sv.ms64,
                        borderRadius: sv.ms32,
                        marginBottom: sv.ms14,
                        borderWidth: sv.ms2,
                      }]}>
                        <MaterialCommunityIcons
                          name={iconConfig.name}
                          size={sv.ms36}
                          color={iconConfig.color}
                        />
                      </View>
                    )}

                    {/* 타이틀 & 메시지 - compact 모드에서는 숨김 */}
                    {variant !== 'compact' && (
                      <View style={[styles.textContainer, { marginBottom: sv.ms20, paddingHorizontal: sv.ms4 }]}>
                        {title && (
                          <RNText style={[styles.title, {
                            color: colors.text,
                            fontSize: sv.ms18,
                            marginBottom: sv.ms6,
                            lineHeight: sv.ms24,
                          }]}>
                            {title}
                          </RNText>
                        )}
                        {message && (
                          <RNText style={[styles.message, {
                            color: colors.textSecondary,
                            fontSize: sv.ms14,
                            lineHeight: sv.ms20,
                          }]}>
                            {message}
                          </RNText>
                        )}
                      </View>
                    )}

                    {/* 버튼 영역 */}
                    <View style={[
                      styles.buttonContainer,
                      { gap: sv.ms8 },
                      variant === 'compact' && { gap: sv.ms6 }
                    ]}>
                      {buttons.map((button, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleButtonPress(button)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={getButtonGradient(button.style)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                              variant === 'compact'
                                ? [styles.compactButton, { borderRadius: sv.ms10, paddingVertical: sv.ms12 }]
                                : [styles.button, { borderRadius: sv.ms12, paddingVertical: sv.ms13 }],
                              index > 0 && { marginTop: sv.ms10 }
                            ]}
                          >
                            <RNText
                              style={[
                                variant === 'compact'
                                  ? [styles.compactButtonText, { fontSize: sv.ms14 }]
                                  : [styles.buttonText, { fontSize: sv.ms15 }],
                                { color: getButtonTextColor(button.style) },
                              ]}
                            >
                              {button.text}
                            </RNText>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// React Native 0.80 호환성: StyleSheet에서 moderateScale 모듈 레벨 호출 제거
// 동적 스케일 값은 컴포넌트 내부에서 인라인 스타일로 적용
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
  },
  // 토스트 모드 백드롭 & 컨테이너
  toastBackdrop: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  toastContainer: {
    width: '100%',
  },
  alertBox: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOpacity: 0.12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {},
  title: {
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  message: {
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    shadowColor: '#667eea',
    shadowOpacity: 0.15,
    elevation: 6,
    overflow: 'hidden',
  },
  buttonText: {
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    letterSpacing: -0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // 컴팩트 모드 스타일
  compactAlertBox: {},
  compactButtonContainer: {},
  compactButton: {
    shadowColor: '#667eea',
    shadowOpacity: 0.12,
    elevation: 5,
    overflow: 'hidden',
  },
  compactButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    letterSpacing: -0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // 토스트 모드 스타일
  toastBox: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    elevation: 8,
  },
  toastContent: {
    alignItems: 'center',
  },
  toastMessage: {
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.2,
    flex: 1,
  },
});

// 전역 Alert 관리 클래스
class AlertManager {
  private static instance: AlertManager;
  private currentAlert: {
    visible: boolean;
    title?: string;
    message?: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: AlertButton[];
    variant?: 'default' | 'compact' | 'toast';
  } = { visible: false };
  private listeners: Array<(alert: any) => void> = [];

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  subscribe(listener: (alert: any) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: 'success' | 'error' | 'warning' | 'info',
    variant?: 'default' | 'compact'
  ) {
    // 새 알림으로 즉시 교체
    this.currentAlert = {
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: '확인' }],
      type: type || this.detectType(title),
      variant: variant || 'default',
    };
    this.notifyListeners();
  }

  hide() {
    this.currentAlert = { visible: false };
    this.notifyListeners();
  }

  private detectType(title: string): 'success' | 'error' | 'warning' | 'info' {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('성공') || titleLower.includes('완료')) return 'success';
    if (titleLower.includes('오류') || titleLower.includes('실패')) return 'error';
    if (titleLower.includes('경고') || titleLower.includes('주의')) return 'warning';
    return 'info';
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentAlert));
  }

  getCurrentAlert() {
    return this.currentAlert;
  }
}

// AlertProvider 컴포넌트
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = React.useState(AlertManager.getInstance().getCurrentAlert());

  React.useEffect(() => {
    const unsubscribe = AlertManager.getInstance().subscribe(setAlert);
    return unsubscribe;
  }, []);

  if (__DEV__) {
    if (__DEV__) console.log('🎭 AlertProvider 렌더링:', { hasChildren: !!children, alertVisible: alert.visible });
  }

  try {
    return (
      <>
        {children}
        {alert.visible && (
          <CustomAlert
            visible={true}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            buttons={alert.buttons}
            variant={alert.variant}
            onDismiss={() => AlertManager.getInstance().hide()}
          />
        )}
      </>
    );
  } catch (error) {
    if (__DEV__) console.error('❌ AlertProvider 렌더링 오류:', error);
    return <>{children}</>;
  }
};

// 전역 사용 API
export const showAlert = {
  show: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: 'success' | 'error' | 'warning' | 'info',
    variant?: 'default' | 'compact' | 'toast'
  ) => {
    AlertManager.getInstance().show(title, message, buttons, type, variant);
  },

  success: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show(title, message, buttons, 'success');
  },

  error: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show(title, message, buttons, 'error');
  },

  warning: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show(title, message, buttons, 'warning');
  },

  info: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show(title, message, buttons, 'info');
  },

  // 🔥 컴팩트 모드 (선택 항목만 표시)
  compact: (buttons: AlertButton[]) => {
    AlertManager.getInstance().show('', '', buttons, 'info', 'compact');
  },

  // 🔥 토스트 모드 (간단한 알림)
  toast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => {
    AlertManager.getInstance().show(message, undefined, [], type || 'info', 'toast');
  },

  hide: () => {
    AlertManager.getInstance().hide();
  },
};

export default CustomAlert;
