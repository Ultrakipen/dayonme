import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { normalize, normalizeIcon } from '../../utils/responsive';
import { useModernTheme } from '../../contexts/ModernThemeContext';

// React Native 0.80 호환성: lazy 초기화
const getWidth = () => {
  try {
    const w = Dimensions.get('window').width;
    if (w > 0) return w;
  } catch (e) {}
  return 360;
};

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  iconName?: string;
  iconColor?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
  singleButton?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  confirmColor,
  iconName,
  iconColor,
  type = 'warning',
  onConfirm,
  onCancel,
  singleButton = false
}) => {
  const { isDark, theme } = useModernTheme();
  const width = getWidth();
  const opacityValue = React.useRef(new Animated.Value(0)).current;
  const scaleValue = React.useRef(new Animated.Value(0.9)).current;

  // 동적 스타일 (React Native 0.80 호환)
  const dynamicStyles = useMemo(() => ({
    container: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: normalize(32),
    },
    modal: {
      width: width - normalize(64),
      maxWidth: normalize(320),
      borderRadius: normalize(22),
      paddingVertical: normalize(24),
      paddingHorizontal: normalize(20),
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: normalize(12) },
      shadowOpacity: 0.25,
      shadowRadius: normalize(24),
      elevation: 20,
    },
    glassBackground: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: normalize(22),
      borderWidth: 1,
    },
    iconContainer: {
      width: normalize(60),
      height: normalize(60),
      borderRadius: normalize(30),
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: normalize(16),
    },
    title: {
      fontSize: normalize(18),
      fontWeight: '700' as const,
      textAlign: 'center' as const,
      marginBottom: normalize(8),
      letterSpacing: -0.4,
    },
    message: {
      fontSize: normalize(14.5),
      fontWeight: '500' as const,
      textAlign: 'center' as const,
      lineHeight: normalize(21),
      marginBottom: normalize(24),
      paddingHorizontal: normalize(4),
    },
    buttonContainer: {
      flexDirection: 'row' as const,
      width: '100%' as const,
      gap: normalize(10),
    },
    button: {
      flex: 1,
      paddingVertical: normalize(13),
      borderRadius: normalize(14),
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: normalize(46),
    },
    confirmButton: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: normalize(4) },
      shadowOpacity: 0.2,
      shadowRadius: normalize(12),
      elevation: 8,
    },
    cancelButtonText: {
      fontSize: normalize(14.5),
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    confirmButtonText: {
      fontSize: normalize(14.5),
      fontWeight: '700' as const,
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
  }), [width]);

  React.useEffect(() => {
    if (visible) {
      // 병렬 애니메이션: opacity와 scale 동시에
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 200,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityValue, scaleValue]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: iconName || 'check-circle-outline',
          iconColor: iconColor || (isDark ? '#4ade80' : '#10B981'),
          confirmColor: confirmColor || (isDark ? '#22c55e' : '#10B981'),
        };
      case 'danger':
        return {
          icon: iconName || 'delete-outline',
          iconColor: iconColor || (isDark ? '#f87171' : '#EF4444'),
          confirmColor: confirmColor || (isDark ? '#ef4444' : '#EF4444'),
        };
      case 'warning':
        return {
          icon: iconName || 'alert-outline',
          iconColor: iconColor || (isDark ? '#fbbf24' : '#F59E0B'),
          confirmColor: confirmColor || (isDark ? '#f59e0b' : '#F59E0B'),
        };
      case 'info':
        return {
          icon: iconName || 'information-outline',
          iconColor: iconColor || (isDark ? '#60a5fa' : '#3B82F6'),
          confirmColor: confirmColor || (isDark ? '#3b82f6' : '#3B82F6'),
        };
      default:
        return {
          icon: iconName || 'alert-outline',
          iconColor: iconColor || (isDark ? '#fbbf24' : '#F59E0B'),
          confirmColor: confirmColor || (isDark ? '#f59e0b' : '#F59E0B'),
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || (() => {})}
    >
      {/* 배경 오버레이 */}
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)' }]}>
        {/* 모달 컨테이너 */}
        <View style={dynamicStyles.container}>
          <Animated.View
            style={[
              dynamicStyles.modal,
              {
                opacity: opacityValue,
                transform: [{ scale: scaleValue }],
                backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
              }
            ]}
          >
            {/* 글래스모피즘 배경 */}
            <View style={[
              dynamicStyles.glassBackground,
              {
                backgroundColor: isDark ? 'rgba(26, 26, 26, 0.98)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.3)',
              }
            ]} />

            {/* 아이콘 */}
            <View style={[
              dynamicStyles.iconContainer,
              {
                backgroundColor: isDark
                  ? config.iconColor + '20'
                  : config.iconColor + '15'
              }
            ]}>
              <MaterialCommunityIcons
                name={config.icon}
                size={normalizeIcon(28)}
                color={config.iconColor}
              />
            </View>

            {/* 제목 */}
            <Text style={[
              dynamicStyles.title,
              { color: isDark ? '#FFFFFF' : '#1F2937' }
            ]}>{title}</Text>

            {/* 메시지 */}
            <Text style={[
              dynamicStyles.message,
              { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280' }
            ]}>{message}</Text>

            {/* 버튼 컨테이너 */}
            <View style={dynamicStyles.buttonContainer}>
              {/* 취소 버튼 (singleButton이 false일 때만 표시) */}
              {!singleButton && onCancel && (
                <TouchableOpacity
                  style={[
                    dynamicStyles.button,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F9FAFB',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
                    }
                  ]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                  delayPressIn={0}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[
                    dynamicStyles.cancelButtonText,
                    { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280' }
                  ]}>{cancelText}</Text>
                </TouchableOpacity>
              )}

              {/* 확인 버튼 */}
              <TouchableOpacity
                style={[
                  dynamicStyles.button,
                  dynamicStyles.confirmButton,
                  { backgroundColor: config.confirmColor }
                ]}
                onPress={onConfirm}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={dynamicStyles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

// 정적 스타일만 (normalize 사용 안함)
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConfirmationModal;
