// components/ComfortWallForm.tsx
import React, { useState, useMemo } from 'react';
import { View, Text as RNText, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Text } from './ui';
import LoadingIndicator from './LoadingIndicator';
import TagSelector from './TagSelector';
import { useModernTheme } from '../contexts/ModernThemeContext';

interface ComfortWallFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    tag_ids: number[];
    is_anonymous: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

// interface Tag {
//   tag_id: number;
//   name: string;
// }

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;

const ComfortWallForm: React.FC<ComfortWallFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const { theme, isDark } = useModernTheme();
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true); // 기본값으로 익명 설정
  
  // 태그 선택 처리
  const handleTagSelect = (tagId: number) => {
    setTagIds(prevTagIds => [...prevTagIds, tagId]);
  };
  
  // 폼 제출 처리
  const handleSubmit = async () => {
    // 유효성 검사
    if (title.trim().length < 5) {
      Alert.alert('안내', '제목은 5자 이상 입력해주세요.');
      return;
    }
    
    if (content.trim().length < 20) {
      Alert.alert('안내', '내용은 20자 이상 입력해주세요.');
      return;
    }
    
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tag_ids: tagIds,
        is_anonymous: isAnonymous
      });
      
      // 성공 후 폼 초기화
      setTitle('');
      setContent('');
      setTagIds([]);
      setIsAnonymous(true);
    } catch (error) {
      console.error('게시물 제출 오류:', error);
      Alert.alert('오류', '게시물 작성 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };
  
  // 동적 스타일 생성
  const dynamicStyles = useMemo(() => StyleSheet.create({
    scrollContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      padding: 16,
      backgroundColor: theme.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.text.primarySecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: 8,
    },
    optional: {
      fontWeight: 'normal',
      fontSize: 14,
      color: theme.text.primarySecondary,
    },
    titleInput: {
      height: 48,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16,
      backgroundColor: theme.surface,
      color: theme.text.primary,
    },
    contentInput: {
      height: 200,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.surface,
      color: theme.text.primary,
    },
    charCount: {
      fontSize: 12,
      color: theme.text.primarySecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    helperText: {
      fontSize: 12,
      color: theme.text.primarySecondary,
      marginTop: 4,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: theme.primary,
      borderRadius: 4,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.primary,
    },
    anonymousText: {
      fontSize: 16,
      color: theme.text.primary,
    },
    noticeContainer: {
      backgroundColor: isDark ? 'rgba(255, 193, 7, 0.2)' : '#FFF3CD',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    noticeText: {
      fontSize: 14,
      color: isDark ? '#FFB300' : '#856404',
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    disabledButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#A9A9A9',
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    supportText: {
      fontSize: 14,
      color: theme.text.primarySecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  }), [theme, isDark]);

  return (
    <ScrollView style={dynamicStyles.scrollContainer}>
      <View style={dynamicStyles.container}>
        <Text style={dynamicStyles.title}>위로의 벽에 글 남기기</Text>
        <Text style={dynamicStyles.subtitle}>
          당신의 고민을 익명으로 공유하고 위로와 조언을 받아보세요.
        </Text>

        {/* 제목 입력 */}
        <View style={styles.inputContainer}>
          <Text style={dynamicStyles.label}>제목</Text>
          <TextInput
            style={dynamicStyles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력하세요 (5-100자)"
            placeholderTextColor={theme.text.primarySecondary}
            maxLength={TITLE_MAX_LENGTH}
          />
          <Text style={dynamicStyles.charCount}>
            {title.length}/{TITLE_MAX_LENGTH}
          </Text>
        </View>

        {/* 태그 선택 */}
        <View style={styles.inputContainer}>
          <Text style={dynamicStyles.label}>
            태그 <Text style={dynamicStyles.optional}>(선택사항)</Text>
          </Text>
          <TagSelector
            tags={[]} // Replace with the actual tags array
            onTagSelect={handleTagSelect}
            selectedTags={tagIds}
          />
          <Text style={dynamicStyles.helperText}>
            태그를 추가하면 비슷한 고민을 가진 사람들이 더 쉽게 찾을 수 있어요.
          </Text>
        </View>

        {/* 내용 입력 */}
        <View style={styles.inputContainer}>
          <Text style={dynamicStyles.label}>내용</Text>
          <TextInput
            style={dynamicStyles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="당신의 고민을 자유롭게 적어주세요 (20-2000자)"
            placeholderTextColor={theme.text.primarySecondary}
            multiline
            textAlignVertical="top"
            maxLength={CONTENT_MAX_LENGTH}
          />
          <Text style={dynamicStyles.charCount}>
            {content.length}/{CONTENT_MAX_LENGTH}
          </Text>
        </View>

        {/* 익명 설정 */}
        <View style={styles.anonymousContainer}>
          <TouchableOpacity
            style={[
              dynamicStyles.checkbox,
              isAnonymous && dynamicStyles.checkboxChecked
            ]}
            onPress={() => setIsAnonymous(!isAnonymous)}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel="익명으로 게시하기"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isAnonymous }}
          >
            {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <Text style={dynamicStyles.anonymousText}>익명으로 게시하기</Text>
        </View>

        {/* 안내 메시지 */}
        <View style={dynamicStyles.noticeContainer}>
          <Text style={dynamicStyles.noticeText}>
            ⚠️ 부적절한 내용이나 남을 비방하는 글은 신고될 수 있습니다.
          </Text>
        </View>

        {/* 제출 버튼 */}
        <TouchableOpacity
          style={[
            dynamicStyles.submitButton,
            (isLoading || title.trim().length < 5 || content.trim().length < 20) && dynamicStyles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={isLoading || title.trim().length < 5 || content.trim().length < 20}
          accessible={true}
          accessibilityLabel="작성 완료"
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading || title.trim().length < 5 || content.trim().length < 20 }}
        >
          {isLoading ? (
            <LoadingIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={dynamicStyles.submitButtonText}>작성 완료</Text>
          )}
        </TouchableOpacity>

        {/* 추가 안내 */}
        <Text style={dynamicStyles.supportText}>
          혼자 고민하지 마세요. 여기에 공유하면 많은 사람들이 당신에게 위로와 지지를 보낼 거예요.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ComfortWallForm;