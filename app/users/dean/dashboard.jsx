import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../../contexts/UserContext';

export default function DeanDashboard() {
  const { currentUser } = useUser();

  const handleNavigateToSyllabusApproval = () => {
    router.push('/users/dean/syllabus-approval');
  };

  const handleNavigateToMyClasses = () => {
    router.push('/users/dean/MyClasses');
  };

  const handleNavigateToAnalytics = () => {
    router.push('/users/dean/Analytics');
  };

  const handleNavigateToGenerateReport = () => {
    router.push('/users/dean/GenerateReport');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="shield-outline" size={32} color="#DC2626" />
          <Text style={styles.title}>Dean Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {currentUser?.firstName || 'Dean'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="school-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Active Programs</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="analytics-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToSyllabusApproval}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>Approve Syllabi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToAnalytics}>
              <Ionicons name="trending-up-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>View Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToMyClasses}>
              <Ionicons name="library-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>Classes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToGenerateReport}>
              <Ionicons name="bar-chart-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>Generate Reports</Text>
            </TouchableOpacity>
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
  contentContainer: {
    paddingBottom: 100, // Add space at bottom for navigation bar
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
}); 