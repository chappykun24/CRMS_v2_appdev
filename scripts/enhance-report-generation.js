const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

// Report Generator Class
class ReportGenerator {
  constructor() {
    this.reportData = {};
  }

  // Generate comprehensive academic performance report
  async generateAcademicReport(sectionCourseId, reportType = 'comprehensive') {
    const client = await pool.connect();
    
    try {
      console.log(`📊 Generating ${reportType} academic report for section course ${sectionCourseId}...`);
      
      // Fetch course information
      const courseInfo = await this.fetchCourseInfo(client, sectionCourseId);
      
      // Fetch student performance data
      const studentPerformance = await this.fetchStudentPerformance(client, sectionCourseId);
      
      // Fetch assessment analytics
      const assessmentAnalytics = await this.fetchAssessmentAnalytics(client, sectionCourseId);
      
      // Fetch clustering data
      const clusteringData = await this.fetchClusteringData(client, sectionCourseId);
      
      // Fetch attendance data
      const attendanceData = await this.fetchAttendanceData(client, sectionCourseId);
      
      // Generate insights
      const insights = this.generateInsights(studentPerformance, assessmentAnalytics, clusteringData, attendanceData);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(insights, studentPerformance);
      
      // Compile report
      const report = {
        reportId: `REP_${Date.now()}`,
        reportType,
        generatedAt: new Date().toISOString(),
        courseInfo,
        studentPerformance,
        assessmentAnalytics,
        clusteringData,
        attendanceData,
        insights,
        recommendations,
        summary: this.generateSummary(insights, studentPerformance)
      };
      
      // Save report to database
      await this.saveReport(client, report);
      
      // Generate report file
      const reportFile = await this.generateReportFile(report);
      
      console.log(`✅ Academic report generated successfully: ${reportFile}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Error generating academic report:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Fetch course information
  async fetchCourseInfo(client, sectionCourseId) {
    const query = `
      SELECT 
        sc.section_course_id,
        c.title as course_title,
        c.course_code,

        s.section_code,
        s.year_level,
        t.school_year,
        t.semester,
        u.name as instructor_name,
        COUNT(ce.enrollment_id) as total_students,
        COUNT(CASE WHEN ce.status = 'enrolled' THEN 1 END) as enrolled_students
      FROM section_courses sc
      JOIN courses c ON sc.course_id = c.course_id
      JOIN sections s ON sc.section_id = s.section_id
      JOIN school_terms t ON sc.term_id = t.term_id
      LEFT JOIN users u ON sc.instructor_id = u.user_id
      LEFT JOIN course_enrollments ce ON sc.section_course_id = ce.section_course_id
      WHERE sc.section_course_id = $1
      GROUP BY sc.section_course_id, c.title, c.course_code, s.section_code, s.year_level, t.school_year, t.semester, u.name
    `;
    
    const result = await client.query(query, [sectionCourseId]);
    return result.rows[0] || {};
  }

  // Fetch student performance data
  async fetchStudentPerformance(client, sectionCourseId) {
    const query = `
      SELECT 
        s.student_id,
        s.full_name,
        s.student_number,
        ce.enrollment_id,
        
        -- Grade statistics
        COUNT(sas.submission_id) as total_submissions,
        COUNT(CASE WHEN sas.status = 'graded' THEN 1 END) as graded_submissions,
        AVG(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) as average_grade,
        MIN(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) as lowest_grade,
        MAX(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) as highest_grade,
        
        -- Performance indicators
        CASE 
          WHEN AVG(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) >= 90 THEN 'Excellent'
          WHEN AVG(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) >= 80 THEN 'Good'
          WHEN AVG(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) >= 75 THEN 'Satisfactory'
          ELSE 'Needs Improvement'
        END as performance_level,
        
        -- Risk assessment
        CASE 
          WHEN AVG(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) < 75 THEN 'High Risk'
          WHEN AVG(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) < 80 THEN 'Medium Risk'
          ELSE 'Low Risk'
        END as risk_level
        
      FROM students s
      JOIN course_enrollments ce ON s.student_id = ce.student_id
      LEFT JOIN sub_assessment_submissions sas ON ce.enrollment_id = sas.enrollment_id
      LEFT JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id
      WHERE ce.section_course_id = $1 AND ce.status = 'enrolled'
      GROUP BY s.student_id, s.full_name, s.student_number, ce.enrollment_id
      ORDER BY average_grade DESC NULLS LAST
    `;
    
    const result = await client.query(query, [sectionCourseId]);
    return result.rows;
  }

  // Fetch assessment analytics
  async fetchAssessmentAnalytics(client, sectionCourseId) {
    const query = `
      SELECT 
        a.assessment_id,
        a.title as assessment_title,
        a.type as assessment_type,
        a.total_points,
        a.weight_percentage,
        
        -- Sub-assessment statistics
        COUNT(sa.sub_assessment_id) as total_sub_assessments,
        COUNT(CASE WHEN sa.is_published = true THEN 1 END) as published_sub_assessments,
        
        -- Submission statistics
        COUNT(sas.submission_id) as total_submissions,
        COUNT(CASE WHEN sas.status = 'graded' THEN 1 END) as graded_submissions,
        COUNT(CASE WHEN sas.status = 'submitted' THEN 1 END) as pending_submissions,
        
        -- Grade statistics
        AVG(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) as average_score,
        MIN(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) as lowest_score,
        MAX(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) as highest_score,
        STDDEV(CASE WHEN sas.status = 'graded' THEN sas.total_score / sa.total_points * 100 END) as score_standard_deviation
        
      FROM assessments a
      LEFT JOIN sub_assessments sa ON a.assessment_id = sa.assessment_id
      LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id
      WHERE a.section_course_id = $1
      GROUP BY a.assessment_id, a.title, a.type, a.total_points, a.weight_percentage
      ORDER BY a.created_at
    `;
    
    const result = await client.query(query, [sectionCourseId]);
    return result.rows;
  }

  // Fetch clustering data
  async fetchClusteringData(client, sectionCourseId) {
    const query = `
      SELECT 
        ac.cluster_label,
        ac.cluster_id,
        ac.based_on,
        COUNT(*) as student_count
      FROM analytics_clusters ac
      JOIN course_enrollments ce ON ac.enrollment_id = ce.enrollment_id
      WHERE ce.section_course_id = $1 AND ac.algorithm_used = 'K-Means'
      GROUP BY ac.cluster_label, ac.cluster_id, ac.based_on
      ORDER BY ac.cluster_id
    `;
    
    const result = await client.query(query, [sectionCourseId]);
    return result.rows;
  }

  // Fetch attendance data
  async fetchAttendanceData(client, sectionCourseId) {
    const query = `
      SELECT 
        COUNT(DISTINCT al.session_id) as total_sessions,
        COUNT(al.attendance_id) as total_attendance_records,
        COUNT(CASE WHEN al.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN al.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN al.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN al.status = 'excuse' THEN 1 END) as excuse_count,
        ROUND(
          COUNT(CASE WHEN al.status = 'present' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(al.attendance_id), 0), 2
        ) as attendance_rate
      FROM attendance_logs al
      JOIN course_enrollments ce ON al.enrollment_id = ce.enrollment_id
      WHERE ce.section_course_id = $1
    `;
    
    const result = await client.query(query, [sectionCourseId]);
    return result.rows[0] || {};
  }

  // Generate insights from data
  generateInsights(studentPerformance, assessmentAnalytics, clusteringData, attendanceData) {
    const insights = [];
    
    // Performance insights
    const totalStudents = studentPerformance.length;
    const excellentStudents = studentPerformance.filter(s => s.performance_level === 'Excellent').length;
    const atRiskStudents = studentPerformance.filter(s => s.risk_level === 'High Risk').length;
    const averageGrade = studentPerformance.reduce((sum, s) => sum + (s.average_grade || 0), 0) / totalStudents;
    
    insights.push({
      type: 'performance',
      title: 'Overall Performance',
      description: `Class average grade: ${averageGrade.toFixed(2)}%`,
      details: {
        excellentStudents: `${excellentStudents} (${((excellentStudents/totalStudents)*100).toFixed(1)}%)`,
        atRiskStudents: `${atRiskStudents} (${((atRiskStudents/totalStudents)*100).toFixed(1)}%)`,
        averageGrade: `${averageGrade.toFixed(2)}%`
      }
    });
    
    // Assessment insights
    const totalAssessments = assessmentAnalytics.length;
    const publishedAssessments = assessmentAnalytics.reduce((sum, a) => sum + a.published_sub_assessments, 0);
    const averageAssessmentScore = assessmentAnalytics.reduce((sum, a) => sum + (a.average_score || 0), 0) / totalAssessments;
    
    insights.push({
      type: 'assessment',
      title: 'Assessment Performance',
      description: `Average assessment score: ${averageAssessmentScore.toFixed(2)}%`,
      details: {
        totalAssessments,
        publishedAssessments,
        averageAssessmentScore: `${averageAssessmentScore.toFixed(2)}%`
      }
    });
    
    // Clustering insights
    if (clusteringData.length > 0) {
      const consistentStudents = clusteringData.find(c => c.cluster_label === 'Consistent')?.student_count || 0;
      const improvingStudents = clusteringData.find(c => c.cluster_label === 'Improving')?.student_count || 0;
      const atRiskClusterStudents = clusteringData.find(c => c.cluster_label === 'At-Risk')?.student_count || 0;
      
      insights.push({
        type: 'clustering',
        title: 'Learning Behavior Patterns',
        description: 'Student clustering analysis reveals distinct learning patterns',
        details: {
          consistentStudents: `${consistentStudents} students`,
          improvingStudents: `${improvingStudents} students`,
          atRiskClusterStudents: `${atRiskClusterStudents} students`,
          totalClusters: clusteringData.length
        }
      });
    }
    
    // Attendance insights
    if (attendanceData.attendance_rate) {
      insights.push({
        type: 'attendance',
        title: 'Attendance Overview',
        description: `Overall attendance rate: ${attendanceData.attendance_rate}%`,
        details: {
          totalSessions: attendanceData.total_sessions,
          attendanceRate: `${attendanceData.attendance_rate}%`,
          presentCount: attendanceData.present_count,
          absentCount: attendanceData.absent_count
        }
      });
    }
    
    return insights;
  }

  // Generate recommendations based on insights
  generateRecommendations(insights, studentPerformance) {
    const recommendations = [];
    
    // Performance-based recommendations
    const atRiskStudents = studentPerformance.filter(s => s.risk_level === 'High Risk');
    if (atRiskStudents.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'intervention',
        title: 'Immediate Intervention Required',
        description: `${atRiskStudents.length} students identified as high-risk`,
        actions: [
          'Schedule individual academic counseling sessions',
          'Provide additional learning resources',
          'Implement peer mentoring program',
          'Set up regular progress monitoring'
        ],
        students: atRiskStudents.map(s => s.full_name)
      });
    }
    
    // Assessment-based recommendations
    const lowScoringAssessments = insights.find(i => i.type === 'assessment');
    if (lowScoringAssessments && lowScoringAssessments.details.averageAssessmentScore < 75) {
      recommendations.push({
        priority: 'medium',
        category: 'instruction',
        title: 'Assessment Strategy Review',
        description: 'Low average assessment scores indicate need for instructional adjustment',
        actions: [
          'Review assessment difficulty and alignment',
          'Provide additional practice materials',
          'Consider alternative assessment methods',
          'Schedule review sessions before assessments'
        ]
      });
    }
    
    // Attendance-based recommendations
    const attendanceInsight = insights.find(i => i.type === 'attendance');
    if (attendanceInsight && attendanceInsight.details.attendanceRate < 85) {
      recommendations.push({
        priority: 'medium',
        category: 'engagement',
        title: 'Improve Student Engagement',
        description: 'Low attendance rate suggests engagement issues',
        actions: [
          'Implement active learning strategies',
          'Create more interactive class sessions',
          'Provide incentives for regular attendance',
          'Address potential barriers to attendance'
        ]
      });
    }
    
    return recommendations;
  }

  // Generate executive summary
  generateSummary(insights, studentPerformance) {
    const totalStudents = studentPerformance.length;
    const averageGrade = studentPerformance.reduce((sum, s) => sum + (s.average_grade || 0), 0) / totalStudents;
    const atRiskCount = studentPerformance.filter(s => s.risk_level === 'High Risk').length;
    
    return {
      totalStudents,
      averageGrade: averageGrade.toFixed(2),
      atRiskStudents: atRiskCount,
      riskPercentage: ((atRiskCount / totalStudents) * 100).toFixed(1),
      overallStatus: atRiskCount > totalStudents * 0.2 ? 'Needs Attention' : 'Good Standing'
    };
  }

  // Save report to database
  async saveReport(client, report) {
    const query = `
      INSERT INTO reports (
        report_id, report_type, course_id, generated_by, report_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (report_id) DO UPDATE SET
        report_data = EXCLUDED.report_data,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await client.query(query, [
      report.reportId,
      report.reportType,
      report.courseInfo.section_course_id,
      1, // Default user ID
      JSON.stringify(report)
    ]);
  }

  // Generate report file
  async generateReportFile(report) {
    const reportDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const fileName = `academic_report_${report.reportId}_${Date.now()}.json`;
    const filePath = path.join(reportDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    
    return filePath;
  }
}

// Main function to enhance report generation
async function enhanceReportGeneration() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Enhancing Report Generation System...');
    
    // Create reports table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS reports (
        report_id VARCHAR(50) PRIMARY KEY,
        report_type VARCHAR(50) NOT NULL,
        course_id INTEGER,
        generated_by INTEGER,
        report_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES section_courses(section_course_id) ON DELETE SET NULL,
        FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL
      );
    `;
    
    await client.query(createTableQuery);
    console.log('✅ Reports table created/verified');
    
    // Get all section courses with students
    const coursesQuery = `
      SELECT DISTINCT sc.section_course_id, c.title, c.course_code, s.section_code
      FROM section_courses sc
      JOIN courses c ON sc.course_id = c.course_id
      JOIN sections s ON sc.section_id = s.section_id
      JOIN course_enrollments ce ON sc.section_course_id = ce.section_course_id
      WHERE ce.status = 'enrolled'
      ORDER BY c.title, s.section_code
      LIMIT 5
    `;
    
    const coursesResult = await client.query(coursesQuery);
    const courses = coursesResult.rows;
    
    console.log(`📚 Found ${courses.length} courses with enrolled students`);
    
    // Generate reports for each course
    const reportGenerator = new ReportGenerator();
    
    for (const course of courses) {
      console.log(`\n📊 Generating report for ${course.course_code} - ${course.section_code}...`);
      
      try {
        const report = await reportGenerator.generateAcademicReport(
          course.section_course_id, 
          'comprehensive'
        );
        
        console.log(`✅ Report generated for ${course.course_code} - ${course.section_code}`);
        console.log(`   📈 Summary: ${report.summary.totalStudents} students, ${report.summary.averageGrade}% average, ${report.summary.atRiskStudents} at-risk`);
        
      } catch (error) {
        console.error(`❌ Error generating report for ${course.course_code}:`, error.message);
      }
    }
    
    console.log('\n🎉 Report generation system enhancement completed!');
    console.log('📁 Reports saved to: scripts/reports/');
    
  } catch (error) {
    console.error('❌ Error enhancing report generation:', error);
  } finally {
    client.release();
  }
}

// Run the enhancement
enhanceReportGeneration()
  .then(() => {
    console.log('🎉 Report generation enhancement completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 