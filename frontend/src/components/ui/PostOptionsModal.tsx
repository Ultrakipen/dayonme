import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { normalize, normalizeIcon } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import EmotionLoginPromptModal from '../EmotionLoginPromptModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PostOptionsModalProps {
  visible: boolean;
  isOwner: boolean;
  isAnonymous?: boolean;
  onShare: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onBlockPost?: () => void;
  onBlockUser?: () => void;
  onClose: () => void;
}

const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  visible,
  isOwner,
  isAnonymous = false,
  onShare,
  onEdit,
  onDelete,
  onReport,
  onBlockPost,
  onBlockUser,
  onClose,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useAuth();
  const { theme, isDark } = useModernTheme();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);

  const styles = getStyles(theme, isDark);

  const iconColor = theme.text.primary;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // 신고하기 핸들러 (로그인 필요)
  const handleReport = () => {
    if (!isAuthenticated || !user) {
      onClose(); // 옵션 모달 닫기
      setLoginPromptVisible(true);
      return;
    }
    if (onReport) {
      onReport();
    }
  };

  // 게시물 차단 핸들러 (로그인 필요)
  const handleBlockPost = () => {
    if (!isAuthenticated || !user) {
      onClose(); // 옵션 모달 닫기
      setLoginPromptVisible(true);
      return;
    }
    if (onBlockPost) {
      onBlockPost();
    }
  };

  // 사용자 차단 핸들러 (로그인 필요)
  const handleBlockUser = () => {
    if (!isAuthenticated || !user) {
      onClose(); // 옵션 모달 닫기
      setLoginPromptVisible(true);
      return;
    }
    if (onBlockUser) {
      onBlockUser();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity
          style={styles.bottomSheetBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.bottomSheetContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* 핸들 바 */}
          <View style={styles.bottomSheetHandle} />

          {/* 공유하기 */}
          <TouchableOpacity
            style={styles.bottomSheetItem}
            onPress={onShare}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="share-outline" size={normalizeIcon(24)} color={iconColor} />
            <Text style={styles.bottomSheetItemText}>공유하기</Text>
          </TouchableOpacity>

          {/* 내 글이면 수정/삭제, 아니면 신고 */}
          {isOwner ? (
            <>
              {/* 수정하기 */}
              <TouchableOpacity
                style={styles.bottomSheetItem}
                onPress={onEdit}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="pencil" size={normalizeIcon(24)} color={iconColor} />
                <Text style={styles.bottomSheetItemText}>수정하기</Text>
              </TouchableOpacity>

              {/* 삭제하기 */}
              <TouchableOpacity
                style={styles.bottomSheetItem}
                onPress={onDelete}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="delete" size={normalizeIcon(24)} color="#FF453A" />
                <Text style={[styles.bottomSheetItemText, { color: '#FF453A' }]}>삭제하기</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* 게시물 차단 */}
              {onBlockPost && (
                <TouchableOpacity
                  style={styles.bottomSheetItem}
                  onPress={handleBlockPost}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name="block-helper" size={normalizeIcon(24)} color={iconColor} />
                  <Text style={styles.bottomSheetItemText}>게시물 차단</Text>
                </TouchableOpacity>
              )}

              {/* 사용자 차단 (익명이 아닌 경우에만) */}
              {onBlockUser && !isAnonymous && (
                <TouchableOpacity
                  style={styles.bottomSheetItem}
                  onPress={handleBlockUser}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name="account-cancel" size={normalizeIcon(24)} color={iconColor} />
                  <Text style={styles.bottomSheetItemText}>사용자 차단</Text>
                </TouchableOpacity>
              )}

              {/* 신고하기 */}
              <TouchableOpacity
                style={styles.bottomSheetItem}
                onPress={handleReport}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="flag" size={normalizeIcon(24)} color="#FFD60A" />
                <Text style={[styles.bottomSheetItemText, { color: '#FFD60A' }]}>신고하기</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>

      {/* 비로그인 사용자를 위한 로그인 프롬프트 모달 */}
      <EmotionLoginPromptModal
        visible={loginPromptVisible}
        onClose={() => setLoginPromptVisible(false)}
        onLogin={() => {
          setLoginPromptVisible(false);
          navigation.navigate('Auth', { screen: 'Login' });
        }}
        onRegister={() => {
          setLoginPromptVisible(false);
          navigation.navigate('Auth', { screen: 'Register' });
        }}
        actionType="post"
      />
    </Modal>
  );
};

const getStyles = (theme: any, isDark: boolean) => {
  return StyleSheet.create({
    bottomSheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    bottomSheetBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
    },
    bottomSheetContainer: {
      backgroundColor: theme.bg.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 34,
      paddingHorizontal: 0,
      paddingTop: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: isDark ? 0.5 : 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    bottomSheetHandle: {
      width: 36,
      height: 4,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    bottomSheetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 24,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.bg.border,
    },
    bottomSheetItemText: {
      fontSize: 15.5,
      color: theme.text.primary,
      marginLeft: 18,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
  });
};

export default PostOptionsModal;
