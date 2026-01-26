// src/navigation/ProfileStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types/navigation';

// 화면 컴포넌트들 import
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import EditPostScreen from '../screens/EditPostScreen'; // 게시물 수정 화면 추가
import MyChallengesScreen from '../screens/MyChallengesScreen';
import BlockManagementScreen from '../screens/BlockManagementScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: 'Pretendard-Bold',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ 
          title: '프로필',
          headerShown: false // 탭 헤더 사용
        }} 
      />
      
      <Stack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen} 
        options={{ 
          title: '프로필 수정',
          presentation: 'modal'
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
        name="MyChallenges" 
        component={MyChallengesScreen} 
        options={{ 
          title: '내 챌린지'
        }} 
      />
      
      <Stack.Screen 
        name="BlockManagement" 
        component={BlockManagementScreen} 
        options={{ 
          title: '차단 관리'
        }} 
      />
      
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          title: '설정'
        }} 
      />
      
      {/* 추가 화면들 - 향후 구현 예정 */}
      <Stack.Screen 
        name="ChangePassword" 
        component={SettingsScreen} // 임시로 SettingsScreen 사용
        options={{ 
          title: '비밀번호 변경'
        }} 
      />
      
      <Stack.Screen 
        name="FAQ" 
        component={SettingsScreen} // 임시로 SettingsScreen 사용
        options={{ 
          title: '자주 묻는 질문'
        }} 
      />
      
      <Stack.Screen 
        name="Contact" 
        component={SettingsScreen} // 임시로 SettingsScreen 사용
        options={{ 
          title: '문의하기'
        }} 
      />
      
      <Stack.Screen 
        name="OpenSourceLicenses" 
        component={SettingsScreen} // 임시로 SettingsScreen 사용
        options={{ 
          title: '오픈소스 라이선스'
        }} 
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;