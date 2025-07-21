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

  useEffect(() => {
    const selectedClassId = params.selectedClassId;
    if (selectedClassId) {
      const foundClass = classes.find(cls => cls.id === selectedClassId);
      if (foundClass) {
        setSelectedClass(foundClass);
        setCurrentView('classDetails');
      }
    }
  }, [params.selectedClassId]);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  // Sample classes data
  const classes = [
    {
      id: 'class-001',
      courseCode: 'IT101',
      courseTitle: 'Introduction to Information Technology',
      schedule: 'MWF 9:00-10:30 AM',
      studentCount: 40,
      assessments: [
        {
          id: 'assess-001',
          title: 'Midterm Exam',
          type: 'Exam',
          totalPoints: 100,
          date: '2024-10-15'
        },
        {
          id: 'assess-002',
          title: 'Programming Assignment 1',
          type: 'Assignment',
          totalPoints: 50,
          date: '2024-10-20'
        },
        {
          id: 'assess-003',
          title: 'Final Project',
          type: 'Project',
          totalPoints: 100,
          date: '2024-12-10'
        }
      ],
      students: [
        { id: 'student-001', name: 'John Doe', studentId: '22-123456', score: 85 },
        { id: 'student-002', name: 'Jane Smith', studentId: '22-234567', score: 92 },
        { id: 'student-003', name: 'Mike Johnson', studentId: '22-345678' },
        { id: 'student-004', name: 'Sarah Wilson', studentId: '22-456789', score: 78 }
      ]
    },
    {
      id: 'class-002',
      courseCode: 'IT201',
      courseTitle: 'Database Management Systems',
      schedule: 'TTh 10:00-11:30 AM',
      studentCount: 35,
      assessments: [
        {
          id: 'assess-004',
          title: 'Database Design Quiz',
          type: 'Quiz',
          totalPoints: 30,
          date: '2024-10-18'
        },
        {
          id: 'assess-005',
          title: 'SQL Project',
          type: 'Project',
          totalPoints: 80,
          date: '2024-11-15'
        }
      ],
      students: [
        { id: 'student-005', name: 'Alex Brown', studentId: '22-567890', score: 88 },
        { id: 'student-006', name: 'Emily Davis', studentId: '22-678901' },
        { id: 'student-007', name: 'Chris Lee', studentId: '22-789012', score: 95 }
      ]
    }
  ];

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
      // If we have a selectedClassId parameter, we came from MyClasses
      if (params.selectedClassId) {
        handleBackToMyClasses();
      } else {
        handleBackToDashboard();
      }
    } else if (currentView === 'classDetails') {
      // If we came from MyClasses, go back to MyClasses instead of classes list
      if (params.selectedClassId) {
        handleBackToMyClasses();
      } else {
        handleBackToClasses();
      }
    } else if (currentView === 'assessmentDetails') {
      handleBackToClassDetails();
    }
  };

  const handleBackToClassDetails = () => {
    setCurrentView('classDetails');
    setSelectedAssessment(null);
    setShowStudentSearch(false);
    setStudentSearchQuery('');
    setStudentViewMode('card');
  };

  const handleAssessmentSelect = (assessment) => {
    setSelectedAssessment(assessment);
    setShowStudentSearch(false);
    setStudentSearchQuery('');
    setStudentViewMode('card');
    setCurrentView('assessmentDetails');
  };

  const handleAddGrade = (student) => {
    setSelectedStudent(student);
    setGradeValue('');
    setShowGradeModal(true);
  };

  const handleSaveGrade = () => {
    if (!gradeValue.trim()) {
      Alert.alert('Error', 'Please enter a grade value');
      return;
    }

    const grade = parseFloat(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > selectedAssessment.totalPoints) {
      Alert.alert('Error', `Grade must be between 0 and ${selectedAssessment.totalPoints}`);
      return;
    }

    Alert.alert('Success', `Grade ${grade}/${selectedAssessment.totalPoints} saved for ${selectedStudent.name}`);
    setShowGradeModal(false);
    setGradeValue('');
    setSelectedStudent(null);
  };

  const filteredAssessments = selectedClass?.assessments?.filter(assessment =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredClasses = classes.filter(cls =>
    cls.courseCode.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
    cls.courseTitle.toLowerCase().includes(classSearchQuery.toLowerCase())
  );

  const filteredStudents = selectedClass?.students?.filter(student =>
    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(studentSearchQuery.toLowerCase())
  ) || [];

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
          <Text style={styles.studentCountText}>{cls.studentCount} students</Text>
        </View>
      </View>
      <View style={styles.classStats}>
        <Text style={styles.classStatsText}>{cls.assessments.length} assessments</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAssessmentCard = (assessment) => (
    <TouchableOpacity
      key={assessment.id}
      style={[styles.assessmentCard, selectedAssessment?.id === assessment.id && styles.selectedAssessmentCard]}
      onPress={() => handleAssessmentSelect(assessment)}
    >
      <View style={styles.assessmentHeader}>
        <View style={styles.assessmentInfo}>
          <Text style={styles.assessmentTitle}>{assessment.title}</Text>
          <Text style={styles.assessmentType}>{assessment.type}</Text>
        </View>
      </View>
      <Text style={styles.assessmentDate}>{assessment.date}</Text>
      <View style={styles.assessmentPoints}>
        <Text style={styles.pointsText}>{assessment.totalPoints} pts</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStudentGradeRow = (student) => (
    <View key={student.id} style={styles.studentGradeRow}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{student.name}</Text>
        <Text style={styles.studentId}>{student.studentId}</Text>
      </View>
      <View style={styles.studentGradeInfo}>
        {student.score ? (
          <Text style={styles.studentScore}>{student.score}/{selectedAssessment?.totalPoints}</Text>
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

  const renderStudentTableView = () => (
    <View style={styles.studentTableContainer}>
      <View style={styles.studentTableHeader}>
        <Text style={styles.studentTableHeaderCell}>Student Name</Text>
        <Text style={styles.studentTableHeaderCell}>Student ID</Text>
        <Text style={styles.studentTableHeaderCell}>Score</Text>
      </View>
      {filteredStudents.map((student) => (
        <View key={student.id} style={styles.studentTableRow}>
          <Text style={styles.studentTableCell}>{student.name}</Text>
          <Text style={styles.studentTableCell}>{student.studentId}</Text>
          <TouchableOpacity 
            style={styles.studentTableScoreCell}
            onPress={() => handleAddGrade(student)}
          >
            <Text style={styles.studentTableScoreText}>{student.score || '--'}/{selectedAssessment?.totalPoints}</Text>
          </TouchableOpacity>
        </View>
      ))}
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
              {filteredClasses.map(renderClassCard)}
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
                {filteredStudents.map(renderStudentGradeRow)}
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
                {selectedStudent?.name} - {selectedAssessment?.title}
              </Text>
              <Text style={styles.modalInfo}>
                Total Points: {selectedAssessment?.totalPoints}
              </Text>
              
              <View style={styles.gradeInputContainer}>
                <Text style={styles.gradeInputLabel}>Grade:</Text>
                <TextInput
                  style={styles.gradeInput}
                  value={gradeValue}
                  onChangeText={setGradeValue}
                  placeholder={`0-${selectedAssessment?.totalPoints}`}
                  keyboardType="numeric"
                />
                <Text style={styles.gradeInputSuffix}>/ {selectedAssessment?.totalPoints}</Text>
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