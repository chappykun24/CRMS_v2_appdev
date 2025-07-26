import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import { UserRole } from '../../../types/userRoles';
import { apiClient } from '../../../utils/api';
import { ROUTES } from '../../../utils/routes';
import { userService } from '../../../utils/userService';

export default function AdminDashboard() {
  const { currentUser, isLoading, isInitialized } = useUser();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [departmentCount, setDepartmentCount] = useState(0);
  const firstName = currentUser?.firstName || 'Admin';

  // Load faculty application statistics and department count
  const loadStats = async () => {
    try {
      // Fetch dynamic faculty stats from backend
      const { stats: facultyStats } = await userService.getFacultyApprovalData();
      setStats(facultyStats);
      // Fetch departments from backend
      const departmentsRes = await apiClient.get('/departments');
      setDepartmentCount(departmentsRes.departments ? departmentsRes.departments.length : 0);
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
    <View style={styles.container}>
      {/* Sticky Header Section */}
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

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={28} color="#DC2626" style={styles.statIcon} />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="school-outline" size={28} color="#DC2626" style={styles.statIcon} />
            <Text style={styles.statNumber}>{departmentCount}</Text>
            <Text style={styles.statLabel}>Departments</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={28} color="#DC2626" style={styles.statIcon} />
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Quick Actions Section */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push(`${ROUTES.ADMIN.USER_MANAGEMENT}?role=all`)}>
            <View style={styles.quickActionIconCircle}>
              <Ionicons name="people-circle-outline" size={26} color="#DC2626" />
            </View>
            <Text style={styles.quickActionText}>User Management</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push(ROUTES.ADMIN.FACULTY_APPROVAL)}>
            <View style={styles.quickActionIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={26} color="#DC2626" />
            </View>
            <Text style={styles.quickActionText}>Faculty Approval</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 20, // Reduced from 60 to 20 to remove extra space
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  contentSection: {
    flex: 1,
    padding: 24,
    paddingBottom: 80,
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
    marginBottom: 24,
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
    marginBottom: 24,
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
}); 