const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function debugStudentEndpoint() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging Student Comprehensive Data Endpoint...\n');
    
    // First, let's find a valid enrollment_id
    console.log('1. Finding valid enrollment IDs...');
    const enrollmentQuery = `
      SELECT enrollment_id, s.full_name, s.student_number
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      LIMIT 5
    `;
    
    const enrollmentResult = await client.query(enrollmentQuery);
    console.log(`Found ${enrollmentResult.rows.length} enrollments:`);
    enrollmentResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.full_name} (${row.student_number}) - Enrollment ID: ${row.enrollment_id}`);
    });
    
    if (enrollmentResult.rows.length === 0) {
      console.log('❌ No enrollments found');
      return;
    }
    
    const testEnrollmentId = enrollmentResult.rows[0].enrollment_id;
    console.log(`\n2. Testing with enrollment ID: ${testEnrollmentId}`);
    
    // Test each part of the comprehensive query separately
    
    // Test 1: Basic student info
    console.log('\n3. Testing basic student info...');
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
      
      const studentResult = await client.query(studentQuery, [testEnrollmentId]);
      console.log('✅ Basic student info query successful');
      console.log(`   Student: ${studentResult.rows[0].full_name}`);
      console.log(`   Course: ${studentResult.rows[0].course_code} - ${studentResult.rows[0].course_title}`);
    } catch (error) {
      console.log('❌ Basic student info query failed:', error.message);
    }
    
    // Test 2: Attendance analytics
    console.log('\n4. Testing attendance analytics...');
    try {
      const attendanceQuery = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN al.status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN al.status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN al.status = 'late' THEN 1 END) as late_count,
          COUNT(CASE WHEN al.status = 'excuse' THEN 1 END) as excused_count,
          ROUND(
            (COUNT(CASE WHEN al.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 1
          ) as attendance_rate
        FROM attendance_logs al
        WHERE al.enrollment_id = $1
      `;
      
      const attendanceResult = await client.query(attendanceQuery, [testEnrollmentId]);
      console.log('✅ Attendance analytics query successful');
      console.log(`   Total sessions: ${attendanceResult.rows[0].total_sessions}`);
      console.log(`   Attendance rate: ${attendanceResult.rows[0].attendance_rate}%`);
    } catch (error) {
      console.log('❌ Attendance analytics query failed:', error.message);
    }
    
    // Test 3: Recent attendance records
    console.log('\n5. Testing recent attendance records...');
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
      
      const recentAttendanceResult = await client.query(recentAttendanceQuery, [testEnrollmentId]);
      console.log('✅ Recent attendance records query successful');
      console.log(`   Found ${recentAttendanceResult.rows.length} recent records`);
    } catch (error) {
      console.log('❌ Recent attendance records query failed:', error.message);
    }
    
    // Test 4: Assessment grades
    console.log('\n6. Testing assessment grades...');
    try {
      // First get the section_course_id
      const sectionQuery = `
        SELECT section_course_id 
        FROM course_enrollments 
        WHERE enrollment_id = $1
      `;
      const sectionResult = await client.query(sectionQuery, [testEnrollmentId]);
      const sectionCourseId = sectionResult.rows[0].section_course_id;
      
      const gradesQuery = `
        SELECT 
          a.assessment_id,
          a.title as assessment_title,
          a.assessment_type,
          a.total_points,
          sub.submission_id,
          sub.total_score,
          sub.status as submission_status,
          sub.submitted_at,
          sub.remarks,
          ROUND((sub.total_score * 100.0 / a.total_points), 1) as percentage_score
        FROM assessments a
        LEFT JOIN submissions sub ON a.assessment_id = sub.assessment_id AND sub.enrollment_id = $1
        WHERE a.section_course_id = $2
        ORDER BY a.created_at DESC
      `;
      
      const gradesResult = await client.query(gradesQuery, [testEnrollmentId, sectionCourseId]);
      console.log('✅ Assessment grades query successful');
      console.log(`   Found ${gradesResult.rows.length} assessments`);
    } catch (error) {
      console.log('❌ Assessment grades query failed:', error.message);
    }
    
    // Test 5: Sub-assessment grades
    console.log('\n7. Testing sub-assessment grades...');
    try {
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
          ROUND((sas.total_score * 100.0 / sa.total_points), 1) as percentage_score,
          a.title as parent_assessment_title
        FROM sub_assessments sa
        JOIN assessments a ON sa.assessment_id = a.assessment_id
        LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id AND sas.enrollment_id = $1
        WHERE a.section_course_id = $2
        ORDER BY sa.created_at DESC
      `;
      
      const subGradesResult = await client.query(subGradesQuery, [testEnrollmentId, sectionCourseId]);
      console.log('✅ Sub-assessment grades query successful');
      console.log(`   Found ${subGradesResult.rows.length} sub-assessments`);
    } catch (error) {
      console.log('❌ Sub-assessment grades query failed:', error.message);
    }
    
    // Test 6: Analytics cluster
    console.log('\n8. Testing analytics cluster...');
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
      
      const clusterResult = await client.query(clusterQuery, [testEnrollmentId]);
      console.log('✅ Analytics cluster query successful');
      if (clusterResult.rows.length > 0) {
        console.log(`   Found cluster: ${clusterResult.rows[0].cluster_label}`);
      } else {
        console.log('   No cluster data found');
      }
    } catch (error) {
      console.log('❌ Analytics cluster query failed:', error.message);
    }
    
    console.log('\n🎉 Debug complete! Check the results above to identify the failing query.');
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugStudentEndpoint(); 