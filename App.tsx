import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, AppState, Platform, StatusBar } from 'react-native';

const Tab = createBottomTabNavigator();

// 감정 데이터
const emotions = [
  { id: 1, name: '기쁨이', icon: '😊', color: '#FFD700' },
  { id: 2, name: '행복이', icon: '😄', color: '#FFA500' },
  { id: 3, name: '슬픔이', icon: '😢', color: '#4682B4' },
  { id: 4, name: '우울이', icon: '😞', color: '#708090' },
  { id: 5, name: '버럭이', icon: '😠', color: '#FF4500' },
  { id: 6, name: '불안이', icon: '😰', color: '#DDA0DD' },
];

// 홈 화면 컴포넌트
const HomeScreen = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<number[]>([]);
  const [dayText, setDayText] = useState('');

  const toggleEmotion = (emotionId: number) => {
    setSelectedEmotions(prev =>
      prev.includes(emotionId)
        ? prev.filter(id => id !== emotionId)
        : [...prev, emotionId]
    );
  };

  const handleSubmitEmotion = () => {
    if (selectedEmotions.length > 0) {
      Alert.alert('감정 저장', `선택된 감정: ${selectedEmotions.length}개`);
    }
  };

  const handleSubmitDay = () => {
    if (dayText.trim()) {
      Alert.alert('성공', '나의 하루 게시글이 저장되었습니다!');
      setDayText('');
    }
  };

  const handleShareMood = () => {
    Alert.alert('마음 공유하기', '오늘의 감정을 공유해보세요!');
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 감정 선택 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 감정을 선택해주세요</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emotionContainer}>
            {emotions.map((emotion) => {
              const isSelected = selectedEmotions.includes(emotion.id);
              return (
                <TouchableOpacity
                  key={emotion.id}
                  style={[
                    styles.emotionButton,
                    isSelected && { backgroundColor: `${emotion.color}30` }
                  ]}
                  onPress={() => toggleEmotion(emotion.id)}
                >
                  <Text style={styles.emotionIcon}>{emotion.icon}</Text>
                  <Text style={[styles.emotionName, { color: emotion.color }]}>
                    {emotion.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.saveButton} onPress={handleSubmitEmotion}>
            <Text style={styles.saveButtonText}>감정 저장하기</Text>
          </TouchableOpacity>
        </View>

        {/* 나의 하루 작성 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>나의 하루</Text>
          <TextInput
            style={styles.textInput}
            placeholder="오늘 하루는 어떠셨나요? (200자 제한)"
            value={dayText}
            onChangeText={setDayText}
            maxLength={200}
            multiline
          />
          <View style={styles.textInfo}>
            <Text style={styles.textCount}>{dayText.length}/200</Text>
          </View>
          <TouchableOpacity style={styles.publishButton} onPress={handleSubmitDay}>
            <Text style={styles.publishButtonText}>게시하기</Text>
          </TouchableOpacity>
        </View>

        {/* 누군가의 하루 미리보기 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>누군가의 하루는...</Text>
          <View style={styles.postCard}>
            <Text style={styles.postAuthor}>익명의 누군가</Text>
            <Text style={styles.postContent}>오늘은 정말 행복한 하루였어요. 작은 것에도 감사함을 느꼈습니다.</Text>
            <Text style={styles.postTime}>2분 전</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreButtonText}>더 보기</Text>
          </TouchableOpacity>
        </View>

        {/* API 연결 상태 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>시스템 상태</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>📱 프론트엔드: 정상 동작</Text>
            <Text style={styles.statusText}>🖥️  백엔드: 연결 대기 중 (MySQL 설정 필요)</Text>
            <Text style={styles.statusText}>🎨 UI 컴포넌트: 복원 완료</Text>
          </View>
        </View>
      </ScrollView>

      {/* FAB 버튼 - 마음 공유하기 */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={handleShareMood}
      >
        <Text style={styles.fabText}>마음 공유하기 ✨</Text>
      </TouchableOpacity>
    </View>
  );
};

const ReflectionScreen = () => (
  <ScrollView style={styles.container}>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>나의 감정 변화</Text>
      <View style={styles.statsCard}>
        <Text style={styles.statsText}>이번 주 감정 기록: 5일</Text>
        <Text style={styles.statsText}>가장 많은 감정: 😊 기쁨이</Text>
      </View>
    </View>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>최근 게시물</Text>
      <View style={styles.postCard}>
        <Text style={styles.postContent}>오늘은 새로운 도전을 했어요!</Text>
        <Text style={styles.postTime}>어제</Text>
      </View>
    </View>
  </ScrollView>
);

const ComfortScreen = () => (
  <ScrollView style={styles.container}>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>고민 나누기</Text>
      <TouchableOpacity style={styles.writeButton}>
        <Text style={styles.writeButtonText}>고민 작성하기</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>베스트 위로글</Text>
      <View style={styles.comfortGrid}>
        <View style={styles.comfortCard}>
          <Text style={styles.comfortTitle}>혼자가 아니에요</Text>
          <Text style={styles.comfortPreview}>힘든 시간을 보내고 있다면...</Text>
          <Text style={styles.comfortStats}>❤️ 24 💬 8</Text>
        </View>
        <View style={styles.comfortCard}>
          <Text style={styles.comfortTitle}>괜찮을 거예요</Text>
          <Text style={styles.comfortPreview}>모든 일에는 때가 있어요...</Text>
          <Text style={styles.comfortStats}>❤️ 18 💬 12</Text>
        </View>
      </View>
    </View>
  </ScrollView>
);

const ChallengeScreen = () => (
  <ScrollView style={styles.container}>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>인기 챌린지</Text>
      <View style={styles.challengeGrid}>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>7일 감사 챌린지</Text>
          <Text style={styles.challengeParticipants}>👥 124명 참여</Text>
        </View>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>하루 한 번 웃기</Text>
          <Text style={styles.challengeParticipants}>👥 89명 참여</Text>
        </View>
      </View>
    </View>
    <View style={styles.section}>
      <TouchableOpacity style={styles.createChallengeButton}>
        <Text style={styles.createChallengeButtonText}>새 챌린지 만들기</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

// 에러 경계 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>앱을 복구하는 중...</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Android 환경에서 추가 대기 시간
        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        setIsReady(true);
      } catch (error) {
        console.warn('App initialization error:', error);
        setHasError(true);
        // 오류가 있어도 앱을 표시
        setTimeout(() => {
          setIsReady(true);
          setHasError(false);
        }, 1000);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {hasError ? '앱을 복구하는 중...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.safeContainer}>
        <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
        <NavigationContainer
          onReady={() => console.log('Navigation ready')}
          fallback={
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>네비게이션 로딩 중...</Text>
            </View>
          }
        >
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                paddingBottom: 5,
                height: 60,
                backgroundColor: '#ffffff',
              },
            }}
          >
            <Tab.Screen
              name="홈"
              component={HomeScreen}
              options={{
                tabBarIcon: () => <Text>🏠</Text>
              }}
            />
            <Tab.Screen
              name="일상 돌아보기"
              component={ReflectionScreen}
              options={{
                tabBarIcon: () => <Text>📊</Text>
              }}
            />
            <Tab.Screen
              name="위로와 공감"
              component={ComfortScreen}
              options={{
                tabBarIcon: () => <Text>💝</Text>
              }}
            />
            <Tab.Screen
              name="감정 챌린지"
              component={ChallengeScreen}
              options={{
                tabBarIcon: () => <Text>🏆</Text>
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  // 감정 선택 관련 스타일
  emotionContainer: {
    marginBottom: 16,
  },
  emotionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    minWidth: 70,
  },
  emotionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  emotionName: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // 텍스트 입력 관련 스타일
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  textInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  textCount: {
    fontSize: 12,
    color: '#666',
  },
  publishButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // 게시물 카드 스타일
  postCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  moreButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // 통계 카드 스타일
  statsCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  // 위로와 공감 관련 스타일
  writeButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  writeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  comfortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  comfortCard: {
    width: '48%',
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  comfortTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  comfortPreview: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  comfortStats: {
    fontSize: 12,
    color: '#888',
  },
  // 챌린지 관련 스타일
  challengeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  challengeCard: {
    width: '48%',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderTopWidth: 4,
    borderTopColor: '#007AFF',
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  challengeParticipants: {
    fontSize: 12,
    color: '#666',
  },
  createChallengeButton: {
    backgroundColor: '#FFD60A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createChallengeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  // 상태 카드 스타일
  statusCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  // FAB 버튼 스타일
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#00D2FF',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // 로딩 화면 스타일
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  // 기본 화면 스타일 (이전 버전 호환)
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default App;