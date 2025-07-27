const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function debugFacultyAssessments() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging faculty assessments...\n');
    
    // Check faculty users
    console.log('👥 Faculty users:');
    const faculty = await client.query(`
      SELECT user_id, name, role
      FROM users
      WHERE role = 'faculty'
      ORDER BY user_id
    `);
    
    faculty.rows.forEach(user => {
      console.log(`  - ID: ${user.user_id}, Name: ${user.name}, Role: ${user.role}`);
    });
    
    // Check assessments by faculty
    console.log('\n📊 Assessments by faculty:');
    const assessments = await client.query(`
      SELECT 
        a.assessment_id,
        a.title,
        a.created_by,
        a.syllabus_id,
        a.section_course_id,
        u.name as faculty_name
      FROM assessments a
      LEFT JOIN users u ON a.created_by = u.user_id
      ORDER BY a.created_by, a.assessment_id
    `);
    
    if (assessments.rows.length === 0) {
      console.log('  No assessments found');
    } else {
      assessments.rows.forEach(assessment => {
        console.log(`  - ID: ${assessment.assessment_id}, Title: ${assessment.title}, Created by: ${assessment.created_by} (${assessment.faculty_name}), Syllabus: ${assessment.syllabus_id}, Section: ${assessment.section_course_id}`);
      });
    }
    
    // Test the specific query that's failing
    console.log('\n🧪 Testing faculty assessments query for faculty ID 1:');
    try {
      const testQuery = `
        SELECT 
          a.assessment_id,
          a.syllabus_id,
          a.section_course_id,
          a.title,
          a.description,
          a.type,
          a.category,
          a.total_points,
          a.weight_percentage,
          a.due_date,
          a.submission_deadline,
          a.is_published,
          a.is_graded,
          a.grading_method,
          a.instructions,
          a.content_data,
          a.ilo_codes,
          a.assessment_structure,
          a.rubric_criteria,
          a.status,
          a.total_submissions,
          a.graded_submissions,
          a.created_at,
          a.updated_at,
          s.title as syllabus_title,
          c.title as course_title,
          c.course_code,
          sc.room_assignment,
          sc.schedule,
          u.name as instructor_name
        FROM assessments a
        LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
        LEFT JOIN section_courses sc ON COALESCE(a.section_course_id, s.section_course_id) = sc.section_course_id
        LEFT JOIN courses c ON sc.course_id = c.course_id
        LEFT JOIN users u ON sc.instructor_id = u.user_id
        WHERE a.created_by = $1
        ORDER BY a.created_at DESC
      `;
      
      const result = await client.query(testQuery, [1]);
      console.log(`✅ Query successful, found ${result.rows.length} assessments`);
      
      if (result.rows.length > 0) {
        console.log('  First assessment:', result.rows[0].title);
      }
    } catch (error) {
      console.log('❌ Query failed:', error.message);
    }
    
    // Check if there are any assessments at all
    console.log('\n📋 All assessments:');
    const allAssessments = await client.query(`
      SELECT COUNT(*) as total_count
      FROM assessments
    `);
    
    console.log(`  Total assessments in database: ${allAssessments.rows[0].total_count}`);
    
  } catch (error) {
    console.error('❌ Error debugging:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugFacultyAssessments(); 