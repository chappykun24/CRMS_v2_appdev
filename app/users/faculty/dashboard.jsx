import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../../contexts/UserContext';

export default function FacultyDashboard() {
  const { currentUser } = useUser();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="person-outline" size={32} color="#DC2626" />
          <Text style={styles.title}>Faculty Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {currentUser?.firstName || 'Faculty'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>120</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Pending Syllabi</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/users/faculty/MyClasses')}>
              <Ionicons name="library-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>My Classes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/users/faculty/MySyllabi')}>
              <Ionicons name="book-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>My Syllabi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/users/faculty/GradeManagement')}>
              <Ionicons name="calculator-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>Grade Management</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/users/faculty/AttendanceManagement')}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>Attendance</Text>
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