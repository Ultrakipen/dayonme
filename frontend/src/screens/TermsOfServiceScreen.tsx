// src/screens/TermsOfServiceScreen.tsx
// 서비스 이용약관 화면
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../contexts/ModernThemeContext';

const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // 반응형 스케일링
  const BASE_WIDTH = 360;
  const scaleFont = (size: number) => {
    const scale = Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.3);
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  };

  const colors = useMemo(() => ({
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    border: theme.colors.border,
    accent: theme.colors.primary,
  }), [theme]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: scaleFont(18),
      fontWeight: '700',
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    lastUpdated: {
      fontSize: scaleFont(12),
      color: colors.textSecondary,
      marginBottom: 24,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: scaleFont(16),
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    paragraph: {
      fontSize: scaleFont(14),
      color: colors.textSecondary,
      lineHeight: scaleFont(22),
      marginBottom: 12,
    },
    listItem: {
      fontSize: scaleFont(14),
      color: colors.textSecondary,
      lineHeight: scaleFont(22),
      marginBottom: 8,
      paddingLeft: 16,
    },
  }), [colors, scaleFont]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>서비스 이용약관</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 내용 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>최종 업데이트: 2025년 12월 1일</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제1조 (목적)</Text>
          <Text style={styles.paragraph}>
            이 약관은 Dayonme(이하 "서비스")가 제공하는 모바일 애플리케이션 및 관련 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제2조 (정의)</Text>
          <Text style={styles.listItem}>• "서비스"란 회사가 제공하는 감정 기록, 소통, 챌린지 등 모든 서비스를 의미합니다.</Text>
          <Text style={styles.listItem}>• "회원"이란 서비스에 가입하여 이용하는 자를 의미합니다.</Text>
          <Text style={styles.listItem}>• "콘텐츠"란 회원이 서비스 내에서 작성한 게시물, 댓글, 이미지 등을 의미합니다.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제3조 (서비스 이용)</Text>
          <Text style={styles.paragraph}>
            1. 서비스 이용은 회원가입 후 가능하며, 일부 기능은 비회원도 이용할 수 있습니다.
          </Text>
          <Text style={styles.paragraph}>
            2. 회원은 서비스 이용 시 관련 법령, 본 약관, 운영정책 등을 준수해야 합니다.
          </Text>
          <Text style={styles.paragraph}>
            3. 서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제4조 (회원의 의무)</Text>
          <Text style={styles.listItem}>• 타인의 개인정보를 도용하지 않아야 합니다.</Text>
          <Text style={styles.listItem}>• 서비스를 이용하여 법령 또는 공서양속에 반하는 행위를 하지 않아야 합니다.</Text>
          <Text style={styles.listItem}>• 타인의 명예를 훼손하거나 모욕하는 행위를 하지 않아야 합니다.</Text>
          <Text style={styles.listItem}>• 음란, 폭력적인 콘텐츠를 게시하지 않아야 합니다.</Text>
          <Text style={styles.listItem}>• 서비스의 운영을 방해하는 행위를 하지 않아야 합니다.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제5조 (서비스 제공의 중지)</Text>
          <Text style={styles.paragraph}>
            회사는 다음 각 호에 해당하는 경우 서비스 제공을 중지할 수 있습니다.
          </Text>
          <Text style={styles.listItem}>• 서비스용 설비의 보수 등 공사로 인한 부득이한 경우</Text>
          <Text style={styles.listItem}>• 전기통신사업법에 규정된 기간통신사업자가 전기통신 서비스를 중지했을 경우</Text>
          <Text style={styles.listItem}>• 국가비상사태, 정전, 서비스 설비의 장애 등 불가항력적 사유가 있는 경우</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제6조 (저작권)</Text>
          <Text style={styles.paragraph}>
            1. 회원이 서비스 내에 게시한 콘텐츠의 저작권은 해당 회원에게 귀속됩니다.
          </Text>
          <Text style={styles.paragraph}>
            2. 회사는 서비스의 운영, 전시, 홍보 등의 목적으로 회원의 콘텐츠를 사용할 수 있습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제7조 (면책조항)</Text>
          <Text style={styles.paragraph}>
            1. 회사는 천재지변, 불가항력적 사유로 인한 서비스 제공 불가에 대해 책임을 지지 않습니다.
          </Text>
          <Text style={styles.paragraph}>
            2. 회사는 회원 간 또는 회원과 제3자 간의 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해에 대해 책임을 지지 않습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제8조 (분쟁해결)</Text>
          <Text style={styles.paragraph}>
            본 약관에서 정하지 않은 사항과 이 약관의 해석에 관해서는 관계법령 및 상관례에 따릅니다. 서비스 이용으로 발생한 분쟁에 대해서는 대한민국 법원을 관할 법원으로 합니다.
          </Text>
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>부칙</Text>
          <Text style={styles.paragraph}>
            본 약관은 2025년 12월 1일부터 시행합니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default TermsOfServiceScreen;
