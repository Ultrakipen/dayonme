// controllers/encouragementController.ts
import { Response } from 'express';
import { AuthRequest } from '../types/express';
import db from '../models';
import { Op, QueryTypes } from 'sequelize';

class EncouragementController {
  // 익명 격려 메시지 전송
  async sendEncouragement(req: AuthRequest, res: Response) {
    const transaction = await db.sequelize.transaction();
    try {
      const senderId = req.user?.user_id;
      const { to_user_id, message } = req.body;

      if (!senderId) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 유효성 검사
      if (!to_user_id || !message) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '받는 사람과 메시지는 필수입니다.'
        });
      }

      if (message.length > 100) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '메시지는 100자 이내로 작성해주세요.'
        });
      }

      // 본인에게 전송 방지
      if (senderId === to_user_id) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '본인에게는 격려 메시지를 보낼 수 없습니다.'
        });
      }

      // 받는 사용자 존재 확인
      const recipient = await db.User.findByPk(to_user_id, { transaction });
      if (!recipient) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '존재하지 않는 사용자입니다.'
        });
      }

      // 하루 전송 제한 확인 (3개)
      const today = new Date().toISOString().split('T')[0];
      let dailyLimit = await db.EncouragementDailyLimit.findOne({
        where: {
          user_id: senderId,
          sent_date: today
        },
        transaction
      });

      if (dailyLimit && dailyLimit.count >= 3) {
        await transaction.rollback();
        return res.status(429).json({
          status: 'error',
          message: '하루 최대 3개의 격려 메시지만 보낼 수 있습니다.',
          data: {
            dailyLimit: 3,
            sent: dailyLimit.count,
            remaining: 0
          }
        });
      }

      // 익명 격려 메시지 생성
      const encouragement = await db.AnonymousEncouragement.create({
        to_user_id,
        message,
        sent_at: new Date(),
        is_read: false
      }, { transaction });

      // 전송 제한 카운트 업데이트
      if (dailyLimit) {
        await dailyLimit.increment('count', { transaction });
      } else {
        await db.EncouragementDailyLimit.create({
          user_id: senderId,
          sent_date: today,
          count: 1
        }, { transaction });
      }

      await transaction.commit();

      // 응답에는 sender 정보 포함하지 않음 (익명성 보장)
      return res.status(201).json({
        status: 'success',
        message: '익명 격려 메시지가 전송되었습니다.',
        data: {
          encouragement_id: encouragement.encouragement_id,
          sent_at: encouragement.sent_at,
          dailyRemaining: dailyLimit ? 3 - (dailyLimit.count + 1) : 2
        }
      });

    } catch (error: any) {
      await transaction.rollback();
      console.error('익명 격려 메시지 전송 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '메시지 전송 중 오류가 발생했습니다.'
      });
    }
  }

  // 받은 익명 격려 메시지 조회
  async getReceivedEncouragements(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const unreadOnly = req.query.unreadOnly === 'true';

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const whereClause: any = { to_user_id: userId };
      if (unreadOnly) {
        whereClause.is_read = false;
      }

      const { count, rows: encouragements } = await db.AnonymousEncouragement.findAndCountAll({
        where: whereClause,
        order: [['sent_at', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      return res.json({
        status: 'success',
        data: {
          encouragements: encouragements.map(e => ({
            encouragement_id: e.encouragement_id,
            message: e.message,
            sent_at: e.sent_at,
            is_read: e.is_read
          })),
          pagination: {
            page,
            limit,
            total: count,
            totalPages,
            unreadCount: unreadOnly ? count : await db.AnonymousEncouragement.count({
              where: { to_user_id: userId, is_read: false }
            })
          }
        }
      });

    } catch (error: any) {
      console.error('격려 메시지 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '메시지 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 격려 메시지 읽음 처리
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      const encouragementId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const encouragement = await db.AnonymousEncouragement.findOne({
        where: {
          encouragement_id: encouragementId,
          to_user_id: userId
        }
      });

      if (!encouragement) {
        return res.status(404).json({
          status: 'error',
          message: '메시지를 찾을 수 없습니다.'
        });
      }

      await encouragement.update({ is_read: true });

      return res.json({
        status: 'success',
        message: '읽음 처리되었습니다.'
      });

    } catch (error: any) {
      console.error('읽음 처리 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '읽음 처리 중 오류가 발생했습니다.'
      });
    }
  }

  // 전체 읽음 처리
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const [updatedCount] = await db.AnonymousEncouragement.update(
        { is_read: true },
        {
          where: {
            to_user_id: userId,
            is_read: false
          }
        }
      );

      return res.json({
        status: 'success',
        message: '모든 메시지가 읽음 처리되었습니다.',
        data: {
          updatedCount
        }
      });

    } catch (error: any) {
      console.error('전체 읽음 처리 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '읽음 처리 중 오류가 발생했습니다.'
      });
    }
  }

  // 오늘 남은 전송 가능 횟수 조회
  async getRemainingCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const dailyLimit = await db.EncouragementDailyLimit.findOne({
        where: {
          user_id: userId,
          sent_date: today
        }
      });

      const sent = dailyLimit ? dailyLimit.count : 0;
      const remaining = 3 - sent;

      return res.json({
        status: 'success',
        data: {
          dailyLimit: 3,
          sent,
          remaining: Math.max(0, remaining)
        }
      });

    } catch (error: any) {
      console.error('남은 횟수 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 카드 템플릿 목록 조회
  async getCardTemplates(req: AuthRequest, res: Response) {
    try {
      const templates = await db.sequelize.query(
        `SELECT id, emoji, title, default_message, background_color, text_color, display_order
         FROM card_templates
         WHERE is_active = 1
         ORDER BY display_order ASC`,
        {
          type: QueryTypes.SELECT
        }
      );

      return res.json({
        status: 'success',
        data: templates
      });

    } catch (error: any) {
      console.error('카드 템플릿 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '카드 템플릿을 불러오는데 실패했습니다.'
      });
    }
  }

  // 템플릿 기반 익명 카드 전송
  async sendTemplateCard(req: AuthRequest, res: Response) {
    const transaction = await db.sequelize.transaction();
    try {
      const senderId = req.user?.user_id;
      const { template_id, custom_message } = req.body;

      if (!senderId) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 하루 전송 제한 확인 (10개)
      const today = new Date().toISOString().split('T')[0];
      let dailyLimit = await db.EncouragementDailyLimit.findOne({
        where: {
          user_id: senderId,
          sent_date: today
        },
        transaction
      });

      if (dailyLimit && dailyLimit.count >= 10) {
        await transaction.rollback();
        return res.status(429).json({
          status: 'error',
          message: '하루 최대 10개의 카드만 보낼 수 있습니다.',
          data: {
            dailyLimit: 10,
            sent: dailyLimit.count,
            remaining: 0
          }
        });
      }

      // 템플릿 조회
      const template = await db.sequelize.query(
        `SELECT * FROM card_templates WHERE id = ? AND is_active = 1`,
        {
          replacements: [template_id],
          type: QueryTypes.SELECT,
          transaction
        }
      ) as any[];

      if (!template || template.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '템플릿을 찾을 수 없습니다.'
        });
      }

      const templateData = template[0] as any;
      const finalMessage = custom_message || templateData.default_message;

      if (finalMessage.length > 100) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '메시지는 100자 이내로 작성해주세요.'
        });
      }

      // 랜덤 수신자 선택 (본인 제외)
      const randomUser = await db.sequelize.query(
        `SELECT user_id FROM users WHERE user_id != ? ORDER BY RAND() LIMIT 1`,
        {
          replacements: [senderId],
          type: QueryTypes.SELECT,
          transaction
        }
      ) as any[];

      if (!randomUser || randomUser.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '수신 가능한 사용자가 없습니다.'
        });
      }

      const recipientId = (randomUser[0] as any).user_id;

      // 익명 카드 생성
      await db.sequelize.query(
        `INSERT INTO anonymous_encouragements (to_user_id, message, template_id, is_custom, sent_at, is_read)
         VALUES (?, ?, ?, ?, NOW(), 0)`,
        {
          replacements: [
            recipientId,
            finalMessage,
            template_id,
            custom_message ? 1 : 0
          ],
          type: QueryTypes.INSERT,
          transaction
        }
      );

      // 전송 제한 카운트 업데이트
      if (dailyLimit) {
        await dailyLimit.increment('count', { transaction });
      } else {
        await db.EncouragementDailyLimit.create({
          user_id: senderId,
          sent_date: today,
          count: 1
        }, { transaction });
      }

      await transaction.commit();

      return res.status(201).json({
        status: 'success',
        message: '카드가 전송되었습니다.',
        data: {
          sent: dailyLimit ? dailyLimit.count + 1 : 1,
          remaining: Math.max(0, 10 - (dailyLimit ? dailyLimit.count + 1 : 1))
        }
      });

    } catch (error: any) {
      await transaction.rollback();
      console.error('카드 전송 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '카드 전송 중 오류가 발생했습니다.'
      });
    }
  }
}

const encouragementController = new EncouragementController();
export default encouragementController;
