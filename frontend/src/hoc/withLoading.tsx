import React, { useState } from 'react';
import LoadingIndicator from '../components/LoadingIndicator';

interface WithLoadingProps {
  isLoading?: boolean;
}

/**
 * 컴포넌트에 로딩 상태를 추가하는 HOC
 * @param WrappedComponent 래핑할 컴포넌트
 * @returns 로딩 상태 처리 로직이 추가된 새 컴포넌트
 */
export const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P & WithLoadingProps>
) => {
  const WithLoading: React.FC<P & WithLoadingProps> = (props) => {
    const { isLoading, ...restProps } = props;

    if (isLoading) {
      return <LoadingIndicator />;
    }

    return <WrappedComponent {...(restProps as P)} />;
  };

  const wrappedComponentName = 
    WrappedComponent.displayName || 
    WrappedComponent.name || 
    'Component';
    
  WithLoading.displayName = `withLoading(${wrappedComponentName})`;

  return WithLoading;
};