import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  useWindowDimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useModernTheme } from '../../contexts/ModernThemeContext';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface BottomSheetAlertProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  icon?: string;
  iconColor?: string;
  showIcon?: boolean;
}

const BottomSheetAlert: React.FC<BottomSheetAlertProps> = ({
  visible,
  title,
  message,
  buttons = [],
  onClose,
  icon,
  iconColor,
  showIcon = true,
}) => {
  const { theme, isDark } = useModernTheme();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim, scaleAnim, screenHeight]);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  const getIconForTitle = (alertTitle?: string): string => {
    if (icon) return icon;
    if (!alertTitle) return 'information-circle';
    if (alertTitle.includes('로그아웃')) return 'log-out-outline';
    if (alertTitle.includes('삭제')) return 'trash-outline';
    if (alertTitle.includes('차단')) return 'ban-outline';
    if (alertTitle.includes('신고')) return 'flag-outline';
    if (alertTitle.includes('경고')) return 'warning-outline';
    if (alertTitle.includes('오류') || alertTitle.includes('에러')) return 'alert-circle-outline';
    if (alertTitle.includes('성공') || alertTitle.includes('완료')) return 'checkmark-circle-outline';
    return 'information-circle-outline';
  };

  const getIconColor = (alertTitle?: string): string => {
    if (iconColor) return iconColor;
    if (!alertTitle) return isDark ? '#60a5fa' : '#0095F6';
    if (alertTitle.includes('로그아웃')) return isDark ? '#f97316' : '#EA580C';
    if (alertTitle.includes('삭제')) return '#EF4444';
    if (alertTitle.includes('차단')) return '#EF4444';
    if (alertTitle.includes('신고')) return '#F59E0B';
    if (alertTitle.includes('경고')) return '#F59E0B';
    if (alertTitle.includes('오류') || alertTitle.includes('에러')) return '#EF4444';
    if (alertTitle.includes('성공') || alertTitle.includes('완료')) return '#10B981';
    return isDark ? '#60a5fa' : '#0095F6';
  };

  const currentIconColor = getIconColor(title);
  const cancelButton = buttons.find(b => b.style === 'cancel');
  const actionButtons = buttons.filter(b => b.style !== 'cancel');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: opacityAnim,
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
              }
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
              backgroundColor: isDark ? '#1a1a2e' : '#FFFFFF',
              maxWidth: Math.min(screenWidth - 32, 400),
            },
          ]}
        >
          <View style={[styles.handleBar, { backgroundColor: isDark ? '#404050' : '#E0E0E0' }]} />

          {showIcon && (
            <View style={[
              styles.iconContainer,
              { backgroundColor: `${currentIconColor}15` }
            ]}>
              <Icon
                name={getIconForTitle(title)}
                size={32}
                color={currentIconColor}
              />
            </View>
          )}

          {title && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {title}
              </Text>
            </View>
          )}

          {message && (
            <View style={styles.messageContainer}>
              <Text style={[styles.message, { color: isDark ? '#a0a0b0' : '#666666' }]}>
                {message}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {actionButtons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const gradientColors = isDestructive
                ? ['#EF4444', '#DC2626']
                : isDark
                  ? ['#6366f1', '#8b5cf6']
                  : ['#7C3AED', '#9333EA'];

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.85}
                  style={styles.actionButtonWrapper}
                >
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButton}
                  >
                    {isDestructive && (
                      <Icon name="log-out-outline" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    )}
                    <Text style={styles.actionButtonText}>
                      {button.text}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}

            {cancelButton && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: isDark ? '#2a2a3e' : '#F5F5F7',
                    borderColor: isDark ? '#3a3a4e' : '#E5E5EA',
                  }
                ]}
                onPress={() => handleButtonPress(cancelButton)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { color: isDark ? '#a0a0b0' : '#666666' }
                ]}>
                  {cancelButton.text}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    elevation: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  messageContainer: {
    marginBottom: 24,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Pretendard-Regular',
  },
  buttonContainer: {
    gap: 12,
  },
  actionButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: 0.2,
  },
});

export default BottomSheetAlert;
