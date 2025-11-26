import { Response } from 'express';
import { AuthRequest } from '../types/express';
import db from '../models';
import { Op } from 'sequelize';

class GoalsController {
  // 사용자의 목표 목록 조회
  async getGoals(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { status = 'all', page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereCondition: any = { user_id: userId };
      
      if (status === 'active') {
        whereCondition.is_completed = false;
        whereCondition.end_date = { [Op.gte]: new Date() };
      } else if (status === 'completed') {
        whereCondition.is_completed = true;
      }

      const goals = await db.UserGoal.findAll({
        where: whereCondition,
        include: [{
          model: db.Emotion,
          as: 'targetEmotion',
          attributes: ['emotion_id', 'name', 'icon', 'color']
        }],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset
      });

      const totalCount = await db.UserGoal.count({ where: whereCondition });

      res.json({
        status: 'success',
        data: goals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit))
        },
        message: '목표 목록을 조회했습니다.'
      });
    } catch (error) {
      console.error('목표 목록 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '목표 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 새로운 목표 생성
  async createGoal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { target_emotion_id, start_date, end_date } = req.body;

      // 입력 값 검증
      if (!target_emotion_id || !start_date || !end_date) {
        return res.status(400).json({
          status: 'error',
          message: '목표 감정, 시작일, 종료일은 필수 입력 사항입니다.'
        });
      }

      // 감정 존재 여부 확인
      const emotion = await db.Emotion.findByPk(target_emotion_id);
      if (!emotion) {
        return res.status(404).json({
          status: 'error',
          message: '해당 감정을 찾을 수 없습니다.'
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

      const goal = await db.UserGoal.create({
        user_id: userId,
        target_emotion_id,
        start_date: startDate,
        end_date: endDate,
        progress: 0,
        is_completed: false
      });

      // 생성된 목표를 감정 정보와 함께 반환
      const goalWithEmotion = await db.UserGoal.findByPk(goal.get('goal_id') as number, {
        include: [{
          model: db.Emotion,
          as: 'targetEmotion',
          attributes: ['emotion_id', 'name', 'icon', 'color']
        }]
      });

      res.status(201).json({
        status: 'success',
        data: goalWithEmotion,
        message: '새로운 목표가 생성되었습니다.'
      });
    } catch (error) {
      console.error('목표 생성 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '목표 생성 중 오류가 발생했습니다.'
      });
    }
  }

  // 특정 목표 조회
  async getGoalById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const goalId = parseInt(req.params.goalId);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const goal = await db.UserGoal.findOne({
        where: { 
          goal_id: goalId,
          user_id: userId
        },
        include: [{
          model: db.Emotion,
          as: 'targetEmotion',
          attributes: ['emotion_id', 'name', 'icon', 'color']
        }]
      });

      if (!goal) {
        return res.status(404).json({
          status: 'error',
          message: '목표를 찾을 수 없습니다.'
        });
      }

      res.json({
        status: 'success',
        data: goal,
        message: '목표를 조회했습니다.'
      });
    } catch (error) {
      console.error('목표 조회 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '목표 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 목표 수정
  async updateGoal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const goalId = parseInt(req.params.goalId);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const goal = await db.UserGoal.findOne({
        where: { 
          goal_id: goalId,
          user_id: userId
        }
      });

      if (!goal) {
        return res.status(404).json({
          status: 'error',
          message: '목표를 찾을 수 없습니다.'
        });
      }

      const { target_emotion_id, start_date, end_date } = req.body;
      const updateData: any = {};

      if (target_emotion_id) {
        const emotion = await db.Emotion.findByPk(target_emotion_id);
        if (!emotion) {
          return res.status(404).json({
            status: 'error',
            message: '해당 감정을 찾을 수 없습니다.'
          });
        }
        updateData.target_emotion_id = target_emotion_id;
      }

      if (start_date) {
        updateData.start_date = new Date(start_date);
      }

      if (end_date) {
        updateData.end_date = new Date(end_date);
      }

      // 날짜 유효성 검증
      if (updateData.start_date || updateData.end_date) {
        const startDate = updateData.start_date || (goal.get('start_date') as Date);
        const endDate = updateData.end_date || (goal.get('end_date') as Date);
        
        if (endDate <= startDate) {
          return res.status(400).json({
            status: 'error',
            message: '종료일은 시작일보다 늦어야 합니다.'
          });
        }
      }

      await goal.update(updateData);

      // 업데이트된 목표를 감정 정보와 함께 반환
      const updatedGoal = await db.UserGoal.findByPk(goalId, {
        include: [{
          model: db.Emotion,
          as: 'targetEmotion',
          attributes: ['emotion_id', 'name', 'icon', 'color']
        }]
      });

      res.json({
        status: 'success',
        data: updatedGoal,
        message: '목표가 수정되었습니다.'
      });
    } catch (error) {
      console.error('목표 수정 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '목표 수정 중 오류가 발생했습니다.'
      });
    }
  }

  // 목표 삭제
  async deleteGoal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const goalId = parseInt(req.params.goalId);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const goal = await db.UserGoal.findOne({
        where: { 
          goal_id: goalId,
          user_id: userId
        }
      });

      if (!goal) {
        return res.status(404).json({
          status: 'error',
          message: '목표를 찾을 수 없습니다.'
        });
      }

      await goal.destroy();

      res.json({
        status: 'success',
        message: '목표가 삭제되었습니다.'
      });
    } catch (error) {
      console.error('목표 삭제 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '목표 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  // 목표 진행률 업데이트
  async updateProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const goalId = parseInt(req.params.goalId);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const goal = await db.UserGoal.findOne({
        where: { 
          goal_id: goalId,
          user_id: userId
        }
      });

      if (!goal) {
        return res.status(404).json({
          status: 'error',
          message: '목표를 찾을 수 없습니다.'
        });
      }

      // 목표 기간 내의 감정 기록을 조회하여 진행률 계산
      const emotionLogs = await db.EmotionLog.findAll({
        where: {
          user_id: userId,
          emotion_id: goal.get('target_emotion_id') as number,
          created_at: {
            [Op.between]: [goal.get('start_date') as Date, goal.get('end_date') as Date]
          }
        }
      });

      // 목표 기간의 총 일수 계산
      const totalDays = Math.ceil(
        ((goal.get('end_date') as Date).getTime() - (goal.get('start_date') as Date).getTime()) / (1000 * 60 * 60 * 24)
      );

      // 감정이 기록된 고유한 날짜 수 계산
      const recordedDays = new Set(
        emotionLogs.map(log => (log.get('created_at') as Date).toISOString().split('T')[0])
      ).size;

      // 진행률 계산 (0-1 사이의 값)
      const progress = Math.min(recordedDays / totalDays, 1);
      const isCompleted = progress >= 1;

      await goal.update({
        progress,
        is_completed: isCompleted
      });

      res.json({
        status: 'success',
        data: {
          goal_id: goalId,
          progress,
          is_completed: isCompleted,
          recorded_days: recordedDays,
          total_days: totalDays
        },
        message: '목표 진행률이 업데이트되었습니다.'
      });
    } catch (error) {
      console.error('진행률 업데이트 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '진행률 업데이트 중 오류가 발생했습니다.'
      });
    }
  }
}

export default new GoalsController();