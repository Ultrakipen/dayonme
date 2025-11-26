// routes/search.ts
import { Router, Request, Response } from 'express';
import db from '../models';
import { Op } from 'sequelize'; // Op 직접 가져오기
import { searchCache } from '../middleware/cache';
import { searchLimiter } from '../middleware/rateLimiter';

const router = Router();
const User = db.User;
const MyDayPost = db.MyDayPost;
const SomeoneDayPost = db.SomeoneDayPost;
const Tag = db.Tag;

// 기본 검색 엔드포인트
router.get('/', searchCache, searchLimiter, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({
        status: 'error', 
        message: '검색어를 입력해주세요.'
      });
    }
    
    // 여기서 검색 로직 구현
    // 예시로 간단한 응답만 반환
    res.status(200).json({
      status: 'success',
      message: '검색 결과',
      query,
      results: []
    });
  } catch (error) {
    console.error('검색 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '검색 처리 중 오류가 발생했습니다.'
    });
  }
});

// 통합 검색 엔드포인트
router.get('/all', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({
        status: 'error', 
        message: '검색어를 입력해주세요.'
      });
    }
    
    // 통합 검색 로직 구현
    res.status(200).json({
      status: 'success',
      message: '통합 검색 결과',
      query,
      results: {
        users: [],
        posts: [],
        tags: []
      }
    });
  } catch (error) {
    console.error('통합 검색 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '통합 검색 처리 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 검색 엔드포인트
router.get('/users', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({
        status: 'error', 
        message: '검색어를 입력해주세요.'
      });
    }
    
    // 사용자 검색 로직 구현
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { nickname: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['user_id', 'username', 'nickname', 'profile_image_url'],
      limit: 20
    });
    
    res.status(200).json({
      status: 'success',
      message: '사용자 검색 결과',
      query,
      results: users
    });
  } catch (error) {
    console.error('사용자 검색 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '사용자 검색 처리 중 오류가 발생했습니다.'
    });
  }
});

// 게시물 검색 엔드포인트
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({
        status: 'error', 
        message: '검색어를 입력해주세요.'
      });
    }
    
    // 게시물 검색 로직 구현
    const myDayPosts = await MyDayPost.findAll({
      where: {
        content: { [Op.like]: `%${query}%` }
      },
      limit: 10
    });
    
    const someoneDayPosts = await SomeoneDayPost.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${query}%` } },
          { content: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 10
    });
    
    res.status(200).json({
      status: 'success',
      message: '게시물 검색 결과',
      query,
      results: {
        myDayPosts,
        someoneDayPosts
      }
    });
  } catch (error) {
    console.error('게시물 검색 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '게시물 검색 처리 중 오류가 발생했습니다.'
    });
  }
});

// 태그 검색 엔드포인트
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({
        status: 'error', 
        message: '검색어를 입력해주세요.'
      });
    }
    
    // 태그 검색 로직 구현
    const tags = await Tag.findAll({
      where: {
        name: { [Op.like]: `%${query}%` }
      },
      limit: 20
    });
    
    res.status(200).json({
      status: 'success',
      message: '태그 검색 결과',
      query,
      results: tags
    });
  } catch (error) {
    console.error('태그 검색 오류:', error);
    res.status(500).json({
      status: 'error',
      message: '태그 검색 처리 중 오류가 발생했습니다.'
    });
  }
});

export default router;