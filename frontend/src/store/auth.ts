import { Dispatch } from 'react';
import { Action, ActionType } from './index';
import { setAuthToken, setUserData, removeAuthToken } from '../utils/storage';
import { handleApiError } from '../utils/error';

// 로그인 함수
export const login = async (
  dispatch: Dispatch<Action>,
  email: string,
  password: string
) => {
  try {
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    dispatch({ type: ActionType.CLEAR_ERROR });

    // API 호출을 위한 실제 코드로 대체해야 합니다
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('로그인에 실패했습니다.');
    }

    const data = await response.json();
    
    // 토큰과 사용자 데이터 저장
    await setAuthToken(data.token);
    await setUserData(data.user);
    
    // 상태 업데이트
    dispatch({ type: ActionType.SET_AUTHENTICATED, payload: true });
    dispatch({ type: ActionType.SET_USER, payload: data.user });
    
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
    dispatch({ type: ActionType.SET_ERROR, payload: errorMessage });
    throw error;
  } finally {
    dispatch({ type: ActionType.SET_LOADING, payload: false });
  }
};

// 로그아웃 함수
export const logout = async (dispatch: Dispatch<Action>) => {
  try {
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    
    // 토큰 제거
    await removeAuthToken();
    
    // 상태 초기화
    dispatch({ type: ActionType.RESET_STATE });
    
  } catch (error) {
    dispatch({
      type: ActionType.SET_ERROR,
      payload: '로그아웃 중 오류가 발생했습니다.',
    });
  } finally {
    dispatch({ type: ActionType.SET_LOADING, payload: false });
  }
};

// 회원가입 함수
export const register = async (
  dispatch: Dispatch<Action>,
  userData: {
    username: string;
    email: string;
    password: string;
    nickname?: string;
  }
) => {
  try {
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    dispatch({ type: ActionType.CLEAR_ERROR });
    
    // API 호출을 위한 실제 코드로 대체해야 합니다
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('회원가입에 실패했습니다.');
    }
    
    const data = await response.json();
    
    // 자동 로그인이 필요하면 아래 코드 활성화
     await setAuthToken(data.token);
     await setUserData(data.user);
     dispatch({ type: ActionType.SET_AUTHENTICATED, payload: true });
    dispatch({ type: ActionType.SET_USER, payload: data.user });
    
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
    dispatch({ type: ActionType.SET_ERROR, payload: errorMessage });
    throw error;
  } finally {
    dispatch({ type: ActionType.SET_LOADING, payload: false });
  }
};

// 사용자 정보 가져오기
export const getCurrentUser = async (dispatch: Dispatch<Action>) => {
  try {
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    
    // API 호출을 위한 실제 코드로 대체해야 합니다
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 토큰 추가
      },
    });
    
    if (!response.ok) {
      throw new Error('사용자 정보를 가져오는데 실패했습니다.');
    }
    
    const data = await response.json();
    
    // 상태 업데이트
    dispatch({ type: ActionType.SET_USER, payload: data });
    
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '사용자 정보를 가져오는데 실패했습니다.';
    dispatch({ type: ActionType.SET_ERROR, payload: errorMessage });
    throw error;
  } finally {
    dispatch({ type: ActionType.SET_LOADING, payload: false });
  }
};