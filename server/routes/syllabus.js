console.log('Syllabus router loaded');

const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();
const fs = require('fs');

// TEST ENDPOINT: Write to database (move to top)
router.post('/test-write', async (req, res) => {
  try {
    const client = await pool.connect();
    // Create a test table if it doesn't exist
    await client.query(`CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, message TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    // Insert a test row
    const result = await client.query(`INSERT INTO test_table (message) VALUES ($1) RETURNING *`, ['Hello from test-write endpoint']);
    client.release();
    res.json({ message: 'Write successful', row: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Write failed', details: err.message });
  }
});

// Move approval-status route to the top
router.put('/approval-status/:syllabus_id', async (req, res) => {
  console.log('PUT /api/syllabus/approval-status/:syllabus_id', req.params, req.body);
  console.log('Raw req.body:', req.body);
  const { syllabus_id } = req.params;
  const { reviewed_by, review_status, approval_status } = req.body;
  if (!reviewed_by) {
    return res.status(400).json({ error: 'Missing reviewed_by' });
  }
  const client = await pool.connect();
  try {
    if (review_status === 'rejected') {
      await client.query(
        `UPDATE syllabi
         SET review_status = 'rejected',
             reviewed_by = $1,
             reviewed_at = NOW()
         WHERE syllabus_id = $2`,
        [reviewed_by, syllabus_id]
      );
      client.release();
      return res.json({ message: 'Syllabus rejected' });
    } else if (approval_status === 'rejected') {
      await client.query(
        `UPDATE syllabi
         SET approval_status = 'rejected',
             reviewed_by = $1,
             reviewed_at = NOW()
         WHERE syllabus_id = $2`,
        [reviewed_by, syllabus_id]
      );
      client.release();
      return res.json({ message: 'Syllabus approval rejected' });
    } else {
      await client.query(
        `UPDATE syllabi
         SET review_status = 'approved',
             reviewed_by = $1,
             reviewed_at = NOW()
         WHERE syllabus_id = $2`,
        [reviewed_by, syllabus_id]
      );
      client.release();
      return res.json({ message: 'Review status and reviewer updated' });
    }
  } catch (err) {
    client.release();
    console.error('Error in approval-status route:', err);
    if (err.stack) {
      fs.appendFileSync('error.log', err.stack + '\n');
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Debug test route
router.get('/test', (req, res) => {
  res.json({ message: 'Syllabus test route works!' });
});

// GET /api/syllabus/my?facultyId=3 - Updated for optimized schema
router.get('/my', async (req, res) => {
  const facultyId = req.query.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Missing facultyId' });

  try {
    const client = await pool.connect();
    
    // Get syllabi with section_course_id and course information
    const result = await client.query(`
      SELECT 
        s.syllabus_id,
        s.title,
        s.description,
        s.assessment_framework,
        s.grading_policy,
        s.course_outline,
        s.learning_resources,
        s.prerequisites,
        s.course_objectives,
        s.version,
        s.is_template,
        s.template_name,
        s.review_status,
        s.approval_status,
        s.created_at,
        s.updated_at,
        sc.section_course_id,
        c.title AS course_title,
        c.course_code,
        c.description AS course_description,
        sec.section_code,
        t.school_year,
        t.semester,
        u.name AS faculty_name,
        reviewer.name AS reviewer_name,
        approver.name AS approver_name
      FROM syllabi s
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN sections sec ON sc.section_id = sec.section_id
      LEFT JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN users u ON s.created_by = u.user_id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.user_id
      LEFT JOIN users approver ON s.approved_by = approver.user_id
      WHERE s.created_by = $1
      ORDER BY s.created_at DESC
    `, [facultyId]);

    const syllabi = result.rows;
    
    // Get ILOs for each syllabus (direct relationship)
    const syllabusIds = syllabi.map(s => s.syllabus_id);
    let ilosBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const iloResult = await client.query(`
        SELECT 
          ilo_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY code
      `, [syllabusIds]);
      
      ilosBySyllabus = iloResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          ilo_id: row.ilo_id,
          code: row.code,
          description: row.description,
          category: row.category,
          level: row.level,
          weight_percentage: row.weight_percentage,
          assessment_methods: row.assessment_methods,
          learning_activities: row.learning_activities,
          is_active: row.is_active
        });
        return acc;
      }, {});
    }
    
    // Get assessments for each syllabus
    let assessmentsBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const assessmentResult = await client.query(`
        SELECT 
          assessment_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY due_date, title
      `, [syllabusIds]);
      
      assessmentsBySyllabus = assessmentResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          assessment_id: row.assessment_id,
          title: row.title,
          description: row.description,
          type: row.type,
          category: row.category,
          total_points: row.total_points,
          weight_percentage: row.weight_percentage,
          due_date: row.due_date,
          submission_deadline: row.submission_deadline,
          is_published: row.is_published,
          grading_method: row.grading_method,
          instructions: row.instructions,
          content_data: row.content_data,
          status: row.status
        });
        return acc;
      }, {});
    }
    
    // Get rubrics for each syllabus
    let rubricsBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const rubricResult = await client.query(`
        SELECT 
          r.rubric_id,
          r.syllabus_id,
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
        WHERE r.syllabus_id = ANY($1::int[])
        ORDER BY r.criteria_order, r.title
      `, [syllabusIds]);
      
      rubricsBySyllabus = rubricResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          rubric_id: row.rubric_id,
          title: row.title,
          description: row.description,
          criterion: row.criterion,
          max_score: row.max_score,
          rubric_type: row.rubric_type,
          performance_levels: row.performance_levels,
          criteria_order: row.criteria_order,
          is_active: row.is_active,
          ilo_code: row.ilo_code,
          assessment_title: row.assessment_title
        });
        return acc;
      }, {});
    }
    
    // Combine all data
    const syllabiWithDetails = syllabi.map(syllabus => ({
      ...syllabus,
      ilos: ilosBySyllabus[syllabus.syllabus_id] || [],
      assessments: assessmentsBySyllabus[syllabus.syllabus_id] || [],
      rubrics: rubricsBySyllabus[syllabus.syllabus_id] || []
    }));
    
    client.release();
    res.json(syllabiWithDetails);
  } catch (err) {
    console.error('Error fetching syllabi:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/syllabus/terms - Updated for optimized schema
router.get('/terms', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT term_id, school_year, semester, start_date, end_date, is_active
      FROM school_terms 
      ORDER BY start_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching terms:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/syllabus/ilos - Updated for optimized schema
router.get('/ilos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ilo_id,
        syllabus_id,
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
      ORDER BY code
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ILOs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/syllabus/ilos - Create new ILO
router.post('/ilos', async (req, res) => {
  const { syllabus_id, code, description, category, level, weight_percentage, assessment_methods, learning_activities } = req.body;
  
  if (!syllabus_id || !code || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const result = await pool.query(`
      INSERT INTO ilos (
        syllabus_id, code, description, category, level, 
        weight_percentage, assessment_methods, learning_activities, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      syllabus_id,
      code,
      description,
      category || 'Knowledge',
      level || 'Basic',
      weight_percentage || 25,
      assessment_methods || [],
      learning_activities || [],
      true
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating ILO:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/syllabus/one/:syllabus_id - Updated for optimized schema
router.get('/one/:syllabus_id', async (req, res) => {
  const { syllabus_id } = req.params;
  
  try {
    const client = await pool.connect();
    
    // Get syllabus with section_course and course information
    const syllabusResult = await client.query(`
      SELECT 
        s.syllabus_id,
        s.title,
        s.description,
        s.assessment_framework,
        s.grading_policy,
        s.course_outline,
        s.learning_resources,
        s.prerequisites,
        s.course_objectives,
        s.version,
        s.is_template,
        s.template_name,
        s.review_status,
        s.approval_status,
        s.created_at,
        s.updated_at,
        sc.section_course_id,
        c.title AS course_title,
        c.course_code,
        c.description AS course_description,
        sec.section_code,
        t.school_year,
        t.semester,
        u.name AS faculty_name,
        reviewer.name AS reviewer_name,
        approver.name AS approver_name
      FROM syllabi s
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN sections sec ON sc.section_id = sec.section_id
      LEFT JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN users u ON s.created_by = u.user_id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.user_id
      LEFT JOIN users approver ON s.approved_by = approver.user_id
      WHERE s.syllabus_id = $1
    `, [syllabus_id]);
    
    if (syllabusResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Syllabus not found' });
    }
    
    const syllabus = syllabusResult.rows[0];
    
    // Get ILOs for this syllabus
    const ilosResult = await client.query(`
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
    `, [syllabus_id]);
    
    // Get assessments for this syllabus
    const assessmentsResult = await client.query(`
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
    `, [syllabus_id]);
    
    // Get rubrics for this syllabus
    const rubricsResult = await client.query(`
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
    `, [syllabus_id]);
    
    client.release();
    
    res.json({
      ...syllabus,
      ilos: ilosResult.rows,
      assessments: assessmentsResult.rows,
      rubrics: rubricsResult.rows
    });
  } catch (err) {
    console.error('Error fetching syllabus:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PUT /api/syllabus/update/:syllabus_id - Updated for optimized schema
router.put('/update/:syllabus_id', async (req, res) => {
  const { syllabus_id } = req.params;
  const { 
    title, 
    description, 
    assessment_framework, 
    grading_policy, 
    course_outline, 
    learning_resources, 
    prerequisites, 
    course_objectives,
    version,
    is_template,
    template_name
  } = req.body;
  
  try {
    const client = await pool.connect();
    
    // Update syllabus
    const updateResult = await client.query(`
      UPDATE syllabi 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        assessment_framework = COALESCE($3, assessment_framework),
        grading_policy = COALESCE($4, grading_policy),
        course_outline = COALESCE($5, course_outline),
        learning_resources = COALESCE($6, learning_resources),
        prerequisites = COALESCE($7, prerequisites),
        course_objectives = COALESCE($8, course_objectives),
        version = COALESCE($9, version),
        is_template = COALESCE($10, is_template),
        template_name = COALESCE($11, template_name),
        updated_at = NOW()
      WHERE syllabus_id = $12
      RETURNING *
    `, [
      title, description, assessment_framework, grading_policy, 
      course_outline, learning_resources, prerequisites, course_objectives,
      version, is_template, template_name, syllabus_id
    ]);
    
    if (updateResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Syllabus not found' });
    }
    
    client.release();
    res.json({ message: 'Syllabus updated successfully', syllabus: updateResult.rows[0] });
  } catch (err) {
    console.error('Error updating syllabus:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/syllabus/pending - get all syllabi with review_status 'pending' or reviewed by Program Chair but not yet approved by Dean
router.get('/pending', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        s.syllabus_id,
        s.title,
        s.description,
        s.assessment_framework,
        s.grading_policy,
        s.course_outline,
        s.learning_resources,
        s.prerequisites,
        s.course_objectives,
        s.version,
        s.is_template,
        s.template_name,
        s.review_status,
        s.approval_status,
        s.created_at,
        s.updated_at,
        sc.section_course_id,
        c.title AS course_title,
        c.course_code,
        c.description AS course_description,
        sec.section_code,
        t.school_year,
        t.semester,
        u.name AS faculty_name,
        reviewer.name AS reviewer_name,
        approver.name AS approver_name
      FROM syllabi s
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN sections sec ON sc.section_id = sec.section_id
      LEFT JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN users u ON s.created_by = u.user_id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.user_id
      LEFT JOIN users approver ON s.approved_by = approver.user_id
      WHERE s.review_status = 'pending'
         OR (s.review_status = 'approved' AND s.approval_status = 'pending')
      ORDER BY s.created_at DESC
    `);
    
    const syllabi = result.rows;
    
    // Get ILOs for each syllabus
    const syllabusIds = syllabi.map(s => s.syllabus_id);
    let ilosBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const iloResult = await client.query(`
        SELECT 
          ilo_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY code
      `, [syllabusIds]);
      
      ilosBySyllabus = iloResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          ilo_id: row.ilo_id,
          code: row.code,
          description: row.description,
          category: row.category,
          level: row.level,
          weight_percentage: row.weight_percentage,
          assessment_methods: row.assessment_methods,
          learning_activities: row.learning_activities,
          is_active: row.is_active
        });
        return acc;
      }, {});
    }
    
    // Get assessments for each syllabus
    let assessmentsBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const assessmentResult = await client.query(`
        SELECT 
          assessment_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY due_date, title
      `, [syllabusIds]);
      
      assessmentsBySyllabus = assessmentResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          assessment_id: row.assessment_id,
          title: row.title,
          description: row.description,
          type: row.type,
          category: row.category,
          total_points: row.total_points,
          weight_percentage: row.weight_percentage,
          due_date: row.due_date,
          submission_deadline: row.submission_deadline,
          is_published: row.is_published,
          grading_method: row.grading_method,
          instructions: row.instructions,
          content_data: row.content_data,
          status: row.status
        });
        return acc;
      }, {});
    }
    
    client.release();
    
    const syllabiWithDetails = syllabi.map(syllabus => ({
      ...syllabus,
      ilos: ilosBySyllabus[syllabus.syllabus_id] || [],
      assessments: assessmentsBySyllabus[syllabus.syllabus_id] || []
    }));
    
    res.json(syllabiWithDetails);
  } catch (err) {
    console.error('Error fetching pending syllabi:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/syllabus/approved - get syllabi approved by Program Chair or fully approved
router.get('/approved', async (req, res) => {
  try {
    console.log('GET /api/syllabus/approved - Fetching approved syllabi');
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        s.syllabus_id,
        s.title,
        s.description,
        s.assessment_framework,
        s.grading_policy,
        s.course_outline,
        s.learning_resources,
        s.prerequisites,
        s.course_objectives,
        s.version,
        s.is_template,
        s.template_name,
        s.review_status,
        s.approval_status,
        s.created_at,
        s.updated_at,
        sc.section_course_id,
        c.title AS course_title,
        c.course_code,
        c.description AS course_description,
        sec.section_code,
        t.school_year,
        t.semester,
        u.name AS faculty_name,
        reviewer.name AS reviewer_name,
        approver.name AS approver_name
      FROM syllabi s
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN sections sec ON sc.section_id = sec.section_id
      LEFT JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN users u ON s.created_by = u.user_id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.user_id
      LEFT JOIN users approver ON s.approved_by = approver.user_id
      WHERE (s.review_status = 'approved' AND s.approval_status = 'pending')
         OR (s.review_status = 'approved' AND s.approval_status = 'approved')
      ORDER BY s.created_at DESC
    `);
    
    console.log(`Found ${result.rows.length} approved syllabi`);
    const syllabi = result.rows;
    
    // Get ILOs for each syllabus
    const syllabusIds = syllabi.map(s => s.syllabus_id);
    let ilosBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const iloResult = await client.query(`
        SELECT 
          ilo_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY code
      `, [syllabusIds]);
      
      ilosBySyllabus = iloResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          ilo_id: row.ilo_id,
          code: row.code,
          description: row.description,
          category: row.category,
          level: row.level,
          weight_percentage: row.weight_percentage,
          assessment_methods: row.assessment_methods,
          learning_activities: row.learning_activities,
          is_active: row.is_active
        });
        return acc;
      }, {});
    }
    
    // Get assessments for each syllabus
    let assessmentsBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const assessmentResult = await client.query(`
        SELECT 
          assessment_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY due_date, title
      `, [syllabusIds]);
      
      assessmentsBySyllabus = assessmentResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          assessment_id: row.assessment_id,
          title: row.title,
          description: row.description,
          type: row.type,
          category: row.category,
          total_points: row.total_points,
          weight_percentage: row.weight_percentage,
          due_date: row.due_date,
          submission_deadline: row.submission_deadline,
          is_published: row.is_published,
          grading_method: row.grading_method,
          instructions: row.instructions,
          content_data: row.content_data,
          status: row.status
        });
        return acc;
      }, {});
    }
    
    client.release();
    
    const syllabiWithDetails = syllabi.map(syllabus => ({
      ...syllabus,
      ilos: ilosBySyllabus[syllabus.syllabus_id] || [],
      assessments: assessmentsBySyllabus[syllabus.syllabus_id] || []
    }));
    
    console.log(`Returning ${syllabiWithDetails.length} syllabi with details`);
    res.json(syllabiWithDetails);
  } catch (err) {
    console.error('Error fetching approved syllabi:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/syllabus/rejected - get syllabi rejected at any stage
router.get('/rejected', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        s.syllabus_id,
        s.title,
        s.description,
        s.assessment_framework,
        s.grading_policy,
        s.course_outline,
        s.learning_resources,
        s.prerequisites,
        s.course_objectives,
        s.version,
        s.is_template,
        s.template_name,
        s.review_status,
        s.approval_status,
        s.created_at,
        s.updated_at,
        sc.section_course_id,
        c.title AS course_title,
        c.course_code,
        c.description AS course_description,
        sec.section_code,
        t.school_year,
        t.semester,
        u.name AS faculty_name,
        reviewer.name AS reviewer_name,
        approver.name AS approver_name
      FROM syllabi s
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN sections sec ON sc.section_id = sec.section_id
      LEFT JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN users u ON s.created_by = u.user_id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.user_id
      LEFT JOIN users approver ON s.approved_by = approver.user_id
      WHERE s.review_status = 'rejected' OR s.approval_status = 'rejected'
      ORDER BY s.created_at DESC
    `);
    
    const syllabi = result.rows;
    
    // Get ILOs for each syllabus
    const syllabusIds = syllabi.map(s => s.syllabus_id);
    let ilosBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const iloResult = await client.query(`
        SELECT 
          ilo_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY code
      `, [syllabusIds]);
      
      ilosBySyllabus = iloResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          ilo_id: row.ilo_id,
          code: row.code,
          description: row.description,
          category: row.category,
          level: row.level,
          weight_percentage: row.weight_percentage,
          assessment_methods: row.assessment_methods,
          learning_activities: row.learning_activities,
          is_active: row.is_active
        });
        return acc;
      }, {});
    }
    
    // Get assessments for each syllabus
    let assessmentsBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const assessmentResult = await client.query(`
        SELECT 
          assessment_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY due_date, title
      `, [syllabusIds]);
      
      assessmentsBySyllabus = assessmentResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          assessment_id: row.assessment_id,
          title: row.title,
          description: row.description,
          type: row.type,
          category: row.category,
          total_points: row.total_points,
          weight_percentage: row.weight_percentage,
          due_date: row.due_date,
          submission_deadline: row.submission_deadline,
          is_published: row.is_published,
          grading_method: row.grading_method,
          instructions: row.instructions,
          content_data: row.content_data,
          status: row.status
        });
        return acc;
      }, {});
    }
    
    client.release();
    
    const syllabiWithDetails = syllabi.map(syllabus => ({
      ...syllabus,
      ilos: ilosBySyllabus[syllabus.syllabus_id] || [],
      assessments: assessmentsBySyllabus[syllabus.syllabus_id] || []
    }));
    
    res.json(syllabiWithDetails);
  } catch (err) {
    console.error('Error fetching rejected syllabi:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/syllabus/all - get all syllabi
router.get('/all', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        s.syllabus_id,
        s.title,
        s.description,
        s.assessment_framework,
        s.grading_policy,
        s.course_outline,
        s.learning_resources,
        s.prerequisites,
        s.course_objectives,
        s.version,
        s.is_template,
        s.template_name,
        s.review_status,
        s.approval_status,
        s.created_at,
        s.updated_at,
        sc.section_course_id,
        c.title AS course_title,
        c.course_code,
        c.description AS course_description,
        sec.section_code,
        t.school_year,
        t.semester,
        u.name AS faculty_name,
        reviewer.name AS reviewer_name,
        approver.name AS approver_name
      FROM syllabi s
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN sections sec ON sc.section_id = sec.section_id
      LEFT JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN users u ON s.created_by = u.user_id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.user_id
      LEFT JOIN users approver ON s.approved_by = approver.user_id
      ORDER BY s.created_at DESC
    `);
    
    const syllabi = result.rows;
    
    // Get ILOs for each syllabus
    const syllabusIds = syllabi.map(s => s.syllabus_id);
    let ilosBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const iloResult = await client.query(`
        SELECT 
          ilo_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY code
      `, [syllabusIds]);
      
      ilosBySyllabus = iloResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          ilo_id: row.ilo_id,
          code: row.code,
          description: row.description,
          category: row.category,
          level: row.level,
          weight_percentage: row.weight_percentage,
          assessment_methods: row.assessment_methods,
          learning_activities: row.learning_activities,
          is_active: row.is_active
        });
        return acc;
      }, {});
    }
    
    // Get assessments for each syllabus
    let assessmentsBySyllabus = {};
    
    if (syllabusIds.length > 0) {
      const assessmentResult = await client.query(`
        SELECT 
          assessment_id,
          syllabus_id,
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
        WHERE syllabus_id = ANY($1::int[])
        ORDER BY due_date, title
      `, [syllabusIds]);
      
      assessmentsBySyllabus = assessmentResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          assessment_id: row.assessment_id,
          title: row.title,
          description: row.description,
          type: row.type,
          category: row.category,
          total_points: row.total_points,
          weight_percentage: row.weight_percentage,
          due_date: row.due_date,
          submission_deadline: row.submission_deadline,
          is_published: row.is_published,
          grading_method: row.grading_method,
          instructions: row.instructions,
          content_data: row.content_data,
          status: row.status
        });
        return acc;
      }, {});
    }
    
    client.release();
    
    const syllabiWithDetails = syllabi.map(syllabus => ({
      ...syllabus,
      ilos: ilosBySyllabus[syllabus.syllabus_id] || [],
      assessments: assessmentsBySyllabus[syllabus.syllabus_id] || []
    }));
    
    res.json(syllabiWithDetails);
  } catch (err) {
    console.error('Error fetching all syllabi:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// This must be LAST!
router.all('*', (req, res) => {
  console.log('Unmatched syllabus route:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Not found' });
});

module.exports = router; 