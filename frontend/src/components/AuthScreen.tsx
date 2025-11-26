// src/components/AuthScreen.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);

  // Mock navigation object for screens
  const mockNavigation = {
    navigate: (screenName: string) => {
      if (screenName === 'Register') {
        setIsLogin(false);
      } else if (screenName === 'Login') {
        setIsLogin(true);
      }
    },
    goBack: () => {
      setIsLogin(true);
    },
  };

  return (
    <View style={{ flex: 1 }}>
      {isLogin ? (
        <LoginScreen navigation={mockNavigation} />
      ) : (
        <RegisterScreen navigation={mockNavigation} />
      )}
    </View>
  );
};

export default AuthScreen;