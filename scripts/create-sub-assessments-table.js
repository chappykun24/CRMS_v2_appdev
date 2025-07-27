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

async function createSubAssessmentsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating sub_assessments table structure...');

    // Create sub_assessments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sub_assessments (
        sub_assessment_id SERIAL PRIMARY KEY,
        assessment_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        total_points FLOAT NOT NULL,
        weight_percentage FLOAT NOT NULL,
        due_date TIMESTAMP,
        instructions TEXT,
        content_data JSONB,
        status VARCHAR(20) DEFAULT 'planned',
        is_published BOOLEAN DEFAULT FALSE,
        is_graded BOOLEAN DEFAULT FALSE,
        order_index INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Created sub_assessments table');

    // Create sub_assessment_submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sub_assessment_submissions (
        submission_id SERIAL PRIMARY KEY,
        enrollment_id INTEGER NOT NULL,
        sub_assessment_id INTEGER NOT NULL,
        submission_type VARCHAR(50) DEFAULT 'file',
        submission_data JSONB,
        file_urls TEXT[],
        total_score FLOAT,
        raw_score FLOAT,
        adjusted_score FLOAT,
        late_penalty FLOAT DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        graded_at TIMESTAMP,
        graded_by INTEGER,
        status VARCHAR(20) DEFAULT 'submitted',
        remarks TEXT,
        FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
        FOREIGN KEY (sub_assessment_id) REFERENCES sub_assessments(sub_assessment_id) ON DELETE CASCADE,
        FOREIGN KEY (graded_by) REFERENCES users(user_id) ON DELETE SET NULL,
        UNIQUE(enrollment_id, sub_assessment_id)
      )
    `);
    console.log('✅ Created sub_assessment_submissions table');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sub_assessments_assessment_id ON sub_assessments(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_sub_assessments_status ON sub_assessments(status);
      CREATE INDEX IF NOT EXISTS idx_sub_assessments_order ON sub_assessments(assessment_id, order_index);
      CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_enrollment ON sub_assessment_submissions(enrollment_id);
      CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_sub_assessment ON sub_assessment_submissions(sub_assessment_id);
      CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_status ON sub_assessment_submissions(status);
    `);
    console.log('✅ Created indexes for sub_assessments tables');

    console.log('✅ Sub-assessments table structure created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating sub_assessments table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createSubAssessmentsTable(); 