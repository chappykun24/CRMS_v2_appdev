const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function checkSectionCourses() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking section_courses table structure...\n');
    
    // Check section_courses table structure
    console.log('📋 Section_courses table columns:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'section_courses'
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    console.log('\n📊 Sample section_courses data:');
    const data = await client.query(`
      SELECT *
      FROM section_courses
      LIMIT 5
    `);
    
    data.rows.forEach(row => {
      console.log(`  - Section Course:`, row);
    });
    
    // Check if specific columns exist that the query needs
    console.log('\n🔍 Checking specific columns needed by the query:');
    const neededColumns = ['room_assignment', 'schedule', 'instructor_id'];
    
    for (const column of neededColumns) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'section_courses' 
          AND column_name = $1
        )
      `, [column]);
      
      if (result.rows[0].exists) {
        console.log(`  ✅ Column exists: ${column}`);
      } else {
        console.log(`  ❌ Column missing: ${column}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking section_courses:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSectionCourses(); 