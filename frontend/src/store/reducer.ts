import { AppState, Action, ActionType } from './types';

// 초기 상태
export const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  notifications: [],
  theme: 'system',
  loading: false,
  error: null,
};

// 리듀서 함수
export const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case ActionType.SET_AUTHENTICATED:
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    case ActionType.SET_USER:
      return {
        ...state,
        user: action.payload,
      };
    case ActionType.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case ActionType.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
    case ActionType.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };
    case ActionType.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };
    case ActionType.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case ActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    case ActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case ActionType.RESET_STATE:
      return initialState;
    default:
      return state;
  }
};