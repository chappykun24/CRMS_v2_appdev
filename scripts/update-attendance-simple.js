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

// Main execution
async function main() {
  try {
    console.log('🚀 Starting attendance update script...\n');
    await updateAttendanceRecords();
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