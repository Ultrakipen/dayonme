// src/navigation/MainTabs.tsx - 업데이트된 버전
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, View, Dimensions, PixelRatio, Platform } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator();

// 인스타그램 스타일 탭바 크기 (2026 모바일 트렌드)
const getResponsiveSizes = () => {
  return {
    TAB_BAR_HEIGHT: 60,           // 탭바 높이 증가
    TAB_ITEM_HEIGHT: 60,          // 아이템 높이
    ICON_SIZE_ACTIVE: 26,         // 활성 아이콘 크기 (인스타그램과 동일)
    ICON_SIZE_INACTIVE: 26,       // 비활성 아이콘도 같은 크기로 통일
    FONT_SIZE: 12,                // 폰트 크기 (11→12 가독성 향상)
    PADDING_BOTTOM: 12,           // 하단 패딩 증가 (텍스트와 하단 여백)
    PADDING_TOP: 0,               // 상단 패딩
    SHADOW_OFFSET: -2,            // 그림자 오프셋
    SHADOW_RADIUS: 8,             // 그림자 반경
    MARGIN_TOP: 0,                // 아이콘 상단 마진
    MARGIN_TOP_LABEL: 2,          // 라벨 상단 마진
    MARGIN_BOTTOM: 4,             // 라벨 하단 마진 추가
    PADDING_ITEM_TOP: 4,          // 아이템 상단 패딩
    PADDING_ITEM_BOTTOM: 4,       // 아이템 하단 패딩
  };
};

const MainTabs = () => {
  const { isDark } = useModernTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  // 반응형 크기 가져오기
  const sizes = getResponsiveSizes();

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
        // 키보드가 올라오면 탭바 숨김 (Android)
        tabBarHideOnKeyboard: true,
        // 진하고 뚜렷한 감정 앱 컬러 팔레트
        tabBarActiveTintColor: isDark ? '#A78BFA' : '#667eea', // 더 선명한 보라색
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#9ca3af',
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#FFFFFF', // 순백으로 변경 (대비 향상)
          borderTopWidth: 0,
          // 갤럭시 플립 등 긴 화면 대응: 최소 패딩 20 보장
          paddingBottom: Math.max(sizes.PADDING_BOTTOM, insets.bottom, 20),
          paddingTop: sizes.PADDING_TOP,
          // 갤럭시 플립 대응: 최소 높이 80 보장
          height: Math.max(sizes.TAB_BAR_HEIGHT + insets.bottom, 80),
          // 부드럽고 자연스러운 그림자
          elevation: 16,
          shadowColor: isDark ? '#000' : '#667eea',
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
          fontFamily: 'Pretendard-Bold', // Bold로 강화
          marginTop: sizes.MARGIN_TOP_LABEL,
          marginBottom: sizes.MARGIN_BOTTOM,
          letterSpacing: -0.2, // 글자 간격 조정
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarLabel: '나의 하루',
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
        }}
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
        options={{
          headerShown: false,
          tabBarLabel: '위로와 공감',
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons
              name={focused ? 'heart' : 'heart-outline'}
              color={color}
              size={focused ? sizes.ICON_SIZE_ACTIVE : sizes.ICON_SIZE_INACTIVE}
            />
          ),
        }}
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
        options={{
          headerShown: false,
          tabBarLabel: '감정 챌린지',
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons
              name={focused ? 'trophy' : 'trophy-outline'}
              color={color}
              size={focused ? sizes.ICON_SIZE_ACTIVE : sizes.ICON_SIZE_INACTIVE}
            />
          ),
        }}
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
          tabBarLabel: '감정 리뷰',
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
          tabBarLabel: '프로필',
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
