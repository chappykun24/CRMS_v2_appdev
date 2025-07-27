import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { apiClient } from '../../../utils/api';
import FacultyAssessmentManagementHeader from '../../components/FacultyAssessmentManagementHeader';

export default function SubAssessmentGradeManagementScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { subAssessmentId, assessmentId, sectionCourseId } = params;

  const [subAssessment, setSubAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradingData, setGradingData] = useState({
    rawScore: '',
    totalScore: '',
    adjustedScore: '',
    remarks: '',
    status: 'graded'
  });

  useEffect(() => {
    fetchSubAssessmentDetails();
    fetchStudentsWithGrades();
  }, [subAssessmentId]);

  const fetchSubAssessmentDetails = async () => {
    try {
      const response = await apiClient.get(`/sub-assessments/assessment/${assessmentId}`);
      const subAssessments = Array.isArray(response) ? response : [];
      const currentSubAssessment = subAssessments.find(sa => sa.sub_assessment_id == subAssessmentId);
      setSubAssessment(currentSubAssessment);
    } catch (err) {
      console.error('Error fetching sub-assessment details:', err);
      Alert.alert('Error', 'Failed to fetch sub-assessment details');
    }
  };

  const fetchStudentsWithGrades = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/sub-assessments/${subAssessmentId}/students-with-grades`);
      setStudents(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching students with grades:', err);
      Alert.alert('Error', 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSubAssessmentDetails(),
      fetchStudentsWithGrades()
    ]);
    setRefreshing(false);
  };

  const handleBackNavigation = () => {
    router.back();
  };

  const handleGradeStudent = (student) => {
    setSelectedStudent(student);
    setGradingData({
      rawScore: student.raw_score?.toString() || '',
      totalScore: student.total_score?.toString() || '',
      adjustedScore: student.adjusted_score?.toString() || '',
      remarks: student.remarks || '',
      status: student.status || 'graded'
    });
    setShowGradingModal(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent) return;

    // Validation
    if (!gradingData.rawScore || !gradingData.totalScore) {
      Alert.alert('Error', 'Please enter both raw score and total score');
      return;
    }

    const rawScore = parseFloat(gradingData.rawScore);
    const totalScore = parseFloat(gradingData.totalScore);
    const adjustedScore = gradingData.adjustedScore ? parseFloat(gradingData.adjustedScore) : rawScore;

    if (rawScore > totalScore) {
      Alert.alert('Error', 'Raw score cannot exceed total score');
      return;
    }

    if (adjustedScore > totalScore) {
      Alert.alert('Error', 'Adjusted score cannot exceed total score');
      return;
    }

    try {
      await apiClient.put(`/sub-assessments/${subAssessmentId}/submissions/${selectedStudent.enrollment_id}`, {
        raw_score: rawScore,
        total_score: totalScore,
        adjusted_score: adjustedScore,
        status: gradingData.status,
        remarks: gradingData.remarks,
        graded_by: 1 // TODO: Get actual faculty ID
      });

      Alert.alert('Success', 'Grade saved successfully!');
      setShowGradingModal(false);
      fetchStudentsWithGrades(); // Refresh the list
    } catch (err) {
      console.error('Error saving grade:', err);
      Alert.alert('Error', 'Failed to save grade');
    }
  };

  const calculatePercentage = (rawScore, totalScore) => {
    if (!rawScore || !totalScore || totalScore === 0) return 0;
    return ((rawScore / totalScore) * 100).toFixed(1);
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#10B981';
    if (percentage >= 80) return '#3B82F6';
    if (percentage >= 70) return '#F59E0B';
    if (percentage >= 60) return '#EF4444';
    return '#6B7280';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return '#F59E0B';
      case 'graded': return '#10B981';
      case 'late': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStudentCard = (student) => {
    const percentage = calculatePercentage(student.raw_score, student.total_score);
    const gradeColor = getGradeColor(percentage);
    const statusColor = getStatusColor(student.status);

    return (
      <View key={student.enrollment_id} style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.full_name}</Text>
            <Text style={styles.studentNumber}>{student.student_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {student.status || 'Not Submitted'}
            </Text>
          </View>
        </View>

        <View style={styles.gradeInfo}>
          {student.raw_score !== null ? (
            <>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Raw Score:</Text>
                <Text style={styles.scoreValue}>
                  {student.raw_score} / {student.total_score || subAssessment?.total_points}
                </Text>
              </View>
              {student.adjusted_score && student.adjusted_score !== student.raw_score && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Adjusted Score:</Text>
                  <Text style={styles.scoreValue}>
                    {student.adjusted_score} / {student.total_score || subAssessment?.total_points}
                  </Text>
                </View>
              )}
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Percentage:</Text>
                <Text style={[styles.scoreValue, { color: gradeColor }]}>
                  {percentage}%
                </Text>
              </View>
              {student.remarks && (
                <View style={styles.remarksContainer}>
                  <Text style={styles.remarksLabel}>Remarks:</Text>
                  <Text style={styles.remarksText}>{student.remarks}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noSubmissionText}>No submission yet</Text>
          )}
        </View>

        <View style={styles.studentActions}>
          <TouchableOpacity
            style={styles.gradeButton}
            onPress={() => handleGradeStudent(student)}
          >
            <Ionicons name="document-text-outline" size={16} color="#3B82F6" />
            <Text style={styles.gradeButtonText}>
              {student.raw_score !== null ? 'Edit Grade' : 'Grade'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <FacultyAssessmentManagementHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FacultyAssessmentManagementHeader />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Sub-Assessment Details */}
        {subAssessment && (
          <View style={styles.subAssessmentDetails}>
            <Text style={styles.subAssessmentTitle}>{subAssessment.title}</Text>
            <Text style={styles.subAssessmentType}>{subAssessment.type}</Text>
            <Text style={styles.subAssessmentDescription}>{subAssessment.description}</Text>
            
            <View style={styles.subAssessmentMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Total Points:</Text>
                <Text style={styles.metaValue}>{subAssessment.total_points}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Weight:</Text>
                <Text style={styles.metaValue}>{subAssessment.weight_percentage}%</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status:</Text>
                <Text style={styles.metaValue}>{subAssessment.status}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search students..."
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Students List */}
        <View style={styles.studentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Students ({filteredStudents.length})</Text>
          </View>
          
          {filteredStudents.length > 0 ? (
            <View style={styles.studentsList}>
              {filteredStudents.map(renderStudentCard)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No students found' : 'No students enrolled'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Grading Modal */}
      <Modal
        visible={showGradingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGradingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Grade {selectedStudent?.full_name}
              </Text>
              <TouchableOpacity onPress={() => setShowGradingModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Grading Details</Text>
              
              <Text style={styles.inputLabel}>Raw Score *</Text>
              <TextInput
                style={styles.textInput}
                value={gradingData.rawScore}
                onChangeText={(text) => setGradingData(prev => ({ ...prev, rawScore: text }))}
                placeholder={`0-${subAssessment?.total_points || 100}`}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Total Score *</Text>
              <TextInput
                style={styles.textInput}
                value={gradingData.totalScore}
                onChangeText={(text) => setGradingData(prev => ({ ...prev, totalScore: text }))}
                placeholder={subAssessment?.total_points?.toString() || '100'}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Adjusted Score (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={gradingData.adjustedScore}
                onChangeText={(text) => setGradingData(prev => ({ ...prev, adjustedScore: text }))}
                placeholder="Leave empty to use raw score"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusPicker}>
                {['submitted', 'graded', 'late'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      gradingData.status === status && styles.selectedStatusOption
                    ]}
                    onPress={() => setGradingData(prev => ({ ...prev, status }))}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      gradingData.status === status && styles.selectedStatusOptionText
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Remarks (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={gradingData.remarks}
                onChangeText={(text) => setGradingData(prev => ({ ...prev, remarks: text }))}
                placeholder="Enter any remarks or feedback..."
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowGradingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveGrade}
              >
                <Text style={styles.saveButtonText}>Save Grade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  subAssessmentDetails: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  subAssessmentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  subAssessmentType: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: 8,
  },
  subAssessmentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  subAssessmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#353A40',
  },
  studentsSection: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
  },
  studentsList: {
    gap: 12,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 2,
  },
  studentNumber: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  gradeInfo: {
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
  },
  remarksContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  remarksLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 12,
    color: '#353A40',
  },
  noSubmissionText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  studentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  gradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#3B82F620',
    gap: 6,
  },
  gradeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
  },
  modalBody: {
    padding: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#353A40',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  statusPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedStatusOption: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#353A40',
    fontWeight: '500',
  },
  selectedStatusOptionText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
}); 