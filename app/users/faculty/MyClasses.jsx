import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import FacultyMyClassesHeader from '../../components/FacultyMyClassesHeader';

export default function MyClassesScreen() {
  const { currentUser } = useUser();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  // Sample classes data - using the same structure as Grade Management
  const classes = [
    {
      id: 'class-001',
      courseCode: 'IT101',
      courseTitle: 'Introduction to Information Technology',
      schedule: 'MWF 9:00-10:30 AM',
      studentCount: 40,
      assessments: [
        {
          id: 'assess-001',
          title: 'Midterm Exam',
          type: 'Exam',
          totalPoints: 100,
          date: '2024-10-15'
        },
        {
          id: 'assess-002',
          title: 'Programming Assignment 1',
          type: 'Assignment',
          totalPoints: 50,
          date: '2024-10-20'
        },
        {
          id: 'assess-003',
          title: 'Final Project',
          type: 'Project',
          totalPoints: 100,
          date: '2024-12-10'
        }
      ],
      students: [
        { id: 'student-001', name: 'John Doe', studentId: '22-123456', score: 85 },
        { id: 'student-002', name: 'Jane Smith', studentId: '22-234567', score: 92 },
        { id: 'student-003', name: 'Mike Johnson', studentId: '22-345678' },
        { id: 'student-004', name: 'Sarah Wilson', studentId: '22-456789', score: 78 }
      ]
    },
    {
      id: 'class-002',
      courseCode: 'IT201',
      courseTitle: 'Database Management Systems',
      schedule: 'TTh 10:00-11:30 AM',
      studentCount: 35,
      assessments: [
        {
          id: 'assess-004',
          title: 'Database Design Quiz',
          type: 'Quiz',
          totalPoints: 30,
          date: '2024-10-18'
        },
        {
          id: 'assess-005',
          title: 'SQL Project',
          type: 'Project',
          totalPoints: 80,
          date: '2024-11-15'
        }
      ],
      students: [
        { id: 'student-005', name: 'Alex Brown', studentId: '22-567890', score: 88 },
        { id: 'student-006', name: 'Emily Davis', studentId: '22-678901' },
        { id: 'student-007', name: 'Chris Lee', studentId: '22-789012', score: 95 }
      ]
    }
  ];

  const filteredClasses = classes.filter(cls =>
    cls.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <FacultyMyClassesHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />

      <View style={styles.content}>
        {filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No classes found' : 'No classes found'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search terms.'
                : 'You are not assigned to any classes yet.'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.classesContainer}>
            {filteredClasses.map((cls) => (
              <View key={cls.id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={styles.classInfo}>
                    <Text style={styles.classTitle}>{cls.courseCode} - {cls.courseTitle}</Text>
                    <Text style={styles.classSchedule}>{cls.schedule}</Text>
                  </View>
                  <View style={styles.studentCountBadge}>
                    <Ionicons name="people-outline" size={16} color="#DC2626" />
                    <Text style={styles.studentCountText}>{cls.studentCount} students</Text>
                  </View>
                </View>
                <View style={styles.classStats}>
                  <Text style={styles.classStatsText}>{cls.assessments.length} assessments</Text>
                </View>
                <View style={styles.classActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push({
                      pathname: '/users/faculty/GradeManagement',
                      params: { selectedClassId: cls.id }
                    })}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#DC2626" />
                    <Text style={styles.actionButtonText}>Grades</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push({
                      pathname: '/users/faculty/AttendanceManagement',
                      params: { selectedClassId: cls.id }
                    })}
                  >
                    <Ionicons name="people-outline" size={16} color="#6B7280" />
                    <Text style={styles.actionButtonText}>Attendance</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  classesContainer: {
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  classInfo: {
    flex: 1,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  classSchedule: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 4,
  },
  studentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  studentCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#353A40',
  },
  classStats: {
    marginTop: 8,
  },
  classStatsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  classActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
}); 