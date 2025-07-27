const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function fixStudentScores() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing student scores to have proper decimal formatting...');
    
    // Get all sub-assessment submissions with scores
    const submissionsQuery = `
      SELECT 
        sas.submission_id,
        sas.enrollment_id,
        sas.sub_assessment_id,
        sas.total_score,
        sas.raw_score,
        sas.adjusted_score,
        s.full_name,
        sa.title as sub_assessment_title,
        sa.total_points
      FROM sub_assessment_submissions sas
      JOIN students s ON s.student_id = (
        SELECT student_id FROM course_enrollments WHERE enrollment_id = sas.enrollment_id
      )
      JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id
      WHERE sas.total_score IS NOT NULL
      ORDER BY sas.sub_assessment_id, s.full_name
    `;
    
    const submissionsResult = await client.query(submissionsQuery);
    console.log(`📊 Found ${submissionsResult.rows.length} submissions with scores to fix`);
    
    if (submissionsResult.rows.length === 0) {
      console.log('✅ No scores found to fix!');
      return;
    }
    
    let totalUpdated = 0;
    let wholeNumbers = 0;
    let twoDecimals = 0;
    
    for (const submission of submissionsResult.rows) {
      const currentScore = submission.total_score;
      const maxPoints = submission.total_points;
      
      // Generate a new score with proper formatting that doesn't exceed max points
      let newScore;
      const shouldBeWholeNumber = Math.random() < 0.6; // 60% chance of whole number
      
      if (shouldBeWholeNumber) {
        // Generate whole number score (75-100% of max points for pass, 50-74% for fail)
        const shouldPass = Math.random() < 0.87; // 87% pass rate
        if (shouldPass) {
          // Pass score: 75-100% of max points
          const minPassScore = Math.floor(maxPoints * 0.75);
          const maxPassScore = maxPoints;
          newScore = Math.floor(minPassScore + Math.random() * (maxPassScore - minPassScore + 1));
        } else {
          // Fail score: 50-74% of max points
          const minFailScore = Math.floor(maxPoints * 0.50);
          const maxFailScore = Math.floor(maxPoints * 0.74);
          newScore = Math.floor(minFailScore + Math.random() * (maxFailScore - minFailScore + 1));
        }
        wholeNumbers++;
      } else {
        // Generate score with exactly 2 decimal places
        const shouldPass = Math.random() < 0.87; // 87% pass rate
        if (shouldPass) {
          // Pass score: 75-100% of max points
          const minPassScore = maxPoints * 0.75;
          const maxPassScore = maxPoints;
          newScore = Math.round((minPassScore + Math.random() * (maxPassScore - minPassScore)) * 100) / 100;
        } else {
          // Fail score: 50-74% of max points
          const minFailScore = maxPoints * 0.50;
          const maxFailScore = maxPoints * 0.74;
          newScore = Math.round((minFailScore + Math.random() * (maxFailScore - minFailScore)) * 100) / 100;
        }
        twoDecimals++;
      }
      
      // Ensure the score doesn't exceed max points (safety check)
      newScore = Math.min(newScore, maxPoints);
      
      // Update the submission with the new score
      const updateQuery = `
        UPDATE sub_assessment_submissions 
        SET 
          total_score = $1,
          raw_score = $1,
          adjusted_score = $1,
          remarks = $2
        WHERE submission_id = $3
      `;
      
      const remarks = `Score updated: ${newScore}/${maxPoints}`;
      
      await client.query(updateQuery, [newScore, remarks, submission.submission_id]);
      totalUpdated++;
      
      console.log(`  ✅ ${submission.full_name}: ${currentScore} → ${newScore}/${maxPoints} (${shouldBeWholeNumber ? 'Whole' : '2 Decimals'})`);
    }
    
    console.log('\n📈 Summary:');
    console.log(`  Total updated: ${totalUpdated}`);
    console.log(`  Whole numbers: ${wholeNumbers} (${((wholeNumbers/totalUpdated)*100).toFixed(1)}%)`);
    console.log(`  Two decimals: ${twoDecimals} (${((twoDecimals/totalUpdated)*100).toFixed(1)}%)`);
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const verifyQuery = `
      SELECT 
        COUNT(*) as total_graded,
        COUNT(CASE WHEN total_score = FLOOR(total_score) THEN 1 END) as whole_numbers,
        COUNT(CASE WHEN total_score != FLOOR(total_score) THEN 1 END) as decimal_numbers,
        COUNT(CASE WHEN total_score >= 75 THEN 1 END) as passed,
        COUNT(CASE WHEN total_score < 75 THEN 1 END) as failed
      FROM sub_assessment_submissions 
      WHERE total_score IS NOT NULL
    `;
    
    const verifyResult = await client.query(verifyQuery);
    const stats = verifyResult.rows[0];
    
    console.log('\n📊 Final Statistics:');
    console.log(`  Total graded submissions: ${stats.total_graded}`);
    console.log(`  Whole numbers: ${stats.whole_numbers} (${((stats.whole_numbers/stats.total_graded)*100).toFixed(1)}%)`);
    console.log(`  Decimal numbers: ${stats.decimal_numbers} (${((stats.decimal_numbers/stats.total_graded)*100).toFixed(1)}%)`);
    console.log(`  Passed (≥75): ${stats.passed} (${((stats.passed/stats.total_graded)*100).toFixed(1)}%)`);
    console.log(`  Failed (<75): ${stats.failed} (${((stats.failed/stats.total_graded)*100).toFixed(1)}%)`);
    
    // Show some sample scores
    console.log('\n📋 Sample Scores:');
    const sampleQuery = `
      SELECT 
        s.full_name,
        sa.title as sub_assessment_title,
        sas.total_score,
        sa.total_points
      FROM sub_assessment_submissions sas
      JOIN students s ON s.student_id = (
        SELECT student_id FROM course_enrollments WHERE enrollment_id = sas.enrollment_id
      )
      JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id
      WHERE sas.total_score IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 10
    `;
    
    const sampleResult = await client.query(sampleQuery);
    sampleResult.rows.forEach((row, index) => {
      const scoreType = row.total_score === Math.floor(row.total_score) ? 'Whole' : 'Decimal';
      console.log(`  ${index + 1}. ${row.full_name}: ${row.total_score}/${row.total_points} (${scoreType})`);
    });
    
    console.log('\n✅ Student scores have been updated with proper decimal formatting!');
    
  } catch (error) {
    console.error('❌ Error fixing student scores:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixStudentScores().catch(console.error); 