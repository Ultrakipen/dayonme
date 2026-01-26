// 비로그인 사용자 가입 유도 바텀시트 (인스타그램 스타일)
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { getScale } from '../utils/responsive';

const normalize = (size: number) => Math.round(size * getScale());

interface GuestPromptBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  title?: string;
  message?: string;
  isDarkMode?: boolean;
}

const GuestPromptBottomSheet: React.FC<GuestPromptBottomSheetProps> = ({
  visible,
  onClose,
  onLogin,
  onRegister,
  title = '로그인이 필요해요',
  message = '챌린지에 참여하고 감정을 기록해보세요',
  isDarkMode = false
}) => {
  // 디버깅용
  React.useEffect(() => {
    if (visible) {
      if (__DEV__) console.log('🎨 GuestPromptBottomSheet isDarkMode:', isDarkMode);
    }
  }, [visible, isDarkMode]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={[
          styles.container,
          { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }
        ]}>
        {/* 아이콘 */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={isDarkMode ? ['#8B5CF6', '#A855F7'] : ['#6C5CE7', '#A29BFE']}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons
              name="lock-outline"
              size={32}
              color="#FFFFFF"
            />
          </LinearGradient>
        </View>

        {/* 제목 */}
        <Text style={[
          styles.title,
          { color: isDarkMode ? '#FFFFFF' : '#111827' }
        ]}>
          {title}
        </Text>

        {/* 메시지 */}
        <Text style={[
          styles.message,
          { color: isDarkMode ? '#A8A8AD' : '#6B7280' }
        ]}>
          {message}
        </Text>

        {/* 버튼 그룹 */}
        <View style={styles.buttonGroup}>
          {/* 회원가입 버튼 (Primary) */}
          <TouchableOpacity
            style={styles.primaryButtonWrapper}
            onPress={onRegister}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDarkMode ? ['#8B5CF6', '#A855F7'] : ['#667eea', '#764ba2']}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>회원가입</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 로그인 버튼 (Secondary) */}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderColor: isDarkMode ? '#3A3A3C' : '#E5E7EB',
                backgroundColor: isDarkMode ? '#2C2C2E' : '#F9FAFB'
              }
            ]}
            onPress={onLogin}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.secondaryButtonText,
              { color: isDarkMode ? '#FFFFFF' : '#374151' }
            ]}>
              로그인
            </Text>
          </TouchableOpacity>
        </View>

        {/* 나중에 버튼 */}
        <TouchableOpacity
          style={styles.laterButton}
          onPress={onClose}
          activeOpacity={0.6}
        >
          <Text style={[
            styles.laterButtonText,
            { color: isDarkMode ? '#8E8E93' : '#9CA3AF' }
          ]}>
            나중에
          </Text>
        </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  primaryButtonWrapper: {
    width: '100%',
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
  },
  secondaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.3,
  },
  laterButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  laterButtonText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
  },
});

export default GuestPromptBottomSheet;
