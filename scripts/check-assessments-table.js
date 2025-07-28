const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function checkAssessmentsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking assessments table structure...\n');
    
    // Check assessments table structure
    const tableInfoQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'assessments' 
      ORDER BY ordinal_position
    `;
    
    const tableInfoResult = await client.query(tableInfoQuery);
    console.log('Assessments table columns:');
    tableInfoResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check if there are any assessments
    const countQuery = `SELECT COUNT(*) as count FROM assessments`;
    const countResult = await client.query(countQuery);
    console.log(`\nTotal assessments: ${countResult.rows[0].count}`);
    
    if (countResult.rows[0].count > 0) {
      // Show sample assessment data
      const sampleQuery = `SELECT * FROM assessments LIMIT 3`;
      const sampleResult = await client.query(sampleQuery);
      console.log('\nSample assessment data:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`  Assessment ${index + 1}:`, row);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking assessments table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAssessmentsTable(); 