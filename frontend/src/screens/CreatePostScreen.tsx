// src/screens/CreatePostScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Vibration,
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
  Surface
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { Box, Text, VStack, HStack } from '../components/ui';
import postService from '../services/api/postService';
import { FONT_SIZES } from '../constants';
import { sanitizeText, validatePostContent } from '../utils/textSanitization';

// 감정 옵션 - 친근한 Inside Out 스타일 감정들
const EMOTION_OPTIONS = [
  { id: 1, label: '기쁨이', icon: 'emoticon-happy', color: '#FFD700' },
  { id: 2, label: '행복이', icon: 'emoticon-excited', color: '#FFA500' },
  { id: 3, label: '슬픔이', icon: 'emoticon-sad', color: '#4682B4' },
  { id: 4, label: '우울이', icon: 'emoticon-neutral', color: '#708090' },
  { id: 5, label: '지루미', icon: 'emoticon-dead', color: '#A9A9A9' },
  { id: 6, label: '버럭이', icon: 'emoticon-angry', color: '#FF4500' },
  { id: 7, label: '불안이', icon: 'emoticon-confused', color: '#DDA0DD' },
  { id: 8, label: '걱정이', icon: 'emoticon-frown', color: '#FFA07A' },
  { id: 9, label: '감동이', icon: 'heart', color: '#FF6347' },
  { id: 10, label: '황당이', icon: 'emoticon-wink', color: '#20B2AA' },
  { id: 11, label: '당황이', icon: 'emoticon-tongue', color: '#FF8C00' },
  { id: 12, label: '짜증이', icon: 'emoticon-devil', color: '#DC143C' },
  { id: 13, label: '무섭이', icon: 'emoticon-cry', color: '#9370DB' },
  { id: 14, label: '추억이', icon: 'emoticon-cool', color: '#87CEEB' },
  { id: 15, label: '설렘이', icon: 'heart-multiple', color: '#FF69B4' },
  { id: 16, label: '편안이', icon: 'emoticon-kiss', color: '#98FB98' },
  { id: 17, label: '궁금이', icon: 'emoticon-outline', color: '#DAA520' }
];

interface CreatePostScreenProps {
  navigation: {
    goBack: () => void;
    setOptions: (options: any) => void;
  };
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme, isDark } = useModernTheme();

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  const [content, setContent] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<number[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  // 애니메이션 refs
  const toastSlideAnim = useRef(new Animated.Value(-100)).current;
  const toastOpacityAnim = useRef(new Animated.Value(0)).current;
  const checkIconScaleAnim = useRef(new Animated.Value(0)).current;
  const heartPulseAnim = useRef(new Animated.Value(1)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    navigation.setOptions({
      title: '새 게시물 작성',
      headerLeft: () => (
        <IconButton
          icon="close"
          onPress={() => navigation.goBack()}
        />
      ),
      headerRight: () => (
        <Button
          mode="text"
          onPress={handleSubmit}
          disabled={!content.trim() || selectedEmotions.length === 0 || isSubmitting}
          loading={isSubmitting}
        >
          게시
        </Button>
      ),
    });
  }, [navigation, content, selectedEmotions, isSubmitting]);

  const handleEmotionToggle = (emotionId: number) => {
    setSelectedEmotions(prev => 
      prev.includes(emotionId)
        ? prev.filter(id => id !== emotionId)
        : [...prev, emotionId]
    );
  };

  // 성공 토스트 애니메이션 시작
  const showSuccessAnimation = () => {
    // Haptic feedback (진동) - 에러 처리 추가
    try {
      if (Platform.OS === 'ios') {
        // iOS에서는 더 부드러운 햅틱 피드백 사용 (가능하다면)
        Vibration.vibrate([0, 100, 50, 100]);
      } else {
        Vibration.vibrate(200);
      }
    } catch (error) {
      if (__DEV__) console.warn('진동 기능을 사용할 수 없습니다:', error);
    }

    setShowSuccessToast(true);
    
    // 토스트 슬라이드인 + 페이드인
    Animated.parallel([
      Animated.timing(toastSlideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();

    // 체크 아이콘 스케일 애니메이션 (지연 후 시작)
    setTimeout(() => {
      Animated.spring(checkIconScaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 200);

    // 하트 펄스 애니메이션
    const heartPulse = () => {
      Animated.sequence([
        Animated.timing(heartPulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heartPulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    };

    setTimeout(heartPulse, 400);
    setTimeout(heartPulse, 1200); // 두 번째 펄스

    // 진행 바 애니메이션 (2.5초 동안 천천히 진행)
    setTimeout(() => {
      Animated.timing(progressBarAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: false, // width 애니메이션이므로 false
      }).start();
    }, 100);
  };

  // 토스트 숨김 애니메이션
  const hideSuccessAnimation = () => {
    Animated.parallel([
      Animated.timing(toastSlideAnim, {
        toValue: -100,
        duration: 400,
        easing: Easing.in(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowSuccessToast(false);
      // 애니메이션 값 리셋
      toastSlideAnim.setValue(-100);
      toastOpacityAnim.setValue(0);
      checkIconScaleAnim.setValue(0);
      heartPulseAnim.setValue(1);
      progressBarAnim.setValue(0);
    });
  };

  const handleSubmit = async () => {
    // XSS 방어: 입력 검증
    const validation = validatePostContent(content);
    if (!validation.valid) {
      Alert.alert('알림', validation.error);
      return;
    }

    if (selectedEmotions.length === 0) {
      Alert.alert('알림', '감정을 하나 이상 선택해주세요.');
      return;
    }

    if (content.length < 10) {
      Alert.alert('알림', '게시물 내용은 10자 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // XSS 방어: 텍스트 정제
      const sanitizedContent = sanitizeText(content.trim());

      const postData = {
        content: sanitizedContent,
        emotion_ids: selectedEmotions,
        is_anonymous: isAnonymous
      };

      if (__DEV__) console.log('🚀 게시물 작성 요청:', postData);
      const response = await postService.createPost(postData);
      
      if (response.status === 'success') {
        // 애니메이션과 함께 성공 토스트 표시
        showSuccessAnimation();
        
        // 2.5초 후 숨김 애니메이션 시작
        setTimeout(() => {
          hideSuccessAnimation();
        }, 2500);
        
        // 3초 후 화면 이동
        setTimeout(() => {
          setIsSubmitting(false);
          // MyDayScreen으로 돌아가면서 새로고침 트리거
          // useFocusEffect가 자동으로 새 게시물을 로드함
          navigation.goBack();
        }, 3000);
      } else {
        throw new Error(response.message || '게시물 작성에 실패했습니다.');
      }
      
    } catch (error: unknown) {
      if (__DEV__) console.error('게시물 작성 오류:', error);
      setIsSubmitting(false);
      Alert.alert(
        '오류',
        error.response?.data?.message || error.message || '게시물 작성 중 오류가 발생했습니다.'
      );
    }
  };

  const getSelectedEmotionLabel = () => {
    if (selectedEmotions.length === 0) return '';
    if (selectedEmotions.length === 1) {
      const emotion = EMOTION_OPTIONS.find(e => e.id === selectedEmotions[0]);
      return emotion?.label || '';
    }
    return `${selectedEmotions.length}개 감정 선택됨`;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg.secondary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={{ flex: 1, padding: 16 }} keyboardShouldPersistTaps="handled">
        {/* 감정 선택 섹션 */}
        <Card style={{ marginBottom: 16, backgroundColor: theme.bg.card, shadowColor: isDark ? '#fff' : '#000', shadowOpacity: isDark ? 0.1 : 0.2 }}>
          <Card.Title
            title="오늘의 감정을 선택해주세요"
            titleStyle={{ color: theme.text.primary }}
            subtitle="여러 개 선택 가능합니다"
            subtitleStyle={{ color: theme.text.secondary }}
            left={(props: any) => <MaterialCommunityIcons name="emoticon-happy" size={24} color="#4a0e4e" />}
          />
          <Card.Content>
            <HStack className="flex-wrap gap-2 mb-4">
              {EMOTION_OPTIONS.map((emotion) => (
                <Chip
                  key={emotion.id}
                  mode={selectedEmotions.includes(emotion.id) ? 'flat' : 'outlined'}
                  selected={selectedEmotions.includes(emotion.id)}
                  onPress={() => handleEmotionToggle(emotion.id)}
                  style={[
                    { marginBottom: 8 },
                    selectedEmotions.includes(emotion.id) && {
                      backgroundColor: emotion.color + '40'
                    }
                  ]}
                  textStyle={{
                    color: selectedEmotions.includes(emotion.id) ? emotion.color : '#666'
                  }}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={emotion.icon}
                      size={16}
                      color={selectedEmotions.includes(emotion.id) ? emotion.color : '#666'}
                    />
                  )}
                >
                  {emotion.label}
                </Chip>
              ))}
            </HStack>
            
            {selectedEmotions.length > 0 && (
              <Surface style={{ padding: 12, borderRadius: 12, backgroundColor: isDark ? theme.bg.secondary : '#f3e8ff' }}>
                <Text style={{ fontSize: FONT_SIZES.bodySmall, color: isDark ? theme.text.primary : '#6b21a8', fontFamily: 'Pretendard-Medium' }}>
                  선택된 감정: {getSelectedEmotionLabel()}
                </Text>
              </Surface>
            )}
          </Card.Content>
        </Card>

        {/* 게시물 내용 작성 섹션 */}
        <Card style={{ marginBottom: 16, backgroundColor: theme.bg.card, shadowColor: isDark ? '#fff' : '#000', shadowOpacity: isDark ? 0.1 : 0.2 }}>
          <Card.Title
            title="나의 하루를 공유해주세요"
            titleStyle={{ color: theme.text.primary }}
            left={(props: any) => <MaterialCommunityIcons name="pencil" size={24} color="#4a0e4e" />}
          />
          <Card.Content>
            <TextInput
              mode="outlined"
              placeholder="오늘 하루는 어땠나요? 솔직한 마음을 들려주세요... (10자 이상 1000자 이하)"
              placeholderTextColor={theme.text.tertiary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              style={{ minHeight: 120, backgroundColor: theme.bg.primary, textAlignVertical: 'top', color: theme.text.primary }}
              maxLength={1000}
              testID="post-content-input"
              outlineColor={theme.bg.border}
              activeOutlineColor={isDark ? '#8b5cf6' : '#6b21a8'}
            />
            <HStack style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <Text style={{ fontSize: FONT_SIZES.small, color: theme.text.secondary }}>
                {content.length}/1000{content.length < 10 ? ' (최소 10자)' : ''}
              </Text>
            </HStack>
          </Card.Content>
        </Card>

        {/* 설정 섹션 */}
        <Card style={{ marginBottom: 16, backgroundColor: theme.bg.card, shadowColor: isDark ? '#fff' : '#000', shadowOpacity: isDark ? 0.1 : 0.2 }}>
          <Card.Title
            title="게시 설정"
            titleStyle={{ color: theme.text.primary }}
            left={(props: any) => <MaterialCommunityIcons name="cog" size={24} color="#4a0e4e" />}
          />
          <Card.Content>
            <HStack style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <VStack style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ fontSize: FONT_SIZES.bodyLarge, fontFamily: 'Pretendard-Medium', color: theme.text.primary, marginBottom: 4 }}>익명으로 게시</Text>
                <Text style={{ fontSize: FONT_SIZES.bodySmall, color: theme.text.secondary, lineHeight: 16 }}>
                  닉네임 대신 '익명'으로 표시됩니다
                </Text>
              </VStack>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                color="#4a0e4e"
              />
            </HStack>

            <HStack style={{ alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.bg.border }}>
              <Text style={{ fontSize: FONT_SIZES.bodySmall, color: theme.text.secondary, marginRight: 8 }}>게시자 표시:</Text>
              <Text style={{ fontSize: FONT_SIZES.bodySmall, fontFamily: 'Pretendard-Medium', color: isDark ? '#a78bfa' : '#6b21a8' }}>
                {isAnonymous ? '익명' : (user?.nickname || user?.username || '사용자')}
              </Text>
            </HStack>
          </Card.Content>
        </Card>

        {/* 미리보기 섹션 */}
        {content.length >= 10 && selectedEmotions.length > 0 && (
          <Card style={{ marginBottom: 16, backgroundColor: theme.bg.card, shadowColor: isDark ? '#fff' : '#000', shadowOpacity: isDark ? 0.1 : 0.2 }}>
            <Card.Title
              title="미리보기"
              titleStyle={{ color: theme.text.primary }}
              left={(props: any) => <MaterialCommunityIcons name="eye" size={24} color="#4a0e4e" />}
            />
            <Card.Content>
              <HStack style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: FONT_SIZES.bodySmall, fontFamily: 'Pretendard-Medium', color: isDark ? '#a78bfa' : '#6b21a8' }}>
                  {isAnonymous ? '익명' : (user?.nickname || user?.username || '사용자')}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.small, color: theme.text.secondary }}>
                  {new Date().toLocaleDateString()}
                </Text>
              </HStack>

              <HStack style={{ flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {selectedEmotions.map(emotionId => {
                  const emotion = EMOTION_OPTIONS.find(e => e.id === emotionId);
                  if (!emotion) return null;
                  // 밝은 색상 체크
                  const isLightColor = (hexColor: string) => {
                    const hex = hexColor.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    return brightness > 180;
                  };
                  const emotionColor = emotion.color || '#666666';
                  const textColor = isLightColor(emotionColor) ? '#333333' : emotionColor;
                  return (
                    <Chip
                      key={emotion.id}
                      style={[{ height: 24, backgroundColor: emotionColor + '25', borderWidth: 1, borderColor: emotionColor + '50' }]}
                      textStyle={{ color: textColor, fontFamily: 'Pretendard-SemiBold' }}
                    >
                      {emotion.label}
                    </Chip>
                  );
                })}
              </HStack>

              <Text style={{ fontSize: FONT_SIZES.bodySmall, lineHeight: 20, color: theme.text.primary }}>{content}</Text>
            </Card.Content>
          </Card>
        )}

        <Box className="h-8" />
      </ScrollView>

      {/* 로딩 오버레이 */}
      {isSubmitting && !showSuccessToast && (
        <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <Surface style={{ backgroundColor: theme.bg.card, padding: 24, borderRadius: 16, alignItems: 'center', minWidth: 200 }}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={{ marginTop: 12, fontSize: FONT_SIZES.bodySmall, color: theme.text.secondary, textAlign: 'center' }}>게시물을 작성하고 있습니다...</Text>
          </Surface>
        </Box>
      )}

      {/* 성공 토스트 - 최적화된 애니메이션 디자인 */}
      {showSuccessToast && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 60 : 80,
            left: 16,
            right: 16,
            zIndex: 1000,
            transform: [{ translateY: toastSlideAnim }],
            opacity: toastOpacityAnim,
          }}
        >
          <Surface
            style={{
              backgroundColor: theme.bg.card,
              borderRadius: 20,
              padding: 24,
              shadowColor: isDark ? '#fff' : '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.1 : 0.2,
              shadowRadius: 16,
              elevation: 12,
              borderWidth: 1,
              borderColor: theme.bg.border,
            }}
          >
            {/* 상단 장식 라인 */}
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)',
                backgroundColor: '#10b981', // fallback
              }}
            />
            
            <HStack style={{ alignItems: 'center' }}>
              {/* 체크 아이콘 - 스케일 애니메이션 */}
              <Animated.View
                style={{
                  transform: [{ scale: checkIconScaleAnim }],
                }}
              >
                <Box
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#10b981',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <MaterialCommunityIcons name="check" size={28} color={colors.text} />
                </Box>
              </Animated.View>
              
              <VStack style={{ flex: 1 }}>
                <Text style={{
                  fontSize: FONT_SIZES.h3,
                  fontFamily: 'Pretendard-Bold',
                  color: theme.text.primary,
                  marginBottom: 6,
                  letterSpacing: 0.3,
                }}>
                  🎉 게시 완료!
                </Text>
                <Text style={{
                  fontSize: FONT_SIZES.body,
                  color: theme.text.secondary,
                  lineHeight: 22,
                  letterSpacing: 0.2,
                }}>
                  나의 하루가 성공적으로 공유되었습니다
                </Text>
                <Text style={{
                  fontSize: FONT_SIZES.caption,
                  color: theme.text.tertiary,
                  marginTop: 4,
                  fontStyle: 'italic',
                }}>
                  잠시 후 목록에서 확인하세요 ✨
                </Text>
              </VStack>
              
              {/* 하트 아이콘 - 펄스 애니메이션 */}
              <Animated.View
                style={{
                  transform: [{ scale: heartPulseAnim }],
                }}
              >
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#fef2f2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#fecaca',
                  }}
                >
                  <MaterialCommunityIcons name="heart" size={20} color="#ef4444" />
                </Box>
              </Animated.View>
            </HStack>
            
            {/* 하단 진행 바 - 타이머 표시 */}
            <Box
              style={{
                marginTop: 16,
                height: 3,
                backgroundColor: isDark ? theme.bg.secondary : '#f3f4f6',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  height: '100%',
                  backgroundColor: '#10b981',
                  borderRadius: 2,
                  width: progressBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            </Box>
          </Surface>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};


export default CreatePostScreen;