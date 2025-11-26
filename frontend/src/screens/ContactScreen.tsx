// screens/ContactScreen.tsx - 문의하기
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  useWindowDimensions, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';

const BASE_WIDTH = 360;
const CATEGORIES = ['일반 문의', '버그 신고', '기능 제안', '계정 문제', '기타'];

const ContactScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDark } = useModernTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.9), 1.3);

  const [category, setCategory] = useState('일반 문의');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = useMemo(() => ({
    bg: isDark ? theme.bg.primary : '#FFFFFF',
    headerBg: isDark ? theme.bg.secondary : '#FFFFFF',
    card: isDark ? theme.bg.secondary : '#F8F9FA',
    text: isDark ? theme.colors.text.primary : '#1A1A1A',
    textSecondary: isDark ? theme.colors.text.secondary : '#666666',
    border: isDark ? theme.colors.border : '#E5E5E5',
    accent: '#667EEA',
    inputBg: isDark ? theme.bg.tertiary : '#F0F0F0',
  }), [isDark, theme]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // TODO: 실제 API 연동 시 수정
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('접수 완료', '문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('오류', '문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.headerBg} />

      {/* 커스텀 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24 * scale} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 18 * scale }]}>문의하기</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 카테고리 선택 */}
          <Text style={[styles.label, { color: colors.text, fontSize: 14 * scale }]}>문의 유형</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  { backgroundColor: category === cat ? colors.accent : colors.card, borderColor: colors.border }
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, { color: category === cat ? '#FFF' : colors.text, fontSize: 13 * scale }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 제목 */}
          <Text style={[styles.label, { color: colors.text, fontSize: 14 * scale }]}>제목</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, fontSize: 15 * scale }]}
            placeholder="문의 제목을 입력하세요"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* 내용 */}
          <Text style={[styles.label, { color: colors.text, fontSize: 14 * scale }]}>내용</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, fontSize: 15 * scale }]}
            placeholder="문의 내용을 상세히 입력해주세요"
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary, fontSize: 12 * scale }]}>
            {content.length}/2000
          </Text>

          {/* 안내 */}
          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="information-circle-outline" size={18 * scale} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary, fontSize: 13 * scale }]}>
              문의하신 내용은 영업일 기준 1-2일 내에 {user?.email || 'test@example.com'}로 답변 드립니다.
            </Text>
          </View>

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.submitText, { fontSize: 16 * scale }]}>문의 접수하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { fontWeight: '700' },
  placeholder: { width: 40 },
  content: { padding: 20 },
  label: { fontWeight: '600', marginBottom: 8, marginTop: 16 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontWeight: '500' },
  input: { borderRadius: 12, padding: 14, marginBottom: 4 },
  textArea: { borderRadius: 12, padding: 14, minHeight: 160 },
  charCount: { textAlign: 'right', marginTop: 4 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, marginTop: 20, borderWidth: 1 },
  infoText: { flex: 1, marginLeft: 10, lineHeight: 20 },
  submitBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitText: { color: '#FFF', fontWeight: '700' },
});

export default ContactScreen;
