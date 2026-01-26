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

  // 감성적이고 위로가 되는 글귀 배열 (사용자 명언이 없을 때 사용)
  const defaultQuotes = [
    "괜찮아요, 오늘 하루도 정말 잘 버텨냈어요",
    "당신의 속도로 천천히 가도 괜찮아요",
    "힘들 땐 잠시 멈춰도 돼요. 쉬어가는 것도 용기예요",
    "당신은 생각보다 훨씬 강한 사람이에요",
    "오늘 하루, 당신이 있어서 세상이 조금 더 따뜻했어요",
    "완벽하지 않아도 괜찮아요. 지금 그대로도 충분해요",
    "누군가에겐 당신의 존재만으로도 큰 위로가 돼요",
    "오늘은 어제보다 조금 더 나아졌어요. 그걸로 충분해요",
    "힘들 땐 울어도 돼요. 눈물도 치유의 시작이니까요",
    "당신의 감정은 틀린 게 아니에요. 모두 소중해요",
    "지금 이 순간, 당신은 최선을 다하고 있어요",
    "혼자가 아니에요. 함께 이겨낼 수 있어요",
    "작은 변화도 큰 용기예요. 스스로를 칭찬해주세요",
    "오늘 하루 수고했어요. 내일은 더 나은 날이 올 거예요",
    "당신의 이야기는 누군가에게 희망이 돼요",
    "천천히 가도 괜찮아요. 멈추지만 않으면 돼요",
    "지친 마음을 안아주세요. 당신은 충분히 애쓰고 있어요",
    "슬플 땐 슬퍼해도 돼요. 그것도 당신의 일부니까요"
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

        <Text style={[styles.centeredQuoteText, { color: colors.text }]}>
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
    paddingVertical: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 18,
    color: '#000000',
    letterSpacing: 0.2,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignSelf: 'center',
    maxWidth: '100%',
  },
  hintText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Pretendard-Medium',
  },
});

export default DailyQuoteCard;