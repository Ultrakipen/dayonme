// src/components/ReactionButton.tsx
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Text } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import reactionService, { ReactionType, ReactionStats } from '../services/api/reactionService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ReactionButtonProps {
  postId: number;
  postType: 'my-day' | 'someone-day';
  initialReactionCount?: number;
  onReactionUpdate?: (newCount: number) => void;
}

const ReactionButton: React.FC<ReactionButtonProps> = ({
  postId,
  postType,
  initialReactionCount = 0,
  onReactionUpdate
}) => {
  const { isDarkMode } = useTheme();

  // 테마별 색상 정의
  const colors = {
    surface: isDarkMode ? '#2d2d2d' : '#f8fafc',
    card: isDarkMode ? '#3d3d3d' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#111827',
    textSecondary: isDarkMode ? '#a0a0a0' : '#6b7280',
    primary: isDarkMode ? '#60a5fa' : '#405DE6',
    border: isDarkMode ? '#4d4d4d' : '#e5e7eb',
  };
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionTypes, setReactionTypes] = useState<ReactionType[]>([]);
  const [reactions, setReactions] = useState<ReactionStats[]>([]);
  const [totalReactions, setTotalReactions] = useState(initialReactionCount);
  const [loading, setLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // 리액션 타입 목록 로드
  useEffect(() => {
    loadReactionTypes();
  }, []);

  // 게시물의 리액션 통계 로드
  useEffect(() => {
    if (postId) {
      loadReactions();
    }
  }, [postId]);

  const loadReactionTypes = async () => {
    try {
      const response = await reactionService.getReactionTypes();
      if (response.status === 'success') {
        setReactionTypes(response.data.reactionTypes);
      }
    } catch (error) {
      if (__DEV__) console.error('리액션 타입 로드 오류:', error);
    }
  };

  const loadReactions = async () => {
    try {
      const response = postType === 'my-day'
        ? await reactionService.getMyDayReactions(postId)
        : await reactionService.getSomeoneDayReactions(postId);

      if (response.status === 'success') {
        setReactions(response.data.reactions);
        setTotalReactions(response.data.total_reactions);
        if (onReactionUpdate) {
          onReactionUpdate(response.data.total_reactions);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('리액션 통계 로드 오류:', error);
    }
  };

  const handleReactionPress = () => {
    setShowReactionPicker(!showReactionPicker);

    // 버튼 애니메이션
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleReactionSelect = async (reactionTypeId: number) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = postType === 'my-day'
        ? await reactionService.toggleMyDayReaction(postId, reactionTypeId)
        : await reactionService.toggleSomeoneDayReaction(postId, reactionTypeId);

      if (response.status === 'success') {
        // 리액션 통계 다시 로드
        await loadReactions();
        setShowReactionPicker(false);
      }
    } catch (error: unknown) {
      if (__DEV__) console.error('리액션 토글 오류:', error);
      if (error.response?.data?.message) {
        // Alert나 Toast로 에러 메시지 표시 가능
        if (__DEV__) console.log('에러:', error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 메인 리액션 버튼 */}
      <TouchableOpacity
        onPress={handleReactionPress}
        style={[
          styles.mainButton,
          { backgroundColor: colors.surface }
        ]}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <MaterialCommunityIcons
            name="heart-outline"
            size={20}
            color={totalReactions > 0 ? colors.primary : colors.text}
          />
        </Animated.View>
        {totalReactions > 0 && (
          <Text
            style={[styles.countText, { color: colors.text }]}
            fontSize="sm"
          >
            {totalReactions}
          </Text>
        )}
      </TouchableOpacity>

      {/* 리액션 선택 팔레트 */}
      {showReactionPicker && (
        <View
          style={[
            styles.reactionPicker,
            {
              backgroundColor: colors.card,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 4,
                },
              }),
            }
          ]}
        >
          {reactionTypes.map((reactionType) => {
            const userReacted = reactions.find(
              r => r.reaction_type_id === reactionType.reaction_type_id
            )?.userReacted || false;

            return (
              <TouchableOpacity
                key={reactionType.reaction_type_id}
                onPress={() => handleReactionSelect(reactionType.reaction_type_id)}
                style={[
                  styles.reactionItem,
                  userReacted && {
                    backgroundColor: colors.primary + '20',
                    borderWidth: 2,
                    borderColor: colors.primary,
                  }
                ]}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text fontSize="2xl">{reactionType.emoji}</Text>
                <Text
                  fontSize="xs"
                  style={[
                    styles.reactionName,
                    { color: userReacted ? colors.primary : colors.textSecondary }
                  ]}
                >
                  {reactionType.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 리액션 통계 표시 */}
      {reactions.length > 0 && !showReactionPicker && (
        <View style={styles.reactionStats}>
          {reactions.slice(0, 3).map((reaction) => (
            <View
              key={reaction.reaction_type_id}
              style={[
                styles.reactionStatItem,
                { backgroundColor: colors.surface }
              ]}
            >
              <Text fontSize="sm">{reaction.emoji}</Text>
              <Text fontSize="xs" style={{ color: colors.textSecondary, marginLeft: 2 }}>
                {reaction.count}
              </Text>
            </View>
          ))}
          {reactions.length > 3 && (
            <Text fontSize="xs" style={{ color: colors.textSecondary, marginLeft: 4 }}>
              +{reactions.length - 3}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  countText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  reactionPicker: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    flexDirection: 'row',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
    zIndex: 1000,
  },
  reactionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    minWidth: 60,
  },
  reactionName: {
    marginTop: 2,
    fontFamily: 'Pretendard-Medium',
  },
  reactionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  reactionStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
});

export default ReactionButton;
