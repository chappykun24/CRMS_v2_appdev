# Sample AppDev Data for CRMS V2

This directory contains sample data for the Application Development subject to test the CRMS V2 system with realistic assessment and grading data.

## 📊 Data Overview

### **Course Information**
- **Course**: CS 301 - Application Development
- **Section**: BSIT-3A
- **Instructor**: Faculty ID 5
- **Students**: 30 enrolled students
- **Semester**: Second Semester 2024-2025

### **Assessment Structure**
- **4 Main Assessments** (100 points each)
- **16 Sub-Assessments** (4 per main assessment, 25 points each)
- **Grading Completion**: 90% (27 out of 30 students graded)
- **Pass Rate**: 87% (24 out of 27 graded students pass)

## 🎯 Assessment Topics

### 1. **Web Development Fundamentals** (25% weight)
- HTML Structure & Semantics
- CSS Styling & Layout  
- JavaScript Functionality
- Website Integration

### 2. **React Application Development** (30% weight)
- React Components
- State Management
- Routing & Navigation
- API Integration

### 3. **Backend API Development** (25% weight)
- Express Server Setup
- Database Design
- RESTful API Endpoints
- Authentication & Security

### 4. **Full-Stack Application** (20% weight)
- Project Planning
- Frontend Development
- Backend Development
- Deployment & Testing

## 🚀 How to Load Sample Data

### Option 1: Using Node.js Script (Recommended)

1. **Update database configuration** in `run-sample-data.js`:
   ```javascript
   const pool = new Pool({
     user: 'postgres',
     host: 'localhost',
     database: 'crms_v2_db',
     password: 'your_actual_password', // Replace with your password
     port: 5432,
   });
   ```

2. **Run the script**:
   ```bash
   cd scripts
   node run-sample-data.js
   ```

### Option 2: Direct SQL Execution

1. **Connect to your PostgreSQL database**:
   ```bash
   psql -U postgres -d crms_v2_db
   ```

2. **Execute the SQL file**:
   ```sql
   \i sample-appdev-data.sql
   ```

### Option 3: Using pgAdmin

1. Open pgAdmin
2. Connect to your database
3. Open the Query Tool
4. Load and execute `sample-appdev-data.sql`

## 📈 Data Statistics

After loading, you should see:

- **30 Students** with realistic Filipino names and addresses
- **4 Assessments** with AppDev-related content
- **16 Sub-Assessments** with detailed instructions
- **480 Student Submissions** (30 students × 16 sub-assessments)
- **432 Graded Submissions** (90% completion rate)
- **376 Passing Grades** (87% pass rate)

## 🎨 Sample Student Names

The data includes 30 students with realistic names:
- John Smith, Maria Garcia, David Johnson
- Sarah Williams, Michael Brown, Emily Davis
- And 24 more students...

## 🔧 Testing the Progress Bars

After loading the data:

1. **Login as Faculty** (ID: 5)
2. **Navigate to Assessment Management**
3. **Select the AppDev course**
4. **Click on any assessment**
5. **View the sub-assessments with progress bars**

Each sub-assessment card will show:
- **Student Grading Progress** (e.g., "75% Complete (20/27 students)")
- **Visual progress bar** with green fill
- **Status** (Not Started, In Progress, Half Complete, Completed)

## 🧹 Cleaning Up Sample Data

To remove the sample data:

```sql
-- Remove sample data (be careful!)
DELETE FROM sub_assessment_submissions WHERE sub_assessment_id IN (1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016);
DELETE FROM sub_assessments WHERE sub_assessment_id IN (1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016);
DELETE FROM assessments WHERE assessment_id IN (1001, 1002, 1003, 1004);
DELETE FROM course_enrollments WHERE enrollment_id BETWEEN 1001 AND 1030;
DELETE FROM students WHERE student_id BETWEEN 1001 AND 1030;
DELETE FROM ilos WHERE ilo_id BETWEEN 1001 AND 1004;
DELETE FROM section_courses WHERE section_course_id = 1001;
DELETE FROM syllabi WHERE syllabus_id = 1001;
DELETE FROM courses WHERE course_id = 1001;
```

## 📝 Notes

- All sample data uses IDs starting from 1001 to avoid conflicts
- The data is realistic and relevant to Application Development
- Progress bars will show actual grading completion rates
- Students have varying performance levels to simulate real scenarios
- All dates are set for the 2024-2025 academic year

## 🐛 Troubleshooting

If you encounter errors:

1. **Check database connection** - Ensure PostgreSQL is running
2. **Verify database name** - Make sure `crms_v2_db` exists
3. **Check permissions** - Ensure your user has INSERT privileges
4. **Review error messages** - Look for specific constraint violations

For support, check the main CRMS V2 documentation or contact the development team. 