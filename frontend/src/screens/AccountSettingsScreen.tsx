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
import { useAuthToken } from '../hooks/useAuthToken';
import { fetchWithRetry } from '../utils/fetchWithRetry';

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
  const { token } = useAuthToken();
  const [imageLoadError, setImageLoadError] = useState(false);
  const API_URL = useMemo(() => API_CONFIG.BASE_URL.replace('/api', ''), []);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState(''); // 소셜 로그인 사용자용 확인 문구
  const [actionType, setActionType] = useState<'deactivate' | 'delete' | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteCompleteModal, setDeleteCompleteModal] = useState<{
    visible: boolean;
    scheduledDate: string;
    onConfirm: () => void;
  }>({ visible: false, scheduledDate: '', onConfirm: () => {} });
  const [cooldownModal, setCooldownModal] = useState<{
    visible: boolean;
    remainingDays: number;
  }>({ visible: false, remainingDays: 0 });

  // 소셜 로그인 사용자 확인
  const isSocialUser = useMemo(() => {
    const username = user?.username || '';
    return username.startsWith('kakao_') || username.startsWith('naver_') || username.startsWith('google_');
  }, [user?.username]);
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

  // 디버그: 비밀번호 모달 상태 추적
  useEffect(() => {
    if (__DEV__) console.log('🔐 passwordModalVisible 변경:', passwordModalVisible);
  }, [passwordModalVisible]);

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
                if (!token) {
                  showCustomAlert('오류', '인증 토큰을 찾을 수 없습니다.', [{ text: '확인' }], 'error');
                  return;
                }

                const response = await fetchWithRetry(() =>
                  fetch(`${API_URL}/api/users/export-data`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  })
                );

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
                if (__DEV__) console.error('데이터 내보내기 오류:', error);
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
      if (__DEV__) console.error('내보내기 준비 오류:', error);
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
    if (__DEV__) console.log('🗑️ handleDeleteAccount 호출됨');
    showCustomAlert(
      '계정 삭제',
      '계정 삭제 요청 시 30일간 유예기간이 적용됩니다.\n\n• 30일 이내 로그인하면 계정을 복구할 수 있습니다\n• 30일 후 모든 데이터가 영구 삭제됩니다\n\n정말로 계정을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제 요청',
          style: 'destructive',
          onPress: () => {
            if (__DEV__) console.log('🗑️ 삭제 버튼 클릭 - 비밀번호 모달 열기');
            setActionType('delete');
            setPasswordModalVisible(true);
          }
        }
      ],
      'warning'
    );
  };

  const handleWithdrawal = async () => {
    if (isSocialUser) {
      if (confirmText.trim() !== '계정삭제') {
        showCustomAlert('알림', '"계정삭제"를 정확히 입력해주세요.', [{ text: '확인' }], 'warning');
        return;
      }
    } else {
      if (!password.trim()) {
        showCustomAlert('알림', '비밀번호를 입력해주세요.', [{ text: '확인' }], 'warning');
        return;
      }
    }

    if (!token) {
      showCustomAlert('오류', '인증 토큰을 찾을 수 없습니다.', [{ text: '확인' }], 'error');
      return;
    }

    setLoading(true);
    try {
      const bodyData = isSocialUser
        ? { confirmText: confirmText.trim() }
        : { password: password.trim() };

      const response = await fetchWithRetry(() =>
        fetch(`${API_URL}/api/users/withdrawal`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        })
      );

      const data = await response.json();
      if (__DEV__) console.log('🗑️ withdrawal API 응답:', response.status, data);

      if (!response.ok) {
        // 재삭제 쿨다운 체크
        if (data.status === 'cooldown') {
          const remainingDays = data.data?.remaining_days || 15;
          setPasswordModalVisible(false);
          setCooldownModal({ visible: true, remainingDays });
          return;
        }
        throw new Error(data.message || '요청 실패');
      }

      setPasswordModalVisible(false);
      setPassword('');
      setConfirmText('');

      if (actionType === 'delete') {
        // 30일 유예기간 안내 - 개선된 모달
        const scheduledDate = data.data?.scheduled_deletion_date
          ? new Date(data.data.scheduled_deletion_date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : '30일 후';
        setDeleteCompleteModal({
          visible: true,
          scheduledDate,
          onConfirm: async () => {
            setDeleteCompleteModal(prev => ({ ...prev, visible: false }));
            await logout();
            navigation.navigate('Login' as never);
          }
        });
      } else {
        showCustomAlert(
          '계정 비활성화 완료',
          data.message || '계정이 비활성화되었습니다.',
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
      }
    } catch (error: unknown) {
      if (__DEV__) console.error('🗑️ 계정 처리 오류:', error);
      showCustomAlert(
        '오류',
        (error as Error).message || '계정 처리 중 오류가 발생했습니다.',
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
              if (__DEV__) console.error('프로필 편집 네비게이션 오류:', error);
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
                key={`settings-profile-${normalizeImageUrl(user.profile_image_url)}`}
                source={{
                  uri: normalizeImageUrl(user.profile_image_url),
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.web,
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

        {/* TODO: 사업자 정보 - 차후 공개 예정
        <View style={[styles.businessInfo, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.businessTitle, { color: theme.colors.text.primary }]}>사업자 정보</Text>
          <View style={styles.businessContent}>
            <Text style={[styles.businessText, { color: theme.colors.text.secondary }]}>상호명: 케이엔디커뮤니티</Text>
            <Text style={[styles.businessText, { color: theme.colors.text.secondary }]}>대표자: 김**</Text>
            <Text style={[styles.businessText, { color: theme.colors.text.secondary }]}>사업자등록번호: 202-19-10353</Text>
            <Text style={[styles.businessText, { color: theme.colors.text.secondary }]}>주소: 경남 김해시 76-2*</Text>
            <Text style={[styles.businessText, { color: theme.colors.text.secondary }]}>고객센터: 010-4667-9824</Text>
          </View>
        </View>
        */}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.text.tertiary }]}>앱 버전 1.0.0</Text>
        </View>
      </ScrollView>

      {/* 계정 삭제 확인 모달 (소셜/일반 사용자 분기) */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPasswordModalVisible(false);
          setPassword('');
          setConfirmText('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              {isSocialUser ? '계정 삭제 확인' : '비밀번호 확인'}
            </Text>
            <Text style={[styles.modalMessage, { color: isDark ? '#E5E5E5' : '#666666' }]}>
              {isSocialUser
                ? '계정을 삭제하려면 아래에 "계정삭제"를 입력해주세요'
                : '계속하려면 비밀번호를 입력해주세요'
              }
            </Text>

            {isSocialUser ? (
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    backgroundColor: isDark ? '#0D0D0D' : '#F8F9FA',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                    borderColor: isDark ? '#2A2A2A' : '#E5E5E5',
                  }
                ]}
                placeholder="계정삭제"
                placeholderTextColor={isDark ? '#666666' : '#999999'}
                value={confirmText}
                onChangeText={setConfirmText}
                autoFocus
                editable={!loading}
                autoCapitalize="none"
              />
            ) : (
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
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }]}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPassword('');
                  setConfirmText('');
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
                      if (__DEV__) console.log('🔘 confirmModal 버튼 클릭:', button.text, 'hasOnPress:', !!button.onPress);
                      setConfirmModal({ ...confirmModal, visible: false });
                      // 모달 닫힌 후 콜백 실행 (타이밍 문제 해결)
                      if (button.onPress) {
                        if (__DEV__) console.log('🔘 setTimeout으로 콜백 예약');
                        setTimeout(() => {
                          if (__DEV__) console.log('🔘 콜백 실행됨');
                          button.onPress?.();
                        }, 150);
                      }
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

      {/* 계정 삭제 완료 모달 - 개선된 디자인 */}
      <Modal
        visible={deleteCompleteModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteCompleteContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            {/* 체크 아이콘 */}
            <View style={styles.deleteCompleteIconWrapper}>
              <View style={[styles.deleteCompleteIconBg, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)' }]}>
                <Icon name="checkmark-circle" size={48} color="#34C759" />
              </View>
            </View>

            {/* 제목 */}
            <Text style={[styles.deleteCompleteTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              계정 삭제 요청 완료
            </Text>

            {/* 정보 카드 */}
            <View style={[styles.deleteInfoCard, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA' }]}>
              {/* 삭제 예정일 */}
              <View style={styles.deleteInfoRow}>
                <View style={styles.deleteInfoIconWrap}>
                  <Icon name="calendar-outline" size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                </View>
                <View style={styles.deleteInfoContent}>
                  <Text style={[styles.deleteInfoLabel, { color: isDark ? '#999999' : '#888888' }]}>완전 삭제 예정일</Text>
                  <Text style={[styles.deleteInfoValue, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                    {deleteCompleteModal.scheduledDate}
                  </Text>
                </View>
              </View>

              <View style={[styles.deleteInfoDivider, { backgroundColor: isDark ? '#3A3A3A' : '#E5E5E5' }]} />

              {/* 복구 안내 */}
              <View style={styles.deleteInfoRow}>
                <View style={styles.deleteInfoIconWrap}>
                  <Icon name="refresh-outline" size={20} color="#34C759" />
                </View>
                <View style={styles.deleteInfoContent}>
                  <Text style={[styles.deleteInfoLabel, { color: isDark ? '#999999' : '#888888' }]}>복구 가능 기간</Text>
                  <Text style={[styles.deleteInfoValue, { color: '#34C759' }]}>30일 이내</Text>
                </View>
              </View>
            </View>

            {/* 안내 메시지 */}
            <View style={[styles.deleteNoticeBox, { backgroundColor: isDark ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.08)' }]}>
              <Icon name="information-circle" size={18} color="#FF9500" style={styles.deleteNoticeIcon} />
              <Text style={[styles.deleteNoticeText, { color: isDark ? '#FFB84D' : '#CC7A00' }]}>
                30일 이내에 다시 로그인하면 계정을 복구할 수 있습니다
              </Text>
            </View>

            {/* 확인 버튼 */}
            <TouchableOpacity
              style={styles.deleteCompleteButton}
              onPress={deleteCompleteModal.onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteCompleteButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 재삭제 불가 모달 - 쿨다운 안내 */}
      <Modal
        visible={cooldownModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCooldownModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={cooldownStyles.modalOverlay}>
          <View style={[cooldownStyles.container, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            {/* 경고 아이콘 */}
            <View style={cooldownStyles.iconWrapper}>
              <View style={[cooldownStyles.iconBg, { backgroundColor: isDark ? 'rgba(255, 69, 58, 0.15)' : 'rgba(255, 69, 58, 0.1)' }]}>
                <Icon name="time-outline" size={48} color="#FF453A" />
              </View>
            </View>

            {/* 제목 */}
            <Text style={[cooldownStyles.title, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              재삭제 불가
            </Text>

            {/* 설명 */}
            <Text style={[cooldownStyles.description, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              계정 복구 후 일정 기간이 지나야{'\n'}재삭제가 가능합니다
            </Text>

            {/* 남은 기간 카드 */}
            <View style={[cooldownStyles.periodCard, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA' }]}>
              <View style={cooldownStyles.periodRow}>
                <Icon name="hourglass-outline" size={24} color="#FF9500" />
                <View style={cooldownStyles.periodContent}>
                  <Text style={[cooldownStyles.periodLabel, { color: isDark ? '#999999' : '#888888' }]}>
                    남은 대기 기간
                  </Text>
                  <Text style={[cooldownStyles.periodValue, { color: '#FF9500' }]}>
                    {cooldownModal.remainingDays}일
                  </Text>
                </View>
              </View>

              <View style={[cooldownStyles.divider, { backgroundColor: isDark ? '#3A3A3A' : '#E5E5E5' }]} />

              <View style={cooldownStyles.periodRow}>
                <Icon name="shield-checkmark-outline" size={24} color={isDark ? '#60a5fa' : '#3b82f6'} />
                <View style={cooldownStyles.periodContent}>
                  <Text style={[cooldownStyles.periodLabel, { color: isDark ? '#999999' : '#888888' }]}>
                    쿨다운 기간
                  </Text>
                  <Text style={[cooldownStyles.periodValue, { color: isDark ? '#60a5fa' : '#3b82f6' }]}>
                    15일
                  </Text>
                </View>
              </View>
            </View>

            {/* 안내 메시지 */}
            <View style={[cooldownStyles.noticeBox, { backgroundColor: isDark ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.08)' }]}>
              <Icon name="information-circle" size={18} color="#FF9500" />
              <Text style={[cooldownStyles.noticeText, { color: isDark ? '#FFB84D' : '#CC7A00' }]}>
                계정 복구 후 15일이 지난 후에{'\n'}다시 삭제 요청이 가능합니다
              </Text>
            </View>

            {/* 확인 버튼 */}
            <TouchableOpacity
              style={cooldownStyles.button}
              onPress={() => setCooldownModal(prev => ({ ...prev, visible: false }))}
              activeOpacity={0.8}
            >
              <Text style={cooldownStyles.buttonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const cooldownStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrapper: {
    marginBottom: 20,
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  periodCard: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  periodContent: {
    marginLeft: 14,
    flex: 1,
  },
  periodLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  periodValue: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 10,
    flex: 1,
  },
  button: {
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Pretendard-SemiBold',
  },
});

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
    padding: 10,
    marginLeft: -8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-Bold',
    lineHeight: 44,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: FONT_SIZES.h1,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 8,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  userEmail: {
    fontSize: FONT_SIZES.body,
    fontFamily: 'Pretendard-Medium',
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-Bold',
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
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    minHeight: 56,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingTitle: {
    flex: 1,
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-SemiBold',
    marginLeft: 14,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  destructiveText: {
    fontFamily: 'Pretendard-Medium',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 60,
  },
  footerText: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Medium',
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  businessInfo: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  businessTitle: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  businessContent: {
    gap: 6,
  },
  businessText: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: 'Pretendard-Regular',
    letterSpacing: -0.1,
    lineHeight: 18,
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
    fontFamily: 'Pretendard-Bold',
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
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: FONT_SIZES.bodyLarge,
    borderWidth: 1,
    marginBottom: 20,
    lineHeight: 22,
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  alertMessage: {
    fontSize: FONT_SIZES.body,
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.2,
  },
  // 계정 삭제 완료 모달 스타일
  deleteCompleteContainer: {
    width: '88%',
    maxWidth: 360,
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  deleteCompleteIconWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteCompleteIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteCompleteTitle: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.4,
  },
  deleteInfoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  deleteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteInfoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteInfoContent: {
    flex: 1,
  },
  deleteInfoLabel: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  deleteInfoValue: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.3,
  },
  deleteInfoDivider: {
    height: 1,
    marginVertical: 8,
  },
  deleteNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  deleteNoticeIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  deleteNoticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  deleteCompleteButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteCompleteButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default AccountSettingsScreen;
