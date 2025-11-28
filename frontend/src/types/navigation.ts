// src/types/navigation.ts

// 메인 탭 네비게이션 타입
export type MainTabParamList = {
  Home: HomeStackParamList;
  Comfort: ComfortStackParamList;
  Challenge: ChallengeStackParamList;
  Review: undefined;
  Profile: ProfileStackParamList;
};

// 홈 스택 네비게이션 타입
export type HomeStackParamList = {
  HomeMain: undefined;
  EmotionLog: undefined;
  MyPosts: undefined;
  CreatePost: undefined;
  EditPost: { postId: number }; // 게시물 수정 화면 추가
  PostDetail: { postId: number; highlightCommentId?: number };
  WriteMyDay: {
    isEditMode?: boolean;
    postId?: number;
    existingPost?: any;
  }; // 나의 하루 공유하기 화면 추가
  MyDayDetail: { postId: number; highlightCommentId?: number }; // 나의 하루 상세보기 화면 추가
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
  }; // 위로와 공감 게시물 작성/수정 화면 추가
  UserProfile: { userId: number; nickname?: string }; // 다른 사용자 프로필 화면 추가
  NotificationScreen: undefined; // 알림 화면 추가
};

// 위로와 공감 스택 네비게이션 타입
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
    highlightCommentId?: number;
  };
  ComfortMyPosts: undefined;
  MyPosts: undefined;
  BestPosts: undefined; // 베스트 게시물 전체보기 화면 추가
  UserProfile: { userId: number; nickname?: string }; // 다른 사용자 프로필 화면 추가
  NotificationScreen: undefined; // 알림 화면 추가
  ProfileMain: undefined; // 본인 프로필 화면 추가
};

// 챌린지 스택 네비게이션 타입
export type ChallengeStackParamList = {
  ChallengeMain: undefined;
  MyChallenges: undefined;
  ChallengeDetail: { challengeId: number };
  CreateChallenge: undefined;
  HotChallenges: undefined;
  UserProfile: { userId: number; nickname?: string }; // 다른 사용자 프로필 화면 추가
  NotificationScreen: undefined; // 알림 화면 추가
  ProfileMain: undefined; // 본인 프로필 화면 추가
};

// 프로필 스택 네비게이션 타입 - 계정/알림 설정 추가
export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
  MyPosts: undefined;
  CreatePost: undefined;
  EditPost: { postId: number }; // 게시물 수정 화면 추가
  MyChallenge: undefined; // MyChallenges → MyChallenge로 수정
  BlockManagement: undefined;
  Settings: undefined;
  AccountSettings: undefined; // 계정 설정 화면 추가
  NotificationSettings: undefined; // 알림 설정 화면 추가
  Bookmarks: undefined; // 북마크 화면 추가
  Encouragement: undefined; // 받은 격려 메시지 화면 추가
  ChangePassword: undefined;
  Notice: undefined;
  FAQ: undefined;
  Contact: undefined;
  OpenSourceLicenses: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  UserProfile: { userId: number; nickname?: string }; // 다른 사용자 프로필 화면 추가
  NotificationScreen: undefined; // 알림 화면 추가
};

// 인증 스택 네비게이션 타입
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  ApiTest: undefined;
};

// 루트 네비게이션 타입
export type RootStackParamList = {
  Welcome: undefined;
  Auth: AuthStackParamList;
  Main: MainTabParamList;

  // 모달 스크린들
  PostDetail: {
    postId: number;
    postType?: 'myday' | 'comfort' | 'posts';
    highlightCommentId?: number;
    sourceScreen?: 'home' | 'comfort' | 'profile';
    enableSwipe?: boolean;
  };
  Comment: { postId: number }; // 댓글 화면 추가
  ChallengeDetail: { challengeId: number };
  ProfileEdit: undefined;
  CreatePost: undefined;
  EditPost: { postId: number }; // 게시물 수정 화면 추가
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
  }; // 위로와 공감 게시물 작성/수정 화면 추가
  Settings: undefined;
  BlockManagement: undefined;
  MyPosts: undefined;
  MyChallenges: undefined;
  ChangePassword: undefined;
  FAQ: undefined;
  Contact: undefined;
  OpenSourceLicenses: undefined;
  PrivacyPolicy: undefined;
  UserProfile: { userId: number; nickname?: string }; // 다른 사용자 프로필 화면 추가

  // 설정 하부 화면들
  Notice: undefined;
  AccountSettings: undefined;
  NotificationSettings: undefined;
  Bookmarks: undefined;
  TermsOfService: undefined;

  // 신고 관련 화면
  MyReports: undefined; // 내 신고 내역

  // 관리자 화면들
  AdminDashboard: undefined;
  AdminReportList: { status?: string; item_type?: string };
  AdminReportDetail: { reportId: number };
};

// 네비게이션 prop 타입들
export type NavigationProp<T extends keyof RootStackParamList> = {
  navigate: <K extends keyof RootStackParamList>(
    screen: K,
    params?: RootStackParamList[K]
  ) => void;
  goBack: () => void;
  push: <K extends keyof RootStackParamList>(
    screen: K,
    params?: RootStackParamList[K]
  ) => void;
  replace: <K extends keyof RootStackParamList>(
    screen: K,
    params?: RootStackParamList[K]
  ) => void;
  reset: (state: any) => void;
  setParams: (params: Partial<RootStackParamList[T]>) => void;
  setOptions: (options: any) => void;
  addListener: (event: string, callback: () => void) => () => void;
  removeListener: (event: string, callback: () => void) => void;
  isFocused: () => boolean;
  canGoBack: () => boolean;
  getId: () => string | undefined;
  getState: () => any;
  getParent: () => any;
};

// 라우트 prop 타입들
export type RouteProp<T extends keyof RootStackParamList> = {
  key: string;
  name: T;
  params: RootStackParamList[T];
};

// 스크린 컴포넌트 prop 타입들
export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: NavigationProp<T>;
  route: RouteProp<T>;
};

// 특정 스크린 타입들
export type HomeScreenProps = ScreenProps<'Main'>;
export type ProfileScreenProps = ScreenProps<'Main'>;
export type LoginScreenProps = ScreenProps<'Auth'>;
export type RegisterScreenProps = ScreenProps<'Auth'>;
export type MyPostsScreenProps = ScreenProps<'MyPosts'>;
export type EditPostScreenProps = ScreenProps<'EditPost'>; // 게시물 수정 화면 타입 추가
export type MyChallengesScreenProps = ScreenProps<'MyChallenges'>;
export type BlockManagementScreenProps = ScreenProps<'BlockManagement'>;
export type SettingsScreenProps = ScreenProps<'Settings'>;

// 네비게이션 상태 타입
export type NavigationState = {
  key: string;
  index: number;
  routeNames: string[];
  routes: Array<{
    key: string;
    name: string;
    params?: object;
  }>;
  type: string;
  stale: boolean;
};

// 네비게이션 옵션 타입
export type ScreenOptions = {
  title?: string;
  headerShown?: boolean;
  headerTitle?: string;
  headerLeft?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
  headerStyle?: object;
  headerTitleStyle?: object;
  headerTintColor?: string;
  headerBackgroundColor?: string;
  gestureEnabled?: boolean;
  cardStyle?: object;
  animationEnabled?: boolean;
  presentation?: 'card' | 'modal' | 'transparentModal';
};

// 네비게이션 이벤트 타입
export type NavigationEvents = {
  focus: () => void;
  blur: () => void;
  state: (e: { data: NavigationState }) => void;
  beforeRemove: (e: { data: { action: any } }) => void;
};

// Tab bar 아이콘 prop 타입
export type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

// 네비게이션 컨텍스트 타입
export type NavigationContextValue = {
  navigation: any;
  route: any;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export default RootStackParamList;