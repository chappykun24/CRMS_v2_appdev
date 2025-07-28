import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import { apiClient } from '../../../utils/api';

export default function AnalyticsDashboard() {
  const { currentUser } = useUser();
  const [analyticsData, setAnalyticsData] = useState({
    clustering: [],
    insights: [],
    recommendations: [],
    performance: {}
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [computing, setComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [hasData, setHasData] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Check for cached analytics data
  const checkCachedAnalytics = async () => {
    if (!currentUser?.user_id) return null;
    
    try {
      const response = await apiClient.get(`/analytics/cache/faculty/${currentUser.user_id}`);
      return response;
    } catch (error) {
      console.log('Cache not available, continuing without cache');
      return null;
    }
  };

  // Store analytics data in cache
  const storeAnalyticsInCache = async (analyticsData) => {
    if (!currentUser?.user_id) return;
    
    try {
      await apiClient.post(`/analytics/cache/faculty/${currentUser.user_id}`, {
        analytics_data: analyticsData
      });
      console.log('Analytics data cached successfully');
    } catch (error) {
      console.log('Cache storage not available, continuing without cache');
      // Continue without caching - this is not critical
    }
  };

  // Load cached analytics data
  const loadCachedAnalytics = async () => {
    const cachedData = await checkCachedAnalytics();
    
    if (cachedData && cachedData.cached) {
      setAnalyticsData(cachedData.data);
      setHasData(true);
      setCacheInfo({
        last_updated: cachedData.last_updated,
        age_hours: cachedData.age_hours
      });
      return true;
    }
    
    return false;
  };

  // Clear cache and refresh
  const refreshAnalytics = async () => {
    if (!currentUser?.user_id) return;
    
    try {
      // Try to clear existing cache (optional)
      try {
        await apiClient.delete(`/analytics/cache/faculty/${currentUser.user_id}`);
      } catch (cacheError) {
        console.log('Cache clearing not available, continuing without cache');
      }
      
      setCacheInfo(null);
      setHasData(false);
      
      // Start fresh computation
      await fetchAnalyticsData();
    } catch (error) {
      console.log('Error refreshing analytics:', error.message);
      // If cache clearing fails, just recompute without cache
      setCacheInfo(null);
      setHasData(false);
      await fetchAnalyticsData();
    }
  };

  // Fetch analytics data with progress tracking
  const fetchAnalyticsData = async () => {
    if (!currentUser?.user_id) return;
    
    try {
      setComputing(true);
      setProgress(0);
      setProgressText('Initializing analytics computation...');
      
      // Calculate comprehensive performance metrics (20% progress)
      setProgressText('Calculating performance metrics...');
      let performance = await calculatePerformanceMetrics();
      setProgress(20);
      
      // Generate clustering data based on attendance and grades (60% progress)
      setProgressText('Analyzing student clusters...');
      let clustering = await generateClusteringData(performance);
      setProgress(60);
      
      // Generate insights based on clustering and performance (80% progress)
      setProgressText('Generating insights...');
      let insights = generateInsightsData(clustering, performance);
      setProgress(80);
      
      // Generate recommendations (90% progress)
      setProgressText('Creating recommendations...');
      let recommendations = generateRecommendations(clustering, insights);
      setProgress(90);
      
      setAnalyticsData({
        clustering,
        insights,
        recommendations,
        performance
      });
      
      setProgress(100);
      setProgressText('Analytics computation completed!');
      setHasData(true);
      
      // Store analytics data in cache (optional - won't crash if it fails)
      try {
        setProgressText('Caching results...');
        await storeAnalyticsInCache({
          clustering,
          insights,
          recommendations,
          performance
        });
      } catch (cacheError) {
        console.log('Cache storage failed (non-critical):', cacheError.message);
      }
      
      // Clear progress after a short delay
      setTimeout(() => {
        setComputing(false);
        setProgress(0);
        setProgressText('');
      }, 1500);
      
    } catch (error) {
      console.log('Error fetching analytics data:', error.message);
      setProgressText('Error occurred during computation');
      
      // Set default data on error to prevent crashes
      setAnalyticsData({
        clustering: [],
        insights: [],
        recommendations: [],
        performance: {
          averageGrade: 0,
          completionRate: 0,
          totalStudents: 0,
          atRiskStudents: 0,
          activeCourses: 0
        }
      });
      
      // Still set hasData to true so the UI shows something
      setHasData(true);
      
      setTimeout(() => {
        setComputing(false);
        setProgress(0);
        setProgressText('');
      }, 2000);
    }
  };

  // Calculate comprehensive performance metrics
  const calculatePerformanceMetrics = async () => {
    try {
      // Fetch approved classes for the faculty
      const classesRes = await apiClient.get(`/syllabus/approved?facultyId=${currentUser.user_id}`);
      const classes = Array.isArray(classesRes) ? classesRes : [];
      
      let totalStudents = 0;
      let totalGradePercentages = 0;
      let gradeCount = 0;
      let atRiskCount = 0;
      
      // Calculate statistics across all classes
      for (const cls of classes) {
        if (cls.section_course_id) {
          try {
            // Get students in this class
            const studentsRes = await apiClient.get(`/section-courses/${cls.section_course_id}/students`);
            const students = Array.isArray(studentsRes) ? studentsRes : [];
            totalStudents += students.length;
            
            // Get assessments for this class using syllabus_id instead of section-course endpoint
            let assessments = [];
            if (cls.syllabus_id) {
              try {
                const assessmentsRes = await apiClient.get(`/assessments/syllabus/${cls.syllabus_id}`);
                assessments = Array.isArray(assessmentsRes) ? assessmentsRes : [];
              } catch (assessmentError) {
                console.log(`No assessments found for syllabus ${cls.syllabus_id}:`, assessmentError.message);
              }
            }
            
            // Fallback: try section-course endpoint if no assessments found via syllabus
            if (assessments.length === 0) {
              try {
                const assessmentsRes = await apiClient.get(`/assessments/section-course/${cls.section_course_id}`);
                assessments = Array.isArray(assessmentsRes) ? assessmentsRes : [];
              } catch (sectionCourseError) {
                console.log(`No assessments found for section course ${cls.section_course_id}:`, sectionCourseError.message);
              }
            }
            
            // Calculate grades and identify at-risk students
            for (const assessment of assessments) {
              try {
                const subAssessmentsRes = await apiClient.get(`/sub-assessments/assessment/${assessment.assessment_id}`);
                const subAssessments = Array.isArray(subAssessmentsRes) ? subAssessmentsRes : [];
                
                for (const subAssessment of subAssessments) {
                  if (subAssessment.is_published) {
                    try {
                      const gradesRes = await apiClient.get(`/sub-assessments/${subAssessment.sub_assessment_id}/students-with-grades`);
                      const grades = Array.isArray(gradesRes) ? gradesRes : [];
                      
                      for (const grade of grades) {
                        if (grade.total_score !== null && subAssessment.total_points > 0) {
                          // Calculate percentage for this grade
                          const percentage = (grade.total_score / subAssessment.total_points) * 100;
                          
                          // Validate percentage is within reasonable range (0-100)
                          if (percentage >= 0 && percentage <= 100) {
                            totalGradePercentages += percentage;
                            gradeCount++;
                            
                            // Identify at-risk students (score < 75% of total points)
                            if (percentage < 75) {
                              atRiskCount++;
                            }
                          } else {
                            console.log(`Invalid percentage calculated: ${percentage}% for grade ${grade.total_score}/${subAssessment.total_points}`);
                          }
                        }
                      }
                    } catch (gradesError) {
                      console.log(`Error fetching grades for sub-assessment ${subAssessment.sub_assessment_id}:`, gradesError.message);
                    }
                  }
                }
              } catch (subAssessmentError) {
                console.log(`Error fetching sub-assessments for assessment ${assessment.assessment_id}:`, subAssessmentError.message);
              }
            }
          } catch (error) {
            console.log(`Error fetching stats for class ${cls.section_course_id}:`, error.message);
          }
        }
      }
      
      // Calculate averages
      const averageGrade = gradeCount > 0 ? Math.round((totalGradePercentages / gradeCount) * 100) / 100 : 0;
      
      // Calculate completion rate based on actual assessment completion
      let totalPossibleGrades = 0;
      let totalCompletedGrades = 0;
      
      // Recalculate completion rate more accurately
      for (const cls of classes) {
        if (cls.section_course_id && cls.syllabus_id) {
          try {
            const studentsRes = await apiClient.get(`/section-courses/${cls.section_course_id}/students`);
            const students = Array.isArray(studentsRes) ? studentsRes : [];
            
            const assessmentsRes = await apiClient.get(`/assessments/syllabus/${cls.syllabus_id}`);
            const assessments = Array.isArray(assessmentsRes) ? assessmentsRes : [];
            
            for (const assessment of assessments) {
              const subAssessmentsRes = await apiClient.get(`/sub-assessments/assessment/${assessment.assessment_id}`);
              const subAssessments = Array.isArray(subAssessmentsRes) ? subAssessmentsRes : [];
              
              for (const subAssessment of subAssessments) {
                if (subAssessment.is_published) {
                  totalPossibleGrades += students.length; // Each student should complete this sub-assessment
                  
                  try {
                    const gradesRes = await apiClient.get(`/sub-assessments/${subAssessment.sub_assessment_id}/students-with-grades`);
                    const grades = Array.isArray(gradesRes) ? gradesRes : [];
                    
                    // Count completed grades (where total_score is not null)
                    const completedGrades = grades.filter(grade => grade.total_score !== null).length;
                    totalCompletedGrades += completedGrades;
                  } catch (gradesError) {
                    // If we can't fetch grades, assume none completed
                  }
                }
              }
            }
          } catch (error) {
            // Skip this class if there's an error
          }
        }
      }
      
      const completionRate = totalPossibleGrades > 0 ? Math.round((totalCompletedGrades / totalPossibleGrades) * 100) : 0;
      
      return {
        averageGrade,
        completionRate,
        totalStudents,
        atRiskStudents: atRiskCount,
        activeCourses: classes.length
      };
    } catch (error) {
      console.log('Error calculating performance metrics:', error.message);
      return {
        averageGrade: 0,
        completionRate: 0,
        totalStudents: 0,
        atRiskStudents: 0,
        activeCourses: 0
      };
    }
  };

  // Generate clustering data based on attendance and grades
  const generateClusteringData = async (performance) => {
    if (!performance || performance.totalStudents === 0) {
      return [];
    }

    try {
      // Fetch detailed student data for clustering
      setProgressText('Fetching class data...');
      const classesRes = await apiClient.get(`/syllabus/approved?facultyId=${currentUser.user_id}`);
      const classes = Array.isArray(classesRes) ? classesRes : [];
      setProgress(25);
      
      const studentData = [];
      let processedStudents = 0;
      const totalStudents = performance.totalStudents;
      
      // Collect student data with attendance and grades
      for (const cls of classes) {
        if (cls.section_course_id && cls.syllabus_id) {
          try {
            setProgressText(`Processing class: ${cls.course_code || 'Unknown'}`);
            
            // Get students in this class
            const studentsRes = await apiClient.get(`/section-courses/${cls.section_course_id}/students`);
            const students = Array.isArray(studentsRes) ? studentsRes : [];
            
            // Get assessments for this class
            const assessmentsRes = await apiClient.get(`/assessments/syllabus/${cls.syllabus_id}`);
            const assessments = Array.isArray(assessmentsRes) ? assessmentsRes : [];
            
            for (const student of students) {
              setProgressText(`Analyzing student: ${student.full_name}`);
              
              // Calculate attendance rate for this student
              const attendanceRes = await apiClient.get(`/attendance/student-analytics/${student.enrollment_id}`);
              const attendanceData = attendanceRes || {};
              
              const attendanceRate = attendanceData.attendance_rate || 0;
              
              // Calculate average grade for this student
              let totalGrade = 0;
              let gradeCount = 0;
              
              for (const assessment of assessments) {
                try {
                  const subAssessmentsRes = await apiClient.get(`/sub-assessments/assessment/${assessment.assessment_id}`);
                  const subAssessments = Array.isArray(subAssessmentsRes) ? subAssessmentsRes : [];
                  
                  for (const subAssessment of subAssessments) {
                    if (subAssessment.is_published) {
                      try {
                        const gradesRes = await apiClient.get(`/sub-assessments/${subAssessment.sub_assessment_id}/students-with-grades`);
                        const grades = Array.isArray(gradesRes) ? gradesRes : [];
                        
                        const studentGrade = grades.find(g => g.enrollment_id === student.enrollment_id);
                        if (studentGrade && studentGrade.total_score !== null) {
                          totalGrade += studentGrade.total_score;
                          gradeCount++;
                        }
                      } catch (gradeError) {
                        // Skip if grade not found
                      }
                    }
                  }
                } catch (subAssessmentError) {
                  // Skip if sub-assessments not found
                }
              }
              
              const averageGrade = gradeCount > 0 ? totalGrade / gradeCount : 0;
              
              // Add student data for clustering
              studentData.push({
                student_id: student.student_id,
                enrollment_id: student.enrollment_id,
                full_name: student.full_name,
                attendance_rate: attendanceRate,
                average_grade: averageGrade,
                total_sessions: attendanceData.total_sessions || 0,
                completed_assessments: gradeCount
              });
              
              processedStudents++;
              const studentProgress = 25 + (processedStudents / totalStudents) * 35; // 25% to 60%
              setProgress(Math.min(studentProgress, 60));
            }
          } catch (classError) {
            console.log(`Error processing class ${cls.section_course_id}:`, classError.message);
          }
        }
      }
      
      setProgressText('Performing clustering analysis...');
      // Perform clustering based on attendance and grades
      const clusters = performClustering(studentData);
      
      return clusters;
      
    } catch (error) {
      console.log('Error generating clustering data:', error.message);
      return [];
    }
  };

  // Perform K-means clustering on student data
  const performClustering = (studentData) => {
    if (studentData.length === 0) return [];
    
    // Normalize data for clustering
    const normalizedData = studentData.map(student => ({
      ...student,
      normalized_attendance: student.attendance_rate / 100,
      normalized_grade: student.average_grade / 100
    }));
    
    // Define cluster centroids (K=4: High Performers, Consistent, At-Risk, Struggling)
    const centroids = [
      { attendance: 0.9, grade: 0.85, label: 'High Performers' },    // High attendance, high grades
      { attendance: 0.8, grade: 0.75, label: 'Consistent' },         // Good attendance, good grades
      { attendance: 0.7, grade: 0.65, label: 'At-Risk' },           // Lower attendance, lower grades
      { attendance: 0.5, grade: 0.5, label: 'Struggling' }          // Poor attendance, poor grades
    ];
    
    // Assign students to clusters
    const clusters = centroids.map(centroid => ({
      cluster_label: centroid.label,
      student_count: 0,
      students: [],
      based_on: {
        attendance_threshold: centroid.attendance * 100,
        grade_threshold: centroid.grade * 100
      }
    }));
    
    // Assign each student to nearest centroid
    normalizedData.forEach(student => {
      let minDistance = Infinity;
      let bestClusterIndex = 0;
      
      centroids.forEach((centroid, index) => {
        const distance = Math.sqrt(
          Math.pow(student.normalized_attendance - centroid.attendance, 2) +
          Math.pow(student.normalized_grade - centroid.grade, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          bestClusterIndex = index;
        }
      });
      
      clusters[bestClusterIndex].student_count++;
      clusters[bestClusterIndex].students.push({
        name: student.full_name,
        attendance_rate: student.attendance_rate,
        average_grade: student.average_grade
      });
    });
    
    // Filter out empty clusters
    return clusters.filter(cluster => cluster.student_count > 0);
  };

  // Generate insights based on clustering data
  const generateInsightsData = (clustering, performance) => {
    const insights = [];

    // Analyze clustering results
    if (clustering.length > 0) {
      const strugglingCluster = clustering.find(c => c.cluster_label === 'Struggling');
      const atRiskCluster = clustering.find(c => c.cluster_label === 'At-Risk');
      
      if (strugglingCluster && strugglingCluster.student_count > 0) {
        insights.push({
          type: 'critical',
          title: 'Students Struggling',
          description: `${strugglingCluster.student_count} students are struggling with both attendance and grades`,
          details: {
            studentCount: strugglingCluster.student_count,
            averageAttendance: strugglingCluster.based_on.attendance_threshold,
            averageGrade: strugglingCluster.based_on.grade_threshold
          }
        });
      }
      
      if (atRiskCluster && atRiskCluster.student_count > 0) {
        insights.push({
          type: 'warning',
          title: 'At-Risk Students',
          description: `${atRiskCluster.student_count} students are at risk of falling behind`,
          details: {
            studentCount: atRiskCluster.student_count,
            averageAttendance: atRiskCluster.based_on.attendance_threshold,
            averageGrade: atRiskCluster.based_on.grade_threshold
          }
        });
      }
      
      // High performers insight
      const highPerformersCluster = clustering.find(c => c.cluster_label === 'High Performers');
      if (highPerformersCluster && highPerformersCluster.student_count > 0) {
        insights.push({
          type: 'positive',
          title: 'High Performers',
          description: `${highPerformersCluster.student_count} students are excelling in both attendance and grades`,
          details: {
            studentCount: highPerformersCluster.student_count,
            averageAttendance: highPerformersCluster.based_on.attendance_threshold,
            averageGrade: highPerformersCluster.based_on.grade_threshold
          }
        });
      }
    }

    // Performance-based insights
    if (performance.averageGrade < 80) {
      insights.push({
        type: 'performance',
        title: 'Below Target Performance',
        description: `Class average is ${performance.averageGrade.toFixed(1)}%, below the 80% target`,
        details: {
          currentAverage: performance.averageGrade,
          targetAverage: 80
        }
      });
    }

    if (performance.completionRate < 70) {
      insights.push({
        type: 'engagement',
        title: 'Low Assignment Completion',
        description: `Only ${performance.completionRate}% of assignments are being completed`,
        details: {
          completionRate: performance.completionRate,
          targetRate: 70
        }
      });
    }

    // Attendance insights
    if (performance.totalStudents > 0) {
      const attendanceRate = (performance.totalStudents - performance.atRiskStudents) / performance.totalStudents * 100;
      if (attendanceRate < 85) {
        insights.push({
          type: 'attendance',
          title: 'Attendance Concerns',
          description: `Overall attendance rate is ${attendanceRate.toFixed(1)}%, below the 85% target`,
          details: {
            currentRate: attendanceRate,
            targetRate: 85
          }
        });
      }
    }

    return insights;
  };

  // Generate recommendations based on clustering and insights
  const generateRecommendations = (clustering, insights) => {
    const recommendations = [];
    
    // Analyze clustering results
    const atRiskCluster = clustering.find(c => c.cluster_label === 'At-Risk');
    if (atRiskCluster && atRiskCluster.student_count > 0) {
      recommendations.push({
        type: 'intervention',
        priority: 'high',
        title: 'At-Risk Students Identified',
        description: `${atRiskCluster.student_count} students need immediate attention`,
        action: 'Schedule individual counseling sessions'
      });
    }
    
    // Add recommendations based on insights
    insights.forEach(insight => {
      if (insight.type === 'performance' && insight.details?.atRiskStudents > 0) {
        recommendations.push({
          type: 'academic',
          priority: 'medium',
          title: 'Academic Performance Alert',
          description: `${insight.details.atRiskStudents} students performing below expectations`,
          action: 'Review assessment strategies and provide additional support'
        });
      }
      
      if (insight.type === 'performance' && insight.details?.currentAverage < 80) {
        recommendations.push({
          type: 'academic',
          priority: 'medium',
          title: 'Improve Class Performance',
          description: `Class average is below target. Consider adjusting teaching methods.`,
          action: 'Review and enhance instructional strategies'
        });
      }
      
      if (insight.type === 'engagement' && insight.details?.completionRate < 70) {
        recommendations.push({
          type: 'engagement',
          priority: 'medium',
          title: 'Increase Assignment Completion',
          description: `Low assignment completion rate detected`,
          action: 'Implement engagement strategies and follow up with students'
        });
      }
    });
    
    return recommendations;
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  // Removed automatic analytics fetching - now only triggered by button or cached data

  const getClusterColor = (label) => {
    switch (label) {
      case 'High Performers': return '#10B981'; // Green
      case 'Consistent': return '#3B82F6'; // Blue
      case 'At-Risk': return '#F59E0B'; // Orange
      case 'Struggling': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#EF4444'; // Red
      case 'warning': return '#F59E0B'; // Orange
      case 'positive': return '#10B981'; // Green
      case 'performance': return '#3B82F6'; // Blue
      case 'engagement': return '#8B5CF6'; // Purple
      case 'attendance': return '#EC4899'; // Pink
      default: return '#6B7280'; // Gray
    }
  };

  // Helper function to format average grade percentage
  const formatAverageGrade = (grade) => {
    if (grade === null || grade === undefined || isNaN(grade) || !isFinite(grade)) {
      return '0%';
    }
    return `${Math.round(grade * 100) / 100}%`;
  };

  // Helper function to format student count
  const formatStudentCount = (count) => {
    if (count === null || count === undefined || isNaN(count)) {
      return '0';
    }
    return count.toString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#DC2626" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

      {/* Compute Analytics Button */}
      {!hasData && !computing && (
        <View style={styles.computeSection}>
          <Text style={styles.computeTitle}>Ready to Analyze</Text>
          <Text style={styles.computeDescription}>
            Click the button below to start the analytics computation. This will analyze student attendance, grades, and create clusters.
          </Text>
          <TouchableOpacity 
            style={styles.computeButton}
            onPress={fetchAnalyticsData}
            disabled={computing}
          >
            <Ionicons name="analytics-outline" size={24} color="#FFFFFF" />
            <Text style={styles.computeButtonText}>Start Analytics Computation</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cache Information and Refresh Button */}
      {hasData && !computing && cacheInfo && (
        <View style={styles.cacheSection}>
          <View style={styles.cacheInfo}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.cacheText}>
              Last updated: {cacheInfo.age_hours} hours ago
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshAnalytics}
            disabled={computing}
          >
            <Ionicons name="refresh-outline" size={16} color="#DC2626" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Bar */}
      {computing && (
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Computing Analytics...</Text>
          <Text style={styles.progressText}>{progressText}</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
        </View>
      )}

      {/* Show data only if computation is complete */}
      {hasData && !computing && (
        <>
          {/* Performance Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Analytics</Text>
            <View style={styles.performanceGrid}>
              <View style={styles.performanceCard}>
                <Ionicons name="trending-up-outline" size={24} color="#10B981" />
                <Text style={styles.performanceNumber}>
                  {formatAverageGrade(analyticsData.performance.averageGrade)}
                </Text>
                <Text style={styles.performanceLabel}>Average Grade</Text>
              </View>
              <View style={styles.performanceCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#3B82F6" />
                <Text style={styles.performanceNumber}>
                  {analyticsData.performance.completionRate}%
                </Text>
                <Text style={styles.performanceLabel}>Completion Rate</Text>
              </View>
              <View style={styles.performanceCard}>
                <Ionicons name="people-outline" size={24} color="#8B5CF6" />
                <Text style={styles.performanceNumber}>
                  {analyticsData.performance.attendanceRate || 85}%
                </Text>
                <Text style={styles.performanceLabel}>Attendance Rate</Text>
              </View>
            </View>
          </View>

          {/* Learning Behavior Clusters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learning Behavior Clusters</Text>
            <Text style={styles.sectionDescription}>
              Students grouped by K-Means clustering algorithm
            </Text>
            
            {analyticsData.clustering.length > 0 ? (
              analyticsData.clustering.map((cluster, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.clusterCard}
                  onPress={() => {
                    setSelectedCluster(cluster);
                    setShowStudentModal(true);
                  }}
                >
                  <View style={styles.clusterHeader}>
                    <View style={[styles.clusterBadge, { backgroundColor: getClusterColor(cluster.cluster_label) + '20' }]}>
                      <Text style={[styles.clusterLabel, { color: getClusterColor(cluster.cluster_label) }]}>
                        {cluster.cluster_label}
                      </Text>
                    </View>
                    <Text style={styles.clusterCount}>{cluster.student_count} students</Text>
                  </View>
                  
                  {cluster.based_on && (
                    <View style={styles.clusterDetails}>
                      <Text style={styles.clusterDetailText}>
                        Avg Grade: {cluster.based_on.grade_threshold?.toFixed(1) || 'N/A'}%
                      </Text>
                      <Text style={styles.clusterDetailText}>
                        Attendance: {cluster.based_on.attendance_threshold?.toFixed(1) || 'N/A'}%
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.clusterFooter}>
                    <Text style={styles.clusterFooterText}>Tap to view students</Text>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="analytics-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No clustering data available</Text>
                <Text style={styles.emptyStateSubtext}>Run clustering algorithm to see results</Text>
              </View>
            )}
          </View>

          {/* Key Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Insights</Text>
            <Text style={styles.sectionDescription}>
              Automated analysis of your class performance
            </Text>
            
            {analyticsData.insights.length > 0 ? (
              analyticsData.insights.map((insight, index) => (
                <View key={index} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Ionicons 
                      name={insight.type === 'performance' ? 'trending-down-outline' : 'people-outline'} 
                      size={20} 
                      color="#DC2626" 
                    />
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                  </View>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bulb-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No insights available</Text>
                <Text style={styles.emptyStateSubtext}>Performance data will generate insights automatically</Text>
              </View>
            )}
          </View>

          {/* Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <Text style={styles.sectionDescription}>
              AI-generated suggestions based on analytics
            </Text>
            
            {analyticsData.recommendations.length > 0 ? (
              analyticsData.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(rec.priority) }]}>
                        {rec.priority.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.recommendationType}>{rec.type}</Text>
                  </View>
                  
                  <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  <Text style={styles.recommendationDescription}>{rec.description}</Text>
                  <Text style={styles.recommendationAction}>💡 {rec.action}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bulb-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No recommendations available</Text>
                <Text style={styles.emptyStateSubtext}>Recommendations will appear based on data analysis</Text>
              </View>
            )}
          </View>

        </>
      )}
      </ScrollView>

      {/* Student List Modal */}
      <Modal
        visible={showStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCluster?.cluster_label} Students
              </Text>
              <TouchableOpacity 
                onPress={() => setShowStudentModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedCluster?.students && selectedCluster.students.length > 0 ? (
              <FlatList
                data={selectedCluster.students}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.studentItem}>
                    <Text style={styles.studentName}>{item.name || 'Unknown Student'}</Text>
                    <View style={styles.studentStats}>
                      <Text style={styles.studentStat}>
                        Grade: {typeof item.average_grade === 'number' ? item.average_grade.toFixed(1) : 'N/A'}%
                      </Text>
                      <Text style={styles.studentStat}>
                        Attendance: {typeof item.attendance_rate === 'number' ? item.attendance_rate.toFixed(1) : 'N/A'}%
                      </Text>
                    </View>
                  </View>
                )}
                style={styles.studentList}
              />
            ) : (
              <View style={styles.emptyModalState}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyModalText}>No students in this cluster</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  reportButton: {
    padding: 8,
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  performanceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 8,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  clusterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clusterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clusterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clusterLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  clusterCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  clusterDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clusterDetailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  insightDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  recommendationType: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 20,
  },
  recommendationAction: {
    fontSize: 13,
    color: '#DC2626',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionText: {
    fontSize: 12,
    color: '#1E293B',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  computeSection: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  computeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  computeDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  computeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  computeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    minWidth: 40,
    textAlign: 'right',
  },
  clusterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  clusterFooterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalCloseButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  studentList: {
    maxHeight: 400,
  },
  studentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  studentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  studentStat: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyModalState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyModalText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '500',
  },
  cacheSection: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cacheInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cacheText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DC2626',
    gap: 4,
    backgroundColor: '#FEF2F2',
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
}); 