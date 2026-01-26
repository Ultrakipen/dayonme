// 로컬 알림 서비스 (외부 서비스 불필요)
// 설치: npm install react-native-push-notification @react-native-community/push-notification-ios

import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';

// 로컬 알림 초기화
export function initLocalNotifications() {
  PushNotification.configure({
    // 알림 클릭 시
    onNotification: (notification) => {
      if (__DEV__) console.log('📩 알림 클릭:', notification);

      // 화면 이동 처리
      if (notification.data?.screen) {
        // navigation.navigate(notification.data.screen);
      }

      if (Platform.OS === 'ios') {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    },

    // Android 알림 채널
    requestPermissions: Platform.OS === 'ios',
  });

  // Android 채널 생성
  PushNotification.createChannel(
    {
      channelId: 'default-channel',
      channelName: '기본 알림',
      channelDescription: '챌린지 관련 알림',
      playSound: true,
      soundName: 'default',
      importance: 4,
      vibrate: true,
    },
    (created) => { if (__DEV__) console.log(`✅ 알림 채널 생성: ${created}`); }
  );

  if (__DEV__) console.log('✅ 로컬 알림 초기화 완료');
}

// 즉시 알림 (로컬)
export function showLocalNotification(title: string, message: string, data?: any) {
  PushNotification.localNotification({
    channelId: 'default-channel',
    title,
    message,
    playSound: true,
    soundName: 'default',
    vibrate: true,
    vibration: 300,
    data: data || {},
  });
}

// 예약 알림
export function scheduleLocalNotification(
  title: string,
  message: string,
  date: Date,
  data?: any
) {
  PushNotification.localNotificationSchedule({
    channelId: 'default-channel',
    title,
    message,
    date,
    playSound: true,
    soundName: 'default',
    data: data || {},
    allowWhileIdle: true, // Android: 절전 모드에서도 알림
  });

  if (__DEV__) console.log(`⏰ 알림 예약: ${title} - ${date.toLocaleString()}`);
}

// 반복 알림 (매일, 매주 등)
export function scheduleRepeatingNotification(
  title: string,
  message: string,
  repeatType: 'day' | 'week' | 'month',
  hour: number = 9,
  minute: number = 0
) {
  const now = new Date();
  const scheduledDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  );

  // 오늘 시간이 지났으면 내일로
  if (scheduledDate < now) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  PushNotification.localNotificationSchedule({
    channelId: 'default-channel',
    title,
    message,
    date: scheduledDate,
    repeatType, // 'day', 'week', 'month'
    playSound: true,
    allowWhileIdle: true,
  });

  if (__DEV__) console.log(`🔄 반복 알림 설정: ${title} (${repeatType}, ${hour}:${minute})`);
}

// 모든 예약 알림 취소
export function cancelAllNotifications() {
  PushNotification.cancelAllLocalNotifications();
  if (__DEV__) console.log('🗑️ 모든 알림 취소');
}

// 특정 알림 취소
export function cancelNotification(notificationId: string) {
  PushNotification.cancelLocalNotification(notificationId);
}

// ===== 실제 사용 예시 =====

// 매일 아침 9시 알림
export function setupDailyReminder() {
  scheduleRepeatingNotification(
    '오늘의 챌린지',
    '오늘도 챌린지에 참여해보세요! 💪',
    'day',
    9,
    0
  );
}

// 챌린지 마감 1일 전 알림 (챌린지 참여 시 호출)
export function scheduleDeadlineReminder(challengeTitle: string, endDate: Date) {
  const reminderDate = new Date(endDate);
  reminderDate.setDate(reminderDate.getDate() - 1); // 1일 전
  reminderDate.setHours(20, 0, 0); // 오후 8시

  scheduleLocalNotification(
    '챌린지 마감 임박',
    `"${challengeTitle}" 챌린지가 내일 마감됩니다!`,
    reminderDate,
    { type: 'challenge_deadline' }
  );
}

// 주간 리포트 알림 (매주 월요일 오전 9시)
export function setupWeeklyReport() {
  scheduleRepeatingNotification(
    '주간 리포트',
    '이번 주 챌린지 활동을 확인해보세요!',
    'week',
    9,
    0
  );
}

// 댓글 알림 (앱 내부에서 즉시)
export function notifyNewComment(commenter: string, challengeTitle: string) {
  showLocalNotification(
    '새로운 댓글',
    `${commenter}님이 "${challengeTitle}" 챌린지에 댓글을 남겼습니다.`,
    { type: 'comment' }
  );
}
