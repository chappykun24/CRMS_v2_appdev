const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();

// GET /api/sub-assessments/assessment/:assessmentId - Get all sub-assessments for a main assessment
router.get('/assessment/:assessmentId', async (req, res) => {
  const { assessmentId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        sa.sub_assessment_id,
        sa.assessment_id,
        sa.title,
        sa.description,
        sa.type,
        sa.total_points,
        sa.weight_percentage,
        sa.due_date,
        sa.instructions,
        sa.content_data,
        sa.ilo_codes,
        sa.rubric_criteria,
        sa.status,
        sa.is_published,
        sa.is_graded,
        sa.order_index,
        sa.created_at,
        sa.updated_at,
        a.title as assessment_title,
        a.total_points as assessment_total_points,
        (SELECT COUNT(*) FROM sub_assessment_submissions sas WHERE sas.sub_assessment_id = sa.sub_assessment_id) as submission_count,
        (SELECT COUNT(*) FROM sub_assessment_submissions sas WHERE sas.sub_assessment_id = sa.sub_assessment_id AND sas.status = 'graded') as graded_count
      FROM sub_assessments sa
      JOIN assessments a ON sa.assessment_id = a.assessment_id
      WHERE sa.assessment_id = $1
      ORDER BY sa.order_index, sa.created_at
    `;
    
    const result = await client.query(query, [assessmentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sub-assessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/sub-assessments/:id - Get a specific sub-assessment with details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        sa.*,
        a.title as assessment_title,
        a.total_points as assessment_total_points,
        a.weight_percentage as assessment_weight,
        (SELECT COUNT(*) FROM sub_assessment_submissions sas WHERE sas.sub_assessment_id = sa.sub_assessment_id) as submission_count,
        (SELECT COUNT(*) FROM sub_assessment_submissions sas WHERE sas.sub_assessment_id = sa.sub_assessment_id AND sas.status = 'graded') as graded_count,
        (SELECT AVG(sas.total_score) FROM sub_assessment_submissions sas WHERE sas.sub_assessment_id = sa.sub_assessment_id AND sas.status = 'graded') as average_score
      FROM sub_assessments sa
      JOIN assessments a ON sa.assessment_id = a.assessment_id
      WHERE sa.sub_assessment_id = $1
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-assessment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching sub-assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/sub-assessments - Create a new sub-assessment
router.post('/', async (req, res) => {
  const {
    assessment_id,
    title,
    description,
    type,
    total_points,
    weight_percentage,
    due_date,
    instructions,
    content_data,
    ilo_codes,
    rubric_criteria,
    order_index,
    created_by
  } = req.body;
  
  if (!assessment_id || !title || !type || !total_points || !weight_percentage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const client = await pool.connect();
  
  try {
    // Check if total weight would exceed 100%
    const weightCheckQuery = `
      SELECT COALESCE(SUM(weight_percentage), 0) as total_weight
      FROM sub_assessments
      WHERE assessment_id = $1
    `;
    const weightResult = await client.query(weightCheckQuery, [assessment_id]);
    const currentTotalWeight = parseFloat(weightResult.rows[0].total_weight);
    
    if (currentTotalWeight + weight_percentage > 100) {
      return res.status(400).json({ 
        error: `Total weight would exceed 100%. Current total: ${currentTotalWeight}%, Adding: ${weight_percentage}%` 
      });
    }
    
    const query = `
      INSERT INTO sub_assessments (
        assessment_id, title, description, type, total_points, weight_percentage,
        due_date, instructions, content_data, ilo_codes, rubric_criteria,
        order_index, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING sub_assessment_id
    `;
    
    const values = [
      assessment_id, title, description, type, total_points, weight_percentage,
      due_date, instructions, content_data, ilo_codes, rubric_criteria,
      order_index, created_by
    ];
    
    const result = await client.query(query, values);
    res.status(201).json({ 
      sub_assessment_id: result.rows[0].sub_assessment_id,
      message: 'Sub-assessment created successfully' 
    });
  } catch (error) {
    console.error('Error creating sub-assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/sub-assessments/:id - Update a sub-assessment
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    type,
    total_points,
    weight_percentage,
    due_date,
    instructions,
    content_data,
    ilo_codes,
    rubric_criteria,
    order_index
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    // Get current sub-assessment to check weight changes
    const currentQuery = `
      SELECT assessment_id, weight_percentage FROM sub_assessments WHERE sub_assessment_id = $1
    `;
    const currentResult = await client.query(currentQuery, [id]);
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-assessment not found' });
    }
    
    const current = currentResult.rows[0];
    const weightDifference = weight_percentage - current.weight_percentage;
    
    if (weightDifference > 0) {
      // Check if weight increase would exceed 100%
      const weightCheckQuery = `
        SELECT COALESCE(SUM(weight_percentage), 0) as total_weight
        FROM sub_assessments
        WHERE assessment_id = $1 AND sub_assessment_id != $2
      `;
      const weightResult = await client.query(weightCheckQuery, [current.assessment_id, id]);
      const otherTotalWeight = parseFloat(weightResult.rows[0].total_weight);
      
      if (otherTotalWeight + weight_percentage > 100) {
        return res.status(400).json({ 
          error: `Total weight would exceed 100%. Current total: ${otherTotalWeight + current.weight_percentage}%, New total: ${otherTotalWeight + weight_percentage}%` 
        });
      }
    }
    
    const query = `
      UPDATE sub_assessments SET
        title = $1, description = $2, type = $3, total_points = $4,
        weight_percentage = $5, due_date = $6, instructions = $7,
        content_data = $8, ilo_codes = $9, rubric_criteria = $10,
        order_index = $11, updated_at = CURRENT_TIMESTAMP
      WHERE sub_assessment_id = $12
      RETURNING sub_assessment_id
    `;
    
    const values = [
      title, description, type, total_points, weight_percentage,
      due_date, instructions, content_data, ilo_codes, rubric_criteria,
      order_index, id
    ];
    
    const result = await client.query(query, values);
    res.json({ message: 'Sub-assessment updated successfully' });
  } catch (error) {
    console.error('Error updating sub-assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/sub-assessments/:id - Delete a sub-assessment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = 'DELETE FROM sub_assessments WHERE sub_assessment_id = $1 RETURNING sub_assessment_id';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-assessment not found' });
    }
    
    res.json({ message: 'Sub-assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub-assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/sub-assessments/:id/publish - Publish a sub-assessment
router.put('/:id/publish', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE sub_assessments SET
        is_published = true,
        status = 'active',
        updated_at = CURRENT_TIMESTAMP
      WHERE sub_assessment_id = $1
      RETURNING sub_assessment_id
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-assessment not found' });
    }
    
    res.json({ message: 'Sub-assessment published successfully' });
  } catch (error) {
    console.error('Error publishing sub-assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/sub-assessments/:id/students-with-grades - Get students with grades for a sub-assessment
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
        sas.submission_id,
        sas.submission_type,
        sas.submitted_at,
        sas.total_score,
        sas.status,
        sas.remarks,
        u.name as graded_by_name,
        sas.graded_at
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      LEFT JOIN sub_assessment_submissions sas ON ce.enrollment_id = sas.enrollment_id AND sas.sub_assessment_id = $1
      LEFT JOIN users u ON sas.graded_by = u.user_id
      WHERE ce.section_course_id = (
        SELECT a.section_course_id 
        FROM assessments a 
        JOIN sub_assessments sa ON a.assessment_id = sa.assessment_id 
        WHERE sa.sub_assessment_id = $1
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

// POST /api/sub-assessments/:id/submissions - Create a new sub-assessment submission
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
      INSERT INTO sub_assessment_submissions (
        enrollment_id, sub_assessment_id, submission_type, submission_data, file_urls
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING submission_id
    `;
    
    const values = [enrollment_id, id, submission_type, submission_data, file_urls];
    const result = await client.query(query, values);
    
    res.status(201).json({ 
      submission_id: result.rows[0].submission_id,
      message: 'Sub-assessment submission created successfully' 
    });
  } catch (error) {
    console.error('Error creating sub-assessment submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/sub-assessments/:id/submissions/:enrollment_id - Update sub-assessment submission grade
router.put('/:id/submissions/:enrollment_id', async (req, res) => {
  const { id, enrollment_id } = req.params;
  const {
    total_score,
    status,
    remarks,
    graded_by
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE sub_assessment_submissions SET
        total_score = $1, status = $2, remarks = $3,
        graded_by = $4, graded_at = CURRENT_TIMESTAMP
      WHERE sub_assessment_id = $5 AND enrollment_id = $6
      RETURNING submission_id
    `;
    
    const values = [
      total_score, status, remarks, graded_by, id, enrollment_id
    ];
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-assessment submission not found' });
    }
    
    res.json({ message: 'Sub-assessment submission graded successfully' });
  } catch (error) {
    console.error('Error updating sub-assessment submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/sub-assessments/:id/rubrics - Get rubrics for a sub-assessment
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
      WHERE r.sub_assessment_id = $1 AND r.is_active = true
      ORDER BY r.rubric_id
    `;
    
    const result = await client.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sub-assessment rubrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/sub-assessments/:id/analytics - Get analytics for a sub-assessment
router.get('/:id/analytics', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        sa.sub_assessment_id,
        sa.title,
        sa.total_points,
        sa.weight_percentage,
        COUNT(sas.submission_id) as total_submissions,
        COUNT(CASE WHEN sas.status = 'graded' THEN 1 END) as graded_submissions,
        COUNT(CASE WHEN sas.status = 'submitted' THEN 1 END) as pending_submissions,
        AVG(CASE WHEN sas.status = 'graded' THEN sas.total_score END) as average_score,
        MIN(CASE WHEN sas.status = 'graded' THEN sas.total_score END) as lowest_score,
        MAX(CASE WHEN sas.status = 'graded' THEN sas.total_score END) as highest_score,
        COUNT(CASE WHEN sas.late_penalty > 0 THEN 1 END) as late_submissions
      FROM sub_assessments sa
      LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id
      WHERE sa.sub_assessment_id = $1
      GROUP BY sa.sub_assessment_id, sa.title, sa.total_points, sa.weight_percentage
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-assessment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching sub-assessment analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router; 