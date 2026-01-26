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
  GestureResponderEvent,
  ViewStyle,
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

interface AnswerItem {
  id: number;
  content: string;
  likeCount: number;
  isMine?: boolean;
  createdAt: string;
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

  // 질문 상세 모달 상태
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState<QAItem | null>(null);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [showAnswerSuccess, setShowAnswerSuccess] = useState(false);

  // 수정/삭제 상태
  const [editingQuestion, setEditingQuestion] = useState<QAItem | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<AnswerItem | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editAnswerText, setEditAnswerText] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'question' | 'answer'; id: number } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastFadeAnim = useRef(new Animated.Value(0)).current;
  const answerFadeAnim = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

  // 질문 상세 및 답변 목록 로드
  const loadQuestionDetail = useCallback(async (question: QAItem) => {
    try {
      setAnswersLoading(true);
      setDetailQuestion(question);
      setShowDetailModal(true);

      const response = await apiClient.get(
        `/review/anonymous-qa/${question.id}/answers`
      );

      if (response.data.status === 'success') {
        setAnswers(response.data.data.answers || []);
        // 질문 정보도 최신으로 업데이트
        if (response.data.data.question) {
          setDetailQuestion(response.data.data.question);
        }
      }
    } catch {
      // 에러 시 기존 질문 정보 유지
    } finally {
      setAnswersLoading(false);
    }
  }, []);

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

        // 성공 메시지 표시
        setShowSuccessMessage(true);
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setShowSuccessMessage(false));
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
        const answeredQuestion = selectedQuestion;
        setAnswerText('');
        setSelectedQuestion(null);
        loadPreview(false);
        if (showFullScreen) loadFullData(true);

        // 성공 메시지 표시
        setShowAnswerSuccess(true);
        Animated.sequence([
          Animated.timing(answerFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(answerFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setShowAnswerSuccess(false));

        // 상세 모달이 열려있으면 답변 목록 새로고침
        if (showDetailModal && detailQuestion?.id === answeredQuestion.id) {
          loadQuestionDetail(answeredQuestion);
        }
      }
    } catch {
      Alert.alert('오류', '답변 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedQuestion, answerText, loadPreview, loadFullData, showFullScreen, answerFadeAnim, showDetailModal, detailQuestion, loadQuestionDetail]);

  // 토스트 메시지 표시
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    Animated.sequence([
      Animated.timing(toastFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMessage(''));
  }, [toastFadeAnim]);

  // 질문 수정
  const updateQuestion = useCallback(async () => {
    if (!editingQuestion || !editQuestionText.trim()) return;

    try {
      setSubmitting(true);
      const sanitized = sanitizeText(editQuestionText.trim(), 200);

      const response = await apiClient.put(
        `/review/anonymous-qa/question/${editingQuestion.id}`,
        { question: sanitized }
      );

      if (response.data.status === 'success') {
        setEditingQuestion(null);
        setEditQuestionText('');
        loadPreview(false);
        if (showFullScreen) loadFullData(true);
        if (showDetailModal && detailQuestion?.id === editingQuestion.id) {
          setDetailQuestion({ ...detailQuestion, question: sanitized });
        }
        showToast('질문이 수정되었습니다');
      }
    } catch {
      showToast('질문 수정에 실패했습니다', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [editingQuestion, editQuestionText, loadPreview, loadFullData, showFullScreen, showDetailModal, detailQuestion, showToast]);

  // 질문 삭제 확인 모달 열기
  const confirmDeleteQuestion = useCallback((questionId: number) => {
    setDeleteConfirm({ type: 'question', id: questionId });
  }, []);

  // 질문 삭제 실행
  const executeDeleteQuestion = useCallback(async (questionId: number) => {
    try {
      const response = await apiClient.delete(`/review/anonymous-qa/question/${questionId}`);
      if (response.data.status === 'success') {
        setDeleteConfirm(null);
        loadPreview(false);
        if (showFullScreen) loadFullData(true);
        if (showDetailModal) setShowDetailModal(false);
        showToast('질문이 삭제되었습니다');
      }
    } catch {
      setDeleteConfirm(null);
      showToast('질문 삭제에 실패했습니다', 'error');
    }
  }, [loadPreview, loadFullData, showFullScreen, showDetailModal, showToast]);

  // 답변 수정
  const updateAnswer = useCallback(async () => {
    if (!editingAnswer || !editAnswerText.trim()) return;

    try {
      setSubmitting(true);
      const sanitized = sanitizeText(editAnswerText.trim(), 500);

      const response = await apiClient.put(
        `/review/anonymous-qa/answer/${editingAnswer.id}`,
        { content: sanitized }
      );

      if (response.data.status === 'success') {
        setEditingAnswer(null);
        setEditAnswerText('');
        if (detailQuestion) loadQuestionDetail(detailQuestion);
        showToast('답변이 수정되었습니다');
      }
    } catch {
      showToast('답변 수정에 실패했습니다', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [editingAnswer, editAnswerText, detailQuestion, loadQuestionDetail, showToast]);

  // 답변 삭제 확인 모달 열기
  const confirmDeleteAnswer = useCallback((answerId: number) => {
    setDeleteConfirm({ type: 'answer', id: answerId });
  }, []);

  // 답변 삭제 실행
  const executeDeleteAnswer = useCallback(async (answerId: number) => {
    try {
      const response = await apiClient.delete(`/review/anonymous-qa/answer/${answerId}`);
      if (response.data.status === 'success') {
        setDeleteConfirm(null);
        if (detailQuestion) loadQuestionDetail(detailQuestion);
        showToast('답변이 삭제되었습니다');
      }
    } catch {
      setDeleteConfirm(null);
      showToast('답변 삭제에 실패했습니다', 'error');
    }
  }, [detailQuestion, loadQuestionDetail, showToast]);

  // 좋아요 (낙관적 업데이트로 깜빡임 방지)
  const handleLike = useCallback(async (questionId: number) => {
    // 낙관적 업데이트: 즉시 UI 반영
    const updateItem = (item: QAItem): QAItem => {
      if (item.id !== questionId) return item;
      return {
        ...item,
        isLiked: !item.isLiked,
        likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1,
      };
    };

    // 미리보기 데이터 낙관적 업데이트
    setPreviewData(prev => prev ? {
      ...prev,
      questions: prev.questions.map(updateItem),
    } : null);

    // 전체 데이터 낙관적 업데이트
    if (showFullScreen) {
      setFullData(prev => prev.map(updateItem));
    }

    try {
      await apiClient.post(`/review/anonymous-qa/${questionId}/like`);
      // 성공 시 캐시 업데이트
      if (previewData) {
        const updatedPreview = {
          ...previewData,
          questions: previewData.questions.map(updateItem),
        };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: updatedPreview,
          timestamp: Date.now()
        }));
      }
    } catch {
      // 실패 시 롤백
      setPreviewData(prev => prev ? {
        ...prev,
        questions: prev.questions.map(updateItem), // 다시 토글하여 원상복구
      } : null);
      if (showFullScreen) {
        setFullData(prev => prev.map(updateItem));
      }
    }
  }, [showFullScreen, previewData]);

  // 질문 카드 렌더링
  const renderQuestionCard = useCallback(({ item, isPreview = false }: { item: QAItem; isPreview?: boolean }) => (
    <TouchableOpacity
      style={[
        isPreview ? styles.previewCard : styles.fullCard,
        { backgroundColor: isDark ? colors.card : '#F8F9FA' }
      ]}
      onPress={() => loadQuestionDetail(item)}
      activeOpacity={0.8}
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
          backgroundColor: isDark ? colors.card : '#FFFFFF',
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
          onPress={(e: GestureResponderEvent) => {
            e.stopPropagation();
            handleLike(item.id);
          }}
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
          onPress={(e: GestureResponderEvent) => {
            e.stopPropagation();
            loadQuestionDetail(item);
          }}
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
          onPress={(e: GestureResponderEvent) => {
            e.stopPropagation();
            setSelectedQuestion(item);
          }}
        >
          <Text style={[styles.answerBtnText, { color: colors.primary }]}>
            답변하기
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [isDark, colors, scale, styles, handleLike, loadQuestionDetail]);

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
    <Card>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <TwemojiImage emoji="💬" size={FONT_SIZES.h4 * scale} style={styles.titleIcon} />
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

      {/* 성공 메시지 - 조건부 렌더링으로 레이아웃 영향 방지 */}
      {showSuccessMessage && (
        <Animated.View style={[styles.successMessage as ViewStyle, { opacity: fadeAnim }]}>
          <TwemojiImage emoji="✅" size={FONT_SIZES.bodySmall * scale} style={styles.successIcon} />
          <Text style={styles.successText}>질문이 등록되었습니다!</Text>
        </Animated.View>
      )}

      {/* 인기 질문 미리보기 (3개) */}
      <FlatList<QAItem>
        data={previewData.questions}
        renderItem={({ item }: { item: QAItem }) => renderQuestionCard({ item, isPreview: true })}
        keyExtractor={(item: QAItem) => `preview-${item.id}`}
        extraData={previewData.questions.map(q => `${q.id}-${q.isLiked}-${q.likeCount}`).join(',')}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.previewContainer}
        snapToInterval={260 * scale + 12}
        decelerationRate="fast"
        removeClippedSubviews={false}
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

          {/* 토스트 메시지 */}
          {toastMessage !== '' && (
            <Animated.View style={[
              styles.toastBar as ViewStyle,
              {
                opacity: toastFadeAnim,
                backgroundColor: toastType === 'success' ? '#4CAF50' : '#FF5252'
              }
            ]}>
              <TwemojiImage emoji={toastType === 'success' ? '✅' : '❌'} size={FONT_SIZES.bodySmall * scale} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
          )}

          {/* 필터/정렬 헤더 */}
          {renderFullScreenHeader()}

          {/* 질문 목록 */}
          <FlatList<QAItem>
            data={fullData}
            renderItem={({ item }: { item: QAItem }) => renderQuestionCard({ item, isPreview: false })}
            keyExtractor={(item: QAItem) => `full-${item.id}`}
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
              <TwemojiImage emoji="💬" size={FONT_SIZES.h4 * scale} style={styles.modalIcon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>익명으로 질문하기</Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              커뮤니티에 궁금한 것을 물어보세요
            </Text>

            <TextInput
              style={[styles.questionInput, {
                backgroundColor: isDark ? colors.card : '#F5F5F5',
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
              <TwemojiImage emoji="💭" size={FONT_SIZES.h4 * scale} style={styles.modalIcon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>답변하기</Text>
            </View>

            {selectedQuestion && (
              <View style={[styles.originalQuestion, {
                backgroundColor: isDark ? colors.card : '#F5F5F5'
              }]}>
                <Text style={[styles.originalQuestionText, { color: colors.text }]}>
                  "{selectedQuestion.question}"
                </Text>
              </View>
            )}

            <TextInput
              style={[styles.answerInput, {
                backgroundColor: isDark ? colors.card : '#F5F5F5',
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

      {/* 질문 상세 모달 - 답변 목록 */}
      <Modal visible={showDetailModal} animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.fullScreenContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          {/* 헤더바 */}
          <View style={[styles.fullScreenTopBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← 닫기</Text>
            </TouchableOpacity>
            <Text style={[styles.fullScreenTitle, { color: colors.text }]}>질문 상세</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* 답변 성공 메시지 */}
          {showAnswerSuccess && (
            <Animated.View style={[styles.answerSuccessBar as ViewStyle, { opacity: answerFadeAnim }]}>
              <TwemojiImage emoji="✅" size={FONT_SIZES.bodySmall * scale} />
              <Text style={styles.answerSuccessText}>답변이 등록되었습니다!</Text>
            </Animated.View>
          )}

          {/* 토스트 메시지 */}
          {toastMessage !== '' && (
            <Animated.View style={[
              styles.toastBar as ViewStyle,
              {
                opacity: toastFadeAnim,
                backgroundColor: toastType === 'success' ? '#4CAF50' : '#FF5252'
              }
            ]}>
              <TwemojiImage emoji={toastType === 'success' ? '✅' : '❌'} size={FONT_SIZES.bodySmall * scale} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
          )}

          {/* 질문 내용 */}
          {detailQuestion && (
            <View style={[styles.detailQuestionCard, { backgroundColor: isDark ? colors.card : '#F8F9FA' }]}>
              <View style={styles.questionHeader}>
                <TwemojiImage emoji="💬" size={FONT_SIZES.bodyLarge * scale} />
                <Text style={[styles.questionLabel, { color: colors.textSecondary }]}>
                  익명의 질문
                </Text>
                {detailQuestion.isMine && (
                  <View style={[styles.mineBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.mineBadgeText, { color: colors.primary }]}>내 질문</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.detailQuestionText, { color: colors.text }]}>
                {detailQuestion.question}
              </Text>
              <View style={styles.detailStatsRow}>
                <View style={styles.detailStats}>
                  <View style={styles.detailStatItem}>
                    <TwemojiImage emoji={detailQuestion.isLiked ? '❤️' : '🤍'} size={FONT_SIZES.bodySmall * scale} />
                    <Text style={[styles.detailStatText, { color: colors.textSecondary }]}>
                      {detailQuestion.likeCount}
                    </Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <TwemojiImage emoji="💭" size={FONT_SIZES.bodySmall * scale} />
                    <Text style={[styles.detailStatText, { color: colors.textSecondary }]}>
                      {detailQuestion.answerCount}개 답변
                    </Text>
                  </View>
                </View>
                {detailQuestion.isMine && (
                  <View style={styles.editDeleteRow}>
                    <TouchableOpacity
                      style={[styles.editBtn, { backgroundColor: colors.primary + '15' }]}
                      onPress={() => {
                        setEditQuestionText(detailQuestion.question);
                        setEditingQuestion(detailQuestion);
                      }}
                    >
                      <Text style={[styles.editBtnText, { color: colors.primary }]}>수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteBtn, { backgroundColor: '#FF5252' + '15' }]}
                      onPress={() => confirmDeleteQuestion(detailQuestion.id)}
                    >
                      <Text style={[styles.deleteBtnText, { color: '#FF5252' }]}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 답변하기 버튼 */}
          <TouchableOpacity
            style={[styles.writeAnswerBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (detailQuestion) setSelectedQuestion(detailQuestion);
            }}
          >
            <TwemojiImage emoji="✏️" size={FONT_SIZES.body * scale} />
            <Text style={styles.writeAnswerBtnText}>답변 작성하기</Text>
          </TouchableOpacity>

          {/* 답변 목록 */}
          <View style={styles.answersSection}>
            <Text style={[styles.answersSectionTitle, { color: colors.text }]}>
              답변 {answers.length}개
            </Text>
          </View>

          {answersLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : answers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <TwemojiImage emoji="📭" size={48 * scale} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                아직 답변이 없습니다
              </Text>
              <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                첫 번째로 답변을 남겨보세요!
              </Text>
            </View>
          ) : (
            <FlatList<AnswerItem>
              data={answers}
              keyExtractor={(item: AnswerItem) => `answer-${item.id}`}
              contentContainerStyle={styles.answersListContent}
              renderItem={({ item, index }: { item: AnswerItem; index: number }) => (
                <View style={[
                  styles.answerCard,
                  { backgroundColor: isDark ? colors.card : '#FFFFFF' }
                ]}>
                  <View style={styles.answerHeader}>
                    <TwemojiImage emoji="💭" size={FONT_SIZES.bodySmall * scale} />
                    <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>
                      익명의 답변 #{index + 1}
                    </Text>
                    {item.isMine && (
                      <View style={[styles.mineBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.mineBadgeText, { color: colors.primary }]}>내 답변</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.answerContent, { color: colors.text }]}>
                    {item.content}
                  </Text>
                  <View style={styles.answerFooter}>
                    <View style={styles.answerLikes}>
                      <TwemojiImage emoji="❤️" size={FONT_SIZES.tiny * scale} />
                      <Text style={[styles.answerLikeCount, { color: colors.textSecondary }]}>
                        {item.likeCount}
                      </Text>
                    </View>
                    {item.isMine && (
                      <View style={styles.editDeleteRow}>
                        <TouchableOpacity
                          style={[styles.editBtnSmall, { backgroundColor: colors.primary + '15' }]}
                          onPress={() => {
                            setEditAnswerText(item.content);
                            setEditingAnswer(item);
                          }}
                        >
                          <Text style={[styles.editBtnTextSmall, { color: colors.primary }]}>수정</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.deleteBtnSmall, { backgroundColor: '#FF5252' + '15' }]}
                          onPress={() => confirmDeleteAnswer(item.id)}
                        >
                          <Text style={[styles.deleteBtnTextSmall, { color: '#FF5252' }]}>삭제</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* 질문 수정 모달 */}
      <Modal visible={!!editingQuestion} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <TwemojiImage emoji="✏️" size={FONT_SIZES.h4 * scale} style={styles.modalIcon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>질문 수정</Text>
            </View>

            <TextInput
              style={[styles.questionInput, {
                backgroundColor: isDark ? colors.card : '#F5F5F5',
                color: colors.text
              }]}
              placeholder="질문을 수정하세요"
              placeholderTextColor={colors.textSecondary}
              value={editQuestionText}
              onChangeText={setEditQuestionText}
              multiline
              maxLength={200}
              autoFocus
            />

            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {editQuestionText.length}/200
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => { setEditingQuestion(null); setEditQuestionText(''); }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {
                  backgroundColor: editQuestionText.trim() ? colors.primary : colors.border
                }]}
                onPress={updateQuestion}
                disabled={!editQuestionText.trim() || submitting}
              >
                <Text style={[styles.modalButtonText, {
                  color: editQuestionText.trim() ? '#FFFFFF' : colors.textSecondary
                }]}>
                  {submitting ? '수정 중...' : '수정 완료'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 답변 수정 모달 */}
      <Modal visible={!!editingAnswer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <TwemojiImage emoji="✏️" size={FONT_SIZES.h4 * scale} style={styles.modalIcon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>답변 수정</Text>
            </View>

            <TextInput
              style={[styles.answerInput, {
                backgroundColor: isDark ? colors.card : '#F5F5F5',
                color: colors.text
              }]}
              placeholder="답변을 수정하세요"
              placeholderTextColor={colors.textSecondary}
              value={editAnswerText}
              onChangeText={setEditAnswerText}
              multiline
              maxLength={500}
              autoFocus
            />

            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {editAnswerText.length}/500
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => { setEditingAnswer(null); setEditAnswerText(''); }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {
                  backgroundColor: editAnswerText.trim() ? colors.primary : colors.border
                }]}
                onPress={updateAnswer}
                disabled={!editAnswerText.trim() || submitting}
              >
                <Text style={[styles.modalButtonText, {
                  color: editAnswerText.trim() ? '#FFFFFF' : colors.textSecondary
                }]}>
                  {submitting ? '수정 중...' : '수정 완료'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteConfirmModal, { backgroundColor: colors.card }]}>
            <View style={styles.deleteConfirmIcon}>
              <TwemojiImage emoji="🗑️" size={48 * scale} />
            </View>
            <Text style={[styles.deleteConfirmTitle, { color: colors.text }]}>
              {deleteConfirm?.type === 'question' ? '질문 삭제' : '답변 삭제'}
            </Text>
            <Text style={[styles.deleteConfirmMessage, { color: colors.textSecondary }]}>
              {deleteConfirm?.type === 'question'
                ? '정말 삭제하시겠습니까?\n모든 답변도 함께 삭제됩니다.'
                : '정말 삭제하시겠습니까?'}
            </Text>
            <View style={styles.deleteConfirmActions}>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, { backgroundColor: colors.border }]}
                onPress={() => setDeleteConfirm(null)}
              >
                <Text style={[styles.deleteConfirmBtnText, { color: colors.text }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, { backgroundColor: '#FF5252' }]}
                onPress={() => {
                  if (deleteConfirm?.type === 'question') {
                    executeDeleteQuestion(deleteConfirm.id);
                  } else if (deleteConfirm?.type === 'answer') {
                    executeDeleteAnswer(deleteConfirm.id);
                  }
                }}
              >
                <Text style={[styles.deleteConfirmBtnText, { color: '#FFFFFF' }]}>삭제</Text>
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
    fontSize: FONT_SIZES.h4 * scale,
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Medium',
  },
  mineBadge: {
    paddingHorizontal: 8 * scale,
    paddingVertical: 2 * scale,
    borderRadius: 8 * scale,
    marginLeft: 'auto',
  },
  mineBadgeText: {
    fontSize: FONT_SIZES.tiny * scale,
    fontFamily: 'Pretendard-Bold',
  },
  questionText: {
    fontSize: FONT_SIZES.body * scale,
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-SemiBold',
  },
  answerBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 12 * scale,
  },
  answerBtnText: {
    fontSize: FONT_SIZES.caption * scale,
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-SemiBold',
  },
  fullScreenTitle: {
    fontSize: FONT_SIZES.h4 * scale,
    fontFamily: 'Pretendard-Bold',
  },
  askSmallBtn: {
    paddingHorizontal: 20 * scale,
    paddingVertical: 8 * scale,
    borderRadius: 16 * scale,
    minWidth: 60 * scale,
  },
  askSmallBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.bodySmall * scale,
    fontFamily: 'Pretendard-Bold',
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
    backgroundColor: isDark ? colors.card : '#F0F0F0',
  },
  filterTabText: {
    fontSize: FONT_SIZES.bodySmall * scale,
    fontFamily: 'Pretendard-SemiBold',
  },
  sortButton: {
    paddingHorizontal: 12 * scale,
    paddingVertical: 8 * scale,
    borderRadius: 8 * scale,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: FONT_SIZES.caption * scale,
    fontFamily: 'Pretendard-Medium',
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
    fontSize: FONT_SIZES.h4 * scale,
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-SemiBold',
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

  // 질문 상세 모달
  detailQuestionCard: {
    margin: 16 * scale,
    padding: 16 * scale,
    borderRadius: 16 * scale,
  },
  detailQuestionText: {
    fontSize: FONT_SIZES.bodyLarge * scale,
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 26 * scale,
    marginBottom: 16 * scale,
  },
  detailStats: {
    flexDirection: 'row',
    gap: 20 * scale,
  },
  detailStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * scale,
  },
  detailStatText: {
    fontSize: FONT_SIZES.bodySmall * scale,
    fontFamily: 'Pretendard-Medium',
  },
  writeAnswerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16 * scale,
    marginBottom: 16 * scale,
    padding: 14 * scale,
    borderRadius: 12 * scale,
    gap: 8 * scale,
  },
  writeAnswerBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.body * scale,
    fontFamily: 'Pretendard-Bold',
  },
  answersSection: {
    paddingHorizontal: 16 * scale,
    paddingVertical: 12 * scale,
    borderTopWidth: 1,
    borderTopColor: isDark ? colors.border : '#E0E0E0',
  },
  answersSectionTitle: {
    fontSize: FONT_SIZES.body * scale,
    fontFamily: 'Pretendard-Bold',
  },
  answersListContent: {
    paddingHorizontal: 16 * scale,
    paddingBottom: 20 * scale,
  },
  answerCard: {
    padding: 16 * scale,
    borderRadius: 12 * scale,
    marginBottom: 12 * scale,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * scale,
    marginBottom: 12 * scale,
  },
  answerLabel: {
    fontSize: FONT_SIZES.caption * scale,
    fontFamily: 'Pretendard-Medium',
  },
  answerContent: {
    fontSize: FONT_SIZES.body * scale,
    lineHeight: 22 * scale,
    marginBottom: 12 * scale,
  },
  answerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  answerLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 * scale,
  },
  answerLikeCount: {
    fontSize: FONT_SIZES.caption * scale,
  },
  answerSuccessBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12 * scale,
    gap: 8 * scale,
  },
  answerSuccessText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.bodySmall * scale,
    fontFamily: 'Pretendard-SemiBold',
  },
  emptySubText: {
    fontSize: FONT_SIZES.bodySmall * scale,
    marginTop: 8 * scale,
  },
  // 수정/삭제 버튼
  detailStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editDeleteRow: {
    flexDirection: 'row',
    gap: 8 * scale,
  },
  editBtn: {
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 8 * scale,
  },
  editBtnText: {
    fontSize: FONT_SIZES.caption * scale,
    fontFamily: 'Pretendard-SemiBold',
  },
  deleteBtn: {
    paddingHorizontal: 12 * scale,
    paddingVertical: 6 * scale,
    borderRadius: 8 * scale,
  },
  deleteBtnText: {
    fontSize: FONT_SIZES.caption * scale,
    fontFamily: 'Pretendard-SemiBold',
  },
  editBtnSmall: {
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 6 * scale,
  },
  editBtnTextSmall: {
    fontSize: FONT_SIZES.tiny * scale,
    fontFamily: 'Pretendard-SemiBold',
  },
  deleteBtnSmall: {
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 6 * scale,
  },
  deleteBtnTextSmall: {
    fontSize: FONT_SIZES.tiny * scale,
    fontFamily: 'Pretendard-SemiBold',
  },
  // 토스트
  toastBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12 * scale,
    gap: 8 * scale,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.bodySmall * scale,
    fontFamily: 'Pretendard-SemiBold',
  },
  // 삭제 확인 모달
  deleteConfirmModal: {
    borderRadius: 24 * scale,
    padding: 28 * scale,
    alignItems: 'center',
    marginHorizontal: 20 * scale,
  },
  deleteConfirmIcon: {
    marginBottom: 16 * scale,
  },
  deleteConfirmTitle: {
    fontSize: FONT_SIZES.h4 * scale,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 12 * scale,
  },
  deleteConfirmMessage: {
    fontSize: FONT_SIZES.body * scale,
    textAlign: 'center',
    lineHeight: 22 * scale,
    marginBottom: 24 * scale,
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    gap: 12 * scale,
    width: '100%',
  },
  deleteConfirmBtn: {
    flex: 1,
    padding: 14 * scale,
    borderRadius: 12 * scale,
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    fontSize: FONT_SIZES.body * scale,
    fontFamily: 'Pretendard-SemiBold',
  },
});
