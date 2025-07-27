const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function debugAssessments() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging assessments data...\n');
    
    // Check assessments table structure
    console.log('📋 Assessments table structure:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'assessments'
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    console.log('\n📊 Current assessments data:');
    const assessments = await client.query(`
      SELECT 
        assessment_id,
        title,
        syllabus_id,
        section_course_id,
        created_by,
        created_at
      FROM assessments
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (assessments.rows.length === 0) {
      console.log('  No assessments found in database');
    } else {
      assessments.rows.forEach(assessment => {
        console.log(`  - ID: ${assessment.assessment_id}, Title: ${assessment.title}, Syllabus: ${assessment.syllabus_id}, Section: ${assessment.section_course_id}, Created by: ${assessment.created_by}`);
      });
    }
    
    console.log('\n👥 Users data:');
    const users = await client.query(`
      SELECT user_id, name, role
      FROM users
      WHERE role = 'faculty'
      LIMIT 5
    `);
    
    users.rows.forEach(user => {
      console.log(`  - ID: ${user.user_id}, Name: ${user.name}, Role: ${user.role}`);
    });
    
    console.log('\n📚 Syllabi data:');
    const syllabi = await client.query(`
      SELECT syllabus_id, title, created_by, section_course_id
      FROM syllabi
      LIMIT 5
    `);
    
    syllabi.rows.forEach(syllabus => {
      console.log(`  - ID: ${syllabus.syllabus_id}, Title: ${syllabus.title}, Created by: ${syllabus.created_by}, Section: ${syllabus.section_course_id}`);
    });
    
    console.log('\n🏫 Section courses data:');
    const sectionCourses = await client.query(`
      SELECT section_course_id, course_id, section_id, instructor_id
      FROM section_courses
      LIMIT 5
    `);
    
    sectionCourses.rows.forEach(sc => {
      console.log(`  - ID: ${sc.section_course_id}, Course: ${sc.course_id}, Section: ${sc.section_id}, Instructor: ${sc.instructor_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugAssessments(); 