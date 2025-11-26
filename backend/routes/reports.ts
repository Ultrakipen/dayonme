import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import * as reportController from '../controllers/reportController';

const router = Router();

router.post('/', authMiddleware, reportController.submitReport);
router.get('/my', authMiddleware, reportController.getMyReports);
router.get('/stats', authMiddleware, reportController.getReportStats);
router.get('/:id', authMiddleware, reportController.getReportById);
router.get('/', authMiddleware, reportController.getAllReports);
router.patch('/:id/review', authMiddleware, reportController.reviewReport);

export default router;
