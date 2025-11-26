import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { reducer, initialState } from './reducer';
import { Action, AppState } from './types';

// Context 타입 정의
type StoreContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

// 기본값 생성
const defaultValue: StoreContextType = {
  state: initialState,
  dispatch: () => null,
};

// 컨텍스트 생성
export const StoreContext = createContext<StoreContextType>(defaultValue);

// Props 타입 정의
type StoreProviderProps = {
  children: ReactNode;
};

// Provider 컴포넌트
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return React.createElement(
    StoreContext.Provider,
    { value: { state, dispatch } },
    children
  );
};

// 커스텀 훅
export const useStore = () => useContext(StoreContext);