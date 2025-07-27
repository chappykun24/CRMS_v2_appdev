-- Sample Data for AppDev Subject
-- Assessments, Sub-Assessments, Students, and Grading Data
-- 87% pass rate, 90% grading completion

-- First, let's ensure we have the AppDev course and syllabus
INSERT INTO courses (course_id, title, course_code, description, created_at) 
VALUES 
(1001, 'Application Development', 'CS 301', 'Advanced application development using modern frameworks and tools', CURRENT_TIMESTAMP)
ON CONFLICT (course_id) DO NOTHING;

-- Create syllabus for AppDev
INSERT INTO syllabi (syllabus_id, course_id, title, description, created_by, created_at)
VALUES 
(1001, 1001, 'Application Development Syllabus', 'Comprehensive syllabus for modern application development', 5, CURRENT_TIMESTAMP)
ON CONFLICT (syllabus_id) DO NOTHING;

-- Create section course
INSERT INTO section_courses (section_course_id, course_id, instructor_id)
VALUES 
(1001, 1001, 5)
ON CONFLICT (section_course_id) DO NOTHING;

-- Create ILOs for AppDev
INSERT INTO ilos (ilo_id, syllabus_id, code, description, category, level, weight_percentage, created_at)
VALUES 
(1001, 1001, 'ILO1', 'Demonstrate proficiency in modern programming languages and frameworks', 'Knowledge', 'Advanced', 25, CURRENT_TIMESTAMP),
(1002, 1001, 'ILO2', 'Design and implement scalable application architectures', 'Skills', 'Advanced', 30, CURRENT_TIMESTAMP),
(1003, 1001, 'ILO3', 'Apply software development best practices and methodologies', 'Skills', 'Advanced', 25, CURRENT_TIMESTAMP),
(1004, 1001, 'ILO4', 'Develop and deploy applications using cloud platforms', 'Skills', 'Advanced', 20, CURRENT_TIMESTAMP)
ON CONFLICT (ilo_id) DO NOTHING;

-- Create 30 students for the class
INSERT INTO students (student_id, student_number, full_name, contact_email, created_at)
VALUES 
(1001, '2021-0001', 'John Smith', 'john.smith@student.edu', CURRENT_TIMESTAMP),
(1002, '2021-0002', 'Maria Garcia', 'maria.garcia@student.edu', CURRENT_TIMESTAMP),
(1003, '2021-0003', 'David Johnson', 'david.johnson@student.edu', CURRENT_TIMESTAMP),
(1004, '2021-0004', 'Sarah Williams', 'sarah.williams@student.edu', CURRENT_TIMESTAMP),
(1005, '2021-0005', 'Michael Brown', 'michael.brown@student.edu', CURRENT_TIMESTAMP),
(1006, '2021-0006', 'Emily Davis', 'emily.davis@student.edu', CURRENT_TIMESTAMP),
(1007, '2021-0007', 'Christopher Miller', 'christopher.miller@student.edu', CURRENT_TIMESTAMP),
(1008, '2021-0008', 'Jessica Wilson', 'jessica.wilson@student.edu', CURRENT_TIMESTAMP),
(1009, '2021-0009', 'Daniel Moore', 'daniel.moore@student.edu', CURRENT_TIMESTAMP),
(1010, '2021-0010', 'Amanda Taylor', 'amanda.taylor@student.edu', CURRENT_TIMESTAMP),
(1011, '2021-0011', 'James Anderson', 'james.anderson@student.edu', CURRENT_TIMESTAMP),
(1012, '2021-0012', 'Ashley Thomas', 'ashley.thomas@student.edu', CURRENT_TIMESTAMP),
(1013, '2021-0013', 'Robert Jackson', 'robert.jackson@student.edu', CURRENT_TIMESTAMP),
(1014, '2021-0014', 'Stephanie White', 'stephanie.white@student.edu', CURRENT_TIMESTAMP),
(1015, '2021-0015', 'Matthew Harris', 'matthew.harris@student.edu', CURRENT_TIMESTAMP),
(1016, '2021-0016', 'Nicole Clark', 'nicole.clark@student.edu', CURRENT_TIMESTAMP),
(1017, '2021-0017', 'Joshua Lewis', 'joshua.lewis@student.edu', CURRENT_TIMESTAMP),
(1018, '2021-0018', 'Hannah Robinson', 'hannah.robinson@student.edu', CURRENT_TIMESTAMP),
(1019, '2021-0019', 'Andrew Walker', 'andrew.walker@student.edu', CURRENT_TIMESTAMP),
(1020, '2021-0020', 'Samantha Perez', 'samantha.perez@student.edu', CURRENT_TIMESTAMP),
(1021, '2021-0021', 'Ryan Hall', 'ryan.hall@student.edu', CURRENT_TIMESTAMP),
(1022, '2021-0022', 'Lauren Young', 'lauren.young@student.edu', CURRENT_TIMESTAMP),
(1023, '2021-0023', 'Kevin Allen', 'kevin.allen@student.edu', CURRENT_TIMESTAMP),
(1024, '2021-0024', 'Megan King', 'megan.king@student.edu', CURRENT_TIMESTAMP),
(1025, '2021-0025', 'Brian Wright', 'brian.wright@student.edu', CURRENT_TIMESTAMP),
(1026, '2021-0026', 'Rachel Lopez', 'rachel.lopez@student.edu', CURRENT_TIMESTAMP),
(1027, '2021-0027', 'Steven Hill', 'steven.hill@student.edu', CURRENT_TIMESTAMP),
(1028, '2021-0028', 'Kimberly Scott', 'kimberly.scott@student.edu', CURRENT_TIMESTAMP),
(1029, '2021-0029', 'Nathan Green', 'nathan.green@student.edu', CURRENT_TIMESTAMP),
(1030, '2021-0030', 'Victoria Adams', 'victoria.adams@student.edu', CURRENT_TIMESTAMP)
ON CONFLICT (student_id) DO NOTHING;

-- Enroll students in the course
INSERT INTO course_enrollments (enrollment_id, student_id, section_course_id, enrollment_date, status)
SELECT 
    generate_series(1001, 1030) as enrollment_id,
    generate_series(1001, 1030) as student_id,
    1001 as section_course_id,
    CURRENT_TIMESTAMP as enrollment_date,
    'enrolled' as status
ON CONFLICT (enrollment_id) DO NOTHING;

-- Create 4 main assessments for AppDev
INSERT INTO assessments (assessment_id, syllabus_id, section_course_id, title, description, type, category, total_points, weight_percentage, due_date, submission_deadline, is_published, is_graded, grading_method, instructions, content_data, status, created_by, created_at)
VALUES 
(1001, 1001, 1001, 'Web Development Fundamentals', 'Introduction to modern web development using HTML5, CSS3, and JavaScript', 'Project', 'Formative', 100, 25, '2024-03-15 23:59:00', '2024-03-15 23:59:00', true, true, 'Rubric', 'Create a responsive website using modern web technologies', '{"type": "web_development", "technologies": ["HTML5", "CSS3", "JavaScript"]}', 'graded', 5, CURRENT_TIMESTAMP),
(1002, 1001, 1001, 'React Application Development', 'Build a single-page application using React.js with modern state management', 'Project', 'Formative', 100, 30, '2024-04-15 23:59:00', '2024-04-15 23:59:00', true, true, 'Rubric', 'Develop a React application with proper component architecture', '{"type": "react_app", "technologies": ["React", "Redux", "Material-UI"]}', 'graded', 5, CURRENT_TIMESTAMP),
(1003, 1001, 1001, 'Backend API Development', 'Create RESTful APIs using Node.js and Express with database integration', 'Project', 'Summative', 100, 25, '2024-05-15 23:59:00', '2024-05-15 23:59:00', true, true, 'Rubric', 'Design and implement a complete backend API system', '{"type": "backend_api", "technologies": ["Node.js", "Express", "MongoDB"]}', 'graded', 5, CURRENT_TIMESTAMP),
(1004, 1001, 1001, 'Full-Stack Application', 'Complete full-stack application with frontend, backend, and database', 'Project', 'Summative', 100, 20, '2024-06-15 23:59:00', '2024-06-15 23:59:00', true, true, 'Rubric', 'Build a complete application demonstrating all learned technologies', '{"type": "full_stack", "technologies": ["React", "Node.js", "MongoDB", "Docker"]}', 'graded', 5, CURRENT_TIMESTAMP)
ON CONFLICT (assessment_id) DO NOTHING;

-- Create 4 sub-assessments for each main assessment (16 total)
-- Assessment 1: Web Development Fundamentals
INSERT INTO sub_assessments (sub_assessment_id, assessment_id, title, description, type, total_points, weight_percentage, due_date, instructions, content_data, ilo_codes, status, is_published, is_graded, order_index, created_by, created_at)
VALUES 
(1001, 1001, 'HTML Structure & Semantics', 'Create semantic HTML structure for a modern website', 'Task', 25, 25, '2024-03-01 23:59:00', 'Build semantic HTML structure with proper accessibility', '{"focus": "semantic_html", "requirements": ["header", "nav", "main", "footer"]}', ARRAY['ILO1'], 'graded', true, true, 1, 5, CURRENT_TIMESTAMP),
(1002, 1001, 'CSS Styling & Layout', 'Implement responsive CSS styling using Flexbox and Grid', 'Task', 25, 25, '2024-03-05 23:59:00', 'Create responsive layouts using modern CSS techniques', '{"focus": "responsive_design", "technologies": ["Flexbox", "Grid", "Media Queries"]}', ARRAY['ILO1'], 'graded', true, true, 2, 5, CURRENT_TIMESTAMP),
(1003, 1001, 'JavaScript Functionality', 'Add interactive features using vanilla JavaScript', 'Task', 25, 25, '2024-03-10 23:59:00', 'Implement JavaScript functionality for user interactions', '{"focus": "javascript", "features": ["DOM manipulation", "Event handling", "Form validation"]}', ARRAY['ILO1'], 'graded', true, true, 3, 5, CURRENT_TIMESTAMP),
(1004, 1001, 'Website Integration', 'Combine all components into a complete website', 'Task', 25, 25, '2024-03-15 23:59:00', 'Integrate all components and deploy the final website', '{"focus": "integration", "deployment": "GitHub Pages"}', ARRAY['ILO2'], 'graded', true, true, 4, 5, CURRENT_TIMESTAMP),

-- Assessment 2: React Application Development
(1005, 1002, 'React Components', 'Create reusable React components with proper props', 'Task', 25, 25, '2024-04-01 23:59:00', 'Build modular React components with proper prop handling', '{"focus": "components", "patterns": ["functional", "props", "composition"]}', ARRAY['ILO1'], 'graded', true, true, 1, 5, CURRENT_TIMESTAMP),
(1006, 1002, 'State Management', 'Implement state management using React hooks', 'Task', 25, 25, '2024-04-05 23:59:00', 'Use React hooks for state management and side effects', '{"focus": "state_management", "hooks": ["useState", "useEffect", "useContext"]}', ARRAY['ILO1', 'ILO3'], 'graded', true, true, 2, 5, CURRENT_TIMESTAMP),
(1007, 1002, 'Routing & Navigation', 'Add client-side routing using React Router', 'Task', 25, 25, '2024-04-10 23:59:00', 'Implement navigation and routing in the React application', '{"focus": "routing", "library": "React Router", "features": ["nested routes", "protected routes"]}', ARRAY['ILO2'], 'graded', true, true, 3, 5, CURRENT_TIMESTAMP),
(1008, 1002, 'API Integration', 'Connect React app to backend APIs', 'Task', 25, 25, '2024-04-15 23:59:00', 'Integrate React frontend with RESTful APIs', '{"focus": "api_integration", "methods": ["fetch", "axios"], "error_handling": true}', ARRAY['ILO2', 'ILO3'], 'graded', true, true, 4, 5, CURRENT_TIMESTAMP),

-- Assessment 3: Backend API Development
(1009, 1003, 'Express Server Setup', 'Set up Express.js server with basic routing', 'Task', 25, 25, '2024-05-01 23:59:00', 'Create Express server with proper middleware and routing', '{"focus": "server_setup", "middleware": ["cors", "helmet", "morgan"]}', ARRAY['ILO2'], 'graded', true, true, 1, 5, CURRENT_TIMESTAMP),
(1010, 1003, 'Database Design', 'Design and implement MongoDB schema', 'Task', 25, 25, '2024-05-05 23:59:00', 'Create MongoDB schemas with proper relationships', '{"focus": "database_design", "features": ["validation", "indexing", "relationships"]}', ARRAY['ILO2', 'ILO3'], 'graded', true, true, 2, 5, CURRENT_TIMESTAMP),
(1011, 1003, 'RESTful API Endpoints', 'Implement CRUD operations for API endpoints', 'Task', 25, 25, '2024-05-10 23:59:00', 'Create RESTful API endpoints with proper HTTP methods', '{"focus": "api_endpoints", "operations": ["GET", "POST", "PUT", "DELETE"], "validation": true}', ARRAY['ILO2', 'ILO3'], 'graded', true, true, 3, 5, CURRENT_TIMESTAMP),
(1012, 1003, 'Authentication & Security', 'Add JWT authentication and security measures', 'Task', 25, 25, '2024-05-15 23:59:00', 'Implement JWT authentication and security best practices', '{"focus": "security", "features": ["JWT", "bcrypt", "input_validation"]}', ARRAY['ILO3', 'ILO4'], 'graded', true, true, 4, 5, CURRENT_TIMESTAMP),

-- Assessment 4: Full-Stack Application
(1013, 1004, 'Project Planning', 'Plan and design the full-stack application architecture', 'Task', 25, 25, '2024-06-01 23:59:00', 'Create comprehensive project plan and architecture design', '{"focus": "planning", "deliverables": ["wireframes", "database_schema", "api_design"]}', ARRAY['ILO2', 'ILO3'], 'graded', true, true, 1, 5, CURRENT_TIMESTAMP),
(1014, 1004, 'Frontend Development', 'Develop the complete React frontend', 'Task', 25, 25, '2024-06-05 23:59:00', 'Build the complete frontend with all features and styling', '{"focus": "frontend", "features": ["user_interface", "state_management", "api_integration"]}', ARRAY['ILO1', 'ILO2'], 'graded', true, true, 2, 5, CURRENT_TIMESTAMP),
(1015, 1004, 'Backend Development', 'Develop the complete Node.js backend', 'Task', 25, 25, '2024-06-10 23:59:00', 'Build the complete backend with all API endpoints and database', '{"focus": "backend", "features": ["api_endpoints", "database", "authentication"]}', ARRAY['ILO2', 'ILO3'], 'graded', true, true, 3, 5, CURRENT_TIMESTAMP),
(1016, 1004, 'Deployment & Testing', 'Deploy and test the complete application', 'Task', 25, 25, '2024-06-15 23:59:00', 'Deploy the application and conduct comprehensive testing', '{"focus": "deployment", "platforms": ["Heroku", "Vercel"], "testing": ["unit", "integration", "e2e"]}', ARRAY['ILO4'], 'graded', true, true, 4, 5, CURRENT_TIMESTAMP)
ON CONFLICT (sub_assessment_id) DO NOTHING;

-- Create student submissions and grades for sub-assessments
-- 90% of students are graded (27 out of 30 students)
-- 87% pass rate means 23-24 students pass out of 27 graded students

-- Function to generate realistic grades with 87% pass rate
DO $$
DECLARE
    student_id INTEGER;
    sub_assessment_id INTEGER;
    total_score DECIMAL;
    is_graded BOOLEAN;
    pass_count INTEGER := 0;
    graded_count INTEGER := 0;
    target_passed INTEGER := 24; -- 87% of 27 graded students
    target_graded INTEGER := 27; -- 90% of 30 students
BEGIN
    -- Loop through all students and sub-assessments
    FOR student_id IN SELECT enrollment_id FROM course_enrollments WHERE section_course_id = 1001 LOOP
        FOR sub_assessment_id IN SELECT sub_assessment_id FROM sub_assessments WHERE assessment_id IN (1001, 1002, 1003, 1004) LOOP
            
            -- Determine if this student should be graded (90% grading rate)
            IF graded_count < target_graded THEN
                is_graded := true;
                graded_count := graded_count + 1;
            ELSE
                is_graded := false;
            END IF;
            
            -- Generate score if graded
            IF is_graded THEN
                -- Generate realistic score with 87% pass rate
                IF pass_count < target_passed THEN
                    -- Pass score (75-100)
                    total_score := 75 + (random() * 25);
                    pass_count := pass_count + 1;
                ELSE
                    -- Fail score (50-74)
                    total_score := 50 + (random() * 24);
                END IF;
                
                -- Insert submission with grade
                INSERT INTO sub_assessment_submissions (
                    submission_id,
                    enrollment_id,
                    sub_assessment_id,
                    submission_type,
                    submission_data,
                    total_score,
                    raw_score,
                    adjusted_score,
                    submitted_at,
                    graded_at,
                    graded_by,
                    status,
                    feedback,
                    remarks,
                    created_at
                ) VALUES (
                    nextval('sub_assessment_submissions_submission_id_seq'),
                    student_id,
                    sub_assessment_id,
                    'file',
                    '{"files": ["submission.zip"], "comments": "Submitted on time"}',
                    total_score,
                    total_score,
                    total_score,
                    CURRENT_TIMESTAMP - interval '1 day',
                    CURRENT_TIMESTAMP,
                    5,
                    'graded',
                    'Good work on this assignment. Keep up the excellent progress!',
                    'Graded: ' || total_score || '/25',
                    CURRENT_TIMESTAMP
                );
            ELSE
                -- Insert submission without grade (not graded yet)
                INSERT INTO sub_assessment_submissions (
                    submission_id,
                    enrollment_id,
                    sub_assessment_id,
                    submission_type,
                    submission_data,
                    submitted_at,
                    status,
                    created_at
                ) VALUES (
                    nextval('sub_assessment_submissions_submission_id_seq'),
                    student_id,
                    sub_assessment_id,
                    'file',
                    '{"files": ["submission.zip"], "comments": "Submitted on time"}',
                    CURRENT_TIMESTAMP - interval '1 day',
                    'submitted',
                    CURRENT_TIMESTAMP
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Update sub-assessment grading status
UPDATE sub_assessments 
SET is_graded = true 
WHERE sub_assessment_id IN (1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016);

-- Create some additional sample data for analytics
INSERT INTO assessment_analytics (analytics_id, assessment_id, total_students, submitted_count, graded_count, average_score, pass_rate, created_at)
VALUES 
(1001, 1001, 30, 30, 27, 82.5, 87.0, CURRENT_TIMESTAMP),
(1002, 1002, 30, 30, 27, 84.2, 87.0, CURRENT_TIMESTAMP),
(1003, 1003, 30, 30, 27, 81.8, 87.0, CURRENT_TIMESTAMP),
(1004, 1004, 30, 30, 27, 83.1, 87.0, CURRENT_TIMESTAMP)
ON CONFLICT (analytics_id) DO NOTHING;

-- Create student performance analytics
INSERT INTO student_performance_analytics (analytics_id, student_id, assessment_id, total_score, average_score, completion_rate, performance_trend, created_at)
SELECT 
    generate_series(1001, 1030) as analytics_id,
    generate_series(1001, 1030) as student_id,
    generate_series(1001, 1004) as assessment_id,
    CASE 
        WHEN random() < 0.87 THEN 75 + (random() * 25) -- 87% pass rate
        ELSE 50 + (random() * 24) -- 13% fail rate
    END as total_score,
    CASE 
        WHEN random() < 0.87 THEN 80 + (random() * 15)
        ELSE 60 + (random() * 10)
    END as average_score,
    90.0 as completion_rate,
    '{"trend": "improving", "consistency": "good"}' as performance_trend,
    CURRENT_TIMESTAMP as created_at
ON CONFLICT (analytics_id) DO NOTHING;

-- Print summary statistics
SELECT 
    'Sample Data Summary' as summary,
    COUNT(DISTINCT s.student_id) as total_students,
    COUNT(DISTINCT a.assessment_id) as total_assessments,
    COUNT(DISTINCT sa.sub_assessment_id) as total_sub_assessments,
    COUNT(DISTINCT sas.submission_id) as total_submissions,
    COUNT(DISTINCT CASE WHEN sas.status = 'graded' THEN sas.submission_id END) as graded_submissions,
    ROUND(COUNT(DISTINCT CASE WHEN sas.status = 'graded' THEN sas.submission_id END) * 100.0 / COUNT(DISTINCT sas.submission_id), 1) as grading_completion_rate,
    ROUND(COUNT(DISTINCT CASE WHEN sas.total_score >= 75 THEN sas.submission_id END) * 100.0 / COUNT(DISTINCT CASE WHEN sas.status = 'graded' THEN sas.submission_id END), 1) as pass_rate
FROM students s
LEFT JOIN course_enrollments ce ON s.student_id = ce.student_id
LEFT JOIN assessments a ON ce.section_course_id = a.section_course_id
LEFT JOIN sub_assessments sa ON a.assessment_id = sa.assessment_id
LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id AND ce.enrollment_id = sas.enrollment_id
WHERE ce.section_course_id = 1001; 