const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function fixMissingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing missing columns...');
    
    // Add missing columns to assessments table
    const assessmentColumns = [
      'ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT FALSE',
      'ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0',
      'ADD COLUMN IF NOT EXISTS graded_submissions INTEGER DEFAULT 0',
      'ADD COLUMN IF NOT EXISTS section_course_id INTEGER'
    ];
    
    for (const column of assessmentColumns) {
      try {
        await client.query(`ALTER TABLE assessments ${column}`);
        console.log(`✅ Added column to assessments: ${column.split(' ')[3]}`);
      } catch (error) {
        console.log(`⚠️  Column might already exist: ${column.split(' ')[3]} - ${error.message}`);
      }
    }
    
    // Add missing columns to sub_assessments table
    const subAssessmentColumns = [
      'ADD COLUMN IF NOT EXISTS ilo_codes TEXT[]',
      'ADD COLUMN IF NOT EXISTS rubric_criteria JSONB'
    ];
    
    for (const column of subAssessmentColumns) {
      try {
        await client.query(`ALTER TABLE sub_assessments ${column}`);
        console.log(`✅ Added column to sub_assessments: ${column.split(' ')[3]}`);
      } catch (error) {
        console.log(`⚠️  Column might already exist: ${column.split(' ')[3]} - ${error.message}`);
      }
    }
    
    // Add missing columns to syllabi table if needed
    const syllabiColumns = [
      'ADD COLUMN IF NOT EXISTS course_id INTEGER',
      'ADD COLUMN IF NOT EXISTS term_id INTEGER'
    ];
    
    for (const column of syllabiColumns) {
      try {
        await client.query(`ALTER TABLE syllabi ${column}`);
        console.log(`✅ Added column to syllabi: ${column.split(' ')[3]}`);
      } catch (error) {
        console.log(`⚠️  Column might already exist: ${column.split(' ')[3]} - ${error.message}`);
      }
    }
    
    // Add missing columns to ilos table if needed
    const ilosColumns = [
      'ADD COLUMN IF NOT EXISTS bloom_taxonomy_level VARCHAR(50)'
    ];
    
    for (const column of ilosColumns) {
      try {
        await client.query(`ALTER TABLE ilos ${column}`);
        console.log(`✅ Added column to ilos: ${column.split(' ')[3]}`);
      } catch (error) {
        console.log(`⚠️  Column might already exist: ${column.split(' ')[3]} - ${error.message}`);
      }
    }
    
    console.log('\n✅ All missing columns have been added!');
    
    // Verify the columns were added
    console.log('\n🔍 Verifying columns...');
    
    const assessmentCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'assessments' 
      AND column_name IN ('is_graded', 'total_submissions', 'graded_submissions', 'section_course_id')
    `);
    
    console.log('✅ Assessments table now has columns:', assessmentCheck.rows.map(r => r.column_name));
    
    const subAssessmentCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sub_assessments' 
      AND column_name IN ('ilo_codes', 'rubric_criteria')
    `);
    
    console.log('✅ Sub_Assessments table now has columns:', subAssessmentCheck.rows.map(r => r.column_name));
    
  } catch (error) {
    console.error('❌ Error fixing columns:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixMissingColumns(); 