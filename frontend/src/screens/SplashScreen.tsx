import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import LinearGradient from 'react-native-linear-gradient';
import { FONT_SIZES } from '../constants';
import { getScale } from '../utils/responsive';

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

  const scale = getScale();

  useEffect(() => {
    // 로고 Fade-in 애니메이션
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
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Main');
        } else {
          navigation.replace('Welcome');
        }
      }, 1500);

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
      {/* 메인 로고 영역 */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={[styles.icon, { color: isDark ? '#A78BFA' : '#667eea' }]}>
          💫
        </Text>
        <Text style={[styles.logo, { color: isDark ? theme.colors.primary[400] : theme.colors.gradient.primary[0] }]}>
          Little Emotion
        </Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
          작은 감정들의 큰 이야기
        </Text>
      </Animated.View>

      {/* 로딩 인디케이터 */}
      <View style={styles.loadingContainer}>
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dotAnim1,
              backgroundColor: isDark ? '#A78BFA' : theme.colors.gradient.primary[0],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dotAnim2,
              backgroundColor: isDark ? '#A78BFA' : theme.colors.gradient.primary[0],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dotAnim3,
              backgroundColor: isDark ? '#A78BFA' : theme.colors.gradient.primary[0],
            },
          ]}
        />
      </View>

      {/* 하단 슬로건 */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            color: theme.text.tertiary,
            opacity: fadeAnim,
          },
        ]}
      >
        당신의 마음을 나눠 보세요
      </Animated.Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    top: '15%',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40 * getScale(),
    marginBottom: 16,
  },
  logo: {
    fontSize: 52 * getScale(),
    fontWeight: '700',
    letterSpacing: -1.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZES.body * getScale(),
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagline: {
    position: 'absolute',
    bottom: '15%',
    fontSize: FONT_SIZES.bodySmall * getScale(),
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default SplashScreen;
