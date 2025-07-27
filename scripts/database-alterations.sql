-- ==========================================
-- CRMS V2 Database Optimization Script
-- Enhanced Grading System Implementation
-- ==========================================

-- ==========================================
-- 1. REMOVE UNUSED TABLES
-- ==========================================

-- Remove tables that are no longer needed in the current system
DROP TABLE IF EXISTS assessment_ilo_weights CASCADE;
DROP TABLE IF EXISTS student_ilo_scores CASCADE;
DROP TABLE IF EXISTS analytics_clusters CASCADE;
DROP TABLE IF EXISTS dashboards_data_cache CASCADE;
DROP TABLE IF EXISTS course_enrollment_requests CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS grade_adjustments CASCADE;
DROP TABLE IF EXISTS assessment_rubrics CASCADE;
DROP TABLE IF EXISTS rubric_scores CASCADE;
DROP TABLE IF EXISTS syllabus_assessment_plans CASCADE;

-- ==========================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ==========================================

-- Add missing columns to assessments table
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ilo_codes TEXT[] DEFAULT '{}';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessment_structure JSONB;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS rubric_criteria JSONB;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT FALSE;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS graded_submissions INTEGER DEFAULT 0;

-- Add missing columns to assessment_templates table
ALTER TABLE assessment_templates ADD COLUMN IF NOT EXISTS syllabus_id INTEGER REFERENCES syllabi(syllabus_id) ON DELETE CASCADE;
ALTER TABLE assessment_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE assessment_templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE assessment_templates ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Add missing columns to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS late_penalty FLOAT DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS adjusted_score FLOAT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_files TEXT[];
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_type VARCHAR(50) DEFAULT 'file';

-- Add missing columns to syllabi table
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS total_assessments INTEGER DEFAULT 0;
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS published_assessments INTEGER DEFAULT 0;
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS graded_assessments INTEGER DEFAULT 0;
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ==========================================
-- 3. CREATE SUB-ASSESSMENTS TABLES
-- ==========================================

-- Create sub_assessments table
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

-- Create sub_assessment_submissions table
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
    remarks TEXT,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (sub_assessment_id) REFERENCES sub_assessments(sub_assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE(enrollment_id, sub_assessment_id)
);

-- ==========================================
-- 4. CREATE OPTIMIZED INDEXES
-- ==========================================

-- Indexes for sub_assessments
CREATE INDEX IF NOT EXISTS idx_sub_assessments_assessment_id ON sub_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_sub_assessments_status ON sub_assessments(status);
CREATE INDEX IF NOT EXISTS idx_sub_assessments_order ON sub_assessments(assessment_id, order_index);
CREATE INDEX IF NOT EXISTS idx_sub_assessments_published ON sub_assessments(is_published);
CREATE INDEX IF NOT EXISTS idx_sub_assessments_graded ON sub_assessments(is_graded);

-- Indexes for sub_assessment_submissions
CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_enrollment ON sub_assessment_submissions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_sub_assessment ON sub_assessment_submissions(sub_assessment_id);
CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_status ON sub_assessment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_graded_by ON sub_assessment_submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_sub_assessment_submissions_submitted_at ON sub_assessment_submissions(submitted_at);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_assessments_published ON assessments(is_published);
CREATE INDEX IF NOT EXISTS idx_assessments_graded ON assessments(is_graded);
CREATE INDEX IF NOT EXISTS idx_assessments_ilo_codes ON assessments USING GIN(ilo_codes);
CREATE INDEX IF NOT EXISTS idx_submissions_adjusted_score ON submissions(adjusted_score);
CREATE INDEX IF NOT EXISTS idx_submissions_late_penalty ON submissions(late_penalty);
CREATE INDEX IF NOT EXISTS idx_syllabi_total_assessments ON syllabi(total_assessments);
CREATE INDEX IF NOT EXISTS idx_syllabi_published_assessments ON syllabi(published_assessments);

-- ==========================================
-- 5. CREATE OPTIMIZED VIEWS
-- ==========================================

-- View for assessment summary
CREATE OR REPLACE VIEW assessment_summary AS
SELECT 
    a.assessment_id,
    a.title,
    a.type,
    a.total_points,
    a.weight_percentage,
    a.status,
    a.is_published,
    a.is_graded,
    COUNT(sa.sub_assessment_id) as sub_assessment_count,
    COUNT(CASE WHEN sa.is_published THEN 1 END) as published_sub_assessments,
    COUNT(CASE WHEN sa.is_graded THEN 1 END) as graded_sub_assessments,
    COALESCE(SUM(sa.total_points), 0) as total_sub_points,
    COALESCE(SUM(sa.weight_percentage), 0) as total_sub_weight
FROM assessments a
LEFT JOIN sub_assessments sa ON a.assessment_id = sa.assessment_id
GROUP BY a.assessment_id, a.title, a.type, a.total_points, a.weight_percentage, a.status, a.is_published, a.is_graded;

-- View for student grading summary
CREATE OR REPLACE VIEW student_grading_summary AS
SELECT 
    ce.enrollment_id,
    s.student_id,
    s.full_name,
    s.student_number,
    sc.section_course_id,
    COUNT(sas.sub_assessment_id) as total_sub_assessments,
    COUNT(CASE WHEN sas.status = 'graded' THEN 1 END) as graded_sub_assessments,
    COUNT(CASE WHEN sas.status = 'submitted' THEN 1 END) as submitted_sub_assessments,
    AVG(CASE WHEN sas.raw_score IS NOT NULL THEN (sas.raw_score / sas.total_score) * 100 END) as average_score_percentage
FROM course_enrollments ce
JOIN students s ON ce.student_id = s.student_id
JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
LEFT JOIN sub_assessment_submissions sas ON ce.enrollment_id = sas.enrollment_id
GROUP BY ce.enrollment_id, s.student_id, s.full_name, s.student_number, sc.section_course_id;

-- View for faculty grading dashboard
CREATE OR REPLACE VIEW faculty_grading_dashboard AS
SELECT 
    sc.section_course_id,
    c.course_code,
    c.course_title,
    COUNT(DISTINCT a.assessment_id) as total_assessments,
    COUNT(DISTINCT sa.sub_assessment_id) as total_sub_assessments,
    COUNT(DISTINCT CASE WHEN sa.is_published THEN sa.sub_assessment_id END) as published_sub_assessments,
    COUNT(DISTINCT CASE WHEN sa.is_graded THEN sa.sub_assessment_id END) as graded_sub_assessments,
    COUNT(DISTINCT ce.enrollment_id) as total_students,
    COUNT(DISTINCT CASE WHEN sas.status = 'graded' THEN ce.enrollment_id END) as students_with_grades
FROM section_courses sc
JOIN courses c ON sc.course_id = c.course_id
LEFT JOIN assessments a ON sc.section_course_id = a.section_course_id
LEFT JOIN sub_assessments sa ON a.assessment_id = sa.assessment_id
LEFT JOIN course_enrollments ce ON sc.section_course_id = ce.section_course_id
LEFT JOIN sub_assessment_submissions sas ON ce.enrollment_id = sas.enrollment_id
GROUP BY sc.section_course_id, c.course_code, c.course_title;

-- ==========================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ==========================================

-- Function to update assessment statistics
CREATE OR REPLACE FUNCTION update_assessment_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Update assessment statistics
        UPDATE assessments 
        SET 
            total_submissions = (
                SELECT COUNT(DISTINCT enrollment_id) 
                FROM sub_assessment_submissions sas 
                JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id 
                WHERE sa.assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id)
            ),
            graded_submissions = (
                SELECT COUNT(DISTINCT enrollment_id) 
                FROM sub_assessment_submissions sas 
                JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id 
                WHERE sa.assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id)
                AND sas.status = 'graded'
            )
        WHERE assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for sub_assessment_submissions
DROP TRIGGER IF EXISTS trigger_update_assessment_stats ON sub_assessment_submissions;
CREATE TRIGGER trigger_update_assessment_stats
    AFTER INSERT OR UPDATE OR DELETE ON sub_assessment_submissions
    FOR EACH ROW EXECUTE FUNCTION update_assessment_stats();

-- Function to update sub-assessment statistics
CREATE OR REPLACE FUNCTION update_sub_assessment_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Update sub-assessment statistics
        UPDATE sub_assessments 
        SET 
            is_graded = (
                SELECT COUNT(*) > 0 
                FROM sub_assessment_submissions sas 
                WHERE sas.sub_assessment_id = COALESCE(NEW.sub_assessment_id, OLD.sub_assessment_id)
                AND sas.status = 'graded'
            )
        WHERE sub_assessment_id = COALESCE(NEW.sub_assessment_id, OLD.sub_assessment_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for sub_assessment_submissions to update sub_assessment stats
DROP TRIGGER IF EXISTS trigger_update_sub_assessment_stats ON sub_assessment_submissions;
CREATE TRIGGER trigger_update_sub_assessment_stats
    AFTER INSERT OR UPDATE OR DELETE ON sub_assessment_submissions
    FOR EACH ROW EXECUTE FUNCTION update_sub_assessment_stats();

-- ==========================================
-- 7. ADD CONSTRAINTS AND VALIDATIONS
-- ==========================================

-- Add check constraints for data integrity
ALTER TABLE sub_assessments ADD CONSTRAINT chk_sub_assessment_weight 
    CHECK (weight_percentage >= 0 AND weight_percentage <= 100);

ALTER TABLE sub_assessments ADD CONSTRAINT chk_sub_assessment_points 
    CHECK (total_points > 0);

ALTER TABLE sub_assessment_submissions ADD CONSTRAINT chk_submission_scores 
    CHECK (raw_score >= 0 AND total_score > 0 AND raw_score <= total_score);

ALTER TABLE sub_assessment_submissions ADD CONSTRAINT chk_adjusted_score 
    CHECK (adjusted_score IS NULL OR (adjusted_score >= 0 AND adjusted_score <= total_score));

-- ==========================================
-- 8. CLEANUP AND OPTIMIZATION
-- ==========================================

-- Vacuum and analyze tables
VACUUM ANALYZE;

-- Update table statistics
ANALYZE assessments;
ANALYZE sub_assessments;
ANALYZE sub_assessment_submissions;
ANALYZE submissions;
ANALYZE assessment_templates;
ANALYZE syllabi;
ANALYZE students;
ANALYZE course_enrollments;
ANALYZE section_courses;

-- ==========================================
-- 9. SAMPLE DATA INSERTION (Optional)
-- ==========================================

-- Insert sample sub-assessment types if needed
-- This can be used to populate common sub-assessment types
INSERT INTO assessment_templates (template_name, template_type, description, template_data, created_by) 
VALUES 
    ('Basic Task', 'Task', 'A simple task template for basic assignments', 
     '{"type": "Task", "total_points": 10, "weight_percentage": 10}', 1),
    ('Quiz Template', 'Quiz', 'A quiz template for knowledge assessment', 
     '{"type": "Quiz", "total_points": 20, "weight_percentage": 15}', 1),
    ('Project Template', 'Project', 'A project template for comprehensive work', 
     '{"type": "Project", "total_points": 50, "weight_percentage": 30}', 1)
ON CONFLICT DO NOTHING;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

-- The database optimization is now complete
-- Summary of changes:
-- - Removed 10 unused tables
-- - Added 18 new columns to existing tables  
-- - Created 2 new tables for sub-assessments
-- - Created 15 new indexes for performance
-- - Created 3 optimized views
-- - Created 2 triggers for automatic updates
-- - Added 4 check constraints for data integrity 