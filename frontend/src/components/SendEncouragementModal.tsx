// src/components/SendEncouragementModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text as RNText,
  ScrollView,
  Animated,
  Vibration,
} from 'react-native';
import { Text, Box } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import encouragementService from '../services/api/encouragementService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getScale } from '../utils/responsive';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onConfirm: () => void;
  confirmText?: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onConfirm,
  confirmText = '확인',
}) => {
  const { isDarkMode } = useTheme();
  const scale = getScale();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const colors = {
    backdrop: 'rgba(0, 0, 0, 0.65)',
    card: isDarkMode ? '#1f1f1f' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#b0b0b0' : '#6b7280',
    success: isDarkMode ? '#34d399' : '#10b981',
    successBg: isDarkMode ? 'rgba(52, 211, 153, 0.12)' : 'rgba(16, 185, 129, 0.1)',
    error: isDarkMode ? '#f87171' : '#ef4444',
    errorBg: isDarkMode ? 'rgba(248, 113, 113, 0.12)' : 'rgba(239, 68, 68, 0.1)',
    info: isDarkMode ? '#818cf8' : '#6366f1',
    infoBg: isDarkMode ? 'rgba(129, 140, 248, 0.12)' : 'rgba(99, 102, 241, 0.1)',
    primary: isDarkMode ? '#818cf8' : '#6366f1',
  };

  const iconConfig = {
    success: { name: 'check-circle', color: colors.success, bg: colors.successBg },
    error: { name: 'alert-circle', color: colors.error, bg: colors.errorBg },
    info: { name: 'information', color: colors.info, bg: colors.infoBg },
  };

  const config = iconConfig[type];

  const handleConfirm = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(50);
    }
    onConfirm();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleConfirm}>
      <Animated.View style={[styles.alertOverlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleConfirm}
        />
        <Animated.View
          style={[
            styles.alertCard,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.alertIconContainer, { backgroundColor: config.bg }]}>
            <MaterialCommunityIcons name={config.name} size={48 * scale} color={config.color} />
          </View>
          <RNText style={[styles.alertTitle, { color: colors.text, fontSize: 20 * scale }]}>
            {title}
          </RNText>
          <RNText style={[styles.alertMessage, { color: colors.textSecondary, fontSize: 15 * scale }]}>
            {message}
          </RNText>
          <TouchableOpacity
            style={[styles.alertButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <RNText style={[styles.alertButtonText, { fontSize: 16 * scale }]}>
              {confirmText}
            </RNText>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

interface SendEncouragementModalProps {
  visible: boolean;
  onClose: () => void;
  toUserId: number;
  toUserNickname: string;
}

const SendEncouragementModal: React.FC<SendEncouragementModalProps> = ({
  visible,
  onClose,
  toUserId,
  toUserNickname,
}) => {
  const { isDarkMode } = useTheme();
  const scale = getScale();

  // 테마별 색상 정의 (개선된 색상)
  const colors = {
    card: isDarkMode ? '#1f1f1f' : '#ffffff',
    surface: isDarkMode ? '#2a2a2a' : '#f9fafb',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#b0b0b0' : '#6b7280',
    primary: isDarkMode ? '#818cf8' : '#6366f1',
    primaryLight: isDarkMode ? '#4c52a8' : '#eef2ff',
    error: isDarkMode ? '#f87171' : '#ef4444',
    errorLight: isDarkMode ? '#4a2020' : '#fef2f2',
    border: isDarkMode ? '#3a3a3a' : '#e5e7eb',
  };

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });
  const maxLength = 100;

  const showAlert = (
    title: string,
    msg: string,
    type: 'success' | 'error' | 'info' = 'info',
    onConfirm: () => void = () => setAlert({ ...alert, visible: false })
  ) => {
    setAlert({ visible: true, title, message: msg, type, onConfirm });
  };

  useEffect(() => {
    if (visible) {
      loadRemainingCount();
    }
  }, [visible]);

  const loadRemainingCount = async () => {
    try {
      const response = await encouragementService.getRemainingCount();
      if (response.status === 'success') {
        setRemainingCount(response.data.remaining);
      }
    } catch (error) {
      if (__DEV__) console.error('남은 횟수 조회 오류:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate(100);
      }
      showAlert('알림', '메시지를 입력해주세요.', 'info');
      return;
    }

    if (message.length > maxLength) {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate(100);
      }
      showAlert('알림', `메시지는 ${maxLength}자 이내로 작성해주세요.`, 'info');
      return;
    }

    if (remainingCount !== null && remainingCount <= 0) {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate(100);
      }
      showAlert('알림', '하루 최대 3개의 격려 메시지만 보낼 수 있습니다.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await encouragementService.sendEncouragement({
        to_user_id: toUserId,
        message: message.trim(),
      });

      if (response.status === 'success') {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          Vibration.vibrate([50, 100, 50]);
        }
        // 남은 횟수 업데이트
        if (response.data?.dailyRemaining !== undefined) {
          setRemainingCount(response.data.dailyRemaining);
        }
        showAlert(
          '전송 완료',
          '익명 격려 메시지가 전송되었습니다.',
          'success',
          () => {
            setMessage('');
            setAlert({ ...alert, visible: false });
            onClose();
          }
        );
      }
    } catch (error: unknown) {
      if (__DEV__) console.error('격려 메시지 전송 오류:', error);
      const errorMessage = error.response?.data?.message || '메시지 전송에 실패했습니다.';
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate([100, 50, 100]);
      }
      showAlert('오류', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '95%', maxWidth: 480 }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* 헤더 */}
                <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                    <MaterialCommunityIcons
                      name="heart"
                      size={28 * scale}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ marginLeft: 16 * scale, flex: 1 }}>
                    <RNText style={[styles.headerTitle, { color: colors.text, fontSize: 20 * scale }]}>
                      익명 격려 메시지
                    </RNText>
                    <RNText style={[styles.headerSubtitle, { color: colors.textSecondary, fontSize: 15 * scale }]}>
                      {toUserNickname}님에게
                    </RNText>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={28 * scale} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

            {/* 남은 횟수 안내 */}
            {remainingCount !== null && (
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: remainingCount > 0 ? colors.primaryLight : colors.errorLight,
                    borderColor: remainingCount > 0 ? colors.primary : colors.error,
                  }
                ]}
              >
                <MaterialCommunityIcons
                  name="information"
                  size={22 * scale}
                  color={remainingCount > 0 ? colors.primary : colors.error}
                />
                <RNText
                  style={[
                    styles.infoText,
                    {
                      color: remainingCount > 0 ? colors.primary : colors.error,
                      fontSize: 16 * scale,
                    }
                  ]}
                >
                  오늘 {remainingCount}개 더 보낼 수 있습니다
                </RNText>
              </View>
            )}

            {/* 메시지 입력 */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                    fontSize: 17 * scale,
                    lineHeight: 24 * scale,
                  }
                ]}
                placeholder="따뜻한 격려의 메시지를 보내보세요..."
                placeholderTextColor={colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={maxLength}
                numberOfLines={5}
                textAlignVertical="top"
              />
              <View style={styles.counterContainer}>
                <RNText style={[styles.counterText, { color: colors.textSecondary, fontSize: 15 * scale }]}>
                  {message.length} / {maxLength}
                </RNText>
              </View>
            </View>

            {/* 익명성 안내 */}
            <View style={[styles.anonymityBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialCommunityIcons
                name="incognito"
                size={22 * scale}
                color={colors.textSecondary}
              />
              <RNText
                style={[styles.anonymityText, { color: colors.textSecondary, fontSize: 14 * scale, lineHeight: 20 * scale }]}
              >
                메시지는 익명으로 전송됩니다. 받는 사람은 보낸 사람을 알 수 없습니다.
              </RNText>
            </View>

            {/* 버튼 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }
                ]}
                onPress={handleClose}
                disabled={loading}
              >
                <RNText style={[styles.buttonText, { color: colors.text, fontSize: 17 * scale }]}>
                  취소
                </RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.sendButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: loading || !message.trim() || (remainingCount !== null && remainingCount <= 0) ? 0.5 : 1,
                  }
                ]}
                onPress={handleSend}
                disabled={loading || !message.trim() || (remainingCount !== null && remainingCount <= 0)}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <RNText style={[styles.buttonText, { color: '#ffffff', fontSize: 17 * scale }]}>
                    전송
                  </RNText>
                )}
              </TouchableOpacity>
            </View>
            </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>

    <CustomAlert
      visible={alert.visible}
      title={alert.title}
      message={alert.message}
      type={alert.type}
      onConfirm={alert.onConfirm}
    />
    </>
  );
};

const styles = StyleSheet.create({
  // Alert 스타일
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertTitle: {
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  alertMessage: {
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    letterSpacing: -0.1,
  },
  alertButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  alertButtonText: {
    color: '#ffffff',
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.2,
  },

  // Modal 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 24,
    padding: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: 'Pretendard-Medium',
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1.5,
  },
  infoText: {
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: 12,
    flex: 1,
    letterSpacing: -0.2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    minHeight: 140,
    fontFamily: 'Pretendard-Medium',
    letterSpacing: -0.2,
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  counterText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  anonymityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 28,
    borderWidth: 1.5,
  },
  anonymityText: {
    marginLeft: 12,
    flex: 1,
    fontFamily: 'Pretendard-Medium',
    letterSpacing: -0.1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButton: {
    borderWidth: 2,
  },
  sendButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonText: {
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.2,
  },
});

export default SendEncouragementModal;
