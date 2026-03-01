import express from 'express';
import { startSession, endSession, getActiveSessions } from '../controllers/sessionController.js';
import { protect } from '../middleware/auth.js';
import { validateSessionStart } from '../middleware/validation.js';

const router = express.Router();

// Session management (works for both guest and authenticated)
router.post('/start', protect, validateSessionStart, startSession);
router.post('/end', protect, endSession);

// Get active sessions (authenticated only)
//router.get('/active', authenticateToken, getActiveSessions);

export default router;
