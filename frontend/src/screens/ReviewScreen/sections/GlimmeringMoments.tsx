import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Animated } from 'react-native';
import reviewService from '../../../services/api/reviewService';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { Card } from '../../../components/common/Card';
import CustomAlert from '../../../components/ui/CustomAlert';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

interface Moment {
  id: number;
  content: string;
  emoji: string;
  created_at: string;
}

export const GlimmeringMoments: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [newContent, setNewContent] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('✨');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' as const });
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingMomentId, setDeletingMomentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emojis = ['✨', '💫', '🌸', '🌿', '🦋', '🔥', '☀️', '🧘'];

  const loadMoments = useCallback(async () => {
    try {
      setError(null);
      const response = await reviewService.getGlimmeringMoments(5, 0);
      setMoments(response.data.moments);
      setTotal(response.data.total);
    } catch (err) {
      setError('빛나는 순간을 불러오는데 실패했습니다');
      console.error('빛나는 순간 로드 실패:', err);
    }
  }, []);

  useEffect(() => {
    loadMoments();
  }, [loadMoments]);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    try {
      await reviewService.createGlimmeringMoment({
        content: newContent.trim(),
        emoji: selectedEmoji
      });
      setNewContent('');
      setShowAddModal(false);
      loadMoments();
    } catch (err) {
      console.error('빛나는 순간 추가 실패:', err);
    }
  };

  const handleEdit = (moment: Moment) => {
    setEditingMoment(moment);
    setNewContent(moment.content);
    setSelectedEmoji(moment.emoji);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingMoment || !newContent.trim()) return;
    try {
      await reviewService.updateGlimmeringMoment(editingMoment.id, {
        content: newContent.trim(),
        emoji: selectedEmoji
      });
      setNewContent('');
      setShowEditModal(false);
      setEditingMoment(null);
      loadMoments();
      setAlertData({
        title: '수정 완료',
        message: '빛나는 순간이 수정되었습니다',
        type: 'success'
      });
      setAlertVisible(true);
    } catch (err) {
      console.error('빛나는 순간 수정 실패:', err);
      setAlertData({
        title: '수정 실패',
        message: '빛나는 순간 수정에 실패했습니다',
        type: 'error'
      });
      setAlertVisible(true);
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeletingMomentId(id);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMomentId) return;
    try {
      await reviewService.deleteGlimmeringMoment(deletingMomentId);
      setDeleteConfirmVisible(false);
      setDeletingMomentId(null);
      loadMoments();
      setAlertData({
        title: '삭제 완료',
        message: '빛나는 순간이 삭제되었습니다',
        type: 'success'
      });
      setAlertVisible(true);
    } catch (err) {
      console.error('빛나는 순간 삭제 실패:', err);
      setAlertData({
        title: '삭제 실패',
        message: '빛나는 순간 삭제에 실패했습니다',
        type: 'error'
      });
      setAlertVisible(true);
    }
  };

  const handleRandom = async () => {
    try {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      const response = await reviewService.getRandomGlimmeringMoment();
      setAlertData({
        title: '빛나는 순간',
        message: `${response.data.emoji} ${response.data.content}`,
        type: 'success'
      });
      setAlertVisible(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setAlertData({
          title: '알림',
          message: '아직 저장된 빛나는 순간이 없어요',
          type: 'info'
        });
        setAlertVisible(true);
      } else {
        console.error('랜덤 조회 실패:', err);
      }
    }
  };

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="빛나는 순간 섹션">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={loadMoments}
            style={[styles.retryButton, { marginTop: 12 * scale }]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body * scale }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <>
      <Card accessible={true} accessibilityLabel={`빛나는 순간 ${total}개`} accessibilityHint="작은 행복의 순간들을 모아둔 공간입니다">
        <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale, marginBottom: 16 * scale }]}>{total}개의 빛나는 순간</Text>

        {moments.length > 0 ? (
          <>
            <View style={[styles.momentList, { gap: 12 * scale, marginBottom: 16 * scale }]}>
              {moments.slice(0, 2).map((moment) => (
                <View
                  key={moment.id}
                  style={[styles.momentItemContainer, {
                    backgroundColor: isDark ? colors.border : '#f5f5f5',
                    padding: 12 * scale,
                    borderRadius: 12 * scale,
                    gap: 8 * scale
                  }]}
                >
                  <View
                    style={[styles.momentItem, { gap: 8 * scale }]}
                    accessible={true}
                    accessibilityLabel={`${moment.emoji} ${moment.content}`}
                  >
                    <Text style={{ fontSize: FONT_SIZES.h2 * scale }}>{moment.emoji}</Text>
                    <Text style={[styles.momentText, { color: colors.text, fontSize: FONT_SIZES.body * scale, lineHeight: 22 * scale }]} numberOfLines={1}>
                      {moment.content}
                    </Text>
                  </View>
                  <View style={[styles.momentActions, { gap: 8 * scale }]}>
                    <TouchableOpacity
                      style={[styles.actionButton, {
                        backgroundColor: colors.primary + '20',
                        paddingVertical: 6 * scale,
                        paddingHorizontal: 12 * scale,
                        borderRadius: 8 * scale
                      }]}
                      onPress={() => handleEdit(moment)}
                      accessibilityRole="button"
                      accessibilityLabel="수정"
                    >
                      <Text style={[styles.actionButtonText, { color: colors.primary, fontSize: FONT_SIZES.small * scale }]}>✏️ 수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, {
                        backgroundColor: '#ef5350' + '20',
                        paddingVertical: 6 * scale,
                        paddingHorizontal: 12 * scale,
                        borderRadius: 8 * scale
                      }]}
                      onPress={() => handleDeleteRequest(moment.id)}
                      accessibilityRole="button"
                      accessibilityLabel="삭제"
                    >
                      <Text style={[styles.actionButtonText, { color: '#ef5350', fontSize: FONT_SIZES.small * scale }]}>🗑️ 삭제</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.buttonRow, { gap: 8 * scale }]}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary, padding: 12 * scale, borderRadius: 12 * scale }]}
                onPress={() => setShowAddModal(true)}
                accessibilityLabel="빛나는 순간 추가하기"
                accessibilityRole="button"
                accessibilityHint="새로운 빛나는 순간을 기록합니다"
              >
                <Text style={[styles.buttonText, { fontSize: FONT_SIZES.body * scale }]}>💫 모으기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.secondary, padding: 12 * scale, borderRadius: 12 * scale }]}
                onPress={handleRandom}
                accessibilityLabel="저장된 빛나는 순간 랜덤으로 보기"
                accessibilityRole="button"
                accessibilityHint="과거의 빛나는 순간을 랜덤으로 확인합니다"
              >
                <Text style={[styles.buttonText, { fontSize: FONT_SIZES.body * scale }]}>✨ 다시 빛나기</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary, padding: 16 * scale, borderRadius: 12 * scale }]}
            onPress={() => setShowAddModal(true)}
            accessibilityRole="button"
            accessibilityLabel="첫 빛나는 순간 기록하기"
          >
            <Text style={[styles.emptyText, { fontSize: FONT_SIZES.body * scale }]}>첫 빛나는 순간을 모아보세요 ✨</Text>
          </TouchableOpacity>
        )}
      </Card>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: 20 * scale, padding: 20 * scale }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontSize: FONT_SIZES.h2 * scale, marginBottom: 16 * scale }]}>✨ 빛나는 순간 모으기</Text>

            <View style={[styles.emojiRow, { gap: 8 * scale, marginBottom: 16 * scale }]}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    { padding: 8 * scale, borderRadius: 8 * scale },
                    selectedEmoji === emoji && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                  accessibilityRole="button"
                  accessibilityLabel={`이모지 ${emoji} 선택`}
                  accessibilityState={{ selected: selectedEmoji === emoji }}
                >
                  <Text style={{ fontSize: 28 * scale }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                color: colors.text,
                borderRadius: 12 * scale,
                padding: 12 * scale,
                fontSize: FONT_SIZES.body * scale,
                minHeight: 100 * scale,
                marginBottom: 16 * scale
              }]}
              placeholder="작은 행복을 적어보세요 (최대 200자)"
              placeholderTextColor={colors.textSecondary}
              value={newContent}
              onChangeText={setNewContent}
              maxLength={200}
              multiline
              accessibilityLabel="빛나는 순간 내용 입력"
            />

            <View style={[styles.modalButtons, { gap: 8 * scale }]}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border, padding: 14 * scale, borderRadius: 12 * scale }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewContent('');
                }}
                accessibilityRole="button"
                accessibilityLabel="취소"
              >
                <Text style={[styles.modalButtonText, { color: colors.text, fontSize: FONT_SIZES.bodyLarge * scale }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary, padding: 14 * scale, borderRadius: 12 * scale }]}
                onPress={handleAdd}
                accessibilityRole="button"
                accessibilityLabel="저장"
              >
                <Text style={[styles.modalButtonText, { fontSize: FONT_SIZES.bodyLarge * scale }]}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 수정 모달 */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: 20 * scale, padding: 20 * scale }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontSize: FONT_SIZES.h2 * scale, marginBottom: 16 * scale }]}>✏️ 빛나는 순간 수정</Text>

            <View style={[styles.emojiRow, { gap: 8 * scale, marginBottom: 16 * scale }]}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    { padding: 8 * scale, borderRadius: 8 * scale },
                    selectedEmoji === emoji && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                  accessibilityRole="button"
                  accessibilityLabel={`이모지 ${emoji} 선택`}
                  accessibilityState={{ selected: selectedEmoji === emoji }}
                >
                  <Text style={{ fontSize: 28 * scale }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                color: colors.text,
                borderRadius: 12 * scale,
                padding: 12 * scale,
                fontSize: FONT_SIZES.body * scale,
                minHeight: 100 * scale,
                marginBottom: 16 * scale
              }]}
              placeholder="작은 행복을 적어보세요 (최대 200자)"
              placeholderTextColor={colors.textSecondary}
              value={newContent}
              onChangeText={setNewContent}
              maxLength={200}
              multiline
              accessibilityLabel="빛나는 순간 내용 수정"
            />

            <View style={[styles.modalButtons, { gap: 8 * scale }]}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border, padding: 14 * scale, borderRadius: 12 * scale }]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingMoment(null);
                  setNewContent('');
                }}
                accessibilityRole="button"
                accessibilityLabel="취소"
              >
                <Text style={[styles.modalButtonText, { color: colors.text, fontSize: FONT_SIZES.bodyLarge * scale }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary, padding: 14 * scale, borderRadius: 12 * scale }]}
                onPress={handleUpdate}
                accessibilityRole="button"
                accessibilityLabel="수정 저장"
              >
                <Text style={[styles.modalButtonText, { fontSize: FONT_SIZES.bodyLarge * scale }]}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 삭제 확인 Alert */}
      <CustomAlert
        visible={deleteConfirmVisible}
        title="삭제 확인"
        message="이 빛나는 순간을 정말 삭제하시겠습니까?"
        type="warning"
        onDismiss={() => {
          setDeleteConfirmVisible(false);
          setDeletingMomentId(null);
        }}
        buttons={[
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: handleConfirmDelete }
        ]}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        onDismiss={() => setAlertVisible(false)}
        buttons={[{ text: '확인', style: 'default' }]}
      />
    </>
  );
});

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
  },
  momentList: {
  },
  momentItemContainer: {
  },
  momentItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  momentText: {
    flex: 1,
  },
  momentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
  },
  actionButtonText: {
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyButton: {
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
  },
  modalTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiButton: {
  },
  input: {
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
