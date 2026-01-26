import React from 'react';
import { Modal, View, Text as RNText, TouchableOpacity, Pressable } from 'react-native';
import { getEmotionIcon } from '../../../utils/emotionHelpers';
import { scaleFontSize, scaleSpacing } from '../../../styles/ReviewScreen.styles';

interface EmotionDetailContent {
  emotion: string;
  count: number;
  percent: number;
  color: string;
}

interface EmotionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  content: EmotionDetailContent;
  colors: any;
  isDark: boolean;
}

const EmotionDetailModal: React.FC<EmotionDetailModalProps> = ({ visible, onClose, content, colors, isDark }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: isDark ? colors.card : '#F5F5F7',
            borderRadius: 20,
            padding: 24,
            width: '85%',
            maxWidth: 320,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.15,
            shadowRadius: 12,
            elevation: 8
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              width: scaleSpacing(64),
              height: scaleSpacing(64),
              borderRadius: scaleSpacing(32),
              backgroundColor: content.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: scaleSpacing(16)
            }}
          >
            <RNText style={{ fontSize: scaleFontSize(32) }}>{getEmotionIcon(content.emotion)}</RNText>
          </View>

          <RNText
            style={{
              fontSize: scaleFontSize(22),
              fontFamily: 'Pretendard-Bold',
              color: colors.text.primary,
              marginBottom: scaleSpacing(8)
            }}
          >
            {content.emotion}
          </RNText>

          <View
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              borderRadius: 12,
              padding: 16,
              width: '100%',
              marginTop: 12,
              marginBottom: 20
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <RNText style={{ fontSize: scaleFontSize(14), color: colors.text.secondary }}>기록 횟수</RNText>
              <RNText style={{ fontSize: scaleFontSize(16), fontFamily: 'Pretendard-SemiBold', color: content.color }}>
                {content.count}번
              </RNText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <RNText style={{ fontSize: scaleFontSize(14), color: colors.text.secondary }}>비율</RNText>
              <RNText style={{ fontSize: scaleFontSize(16), fontFamily: 'Pretendard-SemiBold', color: content.color }}>
                {content.percent}%
              </RNText>
            </View>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: content.color,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 32,
              width: '100%'
            }}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <RNText
              style={{
                fontSize: scaleFontSize(16),
                fontFamily: 'Pretendard-SemiBold',
                color: '#FFFFFF',
                textAlign: 'center'
              }}
            >
              확인
            </RNText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default EmotionDetailModal;
