const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function debugGradeCalculation() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging Grade Calculation...\n');
    
    const enrollmentId = 1;
    const sectionCourseId = 1;
    
    // Get assessment grades
    console.log('1. Assessment grades:');
    const gradesQuery = `
      SELECT 
        a.assessment_id,
        a.title as assessment_title,
        a.type as assessment_type,
        COALESCE(a.total_points, 10) as total_points,
        sub.submission_id,
        sub.total_score,
        sub.status as submission_status,
        sub.submitted_at,
        sub.remarks,
        ROUND(((sub.total_score * 100.0 / COALESCE(a.total_points, 10))::numeric), 1) as percentage_score
      FROM assessments a
      LEFT JOIN submissions sub ON a.assessment_id = sub.assessment_id AND sub.enrollment_id = $1
      WHERE a.section_course_id = $2
      ORDER BY a.created_at DESC
    `;
    
    const gradesResult = await client.query(gradesQuery, [enrollmentId, sectionCourseId]);
    console.log(`   Found ${gradesResult.rows.length} assessments`);
    
    const validAssessmentGrades = gradesResult.rows.filter(row => row.total_score !== null);
    console.log(`   Valid assessment grades: ${validAssessmentGrades.length}`);
    validAssessmentGrades.forEach(row => {
      console.log(`     ${row.assessment_title}: ${row.percentage_score}%`);
    });
    
    // Get sub-assessment grades
    console.log('\n2. Sub-assessment grades:');
    const subGradesQuery = `
      SELECT 
        sa.sub_assessment_id,
        sa.title as sub_assessment_title,
        sa.total_points,
        sas.submission_id,
        sas.total_score,
        sas.status as submission_status,
        sas.submitted_at,
        sas.remarks,
        CASE 
          WHEN sa.total_points > 0 AND sas.total_score IS NOT NULL 
          THEN ROUND(((sas.total_score * 100.0 / sa.total_points)::numeric), 1)
          ELSE NULL 
        END as percentage_score,
        a.title as parent_assessment_title
      FROM sub_assessments sa
      JOIN assessments a ON sa.assessment_id = a.assessment_id
      LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id AND sas.enrollment_id = $1
      WHERE a.section_course_id = $2
      ORDER BY sa.created_at DESC
    `;
    
    const subGradesResult = await client.query(subGradesQuery, [enrollmentId, sectionCourseId]);
    console.log(`   Found ${subGradesResult.rows.length} sub-assessments`);
    
    const validSubAssessmentGrades = subGradesResult.rows.filter(row => row.total_score !== null);
    console.log(`   Valid sub-assessment grades: ${validSubAssessmentGrades.length}`);
    validSubAssessmentGrades.forEach(row => {
      console.log(`     ${row.sub_assessment_title}: ${row.percentage_score}%`);
    });
    
    // Calculate overall grade
    console.log('\n3. Grade calculation:');
    const allValidGrades = [
      ...validAssessmentGrades.map(row => parseFloat(row.percentage_score) || 0),
      ...validSubAssessmentGrades.map(row => parseFloat(row.percentage_score) || 0)
    ].filter(grade => !isNaN(grade) && grade > 0);
    
    console.log(`   All valid grades: ${allValidGrades.length}`);
    console.log(`   Grades array: [${allValidGrades.join(', ')}]`);
    
    const overallGrade = allValidGrades.length > 0 
      ? allValidGrades.reduce((sum, grade) => sum + grade, 0) / allValidGrades.length 
      : 0;
    
    console.log(`   Overall grade: ${overallGrade}`);
    console.log(`   Rounded grade: ${Math.round(overallGrade * 10) / 10}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugGradeCalculation(); 