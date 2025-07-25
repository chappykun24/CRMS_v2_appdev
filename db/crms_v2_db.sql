-- ==========================================
-- 1. SCHOOL SETTINGS
-- ==========================================
-- 01. departments
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    department_abbreviation VARCHAR(50) UNIQUE NOT NULL
);

-- 02. programs
CREATE TABLE programs (
    program_id SERIAL PRIMARY KEY,
    department_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    program_abbreviation VARCHAR(50) UNIQUE NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
);

-- 03. program_specializations
CREATE TABLE program_specializations (
    specialization_id SERIAL PRIMARY KEY,
    program_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    abbreviation VARCHAR(50) UNIQUE NOT NULL,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE
);

-- 04. school_terms
CREATE TABLE school_terms (
    term_id SERIAL PRIMARY KEY,
    school_year VARCHAR(50) NOT NULL,
    semester VARCHAR(10) CHECK (semester IN ('1st', '2nd', 'Summer')),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT FALSE
);

-- 05. sections
CREATE TABLE sections (
    section_id SERIAL PRIMARY KEY,
    program_id INTEGER,
    specialization_id INTEGER,
    section_code VARCHAR(100) NOT NULL,
    year_level INTEGER CHECK (year_level BETWEEN 1 AND 5),
    term_id INTEGER,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    FOREIGN KEY (specialization_id) REFERENCES program_specializations(specialization_id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES school_terms(term_id) ON DELETE CASCADE
);

-- ==========================================
-- 2. USERS & ROLES
-- ==========================================
-- 06. roles
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 07. users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER,
    profile_pic TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL
);

-- 08. user_approvals
CREATE TABLE user_approvals (
    approval_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    approved_by INTEGER,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_note TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 09. students
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE,
    contact_email VARCHAR(255),
    student_photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. user_profiles
CREATE TABLE user_profiles (
    user_profile_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE,
    profile_type VARCHAR(50),
    specialization TEXT,
    designation VARCHAR(100),
    office_assigned VARCHAR(255),
    program_id INTEGER,
    department_id INTEGER,
    term_start DATE,
    term_end DATE,
    contact_email VARCHAR(255),
    bio TEXT,
    position TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- ==========================================
-- 3. COURSES & ENROLLMENTS
-- ==========================================
-- 11. courses
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    term_id INTEGER,
    specialization_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (term_id) REFERENCES school_terms(term_id) ON DELETE SET NULL,
    FOREIGN KEY (specialization_id) REFERENCES program_specializations(specialization_id) ON DELETE SET NULL
);

-- 12. section_courses
CREATE TABLE section_courses (
    section_course_id SERIAL PRIMARY KEY,
    section_id INTEGER,
    course_id INTEGER,
    instructor_id INTEGER,
    term_id INTEGER,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (term_id) REFERENCES school_terms(term_id) ON DELETE CASCADE
);

-- 13. course_enrollments
CREATE TABLE course_enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    section_course_id INTEGER,
    student_id INTEGER,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('enrolled', 'dropped', 'completed')),
    FOREIGN KEY (section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 14. course_enrollment_requests
CREATE TABLE course_enrollment_requests (
    enrollment_request_id SERIAL PRIMARY KEY,
    student_id INTEGER,
    current_enrollment_id INTEGER,
    requested_section_course_id INTEGER,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP NULL,
    remarks TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (current_enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE SET NULL,
    FOREIGN KEY (requested_section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ==========================================
-- 4. SYLLABI & ILOs
-- ==========================================
-- 15. syllabi
CREATE TABLE syllabi (
    syllabus_id SERIAL PRIMARY KEY,
    course_id INTEGER,
    term_id INTEGER,
    title VARCHAR(255) NOT NULL,
    created_by INTEGER,
    reviewed_by INTEGER,
    review_status VARCHAR(20) DEFAULT 'pending',
    reviewed_at TIMESTAMP NULL,
    approved_by INTEGER,
    approval_status VARCHAR(20) DEFAULT 'pending',
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES school_terms(term_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 16. ilos
CREATE TABLE ilos (
    ilo_id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    description TEXT
);

-- 17. syllabus_ilos
CREATE TABLE syllabus_ilos (
    syllabus_id INTEGER,
    ilo_id INTEGER,
    PRIMARY KEY (syllabus_id, ilo_id),
    FOREIGN KEY (syllabus_id) REFERENCES syllabi(syllabus_id) ON DELETE CASCADE,
    FOREIGN KEY (ilo_id) REFERENCES ilos(ilo_id) ON DELETE CASCADE
);

-- ==========================================
-- 5. ASSESSMENTS & GRADING
-- ==========================================
-- 18. assessments
CREATE TABLE assessments (
    assessment_id SERIAL PRIMARY KEY,
    section_course_id INTEGER,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE
);

-- 19. rubrics
CREATE TABLE rubrics (
    rubric_id SERIAL PRIMARY KEY,
    assessment_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    criterion TEXT NOT NULL,
    max_score FLOAT,
    ilo_id INTEGER,
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (ilo_id) REFERENCES ilos(ilo_id) ON DELETE SET NULL
);

-- 20. assessment_rubrics
CREATE TABLE assessment_rubrics (
    assessment_id INTEGER,
    rubric_id INTEGER,
    PRIMARY KEY (assessment_id, rubric_id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (rubric_id) REFERENCES rubrics(rubric_id) ON DELETE CASCADE
);

-- 21. submissions
CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    assessment_id INTEGER,
    total_score FLOAT,
    remarks TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE
);

-- 22. rubric_scores
CREATE TABLE rubric_scores (
    rubric_score_id SERIAL PRIMARY KEY,
    submission_id INTEGER,
    rubric_id INTEGER,
    score FLOAT CHECK (score >= 0),
    feedback TEXT,
    remarks TEXT,
    FOREIGN KEY (submission_id) REFERENCES submissions(submission_id) ON DELETE CASCADE,
    FOREIGN KEY (rubric_id) REFERENCES rubrics(rubric_id) ON DELETE CASCADE
);

-- 23. course_final_grades
CREATE TABLE course_final_grades (
    final_grade_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    final_score FLOAT,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE
);

-- ==========================================
-- 6. ATTENDANCE & ANALYTICS
-- ==========================================
-- 24. sessions
CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    section_course_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    session_type VARCHAR(50),   -- e.g., Lecture, Laboratory, etc.
    meeting_type VARCHAR(50),   -- e.g., Face-to-Face, Online, Hybrid, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE
);

-- 25. attendance_logs
CREATE TABLE attendance_logs (
    attendance_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    session_id INTEGER,
    status VARCHAR(20),
    session_date DATE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- 26. analytics_clusters
CREATE TABLE analytics_clusters (
    cluster_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    cluster_label VARCHAR(100),
    based_on JSONB,
    algorithm_used VARCHAR(100),
    model_version VARCHAR(50),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE
);

-- 27. dashboards_data_cache
CREATE TABLE dashboards_data_cache (
    cache_id SERIAL PRIMARY KEY,
    type VARCHAR(50),
    course_id INTEGER,
    data_json JSONB,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- ==========================================
-- 7. ILO TRACKING
-- ==========================================
-- 28. assessment_ilo_weights
CREATE TABLE assessment_ilo_weights (
    assessment_ilo_weight_id SERIAL PRIMARY KEY,
    assessment_id INTEGER,
    ilo_id INTEGER,
    weight_percentage FLOAT CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (ilo_id) REFERENCES ilos(ilo_id) ON DELETE CASCADE
);

-- 29. student_ilo_scores
CREATE TABLE student_ilo_scores (
    student_ilo_score_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    ilo_id INTEGER,
    score FLOAT,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (ilo_id) REFERENCES ilos(ilo_id) ON DELETE CASCADE
);

-- ==========================================
-- 8. NOTIFICATION & FILES
-- ==========================================
-- 30. notifications
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 31. uploads
CREATE TABLE uploads (
    upload_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    file_url TEXT,
    file_type VARCHAR(50),
    related_type VARCHAR(50),
    related_id INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ==========================================
-- COMPREHENSIVE INDEXES FOR POSTGRESQL
-- ==========================================

-- (Indexes omitted for brevity)

ALTER TABLE syllabi ADD COLUMN section_course_id INTEGER;
-- Then, when creating a draft syllabus, set this value.