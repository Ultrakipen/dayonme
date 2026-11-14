// src/components/ModernToast.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../contexts/ModernThemeContext';

// React Native 0.80 호환성: lazy 초기화
const getScreenWidth = () => {
  try {
    const w = Dimensions.get('window').width;
    if (w > 0) return w;
  } catch (e) {}
  return 360;
};

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ModernToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const ModernToast: React.FC<ModernToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}) => {
  const { isDark } = useModernTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 토스트 표시
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 일정 시간 후 자동 숨김
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  if (!visible && translateY.__getValue() === -100) {
    return null;
  }

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle',
          color: '#10b981',
          bgColor: isDark ? '#064e3b' : '#d1fae5',
        };
      case 'error':
        return {
          icon: 'alert-circle',
          color: '#ef4444',
          bgColor: isDark ? '#7f1d1d' : '#fee2e2',
        };
      case 'warning':
        return {
          icon: 'alert',
          color: '#f59e0b',
          bgColor: isDark ? '#78350f' : '#fef3c7',
        };
      case 'info':
      default:
        return {
          icon: 'information',
          color: '#3b82f6',
          bgColor: isDark ? '#1e3a8a' : '#dbeafe',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: config.bgColor,
          borderLeftColor: config.color,
        },
      ]}
    >
      <MaterialCommunityIcons name={config.icon} size={20} color={config.color} />
      <Text
        style={[
          styles.message,
          {
            color: isDark ? '#ffffff' : '#1a1a1a',
          },
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    maxWidth: 400,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default ModernToast;
