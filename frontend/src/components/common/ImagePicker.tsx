import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { imageService } from '../../services/imageService';
import ModernButton from './ModernButton';
import ModernText from './ModernText';
import ProfileImage from './ProfileImage';
import BottomSheetAlert from './BottomSheetAlert';

interface ImagePickerProps {
  currentImageUrl?: string | null;
  onImageSelected: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  type?: 'profile' | 'general';
  maxSizeMB?: number;
  showPreview?: boolean;
  style?: any;
  requireAuth?: boolean; // 인증 필요 여부
}

const ImagePicker: React.FC<ImagePickerProps> = ({
  currentImageUrl,
  onImageSelected,
  onImageRemoved,
  type = 'general',
  maxSizeMB = 5,
  showPreview = true,
  style,
  requireAuth = true,
}) => {
  const { colors, spacing } = useModernTheme();
  const { isAuthenticated } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [] });

  const selectImage = () => {
    // 인증이 필요한 경우 인증 상태 확인
    if (requireAuth && !isAuthenticated) {
      setAlert({
        visible: true,
        title: '인증 필요',
        message: '이미지 업로드는 회원가입 완료 후 이용하실 수 있습니다.',
        buttons: [{ text: '확인', style: 'default' }]
      });
      return;
    }

    // 🔥 용도별 이미지 크기 최적화
    const imageConfigs = {
      profile: {
        maxWidth: 400,   // 프로필 이미지 (원본: 600 → 400)
        maxHeight: 400,
        quality: 0.75 as PhotoQuality, // 품질 향상 (0.6 → 0.75)
      },
      general: {
        maxWidth: 1200,  // 일반 이미지 (게시물용)
        maxHeight: 1200,
        quality: 0.8 as PhotoQuality,
      }
    };

    const config = imageConfigs[type];

    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: config.maxHeight,
      maxWidth: config.maxWidth,
      quality: config.quality,
      storageOptions: {
        skipBackup: true,
        path: 'images'
      }
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    const asset = response.assets?.[0];
    if (!asset || !asset.uri) {
      setAlert({
        visible: true,
        title: '오류',
        message: '이미지를 선택할 수 없습니다.',
        buttons: [{ text: '확인', style: 'default' }]
      });
      return;
    }

    // URI 유효성 검사
    if (!asset.uri || asset.uri.length === 0) {
      setAlert({
        visible: true,
        title: '오류',
        message: '유효하지 않은 이미지 파일입니다.',
        buttons: [{ text: '확인', style: 'default' }]
      });
      if (__DEV__) console.warn('빈 이미지 URI:', asset.uri);
      return;
    }

    // 파일 객체 생성
    const file = {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName || `image_${Date.now()}.jpg`,
      size: asset.fileSize || 0,
    } as any;

    // 파일 유효성 검사
    const validation = imageService.validateImageFile({
      type: asset.type || 'image/jpeg',
      size: asset.fileSize || 0,
    } as File, maxSizeMB);

    if (!validation.valid) {
      setAlert({
        visible: true,
        title: '이미지 오류',
        message: validation.error || '이미지를 처리할 수 없습니다.',
        buttons: [{ text: '확인', style: 'default' }]
      });
      return;
    }

    // 미리보기 설정
    if (showPreview) {
      setPreviewUri(asset.uri);
    }

    // 업로드 진행
    await uploadImage(file);
  };

  const uploadImage = async (file: any) => {
    setUploading(true);
    
    try {
      let response;
      
      if (type === 'profile') {
        response = await imageService.uploadProfileImage(file);
      } else {
        response = await imageService.uploadImage(file);
      }

      // 성공 시 콜백 호출
      if (response.data?.url) {
        onImageSelected(response.data.url);
        setAlert({
          visible: true,
          title: '성공',
          message: '이미지가 업로드되었습니다.',
          buttons: [{ text: '확인', style: 'default' }]
        });
      }

    } catch (error: unknown) {
      if (__DEV__) console.error('이미지 업로드 실패:', error);

      let errorMessage = '이미지 업로드 중 오류가 발생했습니다.';

      if (error.response?.status === 401) {
        if (!isAuthenticated) {
          errorMessage = '이미지 업로드는 회원가입 완료 후 이용하실 수 있습니다.';
        } else if (error.response?.data?.code === 'TOKEN_EXPIRED') {
          errorMessage = '로그인 세션이 만료되었습니다. 다시 로그인해주세요.';
        } else {
          errorMessage = '인증이 필요합니다. 로그인 후 다시 시도해주세요.';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setAlert({
        visible: true,
        title: '업로드 실패',
        message: errorMessage,
        buttons: [{ text: '확인', style: 'default' }]
      });
      setPreviewUri(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setAlert({
      visible: true,
      title: '이미지 삭제',
      message: '현재 이미지를 삭제하시겠습니까?',
      buttons: [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setPreviewUri(null);
            onImageRemoved?.();
          },
        },
      ]
    });
  };

  const displayImageUrl = previewUri || currentImageUrl;

  return (
    <View style={[styles.container, style]}>
      {showPreview && (
        <View style={styles.previewContainer}>
          <ProfileImage
            imageUrl={displayImageUrl}
            size="xlarge"
            editable={!uploading}
            onPress={selectImage}
            showBorder={true}
          />
          
          {displayImageUrl && !uploading && (
            <ModernButton
              title="이미지 제거"
              onPress={removeImage}
              variant="text"
              color="error"
              size="small"
              style={styles.removeButton}
            />
          )}
        </View>
      )}

      <View style={styles.buttonsContainer}>
        <ModernButton
          title={displayImageUrl ? "이미지 변경" : "이미지 선택"}
          onPress={selectImage}
          loading={uploading}
          disabled={uploading}
          icon="image"
          variant="outlined"
          style={styles.selectButton}
        />
      </View>

      <View style={styles.infoContainer}>
        <ModernText variant="caption" color="secondary" style={styles.infoText}>
          최대 {maxSizeMB}MB, JPEG, PNG, WebP 형식 지원
        </ModernText>
      </View>

      <BottomSheetAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onClose={() => setAlert({ visible: false, title: '', message: '', buttons: [] })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: 8,
  },
  selectButton: {
    width: '100%',
  },
  removeButton: {
    marginTop: 8,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    textAlign: 'center',
  },
});

export default ImagePicker;