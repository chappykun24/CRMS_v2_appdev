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

module.exports = router; 