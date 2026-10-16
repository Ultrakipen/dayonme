import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions, Alert, ScrollView } from 'react-native';
import { Card } from '../../components/common/Card';
import { useModernTheme } from '../../hooks/useModernTheme';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import LinearGradient from 'react-native-linear-gradient';
import { FONT_SIZES } from '../../constants';

interface Template {
  id: number;
  name: string;
  emoji: string;
  color: string;
  gradient: string[];
}

// 2026 트렌드: 모던한 그라데이션 메쉬, 추상적 컬러
const templates: Template[] = [
  { id: 1, name: '세렌 블루', emoji: '', color: '#E3F2FD', gradient: ['#667eea', '#764ba2'] },
  { id: 2, name: '선셋 글로우', emoji: '', color: '#FFF3E0', gradient: ['#f093fb', '#f5576c'] },
  { id: 3, name: '퍼플 드림', emoji: '', color: '#F3E5F5', gradient: ['#4facfe', '#00f2fe'] },
  { id: 4, name: '민트 미스트', emoji: '', color: '#E0F2F1', gradient: ['#43e97b', '#38f9d7'] },
  { id: 5, name: '피치 오라', emoji: '', color: '#FCE4EC', gradient: ['#fa709a', '#fee140'] },
];

interface Props {
  emotionData?: {
    emotion: string;
    icon: string;
    date: string;
    content?: string;
    stats?: {
      consecutiveDays: number;
      totalPosts: number;
    };
  };
}

export const EmotionSnapshot: React.FC<Props> = ({ emotionData }) => {
  const { colors } = useModernTheme();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const scale = Math.min(Math.max(SCREEN_WIDTH / 360, 0.9), 1.3);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const viewShotRef = useRef<ViewShot>(null);

  // 반응형 스타일 생성 (useMemo로 캐싱)
  const styles = useMemo(() => createStyles(scale, SCREEN_HEIGHT), [scale, SCREEN_HEIGHT]);

  const handleCapture = async () => {
    try {
      if (!viewShotRef.current) return;

      const uri = await viewShotRef.current.capture();

      await Share.open({
        title: '나의 감정 여정',
        message: '오늘의 감정을 공유합니다 ✨',
        url: `file://${uri}`,
        type: 'image/png',
      });

      setShowModal(false);
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('오류', '이미지 공유에 실패했습니다');
      }
    }
  };

  const defaultData = {
    emotion: '행복',
    icon: '😊',
    date: new Date().toLocaleDateString('ko-KR'),
    content: '오늘도 좋은 하루였어요',
    stats: {
      consecutiveDays: 1,
      totalPosts: 1,
    },
  };

  const data = emotionData || defaultData;

  return (
    <>
      <Card
        onPress={() => setShowModal(true)}
        accessibilityLabel="감정 사진첩 만들기"
        accessibilityHint="나의 감정 여정을 이미지로 저장하고 공유할 수 있습니다"
        accessibilityRole="button"
      >
        <Text style={[styles.title, { color: colors.text }]}>📸 감정 사진첩 만들기</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          나의 감정 여정을 이미지로 저장하고 공유하세요
        </Text>
      </Card>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>템플릿 선택</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateScroll}
              contentContainerStyle={styles.templateScrollContent}
              decelerationRate="fast"
              snapToInterval={116 * scale}
            >
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateItem,
                    selectedTemplate.id === template.id && styles.selectedTemplate
                  ]}
                  onPress={() => setSelectedTemplate(template)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={template.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.templateGradient}
                  >
                    <View style={styles.templateOverlay}>
                      <Text style={styles.templateName}>{template.name}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.previewContainer}>
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.85 }}>
                <LinearGradient
                  colors={selectedTemplate.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.snapshotCard}
                >
                  <View style={styles.snapshotContent}>
                    <Text style={styles.snapshotEmotion}>
                      {data.icon} {data.emotion}
                    </Text>
                    <Text style={styles.snapshotDate}>{data.date}</Text>

                    {data.content && (
                      <Text style={styles.snapshotText}>"{data.content}"</Text>
                    )}

                    {data.stats && (
                      <View style={styles.snapshotStats}>
                        <Text style={styles.snapshotStat}>
                          🔥 {data.stats.consecutiveDays}일 연속
                        </Text>
                        <Text style={styles.snapshotStat}>
                          📝 {data.stats.totalPosts}개 기록
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.snapshotFooter}>Dayonme - 감정 여정</Text>
                </LinearGradient>
              </ViewShot>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.border }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleCapture}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>공유하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// 반응형 스타일 생성 함수 (React Native 0.80 호환)
const createStyles = (scale: number, screenHeight: number) => StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.h4,
    fontWeight: '700',
    marginBottom: 8 * scale,
  },
  subtitle: {
    fontSize: FONT_SIZES.bodySmall,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20 * scale,
  },
  modalContent: {
    borderRadius: 20 * scale,
    padding: 20 * scale,
    maxHeight: screenHeight * 0.9,
  },
  modalTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
    marginBottom: 16 * scale,
  },
  templateScroll: {
    marginBottom: 20 * scale,
  },
  templateScrollContent: {
    paddingRight: 20 * scale,
  },
  templateItem: {
    width: 100 * scale,
    height: 100 * scale,
    borderRadius: 24 * scale,
    marginRight: 16 * scale,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  selectedTemplate: {
    transform: [{ scale: 1.05 }],
    elevation: 8,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  templateGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12 * scale,
  },
  templateOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12 * scale,
    padding: 8 * scale,
  },
  templateName: {
    fontSize: FONT_SIZES.small,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20 * scale,
  },
  snapshotCard: {
    width: 270,
    height: 400,
    borderRadius: 28,
    padding: 32,
    justifyContent: 'space-between',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  snapshotContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapshotEmotion: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  snapshotDate: {
    fontSize: FONT_SIZES.bodyLarge,
    color: '#FFFFFF',
    marginBottom: 20,
    opacity: 0.9,
    fontWeight: '500',
  },
  snapshotText: {
    fontSize: FONT_SIZES.h3,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  snapshotStats: {
    flexDirection: 'row',
    gap: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  snapshotStat: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  snapshotFooter: {
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.7,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12 * scale,
  },
  button: {
    flex: 1,
    padding: 14 * scale,
    borderRadius: 12 * scale,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '600',
  },
});
