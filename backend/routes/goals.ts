import { Router, Response, NextFunction } from 'express';
import goalsController from '../controllers/goalsController';
import authMiddleware from '../middleware/authMiddleware';
import { AuthRequest } from '../types/express';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Goal:
 *       type: object
 *       properties:
 *         goal_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         target_emotion_id:
 *           type: integer
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         progress:
 *           type: number
 *           format: float
 *         is_completed:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: 사용자의 감정 목표 목록 조회
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, all]
 *         description: 목표 상태 필터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 목표 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Goal'
 */
router.get('/', authMiddleware, goalsController.getGoals);

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: 새로운 감정 목표 생성
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target_emotion_id
 *               - start_date
 *               - end_date
 *             properties:
 *               target_emotion_id:
 *                 type: integer
 *                 description: 목표로 하는 감정 ID
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: 시작 날짜
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: 종료 날짜
 *     responses:
 *       201:
 *         description: 목표 생성 성공
 */
router.post('/', authMiddleware, goalsController.createGoal);

/**
 * @swagger
 * /goals/{goalId}:
 *   get:
 *     summary: 특정 목표 상세 조회
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 목표 조회 성공
 */
router.get('/:goalId', authMiddleware, goalsController.getGoalById);

/**
 * @swagger
 * /goals/{goalId}:
 *   put:
 *     summary: 목표 수정
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target_emotion_id:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: 목표 수정 성공
 */
router.put('/:goalId', authMiddleware, goalsController.updateGoal);

/**
 * @swagger
 * /goals/{goalId}:
 *   delete:
 *     summary: 목표 삭제
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 목표 삭제 성공
 */
router.delete('/:goalId', authMiddleware, goalsController.deleteGoal);

/**
 * @swagger
 * /goals/{goalId}/progress:
 *   post:
 *     summary: 목표 진행률 업데이트
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 진행률 업데이트 성공
 */
router.post('/:goalId/progress', authMiddleware, goalsController.updateProgress);

export default router;