import { Action, ActionType } from './types';

// 액션 생성자 함수들
export const actions = {
  setAuthenticated: (isAuthenticated: boolean): Action => ({
    type: ActionType.SET_AUTHENTICATED,
    payload: isAuthenticated,
  }),
  
  setUser: (user: any): Action => ({
    type: ActionType.SET_USER,
    payload: user,
  }),
  
  addNotification: (notification: any): Action => ({
    type: ActionType.ADD_NOTIFICATION,
    payload: notification,
  }),
  
  removeNotification: (id: string): Action => ({
    type: ActionType.REMOVE_NOTIFICATION,
    payload: id,
  }),
  
  clearNotifications: (): Action => ({
    type: ActionType.CLEAR_NOTIFICATIONS,
  }),
  
  setTheme: (theme: 'light' | 'dark' | 'system'): Action => ({
    type: ActionType.SET_THEME,
    payload: theme,
  }),
  
  setLoading: (loading: boolean): Action => ({
    type: ActionType.SET_LOADING,
    payload: loading,
  }),
  
  setError: (error: string): Action => ({
    type: ActionType.SET_ERROR,
    payload: error,
  }),
  
  clearError: (): Action => ({
    type: ActionType.CLEAR_ERROR,
  }),
  
  resetState: (): Action => ({
    type: ActionType.RESET_STATE,
  }),
};