const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function insertSampleCourseData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting sample course data insertion...');

    // Insert sample departments
    console.log('📚 Inserting departments...');
    const departmentResults = await client.query(`
      INSERT INTO departments (name, department_abbreviation) VALUES
      ('College of Information Technology', 'CIT'),
      ('College of Engineering', 'COE'),
      ('College of Business Administration', 'CBA')
      ON CONFLICT (department_abbreviation) DO NOTHING
      RETURNING department_id, name, department_abbreviation
    `);
    
    let departments;
    if (departmentResults.rows.length === 0) {
      // If no new rows were inserted, fetch existing ones
      const existingDepts = await client.query('SELECT department_id, name, department_abbreviation FROM departments LIMIT 3');
      departments = existingDepts.rows;
    } else {
      departments = departmentResults.rows;
    }
    
    console.log('✅ Departments inserted/found:', departments.length);

    // Insert sample programs
    console.log('🎓 Inserting programs...');
    const programResults = await client.query(`
      INSERT INTO programs (name, description, program_abbreviation, department_id) VALUES
      ('Bachelor of Science in Information Technology', 'A comprehensive IT program covering software development, networking, and system administration', 'BSIT', $1),
      ('Bachelor of Science in Computer Science', 'Advanced computer science program focusing on algorithms, data structures, and software engineering', 'BSCS', $2),
      ('Bachelor of Science in Computer Engineering', 'Engineering program combining hardware and software development', 'BSCpE', $3)
      ON CONFLICT (program_abbreviation) DO NOTHING
      RETURNING program_id, name, program_abbreviation
    `, [departments[0].department_id, departments[0].department_id, departments[1]?.department_id || departments[0].department_id]);
    
    let programs;
    if (programResults.rows.length === 0) {
      const existingPrograms = await client.query('SELECT program_id, name, program_abbreviation FROM programs LIMIT 3');
      programs = existingPrograms.rows;
    } else {
      programs = programResults.rows;
    }
    
    console.log('✅ Programs inserted/found:', programs.length);

    // Insert sample specializations
    console.log('⚡ Inserting specializations...');
    const specializationResults = await client.query(`
      INSERT INTO program_specializations (name, description, abbreviation, program_id) VALUES
      ('Software Engineering', 'Focus on software development methodologies and practices', 'SE', $1),
      ('Network Technology', 'Specialization in network infrastructure and security', 'NT', $2),
      ('Business Analytics', 'Data analysis and business intelligence specialization', 'BA', $3),
      ('Artificial Intelligence', 'Machine learning and AI algorithms specialization', 'AI', $4),
      ('Web Development', 'Full-stack web development specialization', 'WD', $5)
      ON CONFLICT (abbreviation) DO NOTHING
      RETURNING specialization_id, name, abbreviation
    `, [programs[0].program_id, programs[0].program_id, programs[0].program_id, programs[1]?.program_id || programs[0].program_id, programs[1]?.program_id || programs[0].program_id]);
    
    let specializations;
    if (specializationResults.rows.length === 0) {
      const existingSpecs = await client.query('SELECT specialization_id, name, abbreviation FROM program_specializations LIMIT 5');
      specializations = existingSpecs.rows;
    } else {
      specializations = specializationResults.rows;
    }
    
    console.log('✅ Specializations inserted/found:', specializations.length);

    // Insert sample school terms
    console.log('📅 Inserting school terms...');
    const termResults = await client.query(`
      INSERT INTO school_terms (school_year, semester, start_date, end_date, is_active) VALUES
      ('2024-2025', '1st', '2024-08-01', '2024-12-15', true),
      ('2024-2025', '2nd', '2025-01-15', '2025-05-30', false),
      ('2024-2025', 'Summer', '2025-06-01', '2025-07-31', false),
      ('2023-2024', '2nd', '2024-01-15', '2024-05-30', false)
      ON CONFLICT DO NOTHING
      RETURNING term_id, school_year, semester
    `);
    
    let terms;
    if (termResults.rows.length === 0) {
      const existingTerms = await client.query('SELECT term_id, school_year, semester FROM school_terms LIMIT 4');
      terms = existingTerms.rows;
    } else {
      terms = termResults.rows;
    }
    
    console.log('✅ Terms inserted/found:', terms.length);

    // Insert sample courses
    console.log('📖 Inserting courses...');
    const courseData = [
      {
        title: 'Introduction to Programming',
        course_code: 'IT101',
        description: 'Fundamental programming concepts using Python and basic problem-solving techniques',
        specialization_id: null, // General course
        term_id: terms[0]?.term_id
      },
      {
        title: 'Database Management Systems',
        course_code: 'IT201',
        description: 'Database design, SQL, and database administration concepts',
        specialization_id: null, // General course
        term_id: terms[0]?.term_id
      },
      {
        title: 'Software Engineering Principles',
        course_code: 'IT301',
        description: 'Software development lifecycle, design patterns, and project management',
        specialization_id: specializations[0]?.specialization_id, // Software Engineering
        term_id: terms[0]?.term_id
      },
      {
        title: 'Network Infrastructure Design',
        course_code: 'IT302',
        description: 'Network topology, routing protocols, and network security fundamentals',
        specialization_id: specializations[1]?.specialization_id, // Network Technology
        term_id: terms[0]?.term_id
      },
      {
        title: 'Business Intelligence and Analytics',
        course_code: 'IT303',
        description: 'Data warehousing, ETL processes, and business analytics tools',
        specialization_id: specializations[2]?.specialization_id, // Business Analytics
        term_id: terms[0]?.term_id
      },
      {
        title: 'Machine Learning Fundamentals',
        course_code: 'CS401',
        description: 'Introduction to machine learning algorithms and applications',
        specialization_id: specializations[3]?.specialization_id, // AI
        term_id: terms[0]?.term_id
      }
    ];

    for (const course of courseData) {
      try {
        await client.query(`
          INSERT INTO courses (title, course_code, description, specialization_id, term_id)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (course_code) DO NOTHING
        `, [course.title, course.course_code, course.description, course.specialization_id, course.term_id]);
      } catch (err) {
        console.log(`⚠️  Course ${course.course_code} might already exist, skipping...`);
      }
    }
    
    console.log('✅ Courses inserted/updated');

    // Final verification
    const finalCounts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM departments) as departments,
        (SELECT COUNT(*) FROM programs) as programs,
        (SELECT COUNT(*) FROM program_specializations) as specializations,
        (SELECT COUNT(*) FROM school_terms) as terms,
        (SELECT COUNT(*) FROM courses) as courses
    `);
    
    console.log('\n🎉 Sample course data insertion completed!');
    console.log('📊 Final counts:', finalCounts.rows[0]);
    console.log('\n🚀 You can now test the course management functionality!');
    console.log('💡 Access the Course Management screen to see your data.');

  } catch (error) {
    console.error('❌ Error inserting sample course data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  insertSampleCourseData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { insertSampleCourseData }; 