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

async function updateAttendanceWithRealisticDistribution() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Starting realistic attendance update process...');
    
    // First, let's see how many attendance records are currently not-marked
    const countQuery = `
      SELECT COUNT(*) as total_records,
             COUNT(CASE WHEN status = 'not-marked' THEN 1 END) as not_marked_records
      FROM attendance_logs
    `;
    
    const countResult = await client.query(countQuery);
    const { total_records, not_marked_records } = countResult.rows[0];
    
    console.log(`📊 Current attendance records:`);
    console.log(`   Total records: ${total_records}`);
    console.log(`   Not-marked records: ${not_marked_records}`);
    
    if (parseInt(not_marked_records) === 0) {
      console.log('✅ No not-marked attendance records found. Nothing to update.');
      return;
    }
    
    // Get all not-marked attendance records
    const getNotMarkedQuery = `
      SELECT attendance_log_id, enrollment_id, session_id
      FROM attendance_logs
      WHERE status = 'not-marked'
      ORDER BY attendance_log_id
    `;
    
    const notMarkedResult = await client.query(getNotMarkedQuery);
    const notMarkedRecords = notMarkedResult.rows;
    
    console.log(`📋 Found ${notMarkedRecords.length} not-marked records to update`);
    
    // Calculate distribution
    const totalRecords = notMarkedRecords.length;
    const presentCount = Math.round(totalRecords * 0.86); // 86% present
    const remainingCount = totalRecords - presentCount;
    
    // Distribute remaining records among late, absent, excused
    const lateCount = Math.round(remainingCount * 0.4); // 40% of remaining = late
    const absentCount = Math.round(remainingCount * 0.4); // 40% of remaining = absent
    const excusedCount = remainingCount - lateCount - absentCount; // Rest = excused
    
    console.log(`📈 Planned distribution:`);
    console.log(`   Present: ${presentCount} (${Math.round((presentCount/totalRecords)*100)}%)`);
    console.log(`   Late: ${lateCount} (${Math.round((lateCount/totalRecords)*100)}%)`);
    console.log(`   Absent: ${absentCount} (${Math.round((absentCount/totalRecords)*100)}%)`);
    console.log(`   Excused: ${excusedCount} (${Math.round((excusedCount/totalRecords)*100)}%)`);
    
    // Create array of statuses based on distribution
    const statuses = [];
    
    // Add present statuses
    for (let i = 0; i < presentCount; i++) {
      statuses.push('present');
    }
    
    // Add late statuses
    for (let i = 0; i < lateCount; i++) {
      statuses.push('late');
    }
    
    // Add absent statuses
    for (let i = 0; i < absentCount; i++) {
      statuses.push('absent');
    }
    
    // Add excused statuses
    for (let i = 0; i < excusedCount; i++) {
      statuses.push('excused');
    }
    
    // Shuffle the statuses array to randomize the distribution
    for (let i = statuses.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
    }
    
    console.log(`🔄 Shuffled statuses array length: ${statuses.length}`);
    
    // Update records with new statuses
    let updatedCount = 0;
    let presentUpdated = 0;
    let lateUpdated = 0;
    let absentUpdated = 0;
    let excusedUpdated = 0;
    
    for (let i = 0; i < notMarkedRecords.length; i++) {
      const record = notMarkedRecords[i];
      const newStatus = statuses[i];
      
      const updateQuery = `
        UPDATE attendance_logs 
        SET status = $1, 
            recorded_at = NOW()
        WHERE attendance_log_id = $2
      `;
      
      await client.query(updateQuery, [newStatus, record.attendance_log_id]);
      updatedCount++;
      
      // Count by status
      switch (newStatus) {
        case 'present':
          presentUpdated++;
          break;
        case 'late':
          lateUpdated++;
          break;
        case 'absent':
          absentUpdated++;
          break;
        case 'excused':
          excusedUpdated++;
          break;
      }
      
      // Show progress every 100 records
      if (updatedCount % 100 === 0) {
        console.log(`   Updated ${updatedCount}/${totalRecords} records...`);
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} attendance records`);
    console.log(`📊 Actual distribution:`);
    console.log(`   Present: ${presentUpdated} (${Math.round((presentUpdated/totalRecords)*100)}%)`);
    console.log(`   Late: ${lateUpdated} (${Math.round((lateUpdated/totalRecords)*100)}%)`);
    console.log(`   Absent: ${absentUpdated} (${Math.round((absentUpdated/totalRecords)*100)}%)`);
    console.log(`   Excused: ${excusedUpdated} (${Math.round((excusedUpdated/totalRecords)*100)}%)`);
    
    // Verify the update
    const verifyQuery = `
      SELECT COUNT(*) as remaining_not_marked
      FROM attendance_logs
      WHERE status = 'not-marked'
    `;
    
    const verifyResult = await client.query(verifyQuery);
    const remainingNotMarked = verifyResult.rows[0].remaining_not_marked;
    
    console.log(`🔍 Verification: ${remainingNotMarked} not-marked records remaining`);
    
    if (parseInt(remainingNotMarked) === 0) {
      console.log('🎉 All not-marked attendance records have been successfully updated!');
    } else {
      console.log('⚠️  Some not-marked records still remain. Manual review may be needed.');
    }
    
    // Show final summary by status
    const summaryQuery = `
      SELECT status, COUNT(*) as count
      FROM attendance_logs
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const summaryResult = await client.query(summaryQuery);
    
    console.log('\n📈 Final Attendance Status Summary:');
    summaryResult.rows.forEach(row => {
      const percentage = Math.round((row.count / total_records) * 100);
      console.log(`   ${row.status || 'NULL'}: ${row.count} records (${percentage}%)`);
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
    console.log('🚀 Starting realistic attendance update script...\n');
    await updateAttendanceWithRealisticDistribution();
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