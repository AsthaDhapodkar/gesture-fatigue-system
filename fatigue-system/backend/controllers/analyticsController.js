import { query } from '../config/database.js';

/**
 * Log gesture event
 */
export const logGesture = async (req, res) => {
  const { sessionId, gestureType, successFlag, fatigueLevel, moduleName } = req.body;
  
  try {
    await query(
      `INSERT INTO gesture_logs (session_id, gesture_type, success_flag, timestamp, fatigue_level, module_name) 
       VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [sessionId, gestureType, successFlag, fatigueLevel, moduleName]
    );
    
    res.status(201).json({ message: 'Gesture logged' });
  } catch (error) {
    console.error('Log gesture error:', error);
    res.status(500).json({ error: 'Failed to log gesture' });
  }
};

/**
 * Log fatigue state
 */
export const logFatigue = async (req, res) => {
  const { sessionId, fatigueLevel, fatigueScore, fatigueMode } = req.body;
  
  try {
    await query(
      `INSERT INTO fatigue_logs (session_id, fatigue_level, fatigue_score, fatigue_mode, timestamp) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [sessionId, fatigueLevel, fatigueScore, fatigueMode]
    );
    
    res.status(201).json({ message: 'Fatigue logged' });
  } catch (error) {
    console.error('Log fatigue error:', error);
    res.status(500).json({ error: 'Failed to log fatigue' });
  }
};

/**
 * Log module usage
 */
export const logModuleUsage = async (req, res) => {
  const { sessionId, moduleName, duration, gestureCount } = req.body;
  
  try {
    await query(
      `INSERT INTO module_usage (session_id, module_name, duration, gesture_count) 
       VALUES ($1, $2, $3, $4)`,
      [sessionId, moduleName, duration, gestureCount || 0]
    );
    
    res.status(201).json({ message: 'Module usage logged' });
  } catch (error) {
    console.error('Log module usage error:', error);
    res.status(500).json({ error: 'Failed to log module usage' });
  }
};

/**
 * Get session analytics
 */
export const getSessionAnalytics = async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    // Get session info
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = sessionResult.rows[0];
    
    // Get gesture statistics
    const gestureStats = await query(
      `SELECT 
        gesture_type,
        COUNT(*) as total_count,
        SUM(CASE WHEN success_flag THEN 1 ELSE 0 END) as success_count,
        ROUND(AVG(CASE WHEN success_flag THEN 1 ELSE 0 END) * 100, 2) as success_rate
       FROM gesture_logs 
       WHERE session_id = $1 
       GROUP BY gesture_type`,
      [sessionId]
    );
    
    // Get fatigue progression
    const fatigueProgression = await query(
      `SELECT fatigue_level, fatigue_score, fatigue_mode, timestamp 
       FROM fatigue_logs 
       WHERE session_id = $1 
       ORDER BY timestamp ASC`,
      [sessionId]
    );
    
    // Get module usage
    const moduleUsage = await query(
      `SELECT module_name, duration, gesture_count 
       FROM module_usage 
       WHERE session_id = $1`,
      [sessionId]
    );
    
    // Get gesture timeline
    const gestureTimeline = await query(
      `SELECT gesture_type, success_flag, fatigue_level, module_name, timestamp 
       FROM gesture_logs 
       WHERE session_id = $1 
       ORDER BY timestamp ASC 
       LIMIT 1000`,
      [sessionId]
    );
    
    res.json({
      session: {
        id: session.id,
        sessionType: session.session_type,
        startTime: session.start_time,
        endTime: session.end_time,
        avgFatigue: session.avg_fatigue,
        adaptiveMode: session.adaptive_mode
      },
      gestureStats: gestureStats.rows.map(g => ({
        gestureType: g.gesture_type,
        totalCount: parseInt(g.total_count),
        successCount: parseInt(g.success_count),
        successRate: parseFloat(g.success_rate)
      })),
      fatigueProgression: fatigueProgression.rows.map(f => ({
        level: f.fatigue_level,
        score: parseFloat(f.fatigue_score),
        mode: f.fatigue_mode,
        timestamp: f.timestamp
      })),
      moduleUsage: moduleUsage.rows.map(m => ({
        moduleName: m.module_name,
        duration: m.duration,
        gestureCount: m.gesture_count
      })),
      gestureTimeline: gestureTimeline.rows.map(g => ({
        type: g.gesture_type,
        success: g.success_flag,
        fatigueLevel: g.fatigue_level,
        module: g.module_name,
        timestamp: g.timestamp
      }))
    });
  } catch (error) {
    console.error('Get session analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

/**
 * Get historical analytics for authenticated user
 */
export const getHistoricalAnalytics = async (req, res) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Get all completed sessions
    const sessions = await query(
      `SELECT id, session_type, start_time, end_time, avg_fatigue, adaptive_mode 
       FROM sessions 
       WHERE user_id = $1 AND end_time IS NOT NULL 
       ORDER BY start_time DESC 
       LIMIT 50`,
      [userId]
    );
    
    // Get aggregate gesture statistics
    const aggregateGestures = await query(
      `SELECT 
        g.gesture_type,
        COUNT(*) as total_count,
        SUM(CASE WHEN g.success_flag THEN 1 ELSE 0 END) as success_count,
        ROUND(AVG(CASE WHEN g.success_flag THEN 1 ELSE 0 END) * 100, 2) as success_rate
       FROM gesture_logs g
       JOIN sessions s ON g.session_id = s.id
       WHERE s.user_id = $1
       GROUP BY g.gesture_type`,
      [userId]
    );
    
    // Get total usage time
    const totalUsage = await query(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(EXTRACT(EPOCH FROM (end_time - start_time))) as total_seconds
       FROM sessions 
       WHERE user_id = $1 AND end_time IS NOT NULL`,
      [userId]
    );
    
    // Compare adaptive vs non-adaptive performance
    const adaptiveComparison = await query(
      `SELECT 
        s.adaptive_mode,
        COUNT(DISTINCT s.id) as session_count,
        ROUND(AVG(s.avg_fatigue), 2) as avg_fatigue,
        COUNT(g.id) as total_gestures,
        ROUND(AVG(CASE WHEN g.success_flag THEN 1 ELSE 0 END) * 100, 2) as success_rate
       FROM sessions s
       LEFT JOIN gesture_logs g ON s.id = g.session_id
       WHERE s.user_id = $1 AND s.end_time IS NOT NULL
       GROUP BY s.adaptive_mode`,
      [userId]
    );
    
    res.json({
      sessions: sessions.rows.map(s => ({
        id: s.id,
        sessionType: s.session_type,
        startTime: s.start_time,
        endTime: s.end_time,
        avgFatigue: parseFloat(s.avg_fatigue || 0),
        adaptiveMode: s.adaptive_mode
      })),
      aggregateGestures: aggregateGestures.rows.map(g => ({
        gestureType: g.gesture_type,
        totalCount: parseInt(g.total_count),
        successCount: parseInt(g.success_count),
        successRate: parseFloat(g.success_rate)
      })),
      totalUsage: {
        totalSessions: parseInt(totalUsage.rows[0]?.total_sessions || 0),
        totalSeconds: parseInt(totalUsage.rows[0]?.total_seconds || 0)
      },
      adaptiveComparison: adaptiveComparison.rows.map(a => ({
        adaptiveMode: a.adaptive_mode,
        sessionCount: parseInt(a.session_count),
        avgFatigue: parseFloat(a.avg_fatigue || 0),
        totalGestures: parseInt(a.total_gestures || 0),
        successRate: parseFloat(a.success_rate || 0)
      }))
    });
  } catch (error) {
    console.error('Get historical analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch historical analytics' });
  }
};
