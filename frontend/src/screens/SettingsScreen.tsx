// src/screens/SettingsScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ScrollView, Alert, Linking, StyleSheet, useWindowDimensions, Platform, Vibration, TextInput, ActivityIndicator, Modal, View, TouchableOpacity } from 'react-native';
import { Text, List, Switch, Button, Dialog, Portal, RadioButton, IconButton, Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { Box } from '../components/ui';
import { FONT_SIZES, APP_VERSION } from '../constants';
import userService from '../services/api/userService';
import BottomSheetAlert from '../components/common/BottomSheetAlert';
import { API_CONFIG } from '../config/api';
import { fetchWithRetry } from '../utils/fetchWithRetry';
import EncryptedStorage from 'react-native-encrypted-storage';

const BASE_WIDTH = 360;

interface NotificationSettings {
  like_notifications: boolean;
  comment_notifications: boolean;
  challenge_notifications: boolean;
  encouragement_notifications: boolean;
  push_enabled: boolean;
}

interface PrivacySettings {
  show_profile: boolean;
  show_posts: boolean;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
}

interface SettingsScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
    setOptions: (options: any) => void;
  };
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme, isDark, preference, setThemePreference } = useModernTheme();
  const { width } = useWindowDimensions();
  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.9), 1.3);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const API_URL = useMemo(() => API_CONFIG.BASE_URL.replace('/api', ''), []);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    like_notifications: true,
    comment_notifications: true,
    challenge_notifications: true,
    encouragement_notifications: true,
    push_enabled: true
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    show_profile: true,
    show_posts: true,
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'system',
  });

  const [loading, setLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deleteCompleteModal, setDeleteCompleteModal] = useState<{
    visible: boolean;
    scheduledDate: string;
    onConfirm: () => void;
  }>({ visible: false, scheduledDate: '', onConfirm: () => {} });
  const [cooldownModal, setCooldownModal] = useState<{
    visible: boolean;
    remainingDays: number;
  }>({ visible: false, remainingDays: 0 });
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }>;
    type?: 'info' | 'warning' | 'error' | 'success';
  }>({ visible: false, title: '', message: '', buttons: [] });

  // 소셜 로그인 사용자 확인
  const isSocialUser = useMemo(() => {
    const username = user?.username || '';
    return username.startsWith('kakao_') || username.startsWith('naver_') || username.startsWith('google_');
  }, [user?.username]);

  useEffect(() => {
    navigation.setOptions({
      title: '설정',
      headerLeft: () => (
        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
        />
      ),
    });
    loadSettings();
  }, [navigation]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // 알림 설정 전용 API 호출
      const notificationResponse = await userService.getNotificationSettings();
      if (notificationResponse.status === 'success' && notificationResponse.data) {
        const settings = notificationResponse.data;
        setNotificationSettings(prev => ({
          ...prev,
          like_notifications: settings.like_notifications ?? true,
          comment_notifications: settings.comment_notifications ?? true,
          challenge_notifications: settings.challenge_notifications ?? true,
          encouragement_notifications: settings.encouragement_notifications ?? true,
          push_enabled: settings.push_enabled ?? true,
        }));
      }

      // 프로필에서 프라이버시 설정 로드
      const profileResponse = await userService.getProfile();
      if (profileResponse.status === 'success' && profileResponse.data) {
        const { privacy_settings } = profileResponse.data;
        if (privacy_settings) {
          setPrivacySettings({
            show_profile: privacy_settings.show_profile ?? true,
            show_posts: privacy_settings.show_posts ?? true,
          });
        }
      }
    } catch (error) {
      if (__DEV__) console.error('설정 로드 오류:', error);
      Alert.alert('오류', '설정을 불러올 수 없습니다. 다시 시도해주세요.', [
        { text: '재시도', onPress: loadSettings },
        { text: '취소', style: 'cancel' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = useCallback(async (type: 'notification' | 'privacy' | 'app', settings: any) => {
    try {
      if (type === 'notification') {
        // 알림 설정 저장
        await userService.updateNotificationSettings({
          like_notifications: settings.like_notifications,
          comment_notifications: settings.comment_notifications,
          challenge_notifications: settings.challenge_notifications,
          encouragement_notifications: settings.encouragement_notifications,
          push_enabled: settings.push_enabled,
        });
      } else if (type === 'privacy') {
        // 프라이버시 설정 저장
        await userService.updatePrivacySettings({
          show_profile: settings.show_profile,
          show_posts: settings.show_posts,
        });
      }
      // app 타입은 테마 설정으로 이미 setThemePreference에서 처리됨

      setSnackbarMessage('설정이 저장되었습니다.');
      setSnackbarVisible(true);
    } catch (error) {
      if (__DEV__) console.error('설정 저장 오류:', error);
      Alert.alert('오류', '설정 저장 중 오류가 발생했습니다.');
    }
  }, []);

  const debouncedSave = useCallback((type: 'notification' | 'privacy' | 'app', settings: any) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveSettings(type, settings);
    }, 800);
  }, [saveSettings]);

  const haptic = useCallback(() => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
  }, []);

  const updateNotificationSetting = useCallback((key: keyof NotificationSettings, value: boolean) => {
    haptic();
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    debouncedSave('notification', newSettings);
  }, [notificationSettings, haptic, debouncedSave]);

  const updatePrivacySetting = useCallback((key: keyof PrivacySettings, value: boolean) => {
    haptic();
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    debouncedSave('privacy', newSettings);
  }, [privacySettings, haptic, debouncedSave]);

  const updateAppSetting = useCallback((key: keyof AppSettings, value: any) => {
    haptic();
    const newSettings = { ...appSettings, [key]: value };
    setAppSettings(newSettings);
    debouncedSave('app', newSettings);
  }, [appSettings, haptic, debouncedSave]);

  const showCustomAlert = (
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }>,
    type?: 'info' | 'warning' | 'error' | 'success'
  ) => {
    setCustomAlert({ visible: true, title, message, buttons, type });
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    logout();
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
                const token = await EncryptedStorage.getItem('authToken');

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
                  [{ text: '확인' }],
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

  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(false);
    setDeletePassword('');
    setDeleteConfirmText('');
    setShowPasswordDialog(true);
  };

  const handleWithdrawal = async () => {
    // 소셜 로그인 사용자는 확인 문구 검증, 일반 사용자는 비밀번호 검증
    if (isSocialUser) {
      if (deleteConfirmText.trim() !== '계정삭제') {
        Alert.alert('알림', '"계정삭제"를 정확히 입력해주세요.');
        return;
      }
    } else {
      if (!deletePassword.trim()) {
        Alert.alert('알림', '비밀번호를 입력해주세요.');
        return;
      }
    }

    setDeleteLoading(true);
    try {
      const inputData = isSocialUser ? deleteConfirmText.trim() : deletePassword.trim();

      if (__DEV__) console.log('🗑️ withdrawal API 호출');

      const response = await userService.withdrawal(inputData);
      if (__DEV__) console.log('🗑️ withdrawal API 응답:', response);

      if (response.status !== 'success') {
        // 재삭제 쿨다운 체크
        if (response.status === 'cooldown') {
          const remainingDays = response.data?.remaining_days || 15;
          setShowPasswordDialog(false);
          setCooldownModal({ visible: true, remainingDays });
          return;
        }
        throw new Error(response.message || '계정 삭제 실패');
      }

      setShowPasswordDialog(false);
      setDeletePassword('');
      setDeleteConfirmText('');

      // 30일 유예기간 안내 - 개선된 모달
      const scheduledDate = response.data?.scheduled_deletion_date
        ? new Date(response.data.scheduled_deletion_date).toLocaleDateString('ko-KR', {
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
        }
      });
    } catch (error: any) {
      if (__DEV__) console.error('🗑️ 계정 삭제 오류:', error);
      Alert.alert('오류', error.message || '계정 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('오류', '링크를 열 수 없습니다.');
    });
  };

  const colors = useMemo(() => ({
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  }), [theme, isDark]);

  const styles = useMemo(() => StyleSheet.create({
    sectionContainer: {
      backgroundColor: colors.cardBackground,
      marginBottom: 16 * scale,
      paddingTop: 16 * scale,
    },
    sectionHeader: {
      fontSize: FONT_SIZES.bodySmall * scale,
      fontFamily: 'Pretendard-SemiBold',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      paddingHorizontal: 20 * scale,
      marginBottom: 12 * scale,
    },
    itemTitle: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontFamily: 'Pretendard-Medium',
      letterSpacing: -0.3,
      color: colors.text,
      lineHeight: 22 * scale,
    },
    itemSubtitle: {
      fontSize: FONT_SIZES.body * scale,
      fontFamily: 'Pretendard-Regular',
      letterSpacing: -0.2,
      color: colors.textSecondary,
      marginTop: 2 * scale,
      lineHeight: 20 * scale,
    },
    listItem: {
      paddingVertical: 14 * scale,
      paddingHorizontal: 20 * scale,
      minHeight: 52 * scale,
      backgroundColor: colors.cardBackground,
    },
    dialogTitle: {
      fontSize: FONT_SIZES.h4 * scale,
      fontFamily: 'Pretendard-SemiBold',
      letterSpacing: -0.4,
    },
    dialogText: {
      fontSize: FONT_SIZES.body * scale,
      fontFamily: 'Pretendard-Regular',
      letterSpacing: -0.2,
      lineHeight: 21 * scale,
    },
    radioLabel: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontFamily: 'Pretendard-Regular',
      letterSpacing: -0.3,
    },
    buttonLabel: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontFamily: 'Pretendard-Medium',
      letterSpacing: -0.2,
    },
    snackbarText: {
      fontSize: FONT_SIZES.bodySmall * scale,
      fontFamily: 'Pretendard-Medium',
      color: isDark ? '#000' : '#ffffff',
      letterSpacing: -0.1,
    },
  }), [colors, scale, isDark]);

  return (
    <Box key={`theme-${preference}-${isDark}`} className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box style={{ height: 24 * scale }} />

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>알림 설정</Text>
            <List.Item
              title="전체 알림"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              right={() => (
                <Switch
                  value={notificationSettings.push_enabled}
                  onValueChange={(value: boolean) => updateNotificationSetting('push_enabled', value)}
                  thumbColor={notificationSettings.push_enabled ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="좋아요 알림"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              right={() => (
                <Switch
                  value={notificationSettings.like_notifications}
                  onValueChange={(value: boolean) => updateNotificationSetting('like_notifications', value)}
                  disabled={!notificationSettings.push_enabled}
                  thumbColor={notificationSettings.like_notifications ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="댓글 알림"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              right={() => (
                <Switch
                  value={notificationSettings.comment_notifications}
                  onValueChange={(value: boolean) => updateNotificationSetting('comment_notifications', value)}
                  disabled={!notificationSettings.push_enabled}
                  thumbColor={notificationSettings.comment_notifications ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="챌린지 알림"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              right={() => (
                <Switch
                  value={notificationSettings.challenge_notifications}
                  onValueChange={(value: boolean) => updateNotificationSetting('challenge_notifications', value)}
                  disabled={!notificationSettings.push_enabled}
                  thumbColor={notificationSettings.challenge_notifications ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="격려 메시지 알림"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              right={() => (
                <Switch
                  value={notificationSettings.encouragement_notifications}
                  onValueChange={(value: boolean) => updateNotificationSetting('encouragement_notifications', value)}
                  disabled={!notificationSettings.push_enabled}
                  thumbColor={notificationSettings.encouragement_notifications ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

        </Box>

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>프라이버시</Text>
            <List.Item
              title="프로필 공개"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              right={() => (
                <Switch
                  value={privacySettings.show_profile}
                  onValueChange={(value: boolean) => updatePrivacySetting('show_profile', value)}
                  thumbColor={privacySettings.show_profile ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="게시물 공개"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              right={() => (
                <Switch
                  value={privacySettings.show_posts}
                  onValueChange={(value: boolean) => updatePrivacySetting('show_posts', value)}
                  thumbColor={privacySettings.show_posts ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

        </Box>

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>앱 설정</Text>
            <List.Item
              title="테마"
              description={appSettings.theme === 'light' ? '라이트' : appSettings.theme === 'dark' ? '다크' : '시스템 설정'}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemSubtitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => setShowThemeDialog(true)}
            />

        </Box>

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>계정</Text>
            <List.Item
              title="프로필 편집"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('ProfileEdit')}
            />

            {!isSocialUser && (
              <List.Item
                title="비밀번호 변경"
                titleStyle={styles.itemTitle}
                style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
                onPress={() => navigation.navigate('ChangePassword')}
              />
            )}

            <List.Item
              title="데이터 다운로드"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={handleExportData}
            />

            <Box style={{ height: 8 * scale, backgroundColor: colors.background }} />

            <List.Item
              title="로그아웃"
              titleStyle={[styles.itemTitle, { color: '#FF6B6B' }]}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => setShowLogoutDialog(true)}
            />

            <List.Item
              title="계정 삭제"
              titleStyle={[styles.itemTitle, { color: '#FF6B6B' }]}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => setShowDeleteAccountDialog(true)}
            />
        </Box>

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>지원</Text>
            <List.Item
              title="공지사항"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('Notice')}
            />

            <List.Item
              title="자주 묻는 질문"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('FAQ')}
            />

            <List.Item
              title="문의하기"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('Contact')}
            />

            <List.Item
              title="이용약관"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('TermsOfService')}
            />

            <List.Item
              title="개인정보처리방침"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
        </Box>

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>정보</Text>
            <List.Item
              title="버전"
              description={APP_VERSION}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemSubtitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
            />

            <List.Item
              title="오픈소스 라이선스"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('OpenSourceLicenses')}
            />
        </Box>

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>이메일 활용 안내</Text>
          <Box style={{ paddingHorizontal: 20 * scale, paddingVertical: 16 * scale, backgroundColor: colors.cardBackground }}>
            <Text style={[styles.itemTitle, { marginBottom: 12 * scale }]}>회원님의 이메일은 다음 목적으로 활용됩니다</Text>
            <Box style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 * scale }}>
              <Text style={[styles.itemSubtitle, { marginTop: 0, marginRight: 8 }]}>•</Text>
              <Text style={[styles.itemSubtitle, { marginTop: 0, flex: 1 }]}>계정 복구 및 비밀번호 재설정</Text>
            </Box>
            <Box style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 * scale }}>
              <Text style={[styles.itemSubtitle, { marginTop: 0, marginRight: 8 }]}>•</Text>
              <Text style={[styles.itemSubtitle, { marginTop: 0, flex: 1 }]}>중요 서비스 공지 및 알림 발송</Text>
            </Box>
            <Box style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 * scale }}>
              <Text style={[styles.itemSubtitle, { marginTop: 0, marginRight: 8 }]}>•</Text>
              <Text style={[styles.itemSubtitle, { marginTop: 0, flex: 1 }]}>데이터 내보내기 시 다운로드 링크 전송</Text>
            </Box>
            <Box style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={[styles.itemSubtitle, { marginTop: 0, marginRight: 8 }]}>•</Text>
              <Text style={[styles.itemSubtitle, { marginTop: 0, flex: 1 }]}>회원 식별 및 중복 가입 방지</Text>
            </Box>
          </Box>
        </Box>

        {/* TODO: 사업자 정보 - 차후 공개 예정
        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>사업자 정보</Text>
          <Box style={{ paddingHorizontal: 20 * scale, paddingVertical: 16 * scale, backgroundColor: colors.cardBackground }}>
            <Text style={[styles.itemTitle, { marginBottom: 8 * scale }]}>케이엔디커뮤니티</Text>
            <Text style={[styles.itemSubtitle, { marginTop: 0 }]}>대표: 김봉후</Text>
            <Text style={[styles.itemSubtitle, { marginTop: 4 * scale }]}>사업자등록번호: 202-19-10353</Text>
            <Text style={[styles.itemSubtitle, { marginTop: 4 * scale }]}>주소: 경남 김해시 계동로 76-22, 701-903</Text>
            <Text style={[styles.itemSubtitle, { marginTop: 4 * scale }]}>고객센터: 010-4667-9824</Text>
          </Box>
        </Box>
        */}

        <Box style={{ height: 40 * scale }} />
      </ScrollView>

      <Portal>
        <Dialog visible={showThemeDialog} onDismiss={() => setShowThemeDialog(false)} style={{ backgroundColor: colors.cardBackground }}>
          <Dialog.Title style={[styles.dialogTitle, { color: colors.text }]}>테마 선택</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value: string) => {
                setThemePreference(value as 'light' | 'dark' | 'system');
                updateAppSetting('theme', value);
                setShowThemeDialog(false);
              }}
              value={preference}
            >
              <RadioButton.Item label="라이트 모드" value="light" labelStyle={[styles.radioLabel, { color: colors.text }]} />
              <RadioButton.Item label="다크 모드" value="dark" labelStyle={[styles.radioLabel, { color: colors.text }]} />
              <RadioButton.Item label="시스템 설정 따르기" value="system" labelStyle={[styles.radioLabel, { color: colors.text }]} />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowThemeDialog(false)} labelStyle={styles.buttonLabel}>확인</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <BottomSheetAlert
        visible={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        title="로그아웃"
        message="정말로 로그아웃 하시겠습니까?"
        buttons={[
          { text: '취소', style: 'cancel' },
          { text: '로그아웃', style: 'destructive', onPress: handleLogout },
        ]}
      />

      <Portal>
        <Dialog
          visible={showDeleteAccountDialog}
          onDismiss={() => setShowDeleteAccountDialog(false)}
          style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 20 * scale,
            marginHorizontal: 24 * scale,
          }}
        >
          {/* 경고 아이콘 */}
          <Box style={{ alignItems: 'center', paddingTop: 24 * scale }}>
            <Box style={{
              width: 64 * scale,
              height: 64 * scale,
              borderRadius: 32 * scale,
              backgroundColor: '#FF6B6B15',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconButton
                icon="alert-circle"
                size={36 * scale}
                iconColor="#FF6B6B"
              />
            </Box>
          </Box>

          <Dialog.Title style={[styles.dialogTitle, {
            color: colors.text,
            textAlign: 'center',
            marginTop: 16 * scale,
            fontSize: FONT_SIZES.h3 * scale,
          }]}>
            계정을 삭제하시겠습니까?
          </Dialog.Title>

          <Dialog.Content>
            <Text style={[styles.dialogText, {
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: 20 * scale,
              lineHeight: 22 * scale,
            }]}>
              계정을 삭제하면 다음 데이터가{'\n'}영구적으로 삭제됩니다
            </Text>

            {/* 삭제 항목 리스트 */}
            <Box style={{
              backgroundColor: isDark ? '#1a1a1a' : '#f8f8f8',
              borderRadius: 12 * scale,
              padding: 16 * scale,
            }}>
              {[
                { icon: 'file-document-outline', text: '작성한 모든 게시물' },
                { icon: 'comment-outline', text: '댓글 및 반응' },
                { icon: 'trophy-outline', text: '챌린지 참여 기록' },
                { icon: 'chart-line', text: '감정 기록 및 통계' },
              ].map((item, index) => (
                <Box key={index} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10 * scale,
                  borderBottomWidth: index < 3 ? 1 : 0,
                  borderBottomColor: isDark ? '#333' : '#eee',
                }}>
                  <IconButton
                    icon={item.icon}
                    size={20 * scale}
                    iconColor={colors.textSecondary}
                    style={{ margin: 0, marginRight: 8 * scale }}
                  />
                  <Text style={[styles.dialogText, {
                    color: colors.text,
                    flex: 1,
                  }]}>{item.text}</Text>
                </Box>
              ))}
            </Box>

            <Text style={[styles.dialogText, {
              color: '#FF6B6B',
              textAlign: 'center',
              marginTop: 16 * scale,
              fontFamily: 'Pretendard-SemiBold',
              fontSize: FONT_SIZES.bodySmall * scale,
            }]}>
              이 작업은 취소할 수 없습니다
            </Text>
          </Dialog.Content>

          <Dialog.Actions style={{
            flexDirection: 'column',
            paddingHorizontal: 20 * scale,
            paddingBottom: 20 * scale,
          }}>
            <Button
              mode="contained"
              buttonColor="#FF6B6B"
              onPress={handleDeleteAccount}
              labelStyle={[styles.buttonLabel, { color: '#fff' }]}
              style={{
                width: '100%',
                borderRadius: 12 * scale,
                marginBottom: 8 * scale,
              }}
              contentStyle={{ paddingVertical: 6 * scale }}
            >
              계정 삭제 진행
            </Button>
            <Button
              onPress={() => setShowDeleteAccountDialog(false)}
              labelStyle={[styles.buttonLabel, { color: colors.text }]}
              style={{
                width: '100%',
                borderRadius: 12 * scale,
                backgroundColor: isDark ? '#333' : '#f0f0f0',
              }}
              contentStyle={{ paddingVertical: 6 * scale }}
            >
              취소
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 비밀번호/확인 문구 입력 Dialog */}
      <Portal>
        <Dialog
          visible={showPasswordDialog}
          onDismiss={() => {
            if (!deleteLoading) {
              setShowPasswordDialog(false);
              setDeletePassword('');
              setDeleteConfirmText('');
            }
          }}
          style={{
            backgroundColor: colors.cardBackground,
            borderRadius: 20 * scale,
            marginHorizontal: 24 * scale,
          }}
        >
          {/* 자물쇠/키 아이콘 */}
          <Box style={{ alignItems: 'center', paddingTop: 24 * scale }}>
            <Box style={{
              width: 56 * scale,
              height: 56 * scale,
              borderRadius: 28 * scale,
              backgroundColor: isDark ? '#333' : '#f0f0f0',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconButton
                icon={isSocialUser ? 'shield-check' : 'lock'}
                size={28 * scale}
                iconColor={colors.primary}
              />
            </Box>
          </Box>

          <Dialog.Title style={[styles.dialogTitle, {
            color: colors.text,
            textAlign: 'center',
            marginTop: 8 * scale,
            fontSize: FONT_SIZES.h4 * scale,
          }]}>
            {isSocialUser ? '본인 확인' : '비밀번호 확인'}
          </Dialog.Title>

          <Dialog.Content>
            <Text style={[styles.dialogText, {
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: 20 * scale,
              lineHeight: 20 * scale,
            }]}>
              {isSocialUser
                ? '계정을 삭제하려면 아래에\n"계정삭제"를 정확히 입력해주세요'
                : '계정 삭제를 위해\n비밀번호를 입력해주세요'
              }
            </Text>

            {/* 입력 필드 */}
            <Box style={{
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              borderRadius: 12 * scale,
              borderWidth: 2,
              borderColor: (isSocialUser ? deleteConfirmText : deletePassword)
                ? colors.primary
                : 'transparent',
              overflow: 'hidden',
            }}>
              <TextInput
                style={{
                  backgroundColor: 'transparent',
                  color: colors.text,
                  paddingHorizontal: 16 * scale,
                  paddingVertical: 14 * scale,
                  fontSize: FONT_SIZES.body * scale,
                  textAlign: 'center',
                }}
                placeholder={isSocialUser ? '계정삭제' : '비밀번호를 입력하세요'}
                placeholderTextColor={isDark ? '#666' : '#999'}
                secureTextEntry={!isSocialUser}
                value={isSocialUser ? deleteConfirmText : deletePassword}
                onChangeText={isSocialUser ? setDeleteConfirmText : setDeletePassword}
                editable={!deleteLoading}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Box>

            {isSocialUser && (
              <Text style={{
                color: colors.textSecondary,
                fontSize: FONT_SIZES.bodySmall * scale,
                textAlign: 'center',
                marginTop: 8 * scale,
              }}>
                소셜 로그인 계정은 비밀번호 대신{'\n'}확인 문구를 입력합니다
              </Text>
            )}
          </Dialog.Content>

          <Dialog.Actions style={{
            flexDirection: 'column',
            paddingHorizontal: 20 * scale,
            paddingBottom: 20 * scale,
            paddingTop: 8 * scale,
          }}>
            <Button
              mode="contained"
              buttonColor="#FF6B6B"
              onPress={handleWithdrawal}
              labelStyle={[styles.buttonLabel, { color: '#fff' }]}
              style={{
                width: '100%',
                borderRadius: 12 * scale,
                marginBottom: 8 * scale,
                opacity: deleteLoading ? 0.7 : 1,
              }}
              contentStyle={{ paddingVertical: 6 * scale }}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Box style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={{ color: '#fff', marginLeft: 8 * scale }}>처리 중...</Text>
                </Box>
              ) : '계정 삭제'}
            </Button>
            <Button
              onPress={() => {
                setShowPasswordDialog(false);
                setDeletePassword('');
                setDeleteConfirmText('');
              }}
              labelStyle={[styles.buttonLabel, { color: colors.text }]}
              style={{
                width: '100%',
                borderRadius: 12 * scale,
                backgroundColor: isDark ? '#333' : '#f0f0f0',
              }}
              contentStyle={{ paddingVertical: 6 * scale }}
              disabled={deleteLoading}
            >
              취소
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: '#4CAF50' }}
        wrapperStyle={{ bottom: 80 * scale }}
      >
        <Text style={styles.snackbarText}>{snackbarMessage}</Text>
      </Snackbar>

      {/* 계정 삭제 완료 모달 - 개선된 디자인 */}
      <Modal
        visible={deleteCompleteModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={deleteCompleteStyles.modalOverlay}>
          <View style={[deleteCompleteStyles.container, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            {/* 체크 아이콘 */}
            <View style={deleteCompleteStyles.iconWrapper}>
              <View style={[deleteCompleteStyles.iconBg, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)' }]}>
                <Icon name="checkmark-circle" size={48} color="#34C759" />
              </View>
            </View>

            {/* 제목 */}
            <Text style={[deleteCompleteStyles.title, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              계정 삭제 요청 완료
            </Text>

            {/* 정보 카드 */}
            <View style={[deleteCompleteStyles.infoCard, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA' }]}>
              {/* 삭제 예정일 */}
              <View style={deleteCompleteStyles.infoRow}>
                <View style={[deleteCompleteStyles.infoIconWrap, { backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                  <Icon name="calendar-outline" size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                </View>
                <View style={deleteCompleteStyles.infoContent}>
                  <Text style={[deleteCompleteStyles.infoLabel, { color: isDark ? '#999999' : '#888888' }]}>완전 삭제 예정일</Text>
                  <Text style={[deleteCompleteStyles.infoValue, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                    {deleteCompleteModal.scheduledDate}
                  </Text>
                </View>
              </View>

              <View style={[deleteCompleteStyles.divider, { backgroundColor: isDark ? '#3A3A3A' : '#E5E5E5' }]} />

              {/* 복구 안내 */}
              <View style={deleteCompleteStyles.infoRow}>
                <View style={[deleteCompleteStyles.infoIconWrap, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                  <Icon name="refresh-outline" size={20} color="#34C759" />
                </View>
                <View style={deleteCompleteStyles.infoContent}>
                  <Text style={[deleteCompleteStyles.infoLabel, { color: isDark ? '#999999' : '#888888' }]}>복구 가능 기간</Text>
                  <Text style={[deleteCompleteStyles.infoValue, { color: '#34C759' }]}>30일 이내</Text>
                </View>
              </View>
            </View>

            {/* 안내 메시지 */}
            <View style={[deleteCompleteStyles.noticeBox, { backgroundColor: isDark ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.08)' }]}>
              <Icon name="information-circle" size={18} color="#FF9500" style={deleteCompleteStyles.noticeIcon} />
              <Text style={[deleteCompleteStyles.noticeText, { color: isDark ? '#FFB84D' : '#CC7A00' }]}>
                30일 이내에 다시 로그인하면 계정을 복구할 수 있습니다
              </Text>
            </View>

            {/* 확인 버튼 */}
            <TouchableOpacity
              style={deleteCompleteStyles.button}
              onPress={deleteCompleteModal.onConfirm}
              activeOpacity={0.8}
            >
              <Text style={deleteCompleteStyles.buttonText}>확인</Text>
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

      {/* 커스텀 Alert 모달 */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert({ ...customAlert, visible: false })}
      >
        <TouchableOpacity
          style={alertStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCustomAlert({ ...customAlert, visible: false })}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[alertStyles.container, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
              {customAlert.type && (
                <View style={[alertStyles.icon, {
                  backgroundColor:
                    customAlert.type === 'error' ? 'rgba(255, 59, 48, 0.1)' :
                    customAlert.type === 'warning' ? 'rgba(255, 149, 0, 0.1)' :
                    customAlert.type === 'success' ? 'rgba(52, 199, 89, 0.1)' :
                    'rgba(0, 122, 255, 0.1)'
                }]}>
                  <Icon
                    name={
                      customAlert.type === 'error' ? 'close-circle' :
                      customAlert.type === 'warning' ? 'warning' :
                      customAlert.type === 'success' ? 'checkmark-circle' :
                      'information-circle'
                    }
                    size={32}
                    color={
                      customAlert.type === 'error' ? '#FF3B30' :
                      customAlert.type === 'warning' ? '#FF9500' :
                      customAlert.type === 'success' ? '#34C759' :
                      '#007AFF'
                    }
                  />
                </View>
              )}
              <Text style={[alertStyles.title, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                {customAlert.title}
              </Text>
              <Text style={[alertStyles.message, { color: isDark ? '#E5E5E5' : '#666666' }]}>
                {customAlert.message}
              </Text>
              <View style={alertStyles.buttons}>
                {customAlert.buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      alertStyles.button,
                      customAlert.buttons.length === 1 && { flex: 1 },
                      { backgroundColor:
                        button.style === 'destructive' ? '#FF3B30' :
                        button.style === 'cancel' ? (isDark ? '#2A2A2A' : '#F0F0F0') :
                        (isDark ? '#667eea' : '#667eea')
                      }
                    ]}
                    onPress={() => {
                      setCustomAlert({ ...customAlert, visible: false });
                      if (button.onPress) {
                        setTimeout(() => {
                          button.onPress?.();
                        }, 150);
                      }
                    }}
                  >
                    <Text style={[
                      alertStyles.buttonText,
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
    </Box>
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

const deleteCompleteStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
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
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.4,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  noticeIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  button: {
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
  buttonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

const alertStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
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
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
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
  buttonText: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.2,
  },
});

export default SettingsScreen;
