import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../contexts/ModernThemeContext';

export type BlockReason = 'spam' | 'harassment' | 'inappropriate' | 'abuse' | 'privacy' | 'other';

interface BlockReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onBlock: (reason?: BlockReason) => void;
  targetName?: string; // 차단 대상 이름 (사용자 닉네임 또는 "이 콘텐츠")
}

const BlockReasonModal: React.FC<BlockReasonModalProps> = ({
  visible,
  onClose,
  onBlock,
  targetName = '이 항목',
}) => {
  const themeContext = useModernTheme();
  const modernTheme = themeContext?.modernTheme;
  const isDark = themeContext?.isDark || false;
  const [selectedReason, setSelectedReason] = useState<BlockReason | null>(null);

  // theme가 없을 때 기본값 사용
  const defaultTheme = {
    bg: {
      card: isDark ? '#1C1C1E' : '#FFFFFF',
      secondary: isDark ? '#2C2C2E' : '#F2F2F7',
    },
    text: {
      primary: isDark ? '#FAFAFA' : '#000000',
      secondary: isDark ? '#98989D' : '#8E8E93',
    }
  };

  const styles = getStyles(modernTheme || defaultTheme, isDark);

  const reasons: { value: BlockReason; label: string; icon: string }[] = [
    { value: 'spam', label: '스팸', icon: 'mail-unread' },
    { value: 'harassment', label: '괴롭힘', icon: 'warning' },
    { value: 'inappropriate', label: '부적절한 콘텐츠', icon: 'alert-circle' },
    { value: 'abuse', label: '욕설/비방', icon: 'ban' },
    { value: 'privacy', label: '개인정보 침해', icon: 'lock-closed' },
    { value: 'other', label: '기타', icon: 'ellipsis-horizontal' },
  ];

  const handleBlock = () => {
    onBlock(selectedReason || undefined);
    setSelectedReason(null);
    onClose();
  };

  const handleSkip = () => {
    onBlock(undefined);
    setSelectedReason(null);
    onClose();
  };

  const handleClose = () => {
    setSelectedReason(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>{targetName} 차단</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={(modernTheme || defaultTheme).text.primary} />
            </TouchableOpacity>
          </View>

          {/* 설명 */}
          <Text style={styles.description}>
            차단 사유를 선택하면 나중에 참고할 수 있습니다. (선택사항)
          </Text>

          {/* 사유 목록 */}
          <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.value && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View style={styles.reasonLeft}>
                  <Icon
                    name={reason.icon}
                    size={22}
                    color={selectedReason === reason.value ? '#8B5CF6' : (modernTheme || defaultTheme).text.secondary}
                  />
                  <Text
                    style={[
                      styles.reasonLabel,
                      selectedReason === reason.value && styles.reasonLabelSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    selectedReason === reason.value && styles.radioSelected,
                  ]}
                >
                  {selectedReason === reason.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 버튼 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>건너뛰기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.blockButton,
                selectedReason && styles.blockButtonActive,
              ]}
              onPress={handleBlock}
            >
              <Text style={styles.blockButtonText}>차단</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: theme.bg.card,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: isDark ? '#fff' : '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.15 : 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    color: theme.text.primary,
    letterSpacing: -0.4,
  },
  closeButton: {
    padding: 6,
  },
  description: {
    fontSize: 14.5,
    color: theme.text.secondary,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 16,
    lineHeight: 21,
  },
  reasonList: {
    maxHeight: 360,
    paddingHorizontal: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: theme.bg.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonItemSelected: {
    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.12)',
    borderColor: '#8B5CF6',
  },
  reasonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reasonLabel: {
    fontSize: 15.5,
    color: theme.text.primary,
    marginLeft: 14,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.2,
  },
  reasonLabelSelected: {
    fontFamily: 'Pretendard-Bold',
    color: '#8B5CF6',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#8B5CF6',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#8B5CF6',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 26,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15.5,
    fontFamily: 'Pretendard-SemiBold',
    color: theme.text.primary,
    letterSpacing: -0.2,
  },
  blockButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF453A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  blockButtonText: {
    fontSize: 15.5,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default BlockReasonModal;
