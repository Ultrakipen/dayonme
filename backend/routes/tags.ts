import { Router, Response, NextFunction } from 'express';
import tagController from '../controllers/tagController';
import postTagController from '../controllers/postTagController';
import authMiddleware from '../middleware/authMiddleware';
import { AuthRequest } from '../types/express';
import { validateRequest } from '../middleware/validationMiddleware';
const expressValidator = require('express-validator');

const { body, param, query } = expressValidator;

const router = Router();

// 태그 목록 조회
router.get('/', 
  authMiddleware,
  tagController.getAllTags
);

// 인기 태그 조회
router.get('/popular',
  authMiddleware,
  tagController.getPopularTags
);

// 태그 검색
router.get('/search',
  authMiddleware,
  validateRequest([
    query('name').notEmpty().withMessage('검색할 태그 이름이 필요합니다.')
  ]),
  tagController.searchTags
);

// 태그 상세 조회
router.get('/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('유효한 태그 ID가 아닙니다.')
  ]),
  tagController.getTagById
);

// 태그 생성
router.post('/',
  authMiddleware,
  validateRequest([
    body('name').notEmpty().isLength({ min: 1, max: 50 }).withMessage('태그 이름은 1자 이상 50자 이하여야 합니다.')
  ]),
  tagController.createTag
);

// 태그 수정
router.put('/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('유효한 태그 ID가 아닙니다.'),
    body('name').notEmpty().isLength({ min: 1, max: 50 }).withMessage('태그 이름은 1자 이상 50자 이하여야 합니다.')
  ]),
  tagController.updateTag
);

// 태그 삭제
router.delete('/:id',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('유효한 태그 ID가 아닙니다.')
  ]),
  tagController.deleteTag
);

// 게시물 태그 추가
router.post('/:id/tags',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('유효한 게시물 ID가 아닙니다.'),
    body('tag_ids').isArray().withMessage('태그 ID는 배열 형태여야 합니다.')
  ]),
  postTagController.addTagsToPost
);

// 게시물 태그 업데이트
router.put('/:id/tags',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('유효한 게시물 ID가 아닙니다.'),
    body('tag_ids').isArray().withMessage('태그 ID는 배열 형태여야 합니다.')
  ]),
  postTagController.updatePostTags
);

// 게시물 태그 삭제
router.delete('/:id/tags/:tagId',
  authMiddleware,
  validateRequest([
    param('id').isInt().withMessage('유효한 게시물 ID가 아닙니다.'),
    param('tagId').isInt().withMessage('유효한 태그 ID가 아닙니다.')
  ]),
  postTagController.removeTagFromPost
);

// 특정 태그의 게시물 조회 엔드포인트 추가
router.get('/:id/posts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tagId = req.params.id;
    res.json({
      success: true,
      data: [],
      message: `태그 ${tagId}의 게시물을 조회했습니다.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

export default router;