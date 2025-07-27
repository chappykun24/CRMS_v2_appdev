const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();

// GET /api/ilos/syllabus/:syllabusId - Get all ILOs for a syllabus
router.get('/syllabus/:syllabusId', async (req, res) => {
  const { syllabusId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        i.ilo_id,
        i.syllabus_id,
        i.code,
        i.description,
        i.category,
        i.level,
        i.weight_percentage,
        i.assessment_methods,
        i.learning_activities,
        i.bloom_taxonomy_level,
        i.is_active,
        i.created_at,
        i.updated_at,
        si.weight_percentage as syllabus_weight
      FROM ilos i
      LEFT JOIN syllabus_ilos si ON i.ilo_id = si.ilo_id AND si.syllabus_id = $1
      WHERE i.syllabus_id = $1
      ORDER BY i.code
    `;
    
    const result = await client.query(query, [syllabusId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ILOs:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/ilos/:id - Get a specific ILO with details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        i.*,
        s.title as syllabus_title,
        c.title as course_title,
        c.course_code,
        (SELECT COUNT(*) FROM assessment_ilo_weights aiw WHERE aiw.ilo_id = i.ilo_id) as assessment_count,
        (SELECT COUNT(*) FROM student_ilo_scores sis WHERE sis.ilo_id = i.ilo_id) as student_score_count,
        (SELECT AVG(sis.percentage_score) FROM student_ilo_scores sis WHERE sis.ilo_id = i.ilo_id) as average_achievement
      FROM ilos i
      LEFT JOIN syllabi s ON i.syllabus_id = s.syllabus_id
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      WHERE i.ilo_id = $1
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ILO not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ILO:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/ilos - Create a new ILO
router.post('/', async (req, res) => {
  const {
    syllabus_id,
    code,
    description,
    category,
    level,
    weight_percentage,
    assessment_methods,
    learning_activities,
    bloom_taxonomy_level
  } = req.body;
  
  if (!syllabus_id || !code || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO ilos (
        syllabus_id, code, description, category, level, weight_percentage,
        assessment_methods, learning_activities, bloom_taxonomy_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING ilo_id
    `;
    
    const values = [
      syllabus_id, code, description, category, level, weight_percentage,
      assessment_methods, learning_activities, bloom_taxonomy_level
    ];
    
    const result = await client.query(query, values);
    res.status(201).json({ 
      ilo_id: result.rows[0].ilo_id,
      message: 'ILO created successfully' 
    });
  } catch (error) {
    console.error('Error creating ILO:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/ilos/:id - Update an ILO
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    code,
    description,
    category,
    level,
    weight_percentage,
    assessment_methods,
    learning_activities,
    bloom_taxonomy_level,
    is_active
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE ilos SET
        code = $1, description = $2, category = $3, level = $4,
        weight_percentage = $5, assessment_methods = $6, learning_activities = $7,
        bloom_taxonomy_level = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
      WHERE ilo_id = $10
      RETURNING ilo_id
    `;
    
    const values = [
      code, description, category, level, weight_percentage,
      assessment_methods, learning_activities, bloom_taxonomy_level,
      is_active, id
    ];
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ILO not found' });
    }
    
    res.json({ message: 'ILO updated successfully' });
  } catch (error) {
    console.error('Error updating ILO:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/ilos/:id - Delete an ILO
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = 'DELETE FROM ilos WHERE ilo_id = $1 RETURNING ilo_id';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ILO not found' });
    }
    
    res.json({ message: 'ILO deleted successfully' });
  } catch (error) {
    console.error('Error deleting ILO:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/ilos/:id/assessments - Get assessments aligned with an ILO
router.get('/:id/assessments', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        a.assessment_id,
        a.title,
        a.type,
        a.total_points,
        a.weight_percentage,
        aiw.weight_percentage as ilo_weight,
        a.is_published,
        a.is_graded,
        a.status
      FROM assessments a
      JOIN assessment_ilo_weights aiw ON a.assessment_id = aiw.assessment_id
      WHERE aiw.ilo_id = $1
      ORDER BY a.created_at DESC
    `;
    
    const result = await client.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ILO assessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/ilos/:id/student-scores - Get student scores for an ILO
router.get('/:id/student-scores', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        sis.student_ilo_score_id,
        sis.enrollment_id,
        sis.score,
        sis.max_possible_score,
        sis.percentage_score,
        sis.weight_contribution,
        sis.computed_at,
        s.student_id,
        s.student_number,
        s.full_name,
        s.contact_email,
        ce.status as enrollment_status
      FROM student_ilo_scores sis
      JOIN course_enrollments ce ON sis.enrollment_id = ce.enrollment_id
      JOIN students s ON ce.student_id = s.student_id
      WHERE sis.ilo_id = $1
      ORDER BY s.full_name
    `;
    
    const result = await client.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ILO student scores:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/ilos/:id/analytics - Get analytics for an ILO
router.get('/:id/analytics', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        i.ilo_id,
        i.code,
        i.description,
        i.category,
        i.level,
        i.weight_percentage,
        COUNT(DISTINCT aiw.assessment_id) as assessment_count,
        COUNT(DISTINCT sis.enrollment_id) as student_count,
        AVG(sis.percentage_score) as average_achievement,
        MIN(sis.percentage_score) as lowest_achievement,
        MAX(sis.percentage_score) as highest_achievement,
        COUNT(CASE WHEN sis.percentage_score >= 80 THEN 1 END) as excellent_count,
        COUNT(CASE WHEN sis.percentage_score >= 70 AND sis.percentage_score < 80 THEN 1 END) as good_count,
        COUNT(CASE WHEN sis.percentage_score >= 60 AND sis.percentage_score < 70 THEN 1 END) as fair_count,
        COUNT(CASE WHEN sis.percentage_score < 60 THEN 1 END) as poor_count
      FROM ilos i
      LEFT JOIN assessment_ilo_weights aiw ON i.ilo_id = aiw.ilo_id
      LEFT JOIN student_ilo_scores sis ON i.ilo_id = sis.ilo_id
      WHERE i.ilo_id = $1
      GROUP BY i.ilo_id, i.code, i.description, i.category, i.level, i.weight_percentage
    `;
    
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ILO not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ILO analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/ilos/:id/calculate-scores - Calculate student scores for an ILO
router.post('/:id/calculate-scores', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    // Get all enrollments for the syllabus
    const enrollmentsQuery = `
      SELECT DISTINCT ce.enrollment_id
      FROM course_enrollments ce
      JOIN assessments a ON ce.section_course_id = a.section_course_id
      JOIN assessment_ilo_weights aiw ON a.assessment_id = aiw.assessment_id
      WHERE aiw.ilo_id = $1
    `;
    
    const enrollmentsResult = await client.query(enrollmentsQuery, [id]);
    
    // Calculate scores for each enrollment
    for (const enrollment of enrollmentsResult.rows) {
      const scoreQuery = `
        SELECT 
          AVG(sas.total_score / sa.total_points * 100) as average_percentage,
          SUM(aiw.weight_percentage) as total_weight
        FROM sub_assessment_submissions sas
        JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id
        JOIN assessments a ON sa.assessment_id = a.assessment_id
        JOIN assessment_ilo_weights aiw ON a.assessment_id = aiw.assessment_id
        WHERE sas.enrollment_id = $1 
          AND aiw.ilo_id = $2 
          AND sas.status = 'graded'
      `;
      
      const scoreResult = await client.query(scoreQuery, [enrollment.enrollment_id, id]);
      
      if (scoreResult.rows[0].average_percentage !== null) {
        const averageScore = scoreResult.rows[0].average_percentage;
        const totalWeight = scoreResult.rows[0].total_weight || 0;
        
        // Insert or update student ILO score
        const upsertQuery = `
          INSERT INTO student_ilo_scores (
            enrollment_id, ilo_id, score, max_possible_score, 
            percentage_score, weight_contribution
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (enrollment_id, ilo_id) 
          DO UPDATE SET
            score = EXCLUDED.score,
            max_possible_score = EXCLUDED.max_possible_score,
            percentage_score = EXCLUDED.percentage_score,
            weight_contribution = EXCLUDED.weight_contribution,
            computed_at = CURRENT_TIMESTAMP
        `;
        
        await client.query(upsertQuery, [
          enrollment.enrollment_id, id, averageScore, 100, averageScore, totalWeight
        ]);
      }
    }
    
    res.json({ message: 'ILO scores calculated successfully' });
  } catch (error) {
    console.error('Error calculating ILO scores:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router; 