// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { AuthProvider } from '../contexts/AuthContext';
import { EmotionProvider } from '../contexts/EmotionContext';
import { ThemeProvider } from '../contexts/ThemeContext';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import LoadingIndicator from '../components/LoadingIndicator';

const Stack = createStackNavigator();

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingIndicator text="앱 로딩 중..." />;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? "Main" : "Auth"}
      >
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppNavigator = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EmotionProvider>
          <AppContent />
        </EmotionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppNavigator;