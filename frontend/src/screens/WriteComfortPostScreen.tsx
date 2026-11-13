// src/screens/WriteComfortPostScreen.tsx
import React, { useState, useCallback, useMemo, useEffect, memo, useRef } from 'react';
import { showCrisisSupportIfNeeded } from '../utils/crisisSupport';
import {
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Platform,
  Modal,
  useWindowDimensions,
  DeviceEventEmitter,
} from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { Box, HStack, VStack } from '../components/ui';
import { StyledText, StyledButton, StyledCard } from '../components/ModernUI';
import TagSearchInput from '../components/TagSearchInput';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import comfortWallService from '../services/api/comfortWallService';
import postService from '../services/api/postService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeImageUrl } from '../utils/imageUtils';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import ImageCarousel from '../components/ImageCarousel';
import { API_CONFIG } from '../config/api';
import { FONT_SIZES } from '../constants';
import { EMOTION_AVATARS, getTwemojiUrl } from '../constants/emotions';

interface Tag {
  tag_id: number;
  name: string;
}

interface WriteComfortPostScreenProps {
  navigation: any;
  route: any;
}

const WriteComfortPostScreen: React.FC<WriteComfortPostScreenProps> = memo(({ navigation, route }) => {
  const paperTheme = useTheme();
  const { theme, isDark } = useModernTheme();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  const BASE_WIDTH = 360;
  const fontScale = useMemo(() => require('react-native').PixelRatio.getFontScale(), []);
  const scale = useCallback((size: number, applyFont = false) => {
    const baseScale = screenWidth / BASE_WIDTH;
    return applyFont ? size * baseScale * fontScale : size * baseScale;
  }, [screenWidth, fontScale]);

  // 반응형 스타일 생성
  const responsiveStyles = useMemo(() => ({
    header: {
      paddingHorizontal: scale(16),
      paddingVertical: scale(12),
    },
    headerButton: {
      padding: scale(8),
      minWidth: scale(64),
      borderRadius: scale(16),
    },
    titleInput: {
      borderRadius: scale(12),
      fontSize: scale(16),
    },
    contentInput: {
      borderRadius: scale(12),
      fontSize: scale(16),
    },
    modalContent: {
      borderRadius: scale(28),
      padding: 0,
    },
    modalHeader: {
      paddingTop: scale(28),
      paddingBottom: scale(20),
      paddingHorizontal: scale(20),
    },
    modalIconBackground: {
      width: scale(64),
      height: scale(64),
      borderRadius: scale(32),
    },
    modalTitle: {
      fontSize: scale(20),
      marginBottom: scale(6),
    },
    modalSubtitle: {
      fontSize: scale(14),
      lineHeight: scale(20),
    },
    modalButtons: {
      paddingHorizontal: scale(14),
      paddingTop: scale(16),
      paddingBottom: scale(12),
    },
    modalButton: {
      paddingVertical: scale(14),
      paddingHorizontal: scale(14),
      borderRadius: scale(14),
      minHeight: scale(68),
    },
    buttonIconBackground: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
    },
    primaryButtonText: {
      fontSize: scale(16),
      marginBottom: scale(3),
    },
    buttonDescription: {
      fontSize: scale(13),
      lineHeight: scale(18),
    },
    modalCancelButton: {
      marginTop: scale(6),
      marginHorizontal: scale(14),
      marginBottom: scale(16),
      paddingVertical: scale(14),
      paddingHorizontal: scale(16),
      borderRadius: scale(14),
    },
    modalCancelButtonText: {
      fontSize: scale(15),
    },
  }), [scale]);

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);
  
  // 수정 모드 확인
  const postId = route.params?.postId;
  const isEditMode = !!postId;

  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(null); // 익명 감정 선택
  const selectedEmotionIdRef = useRef<number | null>(null); // 최신 값 추적용
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // 이미지 기능 활성화 (카메라는 작동함)
  const [imageFeatureEnabled, setImageFeatureEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 성공 모달 확인 핸들러
  const handleSuccessConfirm = useCallback(() => {
    setShowSuccessModal(false);
    // 저장된 emotion ID 가져오기 (폼 초기화 전에 저장된 값)
    const savedEmotionId = (navigation as any).emotionIdForEvent;
    // 수정 완료 이벤트 발생 - PostDetail과 ComfortMain에서 즉시 새로고침
    DeviceEventEmitter.emit('homeScreenRefresh', {
      postUpdated: true,
      postId,
      updatedData: {
        anonymous_emotion_id: savedEmotionId,
        is_anonymous: isAnonymous
      }
    });
    // 저장된 값 정리
    delete (navigation as any).emotionIdForEvent;
    navigation.goBack();
  }, [navigation, postId, isAnonymous]);

  // 애니메이션 값들 (필수 애니메이션만 유지)
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const progressAnim = useMemo(() => new Animated.Value(0), []);
  const validationShake = useMemo(() => new Animated.Value(0), []);

  // 수정 모드일 때 기존 게시물 로드
  useEffect(() => {
    if (isEditMode && postId) {
      loadExistingPost();
    }
  }, [isEditMode, postId]);


  // 컴포넌트 마운트 애니메이션 (최적화됨)
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // 글자 수에 따른 프로그레스 애니메이션 (오류 수정)
  useEffect(() => {
    const totalContent = title.length + content.length;
    const progress = Math.min(totalContent / 120, 1);
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [title, content, progressAnim]);

  // 유효성 검증 실패 시 흔들림 효과
  const triggerValidationShake = useCallback(() => {
    validationShake.setValue(0);
    Animated.sequence([
      Animated.timing(validationShake, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(validationShake, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(validationShake, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(validationShake, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [validationShake]);

  const loadExistingPost = async () => {
    try {
      setIsLoading(true);
      const response = await comfortWallService.getPostDetail(postId);
      
      if (response.data?.status === 'success' && response.data.data) {
        const post = response.data.data;
        setTitle(post.title || '');
        setContent(post.content || '');
        setIsAnonymous(post.is_anonymous || false);

        // 익명 감정 ID 설정 (수정 모드에서 기존 감정 유지)
        if (__DEV__) console.log('📝 [loadExistingPost] 감정 ID 확인:', {
          is_anonymous: post.is_anonymous,
          anonymous_emotion_id: post.anonymous_emotion_id
        });
        if (post.is_anonymous && post.anonymous_emotion_id) {
          setSelectedEmotionId(post.anonymous_emotion_id);
          selectedEmotionIdRef.current = post.anonymous_emotion_id; // ref도 업데이트
          if (__DEV__) console.log('📝 [loadExistingPost] 감정 ID 설정됨:', post.anonymous_emotion_id);
        }

        // 태그 설정
        if (post.tags && Array.isArray(post.tags)) {
          const tags = post.tags.map((tagName: string, index: number) => ({
            tag_id: index + 1, // 임시 ID
            name: tagName
          }));
          setSelectedTags(tags);
        }
        
        // 이미지 설정
        let imageUrls: string[] = [];

        if (post.images && Array.isArray(post.images)) {
          // images 배열이 있으면 사용
          imageUrls = post.images;
        } else if (post.image_url) {
          // image_url이 JSON 문자열이면 파싱
          try {
            if (typeof post.image_url === 'string' && post.image_url.startsWith('[')) {
              imageUrls = JSON.parse(post.image_url);
            } else {
              imageUrls = [post.image_url];
            }
          } catch (e) {
            imageUrls = [post.image_url];
          }
        }

        if (imageUrls.length > 0) {
          setSelectedImages(imageUrls.map((img: string) => normalizeImageUrl(img)));
        }
      } else {
        Alert.alert('오류', '게시물을 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('게시물 로드 오류:', error);
      Alert.alert('오류', '게시물을 불러오는 중 오류가 발생했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // 유효성 검사 (메모이제이션 최적화)
  const trimmedTitle = useMemo(() => title.trim(), [title]);
  const trimmedContent = useMemo(() => content.trim(), [content]);
  
  const isFormValid = useMemo(() => {
    const isValid = (
      trimmedTitle.length >= 5 &&
      trimmedTitle.length <= 100 &&
      trimmedContent.length >= 20 &&
      trimmedContent.length <= 2000
    );
    return isValid;
  }, [trimmedTitle, trimmedContent]);

  // 폼 통계는 직접 계산으로 변경 (메모리 최적화)

  const handleCamera = useCallback(() => {
    if (selectedImages.length >= 3) {
      Alert.alert('알림', '최대 3개의 이미지만 추가할 수 있습니다.');
      return;
    }
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
      quality: 0.65 as PhotoQuality,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorCode) {
        if (response.errorCode) Alert.alert('오류', '카메라를 사용할 수 없습니다.');
        return;
      }

      if (response.assets?.[0]) {
        const asset = response.assets[0];
        const fileType = asset.type || asset.fileName?.split('.').pop()?.toLowerCase();
        const validTypes = ['jpg', 'jpeg', 'png', 'webp', 'image/jpeg', 'image/png', 'image/webp'];
        const fileSize = asset.fileSize || 0;

        if (fileType && !validTypes.some(t => fileType.includes(t))) {
          Alert.alert('오류', '지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP만 가능)');
          return;
        }
        if (fileSize > 5 * 1024 * 1024) {
          Alert.alert('오류', '이미지 크기는 5MB 이하여야 합니다.');
          return;
        }
        if (asset.uri) {
          setSelectedImages(prev => [...prev, asset.uri!]);
        }
      }
    });
  }, [selectedImages.length]);

  const handleGallery = useCallback(() => {
    if (selectedImages.length >= 3) {
      Alert.alert('알림', '최대 3개의 이미지만 추가할 수 있습니다.');
      return;
    }
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.6 as PhotoQuality,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorCode) {
        if (response.errorCode) Alert.alert('오류', '이미지를 선택할 수 없습니다.');
        return;
      }

      if (response.assets?.[0]) {
        const asset = response.assets[0];
        const fileType = asset.type || asset.fileName?.split('.').pop()?.toLowerCase();
        const validTypes = ['jpg', 'jpeg', 'png', 'webp', 'image/jpeg', 'image/png', 'image/webp'];
        const fileSize = asset.fileSize || 0;

        if (fileType && !validTypes.some(t => fileType.includes(t))) {
          Alert.alert('오류', '지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP만 가능)');
          return;
        }
        if (fileSize > 5 * 1024 * 1024) {
          Alert.alert('오류', '이미지 크기는 5MB 이하여야 합니다.');
          return;
        }
        if (asset.uri) {
          setSelectedImages(prev => [...prev, asset.uri!]);
        }
      }
    });
  }, [selectedImages.length]);

  // 이미지 선택 방법 선택
  const handleImagePicker = useCallback(() => {
    if (selectedImages.length >= 3) return;
    setShowImagePickerModal(true);
  }, [selectedImages.length]);

  const handleGallerySelect = useCallback(() => {
    setShowImagePickerModal(false);
    setTimeout(() => {
      handleGallery();
    }, 300);
  }, [handleGallery]);

  const handleCameraSelect = useCallback(() => {
    setShowImagePickerModal(false);
    setTimeout(() => {
      handleCamera();
    }, 300);
  }, [handleCamera]);

  const handleModalClose = useCallback(() => {
    setShowImagePickerModal(false);
  }, []);


  // 이미지 제거 핸들러
  const handleRemoveImage = useCallback((imageUri: string) => {
    setSelectedImages(prev => prev.filter(uri => uri !== imageUri));
  }, []);

  // 태그 선택 핸들러
  const handleTagSelect = useCallback((tag: Tag) => {
    if (selectedTags.length < 3 && !selectedTags.find(t => t.tag_id === tag.tag_id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  }, [selectedTags]);

  // 태그 제거 핸들러
  const handleRemoveTag = useCallback((tagId: number) => {
    setSelectedTags(prev => prev.filter(tag => tag.tag_id !== tagId));
  }, []);

  // 실제 이미지 업로드 함수
  const uploadImages = async (images: string[]): Promise<string[]> => {
    if (images.length === 0) return [];

    if (__DEV__) console.log('📤 [uploadImages] 업로드 시작:', { count: images.length, images });

    setIsUploadingImages(true);
    const uploadedImageUrls: string[] = [];

    try {
      for (const imageUri of images) {
        try {
          // 서버 URL이 아닌 로컬 파일만 업로드 필요
          if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
            if (__DEV__) console.log('✅ 이미 서버 URL:', imageUri);
            uploadedImageUrls.push(imageUri);
            continue;
          }

          // 로컬 파일만 업로드 진행
          if (!imageUri.startsWith('file://') && !imageUri.startsWith('content://')) {
            if (__DEV__) console.warn('⚠️ 유효하지 않은 URI:', imageUri);
            continue;
          }

          if (__DEV__) console.log('📤 로컬 이미지 업로드 시도:', imageUri);

          const formData = new FormData();
          formData.append('images', {
            uri: imageUri,
            type: 'image/jpeg',
            name: `image_${Date.now()}.jpg`,
          } as any);

          // 인증 토큰 가져오기
          const token = await AsyncStorage.getItem('authToken');

          const uploadUrl = `${API_CONFIG.BASE_URL.replace('/api', '')}/api/uploads/images`;
          if (__DEV__) console.log('📤 업로드 URL:', uploadUrl);

          const uploadPromise = fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            headers: { 'Authorization': `Bearer ${token}` },
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Upload timeout')), 60000)
          );

          const response = await Promise.race([uploadPromise, timeoutPromise]) as Response;

          if (__DEV__) console.log('📥 업로드 응답:', { status: response.status, ok: response.ok });

          if (response.ok) {
            const result = await response.json();
            if (__DEV__) console.log('📥 업로드 결과:', result);

            const imageUrl = result.data?.image_url || result.data?.images?.[0]?.url;

            if (imageUrl) {
              if (__DEV__) console.log('✅ 업로드 성공:', imageUrl);
              uploadedImageUrls.push(imageUrl);
            } else {
              if (__DEV__) console.warn('⚠️ 응답에 이미지 URL 없음:', result);
              // 업로드 실패 시 로컬 URI 유지
              uploadedImageUrls.push(imageUri);
            }
          } else {
            const errorText = await response.text();
            if (__DEV__) console.error('❌ 업로드 실패:', { status: response.status, error: errorText });
            // 업로드 실패 시 로컬 URI 유지
            uploadedImageUrls.push(imageUri);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('❌ 이미지 업로드 오류:', error);
            console.error('❌ 오류 상세:', JSON.stringify(error, null, 2));
          }
          // 업로드 실패 시 로컬 URI 유지
          uploadedImageUrls.push(imageUri);
        }
      }
    } finally {
      setIsUploadingImages(false);
    }

    if (__DEV__) console.log('📤 [uploadImages] 완료:', { uploaded: uploadedImageUrls.length, urls: uploadedImageUrls });

    return uploadedImageUrls;
  };

  // 게시물 작성 핸들러
  const handleSubmit = useCallback(async () => {
    if (__DEV__) {
      console.log('📝 [WriteComfortPost] handleSubmit 시작:', {
        selectedImagesLength: selectedImages.length,
        selectedImages: selectedImages,
        imageFeatureEnabled,
        isEditMode,
      });
    }

    if (!isFormValid) {
      triggerValidationShake();
      Alert.alert('입력 확인', '제목과 내용을 올바르게 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 이미지 처리
      let uploadedImageUrls: string[] = [];
      let hasUploadFailure = false;

      if (imageFeatureEnabled && selectedImages.length > 0) {
        if (isEditMode) {
          // 수정 모드: 기존 이미지는 이미 서버에 있으므로 그대로 사용
          uploadedImageUrls = selectedImages.filter(img => img.includes('/api/') || img.includes('http'));

          // 새로 추가된 로컬 이미지가 있다면 업로드
          const newLocalImages = selectedImages.filter(img => !img.includes('/api/') && !img.includes('http'));
          if (newLocalImages.length > 0) {
            if (__DEV__) console.log('📤 새 로컬 이미지 업로드:', newLocalImages);
            const newUploadedUrls = await uploadImages(newLocalImages);

            // 업로드 실패 확인 (로컬 URI가 그대로 남아있으면 실패)
            const failedUploads = newUploadedUrls.filter(url => url.startsWith('file://') || url.startsWith('content://'));
            if (failedUploads.length > 0) {
              hasUploadFailure = true;
              if (__DEV__) console.warn('⚠️ 업로드 실패한 이미지:', failedUploads);
            }

            uploadedImageUrls = [...uploadedImageUrls, ...newUploadedUrls];
          }
        } else {
          // 생성 모드: 모든 이미지 업로드
          try {
            uploadedImageUrls = await uploadImages(selectedImages);

            // 업로드 실패 확인
            const failedUploads = uploadedImageUrls.filter(url => url.startsWith('file://') || url.startsWith('content://'));
            if (failedUploads.length > 0) {
              hasUploadFailure = true;
              if (__DEV__) console.warn('⚠️ 업로드 실패한 이미지:', failedUploads);
            }

            if (uploadedImageUrls.length === 0 && selectedImages.length > 0) {
              uploadedImageUrls = selectedImages;
              hasUploadFailure = true;
            }
          } catch (error) {
            uploadedImageUrls = selectedImages;
            hasUploadFailure = true;
          }
        }

        // 업로드 실패 시 사용자에게 알림
        if (hasUploadFailure) {
          Alert.alert(
            '이미지 업로드 실패',
            '일부 이미지를 서버에 업로드하지 못했습니다. 이미지 없이 게시하시겠습니까?',
            [
              {
                text: '취소',
                style: 'cancel',
                onPress: () => {
                  setIsSubmitting(false);
                  return;
                }
              },
              {
                text: '이미지 없이 게시',
                onPress: () => {
                  // 로컬 URI 제거하고 서버 URL만 유지
                  uploadedImageUrls = uploadedImageUrls.filter(url => !url.startsWith('file://') && !url.startsWith('content://'));
                  proceedWithSubmit(uploadedImageUrls);
                }
              }
            ],
            { cancelable: false }
          );
          return; // Alert 응답을 기다림
        }
      }

      // 정상 진행
      await proceedWithSubmit(uploadedImageUrls);

    } catch (error: any) {
      if (__DEV__) console.error('게시물 작성 오류:', error);
      Alert.alert('오류', '게시물 작성 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
      setIsSubmitting(false);
    }
  }, [isFormValid, triggerValidationShake, title, content, isAnonymous, selectedTags, selectedImages, navigation, imageFeatureEnabled, isEditMode, postId]);

  // 실제 게시물 제출 함수
  const proceedWithSubmit = async (uploadedImageUrls: string[]) => {
    try {
      if (__DEV__) console.log('📝 [proceedWithSubmit] 시작:', { uploadedImageUrls });

      // 서버에 게시물 생성/수정 요청
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();
      showCrisisSupportIfNeeded(`${trimmedTitle} ${trimmedContent}`);

      // ref에서 최신 감정 ID 가져오기 (클로저 문제 해결)
      const currentEmotionId = selectedEmotionIdRef.current;

      const postData = {
        title: trimmedTitle,
        content: trimmedContent,
        is_anonymous: isAnonymous,
        anonymous_emotion_id: isAnonymous ? currentEmotionId : null, // 익명일 때만 감정 전송
        tags: selectedTags.map(tag => tag.name),
        images: uploadedImageUrls
      };

      if (__DEV__) console.log('📝 [proceedWithSubmit] postData:', postData);

      // 실제 API 호출 시도
      try {
        let response;
        if (isEditMode && postId) {
          // 수정 모드 - 위로와 공감 게시물이므로 comfortWallService 사용
          response = await comfortWallService.updatePost(postId, postData);

          // 수정된 emotion ID를 navigation state에 저장 (폼 초기화 전에)
          (navigation as any).emotionIdForEvent = currentEmotionId;

          // 수정 완료 모달 표시
          setShowSuccessModal(true);

        } else {
          // 생성 모드
          response = await comfortWallService.createPost(postData);

          const newPost = {
            post_id: response.data.data?.post_id || Date.now(), // 서버에서 받은 실제 ID 사용
            title: postData.title,
            content: postData.content,
            is_anonymous: postData.is_anonymous || true,
            anonymous_emotion_id: response.data.data?.anonymous_emotion_id || selectedEmotionId,
            like_count: 0,
            comment_count: 0,
            created_at: new Date().toISOString(),
            tags: selectedTags.map(tag => tag.name),
            images: uploadedImageUrls,
            comments: [],
            user_id: user?.user_id || 0,
            user: postData.is_anonymous ? undefined : {
              nickname: user?.nickname || '사용자',
              profile_image_url: user?.profile_image_url
            }
          };

          // ComfortMain에 새 게시물 전달하면서 뒤로 가기
          navigation.navigate('ComfortMain', {
            refresh: false,
            newPost: newPost,
            showSuccess: true
          });
        }

        // 폼 상태 초기화
        setTitle('');
        setContent('');
        setSelectedTags([]);
        setSelectedImages([]);
        setSelectedEmotionId(null); // 익명 캐릭터 선택 초기화
        selectedEmotionIdRef.current = null; // ref도 초기화

        return; // 성공 시 함수 종료

      } catch (apiError: any) {
        if (__DEV__) console.error(`게시물 ${isEditMode ? '수정' : '작성'} 실패:`, apiError);
        Alert.alert('오류', `게시물 ${isEditMode ? '수정' : '작성'}에 실패했습니다. 잠시 후 다시 시도해주세요.`);
        setIsSubmitting(false);
        return;
      }

      // 예상치 못한 응답 형태
      Alert.alert('알림', '게시물은 작성되었지만 응답을 확인할 수 없습니다. 목록을 확인해주세요.');

    } catch (error: any) {
      if (__DEV__) console.error('게시물 작성 오류:', error);
      Alert.alert('오류', '게시물 작성 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    if (title.trim() || content.trim() || selectedTags.length > 0 || selectedImages.length > 0) {
      setShowCancelModal(true);
    } else {
      navigation.goBack();
    }
  }, [title, content, selectedTags.length, selectedImages.length, navigation]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelModal(false);
    navigation.goBack();
  }, [navigation]);

  const handleCancelModalClose = useCallback(() => {
    setShowCancelModal(false);
  }, []);

  return (
    <Box style={{ flex: 1 }}>
      {/* 헤더 - 2026 트렌드 디자인 */}
      <View style={{
        backgroundColor: theme.bg.primary,
        paddingHorizontal: scale(16),
        paddingVertical: scale(12),
        borderBottomWidth: isDark ? 0 : 0.5,
        borderBottomColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)',
      }}>
        <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          {/* 뒤로가기 - 미니멀 */}
          <TouchableOpacity
            onPress={handleCancel}
            style={{
              paddingVertical: scale(6),
              paddingHorizontal: scale(4),
            }}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="arrow-left" size={scale(26)} color={theme.text.primary} />
          </TouchableOpacity>

          {/* 타이틀 */}
          <StyledText
            variant="h3"
            style={{
              fontSize: scale(16.5),
              fontWeight: '700',
              color: theme.text.primary,
              letterSpacing: -0.4,
              fontFamily: 'Pretendard-Bold'
            }}
          >
            {isEditMode ? '게시물 수정' : '마음 나누기'}
          </StyledText>

          {/* 작성 버튼 - 컴팩트 */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting || isUploadingImages}
            style={{
              backgroundColor: (!isFormValid || isSubmitting || isUploadingImages)
                ? 'transparent'
                : theme.colors.primary,
              paddingHorizontal: scale(16),
              paddingVertical: scale(8),
              borderRadius: scale(20),
              minWidth: scale(70),
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            {(isSubmitting || isUploadingImages) ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <StyledText
                style={{
                  fontWeight: '600',
                  fontSize: scale(14.5),
                  color: (!isFormValid || isSubmitting || isUploadingImages)
                    ? (isDark ? 'rgba(85, 102, 221, 0.4)' : 'rgba(85, 102, 221, 0.5)')
                    : theme.colors.onAccent,
                  fontFamily: 'Pretendard-SemiBold'
                }}
              >
                {isUploadingImages ? '업로드중' : (isEditMode ? '완료' : '작성')}
              </StyledText>
            )}
          </TouchableOpacity>
        </HStack>
      </View>

      <Animated.ScrollView
        style={[
          {
            flex: 1,
            backgroundColor: theme.colors.background,
            opacity: fadeAnim,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: scale(16),
          paddingBottom: scale(16),
        }}
      >
        {/* 제목 입력 */}
        <Animated.View
          style={{
            transform: [{ translateX: validationShake }],
            marginHorizontal: scale(16),
            marginTop: scale(12),
            marginBottom: scale(10),
          }}
        >
          <View style={{
            backgroundColor: isDark ? 'rgba(45, 45, 45, 0.6)' : theme.colors.card,
            borderRadius: scale(20),
            padding: scale(20),
            borderWidth: isDark ? 0.5 : 0,
            borderColor: isDark ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
            shadowColor: isDark ? 'rgba(96, 165, 250, 0.15)' : '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.4 : 0.08,
            shadowRadius: 12,
            elevation: 4,
            overflow: 'visible',
          }}>
            <View style={{ marginBottom: scale(12) }}>
              <StyledText
                variant="label"
                style={{
                  fontSize: scale(16),
                  fontWeight: '700',
                  color: isDark ? '#60a5fa' : theme.text.primary,
                  letterSpacing: -0.2,
                  marginBottom: scale(6)
                }}
              >
                제목
              </StyledText>
            </View>
            <TextInput
              mode="flat"
              value={title}
              onChangeText={setTitle}
              style={[
                styles.titleInput,
                responsiveStyles.titleInput,
                {
                  borderRadius: scale(12),
                  overflow: 'hidden',
                  paddingHorizontal: scale(16),
                  paddingVertical: scale(12),
                  minHeight: scale(56),
                  backgroundColor: isDark ? '#000000' : '#f5f5f5',
                }
              ]}
              maxLength={100}
              placeholder="고민이나 이야기의 제목을 적어주세요..."
              placeholderTextColor={isDark ? '#9CA3AF' : '#4B5563'}
              textColor={isDark ? '#FFFFFF' : '#1a1a1a'}
              selectionColor={isDark ? '#60a5fa' : '#0095F6'}
              cursorColor={isDark ? '#60a5fa' : '#0095F6'}
              dense={false}
              multiline={false}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              theme={{
                colors: {
                  primary: theme.colors.primary,
                  background: isDark ? '#000000' : '#f5f5f5',
                  surface: isDark ? '#000000' : '#f5f5f5',
                  onSurface: isDark ? '#FFFFFF' : '#1a1a1a',
                  text: isDark ? '#FFFFFF' : '#1a1a1a',
                },
                roundness: scale(12),
              }}
              contentStyle={{
                fontSize: scale(16),
                fontWeight: '500',
                color: isDark ? '#FFFFFF' : '#1a1a1a',
                lineHeight: scale(24),
                paddingLeft: scale(4),
                paddingRight: scale(4),
                paddingTop: 0,
                paddingBottom: 0,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: scale(12) }}>
              <View style={{ flex: 1, height: scale(3), backgroundColor: theme.colors.border, borderRadius: scale(2), marginRight: scale(16) }}>
                <Animated.View
                  style={[
                    {
                      height: '100%',
                      borderRadius: scale(2),
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: trimmedTitle.length < 5 ? '#FF6B6B' : trimmedTitle.length < 20 ? '#4ECDC4' : '#45B7D1'
                    }
                  ]}
                />
              </View>
              <StyledText
                variant="caption"
                style={{
                  fontSize: scale(14),
                  color: trimmedTitle.length < 5 ? '#FF6B6B' : theme.text.secondary,
                  fontWeight: '600',
                  letterSpacing: -0.1
                }}
              >
                {title.length}/100{trimmedTitle.length < 5 ? ` (최소 5자)` : ''}
              </StyledText>
            </View>
          </View>
        </Animated.View>

        {/* 내용 입력 */}
        <View style={{
          marginHorizontal: scale(16),
          marginVertical: scale(10),
          backgroundColor: isDark ? 'rgba(45, 45, 45, 0.6)' : theme.colors.card,
          borderRadius: scale(20),
          padding: scale(20),
          borderWidth: isDark ? 0.5 : 0,
          borderColor: isDark ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
          shadowColor: isDark ? 'rgba(96, 165, 250, 0.15)' : '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 12,
          elevation: 4,
          overflow: 'visible',
        }}>
          <View style={{ marginBottom: scale(12) }}>
            <StyledText
              variant="label"
              style={{
                fontSize: scale(16),
                fontWeight: '700',
                color: isDark ? '#60a5fa' : theme.text.primary,
                letterSpacing: -0.2,
                marginBottom: scale(6)
              }}
            >
              이야기
            </StyledText>
            <StyledText
              variant="caption"
              style={{
                fontSize: scale(14),
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : theme.text.secondary,
                fontWeight: '400',
                lineHeight: scale(18)
              }}
            >
              마음 속 이야기를 자유롭게 나눠주세요
            </StyledText>
          </View>
          <TextInput
            mode="flat"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            style={[
              styles.contentInput,
              responsiveStyles.contentInput,
              {
                borderRadius: scale(12),
                overflow: 'hidden',
                paddingHorizontal: scale(16),
                paddingVertical: scale(12),
                minHeight: scale(180),
                backgroundColor: isDark ? '#000000' : '#f5f5f5',
              }
            ]}
            maxLength={2000}
            placeholder="어떤 일이 있었나요? 어떤 기분이신가요? 편하게 이야기해주세요..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#4B5563'}
            textColor={isDark ? '#FFFFFF' : '#1a1a1a'}
            selectionColor={isDark ? '#60a5fa' : '#0095F6'}
            cursorColor={isDark ? '#60a5fa' : '#0095F6'}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            theme={{
              colors: {
                primary: theme.colors.primary,
                background: isDark ? '#000000' : '#f5f5f5',
                surface: isDark ? '#000000' : '#f5f5f5',
                onSurface: isDark ? '#FFFFFF' : '#1a1a1a',
                text: isDark ? '#FFFFFF' : '#1a1a1a',
              },
              roundness: scale(12),
            }}
            contentStyle={{
              fontSize: scale(16),
              fontWeight: '400',
              color: isDark ? '#FFFFFF' : '#1a1a1a',
              lineHeight: scale(24),
              paddingLeft: scale(4),
              paddingRight: scale(4),
              paddingTop: 0,
              paddingBottom: 0,
              textAlignVertical: 'top'
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: scale(12) }}>
            <View style={{ flex: 1, height: scale(3), backgroundColor: theme.colors.border, borderRadius: scale(2), marginRight: scale(16) }}>
              <Animated.View
                style={{
                  height: '100%',
                  borderRadius: scale(2),
                  width: `${Math.min(content.length / 2000 * 100, 100)}%`,
                  backgroundColor: trimmedContent.length < 20 ? '#FF6B6B' : content.length < 100 ? '#4ECDC4' : '#45B7D1'
                }}
              />
            </View>
            <StyledText
              variant="caption"
              style={{
                fontSize: scale(14),
                color: trimmedContent.length < 20 ? '#FF6B6B' : theme.colors.textSecondary,
                fontWeight: '600',
                letterSpacing: -0.1
              }}
            >
              {content.length}/2000{trimmedContent.length < 20 ? ` (최소 20자)` : ''}
            </StyledText>
          </View>
        </View>

        {/* 사진 추가 섹션 */}
        <View style={{
          marginHorizontal: scale(16),
          marginVertical: scale(10),
          backgroundColor: theme.colors.card,
          borderRadius: scale(20),
          padding: scale(20),
          borderWidth: 0,
          shadowColor: isDark ? '#000000' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <VStack spacing="sm">
            {!imageFeatureEnabled ? (
              // 이미지 기능 비활성화 상태
              <View style={{ alignItems: 'center', paddingVertical: scale(20) }}>
                <View style={{
                  width: scale(80),
                  height: scale(80),
                  borderRadius: scale(40),
                  backgroundColor: theme.bg.secondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: scale(16)
                }}>
                  <MaterialCommunityIcons name="image-off" size={scale(36)} color="#9CA3AF" />
                </View>
                <StyledText
                  variant="body"
                  style={{
                    textAlign: 'center',
                    marginBottom: scale(8),
                    fontSize: scale(16),
                    fontWeight: '600',
                    color: theme.text.primary
                  }}
                >
                  사진 기능 일시 중단
                </StyledText>
                <StyledText
                  variant="caption"
                  style={{
                    textAlign: 'center',
                    marginBottom: scale(16),
                    fontSize: scale(17),
                    color: theme.text.secondary,
                    lineHeight: scale(20)
                  }}
                >
                  현재 시스템 점검으로 사진 업로드가 불가능해요{'\n'}텍스트로 마음을 전해주세요
                </StyledText>
                <TouchableOpacity
                  style={{
                    backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : '#F0F9FF',
                    paddingHorizontal: scale(20),
                    paddingVertical: scale(12),
                    borderRadius: scale(20),
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(96, 165, 250, 0.4)' : '#0095F6'
                  }}
                  onPress={() => setImageFeatureEnabled(true)}
                >
                  <StyledText style={{
                    fontSize: scale(17),
                    fontWeight: '600',
                    color: isDark ? '#60a5fa' : '#0095F6'
                  }}>
                    다시 시도해보기
                  </StyledText>
                </TouchableOpacity>
              </View>
            ) : (
              // 이미지 기능 활성화 상태
              <>
                <View style={{ marginBottom: scale(12) }}>
                  <StyledText
                    variant="label"
                    style={{
                      fontSize: scale(16),
                      fontWeight: '700',
                      color: theme.text.primary,
                      letterSpacing: -0.2,
                      marginBottom: scale(6)
                    }}
                  >
                    사진 첨부
                  </StyledText>
                  <StyledText
                    variant="caption"
                    style={{
                      fontSize: scale(14),
                      color: theme.text.secondary,
                      fontWeight: '400',
                      lineHeight: scale(18)
                    }}
                  >
                    최대 3장, 각 5MB까지 첨부 가능 (선택사항)
                  </StyledText>
                </View>

            {selectedImages.length > 0 && (
              <View style={{ marginBottom: scale(16) }}>
                <ImageCarousel
                  images={selectedImages.map(uri =>
                    uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http')
                      ? uri : normalizeImageUrl(uri)
                  )}
                  height={screenWidth * 0.6}
                  borderRadius={scale(16)}
                  showFullscreenButton={true}
                />
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {selectedImages.map((imageUri, index) => {
                  const processedUri = imageUri.startsWith('file://') || imageUri.startsWith('content://') || imageUri.startsWith('http')
                    ? imageUri : normalizeImageUrl(imageUri);

                  return (
                    <View key={index} style={styles.imageThumbContainer}>
                      <View style={styles.imageThumbWrapper}>
                        {processedUri ? (
                          <Image
                            source={{ uri: processedUri, cache: 'force-cache' }}
                            style={styles.imageThumbStyle}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.imageThumbStyle, { backgroundColor: theme.bg.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                            <MaterialCommunityIcons name="image-broken" size={24} color="#9CA3AF" />
                          </View>
                        )}
                        <View style={styles.imageNumberBadge}>
                          <StyledText style={styles.imageNumberText}>{index + 1}</StyledText>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveImage(imageUri)} style={styles.removeImageButton}>
                        <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* 추가 버튼 - 3개 미만일 때만 표시 */}
                {selectedImages.length < 3 && (
                  <TouchableOpacity
                    style={{
                      width: scale(80),
                      height: scale(80),
                      borderWidth: 2,
                      borderColor: isDark ? 'rgba(96, 165, 250, 0.3)' : '#E3F2FD',
                      borderStyle: 'dashed',
                      borderRadius: scale(16),
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.bg.secondary,
                      marginRight: scale(8)
                    }}
                    onPress={handleImagePicker}
                    activeOpacity={0.8}
                  >
                    <View style={{
                      width: scale(32),
                      height: scale(32),
                      borderRadius: scale(16),
                      backgroundColor: theme.bg.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: scale(6),
                      borderWidth: 2,
                      borderColor: isDark ? '#60a5fa' : '#0095F6'
                    }}>
                      <MaterialCommunityIcons name="plus" size={scale(18)} color={isDark ? '#60a5fa' : '#0095F6'} />
                    </View>
                    <StyledText
                      variant="caption"
                      style={{
                        textAlign: 'center',
                        fontSize: scale(13),
                        fontWeight: '600',
                        color: isDark ? '#60a5fa' : '#0095F6'
                      }}
                    >
                      {selectedImages.length}/3
                    </StyledText>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
              </>
            )}
          </VStack>
        </View>

        {/* 태그 선택 섹션 */}
        <View style={{
          marginHorizontal: scale(16),
          marginVertical: scale(10),
          backgroundColor: theme.colors.card,
          borderRadius: scale(20),
          padding: scale(20),
          borderWidth: 0,
          shadowColor: isDark ? '#000000' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 4,
          position: 'relative',
          zIndex: 1000,
        }}>
          <VStack spacing="sm">
            <View style={{ marginBottom: scale(12) }}>
              <StyledText
                variant="label"
                style={{
                  fontSize: scale(16),
                  fontWeight: '700',
                  color: theme.text.primary,
                  letterSpacing: -0.2,
                  marginBottom: scale(6)
                }}
              >
                카테고리 태그
              </StyledText>
              <StyledText
                variant="caption"
                style={{
                  fontSize: scale(14),
                  color: theme.text.secondary,
                  fontWeight: '400',
                  lineHeight: scale(18)
                }}
              >
                어떤 주제인지 알려주세요 (최대 3개)
              </StyledText>
            </View>
            <View style={{ position: 'relative', zIndex: 9999 }}>
              <TagSearchInput
                onTagSelect={handleTagSelect}
                selectedTags={selectedTags}
                maxTags={3}
                placeholder="고민 주제를 검색해보세요..."
              />
            </View>
            {Boolean(selectedTags.length > 0) && (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: scale(8),
                marginTop: scale(16)
              }}>
                {selectedTags.map(tag => (
                  <TouchableOpacity
                    key={tag.tag_id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: scale(16),
                      paddingVertical: scale(10),
                      backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : '#F0F9FF',
                      borderRadius: scale(20),
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(96, 165, 250, 0.4)' : '#0095F6',
                      marginBottom: scale(8),
                      shadowColor: isDark ? 'rgba(96, 165, 250, 0.3)' : '#0095F6',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.1,
                      shadowRadius: 4,
                      elevation: 2
                    }}
                    onPress={() => handleRemoveTag(tag.tag_id)}
                  >
                    <StyledText style={{
                      fontSize: scale(15),
                      fontWeight: '600',
                      color: isDark ? '#60a5fa' : '#0095F6',
                      marginRight: scale(6)
                    }}>
                      #{tag.name}
                    </StyledText>
                    <MaterialCommunityIcons name="close-circle" size={scale(18)} color={isDark ? '#60a5fa' : '#0095F6'} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </VStack>
        </View>

        {/* 익명 설정 섹션 */}
        <View style={{
          marginHorizontal: scale(16),
          marginVertical: scale(10),
          backgroundColor: theme.colors.card,
          borderRadius: scale(20),
          padding: scale(20),
          borderWidth: 0,
          shadowColor: isDark ? '#000000' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 4,
          position: 'relative',
          zIndex: 1,
        }}>
          <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <VStack style={{ flex: 1, marginRight: scale(16), minWidth: 0 }}>
              <HStack style={{ alignItems: 'center', marginBottom: scale(6) }}>
                <MaterialCommunityIcons
                  name={isAnonymous ? "incognito" : "account"}
                  size={scale(18)}
                  color={isDark ? '#60a5fa' : '#0095F6'}
                  style={{ marginRight: scale(8) }}
                />
                <StyledText
                  variant="body"
                  style={{
                    fontSize: scale(15),
                    fontWeight: '700',
                    color: theme.text.primary,
                    letterSpacing: -0.2,
                    width: scale(80),
                    flexShrink: 0
                  }}
                >
                  익명 게시
                </StyledText>
              </HStack>
              <StyledText
                variant="caption"
                style={{
                  fontSize: scale(14),
                  color: theme.text.secondary,
                  fontWeight: '400',
                  lineHeight: scale(20)
                }}
              >
                {isAnonymous
                  ? "익명으로 안전하게 마음을 나눌 수 있어요"
                  : "닉네임이 표시되어 더 진솔한 소통이 가능해요"
                }
              </StyledText>
            </VStack>
            <TouchableOpacity
              onPress={() => {
                const newValue = !isAnonymous;
                setIsAnonymous(newValue);
                // 실명으로 전환 시 감정 선택 초기화
                if (!newValue) {
                  setSelectedEmotionId(null);
                }
              }}
              style={{
                width: scale(56),
                height: scale(32),
                borderRadius: scale(16),
                padding: scale(2),
                justifyContent: 'center',
                backgroundColor: isAnonymous ? (isDark ? '#60a5fa' : '#0095F6') : (isDark ? '#374151' : '#E5E5E5'),
                alignItems: isAnonymous ? 'flex-end' : 'flex-start',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: 2
              }}
            >
              <View style={{
                width: scale(28),
                height: scale(28),
                borderRadius: scale(14),
                backgroundColor: isDark ? theme.colors.card : '#FFFFFF',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.15,
                shadowRadius: 4,
                elevation: 4,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MaterialCommunityIcons
                  name={isAnonymous ? "incognito" : "account"}
                  size={scale(14)}
                  color={isAnonymous ? (isDark ? '#60a5fa' : '#0095F6') : (isDark ? '#9CA3AF' : '#8E8E93')}
                />
              </View>
            </TouchableOpacity>
          </HStack>
        </View>

        {/* 익명 감정 선택 섹션 - 익명일 때만 표시 */}
        {isAnonymous && (
          <View style={{
            marginHorizontal: scale(16),
            marginVertical: scale(10),
            backgroundColor: theme.colors.card,
            borderRadius: scale(20),
            padding: scale(20),
            borderWidth: 0,
            shadowColor: isDark ? '#000000' : '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <VStack spacing="sm">
              <View style={{ marginBottom: scale(12) }}>
                <StyledText
                  variant="label"
                  style={{
                    fontSize: scale(16),
                    fontWeight: '700',
                    color: theme.text.primary,
                    letterSpacing: -0.2,
                    marginBottom: scale(6)
                  }}
                >
                  익명 캐릭터 선택
                </StyledText>
                <StyledText
                  variant="caption"
                  style={{
                    fontSize: scale(14),
                    color: theme.text.secondary,
                    fontWeight: '400',
                    lineHeight: scale(18)
                  }}
                >
                  {selectedEmotionId
                    ? `${EMOTION_AVATARS.find(e => e.id === selectedEmotionId)?.label || ''}(으)로 활동해요`
                    : '선택하지 않으면 랜덤으로 배정돼요'}
                </StyledText>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: scale(4) }}
              >
                <View style={{ flexDirection: 'row', gap: scale(10) }}>
                  {EMOTION_AVATARS.map((emotion) => {
                    const isSelected = selectedEmotionId === emotion.id;
                    return (
                      <TouchableOpacity
                        key={emotion.id}
                        onPress={() => {
                          const newId = isSelected ? null : emotion.id;
                          if (__DEV__) console.log('🎭 감정 선택:', { 이전: selectedEmotionId, 새값: newId, 감정: emotion.label });
                          setSelectedEmotionId(newId);
                          selectedEmotionIdRef.current = newId; // ref도 업데이트
                        }}
                        style={{
                          alignItems: 'center',
                          paddingVertical: scale(10),
                          paddingHorizontal: scale(8),
                          borderRadius: scale(16),
                          backgroundColor: isSelected
                            ? (isDark ? `${emotion.color}30` : `${emotion.color}20`)
                            : 'transparent',
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected
                            ? emotion.color
                            : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                          minWidth: scale(64),
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{
                          width: scale(44),
                          height: scale(44),
                          borderRadius: scale(22),
                          backgroundColor: isSelected ? `${emotion.color}40` : `${emotion.color}20`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: scale(6),
                        }}>
                          <Image
                            source={{ uri: getTwemojiUrl(emotion.emojiCode) }}
                            style={{ width: scale(28), height: scale(28) }}
                            resizeMode="contain"
                          />
                        </View>
                        <StyledText
                          style={{
                            fontSize: scale(12),
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? emotion.color : theme.text.secondary,
                            textAlign: 'center',
                          }}
                        >
                          {emotion.shortName}
                        </StyledText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </VStack>
          </View>
        )}

        {/* 안내 메시지 */}
        <View style={{
          marginHorizontal: scale(16),
          marginVertical: scale(10),
          backgroundColor: isDark ? 'rgba(96, 165, 250, 0.08)' : '#F0F9FF',
          borderRadius: scale(20),
          padding: scale(20),
        }}>
          <VStack>
            {/* 제목 줄 */}
            <HStack style={{ alignItems: 'center', marginBottom: scale(16) }}>
              <MaterialCommunityIcons name="heart-outline" size={scale(20)} color={isDark ? '#60a5fa' : '#0095F6'} style={{ marginRight: scale(8) }} />
              <StyledText
                variant="body"
                style={{
                  fontWeight: '800',
                  color: isDark ? '#60a5fa' : '#0095F6',
                  fontSize: scale(16),
                  letterSpacing: -0.3
                }}
              >
                따뜻한 소통을 위한 안내
              </StyledText>
            </HStack>

            {/* 안내 문구들 */}
            <VStack spacing="xs">
              <View style={{ flexDirection: 'row', marginBottom: scale(8) }}>
                <View style={{
                  width: scale(5),
                  height: scale(5),
                  borderRadius: scale(2.5),
                  backgroundColor: isDark ? '#60a5fa' : '#0095F6',
                  marginTop: scale(6),
                  marginRight: scale(8),
                  flexShrink: 0,
                  opacity: 0.8
                }} />
                <StyledText
                  variant="body"
                  style={{
                    fontSize: scale(14),
                    color: isDark ? 'rgba(255, 255, 255, 0.85)' : theme.text.primary,
                    lineHeight: scale(21),
                    flex: 1,
                    fontWeight: '500'
                  }}
                >
                  따뜻한 위로와 공감을 나누는 공간이에요
                </StyledText>
              </View>
              <View style={{ flexDirection: 'row', marginBottom: scale(8) }}>
                <View style={{
                  width: scale(5),
                  height: scale(5),
                  borderRadius: scale(2.5),
                  backgroundColor: isDark ? '#60a5fa' : '#0095F6',
                  marginTop: scale(6),
                  marginRight: scale(8),
                  flexShrink: 0,
                  opacity: 0.8
                }} />
                <StyledText
                  variant="body"
                  style={{
                    fontSize: scale(14),
                    color: isDark ? 'rgba(255, 255, 255, 0.85)' : theme.text.primary,
                    lineHeight: scale(21),
                    flex: 1,
                    fontWeight: '500'
                  }}
                >
                  개인정보나 민감한 내용은 피해주세요
                </StyledText>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{
                  width: scale(5),
                  height: scale(5),
                  borderRadius: scale(2.5),
                  backgroundColor: isDark ? '#60a5fa' : '#0095F6',
                  marginTop: scale(6),
                  marginRight: scale(8),
                  flexShrink: 0,
                  opacity: 0.8
                }} />
                <StyledText
                  variant="body"
                  style={{
                    fontSize: scale(14),
                    color: isDark ? 'rgba(255, 255, 255, 0.85)' : theme.text.primary,
                    lineHeight: scale(21),
                    flex: 1,
                    fontWeight: '500'
                  }}
                >
                  서로를 존중하는 따뜻한 말로 소통해주세요
                </StyledText>
              </View>
            </VStack>
          </VStack>
        </View>

        {/* 여백 */}
        <View style={{ height: scale(24) }} />
      </Animated.ScrollView>

      {/* 2026 트렌드 사진 모달 - Ultra Minimal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showImagePickerModal}
        onRequestClose={handleModalClose}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.94)' : 'rgba(0, 0, 0, 0.65)',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={handleModalClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={{
              backgroundColor: isDark ? '#0a0a0a' : '#FFFFFF',
              borderTopLeftRadius: scale(24),
              borderTopRightRadius: scale(24),
              paddingTop: scale(8),
              paddingBottom: Math.max(scale(20), 34),
              paddingHorizontal: scale(16),
            }}>
              {/* 드래그 핸들 */}
              <View style={{ alignItems: 'center', paddingVertical: scale(10) }}>
                <View style={{
                  width: scale(32),
                  height: scale(3.5),
                  borderRadius: scale(2),
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',
                }} />
              </View>

              {/* 버튼 - 슈퍼 심플 */}
              <View style={{ gap: scale(10), marginTop: scale(6), marginBottom: scale(8) }}>
                {/* 갤러리 */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: scale(14),
                    paddingHorizontal: scale(16),
                    borderRadius: scale(16),
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  }}
                  onPress={handleGallerySelect}
                  activeOpacity={0.65}
                >
                  <View style={{
                    width: scale(40),
                    height: scale(40),
                    borderRadius: scale(20),
                    backgroundColor: isDark ? 'rgba(96, 165, 250, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: scale(12),
                  }}>
                    <MaterialCommunityIcons name="image-multiple" size={scale(22)} color={isDark ? '#60a5fa' : '#3b82f6'} />
                  </View>
                  <StyledText style={{
                    flex: 1,
                    fontSize: scale(15.5),
                    fontWeight: '600',
                    color: theme.text.primary,
                    letterSpacing: -0.3
                  }}>갤러리</StyledText>
                  <MaterialCommunityIcons name="chevron-right" size={scale(18)} color={isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'} />
                </TouchableOpacity>

                {/* 카메라 */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: scale(14),
                    paddingHorizontal: scale(16),
                    borderRadius: scale(16),
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  }}
                  onPress={handleCameraSelect}
                  activeOpacity={0.65}
                >
                  <View style={{
                    width: scale(40),
                    height: scale(40),
                    borderRadius: scale(20),
                    backgroundColor: isDark ? 'rgba(74, 222, 128, 0.12)' : 'rgba(34, 197, 94, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: scale(12),
                  }}>
                    <MaterialCommunityIcons name="camera" size={scale(22)} color={isDark ? '#4ade80' : '#22c55e'} />
                  </View>
                  <StyledText style={{
                    flex: 1,
                    fontSize: scale(15.5),
                    fontWeight: '600',
                    color: theme.text.primary,
                    letterSpacing: -0.3
                  }}>카메라</StyledText>
                  <MaterialCommunityIcons name="chevron-right" size={scale(18)} color={isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'} />
                </TouchableOpacity>
              </View>

              {/* 취소 */}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  paddingVertical: scale(13),
                  marginTop: scale(2),
                }}
                onPress={handleModalClose}
                activeOpacity={0.5}
              >
                <StyledText style={{
                  fontSize: scale(15),
                  fontWeight: '500',
                  color: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)',
                  letterSpacing: -0.2
                }}>취소</StyledText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ConfirmationModal
        visible={showCancelModal}
        title="작성 취소"
        message="작성 중인 내용이 모두 삭제됩니다. 정말 취소하시겠습니까?"
        confirmText="확인"
        cancelText="계속 작성"
        type="warning"
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelModalClose}
      />

      <ConfirmationModal
        visible={showSuccessModal}
        title="완료"
        message="게시물이 수정되었습니다."
        confirmText="확인"
        type="success"
        onConfirm={handleSuccessConfirm}
      />
    </Box>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottomWidth: 0,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 149, 246, 0.2)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerButton: {
    padding: 8,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4c51bf',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  headerButtonDisabled: {
    opacity: 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  titleInput: {
    borderRadius: 12,
    borderWidth: 0,
    fontSize: FONT_SIZES.h3,
    fontWeight: '500',
    color: '#1a1a1a',
    overflow: 'hidden',
  },
  contentInput: {
    borderRadius: 12,
    borderWidth: 0,
    fontSize: FONT_SIZES.h4,
    fontWeight: '400',
    color: '#1a1a1a',
    textAlignVertical: 'top',
    overflow: 'hidden',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#5566DD',
    borderWidth: 0,
    shadowColor: 'rgba(85, 102, 221, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  emptyPhotoArea: {
    height: 140,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  photoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyPhotoAreaImproved: {
    height: 100,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    borderStyle: 'solid',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  photoIconContainerImproved: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  imageThumbContainer: {
    position: 'relative',
    marginRight: 8,
  },
  imageThumbWrapper: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageThumbStyle: {
    width: '100%',
    height: '100%',
  },
  imageNumberBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 149, 246, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.tiny,
    fontWeight: '700',
  },
  selectedImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 3,
    borderColor: 'rgba(85, 102, 221, 0.3)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: 'rgba(85, 102, 221, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    transform: [{ rotate: '2deg' }],
  },
  selectedImageStyle: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 10,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0095F6',
    marginRight: 8,
    marginBottom: 8,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
    backgroundColor: '#DBDBDB',
  },
  toggleActive: {
    alignItems: 'flex-end',
    backgroundColor: '#0095F6',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  // 인스타그램 스타일 프로그레스 바
  progressBar: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#0095F6',
    flex: 1,
    marginRight: 16,
  },
  addPhotoButtonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
   // 모달 스타일 - 개선된 디자인
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '88%',
    maxWidth: 380,
    justifyContent: 'center',
  },
  modalContent: {
    borderRadius: 28,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalIconWrapper: {
    marginBottom: 16,
  },
  modalIconBackground: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#B3E5FC',
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as any,
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center' as any,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.body,
    color: '#8E8E93',
    textAlign: 'center' as any,
    lineHeight: 20,
    fontWeight: '400' as any,
  },
  modalButtons: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    minHeight: 76,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  galleryButton: {
    borderColor: '#B3E5FC',
    backgroundColor: '#F0F9FF',
  },
  cameraButton: {
    borderColor: '#C8E6C9',
    backgroundColor: '#F1F8F4',
  },
  buttonIconContainer: {
    marginRight: 12,
  },
  buttonIconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.h4,
    fontWeight: '600' as any,
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  buttonDescription: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '400' as any,
    color: '#8E8E93',
    lineHeight: 16,
  },
  modalCancelButton: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  modalCancelButtonText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '600' as any,
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
});

export default WriteComfortPostScreen;