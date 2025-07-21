import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../../contexts/UserContext';

import { apiClient } from '../../../utils/api';

export default function StaffDashboard() {
  const { currentUser } = useUser();
  const [totalStudents, setTotalStudents] = useState(null);
  // Placeholders for future dynamic stats
  const [pendingRecords, setPendingRecords] = useState(null);
  const [completedToday, setCompletedToday] = useState(null);

  // Mock data for classes and faculty
  const mockClasses = ['CS101 - Intro to CS', 'MATH201 - Calculus I', 'ENG101 - English Composition'];
  const mockFaculty = ['Dr. John Doe', 'Dr. Jane Smith', 'Dr. Michael Johnson'];
  const [selectedClass, setSelectedClass] = useState(mockClasses[0]);
  const [selectedFaculty, setSelectedFaculty] = useState(mockFaculty[0]);

  useEffect(() => {
    // Fetch total students from API
    async function fetchTotalStudents() {
      try {
        // Try to get total from backend, else count documents
        const res = await apiClient.get('/collections/students?limit=1000');
        if (typeof res.total === 'number' && res.total > 1) {
          setTotalStudents(res.total);
        } else if (Array.isArray(res.documents)) {
          setTotalStudents(res.documents.length);
        } else {
          setTotalStudents('—');
        }
      } catch (err) {
        setTotalStudents('—');
      }
    }
    fetchTotalStudents();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="people-outline" size={32} color="#DC2626" />
          <Text style={styles.title}>Staff Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {currentUser?.firstName || 'Staff'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="school-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>{totalStudents !== null ? totalStudents : '...'}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>{pendingRecords !== null ? pendingRecords : '—'}</Text>
            <Text style={styles.statLabel}>Pending Records</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>{completedToday !== null ? completedToday : '—'}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/users/staff/student-management?shouldOpenModal=true')}>
              <Ionicons name="person-add-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>Add Student</Text>
            </TouchableOpacity>
            <View style={styles.actionCard}>
              <TouchableOpacity style={{alignItems: 'center'}} onPress={() => router.push('/users/staff/AcademicRecords')}>
                <Ionicons name="folder-outline" size={24} color="#DC2626" />
                <Text style={styles.actionText}>Records</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionCard}>
              <Ionicons name="search-outline" size={24} color="#DC2626" />
              <TouchableOpacity style={{alignItems: 'center'}} onPress={() => router.push('/users/staff/student-management')}>
                <Text style={styles.actionText}>Search Student</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/users/staff/AssignFaculty')}>
              <Ionicons name="people-circle-outline" size={24} color="#DC2626" />
              <Text style={styles.actionText}>Assign Faculty</Text>
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
  assignContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 14,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignLabel: {
    fontSize: 15,
    color: '#6B7280',
    width: 70,
    fontWeight: '500',
  },
  assignPickerWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 8,
  },
  assignPicker: {
    height: 40,
    width: '100%',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
}); 