console.log('Assessment templates router loaded');

const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();

// GET /api/assessment-templates - Get all assessment templates
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        at.template_id,
        at.template_name,
        at.template_type,
        at.description,
        at.assessment_structure,
        at.rubric_template,
        at.default_weight,
        at.ilo_coverage,
        at.syllabus_id,
        s.title as syllabus_title,
        c.course_code,
        c.title as course_title,
        at.created_at,
        at.updated_at
      FROM assessment_templates at
      LEFT JOIN syllabi s ON at.syllabus_id = s.syllabus_id
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      ORDER BY at.template_name
    `);
    
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assessment templates:', err);
    res.status(500).json({ error: 'Failed to fetch assessment templates', details: err.message });
  }
});

// GET /api/assessment-templates/:id - Get specific template
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        template_id,
        template_name,
        template_type,
        description,
        assessment_structure,
        rubric_template,
        default_weight,
        ilo_coverage,
        created_at,
        updated_at
      FROM assessment_templates
      WHERE template_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Template not found' });
    }
    
    client.release();
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching assessment template:', err);
    res.status(500).json({ error: 'Failed to fetch assessment template', details: err.message });
  }
});

// POST /api/assessment-templates - Create new template
router.post('/', async (req, res) => {
  const {
    templateName,
    templateType,
    description,
    assessmentStructure,
    rubricTemplate,
    defaultWeight,
    iloCoverage,
    syllabusId
  } = req.body;
  
  if (!templateName || !templateType || !assessmentStructure || !syllabusId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      INSERT INTO assessment_templates (
        template_name,
        template_type,
        description,
        assessment_structure,
        rubric_template,
        default_weight,
        ilo_coverage,
        syllabus_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING template_id
    `, [
      templateName,
      templateType,
      description || '',
      JSON.stringify(assessmentStructure),
      rubricTemplate ? JSON.stringify(rubricTemplate) : null,
      defaultWeight || 25,
      iloCoverage || [],
      syllabusId
    ]);
    
    client.release();
    res.status(201).json({ 
      message: 'Assessment template created successfully',
      templateId: result.rows[0].template_id
    });
  } catch (err) {
    console.error('Error creating assessment template:', err);
    res.status(500).json({ error: 'Failed to create assessment template', details: err.message });
  }
});

// PUT /api/assessment-templates/:id - Update template
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    templateName,
    templateType,
    description,
    assessmentStructure,
    rubricTemplate,
    defaultWeight,
    iloCoverage
  } = req.body;
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      UPDATE assessment_templates 
      SET template_name = COALESCE($1, template_name),
          template_type = COALESCE($2, template_type),
          description = COALESCE($3, description),
          assessment_structure = COALESCE($4, assessment_structure),
          rubric_template = COALESCE($5, rubric_template),
          default_weight = COALESCE($6, default_weight),
          ilo_coverage = COALESCE($7, ilo_coverage),
          updated_at = NOW()
      WHERE template_id = $8
      RETURNING template_id
    `, [
      templateName,
      templateType,
      description,
      assessmentStructure ? JSON.stringify(assessmentStructure) : null,
      rubricTemplate ? JSON.stringify(rubricTemplate) : null,
      defaultWeight,
      iloCoverage,
      id
    ]);
    
    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Template not found' });
    }
    
    client.release();
    res.json({ message: 'Assessment template updated successfully' });
  } catch (err) {
    console.error('Error updating assessment template:', err);
    res.status(500).json({ error: 'Failed to update assessment template', details: err.message });
  }
});

// DELETE /api/assessment-templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      DELETE FROM assessment_templates 
      WHERE template_id = $1
      RETURNING template_id
    `, [id]);
    
    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Template not found' });
    }
    
    client.release();
    res.json({ message: 'Assessment template deleted successfully' });
  } catch (err) {
    console.error('Error deleting assessment template:', err);
    res.status(500).json({ error: 'Failed to delete assessment template', details: err.message });
  }
});

// GET /api/assessment-templates/syllabus/:syllabusId - Get templates for a specific syllabus
router.get('/syllabus/:syllabusId', async (req, res) => {
  const { syllabusId } = req.params;
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        at.template_id,
        at.template_name,
        at.template_type,
        at.description,
        at.assessment_structure,
        at.rubric_template,
        at.default_weight,
        at.ilo_coverage,
        at.syllabus_id,
        s.title as syllabus_title,
        c.course_code,
        c.title as course_title,
        at.created_at,
        at.updated_at
      FROM assessment_templates at
      LEFT JOIN syllabi s ON at.syllabus_id = s.syllabus_id
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      WHERE at.syllabus_id = $1
      ORDER BY at.template_name
    `, [syllabusId]);
    
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching templates by syllabus:', err);
    res.status(500).json({ error: 'Failed to fetch templates by syllabus', details: err.message });
  }
});

// GET /api/assessment-templates/type/:type - Get templates by type
router.get('/type/:type', async (req, res) => {
  const { type } = req.params;
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        at.template_id,
        at.template_name,
        at.template_type,
        at.description,
        at.assessment_structure,
        at.rubric_template,
        at.default_weight,
        at.ilo_coverage,
        at.syllabus_id,
        s.title as syllabus_title,
        c.course_code,
        c.title as course_title,
        at.created_at,
        at.updated_at
      FROM assessment_templates at
      LEFT JOIN syllabi s ON at.syllabus_id = s.syllabus_id
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      WHERE at.template_type = $1
      ORDER BY at.template_name
    `, [type]);
    
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching templates by type:', err);
    res.status(500).json({ error: 'Failed to fetch templates by type', details: err.message });
  }
});

module.exports = router; 