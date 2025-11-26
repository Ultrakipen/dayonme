import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import goalService, { Goal } from '../services/api/goalService';
import emotionService, { Emotion } from '../services/api/emotionService';
import LoadingIndicator from '../components/LoadingIndicator';
import Card from '../components/Card';
import Button from '../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import EmotionSelector from '../components/EmotionSelector';
import { Box, Text, VStack, HStack, Pressable, Center } from '../components/ui';
import { useModernTheme } from '../contexts/ModernThemeContext';

const MyGoalsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // 새 목표 생성 상태
  const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 한 달 후
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const [goalsResponse, emotionsResponse] = await Promise.all([
        goalService.getGoals(),
        emotionService.getAllEmotions(),
      ]);
      
      setGoals(goalsResponse.data.data);
      setEmotions(emotionsResponse.data.data);
    } catch (err) {
      console.error('데이터 로딩 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // resetForm 함수를 상위 레벨로 이동
  const resetForm = () => {
    setSelectedEmotionId(null);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setShowCreateForm(false);
  };

  const handleCreateGoal = async () => {
    if (!selectedEmotionId) {
      Alert.alert('알림', '목표 감정을 선택해주세요.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await goalService.createGoal({
        target_emotion_id: selectedEmotionId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });
      
      setGoals([...goals, response.data.data]);
      resetForm();
      Alert.alert('성공', '새로운 감정 목표가 생성되었습니다.');
    } catch (err) {
      console.error('목표 생성 오류:', err);
      Alert.alert('오류', '목표 생성 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    Alert.alert(
      '목표 삭제',
      '정말 이 목표를 삭제하시겠습니까?',
      [
        { text: '취소' }, // style 속성 제거
        {
          text: '삭제',
          onPress: async () => {
            try {
              await goalService.deleteGoal(goalId);
              setGoals(goals.filter(goal => goal.goal_id !== goalId));
              Alert.alert('성공', '목표가 삭제되었습니다.');
            } catch (err) {
              console.error('목표 삭제 오류:', err);
              Alert.alert('오류', '목표 삭제 중 문제가 발생했습니다.');
            }
          },
        },
      ]
    );
  }; // handleDeleteGoal 함수의 닫는 중괄호 추가

  const handleEmotionSelect = (emotionId: number) => {
    setSelectedEmotionId(emotionId === selectedEmotionId ? null : emotionId);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEmotionById = (emotionId: number) => {
    return emotions.find(emotion => emotion.emotion_id === emotionId);
  };

  // renderGoalItem 함수의 매개변수에 명시적 타입 지정
  const renderGoalItem = ({ item }: { item: Goal }) => {
    const emotion = getEmotionById(item.target_emotion_id);
    const now = new Date();
    const end = new Date(item.end_date);
    const isActive = now <= end;
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return (
      <Card style={{ marginBottom: 16 }}>
        <Box className="flex-row justify-between items-center mb-3">
          <Box className="px-2.5 py-1 rounded-2xl" style={{ backgroundColor: `${item.emotion_color}20` }}>
            <Text className="text-sm font-semibold" style={{ color: item.emotion_color }}>
              {item.emotion_name}
            </Text>
          </Box>

          <Pressable
            testID="delete-goal-button"
            onPress={() => handleDeleteGoal(item.goal_id)}
          >
            <Text className="text-lg">🗑️</Text>
          </Pressable>
        </Box>

        <Box className="mb-3">
          <Text className="text-sm mb-1" style={{ color: theme.colors.text.primarySecondary }}>
            {formatDate(item.start_date)} ~ {formatDate(item.end_date)}
          </Text>
          {isActive ? (
            <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>
              남은 기간: {daysLeft}일
            </Text>
          ) : (
            <Text className="text-sm font-medium" style={{ color: theme.colors.success }}>
              완료됨
            </Text>
          )}
        </Box>

        <Box className="flex-row items-center">
          <Box
            className="flex-1 h-2 rounded mr-2 overflow-hidden"
            style={{ backgroundColor: theme.colors.border }}
          >
            <Box
              className="h-full rounded"
              style={{ width: `${item.progress}%`, backgroundColor: item.emotion_color }}
            />
          </Box>
          <Text className="text-sm font-medium w-10 text-right" style={{ color: theme.colors.text.primarySecondary }}>
            {item.progress}%
          </Text>
        </Box>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return <LoadingIndicator testID="loading-indicator" text="목표 데이터 로딩 중..." />;
  }

  return (
    <Box className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <Box
        className="flex-row justify-between items-center px-4 py-4"
        style={{
          backgroundColor: theme.colors.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Text className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
          나의 감정 목표
        </Text>
        <Pressable
          className="py-1.5 px-3 rounded-2xl"
          style={{ backgroundColor: theme.colors.primary }}
          onPress={() => setShowCreateForm(!showCreateForm)}
        >
          <Text className="font-medium text-sm" style={{ color: '#FFFFFF' }}>
            {showCreateForm ? '취소' : '새 목표 추가'}
          </Text>
        </Pressable>
      </Box>
      
      {error && (
        <Box className="p-5 items-center">
          <Text className="text-base mb-4 text-center" style={{ color: theme.colors.error }}>
            {error}
          </Text>
          <Button title="다시 시도" onPress={() => fetchData(true)} type="primary" />
        </Box>
      )}
      
      {showCreateForm && (
        <Card>
          <Box className="p-4">
            <Text className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
              새 감정 목표 생성
            </Text>
            <Text className="text-base font-medium mb-2" style={{ color: theme.colors.text.primary }}>
              목표 감정
            </Text>
          <EmotionSelector
           emotions={emotions.map(emotion => ({
            id: emotion.emotion_id,
            name: emotion.name,
            icon: emotion.icon,
            color: emotion.color
          }))}
            selectedEmotions={selectedEmotionId ? [selectedEmotionId] : []}
            onSelect={handleEmotionSelect}
            multiple={false}
          />

          <Box className="flex-row justify-between mt-4">
            <Box className="flex-1 mr-2">
              <Text className="text-base font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                시작일
              </Text>
              <Pressable
                className="h-10 rounded-lg px-3 justify-center"
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                }}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={{ color: theme.colors.text.primary }}>
                  {formatDate(startDate.toISOString())}
                </Text>
              </Pressable>

              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={handleStartDateChange}
                  minimumDate={new Date()}
                />
              )}
            </Box>

            <Box className="flex-1 mr-2">
              <Text className="text-base font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                종료일
              </Text>
              <Pressable
                className="h-10 rounded-lg px-3 justify-center"
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                }}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={{ color: theme.colors.text.primary }}>
                  {formatDate(endDate.toISOString())}
                </Text>
              </Pressable>

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                  minimumDate={startDate}
                />
              )}
            </Box>
          </Box>

          <Button
            title="목표 생성하기"
            onPress={handleCreateGoal}
            type="primary"
            loading={submitting}
            disabled={!selectedEmotionId}
            style={{ marginTop: 24 }}
          />
          </Box>
        </Card>
      )}
      
      {goals.length > 0 ? (
        <FlatList
          data={goals}
          renderItem={renderGoalItem}
          keyExtractor={(item: Goal) => item.goal_id.toString()}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={() => fetchData(true)}
          refreshing={refreshing}
        />
      ) : (
        <Box className="flex-1 justify-center items-center p-5">
          <Text className="text-base mb-4 text-center" style={{ color: theme.colors.text.primarySecondary }}>
            아직 설정된 감정 목표가 없습니다.
          </Text>
          {!showCreateForm && (
            <Button
              title="새 목표 추가하기"
              onPress={() => setShowCreateForm(true)}
              type="primary"
              style={{ width: 192 }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};


export default MyGoalsScreen;