const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixDatabaseColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing missing database columns...');

    // Fix 1: Add missing columns to rubrics table
    console.log('📝 Fixing rubrics table...');
    await client.query(`
      ALTER TABLE rubrics 
      ADD COLUMN IF NOT EXISTS sub_assessment_id INTEGER,
      ADD COLUMN IF NOT EXISTS assessment_id INTEGER,
      ADD COLUMN IF NOT EXISTS syllabus_id INTEGER;
    `);

    // Fix 2: Add missing columns to submissions table
    console.log('📝 Fixing submissions table...');
    await client.query(`
      ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS adjusted_score DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS raw_score DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS total_score DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'submitted',
      ADD COLUMN IF NOT EXISTS graded_by INTEGER,
      ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS remarks TEXT;
    `);

    // Fix 3: Add missing columns to sub_assessments table
    console.log('📝 Fixing sub_assessments table...');
    await client.query(`
      ALTER TABLE sub_assessments 
      ADD COLUMN IF NOT EXISTS ilo_codes TEXT[],
      ADD COLUMN IF NOT EXISTS rubric_criteria JSONB,
      ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS graded_count INTEGER DEFAULT 0;
    `);

    // Fix 4: Add missing columns to assessments table
    console.log('📝 Fixing assessments table...');
    await client.query(`
      ALTER TABLE assessments 
      ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS graded_submissions INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS section_course_id INTEGER,
      ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS grading_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS content_data JSONB,
      ADD COLUMN IF NOT EXISTS ilo_codes TEXT[],
      ADD COLUMN IF NOT EXISTS assessment_structure JSONB,
      ADD COLUMN IF NOT EXISTS rubric_criteria JSONB;
    `);

    // Fix 5: Add missing columns to syllabi table
    console.log('📝 Fixing syllabi table...');
    await client.query(`
      ALTER TABLE syllabi 
      ADD COLUMN IF NOT EXISTS course_id INTEGER,
      ADD COLUMN IF NOT EXISTS term_id INTEGER;
    `);

    // Fix 6: Add missing columns to ilos table
    console.log('📝 Fixing ilos table...');
    await client.query(`
      ALTER TABLE ilos 
      ADD COLUMN IF NOT EXISTS bloom_taxonomy_level VARCHAR(50);
    `);

    console.log('✅ All database columns fixed successfully!');

    // Verify the fixes
    console.log('🔍 Verifying fixes...');
    
    const rubricsCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'rubrics' AND column_name IN ('sub_assessment_id', 'assessment_id', 'syllabus_id')
    `);
    console.log('✅ Rubrics columns:', rubricsCheck.rows.map(r => r.column_name));

    const submissionsCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'submissions' AND column_name IN ('adjusted_score', 'raw_score', 'total_score')
    `);
    console.log('✅ Submissions columns:', submissionsCheck.rows.map(r => r.column_name));

  } catch (error) {
    console.error('❌ Error fixing database columns:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix
fixDatabaseColumns()
  .then(() => {
    console.log('🎉 Database column fixes completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to fix database columns:', error);
    process.exit(1);
  }); 