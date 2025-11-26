// controllers/reactionController.ts
import { Response } from 'express';
import { AuthRequest } from '../types/express';
import db from '../models';
import { createNotification } from './notificationController';

class ReactionController {
  // 리액션 타입 목록 조회
  async getReactionTypes(req: AuthRequest, res: Response) {
    try {
      const reactionTypes = await db.ReactionType.findAll({
        where: { is_active: true },
        order: [['display_order', 'ASC']]
      });

      return res.json({
        status: 'success',
        data: {
          reactionTypes: reactionTypes.map(rt => ({
            reaction_type_id: rt.reaction_type_id,
            name: rt.name,
            icon: rt.icon,
            emoji: rt.emoji,
            color: rt.color
          }))
        }
      });

    } catch (error: any) {
      console.error('리액션 타입 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '리액션 타입 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // My Day 게시물에 리액션 추가/제거 (토글)
  async toggleMyDayReaction(req: AuthRequest, res: Response) {
    const transaction = await db.sequelize.transaction();
    try {
      const userId = req.user?.user_id;
      const postId = parseInt(req.params.postId);
      const { reaction_type_id } = req.body;

      if (!userId) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 게시물 존재 확인
      const post = await db.MyDayPost.findByPk(postId, { transaction });
      if (!post) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '게시물을 찾을 수 없습니다.'
        });
      }

      // 리액션 타입 확인
      const reactionType = await db.ReactionType.findByPk(reaction_type_id, { transaction });
      if (!reactionType) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '유효하지 않은 리액션 타입입니다.'
        });
      }

      // 기존 리액션 확인
      const existingReaction = await db.MyDayReaction.findOne({
        where: {
          post_id: postId,
          user_id: userId,
          reaction_type_id
        },
        transaction
      });

      let action: 'added' | 'removed';

      if (existingReaction) {
        // 이미 존재하면 제거 (토글)
        await existingReaction.destroy({ transaction });
        action = 'removed';
      } else {
        // 존재하지 않으면 추가
        await db.MyDayReaction.create({
          post_id: postId,
          user_id: userId,
          reaction_type_id,
          created_at: new Date()
        }, { transaction });
        action = 'added';

        // 알림 생성 (게시물 작성자가 리액션한 사용자와 다른 경우)
        const postAuthorId = post.get('user_id') as number;

        if (postAuthorId !== userId) {
          // 게시물 작성자의 알림 설정 확인
          const postAuthor = await db.User.findByPk(postAuthorId, {
            attributes: ['user_id', 'nickname', 'notification_settings'],
            transaction
          });

          const notificationSettings = postAuthor?.get('notification_settings') as any;
          if (postAuthor && notificationSettings?.like_notifications !== false) {
            // 리액션한 사용자 정보 가져오기
            const reactor = await db.User.findByPk(userId, {
              attributes: ['nickname'],
              transaction
            });

            // 알림 생성
            await createNotification({
              userId: postAuthorId,
              notificationType: 'reaction',
              relatedId: postId,
              postId: postId,
              postType: 'my-day',
              senderId: userId,
              senderNickname: reactor?.get('nickname') as string,
              title: `${reactor?.get('nickname')}님이 회원님의 게시물에 반응했습니다`,
              message: '회원님의 게시물에 새로운 반응이 추가되었습니다. ❤️'
            });
          }
        }
      }

      await transaction.commit();

      // 리액션 개수 조회 (트리거가 자동으로 업데이트)
      const updatedPost = await db.MyDayPost.findByPk(postId);

      return res.json({
        status: 'success',
        message: action === 'added' ? '리액션이 추가되었습니다.' : '리액션이 제거되었습니다.',
        data: {
          action,
          reaction_count: updatedPost?.reaction_count || 0
        }
      });

    } catch (error: any) {
      await transaction.rollback();
      console.error('리액션 토글 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '리액션 처리 중 오류가 발생했습니다.'
      });
    }
  }

  // Someone Day 게시물에 리액션 추가/제거 (토글)
  async toggleSomeoneDayReaction(req: AuthRequest, res: Response) {
    const transaction = await db.sequelize.transaction();
    try {
      const userId = req.user?.user_id;
      const postId = parseInt(req.params.postId);
      const { reaction_type_id } = req.body;

      if (!userId) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 게시물 존재 확인
      const post = await db.SomeoneDayPost.findByPk(postId, { transaction });
      if (!post) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '게시물을 찾을 수 없습니다.'
        });
      }

      // 리액션 타입 확인
      const reactionType = await db.ReactionType.findByPk(reaction_type_id, { transaction });
      if (!reactionType) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '유효하지 않은 리액션 타입입니다.'
        });
      }

      // 기존 리액션 확인
      const existingReaction = await db.SomeoneDayReaction.findOne({
        where: {
          post_id: postId,
          user_id: userId,
          reaction_type_id
        },
        transaction
      });

      let action: 'added' | 'removed';

      if (existingReaction) {
        // 이미 존재하면 제거 (토글)
        await existingReaction.destroy({ transaction });
        action = 'removed';
      } else {
        // 존재하지 않으면 추가
        await db.SomeoneDayReaction.create({
          post_id: postId,
          user_id: userId,
          reaction_type_id,
          created_at: new Date()
        }, { transaction });
        action = 'added';

        // 알림 생성 (게시물 작성자가 리액션한 사용자와 다른 경우)
        const postAuthorId = post.get('user_id') as number;

        if (postAuthorId !== userId) {
          // 게시물 작성자의 알림 설정 확인
          const postAuthor = await db.User.findByPk(postAuthorId, {
            attributes: ['user_id', 'nickname', 'notification_settings'],
            transaction
          });

          const notificationSettings = postAuthor?.get('notification_settings') as any;
          if (postAuthor && notificationSettings?.like_notifications !== false) {
            // 리액션한 사용자 정보 가져오기
            const reactor = await db.User.findByPk(userId, {
              attributes: ['nickname'],
              transaction
            });

            // 알림 생성
            await createNotification({
              userId: postAuthorId,
              notificationType: 'reaction',
              relatedId: postId,
              postId: postId,
              postType: 'someone-day',
              senderId: userId,
              senderNickname: reactor?.get('nickname') as string,
              title: `${reactor?.get('nickname')}님이 회원님의 게시물에 반응했습니다`,
              message: '회원님의 게시물에 새로운 반응이 추가되었습니다. ❤️'
            });
          }
        }
      }

      await transaction.commit();

      // 리액션 개수 조회 (트리거가 자동으로 업데이트)
      const updatedPost = await db.SomeoneDayPost.findByPk(postId);

      return res.json({
        status: 'success',
        message: action === 'added' ? '리액션이 추가되었습니다.' : '리액션이 제거되었습니다.',
        data: {
          action,
          reaction_count: updatedPost?.reaction_count || 0
        }
      });

    } catch (error: any) {
      await transaction.rollback();
      console.error('리액션 토글 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '리액션 처리 중 오류가 발생했습니다.'
      });
    }
  }

  // My Day 게시물의 리액션 통계 조회
  async getMyDayReactions(req: AuthRequest, res: Response) {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user?.user_id;

      // 게시물 존재 확인
      const post = await db.MyDayPost.findByPk(postId);
      if (!post) {
        return res.status(404).json({
          status: 'error',
          message: '게시물을 찾을 수 없습니다.'
        });
      }

      // 리액션 통계 조회
      const reactions = await db.MyDayReaction.findAll({
        where: { post_id: postId },
        include: [{
          model: db.ReactionType,
          as: 'reactionType',
          attributes: ['reaction_type_id', 'name', 'icon', 'emoji', 'color']
        }],
        attributes: ['reaction_type_id', 'user_id']
      });

      // 리액션별 개수 집계
      const reactionStats = reactions.reduce((acc: any, reaction: any) => {
        const typeId = reaction.reaction_type_id;
        if (!acc[typeId]) {
          acc[typeId] = {
            reaction_type_id: typeId,
            name: reaction.reactionType.name,
            icon: reaction.reactionType.icon,
            emoji: reaction.reactionType.emoji,
            color: reaction.reactionType.color,
            count: 0,
            userReacted: false
          };
        }
        acc[typeId].count++;
        if (userId && reaction.user_id === userId) {
          acc[typeId].userReacted = true;
        }
        return acc;
      }, {});

      return res.json({
        status: 'success',
        data: {
          post_id: postId,
          total_reactions: reactions.length,
          reactions: Object.values(reactionStats)
        }
      });

    } catch (error: any) {
      console.error('리액션 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '리액션 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // Someone Day 게시물의 리액션 통계 조회
  async getSomeoneDayReactions(req: AuthRequest, res: Response) {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user?.user_id;

      // 게시물 존재 확인
      const post = await db.SomeoneDayPost.findByPk(postId);
      if (!post) {
        return res.status(404).json({
          status: 'error',
          message: '게시물을 찾을 수 없습니다.'
        });
      }

      // 리액션 통계 조회
      const reactions = await db.SomeoneDayReaction.findAll({
        where: { post_id: postId },
        include: [{
          model: db.ReactionType,
          as: 'reactionType',
          attributes: ['reaction_type_id', 'name', 'icon', 'emoji', 'color']
        }],
        attributes: ['reaction_type_id', 'user_id']
      });

      // 리액션별 개수 집계
      const reactionStats = reactions.reduce((acc: any, reaction: any) => {
        const typeId = reaction.reaction_type_id;
        if (!acc[typeId]) {
          acc[typeId] = {
            reaction_type_id: typeId,
            name: reaction.reactionType.name,
            icon: reaction.reactionType.icon,
            emoji: reaction.reactionType.emoji,
            color: reaction.reactionType.color,
            count: 0,
            userReacted: false
          };
        }
        acc[typeId].count++;
        if (userId && reaction.user_id === userId) {
          acc[typeId].userReacted = true;
        }
        return acc;
      }, {});

      return res.json({
        status: 'success',
        data: {
          post_id: postId,
          total_reactions: reactions.length,
          reactions: Object.values(reactionStats)
        }
      });

    } catch (error: any) {
      console.error('리액션 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '리액션 조회 중 오류가 발생했습니다.'
      });
    }
  }
}

const reactionController = new ReactionController();
export default reactionController;
