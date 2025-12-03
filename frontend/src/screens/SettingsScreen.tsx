// src/screens/SettingsScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ScrollView, Alert, Linking, StyleSheet, useWindowDimensions, Platform, Vibration } from 'react-native';
import { Text, List, Switch, Button, Dialog, Portal, RadioButton, IconButton, Snackbar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { Box } from '../components/ui';
import { FONT_SIZES, APP_VERSION } from '../constants';
import userService from '../services/api/userService';

const BASE_WIDTH = 360;

interface NotificationSettings {
  like_notifications: boolean;
  comment_notifications: boolean;
  challenge_notifications: boolean;
  encouragement_notifications: boolean;
  daily_reminder: boolean;
  daily_reminder_time?: string;
  weekly_summary: boolean;
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

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    like_notifications: true,
    comment_notifications: true,
    challenge_notifications: true,
    encouragement_notifications: true,
    daily_reminder: false,
    daily_reminder_time: '09:00',
    weekly_summary: true,
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
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showTimePickerDialog, setShowTimePickerDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);

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

      // 프로필에서 알림 설정과 프라이버시 설정 로드
      const profileResponse = await userService.getProfile();
      if (profileResponse.status === 'success' && profileResponse.data) {
        const { notification_settings, privacy_settings } = profileResponse.data;

        // 알림 설정 적용
        if (notification_settings) {
          setNotificationSettings(prev => ({
            ...prev,
            like_notifications: notification_settings.like_notifications ?? true,
            comment_notifications: notification_settings.comment_notifications ?? true,
            challenge_notifications: notification_settings.challenge_notifications ?? true,
            encouragement_notifications: notification_settings.encouragement_notifications ?? true,
          }));
        }

        // 프라이버시 설정 적용
        if (privacy_settings) {
          setPrivacySettings({
            show_profile: privacy_settings.show_profile ?? true,
            show_posts: privacy_settings.show_posts ?? true,
          });
        }
      }
    } catch (error) {
      console.error('설정 로드 오류:', error);
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
      console.error('설정 저장 오류:', error);
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

  const handleLogout = () => {
    setShowLogoutDialog(false);
    logout();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '비밀번호 확인',
      '계정 삭제를 위해 비밀번호를 입력해주세요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            Alert.alert('계정 삭제', '계정이 삭제되었습니다.');
            logout();
          }
        }
      ]
    );
    setShowDeleteAccountDialog(false);
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('오류', '링크를 열 수 없습니다.');
    });
  };

  const handleTimePickerOpen = () => {
    const [hour, minute] = (notificationSettings.daily_reminder_time || '09:00').split(':').map(Number);
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setShowTimePickerDialog(true);
  };

  const handleTimePickerConfirm = () => {
    const time = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    const newSettings = { ...notificationSettings, daily_reminder_time: time };
    setNotificationSettings(newSettings);
    saveSettings('notification', newSettings);
    setShowTimePickerDialog(false);
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
      marginBottom: 20 * scale,
      paddingTop: 20 * scale,
    },
    sectionHeader: {
      fontSize: FONT_SIZES.bodySmall * scale,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      paddingHorizontal: 20 * scale,
      marginBottom: 12 * scale,
    },
    itemTitle: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontWeight: '500',
      letterSpacing: -0.3,
      color: colors.text,
      lineHeight: 22 * scale,
    },
    itemSubtitle: {
      fontSize: FONT_SIZES.body * scale,
      fontWeight: '400',
      letterSpacing: -0.2,
      color: colors.textSecondary,
      marginTop: 2 * scale,
      lineHeight: 20 * scale,
    },
    listItem: {
      paddingVertical: 16 * scale,
      paddingHorizontal: 20 * scale,
      minHeight: 56 * scale,
      backgroundColor: colors.cardBackground,
    },
    dialogTitle: {
      fontSize: FONT_SIZES.h4 * scale,
      fontWeight: '600',
      letterSpacing: -0.4,
    },
    dialogText: {
      fontSize: FONT_SIZES.body * scale,
      fontWeight: '400',
      letterSpacing: -0.2,
      lineHeight: 21 * scale,
    },
    radioLabel: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontWeight: '400',
      letterSpacing: -0.3,
    },
    buttonLabel: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontWeight: '500',
      letterSpacing: -0.2,
    },
    snackbarText: {
      fontSize: FONT_SIZES.bodySmall * scale,
      fontWeight: '500',
      color: isDark ? '#000' : '#ffffff',
      letterSpacing: -0.1,
    },
    timePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20 * scale,
    },
    timePickerText: {
      fontSize: 48 * scale,
      fontWeight: '300',
      color: colors.primary,
      marginHorizontal: 8 * scale,
    },
    timePickerButton: {
      backgroundColor: theme.bg.secondary,
      paddingHorizontal: 16 * scale,
      paddingVertical: 12 * scale,
      borderRadius: 12 * scale,
      minWidth: 80 * scale,
      alignItems: 'center',
    },
  }), [colors, scale, isDark, theme.bg.secondary]);

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

            <List.Item
              title="일일 리마인더"
              description={notificationSettings.daily_reminder ? notificationSettings.daily_reminder_time : undefined}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemSubtitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => notificationSettings.daily_reminder && handleTimePickerOpen()}
              right={() => (
                <Switch
                  value={notificationSettings.daily_reminder}
                  onValueChange={(value: boolean) => updateNotificationSetting('daily_reminder', value)}
                  disabled={!notificationSettings.push_enabled}
                  thumbColor={notificationSettings.daily_reminder ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="주간 요약"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              right={() => (
                <Switch
                  value={notificationSettings.weekly_summary}
                  onValueChange={(value: boolean) => updateNotificationSetting('weekly_summary', value)}
                  disabled={!notificationSettings.push_enabled}
                  thumbColor={notificationSettings.weekly_summary ? '#007AFF' : '#E5E5EA'}
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

            <List.Item
              title="비밀번호 변경"
              titleStyle={styles.itemTitle}
              style={[styles.listItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('ChangePassword')}
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

      <Portal>
        <Dialog visible={showTimePickerDialog} onDismiss={() => setShowTimePickerDialog(false)} style={{ backgroundColor: colors.cardBackground }}>
          <Dialog.Title style={[styles.dialogTitle, { color: colors.text }]}>리마인더 시간 설정</Dialog.Title>
          <Dialog.Content>
            <Box style={styles.timePickerRow}>
              <Box style={styles.timePickerButton}>
                <Button
                  onPress={() => setSelectedHour(h => h === 0 ? 23 : h - 1)}
                  labelStyle={{ fontSize: FONT_SIZES.h2 * scale }}
                >
                  ▲
                </Button>
                <Text style={styles.timePickerText}>{selectedHour.toString().padStart(2, '0')}</Text>
                <Button
                  onPress={() => setSelectedHour(h => h === 23 ? 0 : h + 1)}
                  labelStyle={{ fontSize: FONT_SIZES.h2 * scale }}
                >
                  ▼
                </Button>
              </Box>

              <Text style={[styles.timePickerText, { fontSize: 32 * scale }]}>:</Text>

              <Box style={styles.timePickerButton}>
                <Button
                  onPress={() => setSelectedMinute(m => m === 0 ? 45 : m - 15)}
                  labelStyle={{ fontSize: FONT_SIZES.h2 * scale }}
                >
                  ▲
                </Button>
                <Text style={styles.timePickerText}>{selectedMinute.toString().padStart(2, '0')}</Text>
                <Button
                  onPress={() => setSelectedMinute(m => m === 45 ? 0 : m + 15)}
                  labelStyle={{ fontSize: FONT_SIZES.h2 * scale }}
                >
                  ▼
                </Button>
              </Box>
            </Box>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTimePickerDialog(false)} labelStyle={styles.buttonLabel}>취소</Button>
            <Button mode="contained" onPress={handleTimePickerConfirm} labelStyle={styles.buttonLabel}>확인</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)} style={{ backgroundColor: colors.cardBackground }}>
          <Dialog.Title style={[styles.dialogTitle, { color: colors.text }]}>로그아웃</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: colors.text }]}>정말로 로그아웃 하시겠습니까?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)} labelStyle={styles.buttonLabel}>취소</Button>
            <Button mode="contained" onPress={handleLogout} labelStyle={styles.buttonLabel}>로그아웃</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showDeleteAccountDialog} onDismiss={() => setShowDeleteAccountDialog(false)} style={{ backgroundColor: colors.cardBackground }}>
          <Dialog.Title style={[styles.dialogTitle, { color: colors.text }]}>계정 삭제</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { fontWeight: '700', color: '#FF6B6B', marginBottom: 8 * scale }]}>
              정말로 계정을 삭제하시겠습니까?
            </Text>
            <Text style={[styles.dialogText, { color: colors.textSecondary, lineHeight: 20 * scale }]}>
              이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteAccountDialog(false)} labelStyle={styles.buttonLabel}>취소</Button>
            <Button mode="contained" buttonColor="#FF6B6B" onPress={handleDeleteAccount} labelStyle={styles.buttonLabel}>
              삭제
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
    </Box>
  );
};

export default SettingsScreen;
