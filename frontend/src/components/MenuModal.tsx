// components/MenuModal.tsx - Instagram Style 메뉴 모달
// React Native 0.80 호환성: 모듈 레벨에서 normalize 호출 금지
import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { normalize, normalizeIcon } from '../utils/responsive';
import { useModernTheme } from '../contexts/ModernThemeContext';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSettings?: () => void;
}

// React Native 0.80 호환성: lazy 초기화
const getWindowDimensions = () => {
  try {
    const dims = Dimensions.get('window');
    if (dims.width > 0 && dims.height > 0) return dims;
  } catch (e) {}
  return { width: 360, height: 780 };
};

const MenuModal: React.FC<MenuModalProps> = ({
  visible,
  onClose,
  onLogout,
  onNavigateToProfile,
  onNavigateToSettings,
}) => {
  const { colors, isDark } = useModernTheme();
  const { width, height } = getWindowDimensions();

  // 동적 스타일 (React Native 0.80 호환)
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: normalize(13),
      borderTopRightRadius: normalize(13),
      width: width,
      paddingBottom: Platform.OS === 'ios' ? normalize(34) : normalize(20),
    },
    dragIndicator: {
      alignItems: 'center' as const,
      paddingVertical: normalize(8),
    },
    dragBar: {
      width: normalize(36),
      height: normalize(5),
      borderRadius: normalize(2.5),
      backgroundColor: '#DBDBDB',
    },
    menuItem: {
      paddingVertical: normalize(18),
      paddingHorizontal: normalize(20),
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'transparent',
    },
    cancelItem: {
      paddingVertical: normalize(18),
      paddingHorizontal: normalize(20),
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'transparent',
    },
    logoutText: {
      fontSize: normalize(14),
      fontWeight: '400' as const,
      letterSpacing: -0.3,
      textAlign: 'center' as const,
    },
    cancelText: {
      fontSize: normalize(14),
      fontWeight: '600' as const,
      letterSpacing: -0.3,
      textAlign: 'center' as const,
    },
  }), [width]);

  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  const handleLogout = () => {
    onClose();
    setTimeout(() => onLogout(), 300);
  };

  const handleProfile = () => {
    onClose();
    setTimeout(() => onNavigateToProfile?.(), 300);
  };

  const handleSettings = () => {
    onClose();
    setTimeout(() => onNavigateToSettings?.(), 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)' }]}
        onPress={onClose}
      >
        <Animated.View
          style={[
            dynamicStyles.container,
            {
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              transform: [{ translateY }]
            }
          ]}
        >
          {/* 드래그 인디케이터 */}
          <View style={dynamicStyles.dragIndicator}>
            <View style={[dynamicStyles.dragBar, { backgroundColor: isDark ? '#4B5563' : '#DBDBDB' }]} />
          </View>

          {/* 메뉴 항목들 - Instagram 스타일 */}
          <View style={styles.menuContainer}>
            {/* 로그아웃 */}
            <TouchableOpacity
              style={[dynamicStyles.menuItem, {
                borderBottomWidth: 0.5,
                borderBottomColor: isDark ? '#3A3A3C' : '#DBDBDB'
              }]}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <Text style={[dynamicStyles.logoutText, { color: '#ED4956' }]}>로그아웃</Text>
            </TouchableOpacity>

            {/* 취소 */}
            <TouchableOpacity
              style={dynamicStyles.cancelItem}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Text style={[dynamicStyles.cancelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>취소</Text>
            </TouchableOpacity>
          </View>

          {/* 하단 여백 */}
          <View style={styles.bottomSpacer} />
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// 정적 스타일만 (normalize 사용 안함)
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  menuContainer: {
    paddingHorizontal: 0,
  },
  bottomSpacer: {
    height: 0,
  },
});

export default MenuModal;
