import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/api/notificationService';

// 쿼리 키
export const notificationQueryKeys = {
  notifications: (page?: number) => ['notifications', page] as const,
  unreadCount: ['notificationUnreadCount'] as const,
  settings: ['notificationSettings'] as const,
};

// 알림 목록 조회
export const useNotifications = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: notificationQueryKeys.notifications(page),
    queryFn: async () => {
      const response = await notificationService.getNotifications({ page, limit });
      return response?.data || { notifications: [], total: 0, hasMore: false };
    },
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// 읽지 않은 알림 수
export const useUnreadNotificationCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount,
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      return response?.data?.count || 0;
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

// 알림 설정 조회
export const useNotificationSettings = () => {
  return useQuery({
    queryKey: notificationQueryKeys.settings,
    queryFn: async () => {
      const response = await notificationService.getSettings();
      return response?.data || {};
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// 알림 읽음 처리
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      return await notificationService.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
    },
  });
};

// 모든 알림 읽음 처리
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await notificationService.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
    },
  });
};

// 알림 삭제
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      return await notificationService.deleteNotification(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
    },
  });
};

// 알림 설정 업데이트
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: any) => {
      return await notificationService.updateSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.settings });
    },
  });
};

// 캐시 수동 무효화
export const useInvalidateNotifications = () => {
  const queryClient = useQueryClient();

  return {
    invalidateNotifications: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    invalidateUnreadCount: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
    },
    invalidateSettings: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.settings });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.settings });
    },
  };
};
