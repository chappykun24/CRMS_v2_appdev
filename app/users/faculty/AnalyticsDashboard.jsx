import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
      
      // Fetch clustering data
      const clusteringRes = await apiClient.get(`/analytics/clusters/faculty/${currentUser.user_id}`);
      const clustering = Array.isArray(clusteringRes) ? clusteringRes : [];
      
      // Fetch insights
      const insightsRes = await apiClient.get(`/analytics/insights/faculty/${currentUser.user_id}`);
      const insights = Array.isArray(insightsRes) ? insightsRes : [];
      
      // Fetch performance metrics
      const performanceRes = await apiClient.get(`/analytics/performance/faculty/${currentUser.user_id}`);
      const performance = performanceRes || {};
      
      setAnalyticsData({
        clustering,
        insights,
        recommendations: generateRecommendations(clustering, insights),
        performance
      });
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
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
    
    // Add more recommendations based on insights
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
        <TouchableOpacity onPress={() => router.push('/users/faculty/GenerateReport')} style={styles.reportButton}>
          <Ionicons name="document-text-outline" size={24} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* Performance Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceCard}>
            <Ionicons name="trending-up-outline" size={24} color="#10B981" />
            <Text style={styles.performanceNumber}>
              {analyticsData.performance.averageGrade || '0'}%
            </Text>
            <Text style={styles.performanceLabel}>Average Grade</Text>
          </View>
          <View style={styles.performanceCard}>
            <Ionicons name="people-outline" size={24} color="#3B82F6" />
            <Text style={styles.performanceNumber}>
              {analyticsData.performance.totalStudents || '0'}
            </Text>
            <Text style={styles.performanceLabel}>Total Students</Text>
          </View>
          <View style={styles.performanceCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={styles.performanceNumber}>
              {analyticsData.performance.atRiskStudents || '0'}
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
            onPress={() => router.push('/users/faculty/AssessmentManagement')}
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
            onPress={() => router.push('/users/faculty/GenerateReport')}
          >
            <Ionicons name="document-text-outline" size={24} color="#DC2626" />
            <Text style={styles.actionText}>Generate Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
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
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  reportButton: {
    padding: 8,
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
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
  },
  performanceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  clusterCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
    color: '#111827',
  },
  clusterDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clusterDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  recommendationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
    color: '#111827',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  recommendationAction: {
    fontSize: 12,
    color: '#059669',
    fontStyle: 'italic',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
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