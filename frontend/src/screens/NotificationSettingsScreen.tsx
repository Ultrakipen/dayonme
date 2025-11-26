import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import notificationService from '../services/api/notificationService';
import { FONT_SIZES, SPACING, moderateScale, verticalScale } from '../constants';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface ToggleSetting {
  title: string;
  description: string;
  key: string;
  icon: string;
}

interface NotificationSettingsScreenProps {
  navigation: {
    goBack: () => void;
    setOptions: (options: any) => void;
  };
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const { theme, isDark } = useModernTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 시간 선택 모달 상태
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeType, setCurrentTimeType] = useState<'quiet_start' | 'quiet_end' | 'reminder' | null>(null);
  const [tempTime, setTempTime] = useState(new Date());

  // 테마에 따른 색상 설정
  const colors = useMemo(() => ({
    primary: theme.colors?.primary || theme.primary,
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? '#E5E5E5' : '#666666',
    textLight: isDark ? '#B3B3B3' : '#999999',
    background: isDark ? '#1E1E1E' : '#FFFFFF',
    surface: isDark ? '#0D0D0D' : '#FAFAFA',
    border: isDark ? '#2A2A2A' : '#E5E5E5',
    error: theme.colors?.error || theme.error || '#FF3B30',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    switchThumb: isDark ? '#999999' : '#FFFFFF',
    shadowColor: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.08)',
  }), [theme, isDark]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
    loadSettings();
  }, []);

  const [settings, setSettings] = useState({
    all_notifications: true,
    sound: true,
    vibration: true,
    badge: true,
    likes: true,
    comments: true,
    my_challenges: true,
    challenge_complete: true,
  });

  const [timeSettings, setTimeSettings] = useState({
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    daily_reminder: '20:00',
  });

  // 캐싱
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5분

  // 시간 문자열을 Date 객체로 변환
  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Date 객체를 시간 문자열로 변환
  const dateToTimeString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 시간 문자열 포맷팅 (22:0 → 22:00)
  const formatTimeString = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  const loadSettings = async (forceRefresh = false) => {
    // 캐시 확인
    const now = Date.now();
    if (!forceRefresh && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await notificationService.getNotificationSettings();
      console.log('📥 [NotificationSettings] 서버에서 불러온 설정:', response);

      if (response?.data) {
        setSettings(prev => ({
          ...prev,
          likes: response.data.like_notifications ?? prev.likes,
          comments: response.data.comment_notifications ?? prev.comments,
          my_challenges: response.data.challenge_notifications ?? prev.my_challenges,
        }));

        // 시간 설정 불러오기 (포맷팅 적용)
        setTimeSettings(prev => ({
          quiet_hours_start: response.data.quiet_hours_start ? formatTimeString(response.data.quiet_hours_start) : prev.quiet_hours_start,
          quiet_hours_end: response.data.quiet_hours_end ? formatTimeString(response.data.quiet_hours_end) : prev.quiet_hours_end,
          daily_reminder: response.data.daily_reminder ? formatTimeString(response.data.daily_reminder) : prev.daily_reminder,
        }));
        setCacheTimestamp(Date.now());
      }
    } catch (error) {
      console.error('❌ [NotificationSettings] 알림 설정 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: string) => {
    ReactNativeHapticFeedback.trigger('impactLight');
    const newValue = !settings[key];

    // 먼저 로컬 상태 업데이트
    setSettings(prev => ({
      ...prev,
      [key]: newValue
    }));

    // 서버에 저장 (likes, comments, my_challenges, challenge_complete만)
    try {
      setSaving(true);
      const updateData: any = {};

      if (key === 'likes') {
        updateData.like_notifications = newValue;
        console.log('📤 [toggleSetting] 좋아요 알림 업데이트:', newValue);
      } else if (key === 'comments') {
        updateData.comment_notifications = newValue;
        console.log('📤 [toggleSetting] 댓글 알림 업데이트:', newValue);
      } else if (key === 'my_challenges' || key === 'challenge_complete') {
        // 챌린지 알림은 두 설정 중 하나라도 켜져있으면 true
        const updatedChallengeNotifications =
          key === 'my_challenges'
            ? (newValue || settings.challenge_complete)
            : (settings.my_challenges || newValue);

        updateData.challenge_notifications = updatedChallengeNotifications;
        console.log('📤 [toggleSetting] 챌린지 알림 업데이트:', {
          key,
          newValue,
          my_challenges: key === 'my_challenges' ? newValue : settings.my_challenges,
          challenge_complete: key === 'challenge_complete' ? newValue : settings.challenge_complete,
          final: updatedChallengeNotifications
        });
      } else {
        // all_notifications, sound, vibration, badge는 서버에 저장하지 않음 (클라이언트 측 설정)
        console.log('📱 [toggleSetting] 클라이언트 측 설정 변경:', { key, newValue });
        setSaving(false);
        return;
      }

      if (Object.keys(updateData).length > 0) {
        await notificationService.updateNotificationSettings(updateData);
        console.log('✅ [toggleSetting] 서버 업데이트 성공');
      }
    } catch (error) {
      console.error('❌ [toggleSetting] 알림 설정 저장 실패:', error);
      Alert.alert('오류', '알림 설정 저장에 실패했습니다.');
      // 실패 시 원래 값으로 되돌리기
      setSettings(prev => ({
        ...prev,
        [key]: !newValue
      }));
    } finally {
      setSaving(false);
    }
  };

  // 시간 선택 모달 열기
  const openTimePicker = (type: 'quiet_start' | 'quiet_end' | 'reminder') => {
    ReactNativeHapticFeedback.trigger('impactLight');
    let initialTime: string;

    switch (type) {
      case 'quiet_start':
        initialTime = timeSettings.quiet_hours_start;
        break;
      case 'quiet_end':
        initialTime = timeSettings.quiet_hours_end;
        break;
      case 'reminder':
        initialTime = timeSettings.daily_reminder;
        break;
    }

    setCurrentTimeType(type);
    setTempTime(timeStringToDate(initialTime));
    setShowTimePicker(true);
  };

  // 시간 변경 핸들러
  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (selectedDate && currentTimeType) {
      setTempTime(selectedDate);

      // Android에서는 즉시 적용
      if (Platform.OS === 'android') {
        confirmTimeSelection(selectedDate);
      }
    }
  };

  // 시간 선택 확인
  const confirmTimeSelection = async (date: Date) => {
    const timeString = dateToTimeString(date);
    const timeType = currentTimeType;

    console.log(`⏰ [NotificationSettings] 시간 선택 확인:`, { timeType, timeString });

    // UI 업데이트
    if (timeType === 'quiet_start') {
      setTimeSettings(prev => ({ ...prev, quiet_hours_start: timeString }));
    } else if (timeType === 'quiet_end') {
      setTimeSettings(prev => ({ ...prev, quiet_hours_end: timeString }));
    } else if (timeType === 'reminder') {
      setTimeSettings(prev => ({ ...prev, daily_reminder: timeString }));
    }

    setShowTimePicker(false);
    setCurrentTimeType(null);

    // 서버에 시간 설정 저장
    try {
      setSaving(true);
      const updateData: any = {};

      if (timeType === 'quiet_start') {
        updateData.quiet_hours_start = timeString;
      } else if (timeType === 'quiet_end') {
        updateData.quiet_hours_end = timeString;
      } else if (timeType === 'reminder') {
        updateData.daily_reminder = timeString;
      }

      await notificationService.updateNotificationSettings(updateData);
      console.log('✅ [NotificationSettings] 시간 설정 저장 성공');
    } catch (error) {
      console.error('❌ [NotificationSettings] 시간 설정 저장 실패:', error);
      Alert.alert('오류', '시간 설정 저장에 실패했습니다.');

      // 실패 시 원래 값으로 되돌리기
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };

  // 시간 선택 취소
  const cancelTimeSelection = () => {
    setShowTimePicker(false);
    setCurrentTimeType(null);
  };

  const appNotifications: ToggleSetting[] = [
    {
      title: '전체 알림',
      description: '',
      key: 'all_notifications',
      icon: 'notifications-outline',
    },
    {
      title: '소리',
      description: '',
      key: 'sound',
      icon: 'volume-high-outline',
    },
    {
      title: '진동',
      description: '',
      key: 'vibration',
      icon: 'phone-portrait-outline',
    },
    {
      title: '앱 배지',
      description: '',
      key: 'badge',
      icon: 'ellipse-outline',
    },
  ];

  const contentNotifications: ToggleSetting[] = [
    {
      title: '좋아요 알림',
      description: '',
      key: 'likes',
      icon: 'heart-outline',
    },
    {
      title: '댓글 알림',
      description: '',
      key: 'comments',
      icon: 'chatbubble-outline',
    },
  ];

  const challengeNotifications: ToggleSetting[] = [
    {
      title: '챌린지 진행',
      description: '',
      key: 'my_challenges',
      icon: 'trophy-outline',
    },
    {
      title: '챌린지 완료',
      description: '',
      key: 'challenge_complete',
      icon: 'checkmark-circle-outline',
    },
  ];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + SPACING.sm : moderateScale(54),
      paddingBottom: SPACING.sm,
    },
    backButton: {
      padding: SPACING.xxs,
      marginLeft: moderateScale(-4),
    },
    headerTitle: {
      fontSize: FONT_SIZES.h4,
      fontWeight: '700',
      letterSpacing: -0.4,
      lineHeight: FONT_SIZES.h4 * 1.3,
    },
    headerSpacer: {
      width: moderateScale(36),
    },
    scrollView: {
      flex: 1,
    },
    section: {
      marginBottom: moderateScale(20),
      marginTop: moderateScale(4),
    },
    sectionTitle: {
      fontSize: FONT_SIZES.small,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginLeft: SPACING.md,
      marginBottom: moderateScale(10),
      letterSpacing: 0.5,
      lineHeight: FONT_SIZES.small * 1.3,
    },
    sectionCard: {
      marginHorizontal: SPACING.md,
      borderRadius: moderateScale(14),
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: verticalScale(2) },
          shadowOpacity: isDark ? 0 : 1,
          shadowRadius: moderateScale(8),
        },
        android: {
          elevation: isDark ? 0 : 2,
        },
      }),
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: moderateScale(14),
      minHeight: moderateScale(54),
    },
    settingTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      letterSpacing: -0.3,
      lineHeight: FONT_SIZES.body * 1.4,
    },
    timeText: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      letterSpacing: -0.2,
      lineHeight: FONT_SIZES.body * 1.4,
      minWidth: moderateScale(60),
      textAlign: 'right',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: moderateScale(16),
      borderTopRightRadius: moderateScale(16),
      paddingBottom: Platform.OS === 'ios' ? moderateScale(34) : SPACING.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 0.5,
    },
    modalTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      letterSpacing: -0.4,
      lineHeight: FONT_SIZES.body * 1.4,
    },
    modalCancelText: {
      fontSize: FONT_SIZES.body,
      letterSpacing: -0.2,
      fontWeight: '500',
      lineHeight: FONT_SIZES.body * 1.4,
    },
    modalConfirmText: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      letterSpacing: -0.2,
      lineHeight: FONT_SIZES.body * 1.4,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      marginLeft: SPACING.md,
    },
    bottomSpacer: {
      height: moderateScale(24),
    },
  }), [screenWidth, screenHeight, colors]);

  const renderSection = (title: string, items: ToggleSetting[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.background }]}>
        {items.map((item, index) => (
          <View key={item.key}>
            <View
              style={[styles.settingItem, { backgroundColor: colors.background }]}
            >
              <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
              <Switch
                value={settings[item.key]}
                onValueChange={() => toggleSetting(item.key)}
                trackColor={{ false: colors.border, true: colors.primary + '30' }}
                thumbColor={settings[item.key] ? colors.primary : colors.switchThumb}
                ios_backgroundColor={colors.border}
                accessibilityLabel={`${item.title} ${settings[item.key] ? '켜짐' : '꺼짐'}`}
              />
            </View>
            {index < items.length - 1 && (
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderTimeSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>시간 설정</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.background }]}
          onPress={() => openTimePicker('quiet_start')}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`방해 금지 시작 시간 ${timeSettings.quiet_hours_start}`}
        >
          <Text style={[styles.settingTitle, { color: colors.text }]}>방해 금지 시작</Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTimeString(timeSettings.quiet_hours_start)}</Text>
        </TouchableOpacity>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.background }]}
          onPress={() => openTimePicker('quiet_end')}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`방해 금지 종료 시간 ${timeSettings.quiet_hours_end}`}
        >
          <Text style={[styles.settingTitle, { color: colors.text }]}>방해 금지 종료</Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTimeString(timeSettings.quiet_hours_end)}</Text>
        </TouchableOpacity>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.background }]}
          onPress={() => openTimePicker('reminder')}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`일일 리마인더 시간 ${timeSettings.daily_reminder}`}
        >
          <Text style={[styles.settingTitle, { color: colors.text }]}>일일 리마인더</Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTimeString(timeSettings.daily_reminder)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 시간 선택 모달 렌더링
  const renderTimePicker = () => {
    if (!showTimePicker) return null;

    if (Platform.OS === 'ios') {
      return (
        <Modal
          transparent
          visible={showTimePicker}
          animationType="slide"
          onRequestClose={cancelTimeSelection}
        >
          <TouchableOpacity
            style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
            activeOpacity={1}
            onPress={cancelTimeSelection}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={cancelTimeSelection}>
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>취소</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>시간 선택</Text>
                <TouchableOpacity onPress={() => confirmTimeSelection(tempTime)}>
                  <Text style={[styles.modalConfirmText, { color: colors.primary }]}>확인</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                locale="ko-KR"
                textColor={colors.text}
                themeVariant={isDark ? "dark" : "light"}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      );
    }

    // Android
    return (
      <DateTimePicker
        value={tempTime}
        mode="time"
        is24Hour={true}
        display="default"
        onChange={onTimeChange}
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <Icon name="arrow-back" size={moderateScale(22)} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>알림</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <Icon name="arrow-back" size={moderateScale(22)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>알림</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.surface }]} showsVerticalScrollIndicator={false}>
        {renderSection('푸시', appNotifications)}
        {renderSection('콘텐츠', contentNotifications)}
        {renderSection('챌린지', challengeNotifications)}
        {renderTimeSection()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderTimePicker()}
    </View>
  );
};

export default NotificationSettingsScreen;
