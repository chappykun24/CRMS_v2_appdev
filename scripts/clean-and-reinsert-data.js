const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function cleanAndReinsertData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Cleaning existing sample data...');
    
    // Delete existing sample data in the correct order (respecting foreign keys)
    console.log('  Deleting sub_assessment_submissions...');
    await client.query(`
      DELETE FROM sub_assessment_submissions 
      WHERE sub_assessment_id IN (1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016)
    `);
    
    console.log('  Deleting sub_assessments...');
    await client.query(`
      DELETE FROM sub_assessments 
      WHERE sub_assessment_id IN (1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016)
    `);
    
    console.log('  Deleting assessments...');
    await client.query(`
      DELETE FROM assessments 
      WHERE assessment_id IN (1001, 1002, 1003, 1004)
    `);
    
    console.log('✅ Existing sample data cleaned');
    
    // Get existing students with their enrollment IDs
    console.log('\n👥 Fetching existing students...');
    const studentsResult = await client.query(`
      SELECT s.student_id, s.full_name, s.student_number, ce.enrollment_id
      FROM students s
      JOIN course_enrollments ce ON s.student_id = ce.student_id
      WHERE ce.section_course_id = 1
      ORDER BY s.full_name
    `);
    
    console.log(`Found ${studentsResult.rows.length} students`);
    
    // Create fresh assessments
    console.log('\n📝 Creating fresh assessments...');
    const assessments = [
      {
        id: 1001,
        title: 'Sprint 1: React Native Fundamentals',
        description: 'Introduction to React Native development concepts and basic components',
        type: 'Project',
        total_points: 100,
        weight_percentage: 25
      },
      {
        id: 1002,
        title: 'Sprint 2: Navigation and State Management',
        description: 'Implementing navigation systems and managing application state',
        type: 'Project',
        total_points: 100,
        weight_percentage: 25
      },
      {
        id: 1003,
        title: 'Sprint 3: API Integration and Data Handling',
        description: 'Connecting to external APIs and managing data flow',
        type: 'Project',
        total_points: 100,
        weight_percentage: 25
      },
      {
        id: 1004,
        title: 'Sprint 4: Final Project and Deployment',
        description: 'Complete application development and deployment preparation',
        type: 'Project',
        total_points: 100,
        weight_percentage: 25
      }
    ];
    
    for (const assessment of assessments) {
      await client.query(`
        INSERT INTO assessments (assessment_id, syllabus_id, section_course_id, title, description, type, total_points, weight_percentage, due_date, is_published, is_graded, status, created_by, created_at)
        VALUES ($1, 1, 1, $2, $3, $4, $5, $6, $7, true, false, 'active', 6, CURRENT_TIMESTAMP)
        ON CONFLICT (assessment_id) DO NOTHING;
      `, [
        assessment.id,
        assessment.title,
        assessment.description,
        assessment.type,
        assessment.total_points,
        assessment.weight_percentage,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      ]);
    }
    
    console.log('✅ 4 assessments created');
    
    // Create fresh sub-assessments
    console.log('\n📋 Creating fresh sub-assessments...');
    const subAssessments = [];
    
    // Sprint 1 tasks
    subAssessments.push(
      { id: 1001, assessment_id: 1001, title: 'React Native Setup', description: 'Set up development environment and create first app', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { id: 1002, assessment_id: 1001, title: 'Component Development', description: 'Create reusable components and implement basic UI', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { id: 1003, assessment_id: 1001, title: 'State Management', description: 'Implement local state and props management', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
      { id: 1004, assessment_id: 1001, title: 'Sprint 1 Demo', description: 'Present working application with basic functionality', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) }
    );
    
    // Sprint 2 tasks
    subAssessments.push(
      { id: 1005, assessment_id: 1002, title: 'Navigation Setup', description: 'Implement React Navigation and create screens', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) },
      { id: 1006, assessment_id: 1002, title: 'Context API', description: 'Implement global state management with Context', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000) },
      { id: 1007, assessment_id: 1002, title: 'AsyncStorage', description: 'Implement local data persistence', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000) },
      { id: 1008, assessment_id: 1002, title: 'Sprint 2 Demo', description: 'Present navigation and state management features', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000) }
    );
    
    // Sprint 3 tasks
    subAssessments.push(
      { id: 1009, assessment_id: 1003, title: 'API Integration', description: 'Connect to REST API and fetch data', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000) },
      { id: 1010, assessment_id: 1003, title: 'Data Handling', description: 'Implement data processing and error handling', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000) },
      { id: 1011, assessment_id: 1003, title: 'Forms and Validation', description: 'Create forms with input validation', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 77 * 24 * 60 * 60 * 1000) },
      { id: 1012, assessment_id: 1003, title: 'Sprint 3 Demo', description: 'Present API integration and data handling', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000) }
    );
    
    // Sprint 4 tasks
    subAssessments.push(
      { id: 1013, assessment_id: 1004, title: 'Final Features', description: 'Implement remaining application features', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000) },
      { id: 1014, assessment_id: 1004, title: 'Testing', description: 'Write unit tests and integration tests', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 98 * 24 * 60 * 60 * 1000) },
      { id: 1015, assessment_id: 1004, title: 'Documentation', description: 'Create comprehensive documentation', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 105 * 24 * 60 * 60 * 1000) },
      { id: 1016, assessment_id: 1004, title: 'Final Demo', description: 'Present complete application with all features', total_points: 25, weight_percentage: 25, due_date: new Date(Date.now() + 112 * 24 * 60 * 60 * 1000) }
    );
    
    for (const subAssessment of subAssessments) {
      await client.query(`
        INSERT INTO sub_assessments (sub_assessment_id, assessment_id, title, description, type, total_points, weight_percentage, due_date, instructions, content_data, ilo_codes, status, is_published, is_graded, order_index, created_by, created_at)
        VALUES ($1, $2, $3, $4, 'Task', $5, $6, $7, $8, $9, $10, 'active', true, false, $11, 6, CURRENT_TIMESTAMP)
        ON CONFLICT (sub_assessment_id) DO NOTHING;
      `, [
        subAssessment.id,
        subAssessment.assessment_id,
        subAssessment.title,
        subAssessment.description,
        subAssessment.total_points,
        subAssessment.weight_percentage,
        subAssessment.due_date,
        `Complete the ${subAssessment.title.toLowerCase()} task following the provided guidelines.`,
        JSON.stringify({focus: subAssessment.title.toLowerCase().replace(/\s+/g, '_')}),
        ['ILO1'],
        Math.floor((subAssessment.id - 1001) % 4) + 1,
      ]);
    }
    
    console.log('✅ 16 sub-assessments created');
    
    // Create student submissions with proper grading (90% graded, 87% pass rate)
    console.log('\n📚 Creating student submissions with proper grading...');
    
    let totalSubmissions = 0;
    let gradedSubmissions = 0;
    let passedSubmissions = 0;
    
    for (const student of studentsResult.rows) {
      const enrollmentId = student.enrollment_id; // Use the actual enrollment_id
      
      for (const subAssessment of subAssessments) {
        totalSubmissions++;
        
        // Determine if this student should be graded (90% grading rate)
        const shouldBeGraded = Math.random() < 0.90;
        
        if (shouldBeGraded) {
          gradedSubmissions++;
          
          // Generate realistic score with 87% pass rate
          const shouldPass = Math.random() < 0.87;
          let totalScore;
          
          if (shouldPass) {
            // Pass score (75-100% of total points)
            const minPassScore = subAssessment.total_points * 0.75;
            const maxScore = subAssessment.total_points;
            totalScore = minPassScore + Math.random() * (maxScore - minPassScore);
            passedSubmissions++;
          } else {
            // Fail score (50-74% of total points)
            const minFailScore = subAssessment.total_points * 0.50;
            const maxFailScore = subAssessment.total_points * 0.74;
            totalScore = minFailScore + Math.random() * (maxFailScore - minFailScore);
          }
          
          // Insert submission with grade
          await client.query(`
            INSERT INTO sub_assessment_submissions (
              enrollment_id, sub_assessment_id, submission_type, submission_data,
              total_score, raw_score, adjusted_score, submitted_at, graded_at,
              graded_by, status, remarks
            ) VALUES ($1, $2, 'file', $3, $4, $4, $4, $5, $6, $7, 'graded', $8)
            ON CONFLICT (enrollment_id, sub_assessment_id) DO NOTHING;
          `, [
            enrollmentId,
            subAssessment.id,
            JSON.stringify({files: ['submission.zip'], comments: 'Submitted on time'}),
            totalScore,
            new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            new Date(),
            6, // graded_by
            `Good work on this assignment. Keep up the excellent progress! Graded: ${totalScore.toFixed(1)}/${subAssessment.total_points}`
          ]);
        } else {
          // Insert submission without grade (not graded yet)
          await client.query(`
            INSERT INTO sub_assessment_submissions (
              enrollment_id, sub_assessment_id, submission_type, submission_data,
              submitted_at, status
            ) VALUES ($1, $2, 'file', $3, $4, 'submitted')
            ON CONFLICT (enrollment_id, sub_assessment_id) DO NOTHING;
          `, [
            enrollmentId,
            subAssessment.id,
            JSON.stringify({files: ['submission.zip'], comments: 'Submitted on time'}),
            new Date(Date.now() - 24 * 60 * 60 * 1000)
          ]);
        }
      }
    }
    
    console.log('\n📊 Final Statistics:');
    console.log(`  Total submissions: ${totalSubmissions}`);
    console.log(`  Graded submissions: ${gradedSubmissions} (${((gradedSubmissions/totalSubmissions)*100).toFixed(1)}%)`);
    console.log(`  Passed submissions: ${passedSubmissions} (${((passedSubmissions/gradedSubmissions)*100).toFixed(1)}%)`);
    console.log(`  Failed submissions: ${gradedSubmissions - passedSubmissions} (${(((gradedSubmissions - passedSubmissions)/gradedSubmissions)*100).toFixed(1)}%)`);
    
    console.log('\n✅ Fresh sample data created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
cleanAndReinsertData().catch(console.error); 