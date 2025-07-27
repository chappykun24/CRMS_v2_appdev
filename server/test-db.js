const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function testDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing database connection and tables...');
    
    // Test basic connection
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result.rows[0].current_time);
    
    // Test if tables exist
    const tables = [
      'syllabi', 'assessments', 'sub_assessments', 'ilos', 'rubrics',
      'users', 'students', 'courses', 'section_courses'
    ];
    
    for (const table of tables) {
      try {
        const tableResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table ${table} exists with ${tableResult.rows[0].count} rows`);
      } catch (error) {
        console.log(`❌ Table ${table} error:`, error.message);
      }
    }
    
    // Test specific queries that might be failing
    console.log('\n🔍 Testing specific queries...');
    
    // Test syllabus query
    try {
      const syllabusResult = await client.query(`
        SELECT s.syllabus_id, s.title, s.section_course_id
        FROM syllabi s
        LIMIT 1
      `);
      console.log('✅ Syllabus query successful:', syllabusResult.rows.length, 'rows');
    } catch (error) {
      console.log('❌ Syllabus query failed:', error.message);
    }
    
    // Test assessment query
    try {
      const assessmentResult = await client.query(`
        SELECT a.assessment_id, a.title, a.syllabus_id
        FROM assessments a
        LIMIT 1
      `);
      console.log('✅ Assessment query successful:', assessmentResult.rows.length, 'rows');
    } catch (error) {
      console.log('❌ Assessment query failed:', error.message);
    }
    
    // Test ILO query
    try {
      const iloResult = await client.query(`
        SELECT i.ilo_id, i.code, i.syllabus_id
        FROM ilos i
        LIMIT 1
      `);
      console.log('✅ ILO query successful:', iloResult.rows.length, 'rows');
    } catch (error) {
      console.log('❌ ILO query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabase(); 