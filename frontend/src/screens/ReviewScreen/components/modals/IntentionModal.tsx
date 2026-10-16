import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { emotionColors, getEmotionColors } from '../../../../constants/reviewColors';
import { scaleFontSize, scaleSpacing } from '../../../../styles/ReviewScreen.styles';
import { sanitizeText } from '../../../../utils/sanitize';
import { useModernTheme } from '../../../../contexts/ModernThemeContext';

interface IntentionModalProps {
  visible: boolean;
  title: string;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const IntentionModal: React.FC<IntentionModalProps> = ({
  visible,
  title,
  value,
  onChangeText,
  onSave,
  onClose
}) => {
  const { isDark, colors } = useModernTheme();
  const themeColors = getEmotionColors(isDark);
  const styles = createStyles(isDark, colors, themeColors);
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = (text: string) => {
    const sanitized = sanitizeText(text, 500);
    onChangeText(sanitized);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />

          <LinearGradient
            colors={[themeColors.instagramPurple, themeColors.instagramPink]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.modalHeaderGradient}
          >
            <View style={styles.modalHeaderIconWrapper}>
              <Icon name="compass" size={28} color="#FFFFFF" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.modalTitle}>{title} 작성</Text>
              <Text style={styles.modalSubtitle}>
                마음을 자유롭게 표현해보세요 ✨
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Icon name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.modalInput,
                isFocused && styles.modalInputFocused
              ]}
              value={value}
              onChangeText={handleChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="예: 이번 주는 나 자신에게 더 친절하게 대하고 싶어요"
              placeholderTextColor={colors.text.tertiary}
              multiline={true}
              maxLength={500}
              autoFocus={true}
            />
            <View style={styles.charCount}>
              <Text style={styles.charCountText}>{value.length}/500</Text>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonTextCancel}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSave]}
              onPress={onSave}
              activeOpacity={0.8}
              disabled={!value.trim()}
            >
              <LinearGradient
                colors={value.trim() ? [themeColors.instagramPurple, themeColors.instagramPink] : ['#CCCCCC', '#AAAAAA']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.saveButtonGradient}
              >
                <Icon name="checkmark-circle" size={20} color="#FFFFFF" style={{marginRight: 6}} />
                <Text style={styles.modalButtonTextSave}>저장하기</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const createStyles = (isDark: boolean, colors: any, themeColors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(20)
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: scaleSpacing(24),
    width: '100%',
    maxWidth: scaleSpacing(420),
    overflow: 'hidden',
    elevation: 10,
    shadowColor: isDark ? '#FFFFFF' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.4 : 0.3,
    shadowRadius: 12,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.border : 'transparent'
  },
  modalHandle: {
    width: scaleSpacing(40),
    height: scaleSpacing(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: scaleSpacing(2),
    alignSelf: 'center',
    marginTop: scaleSpacing(8)
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(20),
    paddingVertical: scaleSpacing(20),
    paddingTop: scaleSpacing(16)
  },
  modalHeaderIconWrapper: {
    width: scaleSpacing(44),
    height: scaleSpacing(44),
    borderRadius: scaleSpacing(22),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSpacing(12)
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scaleSpacing(2)
  },
  modalSubtitle: {
    fontSize: scaleFontSize(13),
    color: 'rgba(255, 255, 255, 0.9)'
  },
  modalCloseButton: {
    padding: scaleSpacing(4)
  },
  inputWrapper: {
    paddingHorizontal: scaleSpacing(20),
    paddingTop: scaleSpacing(20)
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(16),
    padding: scaleSpacing(16),
    fontSize: scaleFontSize(16),
    color: colors.text.primary,
    minHeight: scaleSpacing(140),
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  modalInputFocused: {
    borderColor: themeColors.instagramPurple,
    backgroundColor: colors.card
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: scaleSpacing(8),
    marginBottom: scaleSpacing(12)
  },
  charCountText: {
    fontSize: scaleFontSize(12),
    color: colors.text.tertiary
  },
  modalActions: {
    flexDirection: 'row',
    gap: scaleSpacing(12),
    paddingHorizontal: scaleSpacing(20),
    paddingBottom: scaleSpacing(20)
  },
  modalButton: {
    flex: 1,
    borderRadius: scaleSpacing(14),
    overflow: 'hidden'
  },
  modalButtonCancel: {
    backgroundColor: colors.surface,
    paddingVertical: scaleSpacing(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  modalButtonSave: {
    overflow: 'hidden'
  },
  saveButtonGradient: {
    flexDirection: 'row',
    paddingVertical: scaleSpacing(14),
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalButtonTextCancel: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    color: colors.text.secondary
  },
  modalButtonTextSave: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
