-- Insert a new section_course and return its ID
WITH ins_section_course AS (
  INSERT INTO section_courses (section_id, course_id, instructor_id, term_id)
  VALUES (1, 196, 3, 3)
  RETURNING section_course_id
),
-- Insert a new syllabus and return its ID
ins_syllabus AS (
  INSERT INTO syllabi (
    course_id, term_id, title, created_by, reviewed_by, approved_by, review_status, approval_status, created_at, updated_at
  ) VALUES (
    196, 3, 'Application Development and Emerging Technologies', 3, 5, 6, 'pending', 'pending', '2025-05-30', '2025-05-30'
  )
  RETURNING syllabus_id
),
-- Insert ILOs if not already present and return their IDs
ilo1 AS (
  INSERT INTO ilos (code, description)
  VALUES ('ILO1', 'Develop cross-platform applications using modern frameworks and industry best practices.')
  ON CONFLICT (code) DO NOTHING
  RETURNING ilo_id
),
ilo2 AS (
  INSERT INTO ilos (code, description)
  VALUES ('ILO2', 'Collaborate in iterative development cycles by presenting system milestones and integrating feedback effectively.')
  ON CONFLICT (code) DO NOTHING
  RETURNING ilo_id
),
ilo3 AS (
  INSERT INTO ilos (code, description)
  VALUES ('ILO3', 'Implement secure, compliant, and high-quality solutions based on industry standards and policies.')
  ON CONFLICT (code) DO NOTHING
  RETURNING ilo_id
),
-- Get ILO IDs (in case they already exist)
get_ilo1 AS (
  SELECT ilo_id FROM ilos WHERE code = 'ILO1'
),
get_ilo2 AS (
  SELECT ilo_id FROM ilos WHERE code = 'ILO2'
),
get_ilo3 AS (
  SELECT ilo_id FROM ilos WHERE code = 'ILO3'
),
-- Link ILOs to the syllabus
syll_ilo1 AS (
  INSERT INTO syllabus_ilos (syllabus_id, ilo_id)
  SELECT (SELECT syllabus_id FROM ins_syllabus), ilo_id FROM get_ilo1
  ON CONFLICT (syllabus_id, ilo_id) DO NOTHING
  RETURNING *
),
syll_ilo2 AS (
  INSERT INTO syllabus_ilos (syllabus_id, ilo_id)
  SELECT (SELECT syllabus_id FROM ins_syllabus), ilo_id FROM get_ilo2
  ON CONFLICT (syllabus_id, ilo_id) DO NOTHING
  RETURNING *
),
syll_ilo3 AS (
  INSERT INTO syllabus_ilos (syllabus_id, ilo_id)
  SELECT (SELECT syllabus_id FROM ins_syllabus), ilo_id FROM get_ilo3
  ON CONFLICT (syllabus_id, ilo_id) DO NOTHING
  RETURNING *
),
-- Insert assessments and return their IDs
ins_sr AS (
  INSERT INTO assessments (section_course_id, title, type, created_at, updated_at)
  SELECT section_course_id, 'Sprint Review', 'R', NOW(), NOW() FROM ins_section_course
  RETURNING assessment_id
),
ins_la AS (
  INSERT INTO assessments (section_course_id, title, type, created_at, updated_at)
  SELECT section_course_id, 'Laboratory Activities', 'R', NOW(), NOW() FROM ins_section_course
  RETURNING assessment_id
),
ins_fs AS (
  INSERT INTO assessments (section_course_id, title, type, created_at, updated_at)
  SELECT section_course_id, 'Final Sprint', 'D', NOW(), NOW() FROM ins_section_course
  RETURNING assessment_id
),
-- Get assessment IDs
get_sr AS (
  SELECT assessment_id FROM ins_sr
),
get_la AS (
  SELECT assessment_id FROM ins_la
),
get_fs AS (
  SELECT assessment_id FROM ins_fs
)
-- Map assessments to ILOs
INSERT INTO assessment_ilo_weights (assessment_id, ilo_id, weight_percentage)
SELECT (SELECT assessment_id FROM get_sr), (SELECT ilo_id FROM get_ilo2), 300
UNION ALL
SELECT (SELECT assessment_id FROM get_la), (SELECT ilo_id FROM get_ilo1), 300
UNION ALL
SELECT (SELECT assessment_id FROM get_la), (SELECT ilo_id FROM get_ilo2), 100
UNION ALL
SELECT (SELECT assessment_id FROM get_fs), (SELECT ilo_id FROM get_ilo3), 300;

-- Add rubrics for each assessment
INSERT INTO rubrics (assessment_id, title, description, criterion, max_score, ilo_id)
SELECT assessment_id, 'Sprint Review Rubric', 'Milestone presentation and compliance validation', 'Feature implementation, system optimization, compliance', 100, (SELECT ilo_id FROM ilos WHERE code = 'ILO2')
FROM get_sr;

INSERT INTO rubrics (assessment_id, title, description, criterion, max_score, ilo_id)
SELECT assessment_id, 'Lab Activities Rubric', 'Hands-on lab exercises and project work', 'Cross-platform development, data-driven logic, security, containerization', 100, (SELECT ilo_id FROM ilos WHERE code = 'ILO1')
FROM get_la;

INSERT INTO rubrics (assessment_id, title, description, criterion, max_score, ilo_id)
SELECT assessment_id, 'Final Sprint Rubric', 'Peer-reviewed ISO 25010 compliance assessment', 'Performance metrics, security validation, documentation', 100, (SELECT ilo_id FROM ilos WHERE code = 'ILO3')
FROM get_fs;

-- End of script 