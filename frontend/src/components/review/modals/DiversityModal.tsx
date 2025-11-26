import React from 'react';
import { Modal, View, Text as RNText, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { emotionColors } from '../../../constants/reviewColors';
import { getEmotionIcon, getEmotionColor } from '../../../utils/emotionHelpers';
import { scaleFontSize, scaleSpacing } from '../../../styles/ReviewScreen.styles';
import { EmotionStat } from '../../../types/ReviewScreen.types';

interface DiversityModalProps {
  visible: boolean;
  onClose: () => void;
  emotionStats: EmotionStat[];
  styles: any;
  colors: any;
  isDark: boolean;
}

const DiversityModal: React.FC<DiversityModalProps> = ({
  visible,
  onClose,
  emotionStats,
  styles,
  colors,
  isDark
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayCenter}>
        <View style={styles.modalContainerCenter}>
          <View style={styles.modalHeader}>
            <RNText style={styles.modalTitle}>감정 다양성</RNText>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Icon name="close" size={28} color={emotionColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            scrollEventThrottle={16}
          >
            <RNText style={[styles.modalSubtitle, { textAlign: 'center' }]}>
              여러 감정을 느끼는 건 자연스러운 거예요 🌈
            </RNText>

            {emotionStats.length > 0 ? (
              <View style={styles.modernEmotionSection}>
                <View
                  style={{
                    paddingVertical: 20,
                    paddingHorizontal: 10,
                    minHeight: 250,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {emotionStats.map((emotion, idx) => {
                    const emotionName = emotion.name || '기록됨';
                    const emotionEmoji = getEmotionIcon(emotionName);
                    const emotionColor = emotion.color || getEmotionColor(emotionName);

                    const seed = emotionName.charCodeAt(0) + idx;
                    const randomX = ((seed * 17) % 24) - 12;
                    const randomY = ((seed * 23) % 24) - 12;

                    return (
                      <View
                        key={idx}
                        style={{
                          alignItems: 'center',
                          marginHorizontal: 10,
                          marginVertical: 10,
                          transform: [{ translateX: randomX }, { translateY: randomY }]
                        }}
                      >
                        <RNText style={{ fontSize: scaleFontSize(52), marginBottom: scaleSpacing(6) }}>
                          {emotionEmoji}
                        </RNText>
                        <RNText
                          style={{
                            fontSize: scaleFontSize(17),
                            fontWeight: '700',
                            color: emotionColor,
                            textAlign: 'center'
                          }}
                        >
                          {emotionName}
                        </RNText>
                        <RNText
                          style={{
                            fontSize: scaleFontSize(15),
                            fontWeight: '600',
                            color: emotionColors.textSecondary,
                            textAlign: 'center',
                            marginTop: 3
                          }}
                        >
                          {emotion.count}회
                        </RNText>
                      </View>
                    );
                  })}
                </View>

                <RNText style={styles.modernDiversityMessage}>
                  {emotionStats.length >= 8
                    ? '💬 정말 다채로운 감정을 경험했네요!'
                    : emotionStats.length >= 5
                    ? '💬 다양한 감정을 느끼고 계시네요'
                    : emotionStats.length >= 3
                    ? '💬 조금씩 다양해지고 있어요'
                    : '💬 더 다양한 감정을 느껴보세요'}
                </RNText>
              </View>
            ) : (
              <View style={{ paddingVertical: scaleSpacing(40), alignItems: 'center' }}>
                <RNText style={{ fontSize: scaleFontSize(48), marginBottom: scaleSpacing(16) }}>🎨</RNText>
                <RNText style={{ fontSize: scaleFontSize(17), fontWeight: '600', color: colors.text.secondary }}>
                  아직 기록된 감정이 없어요
                </RNText>
                <RNText style={{ fontSize: scaleFontSize(15), color: colors.text.secondary, marginTop: scaleSpacing(8) }}>
                  다양한 감정을 기록해보세요
                </RNText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DiversityModal;
