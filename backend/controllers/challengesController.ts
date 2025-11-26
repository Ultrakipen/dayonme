import { Response } from 'express';
import { AuthRequest } from '../types/express';
import db from '../models';
import { Op } from 'sequelize';
import { createNotification } from './notificationController';
import { cacheHelper } from '../config/redis';

class ChallengesController {
  // 챌린지 상태를 동적으로 계산하는 공통 함수
  private calculateDynamicStatus(startDate: string | Date, endDate: string | Date): 'upcoming' | 'active' | 'completed' {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 시작일과 종료일을 날짜만으로 정규화 (시간 제거)
    const startNormalized = new Date(startDate);
    const endNormalized = new Date(endDate);
    const start = new Date(startNormalized.getFullYear(), startNormalized.getMonth(), startNormalized.getDate());
    const end = new Date(endNormalized.getFullYear(), endNormalized.getMonth(), endNormalized.getDate());

    // 날짜 비교 (오늘 시작하는 챌린지는 active로 처리)
    if (today < start) {
      return 'upcoming';
    } else if (today > end) {
      return 'completed';
    } else {
      return 'active';
    }
  }

  // 챌린지 배열에 동적 상태를 적용하는 헬퍼 함수
  private applyDynamicStatus(challenges: any[]): any[] {
    return challenges.map(challenge => ({
      ...challenge,
      status: this.calculateDynamicStatus(challenge.start_date, challenge.end_date)
    }));
  }
  // 챌린지 목록 조회 (성능 최적화)
  async getChallenges(req: AuthRequest, res: Response) {
    try {
      console.log('=== 챌린지 목록 조회 시작 ===');
      const userId = (req as any).user?.user_id;
      console.log('요청 사용자:', userId || 'Unknown');

   const {
  page = 1,
  limit = 20,
  sort_by = 'created_at',
  order = 'desc',
  status,
  search,
  query,
  tags,
  weeklyHot = 'false'
} = req.query;

     console.log('요청 파라미터:', { page, limit, sort_by, order, status, search, query, tags, weeklyHot });

      const offset = (Number(page) - 1) * Number(limit);
      let orderBy: any = [['created_at', order.toString().toUpperCase()]];

      // 정렬 옵션
      if (sort_by === 'popular' || sort_by === 'participant_count') {
        orderBy = [['participant_count', 'DESC']];
      } else if (sort_by === 'start_date') {
        orderBy = [['start_date', order.toString().toUpperCase()]];
      } else if (sort_by === 'ending_soon') {
        orderBy = [['end_date', 'ASC']];
      } else if (sort_by === 'recommended') {
        // 추천: 참여자 수와 좋아요 수를 고려한 정렬 (일단 participant_count로 정렬)
        orderBy = [['participant_count', 'DESC'], ['like_count', 'DESC']];
      }

      // 간단한 조건으로 시작 - 무한 루프 방지
      const whereCondition: any = { is_public: true };

      // 이번 주 HOT 챌린지 필터링
      if (weeklyHot === 'true') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 이번 주 월요일 계산
        const currentDay = today.getDay(); // 0 (일요일) ~ 6 (토요일)
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // 일요일이면 6, 그 외는 현재 요일 - 1
        const thisWeekMonday = new Date(today);
        thisWeekMonday.setDate(today.getDate() - daysFromMonday);

        // 이번 주 일요일 계산
        const thisWeekSunday = new Date(thisWeekMonday);
        thisWeekSunday.setDate(thisWeekMonday.getDate() + 6);
        thisWeekSunday.setHours(23, 59, 59, 999);

        console.log('🔥 이번 주 HOT 챌린지 기간:', {
          시작: thisWeekMonday.toISOString().split('T')[0],
          종료: thisWeekSunday.toISOString().split('T')[0]
        });

        // 이번 주에 생성되었거나, 이번 주 동안 활성 상태인 챌린지만 포함
        whereCondition[Op.and] = [
          {
            [Op.or]: [
              // 이번 주에 생성된 챌린지
              {
                created_at: {
                  [Op.gte]: thisWeekMonday,
                  [Op.lte]: thisWeekSunday
                }
              },
              // 이번 주 동안 활성 상태인 챌린지
              {
                [Op.and]: [
                  { start_date: { [Op.lte]: thisWeekSunday } },
                  { end_date: { [Op.gte]: thisWeekMonday } }
                ]
              }
            ]
          },
          // 종료되지 않은 챌린지만 포함
          {
            end_date: { [Op.gte]: today }
          }
        ];
      }

      // 상태 필터 - 동적 상태 계산 후에 적용하기 위해 주석 처리
      // if (status && status !== 'all') {
      //   whereCondition.status = status;
      // }

      // 검색 조건 - query 파라미터도 지원
      const searchTerm = query || search;
      if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim().length > 0) {
        whereCondition[Op.or] = [
          { title: { [Op.like]: `%${searchTerm.trim()}%` } },
          { description: { [Op.like]: `%${searchTerm.trim()}%` } }
        ];
        // 태그 검색 조건
if (tags) {
  const tagsArray = Array.isArray(tags) ? tags : [tags];

  // 각 태그에 대해 JSON_CONTAINS 조건 생성
  const tagConditions = tagsArray.map(tag =>
    db.sequelize.where(
      db.sequelize.fn('JSON_CONTAINS',
        db.sequelize.col('tags'),
        JSON.stringify(tag)
      ),
      1
    )
  );

  // 모든 태그가 포함된 챌린지만 검색 (AND 조건)
  if (whereCondition[Op.and]) {
    whereCondition[Op.and] = [...whereCondition[Op.and], ...tagConditions];
  } else {
    whereCondition[Op.and] = tagConditions;
  }
}
      }

      console.log('단순화된 쿼리 조건:', JSON.stringify(whereCondition, null, 2));

      // Redis 캐싱 (사용자별 캐시 제외, 공개 데이터만)
      const cacheKey = `challenges:${page}:${limit}:${sort_by}:${order}:${status || 'all'}:${weeklyHot}:${searchTerm || ''}`;
      const cached = await cacheHelper.get(cacheKey);
      if (cached && !userId) { // 비로그인 사용자는 캐시 사용
        console.log('✅ Redis 캐시 HIT:', cacheKey);
        return res.json(cached);
      }

      console.log('데이터베이스 쿼리 시작...');

      // 이번 주 HOT 챌린지인 경우 더 많은 데이터를 조회하여 정렬
      // status 필터가 있는 경우에도 동적 계산 후 필터링하기 위해 모든 데이터 조회
      const needsFullData = weeklyHot === 'true' || (status && status !== 'all');
      const queryLimit = needsFullData ? 1000 : Math.min(Number(limit), 50);
      const queryOffset = needsFullData ? 0 : offset;

      // 챌린지 목록과 댓글/좋아요 수 조회 (N+1 쿼리 방지)
      const challenges = await db.Challenge.findAll({
        where: whereCondition,
        order: weeklyHot === 'true' ? undefined : orderBy, // HOT 챌린지는 나중에 정렬
        limit: queryLimit, // 최대 50개로 제한
        offset: queryOffset,
        raw: false, // Sequelize 인스턴스로 가져온 후 수동으로 직렬화
        nest: true, // 중첩된 객체 구조 유지
        // N+1 쿼리 방지: creator 정보 join
        include: [
          {
            model: db.User,
            as: 'creator',
            attributes: ['user_id', 'username', 'nickname'],
            required: false,
          }
        ],
        attributes: [
          'challenge_id',
          'title',
          'description',
          'start_date',
          'end_date',
          'participant_count',
          'status',
          'created_at',
          'creator_id',
          'tags',
          'image_urls',
          // 댓글 수, 좋아요 수, 감정 나누기 수를 서브쿼리로 계산
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM challenge_comments
              WHERE challenge_comments.challenge_id = Challenge.challenge_id
            )`),
            'comment_count'
          ],
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM challenge_likes
              WHERE challenge_likes.challenge_id = Challenge.challenge_id
            )`),
            'like_count'
          ],
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM challenge_emotions
              WHERE challenge_emotions.challenge_id = Challenge.challenge_id
            )`),
            'progress_entry_count'
          ]
        ]
      }).then(results => results.map(r => r.get({ plain: true })));

      console.log(`데이터베이스에서 ${challenges.length}개 챌린지 조회 완료`);

      // HOT 점수 계산 및 정렬 (개선된 알고리즘)
      let sortedChallenges = challenges;
      if (weeklyHot === 'true' || sort_by === 'popular') {
        const now = Date.now();
        const totalChallenges = challenges.length;

        // 동적 기간 설정 (게시물 수에 따라)
        const minParticipants = totalChallenges > 1000 ? 50 : totalChallenges > 500 ? 30 : totalChallenges > 100 ? 20 : 10;
        const periodDays = totalChallenges > 1000 ? 3 : totalChallenges > 500 ? 7 : totalChallenges > 100 ? 14 : 30;

        sortedChallenges = challenges
          .filter((c: any) => c.participant_count >= minParticipants)
          .map((challenge: any) => {
            const createdAt = new Date(challenge.created_at).getTime();
            const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);

            // 기간 필터 적용
            if (daysSinceCreated > periodDays) return null;

            // 개선된 가중치 (참여자×5, 좋아요×3, 댓글×2)
            const baseScore =
              (challenge.participant_count * 5) +
              ((challenge.like_count || 0) * 3) +
              ((challenge.comment_count || 0) * 2);

            // 경과일 패널티 강화
            const dayPenalty = daysSinceCreated * 10;

            // 급상승 보너스 (24시간 내 생성 + 참여자 50명 이상)
            const trendingBonus = (daysSinceCreated < 1 && challenge.participant_count >= 50) ? 100 : 0;

            // HOT 점수
            const hotScore = baseScore - dayPenalty + trendingBonus;

            // 급상승 판단 (24시간 이내 & 참여자 30명 이상)
            const isTrending = daysSinceCreated < 1 && challenge.participant_count >= 30;

            // 신규 뱃지 (7일 이내)
            const isNew = daysSinceCreated < 7;

            return {
              ...challenge,
              hot_score: Math.max(0, hotScore),
              is_trending: isTrending,
              is_new: isNew
            };
          })
          .filter(c => c !== null)
          .sort((a, b) => b.hot_score - a.hot_score)
          .slice(offset, offset + Number(limit));

        console.log('🔥 HOT 점수 정렬 완료:', sortedChallenges.slice(0, 3).map((c: any) => ({
          제목: c.title,
          HOT점수: c.hot_score.toFixed(2),
          급상승: c.is_trending,
          신규: c.is_new
        })));
      }

      console.log(`최종 ${sortedChallenges.length}개 챌린지 반환 준비`);

      // 사용자별 참여 상태 확인
      const participationStatus: { [key: number]: boolean } = {};
      const progressStatus: { [key: number]: number } = {};
      const reportStatus: { [key: number]: boolean } = {};
      if (userId) {
        console.log(`사용자 ${userId}의 참여 상태 확인 중...`);

        const challengeIds = sortedChallenges.map(c => c.challenge_id).filter((id): id is number => id !== undefined);
        console.log(`확인할 챌린지 IDs: ${JSON.stringify(challengeIds)}`);

        const participations = await db.ChallengeParticipant.findAll({
          where: {
            user_id: userId,
            challenge_id: challengeIds
          },
          attributes: ['challenge_id', 'user_id'],
          raw: true
        });

        console.log(`조회된 참여 데이터:`, participations);

        // 참여 상태를 객체로 변환
        participations.forEach((p: any) => {
          participationStatus[p.challenge_id] = true;
          console.log(`챌린지 ${p.challenge_id} 참여 중으로 설정`);
        });

        console.log(`참여 상태 확인 완료: ${participations.length}개 참여 중`);
        console.log(`participationStatus 객체:`, participationStatus);

        // 참여 중인 챌린지의 달성률 계산
        if (participations.length > 0) {
          const participatingChallengeIds = participations.map((p: any) => p.challenge_id);

          const emotionLogs = await db.ChallengeEmotion.findAll({
            where: {
              user_id: userId,
              challenge_id: participatingChallengeIds
            },
            attributes: ['challenge_id', [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('log_date'))), 'completed_days']],
            group: ['challenge_id'],
            raw: true
          });

          emotionLogs.forEach((log: any) => {
            const challenge = sortedChallenges.find(c => c.challenge_id === log.challenge_id);
            if (challenge) {
              const now = new Date();
              const startDate = new Date(challenge.start_date);
              const endDate = new Date(challenge.end_date);
              const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              const elapsedDays = Math.min(Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, totalDays);
              const completedDays = parseInt(log.completed_days) || 0;
              progressStatus[log.challenge_id] = Math.min(Math.round((completedDays / elapsedDays) * 100), 100);
            }
          });
        }

        // 신고 상태 확인
        const reports = await db.ChallengeReport.findAll({
          where: {
            reporter_id: userId,
            challenge_id: challengeIds as number[]
          },
          attributes: ['challenge_id'],
          raw: true
        });

        reports.forEach((r: any) => {
          reportStatus[r.challenge_id] = true;
        });

        console.log(`신고 상태 확인 완료: ${reports.length}개 신고함`);
      } else {
        console.log('사용자 ID가 없어서 참여 상태 확인하지 않음');
      }

      // Get base URL from environment or request for image URLs
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3001';
      const baseUrl = `${protocol}://${host}`;

      // 동적 상태 계산 및 참여 상태 추가
      const challengesWithAllInfo = sortedChallenges.map(challenge => {
        // image_urls 파싱 및 전체 URL로 변환
        let parsedImageUrls = challenge.image_urls ? (typeof challenge.image_urls === 'string' ? JSON.parse(challenge.image_urls) : challenge.image_urls) : [];

        // 상대 경로를 전체 URL로 변환
        if (parsedImageUrls && Array.isArray(parsedImageUrls)) {
          parsedImageUrls = parsedImageUrls.map((url: string) => {
            if (url.startsWith('/api/')) {
              return `${baseUrl}${url}`;
            }
            return url;
          });
        }

        const challengeId = challenge.challenge_id as number;
        const result: any = {
          ...this.applyDynamicStatus([challenge])[0],
          is_participating: participationStatus[challengeId] || false,
          is_reported: reportStatus[challengeId] || false,
          tags: challenge.tags ? (typeof challenge.tags === 'string' ? JSON.parse(challenge.tags) : challenge.tags) : [],
          image_urls: parsedImageUrls
        };

        // 참여 중인 챌린지만 progress 추가
        if (participationStatus[challengeId] && progressStatus[challengeId] !== undefined) {
          result.progress = progressStatus[challengeId];
        }

        return result;
      });

      // 동적 상태 계산 후 status 필터 적용
      let filteredChallenges = challengesWithAllInfo;
      if (status && status !== 'all') {
        filteredChallenges = challengesWithAllInfo.filter(challenge => challenge.status === status);
        console.log(`Status 필터 적용: ${status} - ${filteredChallenges.length}개 챌린지`);
      }

      // 애플리케이션 레벨에서 정렬 (status 필터가 있을 때)
      if (needsFullData) {
        if (sort_by === 'ending_soon') {
          filteredChallenges.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
        } else if (sort_by === 'popular' || sort_by === 'participant_count') {
          filteredChallenges.sort((a, b) => (b.participant_count || 0) - (a.participant_count || 0));
        } else if (sort_by === 'recommended') {
          filteredChallenges.sort((a, b) => {
            const scoreA = (a.participant_count || 0) * 2 + (a.like_count || 0);
            const scoreB = (b.participant_count || 0) * 2 + (b.like_count || 0);
            return scoreB - scoreA;
          });
        } else if (sort_by === 'start_date') {
          const isAsc = order.toString().toUpperCase() === 'ASC';
          filteredChallenges.sort((a, b) => {
            const dateA = new Date(a.start_date).getTime();
            const dateB = new Date(b.start_date).getTime();
            return isAsc ? dateA - dateB : dateB - dateA;
          });
        } else {
          // created_at (기본값)
          const isAsc = order.toString().toUpperCase() === 'ASC';
          filteredChallenges.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return isAsc ? dateA - dateB : dateB - dateA;
          });
        }
        console.log(`정렬 적용: ${sort_by} - 첫 챌린지: ${filteredChallenges[0]?.title}`);
      }

      // 페이지네이션 적용 (status 필터가 있을 때)
      const totalFiltered = filteredChallenges.length;
      if (needsFullData) {
        const startIdx = offset;
        const endIdx = offset + Number(limit);
        filteredChallenges = filteredChallenges.slice(startIdx, endIdx);
        console.log(`페이지네이션 적용: ${startIdx}~${endIdx} (총 ${totalFiltered}개 중 ${filteredChallenges.length}개)`);
      }

      // 간단한 카운트 쿼리
      const totalCount = await db.Challenge.count({
        where: whereCondition
      });

      console.log(`총 챌린지 개수 (DB): ${totalCount}개`);
      console.log(`필터링된 챌린지 개수: ${filteredChallenges.length}개`);
      console.log('참여 상태가 포함된 샘플 데이터:', {
        challengeId: filteredChallenges[0]?.challenge_id,
        title: filteredChallenges[0]?.title,
        is_participating: filteredChallenges[0]?.is_participating
      });

      // 🖼️ 이미지 URL 디버깅
      if (filteredChallenges.length > 0) {
        console.log('🖼️ 첫 번째 챌린지 image_urls:', filteredChallenges[0]?.image_urls);
        console.log('🖼️ 첫 번째 챌린지 전체 데이터:', JSON.stringify({
          challenge_id: filteredChallenges[0]?.challenge_id,
          title: filteredChallenges[0]?.title,
          image_urls: filteredChallenges[0]?.image_urls,
          tags: filteredChallenges[0]?.tags
        }, null, 2));
      }

      console.log('=== 디버깅 정보 추가됨 v1.3 ===');

      const response = {
        status: 'success',
        data: filteredChallenges,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: needsFullData ? totalFiltered : filteredChallenges.length,
          totalPages: Math.ceil((needsFullData ? totalFiltered : filteredChallenges.length) / Number(limit))
        },
        message: '챌린지 목록을 조회했습니다.'
      };

      console.log('응답 데이터 준비 완료, JSON 전송 중...');

      // Redis 캐시 저장 (5분 TTL)
      if (!userId) {
        await cacheHelper.set(cacheKey, response, 300);
        console.log('💾 Redis 캐시 저장:', cacheKey);
      }

      res.json(response);

      console.log('=== 챌린지 목록 조회 완료 ===');

    } catch (error) {
      console.error('챌린지 목록 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 목록 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 디버깅용 참여 데이터 확인 엔드포인트
  async debugParticipation(req: AuthRequest, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      console.log('디버깅 요청 사용자:', userId);

      // 해당 사용자의 모든 참여 데이터 조회
      const participations = await db.ChallengeParticipant.findAll({
        where: { user_id: userId },
        include: [{
          model: db.Challenge,
          as: 'challenge',
          attributes: ['challenge_id', 'title']
        }],
        raw: false
      });

      console.log(`사용자 ${userId}의 참여 데이터:`, participations.map(p => ({
        challenge_id: p.challenge_id,
        user_id: p.user_id,
        joined_at: p.joined_at
      })));

      return res.json({
        status: 'success',
        userId,
        participationCount: participations.length,
        participations: participations.map(p => ({
          challenge_id: p.challenge_id,
          user_id: p.user_id,
          joined_at: p.joined_at,
          challenge: p.challenge
        }))
      });
    } catch (error: any) {
      console.error('디버깅 에러:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // 베스트 챌린지 조회 (성능 최적화)
  async getBestChallenges(req: AuthRequest, res: Response) {
    try {
      console.log('=== 베스트 챌린지 조회 시작 ===');
      const { limit = 10 } = req.query;

      console.log('베스트 챌린지 요청 파라미터:', { limit });

      // 간단한 조건으로 베스트 챌린지 조회
      const bestChallenges = await db.Challenge.findAll({
        where: {
          is_public: true
        },
        order: [
          ['participant_count', 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: Math.min(Number(limit), 20), // 최대 20개로 제한
        attributes: [
          'challenge_id',
          'title',
          'description',
          'start_date',
          'end_date',
          'participant_count',
          'status',
          'created_at',
          'creator_id',
          'tags'
        ],
        raw: true
      });

      console.log(`베스트 챌린지 조회 완료: ${bestChallenges.length}개`);

      // 동적 상태 계산 및 랭킹과 점수 추가
      const bestChallengesWithRanking = bestChallenges.map((challenge: any, index: number) => ({
        challenge_id: challenge.challenge_id,
        title: challenge.title,
        description: challenge.description,
        start_date: challenge.start_date,
        end_date: challenge.end_date,
        participant_count: challenge.participant_count,
        status: this.calculateDynamicStatus(challenge.start_date, challenge.end_date), // 공통 함수 사용
        created_at: challenge.created_at,
        // tags가 문자열로 저장된 경우 JSON 파싱
        tags: challenge.tags ? (typeof challenge.tags === 'string' ? JSON.parse(challenge.tags) : challenge.tags) : [],
        ranking: index + 1,
        score: Math.max(950 - index * 70, 100) // 임시 점수 계산
      }));

      console.log('베스트 챌린지 응답 데이터 준비 완료');

      res.json({
        status: 'success',
        data: bestChallengesWithRanking,
        message: '베스트 챌린지를 조회했습니다.'
      });

      console.log('=== 베스트 챌린지 조회 완료 ===');

    } catch (error) {
      console.error('베스트 챌린지 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '베스트 챌린지 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 사용자가 참여 중인 챌린지 조회
  async getMyParticipatedChallenges(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const participatedChallenges = await db.ChallengeParticipant.findAll({
        where: { user_id: userId },
        include: [{
          model: db.Challenge,
          as: 'challenge',
          attributes: [
            'challenge_id',
            'title',
            'description',
            'start_date',
            'end_date',
            'status',
            'participant_count'
          ]
        }],
        attributes: ['challenge_id', 'joined_at']
      });

      const challengeData = participatedChallenges.map(p => ({
        challenge_id: p.challenge_id,
        joined_at: p.joined_at,
        ...(p.challenge ? (p.challenge as any).toJSON() : {})
      }));

      res.json({
        status: 'success',
        data: challengeData,
        message: '참여 중인 챌린지 목록을 조회했습니다.'
      });
    } catch (error) {
      console.error('참여 챌린지 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '참여 챌린지 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 참여
  async participateInChallenge(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const challengeId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 챌린지 존재 확인
      const challenge = await db.Challenge.findByPk(challengeId);
      if (!challenge) {
        return res.status(404).json({
          status: 'error',
          message: '챌린지를 찾을 수 없습니다.'
        });
      }

      // 이미 참여했는지 확인
      const existingParticipation = await db.ChallengeParticipant.findOne({
        where: {
          user_id: userId,
          challenge_id: challengeId
        }
      });

      if (existingParticipation) {
        return res.status(400).json({
          status: 'error',
          message: '이미 참여 중인 챌린지입니다.'
        });
      }

      // 최대 참여자 수 확인
      if (challenge.max_participants && challenge.participant_count >= challenge.max_participants) {
        return res.status(400).json({
          status: 'error',
          message: '참여자가 가득 찬 챌린지입니다.'
        });
      }

      // 참여 등록
      await db.ChallengeParticipant.create({
        user_id: userId,
        challenge_id: challengeId,
        joined_at: new Date()
      });

      // 참여자 수 증가
      await challenge.increment('participant_count');

      res.json({
        status: 'success',
        message: '챌린지에 참여했습니다.',
        data: {
          challenge_id: challengeId,
          participant_count: challenge.participant_count + 1
        }
      });
    } catch (error) {
      console.error('챌린지 참여 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 참여 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 나가기
  async leaveChallenge(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const challengeId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 참여 기록 확인
      const participation = await db.ChallengeParticipant.findOne({
        where: {
          user_id: userId,
          challenge_id: challengeId
        }
      });

      if (!participation) {
        return res.status(404).json({
          status: 'error',
          message: '참여 기록을 찾을 수 없습니다.'
        });
      }

      // 참여 기록 삭제
      await participation.destroy();

      // 참여자 수 감소
      const challenge = await db.Challenge.findByPk(challengeId);
      if (challenge && challenge.participant_count > 0) {
        await challenge.decrement('participant_count');
      }

      res.json({
        status: 'success',
        message: '챌린지에서 나갔습니다.'
      });
    } catch (error) {
      console.error('챌린지 나가기 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 나가기 중 오류가 발생했습니다.'
      });
    }
  }

  // 새 챌린지 생성
  async createChallenge(req: AuthRequest, res: Response) {
    try {
      console.log('🎯 createChallenge 메서드 진입!');
      console.log('🎯 요청 바디:', JSON.stringify(req.body, null, 2));
      console.log('🎯 사용자 정보:', req.user);
      
      const userId = req.user?.user_id;
      if (!userId) {
        console.log('❌ 사용자 인증 실패');
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      console.log('✅ 사용자 인증 성공:', userId);

      const {
        title,
        description,
        start_date,
        end_date,
        is_public = true,
        max_participants,
        tags,
        image_urls
      } = req.body;

      console.log('🎯 추출된 데이터:', { title, description, start_date, end_date, is_public, max_participants, tags, image_urls });

      // 입력 검증
      if (!title || !description || !start_date || !end_date) {
        return res.status(400).json({
          status: 'error',
          message: '제목, 설명, 시작일, 종료일은 필수 입력 사항입니다.'
        });
      }

      // 이미지 URL 검증 (최대 3장)
      if (image_urls && Array.isArray(image_urls) && image_urls.length > 3) {
        return res.status(400).json({
          status: 'error',
          message: '이미지는 최대 3장까지 첨부할 수 있습니다.'
        });
      }

      // 날짜 유효성 검증
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (endDate <= startDate) {
        return res.status(400).json({
          status: 'error',
          message: '종료일은 시작일보다 늦어야 합니다.'
        });
      }

      // 챌린지 생성
      console.log('🎯 데이터베이스에 챌린지 생성 중...');
      const challenge = await db.Challenge.create({
        creator_id: userId,
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        is_public,
        max_participants: max_participants || null,
        participant_count: 1, // 생성자 자동 참여
        status: 'active',
        tags: tags || [],
        image_urls: image_urls || []
      });

      console.log('✅ 챌린지 생성 완료:', challenge.challenge_id);

      // 생성자를 자동으로 참여시킴
      console.log('🎯 생성자 자동 참여 처리 중...');
      await db.ChallengeParticipant.create({
        user_id: userId,
        challenge_id: challenge.challenge_id,
        joined_at: new Date()
      });

      console.log('✅ 생성자 자동 참여 완료');
      console.log('🎯 응답 전송 중...');

      res.status(201).json({
        status: 'success',
        data: challenge,
        message: '챌린지가 생성되었습니다.'
      });

      console.log('✅ createChallenge 메서드 완료!');
    } catch (error) {
      console.error('❌ 챌린지 생성 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 생성 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 상세 조회
  async getChallengeDetails(req: AuthRequest, res: Response) {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user?.user_id;

      console.log('🔍 getChallengeDetails 시작:', { challengeId, userId });

      const challenge = await db.Challenge.findByPk(challengeId, {
        include: [{
          model: db.User,
          as: 'creator',
          attributes: ['user_id', 'username', 'nickname', 'profile_image_url']
        }]
      });

      console.log('🔍 챌린지 조회 결과:', challenge ? '찾음' : '없음');
      if (challenge) {
        console.log('📄 챌린지 정보:', {
          id: challenge.challenge_id,
          title: challenge.title,
          description: challenge.description?.substring(0, 50)
        });
      }

      if (!challenge) {
        console.log('❌ 챌린지 없음, 404 반환');
        return res.status(404).json({
          status: 'error',
          message: '챌린지를 찾을 수 없습니다.'
        });
      }

      // 현재 사용자의 참여 여부 확인
      let isParticipating = false;
      let isReported = false;
      if (userId) {
        const participation = await db.ChallengeParticipant.findOne({
          where: {
            user_id: userId,
            challenge_id: challengeId
          }
        });
        isParticipating = !!participation;

        // 신고 여부 확인
        const report = await db.ChallengeReport.findOne({
          where: {
            reporter_id: userId,
            challenge_id: challengeId
          }
        });
        isReported = !!report;
      }

      // 참여자 목록 조회
      const participants = await db.ChallengeParticipant.findAll({
        where: { challenge_id: challengeId },
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['user_id', 'username', 'nickname', 'profile_image_url']
        }],
        attributes: ['user_id'],
        limit: 20
      });

      // 감정 기록 내역 조회
      let progressEntries: any[] = [];
      try {
        progressEntries = await db.ChallengeEmotion.findAll({
          where: { challenge_id: challengeId },
          include: [{
            model: db.Emotion,
            as: 'emotion',
            attributes: ['emotion_id', 'name', 'color']
          }],
          attributes: ['challenge_emotion_id', 'user_id', 'log_date', 'note'],
          order: [['log_date', 'DESC']],
          limit: 50
        });
      } catch (emotionError) {
        console.warn('감정 기록 조회 중 오류 (무시):', emotionError);
        progressEntries = [];
     }

        // 댓글 수 조회
        const commentCount = await db.ChallengeComment.count({
          where: { challenge_id: challengeId }
        });

        // 좋아요 수 조회
        let likeCount = 0;
        try {
          const [results] = await db.sequelize.query(
            'SELECT COUNT(*) as count FROM challenge_likes WHERE challenge_id = ?',
            { replacements: [challengeId] }
          ) as any;
          likeCount = results[0]?.count || 0;
        } catch (likeError) {
          console.warn('좋아요 수 조회 중 오류 (무시):', likeError);
        }

      // baseUrl 정의를 participantList 위로 이동
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3001';
      const baseUrl = `${protocol}://${host}`;

      const participantList = participants.map((p: any) => {
        let profileImageUrl = p.user?.profile_image_url || null;
        if (profileImageUrl && !profileImageUrl.startsWith('http://') && !profileImageUrl.startsWith('https://')) {
          profileImageUrl = `${baseUrl}${profileImageUrl}`;
        }
        return {
          user_id: p.user_id,
          username: p.user?.username || 'Unknown',
          nickname: p.user?.nickname || null,
          profile_image_url: profileImageUrl
        };
      });

      const progressList = progressEntries.map((entry: any) => ({
        challenge_emotion_id: entry.challenge_emotion_id,
        user_id: entry.user_id,
        date: entry.log_date,
        emotion_id: entry.emotion?.emotion_id || null,
        emotion_name: entry.emotion?.name || 'Unknown',
        emotion_color: entry.emotion?.color || '#666',
        note: entry.note
      }));

      // 달성률 계산 (참여 중인 경우에만)
      let progressPercentage = 0;
      if (userId && isParticipating) {
        const status = this.calculateDynamicStatus(challenge.start_date, challenge.end_date);
        if (status === 'completed') {
          progressPercentage = 100;
        } else if (status === 'active') {
          // 현재 사용자의 감정 기록에서 고유 날짜 추출
          const userEntries = progressEntries.filter((entry: any) => entry.user_id === userId);
          const uniqueDates = new Set(
            userEntries.map((entry: any) => {
              const date = new Date(entry.log_date);
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            })
          );
          const completedDays = uniqueDates.size;

          // 경과 일수 계산
          const now = new Date();
          const startDate = new Date(challenge.start_date);
          const endDate = new Date(challenge.end_date);
          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const elapsedDays = Math.min(
            Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
            totalDays
          );

          // 달성률 계산
          if (elapsedDays > 0 && completedDays > 0) {
            progressPercentage = Math.min(Math.round((completedDays / elapsedDays) * 100), 100);
          }
        }
      }

      const challengeData = challenge.toJSON();

      // image_urls 파싱 및 전체 URL로 변환
      console.log('🖼️ 원본 image_urls:', challengeData.image_urls, 'type:', typeof challengeData.image_urls);
      let parsedImageUrls = challengeData.image_urls ? (typeof challengeData.image_urls === 'string' ? JSON.parse(challengeData.image_urls) : challengeData.image_urls) : [];
      console.log('🖼️ 파싱된 image_urls:', parsedImageUrls);
      console.log('🌐 baseUrl:', baseUrl);

      // creator의 profile_image_url 변환
      let creatorData = (challengeData as any).creator;
      if (creatorData && creatorData.profile_image_url) {
        if (!creatorData.profile_image_url.startsWith('http://') && !creatorData.profile_image_url.startsWith('https://')) {
          creatorData.profile_image_url = `${baseUrl}${creatorData.profile_image_url}`;
        }
      }

      const responseData = {
        ...challengeData,
        creator: creatorData || (challengeData as any).creator,  // 변환된 creator 데이터 사용
        status: this.calculateDynamicStatus(challenge.start_date, challenge.end_date), // 공통 함수 사용
        is_participating: isParticipating,
        is_reported: isReported,
        participants: participantList,
        progress_entries: progressList,
        // tags가 문자열로 저장된 경우 JSON 파싱
        tags: challengeData.tags ? (typeof challengeData.tags === 'string' ? JSON.parse(challengeData.tags) : challengeData.tags) : [],
        // 변환된 전체 URL 사용
        image_urls: parsedImageUrls,
        comment_count: commentCount,
        like_count: likeCount,
        progress: progressPercentage
      };

      console.log('📤 응답 데이터:', {
        challenge_id: responseData.challenge_id,
        title: responseData.title,
        participants_count: participantList.length,
        progress_count: progressList.length,
        is_participating: isParticipating,
        image_urls: responseData.image_urls,
        image_urls_length: responseData.image_urls?.length
      });

      res.json({
        status: 'success',
        data: responseData,
        message: '챌린지 상세 정보를 조회했습니다.'
      });
    } catch (error) {
      console.error('챌린지 상세 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 상세 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 내가 생성한 챌린지 조회
  async getMyChallenges(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { page = 1, limit = 20, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereCondition: any = { creator_id: userId };
      if (status && status !== 'all') {
        whereCondition.status = status;
      }

      const challenges = await db.Challenge.findAll({
        where: whereCondition,
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset,
        attributes: [
          'challenge_id',
          'title',
          'description',
          'start_date',
          'end_date',
          'status',
          'participant_count',
          'max_participants',
          'created_at',
          'creator_id',
          'tags',
          'image_urls',
          // 댓글 수, 좋아요 수, 감정 나누기 수를 서브쿼리로 계산
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM challenge_comments
              WHERE challenge_comments.challenge_id = Challenge.challenge_id
            )`),
            'comment_count'
          ],
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM challenge_likes
              WHERE challenge_likes.challenge_id = Challenge.challenge_id
            )`),
            'like_count'
          ],
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM challenge_emotions
              WHERE challenge_emotions.challenge_id = Challenge.challenge_id
            )`),
            'progress_entry_count'
          ]
        ]
      });

      const totalCount = await db.Challenge.count({ where: whereCondition });

      // baseUrl 생성
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3001';
      const baseUrl = `${protocol}://${host}`;

      // image_urls와 tags 처리
      const processedChallenges = challenges.map((challenge: any) => {
        // image_urls 파싱 및 전체 URL로 변환
        let parsedImageUrls = challenge.image_urls ? (typeof challenge.image_urls === 'string' ? JSON.parse(challenge.image_urls) : challenge.image_urls) : [];
        if (parsedImageUrls && Array.isArray(parsedImageUrls)) {
          parsedImageUrls = parsedImageUrls.map((url: string) => {
            if (url.startsWith('/api/')) {
              return `${baseUrl}${url}`;
            }
            return url;
          });
        }

        return {
          ...challenge.toJSON(),
          image_urls: parsedImageUrls,
          tags: challenge.tags ? (typeof challenge.tags === 'string' ? JSON.parse(challenge.tags) : challenge.tags) : []
        };
      });

      res.json({
        status: 'success',
        data: processedChallenges,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit))
        },
        message: '내가 생성한 챌린지 목록을 조회했습니다.'
      });
    } catch (error) {
      console.error('내가 생성한 챌린지 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 내가 참여한 챌린지 조회 (성능 최적화)
  async getMyParticipations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      console.log(`사용자 ${userId}의 참여 챌린지 조회 시작`);

      const { page = 1, limit = 20, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // 1단계: 참여 챌린지 ID만 먼저 조회 (빠른 쿼리)
      const participatedChallengeIds = await db.ChallengeParticipant.findAll({
        where: { user_id: userId },
        attributes: ['challenge_id', 'joined_at'],
        order: [['joined_at', 'DESC']],
        limit: Number(limit),
        offset,
        raw: true
      });

      console.log(`참여 챌린지 ID 조회 완료: ${participatedChallengeIds.length}개`);

      if (participatedChallengeIds.length === 0) {
        return res.json({
          status: 'success',
          data: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0
          },
          message: '참여 중인 챌린지가 없습니다.'
        });
      }

      // 2단계: 챌린지 세부 정보 조회 (본인이 생성한 챌린지 포함)
      const challengeIds = participatedChallengeIds.map(p => p.challenge_id);
      const whereCondition: any = {
        challenge_id: challengeIds
        // 본인이 만든 챌린지에 참여한 경우도 포함
      };

      if (status && status !== 'all') {
        whereCondition.status = status;
      }

      const challenges = await db.Challenge.findAll({
        where: whereCondition,
        attributes: [
          'challenge_id',
          'title',
          'description',
          'start_date',
          'end_date',
          'status',
          'participant_count',
          'tags',
          'image_urls',
          // 댓글 수, 좋아요 수, 감정 나누기 수를 서브쿼리로 계산
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM challenge_comments
              WHERE challenge_comments.challenge_id = Challenge.challenge_id
            )`),
            'comment_count'
          ],
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM challenge_likes
              WHERE challenge_likes.challenge_id = Challenge.challenge_id
            )`),
            'like_count'
          ],
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM challenge_emotions
              WHERE challenge_emotions.challenge_id = Challenge.challenge_id
            )`),
            'progress_entry_count'
          ]
        ],
        order: [['created_at', 'DESC']]
      });

      console.log(`챌린지 세부 정보 조회 완료: ${challenges.length}개`);

      // 3단계: 달성률 계산을 위한 감정 기록 배치 조회 (N+1 방지)
      const emotionLogs = await db.ChallengeEmotion.findAll({
        where: {
          user_id: userId,
          challenge_id: { [Op.in]: challengeIds }
        },
        attributes: [
          'challenge_id',
          [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('log_date'))), 'completed_days']
        ],
        group: ['challenge_id'],
        raw: true
      });

      // 달성률 맵 생성
      const progressMap: { [key: number]: number } = {};
      emotionLogs.forEach((log: any) => {
        const challenge = challenges.find(c => c.challenge_id === log.challenge_id);
        if (challenge) {
          const now = new Date();
          const startDate = new Date(challenge.start_date);
          const endDate = new Date(challenge.end_date);
          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const elapsedDays = Math.min(Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, totalDays);
          const completedDays = parseInt(log.completed_days) || 0;
          progressMap[log.challenge_id] = elapsedDays > 0 ? Math.min(Math.round((completedDays / elapsedDays) * 100), 100) : 0;
        }
      });

      console.log(`달성률 계산 완료: ${Object.keys(progressMap).length}개 챌린지`);

      // baseUrl 생성
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3001';
      const baseUrl = `${protocol}://${host}`;

      // 4단계: 데이터 결합 (달성률 포함)
      const challengeData = participatedChallengeIds.map(p => {
        const challenge = challenges.find(c => c.challenge_id === p.challenge_id);
        if (!challenge) return null;

        // image_urls 파싱 및 전체 URL로 변환
        let parsedImageUrls = challenge.image_urls ? (typeof challenge.image_urls === 'string' ? JSON.parse(challenge.image_urls) : challenge.image_urls) : [];
        if (parsedImageUrls && Array.isArray(parsedImageUrls)) {
          parsedImageUrls = parsedImageUrls.map((url: string) => {
            if (url.startsWith('/api/')) {
              return `${baseUrl}${url}`;
            }
            return url;
          });
        }

        const challengeId = challenge.challenge_id as number;
        return {
          challenge_id: challengeId,
          title: challenge.title,
          description: challenge.description,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
          status: this.calculateDynamicStatus(challenge.start_date, challenge.end_date),
          participant_count: challenge.participant_count,
          tags: challenge.tags ? (typeof challenge.tags === 'string' ? JSON.parse(challenge.tags) : challenge.tags) : [],
          image_urls: parsedImageUrls,
          joined_at: p.joined_at,
          progress: progressMap[challengeId] || 0,
          is_participating: true
        };
      }).filter(Boolean); // null 제거

      // 총 개수 조회 (간단한 카운트)
      const totalCount = await db.ChallengeParticipant.count({
        where: { user_id: userId }
      });

      console.log(`참여 챌린지 조회 완료: 총 ${totalCount}개 중 ${challengeData.length}개 반환`);

      res.json({
        status: 'success',
        data: challengeData,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit))
        },
        message: '참여 중인 챌린지 목록을 조회했습니다.'
      });
    } catch (error) {
      console.error('참여 챌린지 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '참여 챌린지 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 진행 상황 업데이트
  async updateChallengeProgress(req: AuthRequest, res: Response) {
    try {
      console.log('🚀 updateChallengeProgress 진입!');
      console.log('🚀 요청 파라미터:', req.params);
      console.log('🚀 요청 바디:', JSON.stringify(req.body, null, 2));
      console.log('🚀 사용자 정보:', req.user);
      
      const userId = req.user?.user_id;
      const challengeId = parseInt(req.params.id);
      const { progress_note, emotion_id } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 참여 여부 확인
      const participation = await db.ChallengeParticipant.findOne({
        where: {
          user_id: userId,
          challenge_id: challengeId
        }
      });

      if (!participation) {
        return res.status(404).json({
          status: 'error',
          message: '참여하지 않은 챌린지입니다.'
        });
      }

      // 진행 상황 기록 생성 또는 업데이트
      const progressData = {
        user_id: userId,
        challenge_id: challengeId,
        emotion_id: emotion_id,
        note: progress_note || null,
        log_date: new Date().toISOString().split('T')[0],
        created_at: new Date()
      };

      // ChallengeEmotion 테이블이 없을 경우를 위한 임시 구현
      let result;
      try {
        // 오늘 이미 기록이 있는지 확인
        const existingLog = await db.ChallengeEmotion.findOne({
          where: {
            user_id: userId,
            challenge_id: challengeId,
            log_date: progressData.log_date
          }
        });

        if (existingLog) {
          // 기존 기록 업데이트
          await existingLog.update({
            emotion_id: emotion_id,
            note: progress_note
          });
          result = existingLog;
        } else {
          // 새 기록 생성
          result = await db.ChallengeEmotion.create(progressData);
        }
      } catch (error: any) {
        // 테이블이 없는 경우 생성 후 재시도
        if (error.name === 'SequelizeDatabaseError' && error.original?.code === 'ER_NO_SUCH_TABLE') {
          console.log('🔧 ChallengeEmotion 테이블이 없어서 생성합니다...');
          await db.ChallengeEmotion.sync({ force: true });
          console.log('✅ ChallengeEmotion 테이블 생성 완료');
          
          // 새 기록 생성
          result = await db.ChallengeEmotion.create(progressData);
        } else if (error.original?.code === 'ER_BAD_FIELD_ERROR') {
          console.log('🔧 테이블 스키마 문제 감지 - 테이블 재생성 시도...');
          await db.ChallengeEmotion.sync({ force: true });
          console.log('✅ ChallengeEmotion 테이블 재생성 완료');
          
          // 새 기록 생성
          result = await db.ChallengeEmotion.create(progressData);
        } else {
          throw error;
        }
      }

      res.json({
        status: 'success',
        data: result,
        message: '진행 상황이 업데이트되었습니다.'
      });
    } catch (error) {
      console.error('챌린지 진행 상황 업데이트 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '진행 상황 업데이트 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 감정 기록 수정
  async updateChallengeEmotion(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const challengeId = parseInt(req.params.id);
      const emotionLogId = parseInt(req.params.emotionId);
      const { emotion_id, progress_note } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const emotionLog = await db.ChallengeEmotion.findOne({
        where: {
          challenge_emotion_id: emotionLogId,
          user_id: userId,
          challenge_id: challengeId
        }
      });

      if (!emotionLog) {
        return res.status(404).json({
          status: 'error',
          message: '감정 기록을 찾을 수 없습니다.'
        });
      }

      await emotionLog.update({
        emotion_id: emotion_id || emotionLog.emotion_id,
        note: progress_note !== undefined ? progress_note : emotionLog.note
      });

      res.json({
        status: 'success',
        data: emotionLog,
        message: '감정 기록이 수정되었습니다.'
      });
    } catch (error) {
      console.error('챌린지 감정 기록 수정 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '감정 기록 수정 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 감정 기록 삭제
  async deleteChallengeEmotion(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const challengeId = parseInt(req.params.id);
      const emotionLogId = parseInt(req.params.emotionId);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const emotionLog = await db.ChallengeEmotion.findOne({
        where: {
          challenge_emotion_id: emotionLogId,
          user_id: userId,
          challenge_id: challengeId
        }
      });

      if (!emotionLog) {
        return res.status(404).json({
          status: 'error',
          message: '감정 기록을 찾을 수 없습니다.'
        });
      }

      await emotionLog.destroy();

      res.json({
        status: 'success',
        message: '감정 기록이 삭제되었습니다.'
      });
    } catch (error) {
      console.error('챌린지 감정 기록 삭제 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '감정 기록 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  // 디버그용 - 테스트 챌린지 데이터 생성
  async createTestData(req: AuthRequest, res: Response) {
    try {
      console.log('테스트 챌린지 데이터 생성 시작 - 이미 데이터가 존재합니다');

      res.json({
        status: 'success',
        message: '테스트 챌린지 데이터가 이미 생성되어 있습니다.'
      });
    } catch (error) {
      console.error('테스트 챌린지 데이터 생성 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '테스트 챌린지 데이터 생성 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : error
      });
    }
  }

  // 디버그용 - 챌린지 테이블 상태 확인
  async debugChallengeTable(req: AuthRequest, res: Response) {
    try {
      console.log('챌린지 테이블 상태 확인 시작');

      const totalCount = await db.Challenge.count();
      const activeCount = await db.Challenge.count({ where: { status: 'active' } });
      const publicCount = await db.Challenge.count({ where: { is_public: true } });
      
      const recentChallenges = await db.Challenge.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: [
          'challenge_id',
          'title',
          'status',
          'is_public',
          'participant_count',
          'created_at',
          'creator_id'
        ]
      });

      console.log('챌린지 테이블 상태:', {
        총개수: totalCount,
        활성개수: activeCount,
        공개개수: publicCount,
        최근데이터: recentChallenges.length
      });

      res.json({
        status: 'success',
        data: {
          총개수: totalCount,
          활성_챌린지수: activeCount,
          공개_챌린지수: publicCount,
          최근_챌린지: recentChallenges,
          데이터베이스_상태: '연결됨'
        },
        message: '챌린지 테이블 상태를 조회했습니다.'
      });
    } catch (error) {
      console.error('챌린지 테이블 상태 확인 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 테이블 상태 확인 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : error
      });
    }
  }

  // 챌린지 댓글 조회
  async getChallengeComments(req: AuthRequest, res: Response) {
    try {
      const challengeId = parseInt(req.params.id);
      const { page = 1, limit = 20, challenge_emotion_id } = req.query;

      console.log('🗨️ 챌린지 댓글 조회:', { challengeId, page, limit, challenge_emotion_id });

      const offset = (Number(page) - 1) * Number(limit);

      // 필터 조건 구성
      const whereCondition: any = {
        challenge_id: challengeId,
        parent_comment_id: null
      };

      // 감정 나누기 전용 댓글 필터링
      if (challenge_emotion_id) {
        whereCondition.challenge_emotion_id = parseInt(String(challenge_emotion_id));
      }

      const comments = await db.ChallengeComment.findAll({
        where: whereCondition,
        include: [
          {
            model: db.User,
            as: 'user',
            attributes: ['user_id', 'username', 'nickname', 'profile_image_url']
          },
          {
            model: db.ChallengeComment,
            as: 'replies',
            include: [
              {
                model: db.User,
                as: 'user',
                attributes: ['user_id', 'username', 'nickname', 'profile_image_url']
              },
              {
                model: db.ChallengeCommentLike,
                as: 'likes',
                attributes: ['user_id']
              }
            ]
          },
          {
            model: db.ChallengeCommentLike,
            as: 'likes',
            attributes: ['user_id']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset
      });

      const totalComments = await db.ChallengeComment.count({
        where: whereCondition
      });

      // 댓글 데이터 포맷팅
      const formattedComments = comments.map((comment: any) => ({
        comment_id: comment.comment_id,
        content: comment.content,
        is_anonymous: comment.is_anonymous,
        created_at: comment.created_at,
        user_id: comment.user_id, // 권한 확인용으로 유지
        user: comment.is_anonymous ? null : comment.user,
        like_count: comment.likes?.length || 0,
        reply_count: comment.replies?.length || 0,
        replies: comment.replies?.slice(0, 3).map((reply: any) => ({
          comment_id: reply.comment_id,
          content: reply.content,
          is_anonymous: reply.is_anonymous,
          created_at: reply.created_at,
          user_id: reply.user_id, // 권한 확인용으로 유지
          user: reply.is_anonymous ? null : reply.user,
          like_count: reply.likes?.length || 0
        })) || []
      }));

      res.json({
        status: 'success',
        data: {
          comments: formattedComments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalComments,
            totalPages: Math.ceil(Number(totalComments || 0) / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('챌린지 댓글 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '댓글 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 댓글 작성
  async createChallengeComment(req: AuthRequest, res: Response) {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user?.user_id;
      const { content, parent_comment_id, challenge_emotion_id, is_anonymous = false } = req.body;

      console.log('🗨️ 댓글 작성:', { challengeId, userId, content, parent_comment_id, challenge_emotion_id, is_anonymous });

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          status: 'error',
          message: '댓글 내용을 입력해주세요.'
        });
      }

      // 챌린지 존재 확인
      const challenge = await db.Challenge.findByPk(challengeId);
      if (!challenge) {
        return res.status(404).json({
          status: 'error',
          message: '챌린지를 찾을 수 없습니다.'
        });
      }

      // 부모 댓글 확인 (대댓글인 경우)
      if (parent_comment_id) {
        const parentComment = await db.ChallengeComment.findByPk(parent_comment_id);
        if (!parentComment || (parentComment as any).challenge_id !== challengeId) {
          return res.status(400).json({
            status: 'error',
            message: '유효하지 않은 부모 댓글입니다.'
          });
        }
      }

      // 댓글 생성
      const comment = await db.ChallengeComment.create({
        challenge_id: challengeId,
        user_id: userId,
        content: content.trim(),
        parent_comment_id,
        challenge_emotion_id, // 감정 나누기 전용 댓글
        is_anonymous
      });

      console.log('🗨️ 댓글 생성 완료:', {
        comment_id: (comment as any).comment_id,
        is_anonymous: (comment as any).is_anonymous,
        user_id: userId
      });

      // 알림 생성
      const creatorId = challenge.creator_id;

      // 1. 챌린지 생성자에게 댓글 알림 (본인 댓글 제외)
      if (creatorId !== userId) {
        const creator = await db.User.findByPk(creatorId, {
          attributes: ['user_id', 'nickname', 'notification_settings']
        });

        const creatorNotificationSettings = creator?.get('notification_settings') as any;
        if (creator && creatorNotificationSettings?.challenge_notifications !== false) {
          const commenter = await db.User.findByPk(userId, {
            attributes: ['nickname']
          });

          const commenterName = is_anonymous ? '익명 사용자' : commenter?.get('nickname') as string;

          await createNotification({
            userId: creatorId,
            notificationType: parent_comment_id ? 'reply' : 'comment',
            relatedId: (comment as any).comment_id,
            postId: challengeId,
            postType: 'challenge',
            senderId: is_anonymous ? undefined : userId,
            senderNickname: is_anonymous ? undefined : commenterName,
            title: parent_comment_id
              ? `${commenterName}님이 챌린지 댓글에 답글을 작성했습니다`
              : `${commenterName}님이 챌린지에 댓글을 작성했습니다`,
            message: parent_comment_id
              ? '회원님의 챌린지에 새로운 답글이 작성되었습니다. 💬'
              : '회원님의 챌린지에 새로운 댓글이 작성되었습니다. 💬'
          });
        }
      }

      // 2. 부모 댓글 작성자에게 답글 알림 (답글인 경우, 본인 답글 제외)
      if (parent_comment_id) {
        const parentComment = await db.ChallengeComment.findByPk(parent_comment_id, {
          attributes: ['user_id', 'is_anonymous']
        });

        const parentCommentAuthorId = (parentComment as any)?.user_id;

        if (parentCommentAuthorId && parentCommentAuthorId !== userId && parentCommentAuthorId !== creatorId) {
          const parentCommentAuthor = await db.User.findByPk(parentCommentAuthorId, {
            attributes: ['user_id', 'nickname', 'notification_settings']
          });

          const parentAuthorNotificationSettings = parentCommentAuthor?.get('notification_settings') as any;
          if (parentCommentAuthor && parentAuthorNotificationSettings?.challenge_notifications !== false) {
            const replier = await db.User.findByPk(userId, {
              attributes: ['nickname']
            });

            const replierName = is_anonymous ? '익명 사용자' : replier?.get('nickname') as string;

            await createNotification({
              userId: parentCommentAuthorId,
              notificationType: 'reply',
              relatedId: (comment as any).comment_id,
              postId: challengeId,
              postType: 'challenge',
              senderId: is_anonymous ? undefined : userId,
              senderNickname: is_anonymous ? undefined : replierName,
              title: `${replierName}님이 회원님의 댓글에 답글을 작성했습니다`,
              message: '회원님의 댓글에 새로운 답글이 작성되었습니다. 💬'
            });
          }
        }
      }

      // 생성된 댓글 정보 조회 (사용자 정보 포함)
      const createdComment = await db.ChallengeComment.findByPk((comment as any).comment_id, {
        include: [
          {
            model: db.User,
            as: 'user',
            attributes: ['user_id', 'username', 'nickname', 'profile_image_url']
          }
        ]
      });

      res.status(201).json({
        status: 'success',
        data: {
          comment_id: createdComment?.comment_id,
          content: createdComment?.content,
          is_anonymous: createdComment?.is_anonymous,
          created_at: createdComment?.created_at,
          user: createdComment?.is_anonymous ? null : createdComment?.user,
          like_count: 0,
          reply_count: 0
        },
        message: '댓글이 작성되었습니다.'
      });
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '댓글 작성 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 댓글 좋아요/취소
  async toggleChallengeCommentLike(req: AuthRequest, res: Response) {
    try {
      const commentId = parseInt(req.params.commentId);
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 댓글 존재 확인
      const comment = await db.ChallengeComment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          status: 'error',
          message: '댓글을 찾을 수 없습니다.'
        });
      }

      // 기존 좋아요 확인
      const existingLike = await db.ChallengeCommentLike.findOne({
        where: { comment_id: commentId, user_id: userId }
      });

      let isLiked = false;
      if (existingLike) {
        // 좋아요 취소
        await existingLike.destroy();
      } else {
        // 좋아요 추가
        await db.ChallengeCommentLike.create({
          comment_id: commentId,
          user_id: userId
        });
        isLiked = true;
      }

      // 현재 좋아요 수 조회
      const likeCount = await db.ChallengeCommentLike.count({
        where: { comment_id: commentId }
      });

      res.json({
        status: 'success',
        data: {
          is_liked: isLiked,
          like_count: likeCount
        }
      });
    } catch (error) {
      console.error('댓글 좋아요 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '좋아요 처리 중 오류가 발생했습니다.'
      });
    }
  }

  // 댓글 수정
  async updateChallengeComment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const commentId = parseInt(req.params.commentId);
      const { content } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 댓글 존재 확인 및 작성자 확인
      const comment = await db.ChallengeComment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          status: 'error',
          message: '댓글을 찾을 수 없습니다.'
        });
      }

      if (comment.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: '댓글 수정 권한이 없습니다.'
        });
      }

      // 댓글 수정
      await comment.update({ content });

      res.json({
        status: 'success',
        message: '댓글이 수정되었습니다.',
        data: comment
      });
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '댓글 수정 중 오류가 발생했습니다.'
      });
    }
  }

  // 댓글 삭제
  async deleteChallengeComment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const commentId = parseInt(req.params.commentId);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 댓글 존재 확인 및 작성자 확인
      const comment = await db.ChallengeComment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          status: 'error',
          message: '댓글을 찾을 수 없습니다.'
        });
      }

      if (comment.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: '댓글 삭제 권한이 없습니다.'
        });
      }

      // 댓글 삭제 (답글도 함께 삭제)
      const { Op } = require('sequelize');
      await db.ChallengeComment.destroy({
        where: {
          [Op.or]: [
            { comment_id: commentId },
            { parent_comment_id: commentId }
          ]
        }
      });

      res.json({
        status: 'success',
        message: '댓글이 삭제되었습니다.'
      });
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '댓글 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  // 감정 기록 수정
  async updateEmotionRecord(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const emotionId = parseInt(req.params.emotionId);
      const { emotion_id, progress_note } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 감정 기록 존재 확인 및 작성자 확인
      const emotionRecord = await db.ChallengeEmotion.findByPk(emotionId);
      if (!emotionRecord) {
        return res.status(404).json({
          status: 'error',
          message: '감정 기록을 찾을 수 없습니다.'
        });
      }

      if (emotionRecord.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: '감정 기록 수정 권한이 없습니다.'
        });
      }

      // 감정 기록 수정
      await emotionRecord.update({
        emotion_id,
        note: progress_note || null
      });

      res.json({
        status: 'success',
        message: '감정 기록이 수정되었습니다.',
        data: emotionRecord
      });
    } catch (error) {
      console.error('감정 기록 수정 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '감정 기록 수정 중 오류가 발생했습니다.'
      });
    }
  }

  // 감정 기록 삭제
  async deleteEmotionRecord(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const emotionId = parseInt(req.params.emotionId);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 감정 기록 존재 확인 및 작성자 확인
      const emotionRecord = await db.ChallengeEmotion.findByPk(emotionId);
      if (!emotionRecord) {
        return res.status(404).json({
          status: 'error',
          message: '감정 기록을 찾을 수 없습니다.'
        });
      }

      if (emotionRecord.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: '감정 기록 삭제 권한이 없습니다.'
        });
      }

      // 감정 기록 삭제
      await emotionRecord.destroy();

      res.json({
        status: 'success',
        message: '감정 기록이 삭제되었습니다.'
      });
    } catch (error) {
      console.error('감정 기록 삭제 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '감정 기록 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 수정
  async updateChallenge(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const challengeId = parseInt(req.params.id);
      const { title, description, start_date, end_date, image_urls } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 이미지 URL 검증 (최대 3장)
      if (image_urls && Array.isArray(image_urls) && image_urls.length > 3) {
        return res.status(400).json({
          status: 'error',
          message: '이미지는 최대 3장까지 첨부할 수 있습니다.'
        });
      }

      // 챌린지 존재 확인 및 작성자 확인
      const challenge = await db.Challenge.findByPk(challengeId);
      if (!challenge) {
        return res.status(404).json({
          status: 'error',
          message: '챌린지를 찾을 수 없습니다.'
        });
      }

      if (challenge.creator_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: '챌린지 수정 권한이 없습니다.'
        });
      }

      // 업데이트할 데이터 준비
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (image_urls !== undefined) updateData.image_urls = image_urls;

      // 챌린지 수정
      await challenge.update(updateData);

      res.json({
        status: 'success',
        message: '챌린지가 수정되었습니다.',
        data: challenge
      });
    } catch (error) {
      console.error('챌린지 수정 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 수정 중 오류가 발생했습니다.'
      });
    }
  }

  // 챌린지 삭제
  async deleteChallenge(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const challengeId = parseInt(req.params.id);

      console.log('🗑️ 챌린지 삭제 요청:', { userId, challengeId });

      if (!userId) {
        console.log('❌ 인증 실패: 사용자 ID 없음');
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 챌린지 존재 확인 및 작성자 확인
      const challenge = await db.Challenge.findByPk(challengeId);
      console.log('🔍 찾은 챌린지:', challenge ? {
        challenge_id: challenge.challenge_id,
        creator_id: challenge.creator_id,
        title: challenge.title
      } : '없음');

      if (!challenge) {
        console.log('❌ 챌린지 존재하지 않음:', challengeId);
        return res.status(404).json({
          status: 'error',
          message: '챌린지를 찾을 수 없습니다.'
        });
      }

      if (challenge.creator_id !== userId) {
        console.log('❌ 권한 없음:', { creator_id: challenge.creator_id, userId });
        return res.status(403).json({
          status: 'error',
          message: '챌린지 삭제 권한이 없습니다.'
        });
      }

      console.log('✅ 삭제 권한 확인 완료, 삭제 진행 중...');

      // 관련 데이터도 함께 삭제 (외래키 제약조건에 따라)
      // ChallengeEmotion, ChallengeParticipant, ChallengeComment 등
      await db.ChallengeEmotion.destroy({ where: { challenge_id: challengeId } });
      await db.ChallengeParticipant.destroy({ where: { challenge_id: challengeId } });
      await db.ChallengeComment.destroy({ where: { challenge_id: challengeId } });

      // 챌린지 삭제
      await challenge.destroy();

      console.log('✅ 챌린지 삭제 완료:', challengeId);

      res.json({
        status: 'success',
        message: '챌린지가 삭제되었습니다.'
      });
    } catch (error) {
      console.error('❌ 챌린지 삭제 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 삭제 중 오류가 발생했습니다.'
      });
    }
  }
}

export default new ChallengesController(); 
