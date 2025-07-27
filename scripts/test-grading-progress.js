const { Pool } = require('pg');

// Database configuration - matching the project's database.js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function testGradingProgress() {
  try {
    console.log('🔍 Testing grading progress data...\n');
    
    // Test with a specific sub-assessment
    const subAssessmentId = 1001; // HTML Structure & Semantics
    
    const result = await pool.query(`
      SELECT 
        sas.submission_id,
        sas.enrollment_id,
        sas.sub_assessment_id,
        sas.total_score,
        sas.raw_score,
        sas.adjusted_score,
        sas.status,
        sas.submitted_at,
        sas.graded_at,
        sas.graded_by,
        sas.remarks,
        s.full_name as student_name
      FROM sub_assessment_submissions sas
      LEFT JOIN students s ON s.student_id = (
        SELECT student_id 
        FROM course_enrollments 
        WHERE enrollment_id = sas.enrollment_id
      )
      WHERE sas.sub_assessment_id = $1
      ORDER BY sas.submission_id
      LIMIT 10;
    `, [subAssessmentId]);
    
    console.log(`📊 Sample data for Sub-Assessment ID ${subAssessmentId}:`);
    console.log('='.repeat(80));
    
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Student: ${row.student_name || 'Unknown'}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Total Score: ${row.total_score !== null ? row.total_score.toFixed(1) : 'NULL (Not Graded)'}`);
      console.log(`   Raw Score: ${row.raw_score !== null ? row.raw_score.toFixed(1) : 'NULL'}`);
      console.log(`   Adjusted Score: ${row.adjusted_score !== null ? row.adjusted_score.toFixed(1) : 'NULL'}`);
      console.log(`   Submitted: ${row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : 'N/A'}`);
      console.log(`   Graded: ${row.graded_at ? new Date(row.graded_at).toLocaleDateString() : 'Not Graded'}`);
      console.log(`   Remarks: ${row.remarks || 'None'}`);
    });
    
    // Calculate grading progress manually
    const totalStudents = result.rows.length;
    const gradedStudents = result.rows.filter(row => 
      row.status === 'graded' && row.total_score !== null && row.total_score !== undefined
    ).length;
    const submittedButNotGraded = result.rows.filter(row => 
      row.status === 'submitted' || (row.status === 'graded' && (row.total_score === null || row.total_score === undefined))
    ).length;
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 Grading Progress Summary:');
    console.log(`   Total Students: ${totalStudents}`);
    console.log(`   Graded Students: ${gradedStudents}`);
    console.log(`   Submitted but Not Graded: ${submittedButNotGraded}`);
    console.log(`   Progress: ${totalStudents > 0 ? ((gradedStudents / totalStudents) * 100).toFixed(1) : 0}%`);
    
    // Show how the display status would be calculated
    console.log('\n🎯 Display Status Examples:');
    result.rows.slice(0, 3).forEach((row, index) => {
      const displayStatus = row.status === 'graded' && row.total_score !== null && row.total_score !== undefined 
        ? 'Graded' 
        : row.status === 'submitted' 
        ? 'Submitted (Not Graded)' 
        : 'Not Submitted';
      
      const displayScore = row.total_score !== null && row.total_score !== undefined 
        ? `${row.total_score.toFixed(1)}/25` 
        : 'Not Graded';
      
      console.log(`   ${index + 1}. ${row.student_name || 'Student'}: ${displayStatus} - ${displayScore}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing grading progress:', error.message);
  } finally {
    await pool.end();
  }
}

testGradingProgress(); 