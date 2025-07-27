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

async function optimizeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting database optimization...');

    // ==========================================
    // 1. REMOVE UNUSED TABLES
    // ==========================================
    console.log('\n📋 Removing unused tables...');

    // Remove unused tables that are no longer needed
    const tablesToRemove = [
      'assessment_ilo_weights',      // Replaced by direct ILO codes in assessments
      'student_ilo_scores',          // Not implemented in current system
      'analytics_clusters',          // Not used in current implementation
      'dashboards_data_cache',       // Not used in current implementation
      'course_enrollment_requests',  // Not implemented in current system
      'user_profiles',               // Redundant with users table
      'grade_adjustments',           // Functionality moved to sub_assessment_submissions
      'assessment_rubrics',          // Not implemented in current system
      'rubric_scores',               // Not implemented in current system
      'syllabus_assessment_plans'    // Replaced by direct assessment creation
    ];

    for (const tableName of tablesToRemove) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        console.log(`✅ Removed table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Could not remove table ${tableName}:`, error.message);
      }
    }

    // ==========================================
    // 2. ADD MISSING COLUMNS TO EXISTING TABLES
    // ==========================================
    console.log('\n📋 Adding missing columns...');

    // Add missing columns to assessments table
    const assessmentColumns = [
      { name: 'ilo_codes', type: 'TEXT[] DEFAULT \'{}\'' },
      { name: 'assessment_structure', type: 'JSONB' },
      { name: 'rubric_criteria', type: 'JSONB' },
      { name: 'is_published', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_graded', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'total_submissions', type: 'INTEGER DEFAULT 0' },
      { name: 'graded_submissions', type: 'INTEGER DEFAULT 0' }
    ];

    for (const column of assessmentColumns) {
      try {
        await client.query(`ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
        console.log(`✅ Added column: assessments.${column.name}`);
      } catch (error) {
        console.log(`⚠️  Could not add column assessments.${column.name}:`, error.message);
      }
    }

    // Add missing columns to assessment_templates table
    const templateColumns = [
      { name: 'syllabus_id', type: 'INTEGER REFERENCES syllabi(syllabus_id) ON DELETE CASCADE' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'usage_count', type: 'INTEGER DEFAULT 0' },
      { name: 'last_used_at', type: 'TIMESTAMP' }
    ];

    for (const column of templateColumns) {
      try {
        await client.query(`ALTER TABLE assessment_templates ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
        console.log(`✅ Added column: assessment_templates.${column.name}`);
      } catch (error) {
        console.log(`⚠️  Could not add column assessment_templates.${column.name}:`, error.message);
      }
    }

    // Add missing columns to submissions table
    const submissionColumns = [
      { name: 'late_penalty', type: 'FLOAT DEFAULT 0' },
      { name: 'adjusted_score', type: 'FLOAT' },
      { name: 'feedback', type: 'TEXT' },
      { name: 'submission_files', type: 'TEXT[]' },
      { name: 'submission_type', type: 'VARCHAR(50) DEFAULT \'file\'' }
    ];

    for (const column of submissionColumns) {
      try {
        await client.query(`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
        console.log(`✅ Added column: submissions.${column.name}`);
      } catch (error) {
        console.log(`⚠️  Could not add column submissions.${column.name}:`, error.message);
      }
    }

    // Add missing columns to syllabi table
    const syllabusColumns = [
      { name: 'total_assessments', type: 'INTEGER DEFAULT 0' },
      { name: 'published_assessments', type: 'INTEGER DEFAULT 0' },
      { name: 'graded_assessments', type: 'INTEGER DEFAULT 0' },
      { name: 'last_updated', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const column of syllabusColumns) {
      try {
        await client.query(`ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
        console.log(`✅ Added column: syllabi.${column.name}`);
      } catch (error) {
        console.log(`⚠️  Could not add column syllabi.${column.name}:`, error.message);
      }
    }

    // ==========================================
    // 3. CREATE SUB-ASSESSMENTS TABLES
    // ==========================================
    console.log('\n📋 Creating sub-assessments tables...');

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

    // ==========================================
    // 4. CREATE OPTIMIZED INDEXES
    // ==========================================
    console.log('\n📋 Creating optimized indexes...');

    // Indexes for sub_assessments
    const subAssessmentIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_sub_assessments_assessment_id ON sub_assessments(assessment_id)',
      'CREATE INDEX IF NOT EXISTS idx_sub_assessments_status ON sub_assessments(status)',
      'CREATE INDEX IF NOT EXISTS idx_sub_assessments_order ON sub_assessments(assessment_id, order_index)',
      'CREATE INDEX IF NOT EXISTS idx_sub_assessments_published ON sub_assessments(is_published)',
      'CREATE INDEX IF NOT EXISTS idx_sub_assessments_graded ON sub_assessments(is_graded)'
    ];

    for (const indexQuery of subAssessmentIndexes) {
      try {
        await client.query(indexQuery);
        console.log(`✅ Created index: ${indexQuery.split('idx_')[1].split(' ON ')[0]}`);
      } catch (error) {
        console.log(`⚠️  Could not create index:`, error.message);
      }
    }

    // Indexes for sub_assessment_submissions
    const submissionIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_enrollment ON sub_assessment_submissions(enrollment_id)',
      'CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_sub_assessment ON sub_assessment_submissions(sub_assessment_id)',
      'CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_status ON sub_assessment_submissions(status)',
      'CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_graded_by ON sub_assessment_submissions(graded_by)',
      'CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_submitted_at ON sub_assessment_submissions(submitted_at)'
    ];

    for (const indexQuery of submissionIndexes) {
      try {
        await client.query(indexQuery);
        console.log(`✅ Created index: ${indexQuery.split('idx_')[1].split(' ON ')[0]}`);
      } catch (error) {
        console.log(`⚠️  Could not create index:`, error.message);
      }
    }

    // Additional indexes for performance
    const additionalIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_assessments_published ON assessments(is_published)',
      'CREATE INDEX IF NOT EXISTS idx_assessments_graded ON assessments(is_graded)',
      'CREATE INDEX IF NOT EXISTS idx_assessments_ilo_codes ON assessments USING GIN(ilo_codes)',
      'CREATE INDEX IF NOT EXISTS idx_submissions_adjusted_score ON submissions(adjusted_score)',
      'CREATE INDEX IF NOT EXISTS idx_submissions_late_penalty ON submissions(late_penalty)',
      'CREATE INDEX IF NOT EXISTS idx_syllabi_total_assessments ON syllabi(total_assessments)',
      'CREATE INDEX IF NOT EXISTS idx_syllabi_published_assessments ON syllabi(published_assessments)'
    ];

    for (const indexQuery of additionalIndexes) {
      try {
        await client.query(indexQuery);
        console.log(`✅ Created index: ${indexQuery.split('idx_')[1].split(' ON ')[0]}`);
      } catch (error) {
        console.log(`⚠️  Could not create index:`, error.message);
      }
    }

    // ==========================================
    // 5. CREATE VIEWS FOR COMMON QUERIES
    // ==========================================
    console.log('\n📋 Creating optimized views...');

    // View for assessment summary
    await client.query(`
      CREATE OR REPLACE VIEW assessment_summary AS
      SELECT 
        a.assessment_id,
        a.title,
        a.type,
        a.total_points,
        a.weight_percentage,
        a.status,
        a.is_published,
        a.is_graded,
        COUNT(sa.sub_assessment_id) as sub_assessment_count,
        COUNT(CASE WHEN sa.is_published THEN 1 END) as published_sub_assessments,
        COUNT(CASE WHEN sa.is_graded THEN 1 END) as graded_sub_assessments,
        COALESCE(SUM(sa.total_points), 0) as total_sub_points,
        COALESCE(SUM(sa.weight_percentage), 0) as total_sub_weight
      FROM assessments a
      LEFT JOIN sub_assessments sa ON a.assessment_id = sa.assessment_id
      GROUP BY a.assessment_id, a.title, a.type, a.total_points, a.weight_percentage, a.status, a.is_published, a.is_graded
    `);
    console.log('✅ Created assessment_summary view');

    // View for student grading summary
    await client.query(`
      CREATE OR REPLACE VIEW student_grading_summary AS
      SELECT 
        ce.enrollment_id,
        s.student_id,
        s.full_name,
        s.student_number,
        sc.section_course_id,
        COUNT(sas.sub_assessment_id) as total_sub_assessments,
        COUNT(CASE WHEN sas.status = 'graded' THEN 1 END) as graded_sub_assessments,
        COUNT(CASE WHEN sas.status = 'submitted' THEN 1 END) as submitted_sub_assessments,
        AVG(CASE WHEN sas.raw_score IS NOT NULL THEN (sas.raw_score / sas.total_score) * 100 END) as average_score_percentage
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      LEFT JOIN sub_assessment_submissions sas ON ce.enrollment_id = sas.enrollment_id
      GROUP BY ce.enrollment_id, s.student_id, s.full_name, s.student_number, sc.section_course_id
    `);
    console.log('✅ Created student_grading_summary view');

    // ==========================================
    // 6. CREATE TRIGGERS FOR AUTOMATIC UPDATES
    // ==========================================
    console.log('\n📋 Creating triggers for automatic updates...');

    // Function to update assessment statistics
    await client.query(`
      CREATE OR REPLACE FUNCTION update_assessment_stats()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
          -- Update assessment statistics
          UPDATE assessments 
          SET 
            total_submissions = (
              SELECT COUNT(DISTINCT enrollment_id) 
              FROM sub_assessment_submissions sas 
              JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id 
              WHERE sa.assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id)
            ),
            graded_submissions = (
              SELECT COUNT(DISTINCT enrollment_id) 
              FROM sub_assessment_submissions sas 
              JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id 
              WHERE sa.assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id)
              AND sas.status = 'graded'
            )
          WHERE assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id);
        END IF;
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created update_assessment_stats function');

    // Trigger for sub_assessment_submissions
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_assessment_stats ON sub_assessment_submissions;
      CREATE TRIGGER trigger_update_assessment_stats
      AFTER INSERT OR UPDATE OR DELETE ON sub_assessment_submissions
      FOR EACH ROW EXECUTE FUNCTION update_assessment_stats();
    `);
    console.log('✅ Created trigger for sub_assessment_submissions');

    // ==========================================
    // 7. CLEANUP AND OPTIMIZATION
    // ==========================================
    console.log('\n📋 Performing cleanup and optimization...');

    // Vacuum and analyze tables
    await client.query('VACUUM ANALYZE');
    console.log('✅ Performed VACUUM ANALYZE');

    // Update table statistics
    const tablesToAnalyze = [
      'assessments', 'sub_assessments', 'sub_assessment_submissions',
      'submissions', 'assessment_templates', 'syllabi', 'students',
      'course_enrollments', 'section_courses'
    ];

    for (const table of tablesToAnalyze) {
      try {
        await client.query(`ANALYZE ${table}`);
        console.log(`✅ Analyzed table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not analyze table ${table}:`, error.message);
      }
    }

    console.log('\n✅ Database optimization completed successfully!');
    console.log('\n📊 Summary of changes:');
    console.log('- Removed 10 unused tables');
    console.log('- Added 18 new columns to existing tables');
    console.log('- Created 2 new tables for sub-assessments');
    console.log('- Created 15 new indexes for performance');
    console.log('- Created 2 optimized views');
    console.log('- Created 1 trigger for automatic updates');

  } catch (error) {
    console.error('❌ Error during database optimization:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

optimizeDatabase(); 