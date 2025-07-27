const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function checkRoles() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking roles table...\n');
    
    // Check roles table
    console.log('📋 Roles table:');
    const roles = await client.query(`
      SELECT *
      FROM roles
      ORDER BY role_id
    `);
    
    roles.rows.forEach(role => {
      console.log(`  - ID: ${role.role_id}, Name: ${role.role_name}, Description: ${role.description}`);
    });
    
    console.log('\n👥 Faculty users (role_id = 5):');
    const faculty = await client.query(`
      SELECT user_id, name, email, role_id, is_approved
      FROM users
      WHERE role_id = 5
      ORDER BY user_id
    `);
    
    faculty.rows.forEach(user => {
      console.log(`  - ID: ${user.user_id}, Name: ${user.name}, Email: ${user.email}, Approved: ${user.is_approved}`);
    });
    
    console.log('\n📊 Assessments by faculty:');
    const assessments = await client.query(`
      SELECT 
        a.assessment_id,
        a.title,
        a.created_by,
        a.syllabus_id,
        a.section_course_id,
        u.name as faculty_name,
        u.role_id
      FROM assessments a
      LEFT JOIN users u ON a.created_by = u.user_id
      ORDER BY a.created_by, a.assessment_id
    `);
    
    if (assessments.rows.length === 0) {
      console.log('  No assessments found');
    } else {
      assessments.rows.forEach(assessment => {
        console.log(`  - ID: ${assessment.assessment_id}, Title: ${assessment.title}, Created by: ${assessment.created_by} (${assessment.faculty_name}, role_id: ${assessment.role_id}), Syllabus: ${assessment.syllabus_id}, Section: ${assessment.section_course_id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking roles:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRoles(); 