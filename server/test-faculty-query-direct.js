const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function testFacultyQueryDirect() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing faculty assessments query directly...\n');
    
    const facultyId = 6;
    
    // Test the exact query from the API route
    console.log('🧪 Testing the exact query from the API route:');
    
    const query = `
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
    
    try {
      const result = await client.query(query, [facultyId]);
      console.log(`✅ Query successful! Found ${result.rows.length} assessments`);
      
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
      console.log('❌ Query failed:', error.message);
      console.log('Error details:', error);
    }
    
    // Test a simpler version of the query
    console.log('\n🧪 Testing simpler query:');
    try {
      const simpleQuery = `
        SELECT 
          a.assessment_id,
          a.title,
          a.syllabus_id,
          s.title as syllabus_title
        FROM assessments a
        LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
        WHERE a.created_by = $1
      `;
      
      const result = await client.query(simpleQuery, [facultyId]);
      console.log(`✅ Simple query successful! Found ${result.rows.length} assessments`);
    } catch (error) {
      console.log('❌ Simple query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testFacultyQueryDirect(); 