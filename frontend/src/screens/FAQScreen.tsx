// screens/FAQScreen.tsx - 자주 묻는 질문
import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../contexts/ModernThemeContext';

const BASE_WIDTH = 360;

const FAQ_DATA = [
  { id: '1', q: '계정은 어떻게 삭제하나요?', a: '프로필 → 설정 → 계정 설정에서 회원 탈퇴를 진행할 수 있습니다. 탈퇴 시 모든 데이터가 삭제되며 복구가 불가능합니다.' },
  { id: '2', q: '비밀번호를 잊어버렸어요.', a: '로그인 화면에서 "비밀번호 찾기"를 선택하면 가입 시 등록한 이메일로 재설정 링크를 받을 수 있습니다.' },
  { id: '3', q: '알림이 오지 않아요.', a: '기기 설정에서 앱 알림이 허용되어 있는지 확인해주세요. 또한 프로필 → 알림 설정에서 알림이 활성화되어 있는지 확인해주세요.' },
  { id: '4', q: '게시물을 수정/삭제하고 싶어요.', a: '본인이 작성한 게시물의 우측 상단 메뉴(⋯)를 탭하면 수정 또는 삭제를 선택할 수 있습니다.' },
  { id: '5', q: '다른 사용자를 차단하고 싶어요.', a: '해당 사용자의 프로필에서 우측 상단 메뉴를 탭하고 "차단하기"를 선택하세요. 차단된 사용자는 프로필 → 차단 관리에서 확인할 수 있습니다.' },
  { id: '6', q: '부적절한 게시물을 발견했어요.', a: '해당 게시물의 메뉴(⋯)에서 "신고하기"를 선택하여 신고할 수 있습니다. 운영팀이 검토 후 조치합니다.' },
  { id: '7', q: '내 데이터를 백업하고 싶어요.', a: '프로필 → 설정 → 계정 설정 → 데이터 다운로드에서 본인의 모든 데이터를 ZIP 파일로 다운로드할 수 있습니다. 이메일로 전송됩니다.' },
];

const FAQScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDark } = useModernTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.9), 1.3);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const colors = useMemo(() => ({
    bg: isDark ? theme.bg.primary : '#FFFFFF',
    headerBg: isDark ? theme.bg.secondary : '#FFFFFF',
    card: isDark ? theme.bg.secondary : '#F8F9FA',
    text: isDark ? theme.colors.text.primary : '#1A1A1A',
    textSecondary: isDark ? theme.colors.text.secondary : '#666666',
    border: isDark ? theme.colors.border : '#E5E5E5',
    accent: '#667EEA',
  }), [isDark, theme]);

  const renderItem = ({ item }: { item: typeof FAQ_DATA[0] }) => {
    const isExpanded = expandedId === item.id;
    return (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.questionRow}>
          <Text style={[styles.question, { color: colors.text, fontSize: 15 * scale }]}>{item.q}</Text>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20 * scale} color={colors.textSecondary} />
        </View>
        {isExpanded && (
          <Text style={[styles.answer, { color: colors.textSecondary, fontSize: 14 * scale, lineHeight: 22 * scale, borderTopColor: colors.border }]}>
            {item.a}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.headerBg} />

      {/* 커스텀 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24 * scale} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 18 * scale }]}>자주 묻는 질문</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={FAQ_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  headerTitle: { fontFamily: 'Pretendard-Bold' },
  placeholder: { width: 40 },
  list: { padding: 16 },
  item: { borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1 },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { flex: 1, fontFamily: 'Pretendard-SemiBold', marginRight: 8 },
  answer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
});

export default FAQScreen;
