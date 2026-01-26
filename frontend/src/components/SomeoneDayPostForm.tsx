// components/SomeoneDayPostForm.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import LoadingIndicator from './LoadingIndicator';
import uploadService from '../services/api/uploadService';
import TagSearchInput from './TagSearchInput';
import { normalizeImageUrl, logImageError, logImageSuccess } from '../utils/imageUtils';

// 타입 정의
interface SomeoneDayPostFormProps {
  onSubmit: (postData: {
    title: string;
    content: string;
    tag_ids: number[];
    image_url?: string;
    is_anonymous: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
  initialTitle?: string;
  initialContent?: string;
  initialTagIds?: number[];
  maxTitleLength?: number;
  maxContentLength?: number;
}

interface Tag {
  tag_id: number;
  name: string;
}

// 이미지 선택 함수 - 실제 구현
const selectImage = async (): Promise<{uri: string; name?: string; type?: string} | null> => {
  return new Promise((resolve) => {
    // 모의 함수로 대체
    setTimeout(() => {
      // 성공 시 이미지 정보 반환
      resolve({
        uri: 'file:///mock/image/path.jpg',
        name: 'image.jpg',
        type: 'image/jpeg'
      });
    }, 500);
  });
};

const SomeoneDayPostForm: React.FC<SomeoneDayPostFormProps> = ({
  onSubmit,
  isLoading = false,
  initialTitle = '',
  initialContent = '',
  initialTagIds = [],
  maxTitleLength = 100,
  maxContentLength = 2000
}) => {
  const [title, setTitle] = useState<string>(initialTitle);
  const [content, setContent] = useState<string>(initialContent);
  const [tagIds, setTagIds] = useState<number[]>(initialTagIds);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [imageUploadLoading, setImageUploadLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 초기 태그 ID 변환
  useEffect(() => {
    // 태그 ID가 제공되었으나 태그 객체가 없는 경우
    if (initialTagIds.length > 0 && selectedTags.length === 0) {
      // 임시 구현
      const mockTags: Tag[] = initialTagIds.map(id => ({
        tag_id: id,
        name: `태그 ${id}`
      }));
      setSelectedTags(mockTags);
    }
  }, [initialTagIds]);

  // 태그 선택 처리
  const handleTagSelect = (tag: Tag) => {
    if (tagIds.includes(tag.tag_id)) {
      return;
    }
    
    setTagIds([...tagIds, tag.tag_id]);
    setSelectedTags([...selectedTags, tag]);
  };

  // 태그 제거 처리
  const handleTagRemove = (tagId: number) => {
    setTagIds(tagIds.filter(id => id !== tagId));
    setSelectedTags(selectedTags.filter(tag => tag.tag_id !== tagId));
  };

  // 이미지 업로드 처리
  const handleImageSelect = async () => {
    try {
      const result = await selectImage();
      
      if (!result) {
        // 사용자가 취소한 경우
        return;
      }
      
      setSelectedImage(result);
      
      // 이미지 미리보기 설정
      setImageUrl(result.uri);
    } catch (error) {
      if (__DEV__) console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 문제가 발생했습니다.');
    }
  };

  // 이미지 업로드 함수
  const uploadImage = async (): Promise<string | undefined> => {
    if (!selectedImage) {
      return undefined;
    }
    
    // 업로드할 이미지 URI 확인
    const imageUri = selectedImage.uri;
    if (!imageUri) {
      return undefined;
    }
    
    try {
      setImageUploadLoading(true);
      
      // 이미지 업로드 (uploadService 사용)
      // FormData 대신 직접 URI 전달
      const response = await uploadService.uploadImage(imageUri);
      
      if (__DEV__) console.log('🔍 업로드 응답 전체:', JSON.stringify(response.data, null, 2));
      
      // 새로운 업로드 미들웨어 응답 구조에 맞게 수정
      let imageUrl: string | null = null;
      
      if (__DEV__) console.log('🔍 SomeoneDayPostForm 응답 구조 상세 분석:', {
        hasData: !!response.data?.data,
        hasImages: !!response.data?.data?.images,
        imagesLength: response.data?.data?.images?.length,
        firstImage: response.data?.data?.images?.[0],
        hasImageUrl: !!response.data?.data?.image_url
      });
      
      if (response.data?.data?.images?.[0]?.url) {
        // 새로운 업로드 미들웨어 응답 구조 (uploads/images 엔드포인트)
        imageUrl = response.data.data.images[0].url;
        if (__DEV__) console.log('✅ SomeoneDayPostForm 새로운 미들웨어 구조로 이미지 URL 추출:', imageUrl);
      } else if (response.data?.data?.image_url) {
        // 기존 uploadController 응답 구조
        imageUrl = response.data.data.image_url;
        if (__DEV__) console.log('✅ SomeoneDayPostForm 기존 구조로 이미지 URL 추출:', imageUrl);
      } else if (response.data?.data?.images?.[0]?.image_url) {
        // 혼합 구조
        imageUrl = response.data.data.images[0].image_url;
        if (__DEV__) console.log('✅ SomeoneDayPostForm 혼합 구조로 이미지 URL 추출:', imageUrl);
      }
      
      if (!imageUrl) {
        if (__DEV__) console.error('❌ 응답 구조가 예상과 다릅니다:', response.data);
        throw new Error('이미지 업로드 응답이 유효하지 않습니다.');
      }
      
      setImageUploadLoading(false);
      
      return imageUrl;
    } catch (error) {
      setImageUploadLoading(false);
      if (__DEV__) console.error('이미지 업로드 오류:', error);
      Alert.alert('업로드 실패', '이미지 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
      return undefined;
    }
  };

  // 게시물 제출 처리
  const handleSubmit = async () => {
    try {
      // 유효성 검사
      if (title.trim().length < 5) {
        Alert.alert('오류', '제목은 최소 5자 이상이어야 합니다.');
        return;
      }
      
      if (content.trim().length < 20) {
        Alert.alert('오류', '내용은 최소 20자 이상이어야 합니다.');
        return;
      }
      
      let finalImageUrl = imageUrl;
      
      // 선택된 이미지가 있고 로컬 이미지인 경우 업로드
      if (selectedImage && selectedImage.uri && selectedImage.uri.startsWith('file://')) {
        finalImageUrl = await uploadImage();
        if (!finalImageUrl && selectedImage) {
          // 업로드 실패 시 사용자에게 알림
          Alert.alert(
            '업로드 경고',
            '이미지 업로드에 실패했습니다. 이미지 없이 게시물을 등록하시겠습니까?',
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '이미지 없이 등록', 
                onPress: async () => {
                  try {
                    await onSubmit({
                      title,
                      content,
                      tag_ids: tagIds,
                      is_anonymous: isAnonymous
                    });
                    
                    // 성공 후 폼 초기화
                    resetForm();
                  } catch (submitError) {
                    handleSubmitError(submitError);
                  }
                }
              }
            ]
          );
          return;
        }
      }
      
      await onSubmit({
        title,
        content,
        tag_ids: tagIds,
        image_url: finalImageUrl,
        is_anonymous: isAnonymous
      });
      
      // 성공 후 폼 초기화
      resetForm();
    } catch (error) {
      handleSubmitError(error);
    }
  };

  // 폼 초기화 함수
  const resetForm = () => {
    setTitle('');
    setContent('');
    setTagIds([]);
    setSelectedTags([]);
    setImageUrl(undefined);
    setSelectedImage(null);
    setIsAnonymous(false);
  };

  // 제출 오류 처리 함수
  const handleSubmitError = (error: any) => {
    if (__DEV__) console.error('게시물 제출 오류:', error);
    
    // API 응답에서 오류 메시지 추출 시도
    let errorMessage = '게시물을 제출하는 중 오류가 발생했습니다. 다시 시도해 주세요.';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    
    Alert.alert('제출 실패', errorMessage);
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setImageUrl(undefined);
    setSelectedImage(null);
  };

  const isSubmitDisabled = isLoading || 
                          imageUploadLoading || 
                          title.trim().length < 5 || 
                          content.trim().length < 20;

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>누군가의 하루 게시하기</Text>
        
        {/* 오류 메시지 */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
       {/* 제목 입력 */}
       <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>제목</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력하세요 (5-100자)"
            maxLength={maxTitleLength}
          />
          <Text style={[
            styles.charCount,
            title.length >= maxTitleLength * 0.9 && styles.charCountWarning
          ]}>
            {title.length}/{maxTitleLength}
          </Text>
        </View>
        
        {/* 태그 선택기 */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>태그</Text>
          <TagSearchInput
            onTagSelect={handleTagSelect}
            selectedTags={selectedTags}
            placeholder="태그를 검색하세요 (선택사항)"
            maxTags={5}
          />
          
          {/* 선택된 태그 표시 */}
          {selectedTags.length > 0 && (
            <View style={styles.selectedTagsContainer}>
              {selectedTags.map(tag => (
                <TouchableOpacity
                  key={tag.tag_id}
                  style={styles.selectedTag}
                  onPress={() => handleTagRemove(tag.tag_id)}
                >
                  <Text style={styles.selectedTagText}>#{tag.name}</Text>
                  <Text style={styles.removeTagText}> ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* 내용 입력 */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>내용</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="내용을 입력하세요 (20-2000자)"
            multiline
            maxLength={maxContentLength}
            textAlignVertical="top"
          />
          <Text style={[
            styles.charCount,
            content.length >= maxContentLength * 0.9 && styles.charCountWarning
          ]}>
            {content.length}/{maxContentLength}
          </Text>
        </View>
        
        {/* 이미지 업로드 */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>이미지</Text>
          <TouchableOpacity 
            style={styles.imagePicker} 
            onPress={handleImageSelect}
            disabled={isLoading || imageUploadLoading}
          >
            <Text style={styles.imageButtonText}>이미지 추가 (선택사항)</Text>
          </TouchableOpacity>
          
          {imageUrl && (
            <View style={styles.selectedImageContainer}>
              <Image 
                source={{ uri: normalizeImageUrl(imageUrl) }} 
                style={styles.selectedImage}
                onError={(error: any) => {
                  logImageError('SomeoneDayPostForm Preview', imageUrl, normalizeImageUrl(imageUrl), error.nativeEvent?.error);
                }}
                onLoad={() => {
                  logImageSuccess('SomeoneDayPostForm Preview', normalizeImageUrl(imageUrl));
                }}
              />
              <TouchableOpacity 
                style={styles.removeImageButton} 
                onPress={handleRemoveImage}
                disabled={isLoading || imageUploadLoading}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* 익명 설정 */}
        <View style={styles.anonymousContainer}>
          <TouchableOpacity 
            style={[
              styles.checkbox, 
              isAnonymous && styles.checkboxChecked
            ]} 
            onPress={() => setIsAnonymous(!isAnonymous)}
            disabled={isLoading}
          >
            {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.anonymousText}>익명으로 게시하기</Text>
        </View>
        
        {/* 제출 버튼 */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            isSubmitDisabled && styles.disabledButton
          ]} 
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
        >
          {isLoading || imageUploadLoading ? (
            <LoadingIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>게시하기</Text>
          )}
        </TouchableOpacity>
        
        {/* 추가 안내 */}
        <Text style={styles.infoText}>
          혼자 고민하지 마세요. 여기에 공유하면 많은 사람들이 당신에게 위로와 지지를 보낼 거예요.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#4A6572',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 8,
    color: '#14171A',
  },
  titleInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  contentInput: {
    height: 200,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  charCount: {
    fontSize: 12,
    color: '#657786',
    textAlign: 'right',
    marginTop: 4,
  },
  charCountWarning: {
    color: '#E0245E',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EDF0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#4A6572',
  },
  removeTagText: {
    fontSize: 14,
    color: '#657786',
    marginLeft: 4,
  },
  imagePicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4A6572',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonText: {
    color: '#4A6572',
    fontSize: 16,
  },
  selectedImageContainer: {
    marginTop: 8,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#4A6572',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A6572',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
  },
  anonymousText: {
    fontSize: 16,
    color: '#14171A',
  },
  submitButton: {
    backgroundColor: '#0095F6',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  disabledButton: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 14,
    color: '#657786',
    textAlign: 'center',
    lineHeight: 20,
  }
});

export default SomeoneDayPostForm;