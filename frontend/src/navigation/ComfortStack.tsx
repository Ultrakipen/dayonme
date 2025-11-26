// src/navigation/ComfortStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ComfortScreen from '../screens/ComfortScreen';
import WriteComfortPostScreen from '../screens/WriteComfortPostScreen';
import PostDetailScreen from '../screens/PostDetail';
import ComfortMyPostsScreen from '../screens/ComfortMyPostsScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import BestPostsScreen from '../screens/BestPostsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useModernTheme } from '../contexts/ModernThemeContext';

// ComfortStack 전용 타입 (navigation.ts의 ComfortStackParamList와 별개)
export type ComfortStackParamList = {
  ComfortMain: {
    refresh?: boolean;
    newPost?: any;
    shouldRefresh?: boolean;
    updatedPostId?: number;
    showSuccess?: boolean;
  } | undefined;
  WriteComfortPost: {
    postId?: number;
    editMode?: boolean;
    existingPost?: {
      title?: string;
      content?: string;
      tags?: any[];
      is_anonymous?: boolean;
      images?: any[];
    };
  } | undefined;
  EditComfortPost: {
    postId: number;
  };
  PostDetail: {
    postId: number;
    postType?: string;
  };
  ComfortMyPosts: undefined;
  MyPosts: undefined;
  BestPosts: undefined; // 베스트 게시물 전체보기 화면 추가
  UserProfile: { userId: number; nickname?: string }; // 다른 사용자 프로필 화면 추가
  NotificationScreen: undefined; // 알림 화면 추가
  ProfileMain: undefined; // 본인 프로필 화면 추가
};

const Stack = createStackNavigator<ComfortStackParamList>();

const ComfortStack = () => {
  const { theme, isDark } = useModernTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomWidth: isDark ? 1 : 0,
          borderBottomColor: theme.colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerLeftContainerStyle: {
          paddingLeft: 0,
        },
        headerRightContainerStyle: {
          paddingRight: 0,
        },
        headerTintColor: theme.text.primary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 16,
          color: theme.text.primary,
        },
      }}
    >
      <Stack.Screen
        name="ComfortMain"
        component={ComfortScreen}
        options={{
          title: '위로와 공감',
        }}
      />
      <Stack.Screen
        name="WriteComfortPost"
        component={WriteComfortPostScreen}
        options={{
          title: '고민 나누기',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EditComfortPost"
        component={WriteComfortPostScreen}
        options={{
          title: '게시물 수정',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          title: '게시물 상세',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ComfortMyPosts"
        component={ComfortMyPostsScreen}
        options={{
          title: '나의 게시물',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="MyPosts"
        component={MyPostsScreen}
        options={{
          title: '나의 게시글',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="BestPosts"
        component={BestPostsScreen}
        options={{
          title: '이번주 베스트',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: '사용자 프로필',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationScreen"
        component={NotificationScreen}
        options={{
          title: '알림',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          title: '프로필',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default ComfortStack;