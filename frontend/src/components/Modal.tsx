// Modal.tsx - React Native + Gluestack UI 버전
import React, { ReactNode } from 'react';
import { Modal as RNModal, TouchableWithoutFeedback } from 'react-native';
import { Box, Text, HStack, VStack, Pressable } from './ui';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  closeOnBackdropPress?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isVisible,
  onClose,
  title,
  children,
  footer,
  animationType = 'fade',
  closeOnBackdropPress = true,
}) => {
  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={isVisible}
      transparent={true}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Box className="flex-1 justify-center items-center bg-black/50">
          <TouchableWithoutFeedback onPress={() => {}}>
            <Box className="w-[85%] max-w-lg bg-white rounded-xl overflow-hidden shadow-xl">
              {title && (
                <HStack className="justify-between items-center p-4 border-b border-gray-200">
                  <Text className="text-lg font-bold text-gray-800">{title}</Text>
                  <Pressable
                    className="p-1"
                    onPress={onClose}
                  >
                    <Text className="text-2xl text-gray-500">×</Text>
                  </Pressable>
                </HStack>
              )}
              
              <Box className="p-4">
                {children}
              </Box>
              
              {footer && (
                <Box className="p-4 border-t border-gray-200">
                  {footer}
                </Box>
              )}
            </Box>
          </TouchableWithoutFeedback>
        </Box>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

export default Modal;