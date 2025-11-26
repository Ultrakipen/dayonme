// hooks/useTheme.ts
// 테마 관리를 위한 커스텀 훅
import { useContext, useCallback, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { ThemeType, THEMES, DEFAULT_THEME } from '../constants/theme';
import useLocalStorage from './useLocalStorage';
import { APP_CONSTANTS } from '../constants';
export const useTheme = () => {
const context = useContext(ThemeContext);
const [storedTheme, setStoredTheme] = useLocalStorage<ThemeType>(
APP_CONSTANTS.STORAGE_KEYS.THEME,
DEFAULT_THEME
);
if (!context) {
throw new Error('useTheme must be used within a ThemeProvider');
}
const { theme: themeType, setTheme } = context;
// 시스템 테마 가져오기
const getSystemTheme = useCallback((): ColorSchemeName => {
return Appearance.getColorScheme() || 'light';
}, []);
// 테마 변경하기
const changeTheme = useCallback(
async (newTheme: ThemeType) => {
await setStoredTheme(newTheme);
setTheme(newTheme === 'system' ? getSystemTheme() as ThemeType : newTheme);
},
[getSystemTheme, setStoredTheme, setTheme]
);
// 시스템 테마 변경 감지하기
useEffect(() => {
if (storedTheme === 'system') {
  setTheme(getSystemTheme() as ThemeType);
const subscription = Appearance.addChangeListener(({ colorScheme }) => {
  if (colorScheme) {
    setTheme(colorScheme);
  }
});

return () => {
  subscription.remove();
};
}
}, [getSystemTheme, setTheme, storedTheme]);
// 로컬 스토리지의 테마 불러오기
useEffect(() => {
if (storedTheme) {
  setTheme(storedTheme === 'system' ? getSystemTheme() as ThemeType : storedTheme);
}
}, [getSystemTheme, setTheme, storedTheme]);
return {
theme: THEMES[themeType as keyof typeof THEMES],// theme 객체 반환
themeType, // 'light' 또는 'dark'
themeSetting: storedTheme, // 'light', 'dark', 또는 'system'
isDarkMode: themeType === 'dark',
changeTheme,
getSystemTheme,
};
};
export default useTheme;