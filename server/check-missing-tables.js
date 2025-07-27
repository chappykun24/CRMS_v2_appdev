const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function checkMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for missing tables...\n');
    
    // List of tables that the API routes might be trying to access
    const requiredTables = [
      'syllabus_ilos',
      'assessment_ilo_weights',
      'student_ilo_scores',
      'rubrics',
      'rubric_scores',
      'analytics_clusters',
      'analytics_metrics',
      'analytics_filters',
      'user_profiles'
    ];
    
    for (const tableName of requiredTables) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [tableName]);
        
        if (result.rows[0].exists) {
          console.log(`✅ Table exists: ${tableName}`);
        } else {
          console.log(`❌ Table missing: ${tableName}`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${tableName}:`, error.message);
      }
    }
    
    console.log('\n📊 Checking table structures for existing tables...');
    
    // Check structure of key tables
    const keyTables = ['ilos', 'rubrics', 'assessments', 'sub_assessments'];
    
    for (const tableName of keyTables) {
      try {
        const result = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        console.log(`\n📋 ${tableName} table columns:`);
        result.rows.forEach(row => {
          console.log(`  - ${row.column_name} (${row.data_type})`);
        });
      } catch (error) {
        console.log(`❌ Error checking ${tableName} structure:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMissingTables(); 