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

async function checkAttendanceStatus() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking attendance records status...\n');
    
    // Check total records and status distribution
    const statusQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
        COUNT(CASE WHEN status = 'not-marked' THEN 1 END) as not_marked,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused
      FROM attendance_logs
    `;
    
    const statusResult = await client.query(statusQuery);
    const stats = statusResult.rows[0];
    
    console.log('📊 Attendance Records Status:');
    console.log(`   Total records: ${stats.total_records}`);
    console.log(`   NULL status: ${stats.null_status}`);
    console.log(`   Not-marked: ${stats.not_marked}`);
    console.log(`   Present: ${stats.present}`);
    console.log(`   Absent: ${stats.absent}`);
    console.log(`   Late: ${stats.late}`);
    console.log(`   Excused: ${stats.excused}`);
    
    // Check if there are any records to update
    const needsUpdate = parseInt(stats.null_status) + parseInt(stats.not_marked);
    console.log(`\n📋 Records needing update: ${needsUpdate}`);
    
    if (needsUpdate === 0) {
      console.log('✅ All attendance records are already properly marked!');
    } else {
      console.log('⚠️  Found records that need to be updated.');
    }
    
    // Show some sample records
    const sampleQuery = `
      SELECT attendance_id, enrollment_id, session_id, status, recorded_at
      FROM attendance_logs
      ORDER BY attendance_id
      LIMIT 10
    `;
    
    const sampleResult = await client.query(sampleQuery);
    
    console.log('\n📝 Sample Records:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ID: ${row.attendance_id}, Status: ${row.status || 'NULL'}, Session: ${row.session_id}, Recorded: ${row.recorded_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking attendance status:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    await checkAttendanceStatus();
    console.log('\n✅ Status check completed!');
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main(); 