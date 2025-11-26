import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { sequelize } from '../models';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 입력값 검증 미들웨어
const validate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
  }
  next();
};

// 허용된 콘텐츠 타입
const ALLOWED_CONTENT_TYPES = ['post', 'comment'];

// 모든 block 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 콘텐츠 차단
router.post('/content',
  body('contentType').isIn(ALLOWED_CONTENT_TYPES).withMessage('유효한 콘텐츠 타입이 아닙니다 (post 또는 comment)'),
  body('contentId').isInt({ min: 1 }).withMessage('유효한 콘텐츠 ID가 아닙니다'),
  body('reason').optional().isLength({ max: 500 }).withMessage('사유는 500자 이하여야 합니다'),
  validate,
  async (req, res) => {
  const userId = req.user?.user_id;
  const { contentType, contentId, reason } = req.body;

  if (process.env.NODE_ENV === 'development') {
    console.log('🚫 [백엔드] 콘텐츠 차단 요청:', { userId, contentType, contentId });
  }

  if (!userId) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  try {
    // MySQL용 INSERT IGNORE 문법
    await sequelize.query(
      `INSERT IGNORE INTO content_blocks (user_id, content_type, content_id, reason, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      { replacements: [userId, contentType, contentId, reason || null] }
    );
    res.json({ status: 'success', message: '콘텐츠가 차단되었습니다.' });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 콘텐츠 차단 오류:', error);
    }
    res.status(500).json({ status: 'error', message: '콘텐츠 차단 중 오류가 발생했습니다.' });
  }
});

// 사용자 차단
router.post('/user/:blockedUserId',
  param('blockedUserId').isInt({ min: 1 }).withMessage('유효한 사용자 ID가 아닙니다'),
  body('reason').optional().isLength({ max: 500 }).withMessage('사유는 500자 이하여야 합니다'),
  validate,
  async (req, res) => {
  const userId = req.user?.user_id;
  const { blockedUserId } = req.params;
  const { reason } = req.body;

  if (!userId) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  if (userId === parseInt(blockedUserId)) return res.status(400).json({ status: 'error', message: '자기 자신을 차단할 수 없습니다.' });

  try {
    // MySQL용 INSERT IGNORE 문법 (reason 필드 포함)
    await sequelize.query(
      `INSERT IGNORE INTO user_blocks (user_id, blocked_user_id, reason, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      { replacements: [userId, blockedUserId, reason || null] }
    );
    res.json({ status: 'success', message: '사용자가 차단되었습니다.' });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 사용자 차단 오류:', error);
    }
    res.status(500).json({ status: 'error', message: '사용자 차단 중 오류가 발생했습니다.' });
  }
});

// 차단된 콘텐츠 목록 조회 (댓글/답글 내용 포함)
router.get('/contents', async (req, res) => {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {

    // content_blocks와 실제 댓글/게시물 테이블 조인하여 내용 조회
    const [result] = await sequelize.query(
      `SELECT
        cb.block_id,
        cb.content_type,
        cb.content_id,
        cb.reason,
        cb.created_at,
        CASE
          WHEN cb.content_type = 'comment' THEN COALESCE(mdc.content, sdc.content)
          WHEN cb.content_type = 'post' THEN COALESCE(mdp.content, sdp.content)
          ELSE NULL
        END as content_text,
        CASE
          WHEN cb.content_type = 'comment' THEN COALESCE(mdc_user.nickname, sdc_user.nickname)
          WHEN cb.content_type = 'post' THEN COALESCE(mdp_user.nickname, sdp_user.nickname)
          ELSE NULL
        END as author_nickname,
        CASE
          WHEN cb.content_type = 'comment' THEN COALESCE(mdc_user.username, sdc_user.username)
          WHEN cb.content_type = 'post' THEN COALESCE(mdp_user.username, sdp_user.username)
          ELSE NULL
        END as author_username,
        CASE
          WHEN cb.content_type = 'comment' THEN COALESCE(mdc_user.user_id, sdc_user.user_id)
          WHEN cb.content_type = 'post' THEN COALESCE(mdp_user.user_id, sdp_user.user_id)
          ELSE NULL
        END as author_id,
        CASE
          WHEN cb.content_type = 'comment' THEN COALESCE(sdc.is_anonymous, 0)
          WHEN cb.content_type = 'post' THEN COALESCE(mdp.is_anonymous, sdp.is_anonymous, 0)
          ELSE 0
        END as is_anonymous
       FROM content_blocks cb
       LEFT JOIN my_day_comments mdc ON cb.content_type = 'comment' AND cb.content_id = mdc.comment_id
       LEFT JOIN users mdc_user ON mdc.user_id = mdc_user.user_id
       LEFT JOIN someone_day_comments sdc ON cb.content_type = 'comment' AND cb.content_id = sdc.comment_id
       LEFT JOIN users sdc_user ON sdc.user_id = sdc_user.user_id
       LEFT JOIN my_day_posts mdp ON cb.content_type = 'post' AND cb.content_id = mdp.post_id
       LEFT JOIN users mdp_user ON mdp.user_id = mdp_user.user_id
       LEFT JOIN someone_day_posts sdp ON cb.content_type = 'post' AND cb.content_id = sdp.post_id
       LEFT JOIN users sdp_user ON sdp.user_id = sdp_user.user_id
       WHERE cb.user_id = ?
       ORDER BY cb.created_at DESC`,
      { replacements: [userId] }
    );

    res.json({ status: 'success', data: result });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 차단 콘텐츠 조회 오류:', error.message);
    }
    res.status(500).json({ status: 'error', message: '차단 콘텐츠 조회 중 오류가 발생했습니다.' });
  }
});

// 차단된 사용자 목록 조회
router.get('/users', async (req, res) => {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    const [result] = await sequelize.query(
      `SELECT ub.user_id as blocker_id, ub.blocked_user_id as blocked_id,
              u.username, u.nickname, u.profile_image_url, ub.reason, ub.created_at
       FROM user_blocks ub
       JOIN users u ON ub.blocked_user_id = u.user_id
       WHERE ub.user_id = ?
       ORDER BY ub.created_at DESC`,
      { replacements: [userId] }
    );
    res.json({ status: 'success', data: result });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 차단 사용자 조회 오류:', error);
    }
    res.status(500).json({ status: 'error', message: '차단 사용자 조회 중 오류가 발생했습니다.' });
  }
});

// 콘텐츠 차단 해제
router.delete('/content/:contentType/:contentId',
  param('contentType').isIn(ALLOWED_CONTENT_TYPES).withMessage('유효한 콘텐츠 타입이 아닙니다'),
  param('contentId').isInt({ min: 1 }).withMessage('유효한 콘텐츠 ID가 아닙니다'),
  validate,
  async (req, res) => {
  const userId = req.user?.user_id;
  const { contentType, contentId } = req.params;

  if (!userId) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    await sequelize.query(
      `DELETE FROM content_blocks WHERE user_id = ? AND content_type = ? AND content_id = ?`,
      { replacements: [userId, contentType, contentId] }
    );
    res.json({ status: 'success', message: '콘텐츠 차단이 해제되었습니다.' });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 콘텐츠 차단 해제 오류:', error);
    }
    res.status(500).json({ status: 'error', message: '콘텐츠 차단 해제 중 오류가 발생했습니다.' });
  }
});

// 사용자 차단 해제
router.delete('/user/:blockedUserId',
  param('blockedUserId').isInt({ min: 1 }).withMessage('유효한 사용자 ID가 아닙니다'),
  validate,
  async (req, res) => {
  const userId = req.user?.user_id;
  const { blockedUserId } = req.params;

  if (!userId) return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });

  try {
    await sequelize.query(
      `DELETE FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?`,
      { replacements: [userId, blockedUserId] }
    );
    res.json({ status: 'success', message: '사용자 차단이 해제되었습니다.' });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 사용자 차단 해제 오류:', error);
    }
    res.status(500).json({ status: 'error', message: '사용자 차단 해제 중 오류가 발생했습니다.' });
  }
});

export default router;
