const { Pool } = require('pg');

// Database configuration - matching the project's database.js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function verifySampleData() {
  try {
    console.log('🔍 Verifying sample data creation...\n');
    
    // Check assessments
    const assessmentsResult = await pool.query(`
      SELECT assessment_id, title, type, category, total_points, weight_percentage
      FROM assessments 
      WHERE assessment_id BETWEEN 1001 AND 1004
      ORDER BY assessment_id;
    `);
    
    console.log('📝 AppDev Assessments:');
    assessmentsResult.rows.forEach(row => {
      console.log(`  - ${row.assessment_id}: ${row.title} (${row.type}, ${row.category}) - ${row.total_points}pts (${row.weight_percentage}%)`);
    });
    
    // Check sub-assessments
    const subAssessmentsResult = await pool.query(`
      SELECT sub_assessment_id, assessment_id, title, total_points, weight_percentage, is_graded
      FROM sub_assessments 
      WHERE sub_assessment_id BETWEEN 1001 AND 1016
      ORDER BY assessment_id, order_index;
    `);
    
    console.log('\n📋 AppDev Sub-Assessments:');
    subAssessmentsResult.rows.forEach(row => {
      console.log(`  - ${row.sub_assessment_id}: ${row.title} (Assessment ${row.assessment_id}) - ${row.total_points}pts (${row.weight_percentage}%) - Graded: ${row.is_graded}`);
    });
    
    // Check student enrollments
    const enrollmentsResult = await pool.query(`
      SELECT COUNT(*) as enrollment_count
      FROM course_enrollments 
      WHERE section_course_id = 1001;
    `);
    
    console.log(`\n👥 Students enrolled in AppDev: ${enrollmentsResult.rows[0].enrollment_count}`);
    
    // Check submissions and grading progress
    const submissionsResult = await pool.query(`
      SELECT 
        sa.sub_assessment_id,
        sa.title,
        COUNT(sas.submission_id) as total_submissions,
        COUNT(CASE WHEN sas.status = 'graded' THEN 1 END) as graded_submissions
      FROM sub_assessments sa
      LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id
      WHERE sa.sub_assessment_id BETWEEN 1001 AND 1016
      GROUP BY sa.sub_assessment_id, sa.title
      ORDER BY sa.assessment_id, sa.order_index;
    `);
    
    console.log('\n📊 Grading Progress for Each Sub-Assessment:');
    submissionsResult.rows.forEach(row => {
      const gradingProgress = row.total_submissions > 0 ? (row.graded_submissions / row.total_submissions) * 100 : 0;
      const progressBar = '█'.repeat(Math.floor(gradingProgress / 10)) + '░'.repeat(10 - Math.floor(gradingProgress / 10));
      console.log(`  - ${row.sub_assessment_id}: ${row.title}`);
      console.log(`    Progress: ${progressBar} ${gradingProgress.toFixed(1)}% (${row.graded_submissions}/${row.total_submissions} students)`);
    });
    
    // Check pass rate
    const passRateResult = await pool.query(`
      SELECT 
        COUNT(*) as total_graded,
        COUNT(CASE WHEN total_score >= 75 THEN 1 END) as passed
      FROM sub_assessment_submissions 
      WHERE status = 'graded' AND sub_assessment_id BETWEEN 1001 AND 1016;
    `);
    
    const passRate = passRateResult.rows[0];
    const passRatePercentage = passRate.total_graded > 0 ? (passRate.passed / passRate.total_graded) * 100 : 0;
    console.log(`\n📈 Overall Statistics:`);
    console.log(`  - Total graded submissions: ${passRate.total_graded}`);
    console.log(`  - Passed submissions: ${passRate.passed}`);
    console.log(`  - Pass rate: ${passRatePercentage.toFixed(1)}%`);
    
    console.log('\n✅ Sample data verification complete!');
    console.log('🎯 You can now test the progress bars in your Assessment Management page!');
    
  } catch (error) {
    console.error('❌ Error verifying sample data:', error.message);
  } finally {
    await pool.end();
  }
}

verifySampleData(); 