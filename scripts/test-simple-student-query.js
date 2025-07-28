const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function testSimpleStudentQuery() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing simple student query...\n');
    
    // Test with enrollment ID 1
    const enrollmentId = 1;
    
    // Test 1: Basic student info only
    console.log('1. Testing basic student info...');
    try {
      const studentQuery = `
        SELECT 
          ce.enrollment_id,
          s.student_id,
          s.student_number,
          s.full_name,
          s.contact_email,
          s.student_photo,
          ce.status as enrollment_status,
          sc.section_course_id,
          c.course_code,
          c.title as course_title
        FROM course_enrollments ce
        JOIN students s ON ce.student_id = s.student_id
        JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
        JOIN courses c ON sc.course_id = c.course_id
        WHERE ce.enrollment_id = $1
      `;
      
      const studentResult = await client.query(studentQuery, [enrollmentId]);
      console.log('✅ Basic student info successful');
      console.log(`   Student: ${studentResult.rows[0].full_name}`);
      console.log(`   Course: ${studentResult.rows[0].course_code}`);
      
      // Test 2: Attendance analytics
      console.log('\n2. Testing attendance analytics...');
      const attendanceQuery = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN al.status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN al.status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN al.status = 'late' THEN 1 END) as late_count,
          COUNT(CASE WHEN al.status = 'excuse' THEN 1 END) as excused_count,
          ROUND(
            (COUNT(CASE WHEN al.status = 'present' THEN 1 END) * 100.0 / COUNT(*))::numeric, 1
          ) as attendance_rate
        FROM attendance_logs al
        WHERE al.enrollment_id = $1
      `;
      
      const attendanceResult = await client.query(attendanceQuery, [enrollmentId]);
      console.log('✅ Attendance analytics successful');
      console.log(`   Total sessions: ${attendanceResult.rows[0].total_sessions}`);
      console.log(`   Attendance rate: ${attendanceResult.rows[0].attendance_rate}%`);
      
      // Test 3: Assessment grades (simplified)
      console.log('\n3. Testing assessment grades...');
      const sectionCourseId = studentResult.rows[0].section_course_id;
      
      const gradesQuery = `
        SELECT 
          a.assessment_id,
          a.title as assessment_title,
          a.type as assessment_type,
          COALESCE(a.total_points, 10) as total_points,
          sub.submission_id,
          sub.total_score,
          sub.status as submission_status,
          sub.submitted_at,
          sub.remarks,
          ROUND(((sub.total_score * 100.0 / COALESCE(a.total_points, 10))::numeric), 1) as percentage_score
        FROM assessments a
        LEFT JOIN submissions sub ON a.assessment_id = sub.assessment_id AND sub.enrollment_id = $1
        WHERE a.section_course_id = $2
        ORDER BY a.created_at DESC
      `;
      
      const gradesResult = await client.query(gradesQuery, [enrollmentId, sectionCourseId]);
      console.log('✅ Assessment grades successful');
      console.log(`   Found ${gradesResult.rows.length} assessments`);
      
      if (gradesResult.rows.length > 0) {
        console.log('   Sample assessment:', {
          title: gradesResult.rows[0].assessment_title,
          type: gradesResult.rows[0].assessment_type,
          total_points: gradesResult.rows[0].total_points
        });
      }
      
      console.log('\n🎉 All basic queries successful!');
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testSimpleStudentQuery(); 