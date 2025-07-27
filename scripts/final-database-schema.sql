-- ==========================================
-- CRMS V2 FINAL DATABASE SCHEMA
-- Enhanced Grading System with ILOs, Rubrics, and Analytics
-- ==========================================

-- ==========================================
-- 1. SCHOOL SETTINGS
-- ==========================================

-- 01. departments
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    department_abbreviation VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 02. programs
CREATE TABLE IF NOT EXISTS programs (
    program_id SERIAL PRIMARY KEY,
    department_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    program_abbreviation VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
);

-- 03. program_specializations
CREATE TABLE IF NOT EXISTS program_specializations (
    specialization_id SERIAL PRIMARY KEY,
    program_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    abbreviation VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE
);

-- 04. school_terms
CREATE TABLE IF NOT EXISTS school_terms (
    term_id SERIAL PRIMARY KEY,
    school_year VARCHAR(50) NOT NULL,
    semester VARCHAR(10) CHECK (semester IN ('1st', '2nd', 'Summer')),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 05. sections
CREATE TABLE IF NOT EXISTS sections (
    section_id SERIAL PRIMARY KEY,
    program_id INTEGER,
    specialization_id INTEGER,
    section_code VARCHAR(100) NOT NULL,
    year_level INTEGER CHECK (year_level BETWEEN 1 AND 5),
    term_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    FOREIGN KEY (specialization_id) REFERENCES program_specializations(specialization_id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES school_terms(term_id) ON DELETE CASCADE
);

-- ==========================================
-- 2. USERS & PROFILES
-- ==========================================

-- 06. roles
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 07. users
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER,
    profile_pic TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL
);

-- 08. user_profiles (ENHANCED)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_profile_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE,
    profile_type VARCHAR(50) NOT NULL, -- 'faculty', 'student', 'admin', 'dean', 'staff'
    specialization TEXT,
    designation VARCHAR(100),
    office_assigned VARCHAR(255),
    program_id INTEGER,
    department_id INTEGER,
    term_start DATE,
    term_end DATE,
    contact_email VARCHAR(255),
    contact_number VARCHAR(20),
    bio TEXT,
    position TEXT,
    academic_rank VARCHAR(100), -- For faculty
    research_interests TEXT[], -- For faculty
    teaching_experience INTEGER, -- Years of experience
    education_background TEXT[], -- Array of degrees
    certifications TEXT[], -- Array of certifications
    office_hours JSONB, -- Office hours schedule
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- 09. user_approvals
CREATE TABLE IF NOT EXISTS user_approvals (
    approval_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    approved_by INTEGER,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_note TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 10. students
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE,
    contact_email VARCHAR(255),
    contact_number VARCHAR(20),
    address TEXT,
    emergency_contact JSONB,
    academic_status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'graduated', 'transferred'
    enrollment_year INTEGER,
    program_id INTEGER,
    specialization_id INTEGER,
    student_photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE SET NULL,
    FOREIGN KEY (specialization_id) REFERENCES program_specializations(specialization_id) ON DELETE SET NULL
);

-- ==========================================
-- 3. COURSES & ENROLLMENTS
-- ==========================================

-- 11. courses
CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    units INTEGER DEFAULT 3,
    lecture_hours INTEGER DEFAULT 2,
    laboratory_hours INTEGER DEFAULT 1,
    prerequisites TEXT[],
    term_id INTEGER,
    specialization_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (term_id) REFERENCES school_terms(term_id) ON DELETE SET NULL,
    FOREIGN KEY (specialization_id) REFERENCES program_specializations(specialization_id) ON DELETE SET NULL
);

-- 12. section_courses
CREATE TABLE IF NOT EXISTS section_courses (
    section_course_id SERIAL PRIMARY KEY,
    section_id INTEGER,
    course_id INTEGER,
    instructor_id INTEGER,
    term_id INTEGER,
    room_assignment VARCHAR(100),
    schedule JSONB, -- Class schedule
    max_students INTEGER DEFAULT 50,
    current_enrollment INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (term_id) REFERENCES school_terms(term_id) ON DELETE CASCADE
);

-- 13. course_enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    section_course_id INTEGER,
    student_id INTEGER,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('enrolled', 'dropped', 'completed', 'withdrawn')),
    final_grade VARCHAR(5), -- A, B, C, D, F, INC, etc.
    final_grade_points FLOAT, -- 4.0, 3.0, etc.
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- ==========================================
-- 4. SYLLABI & ILOs
-- ==========================================

-- 14. syllabi (ENHANCED)
CREATE TABLE IF NOT EXISTS syllabi (
    syllabus_id SERIAL PRIMARY KEY,
    course_id INTEGER,
    section_course_id INTEGER,
    term_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_framework JSONB,  -- Predefined assessment structure
    grading_policy JSONB,        -- Grading rules and scales
    course_outline TEXT,         -- Course content outline
    learning_resources TEXT[],   -- Array of resource URLs
    course_objectives TEXT[],    -- Array of course objectives
    prerequisites TEXT[],        -- Array of prerequisites
    course_materials TEXT[],     -- Required materials
    office_hours JSONB,          -- Instructor office hours
    contact_info JSONB,          -- Instructor contact information
    academic_integrity_policy TEXT,
    attendance_policy TEXT,
    late_submission_policy TEXT,
    make_up_policy TEXT,
    total_assessments INTEGER DEFAULT 0,
    published_assessments INTEGER DEFAULT 0,
    graded_assessments INTEGER DEFAULT 0,
    approval_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
    approved_by INTEGER,
    approved_at TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES school_terms(term_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 15. ilos (ENHANCED)
CREATE TABLE IF NOT EXISTS ilos (
    ilo_id SERIAL PRIMARY KEY,
    syllabus_id INTEGER,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(50),           -- Knowledge, Skills, Attitudes
    level VARCHAR(20),              -- Basic, Intermediate, Advanced
    weight_percentage FLOAT,        -- Weight in overall assessment
    assessment_methods TEXT[],      -- How this ILO will be assessed
    learning_activities TEXT[],     -- Activities to achieve this ILO
    bloom_taxonomy_level VARCHAR(50), -- Remember, Understand, Apply, Analyze, Evaluate, Create
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (syllabus_id) REFERENCES syllabi(syllabus_id) ON DELETE CASCADE
);

-- 16. syllabus_ilos
CREATE TABLE IF NOT EXISTS syllabus_ilos (
    syllabus_id INTEGER,
    ilo_id INTEGER,
    weight_percentage FLOAT DEFAULT 0,
    PRIMARY KEY (syllabus_id, ilo_id),
    FOREIGN KEY (syllabus_id) REFERENCES syllabi(syllabus_id) ON DELETE CASCADE,
    FOREIGN KEY (ilo_id) REFERENCES ilos(ilo_id) ON DELETE CASCADE
);

-- ==========================================
-- 5. ASSESSMENTS & GRADING
-- ==========================================

-- 17. assessment_templates (ENHANCED)
CREATE TABLE IF NOT EXISTS assessment_templates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_type VARCHAR(50),
    description TEXT,
    assessment_structure JSONB,          -- Template structure
    rubric_template JSONB,              -- Default rubric structure
    ilo_coverage TEXT[],                -- ILOs this template covers
    default_weight FLOAT,               -- Default weight percentage
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,    -- Can be used by other faculty
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_by INTEGER,
    syllabus_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (syllabus_id) REFERENCES syllabi(syllabus_id) ON DELETE CASCADE
);

-- 18. assessments (ENHANCED)
CREATE TABLE IF NOT EXISTS assessments (
    assessment_id SERIAL PRIMARY KEY,
    syllabus_id INTEGER,                 -- Link to syllabus for reference
    section_course_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,                    -- Detailed description
    type VARCHAR(50) NOT NULL,          -- Quiz, Exam, Project, Assignment, Lab, etc.
    category VARCHAR(50),               -- Formative, Summative, Diagnostic
    total_points FLOAT NOT NULL,        -- Maximum possible points
    weight_percentage FLOAT,            -- Weight in final grade (0-100)
    due_date TIMESTAMP,                 -- When assessment is due
    submission_deadline TIMESTAMP,      -- Last submission time
    is_published BOOLEAN DEFAULT FALSE, -- Whether students can see it
    is_graded BOOLEAN DEFAULT FALSE,    -- Whether grading is complete
    grading_method VARCHAR(50),         -- Rubric, Points, Percentage
    instructions TEXT,                  -- Instructions for students
    content_data JSONB,                 -- Actual assessment content
    ilo_codes TEXT[],                   -- ILOs this assessment covers
    assessment_structure JSONB,         -- Structure of the assessment
    rubric_criteria JSONB,              -- Rubric criteria
    status VARCHAR(20) DEFAULT 'planned', -- planned, draft, active, submissions_closed, grading, graded, archived
    total_submissions INTEGER DEFAULT 0,
    graded_submissions INTEGER DEFAULT 0,
    created_by INTEGER,                 -- Who created the assessment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (syllabus_id) REFERENCES syllabi(syllabus_id) ON DELETE SET NULL,
    FOREIGN KEY (section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 19. sub_assessments (NEW)
CREATE TABLE IF NOT EXISTS sub_assessments (
    sub_assessment_id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    total_points FLOAT NOT NULL,
    weight_percentage FLOAT NOT NULL,
    due_date TIMESTAMP,
    instructions TEXT,
    content_data JSONB,
    ilo_codes TEXT[],                   -- ILOs this sub-assessment covers
    rubric_criteria JSONB,              -- Rubric criteria for this sub-assessment
    status VARCHAR(20) DEFAULT 'planned',
    is_published BOOLEAN DEFAULT FALSE,
    is_graded BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 20. rubrics (ENHANCED)
CREATE TABLE IF NOT EXISTS rubrics (
    rubric_id SERIAL PRIMARY KEY,
    syllabus_id INTEGER,                 -- Link to syllabus for reference
    assessment_id INTEGER,
    sub_assessment_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rubric_type VARCHAR(50),            -- Template, Custom, Standard
    performance_levels JSONB,           -- Excellent, Good, Fair, Poor descriptions
    criteria JSONB,                     -- Detailed criteria with weights
    total_points FLOAT,
    is_template BOOLEAN DEFAULT FALSE,  -- Whether it's a reusable template
    template_name VARCHAR(100),         -- Template name if applicable
    ilo_id INTEGER,                     -- Associated ILO
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (syllabus_id) REFERENCES syllabi(syllabus_id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (sub_assessment_id) REFERENCES sub_assessments(sub_assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (ilo_id) REFERENCES ilos(ilo_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 21. submissions (ENHANCED)
CREATE TABLE IF NOT EXISTS submissions (
    submission_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    assessment_id INTEGER,
    sub_assessment_id INTEGER,
    submission_type VARCHAR(50) DEFAULT 'file',  -- File, Text, Link, etc.
    submission_data JSONB,              -- Flexible submission content
    file_urls TEXT[],                   -- Array of file URLs
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by INTEGER,
    total_score FLOAT,                  -- Final score
    raw_score FLOAT,                    -- Raw score before adjustments
    adjusted_score FLOAT,               -- Score after adjustments
    late_penalty FLOAT DEFAULT 0,       -- Late submission penalty
    status VARCHAR(20) DEFAULT 'submitted', -- submitted, graded, late, incomplete
    feedback TEXT,                      -- Faculty feedback
    remarks TEXT,                       -- Additional remarks
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (sub_assessment_id) REFERENCES sub_assessments(sub_assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 22. sub_assessment_submissions (NEW)
CREATE TABLE IF NOT EXISTS sub_assessment_submissions (
    submission_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL,
    sub_assessment_id INTEGER NOT NULL,
    submission_type VARCHAR(50) DEFAULT 'file',
    submission_data JSONB,
    file_urls TEXT[],
    total_score FLOAT,
    raw_score FLOAT,
    adjusted_score FLOAT,
    late_penalty FLOAT DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by INTEGER,
    status VARCHAR(20) DEFAULT 'submitted',
    feedback TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (sub_assessment_id) REFERENCES sub_assessments(sub_assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE(enrollment_id, sub_assessment_id)
);

-- 23. rubric_scores (ENHANCED)
CREATE TABLE IF NOT EXISTS rubric_scores (
    rubric_score_id SERIAL PRIMARY KEY,
    submission_id INTEGER,
    sub_assessment_submission_id INTEGER,
    rubric_id INTEGER,
    criterion_name VARCHAR(255),
    criterion_score FLOAT,
    criterion_feedback TEXT,
    performance_level VARCHAR(50),      -- Excellent, Good, Fair, Poor
    max_possible_score FLOAT,
    weight_percentage FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(submission_id) ON DELETE CASCADE,
    FOREIGN KEY (sub_assessment_submission_id) REFERENCES sub_assessment_submissions(submission_id) ON DELETE CASCADE,
    FOREIGN KEY (rubric_id) REFERENCES rubrics(rubric_id) ON DELETE CASCADE
);

-- 24. assessment_ilo_weights (ENHANCED)
CREATE TABLE IF NOT EXISTS assessment_ilo_weights (
    assessment_ilo_weight_id SERIAL PRIMARY KEY,
    assessment_id INTEGER,
    sub_assessment_id INTEGER,
    ilo_id INTEGER,
    weight_percentage FLOAT CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (sub_assessment_id) REFERENCES sub_assessments(sub_assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (ilo_id) REFERENCES ilos(ilo_id) ON DELETE CASCADE
);

-- 25. student_ilo_scores (ENHANCED)
CREATE TABLE IF NOT EXISTS student_ilo_scores (
    student_ilo_score_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    ilo_id INTEGER,
    assessment_id INTEGER,
    sub_assessment_id INTEGER,
    score FLOAT,
    max_possible_score FLOAT,
    percentage_score FLOAT,
    weight_contribution FLOAT,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (ilo_id) REFERENCES ilos(ilo_id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (sub_assessment_id) REFERENCES sub_assessments(sub_assessment_id) ON DELETE CASCADE
);

-- 26. course_final_grades (ENHANCED)
CREATE TABLE IF NOT EXISTS course_final_grades (
    final_grade_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER UNIQUE,
    total_score FLOAT,
    final_percentage FLOAT,
    letter_grade VARCHAR(5),
    grade_points FLOAT,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    computed_by INTEGER,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (computed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ==========================================
-- 6. ANALYTICS & CLUSTERING
-- ==========================================

-- 27. analytics_clusters (ENHANCED)
CREATE TABLE IF NOT EXISTS analytics_clusters (
    cluster_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    cluster_label VARCHAR(100),
    cluster_type VARCHAR(50),           -- 'performance', 'engagement', 'risk', 'ilo_mastery'
    based_on JSONB,                     -- What data was used for clustering
    algorithm_used VARCHAR(100),        -- K-means, DBSCAN, etc.
    model_version VARCHAR(50),
    confidence_score FLOAT,             -- Confidence in the clustering
    cluster_characteristics JSONB,      -- Characteristics of this cluster
    recommendations JSONB,              -- Recommendations for this cluster
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE
);

-- 28. analytics_metrics (NEW)
CREATE TABLE IF NOT EXISTS analytics_metrics (
    metric_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    metric_type VARCHAR(50),            -- 'ilo_mastery', 'performance_trend', 'engagement_score'
    metric_name VARCHAR(100),
    metric_value FLOAT,
    metric_unit VARCHAR(20),            -- 'percentage', 'score', 'count'
    calculation_method VARCHAR(100),    -- How this metric was calculated
    data_source JSONB,                  -- Source data used for calculation
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE
);

-- 29. analytics_filters (NEW)
CREATE TABLE IF NOT EXISTS analytics_filters (
    filter_id SERIAL PRIMARY KEY,
    filter_name VARCHAR(100),
    filter_type VARCHAR(50),            -- 'ilo', 'performance', 'demographic', 'temporal'
    filter_criteria JSONB,              -- Filter criteria
    created_by INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 30. dashboards_data_cache (ENHANCED)
CREATE TABLE IF NOT EXISTS dashboards_data_cache (
    cache_id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE,
    cache_type VARCHAR(50),             -- 'analytics', 'grades', 'performance'
    course_id INTEGER,
    section_course_id INTEGER,
    data_json JSONB,
    expires_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE
);

-- ==========================================
-- 7. ATTENDANCE & SESSIONS
-- ==========================================

-- 31. sessions
CREATE TABLE IF NOT EXISTS sessions (
    session_id SERIAL PRIMARY KEY,
    section_course_id INTEGER,
    session_date DATE,
    session_type VARCHAR(50),           -- 'lecture', 'laboratory', 'discussion'
    start_time TIME,
    end_time TIME,
    topic VARCHAR(255),
    description TEXT,
    materials TEXT[],
    is_attendance_required BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 32. attendance_logs
CREATE TABLE IF NOT EXISTS attendance_logs (
    attendance_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    session_id INTEGER,
    session_date DATE,
    status VARCHAR(20) DEFAULT 'present', -- 'present', 'absent', 'late', 'excused'
    time_in TIME,
    time_out TIME,
    remarks TEXT,
    recorded_by INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ==========================================
-- 8. NOTIFICATIONS & FILES
-- ==========================================

-- 33. notifications (ENHANCED)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255),
    message TEXT,
    notification_type VARCHAR(50),      -- 'grade', 'assignment', 'announcement', 'reminder'
    related_type VARCHAR(50),           -- 'assessment', 'submission', 'syllabus'
    related_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 34. uploads (ENHANCED)
CREATE TABLE IF NOT EXISTS uploads (
    upload_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    file_name VARCHAR(255),
    file_url TEXT,
    file_type VARCHAR(50),
    file_size INTEGER,
    mime_type VARCHAR(100),
    related_type VARCHAR(50),           -- 'syllabus', 'assessment', 'submission'
    related_id INTEGER,
    upload_purpose VARCHAR(50),         -- 'profile_pic', 'assignment', 'syllabus'
    is_public BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ==========================================
-- COMPREHENSIVE INDEXES FOR PERFORMANCE
-- ==========================================

-- User and Profile Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(is_approved);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_students_number ON students(student_number);
CREATE INDEX IF NOT EXISTS idx_students_program ON students(program_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(academic_status);

-- Course and Enrollment Indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_section_courses_instructor ON section_courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_section_courses_status ON section_courses(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON course_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);

-- Syllabus and ILO Indexes
CREATE INDEX IF NOT EXISTS idx_syllabi_course ON syllabi(course_id);
CREATE INDEX IF NOT EXISTS idx_syllabi_section_course ON syllabi(section_course_id);
CREATE INDEX IF NOT EXISTS idx_syllabi_approval_status ON syllabi(approval_status);
CREATE INDEX IF NOT EXISTS idx_syllabi_created_by ON syllabi(created_by);
CREATE INDEX IF NOT EXISTS idx_ilos_syllabus ON ilos(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_ilos_code ON ilos(code);
CREATE INDEX IF NOT EXISTS idx_ilos_category ON ilos(category);
CREATE INDEX IF NOT EXISTS idx_ilos_level ON ilos(level);

-- Assessment Indexes
CREATE INDEX IF NOT EXISTS idx_assessments_syllabus ON assessments(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_assessments_section_course ON assessments(section_course_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_published ON assessments(is_published);
CREATE INDEX IF NOT EXISTS idx_assessments_graded ON assessments(is_graded);
CREATE INDEX IF NOT EXISTS idx_assessments_ilo_codes ON assessments USING GIN(ilo_codes);
CREATE INDEX IF NOT EXISTS idx_sub_assessments_assessment ON sub_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_sub_assessments_status ON sub_assessments(status);
CREATE INDEX IF NOT EXISTS idx_sub_assessments_published ON sub_assessments(is_published);
CREATE INDEX IF NOT EXISTS idx_sub_assessments_graded ON sub_assessments(is_graded);
CREATE INDEX IF NOT EXISTS idx_sub_assessments_ilo_codes ON sub_assessments USING GIN(ilo_codes);

-- Rubric Indexes
CREATE INDEX IF NOT EXISTS idx_rubrics_syllabus ON rubrics(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_assessment ON rubrics(assessment_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_sub_assessment ON rubrics(sub_assessment_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_ilo ON rubrics(ilo_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_type ON rubrics(rubric_type);

-- Submission Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_enrollment ON submissions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assessment ON submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_sub_assessment ON submissions(sub_assessment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_enrollment ON sub_assessment_submissions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_sub_assessment ON sub_assessment_submissions(sub_assessment_id);
CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_status ON sub_assessment_submissions(status);

-- Rubric Score Indexes
CREATE INDEX IF NOT EXISTS idx_rubric_scores_submission ON rubric_scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_rubric_scores_sub_assessment_submission ON rubric_scores(sub_assessment_submission_id);
CREATE INDEX IF NOT EXISTS idx_rubric_scores_rubric ON rubric_scores(rubric_id);

-- ILO Score Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_ilo_weights_assessment ON assessment_ilo_weights(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_ilo_weights_sub_assessment ON assessment_ilo_weights(sub_assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_ilo_weights_ilo ON assessment_ilo_weights(ilo_id);
CREATE INDEX IF NOT EXISTS idx_student_ilo_scores_enrollment ON student_ilo_scores(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_student_ilo_scores_ilo ON student_ilo_scores(ilo_id);
CREATE INDEX IF NOT EXISTS idx_student_ilo_scores_assessment ON student_ilo_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_student_ilo_scores_sub_assessment ON student_ilo_scores(sub_assessment_id);

-- Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_clusters_enrollment ON analytics_clusters(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clusters_type ON analytics_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_analytics_clusters_label ON analytics_clusters(cluster_label);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_enrollment ON analytics_metrics(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type ON analytics_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_filters_type ON analytics_filters(filter_type);
CREATE INDEX IF NOT EXISTS idx_dashboards_cache_key ON dashboards_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_dashboards_cache_type ON dashboards_data_cache(cache_type);

-- Session and Attendance Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_section_course ON sessions(section_course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_enrollment ON attendance_logs(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_session ON attendance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_status ON attendance_logs(status);

-- Notification and Upload Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_type ON uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_uploads_related ON uploads(related_type, related_id);

-- ==========================================
-- SAMPLE DATA INSERTION
-- ==========================================

-- Insert basic roles
INSERT INTO roles (name, description) VALUES 
('admin', 'System Administrator'),
('dean', 'Dean of College'),
('faculty', 'Faculty Member'),
('staff', 'Staff Member'),
('student', 'Student')
ON CONFLICT (name) DO NOTHING;

-- Insert basic departments
INSERT INTO departments (name, department_abbreviation) VALUES 
('College of Engineering', 'COE'),
('College of Arts and Sciences', 'CAS'),
('College of Business Administration', 'CBA')
ON CONFLICT (department_abbreviation) DO NOTHING;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

-- The final database schema is now complete
-- This schema supports:
-- 1. Comprehensive user profiles for all user types
-- 2. Enhanced grading system with ILOs and rubrics
-- 3. Sub-assessments for detailed task grading
-- 4. Analytics clustering for student performance analysis
-- 5. Complete assessment workflow from creation to grading
-- 6. Performance optimization with comprehensive indexing 