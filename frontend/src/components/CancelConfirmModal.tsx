import React from 'react';
import {
  Modal,
  Pressable,
  Platform,
  useWindowDimensions
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text, VStack, HStack } from './ui';

interface CancelConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

const CancelConfirmModal: React.FC<CancelConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  type = 'warning'
}) => {
  const { width } = useWindowDimensions();
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmColor: '#EF4444',
          confirmColorPressed: '#DC2626',
          iconColor: '#EF4444'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmColor: '#3B82F6',
          confirmColorPressed: '#2563EB',
          iconColor: '#3B82F6'
        };
      default: // warning
        return {
          icon: '⚠️',
          confirmColor: '#F59E0B',
          confirmColorPressed: '#D97706',
          iconColor: '#F59E0B'
        };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: 'rgba(255,255,255,0.98)',
            borderRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
            width: '100%',
            maxWidth: 340,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 32,
            elevation: 32,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 아이콘 */}
          <Box style={{
            alignSelf: 'center',
            marginBottom: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: `${typeConfig.iconColor}15`,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 28,
              textAlign: 'center'
            }}>
              {typeConfig.icon}
            </Text>
          </Box>

          {/* 제목 */}
          <Text style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#111827',
            textAlign: 'center',
            marginBottom: 12,
            fontFamily: 'Pretendard-ExtraBold',
            letterSpacing: -0.5
          }}>
            {title}
          </Text>

          {/* 메시지 */}
          <Text style={{
            fontSize: 16,
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: 32,
            fontFamily: 'Pretendard-Medium',
            lineHeight: 24
          }}>
            {message}
          </Text>

          {/* 버튼들 */}
          <HStack style={{ gap: 12 }}>
            {/* 취소 버튼 */}
            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? '#F3F4F6' : 'rgba(243,244,246,0.8)',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                transform: [{ scale: pressed ? 0.98 : 1 }]
              })}
              onPress={onClose}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#6B7280',
                fontFamily: 'Pretendard-SemiBold'
              }}>
                {cancelText}
              </Text>
            </Pressable>

            {/* 확인 버튼 */}
            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? typeConfig.confirmColorPressed : typeConfig.confirmColor,
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: typeConfig.confirmColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              })}
              onPress={onConfirm}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: 'white',
                fontFamily: 'Pretendard-Bold'
              }}>
                {confirmText}
              </Text>
            </Pressable>
          </HStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CancelConfirmModal;