console.log('Syllabus router loaded');

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Use the same pool config as in server.js
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Debug test route
router.get('/test', (req, res) => {
  res.json({ message: 'Syllabus test route works!' });
});

// GET /api/syllabus/my?facultyId=3
router.get('/my', async (req, res) => {
  const facultyId = req.query.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Missing facultyId' });

  try {
    const client = await pool.connect();
    // First, fetch syllabi with joined human-readable fields
    const result = await client.query(
      `SELECT
        s.*,
        c.title AS course_title,
        c.course_code,
        u1.name AS reviewer_name,
        u2.name AS approver_name,
        t.school_year,
        t.semester
      FROM syllabi s
      LEFT JOIN courses c ON s.course_id = c.course_id
      LEFT JOIN users u1 ON s.reviewed_by = u1.user_id
      LEFT JOIN users u2 ON s.approved_by = u2.user_id
      LEFT JOIN school_terms t ON s.term_id = t.term_id
      WHERE s.created_by = $1
      ORDER BY s.created_at DESC`,
      [facultyId]
    );
    const syllabi = result.rows;
    // Get all syllabus_ids
    const syllabusIds = syllabi.map(s => s.syllabus_id);
    let ilosBySyllabus = {};
    if (syllabusIds.length > 0) {
      // Fetch ILOs for all these syllabi
      const iloResult = await client.query(
        `SELECT si.syllabus_id, i.ilo_id, i.code, i.description
         FROM syllabus_ilos si
         JOIN ilos i ON si.ilo_id = i.ilo_id
         WHERE si.syllabus_id = ANY($1::int[])`,
        [syllabusIds]
      );
      // Group ILOs by syllabus_id
      ilosBySyllabus = iloResult.rows.reduce((acc, row) => {
        if (!acc[row.syllabus_id]) acc[row.syllabus_id] = [];
        acc[row.syllabus_id].push({
          id: row.ilo_id,
          code: row.code,
          description: row.description
        });
        return acc;
      }, {});
    }
    let assessmentsBySyllabus = {};
    for (const s of syllabi) {
      console.log('Syllabus:', s.syllabus_id, 'course_id:', s.course_id, 'term_id:', s.term_id);
      const sectionCoursesRes = await client.query(
        `SELECT section_course_id FROM section_courses WHERE course_id = $1 AND term_id = $2`,
        [s.course_id, s.term_id]
      );
      const sectionCourseIds = sectionCoursesRes.rows.map(r => r.section_course_id);
      console.log('Section courses for syllabus', s.syllabus_id, ':', sectionCourseIds);
      let assessments = [];
      if (sectionCourseIds.length > 0) {
        const assessmentsRes = await client.query(
          `SELECT assessment_id, title, type, created_at FROM assessments WHERE section_course_id = ANY($1::int[])`,
          [sectionCourseIds]
        );
        const assessmentIds = assessmentsRes.rows.map(a => a.assessment_id);
        // Fetch weights for these assessments
        let weightsByAssessment = {};
        if (assessmentIds.length > 0) {
          const weightsRes = await client.query(
            `SELECT w.assessment_id, w.ilo_id, w.weight_percentage, i.code AS ilo_code, i.description AS ilo_description
             FROM assessment_ilo_weights w
             JOIN ilos i ON w.ilo_id = i.ilo_id
             WHERE w.assessment_id = ANY($1::int[])`,
            [assessmentIds]
          );
          weightsByAssessment = weightsRes.rows.reduce((acc, row) => {
            if (!acc[row.assessment_id]) acc[row.assessment_id] = [];
            acc[row.assessment_id].push({
              ilo_id: row.ilo_id,
              ilo_code: row.ilo_code,
              ilo_description: row.ilo_description,
              weight_percentage: row.weight_percentage
            });
            return acc;
          }, {});
        }
        // Fetch rubrics for these assessments
        let rubricsByAssessment = {};
        if (assessmentIds.length > 0) {
          const rubricsRes = await client.query(
            `SELECT rubric_id, assessment_id, title, description, criterion, max_score, ilo_id
             FROM rubrics WHERE assessment_id = ANY($1::int[])`,
            [assessmentIds]
          );
          rubricsByAssessment = rubricsRes.rows.reduce((acc, row) => {
            if (!acc[row.assessment_id]) acc[row.assessment_id] = [];
            acc[row.assessment_id].push({
              rubric_id: row.rubric_id,
              title: row.title,
              description: row.description,
              criterion: row.criterion,
              max_score: row.max_score,
              ilo_id: row.ilo_id
            });
            return acc;
          }, {});
        }
        assessments = assessmentsRes.rows.map(a => ({
          id: a.assessment_id,
          title: a.title,
          type: a.type,
          date: a.created_at,
          weights: weightsByAssessment[a.assessment_id] || [],
          rubrics: rubricsByAssessment[a.assessment_id] || []
        }));
        console.log('Assessments for syllabus', s.syllabus_id, ':', assessments);
      }
      assessmentsBySyllabus[s.syllabus_id] = assessments;
    }
    client.release();
    // Attach ILOs and assessments to each syllabus
    const syllabiWithDetails = syllabi.map(s => ({
      ...s,
      ilos: ilosBySyllabus[s.syllabus_id] || [],
      assessments: assessmentsBySyllabus[s.syllabus_id] || []
    }));
    console.log('SENDING RESPONSE', syllabiWithDetails);
    res.json(syllabiWithDetails);
  } catch (err) {
    console.error('Error fetching syllabi:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/syllabus/ilos - fetch all ILOs
router.get('/ilos', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT ilo_id AS id, code, description FROM ilos ORDER BY code');
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ILOs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/syllabus - create syllabus and link ILOs
router.post('/', async (req, res) => {
  const { title, courseId, termId, created_by, iloIds, assessments } = req.body;
  if (!title || !courseId || !termId || !created_by || !Array.isArray(iloIds) || iloIds.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Insert syllabus
    const result = await client.query(
      `INSERT INTO syllabi (title, course_id, term_id, created_by, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [title, courseId, termId, created_by]
    );
    const syllabus = result.rows[0];
    // Insert into syllabus_ilos
    for (const iloId of iloIds) {
      await client.query(
        `INSERT INTO syllabus_ilos (syllabus_id, ilo_id) VALUES ($1, $2)`,
        [syllabus.syllabus_id, iloId]
      );
    }
    // Find section_course_id for this course and term
    const sectionRes = await client.query(
      `SELECT section_course_id FROM section_courses WHERE course_id = $1 AND term_id = $2 LIMIT 1`,
      [courseId, termId]
    );
    const section_course_id = sectionRes.rows[0]?.section_course_id;
    // Insert assessments, weights, and rubrics
    if (section_course_id && Array.isArray(assessments)) {
      for (const assessment of assessments) {
        const assessRes = await client.query(
          `INSERT INTO assessments (section_course_id, title, type, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
          [section_course_id, assessment.title, assessment.type]
        );
        const assessment_id = assessRes.rows[0].assessment_id;
        // Insert weights
        if (Array.isArray(assessment.weights)) {
          for (const w of assessment.weights) {
            await client.query(
              `INSERT INTO assessment_ilo_weights (assessment_id, ilo_id, weight_percentage) VALUES ($1, $2, $3)`,
              [assessment_id, w.ilo_id, w.weight_percentage]
            );
          }
        }
        // Insert rubrics
        if (Array.isArray(assessment.rubrics)) {
          for (const r of assessment.rubrics) {
            await client.query(
              `INSERT INTO rubrics (assessment_id, title, description, criterion, max_score, ilo_id) VALUES ($1, $2, $3, $4, $5, $6)`,
              [assessment_id, r.title, r.description, r.criterion, r.max_score, r.ilo_id || null]
            );
          }
        }
      }
    }
    await client.query('COMMIT');
    client.release();
    res.status(201).json({ message: 'Syllabus created', syllabus });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error creating syllabus:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/syllabus/ilos - add a new ILO
router.post('/ilos', async (req, res) => {
  const { code, description } = req.body;
  if (!code || !description) return res.status(400).json({ error: 'Missing code or description' });
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO ilos (code, description) VALUES ($1, $2) RETURNING *',
      [code, description]
    );
    client.release();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/syllabus/draft - create a draft syllabus and ensure section_courses is updated
router.post('/draft', async (req, res) => {
  console.log('Draft endpoint hit with body:', req.body);
  const { course_id, term_id, section_id, created_by, title } = req.body;
  if (!course_id || !term_id || !section_id || !created_by) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 1. Insert or update section_courses
    let sectionCourseRes = await client.query(
      `SELECT section_course_id FROM section_courses WHERE course_id = $1 AND section_id = $2 AND term_id = $3`,
      [course_id, section_id, term_id]
    );
    let section_course_id;
    if (sectionCourseRes.rows.length === 0) {
      // Insert new section_course
      const insertRes = await client.query(
        `INSERT INTO section_courses (course_id, section_id, term_id, instructor_id)
         VALUES ($1, $2, $3, $4) RETURNING section_course_id`,
        [course_id, section_id, term_id, created_by]
      );
      section_course_id = insertRes.rows[0].section_course_id;
    } else {
      section_course_id = sectionCourseRes.rows[0].section_course_id;
      // Optionally update instructor_id
      await client.query(
        `UPDATE section_courses SET instructor_id = $1 WHERE section_course_id = $2`,
        [created_by, section_course_id]
      );
    }
    // 2. Insert draft syllabus
    const syllabusRes = await client.query(
      `INSERT INTO syllabi (course_id, term_id, created_by, title, review_status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [course_id, term_id, created_by, title || 'Draft Syllabus']
    );
    await client.query('COMMIT');
    res.status(201).json({ syllabus: syllabusRes.rows[0], section_course_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in /draft endpoint:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    client.release();
  }
});

module.exports = router; 