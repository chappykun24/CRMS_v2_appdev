const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function checkCourseStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking courses table structure...');
    
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await client.query(columnsQuery);
    console.log('\n📋 courses table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Also check section_courses table
    const sectionColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'section_courses' 
      ORDER BY ordinal_position;
    `;
    
    const sectionColumnsResult = await client.query(sectionColumnsQuery);
    console.log('\n📋 section_courses table columns:');
    sectionColumnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking course structure:', error);
  } finally {
    client.release();
  }
}

checkCourseStructure()
  .then(() => {
    console.log('🎉 Course structure check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 