import { useEffect } from 'react';
import {
  initLocalNotifications,
  setupDailyReminder,
  setupWeeklyReport,
  scheduleDeadlineReminder,
  notifyNewComment,
} from '../services/localNotification';
import { useAuth } from '../contexts/AuthContext';

// 로컬 알림 Hook (App.tsx에서 사용)
export function useLocalNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    // 알림 초기화
    initLocalNotifications();

    // 로그인한 사용자만 알림 설정
    if (user) {
      // 매일 아침 9시 알림
      setupDailyReminder();

      // 주간 리포트 (매주 월요일 9시)
      setupWeeklyReport();
    }
  }, [user]);

  return {
    scheduleDeadlineReminder, // 챌린지 참여 시 호출
    notifyNewComment, // 댓글 수신 시 호출
  };
}
