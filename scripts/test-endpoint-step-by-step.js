const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function testEndpointStepByStep() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing endpoint step by step...\n');
    
    const enrollmentId = 1;
    
    // Step 1: Basic student info
    console.log('Step 1: Basic student info...');
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
      console.log('✅ Step 1 successful');
      const student = studentResult.rows[0];
      console.log(`   Student: ${student.full_name}, Section Course ID: ${student.section_course_id}`);
    } catch (error) {
      console.log('❌ Step 1 failed:', error.message);
      return;
    }
    
    // Step 2: Attendance analytics
    console.log('\nStep 2: Attendance analytics...');
    try {
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
      console.log('✅ Step 2 successful');
    } catch (error) {
      console.log('❌ Step 2 failed:', error.message);
    }
    
    // Step 3: Recent attendance records
    console.log('\nStep 3: Recent attendance records...');
    try {
      const recentAttendanceQuery = `
        SELECT 
          al.status,
          al.remarks,
          al.recorded_at,
          s.title as session_title,
          s.session_type,
          s.session_date
        FROM attendance_logs al
        JOIN sessions s ON al.session_id = s.session_id
        WHERE al.enrollment_id = $1
        ORDER BY s.session_date DESC
        LIMIT 10
      `;
      
      const recentAttendanceResult = await client.query(recentAttendanceQuery, [enrollmentId]);
      console.log('✅ Step 3 successful');
    } catch (error) {
      console.log('❌ Step 3 failed:', error.message);
    }
    
    // Step 4: Assessment grades
    console.log('\nStep 4: Assessment grades...');
    try {
      const sectionCourseId = 1; // From step 1
      
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
      console.log('✅ Step 4 successful');
    } catch (error) {
      console.log('❌ Step 4 failed:', error.message);
    }
    
    // Step 5: Sub-assessment grades
    console.log('\nStep 5: Sub-assessment grades...');
    try {
      const sectionCourseId = 1; // From step 1
      
      const subGradesQuery = `
        SELECT 
          sa.sub_assessment_id,
          sa.title as sub_assessment_title,
          sa.total_points,
          sas.submission_id,
          sas.total_score,
          sas.status as submission_status,
          sas.submitted_at,
          sas.remarks,
          CASE 
            WHEN sa.total_points > 0 AND sas.total_score IS NOT NULL 
            THEN ROUND(((sas.total_score * 100.0 / sa.total_points)::numeric), 1)
            ELSE NULL 
          END as percentage_score,
          a.title as parent_assessment_title
        FROM sub_assessments sa
        JOIN assessments a ON sa.assessment_id = a.assessment_id
        LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id AND sas.enrollment_id = $1
        WHERE a.section_course_id = $2
        ORDER BY sa.created_at DESC
      `;
      
      const subGradesResult = await client.query(subGradesQuery, [enrollmentId, sectionCourseId]);
      console.log('✅ Step 5 successful');
    } catch (error) {
      console.log('❌ Step 5 failed:', error.message);
    }
    
    // Step 6: Analytics cluster
    console.log('\nStep 6: Analytics cluster...');
    try {
      const clusterQuery = `
        SELECT 
          cluster_label,
          based_on,
          algorithm_used,
          generated_at
        FROM analytics_clusters
        WHERE enrollment_id = $1
        ORDER BY generated_at DESC
        LIMIT 1
      `;
      
      const clusterResult = await client.query(clusterQuery, [enrollmentId]);
      console.log('✅ Step 6 successful');
    } catch (error) {
      console.log('❌ Step 6 failed:', error.message);
    }
    
    console.log('\n🎉 All steps completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testEndpointStepByStep(); 