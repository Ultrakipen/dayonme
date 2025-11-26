import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import TokenExpiredModal from './TokenExpiredModal';

const AuthModalHandler: React.FC = () => {
  const {
    isTokenExpiredModalVisible,
    hideTokenExpiredModal,
    handleTokenExpiredRetry,
    logout,
  } = useAuth();

  const handleRetry = () => {
    handleTokenExpiredRetry();
  };

  const handleLogin = async () => {
    hideTokenExpiredModal();
    await logout(true); // 서버 호출 없이 로컬 상태만 클리어
  };

  return (
    <TokenExpiredModal
      visible={isTokenExpiredModalVisible}
      onRetry={handleRetry}
      onLogin={handleLogin}
    />
  );
};

export default AuthModalHandler;