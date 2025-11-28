// App.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, ActivityIndicator, AppState, LogBox, InteractionManager } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { ProfileProvider } from './src/contexts/ProfileContext';
import { ModernThemeProvider, useModernTheme } from './src/contexts/ModernThemeContext';
import { EmotionProvider } from './src/contexts/EmotionContext';
import { AlertProvider } from './src/contexts/AlertContext';
import SafeAppWrapper from './src/components/SafeAppWrapper';

// RootNavigator는 정적 import (동적 import 시 로드 실패 문제)
import RootNavigatorStatic from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import 'react-native-gesture-handler'; // Old Architecture에서 필요

// Lazy imports - 초기화 함수들은 런타임에 import
let initErrorReporting: any;
let initializeSpacing: any;
let initializeTypography: any;
let initializeScreenDimensions: any;
let initializeUtilsTypography: any;
let initOneSignal: any;

// React Query 클라이언트 설정 (2026 모바일 트렌드 최적화)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분 (데이터 신선도 유지)
      gcTime: 30 * 60 * 1000, // 30분 (메모리 효율)
      retry: 2, // 네트워크 불안정 대비
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // 네트워크 재연결 시 갱신
      refetchOnMount: 'always', // 최신 데이터 보장
      networkMode: 'offlineFirst', // 오프라인 우선 전략
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

// 전역 오류 핸들러 제거 - React Native 0.80 + Hermes + New Architecture 호환성 문제
// ErrorUtils를 초기화 시점에 설정하면 "property is not configurable" 오류 발생


// 콘솔 경고 무시 설정 (개발 시에만)
if (__DEV__) {
  LogBox.ignoreLogs([
    'property is not configurable',
    'AlertProvider',
    'Cannot read property',
    'UIManager',
    'EventDispatcher',
    'getEventDispatcher',
    'ViewManager',
    'RCTEventDispatcher',
    'SafeAreaProvider',
    'addEventEmitters',
    'Attempt to invoke virtual method',
    'com.facebook.react.uimanager.events.EventDispatcher',
    'getEventDispatcher()',
    'on a null object reference',
    'ReactNoCrashSoftException',
    'SafeAreaProviderManager',
    'ViewManager.java',
    'createViewInstance',
    'createView',
    'SurfaceMountingManager',
    'MountItemDispatcher',
    'dispatchMountItems',
    'tryDispatchMountItems',
    'doFrameGuarded',
    'doFrame',
    'frameCallback',
    'Choreographer',
    'Text strings must be rendered',
    'setLayoutAnimationEnabledExperimental',
  ]);
}

// UIManager 애니메이션 활성화 (Android - Old Architecture only)
// New Architecture에서는 no-op이므로 주석 처리
// if (Platform.OS === 'android') {
//   if (UIManager.setLayoutAnimationEnabledExperimental) {
//     UIManager.setLayoutAnimationEnabledExperimental(true);
//   }
// }


// 딥링크 설정
const linking = {
  prefixes: ['dayonme://', 'exp://'],
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: 'reset-password',
        },
      },
    },
  },
};

const App = () => {
  const appStateRef = useRef(AppState.currentState);
  const isMountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isAppReady, setIsAppReady] = useState(false);

  // AppState 변경 핸들러를 useCallback으로 메모이제이션
  const handleAppStateChange = useCallback((nextAppState: string) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('🔄 앱이 다시 활성화됨');
    }
    appStateRef.current = nextAppState;
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 앱 초기화 시작...');

        // 1단계: InteractionManager 대기 (네이티브 브릿지 준비)
        await new Promise((resolve) => {
          InteractionManager.runAfterInteractions(() => {
            console.log('✅ InteractionManager 준비 완료');
            resolve(true);
          });
        });

        // 2단계: 필요한 모듈들을 동적으로 import
        await new Promise(resolve => setTimeout(resolve, 100));

        if (isMountedRef.current) {
          // 초기화 함수들 동적 import
          const [
            { initializeScreenDimensions: initScreenDims },
            { initializeSpacing: initSpacing },
            { initializeTypography: initTypo },
            { initializeUtilsTypography: initUtilsTypo },
            { initErrorReporting: initError },
            { initOneSignal: initPush }
          ] = await Promise.all([
            import('./src/constants/responsive'),
            import('./src/constants/spacing'),
            import('./src/constants/typography'),
            import('./src/utils/typography'),
            import('./src/services/errorReporting'),
            import('./src/services/pushNotification')
          ]);

          // 전역 변수에 할당
          initializeScreenDimensions = initScreenDims;
          initializeSpacing = initSpacing;
          initializeTypography = initTypo;
          initializeUtilsTypography = initUtilsTypo;
          initErrorReporting = initError;
          initOneSignal = initPush;

          // 3단계: Constants 초기화 (Dimensions.get()을 안전하게 호출)
          initializeScreenDimensions();
          initializeSpacing();
          initializeTypography();
          initializeUtilsTypography();
          console.log('✅ Constants 초기화 완료');

          // 4단계: 에러 리포팅 서비스 초기화 (프로덕션 에러 추적)
          await initErrorReporting();
          console.log('✅ 에러 리포팅 서비스 초기화 완료');

          // 5단계: OneSignal 푸시 알림 초기화 (완료 대기)
          await initOneSignal();
          console.log('✅ OneSignal 푸시 알림 초기화 완료');

          setIsAppReady(true);
          console.log('✅ 앱 준비 완료 - isAppReady: true');
        }
      } catch (error) {
        console.error('❌ 앱 초기화 오류:', error);
        // 오류가 발생해도 앱 시작
        setIsAppReady(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // 메인 초기화 실행
    initializeApp();

    // cleanup 함수에서 ref 값 복사하여 사용
    const currentInitTimeout = initTimeoutRef.current;

    return () => {
      isMountedRef.current = false;
      if (currentInitTimeout) {
        clearTimeout(currentInitTimeout);
      }
      subscription?.remove();
    };
  }, [handleAppStateChange]);

  return (
    <SafeAppWrapper>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider>
              <SafeAreaProvider>
                <ThemeProvider>
                  <ModernThemeProvider>
                    <AppContent isAppReady={isAppReady} />
                  </ModernThemeProvider>
                </ThemeProvider>
              </SafeAreaProvider>
            </PaperProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAppWrapper>
  );
};

// 테마를 사용하는 컴포넌트 분리
interface AppContentProps {
  isAppReady: boolean;
}

const AppContent = ({ isAppReady }: AppContentProps) => {
  const { isDark } = useModernTheme();

  // React Navigation 테마 설정
  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#000000',
          card: '#1f2937',
          text: '#ffffff',
          border: '#374151',
        }
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: '#ffffff',
          card: '#ffffff',
          text: '#000000',
          border: '#e5e7eb',
        }
      };

  // 로딩 화면
  const LoadingView = (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#000000' : '#ffffff'
    }}>
      <ActivityIndicator
        size="large"
        color="#405DE6"
        style={{ marginBottom: 20 }}
      />
    </View>
  );

  // 앱 준비 전
  if (!isAppReady) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar
          backgroundColor={isDark ? '#000000' : '#ffffff'}
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />
        {LoadingView}
      </View>
    );
  }

  // 앱 내용 렌더링
  const AppInner = (
    <AuthProvider>
      <ProfileProvider>
        <EmotionProvider>
          <NavigationContainer
            theme={navigationTheme}
            linking={linking}
            onReady={() => __DEV__ && console.log('📱 네비게이션 준비 완료')}
            fallback={<ActivityIndicator size="large" color="#405DE6" />}
          >
            <RootNavigatorStatic />
          </NavigationContainer>
        </EmotionProvider>
      </ProfileProvider>
    </AuthProvider>
  );

  // 앱 준비 완료 후
  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        backgroundColor={isDark ? '#000000' : '#ffffff'}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <AlertProvider>{AppInner}</AlertProvider>
    </View>
  );
};

export default App;