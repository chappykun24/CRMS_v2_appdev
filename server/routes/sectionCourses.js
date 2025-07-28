const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();

// POST /api/section-courses/assign-instructor (ENHANCED)
router.post('/assign-instructor', async (req, res) => {
  console.log('Assign-instructor body:', req.body);
  const { section_course_id, instructor_id } = req.body;
  if (!section_course_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Update section_courses with instructor assignment
    await client.query(
      'UPDATE section_courses SET instructor_id = $1 WHERE section_course_id = $2',
      [instructor_id, section_course_id]
    );
    
    // 2. If instructor is being assigned (not removed), create initial database structures
    if (instructor_id) {
      // Get course and section information
      const courseInfo = await client.query(`
        SELECT sc.section_course_id, sc.course_id, sc.section_id, sc.term_id,
               c.title AS course_title, c.course_code, c.description,
               s.section_code, s.year_level,
               t.school_year, t.semester
        FROM section_courses sc
        JOIN courses c ON sc.course_id = c.course_id
        JOIN sections s ON sc.section_id = s.section_id
        JOIN school_terms t ON sc.term_id = t.term_id
        WHERE sc.section_course_id = $1
      `, [section_course_id]);
      
      if (courseInfo.rows.length === 0) {
        throw new Error('Section course not found');
      }
      
      const course = courseInfo.rows[0];
      
      // 3. Check if syllabus already exists for this section_course
      const existingSyllabus = await client.query(
        'SELECT syllabus_id FROM syllabi WHERE section_course_id = $1',
        [section_course_id]
      );
      
      if (existingSyllabus.rows.length === 0) {
        // 4. Create draft syllabus with assessment framework
        const syllabusTitle = `${course.course_title} - ${course.section_code}`;
        
        // Create default assessment framework based on course type
        const defaultAssessmentFramework = createDefaultAssessmentFramework(course);
        
        const syllabusResult = await client.query(`
          INSERT INTO syllabi (
            section_course_id, title, description, assessment_framework, 
            grading_policy, course_outline, learning_resources, prerequisites,
            course_objectives, version, is_template, created_by, review_status, approval_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING syllabus_id
        `, [
          section_course_id,
          syllabusTitle,
          course.description || `Syllabus for ${course.course_title}`,
          JSON.stringify(defaultAssessmentFramework),
          JSON.stringify(createDefaultGradingPolicy()),
          `Course outline for ${course.course_title}`,
          [], // learning_resources array
          'Prerequisites will be specified by the instructor',
          `Course objectives for ${course.course_title}`,
          '1.0',
          false,
          instructor_id,
          'draft',
          'pending'
        ]);
        
        const syllabus_id = syllabusResult.rows[0].syllabus_id;
        
        // 5. Create default ILOs for the syllabus
        const defaultILOs = createDefaultILOs(course);
        
        for (const ilo of defaultILOs) {
          await client.query(`
            INSERT INTO ilos (
              syllabus_id, code, description, category, level, 
              weight_percentage, assessment_methods, learning_activities, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            syllabus_id,
            ilo.code,
            ilo.description,
            ilo.category,
            ilo.level,
            ilo.weight_percentage,
            ilo.assessment_methods,
            ilo.learning_activities,
            true
          ]);
        }
        
        // 6. Create initial assessment templates based on the framework
        await createInitialAssessments(client, syllabus_id, defaultAssessmentFramework, instructor_id);
        
        console.log(`Created draft syllabus and initial structures for section_course_id: ${section_course_id}`);
      }
    }
    
    await client.query('COMMIT');
    res.json({ 
      message: instructor_id ? 'Instructor assigned successfully with initial structures created' : 'Assignment removed successfully',
      section_course_id: section_course_id
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in assign-instructor:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    client.release();
  }
});

// Helper function to create default assessment framework
function createDefaultAssessmentFramework(course) {
  const courseTitle = course.course_title.toLowerCase();
  
  // Determine course type based on title
  let assessmentStructure = [];
  
  if (courseTitle.includes('programming') || courseTitle.includes('development') || courseTitle.includes('coding')) {
    assessmentStructure = [
      {
        type: "Quiz",
        count: 5,
        weight_per_assessment: 8,
        total_weight: 40,
        ilo_coverage: ["ILO1", "ILO2"]
      },
      {
        type: "Project",
        count: 2,
        weight_per_assessment: 20,
        total_weight: 40,
        ilo_coverage: ["ILO1", "ILO2", "ILO3"]
      },
      {
        type: "Final Exam",
        count: 1,
        weight_per_assessment: 20,
        total_weight: 20,
        ilo_coverage: ["ILO1", "ILO2", "ILO3", "ILO4"]
      }
    ];
  } else if (courseTitle.includes('research') || courseTitle.includes('thesis') || courseTitle.includes('capstone')) {
    assessmentStructure = [
      {
        type: "Literature Review",
        count: 1,
        weight_per_assessment: 20,
        total_weight: 20,
        ilo_coverage: ["ILO1", "ILO2"]
      },
      {
        type: "Research Proposal",
        count: 1,
        weight_per_assessment: 25,
        total_weight: 25,
        ilo_coverage: ["ILO1", "ILO2", "ILO3"]
      },
      {
        type: "Final Paper",
        count: 1,
        weight_per_assessment: 40,
        total_weight: 40,
        ilo_coverage: ["ILO1", "ILO2", "ILO3", "ILO4"]
      },
      {
        type: "Presentation",
        count: 1,
        weight_per_assessment: 15,
        total_weight: 15,
        ilo_coverage: ["ILO3", "ILO4"]
      }
    ];
  } else {
    // Default structure for other courses
    assessmentStructure = [
      {
        type: "Quiz",
        count: 3,
        weight_per_assessment: 10,
        total_weight: 30,
        ilo_coverage: ["ILO1", "ILO2"]
      },
      {
        type: "Assignment",
        count: 4,
        weight_per_assessment: 12.5,
        total_weight: 50,
        ilo_coverage: ["ILO1", "ILO2", "ILO3"]
      },
      {
        type: "Final Exam",
        count: 1,
        weight_per_assessment: 20,
        total_weight: 20,
        ilo_coverage: ["ILO1", "ILO2", "ILO3", "ILO4"]
      }
    ];
  }
  
  return {
    assessment_structure: assessmentStructure,
    total_weight: 100,
    grading_scale: {
      "A": { min: 93, max: 100 },
      "A-": { min: 90, max: 92.99 },
      "B+": { min: 87, max: 89.99 },
      "B": { min: 83, max: 86.99 },
      "B-": { min: 80, max: 82.99 },
      "C+": { min: 77, max: 79.99 },
      "C": { min: 73, max: 76.99 },
      "C-": { min: 70, max: 72.99 },
      "D+": { min: 67, max: 69.99 },
      "D": { min: 60, max: 66.99 },
      "F": { min: 0, max: 59.99 }
    }
  };
}

// Helper function to create default grading policy
function createDefaultGradingPolicy() {
  return {
    late_submission_policy: {
      "1-7 days": 10,
      "8-14 days": 20,
      "15+ days": 50
    },
    attendance_policy: {
      "required": true,
      "weight": 5,
      "max_absences": 3
    },
    participation_policy: {
      "weight": 5,
      "criteria": ["Class participation", "Group work", "Discussions"]
    },
    academic_integrity: {
      "plagiarism": "Zero tolerance",
      "cheating": "Immediate failure",
      "collaboration": "As specified per assignment"
    }
  };
}

// Helper function to create default ILOs
function createDefaultILOs(course) {
  const courseTitle = course.course_title.toLowerCase();
  
  if (courseTitle.includes('programming') || courseTitle.includes('development')) {
    return [
      {
        code: "ILO1",
        description: "Demonstrate proficiency in programming concepts and problem-solving techniques",
        category: "Knowledge",
        level: "Intermediate",
        weight_percentage: 25,
        assessment_methods: ["Quizzes", "Programming Assignments", "Final Exam"],
        learning_activities: ["Hands-on coding", "Problem-solving exercises", "Code reviews"]
      },
      {
        code: "ILO2",
        description: "Apply software development methodologies and best practices",
        category: "Skills",
        level: "Intermediate",
        weight_percentage: 30,
        assessment_methods: ["Projects", "Code Reviews", "Presentations"],
        learning_activities: ["Group projects", "Code walkthroughs", "Documentation"]
      },
      {
        code: "ILO3",
        description: "Collaborate effectively in team-based development environments",
        category: "Attitudes",
        level: "Basic",
        weight_percentage: 20,
        assessment_methods: ["Group Projects", "Peer Evaluations", "Presentations"],
        learning_activities: ["Team assignments", "Collaborative coding", "Project management"]
      },
      {
        code: "ILO4",
        description: "Evaluate and implement software solutions using appropriate technologies",
        category: "Skills",
        level: "Advanced",
        weight_percentage: 25,
        assessment_methods: ["Final Project", "Technical Presentations", "Final Exam"],
        learning_activities: ["Research projects", "Technology evaluation", "Implementation"]
      }
    ];
  } else if (courseTitle.includes('research') || courseTitle.includes('thesis')) {
    return [
      {
        code: "ILO1",
        description: "Conduct comprehensive literature reviews and research analysis",
        category: "Knowledge",
        level: "Advanced",
        weight_percentage: 25,
        assessment_methods: ["Literature Review", "Research Papers", "Presentations"],
        learning_activities: ["Literature search", "Critical analysis", "Synthesis"]
      },
      {
        code: "ILO2",
        description: "Design and implement research methodologies",
        category: "Skills",
        level: "Advanced",
        weight_percentage: 30,
        assessment_methods: ["Research Proposal", "Methodology Papers", "Final Research"],
        learning_activities: ["Research design", "Data collection", "Analysis"]
      },
      {
        code: "ILO3",
        description: "Communicate research findings effectively",
        category: "Skills",
        level: "Intermediate",
        weight_percentage: 25,
        assessment_methods: ["Presentations", "Research Papers", "Poster Sessions"],
        learning_activities: ["Oral presentations", "Written reports", "Visual aids"]
      },
      {
        code: "ILO4",
        description: "Demonstrate ethical research practices and academic integrity",
        category: "Attitudes",
        level: "Basic",
        weight_percentage: 20,
        assessment_methods: ["Research Ethics", "Peer Reviews", "Final Evaluation"],
        learning_activities: ["Ethics training", "Peer collaboration", "Self-reflection"]
      }
    ];
  } else {
    // Default ILOs for other courses
    return [
      {
        code: "ILO1",
        description: "Demonstrate understanding of fundamental concepts and principles",
        category: "Knowledge",
        level: "Basic",
        weight_percentage: 25,
        assessment_methods: ["Quizzes", "Assignments", "Final Exam"],
        learning_activities: ["Lectures", "Readings", "Discussions"]
      },
      {
        code: "ILO2",
        description: "Apply theoretical knowledge to practical problems",
        category: "Skills",
        level: "Intermediate",
        weight_percentage: 30,
        assessment_methods: ["Assignments", "Projects", "Case Studies"],
        learning_activities: ["Problem-solving", "Practical exercises", "Real-world applications"]
      },
      {
        code: "ILO3",
        description: "Analyze and evaluate complex information and situations",
        category: "Skills",
        level: "Intermediate",
        weight_percentage: 25,
        assessment_methods: ["Case Studies", "Research Papers", "Presentations"],
        learning_activities: ["Critical thinking", "Analysis", "Evaluation"]
      },
      {
        code: "ILO4",
        description: "Communicate ideas and findings effectively",
        category: "Skills",
        level: "Basic",
        weight_percentage: 20,
        assessment_methods: ["Presentations", "Reports", "Discussions"],
        learning_activities: ["Oral presentations", "Written communication", "Collaboration"]
      }
    ];
  }
}

// Helper function to create initial assessments
async function createInitialAssessments(client, syllabus_id, assessmentFramework, instructor_id) {
  const structure = assessmentFramework.assessment_structure;
  
  for (const assessmentType of structure) {
    for (let i = 1; i <= assessmentType.count; i++) {
      const assessmentTitle = `${assessmentType.type} ${i}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i * 7)); // Spread assessments over weeks
      
      await client.query(`
        INSERT INTO assessments (
          syllabus_id, title, description, type, category, total_points,
          weight_percentage, due_date, submission_deadline, is_published,
          grading_method, instructions, content_data, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        syllabus_id,
        assessmentTitle,
        `Default ${assessmentType.type} for assessment framework`,
        assessmentType.type,
        assessmentType.type === 'Final Exam' ? 'Summative' : 'Formative',
        100, // Default total points
        assessmentType.weight_per_assessment,
        dueDate,
        dueDate,
        false, // Not published initially
        'Rubric',
        `Instructions for ${assessmentTitle}`,
        JSON.stringify({ type: assessmentType.type, ilo_coverage: assessmentType.ilo_coverage }),
        'planned',
        instructor_id
      ]);
    }
  }
}

// GET /api/section-courses/courses - get all courses
router.get('/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY title');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/section-courses/sections - get all sections
router.get('/sections', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sections ORDER BY section_code');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/section-courses/school-terms - get all terms
router.get('/school-terms', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM school_terms ORDER BY start_date');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/section-courses/faculty - get all faculty users
router.get('/faculty', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE role_id = 5 ORDER BY name');
    console.log('Faculty query result:', result.rows);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/section-courses/assigned - get all section_courses with assigned faculty
router.get('/assigned', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sc.section_course_id, sc.course_id, sc.section_id, sc.term_id, sc.instructor_id, c.title AS course_title, s.section_code, t.semester, t.school_year, u.name AS faculty_name
      FROM section_courses sc
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN sections s ON sc.section_id = s.section_id
      LEFT JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN users u ON sc.instructor_id = u.user_id
      ORDER BY t.school_year DESC, t.semester DESC, c.title, s.section_code
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/section-courses/:section_course_id/students - get all students enrolled in a section_course
router.get('/:section_course_id/students', async (req, res) => {
  const { section_course_id } = req.params;
  if (!section_course_id) {
    return res.status(400).json({ error: 'Missing section_course_id' });
  }
  try {
    const result = await pool.query(`
      SELECT ce.enrollment_id, s.student_id, s.full_name, s.student_number, ce.enrollment_date, ce.status, s.student_photo
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      WHERE ce.section_course_id = $1
      ORDER BY s.full_name
    `, [section_course_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/section-courses/:section_course_id/sessions - get all sessions for a section_course (simple fields)
router.get('/:section_course_id/sessions', async (req, res) => {
  const { section_course_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT session_id, title, session_date, session_type, meeting_type FROM sessions WHERE section_course_id = $1 ORDER BY session_date`,
      [section_course_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/section-courses/:section_course_id/faculty-assignment-details
router.get('/:section_course_id/faculty-assignment-details', async (req, res) => {
  const { section_course_id } = req.params;
  if (!section_course_id) {
    return res.status(400).json({ error: 'Missing section_course_id' });
  }
  
  try {
    // Get comprehensive assignment details
    const result = await pool.query(`
      SELECT 
        sc.section_course_id,
        sc.course_id,
        sc.section_id,
        sc.term_id,
        sc.instructor_id,
        c.title AS course_title,
        c.course_code,
        c.description AS course_description,
        s.section_code,
        s.year_level,
        t.school_year,
        t.semester,
        u.name AS faculty_name,
        u.email AS faculty_email,
        sy.syllabus_id,
        sy.title AS syllabus_title,
        sy.description AS syllabus_description,
        sy.assessment_framework,
        sy.grading_policy,
        sy.course_outline,
        sy.learning_resources,
        sy.prerequisites,
        sy.course_objectives,
        sy.version AS syllabus_version,
        sy.review_status,
        sy.approval_status,
        sy.created_at AS syllabus_created_at,
        sy.updated_at AS syllabus_updated_at
      FROM section_courses sc
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN sections s ON sc.section_id = s.section_id
      LEFT JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN users u ON sc.instructor_id = u.user_id
      LEFT JOIN syllabi sy ON sc.section_course_id = sy.section_course_id
      WHERE sc.section_course_id = $1
    `, [section_course_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Section course not found' });
    }
    
    const assignmentData = result.rows[0];
    
    // Get ILOs for this syllabus
    let ilos = [];
    if (assignmentData.syllabus_id) {
      const ilosResult = await pool.query(`
        SELECT 
          ilo_id,
          code,
          description,
          category,
          level,
          weight_percentage,
          assessment_methods,
          learning_activities,
          is_active,
          created_at,
          updated_at
        FROM ilos 
        WHERE syllabus_id = $1 
        ORDER BY code
      `, [assignmentData.syllabus_id]);
      ilos = ilosResult.rows;
    }
    
    // Get assessments for this syllabus
    let assessments = [];
    if (assignmentData.syllabus_id) {
      const assessmentsResult = await pool.query(`
        SELECT 
          assessment_id,
          title,
          description,
          type,
          category,
          total_points,
          weight_percentage,
          due_date,
          submission_deadline,
          is_published,
          grading_method,
          instructions,
          content_data,
          status,
          created_at,
          updated_at
        FROM assessments 
        WHERE syllabus_id = $1 
        ORDER BY due_date, title
      `, [assignmentData.syllabus_id]);
      assessments = assessmentsResult.rows;
    }
    
    // Get rubrics for this syllabus
    let rubrics = [];
    if (assignmentData.syllabus_id) {
      const rubricsResult = await pool.query(`
        SELECT 
          r.rubric_id,
          r.title,
          r.description,
          r.criterion,
          r.max_score,
          r.rubric_type,
          r.performance_levels,
          r.criteria_order,
          r.is_active,
          r.created_at,
          r.updated_at,
          i.code AS ilo_code,
          a.title AS assessment_title
        FROM rubrics r
        LEFT JOIN ilos i ON r.ilo_id = i.ilo_id
        LEFT JOIN assessments a ON r.assessment_id = a.assessment_id
        WHERE r.syllabus_id = $1 
        ORDER BY r.criteria_order, r.title
      `, [assignmentData.syllabus_id]);
      rubrics = rubricsResult.rows;
    }
    
    // Get student enrollment count
    const enrollmentResult = await pool.query(`
      SELECT COUNT(*) as student_count
      FROM course_enrollments 
      WHERE section_course_id = $1 AND status = 'enrolled'
    `, [section_course_id]);
    
    const studentCount = enrollmentResult.rows[0]?.student_count || 0;
    
    res.json({
      assignment: assignmentData,
      ilos: ilos,
      assessments: assessments,
      rubrics: rubrics,
      student_count: studentCount,
      summary: {
        total_ilos: ilos.length,
        total_assessments: assessments.length,
        total_rubrics: rubrics.length,
        syllabus_status: assignmentData.review_status,
        approval_status: assignmentData.approval_status
      }
    });
  } catch (err) {
    console.error('Error fetching faculty assignment details:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/section-courses/faculty/:instructor_id/assignments
router.get('/faculty/:instructor_id/assignments', async (req, res) => {
  const { instructor_id } = req.params;
  if (!instructor_id) {
    return res.status(400).json({ error: 'Missing instructor_id' });
  }
  
  try {
    const result = await pool.query(`
      SELECT 
        sc.section_course_id,
        sc.course_id,
        sc.section_id,
        sc.term_id,
        c.title AS course_title,
        c.course_code,
        s.section_code,
        s.year_level,
        t.school_year,
        t.semester,
        sy.syllabus_id,
        sy.title AS syllabus_title,
        sy.review_status,
        sy.approval_status,
        sy.created_at AS syllabus_created_at,
        (SELECT COUNT(*) FROM ilos WHERE syllabus_id = sy.syllabus_id) as ilo_count,
        (SELECT COUNT(*) FROM assessments WHERE syllabus_id = sy.syllabus_id) as assessment_count,
        (SELECT COUNT(*) FROM course_enrollments WHERE section_course_id = sc.section_course_id AND status = 'enrolled') as student_count
      FROM section_courses sc
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN sections s ON sc.section_id = s.section_id
      LEFT JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN syllabi sy ON sc.section_course_id = sy.section_course_id
      WHERE sc.instructor_id = $1
      ORDER BY t.school_year DESC, t.semester DESC, c.title, s.section_code
    `, [instructor_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching faculty assignments:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/section-courses/:section_course_id/sessions - create a new session for a section_course
router.post('/:section_course_id/sessions', async (req, res) => {
  console.log('--- Create Session Request ---');
  const { section_course_id } = req.params;
  const { date, title, session_type, meeting_type } = req.body;
  console.log('section_course_id:', section_course_id);
  console.log('Request body:', req.body);
  if (!section_course_id || !date || !title) {
    console.log('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Insert the new session
    console.log('Inserting into sessions...');
    const sessionRes = await pool.query(
      `INSERT INTO sessions (section_course_id, title, session_date, session_type, meeting_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING session_id`,
      [section_course_id, title, date, session_type, meeting_type]
    );
    const session_id = sessionRes.rows[0].session_id;
    console.log('Inserted session_id:', session_id);

    // Get all enrollments for this section_course
    console.log('Fetching enrollments...');
    const enrollmentsRes = await pool.query(
      'SELECT enrollment_id FROM course_enrollments WHERE section_course_id = $1 AND status = $2',
      [section_course_id, 'enrolled']
    );
    const enrollments = enrollmentsRes.rows;
    console.log('Enrollments:', enrollments);

    // Insert an attendance log for each student for the new session
    console.log('Inserting attendance logs...');
    const insertPromises = enrollments.map(e =>
      pool.query(
        'INSERT INTO attendance_logs (enrollment_id, session_id, status) VALUES ($1, $2, $3)',
        [e.enrollment_id, session_id, 'not-marked']
      )
    );
    await Promise.all(insertPromises);
    console.log('Attendance logs inserted.');

    res.status(201).json({ message: 'Session created and attendance logs initialized.' });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PUT /api/section-courses/:section_course_id/sessions/:session_id/attendance/:enrollment_id - update attendance status and remarks
router.put('/:section_course_id/sessions/:session_id/attendance/:enrollment_id', async (req, res) => {
  console.log('--- Attendance Update Request ---');
  const { section_course_id, session_id, enrollment_id } = req.params;
  const { status, remarks } = req.body;
  console.log('Params:', { section_course_id, session_id, enrollment_id });
  console.log('Body:', { status, remarks });
  
  if (!status) {
    console.log('Missing status in request');
    return res.status(400).json({ error: 'Missing status' });
  }
  
  try {
    // First, check if the attendance log exists
    console.log('Checking if attendance log exists...');
    const checkResult = await pool.query(
      'SELECT * FROM attendance_logs WHERE session_id = $1 AND enrollment_id = $2',
      [session_id, enrollment_id]
    );
    console.log('Existing attendance log:', checkResult.rows[0]);
    
    if (checkResult.rowCount === 0) {
      console.log('No existing attendance log found, creating new one...');
      // Create a new attendance log if it doesn't exist
      const insertResult = await pool.query(
        `INSERT INTO attendance_logs (enrollment_id, session_id, status, remarks, recorded_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [enrollment_id, session_id, status, remarks || null]
      );
      console.log('Created new attendance log:', insertResult.rows[0]);
      res.json({ message: 'Attendance created', attendance: insertResult.rows[0] });
    } else {
      console.log('Updating existing attendance log...');
      // Update attendance_logs for the given session and enrollment
      const result = await pool.query(
        `UPDATE attendance_logs SET status = $1, remarks = $2, recorded_at = NOW()
         WHERE session_id = $3 AND enrollment_id = $4 RETURNING *`,
        [status, remarks || null, session_id, enrollment_id]
      );
      console.log('Updated attendance log:', result.rows[0]);
      res.json({ message: 'Attendance updated', attendance: result.rows[0] });
    }
  } catch (err) {
    console.error('Error in attendance update:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/section-courses/:section_course_id/sessions/:session_id/attendance
router.get('/:section_course_id/sessions/:session_id/attendance', async (req, res) => {
  const { section_course_id, session_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        ce.enrollment_id,
        s.student_id,
        s.full_name,
        s.student_number,
        s.student_photo,
        COALESCE(al.status, 'not-marked') as attendance_status
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      LEFT JOIN attendance_logs al
        ON al.enrollment_id = ce.enrollment_id AND al.session_id = $2
      WHERE ce.section_course_id = $1
      ORDER BY s.full_name
    `, [section_course_id, session_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 