// 리액션 표시 바 컴포넌트
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalize, normalizeSpace } from '../utils/responsive';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad';

interface ReactionCounts {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
}

interface ReactionBarProps {
  reactions: ReactionCounts;
  userReaction?: ReactionType | null;
  onPress?: () => void;
  compact?: boolean;
}

const reactionEmojis: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
};

export const ReactionBar: React.FC<ReactionBarProps> = ({
  reactions,
  userReaction,
  onPress,
  compact = false,
}) => {
  const { isDark, theme } = useModernTheme();

  // 리액션이 있는 항목만 필터링
  const activeReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a) // 많은 순으로 정렬
    .slice(0, compact ? 3 : 5); // compact 모드에서는 최대 3개만

  if (activeReactions.length === 0) return null;

  const totalCount = activeReactions.reduce((sum, [_, count]) => sum + count, 0);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.03)',
        },
      ]}
    >
      {/* 리액션 아이콘들 */}
      <View style={styles.emojisContainer}>
        {activeReactions.map(([type, count], index) => (
          <View
            key={type}
            style={[
              styles.emojiWrapper,
              {
                zIndex: activeReactions.length - index,
                marginLeft: index > 0 ? -normalizeSpace(8) : 0,
                borderColor: isDark ? theme.bg.card : '#ffffff',
              },
            ]}
          >
            <Text
              style={[
                styles.emoji,
                compact && styles.emojiCompact,
                userReaction === type && styles.emojiHighlight,
              ]}
            >
              {reactionEmojis[type as ReactionType]}
            </Text>
          </View>
        ))}
      </View>

      {/* 총 개수 */}
      <Text
        style={[
          styles.count,
          {
            color: isDark ? theme.text.secondary : theme.text.tertiary,
          },
        ]}
      >
        {totalCount}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalizeSpace(10),
    paddingVertical: normalizeSpace(6),
    borderRadius: 20,
    gap: normalizeSpace(6),
  },
  emojisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiWrapper: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  emoji: {
    fontSize: normalize(16, 14, 18),
  },
  emojiCompact: {
    fontSize: normalize(14, 12, 16),
  },
  emojiHighlight: {
    transform: [{ scale: 1.15 }],
  },
  count: {
    fontSize: normalize(13, 12, 14),
    fontFamily: 'Pretendard-SemiBold',
  },
});

export default ReactionBar;
