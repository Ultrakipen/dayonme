// theme/colors.ts - 모던 스타일 컬러 시스템
export const Colors = {
  // Primary Colors (브랜드 컬러)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main brand color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Gradient Colors (그라데이션)
  gradient: {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#f093fb', '#f5576c'],
    warm: ['#ffecd2', '#fcb69f'],
    cool: ['#a8edea', '#fed6e3'],
  },
  
  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
  },
  
  // App-specific Colors
  app: {
    blue: '#0ea5e9',
    lightBlue: '#e0f2fe',
    darkGray: '#374151',
    mediumGray: '#9ca3af',
    lightGray: '#e5e7eb',
    background: '#f9fafb',
    white: '#ffffff',
    black: '#111827',
    red: '#ef4444',
  },
  
  // Dark Mode Colors (2026 트렌드: OLED 최적화 + 계층 구분 개선)
  dark: {
    background: '#121212',     // 순수 검정 대신 약간의 회색 (OLED 번인 방지)
    surface: '#1E1E1E',        // 배경과 명확한 구분 (+12 밝기)
    card: '#262626',           // 카드 레이어 더 밝게 (+8 밝기)
    cardUnread: '#2D2D3A',     // 읽지 않은 카드 강조 (보라색 틴트)
    border: '#333333',         // 테두리 더 뚜렷하게
    text: '#F5F5F5',           // 순백색 대신 약간 부드럽게 (눈 피로 감소)
    textSecondary: '#B0B0B0',  // 보조 텍스트 대비 개선
    textTertiary: '#808080',   // 3차 텍스트
  },
  
  // Light Mode Colors (2026 모바일 트렌드: 소프트하고 눈부심 없는 색상)
  light: {
    background: '#F8F8F8',    // 약간 더 따뜻한 배경 (기존 #FAFAFA)
    surface: '#F3F3F3',       // 부드러운 표면 (기존 #F5F5F5)
    card: '#FEFEFE',          // 오프화이트 카드 (눈부심 방지, 기존 #FFFFFF)
    cardUnread: '#F8F9FF',    // 읽지 않은 카드 강조
    border: '#E8E8E8',        // 부드러운 테두리 (기존 #E5E5E5)
    text: '#1A1A1A',          // 메인 텍스트 (높은 대비 유지)
    textSecondary: '#6B6B6B', // 보조 텍스트 (기존 #666666에서 약간 밝게)
    textTertiary: '#999999',  // 3차 텍스트 유지
  },
};

export type ColorTheme = 'light' | 'dark';