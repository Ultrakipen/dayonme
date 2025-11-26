import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Box, Text, Pressable, HStack } from './ui';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onClose?: () => void;
  type?: ToastType;
  position?: 'top' | 'bottom';
  icon?: ReactNode;
  testID?: string;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  duration = 3000,
  onClose,
  type = 'info',
  position = 'bottom',
  icon,
  testID,
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    } else {
      hideToast();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, duration]);

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      if (onClose) onClose();
    });
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return styles.successToast;
      case 'error':
        return styles.errorToast;
      case 'warning':
        return styles.warningToast;
      case 'info':
      default:
        return styles.infoToast;
    }
  };

  if (!isVisible) return null;

  const positionStyles = position === 'top' ? styles.topPosition : styles.bottomPosition;

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.container,
        positionStyles,
        getTypeStyles(),
        { opacity: fadeAnim }
      ]}
    >
      <Pressable onPress={hideToast} style={styles.pressable} testID="toast-touchable">
        {icon && <Box style={styles.iconContainer}>{icon}</Box>}
        <Text style={styles.messageText}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
};

// 전역 상태를 위한 인스턴스 생성
let toastInstance: any = null;

// Toast 컨트롤러
export const ToastController = {
  show: (props: Omit<ToastProps, 'visible'>) => {
    if (toastInstance) {
      toastInstance.show(props);
    }
  },
  hide: () => {
    if (toastInstance) {
      toastInstance.hide();
    }
  },
  setRef: (ref: any) => {
    toastInstance = ref;
  },
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topPosition: {
    top: 48,
  },
  bottomPosition: {
    bottom: 48,
  },
  successToast: {
    backgroundColor: '#10b981',
  },
  errorToast: {
    backgroundColor: '#ef4444',
  },
  warningToast: {
    backgroundColor: '#f97316',
  },
  infoToast: {
    backgroundColor: '#3b82f6',
  },
  pressable: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  iconContainer: {
    marginRight: 10,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
});

export default Toast;