import { Pool, PoolClient, QueryResult } from 'pg';

// Enhanced database configuration with fallback options
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'secure_vault',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
};

// Create pool lazily to ensure environment variables are loaded
let pool: Pool | null = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      ...getDatabaseConfig(),
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });
  }
  return pool;
};

// Database connection testing
export async function testConnection(): Promise<boolean> {
  const poolInstance = getPool();
  const client = await poolInstance.connect();
  try {
    await client.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    client.release();
  }
}

// Enhanced database initialization with better error handling
export async function initDatabase(): Promise<void> {
  const poolInstance = getPool();
  const client = await poolInstance.connect();
  try {
    // Test connection first
    await client.query('SELECT NOW()');
    
    // Create tables with enhanced schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS vault_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        encrypted_title TEXT NOT NULL,
        encrypted_username TEXT,
        encrypted_password TEXT NOT NULL,
        encrypted_url TEXT,
        encrypted_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        category VARCHAR(100) DEFAULT 'General',
        is_favorite BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_vault_items_category ON vault_items(category);
      CREATE INDEX IF NOT EXISTS idx_vault_items_created_at ON vault_items(created_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Utility function for executing queries with better error handling
export async function query(
  text: string, 
  params?: any[]
): Promise<QueryResult> {
  const poolInstance = getPool();
  const client = await poolInstance.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const poolInstance = getPool();
  const client = await poolInstance.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

export default getPool;
