// src/navigation/SimpleHomeStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import PostDetailRouter from '../screens/PostDetail/PostDetailRouter';
import WriteMyDayScreen from '../screens/WriteMyDayScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  WriteMyDay: {
    existingPost?: {
      post_id: number;
      content: string;
      emotions: any[];
      image_url?: string;
      is_anonymous: boolean;
    };
  } | undefined;
  PostDetail: {
    postId: number;
    postType: 'myday' | 'comfort';
  };
};

const Stack = createStackNavigator<HomeStackParamList>();

const SimpleHomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="WriteMyDay"
        component={WriteMyDayScreen}
        options={{
          headerShown: true,
          headerTitle: '나의 하루 작성',
          headerBackTitle: '돌아가기',
        }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailRouter}
        options={{
          headerShown: false,
          headerTitle: '게시물 상세',
          headerBackTitle: '돌아가기',
        }}
      />
    </Stack.Navigator>
  );
};

export default SimpleHomeStack;
