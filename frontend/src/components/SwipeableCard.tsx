// src/components/SwipeableCard.tsx
import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';

const SWIPE_THRESHOLD = 60; // Minimum swipe distance
const ACTION_WIDTH = 70;

interface SwipeAction {
  id: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  cardStyle?: object;
  onSwipeOpen?: () => void;
}

export interface SwipeableCardRef {
  close: () => void;
}

const SwipeableCard = forwardRef<SwipeableCardRef, SwipeableCardProps>(({
  children,
  actions,
  cardStyle,
  onSwipeOpen,
}, ref) => {
  const { isDarkMode } = useTheme();
  const [translateX, setTranslateX] = useState(() => new Animated.Value(0));
  const [isRevealed, setIsRevealed] = useState(false);
  const [forceReset, setForceReset] = useState(0);

  // 강제 리셋 함수
  const resetCard = useCallback(() => {
    if (__DEV__) console.log('🔄 카드 강제 리셋');
    setIsRevealed(false);
    // 새로운 Animated.Value 생성으로 완전 초기화
    setTranslateX(new Animated.Value(0));
    setForceReset(prev => prev + 1);
  }, []);

  // 컴포넌트 마운트 시 강제 초기화
  useEffect(() => {
    if (__DEV__) console.log('🔄 SwipeableCard 마운트 - 상태 초기화');
    resetCard();
  }, []);

  // actions 배열이 변경될 때마다 초기화
  useEffect(() => {
    if (__DEV__) console.log('🔄 액션 배열 변경 - 상태 초기화');
    resetCard();
  }, [actions]);

  // 화면 포커스가 변경될 때마다 스와이프 상태 초기화
  useFocusEffect(
    React.useCallback(() => {
      // 화면에 포커스가 되면 모든 스와이프 상태를 초기화
      if (isRevealed) {
        if (__DEV__) console.log('🔄 화면 포커스로 인한 스와이프 상태 초기화');
        closeActions();
      }
    }, [isRevealed])
  );

  const panResponder = useRef(null);

  // PanResponder를 forceReset에 따라 재생성
  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 수평 스와이프만 처리하고, 수직 스와이프는 무시
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const hasMinimumDistance = Math.abs(gestureState.dx) > 10;

        // 왼쪽 스와이프는 항상 허용, 오른쪽 스와이프는 액션이 열린 상태에서만 허용
        const isLeftSwipe = gestureState.dx < 0;
        const isRightSwipeWhenRevealed = gestureState.dx > 0 && isRevealed;

        const shouldHandle = isHorizontalSwipe && hasMinimumDistance && (isLeftSwipe || isRightSwipeWhenRevealed);

        if (!shouldHandle && gestureState.dx > 0) {
          if (__DEV__) console.log('🚫 닫힌 상태에서 오른쪽 스와이프 차단');
        }

        return shouldHandle;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        translateX.setOffset(translateX._value);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // 현재 translateX 값 가져오기
        const currentOffset = translateX._offset || 0;
        const newValue = currentOffset + gestureState.dx;

        if (gestureState.dx <= 0) {
          // 왼쪽 스와이프 - 액션 표시
          translateX.setValue(Math.max(newValue, -actions.length * ACTION_WIDTH));
        } else if (isRevealed && currentOffset < 0) {
          // 오른쪽 스와이프 - 액션 닫기 (열린 상태이고 실제로 왼쪽으로 이동된 상태에서만)
          translateX.setValue(Math.min(newValue, 0));
        }
        // 닫힌 상태에서 오른쪽 스와이프는 완전히 무시
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        const currentValue = translateX._value;
        if (__DEV__) console.log('🔄 스와이프 릴리즈:', {
          dx: gestureState.dx,
          currentValue,
          threshold: SWIPE_THRESHOLD,
          isRevealed
        });

        if (gestureState.dx < -SWIPE_THRESHOLD && currentValue > -actions.length * ACTION_WIDTH / 2) {
          // 왼쪽으로 스와이프 - 액션 버튼들 표시
          if (__DEV__) console.log('✅ 액션 버튼 표시');
          Animated.spring(translateX, {
            toValue: -actions.length * ACTION_WIDTH,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
          setIsRevealed(true);
          // 스와이프가 열릴 때 콜백 호출
          onSwipeOpen?.();
        } else if (isRevealed && (gestureState.dx > SWIPE_THRESHOLD || currentValue > -actions.length * ACTION_WIDTH / 2)) {
          // 열린 상태에서 오른쪽으로 스와이프 또는 반 이상 닫힌 상태 - 원래 위치로 복귀
          if (__DEV__) console.log('↩️ 원래 위치로 복귀');
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
          setIsRevealed(false);
        } else if (!isRevealed && gestureState.dx > 0) {
          // 닫힌 상태에서 오른쪽 스와이프는 무시하고 항상 원래 위치 유지
          if (__DEV__) console.log('🚫 닫힌 상태에서 오른쪽 스와이프 무시');
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
        } else {
          // 그 외의 경우 - 현재 상태 유지 (열린 상태면 열린 상태로, 닫힌 상태면 닫힌 상태로)
          if (isRevealed) {
            if (__DEV__) console.log('🔄 액션 버튼 상태 유지');
            Animated.spring(translateX, {
              toValue: -actions.length * ACTION_WIDTH,
              useNativeDriver: false,
              tension: 100,
              friction: 8,
            }).start();
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
              tension: 100,
              friction: 8,
            }).start();
          }
        }
      },
    });
  }, [forceReset, isRevealed, actions]);

  const closeActions = useCallback(() => {
    if (__DEV__) console.log('🔒 액션 닫기 실행');
    translateX.stopAnimation();
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start(() => {
      // 애니메이션 완료 후 추가 검증
      translateX.setValue(0);
      translateX.setOffset(0);
      if (__DEV__) console.log('✅ 액션 닫기 완료');
    });
    setIsRevealed(false);
  }, [translateX]);

  // 외부에서 호출할 수 있는 함수들을 ref로 노출
  useImperativeHandle(ref, () => ({
    close: closeActions,
  }), [closeActions]);

  return (
    <View style={[styles.container, cardStyle]}>
      {/* 액션 버튼들 - 뒤에서 보이도록 */}
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              {
                backgroundColor: action.backgroundColor,
                right: (actions.length - 1 - index) * ACTION_WIDTH,
              },
            ]}
            onPress={() => {
              if (__DEV__) console.log(`🎯 액션 버튼 클릭됨: ${action.id}`);
              action.onPress();
              closeActions();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={24}
              color={action.color}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* 메인 카드 콘텐츠 */}
      <Animated.View
        style={[
          styles.cardContent,
          {
            transform: [{ translateX }],
            backgroundColor: isDarkMode ? '#1A1D29' : '#FFFFFF',
          },
        ]}
        {...(panResponder.current?.panHandlers || {})}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (isRevealed) {
              if (__DEV__) console.log('🔒 카드 터치로 액션 닫기');
              closeActions();
            }
          }}
          style={styles.cardTouchArea}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>

      {/* 오버레이 - 액션이 표시될 때 탭하여 닫기 */}
      {isRevealed && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={closeActions}
          activeOpacity={1}
        />
      )}
    </View>
  );
});

SwipeableCard.displayName = 'SwipeableCard';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 4,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  actionButton: {
    position: 'absolute',
    width: ACTION_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  cardContent: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTouchArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});

export default SwipeableCard;