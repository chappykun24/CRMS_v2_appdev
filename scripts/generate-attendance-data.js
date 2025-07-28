const { Pool } = require('pg');
require('dotenv').config();

// Database connection
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

async function generateAttendanceData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Starting attendance data generation...\n');
    
    // First, let's see what sessions and enrollments we have
    const sessionsQuery = `
      SELECT session_id, title, session_date, session_type, section_course_id
      FROM sessions
      ORDER BY session_date DESC
    `;
    
    const sessionsResult = await client.query(sessionsQuery);
    const sessions = sessionsResult.rows;
    
    console.log(`📅 Found ${sessions.length} sessions`);
    
    if (sessions.length === 0) {
      console.log('❌ No sessions found. Please create sessions first.');
      return;
    }
    
    // Get enrollments for each section course
    const enrollmentsQuery = `
      SELECT ce.enrollment_id, ce.section_course_id, s.student_id, s.full_name
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      ORDER BY ce.section_course_id, s.full_name
    `;
    
    const enrollmentsResult = await client.query(enrollmentsQuery);
    const enrollments = enrollmentsResult.rows;
    
    console.log(`👥 Found ${enrollments.length} enrollments`);
    
    if (enrollments.length === 0) {
      console.log('❌ No enrollments found. Please enroll students first.');
      return;
    }
    
    // Clear existing attendance records
    console.log('🧹 Clearing existing attendance records...');
    await client.query('DELETE FROM attendance_logs');
    
    // Generate attendance records for each session
    let totalRecords = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    
    for (const session of sessions) {
      console.log(`\n📝 Processing session: ${session.title} (${session.session_date})`);
      
      // Get enrollments for this session's section course
      const sessionEnrollments = enrollments.filter(e => e.section_course_id === session.section_course_id);
      
      if (sessionEnrollments.length === 0) {
        console.log(`   ⚠️  No enrollments found for section course ${session.section_course_id}`);
        continue;
      }
      
      console.log(`   👥 Found ${sessionEnrollments.length} students enrolled`);
      
      for (const enrollment of sessionEnrollments) {
        // Generate realistic attendance status (86% present, rest distributed)
        const random = Math.random();
        let status;
        
        if (random <= 0.86) {
          status = 'present';
          presentCount++;
        } else if (random <= 0.92) {
          status = 'late';
          lateCount++;
        } else if (random <= 0.97) {
          status = 'absent';
          absentCount++;
        } else {
          status = 'excused';
          excusedCount++;
        }
        
        // Insert attendance record
        const insertQuery = `
          INSERT INTO attendance_logs (enrollment_id, session_id, status, session_date, recorded_at)
          VALUES ($1, $2, $3, $4, NOW())
        `;
        
        await client.query(insertQuery, [
          enrollment.enrollment_id,
          session.session_id,
          status,
          session.session_date
        ]);
        
        totalRecords++;
      }
    }
    
    console.log(`\n✅ Successfully generated ${totalRecords} attendance records`);
    console.log(`📊 Distribution:`);
    console.log(`   Present: ${presentCount} (${Math.round((presentCount/totalRecords)*100)}%)`);
    console.log(`   Late: ${lateCount} (${Math.round((lateCount/totalRecords)*100)}%)`);
    console.log(`   Absent: ${absentCount} (${Math.round((absentCount/totalRecords)*100)}%)`);
    console.log(`   Excused: ${excusedCount} (${Math.round((excusedCount/totalRecords)*100)}%)`);
    
    // Show summary by status
    const summaryQuery = `
      SELECT status, COUNT(*) as count
      FROM attendance_logs
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const summaryResult = await client.query(summaryQuery);
    
    console.log('\n📈 Final Attendance Status Summary:');
    summaryResult.rows.forEach(row => {
      const percentage = Math.round((row.count / totalRecords) * 100);
      console.log(`   ${row.status}: ${row.count} records (${percentage}%)`);
    });
    
  } catch (error) {
    console.error('❌ Error generating attendance data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting attendance data generation script...\n');
    await generateAttendanceData();
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main(); 