// src/screens/ProfileEditScreen.tsx
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { sanitizeText } from '../utils/sanitize';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput as RNTextInput,
  Platform,
  InteractionManager,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/api/userService';
import uploadService from '../services/api/uploadService';
import { invalidateImageCache, normalizeImageUrl } from '../utils/imageUtils';
import FastImage from 'react-native-fast-image';
import { showAlert } from '../contexts/AlertContext';
import { FONT_SIZES } from '../constants';

interface ProfileData {
  nickname: string;
  favorite_quote: string;
  profile_image_url?: string;
}

interface ProfileEditScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
    setOptions: (options: any) => void;
  };
}

const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const { theme, isDark } = useModernTheme();
  const { width: screenWidth } = useWindowDimensions();

  // 🔥 반응형 스케일 (동적)
  const scale = useMemo(() => {
    const BASE_WIDTH = 360;
    return Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.3);
  }, [screenWidth]);

  const [loading, setLoading] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    nickname: user?.nickname || '',
    favorite_quote: '',
    profile_image_url: '',
  });

  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const profileImageScale = useRef(new Animated.Value(1)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 네비게이션 기본 헤더 숨기기
    navigation.setOptions({
      headerShown: false,
    });
    loadProfileData();

    // 화면 진입 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 버튼 프레스 애니메이션
  const animateButtonPress = (animValue: Animated.Value, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animValue, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => callback && callback());
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      if (response.status === 'success' && response.data) {
        setProfileData({
          nickname: response.data.nickname || profileData.nickname,
          favorite_quote: response.data.favorite_quote || profileData.favorite_quote,
          profile_image_url: response.data.profile_image_url || '',
        });
        setImageLoadError(false);
        console.log('프로필 데이터 로드 성공:', {
          nickname: response.data.nickname,
          profile_image_url: response.data.profile_image_url
        });
      }
    } catch (error) {
      console.error('프로필 데이터 로드 오류:', error);
      showAlert.error('오류', '프로필 정보를 불러오는 중 오류가 발생했습니다.');
    } finally{
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
        includeBase64: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        showAlert.error('오류', '이미지 선택 중 오류가 발생했습니다.');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];

        // 이미지 리사이징 및 압축 (트래픽 70-80% 절감)
        const resizedImage = await ImageResizer.createResizedImage(
          asset.uri || '',
          1024, // 최대 너비
          1024, // 최대 높이
          'JPEG',
          80, // 품질 80%
          0, // 회전
          undefined,
          false,
          { mode: 'contain' }
        );

        const file = {
          uri: resizedImage.uri,
          type: 'image/jpeg',
          name: asset.fileName || `profile_${Date.now()}.jpg`,
        } as any;

        const response = await uploadService.uploadProfileImage(file);
        let profileImageUrl =
          response.data?.data?.url ||
          response.data?.url ||
          response.data?.data?.image_url ||
          response.data?.image_url;

        if (!profileImageUrl) {
          showAlert.error('오류', '응답에서 이미지 URL을 찾을 수 없습니다.');
          return;
        }

        if (profileData.profile_image_url) {
          invalidateImageCache(profileData.profile_image_url);
        }

        await userService.updateProfile({ profile_image_url: profileImageUrl });

        setProfileData(prev => ({
          ...prev,
          profile_image_url: profileImageUrl
        }));
        setImageLoadError(false);
        setImageKey(prev => prev + 1);

        if (user) {
          updateUser({
            ...user,
            profile_image_url: profileImageUrl
          });
        }

        showAlert.success('성공', '프로필 이미지가 업데이트되었습니다.');
      }
    } catch (error: any) {
      console.error('프로필 이미지 업로드 오류:', error);
      showAlert.error('오류', error?.message || '이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveProfileImage = () => {
    showAlert.show(
      '프로필 이미지 삭제',
      '프로필 이미지를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              if (profileData.profile_image_url) {
                invalidateImageCache(profileData.profile_image_url);
              }

              await uploadService.deleteProfileImage();

              setProfileData(prev => ({
                ...prev,
                profile_image_url: ''
              }));
              setImageKey(prev => prev + 1);

              if (user) {
                updateUser({
                  ...user,
                  profile_image_url: ''
                });
              }

              await loadProfileData();
              showAlert.success('성공', '프로필 이미지가 삭제되었습니다.');
            } catch (error: any) {
              showAlert.error('오류', error?.message || '프로필 이미지 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ],
      'warning'
    );
  };

  const handleSave = async () => {
    // 🔒 보안: 입력 검증 & Sanitize
    const sanitizedNickname = sanitizeText(profileData.nickname.trim(), 50);
    const sanitizedQuote = sanitizeText(profileData.favorite_quote.trim(), 200);

    if (!sanitizedNickname || sanitizedNickname.length === 0) {
      showAlert.error('오류', '닉네임을 입력해주세요.');
      return;
    }

    if (sanitizedNickname.length < 2) {
      showAlert.error('오류', '닉네임은 2자 이상이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      await userService.updateProfile({
        nickname: sanitizedNickname,
        favorite_quote: sanitizedQuote,
      });

      if (user) {
        updateUser({
          ...user,
          nickname: sanitizedNickname,
          favorite_quote: sanitizedQuote,
        });
      }

      showAlert.success('성공', '프로필이 성공적으로 업데이트되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            setTimeout(() => {
              navigation.goBack();
            }, 100);
          }
        }
      ]);
    } catch (error: any) {
      showAlert.error('오류', error?.message || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (profileData.nickname) return profileData.nickname[0].toUpperCase();
    if (user?.username) return user.username[0].toUpperCase();
    return 'U';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
      {/* 헤더 */}
      <View
        style={[styles.header, { backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>프로필 편집</Text>
        <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => animateButtonPress(saveButtonScale, handleSave)}
            disabled={loading}
            accessibilityLabel="프로필 저장"
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.background }, loading && styles.saveButtonTextDisabled]}>
              {loading ? '저장 중...' : '완료'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: theme.bg.secondary,
        }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 프로필 이미지 섹션 */}
        <View style={[styles.profileImageSection, { backgroundColor: theme.colors.surface }]}>
          <Animated.View
            style={[
              styles.profileImageContainer,
              { transform: [{ scale: profileImageScale }] }
            ]}
            key={imageKey}
          >
            {profileData.profile_image_url && !imageLoadError ? (
              <FastImage
                source={{
                  uri: normalizeImageUrl(profileData.profile_image_url),
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.web,
                }}
                style={styles.profileImage}
                resizeMode={FastImage.resizeMode.cover}
                onError={(error) => {
                  console.log('이미지 로딩 실패:', {
                    원본URL: profileData.profile_image_url,
                    변환URL: normalizeImageUrl(profileData.profile_image_url),
                    재시도횟수: retryCount
                  });
                  
                  if (retryCount < 3) {
                    setTimeout(() => {
                      console.log('🔄 이미지 로딩 재시도:', retryCount + 1);
                      setRetryCount(prev => prev + 1);
                      setImageKey(prev => prev + 1);
                    }, 1000 * (retryCount + 1));
                  } else {
                    console.error('❌ 이미지 로딩 최종 실패');
                    setImageLoadError(true);
                  }
                }}
                onLoad={() => {
                  console.log('이미지 로딩 성공:', {
                    원본URL: profileData.profile_image_url,
                    변환URL: normalizeImageUrl(profileData.profile_image_url)
                  });
                  setImageLoadError(false);
                  setRetryCount(0);
                }}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.profileImagePlaceholderText, { color: theme.colors.background }]}>{getInitials()}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.cameraButton, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}
              onPress={handleImagePicker}
              activeOpacity={0.8}
            >
              <Icon name="camera" size={18} color={theme.colors.background} />
            </TouchableOpacity>

            {profileData.profile_image_url && !imageLoadError && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.colors.error, borderColor: theme.colors.surface }]}
                onPress={handleRemoveProfileImage}
                activeOpacity={0.8}
              >
                <Icon name="trash" size={18} color={theme.colors.background} />
              </TouchableOpacity>
            )}
          </Animated.View>

          <Text style={[styles.profileImageHint, { color: theme.colors.text.secondary }]}>
            프로필 사진을 {profileData.profile_image_url && !imageLoadError ? '변경하거나 삭제' : '추가'}하세요
          </Text>
        </View>

        {/* 기본 정보 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>기본 정보</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            {/* 이메일 */}
            <View style={styles.inputItem}>
              <View style={styles.inputIconContainer}>
                <Icon name="mail-outline" size={22} color={theme.colors.text.secondary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>이메일</Text>
                <Text style={[styles.inputDisabled, { color: theme.colors.text.tertiary }]}>{user?.email || ''}</Text>
              </View>
              <Icon name="lock-closed" size={18} color={theme.colors.text.tertiary} />
            </View>

            {/* 닉네임 */}
            <View style={[styles.inputItem, styles.inputItemBorder, { borderTopColor: theme.colors.border, borderBottomColor: theme.colors.border }]}>
              <View style={styles.inputIconContainer}>
                <Icon name="person-outline" size={22} color={theme.colors.text.secondary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>닉네임</Text>
                <RNTextInput
                  style={[styles.textInput, { backgroundColor: theme.bg.secondary, color: theme.colors.text.primary }]}
                  value={profileData.nickname}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, nickname: text }))}
                  placeholder="닉네임을 입력하세요"
                  placeholderTextColor={theme.colors.text.tertiary}
                  editable={!loading}
                />
              </View>
            </View>

            {/* 명언 */}
            <View style={styles.inputItem}>
              <View style={styles.inputIconContainer}>
                <Icon name="chatbox-ellipses-outline" size={22} color={theme.colors.text.secondary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>좋아하는 명언</Text>
                <RNTextInput
                  style={[styles.textInput, styles.textInputMultiline, { backgroundColor: theme.bg.secondary, color: theme.colors.text.primary }]}
                  value={profileData.favorite_quote}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, favorite_quote: text }))}
                  placeholder="나를 표현하는 명언이나 좌우명을 입력하세요"
                  placeholderTextColor={theme.colors.text.tertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
            </View>
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
};


// 🔥 scale을 고정값으로 설정 (styles에서 사용, 반응형은 컴포넌트 내부 scale 사용)
const scale = 1.0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16 * scale,
    paddingVertical: 12 * scale,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + (12 * scale) : 52 * scale,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 * scale },
        shadowOpacity: 0.08,
        shadowRadius: 4 * scale,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: FONT_SIZES.h3 * scale,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 18 * scale * 1.3,
  },
  saveButton: {
    padding: 8 * scale,
    paddingHorizontal: 16 * scale,
    backgroundColor: 'transparent',
    borderRadius: 20 * scale,
    minWidth: 60 * scale,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40 * scale,
  },
  profileImageSection: {
    paddingVertical: 32 * scale,
    alignItems: 'center',
    marginBottom: 16 * scale,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 * scale },
        shadowOpacity: 0.04,
        shadowRadius: 4 * scale,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12 * scale,
  },
  profileImage: {
    width: 100 * scale,
    height: 100 * scale,
    borderRadius: 50 * scale,
    borderWidth: 3 * scale,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 * scale },
        shadowOpacity: 0.08,
        shadowRadius: 4 * scale,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileImagePlaceholder: {
    width: 100 * scale,
    height: 100 * scale,
    borderRadius: 50 * scale,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3 * scale,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 * scale },
        shadowOpacity: 0.08,
        shadowRadius: 4 * scale,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileImagePlaceholderText: {
    fontSize: 36,
    fontWeight: '600',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36 * scale,
    height: 36 * scale,
    borderRadius: 18 * scale,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2 * scale,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 * scale },
        shadowOpacity: 0.12,
        shadowRadius: 3 * scale,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  deleteButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 36 * scale,
    height: 36 * scale,
    borderRadius: 18 * scale,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2 * scale,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 * scale },
        shadowOpacity: 0.12,
        shadowRadius: 3 * scale,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileImageHint: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 20 * scale,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '700',
    marginLeft: 20 * scale,
    marginBottom: 10 * scale,
    letterSpacing: 0.3,
  },
  sectionCard: {
    marginHorizontal: 20 * scale,
    borderRadius: 16 * scale,
    borderWidth: 0,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 * scale },
        shadowOpacity: 0.06,
        shadowRadius: 4 * scale,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16 * scale,
    paddingVertical: 16 * scale,
  },
  inputItemBorder: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  inputIconContainer: {
    marginRight: 12 * scale,
    marginTop: 2 * scale,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
    marginBottom: 6 * scale,
    letterSpacing: 0.2,
  },
  inputDisabled: {
    fontSize: FONT_SIZES.body,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  textInput: {
    fontSize: FONT_SIZES.body,
    fontWeight: '400',
    padding: 10 * scale,
    letterSpacing: 0.2,
    minHeight: 40 * scale,
    borderRadius: 10 * scale,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textInputMultiline: {
    minHeight: 90 * scale,
    textAlignVertical: 'top',
    paddingTop: 10 * scale,
  },
});

export default ProfileEditScreen;
