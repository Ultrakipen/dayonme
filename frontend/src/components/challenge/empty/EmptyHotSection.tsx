import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS as COLORS } from '../../../constants/challenge';

interface EmptyHotSectionProps {
  isDarkMode?: boolean;
}

export const EmptyHotSection = memo<EmptyHotSectionProps>(({ isDarkMode = false }) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="fire-off" size={48} color={COLORS.textSecondary} />
      <Text style={[styles.text, { color: isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary }]}>
        아직 HOT 챌린지가 없습니다
      </Text>
    </View>
  );
});

EmptyHotSection.displayName = 'EmptyHotSection';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: -0.2,
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
});
