const { Pool } = require('pg');

// Database configuration - matching the project's database.js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function checkExistingData() {
  try {
    console.log('🔍 Checking existing data...\n');
    
    // Check courses
    const coursesResult = await pool.query(`
      SELECT course_id, title, course_code, description
      FROM courses 
      ORDER BY course_id;
    `);
    
    console.log('📚 Found Courses:');
    coursesResult.rows.forEach(row => {
      console.log(`  - ID: ${row.course_id}, Code: ${row.course_code}, Title: ${row.title}`);
    });
    
    // Check syllabi
    const syllabiResult = await pool.query(`
      SELECT syllabus_id, title, course_id, created_by
      FROM syllabi 
      ORDER BY syllabus_id;
    `);
    
    console.log('\n📖 Found Syllabi:');
    syllabiResult.rows.forEach(row => {
      console.log(`  - ID: ${row.syllabus_id}, Title: ${row.title}, Course: ${row.course_id}, Created by: ${row.created_by}`);
    });
    
    // Check section courses
    const sectionCoursesResult = await pool.query(`
      SELECT section_course_id, course_id, instructor_id
      FROM section_courses 
      ORDER BY section_course_id;
    `);
    
    console.log('\n🏫 Found Section Courses:');
    sectionCoursesResult.rows.forEach(row => {
      console.log(`  - ID: ${row.section_course_id}, Course: ${row.course_id}, Instructor: ${row.instructor_id}`);
    });
    
    // Check students
    const studentsResult = await pool.query(`
      SELECT COUNT(*) as student_count
      FROM students;
    `);
    
    console.log(`\n👥 Total Students: ${studentsResult.rows[0].student_count}`);
    
    // Check assessments
    const assessmentsResult = await pool.query(`
      SELECT assessment_id, title, syllabus_id, section_course_id
      FROM assessments 
      ORDER BY assessment_id;
    `);
    
    console.log('\n📝 Found Assessments:');
    assessmentsResult.rows.forEach(row => {
      console.log(`  - ID: ${row.assessment_id}, Title: ${row.title}, Syllabus: ${row.syllabus_id}, Section Course: ${row.section_course_id}`);
    });
    
    // Check sub-assessments
    const subAssessmentsResult = await pool.query(`
      SELECT COUNT(*) as sub_assessment_count
      FROM sub_assessments;
    `);
    
    console.log(`\n📋 Total Sub-Assessments: ${subAssessmentsResult.rows[0].sub_assessment_count}`);
    
  } catch (error) {
    console.error('❌ Error checking existing data:', error.message);
  } finally {
    await pool.end();
  }
}

checkExistingData(); 