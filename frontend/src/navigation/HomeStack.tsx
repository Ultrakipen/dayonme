// src/navigation/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types/navigation';

// 화면 컴포넌트들 import
import HomeScreen from '../screens/HomeScreen';
import EmotionLogScreen from '../screens/EmotionLogScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import EditPostScreen from '../screens/EditPostScreen'; // 게시물 수정 화면 추가
import PostDetailRouter from '../screens/PostDetail/PostDetailRouter';
import WriteMyDayScreen from '../screens/WriteMyDayScreen';
import MyDayDetailScreen from '../screens/MyDayDetailScreen';
import WriteComfortPostScreen from '../screens/WriteComfortPostScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeMain"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
          height: 50,
        },
        headerLeftContainerStyle: {
          paddingLeft: 0,
        },
        headerRightContainerStyle: {
          paddingRight: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: 'Pretendard-Bold',
        },
        headerStatusBarHeight: 0,
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          title: '홈',
          headerShown: false // 탭 헤더 사용
        }}
      />
      
      <Stack.Screen 
        name="EmotionLog" 
        component={EmotionLogScreen} 
        options={{ 
          title: '감정 기록'
        }} 
      />
      
      <Stack.Screen 
        name="MyPosts" 
        component={MyPostsScreen} 
        options={{ 
          title: '내 게시물'
        }} 
      />
      
      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen} 
        options={{ 
          title: '게시물 작성',
          presentation: 'modal'
        }} 
      />

      {/* 게시물 수정 화면 추가 */}
      <Stack.Screen 
        name="EditPost" 
        component={EditPostScreen} 
        options={{ 
          title: '게시물 수정',
          presentation: 'modal'
        }} 
      />
      
      <Stack.Screen
        name="PostDetail"
        component={PostDetailRouter}
        options={{
          title: '게시물 상세',
          headerShown: false
        }}
      />
      
      <Stack.Screen 
        name="WriteMyDay" 
        component={WriteMyDayScreen} 
        options={{ 
          title: '나의 하루 공유하기',
          presentation: 'modal'
        }} 
      />
      
      <Stack.Screen
        name="MyDayDetail"
        component={MyDayDetailScreen}
        options={{
          title: '나의 이야기',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="WriteComfortPost"
        component={WriteComfortPostScreen}
        options={{
          title: '위로와 공감',
          presentation: 'modal'
        }}
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
    </Stack.Navigator>
  );
};

export default HomeStack;