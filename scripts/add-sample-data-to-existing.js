const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration - matching the project's database.js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function addSampleDataToExisting() {
  try {
    console.log('🚀 Adding sample data to existing AppDev course...\n');
    
    // Get existing AppDev course and syllabus
    const courseResult = await pool.query(`
      SELECT course_id, title, course_code 
      FROM courses 
      WHERE course_id = 196;
    `);
    
    const syllabusResult = await pool.query(`
      SELECT syllabus_id, title, created_by 
      FROM syllabi 
      WHERE syllabus_id = 1;
    `);
    
    if (courseResult.rows.length === 0) {
      console.log('❌ AppDev course (ID: 196) not found');
      return;
    }
    
    if (syllabusResult.rows.length === 0) {
      console.log('❌ AppDev syllabus (ID: 1) not found');
      return;
    }
    
    const course = courseResult.rows[0];
    const syllabus = syllabusResult.rows[0];
    
    console.log(`📚 Using existing course: ${course.title} (${course.course_code})`);
    console.log(`📖 Using existing syllabus: ${syllabus.title}\n`);
    
    // Create section course for AppDev if it doesn't exist
    const sectionCourseResult = await pool.query(`
      INSERT INTO section_courses (section_course_id, course_id, instructor_id)
      VALUES (1001, 196, 6)
      ON CONFLICT (section_course_id) DO NOTHING
      RETURNING section_course_id;
    `);
    
    console.log('✅ Section course created/verified');
    
    // Get existing students and enroll them in the AppDev course
    const studentsResult = await pool.query(`
      SELECT student_id, student_number, full_name 
      FROM students 
      ORDER BY student_id 
      LIMIT 30;
    `);
    
    console.log(`👥 Found ${studentsResult.rows.length} students to enroll`);
    
    // Enroll students in the AppDev course
    for (const student of studentsResult.rows) {
      await pool.query(`
        INSERT INTO course_enrollments (enrollment_id, student_id, section_course_id, enrollment_date, status)
        VALUES (${student.student_id + 1000}, ${student.student_id}, 1001, CURRENT_TIMESTAMP, 'enrolled')
        ON CONFLICT (enrollment_id) DO NOTHING;
      `);
    }
    
    console.log('✅ Students enrolled in AppDev course');
    
    // Create 4 new assessments for AppDev
    const assessments = [
      {
        id: 1001,
        title: 'Web Development Fundamentals',
        description: 'Introduction to modern web development using HTML5, CSS3, and JavaScript',
        type: 'Project',
        category: 'Formative',
        total_points: 100,
        weight_percentage: 25,
        due_date: '2024-03-15 23:59:00'
      },
      {
        id: 1002,
        title: 'React Application Development',
        description: 'Build a single-page application using React.js with modern state management',
        type: 'Project',
        category: 'Formative',
        total_points: 100,
        weight_percentage: 30,
        due_date: '2024-04-15 23:59:00'
      },
      {
        id: 1003,
        title: 'Backend API Development',
        description: 'Create RESTful APIs using Node.js and Express with database integration',
        type: 'Project',
        category: 'Summative',
        total_points: 100,
        weight_percentage: 25,
        due_date: '2024-05-15 23:59:00'
      },
      {
        id: 1004,
        title: 'Full-Stack Application',
        description: 'Complete full-stack application with frontend, backend, and database',
        type: 'Project',
        category: 'Summative',
        total_points: 100,
        weight_percentage: 20,
        due_date: '2024-06-15 23:59:00'
      }
    ];
    
    for (const assessment of assessments) {
      await pool.query(`
        INSERT INTO assessments (assessment_id, syllabus_id, section_course_id, title, description, type, category, total_points, weight_percentage, due_date, submission_deadline, is_published, is_graded, grading_method, instructions, content_data, status, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, true, true, 'Rubric', $11, $12, 'graded', $13, CURRENT_TIMESTAMP)
        ON CONFLICT (assessment_id) DO NOTHING;
      `, [
        assessment.id,
        1, // syllabus_id
        1001, // section_course_id
        assessment.title,
        assessment.description,
        assessment.type,
        assessment.category,
        assessment.total_points,
        assessment.weight_percentage,
        assessment.due_date,
        `Create a ${assessment.title.toLowerCase()} project`,
        JSON.stringify({type: assessment.title.toLowerCase().replace(/\s+/g, '_'), technologies: ['Modern Web Technologies']}),
        6 // created_by (instructor)
      ]);
    }
    
    console.log('✅ 4 assessments created');
    
    // Create 4 sub-assessments for each assessment (16 total)
    const subAssessments = [
      // Assessment 1: Web Development Fundamentals
      {id: 1001, assessment_id: 1001, title: 'HTML Structure & Semantics', description: 'Create semantic HTML structure for a modern website', due_date: '2024-03-01 23:59:00'},
      {id: 1002, assessment_id: 1001, title: 'CSS Styling & Layout', description: 'Implement responsive CSS styling using Flexbox and Grid', due_date: '2024-03-05 23:59:00'},
      {id: 1003, assessment_id: 1001, title: 'JavaScript Functionality', description: 'Add interactive features using vanilla JavaScript', due_date: '2024-03-10 23:59:00'},
      {id: 1004, assessment_id: 1001, title: 'Website Integration', description: 'Combine all components into a complete website', due_date: '2024-03-15 23:59:00'},
      
      // Assessment 2: React Application Development
      {id: 1005, assessment_id: 1002, title: 'React Components', description: 'Create reusable React components with proper props', due_date: '2024-04-01 23:59:00'},
      {id: 1006, assessment_id: 1002, title: 'State Management', description: 'Implement state management using React hooks', due_date: '2024-04-05 23:59:00'},
      {id: 1007, assessment_id: 1002, title: 'Routing & Navigation', description: 'Add client-side routing using React Router', due_date: '2024-04-10 23:59:00'},
      {id: 1008, assessment_id: 1002, title: 'API Integration', description: 'Connect React app to backend APIs', due_date: '2024-04-15 23:59:00'},
      
      // Assessment 3: Backend API Development
      {id: 1009, assessment_id: 1003, title: 'Express Server Setup', description: 'Set up Express.js server with basic routing', due_date: '2024-05-01 23:59:00'},
      {id: 1010, assessment_id: 1003, title: 'Database Design', description: 'Design and implement MongoDB schema', due_date: '2024-05-05 23:59:00'},
      {id: 1011, assessment_id: 1003, title: 'RESTful API Endpoints', description: 'Implement CRUD operations for API endpoints', due_date: '2024-05-10 23:59:00'},
      {id: 1012, assessment_id: 1003, title: 'Authentication & Security', description: 'Add JWT authentication and security measures', due_date: '2024-05-15 23:59:00'},
      
      // Assessment 4: Full-Stack Application
      {id: 1013, assessment_id: 1004, title: 'Project Planning', description: 'Plan and design the full-stack application architecture', due_date: '2024-06-01 23:59:00'},
      {id: 1014, assessment_id: 1004, title: 'Frontend Development', description: 'Develop the complete React frontend', due_date: '2024-06-05 23:59:00'},
      {id: 1015, assessment_id: 1004, title: 'Backend Development', description: 'Develop the complete Node.js backend', due_date: '2024-06-10 23:59:00'},
      {id: 1016, assessment_id: 1004, title: 'Deployment & Testing', description: 'Deploy and test the complete application', due_date: '2024-06-15 23:59:00'}
    ];
    
    for (const subAssessment of subAssessments) {
      await pool.query(`
        INSERT INTO sub_assessments (sub_assessment_id, assessment_id, title, description, type, total_points, weight_percentage, due_date, instructions, content_data, ilo_codes, status, is_published, is_graded, order_index, created_by, created_at)
        VALUES ($1, $2, $3, $4, 'Task', 25, 25, $5, $6, $7, $8, 'graded', true, true, $9, $10, CURRENT_TIMESTAMP)
        ON CONFLICT (sub_assessment_id) DO NOTHING;
      `, [
        subAssessment.id,
        subAssessment.assessment_id,
        subAssessment.title,
        subAssessment.description,
        subAssessment.due_date,
        `Complete the ${subAssessment.title.toLowerCase()} task`,
        JSON.stringify({focus: subAssessment.title.toLowerCase().replace(/\s+/g, '_')}),
        ['ILO1'], // Default ILO codes
        Math.floor((subAssessment.id - 1001) % 4) + 1, // order_index
        6 // created_by
      ]);
    }
    
    console.log('✅ 16 sub-assessments created');
    
    // Create student submissions and grades
    // 90% of students are graded (27 out of 30 students)
    // 87% pass rate means 23-24 students pass out of 27 graded students
    let passCount = 0;
    let gradedCount = 0;
    const targetPassed = 24; // 87% of 27 graded students
    const targetGraded = 27; // 90% of 30 students
    
    for (const student of studentsResult.rows) {
      const enrollmentId = student.student_id + 1000;
      
      for (const subAssessment of subAssessments) {
        // Determine if this student should be graded (90% grading rate)
        const isGraded = gradedCount < targetGraded;
        
        if (isGraded) {
          gradedCount++;
          
          // Generate realistic score with 87% pass rate
          let totalScore;
          if (passCount < targetPassed) {
            // Pass score (75-100)
            totalScore = 75 + Math.random() * 25;
            passCount++;
          } else {
            // Fail score (50-74)
            totalScore = 50 + Math.random() * 24;
          }
          
          // Insert submission with grade
          await pool.query(`
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
            `Good work on this assignment. Keep up the excellent progress! Graded: ${totalScore.toFixed(1)}/25`
          ]);
        } else {
          // Insert submission without grade (not graded yet)
          await pool.query(`
            INSERT INTO sub_assessment_submissions (
              enrollment_id, sub_assessment_id, submission_type, submission_data,
              submitted_at, status
            ) VALUES ($1, $2, 'file', $3, $4, 'submitted')
            ON CONFLICT (enrollment_id, sub_assessment_id) DO NOTHING;
          `, [
            enrollmentId,
            subAssessment.id,
            JSON.stringify({files: ['submission.zip'], comments: 'Submitted on time'}),
            new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
          ]);
        }
      }
    }
    
    console.log('✅ Student submissions and grades created');
    
    // Update sub-assessment grading status
    await pool.query(`
      UPDATE sub_assessments 
      SET is_graded = true 
      WHERE sub_assessment_id BETWEEN 1001 AND 1016;
    `);
    
    console.log('✅ Sub-assessment grading status updated');
    
    console.log('\n🎉 Sample data successfully added to existing AppDev course!');
    console.log('\n📊 Summary:');
    console.log(`  - Course: ${course.title} (${course.course_code})`);
    console.log(`  - Students enrolled: ${studentsResult.rows.length}`);
    console.log(`  - Assessments created: ${assessments.length}`);
    console.log(`  - Sub-assessments created: ${subAssessments.length}`);
    console.log(`  - Students graded: ${gradedCount} (${((gradedCount/studentsResult.rows.length)*100).toFixed(1)}%)`);
    console.log(`  - Pass rate: ${((passCount/gradedCount)*100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  } finally {
    await pool.end();
  }
}

addSampleDataToExisting(); 