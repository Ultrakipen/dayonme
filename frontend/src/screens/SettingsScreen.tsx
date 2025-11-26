// src/screens/SettingsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, Alert, Linking, StyleSheet, useWindowDimensions, Platform, Vibration } from 'react-native';
import { Text, List, Switch, Button, Dialog, Portal, RadioButton, IconButton, Snackbar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { Box } from '../components/ui';
import { FONT_SIZES } from '../constants';

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
  show_emotions: boolean;
  show_posts: boolean;
  show_challenges: boolean;
  allow_messages: boolean;
  public_stats: boolean;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  font_size: 'small' | 'medium' | 'large';
  auto_backup: boolean;
  analytics_enabled: boolean;
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
    show_emotions: true,
    show_posts: true,
    show_challenges: true,
    allow_messages: false,
    public_stats: true
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'system',
    language: 'ko',
    font_size: 'medium',
    auto_backup: true,
    analytics_enabled: true
  });

  const [loading, setLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showFontSizeDialog, setShowFontSizeDialog] = useState(false);
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
      // API 호출 준비 중
    } catch (error) {
      console.error('설정 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = useCallback(async (type: 'notification' | 'privacy' | 'app', settings: any) => {
    try {
      // API 호출 준비 중
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

  const handleExportData = async () => {
    try {
      Alert.alert('데이터 내보내기', '데이터 내보내기 기능을 준비 중입니다.');
    } catch (error) {
      Alert.alert('오류', '데이터 내보내기 중 오류가 발생했습니다.');
    }
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

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  const getStyles = () => StyleSheet.create({
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
  });

  const styles = getStyles();

  return (
    <Box className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box style={{ height: 24 * scale }} />

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>알림 설정</Text>
            <List.Item
              title="전체 알림"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
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
              style={styles.listItem}
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
              style={styles.listItem}
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
              style={styles.listItem}
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
              style={styles.listItem}
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
              style={styles.listItem}
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
              style={styles.listItem}
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
              style={styles.listItem}
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
              title="감정 기록 공개"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              right={() => (
                <Switch
                  value={privacySettings.show_emotions}
                  onValueChange={(value: boolean) => updatePrivacySetting('show_emotions', value)}
                  thumbColor={privacySettings.show_emotions ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="게시물 공개"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              right={() => (
                <Switch
                  value={privacySettings.show_posts}
                  onValueChange={(value: boolean) => updatePrivacySetting('show_posts', value)}
                  thumbColor={privacySettings.show_posts ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="챌린지 참여 공개"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              right={() => (
                <Switch
                  value={privacySettings.show_challenges}
                  onValueChange={(value: boolean) => updatePrivacySetting('show_challenges', value)}
                  thumbColor={privacySettings.show_challenges ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="메시지 허용"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              right={() => (
                <Switch
                  value={privacySettings.allow_messages}
                  onValueChange={(value: boolean) => updatePrivacySetting('allow_messages', value)}
                  thumbColor={privacySettings.allow_messages ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="통계 공개"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              right={() => (
                <Switch
                  value={privacySettings.public_stats}
                  onValueChange={(value: boolean) => updatePrivacySetting('public_stats', value)}
                  thumbColor={privacySettings.public_stats ? '#007AFF' : '#E5E5EA'}
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
              style={styles.listItem}
              onPress={() => setShowThemeDialog(true)}
            />

            <List.Item
              title="언어"
              description={appSettings.language === 'ko' ? '한국어' : 'English'}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemSubtitle}
              style={styles.listItem}
              onPress={() => setShowLanguageDialog(true)}
            />

            <List.Item
              title="글자 크기"
              description={appSettings.font_size === 'small' ? '작게' : appSettings.font_size === 'large' ? '크게' : '보통'}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemSubtitle}
              style={styles.listItem}
              onPress={() => setShowFontSizeDialog(true)}
            />

            <List.Item
              title="자동 백업"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              right={() => (
                <Switch
                  value={appSettings.auto_backup}
                  onValueChange={(value: boolean) => updateAppSetting('auto_backup', value)}
                  thumbColor={appSettings.auto_backup ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />

            <List.Item
              title="사용 통계"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              right={() => (
                <Switch
                  value={appSettings.analytics_enabled}
                  onValueChange={(value: boolean) => updateAppSetting('analytics_enabled', value)}
                  thumbColor={appSettings.analytics_enabled ? '#007AFF' : '#E5E5EA'}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
                />
              )}
            />
        </Box>

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>계정</Text>
            <List.Item
              title="프로필 편집"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              onPress={() => navigation.navigate('ProfileEdit')}
            />

            <List.Item
              title="비밀번호 변경"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              onPress={() => navigation.navigate('ChangePassword')}
            />

            <List.Item
              title="데이터 내보내기"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              onPress={handleExportData}
            />

            <Box style={{ height: 8 * scale, backgroundColor: colors.background }} />

            <List.Item
              title="로그아웃"
              titleStyle={[styles.itemTitle, { color: '#FF6B6B' }]}
              style={styles.listItem}
              onPress={() => setShowLogoutDialog(true)}
            />

            <List.Item
              title="계정 삭제"
              titleStyle={[styles.itemTitle, { color: '#FF6B6B' }]}
              style={styles.listItem}
              onPress={() => setShowDeleteAccountDialog(true)}
            />
        </Box>

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>지원</Text>
            <List.Item
              title="자주 묻는 질문"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              onPress={() => navigation.navigate('FAQ')}
            />

            <List.Item
              title="문의하기"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              onPress={() => navigation.navigate('Contact')}
            />

            <List.Item
              title="이용약관"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              onPress={() => openExternalLink('https://example.com/terms')}
            />

            <List.Item
              title="개인정보처리방침"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              onPress={() => openExternalLink('https://example.com/privacy')}
            />
        </Box>

        <Box style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>정보</Text>
            <List.Item
              title="버전"
              description="1.0.0"
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemSubtitle}
              style={styles.listItem}
            />

            <List.Item
              title="평가하기"
              titleStyle={styles.itemTitle}
              style={styles.listItem}
              onPress={() => openExternalLink('https://apps.apple.com')}
            />
        </Box>

        <Box style={{ height: 40 * scale }} />
      </ScrollView>

      <Portal>
        <Dialog visible={showThemeDialog} onDismiss={() => setShowThemeDialog(false)}>
          <Dialog.Title style={styles.dialogTitle}>테마 선택</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value: string) => {
                setThemePreference(value as 'light' | 'dark' | 'system');
                updateAppSetting('theme', value);
              }}
              value={preference}
            >
              <RadioButton.Item label="라이트 모드" value="light" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="다크 모드" value="dark" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="시스템 설정 따르기" value="system" labelStyle={styles.radioLabel} />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowThemeDialog(false)} labelStyle={styles.buttonLabel}>확인</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showLanguageDialog} onDismiss={() => setShowLanguageDialog(false)}>
          <Dialog.Title style={styles.dialogTitle}>언어 선택</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => updateAppSetting('language', value)}
              value={appSettings.language}
            >
              <RadioButton.Item label="한국어" value="ko" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="English" value="en" labelStyle={styles.radioLabel} />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLanguageDialog(false)} labelStyle={styles.buttonLabel}>확인</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showFontSizeDialog} onDismiss={() => setShowFontSizeDialog(false)}>
          <Dialog.Title style={styles.dialogTitle}>글자 크기 선택</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => updateAppSetting('font_size', value)}
              value={appSettings.font_size}
            >
              <RadioButton.Item label="작게" value="small" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="보통" value="medium" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="크게" value="large" labelStyle={styles.radioLabel} />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowFontSizeDialog(false)} labelStyle={styles.buttonLabel}>확인</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showTimePickerDialog} onDismiss={() => setShowTimePickerDialog(false)}>
          <Dialog.Title style={styles.dialogTitle}>리마인더 시간 설정</Dialog.Title>
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
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
          <Dialog.Title style={styles.dialogTitle}>로그아웃</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>정말로 로그아웃 하시겠습니까?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)} labelStyle={styles.buttonLabel}>취소</Button>
            <Button mode="contained" onPress={handleLogout} labelStyle={styles.buttonLabel}>로그아웃</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showDeleteAccountDialog} onDismiss={() => setShowDeleteAccountDialog(false)}>
          <Dialog.Title style={styles.dialogTitle}>계정 삭제</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { fontWeight: '700', color: '#FF6B6B', marginBottom: 8 * scale }]}>
              정말로 계정을 삭제하시겠습니까?
            </Text>
            <Text style={[styles.dialogText, { color: '#737373', lineHeight: 20 * scale }]}>
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
