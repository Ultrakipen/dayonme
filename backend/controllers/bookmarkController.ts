// controllers/bookmarkController.ts
import { Response } from 'express';
import { AuthRequest } from '../types/express';
import db from '../models';

/**
 * 북마크 컨트롤러
 * - 게시물 북마크 추가/제거 (토글)
 * - 북마크한 게시물 목록 조회
 * - 북마크 상태 확인
 */
class BookmarkController {
  /**
   * 북마크 토글 (추가/제거)
   * POST /api/bookmarks/:postType/:postId
   */
  async toggleBookmark(req: AuthRequest, res: Response) {
    const transaction = await db.sequelize.transaction();

    try {
      const user_id = req.user?.user_id;
      const { postType, postId } = req.params;

      console.log(`북마크 토글 요청: user_id=${user_id}, postType=${postType}, postId=${postId}`);

      if (!user_id) {
        await transaction.rollback();
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      // postType 검증
      const validPostTypes = ['my_day', 'comfort_wall'];
      if (!validPostTypes.includes(postType)) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: '유효하지 않은 게시물 타입입니다.'
        });
      }

      // 게시물 존재 확인
      let post: any = null;
      if (postType === 'my_day') {
        post = await db.MyDayPost.findByPk(parseInt(postId));
      } else {
        post = await db.SomeoneDayPost.findByPk(parseInt(postId));
      }

      if (!post) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: '게시물을 찾을 수 없습니다.'
        });
      }

      // 기존 북마크 확인
      const existingBookmark = await db.Bookmark.findOne({
        where: {
          user_id,
          post_id: parseInt(postId),
          post_type: postType
        },
        transaction
      });

      if (existingBookmark) {
        // 북마크 제거
        await existingBookmark.destroy({ transaction });
        await transaction.commit();

        console.log(`북마크 제거 성공: user_id=${user_id}, post_id=${postId}, post_type=${postType}`);

        return res.status(200).json({
          status: 'success',
          message: '북마크를 해제했습니다.',
          data: {
            isBookmarked: false
          }
        });
      } else {
        // 북마크 추가
        await db.Bookmark.create({
          user_id,
          post_id: parseInt(postId),
          post_type: postType as 'my_day' | 'comfort_wall'
        }, { transaction });

        await transaction.commit();

        console.log(`북마크 추가 성공: user_id=${user_id}, post_id=${postId}, post_type=${postType}`);

        return res.status(201).json({
          status: 'success',
          message: '북마크에 추가했습니다.',
          data: {
            isBookmarked: true
          }
        });
      }
    } catch (error: any) {
      await transaction.rollback();
      console.error('북마크 토글 오류:', error);

      return res.status(500).json({
        status: 'error',
        message: '북마크 처리 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 북마크 목록 조회 (페이지네이션) - 최적화 버전
   * GET /api/bookmarks
   *
   * 🚀 성능 최적화:
   * - N+1 쿼리 문제 해결 (단일 쿼리로 통합)
   * - 대량 데이터 처리 가능
   * - 인덱스 활용 최적화
   */
  async getBookmarks(req: AuthRequest, res: Response) {
    try {
      const user_id = req.user?.user_id;
      const { page = '1', limit = '20', postType } = req.query;

      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 50); // 최대 50개로 제한
      const offset = (pageNum - 1) * limitNum;

      // postType 필터 (옵션)
      const whereCondition: any = { user_id };
      if (postType && ['my_day', 'comfort_wall'].includes(postType as string)) {
        whereCondition.post_type = postType;
      }

      // 🚀 최적화: 북마크 목록만 먼저 조회 (가벼운 쿼리)
      const { count, rows: bookmarks } = await db.Bookmark.findAndCountAll({
        where: whereCondition,
        attributes: ['bookmark_id', 'post_id', 'post_type', 'created_at'],
        limit: limitNum,
        offset: offset,
        order: [['created_at', 'DESC']],
        raw: true // 순수 객체로 반환 (성능 향상)
      });

      if (bookmarks.length === 0) {
        return res.status(200).json({
          status: 'success',
          data: {
            bookmarks: [],
            pagination: {
              currentPage: pageNum,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limitNum
            }
          }
        });
      }

      // 🚀 최적화: 게시물 ID를 타입별로 그룹화
      const myDayIds = bookmarks
        .filter((b: any) => b.post_type === 'my_day')
        .map((b: any) => b.post_id);
      const comfortWallIds = bookmarks
        .filter((b: any) => b.post_type === 'comfort_wall')
        .map((b: any) => b.post_id);

      // 🚀 최적화: 2개의 쿼리로 모든 게시물 가져오기 (N+1 → 2 쿼리)
      const [myDayPosts, comfortWallPosts] = await Promise.all([
        myDayIds.length > 0 ? db.MyDayPost.findAll({
          where: { post_id: myDayIds },
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['user_id', 'nickname', 'profile_image_url']
            }
          ]
        }) : [],
        comfortWallIds.length > 0 ? db.SomeoneDayPost.findAll({
          where: { post_id: comfortWallIds },
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['user_id', 'nickname', 'profile_image_url']
            }
          ]
        }) : []
      ]);

      // 🚀 최적화: Map으로 O(1) 조회 (O(n) → O(1))
      const postMap = new Map();
      myDayPosts.forEach((post: any) => {
        postMap.set(`my_day_${post.post_id}`, post);
      });
      comfortWallPosts.forEach((post: any) => {
        postMap.set(`comfort_wall_${post.post_id}`, post);
      });

      // 북마크와 게시물 매핑
      const bookmarksWithPosts = bookmarks
        .map((bookmark: any) => {
          const postKey = `${bookmark.post_type}_${bookmark.post_id}`;
          const post = postMap.get(postKey);

          if (!post) return null; // 삭제된 게시물

          return {
            bookmark_id: bookmark.bookmark_id,
            post_type: bookmark.post_type,
            created_at: bookmark.created_at,
            post: {
              post_id: post.post_id,
              content: post.content,
              is_anonymous: post.is_anonymous,
              like_count: post.like_count || 0,
              comment_count: post.comment_count || 0,
              created_at: post.createdAt || post.created_at,
              updated_at: post.updatedAt || post.updated_at,
              user: post.user || null,
              images: post.images || [],
              tags: post.tags || []
            }
          };
        })
        .filter((b: any) => b !== null); // null 제거

      // 디버깅: 첫 번째 북마크 데이터 확인
      if (bookmarksWithPosts.length > 0 && bookmarksWithPosts[0]) {
        const firstBookmark = bookmarksWithPosts[0];
        console.log('백엔드 북마크 데이터 샘플:', {
          bookmark_id: firstBookmark.bookmark_id,
          post_type: firstBookmark.post_type,
          post_created_at: firstBookmark.post.created_at,
          post_created_at_type: typeof firstBookmark.post.created_at,
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          bookmarks: bookmarksWithPosts,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(count / limitNum),
            totalItems: count,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error: any) {
      console.error('북마크 목록 조회 오류:', error);

      return res.status(500).json({
        status: 'error',
        message: '북마크 목록 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 북마크 상태 확인
   * GET /api/bookmarks/:postType/:postId/status
   */
  async checkBookmarkStatus(req: AuthRequest, res: Response) {
    try {
      const user_id = req.user?.user_id;
      const { postType, postId } = req.params;

      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const bookmark = await db.Bookmark.findOne({
        where: {
          user_id,
          post_id: parseInt(postId),
          post_type: postType
        }
      });

      return res.status(200).json({
        status: 'success',
        data: {
          isBookmarked: !!bookmark
        }
      });
    } catch (error: any) {
      console.error('북마크 상태 확인 오류:', error);

      return res.status(500).json({
        status: 'error',
        message: '북마크 상태 확인 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  /**
   * 북마크 개수 조회
   * GET /api/bookmarks/count
   */
  async getBookmarkCount(req: AuthRequest, res: Response) {
    try {
      const user_id = req.user?.user_id;

      if (!user_id) {
        return res.status(401).json({
          status: 'error',
          message: '인증이 필요합니다.'
        });
      }

      const count = await db.Bookmark.count({
        where: { user_id }
      });

      return res.status(200).json({
        status: 'success',
        data: { count }
      });
    } catch (error: any) {
      console.error('북마크 개수 조회 오류:', error);

      return res.status(500).json({
        status: 'error',
        message: '북마크 개수 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
}

export default new BookmarkController();
