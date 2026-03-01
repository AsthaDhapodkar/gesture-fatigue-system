import express from 'express';
import { 
  logGesture, 
  logFatigue, 
  logModuleUsage,
  getSessionAnalytics,
  getHistoricalAnalytics 
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Logging endpoints (guest and authenticated)
router.post('/log/gesture', protect, logGesture);
router.post('/log/fatigue', protect, logFatigue);
router.post('/log/module', protect, logModuleUsage);

// Analytics retrieval
router.get('/session/:sessionId', protect, getSessionAnalytics);
//router.get('/history', authenticateToken, getHistoricalAnalytics);

export default router;
