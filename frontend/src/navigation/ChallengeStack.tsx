// src/navigation/ChallengeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChallengeScreen from '../screens/ChallengeScreen';
import MyChallengesScreen from '../screens/MyChallengesScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';
import HotChallengesScreen from '../screens/HotChallengesScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EmotionReportScreen from '../screens/EmotionReportScreen';
import { ChallengeStackParamList } from '../types/navigation';
import { useModernTheme } from '../contexts/ModernThemeContext';

const Stack = createNativeStackNavigator<ChallengeStackParamList>();

const ChallengeStack = () => {
  const { theme, isDark } = useModernTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.bg.primary,
        },
        headerTintColor: theme.text.primary,
        headerTitleStyle: {
          color: theme.text.primary,
        },
      }}
    >
      <Stack.Screen
        name="ChallengeMain"
        component={ChallengeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyChallenges"
        component={MyChallengesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{
          title: '챌린지 상세',
          headerStyle: {
            backgroundColor: theme.bg.primary,
          },
          headerTintColor: theme.text.primary,
          headerTitleStyle: {
            color: theme.text.primary,
          },
        }}
      />
      <Stack.Screen
        name="CreateChallenge"
        component={CreateChallengeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HotChallenges"
        component={HotChallengesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: '사용자 프로필',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="NotificationScreen"
        component={NotificationScreen}
        options={{
          title: '알림',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          title: '프로필',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="EmotionReport"
        component={EmotionReportScreen}
        options={{
          title: '감정 리포트',
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
};

export default ChallengeStack;