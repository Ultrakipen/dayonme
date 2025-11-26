import { useState, useCallback } from 'react';

interface UseModalReturn {
  isVisible: boolean;
  showModal: () => void;
  hideModal: () => void;
  toggleModal: () => void;
}

export const useModal = (initialState: boolean = false): UseModalReturn => {
  const [isVisible, setIsVisible] = useState<boolean>(initialState);

  const showModal = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsVisible(false);
  }, []);

  const toggleModal = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  return { isVisible, showModal, hideModal, toggleModal };
};