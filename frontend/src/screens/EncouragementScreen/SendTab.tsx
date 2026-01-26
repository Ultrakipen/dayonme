import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, useWindowDimensions, Modal, Animated } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useModernTheme } from '../../hooks/useModernTheme';
import { Card } from '../../components/common/Card';
import encouragementService from '../../services/api/encouragementService';
import { FONT_SIZES } from '../../constants';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';

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

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 16 * scale,
    },
    title: {
      fontSize: FONT_SIZES.h3 * scale,
      fontFamily: 'Pretendard-SemiBold',
      marginBottom: 8 * scale,
      textAlign: 'center',
      letterSpacing: 0.2,
      lineHeight: 24 * scale,
    },
    subtitle: {
      fontSize: FONT_SIZES.bodySmall * scale,
      textAlign: 'center',
      lineHeight: 20 * scale,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontFamily: 'Pretendard-Bold',
      marginTop: 20 * scale,
      marginBottom: 16 * scale,
    },
    collapsibleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12 * scale,
      paddingHorizontal: 16 * scale,
      marginTop: 20 * scale,
      marginBottom: 12 * scale,
      borderRadius: 12 * scale,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
    },
    headerTitle: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontFamily: 'Pretendard-Bold',
    },
    headerCount: {
      fontSize: FONT_SIZES.bodySmall * scale,
      fontFamily: 'Pretendard-SemiBold',
      opacity: 0.7,
    },
    templateGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10 * scale,
      marginBottom: 20 * scale,
    },
    templateCard: {
      width: (screenWidth - 80 * scale) / 3,
      height: 120 * scale,
      borderRadius: 16 * scale,
      padding: 12 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    selectedTemplate: {
      borderWidth: 2,
      borderColor: '#667eea',
      transform: [{ scale: 1.02 }],
      shadowOpacity: 0.15,
    },
    templateIconWrapper: {
      width: 56 * scale,
      height: 56 * scale,
      borderRadius: 28 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8 * scale,
    },
    templateEmoji: {
      fontSize: 32 * scale,
    },
    templateTitle: {
      fontSize: FONT_SIZES.bodySmall * scale,
      fontFamily: 'Pretendard-Bold',
      textAlign: 'center',
      lineHeight: 16 * scale,
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
      padding: 18 * scale,
      borderRadius: 16 * scale,
      alignItems: 'center',
      marginVertical: 20 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    sendButtonText: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontFamily: 'Pretendard-ExtraBold',
      letterSpacing: 0.5,
    },
    statsTitle: {
      fontSize: FONT_SIZES.body * scale,
      fontFamily: 'Pretendard-Bold',
      marginBottom: 8 * scale,
    },
    statsText: {
      fontSize: FONT_SIZES.bodySmall * scale,
      lineHeight: 20 * scale,
    },
  }), [scale]);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [remaining, setRemaining] = useState(3);
  const [sent, setSent] = useState(0);
  const [totalSent, setTotalSent] = useState(0);
  const [sending, setSending] = useState(false);
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });
  const alertScaleAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef<{[key: number]: Animated.Value}>({}).current;

  const showCustomAlert = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setAlertModal({ visible: true, type, title, message });
    Animated.spring(alertScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const hideCustomAlert = () => {
    Animated.timing(alertScaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setAlertModal({ ...alertModal, visible: false });
    });
  };

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
      response.data.forEach((template: Template) => {
        cardAnims[template.id] = new Animated.Value(1);
      });
    } catch (error) {
      if (__DEV__) console.error('템플릿 로드 실패:', error);
    }
  };

  const handleTemplatePress = (template: Template) => {
    ReactNativeHapticFeedback.trigger('impactMedium');
    Animated.sequence([
      Animated.timing(cardAnims[template.id], {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnims[template.id], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    setSelectedTemplate(template);
  };

  const getEmojiForTemplate = (template: Template) => {
    // 템플릿에 emoji가 있으면 직접 사용
    if (template.emoji) {
      return { emoji: template.emoji, color: getColorForEmoji(template.emoji) };
    }

    // 없으면 키워드 매칭
    const title = template.title.toLowerCase();
    const message = template.default_message.toLowerCase();
    const text = `${title} ${message}`;

    // 사랑, 애정 관련
    if (text.includes('사랑') || text.includes('love') || text.includes('❤')) {
      return { emoji: '❤️', color: '#FF3B5C' };
    }
    // 응원, 파이팅 관련
    if (text.includes('응원') || text.includes('힘내') || text.includes('파이팅') || text.includes('화이팅')) {
      return { emoji: '💪', color: '#FF6B35' };
    }
    // 위로, 격려 관련
    if (text.includes('위로') || text.includes('격려') || text.includes('괜찮') || text.includes('힘들')) {
      return { emoji: '🤗', color: '#00D9FF' };
    }
    // 감사 관련
    if (text.includes('감사') || text.includes('고마') || text.includes('thanks')) {
      return { emoji: '🙏', color: '#A855F7' };
    }
    // 축하 관련
    if (text.includes('축하') || text.includes('congratulation')) {
      return { emoji: '🎉', color: '#FACC15' };
    }
    // 행복, 기쁨, 웃음 관련
    if (text.includes('행복') || text.includes('기쁨') || text.includes('happy') || text.includes('웃')) {
      return { emoji: '😊', color: '#FFA726' };
    }
    // 공감, 함께 관련
    if (text.includes('공감') || text.includes('함께') || text.includes('같이')) {
      return { emoji: '🤝', color: '#667eea' };
    }
    // 선물, 마음 관련
    if (text.includes('선물') || text.includes('마음') || text.includes('gift')) {
      return { emoji: '🎁', color: '#EC4899' };
    }
    // 성장, 새싹 관련
    if (text.includes('성장') || text.includes('새싹') || text.includes('자라')) {
      return { emoji: '🌿', color: '#228B22' };
    }
    // 나비, 변화 관련
    if (text.includes('나비') || text.includes('날개') || text.includes('날아')) {
      return { emoji: '🦋', color: '#9370DB' };
    }
    // 해바라기, 햇살 관련
    if (text.includes('해바라기') || text.includes('햇살') || text.includes('태양')) {
      return { emoji: '🌻', color: '#DAA520' };
    }
    // 휴식, 쉼 관련
    if (text.includes('쉬') || text.includes('휴식') || text.includes('그늘')) {
      return { emoji: '🌴', color: '#32CD32' };
    }
    // 가벼움, 자유 관련
    if (text.includes('가볍') || text.includes('내려놓') || text.includes('풍선')) {
      return { emoji: '🎈', color: '#00CED1' };
    }
    // 음악, 노래 관련
    if (text.includes('노래') || text.includes('음악') || text.includes('멜로디')) {
      return { emoji: '🎵', color: '#FF69B4' };
    }
    // 새로운 시작, 희망 관련
    if (text.includes('시작') || text.includes('기회') || text.includes('새로')) {
      return { emoji: '🌅', color: '#FF8C00' };
    }
    // 자유, 바람 관련
    if (text.includes('바람') || text.includes('자유') || text.includes('흐르')) {
      return { emoji: '🍃', color: '#3CB371' };
    }

    // 기본값 (매칭되지 않는 경우)
    return { emoji: '💝', color: '#667eea' };
  };

  const getColorForEmoji = (emoji: string): string => {
    const emojiColorMap: { [key: string]: string } = {
      '❤️': '#FF3B5C',
      '💪': '#FF6B35',
      '🤗': '#00D9FF',
      '🙏': '#A855F7',
      '🎉': '#FACC15',
      '😊': '#FFA726',
      '🎁': '#EC4899',
      '🌻': '#DAA520',
      '🦋': '#9370DB',
      '🌿': '#228B22',
      '🎈': '#00CED1',
      '🌴': '#32CD32',
      '🎵': '#FF69B4',
      '🌅': '#FF8C00',
      '🍃': '#3CB371',
      '🌸': '#8B4789',
      '🌟': '#FF8C00',
      '☕': '#8B4513',
      '🌈': '#0277BD',
      '💫': '#3F51B5',
      '🌙': '#01579B',
      '🍀': '#2E7D32',
      '💝': '#C2185B',
      '🌺': '#7B1FA2',
      '✨': '#F57F17',
      '⭐': '#F57F17',
    };
    return emojiColorMap[emoji] || '#667eea';
  };

  const loadRemaining = async () => {
    try {
      const response = await encouragementService.getRemainingCount();
      setRemaining(response.data.remaining);
      setSent(response.data.sent);
      setTotalSent(response.data.totalSent || 0);
    } catch (error) {
      if (__DEV__) console.error('남은 횟수 조회 실패:', error);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;
    if (remaining <= 0) {
      ReactNativeHapticFeedback.trigger('notificationWarning');
      showCustomAlert('info', '알림', '오늘 보낼 수 있는 카드를 모두 사용했어요');
      return;
    }

    try {
      setSending(true);
      ReactNativeHapticFeedback.trigger('impactHeavy');
      await encouragementService.sendTemplateCard({
        template_id: selectedTemplate.id,
        custom_message: customMessage.trim() || undefined
      });

      ReactNativeHapticFeedback.trigger('notificationSuccess');
      showCustomAlert('success', '전송 완료', '따뜻한 마음이 전달되었어요!\n누군가에게 힘이 될 거예요');
      setCustomMessage('');
      loadRemaining();
    } catch (error) {
      ReactNativeHapticFeedback.trigger('notificationError');
      showCustomAlert('error', '전송 실패', '카드 전송에 실패했어요.\n잠시 후 다시 시도해주세요.');
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
          오늘 보낼 수 있는 카드: {remaining}/5
        </Text>
      </Card>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          ReactNativeHapticFeedback.trigger('impactLight');
          setIsTemplatesExpanded(!isTemplatesExpanded);
        }}
        style={[styles.collapsibleHeader, { backgroundColor: colors.card }]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            💝 카드 템플릿 선택
          </Text>
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            ({templates.length}개)
          </Text>
        </View>
        <Icon
          name={isTemplatesExpanded ? 'chevron-up' : 'chevron-down'}
          size={24 * scale}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isTemplatesExpanded && (
        <View style={styles.templateGrid}>
          {templates.map((template, index) => {
            const animScale = cardAnims[template.id] || new Animated.Value(1);
            const emojiData = getEmojiForTemplate(template);

            return (
              <Animated.View
                key={template.id}
                style={{ transform: [{ scale: animScale }] }}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleTemplatePress(template)}
                >
                  <View
                    style={[
                      styles.templateCard,
                      { backgroundColor: colors.card },
                      selectedTemplate?.id === template.id && styles.selectedTemplate
                    ]}
                  >
                    <View style={[
                      styles.templateIconWrapper,
                      { backgroundColor: `${emojiData.color}10` }
                    ]}>
                      <Text style={{ fontSize: 32 * scale }}>
                        {emojiData.emoji}
                      </Text>
                    </View>
                    <Text style={[styles.templateTitle, { color: colors.text }]}>{template.title}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}

      {selectedTemplate && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>✨ 미리보기</Text>
          <View
            style={{
              borderRadius: 16 * scale,
              padding: 20 * scale,
              backgroundColor: colors.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 14 * scale }}>
              {(() => {
                const emojiData = getEmojiForTemplate(selectedTemplate);
                return (
                  <View style={{
                    width: 72 * scale,
                    height: 72 * scale,
                    borderRadius: 36 * scale,
                    backgroundColor: `${emojiData.color}10`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 6 * scale,
                  }}>
                    <Text style={{ fontSize: 46 * scale }}>
                      {emojiData.emoji}
                    </Text>
                  </View>
                );
              })()}
            </View>
            <Text style={[styles.previewMessage, { color: colors.text }]}>
              "{customMessage.trim() || selectedTemplate.default_message}"
            </Text>
            <Text style={[styles.previewFrom, { color: colors.textSecondary }]}>
              - 익명의 친구가
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>✍️ 메시지 추가 (선택)</Text>
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
            onPress={handleSend}
            disabled={sending || remaining <= 0}
            activeOpacity={0.9}
            accessibilityLabel={`익명 카드 보내기, 남은 횟수 ${remaining}회`}
            accessibilityRole="button"
            accessibilityState={{ disabled: sending || remaining <= 0 }}
          >
            <View
              style={[
                styles.sendButton,
                { backgroundColor: remaining > 0 ? colors.primary : colors.border }
              ]}
            >
              <Text style={[styles.sendButtonText, { color: '#FFFFFF' }]}>
                {sending ? '✨ 전송 중...' : '💌 따뜻한 마음 보내기'}
              </Text>
            </View>
          </TouchableOpacity>

          <Card>
            <Text style={[styles.statsTitle, { color: colors.text }]}>📊 내가 보낸 통계</Text>
            <Text style={[styles.statsText, { color: colors.textSecondary }]}>
              오늘: {sent}개 | 전체: {totalSent}개
            </Text>
          </Card>
        </>
      )}

      {/* 커스텀 알림 모달 */}
      <Modal
        visible={alertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={hideCustomAlert}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          activeOpacity={1}
          onPress={hideCustomAlert}
        >
          <Animated.View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24 * scale,
              padding: 32 * scale,
              width: '100%',
              maxWidth: 320 * scale,
              alignItems: 'center',
              transform: [{ scale: alertScaleAnim }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* 아이콘 */}
            <View
              style={{
                width: 80 * scale,
                height: 80 * scale,
                borderRadius: 40 * scale,
                backgroundColor: alertModal.type === 'success'
                  ? '#E8F5E9'
                  : alertModal.type === 'error'
                    ? '#FFEBEE'
                    : '#E3F2FD',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20 * scale,
              }}
            >
              {alertModal.type === 'success' ? (
                <Text style={{ fontSize: 40 * scale }}>💌</Text>
              ) : alertModal.type === 'error' ? (
                <MaterialCommunityIcons name="alert-circle" size={48 * scale} color="#F44336" />
              ) : (
                <MaterialCommunityIcons name="information" size={48 * scale} color="#2196F3" />
              )}
            </View>

            {/* 제목 */}
            <Text
              style={{
                fontSize: 22 * scale,
                fontFamily: 'Pretendard-Bold',
                color: colors.text,
                marginBottom: 12 * scale,
                textAlign: 'center',
              }}
            >
              {alertModal.title}
            </Text>

            {/* 메시지 */}
            <Text
              style={{
                fontSize: 15 * scale,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 22 * scale,
                marginBottom: 28 * scale,
              }}
            >
              {alertModal.message}
            </Text>

            {/* 확인 버튼 */}
            <TouchableOpacity
              style={{
                backgroundColor: alertModal.type === 'success'
                  ? '#4CAF50'
                  : alertModal.type === 'error'
                    ? '#F44336'
                    : colors.primary,
                paddingVertical: 14 * scale,
                paddingHorizontal: 48 * scale,
                borderRadius: 12 * scale,
                width: '100%',
                alignItems: 'center',
              }}
              onPress={hideCustomAlert}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 16 * scale,
                  fontFamily: 'Pretendard-Bold',
                }}
              >
                확인
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};
