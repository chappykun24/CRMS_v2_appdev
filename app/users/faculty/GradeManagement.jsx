import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import apiClient from '../../../utils/api';
import FacultyGradeManagementHeader from '../../components/FacultyGradeManagementHeader';

export default function GradeManagementScreen() {
  const { currentUser } = useUser();
  const params = useLocalSearchParams();
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('classes'); // 'classes', 'classDetails', or 'assessmentDetails'
  const [showSearch, setShowSearch] = useState(false);
  const [showAssessmentSearch, setShowAssessmentSearch] = useState(false);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [studentViewMode, setStudentViewMode] = useState('card'); // 'card' or 'table'
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [classData, setClassData] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsWithGrades, setStudentsWithGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const section_course_id = params.section_course_id;
    const syllabus_id = params.syllabus_id;
    if (!section_course_id || !syllabus_id) return;
    setLoading(true);
    // Fetch class info (students)
    Promise.all([
      apiClient.get(`/section-courses/${section_course_id}/students`),
      apiClient.get(`/syllabus/one/${syllabus_id}`)
    ]).then(([studentsRes, syllabusRes]) => {
      setStudents(Array.isArray(studentsRes) ? studentsRes : []);
      setClassData(syllabusRes);
      setAssessments(Array.isArray(syllabusRes.assessments) ? syllabusRes.assessments : []);
      setSelectedClass({
        id: section_course_id,
        courseCode: syllabusRes.course_code,
        courseTitle: syllabusRes.course_title,
        schedule: syllabusRes.schedule || '',
        students: Array.isArray(studentsRes) ? studentsRes : [],
        assessments: Array.isArray(syllabusRes.assessments) ? syllabusRes.assessments : []
      });
      setCurrentView('classDetails');
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching class data:', err);
      setStudents([]);
      setClassData(null);
      setAssessments([]);
      setSelectedClass(null);
      setLoading(false);
    });
  }, [params.section_course_id, params.syllabus_id]);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    setSelectedAssessment(null);
    setSearchQuery('');
    setShowAssessmentSearch(false);
    setCurrentView('classDetails');
  };

  const handleBackToClasses = () => {
    setCurrentView('classes');
    setSelectedClass(null);
    setSelectedAssessment(null);
    setSearchQuery('');
    setShowAssessmentSearch(false);
  };

  const handleBackToDashboard = () => {
    router.push('/users/faculty/dashboard');
  };

  const handleBackToMyClasses = () => {
    router.push('/users/faculty/MyClasses');
  };

  const handleBackNavigation = () => {
    if (currentView === 'classes') {
      handleBackToMyClasses(); // Always go to MyClasses
    } else if (currentView === 'classDetails') {
      handleBackToMyClasses(); // Always go to MyClasses
    } else if (currentView === 'assessmentDetails') {
      setCurrentView('classDetails');
      setSelectedAssessment(null);
      setShowStudentSearch(false);
      setStudentSearchQuery('');
      setStudentViewMode('card');
    } else {
      handleBackToMyClasses(); // Fallback
    }
  };

  const handleBackToClassDetails = () => {
    setCurrentView('classDetails');
    setSelectedAssessment(null);
    setShowStudentSearch(false);
    setStudentSearchQuery('');
    setStudentViewMode('card');
  };

  const handleAssessmentSelect = async (assessment) => {
    setSelectedAssessment(assessment);
    setShowStudentSearch(false);
    setStudentSearchQuery('');
    setStudentViewMode('card');
    setCurrentView('assessmentDetails');
    
    // Fetch students with grades for this assessment
    try {
      const studentsWithGradesRes = await apiClient.get(`/assessments/${assessment.assessment_id}/students-with-grades`);
      setStudentsWithGrades(Array.isArray(studentsWithGradesRes) ? studentsWithGradesRes : []);
    } catch (err) {
      console.error('Error fetching students with grades:', err);
      setStudentsWithGrades([]);
    }
  };

  const handleAddGrade = (student) => {
    setSelectedStudent(student);
    setGradeValue(student.total_score ? student.total_score.toString() : '');
    setShowGradeModal(true);
  };

  const handleSaveGrade = async () => {
    if (!gradeValue.trim()) {
      Alert.alert('Error', 'Please enter a grade value');
      return;
    }

    const grade = parseFloat(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > selectedAssessment.total_points) {
      Alert.alert('Error', `Grade must be between 0 and ${selectedAssessment.total_points}`);
      return;
    }

    try {
      // Check if submission exists, if not create one
      let submissionExists = selectedStudent.submission_id;
      
      if (!submissionExists) {
        // Create a new submission
        const newSubmission = await apiClient.post(`/assessments/${selectedAssessment.assessment_id}/submissions`, {
          enrollment_id: selectedStudent.enrollment_id,
          submission_type: 'manual',
          submission_data: { manually_graded: true },
          file_urls: []
        });
        submissionExists = newSubmission.submission_id;
      }

      // Update the submission with the grade
      await apiClient.put(`/assessments/${selectedAssessment.assessment_id}/submissions/${selectedStudent.enrollment_id}`, {
        total_score: grade,
        raw_score: grade,
        adjusted_score: grade,
        status: 'graded',
        graded_by: currentUser.user_id,
        remarks: `Graded by ${currentUser.full_name}`
      });

      Alert.alert('Success', `Grade ${grade}/${selectedAssessment.total_points} saved for ${selectedStudent.full_name}`);
      setShowGradeModal(false);
      setGradeValue('');
      setSelectedStudent(null);
      
      // Refresh the students with grades list
      const updatedStudentsWithGrades = await apiClient.get(`/assessments/${selectedAssessment.assessment_id}/students-with-grades`);
      setStudentsWithGrades(Array.isArray(updatedStudentsWithGrades) ? updatedStudentsWithGrades : []);
    } catch (err) {
      console.error('Error saving grade:', err);
      Alert.alert('Error', 'Failed to save grade. Please try again.');
    }
  };

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

  const getGradeColor = (score, totalPoints) => {
    if (!score) return '#6B7280'; // Gray for no grade
    const percentage = (score / totalPoints) * 100;
    if (percentage >= 90) return '#10B981'; // Green for A
    if (percentage >= 80) return '#3B82F6'; // Blue for B
    if (percentage >= 70) return '#F59E0B'; // Yellow for C
    if (percentage >= 60) return '#F97316'; // Orange for D
    return '#EF4444'; // Red for F
  };

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudentsWithGrades = studentsWithGrades.filter(student =>
    (student.full_name || '').toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    (student.student_number || '').toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const renderClassCard = (cls) => (
    <TouchableOpacity
      key={cls.id}
      style={[styles.classCard, selectedClass?.id === cls.id && styles.selectedClassCard]}
      onPress={() => handleClassSelect(cls)}
    >
      <View style={styles.classHeader}>
        <View style={styles.classInfo}>
          <Text style={styles.classTitle}>{cls.courseCode} - {cls.courseTitle}</Text>
          <Text style={styles.classSchedule}>{cls.schedule}</Text>
        </View>
        <View style={styles.studentCountBadge}>
          <Ionicons name="people-outline" size={16} color="#DC2626" />
          <Text style={styles.studentCountText}>{cls.students.length} students</Text>
        </View>
      </View>
      <View style={styles.classStats}>
        <Text style={styles.classStatsText}>{cls.assessments.length} assessments</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAssessmentCard = (assessment) => (
    <TouchableOpacity
      key={assessment.assessment_id}
      style={[styles.assessmentCard, selectedAssessment?.assessment_id === assessment.assessment_id && styles.selectedAssessmentCard]}
      onPress={() => handleAssessmentSelect(assessment)}
    >
      <View style={styles.assessmentHeader}>
        <View style={styles.assessmentInfo}>
          <Text style={styles.assessmentTitle}>{assessment.title}</Text>
          <Text style={styles.assessmentType}>{assessment.type}</Text>
        </View>
      </View>
      <Text style={styles.assessmentDate}>{formatDate(assessment.due_date)}</Text>
      <View style={styles.assessmentPoints}>
        <Text style={styles.pointsText}>{assessment.total_points} pts</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStudentGradeRow = (student) => {
    const gradeColor = getGradeColor(student.total_score, student.total_points);
    
    return (
      <View key={student.enrollment_id} style={styles.studentGradeRow}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.full_name}</Text>
          <Text style={styles.studentId}>{student.student_number}</Text>
        </View>
        <View style={styles.studentGradeInfo}>
          {student.total_score !== null ? (
            <TouchableOpacity 
              style={[styles.gradeDisplay, { borderColor: gradeColor }]}
              onPress={() => handleAddGrade(student)}
            >
              <Text style={[styles.studentScore, { color: gradeColor }]}>
                {student.total_score}/{student.total_points}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.addGradeButton}
              onPress={() => handleAddGrade(student)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.addGradeText}>Add Grade</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderStudentTableView = () => (
    <View style={styles.studentTableContainer}>
      <View style={styles.studentTableHeader}>
        <Text style={styles.studentTableHeaderCell}>Student Name</Text>
        <Text style={styles.studentTableHeaderCell}>Student ID</Text>
        <Text style={styles.studentTableHeaderCell}>Score</Text>
      </View>
      {filteredStudentsWithGrades.map((student) => {
        const gradeColor = getGradeColor(student.total_score, student.total_points);
        return (
          <View key={student.enrollment_id} style={styles.studentTableRow}>
            <Text style={styles.studentTableCell}>{student.full_name}</Text>
            <Text style={styles.studentTableCell}>{student.student_number}</Text>
            <TouchableOpacity 
              style={[styles.studentTableScoreCell, { borderColor: gradeColor }]}
              onPress={() => handleAddGrade(student)}
            >
              <Text style={[styles.studentTableScoreText, { color: gradeColor }]}>
                {student.total_score !== null ? `${student.total_score}/${student.total_points}` : '--'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FacultyGradeManagementHeader
        currentView={currentView}
        selectedClass={selectedClass}
        selectedAssessment={selectedAssessment}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        showAssessmentSearch={showAssessmentSearch}
        setShowAssessmentSearch={setShowAssessmentSearch}
        showStudentSearch={showStudentSearch}
        setShowStudentSearch={setShowStudentSearch}
        studentViewMode={studentViewMode}
        setStudentViewMode={setStudentViewMode}
        classSearchQuery={classSearchQuery}
        setClassSearchQuery={setClassSearchQuery}
        studentSearchQuery={studentSearchQuery}
        setStudentSearchQuery={setStudentSearchQuery}
        onBackNavigation={handleBackNavigation}
      />

      <View style={styles.content}>
        {currentView === 'classes' && (
          /* Classes Selection View */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Classes</Text>
            
            <View style={styles.classesContainer}>
              {selectedClass && renderClassCard(selectedClass)}
            </View>
          </View>
        )}

        {currentView === 'classDetails' && (
          /* Class Details View */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assessments</Text>
            
            <View style={styles.assessmentsContainer}>
              {filteredAssessments.map(renderAssessmentCard)}
            </View>
          </View>
        )}

        {currentView === 'assessmentDetails' && (
          /* Assessment Details View */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Students</Text>
            
            {studentViewMode === 'card' ? (
              <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.studentsListContainer}>
                {filteredStudentsWithGrades.map(renderStudentGradeRow)}
              </ScrollView>
            ) : (
              renderStudentTableView()
            )}
          </View>
        )}
      </View>

      {/* Grade Entry Modal */}
      <Modal
        visible={showGradeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Grade</Text>
              <TouchableOpacity onPress={() => setShowGradeModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {selectedStudent?.full_name} - {selectedAssessment?.title}
              </Text>
              <Text style={styles.modalInfo}>
                Total Points: {selectedAssessment?.total_points}
              </Text>
              
              <View style={styles.gradeInputContainer}>
                <Text style={styles.gradeInputLabel}>Grade:</Text>
                <TextInput
                  style={styles.gradeInput}
                  value={gradeValue}
                  onChangeText={setGradeValue}
                  placeholder={`0-${selectedAssessment?.total_points}`}
                  keyboardType="numeric"
                />
                <Text style={styles.gradeInputSuffix}>/ {selectedAssessment?.total_points}</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowGradeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveGrade}>
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
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
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
  selectedClassCard: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
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
  assessmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  assessmentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedAssessmentCard: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  assessmentType: {
    fontSize: 14,
    color: '#6B7280',
  },
  assessmentPoints: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  assessmentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  studentsList: {
    maxHeight: 300,
  },
  studentsListContainer: {
    paddingBottom: 100, // Add space at bottom for navigation bar
  },
  studentGradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
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
    marginBottom: 2,
  },
  studentId: {
    fontSize: 14,
    color: '#6B7280',
  },
  addGradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  addGradeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  gradeDisplay: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  gradeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
  },
  gradeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  gradeInputSuffix: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  studentTableContainer: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  studentTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  studentTableHeaderCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    textAlign: 'center',
  },
  studentTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  studentTableCell: {
    fontSize: 14,
    color: '#353A40',
    textAlign: 'center',
  },
  studentTableScoreCell: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentTableScoreText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  studentGradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentScore: {
    fontSize: 14,
    color: '#353A40',
    fontWeight: '600',
  },
}); 