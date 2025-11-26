import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, useWindowDimensions, Alert } from 'react-native';
import { useModernTheme } from '../../hooks/useModernTheme';
import { Card } from '../../components/common/Card';
import encouragementService from '../../services/api/encouragementService';
import { FONT_SIZES } from '../../constants';

interface Template {
  id: number;
  emoji: string;
  title: string;
  default_message: string;
  background_color: string;
  text_color: string;
}

export const SendTab: React.FC = () => {
  const { colors } = useModernTheme();
  const { width: screenWidth } = useWindowDimensions();

  const scale = useMemo(() => {
    const BASE_WIDTH = 360;
    const ratio = screenWidth / BASE_WIDTH;
    if (screenWidth >= 480) return Math.min(ratio, 1.5);
    if (screenWidth >= 390) return Math.min(ratio, 1.3);
    return Math.max(0.85, Math.min(ratio, 1.1));
  }, [screenWidth]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [remaining, setRemaining] = useState(10);
  const [sent, setSent] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadRemaining();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await encouragementService.getCardTemplates();
      setTemplates(response.data);
      if (response.data.length > 0) {
        setSelectedTemplate(response.data[0]);
      }
    } catch (error) {
      console.error('템플릿 로드 실패:', error);
    }
  };

  const loadRemaining = async () => {
    try {
      const response = await encouragementService.getRemainingCount();
      setRemaining(response.data.remaining);
      setSent(response.data.sent);
    } catch (error) {
      console.error('남은 횟수 조회 실패:', error);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;
    if (remaining <= 0) {
      Alert.alert('알림', '오늘 보낼 수 있는 카드를 모두 사용했어요');
      return;
    }

    try {
      setSending(true);
      await encouragementService.sendTemplateCard({
        template_id: selectedTemplate.id,
        custom_message: customMessage.trim() || undefined
      });

      Alert.alert('성공', '💌 카드가 전송되었어요!');
      setCustomMessage('');
      loadRemaining();
    } catch (error) {
      Alert.alert('오류', '카드 전송에 실패했어요');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={[styles.title, { color: colors.text }]}>
          💌 오늘 힘든 누군가에게{'\n'}따뜻한 마음을 전해주세요
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          오늘 보낼 수 있는 카드: {remaining}/10
        </Text>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>카드 템플릿 선택</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateCard,
              { backgroundColor: template.background_color },
              selectedTemplate?.id === template.id && styles.selectedTemplate
            ]}
            onPress={() => setSelectedTemplate(template)}
          >
            <Text style={styles.templateEmoji}>{template.emoji}</Text>
            <Text style={[styles.templateTitle, { color: template.text_color }]}>
              {template.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedTemplate && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>미리보기</Text>
          <Card style={{ backgroundColor: selectedTemplate.background_color }}>
            <Text style={[styles.previewEmoji]}>{selectedTemplate.emoji}</Text>
            <Text style={[styles.previewMessage, { color: selectedTemplate.text_color }]}>
              "{customMessage.trim() || selectedTemplate.default_message}"
            </Text>
            <Text style={[styles.previewFrom, { color: selectedTemplate.text_color }]}>
              - 익명의 친구가
            </Text>
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>메시지 추가 (선택)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="나만의 메시지를 추가할 수 있어요 (최대 100자)"
            placeholderTextColor={colors.textSecondary}
            value={customMessage}
            onChangeText={setCustomMessage}
            maxLength={100}
            multiline
          />

          <Card style={{ backgroundColor: colors.background }}>
            <Text style={[styles.warning, { color: colors.textSecondary }]}>
              ⚠️ 누구에게 전달될지 알 수 없어요{'\n'}
              💙 순수한 마음만 전달됩니다
            </Text>
          </Card>

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: remaining > 0 ? colors.primary : colors.border }
            ]}
            onPress={handleSend}
            disabled={sending || remaining <= 0}
            accessibilityLabel={`익명 카드 보내기, 남은 횟수 ${remaining}회`}
            accessibilityRole="button"
            accessibilityState={{ disabled: sending || remaining <= 0 }}
          >
            <Text style={[styles.sendButtonText, { color: '#FFFFFF' }]}>
              {sending ? '전송 중...' : '💌 보내기'}
            </Text>
          </TouchableOpacity>

          <Card>
            <Text style={[styles.statsTitle, { color: colors.text }]}>📊 내가 보낸 통계</Text>
            <Text style={[styles.statsText, { color: colors.textSecondary }]}>
              오늘: {sent}개 | 전체: -개
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20 * scale,
  },
  title: {
    fontSize: FONT_SIZES.h3 * scale,
    fontWeight: '700',
    marginBottom: 8 * scale,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.bodySmall * scale,
    textAlign: 'center',
    lineHeight: 20 * scale,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.bodyLarge * scale,
    fontWeight: '700',
    marginTop: 16 * scale,
    marginBottom: 12 * scale,
  },
  templateScroll: {
    marginBottom: 16 * scale,
  },
  templateCard: {
    width: 100 * scale,
    height: 120 * scale,
    borderRadius: 16 * scale,
    padding: 12 * scale,
    marginRight: 12 * scale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTemplate: {
    borderWidth: 3,
    borderColor: '#000',
  },
  templateEmoji: {
    fontSize: 32 * scale,
    marginBottom: 8 * scale,
  },
  templateTitle: {
    fontSize: FONT_SIZES.small * scale,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewEmoji: {
    fontSize: 48 * scale,
    textAlign: 'center',
    marginBottom: 16 * scale,
  },
  previewMessage: {
    fontSize: FONT_SIZES.bodyLarge * scale,
    textAlign: 'center',
    marginBottom: 16 * scale,
    lineHeight: 24 * scale,
  },
  previewFrom: {
    fontSize: FONT_SIZES.bodySmall * scale,
    textAlign: 'center',
  },
  input: {
    borderRadius: 12 * scale,
    padding: 12 * scale,
    fontSize: FONT_SIZES.body * scale,
    minHeight: 80 * scale,
    textAlignVertical: 'top',
    marginBottom: 16 * scale,
  },
  warning: {
    fontSize: FONT_SIZES.caption * scale,
    textAlign: 'center',
    lineHeight: 20 * scale,
  },
  sendButton: {
    padding: 16 * scale,
    borderRadius: 12 * scale,
    alignItems: 'center',
    marginVertical: 16 * scale,
  },
  sendButtonText: {
    fontSize: FONT_SIZES.bodyLarge * scale,
    fontWeight: '700',
  },
  statsTitle: {
    fontSize: FONT_SIZES.body * scale,
    fontWeight: '700',
    marginBottom: 8 * scale,
  },
  statsText: {
    fontSize: FONT_SIZES.bodySmall * scale,
    lineHeight: 20 * scale,
  },
});
