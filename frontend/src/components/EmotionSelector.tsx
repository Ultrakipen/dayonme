// src/components/EmotionSelector.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Emotion {
  id: number;
  name: string;
  icon: string;
  color: string;
}

// 감정명을 실제 이모지로 매핑
const getEmotionEmoji = (emotionName: string): string => {
  const emojiMap: Record<string, string> = {
    '행복': '😊',
    '기쁨': '😄',
    '감사': '🙏',
    '위로': '🤗',
    '감동': '🥺',
    '슬픔': '😢',
    '우울': '😞',
    '불안': '😰',
    '걱정': '😟',
    '화남': '😠',
    '버럭': '😤',
    '지침': '😑',
    '무서움': '😨',
    '편함': '😌',
    '궁금': '🤔',
    '사랑': '❤️',
    '아픔': '🤕',
    '욕심': '🤑',
    '추억': '🥰',
    '설렘': '🤗',
    '황당': '🤨',
    '당황': '😲',
    '지루함': '😑',
    '고독': '😔',
    '충격': '😱'
  };
  
  // 정확한 매칭이 없으면 첫 글자나 부분 매칭 시도
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (emotionName.includes(key) || key.includes(emotionName)) {
      return emoji;
    }
  }
  
  return emotionName.charAt(0); // 기본값으로 첫 글자 사용
};

interface EmotionSelectorProps {
  emotions: Emotion[];
  selectedEmotions: number[];
  onSelect: (emotionId: number) => void;
  multiple?: boolean;
  containerStyle?: object;
}

const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  emotions,
  selectedEmotions,
  onSelect,
  // multiple = true,
  containerStyle,
}) => {
  const handleSelect = (emotionId: number) => {
    onSelect(emotionId);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.title}>오늘의 감정</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {emotions.map((emotion) => {
          const isSelected = selectedEmotions.includes(emotion.id);
          return (
            <TouchableOpacity
              key={emotion.id}
              style={[
                styles.emotionItem,
                isSelected && {
                  backgroundColor: `${emotion.color}15`,
                  borderColor: emotion.color,
                  borderWidth: 2,
                },
              ]}
              onPress={() => handleSelect(emotion.id)}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: isSelected ? emotion.color : `${emotion.color}20` },
                isSelected && {
                  shadowColor: emotion.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }
              ]}>
                <Text style={[
                  styles.iconText,
                  { color: isSelected ? '#FFFFFF' : emotion.color }
                ]}>
                  {getEmotionEmoji(emotion.name)}
                </Text>
              </View>
              <Text
                style={[
                  styles.emotionName,
                  { color: isSelected ? emotion.color : '#666666' },
                  isSelected && { fontWeight: '700' },
                ]}
              >
                {emotion.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
    color: '#333333',
  },
  scrollView: {
    paddingHorizontal: 8,
  },
  emotionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
    minWidth: 70,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 26,
  },
  emotionName: {
    marginTop: 6,
    fontSize: 12,
    color: '#666666',
  },
});

export default EmotionSelector;