import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
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
  const [sessionCounts, setSessionCounts] = useState({});
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);

  React.useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    apiClient.get(`/syllabus/approved?facultyId=${currentUser.user_id}`)
      .then(async data => {
        const classes = Array.isArray(data) ? data : [];
        setApprovedClasses(classes);
        
        // Fetch student counts and session counts for each class
        const studentCounts = {};
        const sessionCounts = {};
        
        await Promise.all(classes.map(async (cls) => {
          if (cls.section_course_id) {
            try {
              // Fetch students
              const students = await apiClient.get(`/section-courses/${cls.section_course_id}/students`);
              studentCounts[cls.section_course_id] = Array.isArray(students) ? students.length : 0;
              
              // Fetch sessions
              const sessions = await apiClient.get(`/section-courses/${cls.section_course_id}/sessions`);
              sessionCounts[cls.section_course_id] = Array.isArray(sessions) ? sessions.length : 0;
            } catch (err) {
              studentCounts[cls.section_course_id] = 0;
              sessionCounts[cls.section_course_id] = 0;
            }
          }
        }));
        
        setStudentCounts(studentCounts);
        setSessionCounts(sessionCounts);
        setLoading(false);
      })
      .catch((err) => {
        setApprovedClasses([]);
        setLoading(false);
      });
  }, [currentUser]);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  if (isNavigatingAway) return null;

  // Filter by search
  const filteredClasses = approvedClasses.filter(cls => {
    const q = searchQuery.toLowerCase();
    return (
      (cls.course_title || '').toLowerCase().includes(q) ||
      (cls.course_code || '').toLowerCase().includes(q) ||
      (cls.section_code || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAttendancePress = async (cls) => {
    setIsNavigatingAway(true);
    try {
      router.push({
        pathname: '/users/faculty/AttendanceManagement',
        params: {
          selectedClassId: cls.section_course_id,
        }
      });
    } catch (error) {
      setIsNavigatingAway(false);
      // Optionally show an error message
    }
  };

  const renderClassCard = (cls) => {
    const studentCount = studentCounts[cls.section_course_id] ?? 0;
    const sessionCount = sessionCounts[cls.section_course_id] ?? 0;

    return (
      <View key={cls.section_course_id} style={styles.classCard}>
        <View style={styles.cardHeader}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseCode}>{cls.course_code}</Text>
            <Text style={styles.courseTitle}>{cls.course_title}</Text>
            <Text style={styles.sectionCode}>Section: {cls.section_code}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          {cls.schedule && (
            <Text style={styles.scheduleText}>{cls.schedule}</Text>
          )}
          
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>Year: {cls.school_year || 'N/A'}</Text>
            <Text style={styles.metaText}>Term: {cls.semester || 'N/A'}</Text>
            {cls.syllabus_id && (
              <Text style={styles.metaText}>Syllabus: Approved</Text>
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{studentCount}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sessionCount}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{cls.syllabus_id ? '1' : '0'}</Text>
              <Text style={styles.statLabel}>Syllabi</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAttendancePress(cls)}
            >
              <Ionicons name="people-outline" size={18} color="#6B7280" />
              <Text style={styles.actionButtonText}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push({
                pathname: '/users/faculty/AssessmentManagement',
                params: { 
                  section_course_id: cls.section_course_id,
                  syllabus_id: cls.syllabus_id,
                  source: 'myClasses'
                }
              })}
            >
              <Ionicons name="clipboard-outline" size={18} color="#6B7280" />
              <Text style={styles.actionButtonText}>Assessments</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push({
                pathname: '/users/faculty/GradeManagement',
                params: { 
                  source: 'myClasses'
                }
              })}
            >
              <Ionicons name="document-text-outline" size={18} color="#6B7280" />
              <Text style={styles.actionButtonText}>Grades</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push({
                pathname: '/users/faculty/ClassStudents',
                params: { section_course_id: cls.section_course_id }
              })}
            >
              <Ionicons name="eye-outline" size={18} color="#6B7280" />
              <Text style={styles.actionButtonText}>Students</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FacultyMyClassesHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onNavigateAway={() => setIsNavigatingAway(true)}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>Loading classes...</Text>
            <Text style={styles.emptyStateText}>Please wait while we fetch your approved classes.</Text>
          </View>
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No classes found' : 'No classes available'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search terms to find what you\'re looking for.'
                : 'You are not assigned to any approved classes yet. Check back later or contact your administrator.'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.classesContainer}>
            {filteredClasses.map(renderClassCard)}
          </View>
        )}
        
      </ScrollView>
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
    paddingBottom: 80,
  },
  classesContainer: {
    gap: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#353A40',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
    // Remove all shadow/elevation properties for a flat look
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
    lineHeight: 22,
  },
  sectionCode: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  cardContent: {
    marginBottom: 16,
  },
  scheduleText: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardActions: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
}); 