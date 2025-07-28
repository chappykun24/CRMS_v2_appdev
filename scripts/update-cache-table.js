const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  reapIntervalMillis: 1000,
  createTimeoutMillis: 3000,
  destroyTimeoutMillis: 5000,
  createRetryIntervalMillis: 200,
});

async function updateCacheTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Updating dashboards_data_cache table...\n');
    
    // Check if user_id column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dashboards_data_cache' 
      AND column_name = 'user_id'
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('📝 Adding user_id column to dashboards_data_cache table...');
      
      // Add user_id column
      const alterQuery = `
        ALTER TABLE dashboards_data_cache 
        ADD COLUMN user_id INTEGER,
        ADD CONSTRAINT fk_dashboards_data_cache_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      `;
      
      await client.query(alterQuery);
      
      console.log('✅ Successfully added user_id column to dashboards_data_cache table');
      
      // Create index for user_id
      const indexQuery = `
        CREATE INDEX idx_dashboards_data_cache_user_id 
        ON dashboards_data_cache(user_id)
      `;
      
      await client.query(indexQuery);
      
      console.log('✅ Successfully created index for user_id column');
      
    } else {
      console.log('✅ user_id column already exists in dashboards_data_cache table');
    }
    
    // Show current table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'dashboards_data_cache'
      ORDER BY ordinal_position
    `;
    
    const structureResult = await client.query(structureQuery);
    
    console.log('\n📊 Current table structure:');
    structureResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error updating cache table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting cache table update...\n');
    await updateCacheTable();
    console.log('\n✅ Cache table update completed successfully!');
  } catch (error) {
    console.error('❌ Cache table update failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main(); 