import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';

/**
 * 인증이 필요한 컴포넌트를 래핑하는 HOC
 * 인증되지 않은 사용자는 로그인 화면으로 리디렉션
 * @param WrappedComponent 래핑할 컴포넌트
 * @returns 인증 로직이 추가된 새 컴포넌트
 */
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithAuth: React.FC<P> = (props) => {
    const { state } = useStore();
    const navigation = useNavigation();

    useEffect(() => {
      if (!state.isAuthenticated) {
        // 인증되지 않은 경우 로그인 화면으로 이동
        navigation.navigate('Login' as never);
      }
    }, [state.isAuthenticated, navigation]);

    // 인증되지 않았다면 null 반환 (렌더링 방지)
    if (!state.isAuthenticated) {
      return null;
    }

    // 인증된 경우 원래 컴포넌트 렌더링
    return <WrappedComponent {...props} />;
  };

  // 컴포넌트 디스플레이 이름 설정 (디버깅용)
  const wrappedComponentName = 
    WrappedComponent.displayName || 
    WrappedComponent.name || 
    'Component';
    
  WithAuth.displayName = `withAuth(${wrappedComponentName})`;

  return WithAuth;
};