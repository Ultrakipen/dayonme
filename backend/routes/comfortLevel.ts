import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  recordComfortActivity,
  getComfortStats,
  getHallOfFame
} from '../controllers/comfortLevelController';

const router = express.Router();

router.post('/activity', authMiddleware, recordComfortActivity);
router.get('/stats', authMiddleware, getComfortStats);
router.get('/hall-of-fame', getHallOfFame);

export default router;
