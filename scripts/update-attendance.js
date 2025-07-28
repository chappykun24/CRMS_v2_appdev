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

async function updateAttendanceRecords() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Starting attendance update process...');
    
    // First, let's see how many attendance records are currently null/not-marked
    const countQuery = `
      SELECT COUNT(*) as total_records,
             COUNT(CASE WHEN status IS NULL OR status = 'not-marked' THEN 1 END) as null_records
      FROM attendance_logs
    `;
    
    const countResult = await client.query(countQuery);
    const { total_records, null_records } = countResult.rows[0];
    
    console.log(`📊 Current attendance records:`);
    console.log(`   Total records: ${total_records}`);
    console.log(`   Null/not-marked records: ${null_records}`);
    
    if (parseInt(null_records) === 0) {
      console.log('✅ No null attendance records found. Nothing to update.');
      return;
    }
    
    // Update all null/not-marked attendance records to 'present'
    const updateQuery = `
      UPDATE attendance_logs 
      SET status = 'present', 
          recorded_at = NOW()
      WHERE status IS NULL OR status = 'not-marked'
    `;
    
    const updateResult = await client.query(updateQuery);
    
    console.log(`✅ Successfully updated ${updateResult.rowCount} attendance records to 'present'`);
    
    // Verify the update
    const verifyQuery = `
      SELECT COUNT(*) as remaining_null
      FROM attendance_logs
      WHERE status IS NULL OR status = 'not-marked'
    `;
    
    const verifyResult = await client.query(verifyQuery);
    const remainingNull = verifyResult.rows[0].remaining_null;
    
    console.log(`🔍 Verification: ${remainingNull} null records remaining`);
    
    if (parseInt(remainingNull) === 0) {
      console.log('🎉 All attendance records have been successfully updated!');
    } else {
      console.log('⚠️  Some null records still remain. Manual review may be needed.');
    }
    
    // Show summary by status
    const summaryQuery = `
      SELECT status, COUNT(*) as count
      FROM attendance_logs
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const summaryResult = await client.query(summaryQuery);
    
    console.log('\n📈 Attendance Status Summary:');
    summaryResult.rows.forEach(row => {
      console.log(`   ${row.status || 'NULL'}: ${row.count} records`);
    });
    
  } catch (error) {
    console.error('❌ Error updating attendance records:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function updateAttendanceWithOptions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Starting attendance update with options...');
    
    // Get all sessions with their dates
    const sessionsQuery = `
      SELECT s.session_id, s.title, s.session_date, s.session_type
      FROM sessions s
      ORDER BY s.session_date DESC
    `;
    
    const sessionsResult = await client.query(sessionsQuery);
    const sessions = sessionsResult.rows;
    
    console.log(`📅 Found ${sessions.length} sessions`);
    
    for (const session of sessions) {
      console.log(`\n🔄 Processing session: ${session.title} (${session.session_date})`);
      
      // Get attendance records for this session
      const attendanceQuery = `
        SELECT al.attendance_log_id, al.enrollment_id, al.status, al.recorded_at,
               s.full_name, s.student_number
        FROM attendance_logs al
        JOIN course_enrollments ce ON al.enrollment_id = ce.enrollment_id
        JOIN students s ON ce.student_id = s.student_id
        WHERE al.session_id = $1
        ORDER BY s.full_name
      `;
      
      const attendanceResult = await client.query(attendanceQuery, [session.session_id]);
      const attendanceRecords = attendanceResult.rows;
      
      console.log(`   📊 Found ${attendanceRecords.length} attendance records`);
      
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const record of attendanceRecords) {
        if (record.status === null || record.status === 'not-marked') {
          // Update to 'present' for past sessions, 'not-marked' for future sessions
          const sessionDate = new Date(session.session_date);
          const today = new Date();
          const isPastSession = sessionDate < today;
          
          const newStatus = isPastSession ? 'present' : 'not-marked';
          
          const updateQuery = `
            UPDATE attendance_logs 
            SET status = $1, 
                recorded_at = NOW()
            WHERE attendance_log_id = $2
          `;
          
          await client.query(updateQuery, [newStatus, record.attendance_log_id]);
          updatedCount++;
          
          console.log(`     ✅ Updated ${record.full_name} (${record.student_number}) to '${newStatus}'`);
        } else {
          skippedCount++;
        }
      }
      
      console.log(`   📈 Session summary: ${updatedCount} updated, ${skippedCount} skipped`);
    }
    
    console.log('\n🎉 Attendance update process completed!');
    
  } catch (error) {
    console.error('❌ Error updating attendance records:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting attendance update script...\n');
    
    // Ask user which method to use
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('Choose update method:\n1. Simple update (all null to present)\n2. Smart update (past sessions to present, future to not-marked)\nEnter 1 or 2: ', resolve);
    });
    
    rl.close();
    
    if (answer === '1') {
      await updateAttendanceRecords();
    } else if (answer === '2') {
      await updateAttendanceWithOptions();
    } else {
      console.log('❌ Invalid option. Please run the script again and choose 1 or 2.');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateAttendanceRecords, updateAttendanceWithOptions }; 