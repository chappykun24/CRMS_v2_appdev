const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  reapIntervalMillis: 1000,
  createTimeoutMillis: 3000,
  destroyTimeoutMillis: 5000,
  createRetryIntervalMillis: 200,
});

async function testAttendanceUpdate() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing Attendance Update...\n');
    
    // 1. Get a session and enrollment to test with
    console.log('1. Getting test data...');
    const sessionResult = await client.query('SELECT * FROM sessions LIMIT 1');
    const enrollmentResult = await client.query('SELECT * FROM course_enrollments LIMIT 1');
    
    if (sessionResult.rows.length === 0 || enrollmentResult.rows.length === 0) {
      console.log('❌ No sessions or enrollments found');
      return;
    }
    
    const session = sessionResult.rows[0];
    const enrollment = enrollmentResult.rows[0];
    
    console.log('Session:', { session_id: session.session_id, title: session.title });
    console.log('Enrollment:', { enrollment_id: enrollment.enrollment_id, section_course_id: enrollment.section_course_id });
    
    // 2. Check if attendance log exists for this session/enrollment
    console.log('\n2. Checking existing attendance log...');
    const existingLog = await client.query(
      'SELECT * FROM attendance_logs WHERE session_id = $1 AND enrollment_id = $2',
      [session.session_id, enrollment.enrollment_id]
    );
    
    if (existingLog.rows.length > 0) {
      console.log('✅ Existing attendance log found:', existingLog.rows[0]);
    } else {
      console.log('❌ No existing attendance log found');
    }
    
    // 3. Test the update query (same as in the server route)
    console.log('\n3. Testing attendance update...');
    const testStatus = 'present';
    const testRemarks = 'Test update from script';
    
    // First check if log exists
    const checkResult = await client.query(
      'SELECT * FROM attendance_logs WHERE session_id = $1 AND enrollment_id = $2',
      [session.session_id, enrollment.enrollment_id]
    );
    
    let result;
    if (checkResult.rowCount === 0) {
      console.log('Creating new attendance log...');
      result = await client.query(
        `INSERT INTO attendance_logs (enrollment_id, session_id, status, remarks, recorded_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [enrollment.enrollment_id, session.session_id, testStatus, testRemarks]
      );
    } else {
      console.log('Updating existing attendance log...');
      result = await client.query(
        `UPDATE attendance_logs SET status = $1, remarks = $2, recorded_at = NOW()
         WHERE session_id = $3 AND enrollment_id = $4 RETURNING *`,
        [testStatus, testRemarks, session.session_id, enrollment.enrollment_id]
      );
    }
    
    console.log('✅ Update result:', result.rows[0]);
    
    // 4. Verify the update by querying again
    console.log('\n4. Verifying update...');
    const verifyResult = await client.query(
      'SELECT * FROM attendance_logs WHERE session_id = $1 AND enrollment_id = $2',
      [session.session_id, enrollment.enrollment_id]
    );
    
    console.log('✅ Verification result:', verifyResult.rows[0]);
    
    // 5. Test the attendance query that the frontend uses
    console.log('\n5. Testing frontend attendance query...');
    const attendanceQueryResult = await client.query(`
      SELECT
        ce.enrollment_id,
        s.student_id,
        s.full_name,
        s.student_number,
        s.student_photo,
        COALESCE(al.status, 'not-marked') as attendance_status
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      LEFT JOIN attendance_logs al
        ON al.enrollment_id = ce.enrollment_id AND al.session_id = $2
      WHERE ce.section_course_id = $1
      ORDER BY s.full_name
    `, [session.section_course_id, session.session_id]);
    
    console.log(`Found ${attendanceQueryResult.rows.length} students for session ${session.session_id}`);
    
    // Find our test student
    const testStudent = attendanceQueryResult.rows.find(s => s.enrollment_id === enrollment.enrollment_id);
    if (testStudent) {
      console.log('✅ Test student attendance status:', testStudent.attendance_status);
    } else {
      console.log('❌ Test student not found in query results');
    }
    
  } catch (error) {
    console.error('❌ Error testing attendance update:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testAttendanceUpdate(); 