// src/components/GuestWelcomeBanner.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalize } from '../utils/responsive';

interface GuestWelcomeBannerProps {
  onLoginPress: () => void;
  isDarkMode?: boolean;
}

const GuestWelcomeBanner: React.FC<GuestWelcomeBannerProps> = ({
  onLoginPress,
  isDarkMode = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    checkBannerVisibility();
  }, []);

  const checkBannerVisibility = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastShown = await AsyncStorage.getItem('guestBannerLastShown');

      // 오늘 이미 봤으면 표시하지 않음
      if (lastShown === today) {
        return;
      }

      // 배너 표시
      setIsVisible(true);
      await AsyncStorage.setItem('guestBannerLastShown', today);

      // 페이드인 애니메이션
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.log('배너 표시 확인 오류:', error);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: isDarkMode ? '#2D2D2D' : '#F8F4FF',
        },
      ]}
    >
      <View style={styles.content}>
        {/* 아이콘 */}
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>💜</Text>
        </View>

        {/* 메시지 */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? '#E9D5FF' : '#7C3AED' },
            ]}
          >
            마음이 따듯해지는 곳
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: isDarkMode ? '#D1D5DB' : '#6B7280' },
            ]}
          >
            함께 감정을 나누고 싶다면
          </Text>
        </View>

        {/* 버튼들 */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={onLoginPress}
            style={[
              styles.loginButton,
              { backgroundColor: isDarkMode ? '#7C3AED' : '#8B5CF6' },
            ]}
          >
            <Text style={styles.loginButtonText}>시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeButton: {
    padding: 4,
  },
});

export default GuestWelcomeBanner;
