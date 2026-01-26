// 접근성 설정 컨텍스트
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  highContrast: boolean;
  fontScale: number;
}

interface AccessibilityContextType extends AccessibilitySettings {
  setFontSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
  toggleHighContrast: () => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  highContrast: false,
  fontScale: 1.0,
};

const fontScaleMap = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
  xlarge: 1.3,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // AsyncStorage에서 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('accessibility_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({
          ...parsed,
          fontScale: fontScaleMap[parsed.fontSize as keyof typeof fontScaleMap] || 1.0,
        });
      }
    } catch (error) {
      console.error('접근성 설정 로드 실패:', error);
    }
  };

  const saveSettings = async (newSettings: AccessibilitySettings) => {
    try {
      await AsyncStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('접근성 설정 저장 실패:', error);
    }
  };

  const setFontSize = (size: 'small' | 'medium' | 'large' | 'xlarge') => {
    const newSettings = {
      ...settings,
      fontSize: size,
      fontScale: fontScaleMap[size],
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const toggleHighContrast = () => {
    const newSettings = {
      ...settings,
      highContrast: !settings.highContrast,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        setFontSize,
        toggleHighContrast,
        resetSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
