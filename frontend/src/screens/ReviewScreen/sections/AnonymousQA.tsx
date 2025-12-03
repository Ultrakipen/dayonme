import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import apiClient from '../../../services/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitizeText } from '../../../utils/sanitize';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

const CACHE_KEY = '@anonymous_qa_cache';
const CACHE_EXPIRY = 3 * 60 * 1000; // 3분
const PREVIEW_LIMIT = 3;
const PAGE_SIZE = 15;

interface QAItem {
  id: number;
  question: string;
  answerCount: number;
  likeCount: number;
  createdAt: string;
  isLiked?: boolean;
  isMine?: boolean;
  topAnswer?: {
    content: string;
    likeCount: number;
  };
}

interface QAData {
  questions: QAItem[];
  totalCount: number;
}

type FilterType = 'all' | 'mine';
type SortType = 'latest' | 'popular';

export const AnonymousQA: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const insets = useSafeAreaInsets();
  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale, isDark, colors), [scale, isDark, colors]);

  // 미리보기 데이터
  const [previewData, setPreviewData] = useState<QAData | null>(null);
  const [loading, setLoading] = useState(true);

  // 전체화면 상태
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [fullData, setFullData] = useState<QAItem[]>([]);
  const [fullLoading, setFullLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // 필터/정렬
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('popular');

  // 모달 상태
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QAItem | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);

  // 캐시 로드
  const loadFromCache = useCallback(async (): Promise<QAData | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return cachedData;
        }
      }
    } catch {
      // 캐시 로드 실패 무시
    }
    return null;
  }, []);

  // 미리보기 데이터 로드 (인기순 3개)
  const loadPreview = useCallback(async (useCache = true) => {
    try {
      setLoading(true);

      if (useCache) {
        const cachedData = await loadFromCache();
        if (cachedData) {
          setPreviewData(cachedData);
          setLoading(false);
          return;
        }
      }

      const response = await apiClient.get(
        `/review/anonymous-qa?limit=${PREVIEW_LIMIT}&sort=popular`
      );

      if (response.data.status === 'success') {
        const responseData = response.data.data;
        setPreviewData(responseData);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: responseData,
          timestamp: Date.now()
        }));
      }
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  }, [loadFromCache]);

  // 전체 데이터 로드
  const loadFullData = useCallback(async (reset = false) => {
    if (fullLoading && !reset) return;

    try {
      if (reset) {
        setFullLoading(true);
        offsetRef.current = 0;
      }

      const response = await apiClient.get(
        `/review/anonymous-qa?limit=${PAGE_SIZE}&offset=${offsetRef.current}&sort=${sort}&filter=${filter}`
      );

      if (response.data.status === 'success') {
        const { questions, totalCount: total } = response.data.data;

        if (reset) {
          setFullData(questions);
        } else {
          setFullData(prev => [...prev, ...questions]);
        }

        setTotalCount(total);
        setHasMore(offsetRef.current + questions.length < total);
        offsetRef.current += questions.length;
      }
    } catch {
      // 에러 무시
    } finally {
      setFullLoading(false);
      setRefreshing(false);
    }
  }, [sort, filter, fullLoading]);

  // 더 로드
  const loadMore = useCallback(() => {
    if (!fullLoading && hasMore) {
      loadFullData(false);
    }
  }, [fullLoading, hasMore, loadFullData]);

  // 새로고침
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFullData(true);
  }, [loadFullData]);

  // 필터/정렬 변경 시 리셋
  useEffect(() => {
    if (showFullScreen) {
      loadFullData(true);
    }
  }, [filter, sort, showFullScreen]);

  // 초기 로드
  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  // 질문 등록
  const submitQuestion = useCallback(async () => {
    if (!newQuestion.trim()) return;

    try {
      setSubmitting(true);
      const sanitized = sanitizeText(newQuestion.trim(), 200);

      const response = await apiClient.post('/review/anonymous-qa/question', {
        question: sanitized
      });

      if (response.data.status === 'success') {
        setNewQuestion('');
        setShowAskModal(false);
        loadPreview(false);
        if (showFullScreen) loadFullData(true);

        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }
    } catch {
      Alert.alert('오류', '질문 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [newQuestion, loadPreview, loadFullData, showFullScreen, fadeAnim]);

  // 답변 등록
  const submitAnswer = useCallback(async () => {
    if (!selectedQuestion || !answerText.trim()) return;

    try {
      setSubmitting(true);
      const sanitized = sanitizeText(answerText.trim(), 500);

      const response = await apiClient.post(
        `/review/anonymous-qa/${selectedQuestion.id}/answer`,
        { content: sanitized }
      );

      if (response.data.status === 'success') {
        setAnswerText('');
        setSelectedQuestion(null);
        loadPreview(false);
        if (showFullScreen) loadFullData(true);
      }
    } catch {
      Alert.alert('오류', '답변 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedQuestion, answerText, loadPreview, loadFullData, showFullScreen]);

  // 좋아요
  const handleLike = useCallback(async (questionId: number) => {
    try {
      await apiClient.post(`/review/anonymous-qa/${questionId}/like`);
      loadPreview(false);
      if (showFullScreen) loadFullData(true);
    } catch {
      // 에러 무시
    }
  }, [loadPreview, loadFullData, showFullScreen]);

  // 질문 카드 렌더링
  const renderQuestionCard = useCallback(({ item, isPreview = false }: { item: QAItem; isPreview?: boolean }) => (
    <View
      style={[
        isPreview ? styles.previewCard : styles.fullCard,
        { backgroundColor: isDark ? colors.surface : '#F8F9FA' }
      ]}
    >
      <View style={styles.questionHeader}>
        <TwemojiImage emoji="💬" size={FONT_SIZES.bodyLarge * scale} />
        <Text style={[styles.questionLabel, { color: colors.textSecondary }]}>
          익명의 질문
        </Text>
        {item.isMine && (
          <View style={[styles.mineBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.mineBadgeText, { color: colors.primary }]}>내 질문</Text>
          </View>
        )}
      </View>

      <Text
        style={[styles.questionText, { color: colors.text }]}
        numberOfLines={isPreview ? 2 : undefined}
      >
        {item.question}
      </Text>

      {item.topAnswer && (
        <View style={[styles.topAnswer, {
          backgroundColor: isDark ? colors.border : '#FFFFFF',
          borderLeftColor: colors.primary
        }]}>
          <Text style={[styles.topAnswerLabel, { color: colors.primary }]}>
            인기 답변
          </Text>
          <Text
            style={[styles.topAnswerText, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.topAnswer.content}
          </Text>
        </View>
      )}

      <View style={styles.questionActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
          accessible
          accessibilityLabel={`좋아요 ${item.likeCount}개`}
        >
          <TwemojiImage emoji={item.isLiked ? '❤️' : '🤍'} size={FONT_SIZES.bodySmall * scale} />
          <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
            {item.likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setSelectedQuestion(item)}
          accessible
          accessibilityLabel={`답변 ${item.answerCount}개`}
        >
          <TwemojiImage emoji="💭" size={FONT_SIZES.bodySmall * scale} />
          <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
            {item.answerCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.answerBtn, { backgroundColor: colors.primary + '15' }]}
          onPress={() => setSelectedQuestion(item)}
        >
          <Text style={[styles.answerBtnText, { color: colors.primary }]}>
            답변하기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [isDark, colors, scale, styles, handleLike]);

  // 전체화면 헤더
  const renderFullScreenHeader = () => (
    <View style={styles.fullScreenHeader}>
      {/* 탭 필터 */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === 'all' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            전체
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'mine' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setFilter('mine')}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === 'mine' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            내 질문
          </Text>
        </TouchableOpacity>
      </View>

      {/* 정렬 */}
      <TouchableOpacity
        style={[styles.sortButton, { borderColor: colors.border }]}
        onPress={() => setSort(s => s === 'latest' ? 'popular' : 'latest')}
      >
        <Text style={[styles.sortButtonText, { color: colors.text }]}>
          {sort === 'latest' ? '최신순' : '인기순'} ▼
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading || !previewData) return null;

  return (
    <Card accessible accessibilityLabel="익명 Q&A">
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <TwemojiImage emoji="💬" size={FONT_SIZES.h3 * scale} style={styles.titleIcon} />
            <Text style={[styles.title, { color: colors.text }]}>익명 Q&A</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            익명으로 질문하고 답변해보세요
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.viewAllBtn, { borderColor: colors.border }]}
            onPress={() => setShowFullScreen(true)}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>전체보기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 성공 메시지 */}
      <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
        <TwemojiImage emoji="✅" size={FONT_SIZES.bodySmall * scale} style={styles.successIcon} />
        <Text style={styles.successText}>질문이 등록되었습니다!</Text>
      </Animated.View>

      {/* 인기 질문 미리보기 (3개) */}
      <FlatList
        data={previewData.questions}
        renderItem={({ item }) => renderQuestionCard({ item, isPreview: true })}
        keyExtractor={(item) => `preview-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.previewContainer}
        snapToInterval={260 * scale + 12}
        decelerationRate="fast"
      />

      {/* 질문하기 버튼 */}
      <TouchableOpacity
        style={[styles.askMainBtn, { backgroundColor: colors.primary }]}
        onPress={() => setShowAskModal(true)}
        accessible
        accessibilityLabel="익명으로 질문하기"
      >
        <TwemojiImage emoji="✏️" size={FONT_SIZES.body * scale} style={styles.askIcon} />
        <Text style={styles.askMainBtnText}>익명으로 질문하기</Text>
      </TouchableOpacity>

      {/* 전체보기 모달 */}
      <Modal visible={showFullScreen} animationType="slide" onRequestClose={() => setShowFullScreen(false)}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.fullScreenContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          {/* 전체화면 헤더바 */}
          <View style={[styles.fullScreenTopBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowFullScreen(false)} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← 닫기</Text>
            </TouchableOpacity>
            <Text style={[styles.fullScreenTitle, { color: colors.text }]}>익명 Q&A</Text>
            <TouchableOpacity
              style={[styles.askSmallBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAskModal(true)}
            >
              <Text style={styles.askSmallBtnText}>질문</Text>
            </TouchableOpacity>
          </View>

          {/* 필터/정렬 헤더 */}
          {renderFullScreenHeader()}

          {/* 질문 목록 */}
          <FlatList
            data={fullData}
            renderItem={({ item }) => renderQuestionCard({ item, isPreview: false })}
            keyExtractor={(item) => `full-${item.id}`}
            contentContainerStyle={styles.fullListContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              fullLoading ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <TwemojiImage emoji="📭" size={48 * scale} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {filter === 'mine' ? '등록한 질문이 없습니다' : '질문이 없습니다'}
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              hasMore && fullData.length > 0 ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />

          {/* 총 개수 표시 */}
          <View style={[styles.totalCountBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 * scale }]}>
            <Text style={[styles.totalCountText, { color: colors.textSecondary }]}>
              총 {totalCount}개의 질문
            </Text>
          </View>
        </View>
      </Modal>

      {/* 질문 작성 모달 */}
      <Modal visible={showAskModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <TwemojiImage emoji="💬" size={FONT_SIZES.h3 * scale} style={styles.modalIcon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>익명으로 질문하기</Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              커뮤니티에 궁금한 것을 물어보세요
            </Text>

            <TextInput
              style={[styles.questionInput, {
                backgroundColor: isDark ? colors.surface : '#F5F5F5',
                color: colors.text
              }]}
              placeholder="예: 우울할 때 어떻게 극복하시나요?"
              placeholderTextColor={colors.textSecondary}
              value={newQuestion}
              onChangeText={setNewQuestion}
              multiline
              maxLength={200}
              autoFocus
            />

            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {newQuestion.length}/200
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => { setShowAskModal(false); setNewQuestion(''); }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {
                  backgroundColor: newQuestion.trim() ? colors.primary : colors.border
                }]}
                onPress={submitQuestion}
                disabled={!newQuestion.trim() || submitting}
              >
                <Text style={[styles.modalButtonText, {
                  color: newQuestion.trim() ? '#FFFFFF' : colors.textSecondary
                }]}>
                  {submitting ? '등록 중...' : '질문하기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 답변 작성 모달 */}
      <Modal visible={!!selectedQuestion} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <TwemojiImage emoji="💭" size={FONT_SIZES.h3 * scale} style={styles.modalIcon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>답변하기</Text>
            </View>

            {selectedQuestion && (
              <View style={[styles.originalQuestion, {
                backgroundColor: isDark ? colors.surface : '#F5F5F5'
              }]}>
                <Text style={[styles.originalQuestionText, { color: colors.text }]}>
                  "{selectedQuestion.question}"
                </Text>
              </View>
            )}

            <TextInput
              style={[styles.answerInput, {
                backgroundColor: isDark ? colors.surface : '#F5F5F5',
                color: colors.text
              }]}
              placeholder="당신의 경험을 나눠주세요..."
              placeholderTextColor={colors.textSecondary}
              value={answerText}
              onChangeText={setAnswerText}
              multiline
              maxLength={500}
              autoFocus
            />

            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {answerText.length}/500
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => { setSelectedQuestion(null); setAnswerText(''); }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {
                  backgroundColor: answerText.trim() ? colors.primary : colors.border
                }]}
                onPress={submitAnswer}
                disabled={!answerText.trim() || submitting}
              >
                <Text style={[styles.modalButtonText, {
                  color: answerText.trim() ? '#FFFFFF' : colors.textSecondary
                }]}>
                  {submitting ? '등록 중...' : '답변 등록'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
});

const createStyles = (scale: number, isDark: boolean, colors: any) => StyleSheet.create({
  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16 * scale,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8 * scale,
  },
  title: {
    fontSize: FONT_SIZES.h3 * scale,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FONT_SIZES.caption * scale,
    marginTop: 4 * scale,
  },
  viewAllBtn: {
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 16 * scale,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: FONT_SIZES.caption * scale,
    fontWeight: '600',
  },

  // 미리보기 컨테이너
  previewContainer: {
    paddingVertical: 4 * scale,
    gap: 12 * scale,
  },
  previewCard: {
    width: 260 * scale,
    padding: 16 * scale,
    borderRadius: 16 * scale,
  },
  fullCard: {
    padding: 16 * scale,
    borderRadius: 16 * scale,
    marginBottom: 12 * scale,
  },

  // 질문 카드
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
    marginBottom: 12 * scale,
  },
  questionLabel: {
    fontSize: FONT_SIZES.caption * scale,
    fontWeight: '500',
  },
  mineBadge: {
    paddingHorizontal: 8 * scale,
    paddingVertical: 2 * scale,
    borderRadius: 8 * scale,
    marginLeft: 'auto',
  },
  mineBadgeText: {
    fontSize: FONT_SIZES.tiny * scale,
    fontWeight: '700',
  },
  questionText: {
    fontSize: FONT_SIZES.body * scale,
    fontWeight: '600',
    lineHeight: 22 * scale,
    marginBottom: 12 * scale,
  },
  topAnswer: {
    padding: 12 * scale,
    borderRadius: 8 * scale,
    borderLeftWidth: 3 * scale,
    marginBottom: 12 * scale,
  },
  topAnswerLabel: {
    fontSize: FONT_SIZES.tiny * scale,
    fontWeight: '700',
    marginBottom: 4 * scale,
  },
  topAnswerText: {
    fontSize: FONT_SIZES.bodySmall * scale,
    lineHeight: 18 * scale,
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16 * scale,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * scale,
  },
  actionCount: {
    fontSize: FONT_SIZES.caption * scale,
    fontWeight: '600',
  },
  answerBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 12 * scale,
  },
  answerBtnText: {
    fontSize: FONT_SIZES.caption * scale,
    fontWeight: '600',
  },

  // 질문하기 버튼
  askMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14 * scale,
    borderRadius: 12 * scale,
    marginTop: 16 * scale,
    gap: 8 * scale,
  },
  askIcon: {
    marginRight: 4 * scale,
  },
  askMainBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.body * scale,
    fontWeight: '700',
  },

  // 성공 메시지
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12 * scale,
    borderRadius: 12 * scale,
    marginBottom: 12 * scale,
  },
  successIcon: {
    marginRight: 6 * scale,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.bodySmall * scale,
    fontWeight: '600',
  },

  // 전체화면
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16 * scale,
    paddingVertical: 12 * scale,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4 * scale,
  },
  backButtonText: {
    fontSize: FONT_SIZES.body * scale,
    fontWeight: '600',
  },
  fullScreenTitle: {
    fontSize: FONT_SIZES.h3 * scale,
    fontWeight: '700',
  },
  askSmallBtn: {
    paddingHorizontal: 14 * scale,
    paddingVertical: 8 * scale,
    borderRadius: 16 * scale,
  },
  askSmallBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.bodySmall * scale,
    fontWeight: '700',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16 * scale,
    paddingVertical: 12 * scale,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8 * scale,
  },
  filterTab: {
    paddingHorizontal: 16 * scale,
    paddingVertical: 8 * scale,
    borderRadius: 20 * scale,
    backgroundColor: isDark ? colors.surface : '#F0F0F0',
  },
  filterTabText: {
    fontSize: FONT_SIZES.bodySmall * scale,
    fontWeight: '600',
  },
  sortButton: {
    paddingHorizontal: 12 * scale,
    paddingVertical: 8 * scale,
    borderRadius: 8 * scale,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: FONT_SIZES.caption * scale,
    fontWeight: '500',
  },
  fullListContent: {
    paddingHorizontal: 16 * scale,
    paddingTop: 8 * scale,
    paddingBottom: 20 * scale,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60 * scale,
  },
  emptyText: {
    fontSize: FONT_SIZES.body * scale,
    marginTop: 16 * scale,
  },
  loadingMore: {
    paddingVertical: 20 * scale,
    alignItems: 'center',
  },
  totalCountBar: {
    paddingVertical: 12 * scale,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  totalCountText: {
    fontSize: FONT_SIZES.caption * scale,
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20 * scale,
  },
  modalContent: {
    borderRadius: 24 * scale,
    padding: 24 * scale,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4 * scale,
  },
  modalIcon: {
    marginRight: 8 * scale,
  },
  modalTitle: {
    fontSize: FONT_SIZES.h3 * scale,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.bodySmall * scale,
    marginBottom: 16 * scale,
  },
  questionInput: {
    padding: 16 * scale,
    borderRadius: 12 * scale,
    minHeight: 100 * scale,
    textAlignVertical: 'top',
    fontSize: FONT_SIZES.body * scale,
  },
  answerInput: {
    padding: 16 * scale,
    borderRadius: 12 * scale,
    minHeight: 120 * scale,
    textAlignVertical: 'top',
    fontSize: FONT_SIZES.body * scale,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 8 * scale,
    marginBottom: 16 * scale,
    fontSize: FONT_SIZES.tiny * scale,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12 * scale,
  },
  modalButton: {
    flex: 1,
    padding: 14 * scale,
    borderRadius: 12 * scale,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: FONT_SIZES.body * scale,
    fontWeight: '600',
  },
  originalQuestion: {
    padding: 16 * scale,
    borderRadius: 12 * scale,
    marginBottom: 16 * scale,
  },
  originalQuestionText: {
    fontSize: FONT_SIZES.body * scale,
    fontStyle: 'italic',
    lineHeight: 22 * scale,
  },
});
