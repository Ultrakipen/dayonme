// src/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

// 네비게이터들
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

// 웰컴 화면
import WelcomeScreen from '../screens/WelcomeScreen';

// 모달 화면들
import PostDetailRouter from '../screens/PostDetail/PostDetailRouter';
import CommentScreen from '../screens/CommentScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import EditPostScreen from '../screens/EditPostScreen';
import WriteComfortPostScreen from '../screens/WriteComfortPostScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BlockManagementScreen from '../screens/BlockManagementScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import MyChallengesScreen from '../screens/MyChallengesScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import MyReportsScreen from '../screens/MyReportsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminReportListScreen from '../screens/AdminReportListScreen';
import AdminReportDetailScreen from '../screens/AdminReportDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: { backgroundColor: '#6200ee' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthStack}
        options={{ headerShown: false, presentation: 'modal' }}
      />

          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen
          name="PostDetail"
          component={PostDetailRouter}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Comment"
          component={CommentScreen}
          options={{ title: '댓글' }}
        />

        <Stack.Screen
          name="ChallengeDetail"
          component={ChallengeDetailScreen}
          options={{ title: '챌린지 상세' }}
        />

        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEditScreen}
          options={{ title: '프로필 수정' }}
        />

        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ title: '게시물 작성' }}
        />

        <Stack.Screen
          name="EditPost"
          component={EditPostScreen}
          options={{ title: '게시물 수정' }}
        />

        <Stack.Screen
          name="WriteComfortPost"
          component={WriteComfortPostScreen}
          options={{ title: '위로와 공감' }}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: '설정' }}
        />

        <Stack.Screen
          name="BlockManagement"
          component={BlockManagementScreen}
          options={{ title: '차단 관리' }}
        />

        <Stack.Screen
          name="MyPosts"
          component={MyPostsScreen}
          options={{ title: '내 게시물' }}
        />

        <Stack.Screen
          name="MyChallenges"
          component={MyChallengesScreen}
          options={{ title: '내 챌린지' }}
        />

        <Stack.Screen
          name="ChangePassword"
          component={SettingsScreen}
          options={{ title: '비밀번호 변경' }}
        />

        <Stack.Screen
          name="FAQ"
          component={SettingsScreen}
          options={{ title: '자주 묻는 질문' }}
        />

        <Stack.Screen
          name="Contact"
          component={SettingsScreen}
          options={{ title: '문의하기' }}
        />

        <Stack.Screen
          name="OpenSourceLicenses"
          component={SettingsScreen}
          options={{ title: '오픈소스 라이선스' }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ headerShown: false }}
        />
          </Stack.Group>

          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ title: '프로필', headerShown: false }}
          />
          <Stack.Screen
            name="MyReports"
            component={MyReportsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdminReportList"
            component={AdminReportListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdminReportDetail"
            component={AdminReportDetailScreen}
            options={{ headerShown: false }}
          />
    </Stack.Navigator>
  );
};

export default RootNavigator;