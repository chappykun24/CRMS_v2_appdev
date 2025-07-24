import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddStudentToClass() {
  const { section_course_id } = useLocalSearchParams();
  const router = useRouter();
  const [addSearch, setAddSearch] = useState('');
  const [allAvailableStudents, setAllAvailableStudents] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Fetch available students
  const fetchAvailableStudents = async (search = '') => {
    setSearchLoading(true);
    try {
      const res = await require('../../../utils/api').default.get(`/students/available-for-section/${section_course_id}?search=${encodeURIComponent(search)}`);
      setAllAvailableStudents(res.students || []);
    } catch (e) {
      setAllAvailableStudents([]);
    }
    setSearchLoading(false);
  };

  useEffect(() => {
    fetchAvailableStudents(addSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSearch, section_course_id]);

  // Add student to class
  const handleAddStudent = async (student_id) => {
    try {
      await require('../../../utils/api').default.post('/students/enroll', {
        section_course_id,
        student_id,
      });
      setConfirming(false);
      setSelectedStudentId(null);
      alert('Student enrolled successfully!');
      router.back();
    } catch (err) {
      if (err?.response?.status === 409) {
        setAddError('Student is already enrolled in this class.');
      } else {
        setAddError('Failed to enroll student.');
      }
      setAddLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#dc2626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Student to Class</Text>
      </View>
      <View style={{ padding: 16 }}>
        <TextInput
          value={addSearch}
          onChangeText={setAddSearch}
          placeholder="Search students by name or SR code..."
          style={styles.searchInput}
        />
        {addError ? (
          <Text style={{ color: 'red', textAlign: 'center', marginBottom: 8 }}>{addError}</Text>
        ) : null}
        {searchLoading ? (
          <Text style={{ textAlign: 'center', color: '#6B7280' }}>Loading students...</Text>
        ) : allAvailableStudents.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6B7280' }}>No students found.</Text>
        ) : (
          <ScrollView style={{ marginTop: 8 }}>
            {allAvailableStudents.map(student => (
              <View
                key={student.student_id}
                style={styles.studentRow}
              >
                <View>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{student.full_name}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>SR Code: {student.student_number}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  disabled={addLoading && selectedStudentId === student.student_id}
                  onPress={() => {
                    setSelectedStudentId(student.student_id);
                    setAddError('');
                    setConfirming(true);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      {/* Confirmation Dialog */}
      {confirming && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Confirm Add Student</Text>
            <Text style={{ fontSize: 15, marginBottom: 18, textAlign: 'center' }}>
              Are you sure you want to enroll this student to the class?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity
                style={[styles.cancelButton, { marginRight: 10 }]}
                onPress={() => {
                  setConfirming(false);
                  setSelectedStudentId(null);
                }}
              >
                <Text style={{ color: '#353A40', fontWeight: 'bold', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={async () => {
                  if (!selectedStudentId) {
                    setAddError('No student selected.');
                    setConfirming(false);
                    return;
                  }
                  setAddLoading(true);
                  setAddError('');
                  await handleAddStudent(selectedStudentId);
                  setAddLoading(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  studentRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
    marginLeft: 10,
    opacity: 1,
  },
  confirmOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  confirmBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: 300,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  confirmButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
}); 