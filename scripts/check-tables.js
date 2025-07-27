const { Pool } = require('pg');

// Database configuration - matching the project's database.js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sub_assessments', 'sub_assessment_submissions', 'assessments', 'courses', 'students')
      ORDER BY table_name;
    `);
    
    console.log('📋 Found tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if sub_assessments table exists
    const subAssessmentsExists = result.rows.some(row => row.table_name === 'sub_assessments');
    
    if (!subAssessmentsExists) {
      console.log('\n❌ sub_assessments table does not exist!');
      console.log('💡 You may need to run the final database schema first.');
    } else {
      console.log('\n✅ sub_assessments table exists!');
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables(); 