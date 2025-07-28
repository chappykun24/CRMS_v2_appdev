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
      SELECT s.student_id, s.full_name, s.student_number, s.student_photo
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

// PUT /api/students/:studentId/photo - Update student photo
router.put('/:studentId/photo', upload.single('photo'), async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Server-side validation 1: Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided.' });
    }
    
    // Server-side validation 2: Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.' });
    }
    
    // Server-side validation 3: Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    
    // Server-side validation 4: Check if student exists
    const studentCheck = await pool.query('SELECT student_id FROM students WHERE student_id = $1', [studentId]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    
    // Server-side validation 5: Check if file is actually an image
    const fs = require('fs');
    const path = require('path');
    
    try {
      // Basic check: ensure file has image extension
      const ext = path.extname(req.file.filename).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      if (!allowedExtensions.includes(ext)) {
        // Remove the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid file extension.' });
      }
    } catch (validationError) {
      console.error('File validation error:', validationError);
      // Remove the uploaded file if validation fails
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'File validation failed.' });
    }
    
    // Update the student's photo path
    const student_photo = `/uploads/student_photos/${req.file.filename}`;
    const result = await pool.query(
      'UPDATE students SET student_photo = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2 RETURNING *',
      [student_photo, studentId]
    );
    
    res.json({ 
      message: 'Student photo updated successfully!', 
      student: result.rows[0] 
    });
  } catch (err) {
    console.error('Error in PUT /api/students/:studentId/photo:', err.stack || err);
    
    // Clean up uploaded file if there's an error
    if (req.file && req.file.path) {
      try {
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/students/:enrollment_id/comprehensive-data - Get comprehensive student data including grades and attendance
router.get('/:enrollment_id/comprehensive-data', async (req, res) => {
  const { enrollment_id } = req.params;
  
  try {
    const client = await pool.connect();
    
    // Get basic student info
    const studentQuery = `
      SELECT 
        ce.enrollment_id,
        s.student_id,
        s.student_number,
        s.full_name,
        s.contact_email,
        s.student_photo,
        ce.status as enrollment_status,
        sc.section_course_id,
        c.course_code,
        c.title as course_title
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      JOIN courses c ON sc.course_id = c.course_id
      WHERE ce.enrollment_id = $1
    `;
    
    const studentResult = await client.query(studentQuery, [enrollment_id]);
    if (studentResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = studentResult.rows[0];
    
    // Get attendance analytics
    const attendanceQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN al.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN al.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN al.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN al.status = 'excuse' THEN 1 END) as excused_count,
        ROUND(
          (COUNT(CASE WHEN al.status = 'present' THEN 1 END) * 100.0 / COUNT(*))::numeric, 1
        ) as attendance_rate
      FROM attendance_logs al
      WHERE al.enrollment_id = $1
    `;
    
    const attendanceResult = await client.query(attendanceQuery, [enrollment_id]);
    const attendanceData = attendanceResult.rows[0] || {
      total_sessions: 0,
      present_count: 0,
      absent_count: 0,
      late_count: 0,
      excused_count: 0,
      attendance_rate: 0
    };
    
    // Get recent attendance records
    const recentAttendanceQuery = `
      SELECT 
        al.status,
        al.remarks,
        al.recorded_at,
        s.title as session_title,
        s.session_type,
        s.session_date
      FROM attendance_logs al
      JOIN sessions s ON al.session_id = s.session_id
      WHERE al.enrollment_id = $1
      ORDER BY s.session_date DESC
      LIMIT 10
    `;
    
    const recentAttendanceResult = await client.query(recentAttendanceQuery, [enrollment_id]);
    
    // Get assessment grades
    const gradesQuery = `
      SELECT 
        a.assessment_id,
        a.title as assessment_title,
        a.type as assessment_type,
        COALESCE(a.total_points, 10) as total_points,
        sub.submission_id,
        sub.total_score,
        sub.status as submission_status,
        sub.submitted_at,
        sub.remarks,
        ROUND(((sub.total_score * 100.0 / COALESCE(a.total_points, 10))::numeric), 1) as percentage_score
      FROM assessments a
      LEFT JOIN submissions sub ON a.assessment_id = sub.assessment_id AND sub.enrollment_id = $1
      WHERE a.section_course_id = $2
      ORDER BY a.created_at DESC
    `;
    
    const gradesResult = await client.query(gradesQuery, [enrollment_id, student.section_course_id]);
    
    // Get sub-assessment grades
    const subGradesQuery = `
      SELECT 
        sa.sub_assessment_id,
        sa.title as sub_assessment_title,
        sa.total_points,
        sas.submission_id,
        sas.total_score,
        sas.status as submission_status,
        sas.submitted_at,
        sas.remarks,
        CASE 
          WHEN sa.total_points > 0 AND sas.total_score IS NOT NULL 
          THEN ROUND(((sas.total_score * 100.0 / sa.total_points)::numeric), 1)
          ELSE NULL 
        END as percentage_score,
        a.title as parent_assessment_title
      FROM sub_assessments sa
      JOIN assessments a ON sa.assessment_id = a.assessment_id
      LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id AND sas.enrollment_id = $1
      WHERE a.section_course_id = $2
      ORDER BY sa.created_at DESC
    `;
    
    const subGradesResult = await client.query(subGradesQuery, [enrollment_id, student.section_course_id]);
    
    // Calculate overall grade average from both assessments and sub-assessments
    const validAssessmentGrades = gradesResult.rows.filter(row => row.total_score !== null);
    const validSubAssessmentGrades = subGradesResult.rows.filter(row => row.total_score !== null);
    
    const allValidGrades = [
      ...validAssessmentGrades.map(row => parseFloat(row.percentage_score) || 0),
      ...validSubAssessmentGrades.map(row => parseFloat(row.percentage_score) || 0)
    ].filter(grade => !isNaN(grade) && grade > 0);
    
    const overallGrade = allValidGrades.length > 0 
      ? allValidGrades.reduce((sum, grade) => sum + grade, 0) / allValidGrades.length 
      : 0;
    
    // Get analytics cluster data if available
    const clusterQuery = `
      SELECT 
        cluster_label,
        based_on,
        algorithm_used,
        generated_at
      FROM analytics_clusters
      WHERE enrollment_id = $1
      ORDER BY generated_at DESC
      LIMIT 1
    `;
    
    const clusterResult = await client.query(clusterQuery, [enrollment_id]);
    const clusterData = clusterResult.rows[0] || null;
    
    client.release();
    
    // Compile comprehensive data
    const comprehensiveData = {
      student: {
        ...student,
        overall_grade: Math.round(overallGrade * 10) / 10, // Round to 1 decimal place
        total_assessments: gradesResult.rows.length + subGradesResult.rows.length,
        completed_assessments: validAssessmentGrades.length + validSubAssessmentGrades.length,
        completion_rate: (gradesResult.rows.length + subGradesResult.rows.length) > 0 
          ? Math.round(((validAssessmentGrades.length + validSubAssessmentGrades.length) * 100.0 / (gradesResult.rows.length + subGradesResult.rows.length)) * 10) / 10 
          : 0
      },
      attendance: {
        ...attendanceData,
        recent_records: recentAttendanceResult.rows
      },
      grades: {
        assessments: gradesResult.rows,
        sub_assessments: subGradesResult.rows,
        overall_average: Math.round(overallGrade * 10) / 10
      },
      analytics: {
        cluster: clusterData
      }
    };
    
    res.json(comprehensiveData);
    
  } catch (error) {
    console.error('Error fetching comprehensive student data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch student data', details: error.message });
  }
});

module.exports = router; 