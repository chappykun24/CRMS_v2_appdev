const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function testDatabaseConnection() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing database connection and faculty assessments query...\n');
    
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic database connection:');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result.rows[0].current_time);
    
    // Test 2: Faculty assessments query
    console.log('\n2️⃣ Testing faculty assessments query:');
    const facultyId = 6;
    
    const query = `
      SELECT 
        a.assessment_id,
        a.title,
        a.syllabus_id,
        s.title as syllabus_title
      FROM assessments a
      LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
      WHERE a.created_by = $1
      ORDER BY a.created_at DESC
    `;
    
    const assessments = await client.query(query, [facultyId]);
    console.log(`✅ Faculty assessments query successful! Found ${assessments.rows.length} assessments`);
    
    assessments.rows.forEach(assessment => {
      console.log(`  - ID: ${assessment.assessment_id}, Title: ${assessment.title}, Syllabus: ${assessment.syllabus_title}`);
    });
    
    // Test 3: Test the full query that the API uses
    console.log('\n3️⃣ Testing full API query:');
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
        u.name as instructor_name
      FROM assessments a
      LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
      LEFT JOIN section_courses sc ON COALESCE(a.section_course_id, s.section_course_id) = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN users u ON sc.instructor_id = u.user_id
      WHERE a.created_by = $1
      ORDER BY a.created_at DESC
    `;
    
    const fullResult = await client.query(fullQuery, [facultyId]);
    console.log(`✅ Full API query successful! Found ${fullResult.rows.length} assessments`);
    
    if (fullResult.rows.length > 0) {
      console.log('First assessment details:');
      const first = fullResult.rows[0];
      console.log(`  - ID: ${first.assessment_id}`);
      console.log(`  - Title: ${first.title}`);
      console.log(`  - Syllabus: ${first.syllabus_title}`);
      console.log(`  - Course: ${first.course_title || 'N/A'}`);
      console.log(`  - Instructor: ${first.instructor_name || 'N/A'}`);
    }
    
    console.log('\n✅ All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabaseConnection(); 