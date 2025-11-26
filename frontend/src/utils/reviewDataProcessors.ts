import { EmotionCalendarData, HighlightData, DailyMission, ActivityData, ComfortData } from '../types/ReviewScreen.types';
import { getEmotionIcon } from './emotionHelpers';

// 캘린더 데이터 처리
export const processCalendarData = (
  posts: any[],
  selectedPeriod: 'week' | 'month' | 'year',
  themeColors: any,
  getEmotionIconFn: typeof getEmotionIcon
): EmotionCalendarData[] => {
  const postsByDate: { [key: string]: any[] } = {};

  posts.forEach((post: any) => {
    const dateKey = new Date(post.created_at).toLocaleDateString('ko-KR');
    if (!postsByDate[dateKey]) {
      postsByDate[dateKey] = [];
    }
    postsByDate[dateKey].push(post);
  });

  const limit = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;

  return Object.entries(postsByDate)
    .slice(0, limit)
    .map(([date, dayPosts]) => {
      const mainPost = dayPosts[0];
      return {
        date,
        emotion: mainPost.emotion_name || '평온',
        emotionIcon: getEmotionIconFn(mainPost.emotion_name || '평온'),
        emotionColor: mainPost.emotion_color || themeColors.success,
        postCount: dayPosts.length,
        likeCount: dayPosts.reduce((sum: number, p: any) => sum + (p.like_count || 0), 0),
        postId: mainPost.post_id,
        posts: dayPosts
      };
    });
};

// 하이라이트 데이터 처리
export const processHighlightsData = (
  userStats: any,
  insights: any,
  themeColors: any
): HighlightData[] => {
  return [
    {
      id: 1,
      title: '나의 하루 게시물',
      type: 'post' as const,
      count: userStats.my_day_post_count,
      icon: 'document-text',
      color: themeColors.primary,
      description: '작성한 감정 기록들'
    },
    {
      id: 2,
      title: '받은 공감',
      type: 'post' as const,
      count: userStats.my_day_like_received_count,
      icon: 'heart',
      color: themeColors.error,
      description: '다른 사람들의 공감'
    },
    {
      id: 3,
      title: '참여한 챌린지',
      type: 'challenge' as const,
      count: insights.completedChallenges,
      icon: 'trophy',
      color: themeColors.warning,
      description: '도전한 감정 챌린지들'
    },
    {
      id: 4,
      title: '만든 챌린지',
      type: 'created_challenge' as const,
      count: 0,
      icon: 'add-circle',
      color: themeColors.success,
      description: '내가 개설한 챌린지들'
    }
  ];
};

// 인사이트 데이터 처리 (미션 데이터)
export const processInsightsData = (
  selectedPeriod: 'week' | 'month' | 'year',
  todayActivities: any,
  insights: any,
  emotionStatsLength: number
): DailyMission[] => {
  if (selectedPeriod === 'week') {
    return [
      {
        id: 1,
        title: '오늘의 마음 돌보기',
        description: '5분만 시간 내어 나를 돌아보세요',
        completed: todayActivities.posted_today,
        icon: 'create'
      },
      {
        id: 2,
        title: '다른 사람에게 공감 나누기',
        description: '누군가의 이야기에 귀 기울여보세요',
        completed: todayActivities.gave_like_today,
        icon: 'heart'
      },
      {
        id: 3,
        title: '따뜻한 말 건네기',
        description: '댓글로 위로를 전해보세요',
        completed: todayActivities.wrote_comment_today,
        icon: 'chatbubble'
      }
    ];
  } else if (selectedPeriod === 'month') {
    return [
      {
        id: 1,
        title: '주 3회 이상 기록하기',
        description: `이번 달 ${insights.totalPosts}개 작성 (목표: 12개)`,
        completed: insights.totalPosts >= 12,
        icon: 'create'
      },
      {
        id: 2,
        title: '10명 이상에게 공감 나누기',
        description: `이번 달 0개 공감 (목표: 10개)`,
        completed: false,
        icon: 'heart'
      },
      {
        id: 3,
        title: '5개 이상 댓글 작성하기',
        description: `이번 달 0개 댓글 (목표: 5개)`,
        completed: false,
        icon: 'chatbubble'
      },
      {
        id: 4,
        title: '다양한 감정 경험하기',
        description: `이번 달 ${emotionStatsLength}가지 감정 (목표: 5가지)`,
        completed: emotionStatsLength >= 5,
        icon: 'color-palette'
      }
    ];
  }

  return [];
};

// 감정 통계 데이터 처리
export const processEmotionStatsData = (
  emotionStats: any[],
  insights: any,
  posts: any[]
) => {
  const uniqueEmotions = new Set(emotionStats.map((e: any) => e.name)).size;

  return {
    uniqueEmotions,
    emotionStats,
    insights
  };
};

// 활동 데이터 처리
export const processActivityData = (
  selectedPeriod: 'week' | 'month' | 'year',
  posts: any[],
  themeColors: any
): ActivityData => {
  const labels: string[] = [];
  const postData: number[] = [];
  const likeData: number[] = [];

  if (selectedPeriod === 'week') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.getDate().toString());

      const dayPosts = posts.filter((p: any) => {
        const postDate = new Date(p.created_at);
        postDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return postDate.getTime() === date.getTime();
      });

      postData.push(dayPosts.length);
      likeData.push(dayPosts.reduce((sum: number, p: any) => sum + (p.like_count || 0), 0));
    }
  }

  return {
    labels,
    datasets: [
      {
        data: postData.length > 0 ? postData : [0],
        color: () => themeColors.primary,
        strokeWidth: 3
      },
      {
        data: likeData.length > 0 ? likeData : [0],
        color: () => themeColors.error,
        strokeWidth: 2
      }
    ]
  };
};

// 업적 데이터 처리 (위로 데이터)
export const processAchievementsData = (posts: any[]): ComfortData => {
  const totalComments = posts.reduce((sum: number, p: any) => sum + (p.comment_count || 0), 0);
  const totalLikes = posts.reduce((sum: number, p: any) => sum + (p.like_count || 0), 0);
  const recentComments: any[] = [];

  posts.forEach((post: any) => {
    if (post.comments && post.comments.length > 0) {
      post.comments.slice(0, 3).forEach((comment: any) => {
        recentComments.push({
          id: comment.comment_id,
          content: comment.content,
          createdAt: new Date(comment.created_at).toLocaleDateString('ko-KR'),
          postPreview: post.content.slice(0, 30)
        });
      });
    }
  });

  return {
    totalComments,
    totalLikes,
    recentComments: recentComments.slice(0, 3),
    encouragementMessages: []
  };
};

// 목표 데이터 처리
export const processGoalsData = (
  selectedPeriod: 'week' | 'month' | 'year',
  insights: any,
  emotionStats: any[]
) => {
  const uniqueEmotions = new Set(emotionStats.map((e: any) => e.name)).size;
  let postGoal = 7;

  switch (selectedPeriod) {
    case 'week':
      postGoal = 7;
      break;
    case 'month':
      postGoal = 30;
      break;
    case 'year':
      postGoal = 365;
      break;
  }

  return {
    weeklyPostGoal: postGoal,
    currentWeekPosts: insights.totalPosts,
    emotionDiversityGoal: 8,
    currentEmotionDiversity: uniqueEmotions
  };
};

// 오늘 게시물 확인
export const checkTodayPost = (posts: any[]): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayPost = posts.find((post: any) => {
    const postDate = new Date(post.created_at);
    postDate.setHours(0, 0, 0, 0);
    return postDate.getTime() === today.getTime();
  });

  return !!todayPost;
};

// 메인 processData 함수
export const processReviewData = (
  queryData: any,
  selectedPeriod: 'week' | 'month' | 'year',
  themeColors: any,
  getEmotionIconFn: typeof getEmotionIcon
) => {
  const calendar = processCalendarData(
    queryData.posts,
    selectedPeriod,
    themeColors,
    getEmotionIconFn
  );

  const highlights = processHighlightsData(
    queryData.userStats,
    queryData.insights,
    themeColors
  );

  const missions = processInsightsData(
    selectedPeriod,
    queryData.todayActivities,
    queryData.insights,
    queryData.emotionStats.length
  );

  const emotionData = processEmotionStatsData(
    queryData.emotionStats,
    queryData.insights,
    queryData.posts
  );

  const activity = processActivityData(
    selectedPeriod,
    queryData.posts,
    themeColors
  );

  const comfort = processAchievementsData(queryData.posts);

  const goals = processGoalsData(
    selectedPeriod,
    queryData.insights,
    queryData.emotionStats
  );

  const todayPostWritten = checkTodayPost(queryData.posts);

  return {
    calendar,
    highlights,
    missions,
    emotionData,
    activity,
    comfort,
    goals,
    todayPostWritten,
    monthlyInsight: queryData.insights,
    emotionStats: queryData.emotionStats,
    userIntentions: queryData.intentions,
    // loadEmotionPatterns, loadPersonalizedMessage에서 사용
    posts: queryData.posts,
    previousMonthData: {
      posts: 0,
      likes: 0,
      comments: 0
    }
  };
};
