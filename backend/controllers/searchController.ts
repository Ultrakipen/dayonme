// controllers/searchController.ts

import { Response } from 'express';
import { Op } from 'sequelize';
import db from '../models';
import { AuthRequestGeneric } from '../types/express';

interface SearchQuery {
  q: string;
  page?: string;
  limit?: string;
  type?: 'all' | 'posts' | 'users' | 'tags';
  sort_by?: 'relevance' | 'latest' | 'popular';
  date_from?: string;
  date_to?: string;
  tag?: string;
}

interface AdvancedSearchQuery extends SearchQuery {
  content_type?: 'title' | 'content' | 'both';
  author_type?: 'all' | 'anonymous' | 'identified';
  min_likes?: string;
  min_comments?: string;
  has_image?: string;
}

const searchController = {
  // 통합 검색
  search: async (req: AuthRequestGeneric<never, SearchQuery>, res: Response) => {
    try {
      const user_id = req.user?.user_id;
      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { 
        q: query, 
        page = '1', 
        limit = '20', 
        type = 'all',
        sort_by = 'relevance' 
      } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          status: 'error',
          message: '검색어는 2자 이상 입력해주세요.'
        });
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const results: any = {
        query: query.trim(),
        total_results: 0,
        search_time_ms: Date.now(),
        results: {},
      };

      const searchTerm = `%${query.trim()}%`;

      // 게시물 검색
      if (type === 'all' || type === 'posts') {
        const postWhere: any = {
          [Op.or]: [
            { title: { [Op.like]: searchTerm } },
            { content: { [Op.like]: searchTerm } }
          ]
        };

        let postOrder: any = [['created_at', 'DESC']];
        if (sort_by === 'popular') {
          postOrder = [
            [db.sequelize.literal('(like_count + comment_count)'), 'DESC'],
            ['created_at', 'DESC']
          ];
        }

        const postResults = await db.SomeoneDayPost.findAndCountAll({
          where: postWhere,
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['nickname', 'profile_image_url']
            },
            {
              model: db.Tag,
              as: 'tags',
              attributes: ['tag_id', 'name'],
              through: { attributes: [] }
            }
          ],
          order: postOrder,
          limit: limitNum,
          offset: offset,
          distinct: true
        });

        results.results.posts = postResults.rows.map((post: any) => ({
          post_id: post.get('post_id'),
          title: post.get('title'),
          content: post.get('content'),
          summary: post.get('summary'),
          is_anonymous: post.get('is_anonymous'),
          like_count: post.get('like_count'),
          comment_count: post.get('comment_count'),
          created_at: post.get('created_at'),
          user: post.get('is_anonymous') ? null : post.user,
          tags: post.tags || []
        }));

        results.total_results += postResults.count;
      }

      // 사용자 검색
      if (type === 'all' || type === 'users') {
        const userResults = await db.User.findAndCountAll({
          where: {
            [Op.or]: [
              { username: { [Op.like]: searchTerm } },
              { nickname: { [Op.like]: searchTerm } }
            ],
            is_active: true
          },
          attributes: ['user_id', 'username', 'nickname', 'profile_image_url'],
          limit: limitNum,
          offset: offset
        });

        results.results.users = userResults.rows;
        results.total_results += userResults.count;
      }

      // 태그 검색
      if (type === 'all' || type === 'tags') {
        const tagResults = await db.Tag.findAndCountAll({
          where: {
            name: { [Op.like]: searchTerm }
          },
          limit: limitNum,
          offset: offset
        });

        results.results.tags = tagResults.rows;
        results.total_results += tagResults.count;
      }

      results.search_time_ms = Date.now() - results.search_time_ms;

      // 페이지네이션 정보 추가
      results.pagination = {
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(results.total_results / limitNum),
        has_next: pageNum * limitNum < results.total_results,
        has_prev: pageNum > 1
      };

      return res.json({
        status: 'success',
        message: '검색이 완료되었습니다.',
        data: results
      });

    } catch (error) {
      console.error('통합 검색 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '검색 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 게시물 검색
  searchPosts: async (req: AuthRequestGeneric<never, SearchQuery>, res: Response) => {
    try {
      const user_id = req.user?.user_id;
      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { 
        q: query, 
        page = '1', 
        limit = '20',
        sort_by = 'relevance',
        date_from,
        date_to,
        tag
      } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          status: 'error',
          message: '검색어는 2자 이상 입력해주세요.'
        });
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const searchTerm = `%${query.trim()}%`;
      
      const where: any = {
        [Op.or]: [
          { title: { [Op.like]: searchTerm } },
          { content: { [Op.like]: searchTerm } }
        ]
      };

      // 날짜 필터 추가
      if (date_from || date_to) {
        where.created_at = {};
        if (date_from) {
          where.created_at[Op.gte] = new Date(date_from);
        }
        if (date_to) {
          where.created_at[Op.lte] = new Date(date_to);
        }
      }

      // 정렬 설정
      let order: any = [['created_at', 'DESC']];
      if (sort_by === 'popular') {
        order = [
          [db.sequelize.literal('(like_count + comment_count)'), 'DESC'],
          ['created_at', 'DESC']
        ];
      } else if (sort_by === 'latest') {
        order = [['created_at', 'DESC']];
      }

      const includeOptions: any = [
        {
          model: db.User,
          as: 'user',
          attributes: ['nickname', 'profile_image_url']
        },
        {
          model: db.Tag,
          as: 'tags',
          attributes: ['tag_id', 'name'],
          through: { attributes: [] }
        }
      ];

      // 태그 필터 추가
      if (tag) {
        includeOptions[1].where = { name: tag };
        includeOptions[1].required = true;
      }

      const results = await db.SomeoneDayPost.findAndCountAll({
        where,
        include: includeOptions,
        order,
        limit: limitNum,
        offset: offset,
        distinct: true
      });

      const formattedResults = results.rows.map((post: any) => ({
        post_id: post.get('post_id'),
        title: post.get('title'),
        content: post.get('content'),
        summary: post.get('summary'),
        is_anonymous: post.get('is_anonymous'),
        like_count: post.get('like_count'),
        comment_count: post.get('comment_count'),
        created_at: post.get('created_at'),
        user: post.get('is_anonymous') ? null : post.user,
        tags: post.tags || [],
        highlight: {
          title: post.get('title').includes(query.trim()) ? post.get('title') : undefined,
          content: post.get('content').includes(query.trim()) ? 
            post.get('content').substring(0, 200) + '...' : undefined
        }
      }));

      return res.json({
        status: 'success',
        message: '게시물 검색이 완료되었습니다.',
        data: {
          query: query.trim(),
          total_results: results.count,
          results: formattedResults,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total_pages: Math.ceil(results.count / limitNum),
            has_next: pageNum * limitNum < results.count,
            has_prev: pageNum > 1
          }
        }
      });

    } catch (error) {
      console.error('게시물 검색 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '게시물 검색 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 사용자 검색
  searchUsers: async (req: AuthRequestGeneric<never, SearchQuery>, res: Response) => {
    try {
      const user_id = req.user?.user_id;
      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { q: query, page = '1', limit = '20' } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          status: 'error',
          message: '검색어는 2자 이상 입력해주세요.'
        });
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const searchTerm = `%${query.trim()}%`;

      const results = await db.User.findAndCountAll({
        where: {
          [Op.or]: [
            { username: { [Op.like]: searchTerm } },
            { nickname: { [Op.like]: searchTerm } }
          ],
          is_active: true
        },
        attributes: ['user_id', 'username', 'nickname', 'profile_image_url'],
        limit: limitNum,
        offset: offset
      });

      return res.json({
        status: 'success',
        message: '사용자 검색이 완료되었습니다.',
        data: {
          query: query.trim(),
          total_results: results.count,
          results: results.rows,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total_pages: Math.ceil(results.count / limitNum),
            has_next: pageNum * limitNum < results.count,
            has_prev: pageNum > 1
          }
        }
      });

    } catch (error) {
      console.error('사용자 검색 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '사용자 검색 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 태그 검색
  searchTags: async (req: AuthRequestGeneric<never, SearchQuery>, res: Response) => {
    try {
      const user_id = req.user?.user_id;
      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { q: query, page = '1', limit = '20' } = req.query;

      if (!query || query.trim().length < 1) {
        return res.status(400).json({
          status: 'error',
          message: '검색어를 입력해주세요.'
        });
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const searchTerm = `%${query.trim()}%`;

      const results = await db.Tag.findAndCountAll({
        where: {
          name: { [Op.like]: searchTerm }
        },
        order: [['name', 'ASC']],
        limit: limitNum,
        offset: offset
      });

      return res.json({
        status: 'success',
        message: '태그 검색이 완료되었습니다.',
        data: {
          query: query.trim(),
          total_results: results.count,
          results: results.rows,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total_pages: Math.ceil(results.count / limitNum),
            has_next: pageNum * limitNum < results.count,
            has_prev: pageNum > 1
          }
        }
      });

    } catch (error) {
      console.error('태그 검색 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '태그 검색 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 자동완성
  autoComplete: async (req: AuthRequestGeneric<never, SearchQuery>, res: Response) => {
    try {
      const user_id = req.user?.user_id;
      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const { q: query, type = 'all' } = req.query;

      if (!query || query.trim().length < 1) {
        return res.json({
          status: 'success',
          data: {
            suggestions: [],
            recent_searches: [],
            trending_tags: []
          }
        });
      }

      const searchTerm = `%${query.trim()}%`;
      const suggestions: any = {
        suggestions: [],
        recent_searches: [],
        trending_tags: []
      };

      // 태그 자동완성
      if (type === 'all' || type === 'tags') {
        const tagSuggestions = await db.Tag.findAll({
          where: {
            name: { [Op.like]: searchTerm }
          },
          order: [['name', 'ASC']],
          limit: 5
        });

        suggestions.suggestions.push(...tagSuggestions.map((tag: any) => ({
          text: tag.get('name'),
          type: 'tag',
          count: 0 // 실제로는 사용 횟수를 가져와야 함
        })));
      }

      // 사용자 자동완성
      if (type === 'all' || type === 'users') {
        const userSuggestions = await db.User.findAll({
          where: {
            [Op.or]: [
              { username: { [Op.like]: searchTerm } },
              { nickname: { [Op.like]: searchTerm } }
            ],
            is_active: true
          },
          attributes: ['nickname'],
          limit: 3
        });

        suggestions.suggestions.push(...userSuggestions.map((user: any) => ({
          text: user.get('nickname'),
          type: 'user',
          count: 0
        })));
      }

      // 트렌딩 태그 (인기 태그)
      const trendingTags = await db.Tag.findAll({
        limit: 5,
        order: [['name', 'ASC']] // 실제로는 사용 빈도순으로 정렬해야 함
      });

      suggestions.trending_tags = trendingTags.map((tag: any) => ({
        tag_id: tag.get('tag_id'),
        name: tag.get('name'),
        usage_count: 0 // 실제 사용 횟수
      }));

      return res.json({
        status: 'success',
        message: '자동완성 데이터를 가져왔습니다.',
        data: suggestions
      });

    } catch (error) {
      console.error('자동완성 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '자동완성 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 고급 검색
  advancedSearch: async (req: AuthRequestGeneric<never, AdvancedSearchQuery>, res: Response) => {
    try {
      const user_id = req.user?.user_id;
      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const {
        q: query,
        page = '1',
        limit = '20',
        content_type = 'both',
        author_type = 'all',
        min_likes = '0',
        min_comments = '0',
        has_image,
        date_from,
        date_to,
        tag
      } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          status: 'error',
          message: '검색어는 2자 이상 입력해주세요.'
        });
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const searchTerm = `%${query.trim()}%`;
      const where: any = {};

      // 콘텐츠 타입별 검색 조건
      if (content_type === 'title') {
        where.title = { [Op.like]: searchTerm };
      } else if (content_type === 'content') {
        where.content = { [Op.like]: searchTerm };
      } else {
        where[Op.or] = [
          { title: { [Op.like]: searchTerm } },
          { content: { [Op.like]: searchTerm } }
        ];
      }

      // 작성자 타입 필터
      if (author_type === 'anonymous') {
        where.is_anonymous = true;
      } else if (author_type === 'identified') {
        where.is_anonymous = false;
      }

      // 최소 좋아요 수
      if (parseInt(min_likes) > 0) {
        where.like_count = { [Op.gte]: parseInt(min_likes) };
      }

      // 최소 댓글 수
      if (parseInt(min_comments) > 0) {
        where.comment_count = { [Op.gte]: parseInt(min_comments) };
      }

      // 이미지 포함 여부
      if (has_image === 'true') {
        where.image_url = { [Op.not]: null };
      } else if (has_image === 'false') {
        where.image_url = null;
      }

      // 날짜 범위
      if (date_from || date_to) {
        where.created_at = {};
        if (date_from) {
          where.created_at[Op.gte] = new Date(date_from);
        }
        if (date_to) {
          where.created_at[Op.lte] = new Date(date_to);
        }
      }

      const includeOptions: any = [
        {
          model: db.User,
          as: 'user',
          attributes: ['nickname', 'profile_image_url']
        },
        {
          model: db.Tag,
          as: 'tags',
          attributes: ['tag_id', 'name'],
          through: { attributes: [] }
        }
      ];

      // 태그 필터
      if (tag) {
        includeOptions[1].where = { name: tag };
        includeOptions[1].required = true;
      }

      const results = await db.SomeoneDayPost.findAndCountAll({
        where,
        include: includeOptions,
        order: [['created_at', 'DESC']],
        limit: limitNum,
        offset: offset,
        distinct: true
      });

      const formattedResults = results.rows.map((post: any) => ({
        post_id: post.get('post_id'),
        title: post.get('title'),
        content: post.get('content'),
        summary: post.get('summary'),
        is_anonymous: post.get('is_anonymous'),
        like_count: post.get('like_count'),
        comment_count: post.get('comment_count'),
        created_at: post.get('created_at'),
        user: post.get('is_anonymous') ? null : post.user,
        tags: post.tags || []
      }));

      return res.json({
        status: 'success',
        message: '고급 검색이 완료되었습니다.',
        data: {
          query: query.trim(),
          total_results: results.count,
          results: formattedResults,
          filters_applied: {
            content_type,
            author_type,
            min_likes: parseInt(min_likes),
            min_comments: parseInt(min_comments),
            has_image: has_image === 'true' ? true : has_image === 'false' ? false : undefined,
            date_range: (date_from || date_to) ? { from: date_from, to: date_to } : undefined,
            tag
          },
          pagination: {
            page: pageNum,
            limit: limitNum,
            total_pages: Math.ceil(results.count / limitNum),
            has_next: pageNum * limitNum < results.count,
            has_prev: pageNum > 1
          }
        }
      });

    } catch (error) {
      console.error('고급 검색 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '고급 검색 처리 중 오류가 발생했습니다.'
      });
    }
  },

  // 인기 검색어
  getPopularQueries: async (req: AuthRequestGeneric<never, { limit?: string }>, res: Response) => {
    try {
      const { limit = '10' } = req.query;
      
      // 실제로는 검색 로그 테이블에서 인기 검색어를 가져와야 함
      // 현재는 임시 데이터 반환
      const popularQueries = [
        '취업 준비',
        '인간관계',
        '연애 고민',
        '진로 상담',
        '스트레스',
        '건강 관리',
        '학업',
        '가족 문제',
        '직장 생활',
        '자기계발'
      ].slice(0, parseInt(limit));

      return res.json({
        status: 'success',
        message: '인기 검색어를 가져왔습니다.',
        data: popularQueries
      });

    } catch (error) {
      console.error('인기 검색어 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '인기 검색어 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 검색 통계
  getSearchStats: async (req: AuthRequestGeneric<never, never>, res: Response) => {
    try {
      const user_id = req.user?.user_id;
      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // 실제로는 검색 로그에서 통계를 계산해야 함
      const stats = {
        total_searches: 1250,
        popular_queries: [
          '취업 준비',
          '인간관계',
          '연애 고민',
          '진로 상담',
          '스트레스'
        ],
        trending_tags: [
          '고민상담',
          '인간관계',
          '진로',
          '건강',
          '직장'
        ],
        search_trends: [
          { date: '2024-08-01', count: 45 },
          { date: '2024-08-02', count: 52 },
          { date: '2024-08-03', count: 38 },
          { date: '2024-08-04', count: 61 },
          { date: '2024-08-05', count: 55 },
          { date: '2024-08-06', count: 48 },
          { date: '2024-08-07', count: 42 }
        ]
      };

      return res.json({
        status: 'success',
        message: '검색 통계를 가져왔습니다.',
        data: stats
      });

    } catch (error) {
      console.error('검색 통계 조회 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '검색 통계 조회 중 오류가 발생했습니다.'
      });
    }
  }
};

export default searchController;