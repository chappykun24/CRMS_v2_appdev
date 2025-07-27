const { Pool } = require('pg');
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

async function fixAssessmentTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing assessment table structure...');

    // Add ilo_codes column to assessments table if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE assessments 
        ADD COLUMN IF NOT EXISTS ilo_codes TEXT[] DEFAULT '{}'
      `);
      console.log('✅ Added ilo_codes column to assessments table');
    } catch (error) {
      console.log('ℹ️  ilo_codes column already exists or error:', error.message);
    }

    // Add assessment_structure column to assessments table if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE assessments 
        ADD COLUMN IF NOT EXISTS assessment_structure JSONB
      `);
      console.log('✅ Added assessment_structure column to assessments table');
    } catch (error) {
      console.log('ℹ️  assessment_structure column already exists or error:', error.message);
    }

    // Add rubric_criteria column to assessments table if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE assessments 
        ADD COLUMN IF NOT EXISTS rubric_criteria JSONB
      `);
      console.log('✅ Added rubric_criteria column to assessments table');
    } catch (error) {
      console.log('ℹ️  rubric_criteria column already exists or error:', error.message);
    }

    console.log('✅ Assessment table structure fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing assessment table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAssessmentTable(); 