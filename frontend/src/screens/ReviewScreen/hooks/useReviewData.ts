import { useState, useCallback } from 'react';
import myDayService from '../../../services/api/myDayService';
import userService from '../../../services/api/userService';
import challengeService from '../../../services/api/challengeService';
import {
  EmotionCalendarData,
  HighlightData,
  MonthlyInsight,
  EmotionPattern,
  ComfortData,
  EmotionJourney,
  DailyMission
} from '../../../types/ReviewScreen.types';
import { getEmotionIcon, getEmotionColor, getAverageEmotionTemp, getTempMessage } from '../../../utils/emotionHelpers';

export const useReviewData = (selectedPeriod: 'week' | 'month' | 'year') => {
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<EmotionCalendarData[]>([]);
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [monthlyInsight, setMonthlyInsight] = useState<MonthlyInsight>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    topEmotion: '행복',
    consecutiveDays: 0,
    completedChallenges: 0
  });
  const [emotionStats, setEmotionStats] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any>({ labels: [], datasets: [] });
  const [emotionPatterns, setEmotionPatterns] = useState<EmotionPattern[]>([]);
  const [comfortData, setComfortData] = useState<ComfortData>({
    totalComments: 0,
    totalLikes: 0,
    recentComments: [],
    encouragementMessages: []
  });
  const [emotionJourney, setEmotionJourney] = useState<EmotionJourney>({});
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
  const [previousMonthData, setPreviousMonthData] = useState({ posts: 0, likes: 0, comments: 0 });

  const getPeriodDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();

    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'year':
        startDate.setDate(endDate.getDate() - 365);
        break;
    }

    return { startDate, endDate };
  }, [selectedPeriod]);

  const calculateConsecutiveDays = useCallback((dates: string[]): number => {
    if (dates.length === 0) return 0;

    const sortedDates = dates
      .map(dateStr => {
        const parts = dateStr.split('. ');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      })
      .sort((a, b) => b.getTime() - a.getTime());

    let consecutive = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestDate = new Date(sortedDates[0]);
    latestDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) return 0;

    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i]);
      const previous = new Date(sortedDates[i - 1]);
      current.setHours(0, 0, 0, 0);
      previous.setHours(0, 0, 0, 0);

      const diff = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }, []);

  const loadEmotionCalendar = useCallback(async () => {
    try {
      const response = await myDayService.getMyPosts({ page: 1, limit: 30 });
      if (response.status === 'success' && response.data) {
        const allPosts = Array.isArray(response.data) ? response.data : response.data.posts || [];

        const { startDate, endDate } = getPeriodDateRange();
        const filteredPosts = allPosts.filter((post: any) => {
          const postDate = new Date(post.created_at);
          return postDate >= startDate && postDate <= endDate;
        });

        const postsByDate: { [key: string]: any[] } = {};
        filteredPosts.forEach((post: any) => {
          const dateKey = new Date(post.created_at).toLocaleDateString('ko-KR');
          if (!postsByDate[dateKey]) {
            postsByDate[dateKey] = [];
          }
          postsByDate[dateKey].push(post);
        });

        const calendar = Object.entries(postsByDate)
          .slice(0, selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365)
          .map(([date, dayPosts]) => {
            const mainPost = dayPosts[0];
            return {
              date,
              emotion: mainPost.emotion_name || '평온',
              emotionIcon: getEmotionIcon(mainPost.emotion_name || '평온'),
              emotionColor: mainPost.emotion_color || '#4CAF50',
              postCount: dayPosts.length,
              likeCount: dayPosts.reduce((sum: number, p: any) => sum + (p.like_count || 0), 0),
              postId: mainPost.post_id,
              posts: dayPosts
            };
          });

        setCalendarData(calendar);

        const dateKeys = Object.keys(postsByDate);
        const consecutiveDays = calculateConsecutiveDays(dateKeys);

        setMonthlyInsight(prev => ({
          ...prev,
          consecutiveDays
        }));
      }
    } catch (error) {
      console.error('감정 캘린더 로드 오류:', error);
    }
  }, [selectedPeriod, getPeriodDateRange, calculateConsecutiveDays]);

  const loadHighlights = useCallback(async () => {
    try {
      const [userStats, challengeStats] = await Promise.all([
        userService.getUserStats(),
        userService.getChallengeStats()
      ]);

      const highlightItems: HighlightData[] = [
        {
          id: 1,
          title: '나의 하루 게시물',
          type: 'post',
          count: userStats.data?.my_day_post_count || 0,
          icon: 'document-text',
          color: '#0095F6',
          description: '작성한 감정 기록들'
        },
        {
          id: 2,
          title: '받은 공감',
          type: 'post',
          count: userStats.data?.my_day_like_received_count || 0,
          icon: 'heart',
          color: '#E91E63',
          description: '다른 사람들의 공감'
        },
        {
          id: 3,
          title: '참여한 챌린지',
          type: 'challenge',
          count: challengeStats.data?.participated || 0,
          icon: 'trophy',
          color: '#FF9800',
          description: '도전한 감정 챌린지들'
        },
        {
          id: 4,
          title: '만든 챌린지',
          type: 'created_challenge',
          count: challengeStats.data?.created || 0,
          icon: 'add-circle',
          color: '#4CAF50',
          description: '내가 개설한 챌린지들'
        }
      ];

      setHighlights(highlightItems);
    } catch (error) {
      console.error('하이라이트 로드 오류:', error);
    }
  }, []);

  const loadMonthlyInsights = useCallback(async () => {
    try {
      const [postsResponse, emotionData, challengesResponse] = await Promise.all([
        myDayService.getMyPosts({ page: 1, limit: 30 }),
        myDayService.getUserEmotionStats(),
        challengeService.getMyParticipations({ page: 1, limit: 30 })
      ]);

      const { startDate, endDate } = getPeriodDateRange();
      let totalPosts = 0;
      let totalLikes = 0;
      let totalComments = 0;

      if (postsResponse.status === 'success' && postsResponse.data) {
        const allPosts = Array.isArray(postsResponse.data) ? postsResponse.data : postsResponse.data.posts || [];
        const filteredPosts = allPosts.filter((post: any) => {
          const postDate = new Date(post.created_at);
          return postDate >= startDate && postDate <= endDate;
        });

        totalPosts = filteredPosts.length;
        totalLikes = filteredPosts.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0);
        totalComments = filteredPosts.reduce((sum: number, post: any) => sum + (post.comment_count || 0), 0);
      }

      let completedChallenges = 0;
      if (challengesResponse?.data?.status === 'success' && challengesResponse.data.data) {
        const challenges = Array.isArray(challengesResponse.data.data)
          ? challengesResponse.data.data
          : challengesResponse.data.data.challenges || [];
        completedChallenges = challenges.length;
      }

      const insights: MonthlyInsight = {
        totalPosts,
        totalLikes,
        totalComments,
        topEmotion: emotionData.data?.[0]?.emotion_name || '행복',
        consecutiveDays: monthlyInsight.consecutiveDays,
        completedChallenges
      };

      setMonthlyInsight(insights);
    } catch (error) {
      console.error('월간 인사이트 로드 오류:', error);
    }
  }, [getPeriodDateRange, monthlyInsight.consecutiveDays]);

  const loadEmotionStats = useCallback(async () => {
    try {
      const response = await myDayService.getMyPosts({ page: 1, limit: 30 });
      if (response.status === 'success' && response.data) {
        const allPosts = Array.isArray(response.data) ? response.data : response.data.posts || [];

        const { startDate, endDate } = getPeriodDateRange();
        const filteredPosts = allPosts.filter((post: any) => {
          const postDate = new Date(post.created_at);
          return postDate >= startDate && postDate <= endDate;
        });

        const emotionCounts: { [key: string]: { name: string; count: number; color: string; emotion_icon: string } } = {};
        filteredPosts.forEach((post: any) => {
          const emotionName = post.emotion_name || '평온';
          const emotionColor = post.emotion_color || getEmotionColor(emotionName);
          const emotionIcon = getEmotionIcon(emotionName);

          if (!emotionCounts[emotionName]) {
            emotionCounts[emotionName] = {
              name: emotionName,
              count: 0,
              color: emotionColor,
              emotion_icon: emotionIcon
            };
          }
          emotionCounts[emotionName].count++;
        });

        const pieData = Object.values(emotionCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map(stat => ({
            name: stat.name,
            count: stat.count,
            color: stat.color,
            emotion_icon: stat.emotion_icon,
            legendFontColor: '#1C1C1E',
            legendFontSize: 13
          }));

        setEmotionStats(pieData);
      }
    } catch (error) {
      console.error('감정 통계 로드 오류:', error);
    }
  }, [selectedPeriod, getPeriodDateRange]);

  const analyzeEmotionJourney = useCallback(() => {
    if (emotionStats.length === 0) return;

    const journey: EmotionJourney = {};

    if (previousMonthData.posts > 0) {
      const improvement = Math.round(
        ((emotionStats.length - 3) / 3) * 100
      );
      if (improvement > 0) {
        journey.improvement = improvement;
      }
    }

    if (emotionPatterns.length > 0) {
      const pattern = emotionPatterns[0];
      journey.pattern = {
        emotion: pattern.emotion,
        change: '더 자주 느끼고 계시네요'
      };
    }

    const avgTemp = getAverageEmotionTemp(emotionStats);
    journey.temperature = {
      value: avgTemp,
      message: getTempMessage(avgTemp, selectedPeriod)
    };

    setEmotionJourney(journey);
  }, [emotionStats, emotionPatterns, previousMonthData, selectedPeriod]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEmotionCalendar(),
        loadHighlights(),
        loadMonthlyInsights(),
        loadEmotionStats()
      ]);
      analyzeEmotionJourney();
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [loadEmotionCalendar, loadHighlights, loadMonthlyInsights, loadEmotionStats, analyzeEmotionJourney]);

  return {
    loading,
    calendarData,
    highlights,
    monthlyInsight,
    emotionStats,
    activityData,
    emotionPatterns,
    comfortData,
    emotionJourney,
    dailyMissions,
    previousMonthData,
    loadAllData,
    setMonthlyInsight,
    setEmotionStats,
    setActivityData,
    setEmotionPatterns,
    setComfortData,
    setDailyMissions,
    setPreviousMonthData
  };
};
