const express = require('express');
const router = express.Router();
const pool = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configure multer for faculty photo uploads
const facultyPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/faculty_photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'faculty_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const facultyPhotoUpload = multer({
  storage: facultyPhotoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// POST /api/faculty/photo - Upload faculty photo
router.post('/faculty/photo', facultyPhotoUpload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.' });
    }

    // Check file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }

    // Return the photo path
    const photoPath = `/uploads/faculty_photos/${req.file.filename}`;
    res.json({ 
      success: true, 
      photo_path: photoPath,
      message: 'Faculty photo uploaded successfully' 
    });

  } catch (error) {
    console.error('Error uploading faculty photo:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload faculty photo' });
  }
});

// GET /api/users?role=student&search=...&limit=...&offset=...
router.get('/', async (req, res) => {
  const { role, search = '', limit = 100, offset = 0, is_approved } = req.query;
  let query = `
    SELECT u.user_id, u.name, u.email, u.profile_pic, u.is_approved, r.name as role_name 
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.role_id 
    WHERE 1=1
  `;
  const params = [];

  if (role) {
    query += ' AND r.name = $' + (params.length + 1);
    params.push(role);
  }
  if (is_approved !== undefined) {
    query += ' AND u.is_approved = $' + (params.length + 1);
    params.push(is_approved === 'true');
  }
  if (search) {
    query += ' AND (LOWER(u.name) LIKE $' + (params.length + 1) + ' OR LOWER(u.email) LIKE $' + (params.length + 1) + ')';
    params.push(`%${search.toLowerCase()}%`);
  }
  query += ' ORDER BY u.name ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(Number(limit));
  params.push(Number(offset));

  try {
    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error in users route:', err);
    res.status(500).json({ error: 'Server error' });
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
        SELECT e.student_id FROM enrollments e WHERE e.section_course_id = $1
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

module.exports = router; 