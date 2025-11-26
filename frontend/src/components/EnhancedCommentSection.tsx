import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Animated,
  Keyboard,
} from 'react-native';
import type { ScrollView as ScrollViewType, TextInput as TextInputType } from 'react-native';
import { useSafeAreaInsets } from '../contexts/SafeAreaContext';

interface EnhancedCommentSectionProps {
  children: React.ReactNode;
  commentInputValue: string;
  onCommentInputChange: (text: string) => void;
  onCommentSubmit: () => void;
  isSubmitting?: boolean;
  placeholder?: string;
  showStickyInput?: boolean;
  maxLength?: number;
}

const EnhancedCommentSection: React.FC<EnhancedCommentSectionProps> = ({
  children,
  commentInputValue,
  onCommentInputChange,
  onCommentSubmit,
  isSubmitting = false,
  placeholder = "댓글을 입력하세요...",
  showStickyInput = true,
  maxLength = 300,
}) => {
  const scrollViewRef = useRef<ScrollViewType>(null);
  const commentInputRef = useRef<TextInputType>(null);
  const insets = useSafeAreaInsets();
  const [inputHeight, setInputHeight] = useState(40);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const stickyOpacity = useRef(new Animated.Value(0)).current;
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const screenHeight = Dimensions.get('window').height;

  // 컨텐츠가 화면보다 길 때만 sticky input 표시
  const shouldShowSticky = showStickyInput && contentHeight > scrollViewHeight - 100;

  useEffect(() => {
    const keyboardDidShowListener = Platform.select({
      ios: 'keyboardWillShow',
      android: 'keyboardDidShow',
    });
    const keyboardDidHideListener = Platform.select({
      ios: 'keyboardWillHide',
      android: 'keyboardDidHide',
    });

    const showSubscription = keyboardDidShowListener && Keyboard.addListener(keyboardDidShowListener, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      if (shouldShowSticky) {
        Animated.timing(stickyOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    });

    const hideSubscription = keyboardDidHideListener && Keyboard.addListener(keyboardDidHideListener, () => {
      setKeyboardHeight(0);
      Animated.timing(stickyOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [shouldShowSticky, stickyOpacity]);

  const scrollToBottom = useCallback(() => {
    if (scrollViewRef.current && contentHeight > scrollViewHeight) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [contentHeight, scrollViewHeight]);

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    // 키보드가 나타날 때까지 기다린 후 스크롤
    setTimeout(() => {
      scrollToBottom();
    }, 300);
  }, [scrollToBottom]);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (commentInputValue.trim() && !isSubmitting) {
      onCommentSubmit();
    }
  }, [commentInputValue, isSubmitting, onCommentSubmit]);

  const renderCommentInput = (isSticky = false) => (
    <View style={[
      styles.commentInputContainer, 
      isSticky && styles.stickyInputContainer,
      { paddingBottom: insets.bottom + (isSticky ? 0 : 10) }
    ]}>
      <View style={styles.inputRow}>
        <TextInput
          ref={isSticky ? null : commentInputRef}
          style={[styles.commentInput, { height: Math.max(40, inputHeight) }]}
          value={commentInputValue}
          onChangeText={onCommentInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          multiline
          maxLength={maxLength}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!commentInputValue.trim() || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!commentInputValue.trim() || isSubmitting}
        >
          <Text style={[
            styles.submitButtonText,
            (!commentInputValue.trim() || isSubmitting) && styles.submitButtonTextDisabled
          ]}>
            {isSubmitting ? '전송중...' : '전송'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.characterCount}>
        {commentInputValue.length}/{maxLength}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -insets.bottom}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        onContentSizeChange={(contentWidth, height) => setContentHeight(height)}
        onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {children}
        
        {/* 기본 댓글 입력 (항상 하단에 위치) */}
        {renderCommentInput(false)}
      </ScrollView>

      {/* Sticky 댓글 입력 (긴 댓글 목록일 때만 표시) */}
      {shouldShowSticky && (
        <Animated.View 
          style={[
            styles.stickyInputWrapper,
            { 
              opacity: stickyOpacity,
              bottom: keyboardHeight > 0 ? keyboardHeight - insets.bottom : 0,
            }
          ]}
          pointerEvents={keyboardHeight > 0 ? 'auto' : 'none'}
        >
          {renderCommentInput(true)}
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  commentInputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stickyInputContainer: {
    borderRadius: 0,
  },
  stickyInputWrapper: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#999999',
  },
  characterCount: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 4,
  },
});

export default EnhancedCommentSection;