# Final Database Schema Guide
## Complete CRMS V2 System with Enhanced Grading, ILOs, and Analytics

### Overview
This document outlines the comprehensive final database schema for the CRMS V2 system, including user profiles, enhanced grading system with ILOs and rubrics, sub-assessments, and analytics clustering capabilities.

---

## 📊 Database Structure Summary

### Total Tables: 34
- **School Settings**: 5 tables
- **Users & Profiles**: 5 tables  
- **Courses & Enrollments**: 3 tables
- **Syllabi & ILOs**: 3 tables
- **Assessments & Grading**: 10 tables
- **Analytics & Clustering**: 4 tables
- **Attendance & Sessions**: 2 tables
- **Notifications & Files**: 2 tables

---

## 🏫 School Settings (5 tables)

### 1. `departments`
**Purpose**: Academic departments within the institution
```sql
- department_id (PK)
- name (UNIQUE)
- department_abbreviation (UNIQUE)
- created_at
```

### 2. `programs`
**Purpose**: Academic programs offered by departments
```sql
- program_id (PK)
- department_id (FK)
- name, description
- program_abbreviation (UNIQUE)
- created_at
```

### 3. `program_specializations`
**Purpose**: Specializations within programs
```sql
- specialization_id (PK)
- program_id (FK)
- name, description
- abbreviation (UNIQUE)
- created_at
```

### 4. `school_terms`
**Purpose**: Academic terms/semesters
```sql
- term_id (PK)
- school_year, semester (1st, 2nd, Summer)
- start_date, end_date
- is_active
- created_at
```

### 5. `sections`
**Purpose**: Class sections within programs
```sql
- section_id (PK)
- program_id, specialization_id, term_id (FKs)
- section_code
- year_level (1-5)
- created_at
```

---

## 👥 Users & Profiles (5 tables)

### 6. `roles`
**Purpose**: User roles and permissions
```sql
- role_id (PK)
- name (UNIQUE)
- description
- permissions (JSONB)
- created_at
```

### 7. `users`
**Purpose**: Core user accounts
```sql
- user_id (PK)
- name, email (UNIQUE)
- password_hash
- role_id (FK)
- profile_pic
- is_approved, is_active
- last_login
- created_at, updated_at
```

### 8. `user_profiles` (ENHANCED)
**Purpose**: Comprehensive user profiles for all user types
```sql
- user_profile_id (PK)
- user_id (UNIQUE FK)
- profile_type (faculty, student, admin, dean, staff)
- specialization, designation, office_assigned
- program_id, department_id (FKs)
- contact_email, contact_number
- bio, position
- academic_rank (for faculty)
- research_interests (for faculty)
- teaching_experience (for faculty)
- education_background (array)
- certifications (array)
- office_hours (JSONB)
- created_at, updated_at
```

### 9. `user_approvals`
**Purpose**: User approval workflow
```sql
- approval_id (PK)
- user_id, approved_by (FKs)
- status (pending, approved, rejected)
- approval_note
- approved_at, created_at
```

### 10. `students`
**Purpose**: Student-specific information
```sql
- student_id (PK)
- student_number (UNIQUE)
- full_name, gender, birth_date
- contact_email, contact_number, address
- emergency_contact (JSONB)
- academic_status (active, inactive, graduated, transferred)
- enrollment_year
- program_id, specialization_id (FKs)
- student_photo
- created_at, updated_at
```

---

## 📚 Courses & Enrollments (3 tables)

### 11. `courses`
**Purpose**: Course catalog
```sql
- course_id (PK)
- title, course_code (UNIQUE)
- description, units
- lecture_hours, laboratory_hours
- prerequisites (array)
- term_id, specialization_id (FKs)
- created_at, updated_at
```

### 12. `section_courses`
**Purpose**: Course offerings in specific sections
```sql
- section_course_id (PK)
- section_id, course_id, instructor_id, term_id (FKs)
- room_assignment
- schedule (JSONB)
- max_students, current_enrollment
- status (active, inactive, completed)
- created_at
```

### 13. `course_enrollments`
**Purpose**: Student course enrollments
```sql
- enrollment_id (PK)
- section_course_id, student_id (FKs)
- status (enrolled, dropped, completed, withdrawn)
- final_grade, final_grade_points
- remarks
- enrollment_date, created_at, updated_at
```

---

## 📖 Syllabi & ILOs (3 tables)

### 14. `syllabi` (ENHANCED)
**Purpose**: Comprehensive course syllabi
```sql
- syllabus_id (PK)
- course_id, section_course_id, term_id (FKs)
- title, description
- assessment_framework (JSONB)
- grading_policy (JSONB)
- course_outline
- learning_resources (array)
- course_objectives (array)
- prerequisites (array)
- course_materials (array)
- office_hours, contact_info (JSONB)
- academic_integrity_policy
- attendance_policy
- late_submission_policy
- make_up_policy
- total_assessments, published_assessments, graded_assessments
- approval_status (draft, submitted, approved, rejected)
- approved_by, approved_at
- created_by, created_at, updated_at, last_updated
```

### 15. `ilos` (ENHANCED)
**Purpose**: Intended Learning Outcomes
```sql
- ilo_id (PK)
- syllabus_id (FK)
- code, description
- category (Knowledge, Skills, Attitudes)
- level (Basic, Intermediate, Advanced)
- weight_percentage
- assessment_methods (array)
- learning_activities (array)
- bloom_taxonomy_level
- is_active
- created_at, updated_at
```

### 16. `syllabus_ilos`
**Purpose**: ILO-syllabus relationships
```sql
- syllabus_id, ilo_id (Composite PK)
- weight_percentage
- Foreign keys to syllabi and ilos
```

---

## 📝 Assessments & Grading (10 tables)

### 17. `assessment_templates` (ENHANCED)
**Purpose**: Reusable assessment templates
```sql
- template_id (PK)
- template_name (UNIQUE)
- template_type, description
- assessment_structure (JSONB)
- rubric_template (JSONB)
- ilo_coverage (array)
- default_weight
- is_active, is_public
- usage_count, last_used_at
- created_by, syllabus_id (FKs)
- created_at, updated_at
```

### 18. `assessments` (ENHANCED)
**Purpose**: Main assessments
```sql
- assessment_id (PK)
- syllabus_id, section_course_id (FKs)
- title, description
- type, category (Formative, Summative, Diagnostic)
- total_points, weight_percentage
- due_date, submission_deadline
- is_published, is_graded
- grading_method (Rubric, Points, Percentage)
- instructions
- content_data (JSONB)
- ilo_codes (array)
- assessment_structure, rubric_criteria (JSONB)
- status (planned, draft, active, submissions_closed, grading, graded, archived)
- total_submissions, graded_submissions
- created_by, created_at, updated_at
```

### 19. `sub_assessments` (NEW)
**Purpose**: Individual tasks within main assessments
```sql
- sub_assessment_id (PK)
- assessment_id (FK)
- title, description, type
- total_points, weight_percentage
- due_date, instructions
- content_data (JSONB)
- ilo_codes (array)
- rubric_criteria (JSONB)
- status, is_published, is_graded
- order_index
- created_by, created_at, updated_at
```

### 20. `rubrics` (ENHANCED)
**Purpose**: Grading rubrics
```sql
- rubric_id (PK)
- syllabus_id, assessment_id, sub_assessment_id (FKs)
- title, description
- rubric_type (Template, Custom, Standard)
- performance_levels (JSONB)
- criteria (JSONB)
- total_points
- is_template, template_name
- ilo_id (FK)
- is_active
- created_by, created_at, updated_at
```

### 21. `submissions` (ENHANCED)
**Purpose**: Student submissions for main assessments
```sql
- submission_id (PK)
- enrollment_id, assessment_id, sub_assessment_id (FKs)
- submission_type (File, Text, Link)
- submission_data (JSONB)
- file_urls (array)
- submitted_at, graded_at
- graded_by (FK)
- total_score, raw_score, adjusted_score
- late_penalty
- status (submitted, graded, late, incomplete)
- feedback, remarks
- created_at, updated_at
```

### 22. `sub_assessment_submissions` (NEW)
**Purpose**: Student submissions for sub-assessments
```sql
- submission_id (PK)
- enrollment_id, sub_assessment_id (FKs)
- submission_type, submission_data (JSONB)
- file_urls (array)
- total_score, raw_score, adjusted_score
- late_penalty
- submitted_at, graded_at
- graded_by (FK)
- status, feedback, remarks
- created_at, updated_at
- UNIQUE(enrollment_id, sub_assessment_id)
```

### 23. `rubric_scores` (ENHANCED)
**Purpose**: Individual rubric criterion scores
```sql
- rubric_score_id (PK)
- submission_id, sub_assessment_submission_id (FKs)
- rubric_id (FK)
- criterion_name, criterion_score
- criterion_feedback
- performance_level (Excellent, Good, Fair, Poor)
- max_possible_score, weight_percentage
- created_at
```

### 24. `assessment_ilo_weights` (ENHANCED)
**Purpose**: ILO weights for assessments
```sql
- assessment_ilo_weight_id (PK)
- assessment_id, sub_assessment_id (FKs)
- ilo_id (FK)
- weight_percentage (0-100)
- created_at
```

### 25. `student_ilo_scores` (ENHANCED)
**Purpose**: Student performance on ILOs
```sql
- student_ilo_score_id (PK)
- enrollment_id, ilo_id (FKs)
- assessment_id, sub_assessment_id (FKs)
- score, max_possible_score
- percentage_score, weight_contribution
- computed_at
```

### 26. `course_final_grades` (ENHANCED)
**Purpose**: Final course grades
```sql
- final_grade_id (PK)
- enrollment_id (UNIQUE FK)
- total_score, final_percentage
- letter_grade, grade_points
- computed_at, computed_by (FK)
```

---

## 📈 Analytics & Clustering (4 tables)

### 27. `analytics_clusters` (ENHANCED)
**Purpose**: Student performance clustering
```sql
- cluster_id (PK)
- enrollment_id (FK)
- cluster_label
- cluster_type (performance, engagement, risk, ilo_mastery)
- based_on (JSONB)
- algorithm_used (K-means, DBSCAN, etc.)
- model_version
- confidence_score
- cluster_characteristics (JSONB)
- recommendations (JSONB)
- generated_at, is_active
```

### 28. `analytics_metrics` (NEW)
**Purpose**: Calculated performance metrics
```sql
- metric_id (PK)
- enrollment_id (FK)
- metric_type (ilo_mastery, performance_trend, engagement_score)
- metric_name, metric_value
- metric_unit (percentage, score, count)
- calculation_method
- data_source (JSONB)
- computed_at, valid_until
```

### 29. `analytics_filters` (NEW)
**Purpose**: Reusable analytics filters
```sql
- filter_id (PK)
- filter_name
- filter_type (ilo, performance, demographic, temporal)
- filter_criteria (JSONB)
- created_by (FK)
- is_public
- created_at
```

### 30. `dashboards_data_cache` (ENHANCED)
**Purpose**: Cached dashboard data
```sql
- cache_id (PK)
- cache_key (UNIQUE)
- cache_type (analytics, grades, performance)
- course_id, section_course_id (FKs)
- data_json (JSONB)
- expires_at, last_updated
```

---

## 📅 Attendance & Sessions (2 tables)

### 31. `sessions`
**Purpose**: Class sessions
```sql
- session_id (PK)
- section_course_id (FK)
- session_date, session_type (lecture, laboratory, discussion)
- start_time, end_time
- topic, description
- materials (array)
- is_attendance_required
- created_by, created_at
```

### 32. `attendance_logs`
**Purpose**: Student attendance records
```sql
- attendance_id (PK)
- enrollment_id, session_id (FKs)
- session_date
- status (present, absent, late, excused)
- time_in, time_out
- remarks
- recorded_by, recorded_at
```

---

## 🔔 Notifications & Files (2 tables)

### 33. `notifications` (ENHANCED)
**Purpose**: System notifications
```sql
- notification_id (PK)
- user_id (FK)
- title, message
- notification_type (grade, assignment, announcement, reminder)
- related_type, related_id
- is_read, priority (low, normal, high, urgent)
- expires_at, created_at
```

### 34. `uploads` (ENHANCED)
**Purpose**: File uploads
```sql
- upload_id (PK)
- user_id (FK)
- file_name, file_url
- file_type, file_size, mime_type
- related_type, related_id
- upload_purpose (profile_pic, assignment, syllabus)
- is_public
- uploaded_at
```

---

## 🔗 Key Relationships

### User Profile Relationships
```
users (1) ←→ (1) user_profiles
users (1) ←→ (1) students (for student users)
users (1) ←→ (1) user_approvals
```

### Course Relationships
```
departments (1) ←→ (N) programs
programs (1) ←→ (N) program_specializations
programs (1) ←→ (N) students
sections (1) ←→ (N) section_courses
section_courses (1) ←→ (N) course_enrollments
```

### Assessment Relationships
```
syllabi (1) ←→ (N) assessments
assessments (1) ←→ (N) sub_assessments
assessments (1) ←→ (N) submissions
sub_assessments (1) ←→ (N) sub_assessment_submissions
assessments (N) ←→ (N) rubrics (via assessment_rubrics)
```

### ILO Relationships
```
syllabi (1) ←→ (N) ilos
syllabi (N) ←→ (N) ilos (via syllabus_ilos)
assessments (N) ←→ (N) ilos (via assessment_ilo_weights)
sub_assessments (N) ←→ (N) ilos (via ilo_codes array)
```

### Grading Relationships
```
submissions (1) ←→ (N) rubric_scores
sub_assessment_submissions (1) ←→ (N) rubric_scores
enrollments (1) ←→ (N) student_ilo_scores
enrollments (1) ←→ (1) course_final_grades
```

### Analytics Relationships
```
enrollments (1) ←→ (N) analytics_clusters
enrollments (1) ←→ (N) analytics_metrics
```

---

## 🎯 Grading System Workflow

### 1. Assessment Creation
```
Syllabus → ILOs → Assessment Template → Assessment → Sub-Assessments
```

### 2. Rubric Creation
```
ILO → Rubric Criteria → Performance Levels → Rubric Assignment
```

### 3. Student Submission
```
Student → Sub-Assessment Submission → File Upload → Status Update
```

### 4. Faculty Grading
```
Faculty → Rubric Scoring → Criterion Scores → Final Score → Feedback
```

### 5. ILO Score Calculation
```
Rubric Scores → ILO Weights → Student ILO Scores → Performance Metrics
```

### 6. Analytics Processing
```
Student ILO Scores → Performance Metrics → Analytics Clusters → Recommendations
```

---

## 📊 Analytics Clustering System

### Cluster Types
1. **Performance Clusters**: Based on overall academic performance
2. **Engagement Clusters**: Based on participation and submission patterns
3. **Risk Clusters**: Based on academic risk indicators
4. **ILO Mastery Clusters**: Based on ILO achievement levels

### Analytics Metrics
1. **ILO Mastery**: Percentage achievement per ILO
2. **Performance Trends**: Performance over time
3. **Engagement Scores**: Participation and submission rates
4. **Risk Indicators**: Late submissions, low scores, etc.

### Filtering System
1. **ILO Filters**: Filter by specific ILOs
2. **Performance Filters**: Filter by performance ranges
3. **Demographic Filters**: Filter by student demographics
4. **Temporal Filters**: Filter by time periods

---

## 🚀 Performance Optimization

### Indexes Created: 80+
- **Primary Key Indexes**: 34
- **Foreign Key Indexes**: 50+
- **Composite Indexes**: 10+
- **GIN Indexes**: For array and JSONB columns
- **Performance Indexes**: For frequently queried columns

### Query Optimization
- **Materialized Views**: For complex analytics queries
- **Partitioning**: For large tables (future implementation)
- **Caching**: Dashboard data caching
- **Connection Pooling**: Optimized database connections

---

## 🔧 How to Implement

### 1. Run the Final Schema
```bash
cd scripts
node run-final-schema.js
```

### 2. Verify Installation
```sql
-- Check if all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### 3. Test Basic Functionality
```sql
-- Test user creation
INSERT INTO users (name, email, password_hash, role_id) 
VALUES ('Test User', 'test@example.com', 'hash', 1);

-- Test profile creation
INSERT INTO user_profiles (user_id, profile_type, designation) 
VALUES (1, 'faculty', 'Assistant Professor');
```

---

## 📋 Next Steps

### 1. API Development
- Create RESTful APIs for all tables
- Implement authentication and authorization
- Add data validation and sanitization

### 2. Frontend Development
- Create user interface for all user types
- Implement real-time notifications
- Add analytics dashboards

### 3. Analytics Implementation
- Implement clustering algorithms
- Create performance metrics calculations
- Build recommendation systems

### 4. Testing
- Unit tests for all components
- Integration tests for workflows
- Performance testing for large datasets

---

## ⚠️ Important Notes

1. **Backup Required**: Always backup before running schema changes
2. **Data Migration**: Plan migration strategy for existing data
3. **Performance Monitoring**: Monitor query performance after implementation
4. **Security**: Implement proper access controls and data encryption
5. **Scalability**: Consider partitioning for large datasets

---

## 📞 Support

For questions or issues:
1. Check the database logs for errors
2. Verify all foreign key relationships
3. Test with sample data first
4. Contact the development team for assistance

The final database schema is now ready for the complete CRMS V2 system with enhanced grading, analytics, and user management capabilities. 