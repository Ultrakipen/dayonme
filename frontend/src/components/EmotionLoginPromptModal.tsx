// src/components/EmotionLoginPromptModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { Text, VStack, HStack, Box } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { normalize, wp, hp } from '../utils/responsive';

interface EmotionLoginPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  actionType?: 'like' | 'comment' | 'post' | 'profile';
}

// 감정 캐릭터 20개
const emotionCharacters = [
  { emoji: '😊', label: '기쁨이', color: '#FFD700' },
  { emoji: '😄', label: '행복이', color: '#FFA500' },
  { emoji: '😢', label: '슬픔이', color: '#4682B4' },
  { emoji: '😞', label: '우울이', color: '#708090' },
  { emoji: '😑', label: '지루미', color: '#A9A9A9' },
  { emoji: '😠', label: '버럭이', color: '#FF4500' },
  { emoji: '😰', label: '불안이', color: '#DDA0DD' },
  { emoji: '😟', label: '걱정이', color: '#FFA07A' },
  { emoji: '🥺', label: '감동이', color: '#FF6347' },
  { emoji: '🤨', label: '황당이', color: '#20B2AA' },
  { emoji: '😲', label: '당황이', color: '#FF8C00' },
  { emoji: '😤', label: '짜증이', color: '#DC143C' },
  { emoji: '😨', label: '무섭이', color: '#9370DB' },
  { emoji: '🥰', label: '추억이', color: '#87CEEB' },
  { emoji: '🤗', label: '설렘이', color: '#FF69B4' },
  { emoji: '😌', label: '편안이', color: '#98FB98' },
  { emoji: '🤔', label: '궁금이', color: '#DAA520' },
  { emoji: '❤️', label: '사랑이', color: '#E91E63' },
  { emoji: '🤕', label: '아픔이', color: '#8B4513' },
  { emoji: '🤑', label: '욕심이', color: '#32CD32' },
];

const EmotionLoginPromptModal: React.FC<EmotionLoginPromptModalProps> = ({
  visible,
  onClose,
  onLogin,
  onRegister,
  actionType = 'like',
}) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 진입 애니메이션
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // 부드러운 떠다니는 애니메이션
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 부드러운 햅틱 피드백
      if (Platform.OS === 'android') {
        Vibration.vibrate(50);
      }
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  // 액션 타입별 메시지
  const getMessage = () => {
    switch (actionType) {
      case 'like':
        return {
          title: '마음에 드셨나요?',
          description: '다른 사람들은 어떤 감정을 느낄까요?\n회원가입하고 더 많은 이야기를 나눠보세요',
          icon: 'heart',
          iconColor: '#E91E63',
        };
      case 'comment':
        return {
          title: '함께 이야기 나눠볼까요?',
          description: '당신의 감정도 소중해요\n회원가입하고 따뜻한 위로를 주고받아보세요',
          icon: 'comment-text',
          iconColor: '#667eea',
        };
      case 'post':
        return {
          title: '당신만의 감정 기록',
          description: '오늘의 감정을 기록하고\n다른 사람들과 공감해보세요',
          icon: 'pencil',
          iconColor: '#FFA500',
        };
      case 'profile':
        return {
          title: '궁금하신가요?',
          description: '회원가입하고 더 많은 감정 이야기를\n만나보세요',
          icon: 'account',
          iconColor: '#32CD32',
        };
      default:
        return {
          title: '함께해요!',
          description: '회원가입하고 더 많은 이야기를 나눠보세요',
          icon: 'emoticon-happy',
          iconColor: '#667eea',
        };
    }
  };

  const message = getMessage();

  // 랜덤 감정 캐릭터 3개 선택 (매번 다르게)
  const getRandomCharacters = () => {
    const shuffled = [...emotionCharacters].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };

  const randomCharacters = getRandomCharacters();

  const colors = {
    backdrop: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
    modalBg: isDarkMode ? '#1f2937' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#111827',
    textSecondary: isDarkMode ? '#d1d5db' : '#6b7280',
    border: isDarkMode ? '#374151' : '#e5e7eb',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            backgroundColor: colors.backdrop,
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.modalBg,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* 닫기 버튼 */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <VStack style={styles.contentWrapper}>
                  {/* 아이콘 영역 */}
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={[`${message.iconColor}20`, `${message.iconColor}10`]}
                      style={styles.iconGradient}
                    >
                      <MaterialCommunityIcons
                        name={message.icon}
                        size={48}
                        color={message.iconColor}
                      />
                    </LinearGradient>
                  </View>

                  {/* 감정 캐릭터들 */}
                  <HStack style={styles.charactersContainer}>
                    {randomCharacters.map((char, index) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.characterItem,
                          {
                            opacity: fadeAnim,
                            transform: [
                              {
                                translateY: fadeAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [20, 0],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.characterBubble,
                            { backgroundColor: `${char.color}15` },
                          ]}
                        >
                          <Text style={styles.characterEmoji}>{char.emoji}</Text>
                        </View>
                        <Text
                          style={[
                            styles.characterLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {char.label}
                        </Text>
                      </Animated.View>
                    ))}
                  </HStack>

                  {/* 제목 */}
                  <Text style={[styles.title, { color: colors.text }]}>
                    {message.title}
                  </Text>

                  {/* 설명 */}
                  <Text
                    style={[styles.description, { color: colors.textSecondary }]}
                  >
                    {message.description}
                  </Text>

                  {/* 통계 정보 (선택사항) */}
                  <View
                    style={[styles.statsContainer, { borderColor: colors.border }]}
                  >
                    <HStack style={styles.statsRow}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={18}
                        color="#667eea"
                      />
                      <Text
                        style={[styles.statsText, { color: colors.textSecondary }]}
                      >
                        오늘 1,532명이 감정을 기록했어요
                      </Text>
                    </HStack>
                  </View>

                  {/* 버튼 영역 */}
                  <VStack style={styles.buttonContainer}>
                    {/* 회원가입 버튼 (주 액션) */}
                    <TouchableOpacity onPress={onRegister} activeOpacity={0.8}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryButtonText}>
                          지금 시작하기 ✨
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* 로그인 버튼 */}
                    <TouchableOpacity
                      onPress={onLogin}
                      activeOpacity={0.7}
                      style={[
                        styles.secondaryButton,
                        { borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          { color: colors.text },
                        ]}
                      >
                        이미 계정이 있어요
                      </Text>
                    </TouchableOpacity>

                    {/* 둘러보기 계속 */}
                    <TouchableOpacity
                      onPress={onClose}
                      activeOpacity={0.7}
                      style={styles.tertiaryButton}
                    >
                      <Text
                        style={[
                          styles.tertiaryButtonText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        둘러보기 계속하기
                      </Text>
                    </TouchableOpacity>
                  </VStack>
                </VStack>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: wp(90),
    maxWidth: 420,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  contentWrapper: {
    gap: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 8,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charactersContainer: {
    gap: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  characterItem: {
    alignItems: 'center',
    gap: 6,
  },
  characterBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterEmoji: {
    fontSize: 28,
  },
  characterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  statsRow: {
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default EmotionLoginPromptModal;
