// ==========================================
// SUBJECT-SPECIFIC ASSESSMENT TEMPLATES
// Linked to actual syllabi in the database
// ==========================================

const pool = require('../server/database');

async function insertSubjectSpecificTemplates() {
  const client = await pool.connect();
  
  try {
    console.log('Starting subject-specific assessment templates insertion...');

    // First, let's add syllabus_id column to assessment_templates if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE assessment_templates 
        ADD COLUMN IF NOT EXISTS syllabus_id INTEGER REFERENCES syllabi(syllabus_id) ON DELETE CASCADE
      `);
      console.log('✅ Added syllabus_id column to assessment_templates table');
    } catch (error) {
      console.log('ℹ️  syllabus_id column already exists or error:', error.message);
    }

    // First, let's check what syllabi exist
    const syllabiResult = await client.query(`
      SELECT 
        s.syllabus_id,
        s.title as syllabus_title,
        s.section_course_id,
        s.approval_status,
        sc.course_id,
        c.course_code,
        c.title as course_title,
        c.description as course_description
      FROM syllabi s
      LEFT JOIN section_courses sc ON s.section_course_id = sc.section_course_id
      LEFT JOIN courses c ON sc.course_id = c.course_id
      WHERE s.approval_status = 'approved'
      ORDER BY s.syllabus_id
    `);

    console.log(`Found ${syllabiResult.rows.length} approved syllabi`);

    for (const syllabus of syllabiResult.rows) {
      console.log(`Creating templates for syllabus ID: ${syllabus.syllabus_id} - ${syllabus.syllabus_title}`);
      
      // Use course information from the query
      const courseInfo = {
        course_code: syllabus.course_code || 'GEN',
        course_title: syllabus.course_title || syllabus.syllabus_title,
        course_description: syllabus.course_description
      };
      
      console.log(`Course: ${courseInfo.course_code} - ${courseInfo.course_title}`);
      
      // Get ILOs for this syllabus
      const ilosResult = await client.query(`
        SELECT code, description, category, level, weight_percentage
        FROM ilos 
        WHERE syllabus_id = $1
        ORDER BY code
      `, [syllabus.syllabus_id]);

      const ilos = ilosResult.rows;
      const iloCodes = ilos.map(ilo => ilo.code);
      
      console.log(`Found ${ilos.length} ILOs: ${iloCodes.join(', ')}`);

      // Create subject-specific templates based on course type
      const courseCode = courseInfo.course_code.toLowerCase();
      let templates = [];

      if (courseCode.includes('cs') || courseCode.includes('it') || courseCode.includes('programming')) {
        // Computer Science/Programming courses
        templates = [
          {
            template_name: `${courseInfo.course_code} - Programming Assessment`,
            template_type: 'Programming',
            description: `Assessment structure for ${courseInfo.course_title} with practical programming components`,
            assessment_structure: {
              assessment_structure: [
                {
                  type: 'Programming Quiz',
                  count: 3,
                  points_per_assessment: 30,
                  weight_per_assessment: 6,
                  total_weight: 18,
                  ilo_coverage: iloCodes.slice(0, 2)
                },
                {
                  type: 'Programming Assignment',
                  count: 4,
                  points_per_assessment: 100,
                  weight_per_assessment: 12,
                  total_weight: 48,
                  ilo_coverage: iloCodes.slice(2, 4)
                },
                {
                  type: 'Midterm Project',
                  count: 1,
                  points_per_assessment: 100,
                  weight_per_assessment: 20,
                  total_weight: 20,
                  ilo_coverage: iloCodes.slice(0, 3)
                },
                {
                  type: 'Final Project',
                  count: 1,
                  points_per_assessment: 100,
                  weight_per_assessment: 14,
                  total_weight: 14,
                  ilo_coverage: iloCodes.slice(3)
                }
              ]
            },
            rubric_template: {
              criteria: [
                {
                  name: 'Code Quality',
                  max_score: 25,
                  description: 'Clean, readable, and well-structured code'
                },
                {
                  name: 'Functionality',
                  max_score: 40,
                  description: 'Correct implementation of required features'
                },
                {
                  name: 'Documentation',
                  max_score: 15,
                  description: 'Clear comments and documentation'
                },
                {
                  name: 'Testing',
                  max_score: 20,
                  description: 'Proper testing and error handling'
                }
              ]
            },
            default_weight: 25,
            ilo_coverage: iloCodes
          }
        ];
      } else if (courseCode.includes('math') || courseCode.includes('calculus') || courseCode.includes('algebra')) {
        // Mathematics courses
        templates = [
          {
            template_name: `${courseInfo.course_code} - Mathematics Assessment`,
            template_type: 'Mathematics',
            description: `Assessment structure for ${courseInfo.course_title} with problem-solving focus`,
            assessment_structure: {
              assessment_structure: [
                {
                  type: 'Homework',
                  count: 8,
                  points_per_assessment: 20,
                  weight_per_assessment: 3,
                  total_weight: 24,
                  ilo_coverage: iloCodes.slice(0, 2)
                },
                {
                  type: 'Problem Set Quiz',
                  count: 5,
                  points_per_assessment: 30,
                  weight_per_assessment: 4,
                  total_weight: 20,
                  ilo_coverage: iloCodes.slice(0, 3)
                },
                {
                  type: 'Midterm Exam',
                  count: 1,
                  points_per_assessment: 100,
                  weight_per_assessment: 28,
                  total_weight: 28,
                  ilo_coverage: iloCodes.slice(0, 4)
                },
                {
                  type: 'Final Exam',
                  count: 1,
                  points_per_assessment: 100,
                  weight_per_assessment: 28,
                  total_weight: 28,
                  ilo_coverage: iloCodes
                }
              ]
            },
            rubric_template: {
              criteria: [
                {
                  name: 'Problem Understanding',
                  max_score: 20,
                  description: 'Correct interpretation of the problem'
                },
                {
                  name: 'Solution Method',
                  max_score: 40,
                  description: 'Appropriate mathematical approach and methodology'
                },
                {
                  name: 'Computations',
                  max_score: 25,
                  description: 'Accurate calculations and algebraic manipulations'
                },
                {
                  name: 'Presentation',
                  max_score: 15,
                  description: 'Clear and organized presentation of solution'
                }
              ]
            },
            default_weight: 25,
            ilo_coverage: iloCodes
          }
        ];
      } else if (courseCode.includes('eng') || courseCode.includes('english') || courseCode.includes('comm')) {
        // English/Communication courses
        templates = [
          {
            template_name: `${courseInfo.course_code} - Communication Assessment`,
            template_type: 'Communication',
            description: `Assessment structure for ${courseInfo.course_title} with writing and presentation focus`,
            assessment_structure: {
              assessment_structure: [
                {
                  type: 'Writing Assignment',
                  count: 4,
                  points_per_assessment: 50,
                  weight_per_assessment: 12,
                  total_weight: 48,
                  ilo_coverage: iloCodes.slice(0, 3)
                },
                {
                  type: 'Presentation',
                  count: 2,
                  points_per_assessment: 60,
                  weight_per_assessment: 15,
                  total_weight: 30,
                  ilo_coverage: iloCodes.slice(2, 4)
                },
                {
                  type: 'Final Portfolio',
                  count: 1,
                  points_per_assessment: 100,
                  weight_per_assessment: 22,
                  total_weight: 22,
                  ilo_coverage: iloCodes
                }
              ]
            },
            rubric_template: {
              criteria: [
                {
                  name: 'Content Quality',
                  max_score: 30,
                  description: 'Depth and relevance of content'
                },
                {
                  name: 'Communication',
                  max_score: 25,
                  description: 'Clear and effective communication'
                },
                {
                  name: 'Organization',
                  max_score: 20,
                  description: 'Logical structure and flow'
                },
                {
                  name: 'Technical Skills',
                  max_score: 25,
                  description: 'Proper use of language and formatting'
                }
              ]
            },
            default_weight: 25,
            ilo_coverage: iloCodes
          }
        ];
      } else if (courseCode.includes('bus') || courseCode.includes('management') || courseCode.includes('marketing')) {
        // Business courses
        templates = [
          {
            template_name: `${courseInfo.course_code} - Business Assessment`,
            template_type: 'Business',
            description: `Assessment structure for ${courseInfo.course_title} with case studies and analysis`,
            assessment_structure: {
              assessment_structure: [
                {
                  type: 'Case Study Analysis',
                  count: 3,
                  points_per_assessment: 60,
                  weight_per_assessment: 15,
                  total_weight: 45,
                  ilo_coverage: iloCodes.slice(0, 3)
                },
                {
                  type: 'Group Project',
                  count: 1,
                  points_per_assessment: 100,
                  weight_per_assessment: 25,
                  total_weight: 25,
                  ilo_coverage: iloCodes.slice(2, 4)
                },
                {
                  type: 'Final Exam',
                  count: 1,
                  points_per_assessment: 100,
                  weight_per_assessment: 30,
                  total_weight: 30,
                  ilo_coverage: iloCodes
                }
              ]
            },
            rubric_template: {
              criteria: [
                {
                  name: 'Analysis',
                  max_score: 30,
                  description: 'Depth and quality of analysis'
                },
                {
                  name: 'Application',
                  max_score: 25,
                  description: 'Application of business concepts and theories'
                },
                {
                  name: 'Critical Thinking',
                  max_score: 25,
                  description: 'Critical evaluation and reasoning'
                },
                {
                  name: 'Communication',
                  max_score: 20,
                  description: 'Clear and effective communication'
                }
              ]
            },
            default_weight: 25,
            ilo_coverage: iloCodes
          }
        ];
      } else {
        // Generic template for other courses
        templates = [
          {
            template_name: `${courseInfo.course_code} - General Assessment`,
            template_type: 'General',
            description: `Assessment structure for ${courseInfo.course_title}`,
            assessment_structure: {
              assessment_structure: [
                {
                  type: 'Quiz',
                  count: 4,
                  points_per_assessment: 25,
                  weight_per_assessment: 5,
                  total_weight: 20,
                  ilo_coverage: iloCodes.slice(0, 2)
                },
                {
                  type: 'Assignment',
                  count: 3,
                  points_per_assessment: 60,
                  weight_per_assessment: 15,
                  total_weight: 45,
                  ilo_coverage: iloCodes.slice(1, 4)
                },
                {
                  type: 'Midterm Exam',
                  count: 1,
                  points_per_assessment: 100,
                  weight_per_assessment: 20,
                  total_weight: 20,
                  ilo_coverage: iloCodes.slice(0, 3)
                },
                {
                  type: 'Final Exam',
                  count: 1,
                  points_per_assessment: 100,
                  weight_per_assessment: 15,
                  total_weight: 15,
                  ilo_coverage: iloCodes
                }
              ]
            },
            rubric_template: {
              criteria: [
                {
                  name: 'Understanding',
                  max_score: 30,
                  description: 'Demonstration of knowledge and understanding'
                },
                {
                  name: 'Application',
                  max_score: 25,
                  description: 'Application of concepts and principles'
                },
                {
                  name: 'Analysis',
                  max_score: 25,
                  description: 'Critical analysis and evaluation'
                },
                {
                  name: 'Communication',
                  max_score: 20,
                  description: 'Clear and effective communication'
                }
              ]
            },
            default_weight: 25,
            ilo_coverage: iloCodes
          }
        ];
      }

      // Insert templates for this syllabus
      for (const template of templates) {
        const result = await client.query(`
          INSERT INTO assessment_templates (
            template_name,
            template_type,
            description,
            assessment_structure,
            rubric_template,
            default_weight,
            ilo_coverage,
            syllabus_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (template_name) DO NOTHING
          RETURNING template_id
        `, [
          template.template_name,
          template.template_type,
          template.description,
          JSON.stringify(template.assessment_structure),
          JSON.stringify(template.rubric_template),
          template.default_weight,
          template.ilo_coverage,
          syllabus.syllabus_id
        ]);

        if (result.rows.length > 0) {
          console.log(`✅ Created template: ${template.template_name} (ID: ${result.rows[0].template_id})`);
        } else {
          console.log(`⏭️  Template already exists: ${template.template_name}`);
        }
      }
    }

    console.log('✅ Subject-specific assessment templates insertion completed successfully!');
  } catch (error) {
    console.error('❌ Error inserting subject-specific templates:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the insertion
insertSubjectSpecificTemplates()
  .then(() => {
    console.log('🎉 Subject-specific assessment templates setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Subject-specific assessment templates setup failed:', error);
    process.exit(1);
  }); 