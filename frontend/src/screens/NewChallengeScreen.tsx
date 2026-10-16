// 완전히 새로운 Simple Challenge 화면
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Text as RNText,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Chip,
  FAB,
  Banner,
  Surface,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { simpleChallengeService, SimpleChallenge, ChallengeParticipation } from '../services/api/simpleChallengeService';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { FONT_SIZES } from '../constants';

const NewChallengeScreen: React.FC = () => {
  const paperTheme = useTheme();
  const { theme, isDark } = useModernTheme();
  const { width } = useWindowDimensions();

  const colors = {
    background: theme.colors.background,
    cardBackground: theme.colors.card,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.primarySecondary,
    border: theme.colors.border || '#e5e7eb',
    primary: isDark ? '#60a5fa' : '#3b82f6',
  };

  // 상태 관리
  const [challenges, setChallenges] = useState<SimpleChallenge[]>([]);
  const [bestChallenges, setBestChallenges] = useState<SimpleChallenge[]>([]);
  const [myParticipations, setMyParticipations] = useState<ChallengeParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 초기 데이터 로드
  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      console.log('🎯 새로운 챌린지 화면 데이터 로드 시작');

      // 병렬로 모든 데이터 요청
      const [challengesRes, bestRes, participationsRes] = await Promise.allSettled([
        simpleChallengeService.getChallenges({ page: 1, limit: 20 }),
        simpleChallengeService.getBestChallenges(6),
        simpleChallengeService.getMyParticipations(),
      ]);

      // 챌린지 목록 처리
      if (challengesRes.status === 'fulfilled') {
        const data = challengesRes.value;
        if (data.isOffline) {
          setIsOffline(true);
        }
        setChallenges(data.data.challenges || data.data || []);
      }

      // 베스트 챌린지 처리
      if (bestRes.status === 'fulfilled') {
        const data = bestRes.value;
        setBestChallenges(data.data || []);
      }

      // 내 참여 챌린지 처리
      if (participationsRes.status === 'fulfilled') {
        const data = participationsRes.value;
        setMyParticipations(data.data || []);
      }

      console.log('✅ 새로운 챌린지 화면 데이터 로드 완료');

    } catch (error: any) {
      console.error('❌ 데이터 로드 오류:', error);
      Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  // 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    setIsOffline(false);
    loadData(true);
  };

  // 챌린지 참여
  const handleJoinChallenge = async (challengeId: number) => {
    try {
      await simpleChallengeService.joinChallenge(challengeId);
      Alert.alert('성공', '챌린지에 성공적으로 참여했습니다!');
      loadData();
    } catch (error: any) {
      Alert.alert('오류', error.message);
    }
  };

  // 챌린지 생성
  const handleCreateChallenge = () => {
    Alert.alert(
      '챌린지 생성',
      '새로운 챌린지를 만들어보세요!',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '빠른 생성',
          onPress: () => {
            // 간단한 샘플 챌린지 생성
            createSampleChallenge();
          }
        }
      ]
    );
  };

  const createSampleChallenge = async () => {
    try {
      const sampleData = {
        title: `내 감정 돌아보기 ${new Date().getMonth() + 1}월`,
        description: '매일 내 감정을 기록하고 성찰하는 시간을 가져보세요.',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        max_participants: 50,
        is_public: true
      };

      await simpleChallengeService.createChallenge(sampleData);
      Alert.alert('성공', '챌린지가 생성되었습니다!');
      loadData();
    } catch (error: any) {
      Alert.alert('오류', error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <RNText style={[styles.loadingText, { color: theme.colors.text.primarySecondary }]}>챌린지를 불러오는 중...</RNText>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isOffline && (
        <Banner
          visible={true}
          actions={[
            {
              label: '새로고침',
              onPress: onRefresh,
            },
          ]}
          icon="wifi-off"
        >
          오프라인 모드입니다. 네트워크 연결을 확인해주세요.
        </Banner>
      )}

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 헤더 */}
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Title style={[styles.headerTitle, { color: theme.colors.primary }]}>감정 챌린지</Title>
          <Paragraph style={[styles.headerSubtitle, { color: theme.colors.text.primarySecondary }]}>
            함께 감정을 기록하고 성장해보세요
          </Paragraph>
        </Surface>

        {/* 내가 참여한 챌린지 */}
        {myParticipations.length > 0 && (
          <View style={styles.section}>
            <RNText style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>내가 참여한 챌린지</RNText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {myParticipations.slice(0, 3).map((participation) => (
                <Card key={participation.challenge_id} style={[styles.myCard, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content>
                    <Title style={[styles.cardTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
                      {participation.challenge?.title}
                    </Title>
                    <Paragraph style={[styles.cardDescription, { color: theme.colors.text.primarySecondary }]} numberOfLines={2}>
                      진행률: {participation.progress_count}일
                    </Paragraph>
                    <Chip
                      mode="outlined"
                      textStyle={[styles.chipText, { color: theme.colors.text.primary }]}
                      style={[styles.statusChip, { borderColor: theme.colors.border }]}
                    >
                      {participation.status === 'active' ? '진행중' : '완료'}
                    </Chip>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 베스트 챌린지 */}
        <View style={styles.section}>
          <RNText style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>인기 챌린지</RNText>
          <View style={styles.bestGrid}>
            {bestChallenges.slice(0, 4).map((challenge) => (
              <Card key={challenge.id} style={[styles.bestCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <Title style={[styles.bestCardTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>
                    {challenge.title}
                  </Title>
                  <View style={styles.bestCardFooter}>
                    <RNText style={[styles.participantCount, { color: theme.colors.text.primarySecondary }]}>
                      👥 {challenge.participant_count}명
                    </RNText>
                    <Button
                      mode="contained"
                      compact
                      style={styles.joinButton}
                      onPress={() => handleJoinChallenge(challenge.id)}
                    >
                      참여
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* 모든 챌린지 */}
        <View style={styles.section}>
          <RNText style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>모든 챌린지</RNText>
          {challenges.map((challenge) => (
            <Card key={challenge.id} style={[styles.challengeCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={styles.challengeHeader}>
                  <View style={styles.challengeInfo}>
                    <Title style={[styles.challengeTitle, { color: theme.colors.text.primary }]}>{challenge.title}</Title>
                    <Paragraph style={[styles.challengeDescription, { color: theme.colors.text.primarySecondary }]} numberOfLines={2}>
                      {challenge.description}
                    </Paragraph>
                    <View style={styles.challengeMeta}>
                      <RNText style={[styles.metaText, { color: theme.colors.text.primaryTertiary }]}>
                        👥 {challenge.participant_count}명 참여
                      </RNText>
                      <RNText style={[styles.metaText, { color: theme.colors.text.primaryTertiary }]}>
                        📅 {challenge.start_date} ~ {challenge.end_date}
                      </RNText>
                    </View>
                  </View>
                  <Button
                    mode="contained"
                    style={styles.challengeJoinButton}
                    onPress={() => handleJoinChallenge(challenge.id)}
                  >
                    참여하기
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* 빈 상태 */}
        {challenges.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Icon name="emoji-events" size={64} color={theme.colors.text.primaryTertiary} />
            <RNText style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>아직 챌린지가 없어요</RNText>
            <RNText style={[styles.emptyDescription, { color: theme.colors.text.primarySecondary }]}>
              첫 번째 챌린지를 만들어보세요!
            </RNText>
            <Button
              mode="contained"
              style={styles.emptyButton}
              onPress={handleCreateChallenge}
            >
              챌린지 만들기
            </Button>
          </View>
        )}
      </ScrollView>

      {/* 플로팅 액션 버튼 */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="add"
        label="새 챌린지"
        onPress={handleCreateChallenge}
        color={theme.colors.surface}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONT_SIZES.bodyLarge,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center' as any,
    marginTop: 4,
  },
  section: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.h3,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  myCard: {
    width: 200,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: FONT_SIZES.small,
    marginVertical: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  chipText: {
    fontSize: FONT_SIZES.tiny,
  },
  bestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bestCard: {
    width: (width - 48) / 2,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bestCardTitle: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bestCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantCount: {
    fontSize: FONT_SIZES.small,
  },
  joinButton: {
    paddingHorizontal: 8,
  },
  challengeCard: {
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: FONT_SIZES.bodySmall,
    marginBottom: 8,
  },
  challengeMeta: {
    flexDirection: 'column',
  },
  metaText: {
    fontSize: FONT_SIZES.small,
    marginBottom: 2,
  },
  challengeJoinButton: {
    alignSelf: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.h3,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center',
    marginVertical: 8,
  },
  emptyButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default NewChallengeScreen;