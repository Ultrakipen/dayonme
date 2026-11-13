import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { normalizeImageUrl } from '../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT_SIZES } from '../constants';
import { API_CONFIG } from '../config/api';

interface SettingItem {
  title: string;
  icon: string;
  action: () => void;
  showArrow?: boolean;
  destructive?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

interface AccountSettingsScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
    setOptions: (options: any) => void;
  };
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const { theme, isDark } = useModernTheme();
  const [imageLoadError, setImageLoadError] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [actionType, setActionType] = useState<'deactivate' | 'delete' | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }>;
    type?: 'info' | 'warning' | 'error' | 'success';
  }>({ visible: false, title: '', message: '', buttons: [] });

  const colors = useMemo(() => ({
    background: theme.colors.background,
    cardBackground: isDark ? theme.colors.surface : '#FFFFFF',
    settingItemBg: isDark ? theme.colors.surface : '#F8F9FA',
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    border: theme.colors.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
    iconBg: (color: string) => isDark ? `${color}26` : `${color}1A`, // 15% 투명도
  }), [theme, isDark]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  const showCustomAlert = (
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }>,
    type?: 'info' | 'warning' | 'error' | 'success'
  ) => {
    setConfirmModal({ visible: true, title, message, buttons, type });
  };

  const handlePasswordChange = () => {
    navigation.navigate('ChangePassword');
  };

  const handleExportData = async () => {
    try {
      showCustomAlert(
        '데이터 다운로드',
        '모든 데이터를 ZIP 파일로 내보냅니다.\n(이미지 포함, 이메일로 전송)\n\n진행하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '내보내기',
            onPress: async () => {
              try {
                // API_CONFIG에서 BASE_URL 사용 (환경별 자동 분기)
                const API_URL = API_CONFIG.BASE_URL.replace('/api', '');
                const token = await AsyncStorage.getItem('authToken');
                if (__DEV__) {
                  console.log('🔐 Token:', token ? 'exists' : 'null');
                  console.log('🌐 API URL:', API_URL);
                }

                // 내보내기 요청
                const response = await fetch(`${API_URL}/api/users/export-data`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });

                if (__DEV__) console.log('📡 Response status:', response.status);
                if (!response.ok) {
                  const errorData = await response.text();
                  if (__DEV__) console.error('❌ Error response:', errorData);
                  throw new Error(`데이터 내보내기 요청 실패: ${response.status}`);
                }

                const data = await response.json();

                showCustomAlert(
                  '내보내기 시작',
                  `데이터 내보내기를 시작했습니다.\n\n예상 시간: ${data.data.estimated_time}\n완료되면 ${data.data.email}로 다운로드 링크가 전송됩니다.`,
                  [
                    {
                      text: '진행 상태 확인',
                      onPress: () => {
                        showCustomAlert('안내', '이메일을 확인해주세요.', [{ text: '확인' }], 'info');
                      }
                    },
                    { text: '확인' }
                  ],
                  'success'
                );

              } catch (error) {
                console.error('데이터 내보내기 오류:', error);
                showCustomAlert(
                  '내보내기 실패',
                  '데이터 내보내기 요청 중 오류가 발생했습니다.',
                  [{ text: '확인' }],
                  'error'
                );
              }
            }
          }
        ],
        'info'
      );
    } catch (error) {
      console.error('내보내기 준비 오류:', error);
      showCustomAlert('오류', '내보내기를 준비하는 중 오류가 발생했습니다.', [{ text: '확인' }], 'error');
    }
  };

  const handleDeactivateAccount = () => {
    showCustomAlert(
      '계정 비활성화',
      '계정을 비활성화하면 로그인할 수 없습니다.\n정말로 계정을 비활성화하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '비활성화',
          style: 'destructive',
          onPress: () => {
            setActionType('deactivate');
            setPasswordModalVisible(true);
          }
        }
      ],
      'warning'
    );
  };

  const handleDeleteAccount = () => {
    showCustomAlert(
      '계정 삭제',
      '계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.\n정말로 계정을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setActionType('delete');
            setPasswordModalVisible(true);
          }
        }
      ],
      'error'
    );
  };

  const handleWithdrawal = async () => {
    if (!password.trim()) {
      showCustomAlert('알림', '비밀번호를 입력해주세요.', [{ text: '확인' }], 'warning');
      return;
    }

    setLoading(true);
    try {
      const API_URL = API_CONFIG.BASE_URL.replace('/api', '');
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/users/withdrawal`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '요청 실패');
      }

      setPasswordModalVisible(false);
      setPassword('');

      const actionName = actionType === 'deactivate' ? '비활성화' : '삭제';
      showCustomAlert(
        `계정 ${actionName} 완료`,
        data.message || `계정이 ${actionName}되었습니다.`,
        [
          {
            text: '확인',
            onPress: async () => {
              await logout();
              navigation.navigate('Login' as never);
            }
          }
        ],
        'success'
      );
    } catch (error: any) {
      console.error('계정 처리 오류:', error);
      showCustomAlert(
        '오류',
        error.message || '계정 처리 중 오류가 발생했습니다.',
        [{ text: '확인' }],
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const sections: SettingSection[] = [
    {
      title: '개인 정보',
      items: [
        {
          title: '프로필 편집',
          icon: 'person-outline',
          action: () => {
            try {
              navigation.navigate('ProfileEdit' as never);
            } catch (error) {
              console.error('프로필 편집 네비게이션 오류:', error);
            }
          },
          showArrow: true,
        },
        {
          title: '비밀번호 변경',
          icon: 'lock-closed-outline',
          action: handlePasswordChange,
          showArrow: true,
        },
      ],
    },
    {
      title: '데이터 및 계정',
      items: [
        {
          title: '데이터 다운로드',
          icon: 'download-outline',
          action: handleExportData,
          showArrow: true,
        },
        {
          title: '계정 비활성화',
          icon: 'pause-outline',
          action: handleDeactivateAccount,
          showArrow: true,
        },
        {
          title: '계정 삭제',
          icon: 'trash-outline',
          action: handleDeleteAccount,
          destructive: true,
          showArrow: true,
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>계정 설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
        {/* 사용자 정보 카드 */}
        <View style={[
          styles.userCard,
          {
            backgroundColor: theme.colors.surface,
            shadowColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          }
        ]}>
          {/* 🖼️ 이미지 최적화: FastImage 사용 */}
          <View style={styles.profileImageContainer}>
            {user?.profile_image_url && !imageLoadError ? (
              <FastImage
                source={{
                  uri: normalizeImageUrl(user.profile_image_url),
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.profileImage}
                resizeMode={FastImage.resizeMode.cover}
                onError={() => setImageLoadError(true)}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { borderColor: colors.primary }]}>
                <Text style={[styles.profileImagePlaceholderText, { color: colors.text }]}>
                  {(user?.nickname || user?.username || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* 사용자 정보 */}
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text.primary }]}>{user?.nickname || user?.username}</Text>
            <Text style={[styles.userEmail, { color: theme.colors.text.secondary }]}>{user?.email}</Text>
          </View>
        </View>

        {/* 설정 섹션들 */}
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{section.title}</Text>
            <View style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.surface,
                shadowColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              }
            ]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    { borderBottomColor: theme.colors.border },
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={() => {
                    if (item.action) {
                      item.action();
                    }
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={24}
                    color={item.destructive ? theme.colors.error : (isDark ? theme.colors.text.secondary : '#666666')}
                  />
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: isDark ? theme.colors.text.primary : '#1A1A1A' },
                      item.destructive && [styles.destructiveText, { color: theme.colors.error }]
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.showArrow && (
                    <Icon
                      name="chevron-forward"
                      size={18}
                      color={isDark ? theme.colors.text.tertiary : '#999999'}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.text.tertiary }]}>앱 버전 1.0.0</Text>
        </View>
      </ScrollView>

      {/* 비밀번호 확인 모달 */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPasswordModalVisible(false);
          setPassword('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              비밀번호 확인
            </Text>
            <Text style={[styles.modalMessage, { color: isDark ? '#E5E5E5' : '#666666' }]}>
              계속하려면 비밀번호를 입력해주세요
            </Text>

            <TextInput
              style={[
                styles.passwordInput,
                {
                  backgroundColor: isDark ? '#0D0D0D' : '#F8F9FA',
                  color: isDark ? '#FFFFFF' : '#1A1A1A',
                  borderColor: isDark ? '#2A2A2A' : '#E5E5E5',
                }
              ]}
              placeholder="비밀번호"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoFocus
              editable={!loading}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }]}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPassword('');
                }}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: '#FF3B30' }]}
                onPress={handleWithdrawal}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>확인</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 커스텀 확인 모달 */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal({ ...confirmModal, visible: false })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.alertContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
              {confirmModal.type && (
                <View style={[styles.alertIcon, {
                  backgroundColor:
                    confirmModal.type === 'error' ? 'rgba(255, 59, 48, 0.1)' :
                    confirmModal.type === 'warning' ? 'rgba(255, 149, 0, 0.1)' :
                    confirmModal.type === 'success' ? 'rgba(52, 199, 89, 0.1)' :
                    'rgba(0, 122, 255, 0.1)'
                }]}>
                  <Icon
                    name={
                      confirmModal.type === 'error' ? 'close-circle' :
                      confirmModal.type === 'warning' ? 'warning' :
                      confirmModal.type === 'success' ? 'checkmark-circle' :
                      'information-circle'
                    }
                    size={32}
                    color={
                      confirmModal.type === 'error' ? '#FF3B30' :
                      confirmModal.type === 'warning' ? '#FF9500' :
                      confirmModal.type === 'success' ? '#34C759' :
                      '#007AFF'
                    }
                  />
                </View>
              )}
              <Text style={[styles.alertTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                {confirmModal.title}
              </Text>
              <Text style={[styles.alertMessage, { color: isDark ? '#E5E5E5' : '#666666' }]}>
                {confirmModal.message}
              </Text>
              <View style={styles.alertButtons}>
                {confirmModal.buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.alertButton,
                      confirmModal.buttons.length === 1 && { flex: 1 },
                      { backgroundColor:
                        button.style === 'destructive' ? '#FF3B30' :
                        button.style === 'cancel' ? (isDark ? '#2A2A2A' : '#F0F0F0') :
                        (isDark ? '#667eea' : '#667eea')
                      }
                    ]}
                    onPress={() => {
                      setConfirmModal({ ...confirmModal, visible: false });
                      button.onPress?.();
                    }}
                  >
                    <Text style={[
                      styles.alertButtonText,
                      { color: button.style === 'cancel' ? (isDark ? '#FFFFFF' : '#1A1A1A') : '#FFFFFF' }
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 20,
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  profileImagePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  profileImagePlaceholderText: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: FONT_SIZES.h1,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  userEmail: {
    fontSize: FONT_SIZES.body,
    fontWeight: '500',
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '700',
    marginLeft: 20,
    marginBottom: 12,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  sectionCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 0.5,
    minHeight: 60,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingTitle: {
    flex: 1,
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '600',
    marginLeft: 14,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  destructiveText: {
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 60,
  },
  footerText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  modalMessage: {
    fontSize: FONT_SIZES.body,
    marginBottom: 20,
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  passwordInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: FONT_SIZES.bodyLarge,
    borderWidth: 1,
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {},
  confirmButton: {},
  modalButtonText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  alertContainer: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  alertIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: FONT_SIZES.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  alertMessage: {
    fontSize: FONT_SIZES.body,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  alertButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertButtonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

export default AccountSettingsScreen;
