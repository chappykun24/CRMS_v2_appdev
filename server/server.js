console.log('DEBUG: This is the server.js file being executed!');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // Add this for SHA-256
const syllabusRoutes = require('./routes/syllabus');
const sectionCoursesRouter = require('./routes/sectionCourses');
const usersRouter = require('./routes/users');
const studentsRouter = require('./routes/students');
const assessmentsRoutes = require('./routes/assessments');

const app = express();
const PORT = process.env.PORT || 3001;

// Global log middleware for all requests
app.use((req, res, next) => {
  console.log('SERVER LOG:', req.method, req.originalUrl);
  next();
});

// Middleware
// Allow all origins for development
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register the syllabus router
console.log('Before registering /api/syllabus');
app.use('/api/syllabus', syllabusRoutes);
console.log('After registering /api/syllabus');

// Register the sectionCourses router
console.log('Before registering /api/section-courses');
app.use('/api/section-courses', sectionCoursesRouter);
console.log('After registering /api/section-courses');

// Register the users router
console.log('Before registering /api/users');
app.use('/api/users', usersRouter);
console.log('After registering /api/users');

// Register the students router
console.log('Before registering /api/students');
app.use('/api/students', studentsRouter);
console.log('After registering /api/students');

// Register the assessments router
console.log('Before registering /api/assessments');
app.use('/api/assessments', assessmentsRoutes);
console.log('After registering /api/assessments');

const ALLOWED_IPS = [
  '::1', // IPv6 localhost
  '127.0.0.1', // IPv4 localhost
  '::ffff:127.0.0.1', // IPv4-mapped IPv6 localhost
  '192.168.1.108', // Android device IP (from server logs)
  '::ffff:192.168.1.108', // IPv6-mapped version of Android device IP
  '192.168.1.109', // Current detected IP
  '::ffff:192.168.1.109', // IPv6-mapped version of current detected IP
  '192.168.1.205', // Actual connecting IP from logs
  '::ffff:192.168.1.205', // IPv6-mapped version of actual connecting IP
  '192.168.1.207', // Previous detected IP
  '::ffff:192.168.1.207', // IPv6-mapped version of previous detected IP
  '192.168.1.10', // Actual device IP (from error message)
  '::ffff:192.168.1.10', // IPv6-mapped version of actual device IP
  '192.168.1.11', // Detected IP from script
  '::ffff:192.168.1.11', // IPv6-mapped version of detected IP
  '192.168.193.146', // Your device IPv4
  '::ffff:192.168.193.146', // IPv6-mapped version of your device
  '192.168.192.118', // Frontend device IPv4
  '::ffff:192.168.192.118', // IPv6-mapped version of frontend device
  'localhost', // Sometimes appears as hostname
  '192.168.1.101', // Newly allowed device IPv4
  '::ffff:192.168.1.101', // IPv6-mapped version of newly allowed device
  '192.168.1.105', // Newly allowed device IPv4
  '::ffff:192.168.1.105', // IPv6-mapped version of newly allowed device
  '192.168.1.9', // Manually added current device IP
  '::ffff:192.168.1.9', // IPv6-mapped version
];

// Health check endpoint for connection tests
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Remove or permanently comment out the IP restriction middleware so all IPs are allowed
// app.use((req, res, next) => {
//   const ip = req.ip || req.connection.remoteAddress;
//   const normalizedIp = ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;
//   console.log(`[IP CHECK] Incoming request from IP: ${ip} (normalized: ${normalizedIp})`);
//   if (!ALLOWED_IPS.includes(ip) && !ALLOWED_IPS.includes(normalizedIp)) {
//     return res.status(403).json({ error: `Access denied: Your IP (${ip}, normalized: ${normalizedIp}) is not allowed. Add it to ALLOWED_IPS if needed.` });
//   }
//   next();
// });

// PostgreSQL configuration
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

// Import role mapping utility
const { mapBackendRoleToFrontend } = require('./roleMapping');

// Add this mapping near the top, after imports
const PRIMARY_KEYS = {
  students: 'student_id',
  // add more as needed
};

// Generic CRUD operations
app.get('/api/collections/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM ${collectionId} LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );
    client.release();

    res.json({
      documents: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/collections/:collectionId/documents/:documentId', async (req, res) => {
  try {
    const { collectionId, documentId } = req.params;
    const primaryKey = PRIMARY_KEYS[collectionId] || 'id';
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM ${collectionId} WHERE ${primaryKey} = $1`,
      [documentId]
    );
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/collections/:collectionId/documents', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const data = req.body;

    const client = await pool.connect();

    // Get column names from the table
    const columnsResult = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 AND column_name != 'id'`,
      [collectionId]
    );

    // Only include columns for which data is provided
    const columns = columnsResult.rows.map(row => row.column_name).filter(col => data[col] !== undefined);
    const values = columns.map(col => data[col]);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const result = await client.query(
      `INSERT INTO ${collectionId} (${columns.join(', ')})
       VALUES (${placeholders}) RETURNING *`,
      values
    );
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/collections/:collectionId/documents/:documentId', async (req, res) => {
  try {
    const { collectionId, documentId } = req.params;
    const data = req.body;
    const primaryKey = PRIMARY_KEYS[collectionId] || 'id';
    const client = await pool.connect();
    // Get column names from the table
    const columnsResult = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 AND column_name != $2`,
      [collectionId, primaryKey]
    );
    const columns = columnsResult.rows.map(row => row.column_name);
    const updates = columns
      .filter(col => data[col] !== undefined)
      .map((col, index) => `${col} = $${index + 2}`);
    if (updates.length === 0) {
      client.release();
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    const values = [documentId, ...columns.filter(col => data[col] !== undefined).map(col => data[col])];
    const result = await client.query(
      `UPDATE ${collectionId} SET ${updates.join(', ')}
       WHERE ${primaryKey} = $1 RETURNING *`,
      values
    );
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/collections/:collectionId/documents/:documentId', async (req, res) => {
  try {
    const { collectionId, documentId } = req.params;
    const primaryKey = PRIMARY_KEYS[collectionId] || 'id';
    const client = await pool.connect();
    const result = await client.query(
      `DELETE FROM ${collectionId} WHERE ${primaryKey} = $1 RETURNING *`,
      [documentId]
    );
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Users endpoint - Get all users with role information
app.get('/api/users', async (req, res) => {
  try {
    const { limit = 100, offset = 0, role, is_approved } = req.query;
    
    const client = await pool.connect();
    
    let query = `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.profile_pic,
        u.is_approved,
        u.created_at,
        u.updated_at,
        r.name as role_name,
        up.profile_type,
        up.designation,
        up.office_assigned,
        up.contact_email,
        up.bio,
        up.position
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;
    
    if (role) {
      paramCount++;
      query += ` AND r.name = $${paramCount}`;
      queryParams.push(role);
    }
    
    if (is_approved !== undefined) {
      paramCount++;
      query += ` AND u.is_approved = $${paramCount}`;
      queryParams.push(is_approved === 'true');
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await client.query(query, queryParams);
    client.release();
    
    res.json({
      users: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single user by ID
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const client = await pool.connect();
    const query = `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.profile_pic,
        u.is_approved,
        u.created_at,
        u.updated_at,
        r.name as role_name,
        up.profile_type,
        up.designation,
        up.office_assigned,
        up.contact_email,
        up.bio,
        up.position
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      WHERE u.user_id = $1
    `;
    
    const result = await client.query(query, [userId]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user approval status
app.put('/api/users/:userId/approval', async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_approved } = req.body;
    
    const client = await pool.connect();
    
    // Update user approval status (only the boolean and updated_at)
    const updateQuery = `
      UPDATE users 
      SET is_approved = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $2 
      RETURNING *
    `;
    
    const updateResult = await client.query(updateQuery, [is_approved, userId]);
    
    if (updateResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'User not found' });
    }
    
    client.release();
    
    res.json({
      message: `User ${is_approved ? 'approved' : 'disapproved'} successfully`,
      user: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating user approval:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PROGRAM MANAGEMENT ENDPOINTS =====

// Get all programs
app.get('/api/programs', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
      SELECT 
        p.program_id,
        p.name,
        p.description,
        p.program_abbreviation,
        d.name as department_name,
        d.department_abbreviation
      FROM programs p
      LEFT JOIN departments d ON p.department_id = d.department_id
      ORDER BY p.name
    `;
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      programs: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single program by ID
app.get('/api/programs/:programId', async (req, res) => {
  try {
    const { programId } = req.params;
    
    const client = await pool.connect();
    const query = `
      SELECT 
        p.program_id,
        p.name,
        p.description,
        p.program_abbreviation,
        d.name as department_name,
        d.department_abbreviation,
        d.department_id
      FROM programs p
      LEFT JOIN departments d ON p.department_id = d.department_id
      WHERE p.program_id = $1
    `;
    
    const result = await client.query(query, [programId]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new program
app.post('/api/programs', async (req, res) => {
  try {
    const { name, description, program_abbreviation, department_id } = req.body;
    
    // Validate required fields
    if (!name || !program_abbreviation || !department_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, program_abbreviation, and department_id are required' 
      });
    }
    
    const client = await pool.connect();
    
    // Check if program abbreviation already exists
    const existingProgram = await client.query(
      'SELECT program_id FROM programs WHERE program_abbreviation = $1',
      [program_abbreviation]
    );
    
    if (existingProgram.rows.length > 0) {
      client.release();
      return res.status(409).json({ error: 'Program abbreviation already exists' });
    }
    
    // Check if department exists
    const departmentExists = await client.query(
      'SELECT department_id FROM departments WHERE department_id = $1',
      [department_id]
    );
    
    if (departmentExists.rows.length === 0) {
      client.release();
      return res.status(400).json({ error: 'Department not found' });
    }
    
    // Insert new program
    const insertQuery = `
      INSERT INTO programs (name, description, program_abbreviation, department_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      name, 
      description || null, 
      program_abbreviation, 
      department_id
    ]);
    
    client.release();
    
    res.status(201).json({
      message: 'Program created successfully',
      program: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update program
app.put('/api/programs/:programId', async (req, res) => {
  try {
    const { programId } = req.params;
    const { name, description, program_abbreviation, department_id } = req.body;
    
    const client = await pool.connect();
    
    // Check if program exists
    const existingProgram = await client.query(
      'SELECT program_id FROM programs WHERE program_id = $1',
      [programId]
    );
    
    if (existingProgram.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Program not found' });
    }
    
    // Check if new abbreviation conflicts with other programs
    if (program_abbreviation) {
      const abbreviationConflict = await client.query(
        'SELECT program_id FROM programs WHERE program_abbreviation = $1 AND program_id != $2',
        [program_abbreviation, programId]
      );
      
      if (abbreviationConflict.rows.length > 0) {
        client.release();
        return res.status(409).json({ error: 'Program abbreviation already exists' });
      }
    }
    
    // Update program
    const updateQuery = `
      UPDATE programs 
      SET name = COALESCE($1, name),
          description = $2,
          program_abbreviation = COALESCE($3, program_abbreviation),
          department_id = COALESCE($4, department_id)
      WHERE program_id = $5
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      name, 
      description, 
      program_abbreviation, 
      department_id, 
      programId
    ]);
    
    client.release();
    
    res.json({
      message: 'Program updated successfully',
      program: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete program
app.delete('/api/programs/:programId', async (req, res) => {
  try {
    const { programId } = req.params;
    
    const client = await pool.connect();
    
    // Check if program exists
    const existingProgram = await client.query(
      'SELECT program_id FROM programs WHERE program_id = $1',
      [programId]
    );
    
    if (existingProgram.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Program not found' });
    }
    
    // Delete program (cascade will handle related records)
    const deleteQuery = 'DELETE FROM programs WHERE program_id = $1 RETURNING *';
    const result = await client.query(deleteQuery, [programId]);
    
    client.release();
    
    res.json({
      message: 'Program deleted successfully',
      program: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all specializations
app.get('/api/specializations', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
      SELECT s.specialization_id, s.program_id, s.name, s.description, s.abbreviation,
             p.name as program_name, p.program_abbreviation
      FROM program_specializations s
      JOIN programs p ON s.program_id = p.program_id
      ORDER BY s.name
    `;
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      specializations: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single specialization by ID
app.get('/api/specializations/:specializationId', async (req, res) => {
  try {
    const { specializationId } = req.params;
    
    const client = await pool.connect();
    const query = `
      SELECT s.specialization_id, s.program_id, s.name, s.description, s.abbreviation,
             p.name as program_name, p.program_abbreviation
      FROM program_specializations s
      JOIN programs p ON s.program_id = p.program_id
      WHERE s.specialization_id = $1
    `;
    
    const result = await client.query(query, [specializationId]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Specialization not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching specialization:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new specialization
app.post('/api/specializations', async (req, res) => {
  try {
    const { name, description, abbreviation, program_id } = req.body;
    
    if (!name || !abbreviation || !program_id) {
      return res.status(400).json({ error: 'Name, abbreviation, and program_id are required' });
    }
    
    const client = await pool.connect();
    
    // Check if program exists
    const programCheck = await client.query(
      'SELECT program_id FROM programs WHERE program_id = $1',
      [program_id]
    );
    
    if (programCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Program not found' });
    }
    
    // Check if abbreviation already exists for this program
    const abbreviationCheck = await client.query(
      'SELECT specialization_id FROM program_specializations WHERE abbreviation = $1 AND program_id = $2',
      [abbreviation, program_id]
    );
    
    if (abbreviationCheck.rows.length > 0) {
      client.release();
      return res.status(409).json({ error: 'Specialization abbreviation already exists for this program' });
    }
    
    // Insert new specialization
    const insertQuery = `
      INSERT INTO program_specializations (name, description, abbreviation, program_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [name, description, abbreviation, program_id]);
    client.release();
    
    res.status(201).json({
      message: 'Specialization created successfully',
      specialization: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating specialization:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update specialization
app.put('/api/specializations/:specializationId', async (req, res) => {
  try {
    const { specializationId } = req.params;
    const { name, description, abbreviation, program_id } = req.body;
    
    const client = await pool.connect();
    
    // Check if specialization exists
    const existingSpecialization = await client.query(
      'SELECT specialization_id FROM program_specializations WHERE specialization_id = $1',
      [specializationId]
    );
    
    if (existingSpecialization.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Specialization not found' });
    }
    
    // Check if new abbreviation conflicts with other specializations in the same program
    if (abbreviation) {
      const abbreviationConflict = await client.query(
        'SELECT specialization_id FROM program_specializations WHERE abbreviation = $1 AND program_id = $2 AND specialization_id != $3',
        [abbreviation, program_id, specializationId]
      );
      
      if (abbreviationConflict.rows.length > 0) {
        client.release();
        return res.status(409).json({ error: 'Specialization abbreviation already exists for this program' });
      }
    }
    
    // Update specialization
    const updateQuery = `
      UPDATE program_specializations 
      SET name = COALESCE($1, name),
          description = $2,
          abbreviation = COALESCE($3, abbreviation),
          program_id = COALESCE($4, program_id)
      WHERE specialization_id = $5
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      name, 
      description, 
      abbreviation, 
      program_id, 
      specializationId
    ]);
    
    client.release();
    
    res.json({
      message: 'Specialization updated successfully',
      specialization: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating specialization:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete specialization
app.delete('/api/specializations/:specializationId', async (req, res) => {
  try {
    const { specializationId } = req.params;
    
    const client = await pool.connect();
    
    // Check if specialization exists
    const existingSpecialization = await client.query(
      'SELECT specialization_id FROM program_specializations WHERE specialization_id = $1',
      [specializationId]
    );
    
    if (existingSpecialization.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Specialization not found' });
    }
    
    // Delete specialization
    const deleteQuery = 'DELETE FROM program_specializations WHERE specialization_id = $1 RETURNING *';
    const result = await client.query(deleteQuery, [specializationId]);
    
    client.release();
    
    res.json({
      message: 'Specialization deleted successfully',
      specialization: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting specialization:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all departments (for dropdown)
app.get('/api/departments', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = 'SELECT department_id, name, department_abbreviation FROM departments ORDER BY name';
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      departments: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== COURSE MANAGEMENT ENDPOINTS =====

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
      SELECT 
        c.course_id,
        c.title,
        c.course_code,
        c.description,
        c.created_at,
        c.updated_at,
        ps.name as specialization_name,
        ps.abbreviation as specialization_abbreviation,
        ps.specialization_id,
        p.name as program_name,
        p.program_abbreviation,
        st.school_year,
        st.semester
      FROM courses c
      LEFT JOIN program_specializations ps ON c.specialization_id = ps.specialization_id
      LEFT JOIN programs p ON ps.program_id = p.program_id
      LEFT JOIN school_terms st ON c.term_id = st.term_id
      ORDER BY c.course_code
    `;
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      courses: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single course by ID
app.get('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const client = await pool.connect();
    const query = `
      SELECT 
        c.course_id,
        c.title,
        c.course_code,
        c.description,
        c.specialization_id,
        c.term_id,
        c.created_at,
        c.updated_at,
        ps.name as specialization_name,
        ps.abbreviation as specialization_abbreviation,
        p.name as program_name,
        p.program_abbreviation,
        st.school_year,
        st.semester
      FROM courses c
      LEFT JOIN program_specializations ps ON c.specialization_id = ps.specialization_id
      LEFT JOIN programs p ON ps.program_id = p.program_id
      LEFT JOIN school_terms st ON c.term_id = st.term_id
      WHERE c.course_id = $1
    `;
    
    const result = await client.query(query, [courseId]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new course
app.post('/api/courses', async (req, res) => {
  try {
    const { title, course_code, description, specialization_id, term_id } = req.body;
    
    if (!title || !course_code) {
      return res.status(400).json({ error: 'Title and course_code are required' });
    }
    
    const client = await pool.connect();
    
    // Check if course code already exists
    const existingCourse = await client.query(
      'SELECT course_id FROM courses WHERE course_code = $1',
      [course_code]
    );
    
    if (existingCourse.rows.length > 0) {
      client.release();
      return res.status(409).json({ error: 'Course code already exists' });
    }
    
    // Validate specialization exists if provided
    if (specialization_id) {
      const specializationCheck = await client.query(
        'SELECT specialization_id FROM program_specializations WHERE specialization_id = $1',
        [specialization_id]
      );
      
      if (specializationCheck.rows.length === 0) {
        client.release();
        return res.status(404).json({ error: 'Specialization not found' });
      }
    }
    
    // Validate term exists if provided
    if (term_id) {
      const termCheck = await client.query(
        'SELECT term_id FROM school_terms WHERE term_id = $1',
        [term_id]
      );
      
      if (termCheck.rows.length === 0) {
        client.release();
        return res.status(404).json({ error: 'Term not found' });
      }
    }
    
    // Insert new course
    const insertQuery = `
      INSERT INTO courses (title, course_code, description, specialization_id, term_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      title, 
      course_code, 
      description || null, 
      specialization_id || null, 
      term_id || null
    ]);
    
    client.release();
    
    res.status(201).json({
      message: 'Course created successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update course
app.put('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, course_code, description, specialization_id, term_id } = req.body;
    
    const client = await pool.connect();
    
    // Check if course exists
    const existingCourse = await client.query(
      'SELECT course_id FROM courses WHERE course_id = $1',
      [courseId]
    );
    
    if (existingCourse.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if new course code conflicts with other courses
    if (course_code) {
      const codeConflict = await client.query(
        'SELECT course_id FROM courses WHERE course_code = $1 AND course_id != $2',
        [course_code, courseId]
      );
      
      if (codeConflict.rows.length > 0) {
        client.release();
        return res.status(409).json({ error: 'Course code already exists' });
      }
    }
    
    // Update course
    const updateQuery = `
      UPDATE courses 
      SET title = COALESCE($1, title),
          course_code = COALESCE($2, course_code),
          description = $3,
          specialization_id = $4,
          term_id = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE course_id = $6
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      title, 
      course_code, 
      description, 
      specialization_id, 
      term_id, 
      courseId
    ]);
    
    client.release();
    
    res.json({
      message: 'Course updated successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete course
app.delete('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const client = await pool.connect();
    
    // Check if course exists
    const existingCourse = await client.query(
      'SELECT course_id FROM courses WHERE course_id = $1',
      [courseId]
    );
    
    if (existingCourse.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Delete course
    const deleteQuery = 'DELETE FROM courses WHERE course_id = $1 RETURNING *';
    const result = await client.query(deleteQuery, [courseId]);
    
    client.release();
    
    res.json({
      message: 'Course deleted successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all school terms (for dropdown)
app.get('/api/terms', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
      SELECT term_id, school_year, semester, start_date, end_date, is_active
      FROM school_terms 
      ORDER BY school_year DESC, 
        CASE semester 
          WHEN '1st' THEN 1 
          WHEN '2nd' THEN 2 
          WHEN 'Summer' THEN 3 
        END
    `;
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      terms: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('[API] === Login attempt started ===');
  console.log('[API] Email received:', email);
  console.log('[API] Password received:', password ? '[HIDDEN]' : 'undefined');
  console.log('[API] Request body:', req.body);
  
  try {
    const client = await pool.connect();
    console.log('[API] Database connection established');
    
    // UPDATED QUERY: Join roles to get the role name as 'role'
    const query = `
      SELECT users.*, roles.name AS role
      FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE LOWER(users.email) = LOWER($1) AND users.is_approved = TRUE
    `;
    console.log('[API] Executing query:', query);
    console.log('[API] Query parameters:', [email]);
    
    const userRes = await client.query(query, [email]);
    client.release();
    
    // EXTRA DEBUG LOGGING
    console.log('[API] Query result rows:', userRes.rows);
    console.log('[API] Number of rows returned:', userRes.rows.length);
    
    if (userRes.rows.length === 0) {
      console.log('[API] ❌ No user found or not approved for email:', email);
      
      // Let's check if the user exists but is not approved
      const client2 = await pool.connect();
      const checkUserQuery = `SELECT user_id, email, is_approved FROM users WHERE LOWER(email) = LOWER($1)`;
      const checkResult = await client2.query(checkUserQuery, [email]);
      client2.release();
      
      if (checkResult.rows.length > 0) {
        const user = checkResult.rows[0];
        console.log('[API] 🔍 User exists but is_approved =', user.is_approved);
        console.log('[API] 🔍 User details:', { user_id: user.user_id, email: user.email, is_approved: user.is_approved });
      } else {
        console.log('[API] 🔍 User does not exist in database');
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userRes.rows[0];
    console.log('[API] ✅ User found:', { 
      user_id: user.user_id, 
      email: user.email, 
      role: user.role, 
      is_approved: user.is_approved 
    });
    
    console.log('[API] Comparing password...');
    
    // SHA-256 password comparison
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    const match = sha256Hash === user.password_hash;
    console.log('[API] Password match result:', match);
    
    if (!match) {
      console.log('[API] ❌ Password mismatch for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Remove sensitive info before sending
    delete user.password_hash;
    
    // Map backend role to frontend expected value
    if (user.role) {
      const originalRole = user.role;
      user.role = mapBackendRoleToFrontend(user.role);
      console.log('[API] Role mapped from backend:', originalRole, 'to frontend:', user.role);
    }
    
    console.log('[API] ✅ Login successful for email:', email);
    console.log('[API] Final user object being sent:', user);
    console.log('[API] === Login attempt completed successfully ===');
    
    res.json(user);
  } catch (err) {
    console.error('[API] ❌ Login error:', err);
    console.error('[API] Error stack:', err.stack);
    console.error('[API] === Login attempt failed ===');
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
}); 