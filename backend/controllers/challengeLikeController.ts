// 챌린지 좋아요 컨트롤러
import { Response } from 'express';
import { AuthRequest } from '../types/express';
import db from '../models';

class ChallengeLikeController {
  // 챌린지 좋아요/취소
  async toggleChallengeLike(req: AuthRequest, res: Response) {
    try {
      const challengeId = parseInt(req.params.challengeId);
      const userId = req.user?.user_id;

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

      // ChallengeLike 모델 동적 확인
      const ChallengeLike = db.sequelize.models.ChallengeLike;

      if (!ChallengeLike) {
        // 모델이 없으면 직접 쿼리 사용 (SQLite)
        const [results] = await db.sequelize.query(
          'SELECT * FROM challenge_likes WHERE challenge_id = ? AND user_id = ?',
          { replacements: [challengeId, userId] }
        ) as any;

        let isLiked = false;
        if (results.length > 0) {
          // 좋아요 취소
          await db.sequelize.query(
            'DELETE FROM challenge_likes WHERE challenge_id = ? AND user_id = ?',
            { replacements: [challengeId, userId] }
          );
        } else {
          // 좋아요 추가
          await db.sequelize.query(
            'INSERT INTO challenge_likes (challenge_id, user_id, created_at) VALUES (?, ?, datetime(\'now\'))',
            { replacements: [challengeId, userId] }
          );
          isLiked = true;
        }

        // 현재 좋아요 수 조회
        const [countResults] = await db.sequelize.query(
          'SELECT COUNT(*) as count FROM challenge_likes WHERE challenge_id = ?',
          { replacements: [challengeId] }
        ) as any;
        const likeCount = countResults[0]?.count || 0;

        return res.json({
          status: 'success',
          data: {
            is_liked: isLiked,
            like_count: likeCount
          }
        });
      }

      // 기존 좋아요 확인
      const existingLike = await ChallengeLike.findOne({
        where: { challenge_id: challengeId, user_id: userId }
      }) as any;

      let isLiked = false;
      if (existingLike) {
        // 좋아요 취소
        await existingLike.destroy();
      } else {
        // 좋아요 추가
        await ChallengeLike.create({
          challenge_id: challengeId,
          user_id: userId
        } as any);
        isLiked = true;
      }

      // 현재 좋아요 수 조회
      const likeCount = await ChallengeLike.count({
        where: { challenge_id: challengeId }
      });

      res.json({
        status: 'success',
        data: {
          is_liked: isLiked,
          like_count: likeCount
        }
      });
    } catch (error) {
      console.error('챌린지 좋아요 오류:', error);
      res.status(500).json({
        status: 'error',
        message: '좋아요 처리 중 오류가 발생했습니다.'
      });
    }
  }
}

export default new ChallengeLikeController();
