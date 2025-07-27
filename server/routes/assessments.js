console.log('Assessments router loaded');

const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();

// GET /api/assessments/faculty/:facultyId - Get all assessments for a faculty member
router.get('/faculty/:facultyId', async (req, res) => {
  const { facultyId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        a.assessment_id,
        a.syllabus_id,
        a.section_course_id,
        a.title,
        a.description,
        a.type,
        a.category,
        a.total_points,
        a.weight_percentage,
        a.due_date,
        a.submission_deadline,
        a.is_published,
        a.is_graded,
        a.grading_method,
        a.instructions,
        a.content_data,
        a.ilo_codes,
        a.assessment_structure,
        a.rubric_criteria,
        a.status,
        a.total_submissions,
        a.graded_submissions,
        a.created_at,
        a.updated_at,
        s.title as syllabus_title,
        c.title as course_title,
        c.course_code,
        sc.room_assignment,
        sc.schedule,
        u.name as instructor_name
      FROM assessments a
      LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
      LEFT JOIN section_courses sc ON a.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN users u ON sc.instructor_id = u.user_id
      WHERE a.created_by = $1
      ORDER BY a.created_at DESC
    `;
    
    const result = await client.query(query, [facultyId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/assessments/syllabus/:syllabusId - Get all assessments for a syllabus
router.get('/syllabus/:syllabusId', async (req, res) => {
  const { syllabusId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        a.assessment_id,
        a.syllabus_id,
        a.section_course_id,
        a.title,
        a.description,
        a.type,
        a.category,
        a.total_points,
        a.weight_percentage,
        a.due_date,
        a.submission_deadline,
        a.is_published,
        a.is_graded,
        a.grading_method,
        a.instructions,
        a.content_data,
        a.ilo_codes,
        a.assessment_structure,
        a.rubric_criteria,
        a.status,
        a.total_submissions,
        a.graded_submissions,
        a.created_at,
        a.updated_at,
        s.title as syllabus_title,
        c.title as course_title,
        c.course_code
      FROM assessments a
      LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
      LEFT JOIN section_courses sc ON a.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      WHERE a.syllabus_id = $1
      ORDER BY a.created_at DESC
    `;
    
    const result = await client.query(query, [syllabusId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching syllabus assessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/assessments/:id - Get a specific assessment with details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        a.*,
        s.title as syllabus_title,
        c.title as course_title,
        c.course_code,
        u.name as instructor_name,
        (SELECT COUNT(*) FROM sub_assessments sa WHERE sa.assessment_id = a.assessment_id) as sub_assessment_count,
        (SELECT COUNT(*) FROM sub_assessments sa WHERE sa.assessment_id = a.assessment_id AND sa.is_published = true) as published_sub_assessments,
        (SELECT COUNT(*) FROM sub_assessments sa WHERE sa.assessment_id = a.assessment_id AND sa.is_graded = true) as graded_sub_assessments
      FROM assessments a
      LEFT JOIN syllabi s ON a.syllabus_id = s.syllabus_id
      LEFT JOIN section_courses sc ON a.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN users u ON sc.instructor_id = u.user_id
      WHERE a.assessment_id = $1
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/assessments - Create a new assessment
router.post('/', async (req, res) => {
  const {
    syllabus_id,
    section_course_id,
    title,
    description,
    type,
    category,
    total_points,
    weight_percentage,
    due_date,
    submission_deadline,
    grading_method,
    instructions,
    content_data,
    ilo_codes,
    assessment_structure,
    rubric_criteria,
    created_by
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO assessments (
        syllabus_id, section_course_id, title, description, type, category,
        total_points, weight_percentage, due_date, submission_deadline,
        grading_method, instructions, content_data, ilo_codes,
        assessment_structure, rubric_criteria, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING assessment_id
    `;
    
    const values = [
      syllabus_id, section_course_id, title, description, type, category,
      total_points, weight_percentage, due_date, submission_deadline,
      grading_method, instructions, content_data, ilo_codes,
      assessment_structure, rubric_criteria, created_by
    ];
    
    const result = await client.query(query, values);
    res.status(201).json({ 
      assessment_id: result.rows[0].assessment_id,
      message: 'Assessment created successfully' 
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/assessments/:id - Update an assessment
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    type,
    category,
    total_points,
    weight_percentage,
    due_date,
    submission_deadline,
    grading_method,
    instructions,
    content_data,
    ilo_codes,
    assessment_structure,
    rubric_criteria
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE assessments SET
        title = $1, description = $2, type = $3, category = $4,
        total_points = $5, weight_percentage = $6, due_date = $7,
        submission_deadline = $8, grading_method = $9, instructions = $10,
        content_data = $11, ilo_codes = $12, assessment_structure = $13,
        rubric_criteria = $14, updated_at = CURRENT_TIMESTAMP
      WHERE assessment_id = $15
      RETURNING assessment_id
    `;
    
    const values = [
      title, description, type, category, total_points, weight_percentage,
      due_date, submission_deadline, grading_method, instructions,
      content_data, ilo_codes, assessment_structure, rubric_criteria, id
    ];
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json({ message: 'Assessment updated successfully' });
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/assessments/:id/publish - Publish an assessment
router.put('/:id/publish', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE assessments SET
        is_published = true,
        status = 'active',
        updated_at = CURRENT_TIMESTAMP
      WHERE assessment_id = $1
      RETURNING assessment_id
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json({ message: 'Assessment published successfully' });
  } catch (error) {
    console.error('Error publishing assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/assessments/:id - Delete an assessment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = 'DELETE FROM assessments WHERE assessment_id = $1 RETURNING assessment_id';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/assessments/:id/students-with-grades - Get students with grades for an assessment
router.get('/:id/students-with-grades', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        ce.enrollment_id,
        s.student_id,
        s.student_number,
        s.full_name,
        s.contact_email,
        sub.submission_id,
        sub.submission_type,
        sub.submitted_at,
        sub.total_score,
        sub.raw_score,
        sub.adjusted_score,
        sub.late_penalty,
        sub.status,
        sub.feedback,
        sub.remarks,
        u.name as graded_by_name,
        sub.graded_at
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      LEFT JOIN submissions sub ON ce.enrollment_id = sub.enrollment_id AND sub.assessment_id = $1
      LEFT JOIN users u ON sub.graded_by = u.user_id
      WHERE ce.section_course_id = (
        SELECT section_course_id FROM assessments WHERE assessment_id = $1
      )
      ORDER BY s.full_name
    `;
    
    const result = await client.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students with grades:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/assessments/:id/submissions - Create a new submission
router.post('/:id/submissions', async (req, res) => {
  const { id } = req.params;
  const {
    enrollment_id,
    submission_type,
    submission_data,
    file_urls
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO submissions (
        enrollment_id, assessment_id, submission_type, submission_data, file_urls
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING submission_id
    `;
    
    const values = [enrollment_id, id, submission_type, submission_data, file_urls];
    const result = await client.query(query, values);
    
    res.status(201).json({ 
      submission_id: result.rows[0].submission_id,
      message: 'Submission created successfully' 
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/assessments/:id/submissions/:enrollment_id - Update submission grade
router.put('/:id/submissions/:enrollment_id', async (req, res) => {
  const { id, enrollment_id } = req.params;
  const {
    total_score,
    raw_score,
    adjusted_score,
    late_penalty,
    status,
    feedback,
    remarks,
    graded_by
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE submissions SET
        total_score = $1, raw_score = $2, adjusted_score = $3,
        late_penalty = $4, status = $5, feedback = $6, remarks = $7,
        graded_by = $8, graded_at = CURRENT_TIMESTAMP
      WHERE assessment_id = $9 AND enrollment_id = $10
      RETURNING submission_id
    `;
    
    const values = [
      total_score, raw_score, adjusted_score, late_penalty,
      status, feedback, remarks, graded_by, id, enrollment_id
    ];
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json({ message: 'Submission graded successfully' });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/assessments/:id/ilos - Get ILOs for an assessment
router.get('/:id/ilos', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        aiw.assessment_ilo_weight_id,
        aiw.weight_percentage,
        i.ilo_id,
        i.code,
        i.description,
        i.category,
        i.level,
        i.bloom_taxonomy_level
      FROM assessment_ilo_weights aiw
      JOIN ilos i ON aiw.ilo_id = i.ilo_id
      WHERE aiw.assessment_id = $1
      ORDER BY i.code
    `;
    
    const result = await client.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assessment ILOs:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/assessments/:id/rubrics - Get rubrics for an assessment
router.get('/:id/rubrics', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        r.rubric_id,
        r.title,
        r.description,
        r.rubric_type,
        r.performance_levels,
        r.criteria,
        r.total_points,
        r.ilo_id,
        i.code as ilo_code,
        i.description as ilo_description
      FROM rubrics r
      LEFT JOIN ilos i ON r.ilo_id = i.ilo_id
      WHERE r.assessment_id = $1 AND r.is_active = true
      ORDER BY r.rubric_id
    `;
    
    const result = await client.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assessment rubrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router; 