const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  reapIntervalMillis: 1000,
  createTimeoutMillis: 3000,
  destroyTimeoutMillis: 5000,
  createRetryIntervalMillis: 200,
});

// GET /api/attendance/student/:enrollment_id - Get attendance records for a specific student
router.get('/student/:enrollment_id', async (req, res) => {
  const { enrollment_id } = req.params;
  
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT 
        al.attendance_id,
        al.enrollment_id,
        al.session_id,
        al.status,
        al.session_date,
        al.recorded_at,
        al.remarks,
        s.title as session_title,
        s.session_type,
        s.session_date as session_date
      FROM attendance_logs al
      JOIN sessions s ON al.session_id = s.session_id
      WHERE al.enrollment_id = $1
      ORDER BY s.session_date DESC
    `;
    
    const result = await client.query(query, [enrollment_id]);
    
    client.release();
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// GET /api/attendance/session/:session_id - Get attendance records for a specific session
router.get('/session/:session_id', async (req, res) => {
  const { session_id } = req.params;
  
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT 
        al.attendance_id,
        al.enrollment_id,
        al.session_id,
        al.status,
        al.session_date,
        al.recorded_at,
        al.remarks,
        s.full_name,
        s.student_number,
        ce.enrollment_id
      FROM attendance_logs al
      JOIN course_enrollments ce ON al.enrollment_id = ce.enrollment_id
      JOIN students s ON ce.student_id = s.student_id
      WHERE al.session_id = $1
      ORDER BY s.full_name
    `;
    
    const result = await client.query(query, [session_id]);
    
    client.release();
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// GET /api/attendance/analytics/faculty/:faculty_id - Get attendance analytics for faculty
router.get('/analytics/faculty/:faculty_id', async (req, res) => {
  const { faculty_id } = req.params;
  
  try {
    const client = await pool.connect();
    
    // Get attendance statistics for all classes taught by the faculty
    const query = `
      SELECT 
        sc.section_course_id,
        c.course_code,
        c.title as course_title,
        COUNT(DISTINCT ce.enrollment_id) as total_students,
        COUNT(DISTINCT CASE WHEN al.status = 'present' THEN ce.enrollment_id END) as present_count,
        COUNT(DISTINCT CASE WHEN al.status = 'absent' THEN ce.enrollment_id END) as absent_count,
        COUNT(DISTINCT CASE WHEN al.status = 'late' THEN ce.enrollment_id END) as late_count,
        COUNT(DISTINCT CASE WHEN al.status = 'excused' THEN ce.enrollment_id END) as excused_count,
        COUNT(DISTINCT s.session_id) as total_sessions,
        AVG(CASE WHEN al.status = 'present' THEN 1 WHEN al.status = 'absent' THEN 0 END) * 100 as attendance_rate
      FROM section_courses sc
      JOIN courses c ON sc.course_id = c.course_id
      JOIN course_enrollments ce ON sc.section_course_id = ce.section_course_id
      LEFT JOIN sessions s ON sc.section_course_id = s.section_course_id
      LEFT JOIN attendance_logs al ON ce.enrollment_id = al.enrollment_id AND s.session_id = al.session_id
      WHERE sc.instructor_id = $1
      GROUP BY sc.section_course_id, c.course_code, c.title
      ORDER BY c.course_code
    `;
    
    const result = await client.query(query, [faculty_id]);
    
    client.release();
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching attendance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch attendance analytics' });
  }
});

// GET /api/attendance/student-analytics/:enrollment_id - Get detailed attendance analytics for a student
router.get('/student-analytics/:enrollment_id', async (req, res) => {
  const { enrollment_id } = req.params;
  
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN al.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN al.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN al.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN al.status = 'excused' THEN 1 END) as excused_count,
        AVG(CASE WHEN al.status = 'present' THEN 1 WHEN al.status = 'absent' THEN 0 END) * 100 as attendance_rate
      FROM attendance_logs al
      WHERE al.enrollment_id = $1
    `;
    
    const result = await client.query(query, [enrollment_id]);
    
    client.release();
    
    res.json(result.rows[0] || {
      total_sessions: 0,
      present_count: 0,
      absent_count: 0,
      late_count: 0,
      excused_count: 0,
      attendance_rate: 0
    });
    
  } catch (error) {
    console.error('Error fetching student attendance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch student attendance analytics' });
  }
});

module.exports = router; 