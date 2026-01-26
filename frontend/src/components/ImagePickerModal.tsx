import React from 'react';
import {
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text, VStack } from './ui';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onSelectCamera: () => void;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onSelectGallery,
  onSelectCamera
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: 'rgba(255,255,255,0.98)',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 24,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 핸들 바 */}
          <Box style={{
            width: 40,
            height: 4,
            backgroundColor: '#E5E7EB',
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 24
          }} />

          <Text style={{
            fontSize: 24,
            fontFamily: 'Pretendard-ExtraBold',
            color: '#111827',
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: 'Pretendard-ExtraBold',
            letterSpacing: -0.5
          }}>
            📸 사진 선택
          </Text>

          <Text style={{
            fontSize: 16,
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: 32,
            fontFamily: 'Pretendard-Medium',
            lineHeight: 24
          }}>
            어떤 방법으로 사진을 선택하시겠어요?
          </Text>

          <VStack style={{ gap: 16 }}>
            {/* 갤러리 버튼 */}
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#1D4ED8' : '#2563EB',
                paddingVertical: 20,
                paddingHorizontal: 24,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.2)'
              })}
              onPress={() => {
                onClose();
                onSelectGallery();
              }}
            >
              <MaterialCommunityIcons
                name="image-multiple"
                size={28}
                color="white"
                style={{ marginRight: 12 }}
              />
              <Text style={{
                fontSize: 18,
                fontFamily: 'Pretendard-Bold',
                color: 'white',
                fontFamily: 'Pretendard-Bold',
                letterSpacing: -0.3
              }}>
                갤러리에서 선택
              </Text>
            </Pressable>

            {/* 카메라 버튼 */}
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#059669' : '#10B981',
                paddingVertical: 20,
                paddingHorizontal: 24,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.2)'
              })}
              onPress={() => {
                onClose();
                setTimeout(() => {
                  onSelectCamera();
                }, 100);
              }}
            >
              <MaterialCommunityIcons
                name="camera"
                size={28}
                color="white"
                style={{ marginRight: 12 }}
              />
              <Text style={{
                fontSize: 18,
                fontFamily: 'Pretendard-Bold',
                color: 'white',
                fontFamily: 'Pretendard-Bold',
                letterSpacing: -0.3
              }}>
                사진 촬영하기
              </Text>
            </Pressable>

            {/* 취소 버튼 */}
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#F3F4F6' : 'rgba(243,244,246,0.8)',
                paddingVertical: 18,
                paddingHorizontal: 24,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                transform: [{ scale: pressed ? 0.98 : 1 }]
              })}
              onPress={onClose}
            >
              <Text style={{
                fontSize: 16,
                fontFamily: 'Pretendard-SemiBold',
                color: '#6B7280',
                fontFamily: 'Pretendard-SemiBold'
              }}>
                취소
              </Text>
            </Pressable>
          </VStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ImagePickerModal;