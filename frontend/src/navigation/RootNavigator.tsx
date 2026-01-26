// src/navigation/RootNavigator.tsx
import React, { useEffect, useRef, lazy, Suspense, ComponentType } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/routers';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

// 핵심 네비게이터 (즉시 로드)
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

// 자주 사용하는 화면 (즉시 로드)
import PostDetailRouter from '../screens/PostDetail/PostDetailRouter';
import CommentScreen from '../screens/CommentScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import EditPostScreen from '../screens/EditPostScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

// Lazy Loading 화면들 (필요 시 로드)
const ChallengeDetailScreen = lazy(() => import('../screens/ChallengeDetailScreen'));
const ProfileEditScreen = lazy(() => import('../screens/ProfileEditScreen'));
const WriteComfortPostScreen = lazy(() => import('../screens/WriteComfortPostScreen'));
const WriteMyDayScreen = lazy(() => import('../screens/WriteMyDayScreen'));
const PrivacyPolicyScreen = lazy(() => import('../screens/PrivacyPolicyScreen'));
const MyReportsScreen = lazy(() => import('../screens/MyReportsScreen'));
const NoticeScreen = lazy(() => import('../screens/NoticeScreen'));
const AccountSettingsScreen = lazy(() => import('../screens/AccountSettingsScreen'));
const NotificationSettingsScreen = lazy(() => import('../screens/NotificationSettingsScreen'));
const BookmarksScreen = lazy(() => import('../screens/BookmarksScreen'));
const TermsOfServiceScreen = lazy(() => import('../screens/TermsOfServiceScreen'));

// 관리자 화면 (Lazy - 일반 사용자는 사용 안함)
const AdminDashboardScreen = lazy(() => import('../screens/AdminDashboardScreen'));
const AdminReportListScreen = lazy(() => import('../screens/AdminReportListScreen'));
const AdminReportDetailScreen = lazy(() => import('../screens/AdminReportDetailScreen'));

// 로딩 폴백 컴포넌트
const LoadingFallback: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
    <ActivityIndicator size="large" color="#6200ee" />
  </View>
);

// Lazy 컴포넌트 래퍼
const withSuspense = <P extends object>(Component: ComponentType<P>): React.FC<P> => {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};

// Suspense 래핑된 컴포넌트
const LazyChallengeDetail = withSuspense(ChallengeDetailScreen);
const LazyProfileEdit = withSuspense(ProfileEditScreen);
const LazyWriteComfortPost = withSuspense(WriteComfortPostScreen);
const LazyWriteMyDay = withSuspense(WriteMyDayScreen);
const LazyPrivacyPolicy = withSuspense(PrivacyPolicyScreen);
const LazyMyReports = withSuspense(MyReportsScreen);
const LazyNotice = withSuspense(NoticeScreen);
const LazyAccountSettings = withSuspense(AccountSettingsScreen);
const LazyNotificationSettings = withSuspense(NotificationSettingsScreen);
const LazyBookmarks = withSuspense(BookmarksScreen);
const LazyTermsOfService = withSuspense(TermsOfServiceScreen);
const LazyAdminDashboard = withSuspense(AdminDashboardScreen);
const LazyAdminReportList = withSuspense(AdminReportListScreen);
const LazyAdminReportDetail = withSuspense(AdminReportDetailScreen);

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();
  const prevAuthRef = useRef<boolean | null>(null);

  // 로그인 상태 변화 감지하여 자동 화면 전환
  useEffect(() => {
    if (isLoading) return;

    if (prevAuthRef.current === false && isAuthenticated === true) {
      if (__DEV__) console.log('🔄 [RootNavigator] 로그인 감지 - Main으로 자동 전환');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    }

    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading, navigation]);

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: { backgroundColor: '#6200ee' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Pretendard-Bold' },
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
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

      {/* 모달 화면 그룹 */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen
          name="PostDetail"
          component={PostDetailRouter}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Comment"
          component={CommentScreen}
          options={{ title: '댓글' }}
        />
        <Stack.Screen
          name="ChallengeDetail"
          component={LazyChallengeDetail}
          options={{ title: '챌린지 상세' }}
        />
        <Stack.Screen
          name="ProfileEdit"
          component={LazyProfileEdit}
          options={{ headerShown: false }}
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
          component={LazyWriteComfortPost}
          options={{ title: '위로와 공감' }}
        />
        <Stack.Screen
          name="WriteMyDay"
          component={LazyWriteMyDay}
          options={{ title: '나의 하루' }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={LazyPrivacyPolicy}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Notice"
          component={LazyNotice}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AccountSettings"
          component={LazyAccountSettings}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotificationSettings"
          component={LazyNotificationSettings}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Bookmarks"
          component={LazyBookmarks}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TermsOfService"
          component={LazyTermsOfService}
          options={{ headerShown: false }}
        />
      </Stack.Group>

      {/* 일반 화면 (모달 아님) */}
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyReports"
        component={LazyMyReports}
        options={{ headerShown: false }}
      />

      {/* 관리자 화면 (Lazy Loading) */}
      <Stack.Screen
        name="AdminDashboard"
        component={LazyAdminDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminReportList"
        component={LazyAdminReportList}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminReportDetail"
        component={LazyAdminReportDetail}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;