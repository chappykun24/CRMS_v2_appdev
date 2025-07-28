const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'crms_v2_db',
  user: 'postgres',
  password: 'care0924',
  port: 5432
});

async function createCacheTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating dashboards_data_cache table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS dashboards_data_cache (
        cache_id SERIAL PRIMARY KEY,
        cache_key VARCHAR(255) UNIQUE,
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
    console.log('✅ dashboards_data_cache table created successfully');
    
    // Create indexes
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_dashboards_cache_key ON dashboards_data_cache(cache_key);
      CREATE INDEX IF NOT EXISTS idx_dashboards_cache_type ON dashboards_data_cache(cache_type);
      CREATE INDEX IF NOT EXISTS idx_dashboards_cache_user_id ON dashboards_data_cache(user_id);
      CREATE INDEX IF NOT EXISTS idx_dashboards_cache_course_id ON dashboards_data_cache(course_id);
    `;
    
    await client.query(createIndexesQuery);
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating cache table:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createCacheTable(); 