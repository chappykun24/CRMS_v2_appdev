const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();

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

// GET /api/section-courses/:section_course_id/students - get all students enrolled in a section_course
router.get('/:section_course_id/students', async (req, res) => {
  const { section_course_id } = req.params;
  if (!section_course_id) {
    return res.status(400).json({ error: 'Missing section_course_id' });
  }
  try {
    const result = await pool.query(`
      SELECT ce.enrollment_id, s.student_id, s.full_name, s.student_number, ce.enrollment_date, ce.status
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
  const { section_course_id, session_id, enrollment_id } = req.params;
  const { status, remarks } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Missing status' });
  }
  try {
    // Update attendance_logs for the given session and enrollment
    const result = await pool.query(
      `UPDATE attendance_logs SET status = $1, remarks = $2, recorded_at = NOW()
       WHERE session_id = $3 AND enrollment_id = $4 RETURNING *`,
      [status, remarks || null, session_id, enrollment_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Attendance log not found' });
    }
    res.json({ message: 'Attendance updated', attendance: result.rows[0] });
  } catch (err) {
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