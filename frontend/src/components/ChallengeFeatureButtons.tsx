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
  const { isDark, theme } = useModernTheme();
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
    primary: theme.colors.primary,
    border: isDark ? '#333333' : '#e0e0e0',
  }), [isDark, theme]);

  // 감정 리포트로 이동
  const handleGoToReport = useCallback(() => {
    navigation.navigate('EmotionReport');
  }, [navigation]);

  // 참여자가 아니면 버튼 표시 안함
  if (!isParticipant) return null;

  return (
    <>
      {/* 기능 버튼들 */}
      <View style={[styles.container, { paddingHorizontal: 16 * scale, paddingVertical: 12 * scale }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 14 * scale, marginBottom: 12 * scale }]}>
          🌟 챌린지 기능
        </Text>

        <View style={styles.buttonsRow}>
          {/* 익명 응원 버튼 */}
          <TouchableOpacity
            style={[
              styles.featureButton,
              {
                backgroundColor: colors.card,
                padding: 12 * scale,
                borderRadius: 12 * scale,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setShowEncouragement(true)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24 * scale }}>💝</Text>
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: 12 * scale, marginTop: 4 * scale }]}>
              익명 응원
            </Text>
          </TouchableOpacity>

          {/* 감정 리포트 버튼 */}
          <TouchableOpacity
            style={[
              styles.featureButton,
              {
                backgroundColor: colors.card,
                padding: 12 * scale,
                borderRadius: 12 * scale,
                borderColor: colors.border,
              }
            ]}
            onPress={handleGoToReport}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24 * scale }}>📊</Text>
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: 12 * scale, marginTop: 4 * scale }]}>
              감정 리포트
            </Text>
          </TouchableOpacity>

          {/* 완주 카드 버튼 (완주 시에만) */}
          {completionId && (
            <TouchableOpacity
              style={[
                styles.featureButton,
                {
                  backgroundColor: colors.primary + '20',
                  padding: 12 * scale,
                  borderRadius: 12 * scale,
                  borderColor: colors.primary,
                }
              ]}
              onPress={() => setShowCompletionCard(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 24 * scale }}>🏆</Text>
              <Text style={[styles.buttonLabel, { color: colors.primary, fontSize: 12 * scale, marginTop: 4 * scale }]}>
                완주 카드
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    fontWeight: '700',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
  },
  featureButton: {
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonLabel: {
    fontWeight: '600',
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
    fontWeight: '300',
  },
});

export default React.memo(ChallengeFeatureButtons);
