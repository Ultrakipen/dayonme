// 앱 상태 타입 정의
export interface AppState {
    isAuthenticated: boolean;
    user: any | null;
    notifications: any[];
    theme: 'light' | 'dark' | 'system';
    loading: boolean;
    error: string | null;
  }
  export interface Notification {
    id: string;
    content: string;
    notificationType: 'like' | 'comment' | 'challenge' | 'system';
    relatedId?: number;
    isRead: boolean;
    createdAt: string;
  }
  // 액션 타입
  export enum ActionType {
    SET_AUTHENTICATED = 'SET_AUTHENTICATED',
    SET_USER = 'SET_USER',
    ADD_NOTIFICATION = 'ADD_NOTIFICATION',
    REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION',
    CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS',
    SET_THEME = 'SET_THEME',
    SET_LOADING = 'SET_LOADING',
    SET_ERROR = 'SET_ERROR',
    CLEAR_ERROR = 'CLEAR_ERROR',
    RESET_STATE = 'RESET_STATE',
  }
  
  // 액션 인터페이스
  export interface Action {
    type: ActionType;
    payload?: any;
  }