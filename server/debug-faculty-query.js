const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function debugFacultyQuery() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging faculty assessments query...\n');
    
    const facultyId = 6;
    
    // Test the exact query from the API route
    console.log('🧪 Testing faculty assessments query step by step...');
    
    // Step 1: Check if faculty exists
    console.log('\n1️⃣ Checking if faculty exists:');
    const facultyCheck = await client.query(`
      SELECT user_id, name, role_id
      FROM users
      WHERE user_id = $1
    `, [facultyId]);
    
    if (facultyCheck.rows.length > 0) {
      console.log(`✅ Faculty found: ${facultyCheck.rows[0].name} (role_id: ${facultyCheck.rows[0].role_id})`);
    } else {
      console.log('❌ Faculty not found');
      return;
    }
    
    // Step 2: Check assessments for this faculty
    console.log('\n2️⃣ Checking assessments for faculty:');
    const assessmentsCheck = await client.query(`
      SELECT 
        assessment_id,
        title,
        created_by,
        syllabus_id,
        section_course_id
      FROM assessments
      WHERE created_by = $1
    `, [facultyId]);
    
    console.log(`Found ${assessmentsCheck.rows.length} assessments for faculty ${facultyId}:`);
    assessmentsCheck.rows.forEach(assessment => {
      console.log(`  - ID: ${assessment.assessment_id}, Title: ${assessment.title}, Syllabus: ${assessment.syllabus_id}, Section: ${assessment.section_course_id}`);
    });
    
    // Step 3: Test the full query with simplified joins
    console.log('\n3️⃣ Testing full query with simplified joins:');
    try {
      const fullQuery = `
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
      
      const result = await client.query(fullQuery, [facultyId]);
      console.log(`✅ Full query successful! Found ${result.rows.length} assessments`);
      
      if (result.rows.length > 0) {
        console.log('First assessment details:');
        const first = result.rows[0];
        console.log(`  - ID: ${first.assessment_id}`);
        console.log(`  - Title: ${first.title}`);
        console.log(`  - Syllabus: ${first.syllabus_title}`);
        console.log(`  - Course: ${first.course_title}`);
        console.log(`  - Instructor: ${first.instructor_name}`);
      }
    } catch (error) {
      console.log('❌ Full query failed:', error.message);
      console.log('Error details:', error);
    }
    
    // Step 4: Check if section_courses table has data
    console.log('\n4️⃣ Checking section_courses data:');
    const sectionCoursesCheck = await client.query(`
      SELECT 
        section_course_id,
        course_id,
        section_id,
        instructor_id
      FROM section_courses
      LIMIT 5
    `);
    
    console.log(`Found ${sectionCoursesCheck.rows.length} section courses:`);
    sectionCoursesCheck.rows.forEach(sc => {
      console.log(`  - ID: ${sc.section_course_id}, Course: ${sc.course_id}, Section: ${sc.section_id}, Instructor: ${sc.instructor_id}`);
    });
    
    // Step 5: Check if courses table has data
    console.log('\n5️⃣ Checking courses data:');
    const coursesCheck = await client.query(`
      SELECT 
        course_id,
        title,
        course_code
      FROM courses
      LIMIT 5
    `);
    
    console.log(`Found ${coursesCheck.rows.length} courses:`);
    coursesCheck.rows.forEach(course => {
      console.log(`  - ID: ${course.course_id}, Title: ${course.title}, Code: ${course.course_code}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugFacultyQuery(); 