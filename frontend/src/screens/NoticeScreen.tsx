// screens/NoticeScreen.tsx - 공지사항 화면
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../contexts/ModernThemeContext';
import apiClient from '../services/api/client';

const BASE_WIDTH = 360;

interface Notice {
  notice_id: number;
  title: string;
  content?: string;
  type: 'normal' | 'important' | 'maintenance';
  is_pinned: boolean;
  view_count: number;
  created_at: string;
}

interface NoticeScreenProps {
  navigation: any;
}

const NoticeScreen: React.FC<NoticeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useModernTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.9), 1.3);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // 공지사항 목록 조회
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const res = await apiClient.get('/notices');
      return res.data?.data?.notices || [];
    },
    staleTime: 5 * 60 * 1000, // 5분 캐싱
  });

  // 공지사항 상세 조회
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['notice', selectedNotice?.notice_id],
    queryFn: async () => {
      if (!selectedNotice?.notice_id) return null;
      const res = await apiClient.get(`/notices/${selectedNotice.notice_id}`);
      return res.data?.data;
    },
    enabled: !!selectedNotice?.notice_id,
  });

  const colors = useMemo(() => ({
    bg: isDark ? theme.bg.primary : '#FFFFFF',
    headerBg: isDark ? theme.bg.secondary : '#FFFFFF',
    card: isDark ? theme.bg.secondary : '#F8F9FA',
    text: isDark ? theme.colors.text.primary : '#1A1A1A',
    textSecondary: isDark ? theme.colors.text.secondary : '#666666',
    border: isDark ? theme.colors.border : '#E5E5E5',
    accent: '#667EEA',
    important: '#FF6B6B',
    maintenance: '#FF9500',
  }), [isDark, theme]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }, []);

  const getTypeIcon = useCallback((type: string, isPinned: boolean) => {
    if (isPinned) return { name: 'pin', color: colors.accent };
    if (type === 'important') return { name: 'alert-circle', color: colors.important };
    if (type === 'maintenance') return { name: 'construct', color: colors.maintenance };
    return { name: 'document-text-outline', color: colors.textSecondary };
  }, [colors]);

  const renderNoticeItem = useCallback(({ item }: { item: Notice }) => {
    const icon = getTypeIcon(item.type, item.is_pinned);
    return (
      <TouchableOpacity
        style={[styles.noticeItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setSelectedNotice(item)}
        activeOpacity={0.7}
        accessibilityLabel={`공지사항: ${item.title}`}
      >
        <View style={styles.noticeIcon}>
          <Icon name={icon.name} size={20 * scale} color={icon.color} />
        </View>
        <View style={styles.noticeContent}>
          <View style={styles.noticeHeader}>
            {item.is_pinned && (
              <View style={[styles.badge, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.accent, fontSize: 10 * scale }]}>고정</Text>
              </View>
            )}
            {item.type === 'important' && (
              <View style={[styles.badge, { backgroundColor: colors.important + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.important, fontSize: 10 * scale }]}>중요</Text>
              </View>
            )}
          </View>
          <Text style={[styles.noticeTitle, { color: colors.text, fontSize: 15 * scale }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.noticeDate, { color: colors.textSecondary, fontSize: 12 * scale }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18 * scale} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  }, [colors, scale, formatDate, getTypeIcon]);

  // 상세 보기
  if (selectedNotice) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.headerBg} />
        <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedNotice(null)} style={styles.backButton}>
            <Icon name="arrow-back" size={24 * scale} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: 18 * scale }]}>공지사항</Text>
          <View style={styles.placeholder} />
        </View>

        {detailLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.detailContent}>
            <Text style={[styles.detailTitle, { color: colors.text, fontSize: 18 * scale }]}>
              {detailData?.title || selectedNotice.title}
            </Text>
            <Text style={[styles.detailDate, { color: colors.textSecondary, fontSize: 13 * scale }]}>
              {new Date(detailData?.created_at || selectedNotice.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.detailBody, { color: colors.text, fontSize: 15 * scale, lineHeight: 24 * scale }]}>
              {detailData?.content || '내용을 불러오는 중...'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.headerBg} />

      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24 * scale} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 18 * scale }]}>공지사항</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={data || []}
        renderItem={renderNoticeItem}
        keyExtractor={(item) => item.notice_id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="megaphone-outline" size={48 * scale} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: 15 * scale }]}>
                등록된 공지사항이 없습니다.
              </Text>
            </View>
          )
        }
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
  listContainer: { padding: 16 },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  noticeIcon: { marginRight: 12 },
  noticeContent: { flex: 1 },
  noticeHeader: { flexDirection: 'row', marginBottom: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 },
  badgeText: { fontFamily: 'Pretendard-SemiBold' },
  noticeTitle: { fontFamily: 'Pretendard-Medium', marginBottom: 4 },
  noticeDate: {},
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12 },
  detailContent: { padding: 20 },
  detailTitle: { fontFamily: 'Pretendard-Bold', marginBottom: 8 },
  detailDate: { marginBottom: 16 },
  divider: { height: 1, marginBottom: 20 },
  detailBody: {},
});

export default NoticeScreen;
