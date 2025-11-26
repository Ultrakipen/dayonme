// SearchInput 컴포넌트 - 수동 검색
import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../constants/ComfortScreen.constants';
import { sanitizeInput } from '../../utils/security';

interface SearchInputProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  initialValue?: string;
  clearTrigger?: number;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onClear,
  initialValue = '',
  clearTrigger,
  placeholder = '제목, 내용으로 검색...',
}) => {
  const [inputText, setInputText] = useState(initialValue);

  useEffect(() => {
    if (clearTrigger) {
      setInputText('');
      console.log('🗑️ 외부 트리거에 의한 SearchInput 클리어');
    }
  }, [clearTrigger]);

  const handleSearch = useCallback(() => {
    console.log('🔍 검색 실행:', inputText);
    onSearch(inputText.trim());
  }, [inputText, onSearch]);

  const handleClear = useCallback(() => {
    setInputText('');
    console.log('🗑️ SearchInput 클리어');
    onClear();
  }, [onClear]);

  const handleTextChange = useCallback((text: string) => {
    const sanitized = sanitizeInput(text);
    setInputText(sanitized);
    console.log('📝 텍스트 변경 (자동 검색 없음):', sanitized);
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.glassmorphism,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <TouchableOpacity style={{ marginRight: 12 }} onPress={handleSearch}>
        <MaterialCommunityIcons name="magnify" size={20} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      <TextInput
        style={{
          flex: 1,
          fontSize: 16,
          color: 'white',
          fontWeight: '500',
          paddingVertical: 0,
        }}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.6)"
        value={inputText}
        onChangeText={handleTextChange}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        textContentType="none"
        blurOnSubmit={false}
        selectTextOnFocus={false}
        keyboardType="default"
        multiline={false}
        numberOfLines={1}
      />

      {inputText.length > 0 && (
        <TouchableOpacity style={{ marginLeft: 12, padding: 4 }} onPress={handleClear}>
          <MaterialCommunityIcons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchInput;
