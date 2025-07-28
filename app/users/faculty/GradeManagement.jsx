import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import apiClient from '../../../utils/api';
import FacultyGradeManagementHeader from '../../components/FacultyGradeManagementHeader';

export default function GradeManagementScreen() {
  const { currentUser } = useUser();
  const params = useLocalSearchParams();
  const [approvedClasses, setApprovedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classStats, setClassStats] = useState({});
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Track where the user came from
  const [sourcePage, setSourcePage] = useState('dashboard');

  // When a class is selected, redirect to AssessmentManagement
  const handleClassSelect = (cls) => {
    router.replace({
      pathname: '/users/faculty/AssessmentManagement',
      params: {
        section_course_id: cls.section_course_id,
        syllabus_id: cls.syllabus_id,
        source: 'gradeManagement' // Pass source information
      }
    });
  };

  const handleBackNavigation = () => {
    // Redirect based on where the user came from
    if (sourcePage === 'dashboard') {
      router.push('/users/faculty/dashboard');
    } else if (sourcePage === 'myClasses') {
      router.push('/users/faculty/MyClasses');
    } else {
      // Default fallback to dashboard
      router.push('/users/faculty/dashboard');
    }
  };

  const renderClassCard = (cls) => {
    const stats = classStats[cls.section_course_id] || { studentCount: 0, assessmentCount: 0 };
    
    return (
      <TouchableOpacity
        key={cls.section_course_id}
        style={styles.classCard}
        onPress={() => handleClassSelect(cls)}
      >
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
              <Text style={styles.statNumber}>{stats.studentCount}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.assessmentCount}</Text>
              <Text style={styles.statLabel}>Assessments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{cls.syllabus_id ? '1' : '0'}</Text>
              <Text style={styles.statLabel}>Syllabi</Text>
            </View>
          </View>
        </View>


      </TouchableOpacity>
    );
  };

  // Load approved classes on component mount
  useEffect(() => {
    if (!currentUser) return;
    
    // Determine source page from params or navigation state
    const source = params.source || 'dashboard';
    setSourcePage(source);
    
    setLoading(true);
    apiClient.get(`/syllabus/approved?facultyId=${currentUser.user_id}`)
      .then(async data => {
        const classes = Array.isArray(data) ? data : [];
        setApprovedClasses(classes);
        
        // Fetch student and assessment counts for all classes
        const stats = {};
        await Promise.all(classes.map(async (cls) => {
          if (cls.section_course_id && cls.syllabus_id) {
            try {
              const [studentsRes, assessmentsRes] = await Promise.all([
                apiClient.get(`/section-courses/${cls.section_course_id}/students`),
                apiClient.get(`/assessments/syllabus/${cls.syllabus_id}`)
              ]);
              
              stats[cls.section_course_id] = {
                studentCount: Array.isArray(studentsRes) ? studentsRes.length : 0,
                assessmentCount: Array.isArray(assessmentsRes) ? assessmentsRes.length : 0
              };
            } catch (err) {
              stats[cls.section_course_id] = { studentCount: 0, assessmentCount: 0 };
            }
          }
        }));
        
        setClassStats(stats);
        setLoading(false);
      })
      .catch((err) => {
        setApprovedClasses([]);
        setLoading(false);
      });
  }, [currentUser, params.source]);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  const filteredClasses = approvedClasses.filter(cls =>
    cls.course_code?.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
    cls.course_title?.toLowerCase().includes(classSearchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <FacultyGradeManagementHeader
        currentView="classes"
        classSearchQuery={classSearchQuery}
        setClassSearchQuery={setClassSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onBackNavigation={handleBackNavigation}
      />

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          
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
                {classSearchQuery ? 'No classes found' : 'No classes available'}
              </Text>
              <Text style={styles.emptyStateText}>
                {classSearchQuery 
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
        </View>
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
    paddingBottom: 80,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  classesContainer: {
    gap: 16,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
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
}); 