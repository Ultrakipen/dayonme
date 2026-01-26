// 스크롤 시 헤더 숨김 애니메이션 훅
import { useRef, useState } from 'react';
import { Animated } from 'react-native';

export const useHeaderAnimation = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const headerHeight = 120; // 헤더 높이

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDelta = currentScrollY - lastScrollY.current;

        // 스크롤 방향에 따라 헤더 표시/숨김
        if (scrollDelta > 5 && currentScrollY > 100) {
          // 아래로 스크롤 - 헤더 숨김
          setIsHeaderVisible(false);
        } else if (scrollDelta < -5) {
          // 위로 스크롤 - 헤더 표시
          setIsHeaderVisible(true);
        }

        lastScrollY.current = currentScrollY;
      },
    }
  );

  return {
    headerTranslateY,
    handleScroll,
    isHeaderVisible,
    scrollY,
  };
};

export default useHeaderAnimation;
