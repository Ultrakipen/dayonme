import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TYPOGRAPHY, SPACING, RADIUS } from '../styles/challengeDesignSystem';

// React Native 0.80 호환성: 모듈 레벨에서 Dimensions.get() 호출 금지
const getHeight = () => {
  try {
    const h = Dimensions.get('window').height;
    if (h > 0) return h;
  } catch (e) {}
  return 780;
};

// 2025 트렌드 컬러 팔레트
import { COLORS as DS_COLORS } from '../constants/designSystem';
const COLORS = DS_COLORS;

interface ChallengeOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  challenge: any;
  currentUserId: number;
  isDarkMode: boolean;
  onEdit: () => void;
  onEditPeriod: () => void;
  onDelete: () => void;
  onReport: (reason: string) => void;
  onShare: () => void;
}

// 커스텀 알럿 모달 컴포넌트
interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: CustomAlertButton[];
  isDarkMode: boolean;
  onDismiss?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  isDarkMode,
  onDismiss,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => onDismiss?.()}
      statusBarTranslucent
    >
      <View style={customAlertStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onDismiss?.()} />

        <Animated.View
          style={[
            customAlertStyles.alertContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* 글래스모피즘 백그라운드 */}
          <View style={[
            customAlertStyles.alertBox,
            {
              backgroundColor: isDarkMode
                ? 'rgba(45, 45, 45, 0.98)'
                : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            }
          ]}>
            {/* 타이틀 */}
            <Text style={[
              customAlertStyles.alertTitle,
              { color: isDarkMode ? '#FFFFFF' : '#1C1C1E' }
            ]}>
              {title}
            </Text>

            {/* 메시지 */}
            <Text style={[
              customAlertStyles.alertMessage,
              { color: isDarkMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.65)' }
            ]}>
              {message}
            </Text>

            {/* 버튼 그룹 */}
            <View style={customAlertStyles.buttonGroup}>
              {buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      customAlertStyles.alertButton,
                      isCancel && customAlertStyles.cancelButton,
                      {
                        backgroundColor: isDestructive
                          ? 'rgba(255, 149, 0, 0.12)'
                          : isCancel
                          ? 'transparent'
                          : isDarkMode
                          ? 'rgba(99, 99, 102, 0.15)'
                          : 'rgba(0, 122, 255, 0.08)',
                        borderColor: isCancel
                          ? isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
                          : 'transparent',
                      }
                    ]}
                    onPress={() => {
                      button.onPress?.();
                      onDismiss();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      customAlertStyles.alertButtonText,
                      {
                        color: isDestructive
                          ? '#FF9500'
                          : isCancel
                          ? isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'
                          : isDarkMode
                          ? '#FFFFFF'
                          : '#007AFF',
                        fontWeight: isCancel ? '500' : '600',
                      }
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const customAlertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 320,
  },
  alertBox: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    letterSpacing: -0.2,
  },
  buttonGroup: {
    gap: 10,
  },
  alertButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  alertButtonText: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
});

const ChallengeOptionsModal: React.FC<ChallengeOptionsModalProps> = ({
  visible,
  onClose,
  challenge,
  currentUserId,
  isDarkMode,
  onEdit,
  onEditPeriod,
  onDelete,
  onReport,
  onShare,
}) => {
  const isCreator = challenge?.creator?.user_id === currentUserId;

  // 커스텀 알럿 상태 관리
  const [shareAlertVisible, setShareAlertVisible] = useState(false);
  const [reportAlertVisible, setReportAlertVisible] = useState(false);

  const handleEdit = () => {
    onClose();
    setTimeout(() => onEdit(), 300);
  };

  const handleEditPeriod = () => {
    onClose();
    setTimeout(() => onEditPeriod(), 300);
  };

  const handleDelete = () => {
    onClose();
    setTimeout(() => onDelete(), 300);
  };

  const handleShare = () => {
    setShareAlertVisible(true);
  };

  const handleReport = () => {
    setReportAlertVisible(true);
  };

  return (
    <>
      <Modal
        visible={visible && !shareAlertVisible && !reportAlertVisible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity
            style={styles.bottomSheetBackground}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[
            styles.bottomSheetContainer,
            { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }
          ]}>
            {/* 핸들 바 */}
            <View style={[
              styles.bottomSheetHandle,
              { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)' }
            ]} />

          {/* 옵션 목록 */}
          <View style={styles.bottomSheetContent}>
            {/* 창작자 옵션 */}
            {isCreator && (
              <>
                <TouchableOpacity
                  style={styles.bottomSheetOption}
                  onPress={handleEdit}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={22}
                    color={isDarkMode ? '#FFFFFF' : '#262626'}
                  />
                  <Text style={[
                    styles.bottomSheetOptionText,
                    { color: isDarkMode ? '#FFFFFF' : '#262626' },
                    !isDarkMode && {
                      textShadowColor: 'rgba(0, 0, 0, 0.1)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }
                  ]}>제목과 설명 수정</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bottomSheetOption}
                  onPress={handleEditPeriod}
                >
                  <MaterialCommunityIcons
                    name="calendar"
                    size={22}
                    color={isDarkMode ? '#FFFFFF' : '#262626'}
                  />
                  <Text style={[
                    styles.bottomSheetOptionText,
                    { color: isDarkMode ? '#FFFFFF' : '#262626' },
                    !isDarkMode && {
                      textShadowColor: 'rgba(0, 0, 0, 0.1)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }
                  ]}>기간 수정</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bottomSheetOption}
                  onPress={handleDelete}
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={22}
                    color="#FF9500"
                  />
                  <Text style={[
                    styles.bottomSheetOptionText,
                    { color: '#FF9500' }
                  ]}>삭제하기</Text>
                </TouchableOpacity>
              </>
            )}

            {/* 일반 사용자 옵션 (다른 사용자의 글) */}
            {!isCreator && (
              <>
                <TouchableOpacity
                  style={styles.bottomSheetOption}
                  onPress={handleShare}
                >
                  <MaterialCommunityIcons
                    name="share"
                    size={22}
                    color={isDarkMode ? '#FFFFFF' : '#262626'}
                  />
                  <Text style={[
                    styles.bottomSheetOptionText,
                    { color: isDarkMode ? '#FFFFFF' : '#262626' },
                    !isDarkMode && {
                      textShadowColor: 'rgba(0, 0, 0, 0.1)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }
                  ]}>공유하기</Text>
                </TouchableOpacity>

                {/* 신고하기는 아직 신고하지 않았을 때만 표시 */}
                {!challenge?.is_reported && (
                  <TouchableOpacity
                    style={styles.bottomSheetOption}
                    onPress={handleReport}
                  >
                    <MaterialCommunityIcons
                      name="flag"
                      size={22}
                      color="#FF9500"
                    />
                    <Text style={[
                      styles.bottomSheetOptionText,
                      { color: '#FF9500' }
                    ]}>신고하기</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* 공통 옵션 */}
            <TouchableOpacity
              style={[
                styles.bottomSheetOption,
                styles.cancelOption,
                { borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
              ]}
              onPress={onClose}
            >
              <Text style={[
                styles.cancelText,
                { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)' }
              ]}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </Modal>

      {/* 공유하기 커스텀 알럿 */}
      <CustomAlert
        visible={shareAlertVisible}
        title="공유하기"
        message="이 챌린지를 공유하시겠습니까?"
        isDarkMode={isDarkMode}
        buttons={[
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '공유',
            style: 'default',
            onPress: onShare,
          },
        ]}
        onDismiss={() => {
          setShareAlertVisible(false);
          onClose();
        }}
      />

      {/* 신고하기 커스텀 알럿 */}
      <CustomAlert
        visible={reportAlertVisible}
        title="신고하기"
        message="신고 사유를 선택해주세요"
        isDarkMode={isDarkMode}
        buttons={[
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '부적절한 내용',
            style: 'destructive',
            onPress: () => onReport('inappropriate'),
          },
          {
            text: '스팸/홍보',
            style: 'destructive',
            onPress: () => onReport('spam'),
          },
          {
            text: '기타',
            style: 'destructive',
            onPress: () => onReport('other'),
          },
        ]}
        onDismiss={() => {
          setReportAlertVisible(false);
          onClose();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // 하단 모달 스타일
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetBackground: {
    flex: 1,
  },
  bottomSheetContainer: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: getHeight() * 0.6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 200,
  },
  bottomSheetHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 20,  // 12→20
  },
  bottomSheetOptionText: {
    ...TYPOGRAPHY.body1,
    fontWeight: '700',
    marginLeft: SPACING.md,
    flex: 1,
    letterSpacing: -0.4,
  },
  cancelOption: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ChallengeOptionsModal;