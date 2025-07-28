import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import apiClient, { getAPIBaseURL } from '../../../utils/api';
import FacultyAttendanceManagementHeader from '../../components/FacultyAttendanceManagementHeader';

export default function AttendanceManagementScreen() {
  console.log('AttendanceManagementScreen rendered');
  const { currentUser } = useUser();
  const params = useLocalSearchParams();
  const [approvedClasses, setApprovedClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
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
  const [loading, setLoading] = useState(true);
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);
  const [showNewSessionDatePicker, setShowNewSessionDatePicker] = useState(false);
  const [newSessionMeetingType, setNewSessionMeetingType] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [classStats, setClassStats] = useState({});
  const router = useRouter();

  // Fetch sessions for the selected class
  const fetchSessions = async (section_course_id) => {
    if (!section_course_id) return;
    try {
      const res = await apiClient.get(`/section-courses/${section_course_id}/sessions`);
      setSessions(Array.isArray(res) ? res : []);
      console.log('Fetched sessions:', res);
      
      // Fetch attendance statistics for each session
      await fetchSessionStats(section_course_id, res);
    } catch (err) {
      setSessions([]);
      console.log('Error fetching sessions:', err);
    }
  };

  // Fetch attendance statistics for all sessions
  const fetchSessionStats = async (section_course_id, sessionsList) => {
    if (!sessionsList || sessionsList.length === 0) return;
    
    try {
      const statsPromises = sessionsList.map(async (session) => {
        try {
          const attendanceRes = await apiClient.get(`/section-courses/${section_course_id}/sessions/${session.session_id}/attendance`);
          const attendanceData = Array.isArray(attendanceRes) ? attendanceRes : [];
          
          const stats = {
            present: 0,
            absent: 0,
            late: 0,
            excuse: 0,
            notMarked: 0,
            total: attendanceData.length
          };
          
          attendanceData.forEach(student => {
            const status = student.attendance_status || 'not-marked';
            switch (status) {
              case 'present':
                stats.present++;
                break;
              case 'absent':
                stats.absent++;
                break;
              case 'late':
                stats.late++;
                break;
              case 'excuse':
                stats.excuse++;
                break;
              default:
                stats.notMarked++;
                break;
            }
          });
          
          return { sessionId: session.session_id, stats };
        } catch (err) {
          console.log(`Error fetching stats for session ${session.session_id}:`, err);
          return { sessionId: session.session_id, stats: { present: 0, absent: 0, late: 0, excuse: 0, notMarked: 0, total: 0 } };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsObject = {};
      statsResults.forEach(({ sessionId, stats }) => {
        statsObject[sessionId] = stats;
      });
      
      setSessionStats(statsObject);
    } catch (err) {
      console.log('Error fetching session stats:', err);
    }
  };

  // When a class is selected, fetch students and sessions
  const handleClassSelect = async (cls) => {
    setSelectedClass(cls);
    setSelectedSession(null);
    setSearchQuery('');
    setShowSessionSearch(false);
    setSessionSearchQuery('');
    setCurrentView('classDetails');
    setLoading(true);
    try {
      const [studentsRes, sessionsRes] = await Promise.all([
        apiClient.get(`/section-courses/${cls.section_course_id}/students`),
        apiClient.get(`/section-courses/${cls.section_course_id}/sessions`)
      ]);
      setStudents(Array.isArray(studentsRes) ? studentsRes : []);
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
    } catch {
      setStudents([]);
      setSessions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    apiClient.get(`/syllabus/approved?facultyId=${currentUser.user_id}`)
      .then(async data => {
        const classes = Array.isArray(data) ? data : [];
        setApprovedClasses(classes);
        
        // Fetch student and session counts for all classes
        const stats = {};
        await Promise.all(classes.map(async (cls) => {
          if (cls.section_course_id) {
            try {
              const [studentsRes, sessionsRes] = await Promise.all([
                apiClient.get(`/section-courses/${cls.section_course_id}/students`),
                apiClient.get(`/section-courses/${cls.section_course_id}/sessions`)
              ]);
              
              stats[cls.section_course_id] = {
                studentCount: Array.isArray(studentsRes) ? studentsRes.length : 0,
                sessionCount: Array.isArray(sessionsRes) ? sessionsRes.length : 0
              };
            } catch (err) {
              console.log(`Error fetching stats for class ${cls.section_course_id}:`, err);
              stats[cls.section_course_id] = { studentCount: 0, sessionCount: 0 };
            }
          }
        }));
        
        setClassStats(stats);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error fetching approved classes:', err);
        setApprovedClasses([]);
        setLoading(false);
      });
  }, [currentUser]);

  useEffect(() => {
    const selectedClassId = params.selectedClassId;
    if (selectedClassId) {
      const foundClass = approvedClasses.find(cls => String(cls.section_course_id) === String(selectedClassId));
      if (foundClass) {
        setSelectedClass(foundClass);
        setCurrentView('classDetails');
      }
    }
  }, [params.selectedClassId, approvedClasses]);

  useEffect(() => {
    if (selectedClass && selectedClass.section_course_id) {
      fetchSessions(selectedClass.section_course_id);
    }
  }, [selectedClass]);

  // When a session is selected, fetch students with attendance status for that session
  useEffect(() => {
    if (currentView === 'sessionDetails' && selectedClass && selectedSession) {
      setLoading(true);
      apiClient.get(`/section-courses/${selectedClass.section_course_id}/sessions/${selectedSession.session_id}/attendance`)
        .then(res => setStudents(Array.isArray(res) ? res : []))
        .catch(() => setStudents([]))
        .finally(() => setLoading(false));
    }
  }, [currentView, selectedClass, selectedSession]);

  useEffect(() => {
    const { selectedClassId, selectedSessionId } = params;
    if (
      selectedClassId &&
      selectedSessionId &&
      approvedClasses.length > 0 &&
      sessions.length > 0
    ) {
      const foundClass = approvedClasses.find(
        (cls) => String(cls.section_course_id) === String(selectedClassId)
      );
      if (foundClass) {
        setSelectedClass(foundClass);
        const foundSession = sessions.find(
          (sess) => String(sess.session_id) === String(selectedSessionId)
        );
        if (foundSession) {
          setSelectedSession(foundSession);
          setCurrentView('sessionDetails');
        }
      }
    }
  }, [params.selectedClassId, params.selectedSessionId, approvedClasses, sessions]);

  // After useEffect for params and before return
  const { selectedClassId, selectedSessionId } = params;
  const navigatingToSessionDetails = !!(selectedClassId && selectedSessionId);
  if (navigatingToSessionDetails && (!selectedClass || !selectedSession || currentView !== 'sessionDetails')) {
    // Optionally, show a loading spinner here
    return null;
  }

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  if (isNavigatingAway) return null;

  const handleBackToClasses = () => {
    setCurrentView('classes');
    setSelectedClass(null);
    setSelectedSession(null);
    setSearchQuery('');
    setShowSessionSearch(false);
    setSessionSearchQuery('');
  };

  const handleBackToMyClasses = () => {
    setIsNavigatingAway(true);
    router.push('/users/faculty/MyClasses');
  };

  const handleBackNavigation = () => {
    if (currentView === 'sessionDetails') {
      handleBackToClassDetails();
    } else if (currentView === 'classDetails') {
      if (params.selectedClassId) {
        handleBackToMyClasses();
      } else {
        handleBackToClasses();
      }
    } else if (currentView === 'classes') {
      setIsNavigatingAway(true);
      router.push('/users/faculty/dashboard');
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
    setAttendanceStatus(student.attendance_status || 'present');
    setRemarks(student.remarks || '');
    if (!selectedSession && sessions && sessions.length === 1) {
      setSelectedSession(sessions[0]);
    }
    setShowAttendanceModal(true);
  };

  const handleSaveAttendance = async () => {
    if (!selectedStudent || !selectedSession) {
      Alert.alert('Error', 'No student or session selected');
      return;
    }
    
    console.log('--- Attendance Update Request ---');
    console.log('Selected Student:', selectedStudent);
    console.log('Selected Session:', selectedSession);
    console.log('Selected Class:', selectedClass);
    console.log('Attendance Status:', attendanceStatus);
    console.log('Remarks:', remarks);
    
    try {
      const url = `/section-courses/${selectedClass.section_course_id}/sessions/${selectedSession.session_id}/attendance/${selectedStudent.enrollment_id}`;
      const payload = {
        status: attendanceStatus,
        remarks: remarks,
      };
      
      console.log('Making PUT request to:', url);
      console.log('With payload:', payload);
      
      const res = await apiClient.put(url, payload);
      
      console.log('Attendance update response:', res);
      
      // Optionally update local state here to reflect the change
      Alert.alert('Success', `Attendance marked as ${attendanceStatus} for ${selectedStudent.full_name}`);
      setShowAttendanceModal(false);
      setAttendanceStatus('present');
      setSelectedStudent(null);
      
      // Refresh session statistics to reflect the updated attendance
      if (selectedClass && selectedClass.section_course_id) {
        await fetchSessionStats(selectedClass.section_course_id, sessions);
      }
      
      // Refresh the student list to show updated attendance status
      if (currentView === 'sessionDetails' && selectedClass && selectedSession) {
        try {
          const updatedStudents = await apiClient.get(`/section-courses/${selectedClass.section_course_id}/sessions/${selectedSession.session_id}/attendance`);
          setStudents(Array.isArray(updatedStudents) ? updatedStudents : []);
        } catch (err) {
          console.error('Error refreshing student list:', err);
        }
      }
    } catch (err) {
      console.error('Attendance update error:', err);
      console.error('Error details:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const handleCreateNewAttendance = () => {
    router.push({
      pathname: '/users/faculty/SlideshowPage',
      params: {
        students: JSON.stringify(students),
        initialIndex: 0,
        selectedClassId: selectedClass?.section_course_id,
        selectedSessionId: selectedSession?.session_id,
      }
    });
  };

  const handleCreateNewSession = () => {
    setShowNewSessionModal(true);
    setNewSessionTitle('');
    setNewSessionDate('');
    setNewSessionType('Lecture');
    setNewSessionMeetingType('');
  };

  const handleSaveNewSession = async () => {
    if (!newSessionTitle.trim() || !newSessionDate.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      const payload = {
        title: newSessionTitle,
        date: newSessionDate,
        session_type: newSessionType,
        meeting_type: newSessionMeetingType,
      };
      console.log('Creating session with payload:', payload);
      const res = await apiClient.post(`/section-courses/${selectedClass.section_course_id}/sessions`, payload);
      console.log('Session creation response:', res);
      await fetchSessions(selectedClass.section_course_id);
      
      // Update classStats to reflect the new session
      setClassStats(prevStats => ({
        ...prevStats,
        [selectedClass.section_course_id]: {
          ...prevStats[selectedClass.section_course_id],
          sessionCount: (prevStats[selectedClass.section_course_id]?.sessionCount || 0) + 1
        }
      }));
      
      Alert.alert('Success', `New session "${newSessionTitle}" created for ${newSessionDate}`);
      setShowNewSessionModal(false);
      setNewSessionTitle('');
      setNewSessionDate('');
      setNewSessionType('Lecture');
      setNewSessionMeetingType('');
    } catch (err) {
      console.log('Session creation error:', err);
      Alert.alert('Error', 'Failed to create session');
    }
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

  // Filter by search
  const filteredClasses = approvedClasses.filter(cls =>
    (cls.course_title || '').toLowerCase().includes(classSearchQuery.toLowerCase()) ||
    (cls.course_code || '').toLowerCase().includes(classSearchQuery.toLowerCase())
  );

  // Use sessions state for filteredSessions
  const filteredSessions = (sessions || []).filter(session =>
    (session.title || '').toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
    (session.session_type || '').toLowerCase().includes(sessionSearchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.session_date) - new Date(a.session_date));

  // filteredStudents already uses students, which is always an array
  const filteredStudents = (students || []).filter(student =>
    (student.name || student.full_name || '').toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    (student.studentId || student.student_number || '').toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'present': return '#10B981';
      case 'absent': return '#EF4444';
      case 'late': return '#F59E0B';
      case 'excuse': return '#6366F1';
      case 'not-marked': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getAttendanceText = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'excuse': return 'Excuse';
      case 'not-marked': return 'Not Marked';
      default: return 'Not Marked';
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

  const renderClassCard = (cls) => {
    // Get student count and session count for this class from classStats
    const stats = classStats[cls.section_course_id] || { studentCount: 0, sessionCount: 0 };
    
    return (
      <TouchableOpacity
        key={cls.id || cls.section_course_id}
        style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#eee',
        }}
        onPress={() => handleClassSelect(cls)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#DC2626' }}>
            {cls.course_code && cls.section_code ? `${cls.course_code} - ${cls.section_code}` : '-'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Ionicons name="people-outline" size={16} color="#DC2626" />
            <Text style={{ color: '#222', marginLeft: 4, fontSize: 13 }}>{stats.studentCount} students</Text>
          </View>
        </View>
        <Text style={{ color: '#888', marginTop: 8, fontSize: 13 }}>
          {stats.sessionCount} sessions
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSessionCard = (session) => {
    const stats = sessionStats[session.session_id] || { present: 0, absent: 0, late: 0, excuse: 0, notMarked: 0, total: 0 };
    
    return (
      <TouchableOpacity
        key={session.session_id}
        style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#eee',
        }}
        onPress={() => handleSessionSelect(session)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#222' }}>{session.title}</Text>
            <Text style={{ color: '#888', marginTop: 2 }}>{session.session_type} {session.meeting_type ? `| ${session.meeting_type}` : ''}</Text>
          </View>
          <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 15 }}>{formatDate(session.session_date)}</Text>
        </View>
        
        {/* Attendance Statistics */}
        <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 4 }} />
            <Text style={{ fontSize: 12, color: '#666' }}>Present: {stats.present}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 4 }} />
            <Text style={{ fontSize: 12, color: '#666' }}>Absent: {stats.absent}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginRight: 4 }} />
            <Text style={{ fontSize: 12, color: '#666' }}>Late: {stats.late}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1', marginRight: 4 }} />
            <Text style={{ fontSize: 12, color: '#666' }}>Excuse: {stats.excuse}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStudentAttendanceRow = (student) => {
    const attendanceStatus = student.attendance_status || 'not-marked';
    const statusColor = getAttendanceColor(attendanceStatus);
    
    return (
      <TouchableOpacity
        key={student.student_id}
        style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#eee',
        }}
        activeOpacity={0.7}
        onPress={() => {
          // Always allow opening the modal for editing attendance
          if (!selectedSession && sessions && sessions.length === 1) {
            setSelectedSession(sessions[0]);
          }
          setSelectedStudent(student);
          setAttendanceStatus(attendanceStatus);
          setRemarks(student.remarks || '');
          setShowAttendanceModal(true);
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {/* Student Photo */}
            <View style={styles.studentPhotoContainer}>
              {student.student_photo ? (
                <Image 
                  source={{ uri: `${getAPIBaseURL().replace('/api', '')}${student.student_photo}` }} 
                  style={styles.studentPhoto}
                  onError={(error) => console.log('Student photo load error:', error)}
                />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Ionicons name="person" size={20} color="#9CA3AF" />
                </View>
              )}
            </View>
            
            {/* Student Info */}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>{student.full_name}</Text>
              <Text style={{ color: '#666', fontSize: 14, marginTop: 2 }}>{student.student_number}</Text>
            </View>
          </View>
          
          {/* Attendance Status */}
          <View style={{
            backgroundColor: statusColor + '20', // 20% opacity background
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: statusColor,
            minWidth: 80,
            alignItems: 'center'
          }}>
            <Text style={{ 
              color: statusColor, 
              fontWeight: '600', 
              fontSize: 12,
              textTransform: 'uppercase'
            }}>
              {getAttendanceText(attendanceStatus)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStudentAttendanceTable = () => (
    <View style={styles.studentTableContainer}>
      <View style={styles.studentTableHeader}>
        <Text style={styles.studentTableHeaderCell}>Student Name</Text>
        <Text style={styles.studentTableHeaderCell}>Student ID</Text>
        <Text style={styles.studentTableHeaderCell}>Status</Text>
      </View>
      {filteredStudents.map((student) => {
        const status = (student.attendance_status || 'not-marked');
        let displayStatus = '';
        switch (status) {
          case 'present':
            displayStatus = 'Present';
            break;
          case 'absent':
            displayStatus = 'Absent';
            break;
          case 'late':
            displayStatus = 'Late';
            break;
          case 'excuse':
            displayStatus = 'Excuse';
            break;
          default:
            displayStatus = 'Not Marked';
        }
        return (
          <View key={student.enrollment_id || student.id} style={styles.studentTableRow}>
            <Text style={styles.studentTableCell}>{student.full_name || student.name}</Text>
            <Text style={styles.studentTableCell}>{student.student_number || student.studentId}</Text>
            <Text style={styles.studentTableCell}>{displayStatus}</Text>
          </View>
        );
      })}
    </View>
  );

  const screenWidth = Dimensions.get('window').width;
  const CARD_WIDTH = 200;
  const CARD_MARGIN = 24; // 12px on each side
  const TOTAL_CARD_WIDTH = CARD_WIDTH + CARD_MARGIN;

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
              {loading ? (
                <Text>Loading classes...</Text>
              ) : (filteredClasses || []).length === 0 ? (
                <Text>No approved classes found.</Text>
              ) : (
                filteredClasses.map(renderClassCard)
              )}
            </View>
          </View>
        )}

        {currentView === 'classDetails' && (
          /* Class Details View */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessions</Text>
            
            <View style={styles.sessionsContainer}>
              {loading ? (
                <Text>Loading sessions...</Text>
              ) : (filteredSessions || []).length === 0 ? (
                <Text>No sessions found for this class.</Text>
              ) : (
                filteredSessions.map(renderSessionCard)
              )}
            </View>
          </View>
        )}

        {currentView === 'sessionDetails' && (
          /* Session Details View */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Students</Text>

            {/* Student Name Carousel */}
            {/* End Student Name Carousel */}
            
            {studentViewMode === 'card' ? (
              <ScrollView
                style={styles.studentsList}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {loading ? (
                  <Text>Loading students...</Text>
                ) : (filteredStudents || []).length === 0 ? (
                  <Text>No students found for this session.</Text>
                ) : (
                  filteredStudents.map(renderStudentAttendanceRow)
                )}
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.studentsList}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {loading ? (
                  <Text>Loading students...</Text>
                ) : (filteredStudents || []).length === 0 ? (
                  <Text>No students found for this session.</Text>
                ) : (
                  renderStudentAttendanceTable()
                )}
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

                <TouchableOpacity 
                  style={[styles.attendanceOption, attendanceStatus === 'excuse' && styles.attendanceOptionSelected]}
                  onPress={() => setAttendanceStatus('excuse')}
                >
                  <Ionicons name="help-circle" size={24} color={attendanceStatus === 'excuse' ? '#6366F1' : '#6B7280'} />
                  <Text style={[styles.attendanceOptionText, attendanceStatus === 'excuse' && styles.attendanceOptionTextSelected]}>
                    Excuse
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Remarks Textbox */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.remarksLabel}>Remarks</Text>
                <TextInput
                  style={styles.remarksInput}
                  placeholder="Enter remarks (optional)"
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={3}
                />
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
                <TouchableOpacity
                  onPress={() => setShowNewSessionDatePicker(true)}
                  style={styles.inputField}
                >
                  <Text style={{ color: newSessionDate ? '#222' : '#888' }}>{newSessionDate || 'Select Date'}</Text>
                </TouchableOpacity>
                {showNewSessionDatePicker && (
                  <DateTimePicker
                    value={newSessionDate ? new Date(newSessionDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowNewSessionDatePicker(false);
                      if (selectedDate) {
                        const iso = selectedDate.toISOString();
                        setNewSessionDate(iso.slice(0, 10));
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Session Type</Text>
                <TextInput
                  style={styles.inputField}
                  value={newSessionType}
                  onChangeText={setNewSessionType}
                  placeholder="Session Type (e.g., Lecture, Lab)"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Meeting Type</Text>
                <TextInput
                  style={styles.inputField}
                  value={newSessionMeetingType}
                  onChangeText={setNewSessionMeetingType}
                  placeholder="Meeting Type (e.g., Face-to-Face, Online, Hybrid)"
                />
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
                <Text style={styles.saveButtonText}>Add</Text>
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
    // maxHeight: 300, // Removed as per edit hint
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
  slideshowModalStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
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
  studentSlideStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
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
  studentAttendanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attendanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  remarksText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  slideshowModalStudentId: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 0,
  },
  studentPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  studentPhotoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
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
}); 