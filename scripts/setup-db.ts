#!/usr/bin/env tsx

import { Pool } from 'pg';
import { initDatabase, testConnection } from '../lib/db';
import { runMigrations } from '../lib/migrations';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

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

async function setupDatabase() {
  const config = getDatabaseConfig();
  console.log('Using database config:', config.connectionString ? 'DATABASE_URL' : 'individual parameters');
  
  const pool = new Pool(config);
  
  try {
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    console.log('Running database initialization...');
    await initDatabase();
    console.log('✅ Database initialization completed');
    
    console.log('Running migrations...');
    await runMigrations();
    console.log('✅ Migrations completed');
    
    console.log('Database setup completed successfully! 🎉');
  } catch (error: any) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure your DATABASE_URL is correct and the database is accessible');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };
