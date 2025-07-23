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

// GET /api/users?role=student&search=...&limit=...&offset=...
router.get('/', async (req, res) => {
  const { role, search = '', limit = 100, offset = 0 } = req.query;
  let query = 'SELECT user_id, name, sr_code, email, role_name FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role_name = $' + (params.length + 1);
    params.push(role);
  }
  if (search) {
    query += ' AND (LOWER(name) LIKE $' + (params.length + 1) + ' OR LOWER(email) LIKE $' + (params.length + 1) + ' OR LOWER(sr_code) LIKE $' + (params.length + 1) + ')';
    params.push(`%${search.toLowerCase()}%`);
  }
  query += ' ORDER BY name ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(Number(limit));
  params.push(Number(offset));

  try {
    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (err) {
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