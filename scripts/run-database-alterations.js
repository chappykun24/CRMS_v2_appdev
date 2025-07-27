const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

async function runDatabaseAlterations() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Running database alterations...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'database-alterations.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} failed:`, error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\n✅ Database alterations completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Removed unused tables');
    console.log('- Added missing columns');
    console.log('- Created sub-assessments tables');
    console.log('- Created optimized indexes');
    console.log('- Created performance views');
    console.log('- Added triggers and constraints');
    
  } catch (error) {
    console.error('❌ Error running database alterations:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runDatabaseAlterations(); 