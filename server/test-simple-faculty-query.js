const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function testSimpleFacultyQuery() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing simplified faculty assessments query...\n');
    
    const facultyId = 6;
    
    // Test 1: Basic assessments query
    console.log('1️⃣ Testing basic assessments query:');
    try {
      const basicQuery = `
        SELECT 
          assessment_id,
          title,
          syllabus_id,
          created_by
        FROM assessments
        WHERE created_by = $1
      `;
      
      const result = await client.query(basicQuery, [facultyId]);
      console.log(`✅ Basic query successful! Found ${result.rows.length} assessments`);
    } catch (error) {
      console.log('❌ Basic query failed:', error.message);
    }
    
    // Test 2: Add syllabus join
    console.log('\n2️⃣ Testing with syllabus join:');
    try {
      const syllabusQuery = `
        SELECT 
          a.assessment_id,
          a.title,
          a.syllabus_id,
          a.created_by,
          s.title as syllabus_title
        FROM assessments a
        LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
        WHERE a.created_by = $1
      `;
      
      const result = await client.query(syllabusQuery, [facultyId]);
      console.log(`✅ Syllabus query successful! Found ${result.rows.length} assessments`);
    } catch (error) {
      console.log('❌ Syllabus query failed:', error.message);
    }
    
    // Test 3: Add section_courses join
    console.log('\n3️⃣ Testing with section_courses join:');
    try {
      const sectionQuery = `
        SELECT 
          a.assessment_id,
          a.title,
          a.syllabus_id,
          a.section_course_id,
          a.created_by,
          s.title as syllabus_title,
          sc.section_course_id as sc_id
        FROM assessments a
        LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
        LEFT JOIN section_courses sc ON COALESCE(a.section_course_id, s.section_course_id) = sc.section_course_id
        WHERE a.created_by = $1
      `;
      
      const result = await client.query(sectionQuery, [facultyId]);
      console.log(`✅ Section query successful! Found ${result.rows.length} assessments`);
    } catch (error) {
      console.log('❌ Section query failed:', error.message);
    }
    
    // Test 4: Add courses join
    console.log('\n4️⃣ Testing with courses join:');
    try {
      const coursesQuery = `
        SELECT 
          a.assessment_id,
          a.title,
          a.syllabus_id,
          a.section_course_id,
          a.created_by,
          s.title as syllabus_title,
          c.title as course_title,
          c.course_code
        FROM assessments a
        LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
        LEFT JOIN section_courses sc ON COALESCE(a.section_course_id, s.section_course_id) = sc.section_course_id
        LEFT JOIN courses c ON sc.course_id = c.course_id
        WHERE a.created_by = $1
      `;
      
      const result = await client.query(coursesQuery, [facultyId]);
      console.log(`✅ Courses query successful! Found ${result.rows.length} assessments`);
    } catch (error) {
      console.log('❌ Courses query failed:', error.message);
    }
    
    // Test 5: Add users join
    console.log('\n5️⃣ Testing with users join:');
    try {
      const usersQuery = `
        SELECT 
          a.assessment_id,
          a.title,
          a.syllabus_id,
          a.section_course_id,
          a.created_by,
          s.title as syllabus_title,
          c.title as course_title,
          c.course_code,
          u.name as instructor_name
        FROM assessments a
        LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
        LEFT JOIN section_courses sc ON COALESCE(a.section_course_id, s.section_course_id) = sc.section_course_id
        LEFT JOIN courses c ON sc.course_id = c.course_id
        LEFT JOIN users u ON sc.instructor_id = u.user_id
        WHERE a.created_by = $1
      `;
      
      const result = await client.query(usersQuery, [facultyId]);
      console.log(`✅ Users query successful! Found ${result.rows.length} assessments`);
    } catch (error) {
      console.log('❌ Users query failed:', error.message);
    }
    
    // Test 6: Add all assessment columns one by one
    console.log('\n6️⃣ Testing with all assessment columns:');
    try {
      const allColumnsQuery = `
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
      
      const result = await client.query(allColumnsQuery, [facultyId]);
      console.log(`✅ All columns query successful! Found ${result.rows.length} assessments`);
    } catch (error) {
      console.log('❌ All columns query failed:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testSimpleFacultyQuery(); 