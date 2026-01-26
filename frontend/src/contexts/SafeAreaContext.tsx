// src/contexts/SafeAreaContext.tsx
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Platform, StatusBar, Dimensions } from 'react-native';

// SafeArea 기본값 정의 (SafeAreaProvider 없이)
interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface SafeAreaContextType {
  insets: SafeAreaInsets;
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 기본 SafeArea 값 계산 (lazy)
const getDefaultSafeAreaInsets = (): SafeAreaInsets => {
  if (Platform.OS === 'android') {
    return {
      top: StatusBar.currentHeight || 24,
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  // iOS의 경우 일반적인 Safe Area 값
  return {
    top: 44,
    right: 0,
    bottom: 34,
    left: 0,
  };
};

// React Native 0.80 호환성: lazy 초기화
const getDefaultValue = (): SafeAreaContextType => {
  let width = 360;
  let height = 780;
  try {
    const dims = Dimensions.get('window');
    if (dims.width > 0 && dims.height > 0) {
      width = dims.width;
      height = dims.height;
    }
  } catch (e) {
    // 런타임이 아직 준비되지 않음
  }
  return {
    insets: getDefaultSafeAreaInsets(),
    frame: { x: 0, y: 0, width, height },
  };
};

// 기본값 (런타임에 계산)
const defaultValue: SafeAreaContextType = {
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
  frame: { x: 0, y: 0, width: 360, height: 780 },
};

const SafeAreaContextProvider = createContext<SafeAreaContextType>(defaultValue);

interface SafeAreaProviderProps {
  children: ReactNode;
}

export const SafeAreaContext: React.FC<SafeAreaProviderProps> = ({ children }) => {
  const [contextValue, setContextValue] = useState(defaultValue);

  useEffect(() => {
    try {
      // 안전한 Dimensions 접근
      const updateSafeArea = () => {
        try {
          const { width, height } = Dimensions.get('window');
          const newValue = {
            insets: getDefaultSafeAreaInsets(),
            frame: {
              x: 0,
              y: 0,
              width,
              height,
            },
          };
          setContextValue(newValue);
        } catch (error) {
          if (__DEV__) console.warn('SafeArea 업데이트 실패:', error);
        }
      };

      updateSafeArea();

      const subscription = Dimensions.addEventListener('change', updateSafeArea);
      return () => subscription?.remove();
    } catch (error) {
      if (__DEV__) console.warn('SafeArea 초기화 실패:', error);
    }
  }, []);

  return (
    <SafeAreaContextProvider.Provider value={contextValue}>
      {children}
    </SafeAreaContextProvider.Provider>
  );
};

// useSafeAreaInsets 훅 (react-native-safe-area-context와 호환)
export const useSafeAreaInsets = (): SafeAreaInsets => {
  const context = useContext(SafeAreaContextProvider);
  return context.insets;
};

// useSafeAreaFrame 훅
export const useSafeAreaFrame = () => {
  const context = useContext(SafeAreaContextProvider);
  return context.frame;
};

export default SafeAreaContext;