const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function fixAssessmentAssignments() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing assessment assignments...\n');
    
    // First, let's see what assessments we have
    console.log('📊 Current assessments:');
    const assessments = await client.query(`
      SELECT 
        assessment_id,
        title,
        created_by,
        syllabus_id,
        section_course_id
      FROM assessments
      ORDER BY assessment_id
    `);
    
    assessments.rows.forEach(assessment => {
      console.log(`  - ID: ${assessment.assessment_id}, Title: ${assessment.title}, Created by: ${assessment.created_by}, Syllabus: ${assessment.syllabus_id}, Section: ${assessment.section_course_id}`);
    });
    
    // Get faculty users
    console.log('\n👥 Faculty users:');
    const faculty = await client.query(`
      SELECT user_id, name
      FROM users
      WHERE role_id = 5 AND is_approved = true
      ORDER BY user_id
    `);
    
    faculty.rows.forEach(user => {
      console.log(`  - ID: ${user.user_id}, Name: ${user.name}`);
    });
    
    // Get syllabi with their creators
    console.log('\n📚 Syllabi with creators:');
    const syllabi = await client.query(`
      SELECT 
        syllabus_id,
        title,
        created_by
      FROM syllabi
      ORDER BY syllabus_id
    `);
    
    syllabi.rows.forEach(syllabus => {
      console.log(`  - ID: ${syllabus.syllabus_id}, Title: ${syllabus.title}, Created by: ${syllabus.created_by}`);
    });
    
    // Fix assessments by assigning them to faculty based on syllabus creators
    console.log('\n🔧 Updating assessment assignments...');
    
    for (const assessment of assessments.rows) {
      if (assessment.created_by === null && assessment.syllabus_id) {
        // Find the syllabus creator
        const syllabus = syllabi.rows.find(s => s.syllabus_id === assessment.syllabus_id);
        if (syllabus && syllabus.created_by) {
          await client.query(`
            UPDATE assessments 
            SET created_by = $1 
            WHERE assessment_id = $2
          `, [syllabus.created_by, assessment.assessment_id]);
          
          console.log(`  ✅ Updated assessment ${assessment.assessment_id} (${assessment.title}) to created_by: ${syllabus.created_by}`);
        } else {
          // If no syllabus creator, assign to first faculty member
          if (faculty.rows.length > 0) {
            await client.query(`
              UPDATE assessments 
              SET created_by = $1 
              WHERE assessment_id = $2
            `, [faculty.rows[0].user_id, assessment.assessment_id]);
            
            console.log(`  ✅ Updated assessment ${assessment.assessment_id} (${assessment.title}) to created_by: ${faculty.rows[0].user_id} (default faculty)`);
          }
        }
      }
    }
    
    // Also fix syllabi that don't have created_by
    console.log('\n🔧 Fixing syllabi without creators...');
    for (const syllabus of syllabi.rows) {
      if (syllabus.created_by === null) {
        if (faculty.rows.length > 0) {
          await client.query(`
            UPDATE syllabi 
            SET created_by = $1 
            WHERE syllabus_id = $2
          `, [faculty.rows[0].user_id, syllabus.syllabus_id]);
          
          console.log(`  ✅ Updated syllabus ${syllabus.syllabus_id} (${syllabus.title}) to created_by: ${faculty.rows[0].user_id}`);
        }
      }
    }
    
    console.log('\n✅ Assessment assignments fixed!');
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const updatedAssessments = await client.query(`
      SELECT 
        assessment_id,
        title,
        created_by,
        syllabus_id,
        u.name as faculty_name
      FROM assessments a
      LEFT JOIN users u ON a.created_by = u.user_id
      ORDER BY assessment_id
    `);
    
    updatedAssessments.rows.forEach(assessment => {
      console.log(`  - ID: ${assessment.assessment_id}, Title: ${assessment.title}, Created by: ${assessment.created_by} (${assessment.faculty_name}), Syllabus: ${assessment.syllabus_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing assignments:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAssessmentAssignments(); 