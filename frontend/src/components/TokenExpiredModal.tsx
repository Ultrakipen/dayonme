import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../contexts/ModernThemeContext';

interface TokenExpiredModalProps {
  visible: boolean;
  onRetry: () => void;
  onLogin: () => void;
}

// React Native 0.80 호환성: lazy 초기화
const getWidth = () => {
  try {
    const w = Dimensions.get('window').width;
    if (w > 0) return w;
  } catch (e) {}
  return 360;
};

const TokenExpiredModal: React.FC<TokenExpiredModalProps> = ({
  visible,
  onRetry,
  onLogin,
}) => {
  const { colors, isDark } = useModernTheme();
  const width = getWidth();
  
  const dynamicStyles = {
    overlay: {
      ...styles.overlay,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
    },
    container: {
      ...styles.container,
      backgroundColor: colors.BACKGROUND,
    },
    iconWrapper: {
      ...styles.iconWrapper,
      backgroundColor: isDark ? '#312e81' : '#f0f4ff',
    },
    title: {
      ...styles.title,
      color: colors.TEXT_PRIMARY,
    },
    description: {
      ...styles.description,
      color: colors.TEXT_SECONDARY,
    },
    retryButton: {
      ...styles.retryButton,
      backgroundColor: isDark ? colors.SURFACE : '#f8fafc',
      borderColor: colors.BORDER,
    },
    retryButtonText: {
      ...styles.retryButtonText,
      color: colors.TEXT_PRIMARY,
    },
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.container}>
          <View style={styles.iconContainer}>
            <View style={dynamicStyles.iconWrapper}>
              <MaterialCommunityIcons name="clock-outline" size={52} color="#8B5CF6" />
            </View>
          </View>
          
          <Text style={dynamicStyles.title}>세션이 만료되었어요</Text>
          
          <Text style={dynamicStyles.description}>
            보안을 위해 자동으로 로그아웃되었습니다.{'\n'}
            계속 사용하려면 다시 로그인해 주세요.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, dynamicStyles.retryButton]} 
              onPress={onRetry}
            >
              <Text style={dynamicStyles.retryButtonText}>재시도</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.loginButton]} 
              onPress={onLogin}
            >
              <Text style={styles.loginButtonText}>다시 로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 더 부드러운 오버레이
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24, // 더 넓은 여백
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // 더 둥근 모서리
    padding: 32, // 더 넓은 패딩
    width: width * 0.9, // 더 넓은 너비
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8, // 더 깊은 그림자
    },
    shadowOpacity: 0.15, // 부드러운 그림자
    shadowRadius: 32,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff', // 부드러운 배경
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24, // 더 큰 제목
    fontFamily: 'Pretendard-Bold', // 더 굵은 폰트
    color: '#1f2937', // 더 진한 색상
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16, // 더 큰 설명 텍스트
    color: '#6b7280', // 현대적인 회색
    lineHeight: 24, // 더 넓은 행간
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16, // 더 넓은 버튼 간격
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 16, // 더 높은 버튼
    borderRadius: 16, // 더 둥근 버튼
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  retryButton: {
    backgroundColor: '#f8fafc', // 더 부드러운 배경
    borderWidth: 1.5,
    borderColor: '#e2e8f0', // 현대적인 경계선
  },
  loginButton: {
    backgroundColor: '#8B5CF6', // 앱 브랜드 컬러
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold', // 더 굵은 텍스트
    color: '#374151', // 더 진한 회색
    letterSpacing: -0.2,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold', // 더 굵은 텍스트
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default TokenExpiredModal;