import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import liveComfortService, { LiveSession } from '../../../services/api/liveComfortService';
import { useNavigation } from '@react-navigation/native';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

export const LiveComfortPreview: React.FC = React.memo(() => {
  const { colors } = useModernTheme();
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const scale = getScale();

  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      const sessions = await liveComfortService.getActiveSessions();
      // 배열인지 확인
      const sessionArray = Array.isArray(sessions) ? sessions : [];
      setActiveSessions(sessionArray);
      const total = sessionArray.reduce((sum, s) => sum + s.current_users, 0);
      setTotalUsers(total);
    } catch (err) {
      setError('세션을 불러오는데 실패했습니다');
      if (__DEV__) console.error('세션 로드 실패:', err);
      setActiveSessions([]);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000); // 10초마다 갱신
    return () => clearInterval(interval);
  }, [loadSessions]);

  if (error) {
    return (
      <Card variant="highlight" style={{ padding: 16 * scale, marginBottom: 12 * scale }} accessible={true} accessibilityLabel="실시간 공감 세션">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={loadSessions}
            style={[styles.retryButton, { marginTop: 12 * scale }]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body * scale }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <Card
      variant="highlight"
      style={{ padding: 16 * scale, marginBottom: 12 * scale }}
      accessible={true}
      accessibilityLabel={`실시간 공감 세션: ${activeSessions.length > 0 ? `${totalUsers}명 참여 중` : '준비 중'}`}
    >
      <View style={styles.header}>
        <View style={[styles.liveBadge, { gap: 6 * scale }]} accessible={true} accessibilityLabel={activeSessions.length > 0 ? '실시간 진행 중' : '대기 중'}>
          <View style={[styles.liveDot, {
            width: 8 * scale,
            height: 8 * scale,
            borderRadius: 4 * scale,
            backgroundColor: activeSessions.length > 0 ? '#ff4444' : '#999'
          }]} />
          <Text style={[styles.liveText, {
            color: activeSessions.length > 0 ? '#ff4444' : '#999',
            fontSize: FONT_SIZES.caption * scale,
            fontFamily: 'Pretendard-Bold'
          }]}>
            {activeSessions.length > 0 ? 'LIVE' : 'READY'}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale, flex: 1, marginLeft: 8 * scale }]}>
          실시간 공감 세션
        </Text>
      </View>

      <Text style={[styles.description, {
        color: colors.textSecondary,
        fontSize: FONT_SIZES.bodySmall * scale,
        marginTop: 8 * scale
      }]}>
        {activeSessions.length > 0
          ? `지금 ${totalUsers}명이 함께 위로받고 있어요`
          : '현재 진행 중인 세션이 없습니다'}
      </Text>

      {activeSessions.length > 0 && (
        <View style={[styles.sessionsPreview, { marginTop: 12 * scale, gap: 8 * scale }]}>
          {activeSessions.slice(0, 3).map(session => (
            <View
              key={session.session_id}
              style={[styles.sessionTag, {
                backgroundColor: colors.background,
                paddingHorizontal: 12 * scale,
                paddingVertical: 6 * scale,
                borderRadius: 16 * scale,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6 * scale
              }]}
              accessible={true}
              accessibilityLabel={`${session.emotion_tag} 세션, ${session.current_users}명 참여`}
            >
              <Text style={{ fontSize: FONT_SIZES.bodySmall * scale }}>
                {session.emotion_tag === '슬픔' ? '😢' :
                 session.emotion_tag === '우울' ? '😞' :
                 session.emotion_tag === '불안' ? '😰' : '💙'}
              </Text>
              <Text style={[styles.sessionTagText, {
                color: colors.text,
                fontSize: FONT_SIZES.small * scale
              }]}>
                {session.emotion_tag}
              </Text>
              <Text style={[styles.sessionUsers, {
                color: colors.textSecondary,
                fontSize: FONT_SIZES.tiny * scale
              }]}>
                {session.current_users}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.joinButton, {
          backgroundColor: activeSessions.length > 0 ? colors.primary : colors.border,
          marginTop: 14 * scale,
          paddingVertical: 12 * scale,
          borderRadius: 12 * scale,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6 * scale
        }]}
        onPress={() => {
          if (activeSessions.length > 0) {
            // navigation.navigate('LiveComfort');
            if (__DEV__) console.log('라이브 공감 세션 화면으로 이동');
          } else {
            if (__DEV__) console.log('진행 중인 세션이 없습니다');
          }
        }}
        disabled={activeSessions.length === 0}
        accessibilityRole="button"
        accessibilityLabel={activeSessions.length > 0 ? '세션 참여하기' : '준비 중'}
        accessibilityHint={activeSessions.length > 0 ? '실시간 공감 세션에 참여합니다' : '현재 진행 중인 세션이 없습니다'}
      >
        <Text style={[styles.joinButtonText, {
          color: activeSessions.length > 0 ? '#fff' : colors.textSecondary,
          fontSize: FONT_SIZES.bodySmall * scale,
          fontFamily: 'Pretendard-SemiBold'
        }]}>
          {activeSessions.length > 0 ? '세션 참여하기' : '준비 중...'}
        </Text>
        {activeSessions.length > 0 && (
          <Text style={{ color: '#fff', fontSize: FONT_SIZES.bodyLarge * scale }}>→</Text>
        )}
      </TouchableOpacity>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {},
  liveText: {},
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  description: {},
  sessionsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sessionTag: {},
  sessionTagText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  sessionUsers: {},
  joinButton: {},
  joinButtonText: {},
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
