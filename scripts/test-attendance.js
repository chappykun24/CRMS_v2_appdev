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

async function testAttendance() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing Attendance System...\n');
    
    // 1. Check if sessions exist
    console.log('1. Checking sessions...');
    const sessionsResult = await client.query('SELECT * FROM sessions LIMIT 5');
    console.log(`Found ${sessionsResult.rows.length} sessions`);
    if (sessionsResult.rows.length > 0) {
      console.log('Sample session:', sessionsResult.rows[0]);
    }
    
    // 2. Check if attendance_logs exist
    console.log('\n2. Checking attendance_logs...');
    const attendanceResult = await client.query('SELECT * FROM attendance_logs LIMIT 5');
    console.log(`Found ${attendanceResult.rows.length} attendance records`);
    if (attendanceResult.rows.length > 0) {
      console.log('Sample attendance record:', attendanceResult.rows[0]);
    }
    
    // 3. Check if course_enrollments exist
    console.log('\n3. Checking course_enrollments...');
    const enrollmentsResult = await client.query('SELECT * FROM course_enrollments LIMIT 5');
    console.log(`Found ${enrollmentsResult.rows.length} enrollments`);
    if (enrollmentsResult.rows.length > 0) {
      console.log('Sample enrollment:', enrollmentsResult.rows[0]);
    }
    
    // 4. Test the attendance query that the API uses
    console.log('\n4. Testing attendance query...');
    if (sessionsResult.rows.length > 0 && enrollmentsResult.rows.length > 0) {
      const sessionId = sessionsResult.rows[0].session_id;
      const sectionCourseId = sessionsResult.rows[0].section_course_id;
      
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
      `, [sectionCourseId, sessionId]);
      
      console.log(`Found ${attendanceQueryResult.rows.length} students for session ${sessionId}`);
      if (attendanceQueryResult.rows.length > 0) {
        console.log('Sample student attendance:', attendanceQueryResult.rows[0]);
      }
    }
    
    // 5. Check table structure
    console.log('\n5. Checking table structure...');
    const attendanceTableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_logs' 
      ORDER BY ordinal_position
    `);
    console.log('attendance_logs table structure:');
    attendanceTableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('Error testing attendance:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testAttendance(); 