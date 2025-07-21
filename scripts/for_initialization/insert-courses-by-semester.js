const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function insertCoursesBySemester() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting course insertion with proper semester distribution...');

    // Get existing specializations
    const specializationsResult = await client.query(`
      SELECT specialization_id, abbreviation, name 
      FROM program_specializations 
      WHERE abbreviation IN ('BA', 'NT', 'SE', 'AI', 'WD')
    `);
    
    const specializations = {};
    specializationsResult.rows.forEach(spec => {
      specializations[spec.abbreviation] = spec.specialization_id;
    });
    
    console.log('📋 Found specializations:', specializations);

    // Get available terms
    const termsResult = await client.query(`
      SELECT term_id, school_year, semester 
      FROM school_terms 
      WHERE school_year = '2024-2025'
      ORDER BY semester
    `);
    
    const terms = {};
    termsResult.rows.forEach(term => {
      terms[term.semester] = term.term_id;
      console.log(`📅 ${term.semester}: Term ID ${term.term_id}`);
    });

    // Clear existing courses to avoid conflicts
    console.log('🧹 Clearing existing courses...');
    await client.query('DELETE FROM courses');

    // Define courses by semester with proper term assignment
    const coursesBySemester = {
      // FIRST YEAR - FIRST SEMESTER
      '1st': [
        // First Year - First Semester
        { code: 'IT 111', title: 'Introduction to Computing', description: 'Basic computer concepts and programming fundamentals', units: 3, year: 1 },
        { code: 'GEd 102', title: 'Mathematics in the Modern World', description: 'Mathematical concepts and applications', units: 3, year: 1 },
        { code: 'GEd 108', title: 'Art Appreciation', description: 'Understanding and appreciation of arts', units: 3, year: 1 },
        { code: 'Fili 101', title: 'Kontekstwalisadong Komunikasyon sa Filipino', description: 'Filipino communication skills', units: 3, year: 1 },
        { code: 'PE 101', title: 'Physical Fitness, Gymnastics and Aerobics', description: 'Physical fitness and wellness', units: 2, year: 1 },
        { code: 'NSTP 111', title: 'National Service Training Program 1', description: 'Civic welfare and community service', units: 3, year: 1 },
        { code: 'GEd 103', title: 'Life and Works of Rizal', description: 'Study of Jose Rizal and his contributions', units: 3, year: 1 },
        { code: 'GEd 104', title: 'The Contemporary World', description: 'Understanding the contemporary world', units: 3, year: 1 },
        { code: 'NSTP 111CW', title: 'NSTP - Civic Welfare Training Service 1', description: 'Civic welfare training', units: 3, year: 1 },
        { code: 'NSTP 111LT', title: 'NSTP - Literacy Training Service 1', description: 'Literacy training service', units: 3, year: 1 },
        { code: 'NSTP 111RO', title: 'NSTP - Reserve Officers Training Corps 1', description: 'Military training', units: 3, year: 1 },

        // Second Year - First Semester
        { code: 'CS 121', title: 'Advanced Computer Programming', description: 'Advanced programming concepts', units: 3, year: 2 },
        { code: 'IT 211', title: 'Database Management System', description: 'Database design and management', units: 3, year: 2 },
        { code: 'CS 211', title: 'Object-Oriented Programming', description: 'OOP concepts and implementation', units: 3, year: 2 },
        { code: 'Litr 102', title: 'ASEAN Literature', description: 'Literature of ASEAN countries', units: 3, year: 2 },
        { code: 'CpE 405', title: 'Discrete Mathematics', description: 'Mathematical structures for computing', units: 3, year: 2 },
        { code: 'Phy 101', title: 'Calculus-Based Physics', description: 'Physics with calculus applications', units: 3, year: 2 },
        { code: 'IT 212', title: 'Computer Networking 1', description: 'Basic networking concepts', units: 3, year: 2 },
        { code: 'PE 103', title: 'Individual and Dual Sports', description: 'Sports and physical activities', units: 2, year: 2 },

        // Third Year - First Semester
        { code: 'IT 311', title: 'Systems Administration and Maintenance', description: 'System management and maintenance', units: 3, year: 3 },
        { code: 'IT 312', title: 'Systems Integration and Architecture', description: 'System integration concepts', units: 3, year: 3 },
        { code: 'IT 313', title: 'System Analysis and Design', description: 'System development lifecycle', units: 3, year: 3 },
        { code: 'IT 314', title: 'Web Systems and Technologies', description: 'Web development technologies', units: 3, year: 3 },
        { code: 'GEd 107', title: 'Ethics', description: 'Moral and ethical principles', units: 3, year: 3 },

        // Fourth Year - First Semester
        { code: 'CS 423', title: 'Social Issues and Professional Practice', description: 'Professional ethics and social responsibility', units: 3, year: 4 },
        { code: 'IT 411', title: 'Capstone Project 2', description: 'Final capstone project', units: 3, year: 4 },
        { code: 'ENGG 405', title: 'Technopreneurship', description: 'Technology entrepreneurship', units: 3, year: 4 },
        { code: 'IT 413', title: 'Advanced Information Assurance and Security', description: 'Advanced cybersecurity', units: 3, year: 4 },
        { code: 'IT 414', title: 'Systems Quality Assurance', description: 'Quality assurance methodologies', units: 3, year: 4 },
        { code: 'IT 412', title: 'Platform Technologies', description: 'Modern platform technologies', units: 3, year: 4 }
      ],

      // SECOND SEMESTER
      '2nd': [
        // First Year - Second Semester
        { code: 'CS 111', title: 'Computer Programming', description: 'Programming concepts and algorithms', units: 3, year: 1 },
        { code: 'CS 131', title: 'Data Structures and Algorithms', description: 'Data organization and algorithmic thinking', units: 3, year: 1 },
        { code: 'MATH 111', title: 'Linear Algebra', description: 'Linear algebraic concepts', units: 3, year: 1 },
        { code: 'NSTP 121', title: 'National Service Training Program 2', description: 'Advanced civic service', units: 3, year: 1 },
        { code: 'Fili 102', title: 'Filipino sa Iba\'t-ibang Disiplina', description: 'Filipino in various disciplines', units: 3, year: 1 },
        { code: 'GEd 105', title: 'Readings in Philippine History', description: 'Philippine historical studies', units: 3, year: 1 },
        { code: 'GEd 109', title: 'Science, Technology and Society', description: 'STS concepts and applications', units: 3, year: 1 },
        { code: 'PE 102', title: 'Rhythmic Activities', description: 'Dance and rhythmic exercises', units: 2, year: 1 },
        { code: 'NSTP 121CW', title: 'NSTP - Civic Welfare Training Service 2', description: 'Advanced civic welfare', units: 3, year: 1 },
        { code: 'NSTP 121LT', title: 'NSTP - Literacy Training Service 2', description: 'Advanced literacy training', units: 3, year: 1 },
        { code: 'NSTP 121RO', title: 'NSTP - Reserve Officers Training Corps 2', description: 'Advanced military training', units: 3, year: 1 },

        // Second Year - Second Semester
        { code: 'IT 221', title: 'Information Management', description: 'Information systems management', units: 3, year: 2 },
        { code: 'IT 223', title: 'Computer Networking 2', description: 'Advanced networking concepts', units: 3, year: 2 },
        { code: 'IT 222', title: 'Advanced Database Management System', description: 'Advanced database concepts', units: 3, year: 2 },
        { code: 'MATH 408', title: 'Data Analysis', description: 'Statistical analysis and data interpretation', units: 3, year: 2 },
        { code: 'ES 101', title: 'Environmental Sciences', description: 'Environmental awareness and sustainability', units: 3, year: 2 },
        { code: 'GEd 106', title: 'Purposive Communication', description: 'Communication skills development', units: 3, year: 2 },
        { code: 'GEd 101', title: 'Understanding the Self', description: 'Self-awareness and personal development', units: 3, year: 2 },
        { code: 'PE 104', title: 'Team Sports', description: 'Team-based sports activities', units: 2, year: 2 },

        // Third Year - Second Semester
        { code: 'IT 321', title: 'Human-Computer Interaction', description: 'UI/UX design principles', units: 3, year: 3 },
        { code: 'IT 322', title: 'Advanced Systems Integration and Architecture', description: 'Advanced system integration', units: 3, year: 3 },
        { code: 'IT 323', title: 'Information Assurance and Security', description: 'Cybersecurity fundamentals', units: 3, year: 3 },
        { code: 'IT 324', title: 'Capstone Project 1', description: 'First part of capstone project', units: 3, year: 3 },
        { code: 'IT 325', title: 'IT Project Management', description: 'Project management principles', units: 3, year: 3 },

        // Fourth Year - Second Semester
        { code: 'IT 421', title: 'IT Internship Training', description: 'Industry internship program', units: 6, year: 4 }
      ],

      // SUMMER SEMESTER
      'Summer': [
        // Third Year - Summer
        { code: 'IT 331', title: 'Application Development and Emerging Technologies', description: 'Modern app development', units: 3, year: 3 },
        { code: 'IT 332', title: 'Integrative Programming and Technologies', description: 'Integration programming', units: 3, year: 3 }
      ]
    };

    // Specialization courses by semester
    const specializationCoursesBySemester = {
      '1st': [
        // Third Year - First Semester specialization courses
        { code: 'BAT 401', title: 'Fundamentals of Business Analytics', description: 'Introduction to business analytics concepts', units: 3, specialization: 'BA', year: 3 },
        { code: 'NTT 401', title: 'Computer Networking 3', description: 'Advanced networking protocols and architectures', units: 3, specialization: 'NT', year: 3 },
        // Fourth Year - First Semester specialization courses
        { code: 'BAT 405', title: 'Analytics Application', description: 'Practical application of analytics', units: 3, specialization: 'BA', year: 4 },
        { code: 'NTT 405', title: 'Cybersecurity', description: 'Advanced cybersecurity concepts', units: 3, specialization: 'NT', year: 4 }
      ],
      '2nd': [
        // Third Year - Second Semester specialization courses
        { code: 'BAT 403', title: 'Fundamentals of Enterprise Data Management', description: 'Enterprise data management', units: 3, specialization: 'BA', year: 3 },
        { code: 'NTT 403', title: 'Computer Networking 4', description: 'Enterprise networking solutions', units: 3, specialization: 'NT', year: 3 },
        // Additional specialization courses distributed across semesters
        { code: 'BAT 402', title: 'Fundamentals of Analytics Modeling', description: 'Analytics modeling techniques', units: 3, specialization: 'BA', year: 3 },
        { code: 'BAT 404', title: 'Analytics Techniques and Tools', description: 'Advanced analytics tools and techniques', units: 3, specialization: 'BA', year: 3 },
        { code: 'NTT 402', title: 'Internet of Things (IoT)', description: 'IoT concepts and implementation', units: 3, specialization: 'NT', year: 3 },
        { code: 'NTT 404', title: 'Cloud Computing', description: 'Cloud technologies and services', units: 3, specialization: 'NT', year: 3 }
      ]
    };

    // Insert general courses by semester
    let totalInserted = 0;
    for (const [semester, courses] of Object.entries(coursesBySemester)) {
      if (!terms[semester]) {
        console.log(`⚠️ Semester ${semester} not found in database, skipping...`);
        continue;
      }

      console.log(`\n📚 Inserting ${semester} semester courses...`);
      let semesterInserted = 0;
      
      for (const course of courses) {
        try {
          const result = await client.query(`
            INSERT INTO courses (title, course_code, description, specialization_id, term_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (course_code) DO UPDATE SET 
              term_id = EXCLUDED.term_id,
              updated_at = CURRENT_TIMESTAMP
            RETURNING course_id
          `, [course.title, course.code, course.description, null, terms[semester]]);
          
          semesterInserted++;
          totalInserted++;
          console.log(`   ✓ ${course.code} (Year ${course.year}) → ${semester} semester`);
        } catch (err) {
          console.log(`   ❌ Error with ${course.code}: ${err.message}`);
        }
      }
      console.log(`✅ ${semester} semester: ${semesterInserted} courses inserted`);
    }

    // Insert specialization courses by semester
    for (const [semester, courses] of Object.entries(specializationCoursesBySemester)) {
      if (!terms[semester]) continue;

      console.log(`\n🎯 Inserting ${semester} semester specialization courses...`);
      let semesterSpecInserted = 0;
      
      for (const course of courses) {
        if (!specializations[course.specialization]) {
          console.log(`   ⚠️ Specialization ${course.specialization} not found, skipping ${course.code}`);
          continue;
        }

        try {
          const result = await client.query(`
            INSERT INTO courses (title, course_code, description, specialization_id, term_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (course_code) DO UPDATE SET 
              specialization_id = EXCLUDED.specialization_id,
              term_id = EXCLUDED.term_id,
              updated_at = CURRENT_TIMESTAMP
            RETURNING course_id
          `, [course.title, course.code, course.description, specializations[course.specialization], terms[semester]]);
          
          semesterSpecInserted++;
          totalInserted++;
          console.log(`   ✓ ${course.code} (${course.specialization} - Year ${course.year}) → ${semester} semester`);
        } catch (err) {
          console.log(`   ❌ Error with ${course.code}: ${err.message}`);
        }
      }
      console.log(`✅ ${semester} semester specializations: ${semesterSpecInserted} courses inserted`);
    }

    // Final verification by semester
    console.log('\n🎉 Course insertion by semester completed!');
    console.log(`📊 Total courses inserted: ${totalInserted}`);
    
    for (const [semester, termId] of Object.entries(terms)) {
      const semesterCount = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN specialization_id IS NULL THEN 1 END) as general,
          COUNT(CASE WHEN specialization_id IS NOT NULL THEN 1 END) as specialized
        FROM courses 
        WHERE term_id = $1
      `, [termId]);
      
      const count = semesterCount.rows[0];
      console.log(`\n📅 ${semester} Semester (Term ID: ${termId}):`);
      console.log(`   Total: ${count.total} courses`);
      console.log(`   General: ${count.general} courses`);
      console.log(`   Specialization: ${count.specialized} courses`);
    }

    // Show specialization breakdown
    const specializationBreakdown = await client.query(`
      SELECT 
        ps.abbreviation,
        st.semester,
        COUNT(c.course_id) as course_count,
        array_agg(c.course_code ORDER BY c.course_code) as course_codes
      FROM program_specializations ps
      LEFT JOIN courses c ON ps.specialization_id = c.specialization_id
      LEFT JOIN school_terms st ON c.term_id = st.term_id
      WHERE ps.abbreviation IN ('BA', 'NT')
      GROUP BY ps.specialization_id, ps.abbreviation, st.semester
      ORDER BY ps.abbreviation, st.semester
    `);
    
    console.log('\n📋 Specialization courses by semester:');
    specializationBreakdown.rows.forEach(row => {
      if (row.course_count > 0) {
        console.log(`   ${row.abbreviation} - ${row.semester}: ${row.course_count} courses`);
        console.log(`      ${row.course_codes.join(', ')}`);
      }
    });

    console.log('\n🚀 All courses are now properly distributed across semesters!');
    console.log('💡 Curriculum structure:');
    console.log('   • General courses: distributed across all 4 years');
    console.log('   • BAT specialization: primarily in 3rd-4th year');
    console.log('   • NTT specialization: primarily in 3rd-4th year');
    console.log('   • Summer courses: IT 331, IT 332 (3rd year)');

  } catch (error) {
    console.error('❌ Error inserting courses by semester:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  insertCoursesBySemester()
    .then(() => {
      console.log('✅ Semester-based course insertion completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { insertCoursesBySemester }; 