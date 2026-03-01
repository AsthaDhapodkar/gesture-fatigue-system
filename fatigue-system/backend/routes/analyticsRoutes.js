import express from 'express';
import { 
  logGesture, 
  logFatigue, 
  logModuleUsage,
  getSessionAnalytics,
  getHistoricalAnalytics 
} from '../controllers/analyticsController.js';
import { optionalAuth, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Logging endpoints (guest and authenticated)
router.post('/log/gesture', optionalAuth, logGesture);
router.post('/log/fatigue', optionalAuth, logFatigue);
router.post('/log/module', optionalAuth, logModuleUsage);

// Analytics retrieval
router.get('/session/:sessionId', optionalAuth, getSessionAnalytics);
router.get('/history', authenticateToken, getHistoricalAnalytics);

export default router;
