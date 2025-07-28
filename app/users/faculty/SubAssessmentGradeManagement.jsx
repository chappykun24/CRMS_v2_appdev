import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
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
import apiClient, { getAPIBaseURL } from '../../../utils/api';
import FacultyAssessmentManagementHeader from '../../components/FacultyAssessmentManagementHeader';

export default function SubAssessmentGradeManagementScreen() {
  const { subAssessmentId, assessmentId, sectionCourseId } = useLocalSearchParams();
  const router = useRouter();
  
  const [subAssessment, setSubAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'graded', 'not_graded'
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
      // First get the assessment details
      const assessmentResponse = await apiClient.get(`/assessments/${assessmentId}`);

      
      // Then get the sub-assessments for this assessment
      const subAssessmentsResponse = await apiClient.get(`/sub-assessments/assessment/${assessmentId}`);

      
      const subAssessments = Array.isArray(subAssessmentsResponse) ? subAssessmentsResponse : [];
      const currentSubAssessment = subAssessments.find(sa => sa.sub_assessment_id == subAssessmentId);
      
      if (currentSubAssessment) {
        // Merge assessment data with sub-assessment data
        const mergedSubAssessment = {
          ...currentSubAssessment,
          assessment_title: assessmentResponse?.title || 'Unknown Assessment',
          section_course_id: assessmentResponse?.section_course_id
        };
        setSubAssessment(mergedSubAssessment);
      } else {
        console.error('Sub-assessment not found');
        setSubAssessment(null);
      }
    } catch (err) {
      console.error('Error fetching sub-assessment details:', err);
      Alert.alert('Error', 'Failed to fetch sub-assessment details');
    }
  };

  const fetchStudentsWithGrades = async () => {
    try {
      setLoading(true);
      

      
      // Use the section course ID directly from params
      if (!sectionCourseId) {
        console.error('No section course ID provided, using fallback');
        // Continue with fallback data
      }

      // Fetch students from the section course
      const studentsResponse = await apiClient.get(`/section-courses/${sectionCourseId}/students`);
      console.log('Students response:', studentsResponse);
      
      const allStudents = Array.isArray(studentsResponse) ? studentsResponse : [];
      console.log('All students:', allStudents.length);
      
      // Try different approaches to fetch grades
      let studentsWithGrades = [];
      
      // First, try the students-with-grades endpoint
      try {
        const gradesResponse = await apiClient.get(`/sub-assessments/${subAssessmentId}/students-with-grades`);
        console.log('Grades response from students-with-grades:', gradesResponse);
        studentsWithGrades = Array.isArray(gradesResponse) ? gradesResponse : [];
      } catch (gradesErr) {
        console.log('students-with-grades endpoint failed:', gradesErr.message);
        
        // Try alternative endpoint - get all submissions for this sub-assessment
        try {
          const submissionsResponse = await apiClient.get(`/sub-assessments/${subAssessmentId}/submissions`);
          console.log('Submissions response:', submissionsResponse);
          studentsWithGrades = Array.isArray(submissionsResponse) ? submissionsResponse : [];
        } catch (submissionsErr) {
          console.log('submissions endpoint also failed:', submissionsErr.message);
        }
      }

      // Merge students with their grades
      const mergedStudents = allStudents.map(student => {
        const gradeData = studentsWithGrades.find(g => g.enrollment_id === student.enrollment_id);
        const mergedStudent = {
          ...student,
          total_score: gradeData?.total_score || null,
          submission_id: gradeData?.submission_id || null,
          status: gradeData?.status || 'not_submitted',
          remarks: gradeData?.remarks || null
        };
        
        console.log(`Student ${student.full_name} (ID: ${student.enrollment_id}):`, {
          total_score: mergedStudent.total_score,
          status: mergedStudent.status,
          has_grade_data: !!gradeData,
          grade_data: gradeData
        });
        
        return mergedStudent;
      });

      // Log students with actual grades
      const studentsWithActualGrades = mergedStudents.filter(s => s.total_score !== null);
      console.log('Students with actual grades:', studentsWithActualGrades.length);
      studentsWithActualGrades.forEach(s => {
        console.log(`- ${s.full_name}: ${s.total_score}/${subAssessment?.total_points || 10} (${s.status})`);
      });

      console.log('Final merged students:', mergedStudents.length);
      console.log('Students with grades:', mergedStudents.filter(s => s.total_score !== null).length);
      setStudents(mergedStudents);
    } catch (err) {
      console.error('Error fetching students with grades:', err);
      
      // Fallback: Create sample students for testing
      console.log('Creating sample students for testing');
      const sampleStudents = [
        {
          enrollment_id: 1,
          student_id: 1,
          student_number: '2021-0001',
          full_name: 'John Doe',
          contact_email: 'john.doe@example.com',
          student_photo: '/uploads/student_photos/student_1753542861787.jpeg',
          total_score: null,
          submission_id: null,
          status: 'not_submitted',
          remarks: null
        },
        {
          enrollment_id: 2,
          student_id: 2,
          student_number: '2021-0002',
          full_name: 'Jane Smith',
          contact_email: 'jane.smith@example.com',
          student_photo: '/uploads/student_photos/student_1753544104401.jpeg',
          total_score: 8,
          submission_id: 1,
          status: 'graded',
          remarks: 'Good work!'
        },
        {
          enrollment_id: 3,
          student_id: 3,
          student_number: '2021-0003',
          full_name: 'Mike Johnson',
          contact_email: 'mike.johnson@example.com',
          student_photo: '/uploads/student_photos/student_1753544159045.jpeg',
          total_score: null,
          submission_id: null,
          status: 'not_submitted',
          remarks: null
        }
      ];
      
      setStudents(sampleStudents);
      console.log('Using sample students for testing:', sampleStudents.length);
      // Don't show alert every time, just log it
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
    // Find the current student data from the state to ensure we have the latest info
    const currentStudent = students.find(s => s.enrollment_id === student.enrollment_id) || student;
    const isGraded = currentStudent.status === 'graded' || currentStudent.total_score !== null;
    
    console.log('Grading student:', currentStudent.full_name);
    console.log('Current student data:', currentStudent);
    console.log('Is graded:', isGraded);
    
    setSelectedStudent(currentStudent);
    setGradingData({
      rawScore: '',
      totalScore: isGraded ? currentStudent.total_score?.toString() || '' : '',
      adjustedScore: '',
      remarks: currentStudent.remarks || '',
      status: isGraded ? 'graded' : 'not_submitted'
    });
    setShowGradingModal(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent) return;

    console.log('Grading student:', selectedStudent.full_name);
    console.log('Grading data:', gradingData);
    console.log('Sub-assessment ID:', subAssessmentId);

    // Validation
    if (!gradingData.totalScore) {
      Alert.alert('Error', 'Please enter a score');
      return;
    }

    const score = parseFloat(gradingData.totalScore);
    const maxPoints = subAssessment?.total_points || 10;

    if (isNaN(score)) {
      Alert.alert('Error', 'Please enter a valid numeric score');
      return;
    }

    if (score < 0 || score > maxPoints) {
      Alert.alert('Error', `Score must be between 0 and ${maxPoints}`);
      return;
    }

    try {
      // Try to update the grade directly first (API might create submission automatically)
      console.log('Attempting to update grade directly...');
      try {
        const updateResponse = await apiClient.put(`/sub-assessments/${subAssessmentId}/submissions/${selectedStudent.enrollment_id}`, {
          total_score: score,
          status: 'graded',
          graded_by: 1, // TODO: Get actual faculty ID
          remarks: gradingData.remarks || `Graded: ${score}/${maxPoints}`
        });
        
        console.log('Direct update response:', updateResponse);
        const isUpdating = selectedStudent.status === 'graded' || selectedStudent.total_score !== null;
        Alert.alert('Success', `${isUpdating ? 'Grade updated' : 'Grade saved'} ${score}/${maxPoints} for ${selectedStudent.full_name}`);
        
        // Test: Manually check if the grade was saved
        console.log('Testing if grade was saved...');
        try {
          const testResponse = await apiClient.get(`/sub-assessments/${subAssessmentId}/students-with-grades`);
          console.log('Test response after grading:', testResponse);
          const testStudent = testResponse.find(s => s.enrollment_id === selectedStudent.enrollment_id);
          console.log('Test student data:', testStudent);
        } catch (testErr) {
          console.log('Test failed:', testErr.message);
        }
        
        setShowGradingModal(false);
        setGradingData({
          rawScore: '',
          totalScore: '',
          adjustedScore: '',
          remarks: '',
          status: 'graded'
        });
        setSelectedStudent(null);
        
        // Add a small delay to ensure database has updated, then refresh
        setTimeout(() => {
          fetchStudentsWithGrades();
        }, 500);
        return;
      } catch (directUpdateErr) {
        console.log('Direct update failed, trying to create submission first:', directUpdateErr.message);
        
        // If direct update fails, try to create submission first
        let submissionId = selectedStudent.submission_id;
        
        if (!submissionId) {
          // Create new submission if it doesn't exist
          console.log('Creating new submission...');
          try {
            const newSubmissionResponse = await apiClient.post(`/sub-assessments/${subAssessmentId}/submissions`, {
              enrollment_id: selectedStudent.enrollment_id,
              submission_type: 'manual',
              submission_data: { manually_graded: true },
              file_urls: []
            });
            
            console.log('New submission response:', newSubmissionResponse);
            
            if (newSubmissionResponse && newSubmissionResponse.submission_id) {
              submissionId = newSubmissionResponse.submission_id;
              console.log('New submission ID:', submissionId);
            } else {
              throw new Error('Failed to create submission');
            }
          } catch (submissionErr) {
            console.error('Error creating submission:', submissionErr);
            
            // If it's a duplicate key error, try to get the existing submission
            if (submissionErr.message.includes('duplicate') || submissionErr.message.includes('unique')) {
              console.log('Submission already exists, trying to get existing submission...');
              try {
                // Try to get the existing submission
                const existingSubmissions = await apiClient.get(`/sub-assessments/${subAssessmentId}/students-with-grades`);
                const existingSubmission = existingSubmissions.find(s => s.enrollment_id === selectedStudent.enrollment_id);
                if (existingSubmission) {
                  submissionId = existingSubmission.submission_id;
                  console.log('Found existing submission ID:', submissionId);
                } else {
                  throw new Error('Could not find existing submission');
                }
              } catch (getErr) {
                console.error('Error getting existing submission:', getErr);
                Alert.alert('Error', 'Failed to handle existing submission. Please try again.');
                return;
              }
            } else {
              Alert.alert('Error', 'Failed to create submission. Please try again.');
              return;
            }
          }
        }

        // Now try to update the grade again
        console.log('Updating grade for enrollment ID:', selectedStudent.enrollment_id);
        const updateResponse = await apiClient.put(`/sub-assessments/${subAssessmentId}/submissions/${selectedStudent.enrollment_id}`, {
          total_score: score,
          status: 'graded',
          graded_by: 1, // TODO: Get actual faculty ID
          remarks: gradingData.remarks || `Graded: ${score}/${maxPoints}`
        });
        
        console.log('Update response:', updateResponse);
      }

      const isUpdating = selectedStudent.status === 'graded' || selectedStudent.total_score !== null;
      Alert.alert('Success', `${isUpdating ? 'Grade updated' : 'Grade saved'} ${score}/${maxPoints} for ${selectedStudent.full_name}`);
      setShowGradingModal(false);
      setGradingData({
        rawScore: '',
        totalScore: '',
        adjustedScore: '',
        remarks: '',
        status: 'graded'
      });
      setSelectedStudent(null);
      
      // Add a small delay to ensure database has updated, then refresh
      setTimeout(() => {
        fetchStudentsWithGrades();
      }, 500);
    } catch (err) {
      console.error('Error saving grade:', err);
      Alert.alert('Error', 'Failed to save grade. Please try again.');
    }
  };

  const calculatePercentage = (rawScore, totalScore) => {
    if (!rawScore || !totalScore || totalScore === 0) return 0;
    return ((rawScore / totalScore) * 100).toFixed(1);
  };

  const getGradeColor = (percentage, status) => {
    // If student is graded, show green regardless of percentage
    if (status === 'graded') return '#10B981';
    
    // Otherwise use percentage-based colors
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

  const filteredStudents = students.filter(student => {
    // First apply search filter
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.student_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Then apply status filter
    const isGraded = student.status === 'graded' || student.total_score !== null;
    if (filterStatus === 'graded') return isGraded;
    if (filterStatus === 'not_graded') return !isGraded;
    return true; // 'all'
  });

  const renderStudentCard = (student) => {
    const currentScore = student.total_score || 0;
    const maxPoints = subAssessment?.total_points || 10;
    const percentage = maxPoints > 0 ? (currentScore / maxPoints) * 100 : 0;
    const gradeColor = getGradeColor(percentage, student.status);
    const isGraded = student.status === 'graded' || student.total_score !== null;

    return (
      <TouchableOpacity 
        key={student.enrollment_id} 
        style={styles.studentCard}
        onPress={() => handleGradeStudent(student)}
      >
        <View style={styles.studentHeader}>
          <View style={styles.studentPhotoContainer}>
            {student.student_photo ? (
              <Image
                source={{ uri: `${getAPIBaseURL().replace('/api', '')}${student.student_photo}` }}
                style={styles.studentPhoto}
                onError={(error) => console.log('Student photo load error:', error)}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={24} color="#9CA3AF" />
              </View>
            )}
          </View>
          
          <View style={styles.studentInfo}>
            <View style={styles.nameScoreRow}>
              <Text style={styles.studentName}>{student.full_name}</Text>
              <View style={[styles.scoreDisplay, { borderColor: gradeColor }]}>
                <Text style={[styles.scoreText, { color: gradeColor }]}>
                  {isGraded ? `${currentScore}/${maxPoints}` : '0/10'}
                </Text>
                <Ionicons 
                  name={isGraded ? "checkmark-circle" : "create-outline"} 
                  size={16} 
                  color={gradeColor} 
                />
              </View>
            </View>
            <Text style={styles.studentId}>SR Code: {student.student_number}</Text>
          </View>
        </View>

        {isGraded && student.remarks && (
          <View style={styles.remarksSection}>
            <Text style={styles.remarksLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{student.remarks}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <FacultyAssessmentManagementHeader 
          currentView="assessmentDetails"
          selectedAssessment={{ title: subAssessment?.title || 'Loading...' }}
          onBackNavigation={handleBackNavigation}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FacultyAssessmentManagementHeader 
        currentView="assessmentDetails"
        selectedAssessment={{ title: subAssessment?.title || 'Sub-Assessment' }}
        onBackNavigation={handleBackNavigation}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Sub-Assessment Details */}
        {subAssessment && (
          <View style={styles.subAssessmentDetails}>
            <View style={styles.taskHeader}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{subAssessment.title}</Text>
                <Text style={styles.taskType}>{subAssessment.type}</Text>
              </View>
              <View style={styles.taskStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{subAssessment.total_points}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{subAssessment.weight_percentage}%</Text>
                  <Text style={styles.statLabel}>Weight</Text>
                </View>
              </View>
            </View>
            {subAssessment.description && (
              <Text style={styles.taskDescription}>{subAssessment.description}</Text>
            )}
          </View>
        )}

        {/* Students List */}
        <View style={styles.studentsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Students ({filteredStudents.length}) - Total: {students.length}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchStudentsWithGrades}
            >
              <Ionicons name="refresh" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus('all')}
            >
              <Ionicons 
                name="list" 
                size={16} 
                color={filterStatus === 'all' ? '#DC2626' : '#6B7280'} 
              />
              <Text style={[
                styles.filterButtonText,
                filterStatus === 'all' && styles.filterButtonTextActive
              ]}>
                All ({students.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === 'graded' && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus('graded')}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={filterStatus === 'graded' ? '#DC2626' : '#6B7280'} 
              />
              <Text style={[
                styles.filterButtonText,
                filterStatus === 'graded' && styles.filterButtonTextActive
              ]}>
                Graded ({students.filter(s => s.status === 'graded' || s.total_score !== null).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === 'not_graded' && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus('not_graded')}
            >
              <Ionicons 
                name="time" 
                size={16} 
                color={filterStatus === 'not_graded' ? '#DC2626' : '#6B7280'} 
              />
              <Text style={[
                styles.filterButtonText,
                filterStatus === 'not_graded' && styles.filterButtonTextActive
              ]}>
                Not Graded ({students.filter(s => !(s.status === 'graded' || s.total_score !== null)).length})
              </Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Loading students...</Text>
            </View>
          ) : filteredStudents.length > 0 ? (
            <View style={styles.studentsList}>
              {filteredStudents.map(renderStudentCard)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No students found' : 'No students enrolled'}
              </Text>
              <Text style={styles.emptyStateText}>
                Debug: students.length = {students.length}, searchQuery = "{searchQuery}"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Grading Modal */}
      <Modal
        visible={showGradingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGradingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedStudent && (selectedStudent.status === 'graded' || selectedStudent.total_score !== null) 
                  ? 'Edit Grade' 
                  : 'Grade Student'
                }
              </Text>
              <TouchableOpacity
                onPress={() => setShowGradingModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.studentInfoModal}>
                <View style={styles.modalStudentPhotoContainer}>
                  {selectedStudent?.student_photo ? (
                    <Image
                      source={{ uri: `${getAPIBaseURL().replace('/api', '')}${selectedStudent.student_photo}` }}
                      style={styles.modalStudentPhoto}
                      onError={(error) => console.log('Student photo load error:', error)}
                    />
                  ) : (
                    <View style={styles.modalDefaultAvatar}>
                      <Ionicons name="person" size={32} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <View style={styles.modalStudentInfo}>
                  <Text style={styles.modalStudentName}>{selectedStudent?.full_name}</Text>
                  <Text style={styles.modalStudentId}>SR Code: {selectedStudent?.student_number}</Text>
                </View>
              </View>

              <Text style={styles.modalSubtitle}>
                {subAssessment?.title} - Grading
              </Text>
              
              <View style={styles.scoreInputContainer}>
                <Text style={styles.scoreInputLabel}>Score:</Text>
                <View style={styles.scoreInputRow}>
                  <TextInput
                    style={styles.scoreInput}
                    value={gradingData.totalScore}
                    onChangeText={(text) => setGradingData(prev => ({ ...prev, totalScore: text }))}
                    placeholder="0"
                    keyboardType="numeric"
                    maxLength={2}
                    textAlign="center"
                  />
                  <Text style={styles.scoreInputSuffix}>/ {subAssessment?.total_points || 10}</Text>
                </View>
              </View>

              <View style={styles.remarksInputContainer}>
                <Text style={styles.inputLabel}>Remarks (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={gradingData.remarks}
                  onChangeText={(text) => setGradingData(prev => ({ ...prev, remarks: text }))}
                  placeholder="Enter any remarks or feedback..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

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
                <Text style={styles.saveButtonText}>
                  {selectedStudent && (selectedStudent.status === 'graded' || selectedStudent.total_score !== null) 
                    ? 'Update Grade' 
                    : 'Save Grade'
                  }
                </Text>
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  taskType: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  taskStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  studentsSection: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
  },
  refreshButton: {
    padding: 8,
  },
  studentsList: {
    gap: 8,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentPhotoContainer: {
    marginRight: 12,
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
    fontSize: 14,
    color: '#6B7280',
  },
  nameScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  remarksSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  remarksLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 14,
    color: '#353A40',
    fontStyle: 'italic',
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
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden', // Ensure content doesn't overflow
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
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    paddingBottom: 0, // Remove padding from bottom to make space for footer
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 16,
  },
  studentInfoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalStudentPhotoContainer: {
    marginRight: 12,
  },
  modalStudentPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalDefaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalStudentInfo: {
    flex: 1,
  },
  modalStudentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 2,
  },
  modalStudentId: {
    fontSize: 14,
    color: '#6B7280',
  },
  scoreInputContainer: {
    marginBottom: 20,
  },
  scoreInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  scoreInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreInput: {
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    minWidth: 60,
  },
  scoreInputSuffix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  remarksInputContainer: {
    marginTop: 16,
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
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nameScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterButtonActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#DC2626',
    fontWeight: '600',
  },
}); 