const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function updateNullGrades() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Finding students with null grades...');
    
    // Find all sub-assessment submissions with null total_score
    const nullGradesQuery = `
      SELECT 
        sas.submission_id,
        sas.enrollment_id,
        sas.sub_assessment_id,
        sas.status,
        s.full_name,
        sa.title as sub_assessment_title,
        sa.total_points
      FROM sub_assessment_submissions sas
      JOIN students s ON s.student_id = (
        SELECT student_id FROM course_enrollments WHERE enrollment_id = sas.enrollment_id
      )
      JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id
      WHERE sas.total_score IS NULL
      ORDER BY sas.sub_assessment_id, s.full_name
    `;
    
    const nullGradesResult = await client.query(nullGradesQuery);
    console.log(`📊 Found ${nullGradesResult.rows.length} submissions with null grades`);
    
    if (nullGradesResult.rows.length === 0) {
      console.log('✅ No null grades found! All students are properly graded.');
      return;
    }
    
    // Group by sub-assessment for better organization
    const groupedBySubAssessment = {};
    nullGradesResult.rows.forEach(row => {
      if (!groupedBySubAssessment[row.sub_assessment_id]) {
        groupedBySubAssessment[row.sub_assessment_id] = {
          title: row.sub_assessment_title,
          total_points: row.total_points,
          students: []
        };
      }
      groupedBySubAssessment[row.sub_assessment_id].students.push(row);
    });
    
    console.log('\n📋 Sub-assessments with null grades:');
    Object.keys(groupedBySubAssessment).forEach(subAssessmentId => {
      const data = groupedBySubAssessment[subAssessmentId];
      console.log(`\n  ${data.title} (${data.total_points} points) - ${data.students.length} students:`);
      data.students.forEach(student => {
        console.log(`    - ${student.full_name} (ID: ${student.enrollment_id})`);
      });
    });
    
    // Update grades with realistic scores (87% pass rate)
    console.log('\n🎯 Updating grades with 87% pass rate...');
    
    let totalUpdated = 0;
    let passCount = 0;
    let failCount = 0;
    
    for (const row of nullGradesResult.rows) {
      // Generate realistic score with 87% pass rate
      let totalScore;
      const shouldPass = Math.random() < 0.87; // 87% pass rate
      
      if (shouldPass) {
        // Pass score (75-100% of total points)
        const minPassScore = row.total_points * 0.75;
        const maxScore = row.total_points;
        totalScore = minPassScore + Math.random() * (maxScore - minPassScore);
        passCount++;
      } else {
        // Fail score (50-74% of total points)
        const minFailScore = row.total_points * 0.50;
        const maxFailScore = row.total_points * 0.74;
        totalScore = minFailScore + Math.random() * (maxFailScore - minFailScore);
        failCount++;
      }
      
      // Update the grade
      const updateQuery = `
        UPDATE sub_assessment_submissions 
        SET 
          total_score = $1,
          raw_score = $1,
          adjusted_score = $1,
          status = 'graded',
          graded_at = CURRENT_TIMESTAMP,
          graded_by = 6,
          remarks = $2
        WHERE submission_id = $3
      `;
      
      const remarks = shouldPass 
        ? `Good work on this assignment. Keep up the excellent progress! Graded: ${totalScore.toFixed(1)}/${row.total_points}`
        : `Please review the feedback and improve for next time. Graded: ${totalScore.toFixed(1)}/${row.total_points}`;
      
      await client.query(updateQuery, [totalScore, remarks, row.submission_id]);
      totalUpdated++;
      
      console.log(`  ✅ ${row.full_name}: ${totalScore.toFixed(1)}/${row.total_points} (${shouldPass ? 'PASS' : 'FAIL'})`);
    }
    
    console.log('\n📈 Summary:');
    console.log(`  Total updated: ${totalUpdated}`);
    console.log(`  Passed: ${passCount} (${((passCount/totalUpdated)*100).toFixed(1)}%)`);
    console.log(`  Failed: ${failCount} (${((failCount/totalUpdated)*100).toFixed(1)}%)`);
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const verifyQuery = `
      SELECT COUNT(*) as remaining_null
      FROM sub_assessment_submissions 
      WHERE total_score IS NULL
    `;
    
    const verifyResult = await client.query(verifyQuery);
    const remainingNull = parseInt(verifyResult.rows[0].remaining_null);
    
    if (remainingNull === 0) {
      console.log('✅ All null grades have been successfully updated!');
    } else {
      console.log(`⚠️  ${remainingNull} submissions still have null grades`);
    }
    
    // Show final statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN total_score IS NOT NULL THEN 1 END) as graded_submissions,
        COUNT(CASE WHEN total_score IS NULL THEN 1 END) as ungraded_submissions,
        ROUND(
          COUNT(CASE WHEN total_score IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1
        ) as grading_completion_rate
      FROM sub_assessment_submissions
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log('\n📊 Final Statistics:');
    console.log(`  Total submissions: ${stats.total_submissions}`);
    console.log(`  Graded submissions: ${stats.graded_submissions}`);
    console.log(`  Ungraded submissions: ${stats.ungraded_submissions}`);
    console.log(`  Grading completion rate: ${stats.grading_completion_rate}%`);
    
  } catch (error) {
    console.error('❌ Error updating grades:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
updateNullGrades().catch(console.error); 