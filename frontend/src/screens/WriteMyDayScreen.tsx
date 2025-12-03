import React, { useState, useCallback, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  useWindowDimensions,
  PermissionsAndroid,
  Keyboard,
  InteractionManager,
  Modal,
  DeviceEventEmitter,
  PixelRatio,
  TextInput as RNTextInput
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Button,
  Card,
  Chip,
  ActivityIndicator,
  Surface,
  IconButton,
  HelperText
} from 'react-native-paper';
import { Box, Text, VStack, HStack, Center, Pressable } from '../components/ui';
import { launchImageLibrary, launchCamera, ImagePickerResponse, PhotoQuality } from 'react-native-image-picker';
// import DocumentPicker, { DocumentPickerResponse, types } from '@react-native-documents/picker';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import env from '../config/env';
import emotionService, { type Emotion } from '../services/api/emotionService';

import ConfirmationModal from "../components/ui/ConfirmationModal";
// 확장된 감정 타입 (표시용 아이콘 포함)
interface ExtendedEmotion extends Emotion {
  displayIcon?: string;
}
import myDayService from '../services/api/myDayService';
import uploadService from '../services/api/uploadService';
import { normalizeImageUrl, logImageError, logImageSuccess } from '../utils/imageUtils';
import ImageCarousel from '../components/ImageCarousel';

// 반응형 설정 (모듈 레벨에서 Dimensions.get() 호출 제거 - React Native 0.80 호환)
const BASE_WIDTH = 360;

// 반응형 크기 계산 (시스템 폰트 크기 설정 대응) - React Native 0.80 호환
const normalize = (size: number, applyFontScale = true) => {
  try {
    const dims = Dimensions.get('window');
    const screenWidth = dims?.width || BASE_WIDTH;
    const scale = Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.3);
    const fontScale = applyFontScale ? PixelRatio.getFontScale() : 1;
    const newSize = size * scale * fontScale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } catch (e) {
    return Math.round(size); // 기본값
  }
};

// 폰트 크기 표준화 (시스템 폰트 크기 설정 적용)
const getFontSizes = () => ({
  xs: normalize(10, true),
  sm: normalize(12, true),
  base: normalize(14, true),
  lg: normalize(16, true),
  xl: normalize(20, true),
  emoji: normalize(22, false),
  emotionEmoji: normalize(24, false)
});

// 여백 표준화 (fontScale 미적용)
const getSpacing = () => ({
  xs: normalize(4, false),
  sm: normalize(8, false),
  md: normalize(12, false),
  lg: normalize(16, false),
  xl: normalize(20, false),
  xxl: normalize(24, false)
});


// width는 컴포넌트 내부에서 동적으로 가져옴

// 안전한 Alert 헬퍼 함수
const safeAlert = (title: string, message?: string, buttons?: any[]) => {
  if (__DEV__) {
    console.log('🚨 safeAlert 호출:', { title, message });
  }
  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      Alert.alert(title, message, buttons);
    }, 500);
  });
};

// 감정 아이콘과 색상 매핑 (이모지 사용)
interface LocalEmotion {
  label: string;
  emoji: string; // 이모지
  emojiCode: string; // Twemoji 코드포인트
  color: string;
}

// Twemoji CDN URL 생성 함수
const getTwemojiUrl = (code: string) =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${code}.png`;

// 사용자 지정 감정 목록 (이모지와 색상 포함) - DB/공통상수 순서와 일치
const localEmotions: LocalEmotion[] = [
  { label: '기쁨이', emoji: '😊', emojiCode: '1f60a', color: '#FFD700' },    // 1
  { label: '행복이', emoji: '😄', emojiCode: '1f604', color: '#FFA500' },    // 2
  { label: '슬픔이', emoji: '😢', emojiCode: '1f622', color: '#4682B4' },    // 3
  { label: '우울이', emoji: '😞', emojiCode: '1f61e', color: '#708090' },    // 4
  { label: '불안이', emoji: '😰', emojiCode: '1f630', color: '#DDA0DD' },    // 5
  { label: '걱정이', emoji: '😟', emojiCode: '1f61f', color: '#FFA07A' },    // 6
  { label: '버럭이', emoji: '😠', emojiCode: '1f620', color: '#FF4500' },    // 7
  { label: '짜증이', emoji: '😤', emojiCode: '1f624', color: '#DC143C' },    // 8
  { label: '감동이', emoji: '🥺', emojiCode: '1f97a', color: '#FF6347' },    // 9
  { label: '황당이', emoji: '🤨', emojiCode: '1f928', color: '#20B2AA' },    // 10
  { label: '당황이', emoji: '😲', emojiCode: '1f632', color: '#FF8C00' },    // 11
  { label: '무섭이', emoji: '😨', emojiCode: '1f628', color: '#9370DB' },    // 12
  { label: '편안이', emoji: '😌', emojiCode: '1f60c', color: '#98FB98' },    // 13
  { label: '추억이', emoji: '🥰', emojiCode: '1f970', color: '#87CEEB' },    // 14
  { label: '설렘이', emoji: '🤗', emojiCode: '1f917', color: '#FF69B4' },    // 15
  { label: '지루미', emoji: '😑', emojiCode: '1f611', color: '#A9A9A9' },    // 16
  { label: '궁금이', emoji: '🤔', emojiCode: '1f914', color: '#DAA520' },    // 17
  { label: '사랑이', emoji: '❤️', emojiCode: '2764', color: '#F8BBD9' },    // 18
  { label: '아픔이', emoji: '🤕', emojiCode: '1f915', color: '#8B4513' },    // 19
  { label: '욕심이', emoji: '🤑', emojiCode: '1f911', color: '#32CD32' }     // 20
];

// 기본 감정 색상 매핑 (백엔드에서 색상이 없을 경우 사용)
const getEmotionColor = (emotionName: string): string => {
  const localEmotion = localEmotions.find(emotion => emotion.label === emotionName);
  return localEmotion?.color || '#6366f1';
};

// 감정 아이콘 매핑 (백엔드 아이콘이 Material Icons인 경우 이모지로 변환)
const getEmotionIcon = (emotion: Emotion): string => {
  console.log('🔍 감정 아이콘 매핑:', { name: emotion.name, originalIcon: emotion.icon });
  
  // 백엔드 icon이 이미 이모지인 경우 그대로 사용
  if (emotion.icon && emotion.icon.length <= 4 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]/u.test(emotion.icon)) {
    console.log('✅ 백엔드 이모지 사용:', emotion.icon);
    return emotion.icon;
  }
  
  // 로컬 매핑에서 찾기
  const localEmotion = localEmotions.find(local => local.label === emotion.name);
  if (localEmotion) {
    console.log('✅ 로컬 매핑 사용:', localEmotion.emoji);
    return localEmotion.emoji;
  }
  
  // 감정명 기반 추가 매핑 (백엔드 감정명이 다를 수 있음)
  const emotionNameMappings: { [key: string]: string } = {
    // 새로운 친근한 감정들
    '기쁨이': '😊',
    '행복이': '😄',
    '슬픔이': '😢',
    '우울이': '😞',
    '지루미': '😑',
    '버럭이': '😠',
    '불안이': '😰',
    '걱정이': '😟',
    '감동이': '🥺',
    '황당이': '🤨',
    '당황이': '😲',
    '짜증이': '😤',
    '무섭이': '😨',
    '추억이': '🥰',
    '설렘이': '🤗',
    '편안이': '😌',
    '궁금이': '🤔',
    '사랑이': '❤️',
    '아픔이': '🤕',
    '욕심이': '🤑',
    // 기존 감정명도 호환 (백엔드에서 기존 이름으로 올 수 있음)
    '기쁨': '😊',
    '행복': '😄',
    '슬픔': '😢',
    '우울': '😞',
    '지루': '😑',
    '화남': '😠',
    '불안': '😰',
    '걱정': '😟',
    '감동': '🥺',
    '황당': '🤨',
    '당황': '😲',
    '짜증': '😤',
    '무서': '😨',
    '추억': '🥰',
    '설렘': '🤗',
    '편안': '😌',
    '궁금': '🤔',
    '사랑': '❤️',
    '아픔': '🤕',
    '욕심': '🤑',
    // 영어명도 지원
    'delight': '😊',
    'happiness': '😄',
    'joy': '😄',
    'sorrow': '😢',
    'sad': '😢',
    'melancholy': '😞',
    'boring': '😑',
    'angry': '😠',
    'snap': '😠',
    'anxiety': '😰',
    'anxious': '😰',
    'worry': '😟',
    'moving': '🥺',
    'moved': '🥺',
    'absurd': '🤨',
    'embarrassed': '😲',
    'surprised': '😲',
    'annoyed': '😤',
    'scary': '😨',
    'afraid': '😨',
    'reminisce': '🥹',
    'nostalgic': '🥹',
    'excited': '🤗',
    'fluttering': '🤗',
    'calm': '😌',
    'home': '😌',
    'wonder': '🤔',
    'curious': '🤔',
    'love': '❤️',
    'sick': '🤕',
    'pain': '🤕',
    'greedy': '🤑'
  };
  
  const mappedIcon = emotionNameMappings[emotion.name.toLowerCase()];
  if (mappedIcon) {
    console.log('✅ 이름 기반 매핑 사용:', mappedIcon);
    return mappedIcon;
  }
  
  // 기본 아이콘
  console.log('⚠️ 기본 아이콘 사용');
  return '😊';
};

interface WriteMyDayScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route?: {
    params?: {
      editPostId?: number;
      mode?: string;
    };
  };
}

const WriteMyDayScreen: React.FC<WriteMyDayScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HomeStackParamList, 'WriteMyDay'>>();
  const { theme, isDark } = useModernTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const FONT_SIZES = useMemo(() => getFontSizes(), []);
  const SPACING = useMemo(() => getSpacing(), []);
  
  // 편집 모드 파라미터 확인
  const editPostId = route.params?.editPostId || route.params?.postId;
  const mode = route.params?.mode;
  const paramIsEditMode = route.params?.isEditMode;
  const isEditMode = paramIsEditMode || (mode === 'edit' && !!editPostId);
  const existingPost = route.params?.existingPost;
  
  // 임시 테스트: 수동으로 편집 모드 활성화 (디버깅용)
  // const isEditMode = true;
  // const editPostId = 367; // 테스트용 게시물 ID
  
  console.log('🎯 WriteMyDayScreen 로드 - 파라미터 상세:', { 
    isEditMode, 
    editPostId, 
    mode,
    paramIsEditMode,
    hasParams: !!route.params,
    paramsKeys: route.params ? Object.keys(route.params) : [],
    routeParams: route.params,
    allParams: JSON.stringify(route.params),
    routeName: route.name,
    routeKey: route.key
  });

  // 화면 실제 로드 확인을 위한 추가 로그
  console.log('🏠 WriteMyDayScreen 컴포넌트가 렌더링되었습니다');
  
  if (isEditMode) {
    console.log('✏️ 편집 모드로 진입:', editPostId);
  } else {
    console.log('✨ 새 게시물 작성 모드로 진입');
  }

  
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<ExtendedEmotion | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // 다중 이미지 지원
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]); // 업로드된 이미지들
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);
  const [imageUploadSuccess, setImageUploadSuccess] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentError, setContentError] = useState('');
  const [emotions, setEmotions] = useState<ExtendedEmotion[]>([]);
  const [isLoadingEmotions, setIsLoadingEmotions] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isEmotionSectionCollapsed, setIsEmotionSectionCollapsed] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 실제 전송된 감정 데이터 저장 (낙관적 업데이트용)
  const submittedEmotionRef = useRef<any>(null);

  // 감정 데이터 로드
  useEffect(() => {
    const loadEmotions = async () => {
      try {
        setIsLoadingEmotions(true);
        const response = await emotionService.getAllEmotions();
        
        console.log('🔍 백엔드 감정 API 응답:', JSON.stringify(response.data, null, 2));
        
        if (response.data?.status === 'success' && response.data.data && response.data.data.length > 0) {
          console.log('✅ 백엔드에서 받은 감정 데이터:', response.data.data);
          
          // 백엔드 감정 목록을 기준으로 로컬 감정에서 매핑
          const backendEmotionNames = new Set(response.data.data.map(e => e.name));
          console.log('🔍 백엔드 감정 이름들:', Array.from(backendEmotionNames));
          
          // 백엔드에 존재하는 감정들만 로컬에서 선택하여 사용
          const validEmotions = localEmotions
            .filter(localEmotion => {
              const exists = backendEmotionNames.has(localEmotion.label);
              if (!exists) {
                console.warn(`⚠️ 백엔드에 없는 감정: ${localEmotion.label}`);
              }
              return exists;
            })
            .map((localEmotion, index) => {
              // 백엔드에서 해당 감정 찾기
              const backendEmotion = response.data.data.find(be => be.name === localEmotion.label);
              return {
                emotion_id: backendEmotion?.emotion_id || (index + 1),
                name: localEmotion.label,
                icon: localEmotion.emoji, // 로컬 이모지 사용
                color: localEmotion.color, // 로컬 색상 사용
                displayIcon: localEmotion.emoji
              };
            });
          
          // 백엔드에만 있고 로컬에 없는 감정들도 추가
          const remainingBackendEmotions = response.data.data
            .filter(backendEmotion => !localEmotions.some(local => local.label === backendEmotion.name))
            .map(emotion => ({
              ...emotion,
              color: emotion.color || '#6366f1',
              displayIcon: getEmotionIcon(emotion)
            }));
          
          const mergedEmotions = [...validEmotions, ...remainingBackendEmotions];
          
          console.log('🎨 감정 데이터 처리 완료 (로컬 이모지 + 백엔드 ID):', mergedEmotions.map(e => ({
            name: e.name, 
            originalIcon: e.icon, 
            displayIcon: e.displayIcon,
            color: e.color,
            emotion_id: e.emotion_id,
            source: validEmotions.includes(e) ? 'local-emoji' : 'backend-fallback'
          })));
          
          setEmotions(mergedEmotions);
          
          // 편집 모드가 아닐 때만 첫 번째 감정을 자동 선택
          if (!isEditMode && mergedEmotions.length > 0) {
            console.log('🎯 첫 번째 감정 자동 선택:', mergedEmotions[0]);
            setSelectedEmotion(mergedEmotions[0]);
          }
        } else {
          // 백엔드 데이터가 없으면 로컬 폴백 사용
          console.warn('⚠️ 백엔드 감정 데이터가 없어 로컬 폴백 사용');
          const fallbackEmotions = localEmotions.map((emotion, index) => ({
            emotion_id: index + 1,
            name: emotion.label,
            icon: emotion.emoji,
            color: emotion.color,
            displayIcon: emotion.emoji
          }));
          setEmotions(fallbackEmotions);
          
          // 편집 모드가 아닐 때만 첫 번째 감정을 자동 선택
          if (!isEditMode && fallbackEmotions.length > 0) {
            console.log('🎯 폴백 첫 번째 감정 자동 선택:', fallbackEmotions[0]);
            setSelectedEmotion(fallbackEmotions[0]);
          }
        }
      } catch (error) {
        console.error('❌ 감정 데이터 로드 오류:', error);
        // 에러 발생 시에도 로컬 폴백 사용
        console.warn('⚠️ 네트워크 오류로 로컬 폴백 사용');
        const fallbackEmotions = localEmotions.map((emotion, index) => ({
          emotion_id: index + 1,
          name: emotion.label,
          icon: emotion.emoji,
          color: emotion.color,
          displayIcon: emotion.emoji
        }));
        setEmotions(fallbackEmotions);
        
        // 편집 모드가 아닐 때만 첫 번째 감정을 자동 선택
        if (!isEditMode && fallbackEmotions.length > 0) {
          console.log('🎯 에러 폴백 첫 번째 감정 자동 선택:', fallbackEmotions[0]);
          setSelectedEmotion(fallbackEmotions[0]);
        }
      } finally {
        setIsLoadingEmotions(false);
      }
    };

    loadEmotions();
  }, []);

  // 키보드 상태 감지
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        // 키보드가 올라올 때 감정 선택 영역을 자동 축소하여 공간 확보
        setIsEmotionSectionCollapsed(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        // 키보드가 내려갈 때는 자동으로 펼치지 않음 (사용자 제어)
      }
    );

    return () => {
      if (keyboardDidShowListener) {
        keyboardDidShowListener.remove();
      }
      if (keyboardDidHideListener) {
        keyboardDidHideListener.remove();
      }
    };
  }, []);

  // 편집 모드일 때 기존 게시물 데이터 로드
  useEffect(() => {
    const loadEditData = async () => {
      console.log('🔍 loadEditData 호출:', { isEditMode, editPostId, hasExistingPost: !!existingPost });
      
      if (!isEditMode) {
        console.log('❌ 편집 모드가 아니어서 로드 건너뜀', { 
          isEditMode, 
          editPostId, 
          hasExistingPost: !!existingPost 
        });
        return;
      }
      
      if (!editPostId && !existingPost) {
        console.log('❌ 편집할 게시물 ID나 데이터가 없어서 로드 건너뜀', { 
          editPostId, 
          hasExistingPost: !!existingPost 
        });
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔄 기존 게시물 데이터로 폼 채우기:', existingPost);
        
        // 기존 데이터로 폼 필드 채우기
        console.log('📝 콘텐츠 설정:', existingPost.content);
        setContent(existingPost.content || '');
        
        // 이미지 URL 파싱 (JSON 배열 또는 단일 URL 지원)
        let imageUrls: string[] = [];
        if (existingPost.images && Array.isArray(existingPost.images)) {
          imageUrls = existingPost.images;
        } else if (existingPost.image_url) {
          try {
            if (typeof existingPost.image_url === 'string' && existingPost.image_url.startsWith('[')) {
              imageUrls = JSON.parse(existingPost.image_url);
            } else {
              imageUrls = [existingPost.image_url];
            }
          } catch (e) {
            imageUrls = [existingPost.image_url];
          }
        }

        if (imageUrls.length > 0) {
          console.log('🖼️ 이미지 URL 설정:', imageUrls);

          // 상대 경로를 절대 경로로 변환
          const normalizedUrls = imageUrls.map(url => {
            if (url && !url.startsWith('http') && !url.startsWith('file://')) {
              const baseUrl = env.API_URL.replace('/api', '');
              return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
            }
            return url;
          });

          console.log('🖼️ 최종 이미지 URLs:', normalizedUrls);
          setSelectedImages(normalizedUrls);
          setUploadedImageUrls(normalizedUrls);
        }
        
        // 익명 설정 확인
        if (existingPost.is_anonymous !== undefined) {
          console.log('🔐 익명 설정:', existingPost.is_anonymous);
          setIsAnonymous(existingPost.is_anonymous);
        }
        
        // 감정 데이터 설정 - emotions 배열에서 또는 직접 emotion_id에서
        let emotionSet = false;
        console.log('😊 감정 데이터 확인:', {
          hasEmotions: !!existingPost.emotions,
          emotionsLength: existingPost.emotions?.length,
          hasEmotion: !!existingPost.emotion,
          emotionId: existingPost.emotion_id
        });

        // emotion (단수) 객체 확인
        if (!emotionSet && existingPost.emotion && existingPost.emotion.emotion_id) {
          const existingEmotion = existingPost.emotion;
          console.log('😊 감정 데이터 (emotion 객체):', existingEmotion);
          const matchedEmotion = emotions.find(e => e.emotion_id === existingEmotion.emotion_id);
          if (matchedEmotion) {
            setSelectedEmotion(matchedEmotion);
            emotionSet = true;
          } else {
            setSelectedEmotion(existingEmotion as ExtendedEmotion);
            emotionSet = true;
          }
        }

        if (!emotionSet && existingPost.emotions && existingPost.emotions.length > 0) {
          const existingEmotion = existingPost.emotions[0];
          console.log('😊 감정 데이터 (emotions 배열):', existingEmotion);

          // emotions 배열에서 매칭되는 감정 찾기 (더 완전한 데이터를 위해)
          if (existingEmotion.emotion_id) {
            const matchedEmotion = emotions.find(e => e.emotion_id === existingEmotion.emotion_id);
            if (matchedEmotion) {
              console.log('😊 매칭된 감정 설정:', matchedEmotion);
              setSelectedEmotion(matchedEmotion);
              emotionSet = true;
            } else {
              // 매칭되지 않으면 기존 데이터 그대로 사용
              console.log('😊 기존 감정 데이터 그대로 사용:', existingEmotion);
              setSelectedEmotion(existingEmotion as ExtendedEmotion);
              emotionSet = true;
            }
          }
        }

        if (!emotionSet && existingPost.emotion_id) {
          console.log('😊 감정 ID로 감정 찾기:', existingPost.emotion_id);
          // 로드된 감정 목록에서 해당 ID 찾기
          const matchedEmotion = emotions.find(e => e.emotion_id === existingPost.emotion_id);
          if (matchedEmotion) {
            console.log('😊 매칭된 감정:', matchedEmotion);
            setSelectedEmotion(matchedEmotion);
            emotionSet = true;
          } else {
            // ID 매핑 시도 (백엔드 ID 1-17 ↔ 로컬 ID)
            const mappedId = ((existingPost.emotion_id - 1) % emotions.length) + 1;
            const mappedEmotion = emotions.find(e => e.emotion_id === mappedId) || emotions[0];
            if (mappedEmotion) {
              console.log('😊 매핑된 감정:', mappedEmotion);
              setSelectedEmotion(mappedEmotion);
              emotionSet = true;
            }
          }
        }

        // 그래도 설정되지 않았으면 첫 번째 감정 사용
        if (!emotionSet && emotions.length > 0) {
          console.log('😊 기본 감정 설정:', emotions[0]);
          setSelectedEmotion(emotions[0]);
        }
        
        console.log('✅ 게시물 수정 데이터 로드 완료');
        
      } catch (error) {
        console.error('❌ 게시물 수정 데이터 설정 실패:', error);
        safeAlert('오류', '게시물 데이터를 설정하는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    // emotions 배열이 로드된 후에 실행
    if (emotions.length > 0) {
      loadEditData();
    }
  }, [isEditMode, editPostId, existingPost, emotions]);

  // 글자 수 제한
  const MAX_CONTENT_LENGTH = 1000;
  const MIN_CONTENT_LENGTH = 10;

  const validateContent = useCallback((text: string) => {
    if (text.length < MIN_CONTENT_LENGTH) {
      setContentError(`최소 ${MIN_CONTENT_LENGTH}자 이상 입력해주세요.`);
      return false;
    }
    if (text.length > MAX_CONTENT_LENGTH) {
      setContentError(`최대 ${MAX_CONTENT_LENGTH}자까지 입력 가능합니다.`);
      return false;
    }
    setContentError('');
    return true;
  }, []);

  const handleContentChange = useCallback((text: string) => {
    setContent(text);
    validateContent(text);
  }, [validateContent]);

  const handleEmotionSelect = useCallback((emotion: ExtendedEmotion) => {
    console.log('🎯 감정 선택:', {
      emotionId: emotion.emotion_id,
      name: emotion.name,
      color: emotion.color,
      icon: emotion.icon,
      displayIcon: emotion.displayIcon
    });
    setSelectedEmotion(emotion);
  }, []);

  const selectImageFromGallery = useCallback(async () => {
    if (isUploadingImage) {
      console.log('❌ 이미 업로드 중입니다.');
      return;
    }

    if (selectedImages.length >= 3) {
      safeAlert('알림', '최대 3개의 이미지만 추가할 수 있습니다.');
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      const options = {
        mediaType: 'photo' as const,
        quality: 0.7 as PhotoQuality,
        maxWidth: 1200, // FHD+/QHD+ 대응
        maxHeight: 1200,
        includeBase64: false,
        selectionLimit: Math.max(1, 3 - selectedImages.length),
        storageOptions: {
          skipBackup: true,
          path: 'images'
        }
      };

      setTimeout(() => {
        launchImageLibrary(options, processImageSelection);
      }, 300); // 딜레이 최적화
    });
  }, [isUploadingImage, selectedImages.length]);

  const selectImageFromCamera = useCallback(async () => {
    if (isUploadingImage) {
      console.log('❌ 이미 업로드 중입니다.');
      return;
    }

    if (Platform.OS === 'android') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        safeAlert('권한 필요', '사진을 촬영하려면 카메라 접근 권한이 필요합니다.');
        return;
      }
    }

    const options = {
      mediaType: 'photo' as const,
      quality: 0.7 as PhotoQuality,
      maxWidth: 1200, // FHD+/QHD+ 대응
      maxHeight: 1200,
      includeBase64: false,
      storageOptions: {
        skipBackup: true,
        path: 'images'
      }
    };

    launchCamera(options, processImageSelection);
  }, [isUploadingImage]);

  const handleImagePicker = useCallback(() => {
    console.log('📸 이미지 선택 버튼 클릭됨', {
      isUploadingImage,
      isLoading,
      selectedImagesCount: selectedImages.length,
      uploadedImageUrlsCount: uploadedImageUrls.length
    });

    if (isUploadingImage || isLoading) {
      console.log('⚠️ 업로드 중이거나 로딩 중이므로 이미지 선택 불가');
      return;
    }

    // 이미지 선택 모달 열기
    console.log('🚀 이미지 선택 모달 열기');
    setShowImagePickerModal(true);
  }, [isUploadingImage, isLoading, selectedImages.length, uploadedImageUrls.length]);

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      
      const granted = Object.values(results).some(result => 
        result === PermissionsAndroid.RESULTS.GRANTED
      );

      console.log('📱 저장소 권한 요청 결과:', results);
      return granted;
    } catch (err) {
      console.warn('❌ 저장소 권한 요청 오류:', err);
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );

      console.log('📱 카메라 권한 요청 결과:', result);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('❌ 카메라 권한 요청 오류:', err);
      return false;
    }
  };

  const processImageSelection = async (response: ImagePickerResponse) => {
    if (response.didCancel) return;

    if (response.errorCode || response.errorMessage) {
      safeAlert('오류', `이미지 선택 중 오류: ${response.errorMessage || response.errorCode}`);
      return;
    }

    if (!response.assets || response.assets.length === 0) {
      safeAlert('오류', '이미지를 선택하지 못했습니다.');
      return;
    }

    const newImages: string[] = [];
    const newUploadedUrls: string[] = [];
    setIsUploadingImage(true);

    try {
      for (const asset of response.assets) {
        if (!asset.uri) continue;

        // 파일 타입 검증 (보안)
        const fileType = asset.type || asset.fileName?.split('.').pop()?.toLowerCase();
        const validTypes = ['jpg', 'jpeg', 'png', 'webp', 'image/jpeg', 'image/png', 'image/webp'];
        if (fileType && !validTypes.some(t => fileType.includes(t))) {
          safeAlert('오류', '지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP만 가능)');
          continue;
        }

        // 파일 크기 검증 (5MB)
        const fileSize = asset.fileSize || 0;
        if (fileSize > 5 * 1024 * 1024) {
          safeAlert('오류', '이미지 크기는 5MB 이하여야 합니다.');
          continue;
        }

        newImages.push(asset.uri);

        try {
          const uploadResponse = await uploadService.uploadImage(asset.uri);
          let imageUrl: string | null = null;

          if (uploadResponse.data?.data?.images?.[0]?.url) {
            imageUrl = uploadResponse.data.data.images[0].url;
          } else if (uploadResponse.data?.data && 'image_url' in uploadResponse.data.data) {
            imageUrl = (uploadResponse.data.data as any).image_url;
          }

          newUploadedUrls.push(imageUrl || asset.uri);
        } catch (uploadError) {
          console.error('❌ 업로드 실패:', uploadError);
          newUploadedUrls.push(asset.uri);
        }
      }

      setSelectedImages(prev => [...prev, ...newImages].slice(0, 3));
      setUploadedImageUrls(prev => [...prev, ...newUploadedUrls].slice(0, 3));
      setImageUploadSuccess(true);
    } catch (error) {
      safeAlert('오류', '이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      safeAlert('알림', '내용을 입력해주세요.');
      return;
    }

    // 수정 모드에서는 기존 감정 사용 가능
    let emotionToUse = selectedEmotion;
    if (!emotionToUse && isEditMode) {
      // 기존 게시물의 감정 데이터 사용
      if (existingPost?.emotions && existingPost.emotions.length > 0) {
        emotionToUse = existingPost.emotions[0];
      } else if (existingPost?.emotion_id) {
        emotionToUse = emotions.find(e => e.emotion_id === existingPost.emotion_id) || null;
      }
    }

    if (!emotionToUse) {
      safeAlert('알림', '감정을 선택해주세요.');
      return;
    }

    if (!emotionToUse.emotion_id || typeof emotionToUse.emotion_id !== 'number') {
      console.error('❌ 유효하지 않은 감정 ID 타입:', emotionToUse);
      safeAlert('오류', '선택된 감정이 유효하지 않습니다. 다른 감정을 선택해주세요.');
      return;
    }

    if (emotionToUse.emotion_id < 1 || emotionToUse.emotion_id > 20) {
      console.error('❌ 감정 ID 범위 초과:', emotionToUse.emotion_id);
      safeAlert('오류', '선택된 감정 ID가 유효 범위를 벗어났습니다. 다른 감정을 선택해주세요.');
      return;
    }

    // 백엔드에 20개 감정이 모두 있으므로 ID 그대로 사용
    const backendEmotionId = emotionToUse.emotion_id;

    console.log('📤 감정 ID 전송:', {
      emotionId: backendEmotionId,
      emotionName: emotionToUse.name
    });

    console.log('✅ 감정 선택 유효성 검사 통과:', {
      emotionId: emotionToUse.emotion_id,
      emotionName: emotionToUse.name,
      isAnonymous: isAnonymous
    });

    // 전송할 감정 데이터를 ref에 저장 (낙관적 업데이트용)
    submittedEmotionRef.current = {
      emotion_id: emotionToUse.emotion_id,
      name: emotionToUse.name,
      icon: emotionToUse.icon || emotionToUse.emoji,
      color: emotionToUse.color
    };

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (__DEV__) {
        console.log('🔐 토큰 확인:', {
          hasToken: !!token,
          tokenLength: token?.length
        });
      }

      if (!token) {
        safeAlert('오류', '로그인이 필요합니다.');
        return;
      }

      const requestBody = {
        content: content.trim(),
        emotion_id: backendEmotionId, // 매핑된 백엔드 감정 ID 사용
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        is_anonymous: isAnonymous
      };

      console.log('📤 제출할 게시물 데이터 상세:', {
        contentLength: content.trim().length,
        localEmotionId: emotionToUse.emotion_id,
        backendEmotionId: backendEmotionId,
        emotionName: emotionToUse.name,
        hasImages: uploadedImageUrls.length > 0,
        imagesCount: uploadedImageUrls.length,
        isAnonymous: isAnonymous,
        anonymousType: typeof isAnonymous
      });

      let response;
      let successMessage;
      
      if (isEditMode && editPostId) {
        // 수정 모드: PUT 요청
        console.log('📤 MyDay 게시물 수정 요청:', {
          postId: editPostId,
          content: content.substring(0, 50) + '...',
          emotion_id: emotionToUse.emotion_id,
          images: uploadedImageUrls,
          imagesCount: uploadedImageUrls.length
        });

        response = await fetch(`${env.API_URL}/my-day/posts/${editPostId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        successMessage = '게시물이 수정되었습니다.';
      } else {
        // 작성 모드: POST 요청
        console.log('📤 MyDay 게시물 작성 요청:', {
          content: content.substring(0, 50) + '...',
          emotion_id: emotionToUse.emotion_id,
          images: uploadedImageUrls,
          imagesCount: uploadedImageUrls.length
        });
        
        response = await fetch(`${env.API_URL}/my-day/posts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        successMessage = '게시물이 작성되었습니다.';
      }

      const result = await response.json();
      console.log(`📥 MyDay 게시물 ${isEditMode ? '수정' : '작성'} 응답:`, result);

      if (response.ok && result.status === 'success') {
        // 새 글 작성 모드일 때만 감정 기록 추가 (수정 모드에서는 감정을 중복 기록하지 않음)
        if (!isEditMode) {
          try {
            console.log('📊 감정 통계에 기록 추가:', {
              emotionId: backendEmotionId,
              emotionName: emotionToUse.name
            });
            
            // 감정 기록 API 호출
            await emotionService.logEmotion(backendEmotionId, `나의 하루: ${content.substring(0, 50)}...`);
            console.log('✅ 감정 기록 추가 성공');
          } catch (emotionError) {
            console.warn('⚠️ 감정 기록 추가 실패 (게시물 작성은 성공):', emotionError);
            // 감정 기록 실패는 게시물 작성 성공에 영향을 주지 않음
          }
        }

        // 즉시 폼 초기화 (Alert 표시 전에)
        if (!isEditMode) {
          setContent('');
          setSelectedEmotion(null);
          setSelectedImages([]);
          setUploadedImageUrls([]);
        }

        setSuccessMessage(successMessage);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || `게시물 ${isEditMode ? '수정' : '작성'}에 실패했습니다.`);
      }
    } catch (error) {
      console.error(`❌ 게시물 ${isEditMode ? '수정' : '작성'} 실패:`, error);
      safeAlert('오류', error instanceof Error ? error.message : `게시물 ${isEditMode ? '수정' : '작성'} 중 오류가 발생했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [content, selectedEmotion, contentError, emotions, isEditMode, editPostId, uploadedImageUrls, isAnonymous, navigation, existingPost]);

  const handleRemoveImage = useCallback((index: number) => {
    console.log('🗑️ 이미지 제거됨:', index);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCancel = useCallback(() => {
    if (content.trim() || selectedImages.length > 0 || selectedEmotion) {
      setShowCancelModal(true);
    } else {
      navigation.goBack();
    }
  }, [content, selectedImages.length, selectedEmotion, navigation]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelModal(false);
    navigation.goBack();
  }, [navigation]);

  const handleCancelModalClose = useCallback(() => {
    setShowCancelModal(false);
  }, []);
  const handleSuccessConfirm = useCallback(async () => {
    if (!isEditMode && editPostId) {
      try {
        const now = new Date();
        const kstOffset = 9 * 60;
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const kstTime = new Date(utc + (kstOffset * 60000));
        const today = kstTime.toISOString().split('T')[0];

        await AsyncStorage.setItem('hasPostedToday', 'true');
        await AsyncStorage.setItem('todayPostDate', today);
        await AsyncStorage.setItem('todayPostId', editPostId.toString());
        console.log('✅ AsyncStorage에 오늘의 글 상태 저장 완료:', { today, postId: editPostId });
      } catch (storageError) {
        console.warn('⚠️ AsyncStorage 저장 실패:', storageError);
      }
    }

    // ref에 저장된 실제 전송된 감정 데이터 사용
    const updatedEmotionData = submittedEmotionRef.current;

    console.log('📡 homeScreenRefresh 이벤트 발행:', {
      postId: editPostId,
      updatedEmotion: updatedEmotionData,
      isEditMode
    });

    // EventEmitter로 홈 화면 새로고침 이벤트 전송 (수정된 데이터 포함)
    DeviceEventEmitter.emit('homeScreenRefresh', {
      refresh: true,
      newPostCreated: !isEditMode,
      postUpdated: isEditMode,
      postId: editPostId,
      updatedEmotion: updatedEmotionData,
      timestamp: Date.now()
    });

    setShowSuccessModal(false);
    navigation.goBack();
  }, [isEditMode, editPostId, navigation]);


  const remainingChars = MAX_CONTENT_LENGTH - content.length;
  const isFormValid = useMemo(() => {
    const hasValidContent = content.trim().length >= MIN_CONTENT_LENGTH && !contentError;
    // 수정 모드에서는 기존 감정이 있으면 새로 선택하지 않아도 됨
    const hasEmotion = selectedEmotion || (isEditMode && existingPost?.emotions?.length > 0) || (isEditMode && existingPost?.emotion_id);
    const isValid = hasValidContent && hasEmotion;
    console.log('🔍 isFormValid 계산:', { isValid, contentLength: content.trim().length, hasEmotion: !!hasEmotion, selectedEmotion: !!selectedEmotion, isEditMode, contentError });
    return isValid;
  }, [content, selectedEmotion, contentError, isEditMode, existingPost]);

  // handleSubmit의 최신 참조 유지
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // 네비게이션 제목 및 헤더 버튼 설정
  const headerBgColor = theme.bg.primary;
  const headerTextColor = theme.text.primary;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? '나의 하루 수정하기' : '나의 하루 공유하기',
      headerStyle: {
        backgroundColor: headerBgColor,
        elevation: 2,
        shadowColor: isDark ? '#fff' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.1 : 0.1,
        shadowRadius: 3
      },
      headerTintColor: '#667eea',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontFamily: 'Pretendard-Bold',
        fontSize: FONT_SIZES.base,
        color: headerTextColor
      },
      headerRight: () => (
        <Pressable
          onPress={() => handleSubmitRef.current()}
          disabled={!isFormValid || isSubmitting}
          style={{
            backgroundColor: isFormValid && !isSubmitting ? '#667eea' : 'rgba(102,126,234,0.3)',
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.xs,
            borderRadius: normalize(14, false),
            marginRight: SPACING.sm,
            shadowColor: isDark ? '#ffffff' : '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.1 : 0.15,
            shadowRadius: 3,
            elevation: 3,
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isEditMode ? '게시물 수정 완료' : '게시물 공유'}
          accessibilityState={{ disabled: !isFormValid || isSubmitting }}
          accessibilityHint={!isFormValid ? '내용과 감정을 입력해주세요' : undefined}
        >
          <Text style={{
            fontSize: FONT_SIZES.sm,
            fontWeight: '700',
            color: '#FFFFFF',
            fontFamily: 'Pretendard-Bold',
          }}>
            {isSubmitting
              ? (isEditMode ? '수정 중...' : '작성 중...')
              : (isEditMode ? '완료' : '공유')
            }
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, isEditMode, isFormValid, isSubmitting, headerBgColor, headerTextColor, isDark, FONT_SIZES.base, SPACING.md, SPACING.xs, SPACING.sm]);

  return (
    <>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.bg.primary }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: normalize(80),
          flexGrow: 1
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        enableOnAndroid={true}
        scrollEventThrottle={16}
      >


        {isLoading && isEditMode && (
          <Surface style={{
            marginHorizontal: SPACING.lg,
            marginTop: SPACING.md,
            marginBottom: SPACING.md,
            borderRadius: normalize(16),
            backgroundColor: theme.bg.card,
            elevation: 2,
            padding: SPACING.lg
          }}>
            <Center className="items-center justify-center py-8">
              <ActivityIndicator size="large" color={theme.colors?.primary || '#2563EB'} />
              <Text style={{
                fontSize: FONT_SIZES.sm,
                color: theme.text.tertiary,
                marginTop: SPACING.sm,
                fontFamily: 'Pretendard-Medium'
              }}>
                게시물 데이터를 불러오는 중...
              </Text>
            </Center>
          </Surface>
        )}

        {/* 감정 선택 */}
        <Surface style={{
          marginHorizontal: SPACING.lg,
          marginTop: SPACING.md,
          marginBottom: SPACING.xs,
          borderRadius: normalize(16),
          backgroundColor: theme.bg.card,
          elevation: 2,
          shadowColor: isDark ? '#fff' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.1 : 0.06,
          shadowRadius: 8
        }}>
          <Box style={{
            paddingHorizontal: SPACING.md,
            paddingTop: SPACING.sm,
            paddingBottom: SPACING.sm
          }}>
            <Pressable
              onPress={() => setIsEmotionSectionCollapsed(!isEmotionSectionCollapsed)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: SPACING.xs
              }}
            >
              <HStack className="items-center" style={{ flex: 1, flexShrink: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.emoji }}>😊</Text>
                <Text style={{
                  fontSize: FONT_SIZES.lg,
                  fontWeight: '700',
                  color: theme.text.primary,
                  marginLeft: SPACING.sm,
                  fontFamily: 'Pretendard-Bold',
                  lineHeight: FONT_SIZES.lg * 1.4,
                  flexShrink: 1
                }} numberOfLines={1}>
                  오늘의 감정은 어떠신가요?
                </Text>
              </HStack>

              {/* 선택된 감정 표시 (축소 상태일 때) */}
              {isEmotionSectionCollapsed && selectedEmotion && (
                <HStack className="items-center" style={{
                  marginLeft: SPACING.sm,
                  flexShrink: 0
                }}>
                  {/* 로컬 감정 이모지 표시 */}
                  {(() => {
                    const localEmotion = localEmotions.find(local => local.label === selectedEmotion.name);
                    if (localEmotion) {
                      return (
                        <Image
                          source={{ uri: getTwemojiUrl(localEmotion.emojiCode) }}
                          style={{
                            width: normalize(20, false),
                            height: normalize(20, false),
                            marginRight: SPACING.xs
                          }}
                          resizeMode="contain"
                        />
                      );
                    }
                    return null;
                  })()}
                  <Text style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: '600',
                    color: selectedEmotion.color,
                    fontFamily: 'Pretendard-SemiBold'
                  }} numberOfLines={1}>
                    {selectedEmotion.name}
                  </Text>
                </HStack>
              )}

              {/* 접기/펼치기 아이콘 */}
              <MaterialCommunityIcons
                name={isEmotionSectionCollapsed ? 'chevron-down' : 'chevron-up'}
                size={normalize(20)}
                color={theme.text.tertiary}
                style={{ marginLeft: SPACING.sm, flexShrink: 0 }}
              />
            </Pressable>

            {!isEmotionSectionCollapsed && (
              <Text style={{
                fontSize: FONT_SIZES.sm,
                color: theme.text.secondary,
                marginBottom: SPACING.xs,
                fontFamily: 'Pretendard-Medium'
              }}>
                가장 가까운 감정을 선택해주세요
              </Text>
            )}

            {/* 축소 상태일 때 안내 메시지 */}
            {isEmotionSectionCollapsed && !selectedEmotion && (
              <Text style={{
                fontSize: FONT_SIZES.xs,
                color: theme.text.tertiary,
                marginBottom: SPACING.sm,
                fontFamily: 'Pretendard-Medium'
              }}>
                감정을 선택하려면 위를 탭하세요
              </Text>
            )}
            
            {!isEmotionSectionCollapsed && (
              isLoadingEmotions ? (
                <Center className="items-center justify-center py-4">
                  <ActivityIndicator size="large" color={theme.colors?.primary || '#2563EB'} />
                  <Text style={{
                    fontSize: FONT_SIZES.sm,
                    color: theme.text.tertiary,
                    marginTop: SPACING.sm,
                    fontFamily: 'Pretendard-Medium'
                  }}>
                    감정 데이터 불러오는 중...
                  </Text>
                </Center>
              ) : (
                <Box style={{
                  paddingHorizontal: 0,
                  paddingVertical: SPACING.xs,
                  marginBottom: 0
                }}>
                  {/* 5줄 x 4열 그리드로 감정 배치 */}
                  {Array.from({ length: 5 }, (_, rowIndex) => (
                    <Box
                      key={`row-${rowIndex}`}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: normalize(6),
                        paddingHorizontal: 0,
                        gap: normalize(6)
                      }}
                    >
                      {Array.from({ length: 4 }, (_, colIndex) => {
                        const index = rowIndex * 4 + colIndex;
                        const localEmotion = localEmotions[index];
                        const emotion = localEmotion ? {
                          emotion_id: index + 1,
                          name: localEmotion.label,
                          color: localEmotion.color,
                          icon: localEmotion.emoji
                        } : null;
                        const itemWidth = (SCREEN_WIDTH - SPACING.xl * 2.5 - SPACING.sm * 3) / 4;
                    
                    return (
                      <Pressable
                        key={emotion?.emotion_id || `empty-${index}`}
                        style={{
                          width: itemWidth,
                          height: itemWidth * 0.85,
                          borderRadius: normalize(12, false),
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: emotion ? (
                            selectedEmotion?.emotion_id === emotion.emotion_id
                              ? emotion.color
                              : emotion.color + '12'
                          ) : 'transparent',
                          borderWidth: emotion ? (selectedEmotion?.emotion_id === emotion.emotion_id ? 2 : 1) : 0,
                          borderColor: emotion ? (
                            selectedEmotion?.emotion_id === emotion.emotion_id
                              ? emotion.color
                              : emotion.color + '30'
                          ) : 'transparent',
                          shadowColor: emotion && selectedEmotion?.emotion_id === emotion.emotion_id ? emotion.color : 'transparent',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: emotion && selectedEmotion?.emotion_id === emotion.emotion_id ? 3 : 1,
                          opacity: emotion ? 1 : 0,
                          paddingVertical: normalize(2, false),
                          paddingHorizontal: normalize(2, false)
                        }}
                        onPress={emotion ? () => {
                          handleEmotionSelect(emotion);
                          if (isKeyboardVisible) {
                            setIsEmotionSectionCollapsed(true);
                          }
                        } : undefined}
                        disabled={isLoading || !emotion}
                        accessible={emotion ? true : false}
                        accessibilityRole={emotion ? "button" : undefined}
                        accessibilityLabel={emotion ? `${emotion.name} 감정 선택` : undefined}
                        accessibilityState={emotion ? { selected: selectedEmotion?.emotion_id === emotion.emotion_id } : undefined}
                      >
                        {emotion && localEmotion && (
                          <Image
                            source={{ uri: getTwemojiUrl(localEmotion.emojiCode) }}
                            style={{
                              width: normalize(28, false),
                              height: normalize(28, false),
                              marginBottom: normalize(2, false)
                            }}
                            resizeMode="contain"
                          />
                        )}
                        {emotion && (
                          <Text style={{
                            fontSize: FONT_SIZES.sm,
                            fontWeight: '700',
                            color: selectedEmotion?.emotion_id === emotion.emotion_id
                              ? 'white'
                              : isDark ? '#FFFFFF' : '#111827',
                            fontFamily: 'Pretendard-Bold',
                            textAlign: 'center'
                          }}>
                            {emotion.name}
                          </Text>
                        )}
                      </Pressable>
                      );
                    })}
                    </Box>
                  ))}
                </Box>
              )
            )}
          </Box>
        </Surface>

        {/* 내용 작성 */}
        <Surface style={{
          marginHorizontal: SPACING.lg,
          marginTop: SPACING.sm,
          marginBottom: SPACING.sm,
          borderRadius: normalize(16),
          backgroundColor: theme.bg.card,
          elevation: 2,
          shadowColor: isDark ? '#fff' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.1 : 0.06,
          shadowRadius: 8
        }}>
          <Box style={{ padding: SPACING.md }}>
            <HStack className="items-center" style={{ marginBottom: SPACING.xs }}>
              <Text style={{ fontSize: FONT_SIZES.emoji }}>✍️</Text>
              <Text style={{
                fontSize: FONT_SIZES.lg,
                fontWeight: '700',
                color: theme.text.primary,
                marginLeft: SPACING.sm,
                fontFamily: 'Pretendard-Bold',
                lineHeight: FONT_SIZES.lg * 1.4
              }}>
                오늘은 어떤 하루였나요?
              </Text>
            </HStack>
            <Text style={{
              fontSize: FONT_SIZES.sm,
              color: theme.text.secondary,
              marginBottom: SPACING.sm,
              fontFamily: 'Pretendard-Medium'
            }}>
              자유롭게 작성해보세요
            </Text>

            <Box style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
              borderRadius: normalize(12, false),
              borderWidth: 2,
              borderColor: contentError ? '#ef4444' : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB'),
            }}>
              <RNTextInput
                value={content}
                onChangeText={handleContentChange}
                placeholder="오늘 하루 있었던 일, 느낀 점, 생각 등을 자유롭게 써보세요..."
                placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : theme.text.secondary}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: 'transparent',
                  minHeight: normalize(120, false),
                  textAlignVertical: 'top',
                  fontSize: FONT_SIZES.base,
                  color: theme.text.primary,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                  fontFamily: 'Pretendard-Regular',
                  lineHeight: FONT_SIZES.base * 1.5,
                  includeFontPadding: false
                }}
                selectionColor={isDark ? '#60a5fa' : '#3B82F6'}
                underlineColorAndroid="transparent"
                keyboardAppearance={isDark ? 'dark' : 'light'}
                maxLength={MAX_CONTENT_LENGTH}
                editable={!isLoading}
                accessible={true}
                accessibilityLabel="오늘의 하루 내용 입력"
                accessibilityHint="최소 10자 이상, 최대 1000자까지 입력 가능합니다"
              />
            </Box>

            <HStack className="flex-row justify-between items-center mt-3">
              <HelperText
                type="error"
                visible={!!contentError}
                style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SIZES.xs }}
              >
                {contentError}
              </HelperText>
              <Text style={{
                fontSize: FONT_SIZES.xs,
                color: remainingChars < 50 ? '#f59e0b' : theme.text.tertiary,
                fontWeight: remainingChars < 50 ? '700' : '500',
                fontFamily: remainingChars < 50 ? 'Pretendard-Bold' : 'Pretendard-Medium'
              }}>
                {content.length} / {MAX_CONTENT_LENGTH}
              </Text>
            </HStack>
          </Box>
        </Surface>

        {/* 이미지 추가 */}
        <Surface style={{
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.sm,
          borderRadius: normalize(16),
          backgroundColor: theme.bg.card,
          elevation: 2,
          shadowColor: isDark ? '#fff' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.1 : 0.06,
          shadowRadius: 8
        }}>
          <Box style={{ padding: SPACING.md }}>
            <HStack className="items-center" style={{ marginBottom: SPACING.xs }}>
              <Text style={{ fontSize: FONT_SIZES.emoji }}>📷</Text>
              <Text style={{
                fontSize: FONT_SIZES.lg,
                fontWeight: '700',
                color: theme.text.primary,
                marginLeft: SPACING.sm,
                fontFamily: 'Pretendard-Bold',
                lineHeight: FONT_SIZES.lg * 1.4
              }}>
                사진 추가 (선택사항)
              </Text>
            </HStack>
            <Text style={{
              fontSize: FONT_SIZES.sm,
              color: theme.text.secondary,
              marginBottom: SPACING.md,
              fontFamily: 'Pretendard-Medium'
            }}>
              최대 3장, 각 5MB까지 첨부 가능
            </Text>
            
            {/* 이미지 미리보기 영역 - ImageCarousel 사용 */}
            {selectedImages.length > 0 && (
              <Box style={{ marginBottom: SPACING.sm }}>
                <ImageCarousel
                  images={selectedImages.map(imageUri => {
                    if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
                      return imageUri;
                    } else if (imageUri.startsWith('http')) {
                      return imageUri;
                    } else {
                      return normalizeImageUrl(imageUri);
                    }
                  })}
                  height={normalize(160)}
                  borderRadius={normalize(12)}
                  showFullscreenButton={true}
                />

                {/* 업로드 진행 상태 표시 */}
                {isUploadingImage && (
                  <Center style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: normalize(12),
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={{
                      color: '#ffffff',
                      fontSize: FONT_SIZES.sm,
                      marginTop: SPACING.sm,
                      fontWeight: '600',
                      fontFamily: 'Pretendard-SemiBold'
                    }}>
                      업로드 중...
                    </Text>
                  </Center>
                )}

                {/* 썸네일 편집 영역 */}
                <ScrollView
                  horizontal
                  style={{ marginTop: SPACING.sm }}
                  showsHorizontalScrollIndicator={false}
                >
                  {selectedImages.map((imageUri, index) => (
                    <Box key={index} style={{ marginRight: SPACING.sm, position: 'relative' }}>
                      <Image
                        source={{
                          uri: imageUri.startsWith('file://') || imageUri.startsWith('content://') || imageUri.startsWith('http')
                            ? imageUri
                            : normalizeImageUrl(imageUri),
                          cache: 'force-cache'
                        }}
                        style={{
                          width: normalize(70),
                          height: normalize(70),
                          borderRadius: normalize(10),
                          borderWidth: 2,
                          borderColor: theme.colors?.primary || '#2563EB'
                        }}
                      />
                      <IconButton
                        icon="close-circle"
                        size={normalize(18)}
                        style={{
                          position: 'absolute',
                          top: -normalize(7),
                          right: -normalize(7),
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          borderRadius: normalize(10),
                          width: normalize(22),
                          height: normalize(22),
                          margin: 0
                        }}
                        iconColor="white"
                        onPress={() => handleRemoveImage(index)}
                        disabled={isUploadingImage}
                      />
                    </Box>
                  ))}
                </ScrollView>
              </Box>
            )}

            {/* 이미지 업로드 버튼 (3개 미만일 때 표시) */}
            {selectedImages.length < 3 && (
              <Pressable
                style={{
                  height: selectedImages.length > 0 ? normalize(60, false) : normalize(100, false),
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: isUploadingImage ? theme.text.tertiary : (theme.colors?.primary || '#2563EB'),
                  borderRadius: normalize(12, false),
                  backgroundColor: theme.bg.secondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: SPACING.sm,
                  marginTop: SPACING.md
                }}
                onPress={() => !isUploadingImage && handleImagePicker()}
                disabled={isUploadingImage}
              >
                {selectedImages.length === 0 ? (
                  <>
                    <IconButton icon="camera-plus" size={normalize(30)} iconColor={isUploadingImage ? theme.text.tertiary : (theme.colors?.primary || '#2563EB')} />
                    <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: isUploadingImage ? theme.text.tertiary : (theme.colors?.primary || '#2563EB'), marginTop: SPACING.xs, fontFamily: 'Pretendard-Bold' }}>
                      {isUploadingImage ? '업로드 중...' : '사진 추가하기 (최대 3개)'}
                    </Text>
                    <Text style={{ fontSize: FONT_SIZES.xs, color: theme.text.tertiary, marginTop: normalize(2), paddingBottom: normalize(5), textAlign: 'center', fontFamily: 'Pretendard-Medium' }}>
                      탭하여 갤러리 또는 카메라에서 선택
                    </Text>
                  </>
                ) : (
                  <HStack className="items-center">
                    <MaterialCommunityIcons name="plus-circle" size={normalize(20)} color={theme.colors?.primary || '#2563EB'} />
                    <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: theme.colors?.primary || '#2563EB', marginLeft: SPACING.xs, fontFamily: 'Pretendard-SemiBold' }}>
                      사진 추가 ({selectedImages.length}/3)
                    </Text>
                  </HStack>
                )}
              </Pressable>
            )}
          </Box>
        </Surface>

        {/* 익명 설정 */}
        <Surface style={{
          marginHorizontal: SPACING.lg,
          marginTop: SPACING.xs,
          marginBottom: normalize(20),
          borderRadius: normalize(16),
          backgroundColor: theme.bg.card,
          elevation: 2,
          shadowColor: isDark ? '#fff' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.1 : 0.06,
          shadowRadius: 8
        }}>
          <Box style={{ padding: SPACING.md }}>
            <HStack className="flex-row items-center justify-between">
              <HStack className="items-center flex-1">
                <Text style={{ fontSize: normalize(20), marginRight: SPACING.sm }}>😵‍💫</Text>
                <Box className="flex-1">
                  <Text style={{
                    fontSize: FONT_SIZES.base,
                    fontWeight: '700',
                    color: theme.text.primary,
                    fontFamily: 'Pretendard-Bold',
                    lineHeight: FONT_SIZES.base * 1.4
                  }}>
                    익명으로 작성
                  </Text>
                  <Text style={{
                    fontSize: FONT_SIZES.xs,
                    color: theme.text.tertiary,
                    fontFamily: 'Pretendard-Medium',
                    marginTop: normalize(2)
                  }}>
                    다른 사용자에게 작성자가 표시되지 않습니다
                  </Text>
                </Box>
              </HStack>
              <Button
                mode={isAnonymous ? 'contained' : 'outlined'}
                onPress={() => setIsAnonymous(!isAnonymous)}
                disabled={isLoading}
                style={{
                  backgroundColor: isAnonymous ? (theme.colors?.primary || '#2563EB') : 'transparent',
                  borderColor: isAnonymous ? (theme.colors?.primary || '#2563EB') : theme.text.tertiary,
                  borderWidth: 2,
                  borderRadius: normalize(16, false),
                  minWidth: normalize(80, false),
                  elevation: isAnonymous ? 2 : 0
                }}
                labelStyle={{
                  color: isAnonymous ? 'white' : theme.text.tertiary,
                  fontWeight: '700',
                  fontSize: FONT_SIZES.xs,
                  fontFamily: 'Pretendard-Bold'
                }}
              >
                {isAnonymous ? '✓ 익명' : '익명 OFF'}
              </Button>
            </HStack>
          </Box>
        </Surface>
      </ScrollView>

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
        title="성공"
        message={successMessage}
        type="success"
        singleButton={true}
        onConfirm={handleSuccessConfirm}
      />
    </KeyboardAvoidingView>

    <Modal
      visible={showImagePickerModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowImagePickerModal(false)}
      statusBarTranslucent={true}
    >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={() => setShowImagePickerModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.bg.card,
              borderRadius: normalize(16, false),
              padding: SPACING.xxl,
              margin: SPACING.xl,
              width: SCREEN_WIDTH - normalize(40, false),
              maxWidth: normalize(300, false),
              shadowColor: isDark ? '#fff' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.2 : 0.3,
              shadowRadius: 8,
              elevation: 5
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{
              fontSize: FONT_SIZES.lg,
              fontWeight: '700',
              color: theme.text.primary,
              textAlign: 'center',
              marginBottom: SPACING.sm,
              fontFamily: 'Pretendard-Bold',
              lineHeight: FONT_SIZES.lg * 1.4
            }}>
              이미지 선택
            </Text>

            <Text style={{
              fontSize: FONT_SIZES.sm,
              color: theme.text.tertiary,
              textAlign: 'center',
              marginBottom: SPACING.xxl,
              fontFamily: 'Pretendard-Medium'
            }}>
              이미지를 어떻게 선택하시겠습니까?
            </Text>

            <VStack style={{ gap: SPACING.md }}>
              <Pressable
                style={{
                  backgroundColor: theme.colors?.primary || '#2563EB',
                  paddingVertical: SPACING.md,
                  paddingHorizontal: SPACING.xl,
                  borderRadius: normalize(12, false),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onPress={() => {
                  setShowImagePickerModal(false);
                  selectImageFromGallery();
                }}
              >
                <MaterialCommunityIcons name="image" size={normalize(20, false)} color="white" style={{ marginRight: SPACING.sm }} />
                <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '600', color: 'white', fontFamily: 'Pretendard-SemiBold' }}>
                  갤러리
                </Text>
              </Pressable>

              <Pressable
                style={{
                  backgroundColor: '#10B981',
                  paddingVertical: SPACING.md,
                  paddingHorizontal: SPACING.xl,
                  borderRadius: normalize(12, false),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onPress={() => {
                  setShowImagePickerModal(false);
                  setTimeout(() => selectImageFromCamera(), 100);
                }}
              >
                <MaterialCommunityIcons name="camera" size={normalize(20, false)} color="white" style={{ marginRight: SPACING.sm }} />
                <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '600', color: 'white', fontFamily: 'Pretendard-SemiBold' }}>
                  카메라
                </Text>
              </Pressable>

              <Pressable
                style={{
                  backgroundColor: theme.bg.secondary,
                  paddingVertical: SPACING.md,
                  paddingHorizontal: SPACING.xl,
                  borderRadius: normalize(12, false),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onPress={() => setShowImagePickerModal(false)}
              >
                <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '600', color: theme.text.secondary, fontFamily: 'Pretendard-SemiBold' }}>
                  취소
                </Text>
              </Pressable>
            </VStack>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};


export default WriteMyDayScreen;