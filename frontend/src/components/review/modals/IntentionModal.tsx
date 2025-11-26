import React from 'react';
import { Modal, View, Text as RNText, TextInput, TouchableOpacity, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { emotionColors } from '../../../constants/reviewColors';

interface IntentionModalProps {
  visible: boolean;
  onClose: () => void;
  intentionText: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  getIntentionTitle: () => string;
  styles: any;
}

const IntentionModal: React.FC<IntentionModalProps> = ({
  visible,
  onClose,
  intentionText,
  onChangeText,
  onSave,
  getIntentionTitle,
  styles
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <RNText style={styles.modalTitle}>{getIntentionTitle()} 작성</RNText>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Icon name="close" size={24} color={emotionColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <RNText style={[styles.modalSubtitle, { textAlign: 'center' }]}>
            오늘의 감정을 자유롭게 표현해보세요 💙
          </RNText>

          <TextInput
            style={styles.modalInput}
            value={intentionText}
            onChangeText={onChangeText}
            placeholder="예: 이번 주는 나 자신에게 더 친절하게 대하고 싶어요"
            placeholderTextColor={emotionColors.textLight}
            multiline={true}
            maxLength={500}
            autoFocus={true}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <RNText style={styles.modalButtonTextCancel}>취소</RNText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSave]}
              onPress={onSave}
              activeOpacity={0.7}
            >
              <RNText style={styles.modalButtonTextSave}>저장</RNText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default IntentionModal;
