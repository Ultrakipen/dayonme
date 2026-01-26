// src/components/ComfortWall/SearchBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
  useWindowDimensions
} from 'react-native';
import { 
  Searchbar, 
  Text, 
  Chip, 
  Surface, 
  Divider, 
  useTheme,
  IconButton
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { SearchAutoComplete, SearchSuggestion } from '../../types/search';
import { InlineLoadingIndicator } from './LoadingIndicator';
import { normalize, normalizeSpace } from '../../utils/responsive';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  autoCompleteFunction?: (query: string) => Promise<SearchAutoComplete>;
  showRecentSearches?: boolean;
  recentSearches?: string[];
  onAddRecentSearch?: (query: string) => void;
  onRemoveRecentSearch?: (query: string) => void;
  onClearRecentSearches?: () => void;
  showSuggestions?: boolean;
  style?: any;
  disabled?: boolean;
}

const ComfortWallSearchBar: React.FC<SearchBarProps> = ({
  placeholder = '게시물 검색...',
  onSearch,
  onClear,
  autoCompleteFunction,
  showRecentSearches = true,
  recentSearches = [],
  onAddRecentSearch,
  onRemoveRecentSearch,
  onClearRecentSearches,
  showSuggestions = true,
  style,
  disabled = false
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchBarRef = useRef<any>(null);

  
// 자동완성 상태 직접 관리
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // 현재 자동완성 결과
  const [currentAutoComplete, setCurrentAutoComplete] = useState<SearchAutoComplete>({
    suggestions: [],
    recent_searches: recentSearches,
    trending_tags: []
  });


  // 디바운스된 자동완성 호출
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.length > 0 && autoCompleteFunction) {
      setSuggestionsLoading(true);
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await autoCompleteFunction(searchQuery);
          setCurrentAutoComplete(result);
        } catch (error) {
          setCurrentAutoComplete({
            suggestions: [],
            recent_searches: recentSearches,
            trending_tags: []
          });
        } finally {
          setSuggestionsLoading(false);
        }
      }, 300);
    } else {
      setSuggestionsLoading(false);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, autoCompleteFunction, recentSearches]);


// 검색어 변경 처리
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    // 드롭다운 표시 조건
    setShowDropdown(isFocused && (
      query.length > 0 || 
      (showRecentSearches && recentSearches.length > 0)
    ));
  };

  // 검색 실행
  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      onAddRecentSearch?.(searchQuery.trim());
      setShowDropdown(false);
      Keyboard.dismiss();
    }
  };

  // 검색 초기화
  const handleClear = () => {
    setSearchQuery('');
    setShowDropdown(false);
    onClear?.();
  };

  // 포커스 처리
  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(
      searchQuery.length > 0 || 
      (showRecentSearches && recentSearches.length > 0)
    );
  };

  // 포커스 해제 처리
  const handleBlur = () => {
    setIsFocused(false);
    // 약간의 지연을 두어 터치 이벤트가 처리될 수 있도록 함
    setTimeout(() => setShowDropdown(false), 150);
  };

  // 제안/최근 검색어 선택
  const handleSuggestionSelect = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
    onAddRecentSearch?.(text);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  // 최근 검색어 삭제
  const handleRemoveRecentSearch = (query: string) => {
    onRemoveRecentSearch?.(query);
  };

  // 제안 아이템 렌더링
  const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: theme.colors.outline }]}
      onPress={() => handleSuggestionSelect(item.text)}
    >
      <MaterialCommunityIcons
        name={getSuggestionIcon(item.type)}
        size={16}
        color={theme.colors.onSurfaceVariant}
        style={styles.suggestionIcon}
      />
      <Text style={[styles.suggestionText, { color: theme.colors.onSurface }]}>
        {item.text}
      </Text>
      {item.count !== undefined && (
        <Text style={[styles.suggestionCount, { color: theme.colors.onSurfaceVariant }]}>
          {item.count}
        </Text>
      )}
    </TouchableOpacity>
  );

  // 최근 검색어 아이템 렌더링
  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.recentItem, { borderBottomColor: theme.colors.outline }]}
      onPress={() => handleSuggestionSelect(item)}
    >
      <MaterialCommunityIcons
        name="history"
        size={16}
        color={theme.colors.onSurfaceVariant}
        style={styles.suggestionIcon}
      />
      <Text style={[styles.suggestionText, { color: theme.colors.onSurface }]}>
        {item}
      </Text>
      <TouchableOpacity
        onPress={() => handleRemoveRecentSearch(item)}
        style={styles.removeButton}
      >
        <MaterialCommunityIcons
          name="close"
          size={14}
          color={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'tag':
        return 'tag-outline';
      case 'user':
        return 'account-outline';
      case 'query':
      default:
        return 'magnify';
    }
  };


  return (
    <View style={[styles.container, style]}>
      <Searchbar
        ref={searchBarRef}
        placeholder={placeholder}
        onChangeText={handleSearchChange}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClearIconPress={handleClear}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        inputStyle={styles.searchInput}
        icon="magnify"
        clearIcon="close"
        mode="view"
        disabled={disabled}
      />

      {/* 검색 드롭다운 */}
      {showDropdown && (
        <Surface style={[styles.dropdown, { backgroundColor: theme.colors.surface }]}>
          {/* 로딩 인디케이터 */}
          {suggestionsLoading && (
            <View style={styles.loadingContainer}>
              <InlineLoadingIndicator />
              <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                검색 중...
              </Text>
            </View>
          )}

          {/* 검색 제안 */}
          {showSuggestions && currentAutoComplete.suggestions && currentAutoComplete.suggestions.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                검색 제안
              </Text>
              <FlatList
                data={currentAutoComplete.suggestions}
                renderItem={renderSuggestionItem}
              keyExtractor={(item: SearchSuggestion, index: number) => `suggestion-${index}`}
                style={styles.suggestionsList}
                nestedScrollEnabled
              />
            </>
          )}

       {/* 인기 태그 */}
          {currentAutoComplete.trending_tags && currentAutoComplete.trending_tags?.length > 0 && (
            <>
              {currentAutoComplete.suggestions && currentAutoComplete.suggestions.length > 0 && (
                <Divider style={styles.divider} />
              )}
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                인기 태그
              </Text>
            <View style={styles.tagsContainer}>
                {currentAutoComplete.trending_tags?.slice(0, 6).map((tag: { tag_id: number; name: string; usage_count?: number }, index: number) => (
                  <Chip
                    key={`trending-tag-${index}`}
                    mode="outlined"
                    compact
                    onPress={() => handleSuggestionSelect(tag.name)}
                    style={styles.tagChip}
                  >
                    #{tag.name}
                  </Chip>
                ))}
              </View>
            </>
          )}

          {/* 최근 검색어 */}
          {showRecentSearches && recentSearches.length > 0 && searchQuery.length === 0 && (
            <>
           {(currentAutoComplete.suggestions?.length > 0 || (currentAutoComplete.trending_tags?.length ?? 0) > 0) && (
                <Divider style={styles.divider} />
              )}
              <View style={styles.recentHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                  최근 검색어
                </Text>
                {onClearRecentSearches && (
                  <TouchableOpacity onPress={onClearRecentSearches}>
                    <Text style={[styles.clearAllText, { color: theme.colors.onSurfaceVariant }]}>
                      전체 삭제
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <FlatList
                data={recentSearches.slice(0, 5)}
                renderItem={renderRecentSearchItem}
               keyExtractor={(item: string, index: number) => `recent-${index}`}
                style={styles.recentList}
                nestedScrollEnabled
              />
            </>
          )}

          {/* 빈 상태 */}
          {!suggestionsLoading && 
           searchQuery.length > 0 && 
           (!currentAutoComplete.suggestions || currentAutoComplete.suggestions.length === 0) && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color={theme.colors.onSurfaceVariant}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                검색 결과가 없습니다
              </Text>
            </View>
          )}
        </Surface>
      )}
    </View>
  );
};

// 고급 검색 바 컴포넌트
export const AdvancedSearchBar: React.FC<SearchBarProps & {
  showFilters?: boolean;
  onFilterPress?: () => void;
  activeFiltersCount?: number;
}> = ({ 
  showFilters = true, 
  onFilterPress, 
  activeFiltersCount = 0, 
  ...props 
}) => {
  const theme = useTheme();

  return (
    <View style={styles.advancedContainer}>
      <View style={styles.searchContainer}>
        <ComfortWallSearchBar {...props} style={styles.advancedSearchBar} />
        {showFilters && (
          <IconButton
            icon="tune"
            size={20}
            onPress={onFilterPress}
            style={[
              styles.filterButton,
              { backgroundColor: theme.colors.surfaceVariant }
            ]}
          />
        )}
      </View>
      
      {/* 활성 필터 표시 */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Chip
            mode="flat"
            compact
            icon="filter"
            onPress={onFilterPress}
            style={[styles.activeFiltersChip, { backgroundColor: theme.colors.primaryContainer }]}
          >
            {activeFiltersCount}개 필터 적용
          </Chip>
        </View>
      )}
    </View>
  );
};

// 간단한 검색 바 (헤더용)
export const SimpleSearchBar: React.FC<{
  placeholder?: string;
  onSearch: (query: string) => void;
  style?: any;
}> = ({ placeholder = '검색...', onSearch, style }) => {
  const [query, setQuery] = useState('');
  const theme = useTheme();

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={setQuery}
      value={query}
      onSubmitEditing={handleSearch}
      style={[
        styles.simpleSearchBar,
        { backgroundColor: theme.colors.surfaceVariant },
        style
      ]}
      inputStyle={styles.simpleSearchInput}
      iconColor={theme.colors.onSurfaceVariant}
      mode="bar"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  searchBar: {
    elevation: 0,
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 16,
    lineHeight: 24,
  },
  
  // 드롭다운 스타일
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 300,
    borderRadius: 12,
    elevation: 4,
    zIndex: 1000,
  },
  
  // 섹션 제목
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  
  // 제안 목록
  suggestionsList: {
    maxHeight: 120,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
  },
  suggestionCount: {
    fontSize: 12,
    opacity: 0.6,
  },
  
  // 태그 컨테이너
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tagChip: {
    marginRight: 6,
    marginBottom: 4,
  },
  
  // 최근 검색어
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  clearAllText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  recentList: {
    maxHeight: 120,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  removeButton: {
    padding: 4,
  },
  
  // 구분선
  divider: {
    marginVertical: 8,
  },
  
  // 로딩
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
  },
  
  // 빈 상태
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    marginBottom: 8,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 12,
    opacity: 0.7,
  },
  
  // 고급 검색 바
  advancedContainer: {
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advancedSearchBar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    margin: 0,
  },
  activeFiltersContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  activeFiltersChip: {
    alignSelf: 'flex-start',
  },
  
  // 간단한 검색 바
  simpleSearchBar: {
    elevation: 0,
    borderRadius: 20,
    height: 40,
  },
  simpleSearchInput: {
    fontSize: 13,
  },
});

export default ComfortWallSearchBar;