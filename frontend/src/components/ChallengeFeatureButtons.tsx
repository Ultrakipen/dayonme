// components/ChallengeFeatureButtons.tsx
// 챌린지 상세 화면에 추가할 3대 기능 버튼 컴포넌트

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useModernTheme } from '../contexts/ModernThemeContext';
import AnonymousEncouragementSystem from './AnonymousEncouragementSystem';
import EmotionGrowthCard from './EmotionGrowthCard';

const getScreenWidth = () => Dimensions.get('window').width;
const BASE_WIDTH = 360;

interface ChallengeFeatureButtonsProps {
  challengeId: number;
  completionId?: number; // 완주 시에만 전달
  isParticipant?: boolean;
}

const ChallengeFeatureButtons: React.FC<ChallengeFeatureButtonsProps> = ({
  challengeId,
  completionId,
  isParticipant = false,
}) => {
  const navigation = useNavigation<any>();
  const { isDark } = useModernTheme();
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [showCompletionCard, setShowCompletionCard] = useState(false);

  const scale = useMemo(() => {
    const screenWidth = getScreenWidth();
    return Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.3);
  }, []);

  const colors = useMemo(() => ({
    background: isDark ? '#121212' : '#ffffff',
    card: isDark ? '#1e1e1e' : '#f8f9fa',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    primary: isDark ? '#667eea' : '#764ba2',
    border: isDark ? '#333333' : '#e0e0e0',
  }), [isDark]);

  // 감정 리포트로 이동
  const handleGoToReport = useCallback(() => {
    navigation.navigate('EmotionReport');
  }, [navigation]);

  // 참여자가 아니면 버튼 표시 안함
  if (!isParticipant) return null;

  return (
    <>
      {/* 기능 버튼들 - 한 줄 배치용 */}
      <View style={styles.buttonsRow}>
          {/* 익명 응원 버튼 - 흰색 배경 */}
          <TouchableOpacity
            style={[
              styles.featureButton,
              {
                backgroundColor: isDark ? '#2a2a2a' : '#FFFFFF',
                paddingVertical: 8 * scale,
                paddingHorizontal: 8 * scale,
                borderRadius: 12 * scale,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              }
            ]}
            onPress={() => setShowEncouragement(true)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 * scale, marginBottom: 2 * scale }}>💝</Text>
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: 10 * scale, fontFamily: 'Pretendard-SemiBold' }]}>
              익명응원
            </Text>
          </TouchableOpacity>

          {/* 감정 리포트 버튼 - 흰색 배경 */}
          <TouchableOpacity
            style={[
              styles.featureButton,
              {
                backgroundColor: isDark ? '#2a2a2a' : '#FFFFFF',
                paddingVertical: 8 * scale,
                paddingHorizontal: 8 * scale,
                borderRadius: 12 * scale,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              }
            ]}
            onPress={handleGoToReport}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 * scale, marginBottom: 2 * scale }}>📊</Text>
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: 10 * scale, fontFamily: 'Pretendard-SemiBold' }]}>
              감정리포트
            </Text>
          </TouchableOpacity>

          {/* 완주 카드 버튼 (완주 시에만) - 흰색 배경 */}
          {completionId && (
            <TouchableOpacity
              style={[
                styles.featureButton,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#FFFFFF',
                  padding: 16 * scale,
                  borderRadius: 16 * scale,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 215, 0, 0.3)',
                }
              ]}
              onPress={() => setShowCompletionCard(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 28 * scale, marginBottom: 6 * scale }}>🏆</Text>
              <Text style={[styles.buttonLabel, { color: isDark ? '#FFD700' : '#B8860B', fontSize: 13 * scale, fontFamily: 'Pretendard-SemiBold' }]}>
                완주 카드
              </Text>
            </TouchableOpacity>
          )}
      </View>

      {/* 익명 응원 모달 */}
      <Modal
        visible={showEncouragement}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEncouragement(false)}
      >
        <AnonymousEncouragementSystem
          challengeId={challengeId}
          visible={true}
          onClose={() => setShowEncouragement(false)}
          mode="both"
        />
      </Modal>

      {/* 완주 카드 모달 */}
      {completionId && (
        <Modal
          visible={showCompletionCard}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowCompletionCard(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <View style={styles.cardModalContent}>
              <TouchableOpacity
                style={[styles.closeModalButton, { top: 16 * scale, right: 16 * scale }]}
                onPress={() => setShowCompletionCard(false)}
              >
                <Text style={[styles.closeModalText, { color: '#fff', fontSize: 28 * scale }]}>×</Text>
              </TouchableOpacity>
              <EmotionGrowthCard
                completionId={completionId}
                onShare={() => setShowCompletionCard(false)}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {},
  sectionTitle: {
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.3,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  featureButton: {
    alignItems: 'center',
    flex: 1,
    minWidth: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonLabel: {
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardModalContent: {
    width: '90%',
    maxWidth: 400,
  },
  closeModalButton: {
    position: 'absolute',
    zIndex: 10,
    padding: 8,
  },
  closeModalText: {
    fontFamily: 'Pretendard-Light',
  },
});

export default React.memo(ChallengeFeatureButtons);
