// Clean CreateChallengeScreen - Fixed Navigation
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Animated,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import challengeService, { ChallengeCreateData } from '../services/api/challengeService';
import { ChallengeStackParamList } from '../navigation/ChallengeStack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import apiClient from '../services/api/apiClient';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { getScale } from '../utils/responsive';

// React Native 0.80 호환: 동적 화면 크기 계산
const BASE_WIDTH = 360; // 논리적 픽셀 (DP) - Android 표준
const BASE_HEIGHT = 780; // 논리적 픽셀 (DP)

const getScreenDimensions = () => {
  try {
    const dims = Dimensions.get('window');
    if (dims.width > 0 && dims.height > 0) return dims;
  } catch (e) {}
  return { width: BASE_WIDTH, height: BASE_HEIGHT };
};
const scaleWidth = (size: number) => {
  const { width } = getScreenDimensions();
  return width / BASE_WIDTH * size;
};
const scaleHeight = (size: number) => {
  const { height } = getScreenDimensions();
  return height / BASE_HEIGHT * size;
};
const scaleFontSize = (size: number) => Math.max(Math.round(size * getScale()), 14);

// 이미지 최적화 설정 (모바일 최적화 - S25 FHD+ 기준)
const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_WIDTH: 1080,  // S25 FHD+ 가로 해상도 기준
  MAX_HEIGHT: 1440, // 세로 비율 고려 (4:3)
  QUALITY: 0.65,    // 트래픽 절감을 위한 최적 압축률
  WEBP_QUALITY: 0.8, // WebP 전용 품질 (더 나은 압축)
  ALLOWED_TYPES: ['image/webp', 'image/jpeg', 'image/jpg', 'image/png'], // WebP 우선
  PREFERRED_TYPE: 'image/webp' as const,
};

type CreateChallengeScreenNavigationProp = NativeStackNavigationProp<
  ChallengeStackParamList,
  'CreateChallenge'
>;

const CreateChallengeScreen = () => {
  const navigation = useNavigation<CreateChallengeScreenNavigationProp>();
  const { theme, isDark } = useModernTheme();

  // 애니메이션 refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [formData, setFormData] = useState<ChallengeCreateData>({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: [],
  });

  const [currentTag, setCurrentTag] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [imageUris, setImageUris] = useState<string[]>([]);

  // 커스텀 알럿 상태
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'error'
  });

  // 초기 애니메이션
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 커스텀 알럿 헬퍼
  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'error', onConfirm?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (formData.title.length < 3) {
      newErrors.title = '제목은 최소 3자 이상이어야 합니다.';
    }

    if (!formData.description.trim()) {
      newErrors.description = '설명을 입력해주세요.';
    } else if (formData.description.length < 10) {
      newErrors.description = '설명은 최소 10자 이상 입력해주세요.';
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      newErrors.start_date = '시작일은 오늘 이후여야 합니다.';
    }

    if (endDate <= startDate) {
      newErrors.end_date = '종료일은 시작일 이후여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (__DEV__) console.log('🎯 챌린지 생성 버튼 클릭됨');
    if (__DEV__) console.log('📝 현재 폼 데이터:', formData);

    // 검증 로직을 직접 실행하여 즉시 결과 확인
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (formData.title.length < 3) {
      newErrors.title = '제목은 최소 3자 이상이어야 합니다.';
    }

    if (!formData.description.trim()) {
      newErrors.description = '설명을 입력해주세요.';
    } else if (formData.description.length < 10) {
      newErrors.description = '설명은 최소 10자 이상 입력해주세요.';
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      newErrors.start_date = '시작일은 오늘 이후여야 합니다.';
    }

    if (endDate <= startDate) {
      newErrors.end_date = '종료일은 시작일 이후여야 합니다.';
    }

    const isValid = Object.keys(newErrors).length === 0;
    if (__DEV__) console.log('✅ 폼 검증 결과:', isValid);
    if (__DEV__) console.log('❌ 검증 오류:', newErrors);

    // 에러 상태 업데이트
    setErrors(newErrors);

    if (!isValid) {
      if (__DEV__) console.log('❌ 폼 검증 실패로 중단');
      return;
    }

    try {
      if (__DEV__) console.log('🚀 챌린지 생성 API 호출 시작');
      setLoading(true);

      // 이미지 서버에 업로드 (강화된 에러 핸들링 + 재시도 로직)
      const uploadedImageUrls: string[] = [];
      const failedImages: string[] = [];
      const MAX_RETRIES = 2;

      if (imageUris.length > 0) {
        if (__DEV__) console.log('📸 이미지 업로드 시작:', imageUris.length, '개');

        for (let i = 0; i < imageUris.length; i++) {
          const imageUri = imageUris[i];
          let uploadSuccess = false;

          for (let retry = 0; retry <= MAX_RETRIES && !uploadSuccess; retry++) {
            try {
              const imageFormData = new FormData();
              imageFormData.append('images', {
                uri: imageUri,
                type: 'image/jpeg',
                name: `challenge_${Date.now()}_${i}.jpg`,
              } as any);

              const uploadResponse = await apiClient.post('/uploads/images', imageFormData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
                timeout: 30000, // 30초 타임아웃
              });

              if (uploadResponse.data.status === 'success' && uploadResponse.data.data.images) {
                uploadedImageUrls.push(...uploadResponse.data.data.images.map((img: any) => img.url));
                uploadSuccess = true;
                if (__DEV__) console.log(`✅ 이미지 ${i + 1} 업로드 성공`);
              }
            } catch (uploadError: any) {
              if (__DEV__) console.log(`⚠️ 이미지 ${i + 1} 업로드 실패 (시도 ${retry + 1}/${MAX_RETRIES + 1}):`, uploadError.message);

              if (retry === MAX_RETRIES) {
                failedImages.push(imageUri);
              } else {
                // 재시도 전 대기 (점진적 백오프)
                await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
              }
            }
          }
        }

        // 부분 실패 처리
        if (failedImages.length > 0 && uploadedImageUrls.length > 0) {
          // 일부만 성공한 경우 - 사용자에게 확인
          showAlert(
            '일부 이미지 업로드 실패',
            `${failedImages.length}개의 이미지 업로드에 실패했습니다.\n성공한 ${uploadedImageUrls.length}개의 이미지로 챌린지를 생성하시겠습니까?`
          );
          // 계속 진행 (실패한 이미지 제외)
        } else if (failedImages.length > 0 && uploadedImageUrls.length === 0) {
          // 모든 이미지 업로드 실패
          showAlert('이미지 업로드 실패', '이미지 업로드에 실패했습니다.\n이미지 없이 챌린지를 생성합니다.');
          // 이미지 없이 계속 진행
        }

        if (__DEV__) console.log('📤 최종 업로드된 이미지 URLs:', uploadedImageUrls.length, '개');
      }

      // 챌린지 생성 (업로드된 이미지 URL 사용)
      const response = await challengeService.createChallenge({
        ...formData,
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description),
        is_public: true,
        image_urls: uploadedImageUrls // 서버 이미지 URL 배열 사용
      });

      // 챌린지 생성 후 캐시 무효화
      challengeService.clearCache();
      if (__DEV__) console.log('✅ 챌린지 생성 완료 - 캐시 무효화됨');
      if (__DEV__) console.log('📋 응답 데이터 구조:', response.data);

      // 응답 구조 확인 및 challengeId 추출
      let challengeId;
      if (response.data?.data?.challenge_id) {
        challengeId = response.data.data.challenge_id;
      } else if (response.data?.challenge_id) {
        challengeId = response.data.challenge_id;
      } else if (response.data?.id) {
        challengeId = response.data.id;
      } else {
        if (__DEV__) console.warn('⚠️ 챌린지 ID를 찾을 수 없음. 메인으로 이동');
      }

      // 성공 후 즉시 네비게이션 처리 (Alert 없이)
      try {
        if (challengeId) {
          if (__DEV__) console.log('🔄 챌린지 상세로 이동:', challengeId);
          navigation.reset({
            index: 1,
            routes: [
              { name: 'ChallengeMain' },
              {
                name: 'ChallengeDetail',
                params: { challengeId: challengeId }
              }
            ],
          });
        } else {
          if (__DEV__) console.log('🔄 메인으로 이동 (ID 없음)');
          navigation.navigate('ChallengeMain');
        }

        // 네비게이션 성공 후 알림 표시
        setTimeout(() => {
          showAlert('챌린지 생성 완료', '새로운 챌린지가 생성되었습니다!', 'success');
        }, 100);

      } catch (navError) {
        if (__DEV__) console.error('❌ 네비게이션 오류:', navError);
        // 네비게이션 실패시 뒤로 가기
        navigation.goBack();
        showAlert('챌린지 생성 완료', '새로운 챌린지가 생성되었습니다! 하지만 화면 이동 중 오류가 발생했습니다.', 'success');
      }

    } catch (err: any) {
      if (__DEV__) {
        console.error('챌린지 생성 오류:', err);
        console.error('요청 데이터:', formData);
        console.error('오류 응답:', err.response?.data);
        console.error('오류 상태:', err.response?.status);
      }

      const errorMessage = err.response?.data?.message ||
                          err.message ||
                          '챌린지 생성 중 문제가 발생했습니다.';

      showAlert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        start_date: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        end_date: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim()) && (formData.tags?.length || 0) < 5) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  // 입력값 sanitization (XSS 방지)
  const sanitizeInput = (text: string): string => {
    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  // 이미지 파일 크기 검증
  const validateImageSize = (fileSize?: number): boolean => {
    if (!fileSize) return true;
    if (fileSize > IMAGE_CONFIG.MAX_FILE_SIZE) {
      showAlert('파일 크기 초과', `이미지 파일은 최대 ${IMAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB까지 업로드 가능합니다.`);
      return false;
    }
    return true;
  };

  // 이미지 선택 핸들러 (최적화 및 보안 강화)
  const handleSelectImages = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 3 - imageUris.length,
        quality: IMAGE_CONFIG.QUALITY,
        maxWidth: IMAGE_CONFIG.MAX_WIDTH,
        maxHeight: IMAGE_CONFIG.MAX_HEIGHT,
        includeBase64: false, // 메모리 절약
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showAlert('오류', '이미지를 선택하는 중 문제가 발생했습니다.');
        return;
      }

      if (result.assets) {
        // 파일 크기 및 타입 검증
        const validAssets = result.assets.filter(asset => {
          // 파일 크기 검증
          if (!validateImageSize(asset.fileSize)) {
            return false;
          }

          // 파일 타입 검증
          if (asset.type && !IMAGE_CONFIG.ALLOWED_TYPES.includes(asset.type)) {
            showAlert('오류', '지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP만 가능)');
            return false;
          }

          return true;
        });

        // WebP 우선 정렬 (트래픽 최적화)
        const sortedAssets = validAssets.sort((a, b) => {
          const aIsWebP = a.type === IMAGE_CONFIG.PREFERRED_TYPE;
          const bIsWebP = b.type === IMAGE_CONFIG.PREFERRED_TYPE;
          if (aIsWebP && !bIsWebP) return -1;
          if (!aIsWebP && bIsWebP) return 1;
          return 0;
        });

        const newUris = sortedAssets
          .map(asset => asset.uri)
          .filter((uri): uri is string => Boolean(uri));

        setImageUris(prev => [...prev, ...newUris].slice(0, 3));

        // WebP 사용 시 사용자에게 알림
        const webpCount = sortedAssets.filter(a => a.type === IMAGE_CONFIG.PREFERRED_TYPE).length;
        if (webpCount > 0 && __DEV__) {
          console.log(`✅ WebP 이미지 ${webpCount}개 선택됨 (트래픽 최적화)`);
        }
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      showAlert('오류', '이미지를 선택하는 중 문제가 발생했습니다.');
    }
  };

  // 이미지 제거 핸들러
  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Header */}
      <SafeAreaView style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={scaleFontSize(24)} color={isDark ? '#ffffff' : '#262626'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#262626' }]}>챌린지 만들기</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      <Animated.ScrollView
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Title */}
          <View style={styles.section}>
            <View style={styles.labelWithIcon}>
              <MaterialCommunityIcons name="trophy" size={scaleFontSize(22)} color={theme.text.secondary} />
              <Text style={[styles.label, { color: isDark ? '#ffffff' : '#262626' }]}>챌린지 제목 *</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: errors.title ? (isDark ? '#2a1a1a' : '#fff5f5') : theme.colors.card,
                  borderColor: theme.colors.border,
                  color: isDark ? '#ffffff' : '#262626'
                },
                errors.title && styles.inputError
              ]}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="예: 30일 감정 기록 챌린지"
              placeholderTextColor={isDark ? '#888888' : '#9CA3AF'}
              maxLength={50}
            />
            <Text style={[styles.characterCount, { color: isDark ? '#b3b3b3' : '#8e8e8e' }]}>{formData.title.length}/50</Text>
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.labelWithIcon}>
              <MaterialCommunityIcons name="text-box" size={scaleFontSize(22)} color={theme.text.secondary} />
              <Text style={[styles.label, { color: isDark ? '#ffffff' : '#262626' }]}>챌린지 설명 *</Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: errors.description ? (isDark ? '#2a1a1a' : '#fff5f5') : theme.colors.card,
                  borderColor: theme.colors.border,
                  color: isDark ? '#ffffff' : '#262626'
                },
                errors.description && styles.inputError
              ]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="챌린지의 목적과 규칙을 자세히 설명해주세요"
              placeholderTextColor={isDark ? '#888888' : '#9CA3AF'}
              multiline
              scrollEnabled
              textAlignVertical="top"
              maxLength={300}
              blurOnSubmit={false}
              returnKeyType="default"
              editable={true}
            />
            <Text style={[styles.characterCount, { color: isDark ? '#b3b3b3' : '#8e8e8e' }]}>{formData.description.length}/300</Text>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <View style={styles.sectionTitleWithIcon}>
              <MaterialCommunityIcons name="calendar-range" size={scaleFontSize(22)} color={theme.text.secondary} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#262626' }]}>챌린지 기간</Text>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={[styles.dateLabel, { color: isDark ? '#ffffff' : '#262626' }]}>시작일 *</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }, errors.start_date && styles.inputError]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <MaterialCommunityIcons name="calendar" size={scaleFontSize(18)} color={theme.colors.accentText} />
                  <Text style={[styles.dateText, { color: isDark ? '#ffffff' : '#262626' }]}>{formatDate(formData.start_date)}</Text>
                </TouchableOpacity>
                {errors.start_date && <Text style={styles.errorText}>{errors.start_date}</Text>}
              </View>

              <View style={styles.dateItem}>
                <Text style={[styles.dateLabel, { color: isDark ? '#ffffff' : '#262626' }]}>종료일 *</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }, errors.end_date && styles.inputError]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <MaterialCommunityIcons name="calendar" size={scaleFontSize(18)} color={theme.colors.accentText} />
                  <Text style={[styles.dateText, { color: isDark ? '#ffffff' : '#262626' }]}>{formatDate(formData.end_date)}</Text>
                </TouchableOpacity>
                {errors.end_date && <Text style={styles.errorText}>{errors.end_date}</Text>}
              </View>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <View style={styles.sectionTitleWithIcon}>
              <MaterialCommunityIcons name="tag-multiple" size={scaleFontSize(22)} color={theme.text.secondary} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#262626' }]}>태그 (최대 5개)</Text>
            </View>

            <View style={styles.tagInputRow}>
              <TextInput
                style={[
                  styles.tagInput,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    color: isDark ? '#ffffff' : '#262626'
                  }
                ]}
                value={currentTag}
                onChangeText={setCurrentTag}
                placeholder="태그 입력"
                placeholderTextColor={isDark ? '#888888' : '#9CA3AF'}
                maxLength={15}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity
                style={[styles.addTagButton, { backgroundColor: theme.colors.primary }, !currentTag.trim() && styles.addTagButtonDisabled]}
                onPress={addTag}
                disabled={!currentTag.trim() || (formData.tags?.length || 0) >= 5}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={scaleFontSize(20)}
                  color={currentTag.trim() ? theme.colors.onAccent : theme.text.tertiary}
                />
              </TouchableOpacity>
            </View>

            {formData.tags && formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.tagText, { color: theme.colors.onAccent }]}>#{tag}</Text>
                    <TouchableOpacity
                      style={styles.removeTagButton}
                      onPress={() => removeTag(tag)}
                    >
                      <MaterialCommunityIcons name="close" size={scaleFontSize(16)} color={theme.colors.onAccent} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Image Upload Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleWithIcon}>
              <MaterialCommunityIcons name="image-multiple" size={scaleFontSize(22)} color={theme.text.secondary} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#262626' }]}>이미지 (최대 3장)</Text>
            </View>
            <Text style={[styles.helperText, { color: isDark ? '#b3b3b3' : '#8e8e8e' }]}>최대 5MB, JPG/PNG/WebP 형식</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
              {/* 이미지 미리보기 */}
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri }}
                    style={styles.imagePreview}
                    progressiveRenderingEnabled={true}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={scaleFontSize(22)} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* 이미지 추가 버튼 */}
              {imageUris.length < 3 && (
                <TouchableOpacity
                  style={[styles.addImageButton, { backgroundColor: theme.colors.tint, borderColor: theme.colors.primary }]}
                  onPress={handleSelectImages}
                >
                  <MaterialCommunityIcons name="plus" size={scaleFontSize(28)} color={theme.colors.accentText} />
                  <Text style={[styles.addImageText, { color: isDark ? '#ffffff' : '#262626' }]}>
                    {imageUris.length === 0 ? '이미지 추가' : `${imageUris.length}/3`}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Max Participants */}
          <View style={styles.section}>
            <View style={styles.sectionTitleWithIcon}>
              <MaterialCommunityIcons name="account-group" size={scaleFontSize(22)} color={theme.text.secondary} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#262626' }]}>참가자 설정</Text>
            </View>
            <Text style={[styles.label, { color: isDark ? '#ffffff' : '#262626' }]}>최대 참가자 수 (선택사항)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  color: isDark ? '#ffffff' : '#262626'
                }
              ]}
              value={formData.max_participants?.toString() || ''}
              onChangeText={(text) => {
                if (text === '') {
                  setFormData({ ...formData, max_participants: undefined });
                } else {
                  const value = parseInt(text.replace(/[^0-9]/g, ''));
                  if (!isNaN(value) && value > 0) {
                    setFormData({ ...formData, max_participants: value });
                  }
                }
              }}
              placeholder="예: 100"
              placeholderTextColor={isDark ? '#888888' : '#9CA3AF'}
              keyboardType="number-pad"
            />
            <Text style={[styles.helperText, { color: isDark ? '#b3b3b3' : '#8e8e8e' }]}>비워두면 참가자 수에 제한이 없습니다</Text>
          </View>

        </View>
      </Animated.ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, { color: isDark ? '#b3b3b3' : '#8e8e8e' }]}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }, loading && styles.createButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={[styles.createButtonText, { color: theme.colors.onAccent }]}>
            {loading ? '생성 중...' : '챌린지 만들기'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DateTimePickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={new Date(formData.start_date)}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={new Date(formData.end_date)}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={new Date(formData.start_date)}
        />
      )}

      {/* 커스텀 알럿 모달 */}
      <Modal
        transparent
        visible={alertConfig.visible}
        animationType="fade"
        onRequestClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        >
          <Animated.View style={[styles.alertBox, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.alertIconContainer, alertConfig.type === 'success' ? styles.successBg : styles.errorBg]}>
              <MaterialCommunityIcons
                name={alertConfig.type === 'success' ? 'check-circle' : 'alert-circle'}
                size={scaleFontSize(32)}
                color="#fff"
              />
            </View>
            <Text style={[styles.alertTitle, { color: isDark ? '#ffffff' : '#262626' }]}>{alertConfig.title}</Text>
            <Text style={[styles.alertMessage, { color: isDark ? '#b3b3b3' : '#8e8e8e' }]}>{alertConfig.message}</Text>
            <TouchableOpacity
              style={[styles.alertButton, alertConfig.type === 'success' ? styles.successBtn : styles.errorBtn]}
              onPress={() => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                alertConfig.onConfirm?.();
              }}
            >
              <Text style={styles.alertButtonText}>확인</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: scaleWidth(8),
    borderRadius: scaleWidth(22),
    minWidth: scaleWidth(44), // 접근성: 최소 터치 영역 44x44
    minHeight: scaleWidth(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: scaleWidth(40),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: scaleWidth(16),
    paddingBottom: scaleHeight(100),
  },
  section: {
    marginBottom: scaleHeight(24),
  },
  label: {
    fontSize: scaleFontSize(15),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
    letterSpacing: -0.2,
  },
  sectionTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    marginBottom: scaleHeight(10),
    letterSpacing: -0.3,
  },
  description: {
    fontSize: scaleFontSize(13),
    marginBottom: scaleHeight(10),
    lineHeight: scaleFontSize(18),
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    fontSize: scaleFontSize(15),
    lineHeight: scaleFontSize(20),
    fontWeight: '600',
    minHeight: scaleHeight(44),
  },
  textArea: {
    borderWidth: 1.5,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    fontSize: scaleFontSize(15),
    lineHeight: scaleFontSize(20),
    fontWeight: '600',
    minHeight: scaleHeight(100),
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  characterCount: {
    fontSize: scaleFontSize(14),
    textAlign: 'right',
    marginTop: scaleHeight(4),
    fontWeight: '600',
  },
  errorText: {
    fontSize: scaleFontSize(13),
    color: '#ff3b30',
    marginTop: scaleHeight(4),
    fontWeight: '600',
  },
  helperText: {
    fontSize: scaleFontSize(13),
    marginTop: scaleHeight(4),
    lineHeight: scaleFontSize(18),
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    gap: scaleWidth(10),
    alignItems: 'stretch',
  },
  dateItem: {
    flex: 1,
    flexDirection: 'column',
  },
  dateLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
    letterSpacing: -0.2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    borderWidth: 1.5,
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
    minHeight: scaleHeight(52),
    flex: 1,
  },
  dateText: {
    fontSize: scaleFontSize(13),
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: scaleWidth(8),
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    minHeight: scaleHeight(44),
  },
  addTagButton: {
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    backgroundColor: '#007AFF',
    borderRadius: scaleWidth(12),
    borderWidth: 0,
    minWidth: scaleWidth(44),
    minHeight: scaleHeight(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: '#f8f8f8',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: scaleHeight(12),
    gap: scaleWidth(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    backgroundColor: '#E1306C',
    borderRadius: scaleWidth(16),
    gap: scaleWidth(6),
    minHeight: scaleHeight(32),
  },
  tagText: {
    fontSize: scaleFontSize(13),
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  removeTagButton: {
    padding: scaleWidth(2),
    minWidth: scaleWidth(20),
    minHeight: scaleWidth(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderTopWidth: 0.5,
    gap: scaleWidth(10),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: scaleHeight(48),
  },
  cancelButtonText: {
    fontSize: scaleFontSize(15),
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  createButton: {
    flex: 2,
    paddingVertical: scaleHeight(12),
    backgroundColor: '#007AFF',
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scaleHeight(48),
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    fontSize: scaleFontSize(15),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  // 새로운 시각적 스타일 추가
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(10),
    gap: scaleWidth(8),
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    gap: scaleWidth(10),
    paddingHorizontal: scaleWidth(2),
  },
  // 이미지 업로드 관련 스타일
  imageScrollView: {
    marginTop: scaleHeight(8),
  },
  imagePreviewContainer: {
    width: scaleWidth(100),
    height: scaleWidth(100),
    marginRight: scaleWidth(10),
    position: 'relative',
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(12),
  },
  removeImageButton: {
    position: 'absolute',
    top: scaleWidth(-8),
    right: scaleWidth(-8),
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(2),
  },
  addImageButton: {
    minWidth: scaleWidth(100),
    minHeight: scaleWidth(100),
    paddingHorizontal: scaleWidth(10),
    borderRadius: scaleWidth(12),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: scaleFontSize(13),
    marginTop: scaleHeight(6),
    fontWeight: '700',
    textAlign: 'center',
  },
  // 커스텀 알럿 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: scaleWidth(280),
    borderRadius: scaleWidth(20),
    padding: scaleWidth(24),
    alignItems: 'center',
  },
  alertIconContainer: {
    width: scaleWidth(64),
    height: scaleWidth(64),
    borderRadius: scaleWidth(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  successBg: {
    backgroundColor: '#34C759',
  },
  errorBg: {
    backgroundColor: '#FF3B30',
  },
  alertTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: scaleFontSize(14),
    lineHeight: scaleFontSize(20),
    textAlign: 'center',
    marginBottom: scaleHeight(20),
  },
  alertButton: {
    width: '100%',
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
  },
  successBtn: {
    backgroundColor: '#34C759',
  },
  errorBtn: {
    backgroundColor: '#FF3B30',
  },
  alertButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    color: '#fff',
  },
});

export default CreateChallengeScreen;