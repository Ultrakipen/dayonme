// src/hooks/HomeScreen/useHomeScroll.ts
import { useState, useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';

/**
 * HomeScreen 스크롤 관리 hook
 */
export const useHomeScroll = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const postPositions = useRef<{ [postId: number]: number }>({});
  const cumulativeY = useRef<number>(0);
  const postRefs = useRef<{ [postId: number]: any }>({});

  // 스크롤 이벤트 처리
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > 200);
  }, []);

  // 상단으로 스크롤
  const scrollToTop = useCallback(() => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  }, []);

  // 위치 캐시 초기화
  const resetScrollPositions = useCallback(() => {
    postPositions.current = {};
    cumulativeY.current = 0;
  }, []);

  return {
    scrollViewRef,
    showScrollToTop,
    postPositions,
    cumulativeY,
    postRefs,
    handleScroll,
    scrollToTop,
    resetScrollPositions,
  };
};

export default useHomeScroll;
