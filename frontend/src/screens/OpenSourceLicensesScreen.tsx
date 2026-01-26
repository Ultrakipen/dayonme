import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useModernTheme } from '../contexts/ModernThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { FONT_SIZES } from '../constants';

const licenses = [
  { name: 'React Native', version: '0.80.x', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'React Navigation', version: '6.x', license: 'MIT', url: 'https://github.com/react-navigation/react-navigation' },
  { name: 'Axios', version: '1.x', license: 'MIT', url: 'https://github.com/axios/axios' },
  { name: 'React Native Vector Icons', version: '10.x', license: 'MIT', url: 'https://github.com/oblador/react-native-vector-icons' },
  { name: 'React Native Fast Image', version: '8.x', license: 'MIT', url: 'https://github.com/DylanVann/react-native-fast-image' },
  { name: 'React Native Linear Gradient', version: '2.x', license: 'MIT', url: 'https://github.com/react-native-linear-gradient/react-native-linear-gradient' },
  { name: 'Async Storage', version: '1.x', license: 'MIT', url: 'https://github.com/react-native-async-storage/async-storage' },
  { name: 'React Native Image Picker', version: '7.x', license: 'MIT', url: 'https://github.com/react-native-image-picker/react-native-image-picker' },
  { name: 'React Native Image Resizer', version: '3.x', license: 'MIT', url: 'https://github.com/bamlab/react-native-image-resizer' },
];

const OpenSourceLicensesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>오픈소스 라이선스</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          이 앱은 아래의 오픈소스 라이브러리를 사용합니다.
        </Text>

        {licenses.map((lib, index) => (
          <View key={index} style={[styles.licenseCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.licenseHeader}>
              <Text style={[styles.licenseName, { color: theme.colors.text.primary }]}>{lib.name}</Text>
              <Text style={[styles.licenseVersion, { color: theme.colors.text.secondary }]}>v{lib.version}</Text>
            </View>
            <Text style={[styles.licenseType, { color: theme.colors.primary }]}>{lib.license} License</Text>
          </View>
        ))}

        <Text style={[styles.footer, { color: theme.colors.text.tertiary }]}>
          모든 라이브러리는 각각의 라이선스 조건에 따라 사용됩니다.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: FONT_SIZES.bodyLarge, fontFamily: 'Pretendard-SemiBold' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  description: { fontSize: FONT_SIZES.body, marginBottom: 16, lineHeight: 22 },
  licenseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  licenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  licenseName: { fontSize: FONT_SIZES.body, fontFamily: 'Pretendard-SemiBold' },
  licenseVersion: { fontSize: FONT_SIZES.bodySmall },
  licenseType: { fontSize: FONT_SIZES.bodySmall, fontFamily: 'Pretendard-Medium' },
  footer: { fontSize: FONT_SIZES.caption, textAlign: 'center', marginTop: 20, lineHeight: 18 },
});

export default OpenSourceLicensesScreen;
