import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { normalize, normalizeIcon } from '../utils/responsive';

export interface ModalButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  buttons: ModalButton[];
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  title,
  message,
  icon,
  iconColor = '#FF6B6B',
  buttons,
}) => {
  // 동적 스타일 (React Native 0.80 호환)
  const dynamicStyles = useMemo(() => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: normalize(20),
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: normalize(20),
      padding: normalize(24),
      alignItems: 'center' as const,
      maxWidth: normalize(340),
      width: '100%' as const,
    },
    iconContainer: {
      marginBottom: normalize(16),
    },
    title: {
      fontSize: normalize(15),
      fontWeight: '700' as const,
      color: '#000000',
      marginBottom: normalize(12),
      textAlign: 'center' as const,
    },
    message: {
      fontSize: normalize(13),
      color: '#666666',
      marginBottom: normalize(24),
      textAlign: 'center' as const,
      lineHeight: normalize(20),
    },
    buttonContainer: {
      width: '100%' as const,
      gap: normalize(10),
    },
    button: {
      paddingVertical: normalize(14),
      paddingHorizontal: normalize(20),
      borderRadius: normalize(12),
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    cancelButtonText: {
      fontSize: normalize(13),
      fontWeight: '600' as const,
      color: '#666666',
    },
    defaultButtonText: {
      fontSize: normalize(13),
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    destructiveButtonText: {
      fontSize: normalize(13),
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  }), []);

  const handleButtonPress = (button: ModalButton) => {
    button.onPress();
    onClose();
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'cancel':
        return styles.cancelButton;
      case 'destructive':
        return styles.destructiveButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'cancel':
        return dynamicStyles.cancelButtonText;
      case 'destructive':
        return dynamicStyles.destructiveButtonText;
      default:
        return dynamicStyles.defaultButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={dynamicStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={dynamicStyles.modalContent}>
        {icon && (
          <View style={dynamicStyles.iconContainer}>
            <Icon name={icon} size={normalizeIcon(48)} color={iconColor} />
          </View>
        )}

        <Text style={dynamicStyles.title}>{title}</Text>
        <Text style={dynamicStyles.message}>{message}</Text>

        <View style={dynamicStyles.buttonContainer}>
          {buttons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[dynamicStyles.button, getButtonStyle(button.style)]}
              onPress={() => handleButtonPress(button)}
              activeOpacity={0.7}
            >
              <Text style={getButtonTextStyle(button.style)}>{button.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// 정적 스타일만 (normalize 사용 안함)
const styles = StyleSheet.create({
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  defaultButton: {
    backgroundColor: '#007AFF',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
});

export default ConfirmModal;
