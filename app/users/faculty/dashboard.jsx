import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import { apiClient } from '../../../utils/api';

export default function FacultyDashboard() {
  const { currentUser } = useUser();
  const [dashboardStats, setDashboardStats] = useState({
    activeCourses: 0,
    totalStudents: 0,
    pendingSyllabi: 0
  });
  const [loading, setLoading] = useState(true);
  const firstName = currentUser?.firstName || 'Faculty';

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    if (!currentUser?.user_id) return;
    
    try {
      setLoading(true);
      
      // Fetch approved classes for the faculty
      const classesRes = await apiClient.get(`/syllabus/approved?facultyId=${currentUser.user_id}`);
      const classes = Array.isArray(classesRes) ? classesRes : [];
      
      let totalStudents = 0;
      
      // Calculate basic statistics across all classes
      for (const cls of classes) {
        if (cls.section_course_id) {
          try {
            // Get students in this class
            const studentsRes = await apiClient.get(`/section-courses/${cls.section_course_id}/students`);
            const students = Array.isArray(studentsRes) ? studentsRes : [];
            totalStudents += students.length;
          } catch (error) {
            console.log(`Error fetching stats for class ${cls.section_course_id}:`, error.message);
          }
        }
      }
      
      setDashboardStats({
        activeCourses: classes.length,
        totalStudents,
        pendingSyllabi: classes.filter(cls => cls.review_status === 'pending').length
      });
      
    } catch (error) {
      console.log('Error fetching dashboard stats:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.user_id) {
      fetchDashboardStats();
    }
  }, [currentUser]);

  // Add error state for better user feedback
  const [error, setError] = useState(null);

  // Enhanced error handling
  const handleError = (error, context) => {
    console.log(`Dashboard error in ${context}:`, error.message);
    setError(`Unable to load ${context}. Please try again later.`);
  };

  // Helper function to format average grade percentage


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../assets/images/bsu-logo.png')}
            style={styles.logo}
          />
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={28} color="#353A40" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}></Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Enhanced Stats Section */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="book-outline" size={28} color="#DC2626" style={styles.statIcon} />
          <Text style={styles.statNumber}>{loading ? '...' : dashboardStats.activeCourses}</Text>
          <Text style={styles.statLabel}>Active Courses</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={28} color="#DC2626" style={styles.statIcon} />
          <Text style={styles.statNumber}>{loading ? '...' : dashboardStats.totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text-outline" size={28} color="#DC2626" style={styles.statIcon} />
          <Text style={styles.statNumber}>{loading ? '...' : dashboardStats.pendingSyllabi}</Text>
          <Text style={styles.statLabel}>Pending Syllabi</Text>
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setError(null);
            fetchDashboardStats();
          }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Quick Actions Section */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/users/faculty/MyClasses')}>
          <View style={styles.quickActionIconCircle}>
            <Ionicons name="library-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>My Classes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/users/faculty/MySyllabi')}>
          <View style={styles.quickActionIconCircle}>
            <Ionicons name="book-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>My Syllabi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/users/faculty/GradeManagement')}>
          <View style={styles.quickActionIconCircle}>
            <Ionicons name="calculator-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>Grade Management</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/users/faculty/AttendanceManagement')}>
          <View style={styles.quickActionIconCircle}>
            <Ionicons name="checkmark-circle-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/users/faculty/AnalyticsDashboard')}>
          <View style={styles.quickActionIconCircle}>
            <Ionicons name="analytics-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>Analytics</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 80,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  greeting: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#353A40',
  },
  notificationIcon: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    zIndex: 2,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIcon: {
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
    borderRadius: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 18,
    marginLeft: 2,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickActionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#353A40',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
}); 