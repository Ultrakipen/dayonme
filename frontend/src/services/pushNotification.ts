// FCM (Firebase Cloud Messaging) 푸시 알림 서비스 (프론트엔드)
import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api/client';

// FCM 토큰을 서버에 등록
async function registerFcmTokenToServer(token: string): Promise<void> {
  try {
    // 로그인 전(앱 시작 시)에는 서버 등록 생략 - 로그인 후 AuthContext에서 재등록
    const authToken = await AsyncStorage.getItem('authToken');
    if (!authToken) return;

    await apiClient.post('/notifications/fcm-token', { fcm_token: token });
    console.log('✅ FCM 토큰 서버 등록 완료');
  } catch (error) {
    console.error('❌ FCM 토큰 서버 등록 오류:', error);
  }
}

// FCM 초기화 및 토큰 등록 (로그인 후 호출)
export async function initFCM(): Promise<void> {
  try {
    // 알림 권한 요청 (iOS)
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) {
        console.warn('⚠️ iOS 알림 권한 거부됨');
        return;
      }
    }

    // 알림 권한 요청 (Android 13+ 는 POST_NOTIFICATIONS 런타임 권한 필요)
    // 거부되어도 토큰은 등록해 두어, 이후 설정에서 허용하면 바로 수신되도록 한다.
    // - 앱 시작 시(App.tsx)에도 이 함수가 호출되므로, 로그인한 경우에만 요청한다 (첫 실행 화면에서 문맥 없는 팝업 방지)
    // - 설치당 한 번만 요청한다 (거부 후 반복 요청 방지)
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        const alreadyAsked = await AsyncStorage.getItem('notifPermAsked_v1');
        if (authToken && !alreadyAsked) {
          await AsyncStorage.setItem('notifPermAsked_v1', '1');
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          if (result !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('⚠️ Android 알림 권한 미허용:', result);
          }
        }
      } catch (permError) {
        console.warn('⚠️ Android 알림 권한 요청 실패');
      }
    }

    // FCM 토큰 발급
    const token = await messaging().getToken();
    if (token) {
      console.log('✅ FCM 토큰 발급:', token.substring(0, 20) + '...');
      await registerFcmTokenToServer(token);
    }

    // 토큰 갱신 리스너
    messaging().onTokenRefresh(async (newToken) => {
      console.log('🔄 FCM 토큰 갱신');
      await registerFcmTokenToServer(newToken);
    });
  } catch (error) {
    console.error('❌ FCM 초기화 오류:', error);
  }
}

// FCM 토큰 서버에서 삭제 (로그아웃 시)
export async function clearFcmToken(): Promise<void> {
  try {
    await apiClient.delete('/notifications/fcm-token');
    await messaging().deleteToken();
    console.log('✅ FCM 토큰 삭제 완료');
  } catch (error) {
    console.error('❌ FCM 토큰 삭제 오류:', error);
  }
}

// 포그라운드 알림 핸들러 설정
export function setupForegroundNotification(): () => void {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('📩 포그라운드 FCM 수신:', remoteMessage.notification?.title);
    // 포그라운드에서는 자동으로 시스템 알림이 표시되지 않으므로 필요 시 Alert 사용
    // 실제 앱에서는 커스텀 인앱 알림 UI 표시 권장
  });
  return unsubscribe;
}

// 백그라운드/종료 상태 알림 클릭 핸들러
export function setupBackgroundNotificationHandler(navigation: any): void {
  // 앱이 백그라운드에서 알림 클릭으로 열린 경우
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('👆 백그라운드 알림 클릭:', remoteMessage.data);
    handleNotificationNavigation(navigation, remoteMessage.data);
  });

  // 앱이 완전히 종료된 상태에서 알림 클릭으로 열린 경우
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('👆 종료 상태 알림 클릭:', remoteMessage.data);
        handleNotificationNavigation(navigation, remoteMessage.data);
      }
    });
}

// 알림 데이터에 따른 화면 이동
function handleNotificationNavigation(navigation: any, data: any): void {
  if (!data || !navigation) return;
  try {
    switch (data.type) {
      case 'comment':
      case 'like':
        if (data.postId) {
          navigation.navigate('PostDetail', { postId: Number(data.postId) });
        }
        break;
      case 'challenge_comment':
        if (data.challengeId) {
          navigation.navigate('ChallengeDetail', { challengeId: Number(data.challengeId) });
        }
        break;
      case 'encouragement':
        navigation.navigate('Encouragement');
        break;
      case 'announcement':
        navigation.navigate('Notification');
        break;
      default:
        navigation.navigate('Notification');
    }
  } catch (error) {
    console.error('알림 네비게이션 오류:', error);
  }
}

// 알림 권한 상태 확인
export async function checkNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().hasPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

// 레거시 호환성 (기존 OneSignal 함수명 유지)
export const initOneSignal = initFCM;
export const setOneSignalUserId = async (_userId: number | string) => {
  // FCM은 토큰 기반이므로 별도 userId 연결 불필요
};
export const clearOneSignalUserId = clearFcmToken;
