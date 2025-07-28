const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'crms_v2_db',
  user: 'postgres',
  password: 'password',
  port: 5432
});

async function checkAndCreateCacheTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking if dashboards_data_cache table exists...');
    
    // Check if table exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'dashboards_data_cache'
      );
    `;
    
    const result = await client.query(checkQuery);
    const tableExists = result.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ dashboards_data_cache table already exists');
    } else {
      console.log('❌ dashboards_data_cache table does not exist, creating it...');
      
      // Create the table
      const createTableQuery = `
        CREATE TABLE dashboards_data_cache (
          cache_id SERIAL PRIMARY KEY,
          cache_key VARCHAR(255) UNIQUE NOT NULL,
          cache_type VARCHAR(50) NOT NULL,
          user_id INTEGER,
          course_id INTEGER,
          data_json JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        );
      `;
      
      await client.query(createTableQuery);
      
      // Create indexes
      const createIndexesQuery = `
        CREATE INDEX IF NOT EXISTS idx_dashboards_cache_key ON dashboards_data_cache(cache_key);
        CREATE INDEX IF NOT EXISTS idx_dashboards_cache_type ON dashboards_data_cache(cache_type);
        CREATE INDEX IF NOT EXISTS idx_dashboards_cache_user_id ON dashboards_data_cache(user_id);
        CREATE INDEX IF NOT EXISTS idx_dashboards_cache_course_id ON dashboards_data_cache(course_id);
      `;
      
      await client.query(createIndexesQuery);
      
      console.log('✅ dashboards_data_cache table created successfully');
    }
    
  } catch (error) {
    console.error('❌ Error checking/creating cache table:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndCreateCacheTable(); 