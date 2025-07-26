import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../../utils/api.js';
import StaffAcademicRecordsHeader from '../../components/StaffAcademicRecordsHeader';

export default function AcademicRecords() {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const [approvedClasses, setApprovedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentCounts, setStudentCounts] = useState({});

  useEffect(() => {
    setLoading(true);
    apiClient.get('/syllabus/approved')
      .then(async data => {
        const classes = Array.isArray(data) ? data : [];
        setApprovedClasses(classes);
        
        // Fetch student counts for each class
        const studentCounts = {};
        await Promise.all(classes.map(async (cls) => {
          if (cls.section_course_id) {
            try {
              const students = await apiClient.get(`/section-courses/${cls.section_course_id}/students`);
              studentCounts[cls.section_course_id] = Array.isArray(students) ? students.length : 0;
            } catch (err) {
              console.log(`Error fetching students for class ${cls.section_course_id}:`, err);
              studentCounts[cls.section_course_id] = 0;
            }
          }
        }));
        
        setStudentCounts(studentCounts);
        setLoading(false);
      })
      .catch(() => {
        setApprovedClasses([]);
        setLoading(false);
      });
  }, []);

  // Filter by search
  const filteredClasses = approvedClasses.filter(cls => {
    const q = search.toLowerCase();
    return (
      (cls.course_title || '').toLowerCase().includes(q) ||
      (cls.course_code || '').toLowerCase().includes(q) ||
      (cls.faculty_name || '').toLowerCase().includes(q) ||
      (cls.semester || '').toLowerCase().includes(q) ||
      (cls.school_year || '').toLowerCase().includes(q)
    );
  });

  const renderClassCard = (cls) => {
    const studentCount = studentCounts[cls.section_course_id] ?? 0;

    return (
      <View key={cls.syllabus_id} style={styles.classCard}>
        <View style={styles.cardHeader}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseCode}>{cls.course_code}</Text>
            <Text style={styles.courseTitle}>{cls.course_title}</Text>
            <Text style={styles.sectionCode}>Section: {cls.section_code}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statusText}>Approved</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>Year: {cls.school_year || 'N/A'}</Text>
            <Text style={styles.metaText}>Term: {cls.semester || 'N/A'}</Text>
            <Text style={styles.metaText}>Faculty: {cls.faculty_name || 'N/A'}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{studentCount}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({ 
              pathname: '/users/staff/ClassStudents', 
              params: { 
                section_course_id: cls.section_course_id, 
                syllabus_id: cls.syllabus_id 
              } 
            })}
          >
            <Ionicons name="people-outline" size={16} color="#475569" />
            <Text style={styles.actionButtonText}>View Students</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({ 
              pathname: '/users/staff/AddStudentToClass', 
              params: { 
                section_course_id: cls.section_course_id 
              } 
            })}
          >
            <Ionicons name="add-circle-outline" size={16} color="#475569" />
            <Text style={styles.actionButtonText}>Add Student</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StaffAcademicRecordsHeader
        title="Classes"
        search={search}
        setSearch={setSearch}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>Loading classes...</Text>
            <Text style={styles.emptyStateText}>Please wait while we fetch approved classes.</Text>
          </View>
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
              {search ? 'No classes found' : 'No classes available'}
            </Text>
            <Text style={styles.emptyStateText}>
              {search 
                ? 'Try adjusting your search terms to find what you\'re looking for.'
                : 'No approved classes found in the system.'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.classesContainer}>
            {filteredClasses.map(renderClassCard)}
          </View>
        )}
      </ScrollView>
    </View>
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
    gap: 12,
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 20,
  },
  sectionCode: {
    fontSize: 13,
    color: '#64748B',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  cardContent: {
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
}); 