import { query, transaction } from '../config/database.js';

/**
 * Start a new session
 */
export const startSession = async (req, res) => {
  const { sessionType, adaptiveMode = true } = req.body;
  const userId = req.user?.userId || null; // null for guest sessions
  
  try {
    const result = await query(
      `INSERT INTO sessions (user_id, session_type, start_time, adaptive_mode) 
       VALUES ($1, $2, NOW(), $3) 
       RETURNING id, user_id, session_type, start_time, adaptive_mode`,
      [userId, sessionType, adaptiveMode]
    );
    
    const session = result.rows[0];
    
    res.status(201).json({
      message: 'Session started',
      session: {
        id: session.id,
        userId: session.user_id,
        sessionType: session.session_type,
        startTime: session.start_time,
        adaptiveMode: session.adaptive_mode
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
};

/**
 * End a session
 */
export const endSession = async (req, res) => {
  const { sessionId, avgFatigue } = req.body;
  
  try {
    // Calculate average fatigue from logs if not provided
    let finalAvgFatigue = avgFatigue;
    
    if (!finalAvgFatigue) {
      const fatigueResult = await query(
        'SELECT AVG(fatigue_score) as avg_score FROM fatigue_logs WHERE session_id = $1',
        [sessionId]
      );
      finalAvgFatigue = fatigueResult.rows[0]?.avg_score || 0;
    }
    
    const result = await query(
      `UPDATE sessions 
       SET end_time = NOW(), avg_fatigue = $1 
       WHERE id = $2 
       RETURNING id, start_time, end_time, avg_fatigue`,
      [finalAvgFatigue, sessionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = result.rows[0];
    
    res.json({
      message: 'Session ended',
      session: {
        id: session.id,
        startTime: session.start_time,
        endTime: session.end_time,
        avgFatigue: session.avg_fatigue
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
};

/**
 * Get active sessions for a user
 */
export const getActiveSessions = async (req, res) => {
  const userId = req.user?.userId;
  
  try {
    const result = await query(
      `SELECT id, session_type, start_time, adaptive_mode 
       FROM sessions 
       WHERE user_id = $1 AND end_time IS NULL 
       ORDER BY start_time DESC`,
      [userId]
    );
    
    res.json({
      sessions: result.rows.map(s => ({
        id: s.id,
        sessionType: s.session_type,
        startTime: s.start_time,
        adaptiveMode: s.adaptive_mode
      }))
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};
