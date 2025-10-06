const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testHealth() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Testing health check...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connection successful');
    
    await client.query('SELECT NOW()');
    console.log('✅ Query successful');
    
    // Check if tables exist
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'vault_items', 'user_sessions', 'migrations')
      ORDER BY table_name
    `);
    
    const tables = tableResult.rows.map(row => row.table_name);
    console.log('✅ Tables found:', tables);
    
    client.release();
    await pool.end();
    
    console.log('✅ Health check passed');
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.error('Error details:', error);
  }
}

testHealth();
