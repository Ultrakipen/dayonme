import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { emotionColors, getEmotionColors } from '../../../../constants/reviewColors';
import { scaleFontSize, scaleSpacing } from '../../../../styles/ReviewScreen.styles';
import { useModernTheme } from '../../../../contexts/ModernThemeContext';

interface InfoModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  title,
  message,
  onClose
}) => {
  const { isDark, colors } = useModernTheme();
  const themeColors = getEmotionColors(isDark);
  const styles = createStyles(isDark, colors, themeColors);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayCenter}>
        <View style={styles.infoModalContainer}>
          <Text style={styles.infoModalTitle}>{title}</Text>
          <Text style={styles.infoModalMessage}>{message}</Text>
          <TouchableOpacity
            style={styles.infoModalButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.infoModalButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (isDark: boolean, colors: any, themeColors: any) => StyleSheet.create({
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(40)
  },
  infoModalContainer: {
    backgroundColor: colors.card,
    borderRadius: scaleSpacing(20),
    padding: scaleSpacing(28),
    width: '100%',
    maxWidth: scaleSpacing(360),
    alignItems: 'center',
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.border : 'transparent'
  },
  infoModalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: scaleSpacing(12),
    textAlign: 'center'
  },
  infoModalMessage: {
    fontSize: scaleFontSize(15),
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFontSize(22),
    marginBottom: scaleSpacing(24)
  },
  infoModalButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: scaleSpacing(14),
    paddingHorizontal: scaleSpacing(40),
    borderRadius: scaleSpacing(12)
  },
  infoModalButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
