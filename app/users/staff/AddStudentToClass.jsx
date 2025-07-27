import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getAPIBaseURL } from '../../../utils/api';

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
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Show success toast
  const showToast = (message) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  // Add student to class
  const handleAddStudent = async (student_id) => {
    try {
      await require('../../../utils/api').default.post('/students/enroll', {
        section_course_id,
        student_id,
      });
      setConfirming(false);
      setSelectedStudentId(null);
      showToast('Student enrolled successfully!');
      fetchAvailableStudents(addSearch); // Refresh the list
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
      
      <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16, backgroundColor: '#FFFFFF' }}>
          <TextInput
            value={addSearch}
            onChangeText={setAddSearch}
            placeholder="Search students by name or SR code..."
            style={styles.searchInput}
          />
          {addError ? (
            <Text style={styles.errorText}>{addError}</Text>
          ) : null}
          {searchLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>Loading students...</Text>
              <Text style={styles.emptyStateText}>Please wait while we search for available students.</Text>
            </View>
          ) : allAvailableStudents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>
                {addSearch ? 'No students found' : 'No students available'}
              </Text>
              <Text style={styles.emptyStateText}>
                {addSearch 
                  ? 'Try adjusting your search terms to find what you\'re looking for.'
                  : 'No students are currently available for enrollment.'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.studentsContainer}>
              {allAvailableStudents.map(student => (
                <View
                  key={student.student_id}
                  style={styles.studentCard}
                >
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
                      <Text style={styles.studentName}>{student.full_name}</Text>
                      <Text style={styles.studentCode}>SR Code: {student.student_number}</Text>
                    </View>
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
                    <Ionicons name="add-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Success Toast */}
      {showSuccessToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastContent}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.toastText}>{successMessage}</Text>
          </View>
        </View>
      )}

      {/* Confirmation Dialog */}
      {confirming && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmHeader}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#DC2626" />
              <Text style={styles.confirmTitle}>Confirm Add Student</Text>
            </View>
            <Text style={styles.confirmMessage}>
              Are you sure you want to enroll this student to the class?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setConfirming(false);
                  setSelectedStudentId(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
                <Text style={styles.confirmButtonText}>Confirm</Text>
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
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  studentsContainer: {
    gap: 12,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    color: '#1E293B',
    marginBottom: 4,
  },
  studentCode: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
    borderRadius: 16,
    width: 300,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginLeft: 10,
  },
  confirmMessage: {
    fontSize: 15,
    marginBottom: 18,
    textAlign: 'center',
    color: '#6B7280',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#353A40',
    fontWeight: 'bold',
    fontSize: 15,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  toastContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 