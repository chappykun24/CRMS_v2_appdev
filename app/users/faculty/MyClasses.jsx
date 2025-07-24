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
import apiClient from '../../../utils/api';
import FacultyMyClassesHeader from '../../components/FacultyMyClassesHeader';

export default function MyClassesScreen() {
  const { currentUser } = useUser();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvedClasses, setApprovedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentCounts, setStudentCounts] = useState({});

  React.useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    apiClient.get(`/syllabus/approved?facultyId=${currentUser.user_id}`)
      .then(async data => {
        const classes = Array.isArray(data) ? data : [];
        setApprovedClasses(classes);
        // Fetch student counts for each class
        const counts = {};
        await Promise.all(classes.map(async (cls) => {
          if (cls.section_course_id) {
            try {
              const students = await apiClient.get(`/section-courses/${cls.section_course_id}/students`);
              counts[cls.section_course_id] = Array.isArray(students) ? students.length : 0;
            } catch {
              counts[cls.section_course_id] = 0;
            }
          }
        }));
        setStudentCounts(counts);
        setLoading(false);
      })
      .catch(() => {
        setApprovedClasses([]);
        setLoading(false);
      });
  }, [currentUser]);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  // Filter by search
  const filteredClasses = approvedClasses.filter(cls => {
    const q = searchQuery.toLowerCase();
    return (
      (cls.course_title || '').toLowerCase().includes(q) ||
      (cls.course_code || '').toLowerCase().includes(q) ||
      (cls.section_code || '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <FacultyMyClassesHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />

      <View style={styles.content}>
        {loading ? (
          <Text style={styles.emptyStateText}>Loading approved classes...</Text>
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No classes found' : 'No classes found'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search terms.'
                : 'You are not assigned to any approved classes yet.'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.classesContainer}>
            {filteredClasses.map((cls) => (
              <View key={cls.section_course_id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={styles.classInfo}>
                    <Text style={styles.classTitle}>{cls.course_code} - {cls.course_title}</Text>
                    <Text style={styles.classSchedule}>{cls.schedule || ''}</Text>
                  </View>
                  <View style={styles.studentCountBadge}>
                    <Ionicons name="people-outline" size={16} color="#DC2626" />
                    <Text style={styles.studentCountText}>{studentCounts[cls.section_course_id] ?? 0} students</Text>
                  </View>
                </View>
                <View style={styles.classStats}>
                  <Text style={styles.classStatsText}>{cls.syllabus_id ? 'Approved Syllabus' : ''}</Text>
                </View>
                <View style={styles.classActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push({
                      pathname: '/users/faculty/GradeManagement',
                      params: { 
                        section_course_id: cls.section_course_id,
                        syllabus_id: cls.syllabus_id
                      }
                    })}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#DC2626" />
                    <Text style={styles.actionButtonText}>Grades</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push({
                      pathname: '/users/faculty/AttendanceManagement',
                      params: { selectedClassId: cls.section_course_id }
                    })}
                  >
                    <Ionicons name="people-outline" size={16} color="#6B7280" />
                    <Text style={styles.actionButtonText}>Attendance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push({
                      pathname: '/users/faculty/ClassStudents',
                      params: { section_course_id: cls.section_course_id }
                    })}
                  >
                    <Ionicons name="eye-outline" size={16} color="#2563EB" />
                    <Text style={styles.actionButtonText}>View Students</Text>
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