import React, { createContext, useContext, useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { InteractionManager } from 'react-native';

// React Native 0.80 + Hermes 호환성: CustomAlert를 lazy import
const CustomAlert = lazy(() => import('../components/ui/CustomAlert'));

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
}

interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[], type?: 'success' | 'error' | 'warning' | 'info') => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// 전역 AlertManager (showAlert API와 호환)
class AlertManager {
  private static instance: AlertManager;
  private showAlertFunc: ((title: string, message: string, buttons?: AlertButton[], type?: 'success' | 'error' | 'warning' | 'info') => void) | null = null;
  private hideAlertFunc: (() => void) | null = null;

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  register(
    showFn: (title: string, message: string, buttons?: AlertButton[], type?: 'success' | 'error' | 'warning' | 'info') => void,
    hideFn: () => void
  ) {
    this.showAlertFunc = showFn;
    this.hideAlertFunc = hideFn;
  }

  unregister() {
    this.showAlertFunc = null;
    this.hideAlertFunc = null;
  }

  show(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: 'success' | 'error' | 'warning' | 'info'
  ) {
    if (this.showAlertFunc) {
      this.showAlertFunc(title, message || '', buttons, type);
    } else if (__DEV__) {
      console.warn('AlertManager: showAlert not registered');
    }
  }

  hide() {
    if (this.hideAlertFunc) {
      this.hideAlertFunc();
    }
  }

  private detectType(title: string): 'success' | 'error' | 'warning' | 'info' {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('성공') || titleLower.includes('완료')) return 'success';
    if (titleLower.includes('오류') || titleLower.includes('실패')) return 'error';
    if (titleLower.includes('경고') || titleLower.includes('주의')) return 'warning';
    return 'info';
  }
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const isMountedRef = useRef(true);
  const interactionHandleRef = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(null);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // 진행 중인 InteractionManager 작업 취소
      if (interactionHandleRef.current) {
        interactionHandleRef.current.cancel();
      }
    };
  }, []);

  const showAlertFunc = useCallback((title: string, message: string, buttons?: AlertButton[], type?: 'success' | 'error' | 'warning' | 'info') => {
    // InteractionManager로 네이티브 브릿지 준비 후 상태 업데이트
    interactionHandleRef.current = InteractionManager.runAfterInteractions(() => {
      if (isMountedRef.current) {
        // 약간의 지연으로 브릿지 안정화
        setTimeout(() => {
          if (isMountedRef.current) {
            setAlertConfig({ title, message, buttons, type });
            setVisible(true);
          }
        }, 50);
      }
    });
  }, []);

  const hideAlert = useCallback(() => {
    if (isMountedRef.current) {
      setVisible(false);
      setTimeout(() => {
        if (isMountedRef.current) {
          setAlertConfig(null);
        }
      }, 200);
    }
  }, []);

  // AlertManager에 등록
  useEffect(() => {
    AlertManager.getInstance().register(showAlertFunc, hideAlert);
    return () => {
      AlertManager.getInstance().unregister();
    };
  }, [showAlertFunc, hideAlert]);

  return (
    <AlertContext.Provider value={{ showAlert: showAlertFunc, hideAlert }}>
      {children}
      {alertConfig && (
        <Suspense fallback={null}>
          <CustomAlert
            visible={visible}
            title={alertConfig.title}
            message={alertConfig.message}
            buttons={alertConfig.buttons}
            onDismiss={hideAlert}
            type={alertConfig.type}
          />
        </Suspense>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

// 전역 showAlert API (components/CustomAlert.tsx의 showAlert와 호환)
export const showAlert = {
  show: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: 'success' | 'error' | 'warning' | 'info'
  ) => {
    AlertManager.getInstance().show(title, message, buttons, type);
  },

  success: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show(title, message, buttons, 'success');
  },

  error: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show(title, message, buttons, 'error');
  },

  warning: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show(title, message, buttons, 'warning');
  },

  info: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show(title, message, buttons, 'info');
  },

  hide: () => {
    AlertManager.getInstance().hide();
  },
};
