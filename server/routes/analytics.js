const express = require('express');
const router = express.Router();
const pool = require('../database');
require('dotenv').config();

// GET /api/analytics/clusters/enrollment/:enrollmentId - Get clusters for an enrollment
router.get('/clusters/enrollment/:enrollmentId', async (req, res) => {
  const { enrollmentId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        ac.cluster_id,
        ac.enrollment_id,
        ac.cluster_label,
        ac.cluster_type,
        ac.based_on,
        ac.algorithm_used,
        ac.model_version,
        ac.confidence_score,
        ac.cluster_characteristics,
        ac.recommendations,
        ac.generated_at,
        ac.is_active,
        s.student_number,
        s.full_name,
        c.title as course_title,
        c.course_code
      FROM analytics_clusters ac
      JOIN course_enrollments ce ON ac.enrollment_id = ce.enrollment_id
      JOIN students s ON ce.student_id = s.student_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      JOIN courses c ON sc.course_id = c.course_id
      WHERE ac.enrollment_id = $1 AND ac.is_active = true
      ORDER BY ac.generated_at DESC
    `;
    
    const result = await client.query(query, [enrollmentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enrollment clusters:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/analytics/clusters/course/:courseId - Get clusters for a course
router.get('/clusters/course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        ac.cluster_id,
        ac.enrollment_id,
        ac.cluster_label,
        ac.cluster_type,
        ac.based_on,
        ac.algorithm_used,
        ac.model_version,
        ac.confidence_score,
        ac.cluster_characteristics,
        ac.recommendations,
        ac.generated_at,
        ac.is_active,
        s.student_number,
        s.full_name,
        sc.section_code
      FROM analytics_clusters ac
      JOIN course_enrollments ce ON ac.enrollment_id = ce.enrollment_id
      JOIN students s ON ce.student_id = s.student_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      WHERE sc.course_id = $1 AND ac.is_active = true
      ORDER BY ac.cluster_type, ac.generated_at DESC
    `;
    
    const result = await client.query(query, [courseId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching course clusters:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/analytics/metrics/enrollment/:enrollmentId - Get metrics for an enrollment
router.get('/metrics/enrollment/:enrollmentId', async (req, res) => {
  const { enrollmentId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        am.metric_id,
        am.enrollment_id,
        am.metric_type,
        am.metric_name,
        am.metric_value,
        am.metric_unit,
        am.calculation_method,
        am.data_source,
        am.computed_at,
        am.valid_until,
        s.student_number,
        s.full_name
      FROM analytics_metrics am
      JOIN course_enrollments ce ON am.enrollment_id = ce.enrollment_id
      JOIN students s ON ce.student_id = s.student_id
      WHERE am.enrollment_id = $1
      ORDER BY am.metric_type, am.computed_at DESC
    `;
    
    const result = await client.query(query, [enrollmentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enrollment metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/analytics/metrics/course/:courseId - Get metrics for a course
router.get('/metrics/course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        am.metric_id,
        am.enrollment_id,
        am.metric_type,
        am.metric_name,
        am.metric_value,
        am.metric_unit,
        am.calculation_method,
        am.data_source,
        am.computed_at,
        am.valid_until,
        s.student_number,
        s.full_name,
        sc.section_code
      FROM analytics_metrics am
      JOIN course_enrollments ce ON am.enrollment_id = ce.enrollment_id
      JOIN students s ON ce.student_id = s.student_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      WHERE sc.course_id = $1
      ORDER BY am.metric_type, s.full_name, am.computed_at DESC
    `;
    
    const result = await client.query(query, [courseId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching course metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/analytics/filters - Get all analytics filters
router.get('/filters', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        af.filter_id,
        af.filter_name,
        af.filter_type,
        af.filter_criteria,
        af.is_public,
        af.created_at,
        u.name as created_by_name
      FROM analytics_filters af
      LEFT JOIN users u ON af.created_by = u.user_id
      ORDER BY af.created_at DESC
    `;
    
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching analytics filters:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/analytics/filters - Create a new analytics filter
router.post('/filters', async (req, res) => {
  const {
    filter_name,
    filter_type,
    filter_criteria,
    is_public,
    created_by
  } = req.body;
  
  if (!filter_name || !filter_type || !filter_criteria) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO analytics_filters (
        filter_name, filter_type, filter_criteria, is_public, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING filter_id
    `;
    
    const values = [filter_name, filter_type, filter_criteria, is_public, created_by];
    const result = await client.query(query, values);
    
    res.status(201).json({ 
      filter_id: result.rows[0].filter_id,
      message: 'Analytics filter created successfully' 
    });
  } catch (error) {
    console.error('Error creating analytics filter:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/analytics/dashboard/:courseId - Get dashboard data for a course
router.get('/dashboard/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const client = await pool.connect();
  
  try {
    // Get course overview
    const courseQuery = `
      SELECT 
        c.course_id,
        c.title as course_title,
        c.course_code,
        c.units,
        COUNT(DISTINCT sc.section_course_id) as section_count,
        COUNT(DISTINCT ce.enrollment_id) as enrollment_count,
        COUNT(DISTINCT a.assessment_id) as assessment_count,
        COUNT(DISTINCT s.syllabus_id) as syllabus_count
      FROM courses c
      LEFT JOIN section_courses sc ON c.course_id = sc.course_id
      LEFT JOIN course_enrollments ce ON sc.section_course_id = ce.section_course_id
      LEFT JOIN assessments a ON sc.section_course_id = a.section_course_id
      LEFT JOIN syllabi s ON sc.section_course_id = s.section_course_id
      WHERE c.course_id = $1
      GROUP BY c.course_id, c.title, c.course_code, c.units
    `;
    
    const courseResult = await client.query(courseQuery, [courseId]);
    
    // Get performance metrics
    const performanceQuery = `
      SELECT 
        AVG(sis.percentage_score) as average_ilo_achievement,
        COUNT(DISTINCT sis.enrollment_id) as students_with_scores,
        COUNT(DISTINCT sis.ilo_id) as ilos_assessed,
        AVG(sas.total_score / sa.total_points * 100) as average_assessment_score
      FROM student_ilo_scores sis
      JOIN course_enrollments ce ON sis.enrollment_id = ce.enrollment_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      LEFT JOIN sub_assessment_submissions sas ON ce.enrollment_id = sas.enrollment_id
      LEFT JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id
      WHERE sc.course_id = $1
    `;
    
    const performanceResult = await client.query(performanceQuery, [courseId]);
    
    // Get cluster distribution
    const clusterQuery = `
      SELECT 
        ac.cluster_type,
        ac.cluster_label,
        COUNT(*) as student_count
      FROM analytics_clusters ac
      JOIN course_enrollments ce ON ac.enrollment_id = ce.enrollment_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      WHERE sc.course_id = $1 AND ac.is_active = true
      GROUP BY ac.cluster_type, ac.cluster_label
      ORDER BY ac.cluster_type, student_count DESC
    `;
    
    const clusterResult = await client.query(clusterQuery, [courseId]);
    
    // Get recent activity
    const activityQuery = `
      SELECT 
        'assessment' as activity_type,
        a.title as title,
        a.created_at as activity_date,
        u.name as created_by
      FROM assessments a
      JOIN section_courses sc ON a.section_course_id = sc.section_course_id
      LEFT JOIN users u ON a.created_by = u.user_id
      WHERE sc.course_id = $1
      UNION ALL
      SELECT 
        'submission' as activity_type,
        CONCAT(s.full_name, ' - ', sa.title) as title,
        sas.submitted_at as activity_date,
        s.full_name as created_by
      FROM sub_assessment_submissions sas
      JOIN course_enrollments ce ON sas.enrollment_id = ce.enrollment_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id
      JOIN students s ON ce.student_id = s.student_id
      WHERE sc.course_id = $1
      ORDER BY activity_date DESC
      LIMIT 10
    `;
    
    const activityResult = await client.query(activityQuery, [courseId]);
    
    res.json({
      course: courseResult.rows[0] || {},
      performance: performanceResult.rows[0] || {},
      clusters: clusterResult.rows,
      recent_activity: activityResult.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/analytics/clusters/generate - Generate clusters for a course
router.post('/clusters/generate', async (req, res) => {
  const { courseId, clusterType, algorithm } = req.body;
  const client = await pool.connect();
  
  try {
    // Get all enrollments for the course
    const enrollmentsQuery = `
      SELECT ce.enrollment_id, s.student_id, s.full_name
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.student_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      WHERE sc.course_id = $1
    `;
    
    const enrollmentsResult = await client.query(enrollmentsQuery, [courseId]);
    
    // Simple clustering logic (in a real implementation, you'd use ML algorithms)
    const clusters = [];
    const clusterLabels = ['High Performance', 'Medium Performance', 'Low Performance', 'At Risk'];
    
    for (const enrollment of enrollmentsResult.rows) {
      // Get student performance data
      const performanceQuery = `
        SELECT 
          AVG(sis.percentage_score) as average_ilo_score,
          AVG(sas.total_score / sa.total_points * 100) as average_assessment_score,
          COUNT(sas.submission_id) as submission_count
        FROM course_enrollments ce
        LEFT JOIN student_ilo_scores sis ON ce.enrollment_id = sis.enrollment_id
        LEFT JOIN sub_assessment_submissions sas ON ce.enrollment_id = sas.enrollment_id
        LEFT JOIN sub_assessments sa ON sas.sub_assessment_id = sa.sub_assessment_id
        WHERE ce.enrollment_id = $1
      `;
      
      const performanceResult = await client.query(performanceQuery, [enrollment.enrollment_id]);
      const performance = performanceResult.rows[0];
      
      // Determine cluster based on performance
      let clusterLabel = 'Medium Performance';
      let confidenceScore = 0.7;
      
      if (performance.average_ilo_score >= 85) {
        clusterLabel = 'High Performance';
        confidenceScore = 0.9;
      } else if (performance.average_ilo_score >= 70) {
        clusterLabel = 'Medium Performance';
        confidenceScore = 0.8;
      } else if (performance.average_ilo_score >= 60) {
        clusterLabel = 'Low Performance';
        confidenceScore = 0.7;
      } else {
        clusterLabel = 'At Risk';
        confidenceScore = 0.6;
      }
      
      // Create cluster record
      const clusterQuery = `
        INSERT INTO analytics_clusters (
          enrollment_id, cluster_label, cluster_type, based_on,
          algorithm_used, model_version, confidence_score,
          cluster_characteristics, recommendations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (enrollment_id, cluster_type) 
        DO UPDATE SET
          cluster_label = EXCLUDED.cluster_label,
          based_on = EXCLUDED.based_on,
          algorithm_used = EXCLUDED.algorithm_used,
          model_version = EXCLUDED.model_version,
          confidence_score = EXCLUDED.confidence_score,
          cluster_characteristics = EXCLUDED.cluster_characteristics,
          recommendations = EXCLUDED.recommendations,
          generated_at = CURRENT_TIMESTAMP
        RETURNING cluster_id
      `;
      
      const clusterValues = [
        enrollment.enrollment_id,
        clusterLabel,
        clusterType || 'performance',
        JSON.stringify(performance),
        algorithm || 'simple_performance',
        '1.0',
        confidenceScore,
        JSON.stringify({
          average_ilo_score: performance.average_ilo_score,
          average_assessment_score: performance.average_assessment_score,
          submission_count: performance.submission_count
        }),
        JSON.stringify({
          recommendations: [
            clusterLabel === 'At Risk' ? 'Schedule academic advising session' : null,
            clusterLabel === 'Low Performance' ? 'Consider additional tutoring' : null,
            clusterLabel === 'Medium Performance' ? 'Focus on specific ILOs for improvement' : null,
            clusterLabel === 'High Performance' ? 'Maintain current study habits' : null
          ].filter(Boolean)
        })
      ];
      
      const clusterResult = await client.query(clusterQuery, clusterValues);
      clusters.push(clusterResult.rows[0]);
    }
    
    res.json({ 
      message: 'Clusters generated successfully',
      clusters_created: clusters.length,
      cluster_type: clusterType || 'performance'
    });
  } catch (error) {
    console.error('Error generating clusters:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/analytics/metrics/calculate - Calculate metrics for a course
router.post('/metrics/calculate', async (req, res) => {
  const { courseId, metricTypes } = req.body;
  const client = await pool.connect();
  
  try {
    const metrics = [];
    
    // Get all enrollments for the course
    const enrollmentsQuery = `
      SELECT ce.enrollment_id
      FROM course_enrollments ce
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      WHERE sc.course_id = $1
    `;
    
    const enrollmentsResult = await client.query(enrollmentsQuery, [courseId]);
    
    for (const enrollment of enrollmentsResult.rows) {
      // Calculate ILO mastery metrics
      if (!metricTypes || metricTypes.includes('ilo_mastery')) {
        const iloQuery = `
          SELECT 
            AVG(sis.percentage_score) as average_mastery,
            COUNT(DISTINCT sis.ilo_id) as ilos_assessed,
            MAX(sis.percentage_score) as highest_mastery,
            MIN(sis.percentage_score) as lowest_mastery
          FROM student_ilo_scores sis
          WHERE sis.enrollment_id = $1
        `;
        
        const iloResult = await client.query(iloQuery, [enrollment.enrollment_id]);
        const iloData = iloResult.rows[0];
        
        if (iloData.average_mastery !== null) {
          const metricQuery = `
            INSERT INTO analytics_metrics (
              enrollment_id, metric_type, metric_name, metric_value,
              metric_unit, calculation_method, data_source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (enrollment_id, metric_type, metric_name) 
            DO UPDATE SET
              metric_value = EXCLUDED.metric_value,
              calculation_method = EXCLUDED.calculation_method,
              data_source = EXCLUDED.data_source,
              computed_at = CURRENT_TIMESTAMP
            RETURNING metric_id
          `;
          
          await client.query(metricQuery, [
            enrollment.enrollment_id,
            'ilo_mastery',
            'Average ILO Mastery',
            iloData.average_mastery,
            'percentage',
            'average_percentage_score',
            JSON.stringify(iloData)
          ]);
          
          metrics.push({
            type: 'ilo_mastery',
            value: iloData.average_mastery,
            enrollment_id: enrollment.enrollment_id
          });
        }
      }
      
      // Calculate engagement metrics
      if (!metricTypes || metricTypes.includes('engagement_score')) {
        const engagementQuery = `
          SELECT 
            COUNT(sas.submission_id) as total_submissions,
            COUNT(CASE WHEN sas.late_penalty = 0 THEN 1 END) as on_time_submissions,
            AVG(CASE WHEN sas.late_penalty > 0 THEN sas.late_penalty ELSE 0 END) as average_late_penalty
          FROM sub_assessment_submissions sas
          WHERE sas.enrollment_id = $1
        `;
        
        const engagementResult = await client.query(engagementQuery, [enrollment.enrollment_id]);
        const engagementData = engagementResult.rows[0];
        
        if (engagementData.total_submissions > 0) {
          const engagementScore = (engagementData.on_time_submissions / engagementData.total_submissions) * 100;
          
          const metricQuery = `
            INSERT INTO analytics_metrics (
              enrollment_id, metric_type, metric_name, metric_value,
              metric_unit, calculation_method, data_source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (enrollment_id, metric_type, metric_name) 
            DO UPDATE SET
              metric_value = EXCLUDED.metric_value,
              calculation_method = EXCLUDED.calculation_method,
              data_source = EXCLUDED.data_source,
              computed_at = CURRENT_TIMESTAMP
            RETURNING metric_id
          `;
          
          await client.query(metricQuery, [
            enrollment.enrollment_id,
            'engagement_score',
            'Engagement Score',
            engagementScore,
            'percentage',
            'on_time_submission_ratio',
            JSON.stringify(engagementData)
          ]);
          
          metrics.push({
            type: 'engagement_score',
            value: engagementScore,
            enrollment_id: enrollment.enrollment_id
          });
        }
      }
    }
    
    res.json({ 
      message: 'Metrics calculated successfully',
      metrics_calculated: metrics.length,
      metric_types: metricTypes || ['ilo_mastery', 'engagement_score']
    });
  } catch (error) {
    console.error('Error calculating metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/analytics/clusters/faculty/:facultyId - Get clusters for a faculty member's classes
router.get('/clusters/faculty/:facultyId', async (req, res) => {
  const { facultyId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        ac.cluster_id,
        ac.enrollment_id,
        ac.cluster_label,
        ac.cluster_type,
        ac.based_on,
        ac.algorithm_used,
        ac.model_version,
        ac.confidence_score,
        ac.cluster_characteristics,
        ac.recommendations,
        ac.generated_at,
        ac.is_active,
        s.student_number,
        s.full_name,
        c.title as course_title,
        c.course_code,
        sc.section_code
      FROM analytics_clusters ac
      JOIN course_enrollments ce ON ac.enrollment_id = ce.enrollment_id
      JOIN students s ON ce.student_id = s.student_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      JOIN courses c ON sc.course_id = c.course_id
      WHERE sc.instructor_id = $1 AND ac.is_active = true
      ORDER BY ac.generated_at DESC
    `;
    
    const result = await client.query(query, [facultyId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching faculty clusters:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/analytics/insights/faculty/:facultyId - Get insights for a faculty member
router.get('/insights/faculty/:facultyId', async (req, res) => {
  const { facultyId } = req.params;
  const client = await pool.connect();
  
  try {
    // Get performance insights for faculty's classes
    const performanceQuery = `
      SELECT 
        'performance' as insight_type,
        sc.section_course_id,
        c.course_code,
        c.title as course_title,
        COUNT(DISTINCT ce.enrollment_id) as total_students,
        COUNT(DISTINCT CASE WHEN sas.total_score / sa.total_points < 0.75 THEN ce.enrollment_id END) as at_risk_students,
        AVG(CASE WHEN sas.total_score IS NOT NULL THEN sas.total_score / sa.total_points * 100 END) as average_performance,
        COUNT(DISTINCT sa.sub_assessment_id) as total_assessments,
        COUNT(DISTINCT CASE WHEN sa.is_published = true THEN sa.sub_assessment_id END) as published_assessments
      FROM section_courses sc
      JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN course_enrollments ce ON sc.section_course_id = ce.section_course_id
      LEFT JOIN sub_assessments sa ON sc.section_course_id = sa.section_course_id
      LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id AND ce.enrollment_id = sas.enrollment_id
      WHERE sc.instructor_id = $1
      GROUP BY sc.section_course_id, c.course_code, c.title
    `;
    
    const performanceResult = await client.query(performanceQuery, [facultyId]);
    
    // Get attendance insights
    const attendanceQuery = `
      SELECT 
        'attendance' as insight_type,
        sc.section_course_id,
        c.course_code,
        c.title as course_title,
        COUNT(DISTINCT ce.enrollment_id) as total_students,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'absent' THEN ce.enrollment_id END) as absent_students,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'present' THEN ce.enrollment_id END) as present_students,
        AVG(CASE WHEN a.attendance_status = 'present' THEN 1 WHEN a.attendance_status = 'absent' THEN 0 END) * 100 as attendance_rate
      FROM section_courses sc
      JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN course_enrollments ce ON sc.section_course_id = ce.section_course_id
      LEFT JOIN attendance a ON ce.enrollment_id = a.enrollment_id
      WHERE sc.instructor_id = $1
      GROUP BY sc.section_course_id, c.course_code, c.title
    `;
    
    const attendanceResult = await client.query(attendanceQuery, [facultyId]);
    
    const insights = [
      ...performanceResult.rows.map(row => ({
        type: row.insight_type,
        details: {
          courseCode: row.course_code,
          courseTitle: row.course_title,
          totalStudents: parseInt(row.total_students) || 0,
          atRiskStudents: parseInt(row.at_risk_students) || 0,
          averagePerformance: parseFloat(row.average_performance) || 0,
          totalAssessments: parseInt(row.total_assessments) || 0,
          publishedAssessments: parseInt(row.published_assessments) || 0
        }
      })),
      ...attendanceResult.rows.map(row => ({
        type: row.insight_type,
        details: {
          courseCode: row.course_code,
          courseTitle: row.course_title,
          totalStudents: parseInt(row.total_students) || 0,
          absentStudents: parseInt(row.absent_students) || 0,
          presentStudents: parseInt(row.present_students) || 0,
          attendanceRate: parseFloat(row.attendance_rate) || 0
        }
      }))
    ];
    
    res.json(insights);
  } catch (error) {
    console.error('Error fetching faculty insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/analytics/performance/faculty/:facultyId - Get performance metrics for a faculty member
router.get('/performance/faculty/:facultyId', async (req, res) => {
  const { facultyId } = req.params;
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT sc.section_course_id) as total_courses,
        COUNT(DISTINCT ce.enrollment_id) as total_students,
        COUNT(DISTINCT CASE WHEN sas.total_score / sa.total_points < 0.75 THEN ce.enrollment_id END) as at_risk_students,
        AVG(CASE WHEN sas.total_score IS NOT NULL THEN sas.total_score / sa.total_points * 100 END) as average_grade,
        COUNT(DISTINCT sa.sub_assessment_id) as total_assessments,
        COUNT(DISTINCT CASE WHEN sa.is_published = true THEN sa.sub_assessment_id END) as published_assessments,
        COUNT(DISTINCT CASE WHEN sa.is_graded = true THEN sa.sub_assessment_id END) as graded_assessments
      FROM section_courses sc
      LEFT JOIN course_enrollments ce ON sc.section_course_id = ce.section_course_id
      LEFT JOIN sub_assessments sa ON sc.section_course_id = sa.section_course_id
      LEFT JOIN sub_assessment_submissions sas ON sa.sub_assessment_id = sas.sub_assessment_id AND ce.enrollment_id = sas.enrollment_id
      WHERE sc.instructor_id = $1
    `;
    
    const result = await client.query(query, [facultyId]);
    const performance = result.rows[0] || {};
    
    res.json({
      totalCourses: parseInt(performance.total_courses) || 0,
      totalStudents: parseInt(performance.total_students) || 0,
      atRiskStudents: parseInt(performance.at_risk_students) || 0,
      averageGrade: parseFloat(performance.average_grade) || 0,
      totalAssessments: parseInt(performance.total_assessments) || 0,
      publishedAssessments: parseInt(performance.published_assessments) || 0,
      gradedAssessments: parseInt(performance.graded_assessments) || 0
    });
  } catch (error) {
    console.error('Error fetching faculty performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/analytics/cache/faculty/:faculty_id - Get cached analytics data for faculty
router.get('/cache/faculty/:faculty_id', async (req, res) => {
  const { faculty_id } = req.params;
  
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT cache_id, cache_type, data_json, last_updated
      FROM dashboards_data_cache
      WHERE cache_type = 'faculty_analytics' AND user_id = $1
      ORDER BY last_updated DESC
      LIMIT 1
    `;
    
    const result = await client.query(query, [faculty_id]);
    
    client.release();
    
    if (result.rows.length > 0) {
      const cacheData = result.rows[0];
      const dataAge = Date.now() - new Date(cacheData.last_updated).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      // Check if cache is still valid (less than 24 hours old)
      if (dataAge < maxAge) {
        res.json({
          cached: true,
          data: cacheData.data_json,
          last_updated: cacheData.last_updated,
          age_hours: Math.round(dataAge / (60 * 60 * 1000))
        });
      } else {
        res.json({
          cached: false,
          message: 'Cache expired',
          last_updated: cacheData.last_updated,
          age_hours: Math.round(dataAge / (60 * 60 * 1000))
        });
      }
    } else {
      res.json({
        cached: false,
        message: 'No cached data found'
      });
    }
    
  } catch (error) {
    console.error('Error fetching cached analytics:', error);
    res.status(500).json({ error: 'Failed to fetch cached analytics' });
  }
});

// POST /api/analytics/cache/faculty/:faculty_id - Store analytics data for faculty
router.post('/cache/faculty/:faculty_id', async (req, res) => {
  const { faculty_id } = req.params;
  const { analytics_data } = req.body;
  
  try {
    const client = await pool.connect();
    
    // First, delete any existing cache for this faculty
    const deleteQuery = `
      DELETE FROM dashboards_data_cache
      WHERE cache_type = 'faculty_analytics' AND user_id = $1
    `;
    
    await client.query(deleteQuery, [faculty_id]);
    
    // Insert new cache data
    const insertQuery = `
      INSERT INTO dashboards_data_cache (cache_type, user_id, data_json, last_updated)
      VALUES ('faculty_analytics', $1, $2, NOW())
      RETURNING cache_id, last_updated
    `;
    
    const result = await client.query(insertQuery, [faculty_id, analytics_data]);
    
    client.release();
    
    res.json({
      success: true,
      cache_id: result.rows[0].cache_id,
      last_updated: result.rows[0].last_updated,
      message: 'Analytics data cached successfully'
    });
    
  } catch (error) {
    console.error('Error caching analytics data:', error);
    res.status(500).json({ error: 'Failed to cache analytics data' });
  }
});

// DELETE /api/analytics/cache/faculty/:faculty_id - Clear cached analytics data for faculty
router.delete('/cache/faculty/:faculty_id', async (req, res) => {
  const { faculty_id } = req.params;
  
  try {
    const client = await pool.connect();
    
    const query = `
      DELETE FROM dashboards_data_cache
      WHERE cache_type = 'faculty_analytics' AND user_id = $1
    `;
    
    const result = await client.query(query, [faculty_id]);
    
    client.release();
    
    res.json({
      success: true,
      deleted_count: result.rowCount,
      message: 'Cached analytics data cleared successfully'
    });
    
  } catch (error) {
    console.error('Error clearing cached analytics:', error);
    res.status(500).json({ error: 'Failed to clear cached analytics' });
  }
});

module.exports = router; 