import React, { useState, useEffect, useRef } from 'react';
import { Text as RNText, Animated, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  style: TextStyle;
}

const AnimatedNumber = ({ value, style }: AnimatedNumberProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<any>(null);
  const listenerIdRef = useRef<string | null>(null);

  useEffect(() => {
    animationRef.current = Animated.timing(animatedValue, {
      toValue: value,
      duration: 1000,
      useNativeDriver: false,
    });
    animationRef.current.start();

    listenerIdRef.current = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    return () => {
      // 애니메이션 중지
      if (animationRef.current) {
        animationRef.current.stop();
      }
      // 리스너 제거 (안전하게)
      if (listenerIdRef.current != null && animatedValue && animatedValue.removeListener) {
        try {
          animatedValue.removeListener(listenerIdRef.current);
        } catch (e) {
          // 이미 제거된 경우 무시
        }
      }
      listenerIdRef.current = null;
    };
  }, [value, animatedValue]);

  return <RNText style={style}>{displayValue}</RNText>;
};

export default AnimatedNumber;
