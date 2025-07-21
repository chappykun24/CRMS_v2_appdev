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
import FacultyAttendanceManagementHeader from '../../components/FacultyAttendanceManagementHeader';

export default function AttendanceManagementScreen() {
  const { currentUser } = useUser();
  const params = useLocalSearchParams();
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSlideshowModal, setShowSlideshowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [pendingStatus, setPendingStatus] = useState('');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionType, setNewSessionType] = useState('Lecture');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('classes'); // 'classes', 'classDetails', or 'sessionDetails'
  const [showSearch, setShowSearch] = useState(false);
  const [showSessionSearch, setShowSessionSearch] = useState(false);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [studentViewMode, setStudentViewMode] = useState('card'); // 'card' or 'table'
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
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
      sessions: [
        {
          id: 'session-003',
          title: 'Week 3 - Lab Session',
          date: '2024-12-15',
          time: '9:00-10:30 AM',
          type: 'Laboratory'
        },
        {
          id: 'session-002',
          title: 'Week 2 - Programming Basics',
          date: '2024-12-13',
          time: '9:00-10:30 AM',
          type: 'Lecture'
        },
        {
          id: 'session-001',
          title: 'Week 1 - Introduction',
          date: '2024-12-11',
          time: '9:00-10:30 AM',
          type: 'Lecture'
        }
      ],
      students: [
        { id: 'student-001', name: 'John Doe', studentId: '22-123456', attendance: 'present' },
        { id: 'student-002', name: 'Jane Smith', studentId: '22-234567', attendance: 'absent' },
        { id: 'student-003', name: 'Mike Johnson', studentId: '22-345678', attendance: 'late' },
        { id: 'student-004', name: 'Sarah Wilson', studentId: '22-456789', attendance: 'present' }
      ]
    },
    {
      id: 'class-002',
      courseCode: 'IT201',
      courseTitle: 'Database Management Systems',
      schedule: 'TTh 10:00-11:30 AM',
      studentCount: 35,
      sessions: [
        {
          id: 'session-005',
          title: 'Week 2 - SQL Basics',
          date: '2024-12-14',
          time: '10:00-11:30 AM',
          type: 'Laboratory'
        },
        {
          id: 'session-004',
          title: 'Week 1 - Database Concepts',
          date: '2024-12-12',
          time: '10:00-11:30 AM',
          type: 'Lecture'
        }
      ],
      students: [
        { id: 'student-005', name: 'Alex Brown', studentId: '22-567890', attendance: 'present' },
        { id: 'student-006', name: 'Emily Davis', studentId: '22-678901', attendance: 'present' },
        { id: 'student-007', name: 'Chris Lee', studentId: '22-789012', attendance: 'absent' }
      ]
    }
  ];

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    setSelectedSession(null);
    setSearchQuery('');
    setShowSessionSearch(false);
    setSessionSearchQuery('');
    setCurrentView('classDetails');
  };

  const handleBackToClasses = () => {
    setCurrentView('classes');
    setSelectedClass(null);
    setSelectedSession(null);
    setSearchQuery('');
    setShowSessionSearch(false);
    setSessionSearchQuery('');
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
        router.push('/users/faculty/dashboard');
      }
    } else if (currentView === 'classDetails') {
      // If we came from MyClasses, go back to MyClasses instead of classes list
      if (params.selectedClassId) {
        handleBackToMyClasses();
      } else {
        handleBackToClasses();
      }
    } else if (currentView === 'sessionDetails') {
      handleBackToClassDetails();
    }
  };

  const handleBackToClassDetails = () => {
    setCurrentView('classDetails');
    setSelectedSession(null);
    setShowStudentSearch(false);
    setStudentSearchQuery('');
    setStudentViewMode('card');
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setShowStudentSearch(false);
    setStudentSearchQuery('');
    setStudentViewMode('card');
    setCurrentView('sessionDetails');
  };

  const handleMarkAttendance = (student) => {
    setSelectedStudent(student);
    setAttendanceStatus(student.attendance || 'present');
    setShowAttendanceModal(true);
  };

  const handleSaveAttendance = () => {
    Alert.alert('Success', `Attendance marked as ${attendanceStatus} for ${selectedStudent.name}`);
    setShowAttendanceModal(false);
    setAttendanceStatus('present');
    setSelectedStudent(null);
  };

  const handleCreateNewAttendance = () => {
    setCurrentStudentIndex(0);
    setShowSlideshowModal(true);
  };

  const handleCreateNewSession = () => {
    setShowNewSessionModal(true);
    setNewSessionTitle('');
    setNewSessionDate('');
    setNewSessionType('Lecture');
  };

  const handleSaveNewSession = () => {
    if (!newSessionTitle.trim() || !newSessionDate.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newSession = {
      id: `session-${Date.now()}`,
      title: newSessionTitle,
      date: newSessionDate,
      time: selectedClass?.schedule?.split(' ').slice(1).join(' ') || '9:00-10:30 AM',
      type: newSessionType
    };

    Alert.alert('Success', `New session "${newSessionTitle}" created for ${newSessionDate}`);
    setShowNewSessionModal(false);
    setNewSessionTitle('');
    setNewSessionDate('');
    setNewSessionType('Lecture');
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < filteredStudents.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
    }
  };

  const handlePreviousStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
    }
  };

  const handleMarkAttendanceInSlideshow = (status) => {
    const currentStudent = filteredStudents[currentStudentIndex];
    
    if (status === 'present') {
      Alert.alert('Success', `Marked ${currentStudent.name} as ${status}`);
      
      // Move to next student or close modal if at the end
      if (currentStudentIndex < filteredStudents.length - 1) {
        setCurrentStudentIndex(currentStudentIndex + 1);
      } else {
        setShowSlideshowModal(false);
        Alert.alert('Complete', 'All students have been marked for attendance!');
      }
    } else {
      // For absent, late, or excuse - show remarks input
      setPendingStatus(status);
      setShowRemarks(true);
      setRemarks('');
    }
  };

  const handleSubmitRemarks = () => {
    const currentStudent = filteredStudents[currentStudentIndex];
    Alert.alert('Success', `Marked ${currentStudent.name} as ${pendingStatus} with remarks: ${remarks}`);
    
    // Move to next student or close modal if at the end
    if (currentStudentIndex < filteredStudents.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
    } else {
      setShowSlideshowModal(false);
      Alert.alert('Complete', 'All students have been marked for attendance!');
    }
    
    setShowRemarks(false);
    setRemarks('');
    setPendingStatus('');
  };

  const filteredClasses = classes.filter(cls =>
    cls.courseCode.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
    cls.courseTitle.toLowerCase().includes(classSearchQuery.toLowerCase())
  );

  const filteredSessions = selectedClass?.sessions?.filter(session =>
    session.title.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
    session.type.toLowerCase().includes(sessionSearchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.date) - new Date(a.date)) || [];

  const filteredStudents = selectedClass?.students?.filter(student =>
    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(studentSearchQuery.toLowerCase())
  ) || [];

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'present': return '#10B981';
      case 'absent': return '#EF4444';
      case 'late': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getAttendanceText = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      default: return 'Not Marked';
    }
  };

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
        <Text style={styles.classStatsText}>{cls.sessions.length} sessions</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSessionCard = (session) => (
    <TouchableOpacity
      key={session.id}
      style={[styles.sessionCard, selectedSession?.id === session.id && styles.selectedSessionCard]}
      onPress={() => handleSessionSelect(session)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.sessionType}>{session.type}</Text>
        </View>
        <View style={styles.sessionDate}>
          <Text style={styles.dateText}>{session.date}</Text>
        </View>
      </View>
      <Text style={styles.sessionTime}>{session.time}</Text>
    </TouchableOpacity>
  );

  const renderStudentAttendanceRow = (student) => (
    <View key={student.id} style={styles.studentAttendanceRow}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{student.name}</Text>
        <Text style={styles.studentId}>{student.studentId}</Text>
      </View>
      <View style={styles.studentAttendanceInfo}>
        {student.attendance ? (
          <View style={[styles.attendanceBadge, { backgroundColor: getAttendanceColor(student.attendance) + '20' }]}>
            <Text style={[styles.attendanceText, { color: getAttendanceColor(student.attendance) }]}>
              {getAttendanceText(student.attendance)}
            </Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.markAttendanceButton}
            onPress={() => handleMarkAttendance(student)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.markAttendanceText}>Mark Attendance</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderStudentAttendanceTable = () => (
    <View style={styles.studentTableContainer}>
      <View style={styles.studentTableHeader}>
        <Text style={styles.studentTableHeaderCell}>Student Name</Text>
        <Text style={styles.studentTableHeaderCell}>Student ID</Text>
        <Text style={styles.studentTableHeaderCell}>Status</Text>
      </View>
      {filteredStudents.map((student) => (
        <View key={student.id} style={styles.studentTableRow}>
          <Text style={styles.studentTableCell}>{student.name}</Text>
          <Text style={styles.studentTableCell}>{student.studentId}</Text>
          <Text style={[styles.studentTableStatusText, { color: getAttendanceColor(student.attendance || 'not-marked') }]}>
            {getAttendanceText(student.attendance || 'not-marked')}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FacultyAttendanceManagementHeader
        currentView={currentView}
        selectedClass={selectedClass}
        selectedSession={selectedSession}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        showSessionSearch={showSessionSearch}
        setShowSessionSearch={setShowSessionSearch}
        showStudentSearch={showStudentSearch}
        setShowStudentSearch={setShowStudentSearch}
        studentViewMode={studentViewMode}
        setStudentViewMode={setStudentViewMode}
        classSearchQuery={classSearchQuery}
        setClassSearchQuery={setClassSearchQuery}
        sessionSearchQuery={sessionSearchQuery}
        setSessionSearchQuery={setSessionSearchQuery}
        studentSearchQuery={studentSearchQuery}
        setStudentSearchQuery={setStudentSearchQuery}
        onBackNavigation={handleBackNavigation}
        onCreateNewSession={handleCreateNewSession}
        onCreateNewAttendance={handleCreateNewAttendance}
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
            <Text style={styles.sectionTitle}>Sessions</Text>
            
            <View style={styles.sessionsContainer}>
              {filteredSessions.map(renderSessionCard)}
            </View>
          </View>
        )}

        {currentView === 'sessionDetails' && (
          /* Session Details View */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Students</Text>
            
            {studentViewMode === 'card' ? (
              <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false}>
                {filteredStudents.map(renderStudentAttendanceRow)}
              </ScrollView>
            ) : (
              <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false}>
                {renderStudentAttendanceTable()}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Attendance Entry Modal */}
      <Modal
        visible={showAttendanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Attendance</Text>
              <TouchableOpacity onPress={() => setShowAttendanceModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {selectedStudent?.name} - {selectedSession?.title}
              </Text>
              
              <View style={styles.attendanceOptions}>
                <TouchableOpacity 
                  style={[styles.attendanceOption, attendanceStatus === 'present' && styles.attendanceOptionSelected]}
                  onPress={() => setAttendanceStatus('present')}
                >
                  <Ionicons name="checkmark-circle" size={24} color={attendanceStatus === 'present' ? '#10B981' : '#6B7280'} />
                  <Text style={[styles.attendanceOptionText, attendanceStatus === 'present' && styles.attendanceOptionTextSelected]}>
                    Present
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.attendanceOption, attendanceStatus === 'absent' && styles.attendanceOptionSelected]}
                  onPress={() => setAttendanceStatus('absent')}
                >
                  <Ionicons name="close-circle" size={24} color={attendanceStatus === 'absent' ? '#EF4444' : '#6B7280'} />
                  <Text style={[styles.attendanceOptionText, attendanceStatus === 'absent' && styles.attendanceOptionTextSelected]}>
                    Absent
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.attendanceOption, attendanceStatus === 'late' && styles.attendanceOptionSelected]}
                  onPress={() => setAttendanceStatus('late')}
                >
                  <Ionicons name="time" size={24} color={attendanceStatus === 'late' ? '#F59E0B' : '#6B7280'} />
                  <Text style={[styles.attendanceOptionText, attendanceStatus === 'late' && styles.attendanceOptionTextSelected]}>
                    Late
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowAttendanceModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAttendance}>
                <Text style={styles.saveButtonText}>Save Attendance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Slideshow Modal */}
      <Modal
        visible={showSlideshowModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSlideshowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.slideshowModalContent}>
            <View style={styles.slideshowModalHeader}>
              <Text style={styles.slideshowModalTitle}>Mark Attendance - Slideshow</Text>
              <TouchableOpacity onPress={() => setShowSlideshowModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.slideshowModalBody}>
              {filteredStudents.length > 0 && (
                <>
                  <View style={styles.studentPhotoContainer}>
                    <View style={styles.studentPhotoPlaceholder}>
                      <Ionicons name="person" size={40} color="#9CA3AF" />
                    </View>
                  </View>

                  <View style={styles.studentSlideInfo}>
                    <Text style={styles.studentSlideName}>
                      {filteredStudents[currentStudentIndex]?.name}
                    </Text>
                    <Text style={styles.studentSlideId}>
                      {filteredStudents[currentStudentIndex]?.studentId}
                    </Text>
                  </View>

                  <View style={styles.slideshowNavigation}>
                    <TouchableOpacity 
                      style={[styles.navButton, currentStudentIndex === 0 && styles.navButtonDisabled]}
                      onPress={handlePreviousStudent}
                      disabled={currentStudentIndex === 0}
                    >
                      <Ionicons name="chevron-back" size={24} color={currentStudentIndex === 0 ? '#9CA3AF' : '#353A40'} />
                    </TouchableOpacity>
                    
                    <Text style={styles.slideCounter}>
                      {currentStudentIndex + 1} of {filteredStudents.length}
                    </Text>
                    
                    <TouchableOpacity 
                      style={[styles.navButton, currentStudentIndex === filteredStudents.length - 1 && styles.navButtonDisabled]}
                      onPress={handleNextStudent}
                      disabled={currentStudentIndex === filteredStudents.length - 1}
                    >
                      <Ionicons name="chevron-forward" size={24} color={currentStudentIndex === filteredStudents.length - 1 ? '#9CA3AF' : '#353A40'} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.slideshowStatusButtons}>
                    <TouchableOpacity 
                      style={[styles.statusButton, styles.presentButton]}
                      onPress={() => handleMarkAttendanceInSlideshow('present')}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.statusButtonText}>Present</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.statusButton, styles.absentButton]}
                      onPress={() => handleMarkAttendanceInSlideshow('absent')}
                    >
                      <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.statusButtonText}>Absent</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.statusButton, styles.lateButton]}
                      onPress={() => handleMarkAttendanceInSlideshow('late')}
                    >
                      <Ionicons name="time" size={20} color="#FFFFFF" />
                      <Text style={styles.statusButtonText}>Late</Text>
                    </TouchableOpacity>
                  </View>

                  {showRemarks && (
                    <View style={styles.remarksContainer}>
                      <Text style={styles.remarksLabel}>Add Remarks (Optional)</Text>
                      <TextInput
                        style={styles.remarksInput}
                        value={remarks}
                        onChangeText={setRemarks}
                        placeholder="Enter any remarks about this student's attendance..."
                        multiline
                        numberOfLines={3}
                      />
                      <View style={styles.remarksButtons}>
                        <TouchableOpacity 
                          style={styles.cancelRemarksButton}
                          onPress={() => setShowRemarks(false)}
                        >
                          <Text style={styles.cancelRemarksText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.submitRemarksButton}
                          onPress={handleSubmitRemarks}
                        >
                          <Text style={styles.submitRemarksText}>Submit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* New Session Modal */}
      <Modal
        visible={showNewSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.newSessionModalContent}>
            <View style={styles.newSessionModalHeader}>
              <Text style={styles.newSessionModalTitle}>Create New Session</Text>
              <TouchableOpacity onPress={() => setShowNewSessionModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.newSessionModalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Session Title</Text>
                <TextInput
                  style={styles.inputField}
                  value={newSessionTitle}
                  onChangeText={setNewSessionTitle}
                  placeholder="e.g., Week 3 - Lab Session"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.inputField}
                  value={newSessionDate}
                  onChangeText={setNewSessionDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Session Type</Text>
                <View style={styles.typeOptions}>
                  <TouchableOpacity 
                    style={[styles.typeOption, newSessionType === 'Lecture' && styles.typeOptionSelected]}
                    onPress={() => setNewSessionType('Lecture')}
                  >
                    <Text style={[styles.typeOptionText, newSessionType === 'Lecture' && styles.typeOptionTextSelected]}>
                      Lecture
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.typeOption, newSessionType === 'Laboratory' && styles.typeOptionSelected]}
                    onPress={() => setNewSessionType('Laboratory')}
                  >
                    <Text style={[styles.typeOptionText, newSessionType === 'Laboratory' && styles.typeOptionTextSelected]}>
                      Laboratory
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.newSessionModalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowNewSessionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveNewSession}>
                <Text style={styles.saveButtonText}>Create Session</Text>
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
  sessionsContainer: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedSessionCard: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  studentsList: {
    maxHeight: 300,
  },
  studentAttendanceRow: {
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
  attendanceStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  attendanceStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  markAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  markAttendanceText: {
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
    marginBottom: 16,
  },
  attendanceOptions: {
    gap: 12,
  },
  attendanceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  attendanceOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  attendanceOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  attendanceOptionTextSelected: {
    color: '#DC2626',
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
  studentAttendanceTable: {
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
  studentTableAttendanceCell: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  studentTableAttendanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Slideshow Modal Styles
  slideshowModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 24,
  },
  slideshowModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  slideshowModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  slideshowModalBody: {
    alignItems: 'center',
    marginBottom: 20,
  },
  studentPhotoContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  studentPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentSlideInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  studentSlideName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 6,
  },
  studentSlideId: {
    fontSize: 16,
    color: '#6B7280',
  },
  slideshowNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navButtonDisabled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  slideCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
  },
  slideshowStatusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  presentButton: {
    backgroundColor: '#10B981',
  },
  absentButton: {
    backgroundColor: '#EF4444',
  },
  lateButton: {
    backgroundColor: '#F59E0B',
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Remarks Styles
  remarksContainer: {
    width: '100%',
    marginTop: 20,
  },
  remarksLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
    textAlign: 'center',
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  remarksButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelRemarksButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelRemarksText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitRemarksButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  submitRemarksText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // New Session Modal Styles
  newSessionModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 24,
  },
  newSessionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  newSessionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  newSessionModalBody: {
    marginBottom: 20,
  },
  newSessionModalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeOptionTextSelected: {
    color: '#DC2626',
  },
}); 