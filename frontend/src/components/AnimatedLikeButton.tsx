// src/components/AnimatedLikeButton.tsx
import React, { useRef, useEffect } from 'react';
import { Animated, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface AnimatedLikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
}

export const AnimatedLikeButton: React.FC<AnimatedLikeButtonProps> = ({
  isLiked,
  likeCount,
  onPress,
  testID,
  disabled = false
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLiked) {
      // 좋아요 눌렀을 때 애니메이션
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 좋아요 취소했을 때 애니메이션
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(heartAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isLiked, scaleAnim, heartAnim]);

  const handlePress = () => {
    if (disabled) return;
    
    // 터치 피드백 애니메이션 (중복 클릭 방지)
    scaleAnim.stopAnimation();
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
    
    // 약간의 지연 후 onPress 호출하여 애니메이션과 동기화
    setTimeout(() => {
      onPress();
    }, 10);
  };

  return (
    <Pressable onPress={handlePress} testID={testID} disabled={disabled}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: isLiked ? '#fee2e2' : '#f9fafb',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isLiked ? '#ef4444' : '#e5e7eb',
        }}
      >
        <Animated.View
          style={{
            transform: [
              {
                scale: heartAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              },
            ],
          }}
        >
          <MaterialCommunityIcons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={isLiked ? '#ef4444' : '#6b7280'}
          />
        </Animated.View>
        
        <Animated.Text
          style={{
            marginLeft: 6,
            fontSize: 14,
            fontWeight: '600',
            color: isLiked ? '#ef4444' : '#6b7280',
            opacity: heartAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          }}
        >
          {likeCount}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

// 플로팅 하트 애니메이션 (추가 효과)
export const FloatingHeart: React.FC<{ onAnimationComplete: () => void }> = ({
  onAnimationComplete
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -50,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(onAnimationComplete);
  }, [onAnimationComplete, scale, translateY, opacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        transform: [
          { translateY },
          { scale },
        ],
        opacity,
      }}
      pointerEvents="none"
    >
      <MaterialCommunityIcons
        name="heart"
        size={24}
        color="#ef4444"
      />
    </Animated.View>
  );
};