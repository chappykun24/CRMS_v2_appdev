# Assessment Data Insertion Guide
## Aligned with Syllabus, ILOs, and Rubrics

### Overview

This guide explains how to implement assessment data insertion that maintains alignment with syllabi, Intended Learning Outcomes (ILOs), and rubrics. The system allows faculty to create assessments even after syllabus approval while ensuring data integrity and proper alignment.

---

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Assessment Creation Workflow](#assessment-creation-workflow)
3. [ILO Alignment Process](#ilo-alignment-process)
4. [Rubric Integration](#rubric-integration)
5. [Faculty Assessment Management](#faculty-assessment-management)
6. [Implementation Steps](#implementation-steps)
7. [API Endpoints](#api-endpoints)
8. [Best Practices](#best-practices)

---

## Database Schema Overview

### Key Tables for Assessment Alignment

```sql
-- Core Assessment Tables
assessments              -- Individual assessments
assessment_templates     -- Reusable assessment templates
syllabus_assessment_plans -- Assessment structure per syllabus
assessment_ilo_weights   -- Links assessments to ILOs with weights

-- ILO and Rubric Tables
ilos                     -- Intended Learning Outcomes
rubrics                  -- Grading criteria
assessment_rubrics       -- Links assessments to rubrics

-- Student Work Tables
submissions              -- Student submissions
rubric_scores           -- Detailed grading scores
student_ilo_scores      -- ILO achievement tracking
```

### Relationships

```
Syllabus → ILOs → Assessments → Rubrics
    ↓         ↓         ↓         ↓
Students → Submissions → Scores → ILO Tracking
```

---

## Assessment Creation Workflow

### 1. Template-Based Assessment Creation

**Step 1: Select Template**
- Faculty chooses from predefined assessment templates
- Templates are course-type specific (Programming, Research, etc.)
- Each template includes assessment structure and default rubrics

**Step 2: Customize for Syllabus**
- System maps template ILOs to syllabus ILOs
- Faculty can adjust weights and timing
- Automatic due date distribution

**Step 3: Generate Assessments**
- Creates individual assessment records
- Links to syllabus and ILOs
- Generates rubrics for each assessment

### 2. Custom Assessment Creation

**Step 1: Define Assessment**
- Faculty creates assessment from scratch
- Specifies type, points, weight, due date
- Links to specific ILOs

**Step 2: Create Rubrics**
- Define grading criteria
- Set performance levels
- Align with ILOs

**Step 3: Publish Assessment**
- Make visible to students
- Set submission deadlines
- Enable grading workflow

---

## ILO Alignment Process

### 1. ILO Structure

```sql
-- ILO Table Structure
ilos (
    ilo_id SERIAL PRIMARY KEY,
    syllabus_id INTEGER,
    code VARCHAR(50),           -- ILO1, ILO2, etc.
    description TEXT,
    category VARCHAR(50),       -- Knowledge, Skills, Attitudes
    level VARCHAR(20),          -- Basic, Intermediate, Advanced
    weight_percentage FLOAT,    -- Weight in overall assessment
    assessment_methods TEXT[],  -- How this ILO will be assessed
    learning_activities TEXT[]  -- Activities to achieve this ILO
)
```

### 2. Assessment-ILO Linking

```sql
-- Assessment-ILO Weights Table
assessment_ilo_weights (
    assessment_id INTEGER,
    ilo_id INTEGER,
    weight_percentage FLOAT     -- How much this assessment contributes to ILO
)
```

### 3. Alignment Validation

- **Weight Distribution**: Total ILO weights must equal 100%
- **Coverage Check**: All syllabus ILOs should be covered by assessments
- **Progressive Alignment**: Assessments should build toward ILO achievement

---

## Rubric Integration

### 1. Rubric Structure

```sql
-- Rubric Table Structure
rubrics (
    rubric_id SERIAL PRIMARY KEY,
    syllabus_id INTEGER,
    assessment_id INTEGER,
    title VARCHAR(255),
    criterion TEXT,
    max_score FLOAT,
    performance_levels JSONB,  -- Excellent, Good, Fair, Poor descriptions
    ilo_id INTEGER            -- Links rubric to specific ILO
)
```

### 2. Performance Levels

```json
{
  "excellent": {
    "score": 25,
    "description": "Outstanding performance with clear evidence"
  },
  "good": {
    "score": 20,
    "description": "Good performance with minor issues"
  },
  "fair": {
    "score": 15,
    "description": "Adequate performance with room for improvement"
  },
  "poor": {
    "score": 10,
    "description": "Below expectations with significant issues"
  }
}
```

### 3. ILO-Specific Rubrics

- Each rubric criterion can be linked to specific ILOs
- Allows detailed tracking of ILO achievement
- Supports formative and summative assessment

---

## Faculty Assessment Management

### 1. Assessment Lifecycle

```
Planned → Draft → Active → Submissions Closed → Grading → Graded → Archived
```

### 2. Faculty Dashboard Features

- **Assessment Overview**: All assessments for faculty's courses
- **ILO Alignment View**: How assessments align with ILOs
- **Student Progress**: Individual student achievement tracking
- **Rubric Management**: Create and modify rubrics
- **Grade Analytics**: Assessment statistics and trends

### 3. Post-Syllabus Approval Workflow

**Even after syllabus approval, faculty can:**

1. **Create Additional Assessments**
   - Must align with existing ILOs
   - Can add new ILOs if needed (requires approval)
   - Maintain weight distribution

2. **Modify Assessment Details**
   - Update due dates
   - Adjust instructions
   - Modify rubrics

3. **Add Supplementary Assessments**
   - Extra credit opportunities
   - Remedial assessments
   - Practice exercises

---

## Implementation Steps

### Step 1: Database Setup

1. **Run the SQL Script**
   ```bash
   psql -d crms_v2_db -f scripts/assessment_data_insertion.sql
   ```

2. **Create Assessment Templates**
   ```javascript
   const { createAssessmentTemplates } = require('./scripts/assessment-management');
   await createAssessmentTemplates();
   ```

### Step 2: API Integration

1. **Add Assessment Routes**
   ```javascript
   // server/routes/assessments.js
   router.post('/from-template', createAssessmentFromTemplateAPI);
   router.post('/custom', createCustomAssessmentAPI);
   router.put('/:id/publish', publishAssessmentAPI);
   ```

2. **Faculty Dashboard Integration**
   ```javascript
   // app/users/faculty/AssessmentManagement.jsx
   const assessments = await apiClient.get('/assessments/faculty');
   ```

### Step 3: Frontend Implementation

1. **Assessment Creation Forms**
   - Template selection interface
   - Custom assessment builder
   - Rubric creation tools

2. **ILO Alignment Interface**
   - Visual ILO mapping
   - Weight distribution display
   - Coverage validation

3. **Grading Interface**
   - Rubric-based grading
   - ILO achievement tracking
   - Student progress visualization

---

## API Endpoints

### Assessment Management

```http
# Create assessments from template
POST /api/assessments/from-template
{
  "syllabusId": 1,
  "sectionCourseId": 1,
  "templateId": 1,
  "facultyId": 5,
  "startDate": "2024-01-15"
}

# Create custom assessment
POST /api/assessments/custom
{
  "syllabusId": 1,
  "sectionCourseId": 1,
  "title": "Midterm Project",
  "type": "Project",
  "totalPoints": 100,
  "weightPercentage": 25,
  "dueDate": "2024-03-15T23:59:00Z",
  "iloCodes": ["ILO1", "ILO2", "ILO3"],
  "facultyId": 5,
  "rubricCriteria": [...]
}

# Publish assessment
PUT /api/assessments/:id/publish

# Get faculty assessments
GET /api/assessments/faculty/:facultyId

# Get assessment ILO alignment
GET /api/assessments/:id/ilo-alignment
```

### ILO Management

```http
# Get syllabus ILOs
GET /api/syllabus/:id/ilos

# Create new ILO
POST /api/syllabus/ilos
{
  "syllabusId": 1,
  "code": "ILO5",
  "description": "Demonstrate advanced problem-solving skills",
  "category": "Skills",
  "level": "Advanced",
  "weightPercentage": 20
}
```

### Rubric Management

```http
# Create rubric
POST /api/rubrics
{
  "assessmentId": 1,
  "title": "Code Quality Rubric",
  "criteria": [
    {
      "name": "Code Structure",
      "maxScore": 25,
      "levels": {...}
    }
  ]
}

# Get assessment rubrics
GET /api/assessments/:id/rubrics
```

---

## Best Practices

### 1. ILO Alignment

- **Clear Mapping**: Each assessment should clearly map to specific ILOs
- **Weight Distribution**: Ensure ILO weights are properly distributed
- **Progressive Assessment**: Design assessments that build toward ILO achievement
- **Multiple Measures**: Use different assessment types to measure the same ILO

### 2. Rubric Design

- **Specific Criteria**: Make rubric criteria specific and measurable
- **Clear Descriptions**: Provide clear descriptions for each performance level
- **ILO Alignment**: Link rubric criteria to specific ILOs
- **Consistent Scoring**: Use consistent scoring scales across assessments

### 3. Assessment Planning

- **Variety**: Use different assessment types (quizzes, projects, exams)
- **Timing**: Distribute assessments throughout the semester
- **Weighting**: Balance formative and summative assessments
- **Feedback**: Provide timely and constructive feedback

### 4. Data Integrity

- **Validation**: Validate assessment data before insertion
- **Constraints**: Use database constraints to maintain relationships
- **Transactions**: Use database transactions for complex operations
- **Audit Trail**: Maintain records of assessment changes

### 5. Faculty Support

- **Templates**: Provide assessment templates for common course types
- **Guidance**: Offer guidance on ILO alignment and rubric creation
- **Training**: Provide training on assessment best practices
- **Support**: Offer technical support for assessment creation

---

## Example Workflow

### Scenario: Programming Course Assessment Creation

1. **Faculty Assignment**
   - Faculty assigned to "Programming Fundamentals" course
   - System creates draft syllabus with default ILOs

2. **Template Selection**
   - Faculty selects "Programming Course Assessment Template"
   - Template includes: 5 Quizzes (40%), 2 Projects (40%), 1 Final Exam (20%)

3. **Customization**
   - Faculty adjusts due dates and weights
   - Links assessments to specific ILOs
   - Customizes rubric criteria

4. **Assessment Creation**
   - System creates 8 individual assessments
   - Generates rubrics for each assessment
   - Links to syllabus and ILOs

5. **Student Access**
   - Faculty publishes assessments
   - Students can view and submit work
   - System tracks ILO achievement

6. **Grading and Tracking**
   - Faculty grades using rubrics
   - System calculates ILO scores
   - Provides analytics on student progress

---

## Conclusion

This assessment alignment system provides a comprehensive framework for creating, managing, and tracking assessments that are properly aligned with syllabi, ILOs, and rubrics. The system supports both template-based and custom assessment creation, allowing faculty flexibility while maintaining data integrity and alignment.

Key benefits:
- **Consistency**: Standardized assessment structures
- **Alignment**: Clear ILO-assessment relationships
- **Flexibility**: Support for custom assessments
- **Tracking**: Comprehensive student progress monitoring
- **Analytics**: Data-driven insights into learning outcomes

The system ensures that all assessments contribute meaningfully to student learning and provide faculty with the tools they need to create effective, aligned assessments throughout the academic term. 