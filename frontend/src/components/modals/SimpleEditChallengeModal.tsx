// src/components/modals/SimpleEditChallengeModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { normalize, normalizeIcon } from '../../utils/responsive';
import { useTheme } from '../../contexts/ThemeContext';

interface Challenge {
  challenge_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category?: string;
}

interface ChallengeUpdateData {
  title: string;
  description: string;
  start_date?: string;
  end_date?: string;
  category?: string;
}

interface SimpleEditChallengeModalProps {
  visible: boolean;
  onDismiss: () => void;
  onUpdateChallenge: (data: ChallengeUpdateData) => Promise<void>;
  challenge: Challenge;
  isLoading?: boolean;
}

const COLORS = {
  primary: '#6366F1',
  secondary: '#EC4899',
  accent: '#10B981',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#FAFBFC',
  darkBackground: '#0D0D1E',
  surface: '#FFFFFF',
  darkSurface: '#1A1D29',
  text: '#1E293B',
  darkText: '#F8FAFC',
  textSecondary: '#64748B',
  darkTextSecondary: '#94A3B8',
  border: '#E2E8F0',
  darkBorder: '#334155',
};

const SimpleEditChallengeModal: React.FC<SimpleEditChallengeModalProps> = ({
  visible,
  onDismiss,
  onUpdateChallenge,
  challenge,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();

  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // 챌린지 데이터로 폼 초기화
  useEffect(() => {
    if (challenge && visible) {
      setTitle(challenge.title || '');
      setDescription(challenge.description || '');
      setCategory(challenge.category || '');
    }
  }, [challenge, visible]);

  // 폼 초기화
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
  };

  // 유효성 검사
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('오류', '제목을 입력해주세요.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('오류', '설명을 입력해주세요.');
      return false;
    }
    return true;
  };

  // 저장 처리
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const updateData: ChallengeUpdateData = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
      };

      await onUpdateChallenge(updateData);
      resetForm();
    } catch (error) {
      if (__DEV__) console.error('챌린지 수정 오류:', error);
    }
  };

  // 취소 처리
  const handleCancel = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.background }
      ]}>
        {/* 헤더 */}
        <View style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? COLORS.darkSurface : COLORS.surface,
            borderBottomColor: isDarkMode ? COLORS.darkBorder : COLORS.border
          }
        ]}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <MaterialCommunityIcons
              name="close"
              size={normalizeIcon(24)}
              color={isDarkMode ? COLORS.darkText : COLORS.text}
            />
          </TouchableOpacity>

          <Text style={[
            styles.headerTitle,
            { color: isDarkMode ? COLORS.darkText : COLORS.text }
          ]}>
            챌린지 수정
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerButton, styles.saveButton]}
            disabled={isLoading}
          >
            <Text style={[
              styles.saveButtonText,
              { color: COLORS.primary },
              isLoading && { opacity: 0.5 }
            ]}>
              {isLoading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 내용 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 제목 입력 */}
          <View style={styles.inputGroup}>
            <Text style={[
              styles.label,
              { color: isDarkMode ? COLORS.darkText : COLORS.text }
            ]}>
              제목 *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDarkMode ? COLORS.darkSurface : COLORS.surface,
                  borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border,
                  color: isDarkMode ? COLORS.darkText : COLORS.text,
                }
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="챌린지 제목을 입력하세요"
              placeholderTextColor={isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary}
              maxLength={100}
              multiline={false}
            />
          </View>

          {/* 설명 입력 */}
          <View style={styles.inputGroup}>
            <Text style={[
              styles.label,
              { color: isDarkMode ? COLORS.darkText : COLORS.text }
            ]}>
              설명 *
            </Text>
            <TextInput
              style={[
                styles.textAreaInput,
                {
                  backgroundColor: isDarkMode ? COLORS.darkSurface : COLORS.surface,
                  borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border,
                  color: isDarkMode ? COLORS.darkText : COLORS.text,
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="챌린지에 대한 상세한 설명을 입력하세요"
              placeholderTextColor={isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary}
              maxLength={500}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* 카테고리 입력 */}
          <View style={styles.inputGroup}>
            <Text style={[
              styles.label,
              { color: isDarkMode ? COLORS.darkText : COLORS.text }
            ]}>
              카테고리
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDarkMode ? COLORS.darkSurface : COLORS.surface,
                  borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border,
                  color: isDarkMode ? COLORS.darkText : COLORS.text,
                }
              ]}
              value={category}
              onChangeText={setCategory}
              placeholder="카테고리를 입력하세요 (선택사항)"
              placeholderTextColor={isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary}
              maxLength={50}
              multiline={false}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 48,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 120,
  },
});

export default SimpleEditChallengeModal;