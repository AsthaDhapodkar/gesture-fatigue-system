import express from 'express';
import { startSession, endSession, getActiveSessions } from '../controllers/sessionController.js';
import { optionalAuth, authenticateToken } from '../middleware/auth.js';
import { validateSessionStart } from '../middleware/validation.js';

const router = express.Router();

// Session management (works for both guest and authenticated)
router.post('/start', optionalAuth, validateSessionStart, startSession);
router.post('/end', optionalAuth, endSession);

// Get active sessions (authenticated only)
router.get('/active', authenticateToken, getActiveSessions);

export default router;
