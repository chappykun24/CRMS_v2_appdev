const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// GET /api/assessments/:assessment_id/submissions - get all submissions for an assessment
router.get('/:assessment_id/submissions', async (req, res) => {
  const { assessment_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        s.submission_id,
        s.enrollment_id,
        s.assessment_id,
        s.submission_type,
        s.submission_data,
        s.file_urls,
        s.total_score,
        s.raw_score,
        s.adjusted_score,
        s.late_penalty,
        s.submitted_at,
        s.graded_at,
        s.graded_by,
        s.status,
        s.remarks,
        st.student_id,
        st.full_name,
        st.student_number,
        ce.section_course_id
      FROM submissions s
      JOIN course_enrollments ce ON s.enrollment_id = ce.enrollment_id
      JOIN students st ON ce.student_id = st.student_id
      WHERE s.assessment_id = $1
      ORDER BY st.full_name
    `, [assessment_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/assessments/:assessment_id/submissions/:enrollment_id - get specific submission
router.get('/:assessment_id/submissions/:enrollment_id', async (req, res) => {
  const { assessment_id, enrollment_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        s.submission_id,
        s.enrollment_id,
        s.assessment_id,
        s.submission_type,
        s.submission_data,
        s.file_urls,
        s.total_score,
        s.raw_score,
        s.adjusted_score,
        s.late_penalty,
        s.submitted_at,
        s.graded_at,
        s.graded_by,
        s.status,
        s.remarks,
        st.student_id,
        st.full_name,
        st.student_number
      FROM submissions s
      JOIN course_enrollments ce ON s.enrollment_id = ce.enrollment_id
      JOIN students st ON ce.student_id = st.student_id
      WHERE s.assessment_id = $1 AND s.enrollment_id = $2
    `, [assessment_id, enrollment_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching submission:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/assessments/:assessment_id/submissions - create a new submission
router.post('/:assessment_id/submissions', async (req, res) => {
  const { assessment_id } = req.params;
  const { enrollment_id, submission_type, submission_data, file_urls } = req.body;
  
  if (!enrollment_id) {
    return res.status(400).json({ error: 'Missing enrollment_id' });
  }
  
  try {
    const result = await pool.query(`
      INSERT INTO submissions (
        enrollment_id, assessment_id, submission_type, submission_data, 
        file_urls, status, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [enrollment_id, assessment_id, submission_type || 'file', submission_data || {}, file_urls || [], 'submitted']);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating submission:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PUT /api/assessments/:assessment_id/submissions/:enrollment_id - update submission (grade it)
router.put('/:assessment_id/submissions/:enrollment_id', async (req, res) => {
  const { assessment_id, enrollment_id } = req.params;
  const { total_score, raw_score, adjusted_score, late_penalty, status, remarks, graded_by } = req.body;
  
  try {
    const result = await pool.query(`
      UPDATE submissions 
      SET 
        total_score = COALESCE($1, total_score),
        raw_score = COALESCE($2, raw_score),
        adjusted_score = COALESCE($3, adjusted_score),
        late_penalty = COALESCE($4, late_penalty),
        status = COALESCE($5, status),
        remarks = COALESCE($6, remarks),
        graded_by = COALESCE($7, graded_by),
        graded_at = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE graded_at END
      WHERE assessment_id = $8 AND enrollment_id = $9
      RETURNING *
    `, [total_score, raw_score, adjusted_score, late_penalty, status, remarks, graded_by, assessment_id, enrollment_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating submission:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/assessments/:assessment_id/students-with-grades - get all students with their grades for an assessment
router.get('/:assessment_id/students-with-grades', async (req, res) => {
  const { assessment_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        ce.enrollment_id,
        st.student_id,
        st.full_name,
        st.student_number,
        s.submission_id,
        s.total_score,
        s.raw_score,
        s.adjusted_score,
        s.late_penalty,
        s.status,
        s.remarks,
        s.submitted_at,
        s.graded_at,
        a.total_points,
        a.title as assessment_title
      FROM course_enrollments ce
      JOIN students st ON ce.student_id = st.student_id
      LEFT JOIN submissions s ON s.enrollment_id = ce.enrollment_id AND s.assessment_id = $1
      LEFT JOIN assessments a ON a.assessment_id = $1
      ORDER BY st.full_name
    `, [assessment_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students with grades:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/assessments/:assessment_id - get assessment details
router.get('/:assessment_id', async (req, res) => {
  const { assessment_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        assessment_id,
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
        is_published,
        is_graded,
        grading_method,
        instructions,
        content_data,
        status,
        created_by,
        created_at,
        updated_at
      FROM assessments 
      WHERE assessment_id = $1
    `, [assessment_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching assessment:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PUT /api/assessments/:assessment_id - update assessment
router.put('/:assessment_id', async (req, res) => {
  const { assessment_id } = req.params;
  const { 
    title, description, type, category, total_points, weight_percentage,
    due_date, submission_deadline, is_published, is_graded, grading_method,
    instructions, content_data, status 
  } = req.body;
  
  try {
    const result = await pool.query(`
      UPDATE assessments 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        category = COALESCE($4, category),
        total_points = COALESCE($5, total_points),
        weight_percentage = COALESCE($6, weight_percentage),
        due_date = COALESCE($7, due_date),
        submission_deadline = COALESCE($8, submission_deadline),
        is_published = COALESCE($9, is_published),
        is_graded = COALESCE($10, is_graded),
        grading_method = COALESCE($11, grading_method),
        instructions = COALESCE($12, instructions),
        content_data = COALESCE($13, content_data),
        status = COALESCE($14, status),
        updated_at = NOW()
      WHERE assessment_id = $15
      RETURNING *
    `, [
      title, description, type, category, total_points, weight_percentage,
      due_date, submission_deadline, is_published, is_graded, grading_method,
      instructions, content_data, status, assessment_id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating assessment:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 