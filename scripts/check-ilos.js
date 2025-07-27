const { Pool } = require('pg');

// Database configuration - matching the project's database.js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function checkILOs() {
  try {
    console.log('🔍 Checking existing ILOs...');
    
    const result = await pool.query(`
      SELECT ilo_id, code, description, syllabus_id
      FROM ilos 
      ORDER BY ilo_id;
    `);
    
    console.log('📋 Found ILOs:');
    result.rows.forEach(row => {
      console.log(`  - ID: ${row.ilo_id}, Code: ${row.code}, Syllabus: ${row.syllabus_id}`);
    });
    
    // Check if our syllabus exists
    const syllabusResult = await pool.query(`
      SELECT syllabus_id, title, course_id
      FROM syllabi 
      WHERE syllabus_id = 1001;
    `);
    
    if (syllabusResult.rows.length > 0) {
      console.log('\n📚 Found our syllabus:');
      console.log(`  - ID: ${syllabusResult.rows[0].syllabus_id}, Title: ${syllabusResult.rows[0].title}`);
    } else {
      console.log('\n❌ Our syllabus (ID: 1001) does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking ILOs:', error.message);
  } finally {
    await pool.end();
  }
}

checkILOs(); 