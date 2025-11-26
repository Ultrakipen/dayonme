import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { Card } from '../../../components/common/Card';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MicroEntry {
  id: string;
  content: string;
  date: string;
  emoji: string;
}

const STORAGE_KEY = '@micro_journal_entries';
const MAX_LENGTH = 100;
const TIMER_DURATION = 30;

export const MicroJournal: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [inputValue, setInputValue] = useState('');
  const [entries, setEntries] = useState<MicroEntry[]>([]);
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

  // 로컬 저장소에서 기록 로드 (트래픽 감소)
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MicroEntry[] = JSON.parse(stored);
        setEntries(parsed.slice(0, 7)); // 최근 7개만
      }
    } catch (err) {
      console.error('저널 로드 실패:', err);
    }
  };

  const saveEntries = async (newEntries: MicroEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch (err) {
      console.error('저널 저장 실패:', err);
    }
  };

  // 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTyping, timer]);

  const handleFocus = useCallback(() => {
    setIsTyping(true);
    setTimer(TIMER_DURATION);
  }, []);

  const handleBlur = useCallback(() => {
    setIsTyping(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim()) return;

    // XSS 방지: 입력값 검증
    const sanitizedContent = inputValue.trim().replace(/<[^>]*>/g, '');

    const newEntry: MicroEntry = {
      id: Date.now().toString(),
      content: sanitizedContent,
      date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      emoji: '✍️',
    };

    const updatedEntries = [newEntry, ...entries].slice(0, 7);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);

    setInputValue('');
    setIsTyping(false);
    setTimer(TIMER_DURATION);

    // 성공 애니메이션
    setShowSuccess(true);
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setShowSuccess(false);
    });
  }, [inputValue, entries, successAnim]);

  const successOpacity = successAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const characterCount = inputValue.length;
  const isOverLimit = characterCount > MAX_LENGTH;

  return (
    <Card accessible={true} accessibilityLabel="마이크로 저널">
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale }]}
          accessibilityRole="header"
        >
          ✍️ 30초 마이크로 저널
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
          한 줄만 적어도 충분해요
        </Text>
      </View>

      {/* 입력 영역 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? colors.border : '#f5f5f5',
              color: colors.text,
              fontSize: FONT_SIZES.body * scale,
              borderColor: isTyping ? colors.primary : 'transparent',
              borderWidth: isTyping ? 2 : 0,
            }
          ]}
          placeholder="오늘 하루 한 줄로 표현하면..."
          placeholderTextColor={colors.textSecondary}
          value={inputValue}
          onChangeText={setInputValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={MAX_LENGTH + 20} // 약간의 여유
          multiline
          numberOfLines={2}
          accessible={true}
          accessibilityLabel="일기 입력란"
          accessibilityHint="오늘의 감정을 한 줄로 표현해보세요"
        />

        <View style={styles.metaContainer}>
          {isTyping && (
            <Text style={[
              styles.timerText,
              {
                color: timer < 10 ? '#ff9800' : colors.textSecondary,
                fontSize: FONT_SIZES.caption * scale
              }
            ]}>
              ⏱️ {timer}초
            </Text>
          )}
          <Text style={[
            styles.charCount,
            {
              color: isOverLimit ? '#ef5350' : colors.textSecondary,
              fontSize: FONT_SIZES.caption * scale
            }
          ]}>
            {characterCount}/{MAX_LENGTH}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: inputValue.trim() && !isOverLimit ? colors.primary : colors.border,
            }
          ]}
          onPress={handleSubmit}
          disabled={!inputValue.trim() || isOverLimit}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel="기록하기"
          accessibilityRole="button"
          accessibilityState={{ disabled: !inputValue.trim() || isOverLimit }}
        >
          <Text style={[
            styles.submitButtonText,
            {
              color: inputValue.trim() && !isOverLimit ? '#fff' : colors.textSecondary,
              fontSize: FONT_SIZES.body * scale
            }
          ]}>
            기록하기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 성공 메시지 - 조건부 렌더링 */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successMessage,
            {
              backgroundColor: isDark ? '#1a3d1a' : '#e8f5e9',
              opacity: successOpacity,
            }
          ]}
        >
          <Text style={[styles.successText, { color: '#4caf50', fontSize: FONT_SIZES.bodySmall * scale }]}>
            ✨ 기록되었어요!
          </Text>
        </Animated.View>
      )}

      {/* 최근 기록 */}
      {entries.length > 0 && (
        <View style={styles.entriesContainer}>
          <Text
            style={[styles.entriesTitle, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}
            accessibilityRole="header"
          >
            📝 최근 7일
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.entriesScroll}
            accessible={false}
          >
            {entries.map((entry, index) => (
              <View
                key={entry.id}
                style={[
                  styles.entryCard,
                  {
                    backgroundColor: isDark ? colors.border : '#fff',
                    borderColor: colors.border
                  }
                ]}
                accessible={true}
                accessibilityLabel={`${entry.date} 기록: ${entry.content}`}
              >
                <Text style={[styles.entryDate, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
                  {entry.date}
                </Text>
                <Text
                  style={[styles.entryContent, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}
                  numberOfLines={2}
                >
                  {entry.content}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  timerText: {
    fontWeight: '600',
  },
  charCount: {
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: '700',
  },
  successMessage: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  successText: {
    fontWeight: '700',
  },
  entriesContainer: {
    marginTop: 8,
  },
  entriesTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  entriesScroll: {
    marginHorizontal: -4,
  },
  entryCard: {
    width: 160,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  entryDate: {
    marginBottom: 8,
    fontWeight: '600',
  },
  entryContent: {
    lineHeight: 18,
  },
});
