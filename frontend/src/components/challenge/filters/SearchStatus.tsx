import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS as COLORS } from '../../../constants/challenge';
import { useModernTheme } from '../../../contexts/ModernThemeContext';

interface SearchStatusProps {
  query: string;
  resultCount: number;
  onClear: () => void;
}

export const SearchStatus = memo<SearchStatusProps>(({
  query,
  resultCount,
  onClear,
}) => {
  const { theme } = useModernTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.bg.surface,
        borderBottomColor: theme.bg.border
      }
    ]}>
      <Text style={[
        styles.text,
        { color: theme.text.primary }
      ]}>
        '{query}' 검색 결과 ({resultCount}개)
      </Text>
      <TouchableOpacity onPress={onClear} style={styles.clearButton}>
        <MaterialCommunityIcons
          name="close"
          size={18}
          color={theme.text.secondary}
        />
      </TouchableOpacity>
    </View>
  );
});

SearchStatus.displayName = 'SearchStatus';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    letterSpacing: -0.1,
  },
  clearButton: {
    padding: 4,
  },
});
