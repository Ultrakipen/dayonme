import { Dispatch } from 'react';
import { Action, ActionType } from './index';
import { handleApiError } from '../utils/error';

export interface Notification {
  id: string;
  content: string;
  notificationType: 'like' | 'comment' | 'challenge' | 'system';
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

// 알림 목록 가져오기
export const fetchNotifications = async (dispatch: Dispatch<Action>) => {
  try {
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    
    // API 호출을 위한 실제 코드로 대체해야 합니다
    const response = await fetch('/api/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 토큰 추가
      },
    });
    
    if (!response.ok) {
      throw new Error('알림을 가져오는데 실패했습니다.');
    }
    
    const data: Notification[] = await response.json();
    
    // 각 알림을 추가
    data.forEach(notification => {
      dispatch({
        type: ActionType.ADD_NOTIFICATION,
        payload: notification,
      });
    });
    
    return data;
  } catch (error) {
    const appError = handleApiError(error as any);
    dispatch({ type: ActionType.SET_ERROR, payload: appError.message });
    throw appError;
  } finally {
    dispatch({ type: ActionType.SET_LOADING, payload: false });
  }
};

// 알림 읽음 표시
export const markNotificationAsRead = async (
  dispatch: Dispatch<Action>,
  notificationId: string
) => {
  try {
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    
    // API 호출을 위한 실제 코드로 대체해야 합니다
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // 토큰 추가
      },
    });
    
    if (!response.ok) {
      throw new Error('알림을 읽음 표시하는데 실패했습니다.');
    }
    
    // 알림 상태 업데이트 (실제로는 받아온 업데이트된 알림으로 대체해야 함)
    dispatch({
      type: ActionType.REMOVE_NOTIFICATION,
      payload: notificationId,
    });
    
    const updatedNotification = await response.json();
    dispatch({
      type: ActionType.ADD_NOTIFICATION,
      payload: updatedNotification,
    });
    
    return updatedNotification;
  } catch (error) {
    const appError = handleApiError(error as any);
    dispatch({ type: ActionType.SET_ERROR, payload: appError.message });
    throw appError;
  } finally {
    dispatch({ type: ActionType.SET_LOADING, payload: false });
  }
};

// 모든 알림 읽음 표시
export const markAllNotificationsAsRead = async (dispatch: Dispatch<Action>) => {
  try {
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    
    // API 호출을 위한 실제 코드로 대체해야 합니다
    const response = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // 토큰 추가
      },
    });
    
    if (!response.ok) {
      throw new Error('모든 알림을 읽음 표시하는데 실패했습니다.');
    }
    
    // 상태 초기화 후 새로운 알림 목록 설정
    dispatch({ type: ActionType.CLEAR_NOTIFICATIONS });
    
    const updatedNotifications = await response.json();
    updatedNotifications.forEach((notification: Notification) => {
      dispatch({
        type: ActionType.ADD_NOTIFICATION,
        payload: notification,
      });
    });
    
    return updatedNotifications;
  } catch (error) {
    const appError = handleApiError(error as any);
    dispatch({ type: ActionType.SET_ERROR, payload: appError.message });
    throw appError;
  } finally {
    dispatch({ type: ActionType.SET_LOADING, payload: false });
  }
};

// 알림 삭제
export const deleteNotification = async (
  dispatch: Dispatch<Action>,
  notificationId: string
) => {
  try {
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    
    // API 호출을 위한 실제 코드로 대체해야 합니다
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // 토큰 추가
      },
    });
    
    if (!response.ok) {
      throw new Error('알림을 삭제하는데 실패했습니다.');
    }
    
    // 상태에서 알림 제거
    dispatch({
      type: ActionType.REMOVE_NOTIFICATION,
      payload: notificationId,
    });
    
    return true;
  } catch (error) {
    const appError = handleApiError(error as any);
    dispatch({ type: ActionType.SET_ERROR, payload: appError.message });
    throw appError;
  } finally {
    dispatch({ type: ActionType.SET_LOADING, payload: false });
  }
};