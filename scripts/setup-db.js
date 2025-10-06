#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

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
  const pool = new Pool(getDatabaseConfig());
  
  try {
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    console.log('Running database initialization...');
    const { initDatabase } = require('../lib/db.ts');
    await initDatabase();
    console.log('✅ Database initialization completed');
    
    console.log('Running migrations...');
    const { runMigrations } = require('../lib/migrations.ts');
    await runMigrations();
    console.log('✅ Migrations completed');
    
    console.log('Database setup completed successfully! 🎉');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
