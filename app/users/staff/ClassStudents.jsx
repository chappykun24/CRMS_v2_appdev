import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ModalContainer from '../../../components/ModalContainer';
import apiClient from '../../../utils/api.js';
import userService from '../../../utils/userService';
import StaffAcademicRecordsHeader from '../../components/StaffAcademicRecordsHeader';

export default function ClassStudents() {
  const { section_course_id } = useLocalSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isTableView, setIsTableView] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [allAvailableStudents, setAllAvailableStudents] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Add student modal open handler
  const fetchAvailableStudents = async (search = '') => {
    setSearchLoading(true);
    try {
      const res = await apiClient.get(`/students/available-for-section/${section_course_id}?search=${encodeURIComponent(search)}`);
      setAllAvailableStudents(res.students || []);
    } catch (e) {
      setAllAvailableStudents([]);
    }
    setSearchLoading(false);
  };

  const openAddStudentModal = () => {
    setShowAddModal(true);
    setAddSearch('');
    fetchAvailableStudents('');
  };
  const closeAddStudentModal = () => setShowAddModal(false);

  // Fetch filtered students as user types
  useEffect(() => {
    if (showAddModal) {
      fetchAvailableStudents(addSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSearch, showAddModal, section_course_id]);

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

  // Filter students by search
  const filteredStudents = students.filter(student =>
    (student.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (student.enrollment_id || '').toString().includes(search)
  );

  // Search for students not already enrolled
  const handleAddSearch = async (text) => {
    setAddSearch(text);
    setSearchLoading(true);
    try {
      const res = await userService.getUsers({ role: 'student', limit: 1000 });
      const enrolledIds = new Set(students.map(s => s.user_id));
      const filtered = (res.users || []).filter(u =>
        !enrolledIds.has(u.user_id) &&
        (u.name?.toLowerCase().includes(text.toLowerCase()) || u.email?.toLowerCase().includes(text.toLowerCase()))
      );
      setSearchResults(filtered);
    } catch (e) {
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  // Add student to class
  const handleAddStudent = async (student_id) => {
    try {
      await apiClient.post('/students/enroll', {
        section_course_id,
        student_id,
      });
      // Refresh students list
      apiClient.get(`/section-courses/${section_course_id}/students`)
        .then(data => {
          setStudents(Array.isArray(data) ? data : []);
        });
      setShowAddModal(false);
      alert('Student enrolled successfully!');
    } catch (err) {
      if (err?.response?.status === 409) {
        alert('Student is already enrolled in this class.');
      } else {
        alert('Failed to enroll student.');
      }
    }
  };

  // Filter students by search
  const filteredAddStudents = allAvailableStudents.filter(user =>
    (user.name?.toLowerCase().includes(addSearch.toLowerCase()) ||
     user.sr_code?.toLowerCase().includes(addSearch.toLowerCase()) ||
     user.user_id?.toString().includes(addSearch))
  );

  // Table view toggle (reuse isTableView state)
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
            <Text style={[styles.tableHeaderCell, { width: 200 }]}>Name</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>SR Code</Text>
            <Text style={[styles.tableHeaderCell, { width: 180 }]}>Enrollment Date</Text>
            <Text style={[styles.tableHeaderCell, { width: 100 }]}>Status</Text>
          </View>
          {filteredStudents.map(student => (
            <View key={student.enrollment_id} style={styles.tableRow}>
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
      <StaffAcademicRecordsHeader
        title="Enrolled"
        search={search}
        setSearch={setSearch}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onAddAssignment={openAddStudentModal}
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
              <View key={student.enrollment_id} style={styles.studentCard}>
                <Text style={styles.studentName}>{student.full_name || student.name || 'Unnamed Student'}</Text>
                <Text style={styles.studentId}>SR Code: {student.student_number || 'N/A'}</Text>
                <Text style={styles.studentId}>Enrollment ID: {student.enrollment_id}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
      <ModalContainer
        visible={showAddModal}
        onClose={closeAddStudentModal}
        title="Add Student to Class"
      >
        <TextInput
          value={addSearch}
          onChangeText={setAddSearch}
          placeholder="Search students by name or SR code..."
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            backgroundColor: '#fff',
            marginBottom: 16
          }}
        />
        {searchLoading ? (
          <Text style={{ textAlign: 'center', color: '#6B7280' }}>Loading students...</Text>
        ) : allAvailableStudents.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6B7280' }}>No students found.</Text>
        ) : (
          allAvailableStudents.map(student => (
            <TouchableOpacity
              key={student.student_id}
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 8,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
              onPress={() => handleAddStudent(student.student_id)}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{student.full_name}</Text>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>SR Code: {student.student_number}</Text>
            </TouchableOpacity>
          ))
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
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
}); 