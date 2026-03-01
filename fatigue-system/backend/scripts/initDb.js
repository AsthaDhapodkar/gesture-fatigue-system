import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🗄️  Initializing database schema...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');
    
    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_type VARCHAR(50) NOT NULL DEFAULT 'guest',
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        avg_fatigue DECIMAL(5,2),
        adaptive_mode BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Sessions table created');
    
    // Create gesture_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gesture_logs (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
        gesture_type VARCHAR(50) NOT NULL,
        success_flag BOOLEAN NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        fatigue_level VARCHAR(20),
        module_name VARCHAR(50)
      );
    `);
    console.log('✓ Gesture logs table created');
    
    // Create fatigue_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS fatigue_logs (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
        fatigue_level VARCHAR(20) NOT NULL,
        fatigue_score DECIMAL(5,2) NOT NULL,
        fatigue_mode VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP NOT NULL
      );
    `);
    console.log('✓ Fatigue logs table created');
    
    // Create module_usage table
    await client.query(`
      CREATE TABLE IF NOT EXISTS module_usage (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
        module_name VARCHAR(50) NOT NULL,
        duration INTEGER NOT NULL,
        gesture_count INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Module usage table created');
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_gesture_logs_session_id ON gesture_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_fatigue_logs_session_id ON fatigue_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_module_usage_session_id ON module_usage(session_id);
    `);
    console.log('✓ Indexes created');
    
    console.log('✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

initDb().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
