const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

// K-Means Clustering Algorithm for Learning Behavior
class LearningBehaviorClusterer {
  constructor(k = 3) {
    this.k = k; // Number of clusters
    this.clusters = [];
    this.centroids = [];
  }

  // Calculate Euclidean distance between two points
  calculateDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point1.grade_average - point2.grade_average, 2) +
      Math.pow(point1.attendance_rate - point2.attendance_rate, 2) +
      Math.pow(point1.submission_rate - point2.submission_rate, 2) +
      Math.pow(point1.consistency_score - point2.consistency_score, 2)
    );
  }

  // Initialize centroids randomly
  initializeCentroids(data) {
    this.centroids = [];
    for (let i = 0; i < this.k; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      this.centroids.push({ ...data[randomIndex] });
    }
  }

  // Assign data points to nearest centroid
  assignToClusters(data) {
    this.clusters = Array.from({ length: this.k }, () => []);
    
    data.forEach(point => {
      let minDistance = Infinity;
      let clusterIndex = 0;
      
      this.centroids.forEach((centroid, index) => {
        const distance = this.calculateDistance(point, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          clusterIndex = index;
        }
      });
      
      this.clusters[clusterIndex].push(point);
    });
  }

  // Update centroids based on cluster means
  updateCentroids() {
    this.centroids = this.clusters.map(cluster => {
      if (cluster.length === 0) {
        return { grade_average: 0, attendance_rate: 0, submission_rate: 0, consistency_score: 0 };
      }
      
      const sum = cluster.reduce((acc, point) => ({
        grade_average: acc.grade_average + point.grade_average,
        attendance_rate: acc.attendance_rate + point.attendance_rate,
        submission_rate: acc.submission_rate + point.submission_rate,
        consistency_score: acc.consistency_score + point.consistency_score
      }), { grade_average: 0, attendance_rate: 0, submission_rate: 0, consistency_score: 0 });
      
      return {
        grade_average: sum.grade_average / cluster.length,
        attendance_rate: sum.attendance_rate / cluster.length,
        submission_rate: sum.submission_rate / cluster.length,
        consistency_score: sum.consistency_score / cluster.length
      };
    });
  }

  // Run K-Means clustering
  cluster(data, maxIterations = 100) {
    this.initializeCentroids(data);
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const previousCentroids = JSON.stringify(this.centroids);
      
      this.assignToClusters(data);
      this.updateCentroids();
      
      // Check for convergence
      if (JSON.stringify(this.centroids) === previousCentroids) {
        console.log(`Converged after ${iteration + 1} iterations`);
        break;
      }
    }
    
    return this.clusters;
  }

  // Label clusters based on characteristics
  labelClusters() {
    return this.clusters.map((cluster, index) => {
      if (cluster.length === 0) return { label: 'Unknown', students: [] };
      
      const avgGrade = cluster.reduce((sum, p) => sum + p.grade_average, 0) / cluster.length;
      const avgAttendance = cluster.reduce((sum, p) => sum + p.attendance_rate, 0) / cluster.length;
      const avgSubmission = cluster.reduce((sum, p) => sum + p.submission_rate, 0) / cluster.length;
      
      let label = 'Unknown';
      if (avgGrade >= 85 && avgAttendance >= 0.9 && avgSubmission >= 0.9) {
        label = 'Consistent';
      } else if (avgGrade >= 75 && avgAttendance >= 0.8) {
        label = 'Improving';
      } else if (avgGrade < 75 || avgAttendance < 0.7) {
        label = 'At-Risk';
      }
      
      return {
        clusterIndex: index,
        label,
        students: cluster,
        characteristics: {
          averageGrade: Math.round(avgGrade * 100) / 100,
          averageAttendance: Math.round(avgAttendance * 100) / 100,
          averageSubmission: Math.round(avgSubmission * 100) / 100,
          studentCount: cluster.length
        }
      };
    });
  }
}

// Main function to implement clustering
async function implementClusteringAlgorithm() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Implementing K-Means Clustering Algorithm for Learning Behavior...');
    
    // Step 1: Fetch student learning behavior data
    console.log('📊 Fetching student learning behavior data...');
    const studentDataQuery = `
      SELECT 
        s.student_id,
        s.full_name,
        s.student_number,
        ce.enrollment_id,
        sc.section_course_id,
        c.title as course_title,
        
        -- Grade average (0-100 scale)
        COALESCE(AVG(sas.total_score / sa.total_points * 100), 0) as grade_average,
        
        -- Attendance rate (0-1 scale)
        COALESCE(
          COUNT(CASE WHEN al.status = 'present' THEN 1 END) * 1.0 / 
          NULLIF(COUNT(al.status), 0), 0
        ) as attendance_rate,
        
        -- Submission rate (0-1 scale)
        COALESCE(
          COUNT(CASE WHEN sas.submission_id IS NOT NULL THEN 1 END) * 1.0 / 
          NULLIF(COUNT(sa.sub_assessment_id), 0), 0
        ) as submission_rate,
        
        -- Consistency score (0-1 scale) - based on grade variance
        COALESCE(
          1 - (STDDEV(sas.total_score / sa.total_points) / 
          NULLIF(AVG(sas.total_score / sa.total_points), 0)), 0
        ) as consistency_score
        
      FROM students s
      JOIN course_enrollments ce ON s.student_id = ce.student_id
      JOIN section_courses sc ON ce.section_course_id = sc.section_course_id
      JOIN courses c ON sc.course_id = c.course_id
      LEFT JOIN assessments a ON sc.section_course_id = a.section_course_id
      LEFT JOIN sub_assessments sa ON a.assessment_id = sa.assessment_id
      LEFT JOIN sub_assessment_submissions sas ON (
        sa.sub_assessment_id = sas.sub_assessment_id AND 
        ce.enrollment_id = sas.enrollment_id
      )
      LEFT JOIN attendance_logs al ON (
        ce.enrollment_id = al.enrollment_id
      )
      WHERE ce.status = 'enrolled'
      GROUP BY s.student_id, s.full_name, s.student_number, ce.enrollment_id, sc.section_course_id, c.title
      HAVING COUNT(sa.sub_assessment_id) > 0
      ORDER BY s.full_name
    `;
    
    const studentDataResult = await client.query(studentDataQuery);
    const studentData = studentDataResult.rows;
    
    console.log(`📈 Found ${studentData.length} students with learning behavior data`);
    
    if (studentData.length === 0) {
      console.log('❌ No student data found for clustering');
      return;
    }
    
    // Step 2: Prepare data for clustering
    const clusteringData = studentData.map(student => ({
      student_id: student.student_id,
      enrollment_id: student.enrollment_id,
      full_name: student.full_name,
      student_number: student.student_number,
      course_title: student.course_title,
      grade_average: parseFloat(student.grade_average) || 0,
      attendance_rate: parseFloat(student.attendance_rate) || 0,
      submission_rate: parseFloat(student.submission_rate) || 0,
      consistency_score: parseFloat(student.consistency_score) || 0
    }));
    
    // Step 3: Run K-Means clustering
    console.log('🎯 Running K-Means clustering algorithm...');
    const clusterer = new LearningBehaviorClusterer(3); // 3 clusters: Consistent, Improving, At-Risk
    const clusters = clusterer.cluster(clusteringData);
    const labeledClusters = clusterer.labelClusters();
    
    // Step 4: Save clustering results to database
    console.log('💾 Saving clustering results to database...');
    
    // Clear existing clusters
    await client.query('DELETE FROM analytics_clusters WHERE algorithm_used = $1', ['K-Means']);
    
    // Insert new cluster results
    for (const cluster of labeledClusters) {
      if (cluster.students.length === 0) continue;
      
      for (const student of cluster.students) {
        await client.query(`
          INSERT INTO analytics_clusters (
            enrollment_id, cluster_label, based_on, algorithm_used, model_version, generated_at
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [
          student.enrollment_id,
          cluster.label,
          JSON.stringify({
            grade_average: student.grade_average,
            attendance_rate: student.attendance_rate,
            submission_rate: student.submission_rate,
            consistency_score: student.consistency_score,
            cluster_characteristics: cluster.characteristics
          }),
          'K-Means',
          '1.0'
        ]);
      }
    }
    
    // Step 5: Generate insights and recommendations
    console.log('📋 Generating insights and recommendations...');
    
    const insights = labeledClusters.map(cluster => ({
      cluster: cluster.label,
      studentCount: cluster.students.length,
      characteristics: cluster.characteristics,
      recommendations: generateRecommendations(cluster)
    }));
    
    // Step 6: Save insights to database
    await client.query('DELETE FROM analytics_insights WHERE insight_type = $1', ['learning_behavior']);
    
    for (const insight of insights) {
      await client.query(`
        INSERT INTO analytics_insights (
          insight_type, insight_data, created_at
        ) VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [
        'learning_behavior',
        JSON.stringify(insight)
      ]);
    }
    
    // Step 7: Print summary
    console.log('\n📊 Clustering Results Summary:');
    insights.forEach(insight => {
      console.log(`\n🎯 ${insight.cluster} Cluster:`);
      console.log(`   Students: ${insight.studentCount}`);
      console.log(`   Average Grade: ${insight.characteristics.averageGrade}%`);
      console.log(`   Average Attendance: ${insight.characteristics.averageAttendance}%`);
      console.log(`   Average Submission: ${insight.characteristics.averageSubmission}%`);
      console.log(`   Recommendations: ${insight.recommendations.join(', ')}`);
    });
    
    console.log('\n✅ K-Means clustering algorithm implemented successfully!');
    console.log(`📈 Total students analyzed: ${studentData.length}`);
    console.log(`🎯 Clusters created: ${labeledClusters.filter(c => c.students.length > 0).length}`);
    
  } catch (error) {
    console.error('❌ Error implementing clustering algorithm:', error);
  } finally {
    client.release();
  }
}

// Generate recommendations based on cluster characteristics
function generateRecommendations(cluster) {
  const recommendations = [];
  
  switch (cluster.label) {
    case 'Consistent':
      recommendations.push(
        'Maintain current performance',
        'Consider advanced challenges',
        'Peer mentoring opportunities'
      );
      break;
    case 'Improving':
      recommendations.push(
        'Continue current strategies',
        'Additional support resources',
        'Regular progress monitoring'
      );
      break;
    case 'At-Risk':
      recommendations.push(
        'Immediate intervention needed',
        'Schedule academic counseling',
        'Provide additional resources',
        'Regular check-ins required'
      );
      break;
    default:
      recommendations.push('Monitor progress closely');
  }
  
  return recommendations;
}

// Run the clustering implementation
implementClusteringAlgorithm()
  .then(() => {
    console.log('🎉 Clustering algorithm implementation completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 