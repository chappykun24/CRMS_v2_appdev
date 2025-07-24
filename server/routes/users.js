const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();

// GET /api/users?role=student&search=...&limit=...&offset=...
router.get('/', async (req, res) => {
  const { role, search = '', limit = 100, offset = 0, is_approved } = req.query;
  let query = `
    SELECT u.user_id, u.name, u.email, u.is_approved, r.name as role_name 
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