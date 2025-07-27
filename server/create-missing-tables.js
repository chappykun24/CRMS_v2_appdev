const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function createMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating missing tables...\n');
    
    // Create syllabus_ilos table
    console.log('📋 Creating syllabus_ilos table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS syllabus_ilos (
        syllabus_ilo_id SERIAL PRIMARY KEY,
        syllabus_id INTEGER REFERENCES syllabi(syllabus_id) ON DELETE CASCADE,
        ilo_id INTEGER REFERENCES ilos(ilo_id) ON DELETE CASCADE,
        weight_percentage DECIMAL(5,2) DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(syllabus_id, ilo_id)
      )
    `);
    console.log('✅ syllabus_ilos table created');
    
    // Create assessment_ilo_weights table
    console.log('📋 Creating assessment_ilo_weights table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_ilo_weights (
        weight_id SERIAL PRIMARY KEY,
        assessment_id INTEGER REFERENCES assessments(assessment_id) ON DELETE CASCADE,
        ilo_id INTEGER REFERENCES ilos(ilo_id) ON DELETE CASCADE,
        weight_percentage DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(assessment_id, ilo_id)
      )
    `);
    console.log('✅ assessment_ilo_weights table created');
    
    // Create analytics_clusters table
    console.log('📋 Creating analytics_clusters table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_clusters (
        cluster_id SERIAL PRIMARY KEY,
        enrollment_id INTEGER REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
        cluster_type VARCHAR(50) NOT NULL,
        cluster_name VARCHAR(100) NOT NULL,
        cluster_data JSONB,
        performance_level VARCHAR(20),
        risk_level VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ analytics_clusters table created');
    
    // Create analytics_metrics table
    console.log('📋 Creating analytics_metrics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_metrics (
        metric_id SERIAL PRIMARY KEY,
        enrollment_id INTEGER REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
        metric_type VARCHAR(50) NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(10,4),
        metric_data JSONB,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ analytics_metrics table created');
    
    // Create analytics_filters table
    console.log('📋 Creating analytics_filters table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_filters (
        filter_id SERIAL PRIMARY KEY,
        filter_name VARCHAR(100) NOT NULL,
        filter_type VARCHAR(50) NOT NULL,
        filter_criteria JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INTEGER REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ analytics_filters table created');
    
    // Create user_profiles table
    console.log('📋 Creating user_profiles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        profile_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        profile_type VARCHAR(50) NOT NULL,
        profile_data JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, profile_type)
      )
    `);
    console.log('✅ user_profiles table created');
    
    // Create rubric_scores table if it doesn't exist
    console.log('📋 Creating rubric_scores table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS rubric_scores (
        score_id SERIAL PRIMARY KEY,
        rubric_id INTEGER REFERENCES rubrics(rubric_id) ON DELETE CASCADE,
        enrollment_id INTEGER REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
        score DECIMAL(5,2),
        feedback TEXT,
        graded_by INTEGER REFERENCES users(user_id),
        graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ rubric_scores table created');
    
    console.log('\n✅ All missing tables have been created!');
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const tablesToCheck = [
      'syllabus_ilos',
      'assessment_ilo_weights', 
      'analytics_clusters',
      'analytics_metrics',
      'analytics_filters',
      'user_profiles',
      'rubric_scores'
    ];
    
    for (const tableName of tablesToCheck) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table verified: ${tableName}`);
      } else {
        console.log(`❌ Table not found: ${tableName}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createMissingTables(); 