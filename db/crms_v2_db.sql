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
-- 24. attendance_logs
CREATE TABLE attendance_logs (
    attendance_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER,
    status VARCHAR(20),
    session_date DATE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE
);

-- 25. analytics_clusters
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

-- 26. dashboards_data_cache
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
-- 27. assessment_ilo_weights
CREATE TABLE assessment_ilo_weights (
    assessment_ilo_weight_id SERIAL PRIMARY KEY,
    assessment_id INTEGER,
    ilo_id INTEGER,
    weight_percentage FLOAT CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (ilo_id) REFERENCES ilos(ilo_id) ON DELETE CASCADE
);

-- 28. student_ilo_scores
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
-- 29. notifications
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 30. uploads
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

-- Student-related indexes
CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_students_full_name ON students(full_name);
CREATE INDEX idx_students_gender ON students(gender);
CREATE INDEX idx_students_birth_date ON students(birth_date);
CREATE INDEX idx_students_contact_email ON students(contact_email);
CREATE INDEX idx_students_created_at ON students(created_at);

-- User-related indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_is_approved ON users(is_approved);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_profile_type ON user_profiles(profile_type);
CREATE INDEX idx_user_profiles_program_id ON user_profiles(program_id);
CREATE INDEX idx_user_profiles_department_id ON user_profiles(department_id);

-- Department and Program indexes
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_abbreviation ON departments(department_abbreviation);
CREATE INDEX idx_programs_department_id ON programs(department_id);
CREATE INDEX idx_programs_name ON programs(name);
CREATE INDEX idx_programs_abbreviation ON programs(program_abbreviation);
CREATE INDEX idx_program_specializations_program_id ON program_specializations(program_id);
CREATE INDEX idx_program_specializations_abbreviation ON program_specializations(abbreviation);

-- School Terms and Sections
CREATE INDEX idx_school_terms_school_year ON school_terms(school_year);
CREATE INDEX idx_school_terms_semester ON school_terms(semester);
CREATE INDEX idx_school_terms_is_active ON school_terms(is_active);
CREATE INDEX idx_sections_program_id ON sections(program_id);
CREATE INDEX idx_sections_specialization_id ON sections(specialization_id);
CREATE INDEX idx_sections_term_id ON sections(term_id);
CREATE INDEX idx_sections_section_code ON sections(section_code);
CREATE INDEX idx_sections_year_level ON sections(year_level);

-- Course-related indexes
CREATE INDEX idx_courses_course_code ON courses(course_code);
CREATE INDEX idx_courses_title ON courses(title);
CREATE INDEX idx_courses_term_id ON courses(term_id);
CREATE INDEX idx_courses_specialization_id ON courses(specialization_id);
CREATE INDEX idx_courses_created_at ON courses(created_at);
CREATE INDEX idx_section_courses_section_id ON section_courses(section_id);
CREATE INDEX idx_section_courses_course_id ON section_courses(course_id);
CREATE INDEX idx_section_courses_instructor_id ON section_courses(instructor_id);
CREATE INDEX idx_section_courses_term_id ON section_courses(term_id);

-- Enrollment indexes
CREATE INDEX idx_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_enrollments_section_course_id ON course_enrollments(section_course_id);
CREATE INDEX idx_enrollments_status ON course_enrollments(status);
CREATE INDEX idx_enrollments_enrollment_date ON course_enrollments(enrollment_date);
CREATE INDEX idx_enrollment_requests_student_id ON course_enrollment_requests(student_id);
CREATE INDEX idx_enrollment_requests_status ON course_enrollment_requests(status);
CREATE INDEX idx_enrollment_requests_requested_at ON course_enrollment_requests(requested_at);

-- Syllabus and ILO indexes
CREATE INDEX idx_syllabi_course_id ON syllabi(course_id);
CREATE INDEX idx_syllabi_term_id ON syllabi(term_id);
CREATE INDEX idx_syllabi_created_by ON syllabi(created_by);
CREATE INDEX idx_syllabi_review_status ON syllabi(review_status);
CREATE INDEX idx_syllabi_approval_status ON syllabi(approval_status);
CREATE INDEX idx_syllabi_created_at ON syllabi(created_at);
CREATE INDEX idx_ilos_code ON ilos(code);
CREATE INDEX idx_syllabus_ilos_syllabus_id ON syllabus_ilos(syllabus_id);
CREATE INDEX idx_syllabus_ilos_ilo_id ON syllabus_ilos(ilo_id);

-- Assessment and Grading indexes
CREATE INDEX idx_assessments_section_course_id ON assessments(section_course_id);
CREATE INDEX idx_assessments_type ON assessments(type);
CREATE INDEX idx_assessments_created_at ON assessments(created_at);
CREATE INDEX idx_rubrics_assessment_id ON rubrics(assessment_id);
CREATE INDEX idx_rubrics_ilo_id ON rubrics(ilo_id);
CREATE INDEX idx_assessment_rubrics_assessment_id ON assessment_rubrics(assessment_id);
CREATE INDEX idx_assessment_rubrics_rubric_id ON assessment_rubrics(rubric_id);
CREATE INDEX idx_submissions_enrollment_id ON submissions(enrollment_id);
CREATE INDEX idx_submissions_assessment_id ON submissions(assessment_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_rubric_scores_submission_id ON rubric_scores(submission_id);
CREATE INDEX idx_rubric_scores_rubric_id ON rubric_scores(rubric_id);
CREATE INDEX idx_course_final_grades_enrollment_id ON course_final_grades(enrollment_id);
CREATE INDEX idx_course_final_grades_computed_at ON course_final_grades(computed_at);

-- Attendance and Analytics indexes
CREATE INDEX idx_attendance_logs_enrollment_id ON attendance_logs(enrollment_id);
CREATE INDEX idx_attendance_logs_status ON attendance_logs(status);
CREATE INDEX idx_attendance_logs_session_date ON attendance_logs(session_date);
CREATE INDEX idx_attendance_logs_recorded_at ON attendance_logs(recorded_at);
CREATE INDEX idx_analytics_clusters_enrollment_id ON analytics_clusters(enrollment_id);
CREATE INDEX idx_analytics_clusters_cluster_label ON analytics_clusters(cluster_label);
CREATE INDEX idx_analytics_clusters_generated_at ON analytics_clusters(generated_at);
CREATE INDEX idx_dashboards_data_cache_type ON dashboards_data_cache(type);
CREATE INDEX idx_dashboards_data_cache_course_id ON dashboards_data_cache(course_id);
CREATE INDEX idx_dashboards_data_cache_last_updated ON dashboards_data_cache(last_updated);

-- ILO Tracking indexes
CREATE INDEX idx_assessment_ilo_weights_assessment_id ON assessment_ilo_weights(assessment_id);
CREATE INDEX idx_assessment_ilo_weights_ilo_id ON assessment_ilo_weights(ilo_id);
CREATE INDEX idx_student_ilo_scores_enrollment_id ON student_ilo_scores(enrollment_id);
CREATE INDEX idx_student_ilo_scores_ilo_id ON student_ilo_scores(ilo_id);
CREATE INDEX idx_student_ilo_scores_computed_at ON student_ilo_scores(computed_at);

-- Notification and File indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_file_type ON uploads(file_type);
CREATE INDEX idx_uploads_related_type ON uploads(related_type);
CREATE INDEX idx_uploads_related_id ON uploads(related_id);
CREATE INDEX idx_uploads_uploaded_at ON uploads(uploaded_at);

-- Role and Approval indexes
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_user_approvals_user_id ON user_approvals(user_id);
CREATE INDEX idx_user_approvals_approved_by ON user_approvals(approved_by);
CREATE INDEX idx_user_approvals_approved_at ON user_approvals(approved_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_students_search ON students(full_name, student_number, contact_email);
CREATE INDEX idx_users_search ON users(name, email, role_id);
CREATE INDEX idx_courses_search ON courses(title, course_code, term_id);
CREATE INDEX idx_enrollments_student_status ON course_enrollments(student_id, status);
CREATE INDEX idx_syllabi_course_status ON syllabi(course_id, review_status, approval_status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_attendance_enrollment_date ON attendance_logs(enrollment_id, session_date);

-- Full-text search indexes (PostgreSQL specific)
CREATE INDEX idx_students_full_name_fts ON students USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_courses_title_fts ON courses USING gin(to_tsvector('english', title));
CREATE INDEX idx_users_name_fts ON users USING gin(to_tsvector('english', name));


ALTER TABLE syllabi ADD COLUMN section_course_id INTEGER;
-- Then, when creating a draft syllabus, set this value.