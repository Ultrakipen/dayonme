// src/navigation/SimpleMainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import SimpleHomeStack from './SimpleHomeStack';
import SimpleComfortStack from './SimpleComfortStack';
import SimpleChallengeStack from './SimpleChallengeStack';
import SimpleReviewScreen from '../screens/SimpleReviewScreen';
import SimpleProfileStack from './SimpleProfileStack';
import AuthScreen from '../components/AuthScreen';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export type MainTabParamList = {
  Home: undefined;
  Comfort: undefined;
  Challenge: undefined;
  Review: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple icon component using text
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <Text style={{ fontSize: 16, color: focused ? '#405DE6' : '#6b7280' }}>
    {name}
  </Text>
);

// Main Tab Navigator for authenticated users
const MainTabNavigator = () => {
  const { isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: isDarkMode ? '#60a5fa' : '#405DE6',
        tabBarInactiveTintColor: isDarkMode ? '#a0a0a0' : '#6b7280',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1f2937' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 68,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={SimpleHomeStack}
        options={{
          headerShown: false,
          tabBarLabel: '나의 하루',
          tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Comfort"
        component={SimpleComfortStack}
        options={{
          headerShown: false,
          tabBarLabel: '위로와 공감',
          tabBarIcon: ({ focused }) => <TabIcon name="❤️" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Challenge"
        component={SimpleChallengeStack}
        options={{
          headerShown: false,
          tabBarLabel: '감정 챌린지',
          tabBarIcon: ({ focused }) => <TabIcon name="🏆" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Review"
        component={SimpleReviewScreen}
        options={{
          tabBarLabel: '일상 돌아보기',
          tabBarIcon: ({ focused }) => <TabIcon name="📊" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={SimpleProfileStack}
        options={{
          headerShown: false,
          tabBarLabel: '프로필',
          tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Main component that handles authentication state
const SimpleMainTabs = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Show loading handled by App.tsx
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <MainTabNavigator />;
};

export default SimpleMainTabs;