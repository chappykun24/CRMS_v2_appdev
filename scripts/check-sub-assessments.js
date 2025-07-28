const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function checkSubAssessments() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking sub-assessments table...\n');
    
    // Check if table exists
    console.log('1. Checking if sub_assessments table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sub_assessments'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ sub_assessments table exists');
    } else {
      console.log('❌ sub_assessments table does not exist');
      return;
    }
    
    // Check table structure
    console.log('\n2. Checking table structure...');
    const structureCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sub_assessments'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in sub_assessments:');
    structureCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if sub_assessment_submissions table exists
    console.log('\n3. Checking if sub_assessment_submissions table exists...');
    const submissionsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sub_assessment_submissions'
      );
    `);
    
    if (submissionsTableCheck.rows[0].exists) {
      console.log('✅ sub_assessment_submissions table exists');
    } else {
      console.log('❌ sub_assessment_submissions table does not exist');
      return;
    }
    
    // Check sub_assessment_submissions structure
    console.log('\n4. Checking sub_assessment_submissions structure...');
    const submissionsStructureCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sub_assessment_submissions'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in sub_assessment_submissions:');
    submissionsStructureCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check data
    console.log('\n5. Checking data...');
    const dataCheck = await client.query(`
      SELECT COUNT(*) as sub_assessments_count
      FROM sub_assessments;
    `);
    
    console.log(`Total sub_assessments: ${dataCheck.rows[0].sub_assessments_count}`);
    
    const submissionsDataCheck = await client.query(`
      SELECT COUNT(*) as submissions_count
      FROM sub_assessment_submissions;
    `);
    
    console.log(`Total sub_assessment_submissions: ${submissionsDataCheck.rows[0].submissions_count}`);
    
    // Test the specific query that might be failing
    console.log('\n6. Testing the specific query...');
    try {
      const testQuery = `
        SELECT 
          sa.sub_assessment_id,
          sa.title as sub_assessment_title,
          sa.total_points,
          sas.submission_id,
          sas.total_score,
          sas.status as submission_status,
          sas.submitted_at,
          sas.remarks,
          ROUND(((sas.total_score * 100.0 / sa.total_points)::numeric), 1) as percentage_score,
          a.title as parent_assessment_title
        FROM sub_assessments sa
        JOIN assessments a ON sa.assessment_id = a.assessment_id
        LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id AND sas.enrollment_id = 1
        WHERE a.section_course_id = 1
        ORDER BY sa.created_at DESC
      `;
      
      const testResult = await client.query(testQuery);
      console.log('✅ Query executed successfully');
      console.log(`   Found ${testResult.rows.length} results`);
    } catch (error) {
      console.log('❌ Query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSubAssessments(); 