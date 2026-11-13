// src/screens/ProfileEditScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import userService from '../services/api/userService';
import uploadService from '../services/api/uploadService';
import { showAlert } from '../contexts/AlertContext';
import { sanitizeText } from '../utils/sanitize';
import { launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { normalizeImageUrl, invalidateImageCache } from '../utils/imageUtils';
import { FONT_SIZES } from '../constants';

interface ProfileEditScreenProps {
  navigation: {
    goBack: () => void;
    setOptions: (options: any) => void;
  };
}

const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { theme, isDark } = useModernTheme();

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [favoriteQuote, setFavoriteQuote] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      if (response.status === 'success' && response.data) {
        setNickname(response.data.nickname || '');
        setFavoriteQuote(response.data.favorite_quote || '');
        setProfileImageUrl(response.data.profile_image_url || '');
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel || !result.assets?.[0]) return;

      setImageLoading(true);
      const asset = result.assets[0];

      const resizedImage = await ImageResizer.createResizedImage(
        asset.uri || '',
        1024, 1024, 'JPEG', 80, 0, undefined, false, { mode: 'contain' }
      );

      const file = {
        uri: resizedImage.uri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      } as any;

      const response = await uploadService.uploadProfileImage(file);
      const imageUrl = response.data?.data?.url || response.data?.url || response.data?.data?.image_url;

      if (imageUrl) {
        if (profileImageUrl) invalidateImageCache(profileImageUrl);
        await userService.updateProfile({ profile_image_url: imageUrl });
        setProfileImageUrl(imageUrl);
        setImageError(false);
        if (user) updateUser({ ...user, profile_image_url: imageUrl });
        showAlert.success('성공', '프로필 이미지가 업데이트되었습니다.');
      }
    } catch (error: any) {
      showAlert.error('오류', error?.message || '이미지 업로드 실패');
    } finally {
      setImageLoading(false);
    }
  };

  const handleRemoveImage = () => {
    showAlert.show('프로필 이미지 삭제', '프로필 이미지를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            setImageLoading(true);
            if (profileImageUrl) invalidateImageCache(profileImageUrl);
            await uploadService.deleteProfileImage();
            setProfileImageUrl('');
            if (user) updateUser({ ...user, profile_image_url: '' });
            showAlert.success('성공', '프로필 이미지가 삭제되었습니다.');
          } catch (error: any) {
            showAlert.error('오류', error?.message || '이미지 삭제 실패');
          } finally {
            setImageLoading(false);
          }
        }
      }
    ], 'warning');
  };

  const handleSave = async () => {
    const sanitizedNickname = sanitizeText(nickname.trim(), 50);
    if (!sanitizedNickname || sanitizedNickname.length < 2) {
      showAlert.error('오류', '닉네임은 2자 이상이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      await userService.updateProfile({
        nickname: sanitizedNickname,
        favorite_quote: sanitizeText(favoriteQuote.trim(), 200),
      });

      if (user) {
        updateUser({ ...user, nickname: sanitizedNickname, favorite_quote: favoriteQuote });
      }

      showAlert.success('성공', '프로필이 업데이트되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      showAlert.error('오류', error?.message || '프로필 업데이트 실패');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (nickname) return nickname[0].toUpperCase();
    if (user?.username) return user.username[0].toUpperCase();
    return 'U';
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.colors?.background || '#fff', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme?.colors?.primary || '#6366F1'} />
      </View>
    );
  }

  const bgColor = theme?.colors?.background || '#FFFFFF';
  const textColor = theme?.colors?.text?.primary || '#000000';
  const secondaryColor = theme?.colors?.text?.secondary || '#666666';
  const tertiaryColor = theme?.colors?.text?.tertiary || '#999999';
  const primaryColor = theme?.colors?.primary || '#6366F1';
  const surfaceColor = theme?.colors?.surface || '#F5F5F5';
  const borderColor = theme?.colors?.border || '#E0E0E0';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />

      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: Math.max(StatusBar.currentHeight || 0, insets.top) + 12, backgroundColor: bgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.headerButtonText, { color: primaryColor }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>프로필 편집</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave} disabled={loading}>
          <Text style={[styles.headerButtonText, { color: primaryColor, fontWeight: '700' }]}>
            {loading ? '저장 중...' : '완료'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 이미지 섹션 */}
        <View style={[styles.profileSection, { backgroundColor: cardBg }]}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker} disabled={imageLoading}>
            {imageLoading ? (
              <View style={[styles.avatar, { backgroundColor: surfaceColor }]}>
                <ActivityIndicator size="small" color={primaryColor} />
              </View>
            ) : profileImageUrl && !imageError ? (
              <Image
                source={{ uri: normalizeImageUrl(profileImageUrl) }}
                style={styles.avatar}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            <View style={[styles.cameraIcon, { backgroundColor: primaryColor }]}>
              <Text style={styles.cameraEmoji}>📷</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleImagePicker} disabled={imageLoading}>
            <Text style={[styles.changePhotoText, { color: primaryColor }]}>
              사진 변경
            </Text>
          </TouchableOpacity>

          {profileImageUrl && !imageError && (
            <TouchableOpacity onPress={handleRemoveImage} disabled={imageLoading}>
              <Text style={[styles.removePhotoText, { color: '#FF3B30' }]}>
                사진 삭제
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 개인 정보 섹션 */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: secondaryColor }]}>개인 정보</Text>

          <View style={[styles.inputCard, { backgroundColor: cardBg }]}>
            {/* 이메일 */}
            <View style={[styles.inputRow, { borderBottomColor: borderColor }]}>
              <Text style={[styles.inputLabel, { color: textColor }]}>이메일</Text>
              <View style={styles.inputWrapper}>
                <Text style={[styles.readOnlyValue, { color: tertiaryColor }]}>{user.email}</Text>
                <Text style={[styles.lockIcon]}>🔒</Text>
              </View>
            </View>

            {/* 닉네임 */}
            <View style={[styles.inputRow, { borderBottomColor: borderColor }]}>
              <Text style={[styles.inputLabel, { color: textColor }]}>닉네임</Text>
              <TextInput
                style={[styles.inputValue, { color: textColor }]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임 입력"
                placeholderTextColor={tertiaryColor}
                editable={!loading}
              />
            </View>

            {/* 좋아하는 명언 */}
            <View style={styles.inputRowLast}>
              <Text style={[styles.inputLabel, { color: textColor }]}>한 줄 소개</Text>
              <TextInput
                style={[styles.inputValue, { color: textColor }]}
                value={favoriteQuote}
                onChangeText={setFavoriteQuote}
                placeholder="나를 표현하는 한마디"
                placeholderTextColor={tertiaryColor}
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* 안내 문구 */}
        <Text style={[styles.infoText, { color: tertiaryColor }]}>
          프로필 정보는 다른 사용자에게 공개될 수 있습니다.
        </Text>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraEmoji: {
    fontSize: 14,
  },
  changePhotoText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    marginTop: 4,
  },
  removePhotoText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    marginTop: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 20,
    marginBottom: 8,
  },
  inputCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  inputRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputLabel: {
    width: 80,
    fontSize: FONT_SIZES.body,
    fontWeight: '400',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  inputValue: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    textAlign: 'right',
    paddingVertical: 0,
  },
  readOnlyValue: {
    fontSize: FONT_SIZES.body,
  },
  lockIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  infoText: {
    fontSize: FONT_SIZES.caption,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});

export default ProfileEditScreen;
