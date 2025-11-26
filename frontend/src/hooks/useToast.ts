import { useCallback } from 'react';
import { ToastController } from '../components/Toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface UseToastReturn {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

export const useToast = (): UseToastReturn => {
  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration: number = 3000
  ) => {
    ToastController.show({
      message,
      type,
      duration,
      position: 'bottom',
    });
  }, []);

  const hideToast = useCallback(() => {
    ToastController.hide();
  }, []);

  return { showToast, hideToast };
};