// routes/notices.ts - 공지사항 API
import { Router, Request, Response } from 'express';
import Notice from '../models/Notice';
import authMiddleware from '../middleware/authMiddleware';
import { Op } from 'sequelize';

const router = Router();

// 공지사항 목록 조회 (공개)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await Notice.findAndCountAll({
      where: { is_active: true },
      order: [['is_pinned', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset,
      attributes: ['notice_id', 'title', 'type', 'is_pinned', 'view_count', 'created_at'],
    });

    res.json({
      status: 'success',
      data: {
        notices: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('공지사항 목록 조회 오류:', error);
    res.status(500).json({ status: 'error', message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 상세 조회 (공개)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const noticeId = parseInt(req.params.id);
    if (isNaN(noticeId)) {
      return res.status(400).json({ status: 'error', message: '유효하지 않은 ID입니다.' });
    }

    const notice = await Notice.findOne({
      where: { notice_id: noticeId, is_active: true },
    });

    if (!notice) {
      return res.status(404).json({ status: 'error', message: '공지사항을 찾을 수 없습니다.' });
    }

    // 조회수 증가 (비동기)
    Notice.increment('view_count', { where: { notice_id: noticeId } });

    res.json({ status: 'success', data: notice });
  } catch (error) {
    console.error('공지사항 상세 조회 오류:', error);
    res.status(500).json({ status: 'error', message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 생성 (관리자 전용)
router.post('/', authMiddleware, async (req: any, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && !req.user?.is_admin) {
      return res.status(403).json({ status: 'error', message: '권한이 없습니다.' });
    }

    const { title, content, type = 'normal', is_pinned = false } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ status: 'error', message: '제목과 내용은 필수입니다.' });
    }

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      type,
      is_pinned,
      created_by: req.user.user_id,
    });

    res.status(201).json({ status: 'success', data: notice, message: '공지사항이 등록되었습니다.' });
  } catch (error) {
    console.error('공지사항 생성 오류:', error);
    res.status(500).json({ status: 'error', message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 수정 (관리자 전용)
router.put('/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && !req.user?.is_admin) {
      return res.status(403).json({ status: 'error', message: '권한이 없습니다.' });
    }

    const noticeId = parseInt(req.params.id);
    const notice = await Notice.findByPk(noticeId);

    if (!notice) {
      return res.status(404).json({ status: 'error', message: '공지사항을 찾을 수 없습니다.' });
    }

    const { title, content, type, is_pinned, is_active } = req.body;
    await notice.update({
      ...(title && { title: title.trim() }),
      ...(content && { content: content.trim() }),
      ...(type && { type }),
      ...(typeof is_pinned === 'boolean' && { is_pinned }),
      ...(typeof is_active === 'boolean' && { is_active }),
    });

    res.json({ status: 'success', data: notice, message: '공지사항이 수정되었습니다.' });
  } catch (error) {
    console.error('공지사항 수정 오류:', error);
    res.status(500).json({ status: 'error', message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 삭제 (관리자 전용, 소프트 삭제)
router.delete('/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && !req.user?.is_admin) {
      return res.status(403).json({ status: 'error', message: '권한이 없습니다.' });
    }

    const noticeId = parseInt(req.params.id);
    const result = await Notice.update({ is_active: false }, { where: { notice_id: noticeId } });

    if (result[0] === 0) {
      return res.status(404).json({ status: 'error', message: '공지사항을 찾을 수 없습니다.' });
    }

    res.json({ status: 'success', message: '공지사항이 삭제되었습니다.' });
  } catch (error) {
    console.error('공지사항 삭제 오류:', error);
    res.status(500).json({ status: 'error', message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
