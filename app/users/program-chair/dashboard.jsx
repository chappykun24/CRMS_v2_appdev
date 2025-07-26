import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import { ROUTES } from '../../../utils/routes';

export default function ProgramChairDashboard() {
  const { currentUser } = useUser();
  const firstName = currentUser?.firstName || 'Program Chair';
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

      {/* Stats Section */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="book-outline" size={28} color="#DC2626" style={styles.statIcon} />
          <Text style={styles.statNumber}></Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={28} color="#DC2626" style={styles.statIcon} />
          <Text style={styles.statNumber}></Text>
          <Text style={styles.statLabel}>Faculty</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="analytics-outline" size={28} color="#DC2626" style={styles.statIcon} />
          <Text style={styles.statNumber}></Text>
          <Text style={styles.statLabel}>Outcome Rate</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Quick Actions Section */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push(ROUTES.PROGRAM_CHAIR.COURSE_MANAGEMENT)}>
          <View style={styles.quickActionIconCircle}>
            <Ionicons name="school-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>Program Management</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push(ROUTES.PROGRAM_CHAIR.REVIEW_SUBMISSIONS)}>
          <View style={styles.quickActionIconCircle}>
            <Ionicons name="clipboard-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>Review Submissions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push(ROUTES.PROGRAM_CHAIR.DEPARTMENT_ANALYTICS)}>
          <View style={styles.quickActionIconCircle}>
            <Ionicons name="pie-chart-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>Department Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push(ROUTES.PROGRAM_CHAIR.GENERATE_REPORT)}>
          <View style={styles.quickActionIconCircle}>
            <Ionicons name="stats-chart-outline" size={26} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>Generate Report</Text>
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
    marginBottom: 18,
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
}); 