const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function checkAttendanceStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking attendance_logs table structure...');
    
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_logs' 
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await client.query(columnsQuery);
    console.log('\n📋 attendance_logs table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking attendance structure:', error);
  } finally {
    client.release();
  }
}

checkAttendanceStructure()
  .then(() => {
    console.log('🎉 Attendance structure check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 