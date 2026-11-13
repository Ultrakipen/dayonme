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
}

const BottomSheetAlert: React.FC<BottomSheetAlertProps> = ({
  visible,
  title,
  message,
  buttons = [],
  onClose,
}) => {
  const { theme, isDark } = useModernTheme();
  const { height: screenHeight } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim, screenHeight]);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <View style={[styles.handleBar, { backgroundColor: isDark ? '#404040' : '#D0D0D0' }]} />

          {title && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>{title}</Text>
            </View>
          )}

          {message && (
            <View style={styles.messageContainer}>
              <Text style={[styles.message, { color: theme.colors.text.secondary }]}>{message}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  { backgroundColor: isDark ? '#60a5fa' : '#0095F6' },
                  button.style === 'destructive' && styles.destructiveButton,
                  button.style === 'cancel' && [
                    styles.cancelButton,
                    { backgroundColor: isDark ? theme.bg.secondary : '#F8F9FA' }
                  ],
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveText,
                    button.style === 'cancel' && [
                      styles.cancelText,
                      { color: theme.colors.text.primary }
                    ],
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  messageContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    backgroundColor: '#0095F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cancelText: {
    color: '#333333',
  },
  destructiveText: {
    color: '#FFFFFF',
  },
});

export default BottomSheetAlert;
