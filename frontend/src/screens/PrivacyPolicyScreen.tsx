import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../contexts/ModernThemeContext';

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // 🔥 반응형 스케일링 함수 (동적)
  const BASE_WIDTH = 360;
  const DESIGN_WIDTH = 1080;
  const DESIGN_HEIGHT = 2340;

  const scaleWidth = (size: number) => (screenWidth / DESIGN_WIDTH) * size;
  const scaleHeight = (size: number) => (screenHeight / DESIGN_HEIGHT) * size;
  const scaleFont = (size: number) => {
    const scale = Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.3);
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  const colors = useMemo(() => ({
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    border: theme.colors.border,
    headerBg: theme.colors.background,
    headerText: theme.colors.text.primary,
    accent: theme.colors.primary,
    cardBg: theme.colors.surface,
  }), [theme, isDark]);

  // 🔥 스타일 객체도 동적 생성
  const dynamicStyles = useMemo(() => StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      flex: 1,
      fontSize: scaleFont(20),
      fontWeight: '700',
      textAlign: 'center',
      marginHorizontal: scaleWidth(16),
      letterSpacing: -0.3,
    },
    contentContainer: {
      padding: scaleWidth(24),
      paddingBottom: scaleHeight(24),
      paddingTop: scaleHeight(32),
    },
    updateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: scaleWidth(14),
      borderRadius: scaleWidth(12),
      borderWidth: 1,
      marginBottom: scaleHeight(24),
      gap: scaleWidth(10),
    },
    updateText: {
      fontSize: scaleFont(15),
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    section: {
      padding: scaleWidth(24),
      borderRadius: scaleWidth(16),
      borderWidth: 1,
      marginBottom: scaleHeight(24),
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: scaleHeight(20),
      gap: scaleWidth(14),
    },
    numberBadge: {
      width: scaleWidth(36),
      height: scaleWidth(36),
      borderRadius: scaleWidth(18),
      justifyContent: 'center',
      alignItems: 'center',
    },
    numberText: {
      color: colors.background,
      fontSize: scaleFont(17),
      fontWeight: '700',
    },
    sectionTitle: {
      fontSize: scaleFont(19),
      fontWeight: '700',
      flex: 1,
      letterSpacing: -0.3,
      lineHeight: scaleFont(30),
    },
    subTitle: {
      fontSize: scaleFont(17),
      fontWeight: '700',
      marginTop: scaleHeight(18),
      marginBottom: scaleHeight(12),
      letterSpacing: -0.2,
    },
    paragraph: {
      fontSize: scaleFont(16),
      lineHeight: scaleFont(28),
      marginBottom: scaleHeight(16),
      letterSpacing: -0.2,
    },
    bulletList: {
      marginTop: scaleHeight(12),
      marginBottom: scaleHeight(14),
    },
    bulletItem: {
      fontSize: scaleFont(16),
      lineHeight: scaleFont(28),
      marginBottom: scaleHeight(10),
      paddingLeft: scaleWidth(10),
      letterSpacing: -0.2,
    },
    contactBox: {
      padding: scaleWidth(20),
      borderRadius: scaleWidth(12),
      borderWidth: 1,
      marginTop: scaleHeight(16),
      gap: scaleHeight(16),
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scaleWidth(12),
    },
    contactLabel: {
      fontSize: scaleFont(16),
      fontWeight: '600',
      width: scaleWidth(70),
      letterSpacing: -0.2,
    },
    contactValue: {
      fontSize: scaleFont(16),
      flex: 1,
      letterSpacing: -0.2,
    },
  }), [screenWidth, screenHeight]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'light-content'}
        backgroundColor={colors.headerBg}
        translucent={false}
      />

      <View style={[dynamicStyles.header, { backgroundColor: colors.headerBg, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="뒤로 가기"
          accessibilityHint="이전 화면으로 돌아갑니다"
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={28} color={colors.headerText} />
        </TouchableOpacity>
        <Text style={[dynamicStyles.headerTitle, { color: colors.headerText }]}>개인정보 처리방침</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={dynamicStyles.contentContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={21}
      >
        <View style={[dynamicStyles.updateBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="calendar-outline" size={18} color={colors.textSecondary} />
          <Text style={[dynamicStyles.updateText, { color: colors.textSecondary }]}>
            최종 업데이트: 2025년 12월 1일
          </Text>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>개인정보 처리방침</Text>
          <Text style={[dynamicStyles.paragraph, { color: colors.textSecondary }]}>
            Dayonme 앱(이하 "회사")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」을 준수하고 있습니다.
            회사는 개인정보 처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
            개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
          </Text>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={dynamicStyles.sectionHeader}>
            <View style={[dynamicStyles.numberBadge, { backgroundColor: colors.accent }]}>
              <Text style={dynamicStyles.numberText}>1</Text>
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>수집하는 개인정보 항목</Text>
          </View>

          <Text style={[dynamicStyles.subTitle, { color: colors.text }]}>필수 수집 항목</Text>
          <View style={dynamicStyles.bulletList}>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• 이메일 주소</Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• 닉네임</Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• 비밀번호 (암호화 저장)</Text>
          </View>

          <Text style={[dynamicStyles.subTitle, { color: colors.text }]}>선택 수집 항목</Text>
          <View style={dynamicStyles.bulletList}>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• 프로필 이미지</Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• 명언/소개 문구</Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• 알림 설정 정보</Text>
          </View>

          <Text style={[dynamicStyles.subTitle, { color: colors.text }]}>자동 수집 항목</Text>
          <View style={dynamicStyles.bulletList}>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• IP 주소</Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• 접속 로그</Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• 기기 정보 (OS, 버전)</Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>• 서비스 이용 기록</Text>
          </View>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={dynamicStyles.sectionHeader}>
            <View style={[dynamicStyles.numberBadge, { backgroundColor: colors.accent }]}>
              <Text style={dynamicStyles.numberText}>2</Text>
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>개인정보 수집 및 이용 목적</Text>
          </View>

          <View style={dynamicStyles.bulletList}>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 회원 가입 및 관리: 회원 가입 의사 확인, 회원제 서비스 제공, 본인 확인
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 서비스 제공: 감정 기록 저장, 통계 제공, 커뮤니티 기능 제공
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 서비스 개선: 신규 서비스 개발, 맞춤형 서비스 제공
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 부정 이용 방지: 부정 이용 방지, 비인가 사용 방지, 법적 의무 준수
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 고객 지원: 문의 응대, 공지사항 전달, 불만 처리
            </Text>
          </View>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={dynamicStyles.sectionHeader}>
            <View style={[dynamicStyles.numberBadge, { backgroundColor: colors.accent }]}>
              <Text style={dynamicStyles.numberText}>3</Text>
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>개인정보 보유 및 이용 기간</Text>
          </View>

          <Text style={[dynamicStyles.paragraph, { color: colors.textSecondary }]}>
            회사는 이용자의 개인정보를 회원 가입 시부터 서비스를 제공하는 기간 동안 보유 및 이용합니다.
            회원 탈퇴 시 지체 없이 파기하며, 다음의 경우 명시한 기간 동안 보존합니다.
          </Text>

          <Text style={[dynamicStyles.subTitle, { color: colors.text }]}>법령에 따른 보존</Text>
          <View style={dynamicStyles.bulletList}>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 웹사이트 방문 기록: 3개월 (통신비밀보호법)
            </Text>
          </View>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={dynamicStyles.sectionHeader}>
            <View style={[dynamicStyles.numberBadge, { backgroundColor: colors.accent }]}>
              <Text style={dynamicStyles.numberText}>4</Text>
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>개인정보 제3자 제공</Text>
          </View>

          <Text style={[dynamicStyles.paragraph, { color: colors.textSecondary }]}>
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 아래의 경우에는 예외로 합니다.
          </Text>
          <View style={dynamicStyles.bulletList}>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 이용자가 사전에 동의한 경우
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
            </Text>
          </View>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={dynamicStyles.sectionHeader}>
            <View style={[dynamicStyles.numberBadge, { backgroundColor: colors.accent }]}>
              <Text style={dynamicStyles.numberText}>5</Text>
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>개인정보 처리 위탁</Text>
          </View>

          <Text style={[dynamicStyles.paragraph, { color: colors.textSecondary }]}>
            회사는 서비스 향상을 위해 아래와 같이 개인정보를 위탁하고 있으며,
            관계 법령에 따라 위탁 계약 시 개인정보가 안전하게 관리될 수 있도록 규정하고 있습니다.
          </Text>
          <View style={dynamicStyles.bulletList}>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 서버 호스팅: AWS (Amazon Web Services)
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 이메일 발송: 이메일 발송 대행 업체
            </Text>
          </View>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={dynamicStyles.sectionHeader}>
            <View style={[dynamicStyles.numberBadge, { backgroundColor: colors.accent }]}>
              <Text style={dynamicStyles.numberText}>6</Text>
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>이용자의 권리와 행사 방법</Text>
          </View>

          <Text style={[dynamicStyles.paragraph, { color: colors.textSecondary }]}>
            이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.
          </Text>
          <View style={dynamicStyles.bulletList}>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 개인정보 열람 요구
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 개인정보 정정 요구
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 개인정보 삭제 요구
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 개인정보 처리 정지 요구
            </Text>
          </View>
          <Text style={[dynamicStyles.paragraph, { color: colors.textSecondary }]}>
            위 권리 행사는 앱 내 설정 메뉴 또는 고객센터를 통해 가능합니다.
          </Text>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={dynamicStyles.sectionHeader}>
            <View style={[dynamicStyles.numberBadge, { backgroundColor: colors.accent }]}>
              <Text style={dynamicStyles.numberText}>7</Text>
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>개인정보 파기 절차 및 방법</Text>
          </View>

          <Text style={[dynamicStyles.subTitle, { color: colors.text }]}>파기 절차</Text>
          <Text style={[dynamicStyles.paragraph, { color: colors.textSecondary }]}>
            이용자의 개인정보는 목적 달성 후 즉시 파기됩니다.
            법령에 따라 보존해야 하는 경우에는 별도의 데이터베이스로 옮겨져 안전하게 보관됩니다.
          </Text>

          <Text style={[dynamicStyles.subTitle, { color: colors.text }]}>파기 방법</Text>
          <View style={dynamicStyles.bulletList}>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 전자적 파일: 복구 불가능한 방법으로 영구 삭제
            </Text>
            <Text style={[dynamicStyles.bulletItem, { color: colors.textSecondary }]}>
              • 종이 문서: 분쇄 또는 소각
            </Text>
          </View>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={dynamicStyles.sectionHeader}>
            <View style={[dynamicStyles.numberBadge, { backgroundColor: colors.accent }]}>
              <Text style={dynamicStyles.numberText}>8</Text>
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>개인정보 보호책임자</Text>
          </View>

          <Text style={[dynamicStyles.paragraph, { color: colors.textSecondary }]}>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
            개인정보 처리와 관련한 이용자의 불만처리 및 피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </Text>

          {/* ⚠️ TODO: 실제 서비스 출시 전 아래 연락처 정보를 실제 값으로 변경 필요 */}
          <View style={[dynamicStyles.contactBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={dynamicStyles.contactRow}>
              <Icon name="person-outline" size={20} color={colors.accent} />
              <Text style={[dynamicStyles.contactLabel, { color: colors.text }]}>담당자:</Text>
              <Text style={[dynamicStyles.contactValue, { color: colors.textSecondary }]}>개인정보 보호팀</Text>
            </View>
            <View style={dynamicStyles.contactRow}>
              <Icon name="mail-outline" size={20} color={colors.accent} />
              <Text style={[dynamicStyles.contactLabel, { color: colors.text }]}>이메일:</Text>
              {/* TODO: 실제 이메일 주소로 변경 */}
              <Text style={[dynamicStyles.contactValue, { color: colors.textSecondary }]}>admin@dayonme.com</Text>
            </View>
            <View style={dynamicStyles.contactRow}>
              <Icon name="call-outline" size={20} color={colors.accent} />
              <Text style={[dynamicStyles.contactLabel, { color: colors.text }]}>전화:</Text>
              {/* TODO: 실제 전화번호로 변경 */}
              <Text style={[dynamicStyles.contactValue, { color: colors.textSecondary }]}>010-4667-9824</Text>
            </View>
          </View>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={dynamicStyles.sectionHeader}>
            <View style={[dynamicStyles.numberBadge, { backgroundColor: colors.accent }]}>
              <Text style={dynamicStyles.numberText}>9</Text>
            </View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>개인정보 처리방침 변경</Text>
          </View>

          <Text style={[dynamicStyles.paragraph, { color: colors.textSecondary }]}>
            이 개인정보 처리방침은 2025년 11월 1일부터 적용됩니다.
            법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는
            변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 48,
  },
  content: {
    flex: 1,
  },
});

export default PrivacyPolicyScreen;
