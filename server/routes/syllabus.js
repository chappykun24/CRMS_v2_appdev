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
    client.release();
    // Attach ILOs to each syllabus
    const syllabiWithILOs = syllabi.map(s => ({
      ...s,
      ilos: ilosBySyllabus[s.syllabus_id] || []
    }));
    res.json(syllabiWithILOs);
  } catch (err) {
    console.error('Error fetching syllabi:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 