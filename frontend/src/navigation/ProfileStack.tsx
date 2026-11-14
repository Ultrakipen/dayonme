// src/navigation/ProfileStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import MyChallengesScreen from '../screens/MyChallengesScreen';
import BlockManagementScreen from '../screens/BlockManagementScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import EncouragementScreen from '../screens/EncouragementScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import { ProfileStackParamList } from '../types/navigation';
import PasswordChangeScreen from '../screens/PasswordChangeScreen';
import NoticeScreen from '../screens/NoticeScreen';
import FAQScreen from '../screens/FAQScreen';
import ContactScreen from '../screens/ContactScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import MyReportsScreen from '../screens/MyReportsScreen';
import OpenSourceLicensesScreen from '../screens/OpenSourceLicensesScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ 
          title: '프로필',
          headerShown: false // ProfileScreen에서 자체적으로 헤더 구성
        }} 
      />
      
      <Stack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen} 
        options={{ 
          title: '프로필 편집',
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
          title: '새 게시물 작성',
          presentation: 'modal',
          headerShown: false // CreatePostScreen에서 자체적으로 헤더 구성
        }} 
      />
      
    <Stack.Screen 
  name="MyChallenge"  // MyChallenges → MyChallenge
  component={MyChallengesScreen}  // 컴포넌트는 그대로
  options={{ title: '내 챌린지' }} 
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

      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{
          title: '계정 설정',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: '알림 설정',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{
          title: '관심 글',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="Encouragement"
        component={EncouragementScreen}
        options={{
          title: '받은 격려 메시지',
          headerShown: false
        }}
      />

      {/* 추가 화면들 - 향후 구현 예정 */}
      <Stack.Screen
        name="ChangePassword"
        component={PasswordChangeScreen}
        options={{
          title: '비밀번호 변경',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="Notice"
        component={NoticeScreen}
        options={{
          title: '공지사항',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{
          title: '자주 묻는 질문',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: '문의하기',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          title: '이용약관',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          title: '개인정보 처리방침',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{
          title: '내 신고 내역',
          headerShown: false
        }}
      />

      <Stack.Screen
        name="OpenSourceLicenses"
        component={OpenSourceLicensesScreen}
        options={{
          title: '오픈소스 라이선스',
          headerShown: false
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

export default ProfileStack;