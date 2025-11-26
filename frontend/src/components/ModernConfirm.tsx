// src/components/ModernConfirm.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../contexts/ModernThemeContext';

// React Native 0.80 호환성: lazy 초기화
const getScreenDimensions = () => {
  try {
    const dims = Dimensions.get('window');
    if (dims.width > 0 && dims.height > 0) return dims;
  } catch (e) {}
  return { width: 360, height: 780 };
};

export type ConfirmType = 'default' | 'destructive';

interface ModernConfirmProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: string;
}

const ModernConfirm: React.FC<ModernConfirmProps> = ({
  visible,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  type = 'default',
  onConfirm,
  onCancel,
  icon,
}) => {
  const { isDark } = useModernTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getTypeConfig = () => {
    if (type === 'destructive') {
      return {
        iconName: icon || 'alert-circle',
        iconColor: '#ef4444',
        confirmBgColor: '#ef4444',
        confirmTextColor: '#ffffff',
      };
    }
    return {
      iconName: icon || 'help-circle',
      iconColor: '#3b82f6',
      confirmBgColor: '#3b82f6',
      confirmTextColor: '#ffffff',
    };
  };

  const config = getTypeConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                {
                  backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* 아이콘 */}
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={config.iconName}
                  size={48}
                  color={config.iconColor}
                />
              </View>

              {/* 제목 */}
              <Text
                style={[
                  styles.title,
                  {
                    color: isDark ? '#ffffff' : '#1a1a1a',
                  },
                ]}
              >
                {title}
              </Text>

              {/* 메시지 */}
              <Text
                style={[
                  styles.message,
                  {
                    color: isDark ? '#b3b3b3' : '#666666',
                  },
                ]}
              >
                {message}
              </Text>

              {/* 버튼 */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
                    },
                  ]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: isDark ? '#e5e5e5' : '#374151',
                      },
                    ]}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    {
                      backgroundColor: config.confirmBgColor,
                    },
                  ]}
                  onPress={() => {
                    onConfirm();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: config.confirmTextColor,
                      },
                    ]}
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    // 스타일은 인라인으로 적용
  },
  confirmButton: {
    // 스타일은 인라인으로 적용
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ModernConfirm;
