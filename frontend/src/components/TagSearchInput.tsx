// components/TagSearchInput.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text as RNText, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import { Text } from './ui';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeContext';
import tagService from '../services/api/tagService';

// 타입 정의
interface Tag {
  tag_id: number;
  name: string;
}

interface ApiTagResponse {
  data: {
    data: Tag[];
  };
}

interface TagSearchInputProps {
  onTagSelect: (tag: Tag) => void;
  selectedTags?: Tag[];
  placeholder?: string;
  maxTags?: number;
  debounceMs?: number;
  showPopularTags?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

// 타입 가드 함수
function isValidApiTagResponse(response: any): response is ApiTagResponse {
  return (
    response &&
    response.data &&
    Array.isArray(response.data.data) &&
    response.data.data.every(
      (tag: any) => 
        typeof tag === 'object' &&
        typeof tag.tag_id === 'number' &&
        typeof tag.name === 'string'
    )
  );
}

const TagSearchInput: React.FC<TagSearchInputProps> = ({
  onTagSelect,
  selectedTags = [],
  placeholder = '태그를 검색하세요',
  maxTags = 5,
  debounceMs = 300,
  showPopularTags = true,
  onFocus,
  onBlur
}) => {
  const { isDarkMode } = useTheme();
  const [searchText, setSearchText] = useState<string>('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<typeof TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // 선택된 태그 ID 목록을 메모이제이션
  const selectedTagIds = useMemo(() => {
    return selectedTags.map(tag => tag.tag_id);
  }, [selectedTags]);
  

// 향상된 검색 알고리즘 (Fuzzy matching 지원)
const fuzzySearch = useCallback((query: string, items: Tag[]): Tag[] => {
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return items
    .map(item => {
      const normalizedName = item.name.toLowerCase();
      let score = 0;
      
      // 정확한 매치
      if (normalizedName === normalizedQuery) {
        score = 100;
      }
      // 시작 매치
      else if (normalizedName.startsWith(normalizedQuery)) {
        score = 90;
      }
      // 포함 매치
      else if (normalizedName.includes(normalizedQuery)) {
        score = 70;
      }
      // 자모 분리 검색 (한글 지원)
      else if (includesKoreanConsonants(normalizedName, normalizedQuery)) {
        score = 50;
      }
      // Fuzzy 매치
      else {
        const fuzzyScore = calculateFuzzyScore(normalizedName, normalizedQuery);
        if (fuzzyScore > 0.6) {
          score = Math.floor(fuzzyScore * 40);
        }
      }
      
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}, []);

// 한글 자음 검색 지원
const includesKoreanConsonants = (text: string, query: string): boolean => {
  const consonantMap: { [key: string]: string } = {
    'ㄱ': '[가-깋]', 'ㄴ': '[나-닣]', 'ㄷ': '[다-딯]', 'ㄹ': '[라-맇]',
    'ㅁ': '[마-밓]', 'ㅂ': '[바-빟]', 'ㅅ': '[사-싷]', 'ㅇ': '[아-잏]',
    'ㅈ': '[자-짛]', 'ㅊ': '[차-칳]', 'ㅋ': '[카-킿]', 'ㅌ': '[타-팋]',
    'ㅍ': '[파-핗]', 'ㅎ': '[하-힣]'
  };
  
  let regexPattern = query;
  for (const [consonant, range] of Object.entries(consonantMap)) {
    regexPattern = regexPattern.replace(new RegExp(consonant, 'g'), range);
  }
  
  try {
    return new RegExp(regexPattern).test(text);
  } catch {
    return false;
  }
};

// Fuzzy 매칭 점수 계산
const calculateFuzzyScore = (text: string, query: string): number => {
  if (text.length === 0 || query.length === 0) return 0;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= text.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= query.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= text.length; i++) {
    for (let j = 1; j <= query.length; j++) {
      if (text.charAt(i - 1) === query.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[text.length][query.length];
  return 1 - distance / Math.max(text.length, query.length);
};

// 태그 목록 가져오기
const fetchTags = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    // API에서 태그 목록 가져오기 시도
    try {
      const response = await tagService.getAllTags();
      if (response && Array.isArray(response)) {
        setTags(response);
        if (showPopularTags) {
          setPopularTags(response.slice(0, 10));
        }
        setLoading(false);
        return;
      }
    } catch (apiError) {
      console.log('태그 API 미구현, 로컬 태그 생성 기능 사용');
    }

    // API 미구현 시 빈 배열로 시작 (사용자가 직접 태그 생성)
    setTags([]);
    setPopularTags([]);
    
    setLoading(false);
  } catch (error) {
    console.error('태그 가져오기 오류:', error);
    setError('태그 목록을 불러오는데 실패했습니다.');
    setLoading(false);
  }
}, [showPopularTags]);


  
  // 컴포넌트 마운트 시 태그 목록 가져오기
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);
  
  // 디바운싱된 검색 핸들러
  const debouncedSearch = useCallback((text: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(async () => {
      if (text.trim() === '') {
        setFilteredTags(showPopularTags ? popularTags.filter(tag => !selectedTagIds.includes(tag.tag_id)) : []);
        return;
      }
      
      setLoading(true);
      
      // 향상된 로컬 검색
      const availableTags = tags.filter(tag => !selectedTagIds.includes(tag.tag_id));
      const localResults = fuzzySearch(text, availableTags);
      
      try {
        // API 검색 (백엔드 준비 시)
        // const response = await tagService.searchTags(text.trim());
        // if (response.status === 'success' && response.data?.tags) {
        //   const apiTags = response.data.tags.filter(tag => !selectedTagIds.includes(tag.tag_id));
        //   const combined = mergeTags(localResults, apiTags);
        //   setFilteredTags(combined);
        // } else {
        //   setFilteredTags(localResults);
        // }
        
        setFilteredTags(localResults);
      } catch (error) {
        console.error('태그 검색 API 오류:', error);
        setFilteredTags(localResults);
      }
      
      setLoading(false);
    }, debounceMs);
  }, [tags, selectedTagIds, popularTags, showPopularTags, debounceMs, fuzzySearch]);
  
  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    
    if (text.trim() === '') {
      setIsDropdownVisible(showPopularTags && popularTags.length > 0);
      setFilteredTags(showPopularTags ? popularTags.filter(tag => !selectedTagIds.includes(tag.tag_id)) : []);
    } else {
      setIsDropdownVisible(true);
      debouncedSearch(text);
    }
  }, [debouncedSearch, popularTags, selectedTagIds, showPopularTags]);
  
  // 태그 클릭 핸들러 (애니메이션과 피드백 추가)
  const handleTagPress = useCallback((tag: Tag) => {
    if (selectedTags.length >= maxTags) {
      // 최대 개수 도달 시 펄스 애니메이션
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    
    // 최근 검색어에 추가
    if (searchText.trim() && !recentSearches.includes(searchText.trim())) {
      setRecentSearches(prev => [searchText.trim(), ...prev.slice(0, 4)]);
    }
    
    onTagSelect(tag);
    setSearchText('');
    setFilteredTags(showPopularTags ? popularTags.filter(t => !selectedTagIds.includes(t.tag_id) && t.tag_id !== tag.tag_id) : []);
    
    // 드롭다운 닫기 애니메이션
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsDropdownVisible(false);
    });
    
    if (inputRef.current) {
      (inputRef.current as any).focus();
    }
  }, [selectedTags.length, maxTags, searchText, recentSearches, onTagSelect, popularTags, selectedTagIds, showPopularTags, pulseAnim, dropdownAnim]);
  
// 태그 생성 핸들러 (검색 결과가 없을 때)
const handleCreateTag = async () => {
  if (searchText.trim().length < 2) {
    return;
  }
  
  try {
    setLoading(true);
    
    // 로컬에서 새 태그 생성 (백엔드 준비 시까지)
    const newTag: Tag = {
      tag_id: Date.now(), // 임시 ID
      name: searchText.trim()
    };
    
    // 태그 목록에 추가
    setTags(prevTags => [...prevTags, newTag]);
    
    // 선택된 태그로 추가
    onTagSelect(newTag);
    
    // 상태 초기화
    setSearchText('');
    setFilteredTags([]);
    setIsDropdownVisible(false);
    
    // TODO: 백엔드 준비 시 주석 해제
    /*
    const response = await tagService.createTag(searchText.trim());
    // API 응답 처리 로직
    */
    
    setLoading(false);
  } catch (error) {
    console.error('태그 생성 오류:', error);
    setError('태그 생성에 실패했습니다.');
    setLoading(false);
  }
};
  


  
  // 드롭다운 애니메이션 효과
  useEffect(() => {
    if (isDropdownVisible) {
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isDropdownVisible, dropdownAnim]);
  
  // 키보드 이벤트 처리
  useEffect(() => {
    const keyboardWillShow = () => {
      // 키보드 표시 시 처리
    };
    
    const keyboardWillHide = () => {
      // 키보드 숨김 시 처리
      setIsDropdownVisible(false);
    };
    
    const showListener = Keyboard.addListener('keyboardDidShow', keyboardWillShow);
    const hideListener = Keyboard.addListener('keyboardDidHide', keyboardWillHide);
    
    return () => {
      showListener.remove();
      hideListener.remove();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // 향상된 태그 아이템 렌더링 함수
  const renderTagItem = useCallback((tag: Tag, isPopular: boolean = false) => {
    const isSelected = selectedTagIds.includes(tag.tag_id);
    
    return (
      <TouchableOpacity
        key={tag.tag_id.toString()}
        style={[
          styles.dropdownItem, 
          isDarkMode && styles.dropdownItemDark,
          isSelected && styles.dropdownItemSelected,
          isSelected && isDarkMode && styles.dropdownItemSelectedDark
        ]}
        onPress={() => handleTagPress(tag)}
        disabled={isSelected}
      >
        <View style={styles.tagContent}>
          <MaterialIcons 
            name={isPopular ? "trending-up" : "tag"} 
            size={16} 
            color={isSelected ? '#9CA3AF' : (isDarkMode ? '#60A5FA' : '#0095F6')} 
          />
          <Text style={[
            styles.dropdownItemText, 
            isDarkMode && styles.dropdownItemTextDark,
            isSelected && styles.dropdownItemTextSelected
          ]}>#{tag.name}</Text>
          {isSelected && (
            <MaterialIcons name="check" size={16} color="#9CA3AF" />
          )}
        </View>
        {isPopular && (
          <View style={[styles.popularBadge, isDarkMode && styles.popularBadgeDark]}>
            <Text style={[styles.popularBadgeText, isDarkMode && styles.popularBadgeTextDark]}>인기</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedTagIds, isDarkMode, handleTagPress]);
  
  return (
    <View style={styles.container}>
      {/* 오류 메시지 */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {/* 태그 최대 개수 도달 메시지 */}
      {selectedTags.length >= maxTags ? (
        <Text style={styles.maxTagsText}>최대 {maxTags || 5}개의 태그까지 선택할 수 있습니다.</Text>
      ) : (
        <>
          {/* 검색 입력 */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder={selectedTags.length === 0 ? placeholder : `태그 추가 (${selectedTags.length || 0}/${maxTags || 5})`}
            editable={true}
            selectTextOnFocus={true}
            showSoftInputOnFocus={true}
            autoFocus={false}
            keyboardType="default"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            onFocus={() => {
              console.log('태그 검색 입력 포커스');
              if (searchText.trim() !== '' || (showPopularTags && popularTags.length > 0)) {
                setIsDropdownVisible(true);
              }
              onFocus?.();
            }}
            onBlur={() => {
              console.log('태그 검색 입력 블러');
              setTimeout(() => {
                Animated.timing(dropdownAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  setIsDropdownVisible(false);
                });
              }, 150);
              onBlur?.();
            }}
            onSubmitEditing={() => {
              if (filteredTags.length > 0) {
                handleTagPress(filteredTags[0]);
              } else if (searchText.trim() !== '') {
                handleCreateTag();
              }
            }}
          />
          
          {/* 로딩 인디케이터 */}
          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color="#4A6572" />
            </View>
          )}
          
          {/* 검색 결과 드롭다운 (향상된 UI) */}
          {isDropdownVisible && (
            <Animated.View 
              style={[
                styles.dropdown,
                isDarkMode && styles.dropdownDark,
                {
                  opacity: dropdownAnim,
                  transform: [{
                    scale: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  }],
                }
              ]}
            >
              <ScrollView 
                style={styles.dropdownList}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                bounces={false}
              >
                {/* 검색 결과 헤더 */}
                {searchText.trim() !== '' && (
                  <View style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
                    <MaterialIcons name="search" size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                    <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>검색 결과</Text>
                  </View>
                )}
                
                {/* 인기 태그 (검색어가 없을 때) */}
                {searchText.trim() === '' && showPopularTags && popularTags.length > 0 && (
                  <>
                    <View style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
                      <MaterialIcons name="trending-up" size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>인기 태그</Text>
                    </View>
                    {popularTags
                      .filter(tag => !selectedTagIds.includes(tag.tag_id))
                      .slice(0, 8)
                      .map(tag => renderTagItem(tag, true))
                    }
                  </>
                )}
                
                {/* 검색 결과 */}
                {searchText.trim() !== '' && (
                  <>
                    {filteredTags.length > 0 ? (
                      filteredTags.map(tag => renderTagItem(tag))
                    ) : loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#4A6572'} />
                        <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>검색 중...</Text>
                      </View>
                    ) : (
                      <>
                        {searchText.trim().length >= 2 ? (
                          <TouchableOpacity
                            style={[styles.createTagButton, isDarkMode && styles.createTagButtonDark]}
                            onPress={handleCreateTag}
                          >
                            <MaterialIcons name="add" size={18} color={isDarkMode ? '#60A5FA' : '#0095F6'} />
                            <Text style={[styles.createTagText, isDarkMode && styles.createTagTextDark]}>
                              "{searchText || ''}" 태그 만들기
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={[styles.noResultsText, isDarkMode && styles.noResultsTextDark]}>
                            검색 결과가 없습니다. 2자 이상 입력하여 새 태그를 만들 수 있습니다.
                          </Text>
                        )}
                      </>
                    )}
                  </>
                )}
                
                {/* 최근 검색어 */}
                {recentSearches.length > 0 && searchText.trim() === '' && (
                  <>
                    <View style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
                      <MaterialIcons name="history" size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>최근 검색어</Text>
                    </View>
                    {recentSearches.map((search, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.recentSearchItem, isDarkMode && styles.recentSearchItemDark]}
                        onPress={() => handleSearchChange(search)}
                      >
                        <MaterialIcons name="history" size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[styles.recentSearchText, isDarkMode && styles.recentSearchTextDark]}>{search}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#262626',
    fontWeight: '400',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputDark: {
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    color: '#F9FAFB',
  },
  inputFocused: {
    borderColor: '#0095F6',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  inputFocusedDark: {
    borderColor: '#60A5FA',
    backgroundColor: '#111827',
  },
  maxTagsText: {
    fontSize: 14,
    color: '#657786',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    marginBottom: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 250,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 25,
    zIndex: 10000,
    overflow: 'hidden',
  },
  dropdownDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  dropdownList: {
    flex: 1,
    paddingVertical: 6,
    paddingBottom: 8,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    borderRadius: 6,
    marginVertical: 1,
    minHeight: 38,
  },
  dropdownItemDark: {
    borderBottomColor: '#374151',
    backgroundColor: '#1F2937',
  },
  dropdownItemSelected: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  dropdownItemSelectedDark: {
    backgroundColor: '#374151',
    opacity: 0.7,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#262626',
    marginLeft: 10,
    flex: 1,
    fontWeight: '400',
    lineHeight: 20,
  },
  dropdownItemTextDark: {
    color: '#F9FAFB',
  },
  dropdownItemTextSelected: {
    color: '#9CA3AF',
  },
  createTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderBottomWidth: 0,
    marginHorizontal: 4,
    borderRadius: 8,
    marginVertical: 2,
    minHeight: 42,
  },
  createTagButtonDark: {
    backgroundColor: '#374151',
  },
  createTagText: {
    fontSize: 15,
    color: '#0095F6',
    fontWeight: '500',
    marginLeft: 8,
    lineHeight: 20,
  },
  createTagTextDark: {
    color: '#60A5FA',
  },
  noResultsText: {
    padding: 16,
    fontSize: 14,
    color: '#4a5568',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  noResultsTextDark: {
    color: '#9CA3AF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D5DB',
    marginHorizontal: 4,
    borderRadius: 6,
    marginVertical: 1,
    minHeight: 32,
  },
  sectionHeaderDark: {
    backgroundColor: '#111827',
    borderBottomColor: '#374151',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  sectionTitleDark: {
    color: '#9CA3AF',
  },
  popularBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularBadgeDark: {
    backgroundColor: '#374151',
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  popularBadgeTextDark: {
    color: '#FCD34D',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    marginHorizontal: 4,
    borderRadius: 6,
    marginVertical: 1,
    minHeight: 38,
  },
  recentSearchItemDark: {
    borderBottomColor: '#374151',
  },
  recentSearchText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 10,
    fontWeight: '500',
    lineHeight: 20,
  },
  recentSearchTextDark: {
    color: '#9CA3AF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  loadingTextDark: {
    color: '#9CA3AF',
  },
  loading: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
});

export default TagSearchInput;