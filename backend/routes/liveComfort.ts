import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getActiveSessions,
  createSession
} from '../controllers/liveComfortController';

const router = express.Router();

router.get('/sessions', getActiveSessions);
router.post('/sessions', authMiddleware, createSession);

export default router;
