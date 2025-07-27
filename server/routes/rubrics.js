const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();

// GET /api/rubrics/syllabus/:syllabusId - Get all rubrics for a syllabus
router.get('/syllabus/:syllabusId', async (req, res) => {
  const { syllabusId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        r.rubric_id,
        r.syllabus_id,
        r.assessment_id,
        r.sub_assessment_id,
        r.title,
        r.description,
        r.rubric_type,
        r.performance_levels,
        r.criteria,
        r.total_points,
        r.is_template,
        r.template_name,
        r.ilo_id,
        r.is_active,
        r.created_at,
        r.updated_at,
        i.code as ilo_code,
        i.description as ilo_description,
        a.title as assessment_title,
        sa.title as sub_assessment_title
      FROM rubrics r
      LEFT JOIN ilos i ON r.ilo_id = i.ilo_id
      LEFT JOIN assessments a ON r.assessment_id = a.assessment_id
      LEFT JOIN sub_assessments sa ON r.sub_assessment_id = sa.sub_assessment_id
      WHERE r.syllabus_id = $1
      ORDER BY r.created_at DESC
    `;
    
    const result = await client.query(query, [syllabusId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/rubrics/assessment/:assessmentId - Get rubrics for an assessment
router.get('/assessment/:assessmentId', async (req, res) => {
  const { assessmentId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        r.rubric_id,
        r.syllabus_id,
        r.assessment_id,
        r.sub_assessment_id,
        r.title,
        r.description,
        r.rubric_type,
        r.performance_levels,
        r.criteria,
        r.total_points,
        r.is_template,
        r.template_name,
        r.ilo_id,
        r.is_active,
        r.created_at,
        r.updated_at,
        i.code as ilo_code,
        i.description as ilo_description,
        sa.title as sub_assessment_title
      FROM rubrics r
      LEFT JOIN ilos i ON r.ilo_id = i.ilo_id
      LEFT JOIN sub_assessments sa ON r.sub_assessment_id = sa.sub_assessment_id
      WHERE r.assessment_id = $1 AND r.is_active = true
      ORDER BY r.created_at DESC
    `;
    
    const result = await client.query(query, [assessmentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assessment rubrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/rubrics/:id - Get a specific rubric with details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        r.*,
        i.code as ilo_code,
        i.description as ilo_description,
        a.title as assessment_title,
        sa.title as sub_assessment_title,
        s.title as syllabus_title,
        c.title as course_title,
        c.course_code,
        (SELECT COUNT(*) FROM rubric_scores rs WHERE rs.rubric_id = r.rubric_id) as usage_count
      FROM rubrics r
      LEFT JOIN ilos i ON r.ilo_id = i.ilo_id
      LEFT JOIN assessments a ON r.assessment_id = a.assessment_id
      LEFT JOIN sub_assessments sa ON r.sub_assessment_id = sa.sub_assessment_id
      LEFT JOIN syllabi s ON r.syllabus_id = s.syllabus_id
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      WHERE r.rubric_id = $1
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching rubric:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/rubrics - Create a new rubric
router.post('/', async (req, res) => {
  const {
    syllabus_id,
    assessment_id,
    sub_assessment_id,
    title,
    description,
    rubric_type,
    performance_levels,
    criteria,
    total_points,
    is_template,
    template_name,
    ilo_id,
    created_by
  } = req.body;
  
  if (!syllabus_id || !title || !criteria) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO rubrics (
        syllabus_id, assessment_id, sub_assessment_id, title, description,
        rubric_type, performance_levels, criteria, total_points,
        is_template, template_name, ilo_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING rubric_id
    `;
    
    const values = [
      syllabus_id, assessment_id, sub_assessment_id, title, description,
      rubric_type, performance_levels, criteria, total_points,
      is_template, template_name, ilo_id, created_by
    ];
    
    const result = await client.query(query, values);
    res.status(201).json({ 
      rubric_id: result.rows[0].rubric_id,
      message: 'Rubric created successfully' 
    });
  } catch (error) {
    console.error('Error creating rubric:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/rubrics/:id - Update a rubric
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    rubric_type,
    performance_levels,
    criteria,
    total_points,
    is_template,
    template_name,
    ilo_id,
    is_active
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE rubrics SET
        title = $1, description = $2, rubric_type = $3, performance_levels = $4,
        criteria = $5, total_points = $6, is_template = $7, template_name = $8,
        ilo_id = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP
      WHERE rubric_id = $11
      RETURNING rubric_id
    `;
    
    const values = [
      title, description, rubric_type, performance_levels, criteria,
      total_points, is_template, template_name, ilo_id, is_active, id
    ];
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    res.json({ message: 'Rubric updated successfully' });
  } catch (error) {
    console.error('Error updating rubric:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/rubrics/:id - Delete a rubric
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = 'DELETE FROM rubrics WHERE rubric_id = $1 RETURNING rubric_id';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    res.json({ message: 'Rubric deleted successfully' });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/rubrics/templates - Get all rubric templates
router.get('/templates/all', async (req, res) => {
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
        r.template_name,
        r.ilo_id,
        r.created_at,
        r.updated_at,
        i.code as ilo_code,
        i.description as ilo_description,
        u.name as created_by_name
      FROM rubrics r
      LEFT JOIN ilos i ON r.ilo_id = i.ilo_id
      LEFT JOIN users u ON r.created_by = u.user_id
      WHERE r.is_template = true AND r.is_active = true
      ORDER BY r.created_at DESC
    `;
    
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rubric templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/rubrics/:id/duplicate - Duplicate a rubric
router.post('/:id/duplicate', async (req, res) => {
  const { id } = req.params;
  const { new_title, new_syllabus_id, new_assessment_id, new_sub_assessment_id, created_by } = req.body;
  
  const client = await pool.connect();
  
  try {
    // Get the original rubric
    const originalQuery = 'SELECT * FROM rubrics WHERE rubric_id = $1';
    const originalResult = await client.query(originalQuery, [id]);
    
    if (originalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    const original = originalResult.rows[0];
    
    // Create the duplicate
    const duplicateQuery = `
      INSERT INTO rubrics (
        syllabus_id, assessment_id, sub_assessment_id, title, description,
        rubric_type, performance_levels, criteria, total_points,
        is_template, template_name, ilo_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING rubric_id
    `;
    
    const values = [
      new_syllabus_id || original.syllabus_id,
      new_assessment_id || original.assessment_id,
      new_sub_assessment_id || original.sub_assessment_id,
      new_title || `${original.title} (Copy)`,
      original.description,
      original.rubric_type,
      original.performance_levels,
      original.criteria,
      original.total_points,
      false, // Not a template
      null, // No template name
      original.ilo_id,
      created_by
    ];
    
    const result = await client.query(duplicateQuery, values);
    res.status(201).json({ 
      rubric_id: result.rows[0].rubric_id,
      message: 'Rubric duplicated successfully' 
    });
  } catch (error) {
    console.error('Error duplicating rubric:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/rubrics/:id/scores - Get rubric scores
router.get('/:id/scores', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        rs.rubric_score_id,
        rs.submission_id,
        rs.sub_assessment_submission_id,
        rs.criterion_name,
        rs.criterion_score,
        rs.criterion_feedback,
        rs.performance_level,
        rs.max_possible_score,
        rs.weight_percentage,
        rs.created_at,
        s.student_number,
        s.full_name,
        sub.submitted_at,
        sub.total_score as submission_total_score
      FROM rubric_scores rs
      LEFT JOIN sub_assessment_submissions sub ON rs.sub_assessment_submission_id = sub.submission_id
      LEFT JOIN course_enrollments ce ON sub.enrollment_id = ce.enrollment_id
      LEFT JOIN students s ON ce.student_id = s.student_id
      WHERE rs.rubric_id = $1
      ORDER BY s.full_name, rs.criterion_name
    `;
    
    const result = await client.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rubric scores:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/rubrics/:id/analytics - Get analytics for a rubric
router.get('/:id/analytics', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        r.rubric_id,
        r.title,
        r.total_points,
        COUNT(rs.rubric_score_id) as total_scores,
        AVG(rs.criterion_score) as average_criterion_score,
        MIN(rs.criterion_score) as lowest_criterion_score,
        MAX(rs.criterion_score) as highest_criterion_score,
        COUNT(CASE WHEN rs.performance_level = 'Excellent' THEN 1 END) as excellent_count,
        COUNT(CASE WHEN rs.performance_level = 'Good' THEN 1 END) as good_count,
        COUNT(CASE WHEN rs.performance_level = 'Fair' THEN 1 END) as fair_count,
        COUNT(CASE WHEN rs.performance_level = 'Poor' THEN 1 END) as poor_count,
        COUNT(DISTINCT rs.submission_id) + COUNT(DISTINCT rs.sub_assessment_submission_id) as unique_submissions
      FROM rubrics r
      LEFT JOIN rubric_scores rs ON r.rubric_id = rs.rubric_id
      WHERE r.rubric_id = $1
      GROUP BY r.rubric_id, r.title, r.total_points
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching rubric analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/rubrics/:id/scores - Create rubric scores
router.post('/:id/scores', async (req, res) => {
  const { id } = req.params;
  const { scores } = req.body; // Array of score objects
  
  const client = await pool.connect();
  
  try {
    for (const score of scores) {
      const query = `
        INSERT INTO rubric_scores (
          submission_id, sub_assessment_submission_id, rubric_id,
          criterion_name, criterion_score, criterion_feedback,
          performance_level, max_possible_score, weight_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING rubric_score_id
      `;
      
      const values = [
        score.submission_id,
        score.sub_assessment_submission_id,
        id,
        score.criterion_name,
        score.criterion_score,
        score.criterion_feedback,
        score.performance_level,
        score.max_possible_score,
        score.weight_percentage
      ];
      
      await client.query(query, values);
    }
    
    res.status(201).json({ message: 'Rubric scores created successfully' });
  } catch (error) {
    console.error('Error creating rubric scores:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router; 