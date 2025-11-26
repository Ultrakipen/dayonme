// src/navigation/AuthStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PasswordRecoveryScreen from '../screens/PasswordRecoveryScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ApiTestScreen from '../screens/ApiTestScreen'; // 테스트용
import NaverLoginWebView from '../screens/NaverLoginWebView';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordRecovery: undefined;
  ResetPassword: { token: string };
  ApiTest: undefined;
  NaverLoginWebView: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ApiTest" component={ApiTestScreen} />
      <Stack.Screen name="NaverLoginWebView" component={NaverLoginWebView} />
    </Stack.Navigator>
  );
};

export default AuthStack;