// OneSignal 푸시 알림 서비스 (프론트엔드)
import { OneSignal } from 'react-native-onesignal';
import { ENV } from '../config/env';

const ONESIGNAL_APP_ID = ENV.ONESIGNAL_APP_ID || '';

// OneSignal 초기화 상태 플래그
let isOneSignalInitialized = false;
let initializationPromise: Promise<void> | null = null;

// OneSignal 초기화 (App.tsx에서 1회 호출)
export function initOneSignal() {
  if (!ONESIGNAL_APP_ID) {
    if (__DEV__) console.warn('⚠️ OneSignal App ID가 설정되지 않았습니다.');
    return;
  }

  // 이미 초기화 중이거나 완료되었으면 기존 Promise 반환
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise<void>((resolve) => {
    try {
      // OneSignal 초기화
      OneSignal.initialize(ONESIGNAL_APP_ID);

      // 알림 권한 요청
      OneSignal.Notifications.requestPermission(true);

      isOneSignalInitialized = true;
      if (__DEV__) console.log('✅ OneSignal 초기화 완료');
      resolve();
    } catch (error) {
      if (__DEV__) console.error('❌ OneSignal 초기화 오류:', error);
      resolve(); // 오류가 발생해도 앱은 계속 실행
    }
  });

  return initializationPromise;
}

// OneSignal 초기화 대기 함수
async function waitForInitialization(): Promise<void> {
  if (isOneSignalInitialized) {
    return;
  }

  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  // 초기화가 시작되지 않은 경우 최대 5초 대기
  const maxWaitTime = 5000;
  const startTime = Date.now();

  while (!isOneSignalInitialized && Date.now() - startTime < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (!isOneSignalInitialized) {
    if (__DEV__) console.warn('⚠️ OneSignal 초기화 대기 시간 초과');
  }
}

// 사용자 ID 연결 (로그인 후 호출)
export async function setOneSignalUserId(userId: number | string) {
  try {
    // OneSignal 초기화 완료 대기
    await waitForInitialization();

    if (!isOneSignalInitialized) {
      if (__DEV__) console.warn('⚠️ OneSignal이 초기화되지 않아 사용자 연결 스킵');
      return;
    }

    OneSignal.login(userId.toString());
    if (__DEV__) console.log('✅ OneSignal 사용자 연결:', userId);
  } catch (error) {
    if (__DEV__) console.error('❌ OneSignal 사용자 연결 오류:', error);
  }
}

// 사용자 ID 해제 (로그아웃 시 호출)
export function clearOneSignalUserId() {
  OneSignal.logout();
  if (__DEV__) console.log('✅ OneSignal 사용자 연결 해제');
}

// 알림 클릭 리스너 설정
export function setupNotificationClickListener(navigation: any) {
  OneSignal.Notifications.addEventListener('click', (event) => {
    if (__DEV__) console.log('👆 알림 클릭:', event);
    const data = event.notification.additionalData as any;

    // 화면 이동 처리
    if (data?.type === 'challenge_comment' && data?.challengeId) {
      navigation.navigate('ChallengeDetail', { challengeId: data.challengeId });
    } else if (data?.type === 'challenge_deadline' && data?.challengeId) {
      navigation.navigate('ChallengeDetail', { challengeId: data.challengeId });
    } else if (data?.type === 'weekly_report') {
      navigation.navigate('Review');
    } else if (data?.type === 'announcement') {
      navigation.navigate('Notification');
    }
  });
}

// 포그라운드 알림 표시 설정
export function setupForegroundNotification() {
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
    if (__DEV__) console.log('📩 포그라운드 알림:', event.notification);
    event.getNotification().display(); // 알림 표시
  });
}

// 사용자 태그 설정 (세그먼트용)
export function setUserTags(tags: Record<string, string>) {
  OneSignal.User.addTags(tags);
  if (__DEV__) console.log('✅ 사용자 태그 설정:', tags);
}

// 푸시 알림 활성화/비활성화
export function setPushEnabled(enabled: boolean) {
  OneSignal.User.pushSubscription.optIn();
  if (!enabled) {
    OneSignal.User.pushSubscription.optOut();
  }
}

// 알림 권한 상태 확인
export async function checkNotificationPermission(): Promise<boolean> {
  return OneSignal.Notifications.hasPermission();
}

