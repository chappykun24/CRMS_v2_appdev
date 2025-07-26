const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();
const multer = require('multer');
const path = require('path');

// Multer setup for student photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/student_photos'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `student_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// GET /api/students/available-for-section/:section_course_id?search=...
router.get('/available-for-section/:section_course_id', async (req, res) => {
  const { section_course_id } = req.params;
  const { search = '' } = req.query;
  if (!section_course_id) {
    return res.status(400).json({ error: 'Missing section_course_id' });
  }
  try {
    let query = `
      SELECT s.student_id, s.full_name, s.student_number
      FROM students s
      WHERE s.student_id NOT IN (
        SELECT ce.student_id FROM course_enrollments ce WHERE ce.section_course_id = $1
      )
    `;
    const params = [section_course_id];
    if (search) {
      query += ` AND (LOWER(s.full_name) LIKE $2 OR LOWER(s.student_number) LIKE $2)`;
      params.push(`%${search.toLowerCase()}%`);
    }
    query += ' ORDER BY s.full_name ASC';
    const result = await pool.query(query, params);
    res.json({ students: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/students - Create a new student with optional photo
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const {
      student_number,
      first_name,
      middle_initial,
      last_name,
      suffix,
      gender,
      contact_email
    } = req.body;
    if (!student_number || !first_name || !last_name || !gender || !contact_email) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    let student_photo = null;
    if (req.file) {
      student_photo = `/uploads/student_photos/${req.file.filename}`;
    }
    // Insert student into DB - using the actual database schema
    const full_name = [last_name, first_name, middle_initial, suffix].filter(Boolean).join(' ');
    const result = await pool.query(
      `INSERT INTO students (student_number, full_name, gender, contact_email, student_photo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_number, full_name, gender, contact_email, student_photo]
    );
    res.status(201).json({ message: 'Student created successfully!', student: result.rows[0] });
  } catch (err) {
    console.error('Error in POST /api/students:', err.stack || err, '\nRequest body:', req.body);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/students/enroll - Enroll a student in a section_course
router.post('/enroll', async (req, res) => {
  const { section_course_id, student_id } = req.body;
  if (!section_course_id || !student_id) {
    return res.status(400).json({ error: 'Missing section_course_id or student_id' });
  }
  try {
    // Validate section_course_id
    const sectionRes = await pool.query('SELECT section_course_id FROM section_courses WHERE section_course_id = $1', [section_course_id]);
    if (sectionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Section course not found.' });
    }
    // Validate student_id
    const studentRes = await pool.query('SELECT student_id FROM students WHERE student_id = $1', [student_id]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    // Check if already enrolled
    const check = await pool.query(
      'SELECT * FROM course_enrollments WHERE section_course_id = $1 AND student_id = $2',
      [section_course_id, student_id]
    );
    if (check.rows.length > 0) {
      return res.status(409).json({ error: 'Student already enrolled in this class.' });
    }
    // Insert enrollment
    const result = await pool.query(
      `INSERT INTO course_enrollments (section_course_id, student_id, status) VALUES ($1, $2, 'enrolled') RETURNING *`,
      [section_course_id, student_id]
    );
    res.status(201).json({ message: 'Student enrolled successfully!', confirmation: `Student ${student_id} enrolled in section_course ${section_course_id}.`, enrollment: result.rows[0] });
  } catch (err) {
    console.error('Error in /students/enroll:', err.stack || err, '\nRequest body:', req.body);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 