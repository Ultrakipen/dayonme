import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  TextInput as RNTextInput, Platform, KeyboardAvoidingView, Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import userService from '../services/api/userService';
import { FONT_SIZES, SPACING, moderateScale } from '../constants';
import { showAlert } from '../contexts/AlertContext';
import { useModernTheme } from '../contexts/ModernThemeContext';

interface PasswordChangeScreenProps {
  navigation: { goBack: () => void; setOptions: (options: any) => void };
}

const PasswordChangeScreen: React.FC<PasswordChangeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useModernTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const colors = useMemo(() => ({
    background: theme.colors.background,
    cardBackground: theme.colors.surface,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    textTertiary: theme.colors.text.tertiary,
    textLight: isDark ? '#707070' : '#999999',
    border: theme.colors.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  }), [theme, isDark]);

  React.useEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

  const validatePassword = useCallback((password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: '비밀번호는 대문자를 포함해야 합니다.' };
    if (!/[a-z]/.test(password)) return { valid: false, message: '비밀번호는 소문자를 포함해야 합니다.' };
    if (!/\d/.test(password)) return { valid: false, message: '비밀번호는 숫자를 포함해야 합니다.' };
    if (!/[!@#$%^&*]/.test(password)) return { valid: false, message: '비밀번호는 특수문자(!@#$%^&*)를 포함해야 합니다.' };
    return { valid: true };
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword.trim()) { Vibration.vibrate(50); showAlert.error('오류', '현재 비밀번호를 입력해주세요.'); return; }
    if (!newPassword.trim()) { Vibration.vibrate(50); showAlert.error('오류', '새 비밀번호를 입력해주세요.'); return; }
    if (!confirmPassword.trim()) { Vibration.vibrate(50); showAlert.error('오류', '비밀번호 확인을 입력해주세요.'); return; }
    const validation = validatePassword(newPassword);
    if (!validation.valid) { Vibration.vibrate(50); showAlert.error('오류', validation.message || '비밀번호 형식이 올바르지 않습니다.'); return; }
    if (newPassword !== confirmPassword) { Vibration.vibrate(50); showAlert.error('오류', '새 비밀번호가 일치하지 않습니다.'); return; }
    if (currentPassword === newPassword) { Vibration.vibrate(50); showAlert.error('오류', '새 비밀번호는 현재 비밀번호와 달라야 합니다.'); return; }
    try {
      setLoading(true);
      const response = await userService.changePassword(currentPassword, newPassword);
      if (response.status === 'success') {
        Vibration.vibrate([0, 50, 100, 50]);
        showAlert.success('성공', '비밀번호가 성공적으로 변경되었습니다.', [{ text: '확인', onPress: () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); navigation.goBack(); }}]);
      } else { Vibration.vibrate(50); showAlert.error('오류', response.message || '비밀번호 변경에 실패했습니다.'); }
    } catch (error: any) {
      Vibration.vibrate(50);
      const errorMessage = error?.message || error?.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.';
      showAlert.error('오류', errorMessage);
    } finally { setLoading(false); }
  }, [currentPassword, newPassword, confirmPassword, validatePassword, navigation]);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { text: '', color: theme.border, width: '0%' };
    let strength = 0;
    if (newPassword.length >= 6) strength++;
    if (newPassword.length >= 8) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/\d/.test(newPassword)) strength++;
    if (/[!@#$%^&*]/.test(newPassword)) strength++;
    if (strength <= 2) return { text: '약함', color: theme.colors.error, width: '33%' };
    if (strength <= 4) return { text: '보통', color: theme.colors.warning || '#FF9500', width: '66%' };
    return { text: '강함', color: theme.colors.success || '#00BA7C', width: '100%' };
  }, [newPassword, theme]);

  const isFormValid = useMemo(() => currentPassword && newPassword && confirmPassword && newPassword === confirmPassword, [currentPassword, newPassword, confirmPassword]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessible accessibilityRole="button" accessibilityLabel="뒤로 가기">
          <Icon name="arrow-back" size={moderateScale(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>비밀번호 변경</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Icon name="lock-closed" size={moderateScale(22)} color={theme.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>안전한 비밀번호 만들기</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>• 최소 8자 이상{'\n'}• 대소문자, 숫자 포함{'\n'}• 특수문자(!@#$%^&*) 포함</Text>
          </View>
        </View>
        <View style={styles.formCard}>
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>현재 비밀번호</Text>
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={moderateScale(20)} color={colors.textSecondary} style={styles.inputIcon} />
              <RNTextInput style={[styles.textInput, { color: colors.text }]} value={currentPassword} onChangeText={setCurrentPassword} placeholder="현재 비밀번호를 입력하세요" placeholderTextColor={isDark ? '#808080' : '#999999'} secureTextEntry={!showCurrentPassword} autoCapitalize="none" editable={!loading} accessible accessibilityLabel="현재 비밀번호 입력" />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeButton} accessible accessibilityRole="button" accessibilityLabel={showCurrentPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>
                <Icon name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'} size={moderateScale(20)} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>새 비밀번호</Text>
            <View style={styles.inputContainer}>
              <Icon name="key-outline" size={moderateScale(20)} color={colors.textSecondary} style={styles.inputIcon} />
              <RNTextInput style={[styles.textInput, { color: colors.text }]} value={newPassword} onChangeText={setNewPassword} placeholder="새 비밀번호를 입력하세요" placeholderTextColor={isDark ? '#808080' : '#999999'} secureTextEntry={!showNewPassword} autoCapitalize="none" editable={!loading} accessible accessibilityLabel="새 비밀번호 입력" />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton} accessible accessibilityRole="button">
                <Icon name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={moderateScale(20)} color={colors.textLight} />
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthBarFill, { width: passwordStrength.width, backgroundColor: passwordStrength.color }]} />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.text}</Text>
              </View>
            )}
          </View>
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>새 비밀번호 확인</Text>
            <View style={styles.inputContainer}>
              <Icon name="checkmark-circle-outline" size={moderateScale(20)} color={colors.textSecondary} style={styles.inputIcon} />
              <RNTextInput style={[styles.textInput, { color: colors.text }]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="새 비밀번호를 다시 입력하세요" placeholderTextColor={isDark ? '#808080' : '#999999'} secureTextEntry={!showConfirmPassword} autoCapitalize="none" editable={!loading} accessible accessibilityLabel="비밀번호 확인 입력" />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton} accessible accessibilityRole="button">
                <Icon name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={moderateScale(20)} color={colors.textLight} />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && (
              <View style={styles.matchContainer}>
                {newPassword === confirmPassword ? (
                  <View style={styles.matchRow}><Icon name="checkmark-circle" size={moderateScale(16)} color={theme.colors.success || '#00BA7C'} /><Text style={[styles.matchText, { color: theme.colors.success || '#00BA7C' }]}>비밀번호가 일치합니다</Text></View>
                ) : (
                  <View style={styles.matchRow}><Icon name="close-circle" size={moderateScale(16)} color={theme.colors.error} /><Text style={[styles.matchText, { color: theme.colors.error }]}>비밀번호가 일치하지 않습니다</Text></View>
                )}
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={[styles.changeButton, (!isFormValid || loading) && styles.changeButtonDisabled]} onPress={handleChangePassword} disabled={!isFormValid || loading} accessible accessibilityRole="button" accessibilityLabel="비밀번호 변경">
          <Text style={[styles.changeButtonText, { color: theme.colors.alwaysWhite || '#FFFFFF' }]}>{loading ? '변경 중...' : '비밀번호 변경'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + SPACING.sm : moderateScale(48), paddingBottom: SPACING.sm },
  backButton: { padding: SPACING.xs, marginLeft: -SPACING.xs },
  headerTitle: { fontSize: FONT_SIZES.h3, fontWeight: '700', letterSpacing: -0.3, lineHeight: FONT_SIZES.h3 * 1.3 },
  headerSpacer: { width: moderateScale(40) },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: moderateScale(40) },
  infoCard: { flexDirection: 'row', backgroundColor: theme.colors?.surface || theme.background, borderRadius: moderateScale(12), padding: SPACING.md, marginBottom: moderateScale(20), ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: moderateScale(3) }, android: { elevation: 1 }}) },
  infoIconContainer: { width: moderateScale(40), height: moderateScale(40), borderRadius: moderateScale(20), backgroundColor: theme.colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: moderateScale(12) },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: FONT_SIZES.body, fontWeight: '700', marginBottom: moderateScale(6), letterSpacing: -0.2, lineHeight: FONT_SIZES.body * 1.4 },
  infoText: { fontSize: FONT_SIZES.small, lineHeight: FONT_SIZES.small * 1.5, fontWeight: '400' },
  formCard: { backgroundColor: theme.colors?.surface || theme.background, borderRadius: moderateScale(12), padding: SPACING.md, marginBottom: moderateScale(20), ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: moderateScale(3) }, android: { elevation: 1 }}) },
  inputSection: { marginBottom: moderateScale(24) },
  inputLabel: { fontSize: FONT_SIZES.small, fontWeight: '700', marginBottom: moderateScale(8), letterSpacing: -0.1, lineHeight: FONT_SIZES.small * 1.4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors?.surface || theme.surface, borderRadius: moderateScale(8), borderWidth: 1, borderColor: theme.colors?.border || theme.border, paddingHorizontal: moderateScale(12), height: moderateScale(48) },
  inputIcon: { marginRight: moderateScale(10) },
  textInput: { flex: 1, fontSize: FONT_SIZES.body, fontWeight: '400', padding: 0, letterSpacing: -0.2, lineHeight: FONT_SIZES.body * 1.4 },
  eyeButton: { padding: moderateScale(8), marginRight: moderateScale(-8) },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginTop: moderateScale(8) },
  strengthBar: { flex: 1, height: moderateScale(4), backgroundColor: theme.colors?.border || theme.border, borderRadius: moderateScale(2), marginRight: moderateScale(10), overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: moderateScale(2) },
  strengthText: { fontSize: FONT_SIZES.small, fontWeight: '600', letterSpacing: -0.1, lineHeight: FONT_SIZES.small * 1.4 },
  matchContainer: { marginTop: moderateScale(8) },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(6) },
  matchText: { fontSize: FONT_SIZES.small, fontWeight: '500', letterSpacing: -0.1, lineHeight: FONT_SIZES.small * 1.4 },
  changeButton: { backgroundColor: theme.colors?.primary || theme.primary, borderRadius: moderateScale(8), paddingVertical: moderateScale(14), alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: moderateScale(2) }, shadowOpacity: 0.1, shadowRadius: moderateScale(4) }, android: { elevation: 2 }}) },
  changeButtonDisabled: { backgroundColor: theme.colors?.border || theme.border, ...Platform.select({ ios: { shadowOpacity: 0 }, android: { elevation: 0 }}) },
  changeButtonText: { fontSize: FONT_SIZES.bodyLarge, fontWeight: '700', color: theme.colors.background, letterSpacing: -0.2, lineHeight: FONT_SIZES.bodyLarge * 1.4 },
});

export default PasswordChangeScreen;
