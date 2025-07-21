const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crms_v2_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'care0924',
});

async function insertComprehensiveCourseData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting comprehensive course data insertion...');

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

    // Get active term
    const termResult = await client.query(`
      SELECT term_id FROM school_terms WHERE is_active = true LIMIT 1
    `);
    
    const activeTermId = termResult.rows[0]?.term_id;
    console.log('📅 Using term ID:', activeTermId);

    // Check existing courses
    const existingCoursesCheck = await client.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN specialization_id IS NULL THEN 1 END) as general,
             COUNT(CASE WHEN specialization_id IS NOT NULL THEN 1 END) as specialized
      FROM courses
    `);
    
    console.log('📋 Existing courses before insertion:', existingCoursesCheck.rows[0]);

    // General Education and Core IT Courses (Black - General subjects)
    const generalCourses = [
      // First Year - First Semester
      { code: 'IT 111', title: 'Introduction to Computing', description: 'Basic computer concepts and programming fundamentals', units: 3 },
      { code: 'GEd 102', title: 'Mathematics in the Modern World', description: 'Mathematical concepts and applications', units: 3 },
      { code: 'GEd 108', title: 'Art Appreciation', description: 'Understanding and appreciation of arts', units: 3 },
      { code: 'Fili 101', title: 'Kontekstwalisadong Komunikasyon sa Filipino', description: 'Filipino communication skills', units: 3 },
      { code: 'PE 101', title: 'Physical Fitness, Gymnastics and Aerobics', description: 'Physical fitness and wellness', units: 2 },
      { code: 'NSTP 111', title: 'National Service Training Program 1', description: 'Civic welfare and community service', units: 3 },
      { code: 'GEd 103', title: 'Life and Works of Rizal', description: 'Study of Jose Rizal and his contributions', units: 3 },
      { code: 'GEd 104', title: 'The Contemporary World', description: 'Understanding the contemporary world', units: 3 },
      { code: 'NSTP 111CW', title: 'NSTP - Civic Welfare Training Service 1', description: 'Civic welfare training', units: 3 },
      { code: 'NSTP 111LT', title: 'NSTP - Literacy Training Service 1', description: 'Literacy training service', units: 3 },
      { code: 'NSTP 111RO', title: 'NSTP - Reserve Officers Training Corps 1', description: 'Military training', units: 3 },

      // First Year - Second Semester
      { code: 'CS 111', title: 'Computer Programming', description: 'Programming concepts and algorithms', units: 3 },
      { code: 'CS 131', title: 'Data Structures and Algorithms', description: 'Data organization and algorithmic thinking', units: 3 },
      { code: 'MATH 111', title: 'Linear Algebra', description: 'Linear algebraic concepts', units: 3 },
      { code: 'NSTP 121', title: 'National Service Training Program 2', description: 'Advanced civic service', units: 3 },
      { code: 'Fili 102', title: 'Filipino sa Iba\'t-ibang Disiplina', description: 'Filipino in various disciplines', units: 3 },
      { code: 'GEd 105', title: 'Readings in Philippine History', description: 'Philippine historical studies', units: 3 },
      { code: 'GEd 109', title: 'Science, Technology and Society', description: 'STS concepts and applications', units: 3 },
      { code: 'PE 102', title: 'Rhythmic Activities', description: 'Dance and rhythmic exercises', units: 2 },
      { code: 'NSTP 121CW', title: 'NSTP - Civic Welfare Training Service 2', description: 'Advanced civic welfare', units: 3 },
      { code: 'NSTP 121LT', title: 'NSTP - Literacy Training Service 2', description: 'Advanced literacy training', units: 3 },
      { code: 'NSTP 121RO', title: 'NSTP - Reserve Officers Training Corps 2', description: 'Advanced military training', units: 3 },

      // Second Year - First Semester
      { code: 'CS 121', title: 'Advanced Computer Programming', description: 'Advanced programming concepts', units: 3 },
      { code: 'IT 211', title: 'Database Management System', description: 'Database design and management', units: 3 },
      { code: 'CS 211', title: 'Object-Oriented Programming', description: 'OOP concepts and implementation', units: 3 },
      { code: 'Litr 102', title: 'ASEAN Literature', description: 'Literature of ASEAN countries', units: 3 },
      { code: 'CpE 405', title: 'Discrete Mathematics', description: 'Mathematical structures for computing', units: 3 },
      { code: 'Phy 101', title: 'Calculus-Based Physics', description: 'Physics with calculus applications', units: 3 },
      { code: 'IT 212', title: 'Computer Networking 1', description: 'Basic networking concepts', units: 3 },
      { code: 'PE 103', title: 'Individual and Dual Sports', description: 'Sports and physical activities', units: 2 },

      // Second Year - Second Semester
      { code: 'IT 221', title: 'Information Management', description: 'Information systems management', units: 3 },
      { code: 'IT 223', title: 'Computer Networking 2', description: 'Advanced networking concepts', units: 3 },
      { code: 'IT 222', title: 'Advanced Database Management System', description: 'Advanced database concepts', units: 3 },
      { code: 'MATH 408', title: 'Data Analysis', description: 'Statistical analysis and data interpretation', units: 3 },
      { code: 'ES 101', title: 'Environmental Sciences', description: 'Environmental awareness and sustainability', units: 3 },
      { code: 'GEd 106', title: 'Purposive Communication', description: 'Communication skills development', units: 3 },
      { code: 'GEd 101', title: 'Understanding the Self', description: 'Self-awareness and personal development', units: 3 },
      { code: 'PE 104', title: 'Team Sports', description: 'Team-based sports activities', units: 2 },

      // Third Year - First Semester
      { code: 'IT 311', title: 'Systems Administration and Maintenance', description: 'System management and maintenance', units: 3 },
      { code: 'IT 312', title: 'Systems Integration and Architecture', description: 'System integration concepts', units: 3 },
      { code: 'IT 313', title: 'System Analysis and Design', description: 'System development lifecycle', units: 3 },
      { code: 'IT 314', title: 'Web Systems and Technologies', description: 'Web development technologies', units: 3 },
      { code: 'GEd 107', title: 'Ethics', description: 'Moral and ethical principles', units: 3 },

      // Third Year - Second Semester
      { code: 'IT 321', title: 'Human-Computer Interaction', description: 'UI/UX design principles', units: 3 },
      { code: 'IT 322', title: 'Advanced Systems Integration and Architecture', description: 'Advanced system integration', units: 3 },
      { code: 'IT 323', title: 'Information Assurance and Security', description: 'Cybersecurity fundamentals', units: 3 },
      { code: 'IT 324', title: 'Capstone Project 1', description: 'First part of capstone project', units: 3 },
      { code: 'IT 325', title: 'IT Project Management', description: 'Project management principles', units: 3 },

      // Third Year - Summer
      { code: 'IT 331', title: 'Application Development and Emerging Technologies', description: 'Modern app development', units: 3 },
      { code: 'IT 332', title: 'Integrative Programming and Technologies', description: 'Integration programming', units: 3 },

      // Fourth Year - First Semester
      { code: 'CS 423', title: 'Social Issues and Professional Practice', description: 'Professional ethics and social responsibility', units: 3 },
      { code: 'IT 411', title: 'Capstone Project 2', description: 'Final capstone project', units: 3 },
      { code: 'ENGG 405', title: 'Technopreneurship', description: 'Technology entrepreneurship', units: 3 },
      { code: 'IT 413', title: 'Advanced Information Assurance and Security', description: 'Advanced cybersecurity', units: 3 },
      { code: 'IT 414', title: 'Systems Quality Assurance', description: 'Quality assurance methodologies', units: 3 },
      { code: 'IT 412', title: 'Platform Technologies', description: 'Modern platform technologies', units: 3 },

      // Fourth Year - Second Semester
      { code: 'IT 421', title: 'IT Internship Training', description: 'Industry internship program', units: 6 }
    ];

    // Business Analytics Track Specialization Courses (Green)
    const batSpecializationCourses = [
      { code: 'BAT 401', title: 'Fundamentals of Business Analytics', description: 'Introduction to business analytics concepts', units: 3 },
      { code: 'BAT 402', title: 'Fundamentals of Analytics Modeling', description: 'Analytics modeling techniques', units: 3 },
      { code: 'BAT 403', title: 'Fundamentals of Enterprise Data Management', description: 'Enterprise data management', units: 3 },
      { code: 'BAT 404', title: 'Analytics Techniques and Tools', description: 'Advanced analytics tools and techniques', units: 3 },
      { code: 'BAT 405', title: 'Analytics Application', description: 'Practical application of analytics', units: 3 }
    ];

    // Network Technology Track Specialization Courses (Green)
    const nttSpecializationCourses = [
      { code: 'NTT 401', title: 'Computer Networking 3', description: 'Advanced networking protocols and architectures', units: 3 },
      { code: 'NTT 402', title: 'Internet of Things (IoT)', description: 'IoT concepts and implementation', units: 3 },
      { code: 'NTT 403', title: 'Computer Networking 4', description: 'Enterprise networking solutions', units: 3 },
      { code: 'NTT 404', title: 'Cloud Computing', description: 'Cloud technologies and services', units: 3 },
      { code: 'NTT 405', title: 'Cybersecurity', description: 'Advanced cybersecurity concepts', units: 3 }
    ];

    // Insert general courses
    console.log('📚 Inserting general courses...');
    let generalInserted = 0;
    let generalSkipped = 0;
    for (const course of generalCourses) {
      try {
        const result = await client.query(`
          INSERT INTO courses (title, course_code, description, specialization_id, term_id)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (course_code) DO NOTHING
          RETURNING course_id
        `, [course.title, course.code, course.description, null, activeTermId]);
        
        if (result.rows.length > 0) {
          generalInserted++;
        } else {
          generalSkipped++;
        }
      } catch (err) {
        console.log(`❌ Error inserting course ${course.code}: ${err.message}`);
        generalSkipped++;
      }
    }
    console.log(`✅ General courses: ${generalInserted} inserted, ${generalSkipped} skipped`);

    // Insert BAT specialization courses
    if (specializations['BA']) {
      console.log('📊 Inserting Business Analytics Track courses...');
      let batInserted = 0;
      let batSkipped = 0;
      for (const course of batSpecializationCourses) {
        try {
          const result = await client.query(`
            INSERT INTO courses (title, course_code, description, specialization_id, term_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (course_code) DO NOTHING
            RETURNING course_id
          `, [course.title, course.code, course.description, specializations['BA'], activeTermId]);
          
          if (result.rows.length > 0) {
            batInserted++;
            console.log(`   ✓ Inserted BAT course: ${course.code} (ID: ${result.rows[0].course_id})`);
          } else {
            batSkipped++;
            console.log(`   ⚠️  BAT course ${course.code} already exists, skipped`);
          }
        } catch (err) {
          console.log(`   ❌ Error inserting BAT course ${course.code}: ${err.message}`);
          batSkipped++;
        }
      }
      console.log(`✅ Business Analytics Track: ${batInserted} inserted, ${batSkipped} skipped`);
    } else {
      console.log('⚠️  Business Analytics specialization not found, skipping BAT courses');
    }

    // Insert NTT specialization courses
    if (specializations['NT']) {
      console.log('🌐 Inserting Network Technology Track courses...');
      console.log(`   Using NT specialization ID: ${specializations['NT']}`);
      let nttInserted = 0;
      let nttSkipped = 0;
      for (const course of nttSpecializationCourses) {
        try {
          const result = await client.query(`
            INSERT INTO courses (title, course_code, description, specialization_id, term_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (course_code) DO NOTHING
            RETURNING course_id
          `, [course.title, course.code, course.description, specializations['NT'], activeTermId]);
          
          if (result.rows.length > 0) {
            nttInserted++;
            console.log(`   ✓ Inserted NTT course: ${course.code} (ID: ${result.rows[0].course_id})`);
          } else {
            nttSkipped++;
            console.log(`   ⚠️  NTT course ${course.code} already exists, skipped`);
          }
        } catch (err) {
          console.log(`   ❌ Error inserting NTT course ${course.code}: ${err.message}`);
          nttSkipped++;
        }
      }
      console.log(`✅ Network Technology Track: ${nttInserted} inserted, ${nttSkipped} skipped`);
    } else {
      console.log('⚠️  Network Technology specialization not found, skipping NTT courses');
    }

    // Final verification
    const finalCounts = await client.query(`
      SELECT 
        COUNT(*) as total_courses,
        COUNT(CASE WHEN specialization_id IS NULL THEN 1 END) as general_courses,
        COUNT(CASE WHEN specialization_id IS NOT NULL THEN 1 END) as specialization_courses
      FROM courses
    `);
    
    console.log('\n🎉 Comprehensive course data insertion completed!');
    console.log('📊 Course counts:', finalCounts.rows[0]);
    
    // Detailed verification of inserted courses
    console.log('\n🔍 Detailed verification:');
    
    // Check courses by specialization ID
    const coursesBySpecialization = await client.query(`
      SELECT 
        specialization_id,
        COUNT(*) as count,
        array_agg(course_code ORDER BY course_code) as courses
      FROM courses
      WHERE specialization_id IS NOT NULL
      GROUP BY specialization_id
      ORDER BY specialization_id
    `);
    
    console.log('📋 Courses by specialization ID:');
    coursesBySpecialization.rows.forEach(row => {
      console.log(`   Specialization ID ${row.specialization_id}: ${row.count} courses`);
      console.log(`      Courses: ${row.courses.join(', ')}`);
    });
    
    // Show specialization breakdown with names
    const specializationBreakdown = await client.query(`
      SELECT 
        ps.specialization_id,
        ps.name as specialization_name,
        ps.abbreviation,
        COUNT(c.course_id) as course_count,
        array_agg(c.course_code ORDER BY c.course_code) FILTER (WHERE c.course_code IS NOT NULL) as course_codes
      FROM program_specializations ps
      LEFT JOIN courses c ON ps.specialization_id = c.specialization_id
      GROUP BY ps.specialization_id, ps.name, ps.abbreviation
      ORDER BY ps.abbreviation
    `);
    
    console.log('\n📋 Courses by specialization (with names):');
    specializationBreakdown.rows.forEach(row => {
      console.log(`   ${row.abbreviation} (ID: ${row.specialization_id}): ${row.course_count} courses`);
      if (row.course_codes && row.course_codes.length > 0) {
        console.log(`      Courses: ${row.course_codes.join(', ')}`);
      }
    });
    
    // Verify general courses count
    const generalCoursesCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM courses 
      WHERE specialization_id IS NULL
    `);
    
    console.log(`\n📚 General courses verification: ${generalCoursesCheck.rows[0].count} courses`);
    
    // Show sample general courses
    const sampleGeneralCourses = await client.query(`
      SELECT course_code, title 
      FROM courses 
      WHERE specialization_id IS NULL 
      ORDER BY course_code 
      LIMIT 10
    `);
    
    console.log('📝 Sample general courses:');
    sampleGeneralCourses.rows.forEach(row => {
      console.log(`   ${row.course_code}: ${row.title}`);
    });

    console.log('\n🚀 Ready to use the comprehensive course catalog!');
    console.log('💡 The system now includes:');
    console.log('   • General IT curriculum courses (black courses from your images)');
    console.log('   • Business Analytics Track specialization courses (BAT - green courses)');
    console.log('   • Network Technology Track specialization courses (NTT - green courses)');
    console.log('   • Note: Software Management (SM) track not included yet as requested');

  } catch (error) {
    console.error('❌ Error inserting comprehensive course data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  insertComprehensiveCourseData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { insertComprehensiveCourseData }; 