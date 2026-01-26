import React, { useState, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import { Chip, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import emotionService from '../services/api/emotionService';
import { Box, Text, VStack, HStack, Center } from '../components/ui';
import { useModernTheme } from '../contexts/ModernThemeContext';

// 배경색 밝기에 따라 텍스트 색상 자동 결정
const getContrastTextColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance > 155 ? '#1a1a1a' : '#FFFFFF';
};

interface Emotion {
  emotion_id: number;
  name: string;
  icon: string;
  color: string;
}

interface EmotionResponse {
  status: string;
  data: Emotion[];
}

const EmotionLogScreen = ({ navigation }: any) => {
  const { theme, isDark } = useModernTheme();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = {
    background: theme.colors.background,
    cardBackground: theme.colors.card,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.primarySecondary,
    border: theme.colors.border || '#e5e7eb',
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  useEffect(() => {
    loadEmotions();
  }, []);

  const loadEmotions = async () => {
    setIsLoading(true);
    try {
      const response = await emotionService.getAllEmotions();
      const emotionResponse = response.data as EmotionResponse;
      setEmotions(emotionResponse.data);
    } catch (error) {
      Alert.alert('오류', '감정 데이터를 불러오는 중 오류가 발생했습니다.');
      
      if (process.env.NODE_ENV !== 'test') {
        if (__DEV__) console.error('감정 로드 오류:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const toggleEmotion = (emotionId: number) => {
    if (selectedEmotions.includes(emotionId)) {
      setSelectedEmotions(selectedEmotions.filter(id => id !== emotionId));
    } else {
      setSelectedEmotions([...selectedEmotions, emotionId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedEmotions.length === 0) {
      Alert.alert('알림', '감정을 적어도 하나 이상 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await emotionService.recordEmotions({
        emotion_ids: selectedEmotions,
        note: note.trim() || undefined
      });
      
      Alert.alert(
        '감정 기록 완료',
        '오늘의 감정이 성공적으로 기록되었습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
    } catch (error: unknown) {
      Alert.alert(
        '오류',
        error.response?.data?.message || '감정 기록 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Center className="flex-1" style={{ backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text className="mt-4 text-base" style={{ color: theme.colors.text.primary }}>감정 데이터를 불러오는 중...</Text>
      </Center>
    );
  }

  return (
    <ScrollView className="flex-1 p-4" style={{ backgroundColor: theme.colors.background }}>
      <VStack className="space-y-6">
        <VStack className="space-y-2">
          <Text className="text-2xl font-bold" style={{ color: theme.colors.primary }}>오늘의 감정</Text>
          <Text className="text-base" style={{ color: theme.colors.text.primarySecondary }}>현재 어떤 감정을 느끼고 계신가요?</Text>
        </VStack>

        <Box className="flex-row flex-wrap">
          {emotions.map((emotion) => (
            <Box key={emotion.emotion_id} className="m-1">
              <Chip
                selected={selectedEmotions.includes(emotion.emotion_id)}
                onPress={() => toggleEmotion(emotion.emotion_id)}
                style={[
                  selectedEmotions.includes(emotion.emotion_id) && { backgroundColor: emotion.color }
                ]}
                textStyle={{
                  color: selectedEmotions.includes(emotion.emotion_id) ? getContrastTextColor(emotion.color) : emotion.color
                }}
                testID="emotion-chip"
              >
                {emotion.name}
              </Chip>
            </Box>
          ))}
        </Box>

        <TextInput
          label="감정에 대한 메모 (선택사항)"
          value={note}
          onChangeText={setNote}
          mode="outlined"
          multiline
          numberOfLines={4}
          className="mb-6"
          testID="emotion-note-input"
          theme={{
            colors: {
              primary: theme.colors.primary,
              text: theme.colors.text.primary,
              placeholder: theme.colors.text.primarySecondary,
              background: theme.colors.surface,
              onSurfaceVariant: theme.colors.text.primarySecondary,
            },
          }}
          style={{ backgroundColor: theme.colors.surface }}
          textColor={theme.colors.text.primary}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          className="py-2"
          disabled={isSubmitting || selectedEmotions.length === 0}
          testID="emotion-submit-button"
          buttonColor={theme.colors.primary}
          textColor="#FFFFFF"
        >
          {isSubmitting ? '기록 중...' : '감정 기록하기'}
        </Button>
      </VStack>
    </ScrollView>
  );
};


export default EmotionLogScreen;