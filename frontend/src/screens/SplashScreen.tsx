import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import LinearGradient from 'react-native-linear-gradient';
import { normalize } from '../utils/responsive';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { theme, isDark } = useModernTheme();
  const { isAuthenticated, isLoading } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // 텍스트 Fade-in 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 로딩 점 애니메이션
    const createDotAnimation = (dotAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const dot1Animation = createDotAnimation(dotAnim1, 0);
    const dot2Animation = createDotAnimation(dotAnim2, 150);
    const dot3Animation = createDotAnimation(dotAnim3, 300);

    dot1Animation.start();
    dot2Animation.start();
    dot3Animation.start();

    return () => {
      dot1Animation.stop();
      dot2Animation.stop();
      dot3Animation.stop();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const MIN_SPLASH_TIME = 800;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, MIN_SPLASH_TIME - elapsed);

      const timer = setTimeout(() => {
        try {
          if (isAuthenticated) {
            navigation.replace('Main');
          } else {
            navigation.replace('Welcome');
          }
        } catch (error) {
          console.error('Navigation error:', error);
          navigation.replace('Welcome'); // 에러 시 안전하게 Welcome으로
        }
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigation]);

  const gradientColors = isDark
    ? ['#1a1a1a', '#262626', '#1a1a1a']
    : ['#f8f9ff', '#ffffff', '#f0f4ff'];

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* 중앙 텍스트 영역 */}
      <Animated.View
        style={[
          styles.centerContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={[styles.appName, { color: isDark ? '#A78BFA' : '#667eea' }]}>
          Day on me
        </Text>
        <Text style={[styles.tagline, { color: theme.text.tertiary }]}>
          작은 공감들의 큰 이야기
        </Text>

        {/* 로딩 인디케이터 */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dotAnim1,
                backgroundColor: isDark ? '#A78BFA' : '#667eea',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dotAnim2,
                backgroundColor: isDark ? '#A78BFA' : '#667eea',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dotAnim3,
                backgroundColor: isDark ? '#A78BFA' : '#667eea',
              },
            ]}
          />
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: normalize(38),
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontSize: normalize(16),
    fontFamily: 'Pretendard-Medium',
    letterSpacing: 0.5,
    marginBottom: 32,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default SplashScreen;
