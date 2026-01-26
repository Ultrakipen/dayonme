import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, StatusBar } from 'react-native';
import { useNavigation, NavigationProp, CommonActions, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../hooks/useModernTheme';
import { SendTab } from './EncouragementScreen/SendTab';
import { ReceivedTab } from './EncouragementScreen/ReceivedTab';
import { FONT_SIZES } from '../constants';

const EncouragementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute<any>();
  const { colors } = useModernTheme();
  const { width: screenWidth } = useWindowDimensions();

  const handleGoBack = () => {
    const fromScreen = route.params?.from;

    // Home에서 온 경우 Home 탭으로 이동
    if (fromScreen === 'Home') {
      navigation.navigate('Home' as never);
      return;
    }

    // 알림에서 온 경우도 처리
    if (fromScreen === 'Notification') {
      navigation.navigate('Home' as never);
      return;
    }

    // 일반적인 경우: 이전 화면으로
    const state = navigation.getState();
    if (navigation.canGoBack() && state.routes.length > 1) {
      navigation.goBack();
    } else {
      // ProfileStack의 첫 화면이면 ProfileMain으로 이동
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'ProfileMain' }],
        })
      );
    }
  };

  const scale = useMemo(() => {
    const BASE_WIDTH = 360;
    const ratio = screenWidth / BASE_WIDTH;
    if (screenWidth >= 480) return Math.min(ratio, 1.5);
    if (screenWidth >= 390) return Math.min(ratio, 1.3);
    return Math.max(0.85, Math.min(ratio, 1.1));
  }, [screenWidth]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
      paddingTop: 4 * scale,
      paddingBottom: 0,
      overflow: 'hidden',
    },
    headerGradient: {
      paddingBottom: 4 * scale,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16 * scale,
      marginBottom: 16 * scale,
    },
    backButton: {
      width: 40 * scale,
      height: 40 * scale,
      borderRadius: 20 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12 * scale,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: FONT_SIZES.h3 * scale,
      fontFamily: 'Pretendard-Bold',
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: FONT_SIZES.bodySmall * scale,
      fontFamily: 'Pretendard-Medium',
      marginTop: 4 * scale,
      opacity: 0.6,
      letterSpacing: -0.1,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16 * scale,
      gap: 8 * scale,
    },
    tab: {
      flex: 1,
      paddingVertical: 16 * scale,
      alignItems: 'center',
      borderRadius: 14 * scale,
    },
    activeTab: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    tabText: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      fontFamily: 'Pretendard-SemiBold',
      letterSpacing: 0.1,
    },
    tabTextActive: {
      fontFamily: 'Pretendard-Bold',
      letterSpacing: -0.1,
    },
    tabTextInactive: {
      fontFamily: 'Pretendard-Medium',
      opacity: 0.5,
    },
  }), [scale]);

  const [activeTab, setActiveTab] = useState<'received' | 'send'>('received');

  const isDark = colors.background === '#000000' || colors.background === '#121212';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerGradient, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.background }]}
              onPress={handleGoBack}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                따뜻한 한마디
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                💌 마음을 전하는 공간
              </Text>
            </View>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'received' && styles.activeTab,
                { backgroundColor: activeTab === 'received' ? colors.primary : colors.background }
              ]}
              onPress={() => setActiveTab('received')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'received' ? styles.tabTextActive : styles.tabTextInactive,
                { color: activeTab === 'received' ? '#FFFFFF' : colors.textSecondary }
              ]}>
                받은 메시지
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'send' && styles.activeTab,
                { backgroundColor: activeTab === 'send' ? colors.primary : colors.background }
              ]}
              onPress={() => setActiveTab('send')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'send' ? styles.tabTextActive : styles.tabTextInactive,
                { color: activeTab === 'send' ? '#FFFFFF' : colors.textSecondary }
              ]}>
                보내기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {activeTab === 'received' ? <ReceivedTab /> : <SendTab />}
    </View>
  );
};

export default EncouragementScreen;
