const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function setupAnalyticsTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up analytics tables...');
    
    // Create analytics_clusters table
    const createClustersTable = `
      CREATE TABLE IF NOT EXISTS analytics_clusters (
        cluster_id SERIAL PRIMARY KEY,
        enrollment_id INTEGER NOT NULL,
        cluster_type VARCHAR(50) NOT NULL,
        cluster_label VARCHAR(50) NOT NULL,
        cluster_index INTEGER NOT NULL,
        characteristics JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
        UNIQUE(enrollment_id, cluster_type)
      );
    `;
    
    await client.query(createClustersTable);
    console.log('✅ analytics_clusters table created/verified');
    
    // Create analytics_insights table
    const createInsightsTable = `
      CREATE TABLE IF NOT EXISTS analytics_insights (
        insight_id SERIAL PRIMARY KEY,
        insight_type VARCHAR(50) NOT NULL,
        insight_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(createInsightsTable);
    console.log('✅ analytics_insights table created/verified');
    
    // Create reports table
    const createReportsTable = `
      CREATE TABLE IF NOT EXISTS reports (
        report_id VARCHAR(50) PRIMARY KEY,
        report_type VARCHAR(50) NOT NULL,
        course_id INTEGER,
        generated_by INTEGER,
        report_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES section_courses(section_course_id) ON DELETE SET NULL,
        FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL
      );
    `;
    
    await client.query(createReportsTable);
    console.log('✅ reports table created/verified');
    
    // Create analytics_metrics table
    const createMetricsTable = `
      CREATE TABLE IF NOT EXISTS analytics_metrics (
        metric_id SERIAL PRIMARY KEY,
        enrollment_id INTEGER NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(10,4),
        metric_unit VARCHAR(20),
        calculation_method VARCHAR(50),
        data_source VARCHAR(100),
        computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP,
        FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE
      );
    `;
    
    await client.query(createMetricsTable);
    console.log('✅ analytics_metrics table created/verified');
    
    console.log('\n🎉 All analytics tables set up successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up analytics tables:', error);
  } finally {
    client.release();
  }
}

setupAnalyticsTables()
  .then(() => {
    console.log('🎉 Analytics tables setup completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 