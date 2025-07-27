const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function checkUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking users table structure...\n');
    
    // Check users table structure
    console.log('📋 Users table columns:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    console.log('\n👥 Sample users data:');
    const users = await client.query(`
      SELECT *
      FROM users
      LIMIT 5
    `);
    
    users.rows.forEach(user => {
      console.log(`  - User:`, user);
    });
    
    console.log('\n📊 Total users count:');
    const count = await client.query(`
      SELECT COUNT(*) as total_count
      FROM users
    `);
    
    console.log(`  Total users: ${count.rows[0].total_count}`);
    
  } catch (error) {
    console.error('❌ Error checking users table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersTable(); 