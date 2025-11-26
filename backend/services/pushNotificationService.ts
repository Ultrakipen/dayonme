// OneSignal REST API 푸시 알림 서비스 (Firebase 대체)
// 설치: npm install axios

import axios from 'axios';

const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';
const APP_ID = process.env.ONESIGNAL_APP_ID || '';
const REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

// 단일 사용자에게 푸시 알림 전송
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    const response = await axios.post(
      ONESIGNAL_API_URL,
      {
        app_id: APP_ID,
        include_external_user_ids: [userId], // 사용자 ID 기반
        headings: { en: title, ko: title },
        contents: { en: body, ko: body },
        data: data || {},
        android_channel_id: 'default', // Android 채널
        priority: 10, // 높은 우선순위
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${REST_API_KEY}`,
        },
      }
    );

    console.log('✅ 푸시 알림 전송 성공:', title, response.data.id);
    return true;
  } catch (error: any) {
    console.error('❌ 푸시 알림 전송 실패:', error.response?.data || error.message);
    return false;
  }
}

// 다중 사용자에게 푸시 알림 전송
export async function sendMulticastNotification(
  userIds: string[],
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    const response = await axios.post(
      ONESIGNAL_API_URL,
      {
        app_id: APP_ID,
        include_external_user_ids: userIds,
        headings: { en: title, ko: title },
        contents: { en: body, ko: body },
        data: data || {},
        priority: 10,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${REST_API_KEY}`,
        },
      }
    );

    console.log(`✅ 다중 푸시 알림 전송: ${userIds.length}명, ID: ${response.data.id}`);
    return true;
  } catch (error: any) {
    console.error('❌ 다중 푸시 알림 전송 실패:', error.response?.data || error.message);
    return false;
  }
}

// 전체 사용자에게 푸시 알림 전송 (공지사항)
export async function sendBroadcastNotification(
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    const response = await axios.post(
      ONESIGNAL_API_URL,
      {
        app_id: APP_ID,
        included_segments: ['All'], // 전체 사용자
        headings: { en: title, ko: title },
        contents: { en: body, ko: body },
        data: data || {},
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${REST_API_KEY}`,
        },
      }
    );

    console.log('✅ 전체 푸시 알림 전송:', response.data.id);
    return true;
  } catch (error: any) {
    console.error('❌ 전체 푸시 알림 전송 실패:', error.response?.data || error.message);
    return false;
  }
}

// 푸시 알림 타입별 전송 함수
export const PushNotifications = {
  // 챌린지 댓글
  async sendChallengeComment(
    userId: string,
    challengeId: number,
    challengeTitle: string,
    commenter: string
  ) {
    return sendPushNotification(
      userId,
      '새로운 댓글',
      `${commenter}님이 "${challengeTitle}" 챌린지에 댓글을 남겼습니다.`,
      { type: 'challenge_comment', challengeId }
    );
  },

  // 챌린지 마감 알림 (D-1)
  async sendChallengeDeadline(userId: string, challengeId: number, challengeTitle: string) {
    return sendPushNotification(
      userId,
      '챌린지 마감 임박',
      `"${challengeTitle}" 챌린지가 내일 마감됩니다. 지금 참여하세요!`,
      { type: 'challenge_deadline', challengeId }
    );
  },

  // 주간 리포트
  async sendWeeklyReport(userId: string) {
    return sendPushNotification(
      userId,
      '주간 리포트',
      '이번 주 당신의 챌린지 활동을 확인해보세요!',
      { type: 'weekly_report' }
    );
  },

  // 7일 미방문 사용자 재활성화
  async sendReEngagement(userId: string, userName: string) {
    return sendPushNotification(
      userId,
      `${userName}님, 그동안 어떠셨나요?`,
      '새로운 챌린지가 기다리고 있어요! 지금 확인해보세요.',
      { type: 're_engagement' }
    );
  },

  // 공지사항
  async sendAnnouncement(title: string, body: string) {
    return sendBroadcastNotification(title, body, { type: 'announcement' });
  },
};

// 사용법:
// 1. OneSignal 계정 생성 (https://onesignal.com) - 무료
// 2. App ID, REST API Key 발급
// 3. .env에 ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY 추가
// 4. 컨트롤러에서 import { PushNotifications } from '../services/pushNotificationService';
// 5. await PushNotifications.sendChallengeComment(userId, challengeId, title, commenter);

