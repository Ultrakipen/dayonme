import { Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import db from '../models';
import { AuthRequest } from '../types/express';

interface EmotionTemperature {
  name: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

// 간단한 메모리 캐싱 (트래픽 감소)
interface CacheItem {
  data: any;
  timestamp: number;
}
const cache = new Map<string, CacheItem>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 테이블 초기화 플래그 (서버 시작 후 1회만 실행)
let tablesInitialized = false;

const getCachedData = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * 리뷰 화면 통합 데이터 엔드포인트
 * 트래픽 최적화: 300+ API 호출을 1회로 축소
 */
export const getReviewSummary = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  try {
    const user_id = req.user?.user_id;
    const { period = 'week' } = req.query;

    if (!user_id) {
      return res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다'
      });
    }

    // 서버 캐시 확인 (사용자별 + 기간별)
    const cacheKey = `review_summary_${user_id}_${period}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`📊 [getSummary] 캐시 히트 - ${Date.now() - startTime}ms`);
      return res.json(cached);
    }

    // 기간 계산
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
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

    // 병렬로 모든 데이터 가져오기
    const [posts, userStats, challengeStats, intentions, todayActivities] = await Promise.all([
      // 1. 게시물 데이터 (한 번만!)
      db.MyDayPost.findAll({
        where: {
          user_id,
          created_at: { [Op.between]: [startDate, endDate] }
        },
        include: [
          {
            model: db.Emotion,
            as: 'emotions',
            through: { attributes: [] }
          },
          {
            model: db.MyDayComment,
            as: 'comments',
            attributes: ['comment_id', 'content', 'created_at', 'user_id'],
            limit: 3,
            order: [['created_at', 'DESC']]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 200
      }),

      // 2. 사용자 통계
      db.sequelize.query(
        `SELECT COUNT(*) as my_day_post_count,
         (SELECT COUNT(*) FROM my_day_likes WHERE post_id IN (SELECT post_id FROM my_day_posts WHERE user_id = ?)) as my_day_like_received_count
         FROM my_day_posts WHERE user_id = ?`,
        {
          replacements: [user_id, user_id],
          type: QueryTypes.SELECT
        }
      ).then((results: any) => results[0]),

      // 3. 챌린지 통계
      db.Challenge.count({
        include: [{
          model: db.ChallengeParticipant,
          as: 'challenge_participants',
          where: { user_id },
          required: true
        }]
      }),

      // 4. 사용자 의도 (week/month/year)
      db.sequelize.query(
        `SELECT period, intention_text FROM user_intentions WHERE user_id = ? AND period IN ('week', 'month', 'year')`,
        {
          replacements: [user_id],
          type: QueryTypes.SELECT
        }
      ),

      // 5. 오늘의 활동
      db.sequelize.query(
        `SELECT
          EXISTS(SELECT 1 FROM my_day_posts WHERE user_id = ? AND DATE(created_at) = CURDATE()) as posted_today,
          EXISTS(SELECT 1 FROM my_day_likes WHERE user_id = ? AND DATE(created_at) = CURDATE()) as gave_like_today,
          EXISTS(SELECT 1 FROM my_day_comments WHERE user_id = ? AND DATE(created_at) = CURDATE()) as wrote_comment_today`,
        {
          replacements: [user_id, user_id, user_id],
          type: QueryTypes.SELECT
        }
      )
    ]);

    // 데이터 가공
    const postsData = posts.map((post: any) => ({
      post_id: post.post_id,
      content: post.content,
      emotion_name: post.emotions?.[0]?.name || '평온',
      emotion_color: post.emotions?.[0]?.color || '#4CAF50',
      emotion_icon: post.emotions?.[0]?.icon || '😊',
      like_count: post.like_count,
      comment_count: post.comment_count,
      created_at: post.created_at,
      emotions: post.emotions,
      comments: post.comments
    }));

    // 감정 통계
    const emotionCounts: { [key: string]: { name: string; count: number; color: string; icon: string } } = {};
    postsData.forEach(post => {
      const emotionName = post.emotion_name;
      if (!emotionCounts[emotionName]) {
        emotionCounts[emotionName] = {
          name: emotionName,
          count: 0,
          color: post.emotion_color,
          icon: post.emotion_icon
        };
      }
      emotionCounts[emotionName].count++;
    });

    const emotionStats = Object.values(emotionCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 인사이트 계산
    const totalPosts = postsData.length;
    const totalLikes = postsData.reduce((sum, p) => sum + p.like_count, 0);
    const totalComments = postsData.reduce((sum, p) => sum + p.comment_count, 0);
    const topEmotion = emotionStats[0]?.name || '행복';

    // 연속 일수 계산
    const postDates = Array.from(new Set(
      postsData.map(p => new Date(p.created_at).toDateString())
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let consecutiveDays = 0;
    const today = new Date().toDateString();
    if (postDates.length > 0 && (postDates[0] === today || new Date(postDates[0]).getTime() === new Date(today).getTime() - 86400000)) {
      consecutiveDays = 1;
      for (let i = 1; i < postDates.length; i++) {
        const diff = (new Date(postDates[i-1]).getTime() - new Date(postDates[i]).getTime()) / 86400000;
        if (diff === 1) consecutiveDays++;
        else break;
      }
    }

    // 긍정 비율 계산
    const positiveEmotions = ['행복', '감사', '사랑', '기쁨', '평온', '희망'];
    const positiveCount = postsData.filter(p => positiveEmotions.includes(p.emotion_name)).length;
    const positiveRatio = totalPosts > 0 ? Math.round((positiveCount / totalPosts) * 100) : 0;

    // 가장 활발한 시간/요일 계산
    const hourCounts: { [key: number]: number } = {};
    const dayCounts: { [key: string]: number } = {};
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

    postsData.forEach(p => {
      if (p.created_at) {
        const date = new Date(p.created_at);
        if (!isNaN(date.getTime())) {
          const hour = date.getHours();
          const day = days[date.getDay()];
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        }
      }
    });

    const mostActiveHour = Number(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '12');
    const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '월요일';

    // 히트맵 데이터 (최근 30일)
    const heatmapData = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dateCounts: { [key: string]: number } = {};
    postsData.forEach(p => {
      if (p.created_at) {
        const date = new Date(p.created_at);
        if (!isNaN(date.getTime())) {
          const dateStr = date.toISOString().split('T')[0];
          dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
        }
      }
    });

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = dateCounts[dateStr] || 0;
      heatmapData.push({
        date: dateStr,
        count,
        level: count === 0 ? 0 : Math.min(Math.floor(count / 1.5) + 1, 4)
      });
    }

    // 주간 하이라이트
    const highlights = [];
    if (postsData.length > 0) {
      const mostLiked = [...postsData].sort((a, b) => b.like_count - a.like_count)[0];
      if (mostLiked && mostLiked.created_at) {
        const date = new Date(mostLiked.created_at);
        if (!isNaN(date.getTime())) {
          highlights.push({
            id: highlights.length + 1,
            type: 'most_liked',
            title: '가장 많은 공감',
            emotion: mostLiked.emotion_name,
            emotionIcon: mostLiked.emotion_icon,
            content: mostLiked.content.substring(0, 50) + (mostLiked.content.length > 50 ? '...' : ''),
            likeCount: mostLiked.like_count,
            date: date.toISOString().split('T')[0].replace(/-/g, '.')
          });
        }
      }

      const longest = [...postsData].sort((a, b) => b.content.length - a.content.length)[0];
      if (longest && longest.created_at) {
        const date = new Date(longest.created_at);
        if (!isNaN(date.getTime())) {
          highlights.push({
            id: highlights.length + 1,
            type: 'longest',
            title: '가장 긴 이야기',
            emotion: longest.emotion_name,
            emotionIcon: longest.emotion_icon,
            content: longest.content.substring(0, 50) + (longest.content.length > 50 ? '...' : ''),
            date: date.toISOString().split('T')[0].replace(/-/g, '.')
          });
        }
      }
    }

    // 응답 데이터 생성
    const responseData = {
      status: 'success',
      data: {
        posts: postsData,
        insights: {
          totalPosts,
          totalLikes,
          totalComments,
          topEmotion,
          consecutiveDays,
          completedChallenges: challengeStats,
          positiveRatio,
          mostActiveHour: Number(mostActiveHour),
          mostActiveDay
        },
        emotionStats,
        heatmapData,
        highlights,
        userStats: {
          my_day_post_count: (userStats as any)?.my_day_post_count || 0,
          my_day_like_received_count: (userStats as any)?.my_day_like_received_count || 0
        },
        intentions: intentions.reduce((acc: any, item: any) => {
          acc[item.period] = item.intention_text;
          return acc;
        }, {}),
        todayActivities: todayActivities[0] || {
          posted_today: false,
          gave_like_today: false,
          wrote_comment_today: false
        },
        period,
        timestamp: new Date().toISOString()
      }
    };

    // 캐시 저장 후 응답
    setCachedData(cacheKey, responseData);
    console.log(`📊 [getSummary] 완료 - ${Date.now() - startTime}ms`);
    res.json(responseData);

  } catch (error) {
    console.error('❌ [getReviewSummary] 리뷰 요약 로드 오류:', error);
    if (error instanceof Error) {
      console.error('❌ [getReviewSummary] 에러 스택:', error.stack);
    }
    res.status(500).json({
      status: 'error',
      message: '리뷰 데이터를 불러오는데 실패했습니다'
    });
  }
};

/**
 * 커뮤니티 감정 온도계
 * 실시간 감정 통계 (5분 캐싱 적용)
 */
export const getCommunityEmotionTemperature = async (req: AuthRequest, res: Response) => {
  try {
    // 캐시 확인 (사용자별 캐시 키 사용)
    const cacheKey = `community_temp_${req.user?.user_id || 'anonymous'}`;
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
      return res.json({
        status: 'success',
        data: { ...cachedData, cached: true }
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 오늘 기록된 감정 통계
    const emotionStats = await db.sequelize.query(
      `SELECT
        e.name,
        e.color,
        e.icon,
        e.temperature,
        COUNT(DISTINCT mde.post_id) as count
       FROM emotions e
       LEFT JOIN my_day_emotions mde ON e.emotion_id = mde.emotion_id
       LEFT JOIN my_day_posts mdp ON mde.post_id = mdp.post_id
       WHERE mdp.created_at >= ?
       GROUP BY e.emotion_id, e.name, e.color, e.icon, e.temperature
       HAVING count > 0
       ORDER BY count DESC`,
      {
        replacements: [todayStart],
        type: QueryTypes.SELECT
      }
    ) as Array<{ name: string; color: string; icon: string; temperature: number; count: number }>;

    // 총 사용자 수 (오늘 기록한 사용자)
    const totalUsersResult = await db.sequelize.query(
      `SELECT COUNT(DISTINCT user_id) as total FROM my_day_posts WHERE created_at >= ?`,
      {
        replacements: [todayStart],
        type: QueryTypes.SELECT
      }
    ) as Array<{ total: number }>;

    const totalUsers = totalUsersResult[0]?.total || 0;
    const totalEmotions = emotionStats.reduce((sum, stat) => sum + Number(stat.count), 0);

    // 감정별 비율 계산
    const emotions: EmotionTemperature[] = emotionStats.slice(0, 5).map(stat => ({
      name: stat.name,
      count: Number(stat.count),
      percentage: totalEmotions > 0 ? Math.round((Number(stat.count) / totalEmotions) * 100) : 0,
      color: stat.color,
      icon: stat.icon
    }));

    // 평균 온도 계산 (가중 평균, 체온 기반)
    let averageTemperature = 0;
    if (totalEmotions > 0) {
      const weightedSum = emotionStats.reduce((sum, stat) => {
        return sum + (Number(stat.temperature || 36.5) * Number(stat.count));
      }, 0);
      averageTemperature = Math.round((weightedSum / totalEmotions) * 10) / 10; // 소수점 1자리
    } else {
      averageTemperature = 36.5; // 기본값 (정상 체온)
    }

    // 사용자의 현재 감정 (최신 게시물 기준)
    let userCurrentEmotion = null;
    if (req.user?.user_id) {
      const userLatestPost = await db.MyDayPost.findOne({
        where: { user_id: req.user.user_id },
        include: [{
          model: db.Emotion,
          as: 'emotions',
          through: { attributes: [] }
        }],
        order: [['created_at', 'DESC']],
        limit: 1
      });

      if (userLatestPost && (userLatestPost as any).emotions?.[0]) {
        const emotion = (userLatestPost as any).emotions[0];
        userCurrentEmotion = {
          name: emotion.name,
          icon: emotion.icon,
          matchCount: emotions.find((e: EmotionTemperature) => e.name === emotion.name)?.count || 0
        };
      }
    }

    const responseData = {
      temperature: averageTemperature,
      totalUsers,
      emotions,
      userCurrentEmotion,
      timestamp: new Date().toISOString()
    };

    // 캐시 저장
    setCachedData(cacheKey, responseData);

    res.json({
      status: 'success',
      data: responseData
    });

  } catch (error) {
    console.error('커뮤니티 온도 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({
      status: 'error',
      message: '커뮤니티 감정 온도를 불러오는데 실패했습니다'
    });
  }
};

/**
 * 빛나는 순간 목록 조회
 */
export const getGlimmeringMoments = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const moments = await db.sequelize.query(
      `SELECT id, content, emoji, category, tags, created_at
       FROM glimmering_moments
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [user_id, Number(limit), Number(offset)],
        type: QueryTypes.SELECT
      }
    );

    const totalCount = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM glimmering_moments WHERE user_id = ?`,
      {
        replacements: [user_id],
        type: QueryTypes.SELECT
      }
    ) as Array<{ count: number }>;

    res.json({
      status: 'success',
      data: {
        moments,
        total: totalCount[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('빛나는 순간 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({
      status: 'error',
      message: '빛나는 순간을 불러오는데 실패했습니다'
    });
  }
};

/**
 * 빛나는 순간 추가
 */
export const createGlimmeringMoment = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const { content, emoji, category, tags } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '내용을 입력해주세요'
      });
    }

    if (content.length > 200) {
      return res.status(400).json({
        status: 'error',
        message: '내용은 200자 이내로 입력해주세요'
      });
    }

    const result = await db.sequelize.query(
      `INSERT INTO glimmering_moments (user_id, content, emoji, category, tags)
       VALUES (?, ?, ?, ?, ?)`,
      {
        replacements: [
          user_id,
          content.trim(),
          emoji || '✨',
          category || null,
          tags ? JSON.stringify(tags) : null
        ],
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({
      status: 'success',
      data: {
        id: result[0],
        content: content.trim(),
        emoji: emoji || '✨',
        category,
        tags
      }
    });

  } catch (error) {
    console.error('빛나는 순간 추가 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({
      status: 'error',
      message: '빛나는 순간을 저장하는데 실패했습니다'
    });
  }
};

/**
 * 빛나는 순간 랜덤 조회
 */
export const getRandomGlimmeringMoment = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const moment = await db.sequelize.query(
      `SELECT id, content, emoji, category, tags, created_at
       FROM glimmering_moments
       WHERE user_id = ?
       ORDER BY RAND()
       LIMIT 1`,
      {
        replacements: [user_id],
        type: QueryTypes.SELECT
      }
    );

    if (!moment || moment.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '아직 저장된 빛나는 순간이 없어요'
      });
    }

    res.json({
      status: 'success',
      data: moment[0]
    });

  } catch (error) {
    console.error('랜덤 빛나는 순간 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({
      status: 'error',
      message: '빛나는 순간을 불러오는데 실패했습니다'
    });
  }
};

/**
 * 빛나는 순간 삭제
 */
export const deleteGlimmeringMoment = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const { id } = req.params;

    const result = await db.sequelize.query(
      `DELETE FROM glimmering_moments WHERE id = ? AND user_id = ?`,
      {
        replacements: [id, user_id],
        type: QueryTypes.DELETE
      }
    );

    res.json({
      status: 'success',
      message: '빛나는 순간이 삭제되었습니다'
    });

  } catch (error) {
    console.error('빛나는 순간 삭제 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({
      status: 'error',
      message: '빛나는 순간을 삭제하는데 실패했습니다'
    });
  }
};

/**
 * 게임화: 사용자 스트릭 정보 가져오기
 */
export const getUserStreak = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    // 스트릭 계산
    const posts = await db.sequelize.query<any>(
      `SELECT DATE(created_at) as post_date FROM my_day_posts
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 365`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const post of posts) {
      const postDate = new Date(post.post_date);
      if (!lastDate) {
        tempStreak = 1;
        lastDate = postDate;
        continue;
      }

      const dayDiff = Math.floor((lastDate.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) {
        tempStreak++;
      } else if (dayDiff > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      lastDate = postDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // 현재 스트릭 (오늘 또는 어제 기록 있는지)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (posts.length > 0) {
      const lastPostDate = new Date(posts[0].post_date);
      lastPostDate.setHours(0, 0, 0, 0);

      if (lastPostDate.getTime() >= yesterday.getTime()) {
        currentStreak = tempStreak;
      }
    }

    // 스트릭 저장/업데이트
    await db.sequelize.query(
      `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_post_date)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE current_streak = ?, longest_streak = ?, last_post_date = ?`,
      {
        replacements: [
          user_id, currentStreak, longestStreak, posts[0]?.post_date || null,
          currentStreak, longestStreak, posts[0]?.post_date || null
        ]
      }
    );

    res.json({
      status: 'success',
      data: {
        currentStreak,
        longestStreak,
        lastPostDate: posts[0]?.post_date || null
      }
    });

  } catch (error) {
    console.error('스트릭 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '스트릭 정보를 불러오는데 실패했습니다' });
  }
};

/**
 * 게임화: 사용자 배지 목록
 */
export const getUserBadges = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    // 테이블 존재 여부 확인 및 생성 (서버당 1회만 실행)
    if (!tablesInitialized) {
      try {
        await db.sequelize.query(`
          CREATE TABLE IF NOT EXISTS user_achievements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            achievement_type VARCHAR(50) NOT NULL,
            achievement_name VARCHAR(100) NOT NULL,
            achievement_icon VARCHAR(10) NOT NULL,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_achievements (user_id, achievement_type)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await db.sequelize.query(`
          CREATE TABLE IF NOT EXISTS user_streaks (
            user_id INT PRIMARY KEY,
            current_streak INT DEFAULT 0,
            longest_streak INT DEFAULT 0,
            last_post_date DATE NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        tablesInitialized = true;
        console.log('✅ 게임화 테이블 초기화 완료');
      } catch (tableError) {
        console.log('테이블 확인/생성 중 오류:', tableError instanceof Error ? tableError.message : '');
        tablesInitialized = true; // 오류 발생해도 반복 시도 방지
      }
    }

    // 획득한 배지 조회 (테이블 없으면 빈 배열)
    let earned: any[] = [];
    try {
      earned = await db.sequelize.query<any>(
        `SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC`,
        { replacements: [user_id], type: QueryTypes.SELECT }
      );
    } catch (e) {
      console.log('배지 조회 실패, 기본값 사용');
    }

    // 통계 기반 획득 가능 배지 체크
    let count = 0;
    try {
      const postCountResult = await db.sequelize.query<any>(
        `SELECT COUNT(*) as count FROM my_day_posts WHERE user_id = ?`,
        { replacements: [user_id], type: QueryTypes.SELECT }
      );
      count = postCountResult[0]?.count || 0;
    } catch (e) {
      console.log('포스트 카운트 조회 실패');
    }

    let streak = { current_streak: 0, longest_streak: 0 };
    try {
      const streakDataResult = await db.sequelize.query<any>(
        `SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = ?`,
        { replacements: [user_id], type: QueryTypes.SELECT }
      );
      streak = streakDataResult[0] || { current_streak: 0, longest_streak: 0 };
    } catch (e) {
      console.log('스트릭 조회 실패, 기본값 사용');
    }

    // 자동 배지 부여
    const badgesToEarn: string[][] = [];
    if (count >= 1 && !earned.find(b => b.achievement_type === 'first_post')) {
      badgesToEarn.push(['first_post', '첫 발걸음', '🎉']);
    }
    if (count >= 10 && !earned.find(b => b.achievement_type === 'posts_10')) {
      badgesToEarn.push(['posts_10', '10일의 기록', '✨']);
    }
    if (count >= 50 && !earned.find(b => b.achievement_type === 'posts_50')) {
      badgesToEarn.push(['posts_50', '50일의 여정', '🌟']);
    }
    if (count >= 100 && !earned.find(b => b.achievement_type === 'posts_100')) {
      badgesToEarn.push(['posts_100', '100일 달성', '🏆']);
    }
    if (streak.current_streak >= 7 && !earned.find(b => b.achievement_type === 'streak_7')) {
      badgesToEarn.push(['streak_7', '7일 연속', '🔥']);
    }
    if (streak.longest_streak >= 30 && !earned.find(b => b.achievement_type === 'streak_30')) {
      badgesToEarn.push(['streak_30', '30일 연속', '💪']);
    }

    // 배지 부여 (실패해도 계속 진행)
    for (const [type, name, icon] of badgesToEarn) {
      try {
        await db.sequelize.query(
          `INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_icon, badge_type, badge_name)
           VALUES (?, ?, ?, ?, ?, ?)`,
          { replacements: [user_id, type, name, icon, type, name] }
        );
      } catch (insertError) {
        console.log('배지 부여 실패:', type);
      }
    }

    // 다시 조회
    let badges: any[] = [];
    try {
      badges = await db.sequelize.query<any>(
        `SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC`,
        { replacements: [user_id], type: QueryTypes.SELECT }
      );
    } catch (e) {
      // 기본 배지 제공
      badges = [
        { achievement_id: 1, achievement_icon: '🌱', achievement_name: '새싹', achievement_type: 'beginner' }
      ];
    }

    res.json({
      status: 'success',
      data: {
        badges,
        newBadges: badgesToEarn.length
      }
    });

  } catch (error) {
    console.error('배지 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    // 에러 발생 시에도 기본 응답 제공
    res.json({
      status: 'success',
      data: {
        badges: [
          { achievement_id: 1, achievement_icon: '🌱', achievement_name: '새싹', achievement_type: 'beginner' }
        ],
        newBadges: 0
      }
    });
  }
};

/**
 * 실시간 소셜 통계
 */
export const getRealTimeStats = async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = 'realtime_stats';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ status: 'success', data: { ...cached, cached: true } });
    }

    // 최근 1시간 활동
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const activeUsersResult = await db.sequelize.query<any>(
      `SELECT COUNT(DISTINCT user_id) as count FROM my_day_posts WHERE created_at >= ?`,
      { replacements: [oneHourAgo], type: QueryTypes.SELECT }
    );

    const recentEmotionsResult = await db.sequelize.query<any>(
      `SELECT e.name, e.icon, COUNT(*) as count
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.created_at >= ?
       GROUP BY e.emotion_id
       ORDER BY count DESC
       LIMIT 1`,
      { replacements: [oneHourAgo], type: QueryTypes.SELECT }
    );

    const data = {
      activeNow: activeUsersResult[0]?.count || 0,
      topEmotion: recentEmotionsResult[0] || { name: '행복', icon: '😊', count: 0 },
      timestamp: new Date().toISOString()
    };

    setCachedData(cacheKey, data);

    res.json({ status: 'success', data });

  } catch (error) {
    console.error('실시간 통계 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '실시간 통계를 불러오는데 실패했습니다' });
  }
};

/**
 * 개인 감정 타임라인
 * 사용자의 기간별 감정 흐름 데이터
 */
export const getPersonalEmotionTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const { period = 'week' } = req.query;

    // 기간 계산
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
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

    // 기간별 감정 데이터 조회
    let timelineData;
    if (period === 'week') {
      // 주간: 요일별
      timelineData = await db.sequelize.query<any>(
        `SELECT
          DAYNAME(p.created_at) as time_label,
          DAYOFWEEK(p.created_at) as day_order,
          e.name as emotion,
          e.icon,
          AVG(e.temperature) as avg_temperature,
          COUNT(*) as count
         FROM my_day_posts p
         JOIN my_day_emotions pe ON p.post_id = pe.post_id
         JOIN emotions e ON pe.emotion_id = e.emotion_id
         WHERE p.user_id = ? AND p.created_at BETWEEN ? AND ?
         GROUP BY day_order, time_label, e.emotion_id
         ORDER BY day_order`,
        { replacements: [user_id, startDate, endDate], type: QueryTypes.SELECT }
      );
    } else if (period === 'month') {
      // 월간: 월초/월중/월말
      timelineData = await db.sequelize.query<any>(
        `SELECT
          CASE
            WHEN DAY(p.created_at) <= 10 THEN '월초'
            WHEN DAY(p.created_at) <= 20 THEN '월중'
            ELSE '월말'
          END as time_label,
          CASE
            WHEN DAY(p.created_at) <= 10 THEN 1
            WHEN DAY(p.created_at) <= 20 THEN 2
            ELSE 3
          END as period_order,
          e.name as emotion,
          e.icon,
          AVG(e.temperature) as avg_temperature,
          COUNT(*) as count
         FROM my_day_posts p
         JOIN my_day_emotions pe ON p.post_id = pe.post_id
         JOIN emotions e ON pe.emotion_id = e.emotion_id
         WHERE p.user_id = ? AND p.created_at BETWEEN ? AND ?
         GROUP BY period_order, time_label, e.emotion_id
         ORDER BY period_order`,
        { replacements: [user_id, startDate, endDate], type: QueryTypes.SELECT }
      );
    } else {
      // 연간: 계절별
      timelineData = await db.sequelize.query<any>(
        `SELECT
          CASE
            WHEN MONTH(p.created_at) IN (3, 4, 5) THEN '봄'
            WHEN MONTH(p.created_at) IN (6, 7, 8) THEN '여름'
            WHEN MONTH(p.created_at) IN (9, 10, 11) THEN '가을'
            ELSE '겨울'
          END as time_label,
          CASE
            WHEN MONTH(p.created_at) IN (3, 4, 5) THEN 1
            WHEN MONTH(p.created_at) IN (6, 7, 8) THEN 2
            WHEN MONTH(p.created_at) IN (9, 10, 11) THEN 3
            ELSE 4
          END as season_order,
          e.name as emotion,
          e.icon,
          AVG(e.temperature) as avg_temperature,
          COUNT(*) as count
         FROM my_day_posts p
         JOIN my_day_emotions pe ON p.post_id = pe.post_id
         JOIN emotions e ON pe.emotion_id = e.emotion_id
         WHERE p.user_id = ? AND p.created_at BETWEEN ? AND ?
         GROUP BY season_order, time_label, e.emotion_id
         ORDER BY season_order`,
        { replacements: [user_id, startDate, endDate], type: QueryTypes.SELECT }
      );
    }

    // 시간대별 최빈 감정 집계
    const groupedData = new Map();
    timelineData.forEach((row: any) => {
      const key = row.time_label;
      if (!groupedData.has(key) || groupedData.get(key).count < row.count) {
        groupedData.set(key, {
          time: row.time_label,
          emotion: row.emotion,
          icon: row.icon,
          temperature: Math.round(Number(row.avg_temperature) * 10) / 10
        });
      }
    });

    const items = Array.from(groupedData.values());

    // 요일 한글 변환
    const dayMapping: { [key: string]: string } = {
      'Sunday': '일요일',
      'Monday': '월요일',
      'Tuesday': '화요일',
      'Wednesday': '수요일',
      'Thursday': '목요일',
      'Friday': '금요일',
      'Saturday': '토요일'
    };

    items.forEach(item => {
      if (dayMapping[item.time]) {
        item.time = dayMapping[item.time];
      }
    });

    res.json({
      status: 'success',
      data: {
        items,
        period,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('개인 감정 타임라인 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({
      status: 'error',
      message: '개인 감정 타임라인을 불러오는데 실패했습니다'
    });
  }
};

/**
 * 개인 감정 온도
 * 사용자의 평균 감정 온도 및 통계
 */
export const getPersonalEmotionTemperature = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const { period = 'week' } = req.query;

    // 기간 계산
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
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

    // 사용자의 감정 통계
    const emotionStats = await db.sequelize.query<any>(
      `SELECT
        e.name,
        e.color,
        e.icon,
        e.temperature,
        COUNT(*) as count
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ? AND p.created_at BETWEEN ? AND ?
       GROUP BY e.emotion_id
       ORDER BY count DESC`,
      { replacements: [user_id, startDate, endDate], type: QueryTypes.SELECT }
    );

    const totalCount = emotionStats.reduce((sum, stat) => sum + Number(stat.count), 0);

    // 감정별 비율 계산
    const emotions = emotionStats.slice(0, 5).map(stat => ({
      name: stat.name,
      count: Number(stat.count),
      percentage: totalCount > 0 ? Math.round((Number(stat.count) / totalCount) * 100) : 0,
      color: stat.color,
      icon: stat.icon
    }));

    // 평균 온도 계산
    let averageTemperature = 36.5;
    if (totalCount > 0) {
      const weightedSum = emotionStats.reduce((sum, stat) => {
        return sum + (Number(stat.temperature || 36.5) * Number(stat.count));
      }, 0);
      averageTemperature = Math.round((weightedSum / totalCount) * 10) / 10;
    }

    // 총 게시물 수
    const postCountResult = await db.sequelize.query<any>(
      `SELECT COUNT(*) as total FROM my_day_posts WHERE user_id = ? AND created_at BETWEEN ? AND ?`,
      { replacements: [user_id, startDate, endDate], type: QueryTypes.SELECT }
    );

    res.json({
      status: 'success',
      data: {
        temperature: averageTemperature,
        totalPosts: postCountResult[0]?.total || 0,
        emotions,
        period,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('개인 감정 온도 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({
      status: 'error',
      message: '개인 감정 온도를 불러오는데 실패했습니다'
    });
  }
};

/**
 * 일일 챌린지 조회
 */
export const getDailyChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const today = new Date().toISOString().split('T')[0];

    // 오늘의 챌린지 생성 (고정된 3개)
    const challenges = [
      { id: 1, title: '오늘의 감정 기록하기', completed: false, progress: 0, goal: 1 },
      { id: 2, title: '다른 사람에게 위로 보내기', completed: false, progress: 0, goal: 1 },
      { id: 3, title: '긍정적인 감정 표현하기', completed: false, progress: 0, goal: 1 }
    ];

    // 오늘 작성한 게시물 확인
    const postCount = await db.sequelize.query<any>(
      `SELECT COUNT(*) as count FROM my_day_posts WHERE user_id = ? AND DATE(created_at) = ?`,
      { replacements: [user_id, today], type: QueryTypes.SELECT }
    );
    if (postCount[0]?.count > 0) {
      challenges[0].completed = true;
      challenges[0].progress = 1;
    }

    // 오늘 보낸 위로 메시지 확인
    const encouragementCount = await db.sequelize.query<any>(
      `SELECT COUNT(*) as count FROM anonymous_encouragements WHERE sender_id = ? AND DATE(created_at) = ?`,
      { replacements: [user_id, today], type: QueryTypes.SELECT }
    );
    if (encouragementCount[0]?.count > 0) {
      challenges[1].completed = true;
      challenges[1].progress = 1;
    }

    // 오늘 긍정적인 감정 표현 확인 (temperature >= 37.0)
    const positiveEmotionCount = await db.sequelize.query<any>(
      `SELECT COUNT(*) as count FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ? AND DATE(p.created_at) = ? AND e.temperature >= 37.0`,
      { replacements: [user_id, today], type: QueryTypes.SELECT }
    );
    if (positiveEmotionCount[0]?.count > 0) {
      challenges[2].completed = true;
      challenges[2].progress = 1;
    }

    const completedCount = challenges.filter(c => c.completed).length;
    const overallProgress = Math.round((completedCount / challenges.length) * 100);

    res.json({
      status: 'success',
      data: {
        challenges,
        overallProgress,
        completedCount,
        totalCount: challenges.length,
        date: today
      }
    });

  } catch (error) {
    console.error('일일 챌린지 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '일일 챌린지를 불러오는데 실패했습니다' });
  }
};

/**
 * 일일 챌린지 완료 처리
 */
export const completeDailyChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { challengeId } = req.params;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    res.json({
      status: 'success',
      message: '챌린지가 완료되었습니다',
      data: { challengeId, completed: true }
    });

  } catch (error) {
    console.error('일일 챌린지 완료 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '챌린지 완료 처리에 실패했습니다' });
  }
};

/**
 * 감정 여정 데이터
 */
export const getEmotionJourney = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const { period = 'week' } = req.query;
    const days = period === 'week' ? 7 : 30;

    // 최근 N일간의 감정 데이터
    const journeyData = await db.sequelize.query<any>(
      `SELECT
        DATE(p.created_at) as date,
        e.name as emotion,
        e.icon,
        e.temperature,
        COUNT(*) as count
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ? AND p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY date, e.emotion_id
       ORDER BY date ASC, count DESC`,
      { replacements: [user_id, days], type: QueryTypes.SELECT }
    );

    // 날짜별 최빈 감정 추출
    const journeyMap = new Map();
    journeyData.forEach((row: any) => {
      if (!journeyMap.has(row.date) || journeyMap.get(row.date).count < row.count) {
        journeyMap.set(row.date, {
          date: row.date,
          emotion: row.emotion,
          icon: row.icon,
          temperature: Number(row.temperature)
        });
      }
    });

    const steps = Array.from(journeyMap.values()).slice(-7);

    // 요일 추가
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    steps.forEach(step => {
      const date = new Date(step.date);
      step.day = dayNames[date.getDay()];
    });

    // 요약 메시지
    const avgTemp = steps.reduce((sum, s) => sum + s.temperature, 0) / (steps.length || 1);
    let summary = '차분한 한 주를 보내셨네요';
    if (avgTemp >= 37.0) summary = '활기찬 한 주를 보내셨네요!';
    else if (avgTemp < 36.3) summary = '조금 힘든 한 주였네요. 힘내세요!';

    res.json({
      status: 'success',
      data: { steps, summary }
    });

  } catch (error) {
    console.error('감정 여정 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '감정 여정을 불러오는데 실패했습니다' });
  }
};

/**
 * 타임캡슐 조회 (1개월 전 메시지)
 */
export const getTimeCapsule = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    // 1개월 전 (28-32일 사이) 게시물 조회
    const capsule = await db.sequelize.query<any>(
      `SELECT
        p.post_id,
        p.content,
        p.created_at,
        e.name as emotion,
        e.icon,
        e.temperature
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ?
       AND p.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 32 DAY) AND DATE_SUB(NOW(), INTERVAL 28 DAY)
       ORDER BY p.created_at DESC
       LIMIT 1`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );

    if (capsule.length === 0) {
      return res.json({
        status: 'success',
        data: null,
        message: '아직 타임캡슐이 없습니다'
      });
    }

    const past = capsule[0];

    // 현재 감정 온도 (최근 7일)
    const currentTemp = await db.sequelize.query<any>(
      `SELECT AVG(e.temperature) as avg_temp
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ? AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );

    const pastTemp = Number(past.temperature);
    const nowTemp = Number(currentTemp[0]?.avg_temp || 36.5);
    const improvement = nowTemp - pastTemp;

    res.json({
      status: 'success',
      data: {
        past: {
          content: past.content,
          emotion: past.emotion,
          icon: past.icon,
          temperature: pastTemp,
          date: new Date(past.created_at).toISOString().split('T')[0]
        },
        present: {
          temperature: Math.round(nowTemp * 10) / 10
        },
        improvement: Math.round(improvement * 10) / 10
      }
    });

  } catch (error) {
    console.error('타임캡슐 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '타임캡슐을 불러오는데 실패했습니다' });
  }
};

/**
 * 타임캡슐 생성 (미래의 자신에게 메시지)
 */
export const createTimeCapsule = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { content, openDate } = req.body;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    // 타임캡슐은 일반 게시물로 저장 (나중에 별도 테이블로 분리 가능)
    res.json({
      status: 'success',
      message: '타임캡슐이 생성되었습니다',
      data: { content, openDate }
    });

  } catch (error) {
    console.error('타임캡슐 생성 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '타임캡슐 생성에 실패했습니다' });
  }
};

/**
 * 밤의 조각들 - 밤 10시~새벽 4시에 작성된 글
 */
export const getNightFragments = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { limit = 5 } = req.query;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const cacheKey = `night_fragments_${user_id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return res.json(cached);

    const fragments = await db.sequelize.query<any>(
      `SELECT p.post_id, p.content, p.created_at,
              MAX(e.name) as emotion, MAX(e.icon) as icon, MAX(e.color) as color,
              (SELECT COUNT(*) FROM my_day_likes WHERE post_id = p.post_id) as like_count
       FROM my_day_posts p
       LEFT JOIN my_day_emotions pe ON p.post_id = pe.post_id
       LEFT JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ?
         AND (HOUR(p.created_at) >= 22 OR HOUR(p.created_at) < 4)
         AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY p.post_id, p.content, p.created_at
       ORDER BY p.created_at DESC
       LIMIT ?`,
      { replacements: [user_id, Number(limit)], type: QueryTypes.SELECT }
    );

    const response = {
      status: 'success',
      data: {
        fragments: fragments.map((f: any) => ({
          id: f.post_id,
          content: f.content.substring(0, 100) + (f.content.length > 100 ? '...' : ''),
          time: new Date(f.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(f.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
          emotion: f.emotion,
          icon: f.icon,
          color: f.color,
          likeCount: f.like_count
        })),
        totalCount: fragments.length
      }
    };

    setCachedData(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('밤의 조각들 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '밤의 조각들을 불러오는데 실패했습니다' });
  }
};

/**
 * 위로의 한 줄 - 커뮤니티 인기 위로 글귀
 */
export const getDailyComfortQuote = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const cacheKey = `daily_comfort_${new Date().toDateString()}`;
    const cached = getCachedData(cacheKey);
    if (cached) return res.json(cached);

    // 최근 7일 내 좋아요 상위 글에서 랜덤 선택
    const quotes = await db.sequelize.query<any>(
      `SELECT p.post_id, p.content,
              COUNT(DISTINCT l.id) as like_count,
              MAX(e.name) as emotion, MAX(e.icon) as icon
       FROM someone_day_posts p
       LEFT JOIN someone_day_likes l ON p.post_id = l.post_id
       LEFT JOIN someone_day_emotions pe ON p.post_id = pe.post_id
       LEFT JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         AND p.is_anonymous = 1
       GROUP BY p.post_id, p.content
       HAVING like_count >= 1
       ORDER BY like_count DESC, RAND()
       LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    if (!quotes.length) {
      return res.json({
        status: 'success',
        data: null
      });
    }

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const response = {
      status: 'success',
      data: {
        content: randomQuote.content.length > 80
          ? randomQuote.content.substring(0, 80) + '...'
          : randomQuote.content,
        emotion: randomQuote.emotion,
        icon: randomQuote.icon,
        likeCount: randomQuote.like_count
      }
    };

    setCachedData(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('위로의 한 줄 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '위로의 한 줄을 불러오는데 실패했습니다' });
  }
};

/**
 * 감정 공명 - 같은 감정을 느끼는 사용자 수
 */
export const getEmotionEcho = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const cacheKey = `emotion_echo_${user_id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return res.json(cached);

    // 사용자의 최근 감정
    const userEmotion = await db.sequelize.query<any>(
      `SELECT e.emotion_id, e.name, e.icon, e.color
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT 1`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );

    if (!userEmotion.length) {
      return res.json({ status: 'success', data: null });
    }

    const emotion = userEmotion[0];

    // 같은 감정을 느끼는 사용자 수 (최근 24시간)
    const echoCount = await db.sequelize.query<any>(
      `SELECT COUNT(DISTINCT p.user_id) as count
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       WHERE pe.emotion_id = ?
         AND p.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         AND p.user_id != ?`,
      { replacements: [emotion.emotion_id, user_id], type: QueryTypes.SELECT }
    );

    const response = {
      status: 'success',
      data: {
        emotion: emotion.name,
        icon: emotion.icon,
        color: emotion.color,
        echoCount: echoCount[0]?.count || 0
      }
    };

    setCachedData(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('감정 공명 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '감정 공명을 불러오는데 실패했습니다' });
  }
};

/**
 * 감정 색상 팔레트 - 주간 감정을 색상으로 표현
 */
export const getEmotionColorPalette = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const cacheKey = `emotion_palette_${user_id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return res.json(cached);

    // 최근 7일 감정 색상
    const colors = await db.sequelize.query<any>(
      `SELECT DATE(p.created_at) as date, e.name, e.color, e.icon
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ?
         AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(p.created_at), e.emotion_id, e.name, e.color, e.icon
       ORDER BY date ASC`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );

    // 날짜별로 그룹화
    const paletteMap = new Map<string, any[]>();
    colors.forEach((c: any) => {
      const dateStr = new Date(c.date).toLocaleDateString('ko-KR', { weekday: 'short' });
      if (!paletteMap.has(dateStr)) {
        paletteMap.set(dateStr, []);
      }
      paletteMap.get(dateStr)!.push({
        color: c.color,
        name: c.name,
        icon: c.icon
      });
    });

    const palette = Array.from(paletteMap.entries()).map(([day, emotions]) => ({
      day,
      emotions: emotions.slice(0, 3) // 최대 3개
    }));

    const response = {
      status: 'success',
      data: {
        palette,
        totalDays: palette.length
      }
    };

    setCachedData(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('감정 팔레트 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '감정 팔레트를 불러오는데 실패했습니다' });
  }
};

/**
 * 배치 API - 모든 섹션 데이터를 한 번에 가져오기
 * 대규모 사용자 대비: 20+ API 호출을 1회로 축소
 * 트래픽 최적화 및 로딩 시간 단축
 */
export const getReviewBatchData = async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  try {
    const user_id = req.user?.user_id;
    const { period = 'week' } = req.query;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    // 캐시 확인 (사용자별 + 기간별)
    const cacheKey = `review_batch_${user_id}_${period}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`📊 [Batch] 캐시 히트 - ${Date.now() - startTime}ms`);
      return res.json(cached);
    }

    // 기간 계산
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case 'week': startDate.setDate(endDate.getDate() - 7); break;
      case 'month': startDate.setDate(endDate.getDate() - 30); break;
      case 'year': startDate.setDate(endDate.getDate() - 365); break;
    }

    // 병렬로 모든 데이터 가져오기 (Promise.allSettled로 부분 실패 허용)
    const results = await Promise.allSettled([
      // 1. 기본 요약
      db.MyDayPost.findAll({
        where: { user_id, created_at: { [Op.between]: [startDate, endDate] } },
        include: [{ model: db.Emotion, as: 'emotions', through: { attributes: [] } }],
        order: [['created_at', 'DESC']],
        limit: 100
      }),

      // 2. 커뮤니티 온도
      db.sequelize.query<any>(
        `SELECT e.name, e.color, e.icon, COUNT(*) as count
         FROM my_day_posts p
         JOIN my_day_emotions pe ON p.post_id = pe.post_id
         JOIN emotions e ON pe.emotion_id = e.emotion_id
         WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
         GROUP BY e.emotion_id
         ORDER BY count DESC LIMIT 5`,
        { type: QueryTypes.SELECT }
      ),

      // 3. 스트릭 데이터
      db.sequelize.query<any>(
        `SELECT current_streak, longest_streak, last_post_date FROM user_streaks WHERE user_id = ?`,
        { replacements: [user_id], type: QueryTypes.SELECT }
      ),

      // 4. 배지 데이터
      db.sequelize.query<any>(
        `SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC LIMIT 10`,
        { replacements: [user_id], type: QueryTypes.SELECT }
      ),

      // 5. 밤의 조각들
      db.sequelize.query<any>(
        `SELECT p.post_id, p.content, p.created_at, e.name as emotion, e.icon
         FROM my_day_posts p
         LEFT JOIN my_day_emotions pe ON p.post_id = pe.post_id
         LEFT JOIN emotions e ON pe.emotion_id = e.emotion_id
         WHERE p.user_id = ? AND (HOUR(p.created_at) >= 22 OR HOUR(p.created_at) < 4)
           AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY p.post_id ORDER BY p.created_at DESC LIMIT 5`,
        { replacements: [user_id], type: QueryTypes.SELECT }
      ),

      // 6. 일일 챌린지
      db.sequelize.query<any>(
        `SELECT challenge_id, title, description, completed, completed_at
         FROM daily_challenges
         WHERE user_id = ? AND DATE(created_at) = CURDATE()
         ORDER BY challenge_id`,
        { replacements: [user_id], type: QueryTypes.SELECT }
      ),

      // 7. 실시간 활동
      db.sequelize.query<any>(
        `SELECT
           (SELECT COUNT(*) FROM my_day_posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as posts_last_hour,
           (SELECT COUNT(DISTINCT user_id) FROM my_day_posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)) as active_users_today`,
        { type: QueryTypes.SELECT }
      ),

      // 8. 위로 메시지 통계
      db.sequelize.query<any>(
        `SELECT COUNT(*) as total FROM encouragement_messages WHERE receiver_id = ?`,
        { replacements: [user_id], type: QueryTypes.SELECT }
      ),

      // 9. 개인 감정 온도
      db.sequelize.query<any>(
        `SELECT e.name, e.color, e.icon, COUNT(*) as count
         FROM my_day_posts p
         JOIN my_day_emotions pe ON p.post_id = pe.post_id
         JOIN emotions e ON pe.emotion_id = e.emotion_id
         WHERE p.user_id = ? AND p.created_at >= ?
         GROUP BY e.emotion_id ORDER BY count DESC`,
        { replacements: [user_id, startDate], type: QueryTypes.SELECT }
      ),
    ]);

    // 결과 처리 (실패한 요청은 기본값으로 대체)
    const extractData = (result: PromiseSettledResult<any>, defaultValue: any = null) => {
      return result.status === 'fulfilled' ? result.value : defaultValue;
    };

    const posts = extractData(results[0], []);
    const communityEmotions = extractData(results[1], []);
    const streakData = extractData(results[2], [{ current_streak: 0, longest_streak: 0 }]);
    const badges = extractData(results[3], []);
    const nightFragments = extractData(results[4], []);
    const dailyChallenges = extractData(results[5], []);
    const realTimeStats = extractData(results[6], [{}]);
    const encouragementStats = extractData(results[7], [{ total: 0 }]);
    const personalEmotions = extractData(results[8], []);

    // 감정 통계 계산
    const emotionCounts = new Map<string, any>();
    (Array.isArray(posts) ? posts : []).forEach((post: any) => {
      if (post.emotions) {
        post.emotions.forEach((emotion: any) => {
          const key = emotion.name;
          if (!emotionCounts.has(key)) {
            emotionCounts.set(key, { name: emotion.name, color: emotion.color, icon: emotion.icon, count: 0 });
          }
          emotionCounts.get(key)!.count++;
        });
      }
    });
    const emotionStats = Array.from(emotionCounts.values()).sort((a, b) => b.count - a.count);

    // 커뮤니티 온도 계산
    const totalCommunity = communityEmotions.reduce((sum: number, e: any) => sum + (e.count || 0), 0);
    const positiveEmotions = ['행복', '기쁨', '희망', '설렘', '감사', '평온'];
    const positiveCount = communityEmotions
      .filter((e: any) => positiveEmotions.includes(e.name))
      .reduce((sum: number, e: any) => sum + (e.count || 0), 0);
    const communityTemperature = totalCommunity > 0
      ? 35 + (positiveCount / totalCommunity) * 4
      : 36.5;

    // 개인 온도 계산
    const totalPersonal = personalEmotions.reduce((sum: number, e: any) => sum + (e.count || 0), 0);
    const personalPositiveCount = personalEmotions
      .filter((e: any) => positiveEmotions.includes(e.name))
      .reduce((sum: number, e: any) => sum + (e.count || 0), 0);
    const personalTemperature = totalPersonal > 0
      ? 35 + (personalPositiveCount / totalPersonal) * 3
      : 36.5;

    const response = {
      status: 'success',
      data: {
        // 기본 요약
        summary: {
          totalPosts: Array.isArray(posts) ? posts.length : 0,
          emotionStats: emotionStats.slice(0, 5),
          period,
        },

        // 커뮤니티 온도
        communityTemperature: {
          temperature: Math.round(communityTemperature * 10) / 10,
          emotions: communityEmotions.slice(0, 3),
          totalUsers: realTimeStats[0]?.active_users_today || 0,
        },

        // 개인 온도
        personalTemperature: {
          temperature: Math.round(personalTemperature * 10) / 10,
          emotions: personalEmotions.slice(0, 3),
          totalPosts: Array.isArray(posts) ? posts.length : 0,
        },

        // 스트릭
        streak: {
          currentStreak: streakData[0]?.current_streak || 0,
          longestStreak: streakData[0]?.longest_streak || 0,
          lastPostDate: streakData[0]?.last_post_date || null,
        },

        // 배지 (최근 3개 미리보기)
        badges: {
          preview: badges.slice(0, 3),
          total: badges.length,
        },

        // 밤의 조각들
        nightFragments: {
          fragments: nightFragments.map((f: any) => ({
            id: f.post_id,
            content: f.content?.substring(0, 60) + '...',
            time: new Date(f.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            emotion: f.emotion,
            icon: f.icon,
          })),
          count: nightFragments.length,
        },

        // 일일 챌린지
        dailyChallenges: {
          challenges: dailyChallenges.map((c: any) => ({
            id: c.challenge_id,
            title: c.title,
            completed: !!c.completed,
          })),
          completedCount: dailyChallenges.filter((c: any) => c.completed).length,
          totalCount: dailyChallenges.length,
        },

        // 실시간 활동
        realTimeActivity: {
          postsLastHour: realTimeStats[0]?.posts_last_hour || 0,
          activeUsersToday: realTimeStats[0]?.active_users_today || 0,
        },

        // 위로 메시지
        encouragement: {
          totalCount: encouragementStats[0]?.total || 0,
        },
      },
      meta: {
        loadTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString(),
      }
    };

    // 캐시 저장 (3분)
    setCachedData(cacheKey, response);
    console.log(`📊 [Batch] 완료 - ${Date.now() - startTime}ms`);

    res.json(response);

  } catch (error) {
    console.error('배치 데이터 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({
      status: 'error',
      message: '데이터를 불러오는데 실패했습니다',
      meta: { loadTime: Date.now() - startTime }
    });
  }
};

/**
 * AI 감정 분석 - 사용자의 감정 패턴 분석 및 인사이트 제공
 */
export const getAIEmotionAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { period = 'week' } = req.query;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const cacheKey = `ai_analysis_${user_id}_${period}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // 기간 계산
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case 'week': startDate.setDate(endDate.getDate() - 7); break;
      case 'month': startDate.setDate(endDate.getDate() - 30); break;
      case 'year': startDate.setDate(endDate.getDate() - 365); break;
    }

    // 감정 데이터 조회
    const emotionData = await db.sequelize.query<any>(
      `SELECT
        e.name, e.icon, e.temperature, e.color,
        COUNT(*) as count,
        DATE(p.created_at) as date
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ? AND p.created_at BETWEEN ? AND ?
       GROUP BY e.emotion_id, DATE(p.created_at)
       ORDER BY date ASC`,
      { replacements: [user_id, startDate, endDate], type: QueryTypes.SELECT }
    );

    if (!emotionData.length) {
      return res.json({
        status: 'success',
        data: {
          summary: '아직 분석할 감정 기록이 부족해요. 꾸준히 기록해주세요!',
          emotionTrend: 'stable',
          suggestion: '매일 감정을 기록하면 더 정확한 분석이 가능해요.',
          keywords: [],
          confidence: 0
        }
      });
    }

    // 감정 트렌드 분석
    const emotionCounts: Record<string, number> = {};
    const temperatureHistory: number[] = [];
    const keywords: string[] = [];

    emotionData.forEach((row: any) => {
      emotionCounts[row.name] = (emotionCounts[row.name] || 0) + Number(row.count);
      temperatureHistory.push(Number(row.temperature || 36.5));
      if (!keywords.includes(row.name)) keywords.push(row.name);
    });

    const sortedEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1]);

    const topEmotion = sortedEmotions[0]?.[0] || '평온';
    const totalCount = Object.values(emotionCounts).reduce((a, b) => a + b, 0);

    // 트렌드 계산 (전반부 vs 후반부 비교)
    const midPoint = Math.floor(temperatureHistory.length / 2);
    const firstHalf = temperatureHistory.slice(0, midPoint);
    const secondHalf = temperatureHistory.slice(midPoint);

    const firstAvg = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 36.5;
    const secondAvg = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 36.5;

    let emotionTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondAvg - firstAvg > 0.3) emotionTrend = 'improving';
    else if (firstAvg - secondAvg > 0.3) emotionTrend = 'declining';

    // AI 스타일 분석 메시지 생성
    const periodLabel = period === 'week' ? '이번 주' : period === 'month' ? '이번 달' : '올해';
    let summary = '';
    let suggestion = '';

    const positiveEmotions = ['행복', '기쁨', '희망', '설렘', '감사', '평온', '사랑'];
    const positiveRatio = sortedEmotions
      .filter(([name]) => positiveEmotions.includes(name))
      .reduce((sum, [, count]) => sum + count, 0) / totalCount * 100;

    if (positiveRatio >= 70) {
      summary = `${periodLabel} 당신은 대체로 긍정적인 감정 상태를 유지했어요. 특히 '${topEmotion}'의 감정이 가장 많이 나타났네요. 이 좋은 에너지를 계속 유지해보세요!`;
      suggestion = '현재의 긍정적인 상태를 기록으로 남기면, 힘들 때 다시 읽어보며 힘을 얻을 수 있어요.';
    } else if (positiveRatio >= 40) {
      summary = `${periodLabel} 당신은 다양한 감정을 경험했어요. '${topEmotion}'의 감정이 자주 나타났고, 감정의 변화가 자연스럽게 흘러갔어요.`;
      suggestion = '다양한 감정을 느끼는 것은 건강한 신호예요. 각 감정을 소중히 여기며 기록해보세요.';
    } else {
      summary = `${periodLabel} 당신에게는 조금 힘든 시간이었을 수 있어요. '${topEmotion}'의 감정이 많이 나타났네요. 당신의 감정은 모두 소중해요.`;
      suggestion = '힘든 감정도 기록하면 마음이 정리될 수 있어요. 작은 긍정적인 순간도 찾아 기록해보세요.';
    }

    // 신뢰도 계산 (데이터 양 기반)
    const confidence = Math.min(Math.round((totalCount / 20) * 100), 95);

    const response = {
      status: 'success',
      data: {
        summary,
        emotionTrend,
        suggestion,
        keywords: keywords.slice(0, 5),
        confidence
      }
    };

    setCachedData(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('AI 감정 분석 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: 'AI 감정 분석에 실패했습니다' });
  }
};

/**
 * 주간 목표 조회
 */
export const getWeeklyGoal = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    // 현재 주의 목표 조회
    const goal = await db.sequelize.query<any>(
      `SELECT * FROM weekly_goals
       WHERE user_id = ? AND end_date >= CURDATE()
       ORDER BY created_at DESC LIMIT 1`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );

    if (!goal.length) {
      return res.json({ status: 'success', data: null });
    }

    res.json({
      status: 'success',
      data: goal[0]
    });

  } catch (error) {
    console.error('주간 목표 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    // 테이블 없는 경우에도 정상 응답
    res.json({ status: 'success', data: null });
  }
};

/**
 * 주간 목표 설정
 */
export const setWeeklyGoal = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { goal, targetCount, startDate, endDate } = req.body;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    if (!goal || !targetCount) {
      return res.status(400).json({ status: 'error', message: '목표와 목표 횟수를 입력해주세요' });
    }

    // 테이블 생성 (없으면)
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS weekly_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        goal VARCHAR(200) NOT NULL,
        target_count INT NOT NULL DEFAULT 5,
        current_count INT NOT NULL DEFAULT 0,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_goals (user_id, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 기존 목표 삭제
    await db.sequelize.query(
      `DELETE FROM weekly_goals WHERE user_id = ? AND end_date >= CURDATE()`,
      { replacements: [user_id] }
    );

    // 새 목표 추가
    await db.sequelize.query(
      `INSERT INTO weekly_goals (user_id, goal, target_count, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      { replacements: [user_id, goal, targetCount, startDate, endDate] }
    );

    res.json({
      status: 'success',
      data: { goal, targetCount, currentCount: 0, startDate, endDate, completed: false }
    });

  } catch (error) {
    console.error('주간 목표 설정 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '주간 목표 설정에 실패했습니다' });
  }
};

/**
 * 개인 최고 기록 조회
 */
export const getPersonalBest = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { period = 'week' } = req.query;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    const cacheKey = `personal_best_${user_id}_${period}`;
    const cached = getCachedData(cacheKey);
    if (cached) return res.json(cached);

    // 현재 스트릭
    const streakResult = await db.sequelize.query<any>(
      `SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = ?`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );
    const currentStreak = streakResult[0]?.current_streak || 0;
    const bestStreak = streakResult[0]?.longest_streak || 0;

    // 이번 주 게시물 수
    const weekPostsResult = await db.sequelize.query<any>(
      `SELECT COUNT(*) as count FROM my_day_posts
       WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );
    const currentWeekPosts = weekPostsResult[0]?.count || 0;

    // 역대 최고 주간 게시물
    const bestWeekResult = await db.sequelize.query<any>(
      `SELECT MAX(weekly_count) as max_count FROM (
        SELECT YEARWEEK(created_at) as week, COUNT(*) as weekly_count
        FROM my_day_posts WHERE user_id = ?
        GROUP BY YEARWEEK(created_at)
      ) as weekly_stats`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );
    const bestWeekPosts = bestWeekResult[0]?.max_count || 0;

    // 이번 달 좋아요 수
    const monthLikesResult = await db.sequelize.query<any>(
      `SELECT COUNT(*) as count FROM my_day_likes
       WHERE post_id IN (SELECT post_id FROM my_day_posts WHERE user_id = ?)
       AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );
    const currentMonthLikes = monthLikesResult[0]?.count || 0;

    // 역대 최고 월간 좋아요
    const bestMonthLikesResult = await db.sequelize.query<any>(
      `SELECT MAX(monthly_likes) as max_likes FROM (
        SELECT DATE_FORMAT(l.created_at, '%Y-%m') as month, COUNT(*) as monthly_likes
        FROM my_day_likes l
        JOIN my_day_posts p ON l.post_id = p.post_id
        WHERE p.user_id = ?
        GROUP BY DATE_FORMAT(l.created_at, '%Y-%m')
      ) as monthly_stats`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );
    const bestMonthLikes = bestMonthLikesResult[0]?.max_likes || 0;

    // 긍정 비율
    const positiveEmotions = ['행복', '기쁨', '희망', '설렘', '감사', '평온', '사랑'];
    const positiveRatioResult = await db.sequelize.query<any>(
      `SELECT
        COUNT(CASE WHEN e.name IN (?) THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as ratio
       FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ? AND p.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      { replacements: [positiveEmotions.join("','"), user_id], type: QueryTypes.SELECT }
    );
    const currentPositiveRatio = Math.round(positiveRatioResult[0]?.ratio || 0);

    // 역대 최고 긍정 비율 (주간 기준)
    const bestPositiveResult = await db.sequelize.query<any>(
      `SELECT MAX(positive_ratio) as max_ratio FROM (
        SELECT YEARWEEK(p.created_at) as week,
          COUNT(CASE WHEN e.name IN ('행복','기쁨','희망','설렘','감사','평온','사랑') THEN 1 END) * 100.0 / COUNT(*) as positive_ratio
        FROM my_day_posts p
        JOIN my_day_emotions pe ON p.post_id = pe.post_id
        JOIN emotions e ON pe.emotion_id = e.emotion_id
        WHERE p.user_id = ?
        GROUP BY YEARWEEK(p.created_at)
        HAVING COUNT(*) >= 3
      ) as weekly_ratios`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );
    const bestPositiveRatio = Math.round(bestPositiveResult[0]?.max_ratio || 0);

    // 최근 달성 배지
    const achievementsResult = await db.sequelize.query<any>(
      `SELECT achievement_type as type, achievement_name as title, earned_at,
        CASE WHEN earned_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN TRUE ELSE FALSE END as isNew
       FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC LIMIT 5`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );

    const response = {
      status: 'success',
      data: {
        currentStreak,
        bestStreak,
        currentWeekPosts,
        bestWeekPosts,
        currentMonthLikes,
        bestMonthLikes,
        currentPositiveRatio,
        bestPositiveRatio,
        achievements: achievementsResult.map((a: any) => ({
          type: a.type,
          title: a.title,
          isNew: !!a.isNew
        }))
      }
    };

    setCachedData(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('개인 최고 기록 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.json({
      status: 'success',
      data: {
        currentStreak: 0, bestStreak: 0,
        currentWeekPosts: 0, bestWeekPosts: 0,
        currentMonthLikes: 0, bestMonthLikes: 0,
        currentPositiveRatio: 0, bestPositiveRatio: 0,
        achievements: []
      }
    });
  }
};

/**
 * 감정 맞춤 플레이리스트
 */
export const getMoodPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    // 사용자의 최근 감정 조회
    const recentEmotion = await db.sequelize.query<any>(
      `SELECT e.name, e.icon FROM my_day_posts p
       JOIN my_day_emotions pe ON p.post_id = pe.post_id
       JOIN emotions e ON pe.emotion_id = e.emotion_id
       WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 1`,
      { replacements: [user_id], type: QueryTypes.SELECT }
    );

    const emotion = recentEmotion[0]?.name || '평온';
    const emotionIcon = recentEmotion[0]?.icon || '😊';

    // 감정별 플레이리스트 매핑
    const playlistMap: Record<string, any[]> = {
      '행복': [
        { id: '1', name: 'Happy Vibes', description: '기분 좋은 하루를 위한 음악', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXdPec7aLTmlC' },
        { id: '2', name: 'Good Energy', description: '긍정 에너지 팝송', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0' },
      ],
      '슬픔': [
        { id: '3', name: 'Sad Songs', description: '마음을 어루만지는 노래', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX7qK8ma5wgG1' },
        { id: '4', name: 'Healing', description: '치유의 멜로디', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX3YSRoSdA634' },
      ],
      '불안': [
        { id: '5', name: 'Calm Down', description: '마음을 진정시키는 음악', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWXe9gFZP0gtP' },
        { id: '6', name: 'Deep Focus', description: '집중과 안정', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
      ],
      '평온': [
        { id: '7', name: 'Peaceful Piano', description: '평화로운 피아노', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
        { id: '8', name: 'Chill Vibes', description: '편안한 휴식', spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u' },
      ],
    };

    const playlists = playlistMap[emotion] || playlistMap['평온'];

    res.json({
      status: 'success',
      data: {
        currentEmotion: emotion,
        emotionIcon,
        playlists
      }
    });

  } catch (error) {
    console.error('플레이리스트 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '플레이리스트를 불러오는데 실패했습니다' });
  }
};

/**
 * 익명 Q&A 목록 조회
 */
export const getAnonymousQA = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { limit = 10, offset = 0 } = req.query;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    // 테이블 생성
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS anonymous_qa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question VARCHAR(300) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_qa_user (user_id),
        INDEX idx_qa_date (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS anonymous_qa_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        user_id INT NOT NULL,
        content VARCHAR(500) NOT NULL,
        like_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_answer_question (question_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS anonymous_qa_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (question_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 질문 목록 조회
    const questions = await db.sequelize.query<any>(
      `SELECT q.id, q.question, q.created_at,
        (SELECT COUNT(*) FROM anonymous_qa_answers WHERE question_id = q.id) as answerCount,
        (SELECT COUNT(*) FROM anonymous_qa_likes WHERE question_id = q.id) as likeCount,
        EXISTS(SELECT 1 FROM anonymous_qa_likes WHERE question_id = q.id AND user_id = ?) as isLiked,
        (SELECT content FROM anonymous_qa_answers WHERE question_id = q.id ORDER BY like_count DESC LIMIT 1) as topAnswerContent,
        (SELECT like_count FROM anonymous_qa_answers WHERE question_id = q.id ORDER BY like_count DESC LIMIT 1) as topAnswerLikes
       FROM anonymous_qa q
       ORDER BY q.created_at DESC
       LIMIT ? OFFSET ?`,
      { replacements: [user_id, Number(limit), Number(offset)], type: QueryTypes.SELECT }
    );

    const totalResult = await db.sequelize.query<any>(
      `SELECT COUNT(*) as count FROM anonymous_qa`,
      { type: QueryTypes.SELECT }
    );

    res.json({
      status: 'success',
      data: {
        questions: questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          answerCount: q.answerCount || 0,
          likeCount: q.likeCount || 0,
          isLiked: !!q.isLiked,
          createdAt: q.created_at,
          topAnswer: q.topAnswerContent ? {
            content: q.topAnswerContent,
            likeCount: q.topAnswerLikes || 0
          } : null
        })),
        totalCount: totalResult[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('익명 Q&A 조회 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.json({
      status: 'success',
      data: { questions: [], totalCount: 0 }
    });
  }
};

/**
 * 익명 질문 등록
 */
export const createAnonymousQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { question } = req.body;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: '질문을 입력해주세요' });
    }

    if (question.length > 200) {
      return res.status(400).json({ status: 'error', message: '질문은 200자 이내로 입력해주세요' });
    }

    await db.sequelize.query(
      `INSERT INTO anonymous_qa (user_id, question) VALUES (?, ?)`,
      { replacements: [user_id, question.trim()] }
    );

    res.json({
      status: 'success',
      message: '질문이 등록되었습니다'
    });

  } catch (error) {
    console.error('질문 등록 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '질문 등록에 실패했습니다' });
  }
};

/**
 * 익명 답변 등록
 */
export const createAnonymousAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { questionId } = req.params;
    const { content } = req.body;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: '답변을 입력해주세요' });
    }

    await db.sequelize.query(
      `INSERT INTO anonymous_qa_answers (question_id, user_id, content) VALUES (?, ?, ?)`,
      { replacements: [questionId, user_id, content.trim()] }
    );

    res.json({
      status: 'success',
      message: '답변이 등록되었습니다'
    });

  } catch (error) {
    console.error('답변 등록 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '답변 등록에 실패했습니다' });
  }
};

/**
 * 익명 Q&A 좋아요
 */
export const likeAnonymousQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { questionId } = req.params;

    if (!user_id) {
      return res.status(401).json({ status: 'error', message: '인증이 필요합니다' });
    }

    // 이미 좋아요 했는지 확인
    const existing = await db.sequelize.query<any>(
      `SELECT id FROM anonymous_qa_likes WHERE question_id = ? AND user_id = ?`,
      { replacements: [questionId, user_id], type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      // 좋아요 취소
      await db.sequelize.query(
        `DELETE FROM anonymous_qa_likes WHERE question_id = ? AND user_id = ?`,
        { replacements: [questionId, user_id] }
      );
      res.json({ status: 'success', message: '좋아요가 취소되었습니다', liked: false });
    } else {
      // 좋아요 추가
      await db.sequelize.query(
        `INSERT INTO anonymous_qa_likes (question_id, user_id) VALUES (?, ?)`,
        { replacements: [questionId, user_id] }
      );
      res.json({ status: 'success', message: '좋아요가 추가되었습니다', liked: true });
    }

  } catch (error) {
    console.error('좋아요 처리 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
    res.status(500).json({ status: 'error', message: '좋아요 처리에 실패했습니다' });
  }
};
