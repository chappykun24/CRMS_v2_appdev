import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import { UserRole } from '../../../types/userRoles';
import { apiClient } from '../../../utils/api';
import { ROUTES } from '../../../utils/routes';
import { userService } from '../../../utils/userService';

export default function AdminDashboard() {
  const { currentUser, isLoading, isInitialized } = useUser();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [departmentCount, setDepartmentCount] = useState(0);

  // Load faculty application statistics and department count
  const loadStats = async () => {
    try {
      // Fetch dynamic faculty stats from backend
      const { stats: facultyStats } = await userService.getFacultyApprovalData();
      setStats(facultyStats);
      // Fetch departments from backend
      const departmentsRes = await apiClient.get('/collections/departments');
      setDepartmentCount(departmentsRes.documents ? departmentsRes.documents.length : 0);
    } catch (error) {
      console.error('Error loading faculty stats or departments:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Show loading while app is initializing or user is loading
  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 24, color: 'gray', textAlign: 'center' }}>
          {!isInitialized ? 'Initializing...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // Only redirect if we're sure the user is not an admin
  if (isInitialized && !isLoading && (!currentUser || currentUser.role !== UserRole.ADMIN)) {
    setTimeout(() => {
      router.replace('/public');
    }, 100);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 24, color: 'gray', textAlign: 'center' }}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#DC2626" />
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {currentUser?.firstName || 'Admin'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Faculty Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="school-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>{departmentCount}</Text>
            <Text style={styles.statLabel}>Departments</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`${ROUTES.ADMIN.USER_MANAGEMENT}?role=all`)}>
              <Ionicons name="people-circle-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>User Management</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push(ROUTES.ADMIN.FACULTY_APPROVAL)}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>Faculty Approval</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Faculty Application Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faculty Applications Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="time-outline" size={20} color="white" />
              </View>
              <Text style={styles.summaryNumber}>{stats.pending}</Text>
              <Text style={styles.summaryLabel}>Pending Review</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              </View>
              <Text style={styles.summaryNumber}>{stats.approved}</Text>
              <Text style={styles.summaryLabel}>Approved</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="close-circle-outline" size={20} color="white" />
              </View>
              <Text style={styles.summaryNumber}>{stats.rejected}</Text>
              <Text style={styles.summaryLabel}>Rejected</Text>
            </View>
          </View>
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
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#353A40',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
}); 