import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';

import { normalize, normalizeSpace, normalizeIcon } from '../utils/responsive';

interface DailyQuoteCardProps {
  style?: any;
  onPress?: () => void;
}

const DailyQuoteCard: React.FC<DailyQuoteCardProps> = ({ style, onPress }) => {
  const { user } = useAuth();
  const { theme: modernTheme, isDark } = useModernTheme();
  // React Native 0.80 호환: useWindowDimensions 훅 사용
  const { width: screenWidth } = useWindowDimensions();

  // 테마별 색상 정의
  const colors = {
    cardBackground: modernTheme.bg.card,
    text: modernTheme.text.primary,
    textSecondary: modernTheme.text.secondary,
    border: modernTheme.bg.border,
  };

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [currentQuote, setCurrentQuote] = useState('');

  // 철학적이고 깊이 있는 명언 배열 (사용자 명언이 없을 때 사용)
  const defaultQuotes = [
    "변화는 불편함에서 시작되지만, 성장은 그 불편함을 받아들일 때 일어난다.",
    "실패는 끝이 아니라 다음 도전을 위한 새로운 시작점이다.",
    "진정한 용기란 두려움이 없는 것이 아니라, 두려움에도 불구하고 계속 나아가는 것이다.",
    "우리가 통제할 수 있는 것은 결과가 아니라 우리의 노력과 태도뿐이다.",
    "어제의 상처가 오늘의 지혜가 되고, 오늘의 선택이 내일의 운명을 만든다.",
    "완벽함을 추구하지 말고 진정성을 추구하라. 진짜 자신이 되는 것이 가장 아름답다.",
    "인생에서 가장 중요한 것은 얼마나 빨리 가느냐가 아니라 올바른 방향으로 가고 있느냐다.",
    "자신을 다른 사람과 비교하지 말라. 당신의 유일한 경쟁자는 어제의 자신이다.",
    "감정은 날씨와 같다. 폭풍우도 지나가고, 맑은 날도 온다.",
    "가장 어둡운 밤이 지나면 새벽이 온다. 희망을 놓지 말라.",
    "행복은 목적지가 아니라 여행 중에 만나는 순간들이다.",
    "성공의 비결은 재능이 아니라 포기하지 않는 마음이다."
  ];

  // 오늘의 명언 선택
  const getTodayQuote = () => {
    // 사용자 명언이 있으면 우선 사용
    if (user?.favorite_quote && user.favorite_quote.trim()) {
      return user.favorite_quote;
    }

    // 날짜 기반으로 고정된 명언 선택 (하루 종일 같은 명언)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % defaultQuotes.length;
    return defaultQuotes[quoteIndex];
  };

  // 사용자 정보가 변경될 때마다 명언 업데이트
  useEffect(() => {
    setCurrentQuote(getTodayQuote());
  }, [user?.favorite_quote]);

  useEffect(() => {
    // 페이드인 + 스케일 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style
      ]}
    >
      <View style={[styles.elegantContainer, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.editButtonRow}>
          {onPress && (
            <TouchableOpacity
              onPress={onPress}
              style={[styles.floatingEditButton, { backgroundColor: isDark ? 'rgba(38, 38, 38, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="create-outline" size={normalizeIcon(18)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.centeredQuoteText, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
          "{currentQuote || getTodayQuote()}"
        </Text>

        {(!user?.favorite_quote || !user.favorite_quote.trim()) && onPress && (
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>탭하여 나만의 명언 설정</Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  // 세련된 새 스타일들
  elegantContainer: {
    paddingHorizontal: 36,
    paddingVertical: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: '#FFFFFF',
  },
  editButtonRow: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
  },
  floatingEditButton: {
    padding: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  centeredQuoteText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    color: '#000000',
    letterSpacing: 0.2,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    flex: 1,
  },
  hintText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default DailyQuoteCard;