// src/components/LoginPromptModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { normalize } from '../utils/responsive';

interface LoginPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  actionType?: 'like' | 'comment' | 'share' | 'write';
  isDarkMode?: boolean;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  visible,
  onClose,
  onLogin,
  actionType = 'like',
  isDarkMode = false,
}) => {
  const getContent = () => {
    switch (actionType) {
      case 'like':
        return {
          icon: 'heart',
          title: '마음을 전하고 싶으신가요?',
          subtitle: '로그인하고 공감을 표현해보세요',
          emoji: '💜',
        };
      case 'comment':
        return {
          icon: 'comment-text',
          title: '이야기를 나누고 싶으신가요?',
          subtitle: '로그인하고 함께 대화해보세요',
          emoji: '💬',
        };
      case 'write':
        return {
          icon: 'pencil',
          title: '당신의 이야기를 들려주세요',
          subtitle: '로그인하고 감정을 나눠보세요',
          emoji: '✨',
        };
      case 'share':
        return {
          icon: 'share-variant',
          title: '더 많은 사람과 나누고 싶으신가요?',
          subtitle: '로그인하고 공유해보세요',
          emoji: '🌟',
        };
      default:
        return {
          icon: 'account-heart',
          title: '함께 감정을 나눠요',
          subtitle: '로그인하고 커뮤니티에 참여하세요',
          emoji: '💜',
        };
    }
  };

  const content = getContent();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' },
            ]}
          >
            {/* 아이콘 */}
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Text style={styles.emoji}>{content.emoji}</Text>
              </LinearGradient>
            </View>

            {/* 메시지 */}
            <Text
              style={[
                styles.title,
                { color: isDarkMode ? '#F9FAFB' : '#111827' },
              ]}
            >
              {content.title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: isDarkMode ? '#D1D5DB' : '#6B7280' },
              ]}
            >
              {content.subtitle}
            </Text>

            {/* 버튼들 */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                onPress={onLogin}
                style={styles.loginButtonWrapper}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButton}
                >
                  <MaterialCommunityIcons
                    name="login"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.loginButtonText}>시작하기</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                  ]}
                >
                  나중에
                </Text>
              </TouchableOpacity>
            </View>

            {/* 하단 안내 */}
            <Text
              style={[
                styles.bottomText,
                { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' },
              ]}
            >
              읽기는 언제나 자유롭게 가능해요 ✨
            </Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  iconWrapper: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  loginButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bottomText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: -0.1,
  },
});

export default LoginPromptModal;
