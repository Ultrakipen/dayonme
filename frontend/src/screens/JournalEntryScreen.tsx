import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  TextInput,
  Chip,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Box, Text, VStack, HStack, Center, Pressable } from '../components/ui';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { StyledText, StyledButton, StyledCard } from '../components/ModernUI';
import api from '../services/api';
import { sanitizeText } from '../utils/sanitize';

const EMOTIONS = [
  { id: 'happy', label: '행복', icon: '😊', color: '#FFD700' },
  { id: 'sad', label: '슬픔', icon: '😢', color: '#4169E1' },
  { id: 'angry', label: '화남', icon: '😠', color: '#FF6347' },
  { id: 'anxious', label: '불안', icon: '😰', color: '#FFA500' },
  { id: 'calm', label: '평온', icon: '😌', color: '#90EE90' },
  { id: 'excited', label: '신남', icon: '🤗', color: '#FF69B4' },
  { id: 'tired', label: '피곤', icon: '😴', color: '#9370DB' },
  { id: 'grateful', label: '감사', icon: '🙏', color: '#87CEEB' },
];

interface JournalEntryScreenProps {
  navigation: any;
  route: any;
}

const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({ navigation, route }) => {
  const { theme, isDark } = useModernTheme();
  const { width } = useWindowDimensions();
  const isEditing = route.params?.entry;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const BASE_WIDTH = 360;
  const scale = useMemo(() => Math.min(Math.max(width / BASE_WIDTH, 0.9), 1.3), [width]);
  const getFontSize = (base: number) => Math.max(Math.round(base * scale), base * 0.9);
  const spacing = (base: number) => Math.round(base * scale);

  const colors = useMemo(() => ({
    quoteBg: isDark ? theme.bg?.secondary || '#2d2d2d' : '#E3F2FD',
    itemBg: isDark ? theme.bg?.secondary || '#2d2d2d' : '#F8F9FA',
    border: isDark ? theme.bg?.border || '#3a3a3a' : '#e1e5e9'
  }), [isDark, theme]);

  useEffect(() => {
    if (isEditing) {
      const entry = route.params.entry;
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setSelectedEmotions(entry.emotions || []);
      setTags(entry.tags || []);
      setDate(new Date(entry.created_at));
    }
  }, [isEditing, route.params]);

  const handleEmotionToggle = (emotionId: string) => {
    setSelectedEmotions(prev => {
      if (prev.includes(emotionId)) {
        return prev.filter(id => id !== emotionId);
      } else {
        return [...prev, emotionId];
      }
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('오류', '제목을 입력해주세요.');
      return false;
    }
    if (!content.trim()) {
      Alert.alert('오류', '내용을 입력해주세요.');
      return false;
    }
    if (selectedEmotions.length === 0) {
      Alert.alert('오류', '최소 하나의 감정을 선택해주세요.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const data = {
        title: sanitizeText(title.trim(), 100),
        content: sanitizeText(content.trim(), 2000),
        emotions: selectedEmotions,
        tags: tags.map(tag => sanitizeText(tag, 50)),
        created_at: date.toISOString(),
      };

      if (isEditing) {
        await api.put(`/journal/${route.params.entry.id}`, data);
        Alert.alert('성공', '일기가 수정되었습니다.');
      } else {
        await api.post('/journal', data);
        Alert.alert('성공', '일기가 저장되었습니다.');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('오류', '저장 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '일기 삭제',
      '정말로 이 일기를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await api.delete(`/journal/${route.params.entry.id}`);
              Alert.alert('성공', '일기가 삭제되었습니다.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <StyledCard margin="md" padding="lg">
          <HStack className="justify-between items-center mb-4">
            <StyledText variant="body" color="secondary">
              {date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </StyledText>
            <IconButton
              icon="calendar"
              size={24}
              iconColor={theme.colors.primary}
              onPress={() => setShowDatePicker(true)}
            />
          </HStack>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          <TextInput
            label="제목"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            className="mb-5"
            style={{ backgroundColor: theme.colors.surface }}
            theme={{
              colors: {
                text: theme.colors.text,
                placeholder: theme.colors.textSecondary,
                primary: theme.colors.primary,
              }
            }}
            placeholder="오늘의 제목을 입력하세요"
          />

          <StyledText variant="h3">
            오늘의 감정
          </StyledText>
          <Box className="flex-row flex-wrap mb-5">
            {EMOTIONS.map(emotion => (
              <Pressable
                key={emotion.id}
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: spacing(8),
                  margin: spacing(4),
                  borderRadius: spacing(8),
                  borderWidth: 2,
                  minWidth: spacing(70),
                  backgroundColor: selectedEmotions.includes(emotion.id)
                    ? emotion.color + '30'
                    : theme.colors.surface,
                  borderColor: selectedEmotions.includes(emotion.id)
                    ? emotion.color
                    : theme.colors.border,
                  ...(isDark && selectedEmotions.includes(emotion.id) ? {
                    shadowColor: emotion.color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  } : {})
                }}
                onPress={() => handleEmotionToggle(emotion.id)}
                accessibilityRole="button"
                accessibilityLabel={`${emotion.label} 감정 ${selectedEmotions.includes(emotion.id) ? '선택됨' : '선택 안됨'}`}
                accessibilityHint={`탭하여 ${emotion.label} 감정을 ${selectedEmotions.includes(emotion.id) ? '해제' : '선택'}합니다`}
                accessibilityState={{ selected: selectedEmotions.includes(emotion.id) }}
              >
                <Text style={{ fontSize: getFontSize(24), marginBottom: spacing(4), lineHeight: getFontSize(24) * 1.2 }}>
                  {emotion.icon}
                </Text>
                <Text
                  style={{
                    fontSize: getFontSize(12),
                    fontWeight: selectedEmotions.includes(emotion.id) ? '700' : '400',
                    color: selectedEmotions.includes(emotion.id) ? emotion.color : theme.colors.text,
                    letterSpacing: -0.2
                  }}
                >
                  {emotion.label}
                </Text>
              </Pressable>
            ))}
          </Box>

          <TextInput
            label="내용"
            value={content}
            onChangeText={setContent}
            mode="outlined"
            multiline
            numberOfLines={10}
            className="min-h-[150px]"
            style={{
              textAlignVertical: 'top',
              backgroundColor: theme.colors.surface
            }}
            theme={{
              colors: {
                text: theme.colors.text,
                placeholder: theme.colors.textSecondary,
                primary: theme.colors.primary,
              }
            }}
            placeholder="오늘 하루는 어땠나요?"
          />

          <StyledText variant="h3">
            태그
          </StyledText>
          <HStack className="items-center mb-3">
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              mode="outlined"
              className="flex-1"
              style={{ backgroundColor: theme.colors.surface }}
              theme={{
                colors: {
                  text: theme.colors.text,
                  placeholder: theme.colors.textSecondary,
                  primary: theme.colors.primary,
                }
              }}
              placeholder="태그 입력"
              onSubmitEditing={handleAddTag}
            />
            <IconButton
              icon="plus"
              size={24}
              iconColor={theme.colors.primary}
              onPress={handleAddTag}
              style={{ marginLeft: 8 }}
            />
          </HStack>
          <Box className="flex-row flex-wrap">
            {tags.map((tag, index) => (
              <Chip
                key={index}
                onClose={() => handleRemoveTag(tag)}
                className="m-1"
              >
                {tag}
              </Chip>
            ))}
          </Box>
        </StyledCard>

        <VStack className="p-4">
          <StyledButton
            title={isEditing ? '수정하기' : '저장하기'}
            variant="primary"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
          />
          {isEditing && (
            <StyledButton
              title="삭제하기"
              variant="secondary"
              onPress={handleDelete}
              disabled={isLoading}
              fullWidth
              style={{ marginTop: 8 }}
            />
          )}
          <StyledButton
            title="취소"
            variant="text"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            fullWidth
          />
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default JournalEntryScreen;