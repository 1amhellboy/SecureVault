import { PoolClient } from 'pg';
import getPool from './db';

export interface Migration {
  version: number;
  name: string;
  up: (client: PoolClient) => Promise<void>;
  down: (client: PoolClient) => Promise<void>;
}

// Migration definitions
const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_initial_tables',
    up: async (client: PoolClient) => {
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
      `);
    },
    down: async (client: PoolClient) => {
      await client.query('DROP TABLE IF EXISTS user_sessions CASCADE');
      await client.query('DROP TABLE IF EXISTS vault_items CASCADE');
      await client.query('DROP TABLE IF EXISTS users CASCADE');
    }
  },
  {
    version: 2,
    name: 'create_indexes',
    up: async (client: PoolClient) => {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_vault_items_category ON vault_items(category);
        CREATE INDEX IF NOT EXISTS idx_vault_items_created_at ON vault_items(created_at);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      `);
    },
    down: async (client: PoolClient) => {
      await client.query('DROP INDEX IF EXISTS idx_user_sessions_expires_at');
      await client.query('DROP INDEX IF EXISTS idx_user_sessions_token_hash');
      await client.query('DROP INDEX IF EXISTS idx_user_sessions_user_id');
      await client.query('DROP INDEX IF EXISTS idx_vault_items_created_at');
      await client.query('DROP INDEX IF EXISTS idx_vault_items_category');
      await client.query('DROP INDEX IF EXISTS idx_vault_items_user_id');
    }
  }
];

// Create migrations table if it doesn't exist
async function createMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Get current migration version
async function getCurrentVersion(client: PoolClient): Promise<number> {
  const result = await client.query(
    'SELECT MAX(version) as version FROM migrations'
  );
  return result.rows[0]?.version || 0;
}

// Run migrations
export async function runMigrations(): Promise<void> {
  const client = await getPool().connect();
  try {
    await createMigrationsTable(client);
    const currentVersion = await getCurrentVersion(client);
    
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Running ${pendingMigrations.length} pending migrations...`);
    
    for (const migration of pendingMigrations) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      await migration.up(client);
      await client.query(
        'INSERT INTO migrations (version, name) VALUES ($1, $2)',
        [migration.version, migration.name]
      );
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Rollback migrations
export async function rollbackMigrations(targetVersion: number = 0): Promise<void> {
  const client = await getPool().connect();
  try {
    const currentVersion = await getCurrentVersion(client);
    
    if (currentVersion <= targetVersion) {
      console.log('No migrations to rollback');
      return;
    }
    
    const migrationsToRollback = migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version);
    
    console.log(`Rolling back ${migrationsToRollback.length} migrations...`);
    
    for (const migration of migrationsToRollback) {
      console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
      await migration.down(client);
      await client.query(
        'DELETE FROM migrations WHERE version = $1',
        [migration.version]
      );
    }
    
    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get migration status
export async function getMigrationStatus(): Promise<{ version: number; name: string; executed_at: string }[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'SELECT version, name, executed_at FROM migrations ORDER BY version'
    );
    return result.rows;
  } finally {
    client.release();
  }
}
