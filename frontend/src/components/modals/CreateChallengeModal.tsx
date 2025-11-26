// src/components/modals/CreateChallengeModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text as RNText,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Modal,
  Portal,
  TextInput,
  Button,
  Title,
  Paragraph,
  Card,
  useTheme as usePaperTheme,
  HelperText,
  IconButton,
  Switch,
  Chip,
  Snackbar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { normalize, normalizeIcon } from '../../utils/responsive';
import { useModernTheme } from '../../contexts/ModernThemeContext';

import { ChallengeCreateData } from '../../types/challengeTypes';
import TagSearchInput from '../TagSearchInput';

interface CreateChallengeModalProps {
  visible: boolean;
  onDismiss: () => void;
  onCreateChallenge: (data: ChallengeCreateData) => Promise<void>;
  isLoading?: boolean;
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  visible,
  onDismiss,
  onCreateChallenge,
  isLoading = false,
}) => {
  const paperTheme = usePaperTheme();
  const { theme, isDark } = useModernTheme();
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const screenHeight = Dimensions.get('window').height;
  
  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7일 후
  const [isPublic, setIsPublic] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [selectedTags, setSelectedTags] = useState<{tag_id: number, name: string}[]>([]);
  
// 날짜 입력 상태로 변경
const [startDateString, setStartDateString] = useState('');
const [endDateString, setEndDateString] = useState('');
  
  // 유효성 검사
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    dates: '',
    maxParticipants: '',
  });

  // 폼 초기화 및 애니메이션 효과
const resetForm = () => {
  setTitle('');
  setDescription('');
  setStartDate(new Date());
  setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  setStartDateString('');
  setEndDateString('');
  setIsPublic(true);
  setMaxParticipants('');
  setSelectedTags([]);
  setErrors({
    title: '',
    description: '',
    dates: '',
    maxParticipants: '',
  });
};

// 모달 애니메이션 효과
useEffect(() => {
  if (visible) {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  } else {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }
}, [visible, fadeAnim]);

  // 유효성 검사 함수
  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      description: '',
      dates: '',
      maxParticipants: '',
    };
    
    let isValid = true;

    // 제목 검사
    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
      isValid = false;
    } else if (title.trim().length < 3) {
      newErrors.title = '제목은 3자 이상 입력해주세요.';
      isValid = false;
    } else if (title.trim().length > 100) {
      newErrors.title = '제목은 100자 이하로 입력해주세요.';
      isValid = false;
    }

    // 설명 검사
    if (description.trim() && description.trim().length > 500) {
      newErrors.description = '설명은 500자 이하로 입력해주세요.';
      isValid = false;
    }

 // 날짜 검사
if (!startDateString.trim()) {
  newErrors.dates = '시작일을 입력해주세요.';
  isValid = false;
} else if (!endDateString.trim()) {
  newErrors.dates = '종료일을 입력해주세요.';
  isValid = false;
} else {
  const start = new Date(startDateString);
  const end = new Date(endDateString);
  const now = new Date();
  const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (isNaN(start.getTime())) {
    newErrors.dates = '올바른 시작일 형식을 입력해주세요. (YYYY-MM-DD)';
    isValid = false;
  } else if (isNaN(end.getTime())) {
    newErrors.dates = '올바른 종료일 형식을 입력해주세요. (YYYY-MM-DD)';
    isValid = false;
  } else if (start < now) {
    newErrors.dates = '시작일은 오늘 이후로 설정해주세요.';
    isValid = false;
  } else if (end <= start) {
    newErrors.dates = '종료일은 시작일보다 늦어야 합니다.';
    isValid = false;
  } else if (end > oneYearLater) {
    newErrors.dates = '챌린지 기간은 1년을 초과할 수 없습니다.';
    isValid = false;
  }
}

    // 최대 참여자 수 검사
    if (maxParticipants.trim()) {
      const maxNum = parseInt(maxParticipants);
      if (isNaN(maxNum) || maxNum < 2) {
        newErrors.maxParticipants = '최대 참여자 수는 2명 이상이어야 합니다.';
        isValid = false;
      } else if (maxNum > 1000) {
        newErrors.maxParticipants = '최대 참여자 수는 1000명을 초과할 수 없습니다.';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // 챌린지 생성 처리
  const handleCreateChallenge = async () => {
    if (!validateForm()) {
      return;
    }

    try {
   const challengeData: ChallengeCreateData = {
  title: title.trim(),
  description: description.trim() || undefined,
  start_date: startDateString.trim(),
  end_date: endDateString.trim(),
  is_public: isPublic,
  max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
  tags: selectedTags.map(tag => tag.name),
};

      await onCreateChallenge(challengeData);
      
      setShowSuccessSnackbar(true);
      setTimeout(() => {
        resetForm();
        onDismiss();
      }, 1500);
    } catch (error: any) {
      Alert.alert(
        '오류',
        error.message || '챌린지 생성 중 오류가 발생했습니다.'
      );
    }
  };

// 날짜 문자열 변경 핸들러
const handleStartDateStringChange = (text: string) => {
  setStartDateString(text);
  const date = new Date(text);
  if (!isNaN(date.getTime())) {
    setStartDate(date);
  }
};

const handleEndDateStringChange = (text: string) => {
  setEndDateString(text);
  const date = new Date(text);
  if (!isNaN(date.getTime())) {
    setEndDate(date);
  }
};

  // 모달 닫기
  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  // 태그 선택 핸들러
  const handleTagSelect = (tag: {tag_id: number, name: string}) => {
    if (selectedTags.length < 5 && !selectedTags.find(t => t.tag_id === tag.tag_id)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 태그 제거 핸들러
  const handleTagRemove = (tagId: number) => {
    setSelectedTags(selectedTags.filter(tag => tag.tag_id !== tagId));
  };

// 챌린지 기간 계산
const getDurationDays = () => {
  if (!startDateString || !endDateString) return 0;
  
  const start = new Date(startDateString);
  const end = new Date(endDateString);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[
          styles.modalContent,
          {
            backgroundColor: isDark ? '#1a1a1a' : 'white',
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim, backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
        <Title style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#4a0e4e' }]}>새 챌린지 만들기</Title>
        
        {/* 챌린지 제목 */}
        <TextInput
          mode="outlined"
          label="챌린지 제목 *"
          value={title}
          onChangeText={setTitle}
          style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
          maxLength={100}
          error={!!errors.title}
          textColor={isDark ? '#ffffff' : '#000000'}
          placeholderTextColor={isDark ? '#E0E0E0' : '#666666'}
          theme={{
            colors: {
              text: isDark ? '#ffffff' : '#000000',
              placeholder: isDark ? '#E0E0E0' : '#666666',
              background: isDark ? '#2a2a2a' : '#fff',
            }
          }}
        />
        <HelperText type="error" visible={!!errors.title}>
          {errors.title}
        </HelperText>
        <HelperText type="info" visible={!errors.title}>
          {title.length}/100
        </HelperText>

        {/* 챌린지 설명 */}
        <TextInput
          mode="outlined"
          label="챌린지 설명 (선택사항)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
          maxLength={500}
          error={!!errors.description}
          textColor={isDark ? '#ffffff' : '#000000'}
          placeholderTextColor={isDark ? '#E0E0E0' : '#666666'}
          theme={{
            colors: {
              text: isDark ? '#ffffff' : '#000000',
              placeholder: isDark ? '#E0E0E0' : '#666666',
              background: isDark ? '#2a2a2a' : '#fff',
            }
          }}
        />
        <HelperText type="error" visible={!!errors.description}>
          {errors.description}
        </HelperText>
        <HelperText type="info" visible={!errors.description}>
          {description.length}/500
        </HelperText>

       {/* 날짜 설정 */}
<View style={styles.dateSection}>
  <Title style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#4a0e4e' }]}>챌린지 기간</Title>
  
  <TextInput
    mode="outlined"
    label="시작일 (YYYY-MM-DD)"
    value={startDateString}
    onChangeText={handleStartDateStringChange}
    placeholder="2025-08-11"
    style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
    error={!!errors.dates}
    textColor={isDark ? '#ffffff' : '#000000'}
    placeholderTextColor={isDark ? '#E0E0E0' : '#666666'}
    theme={{
      colors: {
        text: isDark ? '#ffffff' : '#000000',
        placeholder: isDark ? '#E0E0E0' : '#666666',
        background: isDark ? '#2a2a2a' : '#fff',
      }
    }}
  />
  
  <TextInput
    mode="outlined"
    label="종료일 (YYYY-MM-DD)"
    value={endDateString}
    onChangeText={handleEndDateStringChange}
    placeholder="2025-08-18"
    style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
    error={!!errors.dates}
    textColor={isDark ? '#ffffff' : '#000000'}
    placeholderTextColor={isDark ? '#E0E0E0' : '#666666'}
    theme={{
      colors: {
        text: isDark ? '#ffffff' : '#000000',
        placeholder: isDark ? '#E0E0E0' : '#666666',
        background: isDark ? '#2a2a2a' : '#fff',
      }
    }}
  />
  
  <HelperText type="error" visible={!!errors.dates}>
    {errors.dates}
  </HelperText>
 <HelperText type="info" visible={!errors.dates && !!startDateString && !!endDateString}>
  총 {getDurationDays()}일간 진행됩니다.
</HelperText>
<HelperText type="info" visible={!startDateString || !endDateString}>
  날짜 형식: YYYY-MM-DD (예: 2025-08-11)
</HelperText>
</View>

        {/* 태그 설정 */}
        <View style={styles.tagSection}>
          <Title style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#4a0e4e' }]}>태그 설정 (최대 5개)</Title>
          <TagSearchInput
            onTagSelect={handleTagSelect}
            selectedTags={selectedTags}
            maxTags={5}
            placeholder="챌린지 관련 태그를 추가하세요"
          />
          {selectedTags.length > 0 && (
            <View style={styles.selectedTagsContainer}>
              {selectedTags.map(tag => (
                <TouchableOpacity
                  key={tag.tag_id}
                  style={styles.selectedTag}
                  onPress={() => handleTagRemove(tag.tag_id)}
                >
                  <RNText style={styles.selectedTagText}>{tag.name}</RNText>
                  <RNText style={styles.removeTagText}> ×</RNText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 최대 참여자 수 */}
        <TextInput
          mode="outlined"
          label="최대 참여자 수 (선택사항)"
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
          error={!!errors.maxParticipants}
          placeholder="제한 없음"
          textColor={isDark ? '#ffffff' : '#000000'}
          placeholderTextColor={isDark ? '#E0E0E0' : '#666666'}
          theme={{
            colors: {
              text: isDark ? '#ffffff' : '#000000',
              placeholder: isDark ? '#E0E0E0' : '#666666',
              background: isDark ? '#2a2a2a' : '#fff',
            }
          }}
        />
        <HelperText type="error" visible={!!errors.maxParticipants}>
          {errors.maxParticipants}
        </HelperText>

        {/* 공개/비공개 설정 */}
        <Card style={[styles.visibilityCard, { backgroundColor: isDark ? '#262626' : '#f8f9fa' }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#4a0e4e' }]}>공개 설정</Title>
            <View style={styles.visibilityOptions}>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  { backgroundColor: isDark ? '#2a2a2a' : '#fff' },
                  isPublic && styles.selectedVisibilityOption
                ]}
                onPress={() => setIsPublic(true)}
              >
                <RNText style={[
                  styles.visibilityOptionText,
                  isPublic && styles.selectedVisibilityOptionText,
                  { color: isDark ? '#ffffff' : '#333333' }
                ]}>
                  공개
                </RNText>
                <RNText style={[styles.visibilityDescription, { color: isDark ? '#cccccc' : '#666666' }]}>
                  누구나 참여할 수 있습니다
                </RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  { backgroundColor: isDark ? '#2a2a2a' : '#fff' },
                  !isPublic && styles.selectedVisibilityOption
                ]}
                onPress={() => setIsPublic(false)}
              >
                <RNText style={[
                  styles.visibilityOptionText,
                  !isPublic && styles.selectedVisibilityOptionText,
                  { color: isDark ? '#ffffff' : '#333333' }
                ]}>
                  비공개
                </RNText>
                <RNText style={[styles.visibilityDescription, { color: isDark ? '#cccccc' : '#666666' }]}>
                  초대받은 사람만 참여할 수 있습니다
                </RNText>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* 버튼 영역 */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleDismiss}
            style={[styles.button, styles.cancelButton]}
            disabled={isLoading}
            labelStyle={styles.cancelButtonText}
          >
            취소
          </Button>
          <Button
            mode="contained"
            onPress={handleCreateChallenge}
            style={[styles.button, styles.submitButton]}
            loading={isLoading}
            disabled={isLoading || !title.trim()}
            labelStyle={styles.submitButtonText}
          >
            챌린지 만들기
          </Button>
        </View>
          </ScrollView>
        </Animated.View>
      </Modal>

      <Snackbar
        visible={showSuccessSnackbar}
        onDismiss={() => setShowSuccessSnackbar(false)}
        duration={1500}
        style={styles.successSnackbar}
      >
        ✅ 챌린지가 성공적으로 생성되었습니다!
      </Snackbar>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: '15%',
    maxHeight: '70%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  modalTitle: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
    color: '#4a0e4e',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4a0e4e',
  },
dateSection: {
  marginVertical: 16,
},
  tagSection: {
    marginVertical: 16,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a0e4e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagText: {
    color: '#fff',
    fontSize: 11,
  },
  removeTagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  visibilityCard: {
    marginVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  visibilityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visibilityOption: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    alignItems: 'center',
  },
  selectedVisibilityOption: {
    borderColor: '#4a0e4e',
    backgroundColor: '#f0e6ff',
  },
  visibilityOptionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  selectedVisibilityOptionText: {
    color: '#4a0e4e',
  },
  visibilityDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 8,
    paddingVertical: 4,
  },
  cancelButton: {
    borderColor: '#d1d5db',
    borderWidth: 1.5,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4a0e4e',
    elevation: 2,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  successSnackbar: {
    backgroundColor: '#10b981',
    marginBottom: 80,
  },
});

export default CreateChallengeModal;