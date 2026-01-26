// ComfortScreen 검색 모드 컴포넌트
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface SearchModeProps {
  isDark: boolean;
  theme: any;
  currentSearchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onExit: () => void;
}

const POPULAR_SEARCHES = ['위로', '공감', '마음챙김', '일상', '고민'];
const RECOMMENDED_TAGS = ['#힐링', '#응원', '#감사', '#성장', '#사랑', '#희망'];

const SearchMode: React.FC<SearchModeProps> = ({
  isDark,
  theme,
  currentSearchQuery,
  onSearchQueryChange,
  onSearch,
  onExit,
}) => {
  const colors = {
    background: isDark ? '#1A1A2E' : '#FFFFFF',
    card: isDark ? '#2D2D44' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    primary: '#6366F1',
    border: isDark ? '#3D3D5C' : '#E0E0E0',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* 검색 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onExit} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="제목, 내용으로 검색..."
            placeholderTextColor={colors.textSecondary}
            value={currentSearchQuery}
            onChangeText={onSearchQueryChange}
            onSubmitEditing={() => {
              if (currentSearchQuery.trim().length > 0) {
                onSearch(currentSearchQuery.trim());
              }
            }}
            autoFocus
            returnKeyType="search"
          />
          {currentSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchQueryChange('')} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {/* 검색 버튼 */}
        <TouchableOpacity
          onPress={() => {
            if (currentSearchQuery.trim().length > 0) {
              onSearch(currentSearchQuery.trim());
            }
          }}
          style={[styles.searchButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 컨텐츠 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 인기 검색어 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            인기 검색어
          </Text>
          {POPULAR_SEARCHES.map((item, index) => (
            <TouchableOpacity
              key={`popular-${index}`}
              style={[styles.popularItem, { backgroundColor: colors.card }]}
              onPress={() => {
                onSearchQueryChange(item);
                onSearch(item);
              }}
            >
              <Text style={[styles.popularRank, { color: colors.primary }]}>
                {index + 1}
              </Text>
              <Text style={[styles.popularText, { color: colors.text }]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 추천 태그 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            추천 태그
          </Text>
          <View style={styles.tagsContainer}>
            {RECOMMENDED_TAGS.map((tag, index) => (
              <TouchableOpacity
                key={`tag-${index}`}
                style={[styles.tagButton, {
                  backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
                  borderColor: colors.primary,
                }]}
                onPress={() => {
                  onSearchQueryChange(tag);
                  onSearch(tag);
                }}
              >
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
    marginLeft: 10,
    paddingVertical: 0,
  },
  searchButton: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 16,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  popularRank: {
    width: 28,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
  },
  popularText: {
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
  },
});

export default SearchMode;
