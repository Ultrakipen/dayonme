import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Platform,
  InteractionManager,
} from 'react-native';
// MaterialCommunityIcons 대신 이모지 사용 - React Native 브릿지 오류 방지
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { FONT_SIZES, SPACING, moderateScale, verticalScale } from '../../constants';
import { sanitizeText } from '../../utils/sanitize';

// React Native 0.80 호환성: 런타임에 스케일 값 계산
const getScaledValues = () => ({
  ms20: moderateScale(20),
  ms16: moderateScale(16),
  ms12: moderateScale(12),
  ms10: moderateScale(10),
  ms8: moderateScale(8),
  ms6: moderateScale(6),
  ms4: moderateScale(4),
  ms24: moderateScale(24),
  ms40: moderateScale(40),
  ms44: moderateScale(44),
  ms48: moderateScale(48),
  ms300: moderateScale(300),
  vs12: verticalScale(12),
});

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onDismiss,
  type,
}) => {
  const { theme, isDark } = useModernTheme();
  const { width } = useWindowDimensions();
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [iconReady, setIconReady] = useState(false);
  const isMountedRef = useRef(true);

  // React Native 0.80 호환성: 런타임에 스케일 값 계산
  const sv = useMemo(() => getScaledValues(), []);

  // 마운트 상태 추적
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 2026 트렌드: 미니멀 글래스모피즘 색상
  const colors = {
    background: isDark
      ? 'rgba(30, 30, 35, 0.95)'
      : 'rgba(255, 255, 255, 0.98)',
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    buttonDefault: isDark ? '#6366F1' : '#6366F1',
    buttonCancel: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
    buttonCancelText: isDark ? 'rgba(255, 255, 255, 0.9)' : theme.colors.text.secondary,
    buttonDestructive: '#EF4444',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#6366F1',
  };

  useEffect(() => {
    if (visible) {
      // 아이콘 렌더링 초기화
      setIconReady(false);

      ReactNativeHapticFeedback.trigger('notificationWarning');
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      // InteractionManager + 지연으로 아이콘 렌더링 안전하게 수행
      const handle = InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          if (isMountedRef.current) {
            setIconReady(true);
          }
        }, 100);
      });

      return () => handle.cancel();
    } else {
      setIconReady(false);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  // 이모지 기반 아이콘 설정 - 벡터 아이콘 브릿지 오류 방지
  const getIconConfig = () => {
    if (!type) return null;
    switch (type) {
      case 'success':
        return { emoji: '✓', color: colors.success };
      case 'error':
        return { emoji: '!', color: colors.error };
      case 'warning':
        return { emoji: '⚠', color: colors.warning };
      case 'info':
        return { emoji: 'i', color: colors.info };
      default:
        return null;
    }
  };

  const iconConfig = getIconConfig();

  const defaultButtons: AlertButton[] = buttons || [
    { text: '확인', onPress: () => onDismiss?.(), style: 'default' },
  ];

  const handleButtonPress = (button: AlertButton) => {
    ReactNativeHapticFeedback.trigger('impactLight');
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'cancel':
        return {
          backgroundColor: colors.buttonCancel,
          textColor: colors.buttonCancelText,
        };
      case 'destructive':
        return {
          backgroundColor: colors.buttonDestructive,
          textColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: colors.buttonDefault,
          textColor: '#FFFFFF',
        };
    }
  };

  const alertWidth = Math.min(width - sv.ms48, sv.ms300);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => onDismiss?.()}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { backgroundColor: colors.overlay, opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => onDismiss?.()}
        />
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              width: alertWidth,
              borderRadius: sv.ms20,
              padding: SPACING.md,
              paddingTop: sv.ms20,
              paddingBottom: sv.ms16,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
              ...Platform.select({
                ios: {
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOffset: { width: 0, height: sv.vs12 },
                  shadowOpacity: isDark ? 0.5 : 0.15,
                  shadowRadius: sv.ms24,
                },
                android: {
                  elevation: isDark ? 16 : 8,
                },
              }),
            },
          ]}
        >
          {/* 아이콘 - 텍스트 기반으로 브릿지 오류 방지 */}
          {iconConfig && iconReady && (
            <View style={[styles.iconContainer, {
              backgroundColor: iconConfig.color + '12',
              width: sv.ms40,
              height: sv.ms40,
              borderRadius: sv.ms20,
              marginBottom: sv.ms10,
            }]}>
              <Text style={{
                fontSize: sv.ms20,
                fontWeight: '700',
                color: iconConfig.color,
              }}>
                {iconConfig.emoji}
              </Text>
            </View>
          )}

          {/* 제목 */}
          <Text style={[styles.title, { color: colors.text, marginBottom: sv.ms6 }]} numberOfLines={2}>
            {sanitizeText(title)}
          </Text>

          {/* 메시지 */}
          <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={4}>
            {sanitizeText(message)}
          </Text>

          {/* 버튼 */}
          <View style={[styles.buttonsContainer, { gap: sv.ms8, marginTop: sv.ms4 }, defaultButtons.length === 2 && styles.buttonsRow]}>
            {defaultButtons.map((button, index) => {
              const buttonStyles = getButtonStyle(button.style);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    {
                      backgroundColor: buttonStyles.backgroundColor,
                      paddingVertical: sv.ms12,
                      borderRadius: sv.ms12,
                      minHeight: sv.ms44,
                    },
                    defaultButtons.length === 2 && styles.buttonHalf,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                >
                  <Text style={[styles.buttonText, { color: buttonStyles.textColor }]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// React Native 0.80 호환성: StyleSheet에서 moderateScale 모듈 레벨 호출 제거
// 동적 스케일 값은 컴포넌트 내부에서 인라인 스타일로 적용
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.h5 || 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: (FONT_SIZES.h5 || 16) * 1.3,
  },
  message: {
    fontSize: FONT_SIZES.bodySmall || 14,
    textAlign: 'center',
    lineHeight: (FONT_SIZES.bodySmall || 14) * 1.5,
    marginBottom: SPACING.sm,
    letterSpacing: -0.2,
  },
  buttonsContainer: {
    width: '100%',
  },
  buttonsRow: {
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonText: {
    fontSize: FONT_SIZES.body || 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: (FONT_SIZES.body || 15) * 1.3,
  },
});

export default React.memo(CustomAlert);
