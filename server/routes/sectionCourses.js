const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

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

// POST /api/section-courses/assign-instructor
router.post('/assign-instructor', async (req, res) => {
  console.log('Assign-instructor body:', req.body);
  const { section_course_id, instructor_id } = req.body;
  if (!section_course_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await pool.query(
      'UPDATE section_courses SET instructor_id = $1 WHERE section_course_id = $2',
      [instructor_id, section_course_id]
    );
    res.json({ message: instructor_id ? 'Instructor assigned successfully' : 'Assignment removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

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

module.exports = router; 