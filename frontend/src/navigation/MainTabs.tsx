// src/navigation/MainTabs.tsx - 업데이트된 버전
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, View, Text, Dimensions, PixelRatio, Platform } from 'react-native';
import { NavigationProp, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import HomeStack from './HomeStack';
import ComfortStack from './ComfortStack';
import ChallengeStack from './ChallengeStack';
import ReviewScreen from '../screens/ReviewScreen';
import ProfileStack from './ProfileStack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { MainTabParamList } from '../types/navigation';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<MainTabParamList>();

// 탭 라벨은 글자 크기 설정을 1.3배까지는 그대로 따르고 그 이상은 막는다. 제한을 완전히 풀면(2.0배) 라벨마다 줄어드는 정도가 달라 어색해지는 것을 실험으로 확인함
const renderTabLabel = (title: string) => ({ color }: { color: string }) => {
  const sizes = getResponsiveSizes();
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      numberOfLines={1}
      style={{ color, fontSize: sizes.FONT_SIZE, fontWeight: '700', letterSpacing: -0.2, marginTop: sizes.MARGIN_TOP_LABEL, marginBottom: sizes.MARGIN_BOTTOM }}
    >
      {title}
    </Text>
  );
};
const Stack = createStackNavigator();

// 인스타그램 스타일 탭바 크기 (2026 모바일 트렌드)
const getResponsiveSizes = () => {
  return {
    TAB_BAR_HEIGHT: 50,           // 탭바 높이
    TAB_ITEM_HEIGHT: 50,          // 아이템 높이
    ICON_SIZE_ACTIVE: 24,         // 활성 아이콘 크기
    ICON_SIZE_INACTIVE: 24,       // 비활성 아이콘 크기
    FONT_SIZE: 11,                // 폰트 크기
    PADDING_BOTTOM: 8,            // 하단 패딩
    PADDING_TOP: 0,               // 상단 패딩
    SHADOW_OFFSET: -2,            // 그림자 오프셋
    SHADOW_RADIUS: 8,             // 그림자 반경
    MARGIN_TOP: 0,                // 아이콘 상단 마진
    MARGIN_TOP_LABEL: 2,          // 라벨 상단 마진
    MARGIN_BOTTOM: 2,             // 라벨 하단 마진
    PADDING_ITEM_TOP: 3,          // 아이템 상단 패딩
    PADDING_ITEM_BOTTOM: 3,       // 아이템 하단 패딩
  };
};

const MainTabs = () => {
  const { isDark, theme } = useModernTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  // 반응형 크기 가져오기
  const sizes = getResponsiveSizes();

  // 화면 비율에 따른 동적 여백 계산
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width; // 세로/가로 비율

  // 기기 타입별 여백 계산
  const getBottomPadding = () => {
    // insets.bottom이 충분히 크면 시스템 값 우선 사용
    if (insets.bottom > 10) {
      return insets.bottom + 4;
    }

    // 플립/폴더블 같은 긴 화면 (2.3 이상)
    if (aspectRatio > 2.3) {
      return 12;
    }

    // 일반 스마트폰
    return 8;
  };

  const getTabBarHeight = () => {
    const basePadding = getBottomPadding();
    return sizes.TAB_BAR_HEIGHT + basePadding;
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#000000' : '#ffffff' }}>
        <ActivityIndicator size="large" color="#405DE6" />
      </View>
    );
  }

  // 비로그인 사용자도 MainTabs 접근 가능
  // 각 화면에서 개별적으로 인증 체크

  return (
    <Tab.Navigator
      screenOptions={{
        // 진하고 뚜렷한 감정 앱 컬러 팔레트
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#9ca3af',
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#FFFFFF', // 순백으로 변경 (대비 향상)
          borderTopWidth: 0,
          // 화면 비율에 따라 동적으로 계산된 여백
          paddingBottom: getBottomPadding(),
          paddingTop: sizes.PADDING_TOP,
          // 화면 비율에 따라 동적으로 계산된 높이
          height: getTabBarHeight(),
          // 부드럽고 자연스러운 그림자
          elevation: 16,
          shadowColor: isDark ? '#000' : theme.colors.primary,
          shadowOffset: { width: 0, height: sizes.SHADOW_OFFSET },
          shadowOpacity: isDark ? 0.3 : 0.12,
          shadowRadius: sizes.SHADOW_RADIUS,
        },
        tabBarItemStyle: {
          height: sizes.TAB_ITEM_HEIGHT,
          paddingTop: sizes.PADDING_ITEM_TOP,
          paddingBottom: sizes.PADDING_ITEM_BOTTOM,
        },
        tabBarIconStyle: {
          marginTop: sizes.MARGIN_TOP,
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: sizes.FONT_SIZE,
          fontWeight: '700', // Bold로 강화
          marginTop: sizes.MARGIN_TOP_LABEL,
          marginBottom: sizes.MARGIN_BOTTOM,
          letterSpacing: -0.2, // 글자 간격 조정
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={({ route }) => ({
          headerShown: false,
          tabBarLabel: renderTabLabel('나의 하루'),
          tabBarStyle: (() => {
            const routeName = getFocusedRouteNameFromRoute(route);
            if (routeName === 'PostDetail' || routeName === 'WriteMyDay' || routeName === 'EditPost') {
              return { display: 'none' };
            }
            return {
              backgroundColor: isDark ? '#1f2937' : '#FFFFFF',
              borderTopWidth: 0,
              paddingBottom: getBottomPadding(),
              paddingTop: sizes.PADDING_TOP,
              height: getTabBarHeight(),
              elevation: 16,
              shadowColor: isDark ? '#000' : theme.colors.primary,
              shadowOffset: { width: 0, height: sizes.SHADOW_OFFSET },
              shadowOpacity: isDark ? 0.3 : 0.12,
              shadowRadius: sizes.SHADOW_RADIUS,
            };
          })(),
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => {
            try {
              return (
                <MaterialCommunityIcons
                  name={focused ? 'home' : 'home-outline'}
                  color={color}
                  size={focused ? sizes.ICON_SIZE_ACTIVE : sizes.ICON_SIZE_INACTIVE}
                />
              );
            } catch (error) {
              // Icon rendering error - silently handle and return null
              return null;
            }
          },
        })}
        listeners={({ navigation }: { navigation: NavigationProp<MainTabParamList> }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.navigate('Home', {
              screen: 'HomeMain',
            });
          },
        })}
      />

      <Tab.Screen
        name="Comfort"
        component={ComfortStack}
        options={({ route }) => ({
          headerShown: false,
          tabBarLabel: renderTabLabel('위로와 공감'),
          tabBarStyle: (() => {
            const routeName = getFocusedRouteNameFromRoute(route);
            if (routeName === 'PostDetail' || routeName === 'WriteComfortPost') {
              return { display: 'none' };
            }
            return {
              backgroundColor: isDark ? '#1f2937' : '#FFFFFF',
              borderTopWidth: 0,
              paddingBottom: getBottomPadding(),
              paddingTop: sizes.PADDING_TOP,
              height: getTabBarHeight(),
              elevation: 16,
              shadowColor: isDark ? '#000' : theme.colors.primary,
              shadowOffset: { width: 0, height: sizes.SHADOW_OFFSET },
              shadowOpacity: isDark ? 0.3 : 0.12,
              shadowRadius: sizes.SHADOW_RADIUS,
            };
          })(),
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons
              name={focused ? 'heart' : 'heart-outline'}
              color={color}
              size={focused ? sizes.ICON_SIZE_ACTIVE : sizes.ICON_SIZE_INACTIVE}
            />
          ),
        })}
        listeners={({ navigation }: { navigation: NavigationProp<MainTabParamList> }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.navigate('Comfort', {
              screen: 'ComfortMain',
            });
          },
        })}
      />

      <Tab.Screen
        name="Challenge"
        component={ChallengeStack}
        options={({ route }) => ({
          headerShown: false,
          tabBarLabel: renderTabLabel('감정 챌린지'),
          tabBarStyle: (() => {
            const routeName = getFocusedRouteNameFromRoute(route);
            if (routeName === 'PostDetail' || routeName === 'ChallengeDetail') {
              return { display: 'none' };
            }
            return {
              backgroundColor: isDark ? '#1f2937' : '#FFFFFF',
              borderTopWidth: 0,
              paddingBottom: getBottomPadding(),
              paddingTop: sizes.PADDING_TOP,
              height: getTabBarHeight(),
              elevation: 16,
              shadowColor: isDark ? '#000' : theme.colors.primary,
              shadowOffset: { width: 0, height: sizes.SHADOW_OFFSET },
              shadowOpacity: isDark ? 0.3 : 0.12,
              shadowRadius: sizes.SHADOW_RADIUS,
            };
          })(),
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons
              name={focused ? 'trophy' : 'trophy-outline'}
              color={color}
              size={focused ? sizes.ICON_SIZE_ACTIVE : sizes.ICON_SIZE_INACTIVE}
            />
          ),
        })}
        listeners={({ navigation }: { navigation: NavigationProp<MainTabParamList> }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.navigate('Challenge', {
              screen: 'ChallengeMain',
            });
          },
        })}
      />

      <Tab.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          headerShown: false,
          tabBarLabel: renderTabLabel('감정 리뷰'),
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons
              name={focused ? 'chart-line' : 'chart-line-variant'}
              color={color}
              size={focused ? sizes.ICON_SIZE_ACTIVE : sizes.ICON_SIZE_INACTIVE}
            />
          ),
        }}
        listeners={({ navigation }: { navigation: NavigationProp<MainTabParamList> }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.navigate('Review');
          },
        })}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarLabel: renderTabLabel('프로필'),
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons
              name={focused ? 'account' : 'account-outline'}
              color={color}
              size={focused ? sizes.ICON_SIZE_ACTIVE : sizes.ICON_SIZE_INACTIVE}
            />
          ),
        }}
        listeners={({ navigation }: { navigation: NavigationProp<MainTabParamList> }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.navigate('Profile', {
              screen: 'ProfileMain',
            });
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
