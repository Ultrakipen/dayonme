import { Request, Response } from 'express';
import db from '../models';
import { ReportStatus, ReportType } from '../models/ChallengeReport';

export const submitReport = async (req: Request, res: Response) => {
  try {
    const { item_type, item_id, report_type, reason, details } = req.body;
    const reporter_id = req.user?.user_id;

    if (!reporter_id) {
      return res.status(401).json({ status: 'error', message: '인증 필요' });
    }

    if (item_type === 'challenge') {
      // 중복 신고 확인
      const existingReport = await db.ChallengeReport.findOne({
        where: {
          challenge_id: item_id,
          reporter_id
        }
      });

      if (existingReport) {
        return res.status(400).json({
          status: 'error',
          message: '이미 신고한 챌린지입니다.',
          code: 'ALREADY_REPORTED'
        });
      }

      const report = await db.ChallengeReport.create({
        challenge_id: item_id,
        reporter_id,
        report_type,
        description: details || reason,
        status: ReportStatus.PENDING
      });

      return res.status(201).json({
        status: 'success',
        data: report,
        message: '신고가 접수되었습니다'
      });
    }

    if (item_type === 'post') {
      // 게시물 존재 확인
      const post = await db.SomeoneDayPost.findByPk(item_id);
      if (!post) {
        return res.status(404).json({
          status: 'error',
          message: '게시물을 찾을 수 없습니다.'
        });
      }

      // 중복 신고 확인
      const existingReport = await db.PostReport.findOne({
        where: {
          post_id: item_id,
          reporter_id
        }
      });

      if (existingReport) {
        return res.status(400).json({
          status: 'error',
          message: '이미 신고한 게시물입니다.',
          code: 'ALREADY_REPORTED'
        });
      }

      const report = await db.PostReport.create({
        post_id: item_id,
        reporter_id,
        report_type,
        description: details || reason,
        status: ReportStatus.PENDING
      });

      return res.status(201).json({
        status: 'success',
        data: report,
        message: '신고가 접수되었습니다'
      });
    }

    res.status(400).json({ status: 'error', message: '지원하지 않는 타입' });
  } catch (error: any) {
    console.error('신고 접수 오류:', error);
    res.status(500).json({ status: 'error', message: '신고 접수 실패' });
  }
};

export const getMyReports = async (req: Request, res: Response) => {
  try {
    const reporter_id = req.user?.user_id;
    const { page = 1, limit = 20, status, item_type } = req.query;

    if (!reporter_id) {
      return res.status(401).json({ status: 'error', message: '인증 필요' });
    }

    const where: any = { reporter_id };
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    let allReports: any[] = [];
    let totalCount = 0;

    // 챌린지 신고 조회
    if (!item_type || item_type === 'challenge') {
      const { rows, count } = await db.ChallengeReport.findAndCountAll({
        where,
        include: [{
          model: db.Challenge,
          as: 'challenge',
          attributes: ['challenge_id', 'title', 'description']
        }],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset
      });
      allReports = [...allReports, ...rows.map((r: any) => ({ ...r.toJSON(), item_type: 'challenge' }))];
      totalCount += count;
    }

    // 게시물 신고 조회
    if (!item_type || item_type === 'post') {
      const { rows, count } = await db.PostReport.findAndCountAll({
        where,
        include: [{
          model: db.SomeoneDayPost,
          as: 'post',
          attributes: ['post_id', 'content']
        }],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset
      });
      allReports = [...allReports, ...rows.map((r: any) => ({ ...r.toJSON(), item_type: 'post' }))];
      totalCount += count;
    }

    // 최신순 정렬
    allReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      status: 'success',
      data: allReports,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('신고 목록 조회 오류:', error);
    res.status(500).json({ status: 'error', message: '조회 실패' });
  }
};

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const adminEmails = ['admin@dayonme.co.kr', 'test@example.com'];
    if (!adminEmails.includes(req.user?.email || '')) {
      return res.status(403).json({ status: 'error', message: '권한 없음' });
    }

    const { page = 1, limit = 20, status, item_type } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    let allReports: any[] = [];
    let totalCount = 0;

    // 챌린지 신고 조회
    if (!item_type || item_type === 'challenge') {
      const { rows, count } = await db.ChallengeReport.findAndCountAll({
        where,
        include: [
          {
            model: db.Challenge,
            as: 'challenge',
            attributes: ['challenge_id', 'title', 'description']
          },
          {
            model: db.User,
            as: 'reporter',
            attributes: ['user_id', 'username', 'nickname']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset
      });
      allReports = [...allReports, ...rows.map((r: any) => ({ ...r.toJSON(), item_type: 'challenge' }))];
      totalCount += count;
    }

    // 게시물 신고 조회
    if (!item_type || item_type === 'post') {
      const { rows, count } = await db.PostReport.findAndCountAll({
        where,
        include: [
          {
            model: db.SomeoneDayPost,
            as: 'post',
            attributes: ['post_id', 'content', 'user_id']
          },
          {
            model: db.User,
            as: 'reporter',
            attributes: ['user_id', 'username', 'nickname']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset
      });
      allReports = [...allReports, ...rows.map((r: any) => ({ ...r.toJSON(), item_type: 'post' }))];
      totalCount += count;
    }

    // 최신순 정렬
    allReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      status: 'success',
      data: allReports,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('전체 신고 조회 오류:', error);
    res.status(500).json({ status: 'error', message: '조회 실패' });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const adminEmails = ['admin@dayonme.co.kr', 'test@example.com'];
    if (!adminEmails.includes(req.user?.email || '')) {
      return res.status(403).json({ status: 'error', message: '권한 없음' });
    }

    const { id } = req.params;

    // 챌린지 신고 확인
    let report: any = await db.ChallengeReport.findOne({
      where: { report_id: id },
      include: [
        {
          model: db.Challenge,
          as: 'challenge',
          attributes: ['challenge_id', 'title', 'description']
        },
        {
          model: db.User,
          as: 'reporter',
          attributes: ['user_id', 'username', 'nickname']
        }
      ]
    });

    if (report) {
      return res.json({
        status: 'success',
        data: { ...report.toJSON(), item_type: 'challenge' }
      });
    }

    // 게시물 신고 확인
    report = await db.PostReport.findOne({
      where: { report_id: id },
      include: [
        {
          model: db.SomeoneDayPost,
          as: 'post',
          attributes: ['post_id', 'content', 'user_id']
        },
        {
          model: db.User,
          as: 'reporter',
          attributes: ['user_id', 'username', 'nickname']
        }
      ]
    });

    if (report) {
      return res.json({
        status: 'success',
        data: { ...report.toJSON(), item_type: 'post' }
      });
    }

    return res.status(404).json({ status: 'error', message: '신고를 찾을 수 없습니다' });
  } catch (error) {
    console.error('신고 조회 오류:', error);
    res.status(500).json({ status: 'error', message: '조회 실패' });
  }
};

export const reviewReport = async (req: Request, res: Response) => {
  try {
    const adminEmails = ['admin@dayonme.co.kr', 'test@example.com'];
    if (!adminEmails.includes(req.user?.email || '')) {
      return res.status(403).json({ status: 'error', message: '권한 없음' });
    }

    const { id } = req.params;
    const { status, resolution_note } = req.body;

    // 챌린지 신고 확인 및 업데이트
    let report: any = await db.ChallengeReport.findByPk(id);
    if (report) {
      await report.update({ status });
      return res.json({
        status: 'success',
        data: report,
        message: '신고 처리 완료'
      });
    }

    // 게시물 신고 확인 및 업데이트
    report = await db.PostReport.findByPk(id);
    if (report) {
      await report.update({ status });
      return res.json({
        status: 'success',
        data: report,
        message: '신고 처리 완료'
      });
    }

    return res.status(404).json({ status: 'error', message: '신고를 찾을 수 없습니다' });
  } catch (error) {
    console.error('신고 처리 오류:', error);
    res.status(500).json({ status: 'error', message: '처리 실패' });
  }
};

export const getReportStats = async (req: Request, res: Response) => {
  try {
    const adminEmails = ['admin@dayonme.co.kr', 'test@example.com'];
    if (!adminEmails.includes(req.user?.email || '')) {
      return res.status(403).json({ status: 'error', message: '권한 없음' });
    }

    const [
      challengePending, challengeReviewed, challengeResolved, challengeDismissed,
      postPending, postReviewed, postResolved, postDismissed
    ] = await Promise.all([
      db.ChallengeReport.count({ where: { status: ReportStatus.PENDING } }),
      db.ChallengeReport.count({ where: { status: ReportStatus.REVIEWED } }),
      db.ChallengeReport.count({ where: { status: ReportStatus.RESOLVED } }),
      db.ChallengeReport.count({ where: { status: ReportStatus.DISMISSED } }),
      db.PostReport.count({ where: { status: ReportStatus.PENDING } }),
      db.PostReport.count({ where: { status: ReportStatus.REVIEWED } }),
      db.PostReport.count({ where: { status: ReportStatus.RESOLVED } }),
      db.PostReport.count({ where: { status: ReportStatus.DISMISSED } })
    ]);

    const pending = challengePending + postPending;
    const reviewed = challengeReviewed + postReviewed;
    const resolved = challengeResolved + postResolved;
    const dismissed = challengeDismissed + postDismissed;

    res.json({
      status: 'success',
      data: {
        pending,
        reviewed,
        resolved,
        dismissed,
        total: pending + reviewed + resolved + dismissed,
        by_type: {
          challenge: {
            pending: challengePending,
            reviewed: challengeReviewed,
            resolved: challengeResolved,
            dismissed: challengeDismissed,
            total: challengePending + challengeReviewed + challengeResolved + challengeDismissed
          },
          post: {
            pending: postPending,
            reviewed: postReviewed,
            resolved: postResolved,
            dismissed: postDismissed,
            total: postPending + postReviewed + postResolved + postDismissed
          }
        }
      }
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({ status: 'error', message: '조회 실패' });
  }
};
