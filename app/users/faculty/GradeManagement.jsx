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
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Text style={styles.classTitle}>{cls.course_code}</Text>
            <Text style={styles.classSchedule}>{cls.course_title}</Text>
          </View>
          <View style={styles.studentCountBadge}>
            <Ionicons name="people-outline" size={16} color="#353A40" />
            <Text style={styles.studentCountText}>{stats.studentCount} students</Text>
          </View>
        </View>
        <View style={styles.classStats}>
          <Text style={styles.classStatsText}>{stats.assessmentCount} assessments</Text>
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
              console.log(`Error fetching stats for class ${cls.section_course_id}:`, err);
              stats[cls.section_course_id] = { studentCount: 0, assessmentCount: 0 };
            }
          }
        }));
        
        setClassStats(stats);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error fetching approved classes:', err);
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
          
          <View style={styles.classesContainer}>
            {filteredClasses.map(renderClassCard)}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  classesContainer: {
    gap: 12,
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
}); 