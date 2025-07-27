const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function checkColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking table columns...');
    
    // Check assessments table columns
    const assessmentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'assessments'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Assessments table columns:');
    assessmentColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Check syllabi table columns
    const syllabiColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'syllabi'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Syllabi table columns:');
    syllabiColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Check ilos table columns
    const ilosColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ilos'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 ILOs table columns:');
    ilosColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Check sub_assessments table columns
    const subAssessmentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sub_assessments'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Sub_Assessments table columns:');
    subAssessmentColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Column check failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumns(); 