// src/screens/EditPostScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  useWindowDimensions
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Switch,
  Chip,
  ActivityIndicator,
  IconButton,
  Surface,
  Dialog,
  Portal
} from 'react-native-paper';
import { Box, Text, VStack, HStack, Center, Pressable } from '../components/ui';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useEmotion } from '../contexts/EmotionContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import postService from '../services/api/postService';
import uploadService from '../services/api/uploadService';
import { launchImageLibrary, launchCamera, ImagePickerResponse, PhotoQuality } from 'react-native-image-picker';
import { FONT_SIZES } from '../constants';
import { scale } from '../constants/responsive';

// 네비게이션 타입 정의
type RootStackParamList = {
  EditPost: { postId: number };
};

type EditPostScreenRouteProp = RouteProp<RootStackParamList, 'EditPost'>;

// 로컬 폴백 감정 옵션 (API 로드 실패시 사용) - 친근한 Inside Out 스타일 감정들
const FALLBACK_EMOTION_OPTIONS = [
  { id: 1, label: '기쁨이', icon: 'emoticon-happy', color: '#FFD700' },
  { id: 2, label: '행복이', icon: 'emoticon-excited', color: '#FFA500' },
  { id: 3, label: '슬픔이', icon: 'emoticon-sad', color: '#4682B4' },
  { id: 4, label: '우울이', icon: 'emoticon-neutral', color: '#708090' },
  { id: 5, label: '불안이', icon: 'emoticon-confused', color: '#DDA0DD' },
  { id: 6, label: '걱정이', icon: 'emoticon-frown', color: '#FFA07A' },
  { id: 7, label: '버럭이', icon: 'emoticon-angry', color: '#FF4500' },
  { id: 8, label: '짜증이', icon: 'emoticon-devil', color: '#DC143C' },
  { id: 9, label: '감동이', icon: 'heart', color: '#FF6347' },
  { id: 10, label: '황당이', icon: 'emoticon-wink', color: '#20B2AA' },
  { id: 11, label: '당황이', icon: 'emoticon-tongue', color: '#FF8C00' },
  { id: 12, label: '무섭이', icon: 'emoticon-cry', color: '#9370DB' },
  { id: 13, label: '편안이', icon: 'emoticon-kiss', color: '#98FB98' },
  { id: 14, label: '추억이', icon: 'emoticon-cool', color: '#87CEEB' },
  { id: 15, label: '설렘이', icon: 'heart-multiple', color: '#FF69B4' },
  { id: 16, label: '지루미', icon: 'emoticon-dead', color: '#A9A9A9' },
  { id: 17, label: '궁금이', icon: 'emoticon-outline', color: '#DAA520' },
  { id: 18, label: '사랑이', icon: 'heart', color: '#E91E63' },
  { id: 19, label: '아픔이', icon: 'bandage', color: '#8B4513' },
  { id: 20, label: '욕심이', icon: 'cash', color: '#32CD32' }
];

interface EditPostScreenProps {
  navigation: {
    goBack: () => void;
    setOptions: (options: any) => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: EditPostScreenRouteProp;
}

interface PostData {
  post_id: number;
  content: string;
  is_anonymous: boolean;
  emotions: Array<{ emotion_id: number; name: string; icon: string }>;
  user_id: number;
  image_url?: string;
}

const EditPostScreen: React.FC<EditPostScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { emotions: apiEmotions, isLoading: emotionLoading } = useEmotion();
  const { theme, isDark } = useModernTheme();
  const { postId } = route.params;
  const { width: screenWidth } = useWindowDimensions();

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: theme.colors.primary,
  };

  // 반응형 크기 계산 (기준: 360dp - React Native 논리적 픽셀)
  const scale = (size: number) => (screenWidth / 360) * size;
  const imageHeight = screenWidth * 0.55; // 반응형 이미지 높이

  // 상태 변수들
  const [content, setContent] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<number[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalPost, setOriginalPost] = useState<PostData | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 사용할 감정 옵션 결정 (API 우선, 폴백 사용)
  const getEmotionOptions = () => {
    if (apiEmotions && apiEmotions.length > 0) {
      return apiEmotions.map(emotion => ({
        id: emotion.emotion_id,
        label: emotion.name,
        icon: emotion.icon || 'emoticon',
        color: emotion.color || '#6366f1'
      }));
    }
    return FALLBACK_EMOTION_OPTIONS;
  };

  const emotionOptions = getEmotionOptions();

  // 현재 표시할 이미지 URL 결정
  const getDisplayImageUrl = useCallback(() => {
    console.log('🖼️ getDisplayImageUrl 호출됨 (screens):', {
      selectedImage,
      uploadedImageUrl,
      currentImageUrl,
      priority: selectedImage ? 'selectedImage' : uploadedImageUrl ? 'uploadedImageUrl' : currentImageUrl ? 'currentImageUrl' : 'none'
    });

    if (selectedImage) {
      console.log('🖼️ selectedImage 우선 선택 (screens):', selectedImage);
      return selectedImage; // 새로 선택한 이미지 (로컬)
    }

    if (uploadedImageUrl) {
      console.log('🖼️ uploadedImageUrl 선택 (screens):', uploadedImageUrl);

      // 업로드된 이미지 URL이 상대경로인 경우 절대경로로 변환
      let processedUrl = uploadedImageUrl;
      if (!uploadedImageUrl.startsWith('http')) {
        processedUrl = `https://dayonme.com${uploadedImageUrl}`;
        console.log('🖼️ 상대경로를 절대경로로 변환 (screens):', processedUrl);
      }

      // cache buster 추가
      const cacheBuster = `?t=${Date.now()}`;
      const finalUrl = processedUrl.includes('?')
        ? `${processedUrl}&t=${Date.now()}`
        : `${processedUrl}${cacheBuster}`;
      console.log('🖼️ cache buster 추가된 최종 URL (screens):', finalUrl);
      return finalUrl;
    }

    if (currentImageUrl) {
      // 기존 이미지 URL 처리
      const baseUrl = currentImageUrl.startsWith('http')
        ? currentImageUrl
        : `https://dayonme.com${currentImageUrl}`;
      console.log('🖼️ currentImageUrl 처리됨 (screens):', baseUrl);
      return baseUrl;
    }

    console.log('🖼️ 표시할 이미지 없음 (screens)');
    return null;
  }, [selectedImage, uploadedImageUrl, currentImageUrl]);

  // 초기 데이터 로드
  useEffect(() => {
    loadPostData();
  }, [postId]);

  // 헤더 설정
  useEffect(() => {
    navigation.setOptions({
      title: '게시물 수정',
      headerStyle: {
        backgroundColor: theme.bg.primary,
        elevation: 2,
        shadowColor: isDark ? '#000000' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.1 : 0.2,
        shadowRadius: 4,
      },
      headerTintColor: theme.text.primary,
      headerTitleStyle: {
        fontWeight: 'bold',
        color: theme.text.primary,
      },
      headerLeft: () => (
        <IconButton
          icon="close"
          iconColor={theme.text.primary}
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 8 }}
        />
      ),
      headerRight: () => (
        <HStack className="flex-row items-center">
          <Pressable
            onPress={() => setDeleteDialogVisible(true)}
            style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2',
              borderRadius: 999,
              padding: 8,
              marginRight: 8
            }}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#f44336" />
          </Pressable>
          <Pressable
            onPress={handleUpdate}
            disabled={content.trim().length < 10 || selectedEmotions.length === 0 || isSubmitting}
            className="px-4 py-2 rounded-lg mr-3"
            style={{
              backgroundColor: (content.trim().length < 10 || selectedEmotions.length === 0 || isSubmitting) ? theme.bg.border : '#9333ea',
              shadowColor: isDark ? '#000000' : '#6b46c1',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.1 : 0.2,
              shadowRadius: 4,
              elevation: 4,
              minWidth: 70,
              minHeight: 36
            }}
          >
            <HStack className="items-center justify-center" style={{ minWidth: 50 }}>
              {isSubmitting && <ActivityIndicator size="small" color="white" style={{ marginRight: 4 }} />}
              <Text
                style={{
                  fontSize: scale(14),
                  minWidth: 30,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: (content.trim().length < 10 || selectedEmotions.length === 0 || isSubmitting) ? theme.text.tertiary : colors.text,
                  fontFamily: 'Pretendard-Bold',
                  includeFontPadding: false,
                  lineHeight: scale(18)
                }}
              >
                {isSubmitting ? '저장중...' : '저장'}
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      ),
    });
  }, [navigation, content, selectedEmotions, isSubmitting, originalPost]);
  
  // 상태 디버깅을 위한 로그
  useEffect(() => {
    console.log('🔍 EditPostScreen 상태 체크:');
    console.log('- content length:', content.trim().length);
    console.log('- selectedEmotions:', selectedEmotions);
    console.log('- selectedEmotions.length:', selectedEmotions.length);
    console.log('- isSubmitting:', isSubmitting);
    console.log('- 버튼 활성화 조건:', content.trim().length >= 10 && selectedEmotions.length > 0 && !isSubmitting);
  }, [content, selectedEmotions, isSubmitting]);

  // 이미지 상태 실시간 모니터링 (screens)
  useEffect(() => {
    const displayUrl = getDisplayImageUrl();
    console.log('🖼️ [상태 모니터] (screens) 이미지 상태 변경됨:', {
      timestamp: new Date().toLocaleTimeString(),
      currentImageUrl,
      selectedImage,
      uploadedImageUrl,
      displayUrl,
      isUploadingImage,
      hasDisplayUrl: !!displayUrl,
      urlType: selectedImage ? 'selectedImage' : uploadedImageUrl ? 'uploadedImageUrl' : currentImageUrl ? 'currentImageUrl' : 'none'
    });
  }, [currentImageUrl, selectedImage, uploadedImageUrl, isUploadingImage]);
  
  // 데이터 로드 후 헤더 강제 업데이트
  useEffect(() => {
    if (!isLoading && originalPost && content && selectedEmotions.length > 0) {
      // 데이터가 로드된 후 헤더 재설정
      const timer = setTimeout(() => {
        navigation.setOptions({
          headerRight: () => (
            <HStack className="flex-row items-center">
              <Pressable
                onPress={() => setDeleteDialogVisible(true)}
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2',
                  borderRadius: 999,
                  padding: 8,
                  marginRight: 8
                }}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#f44336" />
              </Pressable>
              <Pressable
                onPress={handleUpdate}
                disabled={content.trim().length < 10 || selectedEmotions.length === 0 || isSubmitting}
                className="px-4 py-2 rounded-lg mr-3"
                style={{
                  backgroundColor: (content.trim().length < 10 || selectedEmotions.length === 0 || isSubmitting) ? theme.bg.border : '#9333ea',
                  shadowColor: isDark ? '#000000' : '#6b46c1',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.1 : 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                  minWidth: 70,
                  minHeight: 36
                }}
              >
                <HStack className="items-center justify-center" style={{ minWidth: 50 }}>
                  {isSubmitting && <ActivityIndicator size="small" color="white" style={{ marginRight: 4 }} />}
                  <Text
                    style={{
                      fontSize: scale(14),
                      minWidth: 30,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: (content.trim().length < 10 || selectedEmotions.length === 0 || isSubmitting) ? theme.text.tertiary : colors.text,
                      fontFamily: 'Pretendard-Bold',
                      includeFontPadding: false,
                      lineHeight: scale(18)
                    }}
                  >
                    {isSubmitting ? '저장중...' : '저장'}
                  </Text>
                </HStack>
              </Pressable>
            </HStack>
          ),
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, originalPost, content, selectedEmotions, isSubmitting, navigation]);

  // 게시물 데이터 로드
  const loadPostData = async () => {
    try {
      setIsLoading(true);
      const response = await postService.getPostById(postId);
      
      if (response.status === 'success' && response.data) {
        const post = response.data;
        
        // 권한 확인 (본인 게시물만 수정 가능)
        if (post.user_id !== user?.user_id) {
          Alert.alert(
            '권한 없음',
            '본인의 게시물만 수정할 수 있습니다.',
            [{ text: '확인', onPress: () => navigation.goBack() }]
          );
          return;
        }

        setOriginalPost(post);
        setContent(post.content || '');
        setIsAnonymous(post.is_anonymous || false);
        
        // 기존 이미지 URL 설정
        if (post.image_url) {
          // JSON 배열 문자열이면 첫 번째 이미지만 사용
          let imageUrl = post.image_url;
          try {
            if (typeof post.image_url === 'string' && post.image_url.startsWith('[')) {
              const imageArray = JSON.parse(post.image_url);
              imageUrl = imageArray.length > 0 ? imageArray[0] : post.image_url;
              console.log('📸 JSON 배열에서 첫 번째 이미지 추출:', imageUrl);
            }
          } catch (e) {
            console.warn('📸 JSON 파싱 실패, 원본 사용');
          }
          setCurrentImageUrl(imageUrl);
          console.log('📸 기존 이미지 로드됨:', imageUrl);
        }
        
        // 감정 ID 배열 설정
        if (post.emotions && Array.isArray(post.emotions)) {
          const emotionIds = post.emotions.map((emotion: any) => emotion.emotion_id);
          setSelectedEmotions(emotionIds);
        }
      } else {
        throw new Error('게시물을 찾을 수 없습니다.');
      }
    } catch (error: any) {
      console.error('게시물 로드 오류:', error);
      Alert.alert(
        '오류',
        error.message || '게시물을 불러오는 중 오류가 발생했습니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 감정 선택/해제 (단일 선택으로 변경)
  const handleEmotionToggle = (emotionId: number) => {
    setSelectedEmotions(prev => {
      // 이미 선택된 감정을 다시 클릭하면 해제
      if (prev.includes(emotionId)) {
        const newEmotions = prev.filter(id => id !== emotionId);
        console.log('🔴 감정 해제됨:', emotionId, '현재 선택된 감정들:', newEmotions);
        return newEmotions;
      }
      // 새로운 감정을 선택하면 기존 선택을 모두 해제하고 새로운 것만 선택
      const newEmotions = [emotionId];
      console.log('🟢 감정 선택됨:', emotionId, '현재 선택된 감정들:', newEmotions);
      return newEmotions;
    });
  };

  // 취소 처리
  const handleCancel = useCallback(() => {
    // 변경사항이 있는지 확인
    const hasImageChanges = 
      (selectedImage !== null) || 
      (uploadedImageUrl !== null && uploadedImageUrl !== currentImageUrl) ||
      (currentImageUrl !== originalPost?.image_url);
      
    const hasChanges = 
      content !== (originalPost?.content || '') ||
      isAnonymous !== (originalPost?.is_anonymous || false) ||
      JSON.stringify(selectedEmotions.sort()) !== 
      JSON.stringify((originalPost?.emotions?.map(e => e.emotion_id) || []).sort()) ||
      hasImageChanges;

    if (hasChanges) {
      setModalMessage('변경사항이 저장되지 않습니다. 정말 취소하시겠습니까?');
      setCancelModalVisible(true);
    } else {
      navigation.goBack();
    }
  }, [content, isAnonymous, selectedEmotions, originalPost, navigation, selectedImage, uploadedImageUrl, currentImageUrl]);

  // 이미지 제거
  const removeImage = useCallback(() => {
    setCurrentImageUrl(null);
    setSelectedImage(null);
    setUploadedImageUrl(null);
  }, []);

  // 갤러리에서 선택
  const selectFromGallery = useCallback(() => {
    console.log('📸 갤러리 선택 함수 호출됨 (screens)');
    const options = {
      mediaType: 'photo' as const,
      quality: 0.7 as PhotoQuality,
      maxWidth: 600,
      maxHeight: 600,
      includeBase64: false,
      storageOptions: {
        skipBackup: true,
        path: 'images'
      }
    };

    launchImageLibrary(options, handleImageResponse);
  }, []);

  // 카메라로 촬영
  const selectFromCamera = useCallback(() => {
    console.log('📷 카메라 촬영 함수 호출됨 (screens)');
    const options = {
      mediaType: 'photo' as const,
      quality: 0.7 as PhotoQuality,
      maxWidth: 600,
      maxHeight: 600,
      includeBase64: false,
      cameraType: 'back' as const,
      storageOptions: {
        skipBackup: true,
        path: 'images'
      }
    };

    console.log('📷 카메라 옵션:', options);
    launchCamera(options, handleImageResponse);
  }, []);

  // 이미지 선택 처리
  const handleImagePicker = useCallback(() => {
    console.log('🚨 이미지 선택 다이얼로그 호출됨 (screens)');
    console.log('🚨 selectFromGallery:', typeof selectFromGallery);
    console.log('🚨 selectFromCamera:', typeof selectFromCamera);
    
    const hasImage = currentImageUrl || selectedImage || uploadedImageUrl;
    console.log('🚨 기존 이미지 존재 여부:', hasImage);
    
    // 가장 간단한 Alert로 테스트
    Alert.alert(
      '이미지 선택',
      '어떤 방법으로 이미지를 추가하시겠습니까?',
      [
        {
          text: '갤러리',
          onPress: () => {
            console.log('🚨 갤러리 버튼 클릭됨');
            try {
              selectFromGallery();
              console.log('🚨 갤러리 함수 실행 완료');
            } catch (error) {
              console.error('🚨 갤러리 함수 실행 오류:', error);
            }
          }
        },
        {
          text: '카메라',
          onPress: () => {
            console.log('🚨 카메라 버튼 클릭됨');
            try {
              selectFromCamera();
              console.log('🚨 카메라 함수 실행 완료');
            } catch (error) {
              console.error('🚨 카메라 함수 실행 오류:', error);
            }
          }
        },
        {
          text: '취소',
          style: 'cancel',
          onPress: () => {
            console.log('🚨 취소 버튼 클릭됨');
          }
        }
      ],
      { cancelable: true }
    );
    
    // Alert가 제대로 표시되는지 확인
    console.log('🚨 Alert.alert 호출 완료');
    
  }, [currentImageUrl, selectedImage, uploadedImageUrl, selectFromGallery, selectFromCamera, removeImage]);

  // 이미지 선택 응답 처리
  const handleImageResponse = useCallback(async (response: ImagePickerResponse) => {
    console.log('📸 handleImageResponse 호출됨 (screens):', {
      didCancel: response.didCancel,
      errorMessage: response.errorMessage,
      assetsLength: response.assets?.length || 0
    });
    
    if (response.didCancel || response.errorMessage) {
      console.log('📸 이미지 선택 취소됨 또는 에러 (screens):', response.errorMessage);
      return;
    }

    if (response.assets && response.assets[0] && response.assets[0].uri) {
      const asset = response.assets[0];
      const imageUri = asset.uri;
      
      console.log('📸 선택된 이미지 정보 (screens):', {
        uri: imageUri,
        type: asset.type,
        size: asset.fileSize,
        width: asset.width,
        height: asset.height
      });
      
      if (!imageUri) {
        console.error('❌ 이미지 URI가 없음 (screens)');
        Alert.alert('오류', '이미지 URI를 가져올 수 없습니다.');
        return;
      }
      
      // 기존 이미지 상태 기록
      console.log('📸 이미지 교체 전 상태 (screens):', {
        currentImageUrl,
        selectedImage,
        uploadedImageUrl,
        displayUrl: getDisplayImageUrl()
      });
      
      // 기존 이미지 상태 초기화 후 새 이미지 설정
      console.log('📸 새 이미지 선택됨, 기존 상태 초기화 (screens)');
      setCurrentImageUrl(null);  // 기존 이미지 제거
      setUploadedImageUrl(null); // 이전 업로드 URL 제거
      setSelectedImage(imageUri); // 새 이미지 설정
      
      console.log('📸 상태 초기화 완료, 새 이미지 설정됨 (screens):', imageUri);
      
      // 이미지 업로드
      setIsUploadingImage(true);
      console.log('📸 이미지 업로드 시작 (screens)...');
      
      try {
        const uploadResponse = await uploadService.uploadImage(imageUri);
        console.log('📸 업로드 응답 (screens):', uploadResponse.data);
        
        if (uploadResponse.data?.data?.images?.[0]?.url) {
          const imageUrl = uploadResponse.data.data.images[0].url;
          console.log('✅ 새 이미지 업로드 성공 (screens):', imageUrl);
          
          setUploadedImageUrl(imageUrl);
          
          console.log('📸 업로드 완료 후 상태 (screens):', {
            selectedImage: imageUri,
            uploadedImageUrl: imageUrl,
            currentImageUrl: null
          });
          
          // 업로드 완료 후 상태 정리 - 지연 시간 늘림 (screens)
          setTimeout(() => {
            console.log('📸 로컬 이미지 제거, uploadedImageUrl 유지 (screens):', imageUrl);
            setSelectedImage(null);
            // 강제로 리렌더링 트리거
            console.log('🔄 강제 리렌더링을 위한 상태 확인 (screens):', {
              uploadedImageUrl: imageUrl,
              selectedImage: null,
              displayUrl: imageUrl
            });
          }, 200); // 지연 시간을 200ms로 증가
        } else {
          console.error('❌ 업로드 응답에서 이미지 URL 없음 (screens):', uploadResponse.data);
          throw new Error('업로드된 이미지 URL을 받지 못했습니다.');
        }
      } catch (error: any) {
        console.error('❌ 이미지 업로드 실패 (screens):', error);
        Alert.alert('오류', '이미지 업로드 중 오류가 발생했습니다.');
        setSelectedImage(null);
      } finally {
        setIsUploadingImage(false);
        console.log('📸 업로딩 상태 해제 (screens)');
      }
    } else {
      console.error('❌ 올바른 이미지 자산이 없음 (screens):', response);
    }
  }, [currentImageUrl, selectedImage, uploadedImageUrl]);


  // 게시물 수정
  const handleUpdate = async () => {
    if (!content.trim()) {
      setModalMessage('게시물 내용을 입력해주세요.');
      setErrorModalVisible(true);
      return;
    }

    if (selectedEmotions.length === 0) {
      setModalMessage('감정을 하나 이상 선택해주세요.');
      setErrorModalVisible(true);
      return;
    }

    if (content.length < 10) {
      setModalMessage('게시물 내용은 10자 이상 입력해주세요.');
      setErrorModalVisible(true);
      return;
    }

    if (content.length > 1000) {
      setModalMessage('게시물 내용은 1000자 이하로 입력해주세요.');
      setErrorModalVisible(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 최종 이미지 URL 결정 및 디버깅 (screens)
      let finalImageUrl = null;
      
      console.log('💾 게시물 업데이트 시 이미지 상태 확인 (screens):', {
        uploadedImageUrl,
        currentImageUrl,
        selectedImage,
        originalPostImageUrl: originalPost?.image_url
      });
      
      if (uploadedImageUrl) {
        // 새로 업로드된 이미지가 있는 경우
        finalImageUrl = uploadedImageUrl;
        console.log('💾 새로 업로드된 이미지 URL 사용 (screens):', finalImageUrl);
      } else if (currentImageUrl && !selectedImage) {
        // 기존 이미지를 유지하는 경우
        finalImageUrl = currentImageUrl;
        console.log('💾 기존 이미지 URL 유지 (screens):', finalImageUrl);
      } else {
        // 이미지가 제거된 경우
        finalImageUrl = null;
        console.log('💾 이미지 제거됨 (screens)');
      }

      const updateData = {
        content: content.trim(),
        emotion_ids: selectedEmotions,
        is_anonymous: isAnonymous,
        image_url: finalImageUrl
      };

      console.log('💾 서버로 전송할 데이터 (screens):', updateData);
      console.log('💾 서버로 전송할 이미지 URL (screens):', finalImageUrl);

      const response = await postService.updatePost(postId, updateData);
      
      console.log('✅ 게시물 수정 완료 응답 (screens):', response);
      console.log('✅ 응답 데이터 (screens):', response.data);
      
      if (response.data?.post?.image_url) {
        console.log('✅ 서버에서 반환된 이미지 URL (screens):', response.data.post.image_url);
        // 서버 응답에서 받은 이미지 URL로 currentImageUrl 업데이트
        setCurrentImageUrl(response.data.post.image_url);
        console.log('✅ currentImageUrl 업데이트됨 (screens):', response.data.post.image_url);
      }
      
      if (response.status === 'success') {
        // 수정 성공 후 상태 정리 (screens)
        setUploadedImageUrl(null);  // 업로드 URL 정리
        setSelectedImage(null);     // 선택된 이미지 정리
        console.log('💾 수정 성공 후 상태 정리 완료 (screens)');
        
        setModalMessage('게시물이 성공적으로 수정되었습니다.');
        setSuccessModalVisible(true);
      } else {
        throw new Error(response.message || '게시물 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('게시물 수정 오류:', error);
      setModalMessage(error.response?.data?.message || error.message || '게시물 수정 중 오류가 발생했습니다.');
      setErrorModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 게시물 삭제
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await postService.deletePost(postId);
      
      if (response.status === 'success') {
        setDeleteDialogVisible(false);
        Alert.alert(
          '삭제 완료',
          '게시물이 삭제되었습니다.',
          [{ text: '확인', onPress: () => navigation.navigate('MyPosts') }]
        );
      } else {
        throw new Error(response.message || '게시물 삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('게시물 삭제 오류:', error);
      Alert.alert(
        '삭제 실패',
        error.response?.data?.message || error.message || '게시물 삭제 중 오류가 발생했습니다.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // 로딩 화면
  if (isLoading) {
    return (
      <Center style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg.secondary }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={{ marginTop: 16, fontSize: FONT_SIZES.bodyLarge, color: theme.text.secondary }}>게시물을 불러오는 중...</Text>
      </Center>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg.secondary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1, paddingHorizontal: scale(24), paddingVertical: scale(16) }}
        contentContainerStyle={{
          paddingBottom: scale(120), // 네비게이션 바와 키보드 공간 확보
          flexGrow: 1
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 게시물 내용 입력 */}
        <Box style={{
          backgroundColor: theme.bg.card,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          shadowColor: isDark ? '#000000' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.1 : 0.2,
          shadowRadius: 4,
          elevation: 2
        }}>
          <Text style={{
            fontSize: FONT_SIZES.h2,
            fontWeight: 'bold',
            marginBottom: 16,
            color: theme.text.primary
          }}>📝 게시물 내용</Text>
          <Box style={{
            borderWidth: 1,
            borderColor: theme.bg.border,
            borderRadius: 8,
            marginBottom: 12
          }}>
            <TextInput
              placeholder="수정할 내용을 입력하세요... (10-1000자)"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              style={{
                backgroundColor: theme.bg.card,
                padding: scale(12),
                fontSize: scale(17),
                color: theme.text.primary,
                borderRadius: scale(8),
                minHeight: scale(120),
                textAlignVertical: 'top',
                fontFamily: 'Pretendard-Regular',
                lineHeight: scale(24)
              }}
              maxLength={1000}
              placeholderTextColor={theme.text.tertiary}
            />
          </Box>
          <Text style={{
            textAlign: 'right',
            fontSize: FONT_SIZES.small,
            color: theme.text.secondary
          }}>
            {content.length}/1000자
          </Text>
        </Box>

        {/* 이미지 섹션 */}
        <Box style={{
          backgroundColor: theme.bg.card,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          shadowColor: isDark ? '#000000' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.1 : 0.2,
          shadowRadius: 4,
          elevation: 2
        }}>
          <Text style={{
            fontSize: FONT_SIZES.h2,
            fontWeight: 'bold',
            marginBottom: 16,
            color: theme.text.primary
          }}>📸 이미지</Text>
          
          {getDisplayImageUrl() ? (
            <Box className="relative mb-4">
              <Image
                source={{ uri: getDisplayImageUrl()! }}
                style={{
                  width: screenWidth - 48,
                  height: imageHeight,
                  borderRadius: scale(12),
                  backgroundColor: '#f3f4f6',
                  borderWidth: 1,
                  borderColor: '#e5e7eb'
                }}
                resizeMode="cover"
                key={getDisplayImageUrl()} // 이미지 URL이 바뀔 때마다 컴포넌트 재생성
                onError={(error: any) => {
                  console.error('❌ 편집 화면 이미지 로드 실패 (screens):', getDisplayImageUrl(), error.nativeEvent.error);
                  console.error('❌ 이미지 로드 실패 상세 정보 (screens):', {
                    selectedImage,
                    uploadedImageUrl,
                    currentImageUrl,
                    displayUrl: getDisplayImageUrl(),
                    timestamp: new Date().toISOString()
                  });
                }}
                onLoad={() => {
                  console.log('✅ 편집 화면 이미지 로드 성공 (screens):', getDisplayImageUrl());
                }}
                onLoadStart={() => {
                  console.log('🔄 이미지 로딩 시작 (screens):', getDisplayImageUrl());
                }}
                onLoadEnd={() => {
                  console.log('🏁 이미지 로딩 완료 (screens):', getDisplayImageUrl());
                }}
              />
              
              {/* 업로딩 오버레이 */}
              {isUploadingImage && (
                <Center style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={{ color: 'white', marginTop: 8, fontWeight: 'bold' }}>
                    업로드 중...
                  </Text>
                </Center>
              )}

              {/* 이미지 상태 표시 */}
              <Box style={{
                position: 'absolute',
                top: scale(8),
                left: scale(8),
                backgroundColor: (selectedImage || (uploadedImageUrl && uploadedImageUrl !== currentImageUrl)) ? theme.colors.primary : '#22c55e',
                borderRadius: scale(12),
                paddingHorizontal: scale(8),
                paddingVertical: scale(4)
              }}>
                <Text style={{ color: (selectedImage || (uploadedImageUrl && uploadedImageUrl !== currentImageUrl)) ? theme.colors.onAccent : 'white', fontSize: scale(13), fontWeight: 'bold' }}>
                  {(selectedImage || (uploadedImageUrl && uploadedImageUrl !== currentImageUrl)) ? '새 이미지' : '기존 이미지'}
                </Text>
              </Box>

              {/* 이미지 제거 버튼 */}
              <Pressable
                style={{
                  position: 'absolute',
                  top: scale(8),
                  right: scale(8),
                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                  borderRadius: scale(16),
                  width: scale(32),
                  height: scale(32),
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={removeImage}
              >
                <MaterialCommunityIcons name="close" size={scale(20)} color="white" />
              </Pressable>
            </Box>
          ) : (
            <Box style={{
              borderWidth: 2,
              borderColor: theme.bg.border,
              borderStyle: 'dashed',
              borderRadius: scale(12),
              padding: scale(32),
              alignItems: 'center',
              backgroundColor: theme.bg.secondary
            }}>
              <MaterialCommunityIcons name="image-plus" size={scale(48)} color={theme.text.tertiary} />
              <Text style={{
                marginTop: scale(12),
                fontSize: scale(14),
                color: theme.text.secondary,
                textAlign: 'center'
              }}>
                이미지가 없습니다
              </Text>
            </Box>
          )}

          {/* 이미지 선택/변경 버튼 */}
          <Button
            mode="contained"
            onPress={handleImagePicker}
            disabled={isUploadingImage}
            style={{
              marginTop: scale(12),
              borderRadius: scale(8),
              backgroundColor: getDisplayImageUrl() ? '#f59e0b' : theme.colors.primary
            }}
            contentStyle={{ paddingVertical: scale(8) }}
            icon={getDisplayImageUrl() ? "image-edit" : "image-plus"}
            labelStyle={{ fontSize: scale(14), ...(getDisplayImageUrl() ? {} : { color: theme.colors.onAccent }) }}
            {...({} as any)}
          >
            {getDisplayImageUrl() ? '이미지 변경/제거' : '이미지 추가'}
          </Button>
        </Box>

        {/* 감정 선택 */}
        <Box
          style={{
            marginHorizontal: scale(8),
            paddingHorizontal: scale(20),
            paddingVertical: scale(20),
            backgroundColor: theme.bg.card,
            borderRadius: 12,
            marginBottom: 16,
            shadowColor: isDark ? '#000000' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.1 : 0.2,
            shadowRadius: 8,
            elevation: 3
          }}
        >
          <Text
            style={{
              fontSize: scale(20),
              fontWeight: 'bold',
              marginBottom: scale(16),
              color: theme.text.primary,
              fontFamily: 'System',
              includeFontPadding: false,
              lineHeight: scale(26)
            }}
          >
            😊 감정 선택
          </Text>
          <Text
            style={{
              fontSize: scale(15),
              color: theme.text.secondary,
              marginBottom: scale(16),
              lineHeight: scale(21),
              fontFamily: 'System',
              includeFontPadding: false
            }}
          >
            현재 기분을 나타내는 감정을 하나 선택해주세요
          </Text>
          {emotionLoading ? (
            <Center className="py-8">
              <ActivityIndicator size="small" color="#6b46c1" />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: FONT_SIZES.bodyLarge,
                  color: theme.text.secondary,
                  fontFamily: 'Pretendard-Regular',
                  includeFontPadding: false,
                  lineHeight: 22
                }}
              >
                감정 목록을 불러오는 중...
              </Text>
            </Center>
          ) : (
            <Box className="flex-row flex-wrap justify-between">
              {emotionOptions.map((emotion) => (
                <Pressable
                  key={emotion.id}
                  onPress={() => handleEmotionToggle(emotion.id)}
                  style={{
                    margin: scale(4),
                    paddingHorizontal: scale(16),
                    paddingVertical: scale(12),
                    borderRadius: scale(20),
                    borderWidth: 2,
                    borderColor: selectedEmotions.includes(emotion.id) ? theme.colors.accent : 'transparent',
                    backgroundColor: selectedEmotions.includes(emotion.id) ? theme.colors.tint : theme.colors.surface,
                    shadowColor: isDark ? '#000000' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selectedEmotions.includes(emotion.id) ? 0.3 : (isDark ? 0.1 : 0.2),
                    shadowRadius: 4,
                    elevation: selectedEmotions.includes(emotion.id) ? 4 : 2
                  }}
                >
                  <HStack className="items-center">
                    <MaterialCommunityIcons
                      name={emotion.icon as any}
                      size={scale(18)}
                      color={theme.colors.text.primary}
                    />
                    <Text
                      style={{
                        marginLeft: scale(8),
                        fontSize: scale(15),
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: theme.colors.text.primary,
                        fontFamily: 'Pretendard-Bold',
                        includeFontPadding: false,
                        lineHeight: scale(20)
                      }}
                    >
                      {emotion.label}
                    </Text>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={scale(16)}
                      color={theme.colors.accent}
                      style={{ marginLeft: scale(6), opacity: selectedEmotions.includes(emotion.id) ? 1 : 0 }}
                    />
                  </HStack>
                </Pressable>
              ))}
            </Box>
          )}
        </Box>

        {/* 익명 설정 */}
        <Box
          style={{
            marginHorizontal: scale(8),
            paddingHorizontal: scale(20),
            paddingVertical: scale(20),
            backgroundColor: theme.bg.card,
            borderRadius: 12,
            marginBottom: 16,
            shadowColor: isDark ? '#000000' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.1 : 0.2,
            shadowRadius: 8,
            elevation: 3
          }}
        >
          <HStack className="justify-between items-center">
            <VStack className="flex-1 mr-4">
              <Text
                style={{
                  fontSize: scale(18),
                  fontWeight: 'bold',
                  marginBottom: scale(8),
                  color: theme.text.primary,
                  fontFamily: 'Pretendard-Bold',
                  includeFontPadding: false,
                  lineHeight: scale(24)
                }}
              >
                🕶️ 익명으로 게시
              </Text>
              <Text
                style={{
                  fontSize: scale(15),
                  color: theme.text.secondary,
                  lineHeight: scale(21),
                  fontFamily: 'Pretendard-Regular',
                  includeFontPadding: false
                }}
              >
                닉네임 대신 '익명'으로 표시됩니다
              </Text>
            </VStack>
            <Box
              style={{
                backgroundColor: theme.bg.secondary,
                borderRadius: 999,
                padding: 8,
                shadowColor: isDark ? '#000000' : '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.1 : 0.2,
                shadowRadius: 2,
                elevation: 2
              }}
            >
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                thumbColor={isAnonymous ? theme.colors.onAccent : '#f4f3f4'}
                trackColor={{ false: '#d1d5db', true: theme.colors.primary }}
                style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
              />
            </Box>
          </HStack>
        </Box>

        {/* 수정 안내 */}
        <Box
          style={{
            marginHorizontal: scale(8),
            paddingHorizontal: scale(20),
            paddingVertical: scale(20),
            backgroundColor: theme.bg.card,
            borderRadius: scale(12),
            marginBottom: scale(16),
            borderWidth: 1,
            borderColor: theme.bg.border,
            shadowColor: isDark ? '#000000' : '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.1 : 0.2,
            shadowRadius: 8,
            elevation: 3
          }}
        >
          <Text
            style={{
              fontSize: scale(18),
              fontWeight: 'bold',
              marginBottom: scale(16),
              color: theme.text.primary,
              fontFamily: 'System',
              includeFontPadding: false,
              lineHeight: scale(24)
            }}
          >
            ✏️ 수정 안내
          </Text>
          <VStack style={{ gap: scale(12) }}>
            <HStack className="items-center">
              <Box
                style={{
                  width: scale(8),
                  height: scale(8),
                  backgroundColor: theme.colors.primary,
                  borderRadius: scale(4),
                  marginRight: scale(12),
                  marginTop: 2
                }}
              />
              <Text
                style={{
                  fontSize: scale(15),
                  color: theme.text.secondary,
                  flex: 1,
                  lineHeight: scale(21),
                  fontFamily: 'Pretendard-Regular',
                  includeFontPadding: false
                }}
              >
                최소 10자 이상, 최대 1000자까지 입력 가능합니다
              </Text>
            </HStack>
            <HStack className="items-center">
              <Box
                style={{
                  width: scale(8),
                  height: scale(8),
                  backgroundColor: theme.colors.primary,
                  borderRadius: scale(4),
                  marginRight: scale(12),
                  marginTop: 2
                }}
              />
              <Text
                style={{
                  fontSize: scale(15),
                  color: theme.text.secondary,
                  flex: 1,
                  lineHeight: scale(21),
                  fontFamily: 'Pretendard-Regular',
                  includeFontPadding: false
                }}
              >
                감정은 하나를 선택해야 합니다
              </Text>
            </HStack>
            <HStack className="items-center">
              <Box
                style={{
                  width: scale(8),
                  height: scale(8),
                  backgroundColor: theme.colors.primary,
                  borderRadius: scale(4),
                  marginRight: scale(12),
                  marginTop: 2
                }}
              />
              <Text
                style={{
                  fontSize: scale(15),
                  color: theme.text.secondary,
                  flex: 1,
                  lineHeight: scale(21),
                  fontFamily: 'Pretendard-Regular',
                  includeFontPadding: false
                }}
              >
                수정된 내용은 즉시 반영됩니다
              </Text>
            </HStack>
            <HStack className="items-center">
              <Box
                style={{
                  width: scale(8),
                  height: scale(8),
                  backgroundColor: theme.colors.primary,
                  borderRadius: scale(4),
                  marginRight: scale(12),
                  marginTop: 2
                }}
              />
              <Text
                style={{
                  fontSize: scale(15),
                  color: theme.text.secondary,
                  flex: 1,
                  lineHeight: scale(21),
                  fontFamily: 'Pretendard-Regular',
                  includeFontPadding: false
                }}
              >
                부적절한 내용은 관리자에 의해 삭제될 수 있습니다
              </Text>
            </HStack>
          </VStack>
        </Box>
      </ScrollView>

      {/* 삭제 확인 다이얼로그 */}
      {deleteDialogVisible && (
        <Pressable
          className="absolute inset-0 bg-black/50 z-50"
          style={{ justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setDeleteDialogVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.bg.card,
              borderRadius: 12,
              padding: 24,
              marginHorizontal: 40,
              maxWidth: 320,
              width: '90%'
            }}
            onPress={(e: any) => e.stopPropagation()}
          >
            <Text style={{
              fontSize: FONT_SIZES.h3,
              fontWeight: 'bold',
              color: theme.text.primary,
              marginBottom: 16
            }}>🗑️ 게시물 삭제</Text>
            <Text style={{
              fontSize: FONT_SIZES.bodyLarge,
              color: theme.text.secondary,
              marginBottom: 8
            }}>이 게시물을 정말 삭제하시겠습니까?</Text>
            <Text style={{
              fontSize: FONT_SIZES.bodySmall,
              color: '#ef4444',
              fontStyle: 'italic',
              marginBottom: 24
            }}>
              삭제된 게시물은 복구할 수 없습니다.
            </Text>
            <HStack className="justify-end" style={{ gap: 12 }}>
              <Pressable
                onPress={() => setDeleteDialogVisible(false)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: theme.bg.border,
                  borderRadius: 8
                }}
              >
                <Text style={{
                  color: theme.text.secondary,
                  fontWeight: '500'
                }}>취소</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                disabled={isDeleting}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: '#ef4444',
                  borderRadius: 8
                }}
              >
                <HStack className="items-center">
                  {isDeleting && <ActivityIndicator size="small" color="white" style={{ marginRight: 4 }} />}
                  <Text style={{
                    color: '#ffffff',
                    fontWeight: '500'
                  }}>{isDeleting ? '삭제 중...' : '삭제'}</Text>
                </HStack>
              </Pressable>
            </HStack>
          </Pressable>
        </Pressable>
      )}

      {/* 성공 모달 */}
      {successModalVisible && (
        <Box
          className="absolute inset-0 bg-black/50 z-50"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <Pressable
            onPress={() => {
              setSuccessModalVisible(false);
              navigation.goBack();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          />
          <Box
            style={{
              backgroundColor: theme.bg.card,
              borderRadius: 12,
              padding: 24,
              marginHorizontal: 40,
              maxWidth: 320,
              width: '90%',
              position: 'relative',
              zIndex: 10000
            }}
          >
            <Text style={{
              fontSize: FONT_SIZES.h3,
              fontWeight: 'bold',
              textAlign: 'center',
              color: theme.colors.success || '#10b981',
              marginBottom: 16
            }}>✅ 수정 완료!</Text>
            <Text style={{
              fontSize: FONT_SIZES.bodyLarge,
              color: theme.text.secondary,
              textAlign: 'center',
              marginBottom: 24
            }}>{modalMessage}</Text>
            <Pressable
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
              style={{
                paddingVertical: 12,
                backgroundColor: theme.colors.success || '#10b981',
                borderRadius: 8
              }}
            >
              <Text style={{
                textAlign: 'center',
                color: colors.text,
                fontWeight: '500'
              }}>확인</Text>
            </Pressable>
          </Box>
        </Box>
      )}

      {/* 오류 모달 */}
      {errorModalVisible && (
        <Pressable
          className="absolute inset-0 bg-black/50 z-50"
          style={{ justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setErrorModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.bg.card,
              borderRadius: 12,
              padding: 24,
              marginHorizontal: 40,
              maxWidth: 320,
              width: '90%'
            }}
            onPress={(e: any) => e.stopPropagation()}
          >
            <Text style={{
              fontSize: FONT_SIZES.h3,
              fontWeight: 'bold',
              textAlign: 'center',
              color: theme.colors.error || '#ef4444',
              marginBottom: 16
            }}>❌ 알림</Text>
            <Text style={{
              fontSize: FONT_SIZES.bodyLarge,
              color: theme.text.secondary,
              textAlign: 'center',
              marginBottom: 24
            }}>{modalMessage}</Text>
            <Pressable
              onPress={() => setErrorModalVisible(false)}
              style={{
                paddingVertical: 12,
                backgroundColor: theme.colors.error || '#ef4444',
                borderRadius: 8
              }}
            >
              <Text style={{
                textAlign: 'center',
                color: colors.text,
                fontWeight: '500'
              }}>확인</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {/* 취소 확인 모달 */}
      {cancelModalVisible && (
        <Box
          className="absolute inset-0 bg-black/50 z-50"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <Pressable
            onPress={() => setCancelModalVisible(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          />
          <Box
            style={{
              backgroundColor: theme.bg.card,
              borderRadius: 12,
              padding: 24,
              marginHorizontal: 40,
              maxWidth: 320,
              width: '90%',
              position: 'relative',
              zIndex: 10000
            }}
          >
            <Text style={{
              fontSize: FONT_SIZES.h3,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#f59e0b',
              marginBottom: 16
            }}>⚠️ 취소 확인</Text>
            <Text style={{
              fontSize: FONT_SIZES.bodyLarge,
              color: theme.text.secondary,
              textAlign: 'center',
              marginBottom: 24
            }}>{modalMessage}</Text>
            <VStack style={{ gap: 12 }}>
              <Pressable
                onPress={() => {
                  setCancelModalVisible(false);
                  navigation.goBack();
                }}
                style={{
                  paddingVertical: 12,
                  backgroundColor: theme.colors.error || '#ef4444',
                  borderRadius: 8
                }}
              >
                <Text style={{
                  textAlign: 'center',
                  color: colors.text,
                  fontWeight: '500'
                }}>예, 나가기</Text>
              </Pressable>
              <Pressable
                onPress={() => setCancelModalVisible(false)}
                style={{
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: theme.bg.border,
                  borderRadius: 8
                }}
              >
                <Text style={{
                  textAlign: 'center',
                  color: theme.text.secondary,
                  fontWeight: '500'
                }}>아니오, 계속 편집</Text>
              </Pressable>
            </VStack>
          </Box>
        </Box>
      )}
    </KeyboardAvoidingView>
  );
};


export default EditPostScreen;