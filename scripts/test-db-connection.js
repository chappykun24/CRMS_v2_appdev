const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'crms_v2_db',
  user: 'postgres',
  password: 'password',
  port: 5432
});

async function testConnection() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    
    // Check if dashboards_data_cache table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'dashboards_data_cache'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ dashboards_data_cache table exists');
      
      // Check table structure
      const tableInfo = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'dashboards_data_cache'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Table structure:');
      tableInfo.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ dashboards_data_cache table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection(); 