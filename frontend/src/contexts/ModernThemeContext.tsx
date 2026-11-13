// contexts/ModernThemeContext.tsx - 모던 스타일 테마 컨텍스트
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, createTheme, lightTheme, darkTheme, THEME_MODE } from '../theme';
import type { ColorTheme } from '../theme/colors';

type ThemePreference = 'light' | 'dark' | 'system';

interface ModernThemeContextType {
  theme: Theme;
  themeMode: ColorTheme;
  preference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
  isDark: boolean;
  colors: Theme['colors'];
  spacing: Theme['spacing'];
}

export const ModernThemeContext = createContext<ModernThemeContextType | undefined>(undefined);

export const useModernTheme = () => {
  const context = useContext(ModernThemeContext);
  if (context === undefined) {
    throw new Error('useModernTheme must be used within a ModernThemeProvider');
  }
  return context;
};

interface ModernThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'modern_theme_preference';

export const ModernThemeProvider: React.FC<ModernThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<Theme>(lightTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // 실제 테마 모드 계산
  const getActualTheme = (pref: ThemePreference): ColorTheme => {
    if (pref === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return pref as ColorTheme;
  };

  // 테마 초기화
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const validPreference = savedPreference && ['light', 'dark', 'system'].includes(savedPreference)
          ? savedPreference as ThemePreference
          : 'system';

        setPreference(validPreference);
        
        const actualTheme = getActualTheme(validPreference);
        setTheme(createTheme(actualTheme));
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setPreference('system');
        setTheme(lightTheme);
        setIsLoaded(true);
      }
    };

    initializeTheme();
  }, []);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (preference === 'system') {
      const actualTheme = getActualTheme('system');
      setTheme(createTheme(actualTheme));
    }
  }, [systemColorScheme, preference]);

  // 테마 설정 변경
  const setThemePreference = async (newPreference: ThemePreference) => {
    try {
      setPreference(newPreference);
      
      const actualTheme = getActualTheme(newPreference);
      setTheme(createTheme(actualTheme));
      
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newPreference);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // 테마 토글
  const toggleTheme = async () => {
    const newPreference = theme.isDark ? 'light' : 'dark';
    await setThemePreference(newPreference);
  };

  // 로딩 중일 때는 기본 테마로 렌더링
  if (!isLoaded) {
    const defaultContextValue: ModernThemeContextType = {
      theme: lightTheme,
      themeMode: 'light',
      preference: 'system',
      setThemePreference: async () => {},
      toggleTheme: async () => {},
      isDark: false,
      colors: lightTheme.colors,
      spacing: lightTheme.spacing,
    };

    return (
      <ModernThemeContext.Provider value={defaultContextValue}>
        {children}
      </ModernThemeContext.Provider>
    );
  }

  const contextValue: ModernThemeContextType = {
    theme,
    themeMode: theme.mode,
    preference,
    setThemePreference,
    toggleTheme,
    isDark: theme.isDark,
    colors: theme.colors,
    spacing: theme.spacing,
  };

  return (
    <ModernThemeContext.Provider value={contextValue}>
      {children}
    </ModernThemeContext.Provider>
  );
};

// 테마 유틸리티 훅들
export const useThemeColors = () => {
  const { theme } = useModernTheme();
  return theme.colors;
};

export const useThemeTypography = () => {
  const { theme } = useModernTheme();
  return theme.typography;
};

export const useThemeSpacing = () => {
  const { theme } = useModernTheme();
  return theme.spacing;
};

export const useIsDarkTheme = () => {
  const { isDark } = useModernTheme();
  return isDark;
};