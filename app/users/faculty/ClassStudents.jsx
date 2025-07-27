import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ModalContainer from '../../../components/ModalContainer';
import apiClient, { getAPIBaseURL } from '../../../utils/api.js';
import FacultyMyClassesHeader from '../../components/FacultyMyClassesHeader';

export default function FacultyClassStudents() {
  const { section_course_id } = useLocalSearchParams();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isTableView, setIsTableView] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    if (!section_course_id) return;
    setLoading(true);
    apiClient.get(`/section-courses/${section_course_id}/students`)
      .then(data => {
        setStudents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setStudents([]);
        setLoading(false);
      });
  }, [section_course_id]);

  const filteredStudents = students.filter(student =>
    (student.name || student.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (student.enrollment_id || '').toString().includes(search)
  );

  const handleStudentPress = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };
  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
  };

  const renderTableView = () => (
    <View style={styles.tableViewContainer}>
      <View style={styles.scrollIndicator}>
        <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
        <Text style={styles.scrollIndicatorText}>Scroll to see more</Text>
        <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
      </View>
      <ScrollView style={styles.tableView} horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: 60 }]}>Photo</Text>
            <Text style={[styles.tableHeaderCell, { width: 200 }]}>Name</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>SR Code</Text>
            <Text style={[styles.tableHeaderCell, { width: 180 }]}>Enrollment Date</Text>
            <Text style={[styles.tableHeaderCell, { width: 100 }]}>Status</Text>
          </View>
          {filteredStudents.map(student => (
            <View key={student.enrollment_id} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: 60, alignItems: 'center' }]}>
                {student.student_photo ? (
                  <Image 
                    source={{ uri: `${getAPIBaseURL().replace('/api', '')}${student.student_photo}` }} 
                    style={styles.tableStudentPhoto}
                    onError={(error) => console.log('Image load error:', error)}
                  />
                ) : (
                  <View style={styles.tableDefaultAvatar}>
                    <Ionicons name="person" size={16} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={1}>{student.full_name || student.name || 'Unnamed Student'}</Text>
              <Text style={[styles.tableCell, { width: 120 }]}>{student.student_number || 'N/A'}</Text>
              <Text style={[styles.tableCell, { width: 180 }]}>{student.enrollment_date ? new Date(student.enrollment_date).toLocaleString() : '—'}</Text>
              <Text style={[styles.tableCell, { width: 100 }]}>{student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : '—'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <FacultyMyClassesHeader
        title="Enrolled Students"
        searchQuery={search}
        setSearchQuery={setSearch}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
      />
      {isTableView ? (
        renderTableView()
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {loading ? (
            <Text style={styles.info}>Loading students...</Text>
          ) : filteredStudents.length === 0 ? (
            <Text style={styles.info}>No students enrolled in this class.</Text>
          ) : (
            filteredStudents.map(student => (
              <TouchableOpacity key={student.enrollment_id} style={styles.studentCard} onPress={() => handleStudentPress(student)}>
                <View style={styles.studentHeader}>
                  <View style={styles.studentPhotoContainer}>
                    {student.student_photo ? (
                      <Image 
                        source={{ uri: `${getAPIBaseURL().replace('/api', '')}${student.student_photo}` }} 
                        style={styles.studentPhoto}
                        onError={(error) => console.log('Image load error:', error)}
                      />
                    ) : (
                      <View style={styles.defaultAvatar}>
                        <Ionicons name="person" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.full_name || student.name || 'Unnamed Student'}</Text>
                    <Text style={styles.studentId}>SR Code: {student.student_number || 'N/A'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
      <ModalContainer
        visible={showStudentModal}
        onClose={closeStudentModal}
        title="Student Details"
      >
        {selectedStudent && (
          <View>
            <View style={styles.modalStudentHeader}>
              <View style={styles.modalStudentPhotoContainer}>
                {selectedStudent.student_photo ? (
                  <Image 
                    source={{ uri: `${getAPIBaseURL().replace('/api', '')}${selectedStudent.student_photo}` }} 
                    style={styles.modalStudentPhoto}
                    onError={(error) => console.log('Image load error:', error)}
                  />
                ) : (
                  <View style={styles.modalDefaultAvatar}>
                    <Ionicons name="person" size={32} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <View style={styles.modalStudentInfo}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{selectedStudent.full_name || selectedStudent.name || 'Unnamed Student'}</Text>
                <Text style={{ fontSize: 15, marginBottom: 4 }}>SR Code: {selectedStudent.student_number || 'N/A'}</Text>
                {selectedStudent.email && <Text style={{ fontSize: 15, marginBottom: 4 }}>Email: {selectedStudent.email}</Text>}
                {selectedStudent.status && <Text style={{ fontSize: 15, marginBottom: 4 }}>Status: {selectedStudent.status}</Text>}
              </View>
            </View>
          </View>
        )}
      </ModalContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  info: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 20,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  studentPhotoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
  },
  studentPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
  },
  studentId: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  tableViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 8,
    fontStyle: 'italic',
  },
  tableView: {
    flex: 1,
    paddingHorizontal: 0,
    marginHorizontal: 0,
    backgroundColor: '#FFFFFF',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#353A40',
    fontSize: 14,
    paddingHorizontal: 12,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  tableCell: {
    fontSize: 13,
    color: '#353A40',
    paddingHorizontal: 12,
    textAlign: 'left',
  },
  tableStudentPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  tableDefaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalStudentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalStudentPhotoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    overflow: 'hidden',
  },
  modalStudentPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  modalDefaultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalStudentInfo: {
    flex: 1,
  },
}); 