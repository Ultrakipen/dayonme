// 리액션 선택 컴포넌트
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalize, normalizeSpace } from '../utils/responsive';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad';

interface ReactionPickerProps {
  onReactionSelect: (reaction: ReactionType) => void;
  currentReaction?: ReactionType | null;
  visible: boolean;
  onClose: () => void;
}

const reactions: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like', emoji: '👍', label: '좋아요' },
  { type: 'love', emoji: '❤️', label: '사랑해요' },
  { type: 'haha', emoji: '😂', label: '웃겨요' },
  { type: 'wow', emoji: '😮', label: '놀라워요' },
  { type: 'sad', emoji: '😢', label: '슬퍼요' },
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onReactionSelect,
  currentReaction,
  visible,
  onClose,
}) => {
  const { isDark, theme } = useModernTheme();
  const [scaleAnims] = useState(reactions.map(() => new Animated.Value(1)));

  if (!visible) return null;

  const handleReactionPress = (reaction: ReactionType, index: number) => {
    // 애니메이션
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onReactionSelect(reaction);
    setTimeout(onClose, 200);
  };

  return (
    <Pressable
      style={styles.overlay}
      onPress={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
        ]}
      >
        {reactions.map((reaction, index) => (
          <Pressable
            key={reaction.type}
            onPress={() => handleReactionPress(reaction.type, index)}
            style={[
              styles.reactionButton,
              currentReaction === reaction.type && {
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.15)',
                borderColor: '#8B5CF6',
                borderWidth: 2,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.emoji,
                { transform: [{ scale: scaleAnims[index] }] },
              ]}
            >
              {reaction.emoji}
            </Animated.Text>
            <Text
              style={[
                styles.label,
                {
                  color: isDark ? theme.text.secondary : theme.text.tertiary,
                },
              ]}
            >
              {reaction.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    padding: normalizeSpace(12),
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    gap: normalizeSpace(8),
  },
  reactionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: normalizeSpace(8),
    borderRadius: 12,
    minWidth: normalizeSpace(60),
  },
  emoji: {
    fontSize: normalize(28, 24, 32),
    marginBottom: 4,
  },
  label: {
    fontSize: normalize(10, 9, 11),
    fontFamily: 'Pretendard-SemiBold',
  },
});

export default ReactionPicker;
