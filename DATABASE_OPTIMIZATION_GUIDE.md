# Database Optimization Guide
## Enhanced Grading System Implementation

### Overview
This document outlines the comprehensive database alterations and optimizations made to support the enhanced grading system with sub-assessments functionality.

---

## 📋 Tables Removed

### Unused Tables (10 tables removed)
These tables were removed as they are no longer needed in the current system implementation:

1. **`assessment_ilo_weights`** - Replaced by direct ILO codes in assessments table
2. **`student_ilo_scores`** - Not implemented in current system
3. **`analytics_clusters`** - Not used in current implementation
4. **`dashboards_data_cache`** - Not used in current implementation
5. **`course_enrollment_requests`** - Not implemented in current system
6. **`user_profiles`** - Redundant with users table
7. **`grade_adjustments`** - Functionality moved to sub_assessment_submissions
8. **`assessment_rubrics`** - Not implemented in current system
9. **`rubric_scores`** - Not implemented in current system
10. **`syllabus_assessment_plans`** - Replaced by direct assessment creation

---

## 🆕 New Tables Created

### 1. `sub_assessments`
**Purpose**: Stores individual tasks/components of main assessments

```sql
CREATE TABLE sub_assessments (
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
```

### 2. `sub_assessment_submissions`
**Purpose**: Stores student submissions and grades for sub-assessments

```sql
CREATE TABLE sub_assessment_submissions (
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
```

---

## 🔧 Columns Added to Existing Tables

### `assessments` Table (7 new columns)
```sql
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ilo_codes TEXT[] DEFAULT '{}';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessment_structure JSONB;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS rubric_criteria JSONB;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT FALSE;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS graded_submissions INTEGER DEFAULT 0;
```

### `assessment_templates` Table (4 new columns)
```sql
ALTER TABLE assessment_templates ADD COLUMN IF NOT EXISTS syllabus_id INTEGER REFERENCES syllabi(syllabus_id) ON DELETE CASCADE;
ALTER TABLE assessment_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE assessment_templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE assessment_templates ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;
```

### `submissions` Table (5 new columns)
```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS late_penalty FLOAT DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS adjusted_score FLOAT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_files TEXT[];
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_type VARCHAR(50) DEFAULT 'file';
```

### `syllabi` Table (4 new columns)
```sql
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS total_assessments INTEGER DEFAULT 0;
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS published_assessments INTEGER DEFAULT 0;
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS graded_assessments INTEGER DEFAULT 0;
ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

---

## 📊 Performance Indexes Created

### Sub-Assessments Indexes (5 indexes)
```sql
CREATE INDEX idx_sub_assessments_assessment_id ON sub_assessments(assessment_id);
CREATE INDEX idx_sub_assessments_status ON sub_assessments(status);
CREATE INDEX idx_sub_assessments_order ON sub_assessments(assessment_id, order_index);
CREATE INDEX idx_sub_assessments_published ON sub_assessments(is_published);
CREATE INDEX idx_sub_assessments_graded ON sub_assessments(is_graded);
```

### Sub-Assessment Submissions Indexes (5 indexes)
```sql
CREATE INDEX idx_sub_assessment_submissions_enrollment ON sub_assessment_submissions(enrollment_id);
CREATE INDEX idx_sub_assessment_submissions_sub_assessment ON sub_assessment_submissions(sub_assessment_id);
CREATE INDEX idx_sub_assessment_submissions_status ON sub_assessment_submissions(status);
CREATE INDEX idx_sub_assessment_submissions_graded_by ON sub_assessment_submissions(graded_by);
CREATE INDEX idx_sub_assessment_submissions_submitted_at ON sub_assessment_submissions(submitted_at);
```

### Additional Performance Indexes (7 indexes)
```sql
CREATE INDEX idx_assessments_published ON assessments(is_published);
CREATE INDEX idx_assessments_graded ON assessments(is_graded);
CREATE INDEX idx_assessments_ilo_codes ON assessments USING GIN(ilo_codes);
CREATE INDEX idx_submissions_adjusted_score ON submissions(adjusted_score);
CREATE INDEX idx_submissions_late_penalty ON submissions(late_penalty);
CREATE INDEX idx_syllabi_total_assessments ON syllabi(total_assessments);
CREATE INDEX idx_syllabi_published_assessments ON syllabi(published_assessments);
```

---

## 👁️ Optimized Views Created

### 1. `assessment_summary`
**Purpose**: Provides comprehensive assessment statistics

```sql
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
```

### 2. `student_grading_summary`
**Purpose**: Provides student grading statistics

```sql
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
```

### 3. `faculty_grading_dashboard`
**Purpose**: Provides faculty dashboard statistics

```sql
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
```

---

## 🔄 Triggers and Functions

### 1. `update_assessment_stats()` Function
**Purpose**: Automatically updates assessment statistics when sub-assessments are modified

```sql
CREATE OR REPLACE FUNCTION update_assessment_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
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
```

### 2. `update_sub_assessment_stats()` Function
**Purpose**: Automatically updates sub-assessment grading status

```sql
CREATE OR REPLACE FUNCTION update_sub_assessment_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
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
```

---

## ✅ Data Integrity Constraints

### Check Constraints Added
```sql
-- Sub-assessment weight validation
ALTER TABLE sub_assessments ADD CONSTRAINT chk_sub_assessment_weight 
    CHECK (weight_percentage >= 0 AND weight_percentage <= 100);

-- Sub-assessment points validation
ALTER TABLE sub_assessments ADD CONSTRAINT chk_sub_assessment_points 
    CHECK (total_points > 0);

-- Submission scores validation
ALTER TABLE sub_assessment_submissions ADD CONSTRAINT chk_submission_scores 
    CHECK (raw_score >= 0 AND total_score > 0 AND raw_score <= total_score);

-- Adjusted score validation
ALTER TABLE sub_assessment_submissions ADD CONSTRAINT chk_adjusted_score 
    CHECK (adjusted_score IS NULL OR (adjusted_score >= 0 AND adjusted_score <= total_score));
```

---

## 🚀 How to Apply Changes

### Option 1: Using the Node.js Script
```bash
cd scripts
node run-database-alterations.js
```

### Option 2: Using the SQL File Directly
```bash
psql -h localhost -U postgres -d crms_v2_db -f scripts/database-alterations.sql
```

### Option 3: Using the Optimization Script
```bash
cd scripts
node database-optimization.js
```

---

## 📈 Performance Benefits

### Before Optimization
- ❌ Unused tables consuming storage
- ❌ Missing indexes causing slow queries
- ❌ No automatic statistics updates
- ❌ Manual data validation required

### After Optimization
- ✅ Reduced database size by removing unused tables
- ✅ 15+ new indexes for faster queries
- ✅ Automatic statistics updates via triggers
- ✅ Data integrity enforced via constraints
- ✅ Optimized views for common queries
- ✅ Better query performance for grading operations

---

## 🔍 Verification Queries

### Check if tables were created successfully
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sub_assessments', 'sub_assessment_submissions');
```

### Check if indexes were created
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('sub_assessments', 'sub_assessment_submissions');
```

### Check if views were created
```sql
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('assessment_summary', 'student_grading_summary', 'faculty_grading_dashboard');
```

### Check if triggers were created
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## ⚠️ Important Notes

1. **Backup Required**: Always backup your database before running these alterations
2. **Downtime**: Some operations may require brief downtime
3. **Data Migration**: Existing data will be preserved
4. **Rollback**: Keep the original schema for rollback if needed
5. **Testing**: Test thoroughly in development environment first

---

## 📞 Support

If you encounter any issues during the database optimization:
1. Check the error logs in the console output
2. Verify database connectivity and permissions
3. Ensure PostgreSQL version compatibility (12+ recommended)
4. Contact the development team for assistance 