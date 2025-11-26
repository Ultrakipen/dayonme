import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, StatusBar } from 'react-native';
import { useModernTheme } from '../hooks/useModernTheme';
import { SendTab } from './EncouragementScreen/SendTab';
import { ReceivedTab } from './EncouragementScreen/ReceivedTab';
import { FONT_SIZES } from '../constants';

const EncouragementScreen: React.FC = () => {
  const { colors } = useModernTheme();
  const { width: screenWidth } = useWindowDimensions();

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
      paddingTop: 16 * scale,
      paddingBottom: 0,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
      fontSize: FONT_SIZES.h1 * scale,
      fontWeight: '700',
      paddingHorizontal: 20 * scale,
      marginBottom: 16 * scale,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20 * scale,
    },
    tab: {
      flex: 1,
      paddingVertical: 12 * scale,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: FONT_SIZES.body * scale,
      fontWeight: '600',
    },
  }), [scale]);

  const [activeTab, setActiveTab] = useState<'received' | 'send'>('received');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>익명 메시지</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'received' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'received' ? colors.primary : colors.textSecondary }
            ]}>
              받은 메시지
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'send' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('send')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'send' ? colors.primary : colors.textSecondary }
            ]}>
              보내기
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'received' ? <ReceivedTab /> : <SendTab />}
    </View>
  );
};

export default EncouragementScreen;
