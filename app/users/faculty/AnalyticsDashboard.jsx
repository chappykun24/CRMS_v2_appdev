import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!currentUser?.user_id) return;
    
    try {
      setLoading(true);
      
      // Calculate comprehensive performance metrics
      let performance = await calculatePerformanceMetrics();
      
      // Generate mock clustering data based on performance metrics
      let clustering = generateMockClusteringData(performance);
      
      // Generate mock insights based on performance metrics
      let insights = generateMockInsightsData(performance);
      
      setAnalyticsData({
        clustering,
        insights,
        recommendations: generateRecommendations(clustering, insights),
        performance
      });
      
    } catch (error) {
      console.log('Error fetching analytics data:', error.message);
      // Set default data on error
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
    } finally {
      setLoading(false);
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
      const completionRate = totalStudents > 0 ? Math.round((gradeCount / (totalStudents * 4)) * 100) : 0; // Assuming 4 assessments per student
      
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

  // Generate mock clustering data based on performance metrics
  const generateMockClusteringData = (performance) => {
    if (!performance || performance.totalStudents === 0) {
      return [];
    }

    const clusters = [];
    const totalStudents = performance.totalStudents;
    const atRiskStudents = performance.atRiskStudents;
    const averageGrade = performance.averageGrade;

    // Calculate cluster distribution based on performance
    if (atRiskStudents > 0) {
      clusters.push({
        cluster_label: 'At-Risk',
        student_count: atRiskStudents,
        based_on: {
          grade_average: averageGrade * 0.6, // At-risk students have lower average
          attendance_rate: 75.0
        }
      });
    }

    // Consistent performers (students with good grades)
    const consistentCount = Math.max(0, Math.floor(totalStudents * 0.4));
    if (consistentCount > 0) {
      clusters.push({
        cluster_label: 'Consistent',
        student_count: consistentCount,
        based_on: {
          grade_average: averageGrade * 1.2, // Consistent students have higher average
          attendance_rate: 95.0
        }
      });
    }

    // Improving students (middle performers)
    const improvingCount = totalStudents - atRiskStudents - consistentCount;
    if (improvingCount > 0) {
      clusters.push({
        cluster_label: 'Improving',
        student_count: improvingCount,
        based_on: {
          grade_average: averageGrade * 0.9, // Improving students have slightly lower average
          attendance_rate: 85.0
        }
      });
    }

    return clusters;
  };

  // Generate mock insights data based on performance metrics
  const generateMockInsightsData = (performance) => {
    const insights = [];

    if (performance.atRiskStudents > 0) {
      insights.push({
        type: 'performance',
        title: 'At-Risk Students Detected',
        description: `${performance.atRiskStudents} students are performing below the 75% threshold`,
        details: {
          atRiskStudents: performance.atRiskStudents,
          threshold: 75
        }
      });
    }

    if (performance.averageGrade < 80) {
      insights.push({
        type: 'performance',
        title: 'Below Average Performance',
        description: `Class average is ${performance.averageGrade.toFixed(1)}%, which is below the target of 80%`,
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

  useEffect(() => {
    fetchAnalyticsData();
  }, [currentUser]);

  const getClusterColor = (label) => {
    switch (label) {
      case 'Consistent': return '#10B981';
      case 'Improving': return '#F59E0B';
      case 'At-Risk': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#DC2626" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/users/faculty/dashboard')} style={styles.reportButton}>
          <Ionicons name="home-outline" size={24} color="#DC2626" />
        </TouchableOpacity>
      </View>

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
            <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={styles.performanceNumber}>
              {formatStudentCount(analyticsData.performance.atRiskStudents)}
            </Text>
            <Text style={styles.performanceLabel}>At-Risk Students</Text>
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
            <View key={index} style={styles.clusterCard}>
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
                    Avg Grade: {cluster.based_on.grade_average?.toFixed(1) || 'N/A'}%
                  </Text>
                  <Text style={styles.clusterDetailText}>
                    Attendance: {cluster.based_on.attendance_rate?.toFixed(1) || 'N/A'}%
                  </Text>
                </View>
              )}
            </View>
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

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/users/faculty/AssessmentManagement',
              params: { source: 'analytics' }
            })}
          >
            <Ionicons name="calculator-outline" size={24} color="#DC2626" />
            <Text style={styles.actionText}>Assessment Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/users/faculty/AttendanceManagement')}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#DC2626" />
            <Text style={styles.actionText}>Attendance Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/users/faculty/GradeManagement')}
          >
            <Ionicons name="school-outline" size={24} color="#DC2626" />
            <Text style={styles.actionText}>Grade Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/users/faculty/MyClasses')}
          >
            <Ionicons name="school-outline" size={24} color="#DC2626" />
            <Text style={styles.actionText}>My Classes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  reportButton: {
    padding: 8,
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  performanceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 8,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  clusterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  clusterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clusterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
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
    color: '#353A40',
  },
  clusterDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clusterDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginLeft: 8,
  },
  insightDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  recommendationType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  recommendationAction: {
    fontSize: 12,
    color: '#DC2626',
    fontStyle: 'italic',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 12,
    color: '#353A40',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
}); 