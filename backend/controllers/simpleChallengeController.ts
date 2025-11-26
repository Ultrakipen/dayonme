// 새로운 간단하고 안정적인 챌린지 컨트롤러
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { SimpleChallenge } from '../models/SimpleChallenge';
import { SimpleChallengeParticipant } from '../models/SimpleChallengeParticipant';
import { SimpleChallengeEmotion } from '../models/SimpleChallengeEmotion';
import { User } from '../models/User';
import { Emotion } from '../models/Emotion';

export class SimpleChallengeController {
  
  // 모든 챌린지 조회 (간단한 버전)
  public static async getChallenges(req: Request, res: Response) {
    try {
      console.log('🎯 새로운 Simple Challenge API 호출됨');
      
      const { page = 1, limit = 20, status = 'active' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const challenges = await SimpleChallenge.findAndCountAll({
        where: {
          status: status as string,
          is_public: true
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['user_id', 'nickname']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      console.log(`✅ 챌린지 ${challenges.count}개 조회 성공`);

      res.json({
        status: 'success',
        data: {
          challenges: challenges.rows,
          totalCount: challenges.count,
          currentPage: Number(page),
          totalPages: Math.ceil(challenges.count / Number(limit))
        }
      });

    } catch (error: any) {
      console.error('❌ 챌린지 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 챌린지 생성
  public static async createChallenge(req: Request, res: Response) {
    try {
      console.log('🎯 새로운 챌린지 생성 요청:', req.body);
      
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '로그인이 필요합니다.'
        });
      }

      const {
        title,
        description = '',
        start_date,
        end_date,
        max_participants,
        is_public = true
      } = req.body;

      // 기본 검증
      if (!title || !start_date || !end_date) {
        return res.status(400).json({
          status: 'error',
          message: '제목, 시작일, 종료일은 필수입니다.'
        });
      }

      // 새로운 챌린지 생성
      const newChallenge = await SimpleChallenge.create({
        title,
        description,
        start_date,
        end_date,
        creator_id: userId,
        max_participants: max_participants || null,
        is_public,
        status: 'active',
        participant_count: 1
      });

      // 생성자를 자동으로 참여자로 추가
      await SimpleChallengeParticipant.create({
        challenge_id: newChallenge.id,
        user_id: userId,
        status: 'active',
        progress_count: 0
      });

      console.log(`✅ 새로운 챌린지 생성 성공: ${newChallenge.id}`);

      res.status(201).json({
        status: 'success',
        data: newChallenge,
        message: '챌린지가 성공적으로 생성되었습니다.'
      });

    } catch (error: any) {
      console.error('❌ 챌린지 생성 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 생성 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 챌린지 참여
  public static async joinChallenge(req: Request, res: Response) {
    try {
      const challengeId = parseInt(req.params.challengeId);
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '로그인이 필요합니다.'
        });
      }

      // 챌린지 존재 확인
      const challenge = await SimpleChallenge.findByPk(challengeId);
      if (!challenge) {
        return res.status(404).json({
          status: 'error',
          message: '챌린지를 찾을 수 없습니다.'
        });
      }

      // 이미 참여했는지 확인
      const existingParticipant = await SimpleChallengeParticipant.findOne({
        where: {
          challenge_id: challengeId,
          user_id: userId
        }
      });

      if (existingParticipant) {
        return res.status(400).json({
          status: 'error',
          message: '이미 참여한 챌린지입니다.'
        });
      }

      // 참여자 수 제한 확인
      if (challenge.max_participants && challenge.participant_count >= challenge.max_participants) {
        return res.status(400).json({
          status: 'error',
          message: '참여자 수가 한계에 도달했습니다.'
        });
      }

      // 참여자 추가
      await SimpleChallengeParticipant.create({
        challenge_id: challengeId,
        user_id: userId,
        status: 'active',
        progress_count: 0
      });

      // 챌린지 참여자 수 업데이트
      await challenge.update({
        participant_count: challenge.participant_count + 1
      });

      console.log(`✅ 사용자 ${userId}가 챌린지 ${challengeId}에 참여`);

      res.json({
        status: 'success',
        message: '챌린지에 성공적으로 참여했습니다.'
      });

    } catch (error: any) {
      console.error('❌ 챌린지 참여 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 참여 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 내가 참여한 챌린지 조회
  public static async getMyParticipations(req: Request, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '로그인이 필요합니다.'
        });
      }

      const participations = await SimpleChallengeParticipant.findAll({
        where: {
          user_id: userId
        },
        include: [
          {
            model: SimpleChallenge,
            as: 'challenge',
            include: [
              {
                model: User,
                as: 'creator',
                attributes: ['user_id', 'nickname']
              }
            ]
          }
        ],
        order: [['joined_at', 'DESC']]
      });

      console.log(`✅ 사용자 ${userId}의 참여 챌린지 ${participations.length}개 조회`);

      res.json({
        status: 'success',
        data: participations
      });

    } catch (error: any) {
      console.error('❌ 내 참여 챌린지 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '참여 챌린지 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 감정 기록 추가
  public static async addEmotionLog(req: Request, res: Response) {
    try {
      const challengeId = parseInt(req.params.challengeId);
      const userId = req.user?.user_id;
      const { emotion_id, note = '', log_date } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '로그인이 필요합니다.'
        });
      }

      // 참여자인지 확인
      const participant = await SimpleChallengeParticipant.findOne({
        where: {
          challenge_id: challengeId,
          user_id: userId,
          status: 'active'
        }
      });

      if (!participant) {
        return res.status(403).json({
          status: 'error',
          message: '챌린지에 참여하고 있지 않습니다.'
        });
      }

      const today = log_date || new Date().toISOString().split('T')[0];

      // 오늘 이미 기록했는지 확인
      const existingLog = await SimpleChallengeEmotion.findOne({
        where: {
          challenge_id: challengeId,
          user_id: userId,
          log_date: today
        }
      });

      if (existingLog) {
        // 기존 기록 업데이트
        await existingLog.update({
          emotion_id,
          note
        });

        console.log(`✅ 감정 기록 업데이트: 챌린지 ${challengeId}, 사용자 ${userId}`);

        res.json({
          status: 'success',
          data: existingLog,
          message: '감정 기록이 업데이트되었습니다.'
        });
      } else {
        // 새로운 기록 추가
        const newLog = await SimpleChallengeEmotion.create({
          challenge_id: challengeId,
          user_id: userId,
          emotion_id,
          log_date: today,
          note
        });

        // 진행률 업데이트
        await participant.update({
          progress_count: participant.progress_count + 1
        });

        console.log(`✅ 새로운 감정 기록 추가: 챌린지 ${challengeId}, 사용자 ${userId}`);

        res.status(201).json({
          status: 'success',
          data: newLog,
          message: '감정 기록이 추가되었습니다.'
        });
      }

    } catch (error: any) {
      console.error('❌ 감정 기록 추가 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '감정 기록 추가 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 챌린지 상세 정보 조회
  public static async getChallengeDetail(req: Request, res: Response) {
    try {
      const challengeId = parseInt(req.params.challengeId);
      const userId = req.user?.user_id;

      const challenge = await SimpleChallenge.findByPk(challengeId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['user_id', 'nickname']
          }
        ]
      });

      if (!challenge) {
        return res.status(404).json({
          status: 'error',
          message: '챌린지를 찾을 수 없습니다.'
        });
      }

      // 내 참여 상태 확인
      let myParticipation = null;
      if (userId) {
        myParticipation = await SimpleChallengeParticipant.findOne({
          where: {
            challenge_id: challengeId,
            user_id: userId
          }
        });
      }

      res.json({
        status: 'success',
        data: {
          challenge,
          myParticipation
        }
      });

    } catch (error: any) {
      console.error('❌ 챌린지 상세 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '챌린지 상세 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 베스트 챌린지 조회 (참여자 수 기준)
  public static async getBestChallenges(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const bestChallenges = await SimpleChallenge.findAll({
        where: {
          status: 'active',
          is_public: true
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['user_id', 'nickname']
          }
        ],
        order: [['participant_count', 'DESC'], ['created_at', 'DESC']],
        limit: Number(limit)
      });

      console.log(`✅ 베스트 챌린지 ${bestChallenges.length}개 조회`);

      res.json({
        status: 'success',
        data: bestChallenges
      });

    } catch (error: any) {
      console.error('❌ 베스트 챌린지 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '베스트 챌린지 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
}